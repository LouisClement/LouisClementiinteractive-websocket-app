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
    private static readonly ROTATION_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds
    private static readonly BUTTON_DISTRIBUTIONS = {
        1: [[1, 2, 3, 4, 5, 6, 7, 8]],
        2: [
            [1, 3, 5, 7],
            [2, 4, 6, 8]
        ],
        3: [
            [1, 3],
            [2, 4, 6],
            [5, 7, 8]
        ],
        4: [
            [1, 3],
            [2, 4],
            [5, 7],
            [6, 8]
        ],
        5: [
            [1, 2],
            [3, 4],
            [5, 6],
            [7],
            [8]
        ],
        6: [
            [1, 2],
            [3],
            [4],
            [5],
            [6],
            [7, 8]
        ],
        7: [
            [1],
            [2],
            [3],
            [4],
            [5],
            [6],
            [7, 8]
        ],
        8: [
            [1],
            [2],
            [3],
            [4],
            [5],
            [6],
            [7],
            [8]
        ]
    };

    constructor() {
        this.room = {
            activeUsers: [],
            waitingUsers: [],
            lastRotationTime: Date.now(),
            rotationIntervalMs: RoomManager.ROTATION_INTERVAL
        };
        this.startRotationTimer();
    }

    private startRotationTimer() {
        setInterval(() => {
            this.rotateUsers();
        }, 10000); // Check every 10 seconds
    }

    private rotateUsers() {
        const now = Date.now();
        if (now - this.room.lastRotationTime >= this.room.rotationIntervalMs) {
            console.log('Rotating users...');
            
            // Move active users to waiting list
            this.room.waitingUsers = [...this.room.waitingUsers, ...this.room.activeUsers];
            
            // Take new active users from waiting list
            const maxActiveUsers = 8;
            const newActiveUsers = this.room.waitingUsers.slice(0, maxActiveUsers);
            this.room.waitingUsers = this.room.waitingUsers.slice(maxActiveUsers);
            
            // Update active users and reset their join time
            this.room.activeUsers = newActiveUsers.map(user => ({
                ...user,
                joinTime: now
            }));
            
            this.room.lastRotationTime = now;
            this.redistributeButtons();
            
            return true;
        }
        return false;
    }

    private redistributeButtons() {
        if (this.room.activeUsers.length === 0) return;
        
        const userCount = Math.min(this.room.activeUsers.length, 8) as 1|2|3|4|5|6|7|8;
        console.log(`Redistributing buttons for ${userCount} users`);
        
        const distribution = RoomManager.BUTTON_DISTRIBUTIONS[userCount];
        console.log('Button distribution:', distribution);
        
        this.room.activeUsers.forEach((user, index) => {
            if (index < distribution.length) {
                user.assignedButtons = distribution[index];
                console.log(`User ${user.id} assigned buttons:`, user.assignedButtons);
            } else {
                user.assignedButtons = [];
                console.log(`User ${user.id} has no buttons assigned`);
            }
        });

        // Notify all users about their new buttons
        const updateData = {
            type: 'userUpdate',
            users: this.room.activeUsers.map(user => ({
                id: user.id,
                buttons: user.assignedButtons
            }))
        };
        this.notifyUsersOfChanges(updateData);
    }

    public addUser(userId: string): { buttons: number[], position: 'active' | 'waiting', waitingCount: number } {
        // Check if user already exists
        const existingActiveUser = this.room.activeUsers.find(u => u.id === userId);
        const existingWaitingUser = this.room.waitingUsers.find(u => u.id === userId);
        
        if (existingActiveUser) {
            return {
                buttons: existingActiveUser.assignedButtons,
                position: 'active',
                waitingCount: this.room.waitingUsers.length
            };
        }
        
        if (existingWaitingUser) {
            return {
                buttons: [],
                position: 'waiting',
                waitingCount: this.room.waitingUsers.length
            };
        }

        const newUser: User = {
            id: userId,
            assignedButtons: [],
            joinTime: Date.now()
        };

        if (this.room.activeUsers.length < 8) {
            this.room.activeUsers.push(newUser);
            this.redistributeButtons();
            return {
                buttons: newUser.assignedButtons,
                position: 'active',
                waitingCount: this.room.waitingUsers.length
            };
        } else {
            this.room.waitingUsers.push(newUser);
            return {
                buttons: [],
                position: 'waiting',
                waitingCount: this.room.waitingUsers.length
            };
        }
    }

    public removeUser(userId: string) {
        this.room.activeUsers = this.room.activeUsers.filter(u => u.id !== userId);
        this.room.waitingUsers = this.room.waitingUsers.filter(u => u.id !== userId);
        this.redistributeButtons();
    }

    public canUseButton(userId: string, buttonId: number): boolean {
        const user = this.room.activeUsers.find(u => u.id === userId);
        return user ? user.assignedButtons.includes(buttonId) : false;
    }

    public getTimeUntilNextRotation(): number {
        return this.room.rotationIntervalMs - (Date.now() - this.room.lastRotationTime);
    }

    private notifyUsersOfChanges: (data: any) => void = () => {};

    public setNotifyCallback(callback: (data: any) => void) {
        this.notifyUsersOfChanges = callback;
    }

    public getState(): Room {
        return this.room;
    }

    public getActiveUsers(): { id: string, assignedButtons: number[] }[] {
        return this.room.activeUsers.map(user => ({
            id: user.id,
            assignedButtons: user.assignedButtons
        }));
    }
}
