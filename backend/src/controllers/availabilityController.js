const prisma = require('../config/prisma');
const { createError } = require('../utils/errors');

const availabilityController = {
  // Get all schedules
  async getAllSchedules(req, res, next) {
    try {
      const schedules = await prisma.availabilitySchedule.findMany({
        where: { userId: req.user.id },
        include: {
          weeklyHours: {
            orderBy: { dayOfWeek: 'asc' }
          },
          dateOverrides: {
            orderBy: { date: 'asc' }
          },
          _count: {
            select: { eventTypes: true }
          }
        },
        orderBy: { createdAt: 'asc' }
      });

      res.json({ success: true, data: schedules, count: schedules.length });
    } catch (error) {
      next(error);
    }
  },

  // Get single schedule
  async getSchedule(req, res, next) {
    try {
      const schedule = await prisma.availabilitySchedule.findFirst({
        where: {
          id: req.params.id,
          userId: req.user.id
        },
        include: {
          weeklyHours: {
            orderBy: { dayOfWeek: 'asc' }
          },
          dateOverrides: {
            orderBy: { date: 'asc' }
          }
        }
      });

      if (!schedule) {
        throw createError.scheduleNotFound();
      }

      res.json({ success: true, data: schedule });
    } catch (error) {
      next(error);
    }
  },

  // Create schedule
  async createSchedule(req, res, next) {
    try {
      const { name, timezone, weeklyHours, isDefault } = req.body;

      if (!name) {
        throw createError.missingField('name');
      }

      if (!timezone) {
        throw createError.missingField('timezone');
      }

      // If this is the default, unset other defaults
      if (isDefault) {
        await prisma.availabilitySchedule.updateMany({
          where: { userId: req.user.id },
          data: { isDefault: false }
        });
      }

      // Check if this is the first schedule
      const existingCount = await prisma.availabilitySchedule.count({
        where: { userId: req.user.id }
      });

      const schedule = await prisma.availabilitySchedule.create({
        data: {
          name,
          timezone,
          isDefault: isDefault || existingCount === 0,
          userId: req.user.id,
          weeklyHours: {
            create: weeklyHours || [
              { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isEnabled: true },
              { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', isEnabled: true },
              { dayOfWeek: 3, startTime: '09:00', endTime: '17:00', isEnabled: true },
              { dayOfWeek: 4, startTime: '09:00', endTime: '17:00', isEnabled: true },
              { dayOfWeek: 5, startTime: '09:00', endTime: '17:00', isEnabled: true },
              { dayOfWeek: 0, startTime: '09:00', endTime: '17:00', isEnabled: false },
              { dayOfWeek: 6, startTime: '09:00', endTime: '17:00', isEnabled: false },
            ]
          }
        },
        include: {
          weeklyHours: true
        }
      });

      res.status(201).json({ success: true, data: schedule });
    } catch (error) {
      next(error);
    }
  },

  // Update schedule
  async updateSchedule(req, res, next) {
    try {
      const { id } = req.params;
      const { name, timezone } = req.body;

      const existing = await prisma.availabilitySchedule.findFirst({
        where: { id, userId: req.user.id }
      });

      if (!existing) {
        throw createError.scheduleNotFound();
      }

      const schedule = await prisma.availabilitySchedule.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(timezone && { timezone })
        },
        include: {
          weeklyHours: true,
          dateOverrides: true
        }
      });

      res.json({ success: true, data: schedule });
    } catch (error) {
      next(error);
    }
  },

  // Delete schedule
  async deleteSchedule(req, res, next) {
    try {
      const { id } = req.params;

      const existing = await prisma.availabilitySchedule.findFirst({
        where: { id, userId: req.user.id },
        include: { _count: { select: { eventTypes: true } } }
      });

      if (!existing) {
        throw createError.scheduleNotFound();
      }

      if (existing._count.eventTypes > 0) {
        throw createError.conflict(
          'Cannot delete schedule with linked event types. Reassign them first.',
          { eventTypeCount: existing._count.eventTypes }
        );
      }

      // If deleting default, make another one default
      if (existing.isDefault) {
        const anotherSchedule = await prisma.availabilitySchedule.findFirst({
          where: { userId: req.user.id, NOT: { id } }
        });
        
        if (anotherSchedule) {
          await prisma.availabilitySchedule.update({
            where: { id: anotherSchedule.id },
            data: { isDefault: true }
          });
        }
      }

      await prisma.availabilitySchedule.delete({ where: { id } });

      res.json({ success: true, data: { message: 'Schedule deleted successfully' } });
    } catch (error) {
      next(error);
    }
  },

  // Set default schedule
  async setDefault(req, res, next) {
    try {
      const { id } = req.params;

      const existing = await prisma.availabilitySchedule.findFirst({
        where: { id, userId: req.user.id }
      });

      if (!existing) {
        throw createError.scheduleNotFound();
      }

      // Unset all defaults
      await prisma.availabilitySchedule.updateMany({
        where: { userId: req.user.id },
        data: { isDefault: false }
      });

      // Set this one as default
      const schedule = await prisma.availabilitySchedule.update({
        where: { id },
        data: { isDefault: true }
      });

      res.json({ success: true, data: schedule });
    } catch (error) {
      next(error);
    }
  },

  // Update weekly hours
  async updateWeeklyHours(req, res, next) {
    try {
      const { id } = req.params;
      const { weeklyHours } = req.body;

      if (!weeklyHours || !Array.isArray(weeklyHours)) {
        throw createError.missingField('weeklyHours');
      }

      const existing = await prisma.availabilitySchedule.findFirst({
        where: { id, userId: req.user.id }
      });

      if (!existing) {
        throw createError.scheduleNotFound();
      }

      // Delete existing weekly hours and recreate
      await prisma.weeklyHours.deleteMany({
        where: { scheduleId: id }
      });

      await prisma.weeklyHours.createMany({
        data: weeklyHours.map(wh => ({
          scheduleId: id,
          dayOfWeek: wh.dayOfWeek,
          startTime: wh.startTime,
          endTime: wh.endTime,
          isEnabled: wh.isEnabled
        }))
      });

      const schedule = await prisma.availabilitySchedule.findUnique({
        where: { id },
        include: { weeklyHours: true }
      });

      res.json({ success: true, data: schedule });
    } catch (error) {
      next(error);
    }
  },

  // Add date override
  async addDateOverride(req, res, next) {
    try {
      const { id } = req.params;
      const { date, isBlocked, startTime, endTime } = req.body;

      if (!date) {
        throw createError.missingField('date');
      }

      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        throw createError.invalidDate();
      }

      const existing = await prisma.availabilitySchedule.findFirst({
        where: { id, userId: req.user.id }
      });

      if (!existing) {
        throw createError.scheduleNotFound();
      }

      const override = await prisma.dateOverride.upsert({
        where: {
          scheduleId_date: {
            scheduleId: id,
            date: dateObj
          }
        },
        update: {
          isBlocked,
          startTime: isBlocked ? null : startTime,
          endTime: isBlocked ? null : endTime
        },
        create: {
          scheduleId: id,
          date: dateObj,
          isBlocked,
          startTime: isBlocked ? null : startTime,
          endTime: isBlocked ? null : endTime
        }
      });

      res.json({ success: true, data: override });
    } catch (error) {
      next(error);
    }
  },

  // Remove date override
  async removeDateOverride(req, res, next) {
    try {
      const { overrideId } = req.params;

      if (!overrideId) {
        throw createError.missingField('overrideId');
      }

      const override = await prisma.dateOverride.findUnique({
        where: { id: overrideId },
        include: { schedule: true }
      });

      if (!override || override.schedule.userId !== req.user.id) {
        throw createError.notFound('Override not found');
      }

      await prisma.dateOverride.delete({ where: { id: overrideId } });

      res.json({ success: true, data: { message: 'Override removed successfully' } });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = availabilityController;
