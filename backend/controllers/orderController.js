const mongoose = require('mongoose');
const Order = require('../models/Order');
const Food = require('../models/Food');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');

const AppSettings = require('../models/AppSettings');
const { sendMpesaStkPush } = require('../utils/mpesaService');
const { buildNotificationPayload, createInAppNotification, sendPushToUser, sendOrderPaymentNotification } = require('../utils/pushNotifications');
const { isActiveDeliveryStatus, isRiderAssignable, getRiderAvailabilityStatus } = require('../utils/riderWorkflow');
const { buildPopulatedOrderItems } = require('../utils/orderItems');


// @desc Create order
// @route POST /api/orders
exports.createOrder = async (req, res, next) => {
  try {
    const {
      userId,
      guestEmail,
      guestPhone,
      customerName,
      items,
      deliveryAddress,
      deliveryLatitude,
      deliveryLongitude,
      specialInstructions,
      whatsappNumber,
      mpesaNumber,
      deliveryFee = 20,
      restaurantId,
      expectedTotal,
    } = req.body;

    console.log('🛒 Creating order with data:', {
      userId,
      isGuest: !userId,
      guestEmail,
      guestPhone,
      customerName,
      itemsCount: items?.length,
      deliveryAddress,
      whatsappNumber,
      mpesaNumber,
      deliveryFee,
    });

    // ✅ Allow either userId (authenticated) or guest info (guest checkout)
    if (!userId && !customerName) {
      return res.status(400).json({
        success: false,
        message: 'Either a logged-in user or a customer name is required',
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item',
      });
    }

    if (!deliveryAddress) {
      return res.status(400).json({
        success: false,
        message: 'Delivery address is required',
      });
    }

    if (!whatsappNumber) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp number is required',
      });
    }

    if (!mpesaNumber) {
      return res.status(400).json({
        success: false,
        message: 'M-Pesa number is required',
      });
    }

    let finalRestaurantId = restaurantId;
    if (!finalRestaurantId && items.length > 0) {
      const firstItem = items[0];
      if (firstItem.isCombination) {
        const RestaurantCombination = require('../models/RestaurantCombination');
        const link = await RestaurantCombination.findOne({ combinationId: firstItem.foodId });
        finalRestaurantId = link?.restaurantId;
      } else {
        const RestaurantFood = require('../models/RestaurantFood');
        const link = await RestaurantFood.findOne({ foodId: firstItem.foodId });
        finalRestaurantId = link?.restaurantId;
      }
    }

    let subtotal = 0;
    const populatedItems = await buildPopulatedOrderItems(items, {
      getMarketplaceProductById: async (id) => {
        const MarketplaceProduct = require('../models/MarketplaceProduct');
        return MarketplaceProduct.findById(id);
      },
      getFoodById: async (id) => {
        const Food = require('../models/Food');
        return Food.findById(id);
      },
      getRestaurantFoodById: async (foodId) => {
        const RestaurantFood = require('../models/RestaurantFood');
        return RestaurantFood.findOne({ restaurantId: finalRestaurantId, foodId });
      },
      getCombinationById: async (id) => {
        const FoodCombination = require('../models/FoodCombination');
        return FoodCombination.findById(id);
      },
      getRestaurantCombinationById: async (combinationId) => {
        const RestaurantCombination = require('../models/RestaurantCombination');
        return RestaurantCombination.findOne({ restaurantId: finalRestaurantId, combinationId });
      },
    }, finalRestaurantId);

    for (const item of populatedItems) {
      subtotal += (item.price || 0) * (item.quantity || 1);
    }

    const finalRestaurantIdObj = finalRestaurantId;
    let restaurant = null;
    if (finalRestaurantId && mongoose.Types.ObjectId.isValid(finalRestaurantId)) {
      restaurant = await Restaurant.findById(finalRestaurantId);
      if (restaurant && restaurant.isOpen === false) {
        return res.status(400).json({
          success: false,
          message: 'This restaurant is currently closed and cannot receive orders right now',
        });
      }
    }


    const appSettings = (await AppSettings.findOne()) || {};

    let parsedDeliveryFee = Number(deliveryFee);
    if (Number.isNaN(parsedDeliveryFee) || parsedDeliveryFee < 0) {
      parsedDeliveryFee = 0;
    }
    const deliveryFeeFromSettings = appSettings.deliveryFeeEnabled !== false ? Number(appSettings.deliveryFeeAmount) || 0 : 0;
    let finalDeliveryFee = deliveryFee !== undefined && deliveryFee !== null ? parsedDeliveryFee : deliveryFeeFromSettings;
    
    // Apply promo code discount securely on the server
    let discountAmount = 0;
    const { promoCode } = req.body;
    
    if (promoCode) {
      const Offer = require('../models/Offer');
      const matchingOffer = await Offer.findOne({ code: promoCode.trim().toUpperCase() });
      if (matchingOffer) {
        let minOrderVal = 0;
        if (matchingOffer.minOrder) {
          minOrderVal = parseFloat(matchingOffer.minOrder.replace(/[^0-9.]/g, '')) || 0;
        }
        if (subtotal >= minOrderVal) {
          const discountStr = matchingOffer.discount.toUpperCase();
          if (discountStr.includes('FREE DELIVERY')) {
            finalDeliveryFee = 0;
          } else if (discountStr.includes('%')) {
            const percentage = parseFloat(discountStr.replace(/[^0-9.]/g, '')) || 0;
            discountAmount = (subtotal * (percentage / 100));
          } else {
            const fixed = parseFloat(discountStr.replace(/[^0-9.]/g, '')) || 0;
            discountAmount = fixed;
          }
        }
      }
    }
    
    const totalPrice = Math.max(0, subtotal + finalDeliveryFee - discountAmount);
    const isFreeDelivery = finalDeliveryFee === 0;

    if (expectedTotal && Math.abs(totalPrice - parseFloat(expectedTotal)) > 1.0) {
      return res.status(400).json({
        success: false,
        message: `Prices or delivery fee have changed since you opened checkout. Expected KES ${expectedTotal}, but current total is KES ${totalPrice.toFixed(2)}. Please review and try again.`,
        priceChange: true
      });
    }

    // Securing against spoofing userId of other users
    if (userId) {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required to create order for this user ID.'
        });
      }
      if (req.user.id !== userId) {
        const reqUser = await User.findById(req.user.id);
        if (!reqUser || reqUser.role !== 'admin') {
          return res.status(403).json({
            success: false,
            message: 'Forbidden: You cannot place orders on behalf of other users.'
          });
        }
      }
    }

    // ✅ Create order with userId (if authenticated) or guest info (if guest)
    const order = await Order.create({
      userId: userId || undefined,
      guestEmail: guestEmail || undefined,
      guestPhone: guestPhone || undefined,
      restaurantId: finalRestaurantId || undefined,
      deliveryLatitude: deliveryLatitude ? parseFloat(deliveryLatitude) : 0,
      deliveryLongitude: deliveryLongitude ? parseFloat(deliveryLongitude) : 0,
      items: populatedItems,
      totalPrice,
      deliveryFee: finalDeliveryFee,
      tax: 0,
      deliveryAddress,
      paymentMethod: 'mpesa',
      whatsappNumber,
      mpesaNumber,
      customerName: customerName || undefined,
      paymentStatus: 'pending',
      specialInstructions: specialInstructions || '',
      freeDeliveryApplied: isFreeDelivery,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    try {
      const pushResponse = await sendMpesaStkPush({
        phoneNumber: mpesaNumber,
        amount: totalPrice,
        accountReference: order._id.toString(),
        transactionDesc: `Payment for Delivo order ${order._id.toString().slice(-8)}`,
      });

      order.checkoutRequestId = pushResponse.CheckoutRequestID || null;
      order.merchantRequestId = pushResponse.MerchantRequestID || null;
      order.paymentCallbackPayload = pushResponse;
      await order.save();

      console.log('✅ M-Pesa STK push initiated:', order.checkoutRequestId);
      sendOrderPaymentNotification(order, 'pending').catch(() => {});
    } catch (pushError) {
      const errorDetail = pushError.message || 'Unknown M-Pesa error';
      const isDuplicateSession = /Duplicated MSISDN|USSD Session|existing USSD/i.test(errorDetail);

      order.paymentStatus = 'failed';
      order.status = 'cancelled';
      order.failureReason = errorDetail;
      await order.save();

      console.error('❌ M-Pesa STK push failed:', errorDetail);
      sendOrderPaymentNotification(order, 'failed').catch(() => {});

      return res.status(502).json({
        success: false,
        message: isDuplicateSession
          ? 'M-Pesa is already processing a request for this number. Please complete or cancel the existing prompt first, then try again.'
          : 'Payment request failed. Please try again.',
        error: errorDetail,
      });
    }


    await order.populate('items.foodId');

    const restaurantOwner = restaurant?.ownerId
      ? await User.findOne({ _id: restaurant.ownerId, role: 'restaurant' })
      : null;

    try {
      const orderIdShort = order._id.toString().slice(-6).toUpperCase();
      const customerUser = order.userId ? await User.findById(order.userId) : null;
      const notificationPromises = [];

      // 1. Send Admin Order Notification strictly to users with role === 'admin'
      const adminUsers = await User.find({ role: 'admin' });
      if (adminUsers && adminUsers.length > 0) {
        const adminPayload = {
          title: 'New Order Alert',
          message: `New order #${orderIdShort} placed by ${customerName || customerUser?.name || 'Customer'} for KES ${totalPrice}.`,
          url: '/admin/orders',
          tag: 'delivo-admin-order',
        };

        for (const adminUser of adminUsers) {
          notificationPromises.push(
            createInAppNotification({
              userId: adminUser._id,
              title: adminPayload.title,
              message: adminPayload.message,
              type: 'order',
            }).catch(err => console.error(`Admin in-app notification error for user ${adminUser._id}:`, err.message)),
            sendPushToUser({ userId: adminUser._id, payload: adminPayload }).catch(err => console.error(`Admin push notification error for user ${adminUser._id}:`, err.message))
          );
        }
      }

      // 2. Send Restaurant Owner Notification strictly to restaurant owner
      if (restaurantOwner?._id) {
        const restaurantPayload = {
          title: 'New Order Received',
          message: `Your store received new order #${orderIdShort} for KES ${totalPrice}.`,
          url: '/restaurant/orders',
          tag: 'delivo-restaurant-order',
        };
        notificationPromises.push(
          createInAppNotification({
            userId: restaurantOwner._id,
            title: restaurantPayload.title,
            message: restaurantPayload.message,
            type: 'order',
          }).catch(err => console.error(`Restaurant in-app notification error for user ${restaurantOwner._id}:`, err.message)),
          sendPushToUser({ userId: restaurantOwner._id, payload: restaurantPayload }).catch(err => console.error(`Restaurant push notification error for user ${restaurantOwner._id}:`, err.message))
        );
      }

      // Run all notification dispatches concurrently in background without blocking response
      if (notificationPromises.length > 0) {
        Promise.all(notificationPromises).catch(err => console.error('Notification dispatch batch failed:', err));
      }
    } catch (notificationError) {
      console.error('⚠️ Order notifications failed:', notificationError.message || notificationError);
    }


    console.log('✅ Order created successfully:', order._id);

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('❌ Error creating order:', error);
    next(error);
  }
};

// @desc Get user orders
// @route GET /api/orders/user/:userId
exports.getUserOrders = async (req, res, next) => {
  try {
    // Allow users to get their own orders, and admins to get any user's orders
    if (req.user.id !== req.params.userId) {
      const reqUser = await User.findById(req.user.id);
      if (!reqUser || reqUser.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only access your own orders.',
        });
      }
    }

    const orders = await Order.find({ userId: req.params.userId })
      .populate('items.foodId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get single order
// @route GET /api/orders/:id
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.foodId');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Verify user owns the order, is the assigned rider, is the restaurant owner, or is an admin
    const reqUser = await User.findById(req.user.id);
    if (!reqUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isOwner = order.userId?.toString() === reqUser._id.toString();
    const isAdmin = reqUser.role === 'admin';
    const isRider = order.riderId?.toString() === reqUser._id.toString();

    let isRestaurantOwner = false;
    if (order.restaurantId) {
      const restaurant = await Restaurant.findById(order.restaurantId);
      isRestaurantOwner = restaurant?.ownerId?.toString() === reqUser._id.toString();
    }

    if (!isOwner && !isAdmin && !isRider && !isRestaurantOwner) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not authorized to view this order.',
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update order status
// @route PUT /api/orders/:id
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, paymentStatus, riderId } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const reqUser = await User.findById(req.user.id);
    if (!reqUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isAdmin = reqUser.role === 'admin';
    const isAssignedRider = order.riderId?.toString() === reqUser._id.toString();

    let isRestaurantOwner = false;
    if (order.restaurantId) {
      const restaurant = await Restaurant.findById(order.restaurantId);
      isRestaurantOwner = restaurant?.ownerId?.toString() === reqUser._id.toString();
    }

    // Role checks:
    // Admin can update anything.
    // Restaurant owner can update order status for their restaurant.
    // Rider can only update status if it's assigned to them, and they can't change paymentStatus or riderId.
    if (!isAdmin && !isRestaurantOwner && !isAssignedRider) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not authorized to update this order.',
      });
    }

    if (isAssignedRider && !isAdmin && !isRestaurantOwner) {
      // Rider can update status but not paymentStatus or riderId
      if (paymentStatus && paymentStatus !== order.paymentStatus) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Riders cannot modify payment status.',
        });
      }
      if (riderId && riderId !== order.riderId?.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Riders cannot reassign orders.',
        });
      }
    }

    const nextStatus = status || order.status;
    const nextPaymentStatus = paymentStatus || order.paymentStatus;
    const nextRiderId = riderId || order.riderId;

    order.status = nextStatus;
    order.paymentStatus = nextPaymentStatus;
    order.riderId = nextRiderId;
    order.updatedAt = Date.now();

    if (nextStatus === 'assigned' || nextStatus === 'out-for-delivery' || nextStatus === 'on-delivery') {
      order.deliveryStatus = 'assigned';
      order.currentRiderStatus = 'assigned';
      if (!order.assignedAt) order.assignedAt = new Date();
      if (nextStatus === 'out-for-delivery' || nextStatus === 'on-delivery') {
        order.deliveryStartedAt = order.deliveryStartedAt || new Date();
        order.deliveryStatus = 'out-for-delivery';
      }
    } else if (nextStatus === 'delivered') {
      order.deliveryStatus = 'delivered';
      order.deliveryCompletedAt = order.deliveryCompletedAt || new Date();
      order.currentRiderStatus = 'available';
    }

    if (nextRiderId && (nextStatus === 'assigned' || nextStatus === 'out-for-delivery' || nextStatus === 'on-delivery')) {
      const riderUser = await User.findById(nextRiderId);
      if (riderUser) {
        riderUser.riderStatus = 'on-delivery';
        riderUser.isOnline = true;
        riderUser.currentOrderId = order._id;
        riderUser.lastSeenAt = new Date();
        await riderUser.save();
      }
    } else if ((nextStatus === 'delivered' || nextStatus === 'cancelled') && order.riderId) {
      const riderUser = await User.findById(order.riderId);
      if (riderUser) {
        riderUser.riderStatus = 'available';
        riderUser.isOnline = true;
        riderUser.currentOrderId = null;
        if (nextStatus === 'delivered') {
          riderUser.totalDeliveries = (riderUser.totalDeliveries || 0) + 1;
          riderUser.totalEarnings = Number(riderUser.totalEarnings || 0) + Number(order.totalPrice || 0) * 0.1;
        }
        riderUser.lastSeenAt = new Date();
        await riderUser.save();
      }
    }

    await order.save();
    await order.populate('items.foodId');

    try {
      const adminUsers = await User.find({ role: 'admin' });
      const restaurant = order.restaurantId ? await Restaurant.findById(order.restaurantId) : null;
      const restaurantOwner = restaurant?.ownerId ? await User.findOne({ _id: restaurant.ownerId, role: 'restaurant' }) : null;
      const customerUser = order.userId ? await User.findById(order.userId) : null;
      const riderUser = order.riderId ? await User.findById(order.riderId) : null;

      const orderIdShort = order._id.toString().slice(-6);
      const customerName = customerUser?.name || order.customerName || 'Customer';
      const restaurantName = restaurant?.name || 'restaurant';
      const deliveryAddress = order.deliveryAddress || 'your requested address';
      const riderName = riderUser?.name || 'a rider';
      const riderPhone = riderUser?.phone || 'contact soon';

      const genericPayload = buildNotificationPayload({
        eventType: 'order_status_update',
        order,
        recipientRole: riderUser ? 'rider' : 'customer',
        extra: {
          orderId: order._id.toString(),
          customerName,
          restaurantName,
          deliveryAddress,
          riderName,
          riderPhone,
        },
      });

      const notificationPromises = [];

      if (status === 'assigned' || status === 'on-delivery') {
        const riderPayload = {
          title: 'New delivery assignment',
          message: `You have been assigned order #${orderIdShort} for ${restaurantName}. Customer: ${customerName}. Delivery to: ${deliveryAddress}.`,
          icon: '/favicon.ico',
          url: '/orders',
          data: {
            eventType: 'order_assigned_rider',
            recipientRole: 'rider',
            orderId: order._id.toString(),
            customerName,
            restaurantName,
            deliveryAddress,
            riderName,
            riderPhone,
            orderStatus: status,
          },
        };

        const restaurantPayload = {
          title: 'Order assigned to rider',
          message: `Order #${orderIdShort} has been assigned to ${riderName} (${riderPhone}). Customer: ${customerName}. Delivery to: ${deliveryAddress}.`,
          icon: '/favicon.ico',
          url: '/orders',
          data: {
            eventType: 'order_assigned_rider',
            recipientRole: 'restaurant',
            orderId: order._id.toString(),
            customerName,
            restaurantName,
            deliveryAddress,
            riderName,
            riderPhone,
            orderStatus: status,
          },
        };

        for (const adminUser of adminUsers) {
          notificationPromises.push(
            createInAppNotification({ userId: adminUser._id, title: riderPayload.title, message: riderPayload.message, type: 'order' }).catch(err => console.error(`Admin in-app status notification error:`, err.message)),
            sendPushToUser({ userId: adminUser._id, payload: riderPayload }).catch(err => console.error(`Admin push status notification error:`, err.message))
          );
        }

        if (restaurantOwner?._id) {
          notificationPromises.push(
            createInAppNotification({ userId: restaurantOwner._id, title: restaurantPayload.title, message: restaurantPayload.message, type: 'order' }).catch(err => console.error(`Restaurant in-app status notification error:`, err.message)),
            sendPushToUser({ userId: restaurantOwner._id, payload: restaurantPayload }).catch(err => console.error(`Restaurant push status notification error:`, err.message))
          );
        }

        if (riderUser?._id) {
          notificationPromises.push(
            createInAppNotification({ userId: riderUser._id, title: riderPayload.title, message: riderPayload.message, type: 'order' }).catch(err => console.error(`Rider in-app status notification error:`, err.message)),
            sendPushToUser({ userId: riderUser._id, payload: riderPayload }).catch(err => console.error(`Rider push status notification error:`, err.message))
          );
        }
      } else {
        const payload = genericPayload;

        for (const adminUser of adminUsers) {
          notificationPromises.push(
            createInAppNotification({ userId: adminUser._id, title: payload.title, message: payload.message, type: 'order' }).catch(err => console.error(`Admin generic status notification error:`, err.message)),
            sendPushToUser({ userId: adminUser._id, payload }).catch(err => console.error(`Admin generic push status notification error:`, err.message))
          );
        }

        if (restaurantOwner?._id) {
          notificationPromises.push(
            createInAppNotification({ userId: restaurantOwner._id, title: payload.title, message: payload.message, type: 'order' }).catch(err => console.error(`Restaurant generic status notification error:`, err.message)),
            sendPushToUser({ userId: restaurantOwner._id, payload }).catch(err => console.error(`Restaurant generic push status notification error:`, err.message))
          );
        }

        if (customerUser?._id) {
          notificationPromises.push(
            createInAppNotification({ userId: customerUser._id, title: payload.title, message: payload.message, type: 'order' }).catch(err => console.error(`Customer generic status notification error:`, err.message)),
            sendPushToUser({ userId: customerUser._id, payload }).catch(err => console.error(`Customer generic push status notification error:`, err.message))
          );
        }

        if (riderUser?._id) {
          notificationPromises.push(
            createInAppNotification({ userId: riderUser._id, title: payload.title, message: payload.message, type: 'order' }).catch(err => console.error(`Rider generic status notification error:`, err.message)),
            sendPushToUser({ userId: riderUser._id, payload }).catch(err => console.error(`Rider generic push status notification error:`, err.message))
          );
        }
      }

      if (notificationPromises.length > 0) {
        Promise.all(notificationPromises).catch(err => console.error('Batch status notification dispatch failed:', err));
      }
    } catch (notificationError) {
      console.error('⚠️ Order status notifications failed:', notificationError.message || notificationError);
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get all orders (admin)
// @route GET /api/orders
exports.getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate('userId', 'name email phone')
      .populate('items.foodId')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {

    next(error);
  }
};

// @desc Get unassigned available orders for riders to claim
// @route GET /api/orders/rider/unassigned
exports.getUnassignedOrders = async (req, res, next) => {
  try {
    const requester = await User.findById(req.user.id);
    if (!requester || requester.role !== 'rider') {
      return res.status(403).json({ success: false, message: 'Riders only' });
    }

    const unassignedOrders = await Order.find({
      $or: [
        { riderId: { $exists: false } },
        { riderId: null }
      ],
      status: { $in: ['pending', 'confirmed', 'preparing'] },
    })
      .populate('items.foodId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: unassignedOrders.length,
      data: unassignedOrders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Claim/Grab an order (Rider)
// @route PUT /api/orders/:id/claim
exports.claimOrder = async (req, res, next) => {
  try {
    const riderId = req.user.id;
    const riderUser = await User.findById(riderId);
    if (!riderUser || riderUser.role !== 'rider') {
      return res.status(403).json({ success: false, message: 'Riders only' });
    }

    const orderId = req.params.id;

    // Atomic find and update to prevent race conditions when 2 riders click claim simultaneously
    const order = await Order.findOneAndUpdate(
      {
        _id: orderId,
        $or: [{ riderId: { $exists: false } }, { riderId: null }],
        status: { $in: ['pending', 'confirmed', 'preparing'] },
      },
      {
        $set: {
          riderId: riderUser._id,
          status: 'assigned',
          deliveryStatus: 'assigned',
          currentRiderStatus: 'assigned',
          assignedAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { new: true }
    ).populate('items.foodId');

    if (!order) {
      return res.status(400).json({
        success: false,
        message: 'This order is no longer available or has already been grabbed by another rider.',
      });
    }

    // Update rider's status
    riderUser.riderStatus = 'on-delivery';
    riderUser.isOnline = true;
    riderUser.currentOrderId = order._id;
    riderUser.lastSeenAt = new Date();
    await riderUser.save();

    // Send notifications
    try {
      const adminUsers = await User.find({ role: 'admin' });
      const restaurant = order.restaurantId ? await Restaurant.findById(order.restaurantId) : null;
      const restaurantOwner = restaurant?.ownerId ? await User.findOne({ _id: restaurant.ownerId, role: 'restaurant' }) : null;
      const customerUser = order.userId ? await User.findById(order.userId) : null;

      const orderIdShort = order._id.toString().slice(-6).toUpperCase();
      const customerName = customerUser?.name || order.customerName || 'Customer';
      const restaurantName = restaurant?.name || 'restaurant';

      const claimNotificationPayload = {
        title: 'Order Claimed by Rider',
        message: `Rider ${riderUser.name || 'A rider'} accepted Order #${orderIdShort} for ${restaurantName}.`,
        url: '/admin/orders',
        tag: 'delivo-order-claimed',
      };

      for (const adminUser of adminUsers) {
        await createInAppNotification({ userId: adminUser._id, title: claimNotificationPayload.title, message: claimNotificationPayload.message, type: 'order' });
        await sendPushToUser({ userId: adminUser._id, payload: claimNotificationPayload });
      }

      if (restaurantOwner?._id) {
        await createInAppNotification({ userId: restaurantOwner._id, title: claimNotificationPayload.title, message: claimNotificationPayload.message, type: 'order' });
        await sendPushToUser({ userId: restaurantOwner._id, payload: claimNotificationPayload });
      }
    } catch (notifErr) {
      console.error('⚠️ Claim order notification error:', notifErr.message || notifErr);
    }

    res.status(200).json({
      success: true,
      message: 'Order grabbed successfully! Drive safely.',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

