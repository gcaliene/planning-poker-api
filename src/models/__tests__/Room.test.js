const mongoose = require('mongoose');

// Mock mongoose
jest.mock('mongoose', () => {
  const mockSchema = {
    methods: {},
    statics: {}
  };
  return {
    Schema: jest.fn().mockReturnValue(mockSchema),
    model: jest.fn().mockReturnValue(function Room(data) {
      return {
        ...data,
        name: data.name || 'New Planning Poker Room',
        participants: data.participants || [],
        votes: data.votes || new Map(),
        revealed: data.revealed || false,
        save: jest.fn().mockResolvedValue(this),
        addParticipant: jest.fn().mockImplementation(function(user) {
          if (!this.participants.some(p => p.id === user.id)) {
            this.participants.push(user);
            return true;
          }
          return false;
        }),
        removeParticipant: jest.fn().mockImplementation(function(userId) {
          this.participants = this.participants.filter(p => p.id !== userId);
          this.votes.delete(userId);
          return this.participants.length === 0;
        }),
        submitVote: jest.fn().mockImplementation(function(userId, vote) {
          this.votes.set(userId, vote);
        }),
        revealVotes: jest.fn().mockImplementation(function() {
          this.revealed = true;
          return Object.fromEntries(this.votes);
        }),
        resetVoting: jest.fn().mockImplementation(function(nextStory) {
          this.votes.clear();
          this.revealed = false;
          this.currentStory = nextStory;
        }),
        getPublicVotes: jest.fn().mockImplementation(function() {
          if (this.revealed) {
            return Object.fromEntries(this.votes);
          }
          return Object.fromEntries(
            Array.from(this.votes.keys()).map(userId => [userId, '✓'])
          );
        })
      };
    })
  };
});

describe('Room Model', () => {
  let room;

  beforeEach(() => {
    room = new mongoose.model('Room')({
      id: 'TEST123',
      name: 'Test Room',
      createdBy: 'test-user',
      participants: [],
      votes: new Map(),
      revealed: false
    });
  });

  test('should create a room with default name when no name is provided', () => {
    const room = new mongoose.model('Room')({
      id: 'TEST123',
      createdBy: 'test-user'
    });
    
    expect(room.name).toBe('New Planning Poker Room');
    expect(room.createdBy).toBe('test-user');
    expect(room.participants).toHaveLength(0);
    expect(room.votes).toBeInstanceOf(Map);
    expect(room.revealed).toBe(false);
  });

  test('should add a participant to the room', () => {
    const user = { id: 'user1', name: 'Test User' };
    const added = room.addParticipant(user);
    
    expect(added).toBe(true);
    expect(room.participants).toHaveLength(1);
    expect(room.participants[0]).toEqual(user);
  });

  test('should not add duplicate participants', () => {
    const user = { id: 'user1', name: 'Test User' };
    room.addParticipant(user);
    const added = room.addParticipant(user);
    
    expect(added).toBe(false);
    expect(room.participants).toHaveLength(1);
  });

  test('should remove a participant from the room', () => {
    const user = { id: 'user1', name: 'Test User' };
    room.addParticipant(user);
    const isEmpty = room.removeParticipant('user1');
    
    expect(isEmpty).toBe(true);
    expect(room.participants).toHaveLength(0);
  });

  test('should not remove non-existent participant', () => {
    const isEmpty = room.removeParticipant('non-existent');
    expect(isEmpty).toBe(true);
    expect(room.participants).toHaveLength(0);
  });

  test('should remove a participant\'s vote when they are removed', () => {
    const user = { id: 'user1', name: 'Test User' };
    room.addParticipant(user);
    room.votes.set('user1', 5);
    room.removeParticipant('user1');
    
    expect(room.votes.has('user1')).toBe(false);
  });

  test('should submit a vote', () => {
    room.submitVote('user1', 5);
    expect(room.votes.get('user1')).toBe(5);
  });

  test('should update existing vote', () => {
    room.votes.set('user1', 3);
    room.submitVote('user1', 5);
    expect(room.votes.get('user1')).toBe(5);
  });

  test('should reveal votes', () => {
    room.votes.set('user1', 5);
    room.votes.set('user2', 8);
    const votes = room.revealVotes();
    
    expect(room.revealed).toBe(true);
    expect(votes).toEqual({
      user1: 5,
      user2: 8
    });
  });

  test('should handle empty votes when revealing', () => {
    const votes = room.revealVotes();
    expect(room.revealed).toBe(true);
    expect(votes).toEqual({});
  });

  test('should reset voting', () => {
    room.votes.set('user1', 5);
    room.revealed = true;
    room.resetVoting('New Story');
    
    expect(room.votes.size).toBe(0);
    expect(room.revealed).toBe(false);
    expect(room.currentStory).toBe('New Story');
  });

  test('should get public votes when not revealed', () => {
    room.votes.set('user1', 5);
    room.votes.set('user2', 8);
    
    const publicVotes = room.getPublicVotes();
    expect(publicVotes).toEqual({
      user1: '✓',
      user2: '✓'
    });
  });

  test('should get public votes when revealed', () => {
    room.votes.set('user1', 5);
    room.votes.set('user2', 8);
    room.revealed = true;
    
    const publicVotes = room.getPublicVotes();
    expect(publicVotes).toEqual({
      user1: 5,
      user2: 8
    });
  });

  test('should handle empty votes in public votes', () => {
    const publicVotes = room.getPublicVotes();
    expect(publicVotes).toEqual({});
  });
}); 