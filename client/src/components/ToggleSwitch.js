import React from 'react';

const ToggleSwitch = ({ isOn, handleToggle }) => {
    return (
        <div className="toggle-switch-container">
            <span className={`toggle-label ${!isOn ? 'active' : ''}`}>Standard</span>
            <label className="toggle-switch">
                <input 
                    type="checkbox" 
                    checked={isOn} 
                    onChange={handleToggle}
                />
                <span className="toggle-slider"></span>
            </label>
            <span className={`toggle-label ${isOn ? 'active' : ''}`}>RAG</span>
            <div className="toggle-tooltip">
                {isOn ? 
                    "Using Retrieval Augmented Generation for enhanced analysis" : 
                    "Standard analysis using Gemini API"
                }
            </div>
        </div>
    );
};

export default ToggleSwitch;