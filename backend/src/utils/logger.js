const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
  TRACE: 'TRACE'
};

const LOG_LEVEL_PRIORITY = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4
};

// Determine current log level from environment
const CURRENT_LOG_LEVEL = process.env.LOG_LEVEL || 'INFO';
const MIN_PRIORITY = LOG_LEVEL_PRIORITY[CURRENT_LOG_LEVEL] ?? LOG_LEVEL_PRIORITY.INFO;

/**
 * Format timestamp as ISO string
 */
function formatTimestamp() {
  return new Date().toISOString();
}

/**
 * Format log message
 */
function formatLogMessage(level, message, meta = {}) {
  const timestamp = formatTimestamp();
  const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
  return `[${timestamp}] [${level}] ${message}${metaStr ? ' ' + metaStr : ''}`;
}

/**
 * Write log to console with color
 */
function logToConsole(level, message, meta) {
  if (LOG_LEVEL_PRIORITY[level] > MIN_PRIORITY) {
    return;
  }

  const colors = {
    ERROR: '\x1b[31m', // Red
    WARN: '\x1b[33m',  // Yellow
    INFO: '\x1b[36m',  // Cyan
    DEBUG: '\x1b[35m', // Magenta
    TRACE: '\x1b[90m'  // Gray
  };
  const reset = '\x1b[0m';
  const color = colors[level] || reset;

  const formatted = formatLogMessage(level, message, meta);
  console.log(`${color}${formatted}${reset}`);
}

/**
 * Write log to file
 */
function logToFile(level, message, meta) {
  const logFile = path.join(logsDir, `${level.toLowerCase()}.log`);
  const formatted = formatLogMessage(level, message, meta);
  
  try {
    fs.appendFileSync(logFile, formatted + '\n');
  } catch (err) {
    console.error(`Failed to write to log file: ${err.message}`);
  }
}

/**
 * Log errors to separate file
 */
function logErrorToFile(level, message, meta, error) {
  const errorFile = path.join(logsDir, 'error-details.log');
  const timestamp = formatTimestamp();
  const formatted = `[${timestamp}] [${level}] ${message}\n`;
  const stack = error?.stack ? `Stack: ${error.stack}\n` : '';
  const details = Object.keys(meta).length > 0 ? `Details: ${JSON.stringify(meta)}\n` : '';
  
  try {
    fs.appendFileSync(errorFile, formatted + stack + details + '\n---\n');
  } catch (err) {
    console.error(`Failed to write to error log file: ${err.message}`);
  }
}

/**
 * Main logger object
 */
const logger = {
  /**
   * Log error message
   * @param {string} message - Error message
   * @param {object} meta - Additional metadata
   * @param {Error} error - Error object for stack trace
   */
  error: (message, meta = {}, error = null) => {
    logToConsole(LOG_LEVELS.ERROR, message, meta);
    logToFile(LOG_LEVELS.ERROR, message, meta);
    if (error) {
      logErrorToFile(LOG_LEVELS.ERROR, message, meta, error);
    }
  },

  /**
   * Log warning message
   * @param {string} message - Warning message
   * @param {object} meta - Additional metadata
   */
  warn: (message, meta = {}) => {
    logToConsole(LOG_LEVELS.WARN, message, meta);
    logToFile(LOG_LEVELS.WARN, message, meta);
  },

  /**
   * Log info message
   * @param {string} message - Info message
   * @param {object} meta - Additional metadata
   */
  info: (message, meta = {}) => {
    logToConsole(LOG_LEVELS.INFO, message, meta);
    logToFile(LOG_LEVELS.INFO, message, meta);
  },

  /**
   * Log debug message
   * @param {string} message - Debug message
   * @param {object} meta - Additional metadata
   */
  debug: (message, meta = {}) => {
    logToConsole(LOG_LEVELS.DEBUG, message, meta);
    logToFile(LOG_LEVELS.DEBUG, message, meta);
  },

  /**
   * Log trace message
   * @param {string} message - Trace message
   * @param {object} meta - Additional metadata
   */
  trace: (message, meta = {}) => {
    logToConsole(LOG_LEVELS.TRACE, message, meta);
    logToFile(LOG_LEVELS.TRACE, message, meta);
  },

  /**
   * Log HTTP request
   * @param {object} req - Express request object
   * @param {object} query - Query parameters
   * @param {object} body - Request body (filtered for sensitive fields)
   */
  request: (req, query = {}, body = {}) => {
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret'];
    const filteredBody = { ...body };
    
    // Remove sensitive fields
    sensitiveFields.forEach(field => {
      if (filteredBody[field]) {
        filteredBody[field] = '[REDACTED]';
      }
    });

    const meta = {
      method: req.method,
      path: req.path,
      query: Object.keys(query).length > 0 ? query : undefined,
      body: Object.keys(filteredBody).length > 0 ? filteredBody : undefined,
      ip: req.ip,
      userAgent: req.get('user-agent')
    };

    // Remove undefined values
    Object.keys(meta).forEach(key => meta[key] === undefined && delete meta[key]);

    logger.info(`Incoming ${req.method} request`, meta);
  },

  /**
   * Log HTTP response
   * @param {object} req - Express request object
   * @param {number} statusCode - HTTP status code
   * @param {number} responseTime - Response time in ms
   * @param {object} data - Response data (optional)
   */
  response: (req, statusCode, responseTime, data = null) => {
    const meta = {
      method: req.method,
      path: req.path,
      statusCode,
      responseTime: `${responseTime}ms`,
      ...(data && { dataSize: JSON.stringify(data).length })
    };

    const level = statusCode >= 400 ? LOG_LEVELS.WARN : LOG_LEVELS.INFO;
    const levelFn = level === LOG_LEVELS.WARN ? logger.warn : logger.info;
    levelFn(`${req.method} ${req.path} ${statusCode}`, meta);
  },

  /**
   * Log operation (DB query, external API call, etc.)
   * @param {string} operation - Operation name
   * @param {number} duration - Duration in ms
   * @param {boolean} success - Whether operation succeeded
   * @param {object} meta - Additional metadata
   */
  operation: (operation, duration, success = true, meta = {}) => {
    const message = `${operation} completed in ${duration}ms`;
    const fullMeta = {
      operation,
      duration: `${duration}ms`,
      status: success ? 'success' : 'failed',
      ...meta
    };

    const level = success ? LOG_LEVELS.DEBUG : LOG_LEVELS.WARN;
    const levelFn = level === LOG_LEVELS.DEBUG ? logger.debug : logger.warn;
    levelFn(message, fullMeta);
  },

  /**
   * Log database operation
   * @param {string} table - Table name
   * @param {string} operation - Operation type (find, create, update, delete)
   * @param {number} duration - Duration in ms
   * @param {object} meta - Additional metadata
   */
  db: (table, operation, duration, meta = {}) => {
    const fullMeta = {
      table,
      operation,
      duration: `${duration}ms`,
      ...meta
    };
    logger.debug(`Database ${operation} on ${table}`, fullMeta);
  },

  /**
   * Log authorization event
   * @param {string} action - Action being authorized
   * @param {string} userId - User ID
   * @param {boolean} allowed - Whether action was allowed
   * @param {object} meta - Additional metadata
   */
  auth: (action, userId, allowed, meta = {}) => {
    const fullMeta = {
      action,
      userId,
      allowed,
      ...meta
    };

    const level = allowed ? LOG_LEVELS.DEBUG : LOG_LEVELS.WARN;
    const levelFn = level === LOG_LEVELS.DEBUG ? logger.debug : logger.warn;
    levelFn(`Authorization check for ${action}`, fullMeta);
  }
};

module.exports = logger;
