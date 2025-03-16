# rag-service/src/vector_store.py
import faiss
import numpy as np
import os
import pickle
from typing import List, Dict, Any

class VectorStore:
    def __init__(self, dimension=384):
        """Initialize vector store with FAISS index"""
        self.dimension = dimension
        self.index = faiss.IndexFlatL2(dimension)  # Base L2 distance index
        
        # Create hybrid index for better retrieval
        # HNSW is faster for large datasets but requires more memory
        self.hybrid_index = faiss.IndexHNSWFlat(dimension, 32)  # 32 is the number of neighbors
        
        # Metadata storage
        self.metadata = {}
        self.doc_texts = {}
        
        # Load index if exists
        self._load_index()
    
    def _save_index(self):
        """Save index to disk"""
        os.makedirs("./data", exist_ok=True)
        
        # Save FAISS index
        faiss.write_index(self.index, "./data/faiss_index.bin")
        faiss.write_index(self.hybrid_index, "./data/hybrid_index.bin")
        
        # Save metadata
        with open("./data/metadata.pkl", "wb") as f:
            pickle.dump({"metadata": self.metadata, "doc_texts": self.doc_texts}, f)
    
    def _load_index(self):
        """Load index from disk if it exists"""
        try:
            if os.path.exists("./data/faiss_index.bin"):
                self.index = faiss.read_index("./data/faiss_index.bin")
                self.hybrid_index = faiss.read_index("./data/hybrid_index.bin")
                
                with open("./data/metadata.pkl", "rb") as f:
                    data = pickle.load(f)
                    self.metadata = data["metadata"]
                    self.doc_texts = data["doc_texts"]
                print("Loaded existing vector store")
            else:
                print("No existing vector store found, creating new one")
        except Exception as e:
            print(f"Error loading index: {e}")
    
    def add_vectors(self, vectors: np.ndarray, doc_ids: List[str], texts: List[str], metadata_list: List[Dict[str, Any]]):
        """Add vectors to the index with their associated metadata"""
        if len(vectors) == 0:
            return
            
        # Convert to numpy array if not already
        vectors_np = np.array(vectors).astype('float32')
        
        # Add to both indices
        self.index.add(vectors_np)
        self.hybrid_index.add(vectors_np)
        
        # Store metadata
        for i, doc_id in enumerate(doc_ids):
            self.metadata[doc_id] = metadata_list[i]
            self.doc_texts[doc_id] = texts[i]
        
        # Save updated index
        self._save_index()
    
    def add_document(self, doc_id: str, vector: np.ndarray, text: str, metadata: Dict[str, Any]):
        """Add a single document to the index"""
        self.add_vectors(
            vectors=[vector],
            doc_ids=[doc_id],
            texts=[text],
            metadata_list=[metadata]
        )
    
    def search(self, query_vector: np.ndarray, k: int = 5, hybrid: bool = True):
        """
        Search for similar vectors
        If hybrid=True, use the HNSW index which is faster but approximate
        """
        query_vector = query_vector.reshape(1, -1).astype('float32')
        
        # Use appropriate index based on hybrid flag
        index_to_use = self.hybrid_index if hybrid else self.index
        
        # Search
        distances, indices = index_to_use.search(query_vector, k)
        
        # Get results with metadata
        results = []
        for i, idx in enumerate(indices[0]):
            if idx < 0 or idx >= self.index.ntotal:  # Invalid index
                continue
                
            # Find which document this is
            distance = distances[0][i]
            
            # Create result object 
            doc_id = list(self.metadata.keys())[idx]
            result = {
                "id": doc_id,
                "distance": float(distance),
                "text": self.doc_texts.get(doc_id, ""),
                "metadata": self.metadata.get(doc_id, {})
            }
            results.append(result)
            
        return results
        
    def get_document(self, doc_id: str):
        """Retrieve a document by ID"""
        if doc_id in self.metadata:
            return {
                "id": doc_id,
                "text": self.doc_texts.get(doc_id, ""),
                "metadata": self.metadata.get(doc_id, {})
            }
        return None