const VAT_AMOUNT = 5;

const sanitizeNonNegativeNumber = (value, fallback = 0) => {
  const parsed = Number(value ?? fallback);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, parsed);
};

const calculateOrderTotals = ({
  subtotal = 0,
  deliveryFee = 0,
  discountAmount = 0,
  riderTip = 0,
  vat = VAT_AMOUNT,
}) => {
  const safeSubtotal = sanitizeNonNegativeNumber(subtotal);
  const safeDeliveryFee = sanitizeNonNegativeNumber(deliveryFee);
  const safeDiscountAmount = sanitizeNonNegativeNumber(discountAmount);
  const safeRiderTip = sanitizeNonNegativeNumber(riderTip);
  const fixedVat = sanitizeNonNegativeNumber(vat, VAT_AMOUNT) || VAT_AMOUNT;

  const finalTotal = Math.round(
    (safeSubtotal + safeDeliveryFee + fixedVat + safeRiderTip - safeDiscountAmount) * 100
  ) / 100;

  return {
    subtotal: safeSubtotal,
    deliveryFee: safeDeliveryFee,
    discountAmount: safeDiscountAmount,
    vat: fixedVat,
    riderTip: safeRiderTip,
    finalTotal: Math.max(0, finalTotal),
  };
};

module.exports = {
  VAT_AMOUNT,
  calculateOrderTotals,
};
