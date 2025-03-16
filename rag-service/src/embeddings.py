# rag-service/src/embeddings.py
from sentence_transformers import SentenceTransformer
import numpy as np
from typing import Union, List

class Embeddings:
    def __init__(self, model_name="all-MiniLM-L6-v2"):
        """Initialize the embeddings model"""
        self.model = SentenceTransformer(model_name)
        self.dimension = self.model.get_sentence_embedding_dimension()
        print(f"Loaded embedding model with dimension {self.dimension}")

    def encode(self, text: Union[str, List[str]]) -> np.ndarray:
        """
        Encode text into embeddings
        
        Args:
            text: String or list of strings to encode
            
        Returns:
            numpy array of embeddings
        """
        # Handle empty input
        if not text:
            if isinstance(text, str):
                return np.zeros(self.dimension)
            else:
                return np.zeros((len(text), self.dimension))
        
        # Encode text
        embeddings = self.model.encode(text, show_progress_bar=False)
        return embeddings
        
    def similarity(self, text1: str, text2: str) -> float:
        """Calculate cosine similarity between two texts"""
        emb1 = self.encode(text1)
        emb2 = self.encode(text2)
        
        # Normalize vectors
        emb1 = emb1 / np.linalg.norm(emb1)
        emb2 = emb2 / np.linalg.norm(emb2)
        
        # Calculate cosine similarity
        return float(np.dot(emb1, emb2))