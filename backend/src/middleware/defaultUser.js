const prisma = require('../config/prisma');

// Middleware to inject default user (simulating logged-in user)
const injectDefaultUser = async (req, res, next) => {
  try {
    let user = await prisma.user.findFirst({
      where: { username: 'demo' }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'demo@example.com',
          name: 'Demo User',
          username: 'demo',
          timezone: 'America/New_York'
        }
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = injectDefaultUser;
