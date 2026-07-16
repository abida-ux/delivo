const https = require('https');
const http = require('http');

const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || 'http://localhost:5001/api/email';

const postToEmailService = async (path, payload) => {
  const url = new URL(`${EMAIL_SERVICE_URL}${path}`);
  const transport = url.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    const req = transport.request({
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: `${url.pathname}${url.search}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            const error = new Error(parsed.message || 'Email service request failed');
            error.statusCode = res.statusCode;
            error.response = parsed;
            reject(error);
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify(payload));
    req.end();
  });
};

exports.sendVerificationEmail = async (email, verificationCode) => {
  return postToEmailService('/send-verification', { email, otp: verificationCode });
};

exports.sendPasswordResetEmail = async (email, resetCode) => {
  return postToEmailService('/send-password-reset', { email, otp: resetCode });
};
