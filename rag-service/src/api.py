# rag-service/src/api.py
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
import json

from pathway_pipeline import PathwayTextPipeline
from embeddings import Embeddings
from vector_store import VectorStore

# Initialize FastAPI app
app = FastAPI(
    title="Project NVK RAG API",
    description="Retrieval Augmented Generation API for document analysis",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create data directories
os.makedirs("./data/input", exist_ok=True)

# Initialize services
pipeline = PathwayTextPipeline()
embeddings = Embeddings()
vector_store = VectorStore(dimension=384)

# Define models
class QueryRequest(BaseModel):
    text: str
    k: int = 5
    use_hybrid: bool = True

class DocumentRequest(BaseModel):
    text: str
    metadata: Optional[Dict[str, Any]] = None
    
class QueryResponse(BaseModel):
    results: List[Dict[str, Any]]
    query_embedding: List[float]
    
# API endpoints
@app.post("/query", response_model=QueryResponse)
async def query(request: QueryRequest):
    """Query for relevant documents"""
    try:
        query_text = request.text
        
        # Get embeddings for query
        query_vector = embeddings.encode(query_text)
        
        # Get relevant documents
        results = vector_store.search(
            query_vector, 
            k=request.k,
            hybrid=request.use_hybrid
        )
        
        return {
            "results": results,
            "query_embedding": query_vector.tolist()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/index")
async def index_document(document: DocumentRequest):
    """Add a document to the index"""
    try:
        text = document.text
        metadata = document.metadata or {}
        
        # Process document through pipeline
        doc_id = pipeline.process(text)
        
        # Embed document
        embedding = embeddings.encode(text)
        
        # Add to vector store
        vector_store.add_document(
            doc_id=doc_id,
            vector=embedding,
            text=text,
            metadata=metadata
        )
        
        return {"status": "success", "doc_id": doc_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze")
async def analyze_document(request: Dict[str, Any] = Body(...)):
    """Full RAG analysis of a document"""
    try:
        text = request.get("text", "")
        if not text:
            raise HTTPException(status_code=400, detail="No text provided")
            
        # 1. Index the document
        doc_id = pipeline.process(text)
        
        # 2. Find relevant context
        query_vector = embeddings.encode(text)
        context_docs = vector_store.search(query_vector, k=3)
        
        # 3. Generate augmented response using Gemini API
        # (Integration with Gemini happens in the server)
        
        return {
            "doc_id": doc_id,
            "context": context_docs,
            "original_text": text
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "rag-api"}

# Run the app with uvicorn
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)