# Planning Poker API

A real-time planning poker application API built with Express and Socket.io.

## Features

- Create and join planning poker rooms
- Real-time voting and vote revealing
- Multiple participants support
- Room management (join, leave, reset)

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=4000
   FRONTEND_URL=http://localhost:3000
   ```

## Running the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on port 4000 by default.

## API Endpoints

- `GET /api/health` - Health check endpoint
- `POST /api/rooms` - Create a new room
- `GET /api/rooms/:roomId` - Get room details

## Socket Events

- `join-room` - Join a planning poker room
- `submit-vote` - Submit a vote for the current story
- `reveal-votes` - Reveal all votes in the room
- `reset-voting` - Reset voting for the next story
- `leave-room` - Leave the current room

## Environment Variables

- `PORT` - Port number for the server (default: 4000)
- `FRONTEND_URL` - URL of the frontend application (default: http://localhost:3000) 