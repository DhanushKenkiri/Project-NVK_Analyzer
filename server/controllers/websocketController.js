// server/controllers/websocketController.js
const WebSocketService = require('../services/websocketService');
const { randomUUID } = require('crypto');

class WebSocketController {
    constructor() {
        this.activeAnalyses = new Map();
        // Setup periodic cleanup of old analyses
        setInterval(() => this.cleanupOldAnalyses(), 1000 * 60 * 30); // 30 minutes
    }
    
    /**
     * Register a new analysis session
     * @param {string} textId - ID of the text being analyzed
     * @returns {string} - Session ID
     */
    registerAnalysis(textId) {
        const sessionId = randomUUID();
        
        this.activeAnalyses.set(sessionId, {
            textId,
            startTime: Date.now(),
            status: 'processing',
            steps: []
        });
        
        // Notify clients that a new analysis has started
        WebSocketService.broadcastUpdate(
            sessionId,
            'analysis_start',
            { textId },
            'Analysis started'
        );
        
        return sessionId;
    }

    /**
     * Update the status of an analysis session
     * @param {string} sessionId - ID of the analysis session
     * @param {string} status - New status
     * @param {Object} data - Additional data to include in the update
     * @param {string} message - Message describing the update
     */
    updateAnalysisStatus(sessionId, status, data = {}, message = '') {
        const analysis = this.activeAnalyses.get(sessionId);
        
        if (!analysis) {
            throw new Error(`Analysis session ${sessionId} not found`);
        }
        
        analysis.status = status;
        analysis.lastUpdated = Date.now();
        
        // Add this step to the analysis history
        analysis.steps.push({
            timestamp: Date.now(),
            status,
            message
        });
        
        // Broadcast the update to all connected clients
        WebSocketService.broadcastUpdate(
            sessionId,
            'analysis_update',
            { ...data, status },
            message
        );
        
        return analysis;
    }
    
    /**
     * Complete an analysis session
     * @param {string} sessionId - ID of the analysis session
     * @param {Object} results - Analysis results
     */
    completeAnalysis(sessionId, results) {
        const analysis = this.activeAnalyses.get(sessionId);
        
        if (!analysis) {
            throw new Error(`Analysis session ${sessionId} not found`);
        }
        
        analysis.status = 'completed';
        analysis.completedAt = Date.now();
        analysis.results = results;
        
        // Add completion step to history
        analysis.steps.push({
            timestamp: Date.now(),
            status: 'completed',
            message: 'Analysis completed successfully'
        });
        
        // Broadcast completion to all connected clients
        WebSocketService.broadcastUpdate(
            sessionId,
            'analysis_complete',
            { results },
            'Analysis completed successfully'
        );
        
        return analysis;
    }
    
    /**
     * Mark an analysis as failed
     * @param {string} sessionId - ID of the analysis session
     * @param {string} errorMessage - Error message
     * @param {Object} errorDetails - Additional error details
     */
    failAnalysis(sessionId, errorMessage, errorDetails = {}) {
        const analysis = this.activeAnalyses.get(sessionId);
        
        if (!analysis) {
            throw new Error(`Analysis session ${sessionId} not found`);
        }
        
        analysis.status = 'failed';
        analysis.error = {
            message: errorMessage,
            details: errorDetails,
            timestamp: Date.now()
        };
        
        // Add failure step to history
        analysis.steps.push({
            timestamp: Date.now(),
            status: 'failed',
            message: errorMessage
        });
        
        // Broadcast failure to all connected clients
        WebSocketService.broadcastUpdate(
            sessionId,
            'analysis_failed',
            { error: analysis.error },
            errorMessage
        );
        
        return analysis;
    }
    
    /**
     * Get the status of an analysis session
     * @param {string} sessionId - ID of the analysis session
     * @returns {Object} - Analysis session data
     */
    getAnalysisStatus(sessionId) {
        const analysis = this.activeAnalyses.get(sessionId);
        
        if (!analysis) {
            throw new Error(`Analysis session ${sessionId} not found`);
        }
        
        return analysis;
    }
    
    /**
     * Clean up analysis sessions older than 24 hours
     */
    cleanupOldAnalyses() {
        const now = Date.now();
        const twentyFourHoursInMs = 24 * 60 * 60 * 1000;
        
        for (const [sessionId, analysis] of this.activeAnalyses.entries()) {
            const age = now - analysis.startTime;
            
            if (age > twentyFourHoursInMs) {
                // If analysis is still processing, mark as abandoned
                if (analysis.status === 'processing') {
                    this.failAnalysis(sessionId, 'Analysis abandoned due to timeout');
                }
                
                // Remove from active analyses
                this.activeAnalyses.delete(sessionId);
                
                console.log(`Cleaned up old analysis session: ${sessionId}`);
            }
        }
    }
}

module.exports = WebSocketController;