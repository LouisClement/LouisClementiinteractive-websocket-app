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

// Gestion des timeouts et heartbeats
interface ClientConnection extends WebSocket {
    userId?: string;
    isPriority?: boolean;
    lastActivity?: number;
    heartbeatTimer?: NodeJS.Timeout;
    inactivityTimer?: NodeJS.Timeout;
}

const HEARTBEAT_INTERVAL = 30000; // 30 secondes
const INACTIVITY_TIMEOUT = 120000; // 2 minutes
const activeConnections = new Map<string, ClientConnection>();

// Fonction pour déconnecter un utilisateur inactif
const disconnectInactiveUser = (ws: ClientConnection) => {
    if (ws.userId && !ws.isPriority) { // Protection: ne pas déconnecter les utilisateurs prioritaires
        console.log(`Disconnecting inactive user: ${ws.userId}`);
        clearTimers(ws);
        activeConnections.delete(ws.userId);
        roomManager.removeUser(ws.userId);
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'disconnect', reason: 'inactivity' }));
            ws.close(1000, 'Inactivity timeout');
        }
    }
};

// Fonction pour nettoyer les timers
const clearTimers = (ws: ClientConnection) => {
    if (ws.heartbeatTimer) {
        clearInterval(ws.heartbeatTimer);
        ws.heartbeatTimer = undefined;
    }
    if (ws.inactivityTimer) {
        clearTimeout(ws.inactivityTimer);
        ws.inactivityTimer = undefined;
    }
};

// Fonction pour démarrer le heartbeat
const startHeartbeat = (ws: ClientConnection) => {
    // Protection: pas de heartbeat obligatoire pour les utilisateurs prioritaires
    if (ws.isPriority) {
        console.log(`Priority user ${ws.userId}: heartbeat exempted`);
        return;
    }

    ws.heartbeatTimer = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
        } else {
            clearTimers(ws);
        }
    }, HEARTBEAT_INTERVAL);
};

// Fonction pour reset le timer d'inactivité
const resetInactivityTimer = (ws: ClientConnection) => {
    // Protection: pas de timeout pour les utilisateurs prioritaires
    if (ws.isPriority) {
        return;
    }

    ws.lastActivity = Date.now();
    
    if (ws.inactivityTimer) {
        clearTimeout(ws.inactivityTimer);
    }
    
    ws.inactivityTimer = setTimeout(() => {
        disconnectInactiveUser(ws);
    }, INACTIVITY_TIMEOUT);
};

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

wss.on('connection', (ws: ClientConnection, req: IncomingMessage) => {
    const fullUrl = new URL(req.url || '', `http://${req.headers.host}`);
    const isPriorityUser = fullUrl.searchParams.get('admin') === 'true';

    ws.userId = Math.random().toString(36).substring(7);
    ws.isPriority = isPriorityUser;
    ws.lastActivity = Date.now();
    
    console.log(`Client connected: ${ws.userId}${isPriorityUser ? ' (Priority)' : ''}`);
    
    // Ajouter à la map des connexions actives
    activeConnections.set(ws.userId, ws);
    
    // Ajouter l'utilisateur au room manager
    roomManager.addUser(ws.userId, isPriorityUser);
    
    // Démarrer le heartbeat et le timer d'inactivité (sauf pour les prioritaires)
    startHeartbeat(ws);
    resetInactivityTimer(ws);

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());
            
            // Reset du timer d'inactivité à chaque message (sauf pour les prioritaires)
            resetInactivityTimer(ws);
            
            // Gestion des différents types de messages
            if (data.type === 'pong') {
                // Réponse au ping - juste reset le timer
                console.log(`Pong received from ${ws.userId}`);
            } else if (data.type === 'heartbeat') {
                // Heartbeat du client - confirmer la réception
                ws.send(JSON.stringify({ type: 'heartbeat_ack' }));
            } else if (data.buttonId && ws.userId && roomManager.canUseButton(ws.userId, data.buttonId)) {
                // Clic sur un bouton
                if (chataigneConnection) {
                    chataigneConnection.send(JSON.stringify({ buttonId: data.buttonId }));
                }
                const broadcastMessage = { type: 'buttonMessage', buttonId: data.buttonId, userId: ws.userId };
                wss.clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(JSON.stringify(broadcastMessage)); });
            } else if (data.buttonId) {
                // Bouton non assigné
                ws.send(JSON.stringify({ type: 'error', message: 'Button not assigned' }));
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    ws.on('close', () => {
        if (ws.userId) {
            console.log('Client disconnected:', ws.userId);
            clearTimers(ws);
            activeConnections.delete(ws.userId);
            roomManager.removeUser(ws.userId);
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket error for', ws.userId, ':', error);
        if (ws.userId) {
            clearTimers(ws);
            activeConnections.delete(ws.userId);
        }
    });
});

const PORT = parseInt(process.env.PORT || '3000', 10);
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});
