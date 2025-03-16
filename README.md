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
