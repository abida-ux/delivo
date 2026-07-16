const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const emailRoutes = require('./routes/emailRoutes');
const { verifyTransporter } = require('./config/mail');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Delivo nodemailer service is healthy',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/email', emailRoutes);

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`📧 Delivo nodemailer service running on port ${PORT}`);
  const verification = await verifyTransporter();
  if (verification.ok) {
    console.log('✅ Mail transporter verified successfully');
  } else {
    console.warn('⚠️ Mail transporter verification failed:', verification.error?.message || verification.error);
  }
});
