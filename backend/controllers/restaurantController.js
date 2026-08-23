const Restaurant = require('../models/Restaurant');
const User = require('../models/User');

// @desc Get all restaurants
// @route GET /api/restaurants
exports.getAllRestaurants = async (req, res, next) => {
  try {
    const restaurants = await Restaurant.find().populate('ownerId', 'name email phone').lean();
    const RestaurantFood = require('../models/RestaurantFood');

    const data = await Promise.all(restaurants.map(async (rest) => {
      const links = await RestaurantFood.find({ restaurantId: rest._id, availability: true })
        .populate('foodId')
        .lean();
      
      const foods = links.map(l => {
        if (!l.foodId) return null;
        const basePrice = l.foodId.price || 0;
        return {
          ...l.foodId,
          basePrice,
          price: l.price != null && l.price > 0 ? l.price : basePrice,
        };
      }).filter(Boolean);

      return {
        ...rest,
        foods,
      };
    }));

    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get single restaurant with foods
// @route GET /api/restaurants/:id
exports.getRestaurantById = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id).lean();

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    const RestaurantFood = require('../models/RestaurantFood');
    const links = await RestaurantFood.find({ restaurantId: restaurant._id, availability: true })
      .populate('foodId')
      .lean();
    
    const foods = links.map(l => {
      if (!l.foodId) return null;
      const basePrice = l.foodId.price || 0;
      return {
        ...l.foodId,
        basePrice,
        price: l.price != null && l.price > 0 ? l.price : basePrice,
        discountPrice: l.discountPrice,
        availability: l.availability
      };
    }).filter(Boolean);
    
    restaurant.foods = foods;

    res.status(200).json({
      success: true,
      data: restaurant,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Create a new restaurant
// @route POST /api/restaurants
exports.createRestaurant = async (req, res, next) => {
  try {
    console.log('📝 Creating restaurant with data:', req.body);

    const {
      ownerId,
      ownerName,
      ownerEmail,
      ownerPassword,
      ownerConfirmPassword,
      ...restaurantData
    } = req.body;

    let targetOwnerId = ownerId && ownerId !== 'none' && ownerId !== '' ? ownerId : null;
    let ownerUser = null;

    if (targetOwnerId) {
      ownerUser = await User.findById(targetOwnerId);
      if (ownerUser) {
        // Unlink user from any previous restaurant
        await Restaurant.updateMany({ ownerId: ownerUser._id }, { ownerId: null });
        // Set user role to 'restaurant'
        if (ownerUser.role !== 'restaurant') {
          ownerUser.role = 'restaurant';
          await ownerUser.save();
        }
      }
    }

    const restaurantPayload = {
      ...restaurantData,
      name: restaurantData.name?.trim(),
      email: restaurantData.email || ownerUser?.email || '',
      phone: restaurantData.phone || ownerUser?.phone || '',
      ownerId: ownerUser ? ownerUser._id : null,
    };

    const restaurant = await Restaurant.create(restaurantPayload);

    res.status(201).json({
      success: true,
      message: 'Restaurant created successfully',
      data: restaurant,
    });
  } catch (error) {
    console.error('❌ Restaurant creation error:', error.message);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create restaurant',
    });
  }
};

// @desc Update restaurant
// @route PUT /api/restaurants/:id
exports.updateRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    // Access Control: Only admin or the restaurant's owner can update the restaurant
    const reqUser = await User.findById(req.user.id);
    if (!reqUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (reqUser.role !== 'admin' && restaurant.ownerId?.toString() !== reqUser._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to update this restaurant.',
      });
    }

    // Prevent restaurant owners from escalating their own balance or changing ownerId/status
    if (reqUser.role !== 'admin') {
      delete req.body.ownerId;
      delete req.body.status;
      delete req.body.availableBalance;
      delete req.body.withdrawnBalance;
    } else if (req.body.ownerId !== undefined) {
      const newOwnerId = req.body.ownerId && req.body.ownerId !== 'none' && req.body.ownerId !== '' ? req.body.ownerId : null;
      if (newOwnerId) {
        const ownerUser = await User.findById(newOwnerId);
        if (ownerUser) {
          await Restaurant.updateMany({ ownerId: ownerUser._id }, { ownerId: null });
          if (ownerUser.role !== 'restaurant') {
            ownerUser.role = 'restaurant';
            await ownerUser.save();
          }
          req.body.ownerId = ownerUser._id;
          if (!req.body.email && ownerUser.email) req.body.email = ownerUser.email;
          if (!req.body.phone && ownerUser.phone) req.body.phone = ownerUser.phone;
        }
      } else {
        req.body.ownerId = null;
      }
    }

    Object.assign(restaurant, req.body);
    await restaurant.save();

    res.status(200).json({
      success: true,
      data: restaurant,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Delete restaurant
// @route DELETE /api/restaurants/:id
exports.deleteRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findByIdAndDelete(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Restaurant deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

exports.getMatchingRestaurants = async (req, res, next) => {
  try {
    const { foodIds } = req.query;
    if (!foodIds) {
      return res.status(400).json({ success: false, message: 'foodIds query parameter is required' });
    }

    const ids = foodIds.split(',').filter(Boolean);
    if (ids.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const RestaurantFood = require('../models/RestaurantFood');
    
    // For each food ID, find all restaurant IDs that sell it
    const sets = await Promise.all(ids.map(async (foodId) => {
      const links = await RestaurantFood.find({ foodId, availability: true }).select('restaurantId');
      return links.map(l => l.restaurantId.toString());
    }));

    // Find the intersection of restaurant IDs across all food sets
    let intersected = sets[0] || [];
    for (let i = 1; i < sets.length; i++) {
      intersected = intersected.filter(id => sets[i].includes(id));
    }

    // Fetch details of those restaurants
    const restaurants = await Restaurant.find({ _id: { $in: intersected }, isOpen: true });

    return res.status(200).json({
      success: true,
      count: restaurants.length,
      data: restaurants,
    });
  } catch (error) {
    next(error);
  }
};
