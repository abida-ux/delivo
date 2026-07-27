const ACTIVE_RIDER_DELIVERY_STATUSES = ['assigned', 'on-delivery', 'out-for-delivery'];

const isActiveDeliveryStatus = (status) => {
  const normalized = String(status || '').toLowerCase();
  return ACTIVE_RIDER_DELIVERY_STATUSES.includes(normalized);
};

const getRiderAvailabilityStatus = (rider) => {
  if (!rider) {
    return 'available';
  }

  const riderStatus = String(rider.riderStatus || 'available').toLowerCase();
  if (riderStatus === 'on-delivery') {
    return 'on-delivery';
  }

  if (riderStatus === 'offline') {
    return 'available';
  }

  return 'available';
};

const isRiderAssignable = (rider, activeOrderCount = 0) => {
  if (!rider || String(rider.role || '').toLowerCase() !== 'rider') {
    return false;
  }

  const riderStatus = getRiderAvailabilityStatus(rider);
  return riderStatus === 'available' && activeOrderCount === 0 && !rider.currentOrderId;
};

module.exports = {
  ACTIVE_RIDER_DELIVERY_STATUSES,
  isActiveDeliveryStatus,
  getRiderAvailabilityStatus,
  isRiderAssignable,
};
