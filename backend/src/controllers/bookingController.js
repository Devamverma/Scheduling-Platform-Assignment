const prisma = require('../config/prisma');
const BookingService = require('../services/BookingService');
const { createError } = require('../utils/errors');

const bookingController = {
  // Get all bookings
  async getAll(req, res, next) {
    try {
      const { status, upcoming, past, startDate, endDate } = req.query;
      
      const now = new Date();
      let whereClause = { userId: req.user.id };

      if (status) {
        const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];
        if (!validStatuses.includes(status)) {
          throw createError.validation('Invalid status filter', { validStatuses });
        }
        whereClause.status = status;
      }

      if (upcoming === 'true') {
        whereClause.startTime = { gte: now };
        whereClause.status = { in: ['PENDING', 'CONFIRMED'] };
      }

      if (past === 'true') {
        whereClause.startTime = { lt: now };
      }

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          throw createError.invalidDate();
        }
        whereClause.startTime = {
          gte: start,
          lte: end
        };
      }

      const bookings = await prisma.booking.findMany({
        where: whereClause,
        include: {
          eventType: {
            select: {
              title: true,
              slug: true,
              duration: true,
              color: true
            }
          },
          responses: {
            include: {
              question: true
            }
          }
        },
        orderBy: { startTime: 'asc' }
      });

      res.json({ success: true, data: bookings, count: bookings.length });
    } catch (error) {
      next(error);
    }
  },

  // Get single booking
  async getOne(req, res, next) {
    try {
      const booking = await prisma.booking.findFirst({
        where: {
          id: req.params.id,
          userId: req.user.id
        },
        include: {
          eventType: true,
          responses: {
            include: {
              question: true
            }
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

  // Cancel booking
  async cancel(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const booking = await BookingService.cancelBookingById(id, req.user.id, reason);
      res.json({ success: true, data: booking });
    } catch (error) {
      next(error);
    }
  },

  // Confirm booking
  async confirm(req, res, next) {
    try {
      const { id } = req.params;

      const booking = await BookingService.confirmBooking(id, req.user.id);
      res.json({ success: true, data: booking });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = bookingController;
