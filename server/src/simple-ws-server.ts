import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.static(__dirname + '/../public'));

const server = createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());
            console.log('Received:', data);
            
            if (data.buttonId) {
                // Broadcast the button press to all clients
                const response = {
                    type: 'buttonPress',
                    buttonId: data.buttonId,
                    timestamp: Date.now()
                };
                wss.clients.forEach(client => {
                    if (client.readyState === ws.OPEN) {
                        client.send(JSON.stringify(response));
                    }
                });
            }
        } catch (e) {
            console.error('Error processing message:', e);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });

    // Send initial connection confirmation
    ws.send(JSON.stringify({ type: 'connected', timestamp: Date.now() }));
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`WebSocket server running on ws://127.0.0.1:${PORT}`);
});
