// server/services/websocketService.js
const WebSocket = require('ws');

class WebSocketService {
    constructor() {
        this.clients = new Set();
    }

    initialize(server) {
        // Create a WebSocket server attached to the HTTP server
        this.wss = new WebSocket.Server({ 
            server,
            path: '/api/updates'
        });

        this.wss.on('connection', (ws) => {
            console.log('New client connected to WebSocket');
            this.clients.add(ws);

            ws.on('close', () => {
                console.log('Client disconnected from WebSocket');
                this.clients.delete(ws);
            });

            // Send initial connection confirmation
            ws.send(JSON.stringify({
                type: 'connection',
                status: 'established',
                timestamp: new Date().toISOString(),
                message: 'Connected to real-time updates'
            }));
        });

        console.log('WebSocket server initialized');
    }

    broadcast(data) {
        const message = typeof data === 'string' ? data : JSON.stringify(data);
        
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }

    broadcastUpdate(id, type, changes, message) {
        const updateData = {
            id,
            type,
            changes,
            timestamp: new Date().toISOString(),
            message
        };
        
        this.broadcast(updateData);
    }
}

module.exports = new WebSocketService();