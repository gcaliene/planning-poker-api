require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const database = require('./config/database');
const roomRoutes = require('./routes/roomRoutes');
const { handleConnection } = require('./services/socketService');

const app = express();
const server = http.createServer(app);

// Configure CORS for Express
app.use(cors({
  origin: 'http://localhost:3001',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

// Configure Socket.IO with CORS
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3001',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(express.json());

// Routes
app.use('/api', roomRoutes);

// Socket.io connection handler
io.on('connection', (socket) => {
  handleConnection(socket, io);
});

// Connect to MongoDB
database.connectDB()
  .then(() => {
    // Start the server
    const PORT = process.env.PORT || 4000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });

module.exports = {
  app,
  server,
  io
}; 