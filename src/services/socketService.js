const roomService = require('./roomService');

function handleConnection(socket, io) {
  console.log(`[SocketService] New connection established: socketId=${socket.id}`);

  socket.on('join-room', async ({ roomId, user }) => {
    console.log(`[SocketService] Join room request: socketId=${socket.id}, roomId=${roomId}, userId=${user.id}`);
    try {
      const room = await roomService.addParticipant(roomId, user);
      if (!room) {
        console.log(`[SocketService] Failed to join room: Room not found: roomId=${roomId}`);
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      socket.join(roomId);
      console.log(`[SocketService] User joined room: socketId=${socket.id}, roomId=${roomId}, userId=${user.id}`);
      io.to(roomId).emit('room-update', room);
    } catch (error) {
      console.error(`[SocketService] Error joining room: socketId=${socket.id}, roomId=${roomId}, error=${error.message}`);
      socket.emit('error', { message: 'Error joining room' });
    }
  });

  socket.on('submit-vote', async ({ roomId, userId, vote }) => {
    console.log(`[SocketService] Vote submission: socketId=${socket.id}, roomId=${roomId}, userId=${userId}, vote=${vote}`);
    try {
      const room = await roomService.submitVote(roomId, userId, vote);
      if (!room) {
        console.log(`[SocketService] Failed to submit vote: Room not found: roomId=${roomId}`);
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      console.log(`[SocketService] Vote submitted successfully: roomId=${roomId}, userId=${userId}`);
      io.to(roomId).emit('room-update', room);
    } catch (error) {
      console.error(`[SocketService] Error submitting vote: socketId=${socket.id}, roomId=${roomId}, error=${error.message}`);
      socket.emit('error', { message: 'Error submitting vote' });
    }
  });

  socket.on('reveal-votes', async ({ roomId }) => {
    console.log(`[SocketService] Reveal votes request: socketId=${socket.id}, roomId=${roomId}`);
    try {
      const votes = await roomService.revealVotes(roomId);
      if (!votes) {
        console.log(`[SocketService] Failed to reveal votes: Room not found: roomId=${roomId}`);
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      const room = await roomService.getRoom(roomId);
      console.log(`[SocketService] Votes revealed: roomId=${roomId}, votes=${JSON.stringify(votes)}`);
      io.to(roomId).emit('room-update', room);
      io.to(roomId).emit('votes-revealed', votes);
    } catch (error) {
      console.error(`[SocketService] Error revealing votes: socketId=${socket.id}, roomId=${roomId}, error=${error.message}`);
      socket.emit('error', { message: 'Error revealing votes' });
    }
  });

  socket.on('reset-voting', async ({ roomId, nextStory }) => {
    console.log(`[SocketService] Reset voting request: socketId=${socket.id}, roomId=${roomId}, nextStory=${nextStory || 'not specified'}`);
    try {
      const room = await roomService.resetVoting(roomId, nextStory);
      if (!room) {
        console.log(`[SocketService] Failed to reset voting: Room not found: roomId=${roomId}`);
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      console.log(`[SocketService] Voting reset successfully: roomId=${roomId}`);
      io.to(roomId).emit('room-update', room);
    } catch (error) {
      console.error(`[SocketService] Error resetting voting: socketId=${socket.id}, roomId=${roomId}, error=${error.message}`);
      socket.emit('error', { message: 'Error resetting voting' });
    }
  });

  socket.on('leave-room', async ({ roomId, userId }) => {
    console.log(`[SocketService] Leave room request: socketId=${socket.id}, roomId=${roomId}, userId=${userId}`);
    try {
      const room = await roomService.removeParticipant(roomId, userId);
      socket.leave(roomId);
      if (room) {
        console.log(`[SocketService] User left room: socketId=${socket.id}, roomId=${roomId}, userId=${userId}`);
        io.to(roomId).emit('room-update', room);
      } else {
        console.log(`[SocketService] Room deleted after last user left: roomId=${roomId}`);
      }
    } catch (error) {
      console.error(`[SocketService] Error leaving room: socketId=${socket.id}, roomId=${roomId}, error=${error.message}`);
      socket.emit('error', { message: 'Error leaving room' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`[SocketService] User disconnected: socketId=${socket.id}`);
  });

  socket.on('add-story', async ({ roomId, title, userId }) => {
    console.log(`[SocketService] Add story request: socketId=${socket.id}, roomId=${roomId}, title=${title}`);
    try {
      const story = await roomService.addStory(roomId, title, userId);
      if (!story) {
        console.log(`[SocketService] Failed to add story: Room not found or unauthorized: roomId=${roomId}`);
        socket.emit('error', { message: 'Failed to add story' });
        return;
      }

      const room = await roomService.getRoom(roomId);
      console.log(`[SocketService] Story added successfully: roomId=${roomId}, storyId=${story.id}`);
      io.to(roomId).emit('room-update', room);
    } catch (error) {
      console.error(`[SocketService] Error adding story: socketId=${socket.id}, roomId=${roomId}, error=${error.message}`);
      socket.emit('error', { message: 'Error adding story' });
    }
  });

  socket.on('start-voting', async ({ roomId, storyId, userId }) => {
    console.log(`[SocketService] Start voting request: socketId=${socket.id}, roomId=${roomId}, storyId=${storyId}`);
    try {
      const story = await roomService.startVoting(roomId, storyId, userId);
      if (!story) {
        console.log(`[SocketService] Failed to start voting: Room not found or unauthorized: roomId=${roomId}`);
        socket.emit('error', { message: 'Failed to start voting' });
        return;
      }

      const room = await roomService.getRoom(roomId);
      console.log(`[SocketService] Voting started successfully: roomId=${roomId}, storyId=${storyId}`);
      io.to(roomId).emit('room-update', room);
    } catch (error) {
      console.error(`[SocketService] Error starting voting: socketId=${socket.id}, roomId=${roomId}, error=${error.message}`);
      socket.emit('error', { message: 'Error starting voting' });
    }
  });

  socket.on('complete-story', async ({ roomId, storyId, userId }) => {
    console.log(`[SocketService] Complete story request: socketId=${socket.id}, roomId=${roomId}, storyId=${storyId}`);
    try {
      const story = await roomService.completeStory(roomId, storyId, userId);
      if (!story) {
        console.log(`[SocketService] Failed to complete story: Room not found or unauthorized: roomId=${roomId}`);
        socket.emit('error', { message: 'Failed to complete story' });
        return;
      }

      const room = await roomService.getRoom(roomId);
      console.log(`[SocketService] Story completed successfully: roomId=${roomId}, storyId=${storyId}`);
      io.to(roomId).emit('room-update', room);
    } catch (error) {
      console.error(`[SocketService] Error completing story: socketId=${socket.id}, roomId=${roomId}, error=${error.message}`);
      socket.emit('error', { message: 'Error completing story' });
    }
  });

  socket.on('skip-story', async ({ roomId, storyId, userId }) => {
    console.log(`[SocketService] Skip story request: socketId=${socket.id}, roomId=${roomId}, storyId=${storyId}`);
    try {
      const story = await roomService.skipStory(roomId, storyId, userId);
      if (!story) {
        console.log(`[SocketService] Failed to skip story: Room not found or unauthorized: roomId=${roomId}`);
        socket.emit('error', { message: 'Failed to skip story' });
        return;
      }

      const room = await roomService.getRoom(roomId);
      console.log(`[SocketService] Story skipped successfully: roomId=${roomId}, storyId=${storyId}`);
      io.to(roomId).emit('room-update', room);
    } catch (error) {
      console.error(`[SocketService] Error skipping story: socketId=${socket.id}, roomId=${roomId}, error=${error.message}`);
      socket.emit('error', { message: 'Error skipping story' });
    }
  });
}

module.exports = {
  handleConnection
}; 