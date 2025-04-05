const roomService = require('./roomService');

function handleConnection(socket, io) {
  console.log('User connected:', socket.id);

  socket.on('join-room', async ({ roomId, user }) => {
    try {
      const room = await roomService.addParticipant(roomId, user);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      socket.join(roomId);
      console.log(`${user.name} joined room ${roomId}`);
      io.to(roomId).emit('room-update', room);
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Error joining room' });
    }
  });

  socket.on('submit-vote', async ({ roomId, userId, vote }) => {
    try {
      const room = await roomService.submitVote(roomId, userId, vote);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      io.to(roomId).emit('room-update', room);
    } catch (error) {
      console.error('Error submitting vote:', error);
      socket.emit('error', { message: 'Error submitting vote' });
    }
  });

  socket.on('reveal-votes', async ({ roomId }) => {
    try {
      const votes = await roomService.revealVotes(roomId);
      if (!votes) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      const room = await roomService.getRoom(roomId);
      io.to(roomId).emit('room-update', room);
      io.to(roomId).emit('votes-revealed', votes);
    } catch (error) {
      console.error('Error revealing votes:', error);
      socket.emit('error', { message: 'Error revealing votes' });
    }
  });

  socket.on('reset-voting', async ({ roomId, nextStory }) => {
    try {
      const room = await roomService.resetVoting(roomId, nextStory);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      io.to(roomId).emit('room-update', room);
    } catch (error) {
      console.error('Error resetting voting:', error);
      socket.emit('error', { message: 'Error resetting voting' });
    }
  });

  socket.on('leave-room', async ({ roomId, userId }) => {
    try {
      const room = await roomService.removeParticipant(roomId, userId);
      socket.leave(roomId);
      if (room) {
        io.to(roomId).emit('room-update', room);
      }
    } catch (error) {
      console.error('Error leaving room:', error);
      socket.emit('error', { message: 'Error leaving room' });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
}

module.exports = {
  handleConnection
}; 