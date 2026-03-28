require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const eventTypeRoutes = require('./routes/eventTypes');
const availabilityRoutes = require('./routes/availability');
const bookingRoutes = require('./routes/bookings');
const publicRoutes = require('./routes/public');
const userRoutes = require('./routes/users');

const errorHandler = require('./middleware/errorHandler');
const { loggingMiddleware } = require('./middleware/logging');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Logging middleware (request/response logging)
app.use(loggingMiddleware);

app.use(express.json());

// Routes
app.use('/api/event-types', eventTypeRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
  const health = { status: 'ok', timestamp: new Date().toISOString() };
  logger.debug('Health check', health);
  res.json(health);
});

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
