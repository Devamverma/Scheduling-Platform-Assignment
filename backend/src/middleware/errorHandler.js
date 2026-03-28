const { AppError, ERROR_CODES } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Centralized error handler middleware
 * Converts all errors to standardized format and logs them
 */
const errorHandler = (err, req, res, next) => {
  // Log the error with full context
  const logMeta = {
    path: req.path,
    method: req.method,
    statusCode: err.statusCode || 500,
    errorCode: err.code,
    userId: req.user?.id
  };

  // If already an AppError, return as is
  if (err instanceof AppError) {
    logger.error(`${err.code}: ${err.message}`, logMeta, err);
    return res.status(err.statusCode).json(err.toJSON());
  }

  // Handle Prisma unique constraint errors
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'field';
    logger.error(`DUPLICATE_ENTRY on field: ${field}`, { ...logMeta, field }, err);
    const appError = new AppError(
      `A record with this ${field} already exists`,
      409,
      ERROR_CODES.DUPLICATE_ENTRY,
      { field }
    );
    return res.status(409).json(appError.toJSON());
  }

  // Handle Prisma record not found errors
  if (err.code === 'P2025') {
    logger.error('NOT_FOUND', logMeta, err);
    const appError = new AppError(
      'Record not found',
      404,
      ERROR_CODES.NOT_FOUND
    );
    return res.status(404).json(appError.toJSON());
  }

  // Handle Prisma validation errors
  if (err.code === 'P2003') {
    logger.error('VALIDATION_ERROR - Foreign key constraint', logMeta, err);
    const appError = new AppError(
      'Invalid reference or relationship constraint violated',
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
    return res.status(400).json(appError.toJSON());
  }

  // Handle Prisma invalid data type
  if (err.code === 'P2006' || err.code === 'P2007') {
    logger.error('INVALID_FORMAT - Invalid data type', logMeta, err);
    const appError = new AppError(
      'Invalid data type provided',
      400,
      ERROR_CODES.INVALID_FORMAT
    );
    return res.status(400).json(appError.toJSON());
  }

  // Handle validation errors from express-validator
  if (err.array && typeof err.array === 'function') {
    const errors = err.array();
    logger.warn('VALIDATION_ERROR - Express validator', { ...logMeta, validationErrors: errors });
    const appError = new AppError(
      'Validation failed',
      400,
      ERROR_CODES.VALIDATION_ERROR,
      { validationErrors: errors }
    );
    return res.status(400).json(appError.toJSON());
  }

  // Handle syntax errors (JSON parsing, etc.)
  if (err instanceof SyntaxError) {
    logger.error('INVALID_FORMAT - JSON syntax error', logMeta, err);
    const appError = new AppError(
      'Invalid JSON format',
      400,
      ERROR_CODES.INVALID_FORMAT
    );
    return res.status(400).json(appError.toJSON());
  }

  // Convert generic Error to AppError
  logger.error('INTERNAL_SERVER_ERROR', logMeta, err);
  const appError = new AppError(
    err.message || 'Internal server error',
    err.statusCode || 500,
    ERROR_CODES.INTERNAL_SERVER_ERROR
  );

  res.status(appError.statusCode).json(appError.toJSON());
};

module.exports = errorHandler;
