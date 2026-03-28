const prisma = require('../config/prisma');

/**
 * UserService
 * Handles business logic for user operations
 */
const UserService = {
  /**
   * Get user's public profile with active event types
   * @param {string} username - Username
   * @returns {Promise<Object>} User profile with event types
   * @throws {Error} If user not found
   */
  async getUserProfile(username) {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        username: true,
        eventTypes: {
          where: { isActive: true },
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            duration: true,
            color: true
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  },

  /**
   * Get event type details for booking page
   * @param {string} username - Username
   * @param {string} eventSlug - Event type slug
   * @returns {Promise<Object>} Event type with details
   * @throws {Error} If user or event type not found
   */
  async getEventTypeForBooking(username, eventSlug) {
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const eventType = await prisma.eventType.findFirst({
      where: {
        userId: user.id,
        slug: eventSlug,
        isActive: true
      },
      include: {
        user: {
          select: {
            name: true,
            username: true,
            timezone: true
          }
        },
        schedule: {
          include: {
            weeklyHours: true,
            dateOverrides: true
          }
        },
        customQuestions: {
          where: { eventTypeId: { not: undefined } },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!eventType) {
      throw new Error('Event type not found');
    }

    return eventType;
  },

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update (name, timezone)
   * @returns {Promise<Object>} Updated user
   */
  async updateProfile(userId, updateData) {
    const { name, timezone } = updateData;

    return await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(timezone && { timezone })
      }
    });
  },

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User
   * @throws {Error} If user not found
   */
  async getUserById(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
};

module.exports = UserService;
