const roomService = require('../services/roomService');
const Logger = require('../utils/logger');

const roomController = {
  async healthCheck(req, res) {
    Logger.log('[RoomController] Health check requested');
    res.status(200).json({ status: 'ok' });
  },

  async createRoom(req, res) {
    const { name, createdBy } = req.body;
    Logger.log(`[RoomController] Create room request: name=${name}, createdBy=${createdBy}`);
    
    if (!createdBy) {
      Logger.log('[RoomController] Create room failed: createdBy is required');
      return res.status(400).json({ error: 'createdBy is required' });
    }

    try {
      const room = await roomService.createRoom(name, createdBy);
      Logger.log(`[RoomController] Room created successfully: id=${room.id}`);
      res.status(201).json(room);
    } catch (error) {
      Logger.error(`[RoomController] Failed to create room: error=${error.message}`);
      res.status(500).json({ error: 'Failed to create room' });
    }
  },

  async getRoom(req, res) {
    const { roomId } = req.params;
    Logger.log(`[RoomController] Get room request: id=${roomId}`);
    
    if (!roomId || roomId.length < 6) {
      Logger.log(`[RoomController] Get room failed: Invalid room ID: ${roomId}`);
      return res.status(400).json({ error: 'Invalid room ID' });
    }

    try {
      const room = await roomService.getRoom(roomId);
      if (!room) {
        Logger.log(`[RoomController] Room not found: id=${roomId}`);
        return res.status(404).json({ error: 'Room not found' });
      }
      Logger.log(`[RoomController] Room retrieved successfully: id=${roomId}`);
      res.json(room);
    } catch (error) {
      Logger.error(`[RoomController] Failed to retrieve room: id=${roomId}, error=${error.message}`);
      res.status(500).json({ error: 'Failed to retrieve room' });
    }
  }
};

module.exports = roomController; 