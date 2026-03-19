'use strict';

const app          = require('./app');
const { createLogger } = require('./utils/logger');

const logger = createLogger('server');
const PORT   = parseInt(process.env.PORT ?? '3001', 10);

const server = app.listen(PORT, () => {
  logger.info('server-started', { port: PORT, node_env: process.env.NODE_ENV ?? 'development' });
});

// 700 s — must exceed Privacy + T&C sequential Claude calls (up to 600 s total)
server.setTimeout(700 * 1000);

// Graceful shutdown
function shutdown(signal) {
  logger.info('shutdown-signal', { signal });
  server.close(() => {
    logger.info('server-closed');
    process.exit(0);
  });
  // Force-exit if graceful close takes too long
  setTimeout(() => process.exit(1), 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

module.exports = server;
