const Order = require('../models/Order');
const Food = require('../models/Food');
const AppSettings = require('../models/AppSettings');
const { sendMpesaStkPush } = require('../utils/mpesaService');

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

    // Calculate total price and verify items exist
    let subtotal = 0;
    const populatedItems = [];

    for (const item of items) {
      const food = await Food.findById(item.foodId);
      if (!food) {
        console.log('❌ Food not found:', item.foodId);
        return res.status(404).json({
          success: false,
          message: `Food item with ID ${item.foodId} not found`,
        });
      }

      const itemTotal = food.price * item.quantity;
      subtotal += itemTotal;

      populatedItems.push({
        foodId: food._id,
        quantity: item.quantity,
        price: food.price,
      });
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
    const { status, paymentStatus } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    order.status = status || order.status;
    order.paymentStatus = paymentStatus || order.paymentStatus;
    order.updatedAt = Date.now();

    await order.save();
    await order.populate('items.foodId');

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
