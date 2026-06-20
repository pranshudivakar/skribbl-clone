export class Logger {
  constructor(service) {
    this.service = service;
    this.levels = {
      INFO: "INFO",
      WARN: "WARN",
      ERROR: "ERROR",
      DEBUG: "DEBUG",
    };
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      service: this.service,
      level,
      message,
      data,
    };

    
    const colors = {
      INFO: "\x1b[32m", // Green
      WARN: "\x1b[33m", // Yellow
      ERROR: "\x1b[31m", // Red
      DEBUG: "\x1b[36m", // Cyan
    };

    const reset = "\x1b[0m";
    const color = colors[level] || "\x1b[37m";

    console.log(
      `${color}[${timestamp}] [${level}] ${this.service}: ${message}${reset}`,
    );
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }

    return logEntry;
  }

  info(message, data = null) {
    return this.log(this.levels.INFO, message, data);
  }

  warn(message, data = null) {
    return this.log(this.levels.WARN, message, data);
  }

  error(message, data = null) {
    return this.log(this.levels.ERROR, message, data);
  }

  debug(message, data = null) {
    if (process.env.DEBUG === "true") {
      return this.log(this.levels.DEBUG, message, data);
    }
  }

  
  gameEvent(roomId, event, data = null) {
    return this.info(`Game Event: ${event}`, {
      roomId,
      event,
      ...data,
    });
  }

  // Log player actions
  playerAction(playerId, action, data = null) {
    return this.info(`Player Action: ${action}`, {
      playerId,
      action,
      ...data,
    });
  }

  // Log WebSocket events
  socketEvent(socketId, event, data = null) {
    return this.debug(`Socket Event: ${event}`, {
      socketId,
      event,
      ...data,
    });
  }


  logError(error, context = null) {
    return this.error(error.message, {
      stack: error.stack,
      context,
    });
  }
}
