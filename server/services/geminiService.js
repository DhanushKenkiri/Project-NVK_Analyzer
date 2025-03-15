// server/services/geminiService.js
const axios = require('axios');

class GeminiService {
    async analyzeText(text) {
        try {
            const response = await axios.post('https://api.gemini.com/v1/analyze', {
                text: text,
                apiKey: process.env.GEMINI_API_KEY
            });
            return response.data;
        } catch (error) {
            throw new Error('Failed to analyze text with Gemini: ' + error.message);
        }
    }
}

module.exports = new GeminiService();