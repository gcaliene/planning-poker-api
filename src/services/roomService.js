const mongoose = require('mongoose');
const Room = require('../models/RoomSchema');
const { v4: uuidv4 } = require('uuid');
const Logger = require('../utils/logger');

class RoomService {
  async createRoom(name, createdBy) {
    Logger.log(`[RoomService] Creating new room: name=${name}, createdBy=${createdBy}`);
    const room = new Room({
      id: uuidv4(),
      name: name || 'New Planning Poker Room',
      createdBy,
      participants: [],
      votes: new Map(),
      revealed: false
    });
    const savedRoom = await room.save();
    Logger.log(`[RoomService] Room created successfully: id=${savedRoom.id}`);
    return savedRoom;
  }

  async getRoom(roomId) {
    Logger.log(`[RoomService] Fetching room: id=${roomId}`);
    const room = await Room.findOne({ id: roomId });
    if (!room) {
      Logger.log(`[RoomService] Room not found: id=${roomId}`);
    }
    return room;
  }

  async addParticipant(roomId, user) {
    Logger.log(`[RoomService] Adding participant to room: roomId=${roomId}, userId=${user.id}, userName=${user.name}`);
    const room = await this.getRoom(roomId);
    if (!room) {
      Logger.log(`[RoomService] Failed to add participant: Room not found: id=${roomId}`);
      return null;
    }

    const added = room.addParticipant(user);
    if (added) {
      room.lastActivity = new Date();
      Logger.log(`[RoomService] Participant added successfully: roomId=${roomId}, userId=${user.id}`);
      await room.save();
    } else {
      Logger.log(`[RoomService] Participant already exists: roomId=${roomId}, userId=${user.id}`);
    }
    return room;
  }

  async removeParticipant(roomId, userId) {
    Logger.log(`[RoomService] Removing participant from room: roomId=${roomId}, userId=${userId}`);
    const room = await this.getRoom(roomId);
    if (!room) {
      Logger.log(`[RoomService] Failed to remove participant: Room not found: id=${roomId}`);
      return null;
    }

    const isEmpty = room.removeParticipant(userId);
    if (isEmpty) {
      Logger.log(`[RoomService] Room is empty, deleting: id=${roomId}`);
      await Room.deleteOne({ _id: room._id });
      return null;
    }

    room.lastActivity = new Date();
    Logger.log(`[RoomService] Participant removed successfully: roomId=${roomId}, userId=${userId}`);
    await room.save();
    return room;
  }

  async submitVote(roomId, userId, vote) {
    Logger.log(`[RoomService] Submitting vote: roomId=${roomId}, userId=${userId}, vote=${vote}`);
    const room = await this.getRoom(roomId);
    if (!room) {
      Logger.log(`[RoomService] Failed to submit vote: Room not found: id=${roomId}`);
      return null;
    }

    room.submitVote(userId, vote);
    room.lastActivity = new Date();
    Logger.log(`[RoomService] Vote submitted successfully: roomId=${roomId}, userId=${userId}`);
    await room.save();
    return room;
  }

  async revealVotes(roomId) {
    Logger.log(`[RoomService] Revealing votes for room: id=${roomId}`);
    const room = await this.getRoom(roomId);
    if (!room) {
      Logger.log(`[RoomService] Failed to reveal votes: Room not found: id=${roomId}`);
      return null;
    }

    const votes = room.revealVotes();
    Logger.log(`[RoomService] Votes revealed: roomId=${roomId}, votes=${JSON.stringify(votes)}`);
    await room.save();
    return votes;
  }

  async resetVoting(roomId, nextStory = null) {
    Logger.log(`[RoomService] Resetting voting for room: id=${roomId}, nextStory=${nextStory || 'not specified'}`);
    const room = await this.getRoom(roomId);
    if (!room) {
      Logger.log(`[RoomService] Failed to reset voting: Room not found: id=${roomId}`);
      return null;
    }
    
    room.resetVoting(nextStory);
    Logger.log(`[RoomService] Voting reset successfully: roomId=${roomId}`);
    await room.save();
    return room;
  }

  async getPublicVotes(roomId) {
    const room = await this.getRoom(roomId);
    if (!room) return null;
    
    return room.getPublicVotes();
  }

  async addStory(roomId, title, userId) {
    Logger.log(`[RoomService] Adding story: roomId=${roomId}, title=${title}, userId=${userId}`);
    const room = await this.getRoom(roomId);
    if (!room) {
      Logger.log(`[RoomService] Failed to add story: Room not found: id=${roomId}`);
      return null;
    }

    // Only room creator can add stories
    if (room.createdBy !== userId) {
      Logger.log(`[RoomService] Failed to add story: User not authorized: userId=${userId}`);
      return null;
    }

    const story = room.addStory(title);
    room.lastActivity = new Date();
    room.lastStoryAdded = new Date();
    Logger.log(`[RoomService] Story added successfully: roomId=${roomId}, storyId=${story.id}`);
    await room.save();
    return story;
  }

  async startVoting(roomId, storyId, userId) {
    Logger.log(`[RoomService] Starting voting: roomId=${roomId}, storyId=${storyId}, userId=${userId}`);
    const room = await this.getRoom(roomId);
    if (!room) {
      Logger.error(`[RoomService] Failed to start voting: Room not found: id=${roomId}`);
      return null;
    }

    // Only room creator can start voting
    if (room.createdBy !== userId) {
      Logger.warn(`[RoomService] Failed to start voting: User not authorized: userId=${userId}`);
      return null;
    }

    const story = room.startVoting(storyId);
    if (!story) {
      Logger.error(`[RoomService] Failed to start voting: Story not found: storyId=${storyId}`);
      return null;
    }

    Logger.log(`[RoomService] Voting started successfully: roomId=${roomId}, storyId=${storyId}`);
    await room.save();
    return story;
  }

  async completeStory(roomId, storyId, userId) {
    Logger.log(`[RoomService] Completing story: roomId=${roomId}, storyId=${storyId}, userId=${userId}`);
    const room = await this.getRoom(roomId);
    if (!room) {
      Logger.error(`[RoomService] Failed to complete story: Room not found: id=${roomId}`);
      return null;
    }

    // Only room creator can complete stories
    if (room.createdBy !== userId) {
      Logger.warn(`[RoomService] Failed to complete story: User not authorized: userId=${userId}`);
      return null;
    }

    const story = room.completeStory(storyId);
    if (!story) {
      Logger.error(`[RoomService] Failed to complete story: Story not found: storyId=${storyId}`);
      return null;
    }

    Logger.log(`[RoomService] Story completed successfully: roomId=${roomId}, storyId=${storyId}`);
    await room.save();
    return story;
  }

  async skipStory(roomId, storyId, userId) {
    Logger.log(`[RoomService] Skipping story: roomId=${roomId}, storyId=${storyId}, userId=${userId}`);
    const room = await this.getRoom(roomId);
    if (!room) {
      Logger.log(`[RoomService] Failed to skip story: Room not found: id=${roomId}`);
      return null;
    }

    // Only room creator can skip stories
    if (room.createdBy !== userId) {
      Logger.log(`[RoomService] Failed to skip story: User not authorized: userId=${userId}`);
      return null;
    }

    const story = room.skipStory(storyId);
    if (!story) {
      Logger.log(`[RoomService] Failed to skip story: Story not found: storyId=${storyId}`);
      return null;
    }

    Logger.log(`[RoomService] Story skipped successfully: roomId=${roomId}, storyId=${storyId}`);
    await room.save();
    return story;
  }

  async deleteStory(roomId, storyId, userId) {
    console.log(`[RoomService] Deleting story: roomId=${roomId}, storyId=${storyId}, userId=${userId}`);
    const room = await this.getRoom(roomId);
    if (!room) {
      console.log(`[RoomService] Failed to delete story: Room not found: id=${roomId}`);
      return null;
    }

    // Only room creator can delete stories
    if (room.createdBy !== userId) {
      console.log(`[RoomService] Failed to delete story: User not authorized: userId=${userId}`);
      return null;
    }

    const deletedStory = room.deleteStory(storyId);
    if (!deletedStory) {
      console.log(`[RoomService] Failed to delete story: Story not found: storyId=${storyId}`);
      return null;
    }

    console.log(`[RoomService] Story deleted successfully: roomId=${roomId}, storyId=${storyId}`);
    await room.save();
    return deletedStory;
  }
}

module.exports = new RoomService(); 