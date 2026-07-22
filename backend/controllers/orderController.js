const mongoose = require('mongoose');
const Order = require('../models/Order');
const Food = require('../models/Food');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');

const AppSettings = require('../models/AppSettings');
const { sendMpesaStkPush } = require('../utils/mpesaService');
const { buildNotificationPayload, createInAppNotification, sendPushToUser } = require('../utils/pushNotifications');

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
      specialInstructions,
      whatsappNumber,
      mpesaNumber,
      deliveryFee = 20,
      restaurantId,
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

    let subtotal = 0;
    const populatedItems = [];
    let inferredRestaurantId = null;

    for (const item of items) {
      const food = await Food.findById(item.foodId);
      if (!food) {
        console.log('❌ Food not found:', item.foodId);
        return res.status(404).json({
          success: false,
          message: `Food item with ID ${item.foodId} not found`,
        });
      }

      if (!inferredRestaurantId && food.restaurant) {
        inferredRestaurantId = typeof food.restaurant === 'object' ? food.restaurant._id : food.restaurant;
      }

      const itemTotal = food.price * item.quantity;
      subtotal += itemTotal;

      populatedItems.push({
        foodId: food._id,
        quantity: item.quantity,
        price: food.price,
      });
    }

    const finalRestaurantId = restaurantId || inferredRestaurantId;
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
    const freeDeliveryEnabled = appSettings.freeDeliveryEnabled !== false;
    const freeDeliveryMinimum = Number(appSettings.freeDeliveryMinimum) || 0;
    const isFreeDelivery = freeDeliveryEnabled && subtotal >= freeDeliveryMinimum;

    let parsedDeliveryFee = Number(deliveryFee);
    if (Number.isNaN(parsedDeliveryFee) || parsedDeliveryFee < 0) {
      parsedDeliveryFee = 0;
    }
    const deliveryFeeFromSettings = appSettings.deliveryFeeEnabled !== false ? Number(appSettings.deliveryFeeAmount) || 0 : 0;
    const finalDeliveryFee = isFreeDelivery ? 0 : (deliveryFee !== undefined ? parsedDeliveryFee : deliveryFeeFromSettings);
    const totalPrice = subtotal + finalDeliveryFee;

    // ✅ Create order with userId (if authenticated) or guest info (if guest)
    const order = await Order.create({
      userId: userId || undefined,
      guestEmail: guestEmail || undefined,
      guestPhone: guestPhone || undefined,
      restaurantId: finalRestaurantId || undefined,
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
    } catch (pushError) {
      const errorDetail = pushError.message || 'Unknown M-Pesa error';
      const isDuplicateSession = /Duplicated MSISDN|USSD Session|existing USSD/i.test(errorDetail);

      order.paymentStatus = 'failed';
      order.status = 'cancelled';
      order.failureReason = errorDetail;
      await order.save();

      console.error('❌ M-Pesa STK push failed:', errorDetail);

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

    const adminUsers = await User.find({ role: 'admin' });
    const customerUser = userId ? await User.findById(userId) : null;

    try {

      const recipients = [];
      for (const adminUser of adminUsers) {
        recipients.push({ userId: adminUser._id, role: 'admin' });
      }
      if (restaurantOwner?._id) recipients.push({ userId: restaurantOwner._id, role: 'restaurant' });
      if (customerUser?._id) recipients.push({ userId: customerUser._id, role: 'customer' });

      const orderPayload = buildNotificationPayload({
        eventType: 'order_created',
        order,
        recipientRole: 'admin',
        extra: {
          orderId: order._id.toString(),
          customerName: customerUser?.name || customerName || 'Customer',
          restaurantName: restaurant?.name || 'restaurant',
          deliveryAddress,
        },
      });
      const customerPayload = buildNotificationPayload({
        eventType: 'order_placed_customer',
        order,
        recipientRole: 'customer',
        extra: {
          orderId: order._id.toString(),
          customerName: customerUser?.name || customerName || 'Customer',
          restaurantName: restaurant?.name || 'restaurant',
          deliveryAddress,
        },
      });

      for (const recipient of recipients) {
        const payload = recipient.role === 'customer' ? customerPayload : orderPayload;
        await createInAppNotification({
          userId: recipient.userId,
          title: payload.title,
          message: payload.message,
          type: 'order',
        });
        await sendPushToUser({ userId: recipient.userId, payload });
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

    order.status = status || order.status;
    order.paymentStatus = paymentStatus || order.paymentStatus;
    order.riderId = riderId || order.riderId;
    order.updatedAt = Date.now();

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
          await createInAppNotification({ userId: adminUser._id, title: riderPayload.title, message: riderPayload.message, type: 'order' });
          await sendPushToUser({ userId: adminUser._id, payload: riderPayload });
        }

        if (restaurantOwner?._id) {
          await createInAppNotification({ userId: restaurantOwner._id, title: restaurantPayload.title, message: restaurantPayload.message, type: 'order' });
          await sendPushToUser({ userId: restaurantOwner._id, payload: restaurantPayload });
        }

        if (riderUser?._id) {
          await createInAppNotification({ userId: riderUser._id, title: riderPayload.title, message: riderPayload.message, type: 'order' });
          await sendPushToUser({ userId: riderUser._id, payload: riderPayload });
        }
      } else {
        const payload = genericPayload;

        for (const adminUser of adminUsers) {
          await createInAppNotification({ userId: adminUser._id, title: payload.title, message: payload.message, type: 'order' });
          await sendPushToUser({ userId: adminUser._id, payload });
        }

        if (restaurantOwner?._id) {
          await createInAppNotification({ userId: restaurantOwner._id, title: payload.title, message: payload.message, type: 'order' });
          await sendPushToUser({ userId: restaurantOwner._id, payload });
        }

        if (customerUser?._id) {
          await createInAppNotification({ userId: customerUser._id, title: payload.title, message: payload.message, type: 'order' });
          await sendPushToUser({ userId: customerUser._id, payload });
        }

        if (riderUser?._id) {
          await createInAppNotification({ userId: riderUser._id, title: payload.title, message: payload.message, type: 'order' });
          await sendPushToUser({ userId: riderUser._id, payload });
        }
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
