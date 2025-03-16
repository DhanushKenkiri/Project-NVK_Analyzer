// client/src/App.js
import React, { useState, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import Results from './components/Results';
import ToggleSwitch from './components/ToggleSwitch';
import StatusIndicator from './components/StatusIndicator';
import './styles.css';

const App = () => {
    const [results, setResults] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [useRAG, setUseRAG] = useState(true);
    const [extractedText, setExtractedText] = useState('');
    const [realtimeUpdates, setRealtimeUpdates] = useState([]);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');

    // Setup WebSocket for real-time updates when component mounts
    useEffect(() => {
        const ws = new WebSocket('ws://localhost:3001/api/updates');
        
        ws.onopen = () => {
            console.log('Connected to real-time updates');
            setConnectionStatus('connected');
        };
        
        ws.onmessage = (event) => {
            const update = JSON.parse(event.data);
            setRealtimeUpdates(prev => [...prev, update]);
            
            // If this is an update for the current analysis, update the results
            if (results && update.id === results.id) {
                setResults(prev => ({...prev, ...update.changes}));
            }
        };
        
        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            setConnectionStatus('error');
        };
        
        ws.onclose = () => {
            console.log('Disconnected from real-time updates');
            setConnectionStatus('disconnected');
        };
        
        return () => {
            ws.close();
        };
    }, [results]);

    const handleFileUpload = async (file) => {
        try {
            setIsLoading(true);
            setError(null);
            
            const formData = new FormData();
            formData.append('file', file);

            // Step 1: Extract text from the file
            const extractResponse = await fetch('/api/extract-text', {
                method: 'POST',
                body: formData
            });
            
            if (!extractResponse.ok) {
                throw new Error(`Error extracting text: ${extractResponse.statusText}`);
            }
            
            const extractData = await extractResponse.json();
            setExtractedText(extractData.data);
            
            // Step 2: Analyze the extracted text
            const analysisResponse = await fetch('/api/analyze-text', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: extractData.data,
                    useRAG: useRAG
                })
            });
            
            if (!analysisResponse.ok) {
                throw new Error(`Error analyzing text: ${analysisResponse.statusText}`);
            }
            
            const analysisData = await analysisResponse.json();
            setResults(analysisData.data);
            
        } catch (err) {
            console.error('Error processing file:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleRAG = () => {
        setUseRAG(!useRAG);
    };

    return (
        <div className="app">
            <header className="app-header">
                <h1>Project NVK Analyzer</h1>
                <StatusIndicator status={connectionStatus} />
            </header>
            
            <main className="app-main">
                <section className="upload-section">
                    <div className="toggle-container">
                        <ToggleSwitch isOn={useRAG} handleToggle={handleToggleRAG} />
                        <span className="toggle-label">
                            {useRAG ? 'Using RAG Pipeline' : 'Using Direct Analysis'}
                        </span>
                    </div>
                    
                    <FileUpload onFileUpload={handleFileUpload} isLoading={isLoading} />
                    
                    {error && (
                        <div className="error-message">
                            <p>Error: {error}</p>
                        </div>
                    )}
                </section>
                
                {extractedText && (
                    <section className="text-preview">
                        <h3>Extracted Text:</h3>
                        <div className="text-content">
                            {extractedText.length > 500 
                                ? extractedText.substring(0, 500) + '...' 
                                : extractedText}
                        </div>
                    </section>
                )}
                
                {results && (
                    <section className="results-section">
                        <Results results={results} realtimeUpdates={realtimeUpdates} />
                    </section>
                )}
                
                {realtimeUpdates.length > 0 && (
                    <section className="updates-section">
                        <h3>Real-Time Updates:</h3>
                        <div className="updates-list">
                            {realtimeUpdates.slice(-5).map((update, index) => (
                                <div key={index} className="update-item">
                                    <span className="update-time">
                                        {new Date(update.timestamp).toLocaleTimeString()}
                                    </span>
                                    <span className="update-message">{update.message}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
};

export default App;