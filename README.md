# Project NVK Analyzer

This project is a contract analysis tool that uses local OCR, Gemini API, and RAG for text extraction and analysis.

## Setup

1. Clone the repository.
2. Run `npm install` in both `client` and `server` directories.
3. Create a `.env` file based on `.env.example`.
4. Run `docker-compose up` to start the services.

## Deployment

To deploy to Azure, run `./scripts/deploy-azure.sh`.