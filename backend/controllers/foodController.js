const Food = require('../models/Food');
const Restaurant = require('../models/Restaurant');


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
      query = query.where('restaurant').equals(req.query.restaurantId);
    }

    const foods = await query
      .populate({
        path: 'restaurant',
        select: 'name bannerImage rating deliveryTime cuisine isOpen',
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

    const restaurant = await Restaurant.findById(req.body.restaurant);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    const food = await Food.create(req.body);

    restaurant.foods.push(food._id);
    await restaurant.save();

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
    const food = await Food.findByIdAndUpdate(
      req.params.id,
      req.body,
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

    await Restaurant.findByIdAndUpdate(food.restaurant, {
      $pull: { foods: food._id },
    });

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