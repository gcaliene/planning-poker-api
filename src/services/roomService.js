const mongoose = require('mongoose');
const Room = require('../models/RoomSchema');
const { v4: uuidv4 } = require('uuid');

class RoomService {
  async createRoom(name, createdBy) {
    console.log(`[RoomService] Creating new room: name=${name}, createdBy=${createdBy}`);
    const room = new Room({
      id: uuidv4(),
      name: name || 'New Planning Poker Room',
      createdBy,
      participants: [],
      votes: new Map(),
      revealed: false
    });
    const savedRoom = await room.save();
    console.log(`[RoomService] Room created successfully: id=${savedRoom.id}`);
    return savedRoom;
  }

  async getRoom(roomId) {
    console.log(`[RoomService] Fetching room: id=${roomId}`);
    const room = await Room.findOne({ id: roomId });
    if (!room) {
      console.log(`[RoomService] Room not found: id=${roomId}`);
    }
    return room;
  }

  async addParticipant(roomId, user) {
    console.log(`[RoomService] Adding participant to room: roomId=${roomId}, userId=${user.id}, userName=${user.name}`);
    const room = await this.getRoom(roomId);
    if (!room) {
      console.log(`[RoomService] Failed to add participant: Room not found: id=${roomId}`);
      return null;
    }

    const added = room.addParticipant(user);
    if (added) {
      console.log(`[RoomService] Participant added successfully: roomId=${roomId}, userId=${user.id}`);
      await room.save();
    } else {
      console.log(`[RoomService] Participant already exists: roomId=${roomId}, userId=${user.id}`);
    }
    return room;
  }

  async removeParticipant(roomId, userId) {
    console.log(`[RoomService] Removing participant from room: roomId=${roomId}, userId=${userId}`);
    const room = await this.getRoom(roomId);
    if (!room) {
      console.log(`[RoomService] Failed to remove participant: Room not found: id=${roomId}`);
      return null;
    }

    const isEmpty = room.removeParticipant(userId);
    if (isEmpty) {
      console.log(`[RoomService] Room is empty, deleting: id=${roomId}`);
      await Room.deleteOne({ _id: room._id });
      return null;
    }

    console.log(`[RoomService] Participant removed successfully: roomId=${roomId}, userId=${userId}`);
    await room.save();
    return room;
  }

  async submitVote(roomId, userId, vote) {
    console.log(`[RoomService] Submitting vote: roomId=${roomId}, userId=${userId}, vote=${vote}`);
    const room = await this.getRoom(roomId);
    if (!room) {
      console.log(`[RoomService] Failed to submit vote: Room not found: id=${roomId}`);
      return null;
    }

    room.submitVote(userId, vote);
    console.log(`[RoomService] Vote submitted successfully: roomId=${roomId}, userId=${userId}`);
    await room.save();
    return room;
  }

  async revealVotes(roomId) {
    console.log(`[RoomService] Revealing votes for room: id=${roomId}`);
    const room = await this.getRoom(roomId);
    if (!room) {
      console.log(`[RoomService] Failed to reveal votes: Room not found: id=${roomId}`);
      return null;
    }

    const votes = room.revealVotes();
    console.log(`[RoomService] Votes revealed: roomId=${roomId}, votes=${JSON.stringify(votes)}`);
    await room.save();
    return votes;
  }

  async resetVoting(roomId, nextStory = null) {
    console.log(`[RoomService] Resetting voting for room: id=${roomId}, nextStory=${nextStory || 'not specified'}`);
    const room = await this.getRoom(roomId);
    if (!room) {
      console.log(`[RoomService] Failed to reset voting: Room not found: id=${roomId}`);
      return null;
    }
    
    room.resetVoting(nextStory);
    console.log(`[RoomService] Voting reset successfully: roomId=${roomId}`);
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