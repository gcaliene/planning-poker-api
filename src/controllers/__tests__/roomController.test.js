const roomController = require('../roomController');
const roomService = require('../../services/roomService');

// Mock response object
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('RoomController', () => {
  beforeEach(() => {
    // Clear rooms before each test
    roomService.rooms.clear();
  });

  test('should create a room', () => {
    const req = {
      body: {
        name: 'Test Room',
        createdBy: 'creator1'
      }
    };
    const res = mockResponse();

    roomController.createRoom(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      roomId: expect.any(String),
      room: expect.objectContaining({
        name: 'Test Room',
        createdBy: 'creator1'
      })
    }));
  });

  test('should get a room', () => {
    // First create a room
    const { roomId } = roomService.createRoom('Test Room', 'creator1');

    const req = {
      params: { roomId }
    };
    const res = mockResponse();

    roomController.getRoom(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      id: roomId,
      name: 'Test Room',
      createdBy: 'creator1'
    }));
  });

  test('should return 404 for non-existent room', () => {
    const req = {
      params: { roomId: 'NONEXISTENT' }
    };
    const res = mockResponse();

    roomController.getRoom(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Room not found' });
  });

  test('should return health check status', () => {
    const req = {};
    const res = mockResponse();

    roomController.healthCheck(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: 'ok' });
  });
}); 