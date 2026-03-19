'use strict';

/**
 * Error logger stub — writes to stdout in structured JSON.
 * Compatible with the logError(err, req) signature used by error-handler.js.
 */
function logError(err, req) {
  process.stdout.write(JSON.stringify({
    ts:      new Date().toISOString(),
    service: 'error',
    level:   'error',
    event:   'unhandled_error',
    message: err.message,
    code:    err.code || 'UNKNOWN',
    url:     req?.originalUrl,
    method:  req?.method,
  }) + '\n');
}

module.exports = { logError };
