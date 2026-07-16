const axios = require('axios');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getEmailServiceConfig = () => {
  const url = process.env.EMAIL_SERVICE_URL;
  const secret = process.env.EMAIL_SERVICE_SECRET;

  if (!url || !secret) {
    const error = new Error('EMAIL_SERVICE_URL and EMAIL_SERVICE_SECRET must be configured.');
    error.code = 'CONFIG_ERROR';
    throw error;
  }

  return { url, secret };
};

const sendToEmailService = async (endpoint, payload) => {
  const { url, secret } = getEmailServiceConfig();
  const baseUrl = url.replace(/\/$/, '');
  const attempts = 3;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      console.log(`[email-client] calling ${endpoint} attempt ${attempt}`);
      const response = await axios.post(`${baseUrl}${endpoint}`, payload, {
        headers: {
          'x-api-key': secret,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      if (response?.data?.success) {
        console.log(`[email-client] ${endpoint} succeeded`, { attempt });
        return response.data;
      }

      const error = new Error(response?.data?.message || 'Email service returned an unsuccessful response.');
      error.code = response?.data?.errorCode || 'EMAIL_SERVICE_ERROR';
      throw error;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      console.error(`[email-client] ${endpoint} failed`, {
        attempt,
        message,
        status: error.response?.status,
        code: error.code,
      });

      if (attempt < attempts) {
        const delay = 500 * 2 ** (attempt - 1);
        console.warn(`[email-client] retrying ${endpoint} in ${delay}ms`);
        await sleep(delay);
        continue;
      }

      const wrapped = new Error(message || 'Unable to reach the email service.');
      wrapped.code = error.code || 'EMAIL_SERVICE_ERROR';
      throw wrapped;
    }
  }
};

const sendVerification = async ({ email, token }) => {
  return sendToEmailService('/api/send-verification', { email, token });
};

const sendPasswordReset = async ({ email, token }) => {
  return sendToEmailService('/api/send-password-reset', { email, token });
};

const sendWelcome = async ({ email, name }) => {
  return sendToEmailService('/api/send-welcome', { email, name });
};

module.exports = {
  sendVerification,
  sendPasswordReset,
  sendWelcome,
};
