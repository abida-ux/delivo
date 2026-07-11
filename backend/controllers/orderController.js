const Order = require('../models/Order');
const Food = require('../models/Food');

// @desc Create order
// @route POST /api/orders
exports.createOrder = async (req, res, next) => {
  try {
    const { userId, guestEmail, guestPhone, items, deliveryAddress, paymentMethod, specialInstructions } = req.body;

    console.log('🛒 Creating order with data:', {
      userId,
      isGuest: !userId,
      guestEmail,
      itemsCount: items?.length,
      deliveryAddress,
      paymentMethod,
    });

    // ✅ Allow either userId (authenticated) or guest info (guest checkout)
    if (!userId && !guestEmail) {
      return res.status(400).json({
        success: false,
        message: 'Either User ID or guest email is required',
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

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Payment method is required',
      });
    }

    // Calculate total price and verify items exist
    let totalPrice = 0;
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
      totalPrice += itemTotal;

      populatedItems.push({
        foodId: food._id,
        quantity: item.quantity,
        price: food.price,
      });
    }

    // ✅ Create order with userId (if authenticated) or guest info (if guest)
    const order = await Order.create({
      userId: userId || undefined,
      guestEmail: guestEmail || undefined,
      guestPhone: guestPhone || undefined,
      items: populatedItems,
      totalPrice,
      deliveryAddress,
      paymentMethod,
      specialInstructions: specialInstructions || '',
    });

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

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        status: status || order?.status,
        paymentStatus: paymentStatus || order?.paymentStatus,
        updatedAt: Date.now(),
      },
      { new: true, runValidators: true }
    ).populate('items.foodId');

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
