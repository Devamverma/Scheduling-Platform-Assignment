const prisma = require('../config/prisma');
const { 
  parseDateTime,
  isSlotAvailable 
} = require('../utils/availability');
const { sendBookingConfirmation, sendRescheduleEmail } = require('../utils/email');
const { v4: uuidv4 } = require('uuid');

/**
 * BookingService
 * Handles all business logic related to bookings
 * Separated from controllers for better testability and reusability
 */
const BookingService = {
  /**
   * Create a new booking
   * @param {string} username - Username of the event owner
   * @param {string} eventSlug - Slug of the event type
   * @param {Object} bookingData - Booking data (name, email, date, time, timezone, notes, responses)
   * @returns {Promise<Object>} Created booking
   * @throws {Error} If validation fails or slot is unavailable
   */
  async createBooking(username, eventSlug, bookingData) {
    const { name, email, date, time, timezone, notes, responses } = bookingData;

    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { username }
    });
    if (!user) {
      throw new Error('User not found');
    }

    // Validate event type exists and is active
    const eventType = await prisma.eventType.findFirst({
      where: {
        userId: user.id,
        slug: eventSlug,
        isActive: true
      },
      include: {
        schedule: {
          include: {
            weeklyHours: true,
            dateOverrides: true
          }
        }
      }
    });
    if (!eventType) {
      throw new Error('Event type not found');
    }

    // Parse and validate the datetime
    const { startTime, endTime } = parseDateTime(date, time, timezone, eventType.duration);

    // Validate minimum notice
    await this.validateMinimumNotice(startTime, eventType.minimumNotice);

    // Check for time conflicts
    await this.checkTimeConflict(user.id, startTime, endTime, eventType);

    // Verify slot availability based on schedule
    const isAvailable = await isSlotAvailable(eventType, startTime, timezone);
    if (!isAvailable) {
      throw new Error('Selected time is not within available hours');
    }

    // Create the booking
    const booking = await prisma.booking.create({
      data: {
        uid: uuidv4(),
        title: `${eventType.title} with ${name}`,
        startTime,
        endTime,
        status: eventType.requiresConfirmation ? 'PENDING' : 'CONFIRMED',
        bookerName: name,
        bookerEmail: email,
        bookerTimezone: timezone,
        notes,
        eventTypeId: eventType.id,
        userId: user.id,
        ...(responses && responses.length > 0 && {
          responses: {
            create: responses.map(r => ({
              questionId: r.questionId,
              answer: r.answer
            }))
          }
        })
      },
      include: {
        eventType: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        },
        responses: {
          include: { question: true }
        }
      }
    });

    // Send confirmation email (non-blocking)
    this.sendBookingEmailSafe(booking);

    return booking;
  },

  /**
   * Validate that booking request meets minimum notice requirement
   * @param {Date} startTime - Start time of booking
   * @param {number} minimumNotice - Minimum notice in minutes
   * @throws {Error} If minimum notice not met
   */
  async validateMinimumNotice(startTime, minimumNotice) {
    const now = new Date();
    const minutesUntilStart = (startTime - now) / (1000 * 60);
    if (minutesUntilStart < minimumNotice) {
      throw new Error(
        `Bookings require at least ${minimumNotice} minutes notice`
      );
    }
  },

  /**
   * Check for time conflicts with existing bookings
   * @param {string} userId - User ID
   * @param {Date} startTime - Start time
   * @param {Date} endTime - End time
   * @param {Object} eventType - Event type with buffer times
   * @throws {Error} If conflict found
   */
  async checkTimeConflict(userId, startTime, endTime, eventType) {
    const bufferStart = new Date(startTime.getTime() - eventType.bufferTimeBefore * 60000);
    const bufferEnd = new Date(endTime.getTime() + eventType.bufferTimeAfter * 60000);

    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        userId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        OR: [
          {
            startTime: { lt: bufferEnd },
            endTime: { gt: bufferStart }
          }
        ]
      }
    });

    if (conflictingBooking) {
      throw new Error('This time slot is no longer available');
    }
  },

  /**
   * Send booking confirmation email safely (doesn't throw)
   * @param {Object} booking - Booking object
   */
  async sendBookingEmailSafe(booking) {
    try {
      await sendBookingConfirmation(booking);
    } catch (error) {
      console.error('Failed to send confirmation email:', error);
      // Don't throw - booking was created successfully
    }
  },

  /**
   * Cancel a booking by UID
   * @param {string} uid - Booking UID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} Updated booking
   * @throws {Error} If booking not found or already cancelled
   */
  async cancelBookingByUid(uid, reason) {
    const booking = await prisma.booking.findUnique({
      where: { uid }
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status === 'CANCELLED') {
      throw new Error('Booking is already cancelled');
    }

    return await prisma.booking.update({
      where: { uid },
      data: {
        status: 'CANCELLED',
        cancellationReason: reason
      }
    });
  },

  /**
   * Cancel a booking by ID (admin)
   * @param {string} bookingId - Booking ID
   * @param {string} userId - User ID (for authorization)
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} Updated booking
   * @throws {Error} If booking not found, unauthorized, or already cancelled
   */
  async cancelBookingById(bookingId, userId, reason) {
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId
      }
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status === 'CANCELLED') {
      throw new Error('Booking is already cancelled');
    }

    return await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED',
        cancellationReason: reason
      }
    });
  },

  /**
   * Confirm a pending booking
   * @param {string} bookingId - Booking ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Object>} Updated booking
   * @throws {Error} If booking not found or not pending
   */
  async confirmBooking(bookingId, userId) {
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId,
        status: 'PENDING'
      }
    });

    if (!booking) {
      throw new Error('Booking not found or not pending');
    }

    return await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CONFIRMED' },
      include: {
        eventType: true
      }
    });
  },

  /**
   * Reschedule a booking
   * @param {string} uid - Booking UID
   * @param {Object} rescheduleData - New date and time
   * @returns {Promise<Object>} Updated booking
   * @throws {Error} If validation fails
   */
  async rescheduleBooking(uid, rescheduleData) {
    const { date, time, timezone } = rescheduleData;

    const booking = await prisma.booking.findUnique({
      where: { uid },
      include: {
        eventType: {
          include: {
            schedule: {
              include: {
                weeklyHours: true,
                dateOverrides: true
              }
            }
          }
        }
      }
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status === 'CANCELLED') {
      throw new Error('Cannot reschedule a cancelled booking');
    }

    // Parse new datetime
    const { startTime, endTime } = parseDateTime(date, time, timezone, booking.eventType.duration);

    // Validate new slot
    await this.validateMinimumNotice(startTime, booking.eventType.minimumNotice);
    await this.checkTimeConflict(booking.userId, startTime, endTime, booking.eventType);

    const isAvailable = await isSlotAvailable(booking.eventType, startTime, timezone);
    if (!isAvailable) {
      throw new Error('Selected time is not within available hours');
    }

    // Update booking
    const updatedBooking = await prisma.booking.update({
      where: { uid },
      data: {
        startTime,
        endTime,
        status: 'PENDING',
        rescheduledFromId: booking.id
      },
      include: {
        eventType: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        }
      }
    });

    // Send reschedule email
    this.sendRescheduleEmailSafe(updatedBooking);

    return updatedBooking;
  },

  /**
   * Send reschedule email safely (doesn't throw)
   * @param {Object} booking - Updated booking
   */
  async sendRescheduleEmailSafe(booking) {
    try {
      await sendRescheduleEmail(booking);
    } catch (error) {
      console.error('Failed to send reschedule email:', error);
    }
  }
};

module.exports = BookingService;
