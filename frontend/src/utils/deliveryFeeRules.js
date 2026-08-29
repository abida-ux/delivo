export const DEFAULT_DELIVERY_FEE_RULES = {
  below100: 120,
  above199: 80,
  above299: 50,
  above500: 20,
};

export const normalizeDeliveryFeeRules = (input = {}) => {
  const base = { ...DEFAULT_DELIVERY_FEE_RULES };
  const legacyFee = Number(input.deliveryFeeAmount ?? input.amount ?? base.above500);

  if (Number.isFinite(legacyFee)) {
    base.above500 = legacyFee;
  }

  return {
    below100: Number.isFinite(Number(input.below100)) ? Number(input.below100) : base.below100,
    above199: Number.isFinite(Number(input.above199)) ? Number(input.above199) : base.above199,
    above299: Number.isFinite(Number(input.above299)) ? Number(input.above299) : base.above299,
    above500: Number.isFinite(Number(input.above500)) ? Number(input.above500) : Number.isFinite(legacyFee) ? legacyFee : base.above500,
  };
};

export const calculateDeliveryFee = (subtotal, rules = {}) => {
  const orderSubtotal = Number(subtotal) || 0;
  const normalizedRules = normalizeDeliveryFeeRules(rules);

  if (orderSubtotal < 100) return normalizedRules.below100;
  if (orderSubtotal < 299) return normalizedRules.above199;
  if (orderSubtotal < 500) return normalizedRules.above299;
  return normalizedRules.above500;
};
