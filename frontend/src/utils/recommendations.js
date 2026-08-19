/**
 * Recommendation scoring & selection engine for Delivo
 * Computes time-aware, popularity-weighted, diverse recommendations
 */

const RECENT_PICKS_KEY = 'delivo_recent_fresh_picks';

// Time of day relevance bonus for recommendations
function getTimeRelevanceBonus(food, currentHour) {
  const cat = (food.category || '').toLowerCase();
  const tags = Array.isArray(food.tags) ? food.tags.map((t) => String(t).toLowerCase()) : [];
  const name = (food.name || '').toLowerCase();
  const allDescriptors = [cat, ...tags, name].join(' ');

  // Evening / Night (5:00 PM – 4:59 AM) -> "Fresh Picks for Tonight"
  if (currentHour >= 17 || currentHour < 5) {
    if (/dinner|meal|lunch|fast food|street food|pizza|burger|grill|bbq|combo|fish|chicken|beef|rice|ugali|chapati/i.test(allDescriptors)) {
      return 40;
    }
    if (/snack|drink|dessert|beverage|juice/i.test(allDescriptors)) {
      return 15;
    }
    if (/breakfast|coffee|tea|pancake|porridge/i.test(allDescriptors)) {
      return -25;
    }
    return 10;
  }

  // Morning (5:00 AM – 11:59 AM)
  if (currentHour >= 5 && currentHour < 12) {
    if (/breakfast|coffee|tea|bakery|croissant|pancake|egg|healthy|smoothie/i.test(allDescriptors)) {
      return 40;
    }
    if (/snack|drink|juice/i.test(allDescriptors)) {
      return 15;
    }
    return 5;
  }

  // Afternoon / Lunch (12:00 PM – 4:59 PM)
  if (/lunch|meal|fast food|street food|rice|chicken|burger|pizza/i.test(allDescriptors)) {
    return 40;
  }
  return 10;
}

export function selectFreshPicksRecommendations(allFoods, options = {}) {
  const {
    targetCount = 8,
    maxPerCategory = 2,
    maxPerRestaurant = 2,
  } = options;

  if (!Array.isArray(allFoods) || allFoods.length === 0) {
    return [];
  }

  // 1. Filter only available foods
  const eligible = allFoods.filter((f) => {
    if (!f || !f._id) return false;
    if (f.defaultAvailability === false || f.isAvailable === false) return false;
    return true;
  });

  if (eligible.length <= targetCount) {
    return [...eligible].sort(() => Math.random() - 0.5);
  }

  // 2. Read recently shown food IDs to promote rotation across refreshes
  let recentIds = new Set();
  try {
    const raw = sessionStorage.getItem(RECENT_PICKS_KEY);
    if (raw) {
      recentIds = new Set(JSON.parse(raw));
    }
  } catch {
    recentIds = new Set();
  }

  const currentHour = new Date().getHours();

  // 3. Calculate multi-factor recommendation score for each food
  const scored = eligible.map((food) => {
    let score = 50; // Baseline score

    // Rating score (e.g. 4.5 rating -> +54 pts)
    const rating = Number(food.rating) || 0;
    if (rating > 0) {
      score += rating * 12;
    }

    // Number of reviews
    const reviews = Number(food.numReviews) || 0;
    if (reviews > 0) {
      score += Math.min(reviews, 25) * 2;
    }

    // Featured status
    if (food.featured) {
      score += 25;
    }

    // Time-of-day relevance ("Tonight")
    score += getTimeRelevanceBonus(food, currentHour);

    // Recently shown penalty for healthy refresh rotation
    if (recentIds.has(String(food._id))) {
      score -= 35;
    }

    // Controlled random jitter (0 to 30 points) for natural rotation
    score += Math.random() * 30;

    return { food, score };
  });

  // Sort descending by calculated score
  scored.sort((a, b) => b.score - a.score);

  // 4. Diverse Selection with Category and Restaurant distribution limits
  const selected = [];
  const categoryCounts = {};
  const restaurantCounts = {};
  const remainingPool = [];

  for (const { food } of scored) {
    if (selected.length >= targetCount) break;

    const catKey = (food.category || 'general').toLowerCase().trim();
    const restKey = String(
      typeof food.restaurant === 'object' ? food.restaurant?._id : food.restaurant || 'delivo'
    );

    const catCount = categoryCounts[catKey] || 0;
    const restCount = restaurantCounts[restKey] || 0;

    if (catCount < maxPerCategory && restCount < maxPerRestaurant) {
      selected.push(food);
      categoryCounts[catKey] = catCount + 1;
      restaurantCounts[restKey] = restCount + 1;
    } else {
      remainingPool.push(food);
    }
  }

  // Fill in from top remaining pool if diversity limit left us under targetCount
  if (selected.length < targetCount) {
    for (const food of remainingPool) {
      if (selected.length >= targetCount) break;
      if (!selected.some((s) => s._id === food._id)) {
        selected.push(food);
      }
    }
  }

  // 5. Interleave categories to avoid consecutive duplicate categories
  const arranged = [];
  const pool = [...selected];

  while (pool.length > 0) {
    const lastCat = arranged.length > 0 ? (arranged[arranged.length - 1].category || '').toLowerCase() : null;
    let nextIdx = pool.findIndex((f) => (f.category || '').toLowerCase() !== lastCat);
    if (nextIdx === -1) nextIdx = 0;
    arranged.push(pool.splice(nextIdx, 1)[0]);
  }

  // 6. Save current recommendation set IDs to sessionStorage for next rotation
  try {
    const idsToStore = arranged.map((f) => String(f._id));
    sessionStorage.setItem(RECENT_PICKS_KEY, JSON.stringify(idsToStore));
  } catch {}

  return arranged;
}
