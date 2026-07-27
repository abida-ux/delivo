const normalizeCategorySelection = (categories = []) => {
  if (!Array.isArray(categories)) {
    return { ids: [], primaryName: 'Other' };
  }

  const ids = categories
    .map((entry) => {
      if (!entry) return null;
      if (typeof entry === 'object') {
        return entry._id || entry.id || null;
      }
      return null;
    })
    .filter(Boolean);

  const primaryCategory = categories.find((entry) => {
    if (!entry) return false;
    if (typeof entry === 'object') {
      return Boolean(entry._id || entry.id || entry.name);
    }
    return Boolean(entry);
  });

  const primaryName = typeof primaryCategory === 'object'
    ? primaryCategory.name || 'Other'
    : primaryCategory || 'Other';

  return { ids, primaryName };
};

const normalizeRestaurantSelection = (restaurants = []) => {
  if (!Array.isArray(restaurants)) {
    return { ids: [], primaryId: null };
  }

  const ids = restaurants
    .map((entry) => (typeof entry === 'object' ? entry._id || entry.id : entry))
    .filter(Boolean);

  const primaryId = ids[0] || null;

  return { ids, primaryId };
};

const getPrimaryCategoryName = (categories = []) => {
  if (!Array.isArray(categories)) return 'Other';

  const first = categories.find((entry) => Boolean(entry));
  if (!first) return 'Other';

  if (typeof first === 'object') {
    return first.name || 'Other';
  }

  return first || 'Other';
};

module.exports = {
  normalizeCategorySelection,
  normalizeRestaurantSelection,
  getPrimaryCategoryName,
};
