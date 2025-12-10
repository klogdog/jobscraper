/**
 * Simple console logger with timestamp
 * Provides basic logging functionality for the application
 */

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

function getTimestamp() {
  return new Date().toISOString();
}

function formatMessage(level, message, ...args) {
  const timestamp = getTimestamp();
  const formattedArgs = args.length > 0 ? ' ' + args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
  ).join(' ') : '';
  return `[${timestamp}] [${level}] ${message}${formattedArgs}`;
}

const logger = {
  error: (message, ...args) => {
    console.error(formatMessage(LOG_LEVELS.ERROR, message, ...args));
  },
  
  warn: (message, ...args) => {
    console.warn(formatMessage(LOG_LEVELS.WARN, message, ...args));
  },
  
  info: (message, ...args) => {
    console.log(formatMessage(LOG_LEVELS.INFO, message, ...args));
  },
  
  debug: (message, ...args) => {
    if (process.env.LOG_LEVEL === 'debug') {
      console.log(formatMessage(LOG_LEVELS.DEBUG, message, ...args));
    }
  }
};

module.exports = logger;
