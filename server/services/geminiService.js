// server/services/geminiService.js
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

class GeminiService {
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY;
        if (!this.apiKey) {
            console.warn('GEMINI_API_KEY not found in environment variables');
        }
    }

    /**
     * Analyze text using Gemini API without RAG
     * @param {string} text - The text to analyze
     * @returns {Promise<object>} - The analysis results
     */
    async analyzeText(text) {
        try {
            const response = await axios.post(
                'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
                {
                    contents: [
                        {
                            parts: [
                                {
                                    text: `Analyze the following text thoroughly and provide insights:
                                    ${text}
                                    
                                    Please structure your response with the following sections:
                                    1. Key Points
                                    2. Entities Identified
                                    3. Potential Concerns
                                    4. Recommendations`
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.2,
                        maxOutputTokens: 1024
                    }
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-goog-api-key': this.apiKey
                    }
                }
            );

            return this.formatGeminiResponse(response.data);
        } catch (error) {
            console.error('Gemini API error:', error.response?.data || error.message);
            throw new Error('Failed to analyze text with Gemini: ' + (error.response?.data?.error?.message || error.message));
        }
    }

    /**
     * Analyze text using Gemini API with RAG context
     * @param {string} text - The text to analyze
     * @param {Array} context - The context documents from RAG
     * @returns {Promise<object>} - The analysis results
     */
    async analyzeTextWithRAG(text, context) {
        try {
            // Format context for the prompt
            const contextText = context.map(doc => 
                `Document ID: ${doc.id}\nContent: ${doc.text}\n---`
            ).join('\n');

            const response = await axios.post(
                'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
                {
                    contents: [
                        {
                            parts: [
                                {
                                    text: `You are a contract analysis assistant. Analyze the following text thoroughly.
                                    
                                    User Text: ${text}
                                    
                                    Related Context:
                                    ${contextText}
                                    
                                    Using the user text and the related context, provide a comprehensive analysis with the following sections:
                                    1. Key Points
                                    2. Related Information (from context)
                                    3. Entities Identified
                                    4. Potential Concerns
                                    5. Recommendations`
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.2,
                        maxOutputTokens: 1024
                    }
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-goog-api-key': this.apiKey
                    }
                }
            );

            return this.formatGeminiResponse(response.data);
        } catch (error) {
            console.error('Gemini API error:', error.response?.data || error.message);
            throw new Error('Failed to analyze text with Gemini RAG: ' + (error.response?.data?.error?.message || error.message));
        }
    }

    /**
     * Format the Gemini API response
     * @param {object} responseData - The raw response data
     * @returns {object} - The formatted response
     */
    formatGeminiResponse(responseData) {
        try {
            if (responseData.candidates && responseData.candidates.length > 0) {
                const content = responseData.candidates[0].content;
                
                // Extract the generated text
                const generatedText = content.parts.map(part => part.text).join('\n');
                
                // Parse the structured response
                const sections = this.parseSections(generatedText);
                
                return {
                    analysis: sections,
                    rawText: generatedText,
                    usage: responseData.usageMetadata
                };
            }
            
            return { error: 'No valid response from Gemini API' };
        } catch (error) {
            console.error('Error formatting Gemini response:', error);
            return { error: 'Failed to format Gemini response', details: error.message };
        }
    }

    /**
     * Parse sections from the generated text
     * @param {string} text - The generated text
     * @returns {object} - The parsed sections
     */
    parseSections(text) {
        const sections = {};
        
        // Define section markers
        const sectionMarkers = [
            'Key Points',
            'Related Information',
            'Entities Identified',
            'Potential Concerns',
            'Recommendations'
        ];
        
        // Find section boundaries
        let currentSection = null;
        let currentContent = [];
        
        for (const line of text.split('\n')) {
            // Check if this line starts a new section
            const sectionMatch = sectionMarkers.find(marker => 
                line.includes(marker) || line.match(new RegExp(`^\\d+\\.\\s*${marker}`, 'i'))
            );
            
            if (sectionMatch) {
                // Save previous section if exists
                if (currentSection) {
                    sections[currentSection] = currentContent.join('\n').trim();
                    currentContent = [];
                }
                
                currentSection = sectionMatch;
            } else if (currentSection && line.trim()) {
                currentContent.push(line);
            }
        }
        
        // Save the last section
        if (currentSection) {
            sections[currentSection] = currentContent.join('\n').trim();
        }
        
        return sections;
    }
}

module.exports = new GeminiService();