const roomService = require('./roomService');
const Logger = require('../utils/logger');

function handleConnection(socket, io) {
  Logger.log(`[SocketService] New connection established: socketId=${socket.id}`);

  socket.on('join-room', async ({ roomId, user }) => {
    Logger.log(`[SocketService] Join room request: socketId=${socket.id}, roomId=${roomId}, userId=${user.id}`);
    try {
      const room = await roomService.addParticipant(roomId, user);
      if (!room) {
        Logger.log(`[SocketService] Failed to join room: Room not found: roomId=${roomId}`);
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      socket.join(roomId);
      Logger.log(`[SocketService] User joined room: socketId=${socket.id}, roomId=${roomId}, userId=${user.id}`);
      io.to(roomId).emit('room-update', room);
    } catch (error) {
      Logger.error(`[SocketService] Error joining room: socketId=${socket.id}, roomId=${roomId}, error=${error.message}`);
      socket.emit('error', { message: 'Error joining room' });
    }
  });

  socket.on('submit-vote', async ({ roomId, userId, vote }) => {
    Logger.log(`[SocketService] Vote submission: socketId=${socket.id}, roomId=${roomId}, userId=${userId}, vote=${vote}`);
    try {
      const room = await roomService.submitVote(roomId, userId, vote);
      if (!room) {
        Logger.log(`[SocketService] Failed to submit vote: Room not found: roomId=${roomId}`);
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      Logger.log(`[SocketService] Vote submitted successfully: roomId=${roomId}, userId=${userId}`);
      io.to(roomId).emit('room-update', room);
    } catch (error) {
      Logger.error(`[SocketService] Error submitting vote: socketId=${socket.id}, roomId=${roomId}, error=${error.message}`);
      socket.emit('error', { message: 'Error submitting vote' });
    }
  });

  socket.on('reveal-votes', async ({ roomId }) => {
    Logger.log(`[SocketService] Reveal votes request: socketId=${socket.id}, roomId=${roomId}`);
    try {
      const votes = await roomService.revealVotes(roomId);
      if (!votes) {
        Logger.log(`[SocketService] Failed to reveal votes: Room not found: roomId=${roomId}`);
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      const room = await roomService.getRoom(roomId);
      Logger.log(`[SocketService] Votes revealed: roomId=${roomId}, votes=${JSON.stringify(votes)}`);
      io.to(roomId).emit('room-update', room);
      io.to(roomId).emit('votes-revealed', votes);
    } catch (error) {
      Logger.error(`[SocketService] Error revealing votes: socketId=${socket.id}, roomId=${roomId}, error=${error.message}`);
      socket.emit('error', { message: 'Error revealing votes' });
    }
  });

  socket.on('reset-voting', async ({ roomId, nextStory }) => {
    Logger.log(`[SocketService] Reset voting request: socketId=${socket.id}, roomId=${roomId}, nextStory=${nextStory || 'not specified'}`);
    try {
      const room = await roomService.resetVoting(roomId, nextStory);
      if (!room) {
        Logger.log(`[SocketService] Failed to reset voting: Room not found: roomId=${roomId}`);
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      Logger.log(`[SocketService] Voting reset successfully: roomId=${roomId}`);
      io.to(roomId).emit('room-update', room);
    } catch (error) {
      Logger.error(`[SocketService] Error resetting voting: socketId=${socket.id}, roomId=${roomId}, error=${error.message}`);
      socket.emit('error', { message: 'Error resetting voting' });
    }
  });

  socket.on('leave-room', async ({ roomId, userId }) => {
    Logger.log(`[SocketService] Leave room request: socketId=${socket.id}, roomId=${roomId}, userId=${userId}`);
    try {
      const room = await roomService.removeParticipant(roomId, userId);
      socket.leave(roomId);
      if (room) {
        Logger.log(`[SocketService] User left room: socketId=${socket.id}, roomId=${roomId}, userId=${userId}`);
        io.to(roomId).emit('room-update', room);
      } else {
        Logger.log(`[SocketService] Room deleted after last user left: roomId=${roomId}`);
      }
    } catch (error) {
      Logger.error(`[SocketService] Error leaving room: socketId=${socket.id}, roomId=${roomId}, error=${error.message}`);
      socket.emit('error', { message: 'Error leaving room' });
    }
  });

  socket.on('disconnect', () => {
    Logger.log(`[SocketService] User disconnected: socketId=${socket.id}`);
  });

  socket.on('add-story', async ({ roomId, title, userId }) => {
    Logger.log(`[SocketService] Add story request: socketId=${socket.id}, roomId=${roomId}, title=${title}`);
    try {
      const story = await roomService.addStory(roomId, title, userId);
      if (!story) {
        Logger.log(`[SocketService] Failed to add story: Room not found or unauthorized: roomId=${roomId}`);
        socket.emit('error', { message: 'Failed to add story' });
        return;
      }

      const room = await roomService.getRoom(roomId);
      Logger.log(`[SocketService] Story added successfully: roomId=${roomId}, storyId=${story.id}`);
      io.to(roomId).emit('room-update', room);
    } catch (error) {
      Logger.error(`[SocketService] Error adding story: socketId=${socket.id}, roomId=${roomId}, error=${error.message}`);
      socket.emit('error', { message: 'Error adding story' });
    }
  });

  socket.on('start-voting', async ({ roomId, storyId, userId }) => {
    Logger.log(`[SocketService] Start voting request: socketId=${socket.id}, roomId=${roomId}, storyId=${storyId}`);
    try {
      const story = await roomService.startVoting(roomId, storyId, userId);
      if (!story) {
        Logger.log(`[SocketService] Failed to start voting: Room not found or unauthorized: roomId=${roomId}`);
        socket.emit('error', { message: 'Failed to start voting' });
        return;
      }

      const room = await roomService.getRoom(roomId);
      Logger.log(`[SocketService] Voting started successfully: roomId=${roomId}, storyId=${storyId}`);
      io.to(roomId).emit('room-update', room);
    } catch (error) {
      Logger.error(`[SocketService] Error starting voting: socketId=${socket.id}, roomId=${roomId}, error=${error.message}`);
      socket.emit('error', { message: 'Error starting voting' });
    }
  });

  socket.on('complete-story', async ({ roomId, storyId, userId }) => {
    Logger.log(`[SocketService] Complete story request: socketId=${socket.id}, roomId=${roomId}, storyId=${storyId}`);
    try {
      const story = await roomService.completeStory(roomId, storyId, userId);
      if (!story) {
        Logger.log(`[SocketService] Failed to complete story: Room not found or unauthorized: roomId=${roomId}`);
        socket.emit('error', { message: 'Failed to complete story' });
        return;
      }

      const room = await roomService.getRoom(roomId);
      Logger.log(`[SocketService] Story completed successfully: roomId=${roomId}, storyId=${storyId}`);
      io.to(roomId).emit('room-update', room);
    } catch (error) {
      Logger.error(`[SocketService] Error completing story: socketId=${socket.id}, roomId=${roomId}, error=${error.message}`);
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

  socket.on('delete-story', async ({ roomId, storyId, userId }) => {
    console.log(`[SocketService] Delete story request: socketId=${socket.id}, roomId=${roomId}, storyId=${storyId}`);
    try {
      const deletedStory = await roomService.deleteStory(roomId, storyId, userId);
      if (!deletedStory) {
        console.log(`[SocketService] Failed to delete story: Room not found or unauthorized: roomId=${roomId}`);
        socket.emit('error', { message: 'Failed to delete story' });
        return;
      }

      const room = await roomService.getRoom(roomId);
      console.log(`[SocketService] Story deleted successfully: roomId=${roomId}, storyId=${storyId}`);
      io.to(roomId).emit('room-update', room);
    } catch (error) {
      console.error(`[SocketService] Error deleting story: socketId=${socket.id}, roomId=${roomId}, error=${error.message}`);
      socket.emit('error', { message: 'Error deleting story' });
    }
  });
}

module.exports = {
  handleConnection
}; 