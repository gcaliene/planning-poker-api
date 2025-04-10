const { format } = require('date-fns');
const { zonedTimeToUtc, utcToZonedTime } = require('date-fns-tz');

class Logger {
  static formatTimestamp() {
    const now = new Date();
    const estTime = utcToZonedTime(now, 'America/New_York');
    return format(estTime, 'yyyy-MM-dd HH:mm:ss.SSS');
  }

  static log(message) {
    console.log(`[${this.formatTimestamp()}] ${message}`);
  }

  static error(message) {
    console.error(`[${this.formatTimestamp()}] ${message}`);
  }

  static warn(message) {
    console.warn(`[${this.formatTimestamp()}] ${message}`);
  }
}

module.exports = Logger; 