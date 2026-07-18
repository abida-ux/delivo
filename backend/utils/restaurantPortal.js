const calculateRestaurantEarnings = (orderTotal, commission = 100) => {
  const platformCommission = Number(commission) || 0;
  const subtotal = Number(orderTotal) || 0;
  const restaurantEarnings = Math.max(0, subtotal - platformCommission);

  return {
    platformCommission,
    restaurantEarnings,
    netEarnings: restaurantEarnings,
  };
};

const buildRestaurantFilter = (ownerId) => ({ ownerId });

module.exports = {
  calculateRestaurantEarnings,
  buildRestaurantFilter,
};
