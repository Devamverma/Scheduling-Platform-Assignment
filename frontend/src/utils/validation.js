/**
 * Frontend Input Validation Utilities
 * Provides validators for various form inputs across the application
 */

// Email validation pattern (RFC 5322 simplified)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// URL slug pattern (lowercase letters, numbers, hyphens)
const SLUG_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

// Basic name pattern (letters, spaces, hyphens, apostrophes)
const NAME_REGEX = /^[a-zA-Z\s'-]{2,}$/;

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {Object} { isValid: boolean, error?: string }
 */
export function validateEmail(email) {
  if (!email || !email.trim()) {
    return { isValid: false, error: 'Email is required' };
  }

  email = email.trim().toLowerCase();

  if (email.length > 254) {
    return { isValid: false, error: 'Email is too long (max 254 characters)' };
  }

  if (!EMAIL_REGEX.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true };
}

/**
 * Validate person's name
 * @param {string} name - Name to validate
 * @param {number} minLength - Minimum length (default: 2)
 * @returns {Object} { isValid: boolean, error?: string }
 */
export function validateName(name, minLength = 2) {
  if (!name || !name.trim()) {
    return { isValid: false, error: 'Name is required' };
  }

  name = name.trim();

  if (name.length < minLength) {
    return { isValid: false, error: `Name must be at least ${minLength} characters` };
  }

  if (name.length > 100) {
    return { isValid: false, error: 'Name is too long (max 100 characters)' };
  }

  if (!NAME_REGEX.test(name)) {
    return { isValid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
  }

  return { isValid: true };
}

/**
 * Validate event type title
 * @param {string} title - Title to validate
 * @returns {Object} { isValid: boolean, error?: string }
 */
export function validateEventTypeTitle(title) {
  if (!title || !title.trim()) {
    return { isValid: false, error: 'Title is required' };
  }

  title = title.trim();

  if (title.length < 3) {
    return { isValid: false, error: 'Title must be at least 3 characters' };
  }

  if (title.length > 100) {
    return { isValid: false, error: 'Title is too long (max 100 characters)' };
  }

  return { isValid: true };
}

/**
 * Validate URL slug for event types
 * @param {string} slug - Slug to validate
 * @returns {Object} { isValid: boolean, error?: string }
 */
export function validateSlug(slug) {
  if (!slug || !slug.trim()) {
    return { isValid: false, error: 'URL slug is required' };
  }

  slug = slug.trim().toLowerCase();

  if (slug.length < 2) {
    return { isValid: false, error: 'Slug must be at least 2 characters' };
  }

  if (slug.length > 50) {
    return { isValid: false, error: 'Slug is too long (max 50 characters)' };
  }

  if (!SLUG_REGEX.test(slug)) {
    return { isValid: false, error: 'Slug can only contain lowercase letters, numbers, and hyphens' };
  }

  return { isValid: true };
}

/**
 * Validate event type description
 * @param {string} description - Description to validate
 * @returns {Object} { isValid: boolean, error?: string }
 */
export function validateDescription(description) {
  if (!description || !description.trim()) {
    // Description is optional
    return { isValid: true };
  }

  description = description.trim();

  if (description.length > 500) {
    return { isValid: false, error: 'Description is too long (max 500 characters)' };
  }

  return { isValid: true };
}

/**
 * Validate booking notes
 * @param {string} notes - Notes to validate
 * @returns {Object} { isValid: boolean, error?: string }
 */
export function validateNotes(notes) {
  if (!notes || !notes.trim()) {
    // Notes are optional
    return { isValid: true };
  }

  notes = notes.trim();

  if (notes.length > 1000) {
    return { isValid: false, error: 'Notes are too long (max 1000 characters)' };
  }

  return { isValid: true };
}

/**
 * Validate event duration
 * @param {number} duration - Duration in minutes
 * @returns {Object} { isValid: boolean, error?: string }
 */
export function validateDuration(duration) {
  const durationNum = parseInt(duration);

  if (isNaN(durationNum) || durationNum <= 0) {
    return { isValid: false, error: 'Duration must be greater than 0' };
  }

  if (durationNum < 5) {
    return { isValid: false, error: 'Duration must be at least 5 minutes' };
  }

  if (durationNum > 480) {
    return { isValid: false, error: 'Duration cannot exceed 8 hours' };
  }

  return { isValid: true };
}

/**
 * Validate buffer time
 * @param {number} bufferTime - Buffer time in minutes
 * @returns {Object} { isValid: boolean, error?: string }
 */
export function validateBufferTime(bufferTime) {
  const bufferNum = parseInt(bufferTime);

  if (isNaN(bufferNum) || bufferNum < 0) {
    return { isValid: false, error: 'Buffer time cannot be negative' };
  }

  if (bufferNum > 180) {
    return { isValid: false, error: 'Buffer time cannot exceed 3 hours' };
  }

  return { isValid: true };
}

/**
 * Validate minimum notice time
 * @param {number} minimumNotice - Minimum notice in minutes
 * @returns {Object} { isValid: boolean, error?: string }
 */
export function validateMinimumNotice(minimumNotice) {
  const noticeNum = parseInt(minimumNotice);

  if (isNaN(noticeNum) || noticeNum < 0) {
    return { isValid: false, error: 'Minimum notice cannot be negative' };
  }

  if (noticeNum > 43200) {
    return { isValid: false, error: 'Minimum notice cannot exceed 30 days' };
  }

  return { isValid: true };
}

/**
 * Validate schedule ID
 * @param {string} scheduleId - Schedule ID to validate
 * @returns {Object} { isValid: boolean, error?: string }
 */
export function validateScheduleId(scheduleId) {
  if (!scheduleId || !scheduleId.trim()) {
    return { isValid: false, error: 'Please select a schedule' };
  }

  return { isValid: true };
}

/**
 * Validate entire booking form
 * @param {Object} formData - Form data object
 * @returns {Object} { isValid: boolean, errors: { fieldName: string } }
 */
export function validateBookingForm(formData) {
  const errors = {};

  const nameValidation = validateName(formData.name);
  if (!nameValidation.isValid) {
    errors.name = nameValidation.error;
  }

  const emailValidation = validateEmail(formData.email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.error;
  }

  const notesValidation = validateNotes(formData.notes);
  if (!notesValidation.isValid) {
    errors.notes = notesValidation.error;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate entire event type form
 * @param {Object} formData - Form data object
 * @returns {Object} { isValid: boolean, errors: { fieldName: string } }
 */
export function validateEventTypeForm(formData) {
  const errors = {};

  const titleValidation = validateEventTypeTitle(formData.title);
  if (!titleValidation.isValid) {
    errors.title = titleValidation.error;
  }

  const slugValidation = validateSlug(formData.slug);
  if (!slugValidation.isValid) {
    errors.slug = slugValidation.error;
  }

  const descriptionValidation = validateDescription(formData.description);
  if (!descriptionValidation.isValid) {
    errors.description = descriptionValidation.error;
  }

  const durationValidation = validateDuration(formData.duration);
  if (!durationValidation.isValid) {
    errors.duration = durationValidation.error;
  }

  const scheduleValidation = validateScheduleId(formData.scheduleId);
  if (!scheduleValidation.isValid) {
    errors.scheduleId = scheduleValidation.error;
  }

  const bufferBeforeValidation = validateBufferTime(formData.bufferTimeBefore);
  if (!bufferBeforeValidation.isValid) {
    errors.bufferTimeBefore = bufferBeforeValidation.error;
  }

  const bufferAfterValidation = validateBufferTime(formData.bufferTimeAfter);
  if (!bufferAfterValidation.isValid) {
    errors.bufferTimeAfter = bufferAfterValidation.error;
  }

  const minimumNoticeValidation = validateMinimumNotice(formData.minimumNotice);
  if (!minimumNoticeValidation.isValid) {
    errors.minimumNotice = minimumNoticeValidation.error;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Sanitize text input to prevent XSS
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
export function sanitizeText(text) {
  if (!text) return '';

  // Remove HTML tags and common XSS vectors
  return text
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .trim();
}

/**
 * Format validation errors for display
 * @param {Object} errors - Errors object from validation
 * @returns {Array} Array of formatted error messages
 */
export function formatValidationErrors(errors) {
  return Object.entries(errors)
    .map(([field, message]) => message)
    .filter(Boolean);
}
