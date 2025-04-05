const roomService = require('./roomService');

function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-room', ({ roomId, user }) => {
      const room = roomService.addParticipant(roomId, user);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      socket.join(roomId);
      io.to(roomId).emit('room-update', room);
      console.log(`${user.name} joined room ${roomId}`);
    });

    socket.on('submit-vote', ({ roomId, userId, vote }) => {
      const room = roomService.submitVote(roomId, userId, vote);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      const updatedRoom = { ...room, votes: room.getPublicVotes() };
      io.to(roomId).emit('room-update', updatedRoom);
    });

    socket.on('reveal-votes', ({ roomId }) => {
      const result = roomService.revealVotes(roomId);
      if (!result) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      io.to(roomId).emit('room-update', result.room);
      io.to(roomId).emit('votes-revealed', result.votes);
    });

    socket.on('reset-voting', ({ roomId, nextStory }) => {
      const room = roomService.resetVoting(roomId, nextStory);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      io.to(roomId).emit('room-update', room);
    });

    socket.on('leave-room', ({ roomId, userId }) => {
      const room = roomService.removeParticipant(roomId, userId);
      if (room) {
        io.to(roomId).emit('room-update', room);
      }
      socket.leave(roomId);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
}

module.exports = setupSocketHandlers; 