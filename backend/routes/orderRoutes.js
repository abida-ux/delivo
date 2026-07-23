const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
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
} = require('../controllers/orderController');

router.post('/', createOrder);
router.get('/user/:userId', getUserOrders);
router.get('/:id', getOrderById);
router.put('/:id', updateOrderStatus);
router.get('/', getAllOrders);

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

    const busyOrders = await Order.find({
      status: { $in: ['assigned', 'out-for-delivery', 'on-delivery'] },
      riderId: { $ne: null },
    }).select('riderId');

    const busyRiderIds = busyOrders.map((order) => order.riderId.toString());

    const availableRiders = await User.find({
      role: 'rider',
      _id: { $nin: busyRiderIds },
      $or: [
        { riderStatus: 'available' },
        { riderStatus: 'offline' },
        { riderStatus: { $exists: false } },
      ],
    }).select('-password');

    res.status(200).json({ success: true, data: availableRiders });
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

    const activeOrderCount = await Order.countDocuments({ riderId, status: { $in: ['assigned', 'out-for-delivery', 'on-delivery'] } });
    const isBusy = activeOrderCount > 0 || !!riderUser.currentOrderId || riderUser.riderStatus === 'on-delivery';
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

module.exports = router;
