// client/src/components/Results.js
import React, { useState } from 'react';

const Results = ({ results, realtimeUpdates }) => {
    const [activeTab, setActiveTab] = useState('summary');
    
    if (!results) return null;
    
    // Filter updates related to this particular analysis
    const relevantUpdates = realtimeUpdates.filter(update => 
        update.id === results.id || update.type === 'global'
    );
    
    // Format the JSON for display
    const formatJson = (json) => {
        return JSON.stringify(json, null, 2);
    };
    
    const renderTabContent = () => {
        switch (activeTab) {
            case 'summary':
                return (
                    <div className="summary-tab">
                        <div className="summary-card">
                            <h3>Key Points</h3>
                            <ul>
                                {results.keyPoints && results.keyPoints.map((point, idx) => (
                                    <li key={idx}>{point}</li>
                                ))}
                            </ul>
                        </div>
                        
                        {results.sentiment && (
                            <div className="summary-card">
                                <h3>Sentiment Analysis</h3>
                                <div className="sentiment-meter">
                                    <div 
                                        className="sentiment-indicator"
                                        style={{ 
                                            left: `${((results.sentiment.score + 1) / 2) * 100}%`
                                        }}
                                    ></div>
                                </div>
                                <div className="sentiment-labels">
                                    <span>Negative</span>
                                    <span>Neutral</span>
                                    <span>Positive</span>
                                </div>
                                <p className="sentiment-score">
                                    Score: {results.sentiment.score.toFixed(2)}
                                </p>
                            </div>
                        )}
                        
                        {results.entities && results.entities.length > 0 && (
                            <div className="summary-card">
                                <h3>Key Entities</h3>
                                <div className="entities-grid">
                                    {results.entities.map((entity, idx) => (
                                        <div key={idx} className="entity-tag">
                                            {entity.name}
                                            <span className="entity-type">{entity.type}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 'context':
                return (
                    <div className="context-tab">
                        <h3>Retrieved Context Passages</h3>
                        {results.contextSources && results.contextSources.map((source, idx) => (
                            <div key={idx} className="context-card">
                                <div className="context-header">
                                    <h4>Source {idx + 1}</h4>
                                    <span className="relevance-score">
                                        Relevance: {source.score.toFixed(2)}
                                    </span>
                                </div>
                                <div className="context-content">
                                    <p>{source.content}</p>
                                </div>
                                <div className="context-metadata">
                                    {source.metadata && (
                                        <>
                                            <span>From: {source.metadata.source || 'Unknown'}</span>
                                            {source.metadata.timestamp && (
                                                <span>Date: {new Date(source.metadata.timestamp).toLocaleDateString()}</span>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                        {(!results.contextSources || results.contextSources.length === 0) && (
                            <p className="no-data">No context sources were used for this analysis.</p>
                        )}
                    </div>
                );
            case 'raw':
                return (
                    <div className="raw-tab">
                        <pre className="json-viewer">{formatJson(results)}</pre>
                    </div>
                );
            case 'updates':
                return (
                    <div className="updates-tab">
                        <h3>Real-time Updates</h3>
                        {relevantUpdates.length > 0 ? (
                            <div className="updates-timeline">
                                {relevantUpdates.map((update, idx) => (
                                    <div key={idx} className="update-entry">
                                        <div className="update-time">
                                            {new Date(update.timestamp).toLocaleTimeString()}
                                        </div>
                                        <div className="update-content">
                                            <p className="update-message">{update.message}</p>
                                            {update.changes && (
                                                <details>
                                                    <summary>View Changes</summary>
                                                    <pre>{formatJson(update.changes)}</pre>
                                                </details>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="no-data">No updates have been received for this analysis.</p>
                        )}
                    </div>
                );
            default:
                return <div>Invalid tab selected</div>;
        }
    };
    
    return (
        <div className="results-container">
            <div className="results-header">
                <h2>Analysis Results</h2>
                {results.analysisType && (
                    <div className="analysis-type-badge">
                        {results.analysisType === 'rag' ? 'RAG Pipeline' : 'Direct Analysis'}
                    </div>
                )}
            </div>
            
            <div className="tabs">
                <button 
                    className={`tab-button ${activeTab === 'summary' ? 'active' : ''}`}
                    onClick={() => setActiveTab('summary')}
                >
                    Summary
                </button>
                <button 
                    className={`tab-button ${activeTab === 'context' ? 'active' : ''}`}
                    onClick={() => setActiveTab('context')}
                >
                    Context
                </button>
                <button 
                    className={`tab-button ${activeTab === 'raw' ? 'active' : ''}`}
                    onClick={() => setActiveTab('raw')}
                >
                    Raw Data
                </button>
                <button 
                    className={`tab-button ${activeTab === 'updates' ? 'active' : ''}`}
                    onClick={() => setActiveTab('updates')}
                >
                    Updates
                    {relevantUpdates.length > 0 && (
                        <span className="update-count">{relevantUpdates.length}</span>
                    )}
                </button>
            </div>
            
            <div className="tab-content">
                {renderTabContent()}
            </div>
        </div>
    );
};

export default Results;