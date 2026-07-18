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

const buildRestaurantDashboardData = (restaurant) => ({
  id: restaurant._id,
  name: restaurant.name,
  status: restaurant.status,
  availableBalance: restaurant.availableBalance || 0,
  pendingBalance: restaurant.pendingBalance || 0,
  withdrawnBalance: restaurant.withdrawnBalance || 0,
  isOpen: restaurant.isOpen !== undefined ? restaurant.isOpen : true,
});

module.exports = {
  calculateRestaurantEarnings,
  buildRestaurantFilter,
  buildRestaurantDashboardData,
};
