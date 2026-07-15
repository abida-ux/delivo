const axios = require('axios');

const normalizePhone = (phone = '') => {
  const digits = phone.replace(/\D/g, '');

  if (digits.length === 10 && digits.startsWith('0')) {
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

  throw new Error('Invalid M-Pesa phone number. Use a Kenyan number starting with 07 or 01, such as 0712345678, 0112345678, +254712345678, or +254112345678.');
};

const getBaseUrl = () => {
  return process.env.MPESA_BASE_URL || 'https://api.safaricom.co.ke';
};

const getTimestamp = () => {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
};

const getAuthHeader = () => {
  const key = process.env.MPESA_KEY || process.env.KEY;
  const secret = process.env.MPESA_SECRET || process.env.SECRET;

  if (!key || !secret) {
    throw new Error('Missing M-Pesa KEY or SECRET');
  }

  const token = Buffer.from(`${key}:${secret}`).toString('base64');
  return { Authorization: `Basic ${token}` };
};

const getPassword = (timestamp) => {
  const shortcode = process.env.MPESA_BUSINESS_SHORTCODE || process.env.SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY || process.env.PASSKEY;

  if (!shortcode || !passkey) {
    throw new Error('Missing M-Pesa BUSINESS_SHORTCODE or PASSKEY');
  }

  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
};

const getCallbackUrl = () => {
  const callback = process.env.MPESA_CALLBACK_URL || process.env.CALLBACK_URL;
  if (!callback) {
    throw new Error('Missing M-Pesa CALLBACK_URL');
  }
  return callback;
};

const getAccountReference = (orderReference = '') => {
  const prefix = process.env.MPESA_ACCOUNT_REFERENCE_PREFIX || process.env.ACCOUNT_REFERENCE || 'DELIVO-ORDER';
  return orderReference ? `${prefix}-${orderReference}` : prefix;
};

const getTransactionDesc = () => process.env.MPESA_TRANSACTION_DESC || process.env.TRANSACTION_DESC || 'Payment for Delivo order';
const getTransactionType = () => process.env.MPESA_TRANSACTION_TYPE || process.env.TRANSACTION_TYPE || 'CustomerPayBillOnline';

const getAccessToken = async () => {
  const url = `${getBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`;
  const headers = getAuthHeader();

  const response = await axios.get(url, { headers });
  return response.data.access_token;
};

const sendMpesaStkPush = async ({ phoneNumber, amount, accountReference, transactionDesc }) => {
  if (!phoneNumber) throw new Error('M-Pesa phone number is required');

  const amountValue = Number(amount);
  if (!amountValue || amountValue <= 0) throw new Error('Amount must be greater than zero');

  const mpesaAmount = Math.ceil(amountValue);
  if (mpesaAmount <= 0) throw new Error('Amount must be at least 1 KES');

  const phone = normalizePhone(phoneNumber);
  const timestamp = getTimestamp();
  const password = getPassword(timestamp);
  const shortcode = process.env.MPESA_BUSINESS_SHORTCODE || process.env.SHORTCODE;
  const partyB = process.env.MPESA_PARTY_B || shortcode;
  const callbackUrl = getCallbackUrl();

  const payload = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: getTransactionType(),
    Amount: mpesaAmount,
    PartyA: phone,
    PartyB: partyB,
    PhoneNumber: phone,
    CallBackURL: callbackUrl,
    AccountReference: getAccountReference(accountReference),
    TransactionDesc: transactionDesc || getTransactionDesc(),
  };

  const token = await getAccessToken();
  const url = `${getBaseUrl()}/mpesa/stkpush/v1/processrequest`;
  const headers = { Authorization: `Bearer ${token}` };

  try {
    const response = await axios.post(url, payload, { headers });
    return response.data;
  } catch (error) {
    const details = error.response?.data || error.message;
    const status = error.response?.status;
    const message = `STK push failed${status ? ` (${status})` : ''}: ${JSON.stringify(details)}`;
    throw new Error(message);
  }
};

const queryMpesaStkStatus = async ({ checkoutRequestId }) => {
  if (!checkoutRequestId) throw new Error('Checkout request ID is required');

  const timestamp = getTimestamp();
  const password = getPassword(timestamp);
  const shortcode = process.env.MPESA_BUSINESS_SHORTCODE || process.env.SHORTCODE;

  const payload = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    CheckoutRequestID: checkoutRequestId,
  };

  const token = await getAccessToken();
  const url = `${getBaseUrl()}/mpesa/stkpushquery/v1/query`;
  const headers = { Authorization: `Bearer ${token}` };

  try {
    const response = await axios.post(url, payload, { headers });
    return response.data;
  } catch (error) {
    const details = error.response?.data || error.message;
    const status = error.response?.status;
    const message = `STK status query failed${status ? ` (${status})` : ''}: ${JSON.stringify(details)}`;
    throw new Error(message);
  }
};

module.exports = {
  sendMpesaStkPush,
  queryMpesaStkStatus,
  normalizePhone,
  getBaseUrl,
};
