interface User {
  id: string;
  joinedAt: number;
}

interface RoomState {
  activeUsers: User[];
  waitingUsers: User[];
  maxActiveUsers: number;
  timeoutMinutes: number;
}

interface ButtonMessage {
  userId: string;
  buttonId: string;
  message: string;
}

export class RoomManager {
  private activeUsers: User[] = [];
  private waitingUsers: User[] = [];
  private readonly maxActiveUsers: number;
  private readonly timeout: number;
  private timeoutHandlers: Map<string, NodeJS.Timeout> = new Map();

  constructor(maxActiveUsers: number, timeout: number) {
    this.maxActiveUsers = maxActiveUsers;
    this.timeout = timeout;
  }

  private startUserTimeout(userId: string) {
    if (this.timeoutHandlers.has(userId)) {
      clearTimeout(this.timeoutHandlers.get(userId)!);
    }

    const handler = setTimeout(() => {
      if (this.waitingUsers.length > 0) {
        this.removeUser(userId);
        const nextUser = this.waitingUsers[0];
        this.promoteUser(nextUser.id);
      }
    }, this.timeout);

    this.timeoutHandlers.set(userId, handler);
  }

  private promoteUser(userId: string) {
    const userIndex = this.waitingUsers.findIndex(u => u.id === userId);
    if (userIndex === -1) return;

    const user = this.waitingUsers[userIndex];
    this.waitingUsers.splice(userIndex, 1);
    this.activeUsers.push(user);
    this.startUserTimeout(userId);
  }

  addUser(userId: string) {
    const user = { id: userId, joinedAt: Date.now() };
    
    if (this.activeUsers.length < this.maxActiveUsers) {
      this.activeUsers.push(user);
      this.startUserTimeout(userId);
    } else {
      this.waitingUsers.push(user);
    }
  }

  removeUser(userId: string) {
    const activeIndex = this.activeUsers.findIndex(u => u.id === userId);
    if (activeIndex !== -1) {
      this.activeUsers.splice(activeIndex, 1);
      if (this.timeoutHandlers.has(userId)) {
        clearTimeout(this.timeoutHandlers.get(userId)!);
        this.timeoutHandlers.delete(userId);
      }

      if (this.waitingUsers.length > 0) {
        this.promoteUser(this.waitingUsers[0].id);
      }
      return;
    }

    const waitingIndex = this.waitingUsers.findIndex(u => u.id === userId);
    if (waitingIndex !== -1) {
      this.waitingUsers.splice(waitingIndex, 1);
    }
  }

  handleButtonPress(userId: string, buttonId: string): ButtonMessage | null {
    const userIndex = this.activeUsers.findIndex(u => u.id === userId);
    if (userIndex === -1) return null;

    const totalUsers = this.activeUsers.length;
    const userPosition = userIndex + 1;
    const message = `${totalUsers}-${userPosition}-${buttonId}`;

    return {
      userId,
      buttonId,
      message
    };
  }

  getRoomState(): RoomState {
    return {
      activeUsers: this.activeUsers,
      waitingUsers: this.waitingUsers,
      maxActiveUsers: this.maxActiveUsers,
      timeoutMinutes: this.timeout / (60 * 1000)
    };
  }
}
