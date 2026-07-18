const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const Restaurant = require('../models/Restaurant');
const Food = require('../models/Food');
const Order = require('../models/Order');
const { calculateRestaurantEarnings, buildRestaurantFilter, buildRestaurantDashboardData } = require('../utils/restaurantPortal');

const ensureRestaurantOwner = async (req, res, next) => {
  try {
    let restaurant = await Restaurant.findOne({
      ownerId: req.user.id,
      status: { $ne: 'suspended' },
    });

    if (!restaurant) {
      restaurant = await Restaurant.create({
        name: 'My Restaurant',
        bannerImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
        ownerId: req.user.id,
        status: 'pending',
      });
    }

    req.restaurant = restaurant;
    next();
  } catch (error) {
    next(error);
  }
};

router.get('/dashboard', authenticate, ensureRestaurantOwner, async (req, res) => {
  try {
    const restaurant = req.restaurant;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const orders = await Order.find({
      status: { $in: ['pending', 'confirmed', 'preparing', 'on-delivery', 'delivered', 'cancelled'] },
      items: { $exists: true, $ne: [] },
    })
      .populate('items.foodId')
      .lean();

    const restaurantOrders = orders.filter((order) =>
      order.items.some((item) => item.foodId?.restaurant?.toString() === restaurant._id.toString())
    );

    const todayOrders = restaurantOrders.filter((order) => order.createdAt >= today && order.createdAt < tomorrow);
    const completedOrders = restaurantOrders.filter((order) => order.status === 'delivered');
    const pendingOrders = restaurantOrders.filter((order) => ['pending', 'confirmed', 'preparing', 'on-delivery'].includes(order.status));

    const revenue = completedOrders.reduce((sum, order) => {
      const items = order.items.filter((item) => item.foodId?.restaurant?.toString() === restaurant._id.toString());
      const subtotal = items.reduce((itemSum, item) => itemSum + (Number(item.price) || 0) * Number(item.quantity || 0), 0);
      return sum + calculateRestaurantEarnings(subtotal, 100).restaurantEarnings;
    }, 0);

    const todayRevenue = todayOrders.reduce((sum, order) => {
      const items = order.items.filter((item) => item.foodId?.restaurant?.toString() === restaurant._id.toString());
      const subtotal = items.reduce((itemSum, item) => itemSum + (Number(item.price) || 0) * Number(item.quantity || 0), 0);
      return sum + calculateRestaurantEarnings(subtotal, 100).restaurantEarnings;
    }, 0);

    const totalFoodsSold = restaurantOrders.reduce((sum, order) => sum + order.items.reduce((itemSum, item) => {
      return item.foodId?.restaurant?.toString() === restaurant._id.toString() ? itemSum + Number(item.quantity || 0) : itemSum;
    }, 0), 0);

    res.status(200).json({
      success: true,
      data: {
        restaurant: buildRestaurantDashboardData(restaurant),
        stats: {
          todayOrders: todayOrders.length,
          pendingOrders: pendingOrders.length,
          completedOrders: completedOrders.length,
          todayRevenue,
          totalRevenue: revenue,
          availableBalance: restaurant.availableBalance || 0,
          withdrawnAmount: restaurant.withdrawnBalance || 0,
          totalFoodsSold,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/orders', authenticate, ensureRestaurantOwner, async (req, res) => {
  try {
    const { status, sort = 'newest' } = req.query;
    const restaurant = req.restaurant;

    const orders = await Order.find({
      items: { $exists: true, $ne: [] },
    })
      .populate('userId', 'name email')
      .populate('items.foodId')
      .sort({ createdAt: -1 })
      .lean();

    const restaurantOrders = orders.filter((order) =>
      order.items.some((item) => item.foodId?.restaurant?.toString() === restaurant._id.toString())
    );

    const filteredOrders = restaurantOrders.filter((order) => {
      if (status && order.status !== status) return false;
      return true;
    });

    const sortedOrders = filteredOrders.sort((a, b) => {
      if (sort === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.status(200).json({ success: true, data: sortedOrders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/completed', authenticate, ensureRestaurantOwner, async (req, res) => {
  try {
    const restaurant = req.restaurant;
    const orders = await Order.find({ status: 'delivered' })
      .populate('userId', 'name email')
      .populate('items.foodId')
      .sort({ updatedAt: -1 })
      .lean();

    const completed = orders.filter((order) =>
      order.items.some((item) => item.foodId?.restaurant?.toString() === restaurant._id.toString())
    );

    res.status(200).json({ success: true, data: completed });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/foods', authenticate, ensureRestaurantOwner, async (req, res) => {
  try {
    const restaurant = req.restaurant;
    const foods = await Food.find({ restaurant: restaurant._id }).sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, data: foods });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/foods', authenticate, ensureRestaurantOwner, async (req, res) => {
  try {
    const restaurant = req.restaurant;
    const foodPayload = { ...req.body, restaurant: restaurant._id }; 
    const food = await Food.create(foodPayload);
    restaurant.foods.push(food._id);
    await restaurant.save();
    res.status(201).json({ success: true, data: food });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/foods/:id', authenticate, ensureRestaurantOwner, async (req, res) => {
  try {
    const food = await Food.findOne({ _id: req.params.id, restaurant: req.restaurant._id });
    if (!food) return res.status(404).json({ success: false, message: 'Food not found' });
    Object.assign(food, req.body);
    await food.save();
    res.status(200).json({ success: true, data: food });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/foods/:id', authenticate, ensureRestaurantOwner, async (req, res) => {
  try {
    const food = await Food.findOne({ _id: req.params.id, restaurant: req.restaurant._id });
    if (!food) return res.status(404).json({ success: false, message: 'Food not found' });
    await food.deleteOne();
    await Restaurant.findByIdAndUpdate(req.restaurant._id, { $pull: { foods: food._id } });
    res.status(200).json({ success: true, message: 'Food deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/revenue', authenticate, ensureRestaurantOwner, async (req, res) => {
  try {
    const restaurant = req.restaurant;
    const orders = await Order.find({ status: 'delivered' }).populate('items.foodId').lean();
    const restaurantOrders = orders.filter((order) =>
      order.items.some((item) => item.foodId?.restaurant?.toString() === restaurant._id.toString())
    );

    const totalRevenue = restaurantOrders.reduce((sum, order) => {
      const items = order.items.filter((item) => item.foodId?.restaurant?.toString() === restaurant._id.toString());
      const subtotal = items.reduce((itemSum, item) => itemSum + (Number(item.price) || 0) * Number(item.quantity || 0), 0);
      return sum + calculateRestaurantEarnings(subtotal, 100).restaurantEarnings;
    }, 0);

    res.status(200).json({ success: true, data: { totalRevenue, availableBalance: restaurant.availableBalance || 0, pendingBalance: restaurant.pendingBalance || 0, withdrawnBalance: restaurant.withdrawnBalance || 0 } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/withdraw', authenticate, ensureRestaurantOwner, async (req, res) => {
  try {
    const restaurant = req.restaurant;
    const amount = Number(req.body.amount || 0);
    if (!amount || amount > (restaurant.availableBalance || 0)) {
      return res.status(400).json({ success: false, message: 'Invalid withdrawal amount' });
    }

    restaurant.availableBalance = Number(restaurant.availableBalance || 0) - amount;
    restaurant.pendingBalance = Number(restaurant.pendingBalance || 0) + amount;
    await restaurant.save();
    res.status(200).json({ success: true, message: 'Withdrawal request submitted for approval' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/transactions', authenticate, ensureRestaurantOwner, async (req, res) => {
  try {
    const restaurant = req.restaurant;
    res.status(200).json({ success: true, data: [
      {
        date: new Date().toISOString(),
        description: 'Welcome credit',
        orderNumber: '-',
        credit: restaurant.availableBalance || 0,
        debit: 0,
        balance: restaurant.availableBalance || 0,
        status: 'completed',
      },
    ] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/profile', authenticate, ensureRestaurantOwner, async (req, res) => {
  try {
    const restaurant = req.restaurant;
    Object.assign(restaurant, req.body);
    await restaurant.save();
    res.status(200).json({ success: true, data: restaurant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
