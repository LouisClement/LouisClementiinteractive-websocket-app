interface User {
    id: string;
    assignedButtons: number[];
    joinTime: number;
    isPriority: boolean;
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

        // Reset all buttons
        this.room.activeUsers.forEach(user => user.assignedButtons = []);

        const totalButtons = 16;
        for (let i = 1; i <= totalButtons; i++) {
            const userIndex = (i - 1) % userCount;
            this.room.activeUsers[userIndex].assignedButtons.push(i);
        }
    }

    public addUser(userId: string, isPriority: boolean = false): void {
        const newUser: User = { id: userId, assignedButtons: [], joinTime: Date.now(), isPriority };

        if (isPriority) {
            // Si l'utilisateur est prioritaire, il prend la place d'un non-prioritaire si nécessaire
            if (this.room.activeUsers.length >= 8) {
                const nonPriorityIndex = this.room.activeUsers.findIndex(u => !u.isPriority);
                if (nonPriorityIndex !== -1) {
                    const userToWait = this.room.activeUsers.splice(nonPriorityIndex, 1)[0];
                    this.room.waitingUsers.unshift(userToWait); // Le met au début de la file d'attente
                }
            }
            this.room.activeUsers.push(newUser);
        } else {
            // Comportement normal pour les utilisateurs non-prioritaires
            if (this.room.activeUsers.length < 8) {
                this.room.activeUsers.push(newUser);
            } else {
                this.room.waitingUsers.push(newUser);
            }
        }

        this.assignButtons();
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
