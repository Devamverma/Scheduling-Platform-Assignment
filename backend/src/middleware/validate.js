const { validationResult } = require('express-validator');

/**
 * Validation middleware for express-validator
 * Checks for validation errors and returns them in a standardized format
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {void}
 * 
 * @example
 * router.post('/', [
 *   body('email').isEmail(),
 *   body('name').notEmpty()
 * ], validate, controller.create);
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      errors: errors.array(),
      message: 'Validation failed'
    });
  }
  next();
};

module.exports = validate;
