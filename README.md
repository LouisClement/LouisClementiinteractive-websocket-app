# Interactive WebSocket Room

A real-time interactive web application built with React, TypeScript, and Socket.IO. This application manages a room of users with features like:

- Real-time user connection management
- Support for up to 8 active users
- Waiting queue for additional users
- Interactive button system
- Automatic user timeout after 5 minutes of inactivity

## Tech Stack

- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + Socket.IO
- Development: Concurrently for running multiple servers

## Getting Started

1. Clone the repository:
```bash
git clone <your-repo-url>
cd interactive-websocket-app
```

2. Install dependencies:
```bash
npm install
cd server && npm install && cd ..
```

3. Start the development servers:
```bash
npm run dev:all
```

This will start both the frontend (http://localhost:5173) and backend (http://localhost:3000) servers.

## Project Structure

```
├── src/                # Frontend source files
│   ├── components/     # React components
│   ├── hooks/         # Custom React hooks
│   ├── services/      # Service layer (Socket.IO)
│   └── types/         # TypeScript type definitions
├── server/            # Backend source files
│   ├── src/           # Server source code
│   └── package.json   # Server dependencies
└── package.json       # Frontend dependencies
```

## Features

- **User Management**: Automatically handles user connections and disconnections
- **Room System**: Maintains active users and a waiting queue
- **Real-time Updates**: All state changes are immediately broadcast to all connected clients
- **Timeout System**: Inactive users are automatically removed after 5 minutes
