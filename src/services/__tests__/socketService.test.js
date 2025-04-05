const socketService = require('../socketService');
const roomService = require('../roomService');

// Mock the room service
jest.mock('../roomService');

describe('SocketService', () => {
  let mockSocket;
  let mockIo;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    mockSocket = {
      id: 'test-socket-id',
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn(),
      on: jest.fn()
    };

    mockIo = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn()
    };
  });

  test('should handle join-room event', async () => {
    const mockRoom = {
      id: 'TEST123',
      name: 'Test Room',
      createdBy: 'test-user',
      participants: [],
      votes: new Map(),
      revealed: false
    };

    roomService.addParticipant.mockResolvedValue(mockRoom);

    const user = { id: 'user1', name: 'Test User' };
    
    socketService.handleConnection(mockSocket, mockIo);
    const joinRoomHandler = mockSocket.on.mock.calls.find(call => call[0] === 'join-room')[1];
    await joinRoomHandler({ roomId: 'TEST123', user });

    expect(roomService.addParticipant).toHaveBeenCalledWith('TEST123', user);
    expect(mockSocket.join).toHaveBeenCalledWith('TEST123');
    expect(mockIo.to).toHaveBeenCalledWith('TEST123');
    expect(mockIo.emit).toHaveBeenCalledWith('room-update', mockRoom);
  });

  test('should handle submit-vote event', async () => {
    const mockRoom = {
      id: 'TEST123',
      name: 'Test Room',
      createdBy: 'test-user',
      participants: [],
      votes: new Map(),
      revealed: false
    };

    roomService.submitVote.mockResolvedValue(mockRoom);

    socketService.handleConnection(mockSocket, mockIo);
    const submitVoteHandler = mockSocket.on.mock.calls.find(call => call[0] === 'submit-vote')[1];
    await submitVoteHandler({ roomId: 'TEST123', userId: 'user1', vote: 5 });

    expect(roomService.submitVote).toHaveBeenCalledWith('TEST123', 'user1', 5);
    expect(mockIo.to).toHaveBeenCalledWith('TEST123');
    expect(mockIo.emit).toHaveBeenCalledWith('room-update', expect.any(Object));
  });

  test('should handle reveal-votes event', async () => {
    const mockVotes = {
      user1: 5,
      user2: 8
    };

    roomService.revealVotes.mockResolvedValue(mockVotes);
    roomService.getRoom.mockResolvedValue({
      id: 'TEST123',
      name: 'Test Room',
      createdBy: 'test-user',
      participants: [],
      votes: new Map(),
      revealed: true
    });

    socketService.handleConnection(mockSocket, mockIo);
    const revealVotesHandler = mockSocket.on.mock.calls.find(call => call[0] === 'reveal-votes')[1];
    await revealVotesHandler({ roomId: 'TEST123' });

    expect(roomService.revealVotes).toHaveBeenCalledWith('TEST123');
    expect(mockIo.to).toHaveBeenCalledWith('TEST123');
    expect(mockIo.emit).toHaveBeenCalledWith('room-update', expect.any(Object));
    expect(mockIo.emit).toHaveBeenCalledWith('votes-revealed', mockVotes);
  });

  test('should handle reset-voting event', async () => {
    const mockRoom = {
      id: 'TEST123',
      name: 'Test Room',
      createdBy: 'test-user',
      participants: [],
      votes: new Map(),
      revealed: false,
      currentStory: 'New Story'
    };

    roomService.resetVoting.mockResolvedValue(mockRoom);

    socketService.handleConnection(mockSocket, mockIo);
    const resetVotingHandler = mockSocket.on.mock.calls.find(call => call[0] === 'reset-voting')[1];
    await resetVotingHandler({ roomId: 'TEST123', nextStory: 'New Story' });

    expect(roomService.resetVoting).toHaveBeenCalledWith('TEST123', 'New Story');
    expect(mockIo.to).toHaveBeenCalledWith('TEST123');
    expect(mockIo.emit).toHaveBeenCalledWith('room-update', mockRoom);
  });

  test('should handle leave-room event', async () => {
    const mockRoom = {
      id: 'TEST123',
      name: 'Test Room',
      createdBy: 'test-user',
      participants: [],
      votes: new Map(),
      revealed: false
    };

    roomService.removeParticipant.mockResolvedValue(mockRoom);

    socketService.handleConnection(mockSocket, mockIo);
    const leaveRoomHandler = mockSocket.on.mock.calls.find(call => call[0] === 'leave-room')[1];
    await leaveRoomHandler({ roomId: 'TEST123', userId: 'user1' });

    expect(roomService.removeParticipant).toHaveBeenCalledWith('TEST123', 'user1');
    expect(mockSocket.leave).toHaveBeenCalledWith('TEST123');
    expect(mockIo.to).toHaveBeenCalledWith('TEST123');
    expect(mockIo.emit).toHaveBeenCalledWith('room-update', mockRoom);
  });

  test('should handle disconnect event', () => {
    socketService.handleConnection(mockSocket, mockIo);
    const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')[1];
    disconnectHandler();
  });

  test('should emit error for non-existent room', async () => {
    roomService.addParticipant.mockResolvedValue(null);

    socketService.handleConnection(mockSocket, mockIo);
    const joinRoomHandler = mockSocket.on.mock.calls.find(call => call[0] === 'join-room')[1];
    await joinRoomHandler({ roomId: 'NONEXISTENT', user: { id: 'user1', name: 'Test User' } });

    expect(mockSocket.emit).toHaveBeenCalledWith('error', { message: 'Room not found' });
  });
}); 