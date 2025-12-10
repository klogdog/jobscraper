/**
 * Simple console logger for MVP
 */
function getTimestamp() {
  return new Date().toISOString();
}

function info(message, ...args) {
  console.log(`[${getTimestamp()}] INFO:`, message, ...args);
}

function error(message, ...args) {
  console.error(`[${getTimestamp()}] ERROR:`, message, ...args);
}

function debug(message, ...args) {
  console.log(`[${getTimestamp()}] DEBUG:`, message, ...args);
}

module.exports = {
  info,
  error,
  debug,
};
