const roomService = require('../services/roomService');

const roomController = {
  createRoom: (req, res) => {
    const { name, createdBy } = req.body;

    if (!createdBy) {
      return res.status(400).json({ error: 'createdBy is required' });
    }

    const { roomId, room } = roomService.createRoom(name, createdBy);
    res.status(201).json({ roomId, room });
  },

  getRoom: (req, res) => {
    const { roomId } = req.params;
    
    if (!roomId || roomId.length < 6) {
      return res.status(400).json({ error: 'Invalid room ID' });
    }

    const room = roomService.getRoom(roomId);
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    res.status(200).json(room);
  },

  healthCheck: (req, res) => {
    res.status(200).json({ status: 'ok' });
  }
};

module.exports = roomController; 