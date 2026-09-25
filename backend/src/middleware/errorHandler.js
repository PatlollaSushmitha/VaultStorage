const logger = require("../utils/logger");

/**
 * Standard application error with an HTTP status code attached.
 */
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

/** 404 handler for unmatched routes. */
function notFoundHandler(req, res, _next) {
  res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.originalUrl}` });
}

/** Central error handler. Must be registered last with 4 args. */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || 500;

  if (statusCode >= 500) {
    logger.error(err);
  } else {
    logger.warn(err.message);
  }

  res.status(statusCode).json({
    success: false,
    error: err.message || "Internal server error",
  });
}

/** Wrap an async route handler so rejected promises reach errorHandler. */
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = { ApiError, notFoundHandler, errorHandler, asyncHandler };
