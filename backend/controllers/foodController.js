const Food = require('../models/Food');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const RestaurantFood = require('../models/RestaurantFood');
const {
  normalizeCategorySelection,
  normalizeRestaurantSelection,
  getPrimaryCategoryName,
} = require('../utils/foodAssignment');

// ==================== GET ALL FOODS (Catalogue) ====================
exports.getAllFoods = async (req, res) => {
  try {
    let filter = {};
    if (req.query.category) {
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(req.query.category)) {
        filter.categories = req.query.category;
      } else {
        filter.$or = [
          { category: { $regex: req.query.category, $options: 'i' } },
          { name: { $regex: req.query.category, $options: 'i' } }
        ];
      }
    }

    if (req.query.search) {
      filter.name = { $regex: req.query.search, $options: 'i' };
    }
    if (req.query.featured) {
      filter.featured = req.query.featured === 'true';
    }

    // Server-side pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const total = await Food.countDocuments(filter);
    const foods = await Food.find(filter)
      .populate('categories', 'name icon image')
      .skip(skip)
      .limit(limit)
      .lean();

    // Map counts and populate helper variables in a single bulk query (reduces N+1 network requests)
    const foodIds = foods.map(f => f._id);
    const allLinks = await RestaurantFood.find({ foodId: { $in: foodIds } }).lean();

    const linksByFood = {};
    allLinks.forEach(link => {
      if (!link.foodId) return;
      const fId = link.foodId.toString();
      if (!linksByFood[fId]) {
        linksByFood[fId] = [];
      }
      linksByFood[fId].push(link);
    });

    const foodsWithStats = foods.map(food => {
      const fId = food._id.toString();
      const links = linksByFood[fId] || [];
      return {
        ...food,
        restaurantCount: links.length,
        price: links[0]?.price || food.price || 0,
        isAvailable: food.defaultAvailability,
      };
    });

    return res.status(200).json({
      success: true,
      count: total,
      data: foodsWithStats,
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
    let food = await Food.findById(req.params.id)
      .populate('categories', 'name icon image')
      .lean();

    let isCombo = false;
    if (!food) {
      const FoodCombination = require('../models/FoodCombination');
      const combo = await FoodCombination.findById(req.params.id)
        .populate('components.foodId', 'name price image')
        .lean();
      if (combo) {
        // Calculate total price from components if not set
        let comboPrice = combo.price;
        if (comboPrice == null || comboPrice === 0) {
          comboPrice = (combo.components || []).reduce((sum, comp) => {
            const unitPrice = comp.customPrice != null ? comp.customPrice : (comp.foodId?.price || 0);
            return sum + unitPrice * (comp.defaultQuantity || 1);
          }, 0);
        }
        food = {
          ...combo,
          price: comboPrice,
          category: 'Combinations',
          isCombination: true,
        };
        isCombo = true;
      }
    }

    if (!food) {
      return res.status(404).json({
        success: false,
        message: 'Food not found',
      });
    }

    let restaurantsSelling = [];
    if (isCombo) {
      const RestaurantCombination = require('../models/RestaurantCombination');
      const comboLinks = await RestaurantCombination.find({ combinationId: food._id })
        .populate('restaurantId', 'name bannerImage rating deliveryTime cuisine isOpen')
        .lean();

      restaurantsSelling = comboLinks.map(link => ({
        restaurant: link.restaurantId,
        price: link.price,
        availability: link.availability !== false,
        prepTime: 20,
        stockStatus: 'in-stock',
      }));
    } else {
      const links = await RestaurantFood.find({ foodId: food._id })
        .populate('restaurantId', 'name bannerImage rating deliveryTime cuisine isOpen')
        .lean();

      restaurantsSelling = links.map(link => ({
        restaurant: link.restaurantId,
        price: link.price,
        discountPrice: link.discountPrice,
        availability: link.availability,
        prepTime: link.prepTime,
        stockStatus: link.stockStatus,
        specialNotes: link.specialNotes,
        featured: link.featured,
        todaySpecial: link.todaySpecial,
      }));
    }

    let userRating = 0;
    if (req.user) {
      const FoodRating = require('../models/FoodRating');
      const userRatingRec = await FoodRating.findOne({ food: food._id, user: req.user._id || req.user.id });
      if (userRatingRec) userRating = userRatingRec.rating;
    }

    return res.status(200).json({
      success: true,
      data: {
        ...food,
        userRating,
        restaurantsSelling,
        restaurantCount: restaurantsSelling.length,
      },
    });


  } catch (error) {
    console.error('❌ getFoodById error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==================== CREATE FOOD (Catalogue template) ====================
exports.createFood = async (req, res) => {
  try {
    const { name, description, image, price, restaurants = [], categories = [], category } = req.body;
    const { ids: normalizedCategoryIds, primaryName } = normalizeCategorySelection(categories);
    const { ids: normalizedRestaurantIds, primaryId } = normalizeRestaurantSelection(restaurants);

    const food = await Food.create({
      name,
      description,
      image,
      price: parseFloat(price) || 0,
      categories: normalizedCategoryIds,
      category: category || primaryName || getPrimaryCategoryName(categories),
      restaurant: primaryId || undefined,
      restaurants: normalizedRestaurantIds,
    });

    if (normalizedRestaurantIds.length > 0) {
      await Promise.all(normalizedRestaurantIds.map(async (restId) => {
        await RestaurantFood.findOneAndUpdate(
          { restaurantId: restId, foodId: food._id },
          {
            restaurantId: restId,
            foodId: food._id,
            price: parseFloat(price) || 0,
            availability: true,
            prepTime: 15,
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }));
    }

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
    const { name, description, image, price, restaurants = [], categories = [], category } = req.body;
    const { ids: normalizedCategoryIds, primaryName } = normalizeCategorySelection(categories);
    const { ids: normalizedRestaurantIds, primaryId } = normalizeRestaurantSelection(restaurants);

    const food = await Food.findByIdAndUpdate(req.params.id, {
      name,
      description,
      image,
      price: parseFloat(price) || 0,
      categories: normalizedCategoryIds,
      category: category || primaryName || getPrimaryCategoryName(categories),
      restaurant: primaryId || undefined,
      restaurants: normalizedRestaurantIds,
    }, { new: true, runValidators: true });

    if (!food) {
      return res.status(404).json({
        success: false,
        message: 'Food not found',
      });
    }

    if (Array.isArray(restaurants)) {
      await RestaurantFood.deleteMany({
        foodId: food._id,
        restaurantId: { $nin: normalizedRestaurantIds }
      });

      await Promise.all(normalizedRestaurantIds.map(async (restId) => {
        await RestaurantFood.findOneAndUpdate(
          { restaurantId: restId, foodId: food._id },
          {
            restaurantId: restId,
            foodId: food._id,
            price: parseFloat(price) || 0,
            availability: true,
            prepTime: 15,
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }));
    }

    return res.status(200).json({
      success: true,
      message: 'Food updated successfully',
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
    const food = await Food.findById(req.params.id);
    if (!food) {
      return res.status(404).json({
        success: false,
        message: 'Food not found',
      });
    }

    // Clean up linked restaurant configurations
    await RestaurantFood.deleteMany({ foodId: food._id });

    await food.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Food deleted successfully from catalogue',
    });
  } catch (error) {
    console.error('❌ deleteFood error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==================== RESTAURANT MENU ASSIGNMENTS ====================

// Fetch foods linked to a specific restaurant
exports.getRestaurantFoods = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const links = await RestaurantFood.find({ restaurantId })
      .populate({
        path: 'foodId',
        populate: { path: 'categories', select: 'name icon image' }
      })
      .lean();

    const data = links.map(link => {
      if (!link.foodId) return null;
      return {
        _id: link.foodId._id,
        name: link.foodId.name,
        description: link.foodId.description,
        image: link.foodId.image,
        categories: link.foodId.categories,
        price: link.price,
        discountPrice: link.discountPrice,
        isAvailable: link.availability,
        availability: link.availability,
        prepTime: link.prepTime,
        stockStatus: link.stockStatus,
        specialNotes: link.specialNotes,
        featured: link.featured,
        todaySpecial: link.todaySpecial,
      };
    }).filter(Boolean);

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Link food catalogue item to restaurant
exports.assignFoodToRestaurant = async (req, res) => {
  try {
    const { restaurantId, foodId, price, prepTime, availability } = req.body;
    if (!restaurantId || !foodId || price === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide restaurantId, foodId, and price' });
    }

    const existing = await RestaurantFood.findOne({ restaurantId, foodId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Food item is already linked to this restaurant' });
    }

    const link = await RestaurantFood.create({
      restaurantId,
      foodId,
      price,
      prepTime: prepTime || 15,
      availability: availability !== undefined ? availability : true,
    });

    return res.status(201).json({
      success: true,
      message: 'Food linked to restaurant successfully',
      data: link,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update restaurant-specific settings for a linked food
exports.updateRestaurantFoodSettings = async (req, res) => {
  try {
    const { restaurantId, foodId } = req.params;
    const update = await RestaurantFood.findOneAndUpdate(
      { restaurantId, foodId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!update) {
      return res.status(404).json({ success: false, message: 'Linked food item not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Restaurant food settings updated successfully',
      data: update,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Remove linked food item from restaurant
exports.removeFoodFromRestaurant = async (req, res) => {
  try {
    const { restaurantId, foodId } = req.params;
    const link = await RestaurantFood.findOneAndDelete({ restaurantId, foodId });
    if (!link) {
      return res.status(404).json({ success: false, message: 'Linked food item not found' });
    }
    return res.status(200).json({
      success: true,
      message: 'Food unlinked from restaurant successfully',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Bulk updates for restaurant food items
exports.bulkUpdateRestaurantFoods = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { action, foodIds, updates } = req.body;
    if (!action || !foodIds || !Array.isArray(foodIds)) {
      return res.status(400).json({ success: false, message: 'Please provide action and foodIds array' });
    }

    if (action === 'update') {
      await RestaurantFood.updateMany(
        { restaurantId, foodId: { $in: foodIds } },
        { $set: updates }
      );
      return res.status(200).json({ success: true, message: 'Bulk update completed successfully' });
    }

    if (action === 'delete') {
      await RestaurantFood.deleteMany({ restaurantId, foodId: { $in: foodIds } });
      return res.status(200).json({ success: true, message: 'Bulk unlink completed successfully' });
    }

    return res.status(400).json({ success: false, message: 'Invalid bulk action' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getFoodRestaurants = async (req, res) => {
  try {
    const { foodId } = req.params;
    const { lat, lng } = req.query;

    const FoodCombination = require('../models/FoodCombination');
    const isCombo = await FoodCombination.findById(foodId).lean();

    let links = [];
    if (isCombo) {
      const RestaurantCombination = require('../models/RestaurantCombination');
      links = await RestaurantCombination.find({ combinationId: foodId, availability: true })
        .populate('restaurantId')
        .lean();
    } else {
      const RestaurantFood = require('../models/RestaurantFood');
      links = await RestaurantFood.find({ foodId, availability: true })
        .populate('restaurantId')
        .lean();
    }

    const data = links.map(link => {
      const rest = link.restaurantId;
      if (!rest) return null;

      let distance = 0;
      if (lat && lng && rest.latitude && rest.longitude) {
        const R = 6371; 
        const dLat = (rest.latitude - lat) * Math.PI / 180;
        const dLon = (rest.longitude - lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat * Math.PI / 180) * Math.cos(rest.latitude * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        distance = R * c; 
      } else {
        distance = 3.5; 
      }

      const baseFee = 20;
      const perKmFee = 5;
      const deliveryFee = Math.round(baseFee + (distance * perKmFee));

      const prepTime = link.prepTime || 25;
      const deliveryTime = Math.round(prepTime + (distance * 3));

      return {
        restaurantId: rest._id,
        name: rest.name,
        image: rest.image || 'https://via.placeholder.com/300x160?text=Restaurant',
        rating: rest.rating || 4.2,
        isOpen: rest.isOpen !== false,
        price: link.price,
        discountPrice: link.discountPrice,
        prepTime,
        distance: parseFloat(distance.toFixed(1)),
        deliveryFee,
        deliveryTime,
      };
    }).filter(Boolean);

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== RATE FOOD DISH (AUTHENTICATED) ====================
exports.rateFood = async (req, res) => {
  try {
    const FoodRating = require('../models/FoodRating');
    const { foodId } = req.params;
    const { rating } = req.body;

    const ratingNum = Number(rating);
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid rating between 1 and 5',
      });
    }

    const food = await Food.findById(foodId);
    if (!food) {
      return res.status(404).json({
        success: false,
        message: 'Food dish not found',
      });
    }

    const userId = req.user.id || req.user._id;

    // Upsert rating (user can update their rating if already rated)
    await FoodRating.findOneAndUpdate(
      { food: foodId, user: userId },
      { rating: ratingNum },
      { upsert: true, new: true }
    );

    // Recalculate average rating for this food
    const allRatings = await FoodRating.find({ food: foodId });
    const count = allRatings.length;
    const avgRating = parseFloat(
      (allRatings.reduce((acc, r) => acc + r.rating, 0) / count).toFixed(1)
    );

    food.rating = avgRating;
    food.numReviews = count;
    await food.save();

    return res.status(200).json({
      success: true,
      message: 'Thank you for rating this dish!',
      data: {
        rating: avgRating,
        numReviews: count,
        userRating: ratingNum,
      },
    });
  } catch (error) {
    console.error('❌ rateFood error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit rating',
    });
  }
};