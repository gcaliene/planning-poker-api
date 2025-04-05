const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true }
});

const roomSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  createdBy: { type: String, required: true },
  participants: [participantSchema],
  currentStory: { type: String, default: null },
  votes: { type: Map, of: Number, default: {} },
  revealed: { type: Boolean, default: false },
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

const Room = mongoose.model('Room', roomSchema);

module.exports = Room; 