const Room = require('../Room');

describe('Room Model', () => {
  let room;
  const mockUser = { id: 'user1', name: 'Test User' };
  const mockUser2 = { id: 'user2', name: 'Test User 2' };

  beforeEach(() => {
    room = new Room('TEST123', 'Test Room', 'creator1');
  });

  test('should create a room with correct initial state', () => {
    expect(room.id).toBe('TEST123');
    expect(room.name).toBe('Test Room');
    expect(room.createdBy).toBe('creator1');
    expect(room.participants).toEqual([]);
    expect(room.currentStory).toBeNull();
    expect(room.votes).toEqual({});
    expect(room.revealed).toBe(false);
    expect(room.createdAt).toBeDefined();
  });

  test('should create a room with default name', () => {
    const room = new Room('TEST123', null, 'creator1');
    expect(room.name).toBe('Room TEST123');
  });

  test('should add a participant', () => {
    const result = room.addParticipant(mockUser);
    expect(result).toBe(true);
    expect(room.participants).toContainEqual(mockUser);
  });

  test('should not add duplicate participants', () => {
    room.addParticipant(mockUser);
    const result = room.addParticipant(mockUser);
    expect(result).toBe(false);
    expect(room.participants.length).toBe(1);
  });

  test('should remove a participant', () => {
    room.addParticipant(mockUser);
    room.addParticipant(mockUser2);
    const result = room.removeParticipant(mockUser.id);
    expect(result).toBe(false); // Room is not empty
    expect(room.participants).not.toContainEqual(mockUser);
    expect(room.participants).toContainEqual(mockUser2);
  });

  test('should return true when removing last participant', () => {
    room.addParticipant(mockUser);
    const result = room.removeParticipant(mockUser.id);
    expect(result).toBe(true); // Room should be empty
  });

  test('should remove participant vote when removing participant', () => {
    room.addParticipant(mockUser);
    room.submitVote(mockUser.id, 5);
    room.removeParticipant(mockUser.id);
    expect(room.votes[mockUser.id]).toBeUndefined();
  });

  test('should submit a vote', () => {
    room.submitVote(mockUser.id, 5);
    expect(room.votes[mockUser.id]).toBe(5);
  });

  test('should submit multiple votes', () => {
    room.submitVote(mockUser.id, 5);
    room.submitVote(mockUser2.id, 8);
    expect(room.votes[mockUser.id]).toBe(5);
    expect(room.votes[mockUser2.id]).toBe(8);
  });

  test('should reveal votes', () => {
    room.submitVote(mockUser.id, 5);
    room.submitVote(mockUser2.id, 8);
    const votes = room.revealVotes();
    expect(room.revealed).toBe(true);
    expect(votes).toEqual({
      [mockUser.id]: 5,
      [mockUser2.id]: 8
    });
  });

  test('should reset voting without next story', () => {
    room.submitVote(mockUser.id, 5);
    room.revealVotes();
    room.resetVoting();
    expect(room.votes).toEqual({});
    expect(room.revealed).toBe(false);
    expect(room.currentStory).toBeNull();
  });

  test('should reset voting with next story', () => {
    room.submitVote(mockUser.id, 5);
    room.revealVotes();
    room.resetVoting('New Story');
    expect(room.votes).toEqual({});
    expect(room.revealed).toBe(false);
    expect(room.currentStory).toBe('New Story');
  });

  test('should get public votes (hidden)', () => {
    room.submitVote(mockUser.id, 5);
    const publicVotes = room.getPublicVotes();
    expect(publicVotes[mockUser.id]).toBe('✓');
  });

  test('should get public votes (revealed)', () => {
    room.submitVote(mockUser.id, 5);
    room.revealVotes();
    const publicVotes = room.getPublicVotes();
    expect(publicVotes[mockUser.id]).toBe(5);
  });

  test('should get public votes with no votes', () => {
    const publicVotes = room.getPublicVotes();
    expect(publicVotes).toEqual({});
  });
}); 