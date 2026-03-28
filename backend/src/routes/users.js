const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const injectDefaultUser = require('../middleware/defaultUser');

router.use(injectDefaultUser);

// Get current user
router.get('/me', async (req, res) => {
  res.json(req.user);
});

// Update current user
router.put('/me', async (req, res, next) => {
  try {
    const { name, timezone } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name }),
        ...(timezone && { timezone })
      }
    });

    res.json(user);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
