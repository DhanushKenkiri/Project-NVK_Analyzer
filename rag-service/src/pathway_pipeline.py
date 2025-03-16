# rag-service/src/pathway_pipeline.py
import pathway as pw
from pathway.stdlib.ml.index import Embeddings
import os
import json
from datetime import datetime

class PathwayTextPipeline:
    def __init__(self):
        # Initialize the pipeline
        self.embeddings = Embeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        self.index_path = "./data/vector_index"
        os.makedirs(os.path.dirname(self.index_path), exist_ok=True)
        
        # Setup the pipeline
        self._setup_pipeline()
        
    def _setup_pipeline(self):
        # Define the schema for documents
        class InputSchema(pw.Schema):
            doc_id: str
            text: str
            metadata: dict
            timestamp: float
        
        # Create a connector for real-time data
        input_stream = pw.io.fs.read(
            "./data/input",
            format="json",
            schema=InputSchema,
            mode="streaming"
        )
        
        # Process the input stream
        documents = input_stream.select(
            doc_id=input_stream.doc_id,
            text=input_stream.text,
            metadata=input_stream.metadata,
            timestamp=input_stream.timestamp,
            embedding=self.embeddings.embed(input_stream.text)
        )
        
        # Create hybrid index (semantic + BM25)
        self.index = pw.io.redis.index_embeddings(
            documents,
            embedding=documents.embedding,
            metadata={
                "doc_id": documents.doc_id,
                "text": documents.text,
                "metadata": documents.metadata,
                "timestamp": documents.timestamp
            },
            index_name="documents",
            host="localhost",
            port=6379
        )
        
        # Run the pipeline in the background
        pw.run()
        
    def process(self, text):
        """Process a document for indexing"""
        doc_id = f"doc_{datetime.now().timestamp()}"
        
        # Write to input directory for streaming ingestion
        with open(f"./data/input/{doc_id}.json", "w") as f:
            json.dump({
                "doc_id": doc_id,
                "text": text,
                "metadata": {"source": "user_upload"},
                "timestamp": datetime.now().timestamp()
            }, f)
        
        return doc_id
        
    def query(self, query_text, k=5):
        """Query the index for relevant documents"""
        # Get embeddings for the query
        query_embedding = self.embeddings.model.encode(query_text)
        
        # Hybrid search - combine semantic search with BM25
        results = []
        
        try:
            # Connect to Redis for retrieval
            import redis
            r = redis.Redis(host="localhost", port=6379)
            
            # Semantic search
            semantic_results = r.ft.search(
                "documents", 
                f"*=>[KNN {k} @embedding $embedding AS score]", 
                {"embedding": query_embedding.tobytes()}
            )
            
            # BM25 search
            keyword_results = r.ft.search(
                "documents",
                f"{query_text}",
                {"limit": k}
            )
            
            # Combine results
            seen_docs = set()
            
            # Add semantic results
            for doc in semantic_results.docs:
                doc_data = json.loads(doc.json)
                if doc_data["doc_id"] not in seen_docs:
                    results.append({
                        "doc_id": doc_data["doc_id"],
                        "text": doc_data["text"],
                        "metadata": doc_data["metadata"],
                        "score": float(doc.score),
                        "source": "semantic"
                    })
                    seen_docs.add(doc_data["doc_id"])
            
            # Add keyword results
            for doc in keyword_results.docs:
                doc_data = json.loads(doc.json)
                if doc_data["doc_id"] not in seen_docs:
                    results.append({
                        "doc_id": doc_data["doc_id"],
                        "text": doc_data["text"],
                        "metadata": doc_data["metadata"],
                        "score": float(doc.score) if hasattr(doc, "score") else 0.5,
                        "source": "bm25"
                    })
                    seen_docs.add(doc_data["doc_id"])
            
            # Sort by score
            results.sort(key=lambda x: x["score"], reverse=True)
            return results[:k]
            
        except Exception as e:
            print(f"Error querying index: {e}")
            return []