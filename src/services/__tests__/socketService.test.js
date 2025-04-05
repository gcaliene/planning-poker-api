const setupSocketHandlers = require('../socketService');
const roomService = require('../roomService');

describe('SocketService', () => {
  let io;
  let socket;
  let mockRoomId;
  const mockUser = { id: 'user1', name: 'Test User' };

  beforeEach(() => {
    // Clear rooms before each test
    roomService.rooms.clear();
    
    // Create a test room
    const { roomId } = roomService.createRoom('Test Room', 'creator1');
    mockRoomId = roomId;

    // Mock socket.io server
    io = {
      on: jest.fn(),
      to: jest.fn().mockReturnThis(),
      emit: jest.fn()
    };

    // Mock socket with proper event handling
    const eventHandlers = {};
    socket = {
      id: 'socket1',
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn(),
      on: jest.fn().mockImplementation((event, handler) => {
        eventHandlers[event] = handler;
      })
    };

    // Setup socket handlers
    setupSocketHandlers(io);
    
    // Simulate connection
    const connectionHandler = io.on.mock.calls[0][1];
    connectionHandler(socket);

    // Store event handlers for testing
    socket.eventHandlers = eventHandlers;
  });

  test('should handle join-room event', () => {
    const handler = socket.eventHandlers['join-room'];
    handler({ roomId: mockRoomId, user: mockUser });

    expect(socket.join).toHaveBeenCalledWith(mockRoomId);
    expect(io.to).toHaveBeenCalledWith(mockRoomId);
    expect(io.emit).toHaveBeenCalledWith('room-update', expect.any(Object));
  });

  test('should handle submit-vote event', () => {
    const handler = socket.eventHandlers['submit-vote'];
    handler({ roomId: mockRoomId, userId: mockUser.id, vote: 5 });

    expect(io.to).toHaveBeenCalledWith(mockRoomId);
    expect(io.emit).toHaveBeenCalledWith('room-update', expect.any(Object));
  });

  test('should handle reveal-votes event', () => {
    const handler = socket.eventHandlers['reveal-votes'];
    handler({ roomId: mockRoomId });

    expect(io.to).toHaveBeenCalledWith(mockRoomId);
    expect(io.emit).toHaveBeenCalledWith('room-update', expect.any(Object));
    expect(io.emit).toHaveBeenCalledWith('votes-revealed', expect.any(Object));
  });

  test('should handle reset-voting event', () => {
    const handler = socket.eventHandlers['reset-voting'];
    handler({ roomId: mockRoomId, nextStory: 'New Story' });

    expect(io.to).toHaveBeenCalledWith(mockRoomId);
    expect(io.emit).toHaveBeenCalledWith('room-update', expect.any(Object));
  });

  test('should handle leave-room event', () => {
    const handler = socket.eventHandlers['leave-room'];
    handler({ roomId: mockRoomId, userId: mockUser.id });

    expect(socket.leave).toHaveBeenCalledWith(mockRoomId);
  });

  test('should handle disconnect event', () => {
    const handler = socket.eventHandlers['disconnect'];
    handler();

    // No specific expectations, just verifying the handler exists
    expect(handler).toBeDefined();
  });

  test('should emit error for non-existent room', () => {
    const handler = socket.eventHandlers['join-room'];
    handler({ roomId: 'NONEXISTENT', user: mockUser });

    expect(socket.emit).toHaveBeenCalledWith('error', { message: 'Room not found' });
  });
}); 