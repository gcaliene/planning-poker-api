const Room = require('../models/Room');

class RoomService {
  constructor() {
    this.rooms = new Map();
  }

  createRoom(name, createdBy) {
    const roomId = this.generateRoomId();
    const room = new Room(roomId, name, createdBy);
    this.rooms.set(roomId, room);
    return { roomId, room };
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  deleteRoom(roomId) {
    return this.rooms.delete(roomId);
  }

  addParticipant(roomId, user) {
    const room = this.getRoom(roomId);
    if (!room) return null;
    room.addParticipant(user);
    return room;
  }

  removeParticipant(roomId, userId) {
    const room = this.getRoom(roomId);
    if (!room) return null;
    const shouldDelete = room.removeParticipant(userId);
    if (shouldDelete) {
      this.deleteRoom(roomId);
    }
    return room;
  }

  submitVote(roomId, userId, vote) {
    const room = this.getRoom(roomId);
    if (!room) return null;
    room.submitVote(userId, vote);
    return room;
  }

  revealVotes(roomId) {
    const room = this.getRoom(roomId);
    if (!room) return null;
    const votes = room.revealVotes();
    return { room, votes };
  }

  resetVoting(roomId, nextStory) {
    const room = this.getRoom(roomId);
    if (!room) return null;
    room.resetVoting(nextStory);
    return room;
  }

  generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
}

module.exports = new RoomService(); 