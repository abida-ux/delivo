const authMiddleware = (req, res, next) => {
  const apiKey = req.get('x-api-key');
  const expected = process.env.EMAIL_SERVICE_SECRET;

  if (!expected || apiKey !== expected) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
      errorCode: 'UNAUTHORIZED',
    });
  }

  next();
};

module.exports = { authMiddleware };
