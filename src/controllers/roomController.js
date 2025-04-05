const roomService = require('../services/roomService');

const roomController = {
  async healthCheck(req, res) {
    res.status(200).json({ status: 'ok' });
  },

  async createRoom(req, res) {
    const { name, createdBy } = req.body;
    
    if (!createdBy) {
      return res.status(400).json({ error: 'createdBy is required' });
    }

    try {
      const room = await roomService.createRoom(name, createdBy);
      res.status(201).json(room);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create room' });
    }
  },

  async getRoom(req, res) {
    const { roomId } = req.params;
    
    if (!roomId || roomId.length < 6) {
      return res.status(400).json({ error: 'Invalid room ID' });
    }

    try {
      const room = await roomService.getRoom(roomId);
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }
      res.json(room);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve room' });
    }
  }
};

module.exports = roomController; 