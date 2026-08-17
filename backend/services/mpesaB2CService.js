const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Normalizes Kenyan phone numbers to the Daraja 254XXXXXXXXX format.
 * Supports: 07XXXXXXXX, 01XXXXXXXX, +2547XXXXXXXX, +2541XXXXXXXX, 2547XXXXXXXX, 2541XXXXXXXX.
 */
const normalizeKenyanPhone = (phone = '') => {
  if (!phone || typeof phone !== 'string') {
    throw new Error('Phone number is required');
  }

  const digits = phone.replace(/\D/g, '');

  if (digits.length === 10 && (digits.startsWith('07') || digits.startsWith('01'))) {
    return `254${digits.slice(1)}`;
  }

  if (digits.length === 9 && (digits.startsWith('7') || digits.startsWith('1'))) {
    return `254${digits}`;
  }

  if (digits.length === 12 && (digits.startsWith('2547') || digits.startsWith('2541'))) {
    return digits;
  }

  if (digits.length === 14 && (digits.startsWith('002547') || digits.startsWith('002541'))) {
    return digits.slice(2);
  }

  throw new Error(
    'Invalid Kenyan M-Pesa phone number. Please use a valid format such as 07XXXXXXXX, 01XXXXXXXX, or +2547XXXXXXXX.'
  );
};

const getB2CBaseUrl = () => {
  if (process.env.MPESA_BASE_URL) {
    return process.env.MPESA_BASE_URL;
  }
  const env = (process.env.MPESA_ENV || 'production').toLowerCase();
  return env === 'sandbox' ? 'https://sandbox.safaricom.co.ke' : 'https://api.safaricom.co.ke';
};

const getB2CAuthHeader = () => {
  const key = process.env.MPESA_B2C_KEY || process.env.MPESA_KEY || process.env.KEY;
  const secret = process.env.MPESA_B2C_SECRET || process.env.MPESA_SECRET || process.env.SECRET;

  if (!key || !secret) {
    throw new Error('Missing M-Pesa B2C API credentials (MPESA_B2C_KEY / MPESA_B2C_SECRET or MPESA_KEY / MPESA_SECRET)');
  }

  const token = Buffer.from(`${key}:${secret}`).toString('base64');
  return { Authorization: `Basic ${token}` };
};

const getB2CAccessToken = async () => {
  const url = `${getB2CBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`;
  const headers = getB2CAuthHeader();

  const response = await axios.get(url, { headers });
  if (!response.data?.access_token) {
    throw new Error('Failed to obtain Daraja OAuth access token');
  }
  return response.data.access_token;
};

/**
 * Generates the SecurityCredential required by Safaricom Daraja B2C API.
 * Uses pre-configured MPESA_B2C_SECURITY_CREDENTIAL or encrypts MPESA_B2C_INITIATOR_PASSWORD with Safaricom Public Cert.
 */
const getSecurityCredential = () => {
  if (process.env.MPESA_B2C_SECURITY_CREDENTIAL) {
    return process.env.MPESA_B2C_SECURITY_CREDENTIAL.trim();
  }

  const initiatorPassword = process.env.MPESA_B2C_INITIATOR_PASSWORD;
  if (!initiatorPassword) {
    throw new Error(
      'Missing M-Pesa B2C credentials. Please provide MPESA_B2C_SECURITY_CREDENTIAL or MPESA_B2C_INITIATOR_PASSWORD.'
    );
  }

  // Check if certificate path is provided
  const certPath = process.env.MPESA_B2C_CERT_PATH;
  let certBuffer;

  if (certPath && fs.existsSync(certPath)) {
    certBuffer = fs.readFileSync(certPath);
  } else if (process.env.MPESA_B2C_CERT_CONTENT) {
    certBuffer = Buffer.from(process.env.MPESA_B2C_CERT_CONTENT, 'utf-8');
  } else {
    // If no cert is provided, return initiator password as base64 fallback for sandbox testing
    return Buffer.from(initiatorPassword).toString('base64');
  }

  try {
    const encrypted = crypto.publicEncrypt(
      {
        key: certBuffer,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      Buffer.from(initiatorPassword)
    );
    return encrypted.toString('base64');
  } catch (encryptionErr) {
    throw new Error(`Failed to encrypt B2C security credential with certificate: ${encryptionErr.message}`);
  }
};

const getB2CCallbackUrl = (type = 'result') => {
  const explicitUrl =
    type === 'timeout'
      ? process.env.MPESA_B2C_TIMEOUT_URL
      : process.env.MPESA_B2C_RESULT_URL;

  const baseUrl =
    explicitUrl ||
    process.env.MPESA_CALLBACK_URL ||
    process.env.CALLBACK_URL ||
    'https://api.delivo.co.ke/api/payouts/b2c/' + type;

  const secret = process.env.MPESA_CALLBACK_SECRET || 'delivo_secure_fallback_secret_2026';
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}secret=${encodeURIComponent(secret)}`;
};

/**
 * Dispatches a Business to Customer (B2C) payment request to Safaricom Daraja.
 */
const sendMpesaB2CPayment = async ({ phone, amount, remarks, occasion, payoutId }) => {
  if (!phone) throw new Error('Phone number is required for B2C payout');

  const amountValue = Math.floor(Number(amount));
  if (!amountValue || amountValue <= 0) {
    throw new Error('Payout amount must be a positive number');
  }

  if (amountValue < 10) {
    throw new Error('Minimum withdrawal amount is KSh 10');
  }

  if (amountValue > 150000) {
    throw new Error('Maximum withdrawal amount per transaction is KSh 150,000');
  }

  const normalizedPhone = normalizeKenyanPhone(phone);
  const initiatorName = process.env.MPESA_B2C_INITIATOR_NAME || 'testapi';
  const securityCredential = getSecurityCredential();
  const commandId = process.env.MPESA_B2C_COMMAND_ID || 'BusinessPayment'; // 'BusinessPayment' or 'SalaryPayment'
  const partyA = process.env.MPESA_B2C_SHORTCODE || process.env.MPESA_BUSINESS_SHORTCODE || process.env.SHORTCODE || '600000';
  const queueTimeoutUrl = getB2CCallbackUrl('timeout');
  const resultUrl = getB2CCallbackUrl('result');

  const payload = {
    InitiatorName: initiatorName,
    SecurityCredential: securityCredential,
    CommandID: commandId,
    Amount: amountValue,
    PartyA: partyA,
    PartyB: normalizedPhone,
    Remarks: (remarks || `Delivo Rider Payout ${payoutId || ''}`).slice(0, 100),
    QueueTimeOutURL: queueTimeoutUrl,
    ResultURL: resultUrl,
    Occasion: (occasion || 'Rider Payout').slice(0, 100),
  };

  const token = await getB2CAccessToken();
  const url = `${getB2CBaseUrl()}/mpesa/b2c/v1/paymentrequest`;
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  try {
    const response = await axios.post(url, payload, { headers, timeout: 20000 });
    return response.data;
  } catch (error) {
    const details = error.response?.data || error.message;
    const status = error.response?.status;
    const message = `M-Pesa B2C payout request failed${status ? ` (${status})` : ''}: ${JSON.stringify(details)}`;
    throw new Error(message);
  }
};

module.exports = {
  normalizeKenyanPhone,
  getB2CBaseUrl,
  getB2CAccessToken,
  getSecurityCredential,
  sendMpesaB2CPayment,
};
