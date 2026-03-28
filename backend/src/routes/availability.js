const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const availabilityController = require('../controllers/availabilityController');
const injectDefaultUser = require('../middleware/defaultUser');
const validate = require('../middleware/validate');

router.use(injectDefaultUser);

// Get all schedules
router.get('/schedules', availabilityController.getAllSchedules);

// Get single schedule
router.get('/schedules/:id', availabilityController.getSchedule);

// Create schedule
router.post('/schedules',
  [
    body('name').trim().notEmpty().withMessage('Schedule name is required'),
    body('timezone').notEmpty().withMessage('Timezone is required'),
  ],
  validate,
  availabilityController.createSchedule
);

// Update schedule
router.put('/schedules/:id', availabilityController.updateSchedule);

// Delete schedule
router.delete('/schedules/:id', availabilityController.deleteSchedule);

// Set default schedule
router.patch('/schedules/:id/set-default', availabilityController.setDefault);

// Update weekly hours
router.put('/schedules/:id/weekly-hours', availabilityController.updateWeeklyHours);

// Date overrides
router.post('/schedules/:id/date-overrides', availabilityController.addDateOverride);
router.delete('/date-overrides/:overrideId', availabilityController.removeDateOverride);

module.exports = router;
