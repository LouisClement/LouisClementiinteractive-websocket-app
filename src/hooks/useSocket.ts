import { useEffect, useState } from 'react';
import socketService from '../services/socketService';
import { RoomState, ButtonMessage } from '../types/types';

export const useSocket = () => {
  const [roomState, setRoomState] = useState<RoomState>({
    activeUsers: [],
    waitingUsers: [],
    maxActiveUsers: 8,
    timeoutMinutes: 5
  });

  const [messages, setMessages] = useState<ButtonMessage[]>([]);

  useEffect(() => {
    socketService.connect();
    socketService.joinRoom();

    socketService.onRoomStateUpdate((state) => {
      setRoomState(state);
    });

    socketService.onButtonMessage((message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socketService.disconnect();
    };
  }, []);

  const sendButtonPress = (buttonId: string) => {
    socketService.sendButtonPress(buttonId);
  };

  return {
    roomState,
    messages,
    sendButtonPress,
    isActive: roomState.activeUsers.some(user => user.id === socketService.socketId),
    position: roomState.activeUsers.findIndex(user => user.id === socketService.socketId) + 1
  };
};
