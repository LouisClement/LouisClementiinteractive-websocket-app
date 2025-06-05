import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { RoomManager } from './RoomManager';

const app = express();

// Enable CORS
app.use(cors({
  origin: '*',
  credentials: true
}));

// Serve static files from public directory
app.use(express.static('public'));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

const roomManager = new RoomManager(8, 5 * 60 * 1000); // 8 users max, 5 minutes timeout

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Automatically join room on connection
  roomManager.addUser(socket.id);
  const state = roomManager.getRoomState();
  console.log('Room state after connection:', state);
  io.emit('roomState', state);

  socket.on('joinRoom', () => {
    console.log('User joining room:', socket.id);
    roomManager.addUser(socket.id);
    const state = roomManager.getRoomState();
    console.log('Room state after join:', state);
    io.emit('roomState', state);
  });

  socket.on('buttonPress', ({ buttonId }) => {
    console.log('Button press from user:', socket.id, 'button:', buttonId);
    const message = roomManager.handleButtonPress(socket.id, buttonId);
    if (message) {
      io.emit('buttonMessage', message);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    roomManager.removeUser(socket.id);
    const state = roomManager.getRoomState();
    console.log('Room state after disconnect:', state);
    io.emit('roomState', state);
  });
});

const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});
