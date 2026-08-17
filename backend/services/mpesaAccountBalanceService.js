const axios = require('axios');
const { getB2CAccessToken, getSecurityCredential } = require('./mpesaB2CService');

const getBaseUrl = () => {
  if (process.env.MPESA_ENV === 'production') {
    return 'https://api.safaricom.co.ke';
  }
  return 'https://sandbox.safaricom.co.ke';
};

/**
 * Queries the Safaricom Account Balance for the B2C / Business shortcode.
 * Official Daraja API: /mpesa/accountbalance/v1/query
 */
const queryMpesaAccountBalance = async ({ remarks = 'Balance Query' } = {}) => {
  const shortCode =
    process.env.MPESA_B2C_SHORTCODE ||
    process.env.MPESA_BUSINESS_SHORTCODE ||
    process.env.MPESA_SHORTCODE ||
    '600000';

  const initiatorName =
    process.env.MPESA_B2C_INITIATOR_NAME ||
    process.env.MPESA_INITIATOR_NAME ||
    'testapi';

  const resultUrl =
    process.env.MPESA_BALANCE_RESULT_URL ||
    process.env.MPESA_B2C_RESULT_URL ||
    'https://api.delivo.co.ke/api/payouts/b2c/balance-result';

  const timeoutUrl =
    process.env.MPESA_BALANCE_TIMEOUT_URL ||
    process.env.MPESA_B2C_TIMEOUT_URL ||
    'https://api.delivo.co.ke/api/payouts/b2c/balance-timeout';

  const accessToken = await getB2CAccessToken();
  const securityCredential = getSecurityCredential();

  const payload = {
    Initiator: initiatorName,
    SecurityCredential: securityCredential,
    CommandID: 'AccountBalance',
    PartyA: String(shortCode),
    IdentifierType: '4', // 4 = Organization ShortCode
    Remarks: remarks,
    QueueTimeOutURL: timeoutUrl,
    ResultURL: resultUrl,
  };

  console.log(`📡 Dispatching Safaricom Account Balance Query for Shortcode ${shortCode}...`);

  const response = await axios.post(
    `${getBaseUrl()}/mpesa/accountbalance/v1/query`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 20000,
    }
  );

  return response.data;
};

module.exports = {
  queryMpesaAccountBalance,
};
