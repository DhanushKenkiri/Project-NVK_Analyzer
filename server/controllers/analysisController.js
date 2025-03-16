// server/controllers/analysisController.js
const GeminiService = require('../services/geminiService');
const RAGService = require('../services/ragService');
const ResponseFormatter = require('../utils/responseFormatter');

class AnalysisController {
    /**
     * Analyze text using Gemini API with optional RAG enhancement
     * @param {object} req - The request object
     * @param {object} res - The response object
     * @returns {Promise<void>}
     */
    async analyzeText(req, res) {
        try {
            const { text, useRAG = false } = req.body;
            
            if (!text) {
                console.error('No text provided for analysis.');
                return res.status(400).json(ResponseFormatter.formatError('No text provided.'));
            }

            console.log(`Analyzing text (RAG: ${useRAG ? 'enabled' : 'disabled'})...`);
            
            // Track analysis start time
            const startTime = Date.now();
            
            let analysisResult;
            let context = [];
            
            // Index the document in RAG service regardless of whether RAG is used
            // This helps build the knowledge base for future queries
            try {
                const indexResult = await RAGService.indexDocument(text, {
                    timestamp: new Date().toISOString(),
                    source: 'user_upload'
                });
                console.log('Document indexed in RAG service:', indexResult);
            } catch (error) {
                console.warn('Failed to index document in RAG, continuing with analysis:', error.message);
            }
            
            if (useRAG) {
                console.log('Using RAG for analysis...');
                
                // Check if RAG service is available
                const isRAGAvailable = await RAGService.isServiceAvailable();
                if (!isRAGAvailable) {
                    console.warn('RAG service not available, falling back to standard analysis.');
                    analysisResult = await GeminiService.analyzeText(text);
                } else {
                    // Get context documents from RAG service
                    const ragQueryResult = await RAGService.queryRAG(text);
                    context = ragQueryResult.results || [];
                    
                    // Analyze with RAG context
                    analysisResult = await GeminiService.analyzeTextWithRAG(text, context);
                }
            } else {
                console.log('Using standard Gemini for analysis...');
                analysisResult = await GeminiService.analyzeText(text);
            }
            
            // Calculate processing time
            const processingTime = Date.now() - startTime;
            
            console.log(`Analysis completed in ${processingTime}ms`);
            
            // Format and return the result
            res.json(ResponseFormatter.formatSuccess({
                ...analysisResult,
                processingTime,
                useRAG,
                context: context.map(doc => ({
                    id: doc.id,
                    score: doc.distance,
                    metadata: doc.metadata
                }))
            }, 'Text analyzed successfully'));
        } catch (error) {
            console.error('Error analyzing text:', error);
            res.status(500).json(ResponseFormatter.formatError('Failed to analyze text', error));
        }
    }
}

module.exports = new AnalysisController();