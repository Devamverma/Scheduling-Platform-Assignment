const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const publicController = require('../controllers/publicController');
const validate = require('../middleware/validate');

// Get user's public profile and event types
router.get('/:username', publicController.getUserProfile);

// Get event type details for booking
router.get('/:username/:eventSlug', publicController.getEventType);

// Get available slots for a date
router.get('/:username/:eventSlug/slots', publicController.getAvailableSlots);

// Create booking
router.post('/:username/:eventSlug/book',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('date').notEmpty().withMessage('Date is required'),
    body('time').notEmpty().withMessage('Time is required'),
    body('timezone').notEmpty().withMessage('Timezone is required'),
  ],
  validate,
  publicController.createBooking
);

// Get booking confirmation
router.get('/booking/:uid', publicController.getBookingConfirmation);

// Cancel booking (by booker)
router.post('/booking/:uid/cancel', publicController.cancelBooking);

// Reschedule booking
router.post('/booking/:uid/reschedule',
  [
    body('date').notEmpty().withMessage('Date is required'),
    body('time').notEmpty().withMessage('Time is required'),
  ],
  validate,
  publicController.rescheduleBooking
);

module.exports = router;
