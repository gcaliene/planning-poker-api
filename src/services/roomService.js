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

  async addStory(roomId, title, userId) {
    console.log(`[RoomService] Adding story: roomId=${roomId}, title=${title}, userId=${userId}`);
    const room = await this.getRoom(roomId);
    if (!room) {
      console.log(`[RoomService] Failed to add story: Room not found: id=${roomId}`);
      return null;
    }

    // Only room creator can add stories
    if (room.createdBy !== userId) {
      console.log(`[RoomService] Failed to add story: User not authorized: userId=${userId}`);
      return null;
    }

    const story = room.addStory(title);
    console.log(`[RoomService] Story added successfully: roomId=${roomId}, storyId=${story.id}`);
    await room.save();
    return story;
  }

  async startVoting(roomId, storyId, userId) {
    console.log(`[RoomService] Starting voting: roomId=${roomId}, storyId=${storyId}, userId=${userId}`);
    const room = await this.getRoom(roomId);
    if (!room) {
      console.error(`[RoomService] Failed to start voting: Room not found: id=${roomId}`);
      return null;
    }

    // Only room creator can start voting
    if (room.createdBy !== userId) {
      console.warn(`[RoomService] Failed to start voting: User not authorized: userId=${userId}`);
      return null;
    }

    const story = room.startVoting(storyId);
    if (!story) {
      console.error(`[RoomService] Failed to start voting: Story not found: storyId=${storyId}`);
      return null;
    }

    console.log(`[RoomService] Voting started successfully: roomId=${roomId}, storyId=${storyId}`);
    await room.save();
    return story;
  }

  async completeStory(roomId, storyId, userId) {
    console.log(`[RoomService] Completing story: roomId=${roomId}, storyId=${storyId}, userId=${userId}`);
    const room = await this.getRoom(roomId);
    if (!room) {
      console.error(`[RoomService] Failed to complete story: Room not found: id=${roomId}`);
      return null;
    }

    // Only room creator can complete stories
    if (room.createdBy !== userId) {
      console.warn(`[RoomService] Failed to complete story: User not authorized: userId=${userId}`);
      return null;
    }

    const story = room.completeStory(storyId);
    if (!story) {
      console.error(`[RoomService] Failed to complete story: Story not found: storyId=${storyId}`);
      return null;
    }

    console.log(`[RoomService] Story completed successfully: roomId=${roomId}, storyId=${storyId}`);
    await room.save();
    return story;
  }

  async skipStory(roomId, storyId, userId) {
    console.log(`[RoomService] Skipping story: roomId=${roomId}, storyId=${storyId}, userId=${userId}`);
    const room = await this.getRoom(roomId);
    if (!room) {
      console.log(`[RoomService] Failed to skip story: Room not found: id=${roomId}`);
      return null;
    }

    // Only room creator can skip stories
    if (room.createdBy !== userId) {
      console.log(`[RoomService] Failed to skip story: User not authorized: userId=${userId}`);
      return null;
    }

    const story = room.skipStory(storyId);
    if (!story) {
      console.log(`[RoomService] Failed to skip story: Story not found: storyId=${storyId}`);
      return null;
    }

    console.log(`[RoomService] Story skipped successfully: roomId=${roomId}, storyId=${storyId}`);
    await room.save();
    return story;
  }
}

module.exports = new RoomService(); 