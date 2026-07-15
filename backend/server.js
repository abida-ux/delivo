require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { initializeMailer } = require('./config/mailer');
const errorHandler = require('./middleware/errorMiddleware');

// Import routes
const restaurantRoutes = require('./routes/restaurantRoutes');
const foodRoutes = require('./routes/foodRoutes');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orderRoutes');
const storeRoutes = require('./routes/storeRoutes');
const cartRoutes = require('./routes/cartRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const appSettingsRoutes = require('./routes/appSettingsRoutes');

// Initialize Express app
const app = express();

// ==================== ENVIRONMENT VALIDATION ====================
console.log('🔧 ENVIRONMENT CHECK:');
console.log(`  ✓ PORT: ${process.env.PORT || 5000}`);
console.log(`  ✓ NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`  ✓ MONGO_URI: ${process.env.MONGO_URI ? '✓ Set' : '❌ MISSING'}`);
console.log(`  ✓ FRONTEND_URL: ${process.env.FRONTEND_URL || 'http://localhost:5174'}`);
console.log(`  ✓ JWT_SECRET: ${process.env.JWT_SECRET ? '✓ Set' : '❌ MISSING'}`);

// Connect to MongoDB
connectDB();

// Initialize SMTP at startup
initializeMailer().catch((error) => {
  console.warn('⚠️ Mailer initialization warning:', error.message || error);
});

// ==================== MIDDLEWARE ====================
// JSON parsing with size limits
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path} - Origin: ${req.get('origin') || 'no-origin'}`);
  next();
});

// CORS configuration - Works for BOTH development and production
const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
]);

if (process.env.FRONTEND_URL) {
  allowedOrigins.add(process.env.FRONTEND_URL);
}

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.has(origin) || origin.includes('localhost') || /^https:\/\/.*\.vercel\.app$/i.test(origin)) {
      console.log(`✅ CORS: Allowed origin: ${origin || 'no-origin'}`);
      return callback(null, true);
    }

    console.log(`❌ CORS: Rejected origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// ==================== ROUTES ====================
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', appSettingsRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🚀 Delivo Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// 404 handler
app.use((req, res) => {
  console.log(`❌ 404: Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
let server;

<<<<<<< HEAD
const startServer = async () => {
  const mailReady = await transporter.verifyTransporter();
  if (!mailReady) {
    console.warn('⚠️ SMTP verification reported an issue during startup. Email delivery may still fail until configured correctly.');
  }

  server = app.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════════════╗
    ║                                               ║
    ║   🍕 DELIVO BACKEND SERVER                   ║
    ║   ✅ Server running on port ${PORT}               ║
    ║   🗄️  Environment: ${NODE_ENV}                    ║
    ║   🔐 CORS enabled for: localhost & delivo.co.ke
    ║                                               ║
    ╚═══════════════════════════════════════════════╝
    `);
    console.log('🚀 Render startup complete');
  });

  return server;
};

startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
=======
const server = app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════╗
  ║                                               ║
  ║   🍕 DELIVO BACKEND SERVER                   ║
  ║   ✅ Server running on port ${PORT}               ║
  ║   🗄️  Environment: ${NODE_ENV}                    ║
  ║   🔐 CORS enabled for: localhost & delivo.co.ke
  ║                                               ║
  ╚═══════════════════════════════════════════════╝
  `);
>>>>>>> 745c3f51e46feacea2dbabdbc04695b633a497a5
});

// Periodic cleanup: expire unpaid pending orders older than 1 minute
const cleanupExpiredOrders = async () => {
  try {
    const now = new Date();
    const expiredOrders = await require('./models/Order').find({
      status: 'pending',
      paymentStatus: 'pending',
      expiresAt: { $lte: now },
    });

    if (expiredOrders.length > 0) {
      console.log(`⌛ Expiring ${expiredOrders.length} unpaid pending order(s)`);
      await require('./models/Order').updateMany(
        {
          status: 'pending',
          paymentStatus: 'pending',
          expiresAt: { $lte: now },
        },
        {
          status: 'cancelled',
          paymentStatus: 'failed',
          failureReason: 'Payment timeout',
          updatedAt: now,
        }
      );
    }
  } catch (error) {
    console.error('❌ Error during expired order cleanup:', error);
  }
};

setInterval(cleanupExpiredOrders, 30 * 1000);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
