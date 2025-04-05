class Room {
  constructor(id, name, createdBy) {
    this.id = id;
    this.name = name || `Room ${id}`;
    this.createdBy = createdBy;
    this.participants = [];
    this.currentStory = null;
    this.votes = {};
    this.revealed = false;
    this.createdAt = new Date().toISOString();
  }

  addParticipant(user) {
    if (!this.participants.some(p => p.id === user.id)) {
      this.participants.push(user);
      return true;
    }
    return false;
  }

  removeParticipant(userId) {
    this.participants = this.participants.filter(p => p.id !== userId);
    if (this.votes[userId]) {
      delete this.votes[userId];
    }
    return this.participants.length === 0;
  }

  submitVote(userId, vote) {
    this.votes[userId] = vote;
  }

  revealVotes() {
    this.revealed = true;
    return this.votes;
  }

  resetVoting(nextStory = null) {
    this.votes = {};
    this.revealed = false;
    if (nextStory) {
      this.currentStory = nextStory;
    }
  }

  getPublicVotes() {
    if (this.revealed) {
      return this.votes;
    }
    return Object.keys(this.votes).reduce((acc, id) => {
      acc[id] = this.votes[id] ? '✓' : null;
      return acc;
    }, {});
  }
}

module.exports = Room; 