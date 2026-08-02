const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { isAllowedOrigin } = require('./config/cors');
const errorHandler = require('./middleware/errorMiddleware');
const { initializeFirebase } = require('./utils/firebaseMessaging');

// Import routes
const restaurantRoutes = require('./routes/restaurantRoutes');
const restaurantPortalRoutes = require('./routes/restaurantPortalRoutes');
const foodRoutes = require('./routes/foodRoutes');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orderRoutes');
const mpesaRoutes = require('./routes/mpesaRoutes');
const storeRoutes = require('./routes/storeRoutes');
const cartRoutes = require('./routes/cartRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const appSettingsRoutes = require('./routes/appSettingsRoutes');
const offerRoutes = require('./routes/offerRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const marketplaceRoutes = require('./routes/marketplaceRoutes');
const combinationRoutes = require('./routes/combinationRoutes');
const addressRoutes = require('./routes/addressRoutes');

// Initialize Express app
const app = express();

// CORS configuration - Executes first to intercept all preflight options requests
const corsOptions = {
  origin: function (origin, callback) {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    // Block origin gracefully without throwing hard 500 error
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

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

// Initialize Firebase Admin SDK
try {
  initializeFirebase();
} catch (error) {
  console.warn('⚠️ Firebase initialization skipped or failed. FCM notifications will not work.');
  console.warn('   To enable FCM: Set FIREBASE_PROJECT_ID and FIREBASE_SERVICE_ACCOUNT_PATH in .env');
}

// ==================== MIDDLEWARE ====================
// Disable fingerprinting server header
app.disable('x-powered-by');

// Apply Helmet security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "http:", "https://*.tile.openstreetmap.org", "https://unpkg.com"],
      connectSrc: ["'self'", "https://delivo-d5r8.onrender.com", "http://localhost:5000", "https://*.firebaseio.com", "https://*.googleapis.com", "https://nominatim.openstreetmap.org"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

const {
  smartRateLimiter,
  cacheResponse,
  invalidateCache,
  idempotencyCheck,
  validateObjectId
} = require('./middleware/securityMiddleware');

// Generous global rate limiter for legitimate browsing
app.use('/api', smartRateLimiter({ limit: 120, windowMs: 60000 }));

// Strict progressive authentication limits
app.use('/api/users/login', smartRateLimiter({ limit: 10, windowMs: 15 * 60 * 1000 }));
app.use('/api/users/register', smartRateLimiter({ limit: 10, windowMs: 15 * 60 * 1000 }));
app.use('/api/users/verify-email', smartRateLimiter({ limit: 10, windowMs: 15 * 60 * 1000 }));
app.use('/api/users/resend-verification-code', smartRateLimiter({ limit: 15, windowMs: 15 * 60 * 1000 }));
app.use('/api/users/request-password-reset', smartRateLimiter({ limit: 5, windowMs: 15 * 60 * 1000 }));
app.use('/api/users/reset-password', smartRateLimiter({ limit: 5, windowMs: 15 * 60 * 1000 }));

// Route specific query sanitizers and caching controls
app.use('/api/foods', validateObjectId(['id']));
app.use('/api/restaurants', validateObjectId(['id']), cacheResponse(120), invalidateCache(['/restaurants']));
app.use('/api/categories', validateObjectId(['id']), cacheResponse(300), invalidateCache(['/categories']));
app.use('/api/offers', cacheResponse(300), invalidateCache(['/offers']));
app.use('/api/settings', cacheResponse(300), invalidateCache(['/settings']));

// Strict idempotent filters for payment processing & double order placement prevention
app.use('/api/mpesa', idempotencyCheck());
app.use('/api/orders', validateObjectId(['id']), idempotencyCheck());

// JSON parsing with size limits
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ limit: '2mb', extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path} - Origin: ${req.get('origin') || 'no-origin'}`);
  next();
});



// ==================== ROUTES ====================
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/restaurant', restaurantPortalRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/mpesa', mpesaRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', appSettingsRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/combinations', combinationRoutes);
app.use('/api/addresses', addressRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.type('text/plain').status(200).send('OK');
});

// Serve frontend in production and support client-side routing
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(clientBuildPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

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
