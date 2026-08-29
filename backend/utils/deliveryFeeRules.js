const DEFAULT_DELIVERY_FEE_RULES = {
  below100: 120,
  above199: 80,
  above299: 50,
  above500: 20,
};

const clampFeeValue = (value, fallback = 0) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return Number(fallback);
  return Math.max(0, numeric);
};

const normalizeDeliveryFeeRules = (input = {}) => {
  const base = { ...DEFAULT_DELIVERY_FEE_RULES };
  const legacyFee = Number(input.deliveryFeeAmount ?? input.amount ?? base.above500);

  if (Number.isFinite(legacyFee)) {
    base.above500 = legacyFee;
  }

  const normalized = {
    below100: clampFeeValue(input.below100 ?? base.below100, base.below100),
    above199: clampFeeValue(input.above199 ?? base.above199, base.above199),
    above299: clampFeeValue(input.above299 ?? base.above299, base.above299),
    above500: clampFeeValue(input.above500 ?? legacyFee ?? base.above500, base.above500),
  };

  return normalized;
};

const calculateDeliveryFee = (subtotal, rules = {}) => {
  const orderSubtotal = Number(subtotal) || 0;
  const normalizedRules = normalizeDeliveryFeeRules(rules);

  if (orderSubtotal < 100) return normalizedRules.below100;
  if (orderSubtotal < 299) return normalizedRules.above199;
  if (orderSubtotal < 500) return normalizedRules.above299;
  return normalizedRules.above500;
};

module.exports = {
  DEFAULT_DELIVERY_FEE_RULES,
  normalizeDeliveryFeeRules,
  calculateDeliveryFee,
};
