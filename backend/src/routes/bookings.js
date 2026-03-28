const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const injectDefaultUser = require('../middleware/defaultUser');

router.use(injectDefaultUser);

// Get all bookings (with filters)
router.get('/', bookingController.getAll);

// Get single booking
router.get('/:id', bookingController.getOne);

// Cancel booking
router.patch('/:id/cancel', bookingController.cancel);

// Confirm booking (if requires confirmation)
router.patch('/:id/confirm', bookingController.confirm);

module.exports = router;
