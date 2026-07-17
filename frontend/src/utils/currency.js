export const formatCurrency = (value, prefix = 'Ksh ') => {
  const amount = Number(value ?? 0);
  return `${prefix}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export default formatCurrency;
