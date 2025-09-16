import { createServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import express from 'express';
import cors from 'cors';
import { RoomManager } from './room-manager';
import path from 'path';

// Serveur WebSocket pour Chataigne
const chataigneWss = new WebSocketServer({ port: 8080 });
let chataigneConnection: WebSocket | null = null;

chataigneWss.on('connection', (ws) => {
    console.log('Chataigne connected');
    chataigneConnection = ws;

    ws.on('close', () => {
        console.log('Chataigne disconnected');
        chataigneConnection = null;
    });

    ws.on('error', (error) => {
        console.error('Chataigne connection error:', error);
    });
});

const app = express();

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

app.use(cors());

const server = createServer(app);
const roomManager = new RoomManager();
const wss = new WebSocketServer({ server });

// Set up the notification callback
roomManager.setNotifyCallback((data) => {
    wss.clients.forEach((client: any) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
});

wss.on('connection', (ws: WebSocket & { userId?: string }) => {
    // Assign a unique ID to this connection
    ws.userId = Math.random().toString(36).substring(7);
    console.log('Client connected:', ws.userId);
    
    // Add user to room and get their buttons
    const userState = roomManager.addUser(ws.userId);
    
    // Send initial state to all clients
    const updateMessage = {
        type: 'userUpdate',
        users: roomManager.getActiveUsers()
    };

    // Send state update to all clients
    const allUsers = roomManager.getActiveUsers();
    wss.clients.forEach((client: WebSocket & { userId?: string }) => {
        if (client.readyState === WebSocket.OPEN) {
            // Find this client's user state
            const thisUserState = allUsers.find(u => u.id === client.userId);
            if (thisUserState) {
                // Send user state
                client.send(JSON.stringify({
                    type: 'userState',
                    buttons: thisUserState.assignedButtons,
                    position: 'active',
                    waitingCount: userState.waitingCount,
                    timeUntilRotation: roomManager.getTimeUntilNextRotation()
                }));
            }
            // Send global update
            client.send(JSON.stringify(updateMessage));
        }
    });

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());
            console.log('Received message from', ws.userId, ':', data);
            try {
                if (data.buttonId && roomManager.canUseButton(ws.userId!, data.buttonId)) {
                    console.log('Received message from', ws.userId, ':', data);
                    // Envoyer à Chataigne
                    if (chataigneConnection) {
                        chataigneConnection.send(JSON.stringify({ buttonId: data.buttonId }));
                        console.log('Sent to Chataigne:', data);
                    }
                    
                    const broadcastMessage = {
                        type: 'buttonMessage',
                        buttonId: data.buttonId,
                        userId: ws.userId
                    };
                    console.log('Broadcasting message:', broadcastMessage);
                    wss.clients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify(broadcastMessage));
                        }
                    });
                } else {
                    console.log('User not authorized to use this button');
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'You are not authorized to use this button'
                    }));
                }
            } catch (error) {
                console.error('Error processing message:', error);
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected:', ws.userId);
        if (ws.userId) {
            roomManager.removeUser(ws.userId);
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket error for', ws.userId, ':', error);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`WebSocket server running on port ${PORT}`);
    console.log(`Local access: http://localhost:${PORT}`);
    console.log(`Network access: http://192.168.1.34:${PORT}`);
});
