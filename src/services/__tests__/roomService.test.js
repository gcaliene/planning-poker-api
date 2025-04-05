const mongoose = require('mongoose');
const roomService = require('../roomService');
const Room = require('../../models/RoomSchema');

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

// Mock Room model's static methods
Room.findOne = jest.fn();

describe('Room Service', () => {
  let mockRoom;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRoom = {
      id: 'TEST123',
      name: 'Test Room',
      createdBy: 'test-user',
      participants: [],
      votes: new Map(),
      revealed: false,
      save: jest.fn().mockResolvedValue(this),
      addParticipant: jest.fn().mockReturnValue(true),
      removeParticipant: jest.fn().mockReturnValue(false),
      submitVote: jest.fn(),
      revealVotes: jest.fn().mockReturnValue({}),
      resetVoting: jest.fn(),
      getPublicVotes: jest.fn().mockReturnValue({})
    };

    Room.findOne.mockResolvedValue(mockRoom);
  });

  test('should get a room by id', async () => {
    const room = await roomService.getRoom('TEST123');
    expect(Room.findOne).toHaveBeenCalledWith({ id: 'TEST123' });
    expect(room).toEqual(mockRoom);
  });

  test('should handle non-existent room', async () => {
    Room.findOne.mockResolvedValueOnce(null);
    const room = await roomService.getRoom('NONEXISTENT');
    expect(room).toBeNull();
  });

  test('should add a participant to a room', async () => {
    const user = { id: 'user1', name: 'Test User' };
    const result = await roomService.addParticipant('TEST123', user);
    expect(mockRoom.addParticipant).toHaveBeenCalledWith(user);
    expect(mockRoom.save).toHaveBeenCalled();
    expect(result).toBe(mockRoom);
  });

  test('should handle duplicate participant', async () => {
    mockRoom.addParticipant.mockReturnValueOnce(false);
    const user = { id: 'user1', name: 'Test User' };
    const result = await roomService.addParticipant('TEST123', user);
    expect(result).toBe(mockRoom);
  });

  test('should handle error when adding participant', async () => {
    mockRoom.save.mockRejectedValueOnce(new Error('Save failed'));
    const user = { id: 'user1', name: 'Test User' };
    await expect(roomService.addParticipant('TEST123', user)).rejects.toThrow('Save failed');
  });

  test('should submit a vote', async () => {
    await roomService.submitVote('TEST123', 'user1', 5);
    expect(mockRoom.submitVote).toHaveBeenCalledWith('user1', 5);
    expect(mockRoom.save).toHaveBeenCalled();
  });

  test('should handle error when submitting vote', async () => {
    mockRoom.save.mockRejectedValueOnce(new Error('Save failed'));
    await expect(roomService.submitVote('TEST123', 'user1', 5)).rejects.toThrow('Save failed');
  });

  test('should reveal votes', async () => {
    const votes = { user1: 5, user2: 8 };
    mockRoom.revealVotes.mockReturnValueOnce(votes);
    const result = await roomService.revealVotes('TEST123');
    expect(mockRoom.revealVotes).toHaveBeenCalled();
    expect(mockRoom.save).toHaveBeenCalled();
    expect(result).toEqual(votes);
  });

  test('should handle error when revealing votes', async () => {
    mockRoom.save.mockRejectedValueOnce(new Error('Save failed'));
    await expect(roomService.revealVotes('TEST123')).rejects.toThrow('Save failed');
  });

  test('should reset voting', async () => {
    await roomService.resetVoting('TEST123', 'New Story');
    expect(mockRoom.resetVoting).toHaveBeenCalledWith('New Story');
    expect(mockRoom.save).toHaveBeenCalled();
  });

  test('should handle error when resetting voting', async () => {
    mockRoom.save.mockRejectedValueOnce(new Error('Save failed'));
    await expect(roomService.resetVoting('TEST123', 'New Story')).rejects.toThrow('Save failed');
  });
}); 