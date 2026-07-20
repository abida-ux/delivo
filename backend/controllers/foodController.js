const Food = require('../models/Food');
const Restaurant = require('../models/Restaurant');

const normalizeRestaurantIds = (payload) => {
  const values = payload?.restaurants || payload?.restaurant;
  const normalized = Array.isArray(values) ? values : values ? [values] : [];

  return normalized
    .map((value) => (value && value.toString ? value.toString() : value))
    .filter(Boolean);
};

const syncFoodRestaurantLinks = async (food, restaurantIds) => {
  const ids = [...new Set(restaurantIds.filter(Boolean))];

  if (!ids.length) return;

  const restaurants = await Restaurant.find({ _id: { $in: ids } });
  if (!restaurants.length) return;

  await Promise.all(restaurants.map(async (restaurant) => {
    if (!restaurant.foods.includes(food._id)) {
      restaurant.foods.push(food._id);
      await restaurant.save();
    }
  }));
};

// ==================== GET ALL FOODS ====================
exports.getAllFoods = async (req, res) => {
  try {
    let query = Food.find();

    // Filter by category if provided
    if (req.query.category) {
      query = query.where('category').equals(req.query.category);
    }

    // Filter by restaurant if provided
    if (req.query.restaurantId) {
      query = query.or([{ restaurant: req.query.restaurantId }, { restaurants: req.query.restaurantId }]);
    }

    const foods = await query
      .select('name description price image category rating restaurant restaurants isAvailable')
      .populate({
        path: 'restaurant',
        select: 'name',
      })
      .populate({
        path: 'restaurants',
        select: 'name',
      })
      .lean()
      .maxTimeMS(5000); // prevent hanging on cPanel

    return res.status(200).json({
      success: true,
      count: foods.length,
      data: foods,
    });

  } catch (error) {
    console.error('❌ getAllFoods error:', error.message);

    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch foods',
    });
  }
};


// ==================== GET SINGLE FOOD ====================
exports.getFoodById = async (req, res) => {
  try {
    const food = await Food.findById(req.params.id)
      .populate({
        path: 'restaurant',
        select: 'name bannerImage rating deliveryTime cuisine isOpen',
      })
      .populate({
        path: 'restaurants',
        select: 'name bannerImage rating deliveryTime cuisine isOpen',
      })
      .lean();

    if (!food) {
      return res.status(404).json({
        success: false,
        message: 'Food not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: food,
    });

  } catch (error) {
    console.error('❌ getFoodById error:', error.message);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ==================== CREATE FOOD ====================
exports.createFood = async (req, res) => {
  try {
    console.log('📝 Creating food:', req.body);

    const restaurantIds = normalizeRestaurantIds(req.body);

    if (!restaurantIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one restaurant',
      });
    }

    const restaurants = await Restaurant.find({ _id: { $in: restaurantIds } });
    if (restaurants.length !== restaurantIds.length) {
      return res.status(404).json({
        success: false,
        message: 'One or more selected restaurants were not found',
      });
    }

    const primaryRestaurantId = restaurantIds[0];
    const food = await Food.create({
      ...req.body,
      restaurant: primaryRestaurantId,
      restaurants: restaurantIds,
      store: req.body.store || null,
    });

    await syncFoodRestaurantLinks(food, restaurantIds);

    return res.status(201).json({
      success: true,
      message: 'Food created successfully',
      data: food,
    });

  } catch (error) {
    console.error('❌ createFood error:', error.message);

    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create food',
    });
  }
};


// ==================== UPDATE FOOD ====================
exports.updateFood = async (req, res) => {
  try {
    const restaurantIds = normalizeRestaurantIds(req.body);
    const updateData = { ...req.body };

    if (restaurantIds.length) {
      updateData.restaurant = restaurantIds[0];
      updateData.restaurants = restaurantIds;
    }

    const food = await Food.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!food) {
      return res.status(404).json({
        success: false,
        message: 'Food not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: food,
    });

  } catch (error) {
    console.error('❌ updateFood error:', error.message);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ==================== DELETE FOOD ====================
exports.deleteFood = async (req, res) => {
  try {
    const food = await Food.findByIdAndDelete(req.params.id);

    if (!food) {
      return res.status(404).json({
        success: false,
        message: 'Food not found',
      });
    }

    const restaurantIds = [...new Set([...(food.restaurants || []), food.restaurant].filter(Boolean))];
    if (restaurantIds.length) {
      await Restaurant.updateMany({ _id: { $in: restaurantIds } }, {
        $pull: { foods: food._id },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Food deleted successfully',
    });

  } catch (error) {
    console.error('❌ deleteFood error:', error.message);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};