const Restaurant = require('../models/Restaurant');
const User = require('../models/User');

// @desc Get all restaurants
// @route GET /api/restaurants
exports.getAllRestaurants = async (req, res, next) => {
  try {
    const restaurants = await Restaurant.find().populate('foods');

    res.status(200).json({
      success: true,
      count: restaurants.length,
      data: restaurants,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get single restaurant with foods
// @route GET /api/restaurants/:id
exports.getRestaurantById = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id).populate('foods');

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

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
      ownerName,
      ownerEmail,
      ownerPassword,
      ownerConfirmPassword,
      ...restaurantData
    } = req.body;

    const normalizedOwnerEmail = ownerEmail ? ownerEmail.toLowerCase() : '';

    let ownerUser = null;
    if (ownerEmail || ownerPassword || ownerConfirmPassword) {
      if (!normalizedOwnerEmail || !ownerPassword || !ownerConfirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Restaurant owner email, password, and confirmation are required.',
        });
      }

      if (ownerPassword !== ownerConfirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Password and confirmation password must match.',
        });
      }

      const existingOwner = await User.findOne({ email: normalizedOwnerEmail });
      if (existingOwner) {
        return res.status(400).json({
          success: false,
          message: 'A restaurant owner already exists with that email.',
        });
      }

      ownerUser = await User.create({
        name: ownerName || restaurantData.name || 'Restaurant Owner',
        email: normalizedOwnerEmail,
        password: ownerPassword,
        role: 'restaurant',
        phone: restaurantData.phone || '',
        isVerified: true,
      });
    }

    const restaurantPayload = {
      ...restaurantData,
      name: restaurantData.name?.trim(),
      email: restaurantData.email || normalizedOwnerEmail || '',
      ownerId: ownerUser?._id || null,
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
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

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
