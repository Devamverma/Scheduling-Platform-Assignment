/**
 * Application Error Class
 * Standardized error format for all API responses
 */

class AppError extends Error {
  constructor(message, statusCode, code = null, metadata = {}) {
    super(message);
    this.statusCode = statusCode;
    this.code = code; // Error code for frontend handling
    this.metadata = metadata; // Additional error details
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      success: false,
      error: {
        message: this.message,
        code: this.code,
        statusCode: this.statusCode,
        ...(Object.keys(this.metadata).length > 0 && { details: this.metadata }),
        timestamp: this.timestamp
      }
    };
  }
}

/**
 * Error codes for different scenarios
 */
const ERROR_CODES = {
  // Validation errors (400)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  INVALID_DURATION: 'INVALID_DURATION',
  INVALID_TIMEZONE: 'INVALID_TIMEZONE',
  INVALID_DATE: 'INVALID_DATE',
  INVALID_TIME_SLOT: 'INVALID_TIME_SLOT',

  // Authentication errors (401)
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',

  // Authorization errors (403)
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // Not found errors (404)
  NOT_FOUND: 'NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  EVENT_TYPE_NOT_FOUND: 'EVENT_TYPE_NOT_FOUND',
  BOOKING_NOT_FOUND: 'BOOKING_NOT_FOUND',
  SCHEDULE_NOT_FOUND: 'SCHEDULE_NOT_FOUND',

  // Conflict errors (409)
  CONFLICT: 'CONFLICT',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  DUPLICATE_EMAIL: 'DUPLICATE_EMAIL',
  DUPLICATE_SLUG: 'DUPLICATE_SLUG',
  SCHEDULE_IN_USE: 'SCHEDULE_IN_USE',

  // Business logic errors (422)
  BOOKING_CONFLICT: 'BOOKING_CONFLICT',
  BOOKING_NOT_ALLOWED: 'BOOKING_NOT_ALLOWED',
  INSUFFICIENT_NOTICE: 'INSUFFICIENT_NOTICE',
  SLOT_UNAVAILABLE: 'SLOT_UNAVAILABLE',
  CANNOT_MODIFY_BOOKING: 'CANNOT_MODIFY_BOOKING',
  BOOKING_ALREADY_CONFIRMED: 'BOOKING_ALREADY_CONFIRMED',

  // Server errors (500)
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EMAIL_SERVICE_ERROR: 'EMAIL_SERVICE_ERROR',
};

/**
 * Helper functions to create standardized errors
 */
const createError = {
  // 400 Bad Request
  validation: (message, metadata = {}) =>
    new AppError(message, 400, ERROR_CODES.VALIDATION_ERROR, metadata),
  
  missingField: (fieldName) =>
    new AppError(`${fieldName} is required`, 400, ERROR_CODES.MISSING_REQUIRED_FIELD, { field: fieldName }),
  
  invalidFormat: (fieldName, expectedFormat) =>
    new AppError(`${fieldName} has invalid format`, 400, ERROR_CODES.INVALID_FORMAT, { field: fieldName, expectedFormat }),
  
  invalidDuration: () =>
    new AppError('Duration must be between 5 and 480 minutes', 400, ERROR_CODES.INVALID_DURATION, { minMinutes: 5, maxMinutes: 480 }),
  
  invalidTimezone: () =>
    new AppError('Invalid timezone provided', 400, ERROR_CODES.INVALID_TIMEZONE),
  
  invalidDate: () =>
    new AppError('Invalid date format. Use YYYY-MM-DD', 400, ERROR_CODES.INVALID_DATE),
  
  invalidTimeSlot: () =>
    new AppError('Invalid time slot selected', 400, ERROR_CODES.INVALID_TIME_SLOT),

  // 401 Unauthorized
  unauthorized: () =>
    new AppError('You are not authorized to access this resource', 401, ERROR_CODES.UNAUTHORIZED),
  
  invalidCredentials: () =>
    new AppError('Invalid email or password', 401, ERROR_CODES.INVALID_CREDENTIALS),
  
  tokenExpired: () =>
    new AppError('Your session has expired. Please log in again', 401, ERROR_CODES.TOKEN_EXPIRED),
  
  tokenInvalid: () =>
    new AppError('Invalid token provided', 401, ERROR_CODES.TOKEN_INVALID),

  // 403 Forbidden
  forbidden: () =>
    new AppError('You do not have permission to perform this action', 403, ERROR_CODES.FORBIDDEN),
  
  insufficientPermissions: (resource) =>
    new AppError(`You do not have permission to access ${resource}`, 403, ERROR_CODES.INSUFFICIENT_PERMISSIONS, { resource }),

  // 404 Not Found
  notFound: (resource) =>
    new AppError(`${resource} not found`, 404, ERROR_CODES.NOT_FOUND, { resource }),
  
  userNotFound: () =>
    new AppError('User not found', 404, ERROR_CODES.USER_NOT_FOUND),
  
  eventTypeNotFound: () =>
    new AppError('Event type not found', 404, ERROR_CODES.EVENT_TYPE_NOT_FOUND),
  
  bookingNotFound: () =>
    new AppError('Booking not found', 404, ERROR_CODES.BOOKING_NOT_FOUND),
  
  scheduleNotFound: () =>
    new AppError('Schedule not found', 404, ERROR_CODES.SCHEDULE_NOT_FOUND),

  // 409 Conflict
  conflict: (message) =>
    new AppError(message, 409, ERROR_CODES.CONFLICT),
  
  duplicateEntry: (fieldName) =>
    new AppError(`A record with this ${fieldName} already exists`, 409, ERROR_CODES.DUPLICATE_ENTRY, { field: fieldName }),
  
  duplicateEmail: () =>
    new AppError('Email already in use', 409, ERROR_CODES.DUPLICATE_EMAIL),
  
  duplicateSlug: () =>
    new AppError('This URL slug is already in use', 409, ERROR_CODES.DUPLICATE_SLUG),
  
  scheduleInUse: () =>
    new AppError('Cannot delete schedule with linked event types. Reassign them first.', 409, ERROR_CODES.SCHEDULE_IN_USE),

  // 422 Unprocessable Entity
  bookingConflict: () =>
    new AppError('This time slot is no longer available', 422, ERROR_CODES.BOOKING_CONFLICT),
  
  bookingNotAllowed: (reason) =>
    new AppError(`Booking not allowed: ${reason}`, 422, ERROR_CODES.BOOKING_NOT_ALLOWED, { reason }),
  
  insufficientNotice: (minutesRequired) =>
    new AppError(`Booking requires ${minutesRequired} minutes notice`, 422, ERROR_CODES.INSUFFICIENT_NOTICE, { minutesRequired }),
  
  slotUnavailable: () =>
    new AppError('Selected time slot is not available', 422, ERROR_CODES.SLOT_UNAVAILABLE),
  
  cannotModifyBooking: (reason) =>
    new AppError(`Cannot modify booking: ${reason}`, 422, ERROR_CODES.CANNOT_MODIFY_BOOKING, { reason }),
  
  bookingAlreadyConfirmed: () =>
    new AppError('Booking is already confirmed', 422, ERROR_CODES.BOOKING_ALREADY_CONFIRMED),

  // 500 Server Errors
  internal: (message = 'Internal server error') =>
    new AppError(message, 500, ERROR_CODES.INTERNAL_SERVER_ERROR),
  
  database: (operation) =>
    new AppError('Database operation failed', 500, ERROR_CODES.DATABASE_ERROR, { operation }),
  
  emailService: () =>
    new AppError('Failed to send email. Please try again later.', 500, ERROR_CODES.EMAIL_SERVICE_ERROR),
};

module.exports = {
  AppError,
  ERROR_CODES,
  createError
};
