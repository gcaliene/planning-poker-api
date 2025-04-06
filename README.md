# Planning Poker API

A real-time planning poker API built with Node.js, Express, Socket.io, and MongoDB.

## Features

- Create and manage planning poker rooms
- Real-time voting with Socket.io
- Persistent storage with MongoDB
- RESTful API endpoints
- Comprehensive test coverage

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/planning-poker-api.git
cd planning-poker-api
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
PORT=3000
CORS_ORIGIN=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/planning-poker
```

## Running the Application

1. Start MongoDB:
```bash
mongod
```

2. Start the development server:
```bash
npm run dev
```

3. Start the production server:
```bash
npm start
```

## Testing

Run the tests with coverage:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## API Endpoints

### Health Check
- `GET /api/health`
  - Returns: `{ status: 'ok' }`

### Rooms
- `POST /api/rooms`
  - Request body: `{ name: string, createdBy: string }`
  - Returns: Created room object

- `GET /api/rooms/:roomId`
  - Returns: Room details

## Socket Events

### Client to Server
- `join-room`: Join a planning poker room
  - Data: `{ roomId: string, user: { id: string, name: string } }`

- `submit-vote`: Submit a vote
  - Data: `{ roomId: string, userId: string, vote: number }`

- `reveal-votes`: Reveal all votes
  - Data: `{ roomId: string }`

- `reset-voting`: Reset voting for the next story
  - Data: `{ roomId: string, nextStory?: string }`

- `leave-room`: Leave a room
  - Data: `{ roomId: string, userId: string }`

### Server to Client
- `room-update`: Room state update
  - Data: Updated room object

- `votes-revealed`: Votes have been revealed
  - Data: Object containing all votes

- `error`: Error occurred
  - Data: `{ message: string }`

## Database Schema

### Room
```typescript
{
  id: string;
  name: string;
  createdBy: string;
  participants: Array<{
    id: string;
    name: string;
  }>;
  currentStory: string | null;
  votes: Map<string, number>;
  revealed: boolean;
  createdAt: Date;
}
```

## License

MIT 