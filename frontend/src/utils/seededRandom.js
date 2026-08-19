let inMemorySeed = null;

// Mulberry32 deterministic 32-bit PRNG
export function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Convert string/number seed into a 32-bit integer
export function hashSeed(seed) {
  if (typeof seed === 'number' && Number.isFinite(seed)) {
    return (seed | 0) || 1;
  }
  const str = String(seed || 'delivo_seed');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash === 0 ? 1 : hash;
}

// Deterministic copy shuffle based on seed
export function seededShuffle(arr, seed) {
  if (!Array.isArray(arr) || arr.length <= 1) return arr ? [...arr] : [];
  const seedNum = hashSeed(seed);
  const rng = mulberry32(seedNum);
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Generate a random 32-bit seed string
export function generateNewSeed() {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

// Get or create session seed that persists across client-side SPA navigation,
// and resets ONLY when the user explicitly performs a browser page refresh (F5 / reload).
export function getOrCreateSessionSeed() {
  const STORAGE_KEY = 'delivo_meals_seed';

  // If in-memory seed already exists within this SPA runtime, keep it!
  if (inMemorySeed) {
    return inMemorySeed;
  }

  // Detect if this page initialization is a full browser refresh (F5 / reload)
  let isBrowserReload = false;
  try {
    const navEntries = performance.getEntriesByType('navigation');
    if (navEntries && navEntries.length > 0) {
      isBrowserReload = navEntries[0].type === 'reload';
    } else if (performance.navigation) {
      isBrowserReload = performance.navigation.type === 1;
    }
  } catch {
    isBrowserReload = false;
  }

  // If this was an explicit browser refresh, generate a fresh seed
  if (isBrowserReload) {
    const newSeed = generateNewSeed();
    inMemorySeed = newSeed;
    try {
      sessionStorage.setItem(STORAGE_KEY, newSeed);
    } catch {}
    return newSeed;
  }

  // Otherwise (initial load or returning from another tab / session), try reading from sessionStorage
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      inMemorySeed = stored;
      return stored;
    }
  } catch {}

  // Initial creation
  const createdSeed = generateNewSeed();
  inMemorySeed = createdSeed;
  try {
    sessionStorage.setItem(STORAGE_KEY, createdSeed);
  } catch {}
  return createdSeed;
}
