const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'voting', 'completed', 'skipped'],
    default: 'pending'
  },
  points: { type: Number, default: null },
  createdAt: { type: Date, default: Date.now }
});

const roomSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  createdBy: { type: String, required: true },
  participants: [storySchema],
  currentStory: { type: String, default: null },
  votes: { type: Map, of: Number, default: {} },
  revealed: { type: Boolean, default: false },
  stories: [storySchema],
  createdAt: { type: Date, default: Date.now }
});

// Add methods to match our current Room class
roomSchema.methods.addParticipant = function(user) {
  if (!this.participants.some(p => p.id === user.id)) {
    this.participants.push(user);
    return true;
  }
  return false;
};

roomSchema.methods.removeParticipant = function(userId) {
  this.participants = this.participants.filter(p => p.id !== userId);
  if (this.votes.has(userId)) {
    this.votes.delete(userId);
  }
  return this.participants.length === 0;
};

roomSchema.methods.submitVote = function(userId, vote) {
  this.votes.set(userId, vote);
};

roomSchema.methods.revealVotes = function() {
  this.revealed = true;
  return Object.fromEntries(this.votes);
};

roomSchema.methods.resetVoting = function(nextStory = null) {
  this.votes = new Map();
  this.revealed = false;
  if (nextStory) {
    this.currentStory = nextStory;
  }
};

roomSchema.methods.getPublicVotes = function() {
  if (this.revealed) {
    return Object.fromEntries(this.votes);
  }
  return Array.from(this.votes.keys()).reduce((acc, id) => {
    acc[id] = this.votes.get(id) ? '✓' : null;
    return acc;
  }, {});
};

// Add a story to the room
roomSchema.methods.addStory = function(title) {
  const story = {
    id: require('uuid').v4(),
    title,
    status: 'pending',
    points: null
  };
  this.stories.push(story);
  return story;
};

// Update story status
roomSchema.methods.updateStoryStatus = function(storyId, status) {
  const story = this.stories.find(s => s.id === storyId);
  if (story) {
    story.status = status;
    if (status === 'completed') {
      // Calculate average points from all votes
      const votes = Array.from(this.votes.values());
      if (votes.length > 0) {
        const sum = votes.reduce((acc, vote) => acc + vote, 0);
        story.points = Math.round(sum / votes.length);
      } else {
        story.points = null;
      }
    }
    return story;
  }
  return null;
};

// Skip a story
roomSchema.methods.skipStory = function(storyId) {
  return this.updateStoryStatus(storyId, 'skipped');
};

// Complete a story with points
roomSchema.methods.completeStory = function(storyId) {
  return this.updateStoryStatus(storyId, 'completed');
};

// Get current story
roomSchema.methods.getCurrentStory = function() {
  return this.stories.find(story => story.status === 'voting');
};

// Start voting on a story
roomSchema.methods.startVoting = function(storyId) {
  const story = this.stories.find(s => s.id === storyId);
  if (story) {
    // Reset any other voting stories
    this.stories.forEach(s => {
      if (s.status === 'voting') {
        s.status = 'pending';
      }
    });
    story.status = 'voting';
    this.currentStory = storyId;
    this.votes.clear();
    this.revealed = false;
    return story;
  }
  return null;
};

// Static method to find room by ID
roomSchema.statics.findByRoomId = function(roomId) {
  return this.findOne({ id: roomId });
};

const Room = mongoose.model('Room', roomSchema);

module.exports = Room; 