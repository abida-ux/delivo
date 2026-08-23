const express = require('express');
const router = express.Router();
const { authenticate, optionalAuthenticate, authorizeRoles } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const { createInAppNotification, sendPushToUser } = require('../utils/pushNotifications');
const {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  getAllOrders,
  getUnassignedOrders,
  claimOrder,
} = require('../controllers/orderController');
const { getRiderAvailabilityStatus } = require('../utils/riderWorkflow');

router.post('/', optionalAuthenticate, createOrder);
router.get('/user/:userId', authenticate, getUserOrders);
router.get('/rider/unassigned', authenticate, authorizeRoles('rider', 'admin'), getUnassignedOrders);
router.put('/:id/claim', authenticate, authorizeRoles('rider', 'admin'), claimOrder);

router.get('/rider/assigned', authenticate, async (req, res, next) => {
  try {
    const requester = await User.findById(req.user.id);
    if (!requester || requester.role !== 'rider') {
      return res.status(403).json({ success: false, message: 'Riders only' });
    }

    const orders = await Order.find({ riderId: requester._id }).populate('items.foodId').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
});

router.get('/rider/available', authenticate, async (req, res, next) => {
  try {
    const requester = await User.findById(req.user.id);
    if (!requester || !['admin', 'rider'].includes(requester.role)) {
      return res.status(403).json({ success: false, message: 'Admins or riders only' });
    }

    const activeOrderStatuses = ['pending', 'confirmed', 'preparing', 'assigned', 'out-for-delivery', 'on-delivery'];
    const busyRiderIds = await Order.distinct('riderId', {
      status: { $in: activeOrderStatuses },
      riderId: { $ne: null },
    });

    const availableRiders = await User.find({
      role: 'rider',
      _id: { $nin: busyRiderIds },
    })
      .select('-password')
      .sort({ name: 1 });

    const normalizedRiders = availableRiders.map((rider) => ({
      ...rider.toObject(),
      riderStatus: getRiderAvailabilityStatus(rider),
    }));

    res.status(200).json({ success: true, data: normalizedRiders });
  } catch (error) {
    next(error);
  }
});

router.put('/rider/assign', authenticate, async (req, res, next) => {
  try {
    const adminUser = await User.findById(req.user.id);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admins only' });
    }

    const { orderId, riderId } = req.body;
    if (!orderId || !riderId) {
      return res.status(400).json({ success: false, message: 'Order ID and rider ID are required' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const riderUser = await User.findById(riderId);
    if (!riderUser || riderUser.role !== 'rider') {
      return res.status(400).json({ success: false, message: 'Invalid rider selected' });
    }

    if (order.riderId && ['assigned', 'out-for-delivery', 'on-delivery'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Order is already assigned to a rider' });
    }

    const activeOrderCount = await Order.countDocuments({ riderId, status: { $in: ['assigned', 'out-for-delivery', 'on-delivery'] } });
    const isBusy = activeOrderCount > 0 || !!riderUser.currentOrderId || getRiderAvailabilityStatus(riderUser) !== 'available';
    if (isBusy) {
      return res.status(400).json({ success: false, message: 'Rider is not available for assignment' });
    }

    order.riderId = riderUser._id;
    order.status = 'assigned';
    order.deliveryStatus = 'assigned';
    order.currentRiderStatus = 'assigned';
    order.assignedAt = new Date();
    order.updatedAt = new Date();
    await order.save();

    riderUser.riderStatus = 'on-delivery';
    riderUser.isOnline = true;
    riderUser.currentOrderId = order._id;
    riderUser.lastSeenAt = new Date();
    await riderUser.save();

    const restaurant = order.restaurantId ? await Restaurant.findById(order.restaurantId) : null;
    const customerUser = order.userId ? await User.findById(order.userId) : null;
    const orderIdShort = order._id.toString().slice(-6).toUpperCase();
    const customerName = customerUser?.name || order.customerName || 'Customer';
    const restaurantName = restaurant?.name || 'restaurant';
    const deliveryAddress = order.deliveryAddress || 'your requested address';

    const riderPayload = {
      title: 'New Delivery Assigned',
      message: `You have been assigned Order #${orderIdShort} from ${restaurantName}.`,
      icon: '/favicon.ico',
      url: '/rider-dashboard',
      data: {
        eventType: 'order_assigned_rider',
        recipientRole: 'rider',
        orderId: order._id.toString(),
        customerName,
        restaurantName,
        deliveryAddress,
        orderStatus: 'assigned',
      },
    };

    const restaurantPayload = {
      title: 'Order assigned to rider',
      message: `Order #${orderIdShort} has been assigned to ${riderUser.name || 'a rider'} (${riderUser.phone || 'contact soon'}). Customer: ${customerName}. Delivery to: ${deliveryAddress}.`,
      icon: '/favicon.ico',
      url: '/restaurant/orders',
      data: {
        eventType: 'order_assigned_rider',
        recipientRole: 'restaurant',
        orderId: order._id.toString(),
        customerName,
        restaurantName,
        deliveryAddress,
        riderName: riderUser.name || 'a rider',
        riderPhone: riderUser.phone || 'contact soon',
        orderStatus: 'assigned',
      },
    };

    await createInAppNotification({ userId: riderUser._id, title: riderPayload.title, message: riderPayload.message, type: 'order' });
    await sendPushToUser({ userId: riderUser._id, payload: riderPayload });

    if (restaurant?.ownerId) {
      const restaurantOwner = await User.findOne({ _id: restaurant.ownerId, role: 'restaurant' });
      if (restaurantOwner?._id) {
        await createInAppNotification({ userId: restaurantOwner._id, title: restaurantPayload.title, message: restaurantPayload.message, type: 'order' });
        await sendPushToUser({ userId: restaurantOwner._id, payload: restaurantPayload });
      }
    }

    res.status(200).json({ success: true, data: order, message: 'Rider assigned successfully' });
  } catch (error) {
    next(error);
  }
});

router.put('/assign-restaurant', authenticate, authorizeRoles('admin'), async (req, res, next) => {
  try {
    const { orderId, restaurantId } = req.body;
    if (!orderId || !restaurantId) {
      return res.status(400).json({ success: false, message: 'Order ID and restaurant ID are required' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    order.restaurantId = restaurant._id;
    order.restaurantName = restaurant.name;
    if (Array.isArray(order.items)) {
      order.items.forEach((item) => {
        item.restaurantId = restaurant._id;
        item.restaurantName = restaurant.name;
      });
    }

    await order.save();

    const orderIdShort = order._id.toString().slice(-6).toUpperCase();
    const amountStr = typeof order.totalPrice === 'number' ? `KES ${order.totalPrice}` : '';

    if (restaurant.ownerId) {
      const ownerMsg = `New order #${orderIdShort} (${amountStr}) assigned to ${restaurant.name} by Admin!`;
      await createInAppNotification({
        userId: restaurant.ownerId,
        title: 'New Assigned Order! 🍽️',
        message: ownerMsg,
        type: 'order',
      });
      await sendPushToUser({
        userId: restaurant.ownerId,
        payload: {
          title: `New Order Assigned for ${restaurant.name}!`,
          message: ownerMsg,
          url: '/restaurant/orders',
        },
      });
    }

    res.status(200).json({ success: true, data: order, message: `Order successfully assigned to ${restaurant.name}` });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticate, getOrderById);
router.put('/:id', authenticate, updateOrderStatus);
router.get('/', authenticate, authorizeRoles('admin'), getAllOrders);

module.exports = router;
