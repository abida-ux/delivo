const allowedOrigins = new Set([
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
]);

if (process.env.FRONTEND_URL) {
  allowedOrigins.add(process.env.FRONTEND_URL);
}

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.has(origin)) return true;
  if (origin.includes('localhost')) return true;
  if (/^https:\/\/.*\.(vercel\.app|netlify\.app)$/i.test(origin)) return true;
  return false;
};

module.exports = {
  isAllowedOrigin,
};
