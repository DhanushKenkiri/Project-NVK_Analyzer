// client/src/components/StatusIndicator.js
import React from 'react';

const StatusIndicator = ({ status }) => {
    const getStatusColor = () => {
        switch (status) {
            case 'connected':
                return '#4CAF50'; // Green
            case 'connecting':
                return '#FFC107'; // Yellow
            case 'disconnected':
                return '#9E9E9E'; // Gray
            case 'error':
                return '#F44336'; // Red
            default:
                return '#9E9E9E';
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'connected':
                return 'Real-time updates active';
            case 'connecting':
                return 'Connecting...';
            case 'disconnected':
                return 'Real-time updates inactive';
            case 'error':
                return 'Connection error';
            default:
                return 'Unknown status';
        }
    };

    return (
        <div className="status-indicator">
            <div 
                className="status-dot" 
                style={{ backgroundColor: getStatusColor() }}
            ></div>
            <span className="status-text">{getStatusText()}</span>
        </div>
    );
};

export default StatusIndicator;