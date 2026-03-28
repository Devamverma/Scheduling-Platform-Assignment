const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const eventTypeController = require('../controllers/eventTypeController');
const injectDefaultUser = require('../middleware/defaultUser');
const validate = require('../middleware/validate');

// Apply default user middleware to all routes
router.use(injectDefaultUser);

// Get all event types for user
router.get('/', eventTypeController.getAll);

// Get single event type
router.get('/:id', eventTypeController.getOne);

// Create event type
router.post('/',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('slug').trim().notEmpty().withMessage('Slug is required')
      .matches(/^[a-z0-9-]+$/).withMessage('Slug can only contain lowercase letters, numbers, and hyphens'),
    body('duration').isInt({ min: 5, max: 480 }).withMessage('Duration must be between 5 and 480 minutes'),
    body('description').optional().trim(),
    body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color format'),
  ],
  validate,
  eventTypeController.create
);

// Update event type
router.put('/:id',
  [
    param('id').notEmpty(),
    body('title').optional().trim().notEmpty(),
    body('slug').optional().trim()
      .matches(/^[a-z0-9-]+$/).withMessage('Slug can only contain lowercase letters, numbers, and hyphens'),
    body('duration').optional().isInt({ min: 5, max: 480 }),
  ],
  validate,
  eventTypeController.update
);

// Delete event type
router.delete('/:id', eventTypeController.delete);

// Toggle event type active status
router.patch('/:id/toggle', eventTypeController.toggle);

module.exports = router;
