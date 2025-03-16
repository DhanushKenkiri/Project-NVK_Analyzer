import React, { useState } from 'react';
import axios from 'axios';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import ToggleSwitch from './ToggleSwitch';

const FileUpload = ({ onFileUpload }) => {
    const [file, setFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [analysisProgress, setAnalysisProgress] = useState(0);
    const [error, setError] = useState(null);
    const [useRAG, setUseRAG] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [stage, setStage] = useState('');

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setError(null); // Reset error on new file selection
    };

    const handleToggleRAG = () => {
        setUseRAG(!useRAG);
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file.');
            return;
        }

        setProcessing(true);
        setStage('Uploading file');
        const formData = new FormData();
        formData.append('file', file);

        try {
            // Upload file with progress tracking
            setStage('Extracting text');
            const uploadResponse = await axios.post('/api/extract-text', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
                    setUploadProgress(progress);
                },
            });

            if (!uploadResponse.data.data) {
                throw new Error('No text could be extracted from the file');
            }

            // Start analysis with progress tracking
            setStage('Analyzing text');
            setUploadProgress(100);
            const analysisResponse = await axios.post('/api/analyze-text', {
                text: uploadResponse.data.data,
                useRAG: useRAG, // Toggle RAG based on state
            }, {
                onDownloadProgress: (progressEvent) => {
                    // This may not work perfectly with all servers, but we'll try
                    const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
                    setAnalysisProgress(progress);
                },
            });

            // Pass results to parent component
            setStage('Complete');
            onFileUpload({
                extractedText: uploadResponse.data.data,
                analysis: analysisResponse.data.data,
                useRAG: useRAG
            });
        } catch (error) {
            console.error('Error during upload or analysis:', error);
            setError(`Failed: ${error.response?.data?.message || error.message}`);
        } finally {
            // Reset progress after completion
            setProcessing(false);
            setUploadProgress(0);
            setAnalysisProgress(0);
            setStage('');
        }
    };

    return (
        <div className="file-upload-container">
            <div className="upload-controls">
                <input 
                    type="file" 
                    onChange={handleFileChange} 
                    className="file-input"
                    accept="image/*,application/pdf"
                    disabled={processing} 
                />
                <ToggleSwitch isOn={useRAG} handleToggle={handleToggleRAG} />
                <button 
                    onClick={handleUpload} 
                    disabled={!file || processing}
                    className={processing ? 'btn-disabled' : 'btn-primary'}
                >
                    {processing ? 'Processing...' : 'Upload'}
                </button>
            </div>

            {processing && (
                <div className="progress-container">
                    <div className="progress-item">
                        <div style={{ width: '100px', margin: '10px auto' }}>
                            <CircularProgressbar
                                value={uploadProgress}
                                text={`${uploadProgress}%`}
                                styles={buildStyles({
                                    pathColor: '#00aaff',
                                    textColor: '#ffffff'
                                })}
                            />
                        </div>
                        <p className="progress-label">Upload Progress</p>
                    </div>
                    
                    <div className="progress-item">
                        <div style={{ width: '100px', margin: '10px auto' }}>
                            <CircularProgressbar
                                value={analysisProgress}
                                text={`${analysisProgress}%`}
                                styles={buildStyles({
                                    pathColor: '#00ff88',
                                    textColor: '#ffffff'
                                })}
                            />
                        </div>
                        <p className="progress-label">Analysis Progress</p>
                    </div>
                </div>
            )}

            {stage && <p className="processing-stage">Current stage: {stage}</p>}
            {error && <p className="error-message">{error}</p>}
        </div>
    );
};

export default FileUpload;