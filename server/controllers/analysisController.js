const GeminiService = require('../services/geminiService');
const RAGService = require('../services/ragService');
const ResponseFormatter = require('../utils/responseFormatter');

class AnalysisController {
    async analyzeText(req, res) {
        try {
            const { text, useRAG } = req.body;
            if (!text) {
                console.error('No text provided for analysis.');
                return res.status(400).json(ResponseFormatter.formatError('No text provided.'));
            }

            console.log('Analyzing text...');
            let analysisResult;
            if (useRAG) {
                console.log('Using RAG for analysis...');
                analysisResult = await RAGService.queryRAG(text);
            } else {
                console.log('Using Gemini for analysis...');
                analysisResult = await GeminiService.analyzeText(text);
            }

            console.log('Analysis completed successfully.');
            res.json(ResponseFormatter.formatSuccess(analysisResult, 'Text analyzed successfully'));
        } catch (error) {
            console.error('Error analyzing text:', error);
            res.status(500).json(ResponseFormatter.formatError('Failed to analyze text', error));
        }
    }
}

module.exports = new AnalysisController();