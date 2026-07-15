const dotenv = require('dotenv');
dotenv.config();
const axios = require('axios');

(async () => {
  const key = process.env.MPESA_KEY || process.env.KEY;
  const secret = process.env.MPESA_SECRET || process.env.SECRET;
  const token = Buffer.from(`${key}:${secret}`).toString('base64');
  const now = new Date();
  const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
  const shortCode = process.env.MPESA_BUSINESS_SHORTCODE || process.env.SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY || process.env.PASSKEY;
  const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');
  const payload = {
    BusinessShortCode: shortCode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: process.env.MPESA_TRANSACTION_TYPE || process.env.TRANSACTION_TYPE || 'CustomerBuyGoodsOnline',
    Amount: 1,
    PartyA: '254708374202',
    PartyB: process.env.MPESA_PARTY_B || shortCode,
    PhoneNumber: '254708374202',
    CallBackURL: process.env.MPESA_CALLBACK_URL || process.env.CALLBACK_URL,
    AccountReference: 'DELIVO-TEST',
    TransactionDesc: 'Test payment'
  };

  try {
    const authRes = await axios.get(`${process.env.MPESA_BASE_URL || 'https://api.safaricom.co.ke'}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${token}` }
    });
    const accessToken = authRes.data.access_token;
    const res = await axios.post(`${process.env.MPESA_BASE_URL || 'https://api.safaricom.co.ke'}/mpesa/stkpush/v1/processrequest`, payload, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log(JSON.stringify(res.data));
  } catch (err) {
    console.error('STK_ERR', err.response && err.response.status, JSON.stringify(err.response && err.response.data || err.message));
    process.exit(1);
  }
})();
