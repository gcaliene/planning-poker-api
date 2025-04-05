const roomService = require('../services/roomService');

const roomController = {
  createRoom: (req, res) => {
    const { name, createdBy } = req.body;
    const { roomId, room } = roomService.createRoom(name, createdBy);
    res.status(201).json({ roomId, room });
  },

  getRoom: (req, res) => {
    const { roomId } = req.params;
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