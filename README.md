# Project NVK Analyzer

This project is a contract analysis tool that uses local OCR, Gemini API, and RAG for text extraction and analysis. It includes real-time data ingestion and indexing using Pathway, hybrid retrieval (BM25 + semantic search), and a well-structured RAG pipeline.

## Features
- Real-time data ingestion and indexing using Pathway
- Hybrid retrieval (BM25 + semantic search)
- Well-structured RAG pipeline
- REST API with Dockerized setup
- Simple UI for user interactions and real-time data visualization
- Optional agentic integration (LangGraph, Crew AI)

## Setup

1. Clone the repository.
2. Run `npm install` in both `client` and `server` directories.
3. Create a `.env` file based on `.env.example`.
4. Run `docker-compose up` to start the services.

## Deployment

To deploy to Azure, run `./scripts/deploy-azure.sh`.

## REST API

The REST API provides endpoints for retrieving data.

### Retrieve Data

```
POST /api/retrieve
```

**Request Body**:
```json
{
  "query": "your_query"
}
```

**Response**:
```json
{
  "results": "your_results"
}
```

## UI

The UI provides a user-friendly interface for interacting with the system and visualizing data in real-time.

### Usage
1. Navigate to the `client` directory.
2. Run `npm start` to start the development server.
3. Access the UI in the browser at `http://localhost:3000`.

## Agentic Integration

Optional integration with LangGraph or Crew AI can be added to automate retrieval and validation, enhancing system intelligence and stability.

### Usage
1. Implement the integration logic in `rag-service/agentic_integration.py`.
2. Use the integration to enhance retrieval processes.