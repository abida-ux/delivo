const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { isAllowedOrigin } = require('./config/cors');
const errorHandler = require('./middleware/errorMiddleware');

// Import routes
const restaurantRoutes = require('./routes/restaurantRoutes');
const foodRoutes = require('./routes/foodRoutes');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orderRoutes');
const mpesaRoutes = require('./routes/mpesaRoutes');
const storeRoutes = require('./routes/storeRoutes');
const cartRoutes = require('./routes/cartRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const appSettingsRoutes = require('./routes/appSettingsRoutes');

// Initialize Express app
const app = express();

// ==================== ENVIRONMENT VALIDATION ====================
console.log('🔧 ENVIRONMENT CHECK:');
console.log(`  ✓ PORT: ${process.env.BACKEND_PORT || process.env.PORT || 5000}`);
console.log(`  ✓ NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`  ✓ MONGO_URI: ${process.env.MONGO_URI ? '✓ Set' : '❌ MISSING'}`);
console.log(`  ✓ FRONTEND_URL: ${process.env.FRONTEND_URL || 'http://localhost:5174'}`);
console.log(`  ✓ JWT_SECRET: ${process.env.JWT_SECRET ? '✓ Set' : '❌ MISSING'}`);
console.log(`  ✓ MPESA_KEY: ${process.env.MPESA_KEY || process.env.KEY ? '✓ Set' : '❌ MISSING'}`);
console.log(`  ✓ MPESA_SECRET: ${process.env.MPESA_SECRET || process.env.SECRET ? '✓ Set' : '❌ MISSING'}`);
console.log(`  ✓ MPESA_BUSINESS_SHORTCODE: ${process.env.MPESA_BUSINESS_SHORTCODE || process.env.SHORTCODE ? '✓ Set' : '❌ MISSING'}`);
console.log(`  ✓ MPESA_CALLBACK_URL: ${process.env.MPESA_CALLBACK_URL || process.env.CALLBACK_URL ? '✓ Set' : '❌ MISSING'}`);
console.log(`  ✓ MPESA_BASE_URL: ${process.env.MPESA_BASE_URL ? process.env.MPESA_BASE_URL : 'NOT SET'}`);
console.log(`  MPESA_KEY loaded: ${process.env.MPESA_KEY || process.env.KEY}`);
console.log(`  MPESA_SECRET loaded: ${process.env.MPESA_SECRET || process.env.SECRET}`);

// Connect to MongoDB
connectDB();

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
const corsOptions = {
  origin: function (origin, callback) {
    if (isAllowedOrigin(origin)) {
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
app.use('/api/mpesa', mpesaRoutes);
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
const PORT = process.env.BACKEND_PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const LISTEN_HOST = '0.0.0.0';

if (process.env.PORT && !process.env.BACKEND_PORT) {
  console.warn('⚠️ Using BACKEND_PORT is recommended to avoid conflicts with other local services.');
}
const server = app.listen(PORT, LISTEN_HOST, () => {
  console.log(`
  ╔═══════════════════════════════════════════════╗
  ║                                               ║
  ║   🍕 DELIVO BACKEND SERVER                   ║
  ║   ✅ Server running on port ${PORT}               ║
  ║   🗄️  Environment: ${NODE_ENV}                    ║
  ║   🌐 Listening on ${LISTEN_HOST}                   ║
  ║   🔐 CORS enabled for: localhost & delivo.co.ke
  ║                                               ║
  ╚═══════════════════════════════════════════════╝
  `);
  console.log('🚀 Render startup complete');
});

server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    console.error('❌ Server error:', error);
    process.exit(1);
  }

  const bind = typeof PORT === 'string' ? `Pipe ${PORT}` : `Port ${PORT}`;
  switch (error.code) {
    case 'EACCES':
      console.error(`❌ ${bind} requires elevated privileges.`);
      break;
    case 'EADDRINUSE':
      console.error(`❌ ${bind} is already in use.`);
      break;
    default:
      console.error('❌ Server listen error:', error);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
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
