const PLACEHOLDER_IMAGE = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
    <rect width="1200" height="800" fill="#fff7e6" />
    <rect x="40" y="40" width="1120" height="720" rx="28" fill="#fff" stroke="#f5b301" stroke-width="8" />
    <circle cx="600" cy="320" r="140" fill="#f5b301" fill-opacity="0.18" />
    <path d="M420 520c45-90 185-90 230 0" stroke="#f5b301" stroke-width="24" stroke-linecap="round" fill="none" />
    <path d="M390 590h420" stroke="#f5b301" stroke-width="18" stroke-linecap="round" />
    <text x="600" y="690" text-anchor="middle" font-family="Arial, sans-serif" font-size="44" fill="#b76e00">Image unavailable</text>
  </svg>
`)}`;

const BLOCKED_IMAGE_HOSTS = ['via.placeholder.com', 'placehold.co', 'placehold.it', 'placeholder.com'];

export const resolveImageUrl = (image) => {
  if (typeof image !== 'string') {
    return PLACEHOLDER_IMAGE;
  }

  const value = image.trim();
  if (!value) {
    return PLACEHOLDER_IMAGE;
  }

  const normalized = value.toLowerCase();
  if (BLOCKED_IMAGE_HOSTS.some((host) => normalized.includes(host))) {
    return PLACEHOLDER_IMAGE;
  }

  return value;
};

export const handleImageError = (event) => {
  if (event?.currentTarget) {
    event.currentTarget.onerror = null;
    event.currentTarget.src = PLACEHOLDER_IMAGE;
  }
};

export default PLACEHOLDER_IMAGE;
