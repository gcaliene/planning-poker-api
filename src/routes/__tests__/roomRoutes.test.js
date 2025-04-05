const express = require('express');
const request = require('supertest');
const roomRoutes = require('../roomRoutes');
const roomService = require('../../services/roomService');

// Create an Express app with the routes
const app = express();
app.use(express.json());
app.use('/api', roomRoutes);

describe('Room Routes', () => {
  beforeEach(() => {
    // Clear rooms before each test
    roomService.rooms.clear();
  });

  test('GET /api/health should return 200 and status ok', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toEqual({ status: 'ok' });
  });

  test('POST /api/rooms should create a new room', async () => {
    const roomData = {
      name: 'Test Room',
      createdBy: 'creator1'
    };

    const response = await request(app)
      .post('/api/rooms')
      .send(roomData)
      .expect('Content-Type', /json/)
      .expect(201);

    expect(response.body).toHaveProperty('roomId');
    expect(response.body.room).toMatchObject({
      name: 'Test Room',
      createdBy: 'creator1',
      participants: [],
      currentStory: null,
      votes: {},
      revealed: false
    });
  });

  test('POST /api/rooms should create a room with default name if not provided', async () => {
    const roomData = {
      createdBy: 'creator1'
    };

    const response = await request(app)
      .post('/api/rooms')
      .send(roomData)
      .expect('Content-Type', /json/)
      .expect(201);

    expect(response.body.room.name).toBe(`Room ${response.body.roomId}`);
  });

  test('POST /api/rooms should return 400 if createdBy is missing', async () => {
    const roomData = {
      name: 'Test Room'
    };

    const response = await request(app)
      .post('/api/rooms')
      .send(roomData)
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  test('GET /api/rooms/:roomId should return room details', async () => {
    // First create a room
    const { roomId } = roomService.createRoom('Test Room', 'creator1');

    const response = await request(app)
      .get(`/api/rooms/${roomId}`)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toMatchObject({
      id: roomId,
      name: 'Test Room',
      createdBy: 'creator1'
    });
  });

  test('GET /api/rooms/:roomId should return 404 for non-existent room', async () => {
    const response = await request(app)
      .get('/api/rooms/NONEXISTENT')
      .expect('Content-Type', /json/)
      .expect(404);

    expect(response.body).toEqual({ error: 'Room not found' });
  });

  test('GET /api/rooms/:roomId should return 400 for invalid room ID', async () => {
    const response = await request(app)
      .get('/api/rooms/123') // Using a shorter ID that will trigger the validation
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toEqual({ error: 'Invalid room ID' });
  });
}); 