import React from 'react';

const ToggleSwitch = ({ isOn, handleToggle }) => {
    return (
        <div>
            <label>
                <input type="checkbox" checked={isOn} onChange={handleToggle} />
                Use RAG
            </label>
        </div>
    );
};

export default ToggleSwitch;