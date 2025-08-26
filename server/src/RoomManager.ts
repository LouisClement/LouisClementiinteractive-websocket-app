interface User {
    id: string;
    assignedButtons: number[];
    joinTime: number;
}

interface Room {
    activeUsers: User[];
    waitingUsers: User[];
    lastRotationTime: number;
    rotationIntervalMs: number;
}

export class RoomManager {
    private room: Room;
    private notifyCallback: () => void = () => {};

    private static readonly BUTTON_DISTRIBUTIONS: { [key: number]: number[][] } = {
        1: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]],
        2: [[1, 2, 3, 4, 9, 10, 11, 12], [5, 6, 7, 8, 13, 14, 15, 16]],
        3: [[1, 2, 3, 9, 10, 11], [4, 5, 6, 12, 13, 14], [7, 8, 15, 16]],
        4: [[1, 2, 9, 10], [3, 4, 11, 12], [5, 6, 13, 14], [7, 8, 15, 16]],
        5: [[1, 2, 9], [3, 4, 10], [5, 6, 11], [7, 12], [8, 13, 14, 15, 16]],
        6: [[1, 2], [3, 4], [5, 9], [6, 10], [7, 11, 12], [8, 13, 14, 15, 16]],
        7: [[1, 2], [3, 4], [5, 9], [6, 10], [7, 11], [8, 12], [13, 14, 15, 16]],
        8: [[1, 2], [3, 4], [5, 9], [6, 10], [7, 11], [8, 12], [13, 14], [15, 16]]
    };

    constructor(rotationIntervalMs: number = 5 * 60 * 1000) {
        this.room = {
            activeUsers: [],
            waitingUsers: [],
            lastRotationTime: Date.now(),
            rotationIntervalMs: rotationIntervalMs,
        };
        setInterval(() => this.rotateActiveUsers(), this.room.rotationIntervalMs);
    }

    public setNotifyCallback(callback: () => void): void {
        this.notifyCallback = callback;
    }

    private notifyStateChange() {
        if (this.notifyCallback) {
            this.notifyCallback();
        }
    }

    private assignButtons(): void {
        const userCount = this.room.activeUsers.length;
        if (userCount === 0) return;

        const distribution = RoomManager.BUTTON_DISTRIBUTIONS[userCount] || [];
        this.room.activeUsers.forEach((user, index) => {
            user.assignedButtons = distribution[index] || [];
        });
    }

    public addUser(userId: string): void {
        const newUser: User = { id: userId, assignedButtons: [], joinTime: Date.now() };
        if (this.room.activeUsers.length < 8) {
            this.room.activeUsers.push(newUser);
            this.assignButtons();
        } else {
            this.room.waitingUsers.push(newUser);
        }
        this.notifyStateChange();
    }

    public removeUser(userId: string): void {
        const initialActiveCount = this.room.activeUsers.length;
        this.room.activeUsers = this.room.activeUsers.filter(u => u.id !== userId);
        this.room.waitingUsers = this.room.waitingUsers.filter(u => u.id !== userId);

        if (this.room.activeUsers.length < initialActiveCount) {
            if (this.room.waitingUsers.length > 0) {
                const nextUser = this.room.waitingUsers.shift()!;
                this.room.activeUsers.push(nextUser);
            }
            this.assignButtons();
        }
        this.notifyStateChange();
    }

    private rotateActiveUsers(): void {
        if (this.room.waitingUsers.length > 0) {
            const usersToRotateCount = Math.min(this.room.activeUsers.length, this.room.waitingUsers.length);
            const returningUsers = this.room.activeUsers.splice(0, usersToRotateCount);
            const newUsers = this.room.waitingUsers.splice(0, usersToRotateCount);

            this.room.activeUsers.push(...newUsers);
            this.room.waitingUsers.push(...returningUsers);
            
            this.assignButtons();
            this.room.lastRotationTime = Date.now();
            this.notifyStateChange();
        }
    }

    public canUseButton(userId: string, buttonId: number): boolean {
        const user = this.room.activeUsers.find(u => u.id === userId);
        return user ? user.assignedButtons.includes(buttonId) : false;
    }

    public getTimeUntilNextRotation(): number {
        const now = Date.now();
        const timeSinceRotation = now - this.room.lastRotationTime;
        return Math.max(0, this.room.rotationIntervalMs - timeSinceRotation);
    }

    public getState(): Room {
        return this.room;
    }
}
