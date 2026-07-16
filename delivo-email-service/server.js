const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const { authMiddleware } = require('./middleware/auth');
const { limiter } = require('./middleware/rateLimiter');
const emailRoutes = require('./routes/emailRoutes');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({ origin: true }));
app.use(morgan('combined'));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[request] ${req.method} ${req.path} -> ${res.statusCode} (${duration}ms)`);
  });
  next();
});

app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Email service is healthy' });
});

app.use('/api', limiter, authMiddleware, emailRoutes);

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: 'Email service internal error',
    errorCode: 'INTERNAL_ERROR',
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Email service listening on port ${PORT}`);
});
