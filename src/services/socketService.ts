import { io, Socket } from 'socket.io-client';
import { ButtonMessage, RoomState, User } from '../types/types';

class SocketService {
  private socket: Socket | null = null;
  private static instance: SocketService;

  private constructor() {}

  public get socketId(): string | undefined {
    return this.socket?.id;
  }

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  connect() {
    this.socket = io('http://localhost:3000', {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });
  }

  joinRoom() {
    if (!this.socket) return;
    this.socket.emit('joinRoom');
  }

  leaveRoom() {
    if (!this.socket) return;
    this.socket.emit('leaveRoom');
  }

  sendButtonPress(buttonId: string) {
    if (!this.socket) return;
    this.socket.emit('buttonPress', { buttonId });
  }

  onRoomStateUpdate(callback: (state: RoomState) => void) {
    if (!this.socket) return;
    this.socket.on('roomState', callback);
  }

  onButtonMessage(callback: (message: ButtonMessage) => void) {
    if (!this.socket) return;
    this.socket.on('buttonMessage', callback);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default SocketService.getInstance();
