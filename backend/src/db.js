// Maintained for backward compatibility. See store.js for full persistence logic.
const { initStore, checkHealth } = require('./store');

module.exports = {
  initializeDatabase: initStore,
  checkHealth,
};
