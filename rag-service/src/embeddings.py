from sentence_transformers import SentenceTransformer

class Embeddings:
    def __init__(self):
        self.model = SentenceTransformer('all-MiniLM-L6-v2')

    def encode(self, text):
        return self.model.encode(text)