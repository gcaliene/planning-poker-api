const Room = require('../models/RoomSchema');

class CleanupService {
  constructor() {
    this.cleanupInterval = 60 * 60 * 1000; // Run every hour
  }

  start() {
    console.log('[CleanupService] Starting cleanup service');
    this.runCleanup();
    setInterval(() => this.runCleanup(), this.cleanupInterval);
  }

  async runCleanup() {
    console.log('[CleanupService] Running cleanup');
    try {
      const now = new Date();
      const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Find rooms that need cleanup
      const rooms = await Room.find({
        $or: [
          // Rooms with only one participant for 12+ hours
          {
            'participants.1': { $exists: false },
            lastActivity: { $lt: twelveHoursAgo }
          },
          // Rooms with only one participant and no new stories for 24+ hours
          {
            'participants.1': { $exists: false },
            lastStoryAdded: { $lt: twentyFourHoursAgo }
          }
        ]
      });

      console.log(`[CleanupService] Found ${rooms.length} rooms to cleanup`);

      // Delete the rooms
      for (const room of rooms) {
        console.log(`[CleanupService] Deleting room: id=${room.id}`);
        await Room.deleteOne({ _id: room._id });
      }

      console.log('[CleanupService] Cleanup completed successfully');
    } catch (error) {
      console.error('[CleanupService] Error during cleanup:', error);
    }
  }
}

module.exports = new CleanupService(); 