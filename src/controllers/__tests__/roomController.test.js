const request = require('supertest');
const express = require('express');
const roomService = require('../../services/roomService');

// Mock the room service
jest.mock('../../services/roomService');

describe('RoomController', () => {
  let app;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create a new Express app for each test
    app = express();
    app.use(express.json());
    
    // Import and use the routes
    const roomRoutes = require('../../routes/roomRoutes');
    app.use('/api', roomRoutes);
  });

  test('should create a room', async () => {
    const mockRoom = {
      id: 'TEST123',
      name: 'Test Room',
      createdBy: 'test-user',
      participants: [],
      votes: {},
      revealed: false
    };

    roomService.createRoom.mockResolvedValue(mockRoom);

    const response = await request(app)
      .post('/api/rooms')
      .send({
        name: 'Test Room',
        createdBy: 'test-user'
      })
      .expect('Content-Type', /json/)
      .expect(201);

    expect(response.body).toEqual(mockRoom);
    expect(roomService.createRoom).toHaveBeenCalledWith('Test Room', 'test-user');
  });

  test('should get a room', async () => {
    const mockRoom = {
      id: 'TEST123',
      name: 'Test Room',
      createdBy: 'test-user',
      participants: [],
      votes: {},
      revealed: false
    };

    roomService.getRoom.mockResolvedValue(mockRoom);

    const response = await request(app)
      .get('/api/rooms/TEST123')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toEqual(mockRoom);
    expect(roomService.getRoom).toHaveBeenCalledWith('TEST123');
  });

  test('should return 404 for non-existent room', async () => {
    roomService.getRoom.mockResolvedValue(null);

    const response = await request(app)
      .get('/api/rooms/NONEXISTENT')
      .expect('Content-Type', /json/)
      .expect(404);

    expect(response.body).toEqual({ error: 'Room not found' });
  });

  test('should return health check status', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toEqual({ status: 'ok' });
  });
}); 