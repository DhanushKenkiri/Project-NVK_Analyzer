# rag-service/src/realtime_pipeline.py
import pathway as pw
from pathway.stdlib.ml.index import KNNIndex
from typing import Dict, List, Any
import uuid
import time
import json
import os

class RealtimeRAGPipeline:
    def __init__(self, embeddings_model, index_path=None):
        """
        Initialize the real-time RAG pipeline using Pathway.
        
        Args:
            embeddings_model: The embeddings model to use
            index_path: Optional path to load/save the index
        """
        self.embeddings_model = embeddings_model
        self.index_path = index_path
        self.document_table = None
        self.index = None
        self._setup_pipeline()
        
    def _setup_pipeline(self):
        """Sets up the Pathway data processing pipeline"""
        # Document table schema
        schema = pw.schema.Schema(
            id=str,
            content=str,
            metadata=Dict[str, Any],
            embedding=List[float],
            timestamp=float
        )
        
        # Create an empty table for documents
        self.document_table = pw.Table.empty(schema)
        
        # Process incoming documents
        processed_docs = self.document_table.select(
            id=pw.this.id,
            content=pw.this.content,
            metadata=pw.this.metadata,
            embedding=pw.apply(self._embed_text, pw.this.content),
            timestamp=pw.this.timestamp
        )
        
        # Create hybrid search index (BM25 + KNN)
        self.index = KNNIndex(
            processed_docs.select(
                id=pw.this.id,
                embedding=pw.this.embedding,
                content=pw.this.content,
                metadata=pw.this.metadata
            ),
            vector_column="embedding",
            text_column="content",
            metadata_columns=["metadata"],
            distance="cosine"
        )
        
        # Setup continuous updates pipeline
        @pw.udf
        def log_update(doc_id, content):
            print(f"Indexed document: {doc_id[:8]}... ({len(content)} chars)")
            return True
            
        processed_docs.select(
            updated=pw.apply(log_update, pw.this.id, pw.this.content)
        )
        
        # Save index periodically if path is specified
        if self.index_path:
            @pw.udf
            def save_index():
                self.index.persist(self.index_path)
                print(f"Index saved to {self.index_path}")
                return True
                
            pw.io.timer(interval_seconds=300).select(
                saved=pw.apply(save_index)
            )
        
    def _embed_text(self, text):
        """Convert text to embedding vector"""
        return self.embeddings_model.encode(text).tolist()
        
    def add_document(self, content, metadata=None):
        """
        Add a document to the pipeline for processing.
        
        Args:
            content: The document text
            metadata: Optional metadata dictionary
        
        Returns:
            document_id: The ID of the added document
        """
        doc_id = str(uuid.uuid4())
        
        # Add to pipeline
        self.document_table.append({
            "id": doc_id,
            "content": content,
            "metadata": metadata or {},
            "embedding": [],  # Will be computed in the pipeline
            "timestamp": time.time()
        })
        
        return doc_id
        
    def query(self, query_text, k=5, use_hybrid=True):
        """
        Query the index for relevant documents.
        
        Args:
            query_text: The query text
            k: Number of results to return
            use_hybrid: Whether to use hybrid search
            
        Returns:
            List of retrieved documents with scores
        """
        query_embedding = self.embeddings_model.encode(query_text)
        
        if use_hybrid:
            # Hybrid search (BM25 + vector)
            results = self.index.hybrid_search(
                query_text=query_text,
                query_vector=query_embedding.tolist(),
                k=k,
                alpha=0.7  # Weight between BM25 and vector (0 = BM25 only, 1 = vector only)
            )
        else:
            # Vector-only search
            results = self.index.vector_search(
                query_embedding.tolist(),
                k=k
            )
            
        # Format results
        formatted_results = []
        for item in results:
            formatted_results.append({
                "id": item["id"],
                "content": item["content"],
                "metadata": item["metadata"],
                "score": float(item["_score"])
            })
            
        return formatted_results
        
    def load_documents_from_directory(self, directory_path, file_extensions=None):
        """
        Load documents from a directory for batch processing.
        
        Args:
            directory_path: Path to directory containing documents
            file_extensions: List of file extensions to include, e.g. ['.txt', '.md']
            
        Returns:
            count: Number of documents loaded
        """
        count = 0
        for root, _, files in os.walk(directory_path):
            for file in files:
                if file_extensions and not any(file.endswith(ext) for ext in file_extensions):
                    continue
                    
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Extract relative path for metadata
                    rel_path = os.path.relpath(file_path, directory_path)
                    
                    # Add document to pipeline
                    self.add_document(
                        content=content,
                        metadata={
                            "source": rel_path,
                            "filename": file,
                            "imported_at": time.time()
                        }
                    )
                    count += 1
                except Exception as e:
                    print(f"Error loading {file_path}: {str(e)}")
                    
        return count