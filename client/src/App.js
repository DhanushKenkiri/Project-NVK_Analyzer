// client/src/App.js
import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import Results from './components/Results';
import './styles.css';

const App = () => {
    const [results, setResults] = useState(null);

    const handleFileUpload = async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/extract-text', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        setResults(data.data);
    };

    return (
        <div className="app">
            <h1>Project NVK Analyzer</h1>
            <FileUpload onFileUpload={handleFileUpload} />
            {results && <Results results={results} />}
        </div>
    );
};

export default App;