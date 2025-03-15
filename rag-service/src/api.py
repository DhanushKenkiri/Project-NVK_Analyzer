from fastapi import FastAPI, HTTPException
from pathway_pipeline import PathwayTextPipeline
from embeddings import Embeddings
from vector_store import VectorStore

app = FastAPI()
pipeline = PathwayTextPipeline()
embeddings = Embeddings()
vector_store = VectorStore(dimension=384)

@app.post("/query")
async def query(text: str):
    try:
        processed_text = pipeline.process(text)
        vector = embeddings.encode(processed_text)
        results = vector_store.search(vector)
        return {"results": results.tolist()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))