const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const Restaurant = require('../models/Restaurant');
const Food = require('../models/Food');
const Order = require('../models/Order');
const RestaurantFood = require('../models/RestaurantFood');
const { calculateRestaurantEarnings, buildRestaurantFilter, buildRestaurantDashboardData } = require('../utils/restaurantPortal');

const ensureRestaurantOwner = async (req, res, next) => {
  try {
    if (req.user.role !== 'restaurant' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Restaurant owner or administrator role required.',
      });
    }

    let restaurant = await Restaurant.findOne({
      ownerId: req.user.id,
      status: { $ne: 'suspended' },
    });

    if (!restaurant) {
      restaurant = await Restaurant.findOne({
        $or: [
          { email: req.user.email },
          { phone: req.user.phone },
          { name: { $regex: /mum/i } },
        ],
        status: { $ne: 'suspended' },
      });

      if (restaurant) {
        restaurant.ownerId = req.user.id;
        await restaurant.save();
      } else {
        restaurant = await Restaurant.create({
          name: "Mum's",
          bannerImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
          ownerId: req.user.id,
          status: 'approved',
          email: req.user.email || '',
          phone: req.user.phone || '',
        });
      }
    }

    if (restaurant && restaurant.name === 'My Restaurant') {
      restaurant.name = "Mum's";
      await restaurant.save();
    }

    req.restaurant = restaurant;
    next();
  } catch (error) {
    next(error);
  }
};

const isItemForRestaurant = (item, restaurantId) => {
  if (!item) return false;
  const restIdStr = restaurantId.toString();
  if (item.restaurantId?.toString() === restIdStr) return true;
  if (item.foodId?.restaurant?.toString() === restIdStr) return true;
  return false;
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
      order.items.some((item) => isItemForRestaurant(item, restaurant._id))
    );

    const todayOrders = restaurantOrders.filter((order) => order.createdAt >= today && order.createdAt < tomorrow);
    const completedOrders = restaurantOrders.filter((order) => order.status === 'delivered');
    const pendingOrders = restaurantOrders.filter((order) => ['pending', 'confirmed', 'preparing', 'on-delivery'].includes(order.status));

    const revenue = completedOrders.reduce((sum, order) => {
      const items = order.items.filter((item) => isItemForRestaurant(item, restaurant._id));
      const subtotal = items.reduce((itemSum, item) => itemSum + (Number(item.price) || 0) * Number(item.quantity || 0), 0);
      return sum + calculateRestaurantEarnings(subtotal, 100).restaurantEarnings;
    }, 0);

    const todayRevenue = todayOrders.reduce((sum, order) => {
      const items = order.items.filter((item) => isItemForRestaurant(item, restaurant._id));
      const subtotal = items.reduce((itemSum, item) => itemSum + (Number(item.price) || 0) * Number(item.quantity || 0), 0);
      return sum + calculateRestaurantEarnings(subtotal, 100).restaurantEarnings;
    }, 0);

    const totalFoodsSold = restaurantOrders.reduce((sum, order) => sum + order.items.reduce((itemSum, item) => {
      return isItemForRestaurant(item, restaurant._id) ? itemSum + Number(item.quantity || 0) : itemSum;
    }, 0), 0);

    const restaurantProfile = restaurant.toObject ? restaurant.toObject() : { ...restaurant };

    res.status(200).json({
      success: true,
      data: {
        restaurant: {
          ...restaurantProfile,
          ...buildRestaurantDashboardData(restaurant),
        },
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
      .populate('riderId', 'name phone email')
      .populate('items.foodId')
      .sort({ createdAt: -1 })
      .lean();

    const restaurantOrders = orders
      .filter((order) => order.items.some((item) => isItemForRestaurant(item, restaurant._id)))
      .map((order) => {
        const myItems = order.items.filter((item) => isItemForRestaurant(item, restaurant._id));
        const mySubtotal = myItems.reduce((sum, item) => sum + (Number(item.price) || 0) * Number(item.quantity || 0), 0);
        return {
          ...order,
          items: myItems,
          restaurantSubtotal: mySubtotal,
          totalPrice: mySubtotal,
        };
      });

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

    const completed = orders
      .filter((order) => order.items.some((item) => isItemForRestaurant(item, restaurant._id)))
      .map((order) => {
        const myItems = order.items.filter((item) => isItemForRestaurant(item, restaurant._id));
        const mySubtotal = myItems.reduce((sum, item) => sum + (Number(item.price) || 0) * Number(item.quantity || 0), 0);
        return {
          ...order,
          items: myItems,
          restaurantSubtotal: mySubtotal,
          totalPrice: mySubtotal,
        };
      });

    res.status(200).json({ success: true, data: completed });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/foods', authenticate, ensureRestaurantOwner, async (req, res) => {
  try {
    const restaurant = req.restaurant;

    // Find all links in RestaurantFood collection
    const rfLinks = await RestaurantFood.find({ restaurantId: restaurant._id }).lean();
    const rfFoodIds = rfLinks.map((rf) => rf.foodId);
    const restDocFoodIds = Array.isArray(restaurant.foods) ? restaurant.foods : [];

    // Find all matching foods including unassigned foods
    const foods = await Food.find({
      $or: [
        { _id: { $in: [...rfFoodIds, ...restDocFoodIds] } },
        { restaurant: restaurant._id },
        { restaurants: restaurant._id },
        { store: restaurant._id },
        { restaurant: { $exists: false } },
        { restaurant: null },
      ],
    }).sort({ createdAt: -1 }).lean();

    // Auto-link unassigned foods to this restaurant
    await Promise.all(foods.map(async (f) => {
      if (!f.restaurant) {
        await Food.findByIdAndUpdate(f._id, { restaurant: restaurant._id, $addToSet: { restaurants: restaurant._id } });
      }
      const exists = rfLinks.some(rf => rf.foodId?.toString() === f._id.toString());
      if (!exists) {
        await RestaurantFood.findOneAndUpdate(
          { restaurantId: restaurant._id, foodId: f._id },
          { restaurantId: restaurant._id, foodId: f._id, price: f.price || 0, availability: f.isAvailable !== false },
          { upsert: true }
        );
      }
    }));

    // Map custom prices & availability from RestaurantFood
    const updatedRfLinks = await RestaurantFood.find({ restaurantId: restaurant._id }).lean();
    const rfMap = {};
    updatedRfLinks.forEach((rf) => {
      if (rf.foodId) rfMap[rf.foodId.toString()] = rf;
    });

    const finalFoods = foods.map((f) => {
      const rf = rfMap[f._id.toString()];
      return {
        ...f,
        price: rf && rf.price != null ? rf.price : f.price,
        discountPrice: rf && rf.discountPrice != null ? rf.discountPrice : f.discountPrice,
        isAvailable: rf && rf.availability != null ? rf.availability : (f.isAvailable !== false),
        restaurantFoodId: rf ? rf._id : null,
      };
    });

    res.status(200).json({ success: true, data: finalFoods });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/foods', authenticate, ensureRestaurantOwner, async (req, res) => {
  try {
    const restaurant = req.restaurant;
    const foodPayload = {
      ...req.body,
      restaurant: restaurant._id,
      restaurants: [restaurant._id],
      isAvailable: req.body.isAvailable !== undefined ? req.body.isAvailable : true,
    };

    const food = await Food.create(foodPayload);

    // Also create RestaurantFood junction record
    await RestaurantFood.findOneAndUpdate(
      { restaurantId: restaurant._id, foodId: food._id },
      {
        restaurantId: restaurant._id,
        foodId: food._id,
        price: food.price,
        discountPrice: food.discountPrice || null,
        availability: food.isAvailable !== false,
      },
      { upsert: true, new: true }
    );

    // Also append to restaurant.foods array
    if (!restaurant.foods.includes(food._id)) {
      restaurant.foods.push(food._id);
      await restaurant.save();
    }

    res.status(201).json({ success: true, data: food });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/foods/:id', authenticate, ensureRestaurantOwner, async (req, res) => {
  try {
    const restaurant = req.restaurant;
    const foodId = req.params.id;

    const food = await Food.findById(foodId);
    if (!food) {
      return res.status(404).json({ success: false, message: 'Food item not found' });
    }

    const isOwner = food.restaurant?.toString() === restaurant._id.toString() ||
      (Array.isArray(food.restaurants) && food.restaurants.some((r) => r.toString() === restaurant._id.toString()));

    if (isOwner) {
      Object.assign(food, req.body);
      await food.save();
    }

    // Update/upsert RestaurantFood price & availability override
    const rfUpdate = {};
    if (req.body.price != null) rfUpdate.price = Number(req.body.price);
    if (req.body.discountPrice != null) rfUpdate.discountPrice = Number(req.body.discountPrice);
    if (req.body.isAvailable !== undefined) rfUpdate.availability = Boolean(req.body.isAvailable);

    if (Object.keys(rfUpdate).length > 0) {
      await RestaurantFood.findOneAndUpdate(
        { restaurantId: restaurant._id, foodId: food._id },
        {
          restaurantId: restaurant._id,
          foodId: food._id,
          price: req.body.price != null ? Number(req.body.price) : food.price,
          ...rfUpdate,
        },
        { upsert: true, new: true }
      );
    }

    res.status(200).json({ success: true, data: food });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/foods/:id', authenticate, ensureRestaurantOwner, async (req, res) => {
  try {
    const restaurant = req.restaurant;
    const foodId = req.params.id;

    await RestaurantFood.deleteMany({ restaurantId: restaurant._id, foodId });
    await Restaurant.findByIdAndUpdate(restaurant._id, { $pull: { foods: foodId } });

    const food = await Food.findById(foodId);
    if (food && food.restaurant?.toString() === restaurant._id.toString()) {
      await food.deleteOne();
    }

    res.status(200).json({ success: true, message: 'Food item removed from restaurant' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/revenue', authenticate, ensureRestaurantOwner, async (req, res) => {
  try {
    const restaurant = req.restaurant;
    const orders = await Order.find({ status: 'delivered' }).populate('items.foodId').lean();
    const restaurantOrders = orders.filter((order) =>
      order.items.some((item) => isItemForRestaurant(item, restaurant._id))
    );

    const totalRevenue = restaurantOrders.reduce((sum, order) => {
      const items = order.items.filter((item) => isItemForRestaurant(item, restaurant._id));
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
