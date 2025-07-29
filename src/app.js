require('dotenv').config();
const express = require('express');

const db = require('./models');
const sequelize = db.sequelize;

const authRoutes = require('./routes/authRoutes');
const courseOfferingRoutes = require('./routes/courseOfferingRoutes');
const managerRoutes = require('./routes/managerRoutes');
const facilitatorRoutes = require('./routes/facilitatorRoutes');
const studentRoutes = require('./routes/studentRoutes');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(express.json({ limit: '10kb' }));
app.use('/api/auth', authRoutes);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Routes
app.use('/api/v1/course-offerings', courseOfferingRoutes);
app.use('/api/v1/managers', managerRoutes);
app.use('/api/v1/facilitators', facilitatorRoutes);
app.use('/api/v1/students', studentRoutes);

// Health check
app.get('/api/v1/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ 
      status: 'healthy',
      db: 'connected',
      timestamp: new Date() 
    });
  } catch (err) {
    res.status(500).json({
      status: 'unhealthy',
      db: 'disconnected',
      error: err.message
    });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Database and server startup
(async () => {
  try {
    // Test connection first
    await sequelize.authenticate();
    console.log('Database connection established');

    // Then sync models
    await sequelize.sync({ 
      alter: process.env.NODE_ENV !== 'production',
      logging: console.log
    });

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Startup failed:', err);
    process.exit(1);
  }
})();