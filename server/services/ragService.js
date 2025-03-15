// server/services/ragService.js
const axios = require('axios');

class RAGService {
    async queryRAG(text) {
        try {
            const response = await axios.post('http://rag-service:5000/query', {
                text: text
            });
            return response.data;
        } catch (error) {
            throw new Error('Failed to query RAG service: ' + error.message);
        }
    }
}

module.exports = new RAGService();