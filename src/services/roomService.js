const mongoose = require('mongoose');
const Room = require('../models/RoomSchema');
const { v4: uuidv4 } = require('uuid');

class RoomService {
  async createRoom(name, createdBy) {
    const room = new Room({
      id: uuidv4(),
      name: name || 'New Planning Poker Room',
      createdBy,
      participants: [],
      votes: new Map(),
      revealed: false
    });
    return await room.save();
  }

  async getRoom(roomId) {
    return await Room.findOne({ id: roomId });
  }

  async addParticipant(roomId, user) {
    const room = await this.getRoom(roomId);
    if (!room) return null;
    
    const added = room.addParticipant(user);
    if (added) {
      await room.save();
    }
    return room;
  }

  async removeParticipant(roomId, userId) {
    const room = await this.getRoom(roomId);
    if (!room) return null;
    
    const isEmpty = room.removeParticipant(userId);
    if (isEmpty) {
      await Room.deleteOne({ _id: room._id });
      return null;
    }
    await room.save();
    return room;
  }

  async submitVote(roomId, userId, vote) {
    const room = await this.getRoom(roomId);
    if (!room) return null;
    
    room.submitVote(userId, vote);
    await room.save();
    return room;
  }

  async revealVotes(roomId) {
    const room = await this.getRoom(roomId);
    if (!room) return null;
    
    const votes = room.revealVotes();
    await room.save();
    return votes;
  }

  async resetVoting(roomId, nextStory = null) {
    const room = await this.getRoom(roomId);
    if (!room) return null;
    
    room.resetVoting(nextStory);
    await room.save();
    return room;
  }

  async getPublicVotes(roomId) {
    const room = await this.getRoom(roomId);
    if (!room) return null;
    
    return room.getPublicVotes();
  }
}

module.exports = new RoomService(); 