const allowedOrigins = new Set([
  // Local development
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',

  // Production domains
  'https://delivo-nu.vercel.app',
  'https://delivo.buzz',
  'https://www.delivo.buzz',

  // Backend
  'https://delivo-d5r8.onrender.com',
]);

if (process.env.FRONTEND_URL) {
  process.env.FRONTEND_URL
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)
    .forEach(origin => allowedOrigins.add(origin));
}

const isAllowedOrigin = (origin) => {
  if (!origin) return true;

  if (allowedOrigins.has(origin)) return true;

  if (
    origin.startsWith('http://localhost:') ||
    origin.startsWith('http://127.0.0.1:')
  ) {
    return true;
  }

  if (/^https:\/\/.*\.vercel\.app$/i.test(origin)) return true;

  if (/^https:\/\/.*\.netlify\.app$/i.test(origin)) return true;

  return false;
};

module.exports = {
  isAllowedOrigin,
};