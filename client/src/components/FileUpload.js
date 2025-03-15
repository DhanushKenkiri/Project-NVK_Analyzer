import React, { useState } from 'react';
import axios from 'axios';
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const FileUpload = ({ onFileUpload }) => {
    const [file, setFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [analysisProgress, setAnalysisProgress] = useState(0);
    const [error, setError] = useState(null);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setError(null); // Reset error on new file selection
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            // Upload file with progress tracking
            const uploadResponse = await axios.post('/api/extract-text', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
                    setUploadProgress(progress);
                },
            });

            // Start analysis with progress tracking
            const analysisResponse = await axios.post('http://localhost:3001/api/analyze-text', {
                text: uploadResponse.data.data,
                useRAG: false, // Set to true if using RAG
            }, {
                onDownloadProgress: (progressEvent) => {
                    const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
                    setAnalysisProgress(progress);
                },
            });

            // Pass results to parent component
            onFileUpload(analysisResponse.data.data);
        } catch (error) {
            console.error('Error during upload or analysis:', error);
            setError('Failed to upload or analyze the file. Please try again.');
        } finally {
            // Reset progress after completion
            setUploadProgress(0);
            setAnalysisProgress(0);
        }
    };

    return (
        <div>
            <input type="file" onChange={handleFileChange} />
            <button onClick={handleUpload} disabled={!file}>
                Upload
            </button>

            {uploadProgress > 0 && (
                <div style={{ width: '100px', margin: '20px auto' }}>
                    <CircularProgressbar
                        value={uploadProgress}
                        text={`${uploadProgress}%`}
                    />
                    <p>Upload Progress</p>
                </div>
            )}

            {analysisProgress > 0 && (
                <div style={{ width: '100px', margin: '20px auto' }}>
                    <CircularProgressbar
                        value={analysisProgress}
                        text={`${analysisProgress}%`}
                    />
                    <p>Analysis Progress</p>
                </div>
            )}

            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
};

export default FileUpload;