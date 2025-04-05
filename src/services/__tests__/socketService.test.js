const socketService = require('../socketService');
const roomService = require('../roomService');

// Mock roomService
jest.mock('../roomService');

// Mock console
global.console = {
  log: jest.fn(),
  error: jest.fn()
};

describe('Socket Service', () => {
  let mockSocket;
  let mockIO;
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

    mockSocket = {
      id: 'test-socket-id',
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn(),
      on: jest.fn(),
      to: jest.fn().mockReturnThis(),
      broadcast: jest.fn().mockReturnThis()
    };

    mockIO = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn()
    };

    roomService.getRoom.mockResolvedValue(mockRoom);
    roomService.addParticipant.mockResolvedValue(mockRoom);
    roomService.submitVote.mockResolvedValue(mockRoom);
    roomService.revealVotes.mockResolvedValue({});
    roomService.resetVoting.mockResolvedValue(mockRoom);
    roomService.removeParticipant.mockResolvedValue(mockRoom);
  });

  test('should handle connection and set up event listeners', () => {
    socketService.handleConnection(mockSocket, mockIO);
    
    expect(console.log).toHaveBeenCalledWith('User connected:', 'test-socket-id');
    expect(mockSocket.on).toHaveBeenCalledWith('join-room', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('submit-vote', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('reveal-votes', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('reset-voting', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('leave-room', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
  });

  test('should handle join-room event', async () => {
    socketService.handleConnection(mockSocket, mockIO);
    const joinRoomHandler = mockSocket.on.mock.calls.find(call => call[0] === 'join-room')[1];
    
    const user = { id: 'user1', name: 'Test User' };
    await joinRoomHandler({ roomId: 'TEST123', user });
    
    expect(mockSocket.join).toHaveBeenCalledWith('TEST123');
    expect(roomService.addParticipant).toHaveBeenCalledWith('TEST123', user);
    expect(mockIO.to).toHaveBeenCalledWith('TEST123');
    expect(mockIO.emit).toHaveBeenCalledWith('room-update', mockRoom);
    expect(console.log).toHaveBeenCalledWith('Test User joined room TEST123');
  });

  test('should handle submit-vote event', async () => {
    socketService.handleConnection(mockSocket, mockIO);
    const submitVoteHandler = mockSocket.on.mock.calls.find(call => call[0] === 'submit-vote')[1];
    
    await submitVoteHandler({ roomId: 'TEST123', userId: 'user1', vote: 5 });
    
    expect(roomService.submitVote).toHaveBeenCalledWith('TEST123', 'user1', 5);
    expect(mockIO.to).toHaveBeenCalledWith('TEST123');
    expect(mockIO.emit).toHaveBeenCalledWith('room-update', mockRoom);
  });

  test('should handle reveal-votes event', async () => {
    const votes = { user1: 5, user2: 8 };
    roomService.revealVotes.mockResolvedValueOnce(votes);
    
    socketService.handleConnection(mockSocket, mockIO);
    const revealVotesHandler = mockSocket.on.mock.calls.find(call => call[0] === 'reveal-votes')[1];
    
    await revealVotesHandler({ roomId: 'TEST123' });
    
    expect(roomService.revealVotes).toHaveBeenCalledWith('TEST123');
    expect(mockIO.to).toHaveBeenCalledWith('TEST123');
    expect(mockIO.emit).toHaveBeenCalledWith('room-update', mockRoom);
    expect(mockIO.emit).toHaveBeenCalledWith('votes-revealed', votes);
  });

  test('should handle reset-voting event', async () => {
    socketService.handleConnection(mockSocket, mockIO);
    const resetVotingHandler = mockSocket.on.mock.calls.find(call => call[0] === 'reset-voting')[1];
    
    await resetVotingHandler({ roomId: 'TEST123', nextStory: 'New Story' });
    
    expect(roomService.resetVoting).toHaveBeenCalledWith('TEST123', 'New Story');
    expect(mockIO.to).toHaveBeenCalledWith('TEST123');
    expect(mockIO.emit).toHaveBeenCalledWith('room-update', mockRoom);
  });

  test('should handle leave-room event', async () => {
    socketService.handleConnection(mockSocket, mockIO);
    const leaveRoomHandler = mockSocket.on.mock.calls.find(call => call[0] === 'leave-room')[1];
    
    await leaveRoomHandler({ roomId: 'TEST123', userId: 'user1' });
    
    expect(mockSocket.leave).toHaveBeenCalledWith('TEST123');
    expect(roomService.removeParticipant).toHaveBeenCalledWith('TEST123', 'user1');
    expect(mockIO.to).toHaveBeenCalledWith('TEST123');
    expect(mockIO.emit).toHaveBeenCalledWith('room-update', mockRoom);
  });

  test('should handle disconnect event', async () => {
    socketService.handleConnection(mockSocket, mockIO);
    const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')[1];
    
    await disconnectHandler();
    
    expect(console.log).toHaveBeenCalledWith('User disconnected:', 'test-socket-id');
  });

  test('should handle errors in event handlers', async () => {
    roomService.addParticipant.mockRejectedValueOnce(new Error('Room not found'));
    
    socketService.handleConnection(mockSocket, mockIO);
    const joinRoomHandler = mockSocket.on.mock.calls.find(call => call[0] === 'join-room')[1];
    
    const user = { id: 'user1', name: 'Test User' };
    await joinRoomHandler({ roomId: 'TEST123', user });
    
    expect(console.error).toHaveBeenCalledWith('Error joining room:', expect.any(Error));
    expect(mockSocket.emit).toHaveBeenCalledWith('error', { message: 'Error joining room' });
  });
}); 