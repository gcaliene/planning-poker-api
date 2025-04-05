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
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
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