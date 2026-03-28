const prisma = require('../config/prisma');
const { createError } = require('../utils/errors');

const eventTypeController = {
  // Get all event types for the current user
  async getAll(req, res, next) {
    try {
      const eventTypes = await prisma.eventType.findMany({
        where: { userId: req.user.id },
        include: {
          schedule: true,
          _count: {
            select: { bookings: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ success: true, data: eventTypes, count: eventTypes.length });
    } catch (error) {
      next(error);
    }
  },

  // Get single event type
  async getOne(req, res, next) {
    try {
      const eventType = await prisma.eventType.findFirst({
        where: {
          id: req.params.id,
          userId: req.user.id
        },
        include: {
          schedule: {
            include: {
              weeklyHours: true,
              dateOverrides: true
            }
          },
          customQuestions: {
            orderBy: { order: 'asc' }
          }
        }
      });

      if (!eventType) {
        throw createError.eventTypeNotFound();
      }

      res.json({ success: true, data: eventType });
    } catch (error) {
      next(error);
    }
  },

  // Create new event type
  async create(req, res, next) {
    try {
      const {
        title,
        slug,
        description,
        duration,
        color,
        bufferTimeBefore,
        bufferTimeAfter,
        minimumNotice,
        slotInterval,
        scheduleId
      } = req.body;

      // Validate required fields
      if (!title) {
        throw createError.missingField('title');
      }

      if (!slug) {
        throw createError.missingField('slug');
      }

      if (!duration) {
        throw createError.missingField('duration');
      }

      // Check if slug already exists for this user
      const existing = await prisma.eventType.findFirst({
        where: {
          userId: req.user.id,
          slug
        }
      });

      if (existing) {
        throw createError.duplicateSlug();
      }

      // If no schedule specified, use default schedule
      let finalScheduleId = scheduleId;
      if (!finalScheduleId) {
        const defaultSchedule = await prisma.availabilitySchedule.findFirst({
          where: {
            userId: req.user.id,
            isDefault: true
          }
        });
        finalScheduleId = defaultSchedule?.id;
      }

      const eventType = await prisma.eventType.create({
        data: {
          title,
          slug,
          description,
          duration,
          color: color || '#3B82F6',
          bufferTimeBefore: bufferTimeBefore || 0,
          bufferTimeAfter: bufferTimeAfter || 0,
          minimumNotice: minimumNotice || 60,
          slotInterval,
          userId: req.user.id,
          scheduleId: finalScheduleId
        },
        include: {
          schedule: true
        }
      });

      res.status(201).json({ success: true, data: eventType });
    } catch (error) {
      next(error);
    }
  },

  // Update event type
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const {
        title,
        slug,
        description,
        duration,
        color,
        isActive,
        bufferTimeBefore,
        bufferTimeAfter,
        minimumNotice,
        slotInterval,
        scheduleId,
        requiresConfirmation
      } = req.body;

      // Check ownership
      const existing = await prisma.eventType.findFirst({
        where: { id, userId: req.user.id }
      });

      if (!existing) {
        throw createError.eventTypeNotFound();
      }

      // Check slug uniqueness if changing
      if (slug && slug !== existing.slug) {
        const slugExists = await prisma.eventType.findFirst({
          where: {
            userId: req.user.id,
            slug,
            NOT: { id }
          }
        });

        if (slugExists) {
          throw createError.duplicateSlug();
        }
      }

      const eventType = await prisma.eventType.update({
        where: { id },
        data: {
          ...(title && { title }),
          ...(slug && { slug }),
          ...(description !== undefined && { description }),
          ...(duration && { duration }),
          ...(color && { color }),
          ...(isActive !== undefined && { isActive }),
          ...(bufferTimeBefore !== undefined && { bufferTimeBefore }),
          ...(bufferTimeAfter !== undefined && { bufferTimeAfter }),
          ...(minimumNotice !== undefined && { minimumNotice }),
          ...(slotInterval !== undefined && { slotInterval }),
          ...(scheduleId !== undefined && { scheduleId }),
          ...(requiresConfirmation !== undefined && { requiresConfirmation })
        },
        include: {
          schedule: true
        }
      });

      res.json({ success: true, data: eventType });
    } catch (error) {
      next(error);
    }
  },

  // Delete event type
  async delete(req, res, next) {
    try {
      const { id } = req.params;

      const existing = await prisma.eventType.findFirst({
        where: { id, userId: req.user.id }
      });

      if (!existing) {
        throw createError.eventTypeNotFound();
      }

      await prisma.eventType.delete({ where: { id } });

      res.json({ success: true, data: { message: 'Event type deleted successfully' } });
    } catch (error) {
      next(error);
    }
  },

  // Toggle active status
  async toggle(req, res, next) {
    try {
      const { id } = req.params;

      const existing = await prisma.eventType.findFirst({
        where: { id, userId: req.user.id }
      });

      if (!existing) {
        throw createError.eventTypeNotFound();
      }

      const eventType = await prisma.eventType.update({
        where: { id },
        data: { isActive: !existing.isActive }
      });

      res.json({ success: true, data: eventType });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = eventTypeController;
