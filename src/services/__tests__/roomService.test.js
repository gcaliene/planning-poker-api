const roomService = require('../roomService');

describe('RoomService', () => {
  const mockUser = { id: 'user1', name: 'Test User' };
  const mockUser2 = { id: 'user2', name: 'Test User 2' };
  let roomId;

  beforeEach(() => {
    // Clear rooms before each test
    roomService.rooms.clear();
    // Create a test room
    const { roomId: id } = roomService.createRoom('Test Room', 'creator1');
    roomId = id;
  });

  test('should create a room', () => {
    const { roomId, room } = roomService.createRoom('New Room', 'creator2');
    expect(roomId).toBeDefined();
    expect(room.name).toBe('New Room');
    expect(room.createdBy).toBe('creator2');
  });

  test('should create a room with default name', () => {
    const { roomId, room } = roomService.createRoom(null, 'creator2');
    expect(room.name).toBe(`Room ${roomId}`);
  });

  test('should get a room', () => {
    const room = roomService.getRoom(roomId);
    expect(room).toBeDefined();
    expect(room.name).toBe('Test Room');
  });

  test('should return null for non-existent room', () => {
    const room = roomService.getRoom('NONEXISTENT');
    expect(room).toBeNull();
  });

  test('should add a participant to a room', () => {
    const room = roomService.addParticipant(roomId, mockUser);
    expect(room.participants).toContainEqual(mockUser);
  });

  test('should return null when adding participant to non-existent room', () => {
    const room = roomService.addParticipant('NONEXISTENT', mockUser);
    expect(room).toBeNull();
  });

  test('should remove a participant from a room', () => {
    roomService.addParticipant(roomId, mockUser);
    roomService.addParticipant(roomId, mockUser2);
    const room = roomService.removeParticipant(roomId, mockUser.id);
    expect(room).not.toBeNull();
    expect(room.participants).not.toContainEqual(mockUser);
    expect(room.participants).toContainEqual(mockUser2);
  });

  test('should delete room when last participant leaves', () => {
    roomService.addParticipant(roomId, mockUser);
    const room = roomService.removeParticipant(roomId, mockUser.id);
    expect(room).toBeNull();
    const deletedRoom = roomService.getRoom(roomId);
    expect(deletedRoom).toBeNull();
  });

  test('should return null when removing participant from non-existent room', () => {
    const room = roomService.removeParticipant('NONEXISTENT', mockUser.id);
    expect(room).toBeNull();
  });

  test('should submit a vote', () => {
    const room = roomService.submitVote(roomId, mockUser.id, 5);
    expect(room.votes[mockUser.id]).toBe(5);
  });

  test('should return null when submitting vote to non-existent room', () => {
    const room = roomService.submitVote('NONEXISTENT', mockUser.id, 5);
    expect(room).toBeNull();
  });

  test('should reveal votes', () => {
    roomService.submitVote(roomId, mockUser.id, 5);
    roomService.submitVote(roomId, mockUser2.id, 8);
    const result = roomService.revealVotes(roomId);
    expect(result.room.revealed).toBe(true);
    expect(result.votes).toEqual({
      [mockUser.id]: 5,
      [mockUser2.id]: 8
    });
  });

  test('should return null when revealing votes in non-existent room', () => {
    const result = roomService.revealVotes('NONEXISTENT');
    expect(result).toBeNull();
  });

  test('should reset voting without next story', () => {
    roomService.submitVote(roomId, mockUser.id, 5);
    roomService.revealVotes(roomId);
    const room = roomService.resetVoting(roomId);
    expect(room.votes).toEqual({});
    expect(room.revealed).toBe(false);
    expect(room.currentStory).toBeNull();
  });

  test('should reset voting with next story', () => {
    roomService.submitVote(roomId, mockUser.id, 5);
    roomService.revealVotes(roomId);
    const room = roomService.resetVoting(roomId, 'New Story');
    expect(room.votes).toEqual({});
    expect(room.revealed).toBe(false);
    expect(room.currentStory).toBe('New Story');
  });

  test('should return null when resetting voting in non-existent room', () => {
    const room = roomService.resetVoting('NONEXISTENT');
    expect(room).toBeNull();
  });

  test('should generate unique room IDs', () => {
    const id1 = roomService.generateRoomId();
    const id2 = roomService.generateRoomId();
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^[A-Z0-9]{6}$/);
  });
}); 