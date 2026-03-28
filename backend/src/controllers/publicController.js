const BookingService = require('../services/BookingService');
const UserService = require('../services/UserService');
const { createError } = require('../utils/errors');
const { 
  generateTimeSlots
} = require('../utils/availability');
const prisma = require('../config/prisma');

const publicController = {
  // Get user's public profile
  async getUserProfile(req, res, next) {
    try {
      const { username } = req.params;
      const user = await UserService.getUserProfile(username);
      if (!user) {
        throw createError.userNotFound();
      }
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },

  // Get event type for booking page
  async getEventType(req, res, next) {
    try {
      const { username, eventSlug } = req.params;
      const eventType = await UserService.getEventTypeForBooking(username, eventSlug);
      if (!eventType) {
        throw createError.eventTypeNotFound();
      }
      res.json({ success: true, data: eventType });
    } catch (error) {
      next(error);
    }
  },

  // Get available time slots
  async getAvailableSlots(req, res, next) {
    try {
      const { username, eventSlug } = req.params;
      const { date, timezone } = req.query;

      if (!date || !timezone) {
        throw createError.validation('Date and timezone are required', { 
          missingFields: { date: !date, timezone: !timezone } 
        });
      }

      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw createError.invalidDate();
      }

      const eventType = await UserService.getEventTypeForBooking(username, eventSlug);
      if (!eventType) {
        throw createError.eventTypeNotFound();
      }

      // Get existing bookings for this date
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const existingBookings = await prisma.booking.findMany({
        where: {
          userId: eventType.userId,
          status: { in: ['PENDING', 'CONFIRMED'] },
          startTime: {
            gte: startOfDay,
            lte: endOfDay
          }
        },
        select: {
          startTime: true,
          endTime: true
        }
      });

      // Generate available slots
      const slots = generateTimeSlots(
        eventType,
        date,
        timezone,
        existingBookings
      );

      res.json({ success: true, data: { slots, date, timezone } });
    } catch (error) {
      next(error);
    }
  },

  // Create booking
  async createBooking(req, res, next) {
    try {
      const { username, eventSlug } = req.params;
      const booking = await BookingService.createBooking(username, eventSlug, req.body);
      res.status(201).json({ success: true, data: booking });
    } catch (error) {
      next(error);
    }
  },

  // Get booking confirmation details
  async getBookingConfirmation(req, res, next) {
    try {
      const { uid } = req.params;

      const booking = await prisma.booking.findUnique({
        where: { uid },
        include: {
          eventType: {
            include: {
              user: {
                select: { name: true, username: true }
              }
            }
          },
          responses: {
            include: { question: true }
          }
        }
      });

      if (!booking) {
        throw createError.bookingNotFound();
      }

      res.json({ success: true, data: booking });
    } catch (error) {
      next(error);
    }
  },

  // Cancel booking (by booker)
  async cancelBooking(req, res, next) {
    try {
      const { uid } = req.params;
      const { reason } = req.body;
      const booking = await BookingService.cancelBookingByUid(uid, reason);
      res.json({ success: true, data: booking });
    } catch (error) {
      next(error);
    }
  },

  // Reschedule booking
  async rescheduleBooking(req, res, next) {
    try {
      const { uid } = req.params;
      const booking = await BookingService.rescheduleBooking(uid, req.body);
      res.json({ success: true, data: booking });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = publicController;
