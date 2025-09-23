import express from 'express';
import { createServer, IncomingMessage } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import cors from 'cors';
import { RoomManager } from './RoomManager';
import path from 'path';
import { URL } from 'url';

// Serveur WebSocket pour Chataigne
const chataigneWss = new WebSocketServer({ port: 8080 });
let chataigneConnection: WebSocket | null = null;

chataigneWss.on('connection', (ws) => {
    console.log('Chataigne connected');
    chataigneConnection = ws;
    ws.on('close', () => { chataigneConnection = null; });
    ws.on('error', (error) => { console.error('Chataigne connection error:', error); });
});

const app = express();
app.use(cors());
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index-ws.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin.html'));
});

app.use(express.static(path.join(__dirname, '../public')));

const server = createServer(app);
const wss = new WebSocketServer({ server });
const roomManager = new RoomManager();

const sendStateToAllUsers = () => {
    const state = roomManager.getState();
    wss.clients.forEach((client: WebSocket & { userId?: string, isPriority?: boolean }) => {
        if (client.readyState === WebSocket.OPEN && client.userId) {
            const user = state.activeUsers.find(u => u.id === client.userId) || state.waitingUsers.find(u => u.id === client.userId);
            if (user) {
                const isActive = state.activeUsers.some(u => u.id === client.userId);
                const waitingIndex = state.waitingUsers.findIndex(u => u.id === client.userId);
                
                let buttonsToSend;
                if (client.isPriority && isActive) {
                    // L'admin voit seulement ses boutons assignés comme les autres utilisateurs
                    buttonsToSend = user.assignedButtons;
                } else {
                    // Les utilisateurs normaux voient seulement leurs boutons s'ils sont actifs
                    buttonsToSend = isActive ? user.assignedButtons : [];
                }
                
                client.send(JSON.stringify({
                    type: 'userState',
                    buttons: buttonsToSend,
                    position: isActive ? 'active' : 'waiting',
                    waitingCount: isActive ? 0 : waitingIndex + 1,
                    timeUntilRotation: roomManager.getTimeUntilNextRotation(),
                }));
            }
        }
    });
};

roomManager.setNotifyCallback(sendStateToAllUsers);

wss.on('connection', (ws: WebSocket & { userId?: string, isPriority?: boolean }, req: IncomingMessage) => {
    const fullUrl = new URL(req.url || '', `http://${req.headers.host}`);
    const isPriorityUser = fullUrl.searchParams.get('admin') === 'true';

    ws.userId = Math.random().toString(36).substring(7);
    ws.isPriority = isPriorityUser;
    console.log(`Client connected: ${ws.userId}${isPriorityUser ? ' (Priority)' : ''}`);
    roomManager.addUser(ws.userId, isPriorityUser);

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());
            if (data.buttonId && ws.userId && roomManager.canUseButton(ws.userId, data.buttonId)) {
                if (chataigneConnection) {
                    chataigneConnection.send(JSON.stringify({ buttonId: data.buttonId }));
                }
                const broadcastMessage = { type: 'buttonMessage', buttonId: data.buttonId, userId: ws.userId };
                wss.clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(JSON.stringify(broadcastMessage)); });
            } else {
                ws.send(JSON.stringify({ type: 'error', message: 'Button not assigned' }));
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    ws.on('close', () => {
        if (ws.userId) {
            console.log('Client disconnected:', ws.userId);
            roomManager.removeUser(ws.userId);
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket error for', ws.userId, ':', error);
    });
});

const PORT = parseInt(process.env.PORT || '3000', 10);
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});
