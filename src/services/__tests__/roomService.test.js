const mongoose = require('mongoose');
const roomService = require('../roomService');

// Mock mongoose and Room model
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
        _id: 'mock-id',
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
        })
      };
    })
  };
});

// Mock the Room model's static methods
mongoose.model('Room').findOne = jest.fn();
mongoose.model('Room').deleteOne = jest.fn();

describe('Room Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should get a room by ID', async () => {
    const mockRoom = {
      id: 'TEST123',
      name: 'Test Room',
      createdBy: 'test-user',
      participants: [],
      votes: new Map(),
      revealed: false
    };

    mongoose.model('Room').findOne.mockResolvedValue(mockRoom);
    const room = await roomService.getRoom('TEST123');
    expect(room).toEqual(mockRoom);
  });

  test('should return null for non-existent room', async () => {
    mongoose.model('Room').findOne.mockResolvedValue(null);
    const room = await roomService.getRoom('NONEXISTENT');
    expect(room).toBeNull();
  });

  test('should add a participant to a room', async () => {
    const mockRoom = {
      id: 'TEST123',
      name: 'Test Room',
      createdBy: 'test-user',
      participants: [],
      votes: new Map(),
      revealed: false,
      addParticipant: jest.fn().mockReturnValue(true),
      save: jest.fn().mockResolvedValue(this)
    };

    mongoose.model('Room').findOne.mockResolvedValue(mockRoom);
    const user = { id: 'user1', name: 'Test User' };
    const room = await roomService.addParticipant('TEST123', user);
    expect(room).toBeDefined();
    expect(mockRoom.addParticipant).toHaveBeenCalledWith(user);
  });

  test('should not add duplicate participants', async () => {
    const mockRoom = {
      id: 'TEST123',
      name: 'Test Room',
      createdBy: 'test-user',
      participants: [],
      votes: new Map(),
      revealed: false,
      addParticipant: jest.fn().mockReturnValue(false),
      save: jest.fn().mockResolvedValue(this)
    };

    mongoose.model('Room').findOne.mockResolvedValue(mockRoom);
    const user = { id: 'user1', name: 'Test User' };
    const room = await roomService.addParticipant('TEST123', user);
    expect(room).toBeDefined();
    expect(mockRoom.addParticipant).toHaveBeenCalledWith(user);
  });

  test('should submit a vote', async () => {
    const mockRoom = {
      id: 'TEST123',
      name: 'Test Room',
      createdBy: 'test-user',
      participants: [],
      votes: new Map(),
      revealed: false,
      submitVote: jest.fn(),
      save: jest.fn().mockResolvedValue(this)
    };

    mongoose.model('Room').findOne.mockResolvedValue(mockRoom);
    const room = await roomService.submitVote('TEST123', 'user1', 5);
    expect(room).toBeDefined();
    expect(mockRoom.submitVote).toHaveBeenCalledWith('user1', 5);
  });

  test('should reveal votes', async () => {
    const mockVotes = {
      user1: 5,
      user2: 8
    };

    const mockRoom = {
      id: 'TEST123',
      name: 'Test Room',
      createdBy: 'test-user',
      participants: [],
      votes: new Map(),
      revealed: false,
      revealVotes: jest.fn().mockReturnValue(mockVotes),
      save: jest.fn().mockResolvedValue(this)
    };

    mongoose.model('Room').findOne.mockResolvedValue(mockRoom);
    const votes = await roomService.revealVotes('TEST123');
    expect(votes).toEqual(mockVotes);
    expect(mockRoom.revealVotes).toHaveBeenCalled();
  });

  test('should reset voting', async () => {
    const mockRoom = {
      id: 'TEST123',
      name: 'Test Room',
      createdBy: 'test-user',
      participants: [],
      votes: new Map(),
      revealed: false,
      resetVoting: jest.fn(),
      save: jest.fn().mockResolvedValue(this)
    };

    mongoose.model('Room').findOne.mockResolvedValue(mockRoom);
    const room = await roomService.resetVoting('TEST123', 'New Story');
    expect(room).toBeDefined();
    expect(mockRoom.resetVoting).toHaveBeenCalledWith('New Story');
  });
}); 