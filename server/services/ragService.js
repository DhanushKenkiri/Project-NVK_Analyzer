// server/services/ragService.js
const axios = require('axios');

class RAGService {
    constructor() {
        this.baseUrl = process.env.RAG_SERVICE_URL || 'http://rag-service:5000';
    }

    /**
     * Index a document in the RAG service
     * @param {string} text - The text to index
     * @param {object} metadata - Optional metadata for the document
     * @returns {Promise<object>} - The indexing results
     */
    async indexDocument(text, metadata = {}) {
        try {
            const response = await axios.post(`${this.baseUrl}/index`, {
                text,
                metadata
            });
            return response.data;
        } catch (error) {
            console.error('RAG service indexing error:', error.response?.data || error.message);
            throw new Error('Failed to index document in RAG service: ' + (error.response?.data?.detail || error.message));
        }
    }

    /**
     * Query the RAG service for relevant documents
     * @param {string} text - The query text
     * @param {number} k - Number of results to return
     * @param {boolean} useHybrid - Whether to use hybrid search
     * @returns {Promise<object>} - The query results
     */
    async queryRAG(text, k = 5, useHybrid = true) {
        try {
            const response = await axios.post(`${this.baseUrl}/query`, {
                text,
                k,
                use_hybrid: useHybrid
            });
            return response.data;
        } catch (error) {
            console.error('RAG service query error:', error.response?.data || error.message);
            throw new Error('Failed to query RAG service: ' + (error.response?.data?.detail || error.message));
        }
    }

    /**
     * Perform a full RAG analysis of a document
     * @param {string} text - The text to analyze
     * @returns {Promise<object>} - The analysis results
     */
    async analyzeDocument(text) {
        try {
            const response = await axios.post(`${this.baseUrl}/analyze`, {
                text
            });
            return response.data;
        } catch (error) {
            console.error('RAG service analysis error:', error.response?.data || error.message);
            throw new Error('Failed to analyze document with RAG service: ' + (error.response?.data?.detail || error.message));
        }
    }

    /**
     * Check if the RAG service is running
     * @returns {Promise<boolean>} - Whether the service is available
     */
    async isServiceAvailable() {
        try {
            const response = await axios.get(`${this.baseUrl}/health`, { timeout: 2000 });
            return response.data.status === 'ok';
        } catch (error) {
            console.error('RAG service health check failed:', error.message);
            return false;
        }
    }
}

module.exports = new RAGService();s