require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorMiddleware');

// Import routes
const restaurantRoutes = require('./routes/restaurantRoutes');
const foodRoutes = require('./routes/foodRoutes');
const userRoutes = require('./routes/userRoutes');
const orderRoutes = require('./routes/orderRoutes');
const storeRoutes = require('./routes/storeRoutes');
const cartRoutes = require('./routes/cartRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

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
    // Allow requests from localhost (any port) for development
    if (origin && origin.includes('localhost')) {
      console.log(`✅ CORS: Allowed localhost origin: ${origin}`);
      return callback(null, true);
    }
    // Allow requests from production domain
    if (origin && origin.includes('delivo.co.ke')) {
      console.log(`✅ CORS: Allowed delivo.co.ke origin: ${origin}`);
      return callback(null, true);
    }
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) {
      console.log(`✅ CORS: Allowed no-origin request (mobile/curl/postman)`);
      return callback(null, true);
    }
    // Reject other origins
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
app.use('/api/orders', orderRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/notifications', notificationRoutes);

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
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
