const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

// Initialize Express
const app = express();
const server = http.createServer(app);

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// In-memory data store (replace with a database in production)
const rooms = new Map();

// API Routes
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Room operations
app.post('/api/rooms', (req, res) => {
  const roomId = generateRoomId();
  const { name, createdBy } = req.body;
  
  rooms.set(roomId, {
    id: roomId,
    name: name || `Room ${roomId}`,
    createdBy,
    participants: [],
    currentStory: null,
    votes: {},
    revealed: false,
    createdAt: new Date().toISOString()
  });
  
  res.status(201).json({ roomId, room: rooms.get(roomId) });
});

app.get('/api/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = rooms.get(roomId);
  
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  res.status(200).json(room);
});

// Socket.io events
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Join room
  socket.on('join-room', ({ roomId, user }) => {
    const room = rooms.get(roomId);
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    
    socket.join(roomId);
    
    // Add user to room if not already present
    if (!room.participants.some(p => p.id === user.id)) {
      room.participants.push(user);
    }
    
    // Notify all clients in the room
    io.to(roomId).emit('room-update', room);
    
    console.log(`${user.name} joined room ${roomId}`);
  });
  
  // Submit vote
  socket.on('submit-vote', ({ roomId, userId, vote }) => {
    const room = rooms.get(roomId);
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    
    // Record the vote
    room.votes[userId] = vote;
    
    // Notify all clients in the room (votes are hidden until reveal)
    const updatedRoom = { ...room, votes: room.revealed ? room.votes : Object.keys(room.votes).reduce((acc, id) => {
      acc[id] = room.votes[id] ? '✓' : null;
      return acc;
    }, {}) };
    
    io.to(roomId).emit('room-update', updatedRoom);
  });
  
  // Reveal votes
  socket.on('reveal-votes', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    
    room.revealed = true;
    
    // Notify all clients in the room
    io.to(roomId).emit('room-update', room);
    io.to(roomId).emit('votes-revealed', room.votes);
  });
  
  // Reset voting
  socket.on('reset-voting', ({ roomId, nextStory }) => {
    const room = rooms.get(roomId);
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    
    room.votes = {};
    room.revealed = false;
    if (nextStory) {
      room.currentStory = nextStory;
    }
    
    // Notify all clients in the room
    io.to(roomId).emit('room-update', room);
  });
  
  // Leave room
  socket.on('leave-room', ({ roomId, userId }) => {
    const room = rooms.get(roomId);
    if (room) {
      room.participants = room.participants.filter(p => p.id !== userId);
      
      // Remove the room if empty
      if (room.participants.length === 0) {
        rooms.delete(roomId);
      } else {
        // Remove user's vote
        if (room.votes[userId]) {
          delete room.votes[userId];
        }
        
        // Notify remaining clients
        io.to(roomId).emit('room-update', room);
      }
    }
    
    socket.leave(roomId);
  });
  
  // Disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Handle any cleanup - this would need to track which rooms the socket is in
  });
});

// Helper function to generate a unique room ID
function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Start the server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 