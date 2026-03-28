const logger = require('../utils/logger');

/**
 * Request logging middleware
 * Logs all incoming HTTP requests with method, path, query, body, and IP
 */
const requestLogger = (req, res, next) => {
  req.startTime = Date.now();

  logger.request(req, req.query, req.body);

  next();
};

/**
 * Response logging middleware
 * Logs all outgoing HTTP responses with status code and duration
 */
const responseLogger = (req, res, next) => {
  // Capture original res.json
  const originalJson = res.json;

  res.json = function(data) {
    const duration = Date.now() - (req.startTime || Date.now());
    logger.response(req, res.statusCode, duration);
    
    // Call original res.json
    return originalJson.call(this, data);
  };

  next();
};

/**
 * Combined middleware setup
 * Usage: app.use(loggingMiddleware)
 */
const loggingMiddleware = [requestLogger, responseLogger];

module.exports = {
  requestLogger,
  responseLogger,
  loggingMiddleware
};
