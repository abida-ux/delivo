import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://www.delivo.co.ke';
const API_BASE = 'https://delivo-d5r8.onrender.com/api';

const staticRoutes = [
  { path: '', changefreq: 'daily', priority: '1.0' },
  { path: '/restaurants', changefreq: 'daily', priority: '0.9' },
  { path: '/categories', changefreq: 'weekly', priority: '0.8' },
  { path: '/contact', changefreq: 'monthly', priority: '0.5' },
  { path: '/about', changefreq: 'monthly', priority: '0.5' },
  { path: '/login', changefreq: 'monthly', priority: '0.4' },
  { path: '/signup', changefreq: 'monthly', priority: '0.4' },
  { path: '/cart', changefreq: 'daily', priority: '0.6' },
  { path: '/profile', changefreq: 'daily', priority: '0.6' }
];

async function fetchAPI(endpoint) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.success && Array.isArray(json.data) ? json.data : [];
  } catch (error) {
    console.warn(`⚠️ Warning: Failed to fetch ${endpoint} (${error.message}). Using empty fallback.`);
    return [];
  }
}

async function generate() {
  const lastmod = new Date().toISOString().split('T')[0];
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // 1. Add static routes
  for (const route of staticRoutes) {
    xml += '  <url>\n';
    xml += `    <loc>${BASE_URL}${route.path}</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += `    <changefreq>${route.changefreq}</changefreq>\n`;
    xml += `    <priority>${route.priority}</priority>\n`;
    xml += '  </url>\n';
  }

  // Fetch dynamic categories
  const categories = await fetchAPI('/categories');
  for (const cat of categories) {
    const slug = cat.name.toLowerCase().replace(/\s+/g, '-');
    xml += '  <url>\n';
    xml += `    <loc>${BASE_URL}/categories?c=${slug}</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.7</priority>\n';
    xml += '  </url>\n';
  }

  // Fetch dynamic restaurants
  const restaurants = await fetchAPI('/restaurants');
  for (const rest of restaurants) {
    if (rest._id) {
      xml += '  <url>\n';
      xml += `    <loc>${BASE_URL}/restaurants/${rest._id}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += '    <changefreq>daily</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    }
  }

  // Fetch dynamic foods
  const foods = await fetchAPI('/foods');
  for (const food of foods) {
    if (food._id) {
      xml += '  <url>\n';
      xml += `    <loc>${BASE_URL}/food/${food._id}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.7</priority>\n';
      xml += '  </url>\n';
    }
  }

  xml += '</urlset>\n';

  // Ensure public directory exists
  const publicDir = path.join(__dirname, '..', 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const sitemapPath = path.join(publicDir, 'sitemap.xml');
  fs.writeFileSync(sitemapPath, xml, 'utf8');
  console.log(`✅ Sitemap successfully written to ${sitemapPath}`);
}

generate().catch(err => {
  console.error('❌ Sitemap generation error:', err);
  process.exit(1);
});
