// server/server.js
require('dotenv').config();
const app = require('./app');
const http = require('http');
const WebSocketService = require('./services/websocketService');

const port = process.env.PORT || 3000;
const server = http.createServer(app);

// Initialize WebSocket service with our HTTP server
WebSocketService.initialize(server);

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`WebSocket server running on ws://localhost:${port}/api/updates`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
});