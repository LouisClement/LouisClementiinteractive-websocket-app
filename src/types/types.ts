export interface User {
  id: string;
  position: number;
  joinedAt: number;
}

export interface ButtonMessage {
  userId: string;
  buttonId: string;
  message: string;
}

export interface RoomState {
  activeUsers: User[];
  waitingUsers: User[];
  maxActiveUsers: number;
  timeoutMinutes: number;
}
