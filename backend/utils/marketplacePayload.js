function normalizeMarketplaceProductPayload(payload = {}, matchingCategory = null) {
  const normalizedPayload = { ...payload };

  if (normalizedPayload.category && typeof normalizedPayload.category === 'object') {
    normalizedPayload.category = normalizedPayload.category._id || normalizedPayload.category.id || normalizedPayload.category;
  }

  if (!normalizedPayload.category && matchingCategory) {
    normalizedPayload.category = matchingCategory._id || matchingCategory;
  }

  return normalizedPayload;
}

module.exports = {
  normalizeMarketplaceProductPayload,
};
