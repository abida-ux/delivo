const Food = require('../models/Food');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const RestaurantFood = require('../models/RestaurantFood');
const FoodCategory = require('../models/FoodCategory');
const {
  normalizeCategorySelection,
  normalizeRestaurantSelection,
  getPrimaryCategoryName,
} = require('../utils/foodAssignment');

// Mulberry32 deterministic 32-bit PRNG
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Convert string/number seed into a 32-bit integer
function hashSeed(seed) {
  if (typeof seed === 'number' && Number.isFinite(seed)) {
    return (seed | 0) || 1;
  }
  const str = String(seed || 'delivo_seed');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash === 0 ? 1 : hash;
}

// Deterministic in-place / copy shuffle based on seed
function seededShuffle(arr, seed) {
  const seedNum = hashSeed(seed);
  const rng = mulberry32(seedNum);
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// ==================== GET ALL FOODS (Catalogue) ====================
exports.getAllFoods = async (req, res) => {
  try {
    const conditions = [];

    // 1. Category Filtering with Grouping & ObjectId / String Name Support
    if (req.query.category && req.query.category !== 'All' && req.query.category !== 'all') {
      const mongoose = require('mongoose');
      const catParam = req.query.category.trim();

      if (mongoose.Types.ObjectId.isValid(catParam)) {
        conditions.push({
          $or: [{ categories: catParam }, { category: catParam }],
        });
      } else {
        const catLower = catParam.toLowerCase();
        if (catLower === 'meals') {
          // Group Lunch, Dinner, and Meals
          const mealCatDocs = await FoodCategory.find({
            name: { $regex: /^(meals|lunch|dinner)$/i },
          })
            .select('_id')
            .lean();
          const mealCatIds = mealCatDocs.map((c) => c._id);

          conditions.push({
            $or: [
              { category: { $regex: /^(meals|lunch|dinner)$/i } },
              { categories: { $in: mealCatIds } },
              { tags: { $in: ['meals', 'lunch', 'dinner'] } },
            ],
          });
        } else if (
          catLower === 'drinks & desserts' ||
          catLower === 'drinks and desserts' ||
          catLower === 'drinks & dessert'
        ) {
          // Group Drinks and Desserts
          const drinkCatDocs = await FoodCategory.find({
            name: { $regex: /^(drinks|desserts|dessert|beverages)$/i },
          })
            .select('_id')
            .lean();
          const drinkCatIds = drinkCatDocs.map((c) => c._id);

          conditions.push({
            $or: [
              { category: { $regex: /^(drinks|desserts|dessert|beverages)$/i } },
              { categories: { $in: drinkCatIds } },
              { tags: { $in: ['drinks', 'desserts', 'dessert', 'beverages'] } },
            ],
          });
        } else {
          // Specific Category Match
          const escaped = catParam.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const matchingCatDocs = await FoodCategory.find({
            name: { $regex: new RegExp(`^${escaped}$`, 'i') },
          })
            .select('_id')
            .lean();
          const matchingCatIds = matchingCatDocs.map((c) => c._id);

          conditions.push({
            $or: [
              { category: { $regex: new RegExp(`^${escaped}$`, 'i') } },
              { category: { $regex: new RegExp(escaped, 'i') } },
              { categories: { $in: matchingCatIds } },
              { tags: { $regex: new RegExp(escaped, 'i') } },
            ],
          });
        }
      }
    }

    // 2. Search Across Name, Description, Tags, Keywords, Category
    if (req.query.search) {
      const searchParam = req.query.search.trim();
      const escapedSearch = searchParam.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escapedSearch, 'i');
      conditions.push({
        $or: [
          { name: searchRegex },
          { description: searchRegex },
          { tags: searchRegex },
          { keywords: searchRegex },
          { category: searchRegex },
        ]
      });
    }

    // 3. Featured Filter
    if (req.query.featured) {
      conditions.push({ featured: req.query.featured === 'true' });
    }

    // 4. Restaurant Filter
    if (req.query.restaurantId) {
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(req.query.restaurantId)) {
        conditions.push({
          $or: [
            { restaurant: req.query.restaurantId },
            { restaurants: req.query.restaurantId },
          ],
        });
      }
    }

    const filter = conditions.length > 0 ? { $and: conditions } : {};

    // Server-side pagination parameters
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 24);
    const skip = (page - 1) * limit;
    const seed = req.query.seed ? String(req.query.seed).trim() : null;
    const sortBy = req.query.sortBy;

    let foodsWithStats = [];
    let total = 0;

    // Use deterministic seeded random pagination when seed is provided without explicit sort
    if (seed && (!sortBy || sortBy === 'random' || sortBy === 'seed')) {
      // 1. Fetch matching _ids in stable baseline order
      const allMatchingDocs = await Food.find(filter).select('_id').sort({ _id: 1 }).lean();
      total = allMatchingDocs.length;

      // 2. Deterministic Seeded PRNG Shuffle
      const allIds = allMatchingDocs.map((d) => d._id.toString());
      const shuffledIds = seededShuffle(allIds, seed);

      // 3. Slice requested page
      const pageIds = shuffledIds.slice(skip, skip + limit);

      // 4. Fetch full food documents for the sliced IDs
      const rawFoods = await Food.find({ _id: { $in: pageIds } })
        .populate('categories', 'name icon image')
        .populate('restaurant', 'name image address')
        .lean();

      // 5. Preserve exact seeded ordering of pageIds
      const foodMap = new Map(rawFoods.map((f) => [f._id.toString(), f]));
      const orderedFoods = pageIds.map((id) => foodMap.get(id)).filter(Boolean);

      // 6. Map restaurant links and pricing
      const allLinks = await RestaurantFood.find({ foodId: { $in: pageIds } }).lean();
      const linksByFood = {};
      allLinks.forEach((link) => {
        if (!link.foodId) return;
        const fId = link.foodId.toString();
        if (!linksByFood[fId]) linksByFood[fId] = [];
        linksByFood[fId].push(link);
      });

      foodsWithStats = orderedFoods.map((food) => {
        const fId = food._id.toString();
        const links = linksByFood[fId] || [];
        const basePrice = food.price || 0;
        const itemPortions = Array.isArray(food.portions) && food.portions.length > 0
          ? food.portions
          : (Array.isArray(food.variations) ? food.variations : []);

        return {
          ...food,
          portions: itemPortions,
          variations: itemPortions,
          restaurantCount: links.length,
          basePrice,
          price: basePrice,
          isAvailable: food.defaultAvailability !== false,
        };
      });
    } else {
      // Standard deterministic database sorting when sortBy is provided
      let sort = { createdAt: -1, _id: -1 };
      if (sortBy === 'popular' || sortBy === 'rating') {
        sort = { rating: -1, createdAt: -1, _id: -1 };
      } else if (sortBy === 'price_asc') {
        sort = { price: 1, _id: -1 };
      } else if (sortBy === 'price_desc') {
        sort = { price: -1, _id: -1 };
      } else if (sortBy === 'name_asc') {
        sort = { name: 1, _id: -1 };
      }

      total = await Food.countDocuments(filter);
      const foods = await Food.find(filter)
        .populate('categories', 'name icon image')
        .populate('restaurant', 'name image address')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();

      const foodIds = foods.map((f) => f._id);
      const allLinks = await RestaurantFood.find({ foodId: { $in: foodIds } }).lean();

      const linksByFood = {};
      allLinks.forEach((link) => {
        if (!link.foodId) return;
        const fId = link.foodId.toString();
        if (!linksByFood[fId]) linksByFood[fId] = [];
        linksByFood[fId].push(link);
      });

      foodsWithStats = foods.map((food) => {
        const fId = food._id.toString();
        const links = linksByFood[fId] || [];
        const basePrice = food.price || 0;
        const itemPortions = Array.isArray(food.portions) && food.portions.length > 0
          ? food.portions
          : (Array.isArray(food.variations) ? food.variations : []);

        return {
          ...food,
          portions: itemPortions,
          variations: itemPortions,
          restaurantCount: links.length,
          basePrice,
          price: basePrice,
          isAvailable: food.defaultAvailability !== false,
        };
      });
    }

    const totalPages = Math.ceil(total / limit) || 1;
    const hasMore = page < totalPages;

    return res.status(200).json({
      success: true,
      count: total,
      page,
      limit,
      totalPages,
      hasMore,
      seed: seed || undefined,
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

// ==================== GET DYNAMIC POPULAR FOODS ====================
exports.getPopularFoods = async (req, res) => {
  try {
    const Order = require('../models/Order');
    const limit = Math.min(12, Math.max(1, parseInt(req.query.limit, 10) || 6));

    // 1. Check Order collection sales aggregation for top ordered foods
    let popularIds = [];
    try {
      const topSales = await Order.aggregate([
        { $match: { status: { $nin: ['cancelled', 'rejected'] } } },
        { $unwind: '$items' },
        { $match: { 'items.foodId': { $exists: true, $ne: null } } },
        {
          $group: {
            _id: '$items.foodId',
            totalQuantity: { $sum: '$items.quantity' },
          },
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: limit },
      ]);
      popularIds = topSales.map((t) => t._id);
    } catch (aggErr) {
      console.warn('⚠️ Order aggregation for popular foods skipped:', aggErr.message);
    }

    // 2. Backfill with rated or featured dishes if fewer than limit
    if (popularIds.length < limit) {
      const needed = limit - popularIds.length;
      const topRated = await Food.find({
        _id: { $nin: popularIds },
        $or: [{ rating: { $gt: 0 } }, { featured: true }],
      })
        .sort({ rating: -1, numReviews: -1, createdAt: -1 })
        .limit(needed)
        .select('_id')
        .lean();

      popularIds.push(...topRated.map((f) => f._id));
    }

    // 3. Fallback to latest foods if catalogue is fresh
    if (popularIds.length < limit) {
      const needed = limit - popularIds.length;
      const fallback = await Food.find({
        _id: { $nin: popularIds },
        isAvailable: { $ne: false },
      })
        .sort({ createdAt: -1, _id: -1 })
        .limit(needed)
        .select('_id')
        .lean();

      popularIds.push(...fallback.map((f) => f._id));
    }

    if (popularIds.length === 0) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    // Fetch full food documents
    const rawFoods = await Food.find({ _id: { $in: popularIds } })
      .populate('categories', 'name icon image')
      .populate('restaurant', 'name image address')
      .lean();

    // Preserve exact ranking order
    const foodMap = new Map(rawFoods.map((f) => [f._id.toString(), f]));
    const orderedFoods = popularIds.map((id) => foodMap.get(id.toString())).filter(Boolean);

    // Resolve restaurant links & prices
    const allLinks = await RestaurantFood.find({ foodId: { $in: popularIds } }).lean();
    const linksByFood = {};
    allLinks.forEach((link) => {
      if (!link.foodId) return;
      const fId = link.foodId.toString();
      if (!linksByFood[fId]) linksByFood[fId] = [];
      linksByFood[fId].push(link);
    });

    const data = orderedFoods.map((food) => {
      const fId = food._id.toString();
      const links = linksByFood[fId] || [];
      const basePrice = food.price || 0;
      return {
        ...food,
        restaurantCount: links.length,
        basePrice,
        price: basePrice,
        isAvailable: food.defaultAvailability !== false,
      };
    });

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error('❌ getPopularFoods error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch popular foods',
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
        basePrice: food.price || 0,
        price: link.price != null && link.price > 0 ? link.price : (food.price || 0),
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
        basePrice: food.price || 0,
        price: link.price != null && link.price > 0 ? link.price : (food.price || 0),
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

    const finalPortions = Array.isArray(food.portions) && food.portions.length > 0 
      ? food.portions 
      : (Array.isArray(food.variations) ? food.variations : []);

    return res.status(200).json({
      success: true,
      data: {
        ...food,
        portions: finalPortions,
        variations: finalPortions,
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
    const { name, description, image, price, restaurants = [], categories = [], category, portions = [], variations = [] } = req.body;
    const { ids: normalizedCategoryIds, primaryName } = normalizeCategorySelection(categories);
    const { ids: normalizedRestaurantIds, primaryId } = normalizeRestaurantSelection(restaurants);

    let parsedPortions = portions;
    if (typeof portions === 'string') {
      try { parsedPortions = JSON.parse(portions); } catch (e) {}
    }
    let parsedVariations = variations;
    if (typeof variations === 'string') {
      try { parsedVariations = JSON.parse(variations); } catch (e) {}
    }

    const rawPortions = Array.isArray(parsedPortions) && parsedPortions.length > 0 
      ? parsedPortions 
      : (Array.isArray(parsedVariations) ? parsedVariations : []);

    const finalPortions = rawPortions.map(p => 
      typeof p === 'string' ? { name: p, price: parseFloat(price) || 0 } : { name: String(p.name || p.title || 'Portion').trim(), price: parseFloat(p.price) || 0 }
    ).filter(p => p.name);

    const food = await Food.create({
      name,
      description,
      image,
      price: parseFloat(price) || 0,
      categories: normalizedCategoryIds,
      category: category || primaryName || getPrimaryCategoryName(categories),
      restaurant: primaryId || undefined,
      restaurants: normalizedRestaurantIds,
      portions: finalPortions,
      variations: finalPortions,
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

    const foodObj = food.toObject ? food.toObject() : food;
    foodObj.portions = finalPortions;
    foodObj.variations = finalPortions;

    return res.status(201).json({
      success: true,
      message: 'Food created successfully',
      data: foodObj,
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
    const { name, description, image, price, restaurants = [], categories = [], category, portions = [], variations = [] } = req.body;
    const { ids: normalizedCategoryIds, primaryName } = normalizeCategorySelection(categories);
    const { ids: normalizedRestaurantIds, primaryId } = normalizeRestaurantSelection(restaurants);

    let parsedPortions = portions;
    if (typeof portions === 'string') {
      try { parsedPortions = JSON.parse(portions); } catch (e) {}
    }
    let parsedVariations = variations;
    if (typeof variations === 'string') {
      try { parsedVariations = JSON.parse(variations); } catch (e) {}
    }

    const rawPortions = Array.isArray(parsedPortions) && parsedPortions.length > 0 
      ? parsedPortions 
      : (Array.isArray(parsedVariations) ? parsedVariations : []);

    const finalPortions = rawPortions.map(p => 
      typeof p === 'string' ? { name: p, price: parseFloat(price) || 0 } : { name: String(p.name || p.title || 'Portion').trim(), price: parseFloat(p.price) || 0 }
    ).filter(p => p.name);

    let food = await Food.findById(req.params.id);

    if (!food) {
      return res.status(404).json({
        success: false,
        message: 'Food not found',
      });
    }

    if (name) food.name = name;
    if (description) food.description = description;
    if (image) food.image = image;
    if (price !== undefined && price !== null && price !== '') food.price = parseFloat(price) || 0;
    if (normalizedCategoryIds.length > 0) food.categories = normalizedCategoryIds;
    if (category || primaryName) food.category = category || primaryName;
    if (primaryId) food.restaurant = primaryId;
    if (normalizedRestaurantIds.length > 0) food.restaurants = normalizedRestaurantIds;

    food.portions = finalPortions;
    food.variations = finalPortions;

    food.markModified('portions');
    food.markModified('variations');

    await food.save();

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

    const foodObj = food.toObject ? food.toObject() : food;
    foodObj.portions = finalPortions;
    foodObj.variations = finalPortions;

    return res.status(200).json({
      success: true,
      message: 'Food updated successfully',
      data: foodObj,
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
      const basePrice = link.foodId.price || 0;
      const sellingPrice = link.price != null && link.price > 0 ? link.price : basePrice;
      return {
        _id: link.foodId._id,
        name: link.foodId.name,
        description: link.foodId.description,
        image: link.foodId.image,
        categories: link.foodId.categories,
        basePrice,
        price: sellingPrice,
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
    if (!restaurantId || !foodId) {
      return res.status(400).json({ success: false, message: 'Please provide restaurantId and foodId' });
    }

    const existing = await RestaurantFood.findOne({ restaurantId, foodId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Food item is already linked to this restaurant' });
    }

    let finalPrice = price;
    if (finalPrice === undefined || finalPrice === null || finalPrice === '') {
      const foodDoc = await Food.findById(foodId).select('price').lean();
      finalPrice = foodDoc?.price || 0;
    } else {
      finalPrice = parseFloat(finalPrice) || 0;
    }

    const link = await RestaurantFood.create({
      restaurantId,
      foodId,
      price: finalPrice,
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

    const Restaurant = require('../models/Restaurant');
    const RestaurantFood = require('../models/RestaurantFood');

    // 1. Fetch Food document with populated restaurant links
    const foodDoc = await Food.findById(foodId)
      .populate('restaurant')
      .populate('restaurants')
      .lean();

    let directRestaurants = [];

    if (foodDoc) {
      if (foodDoc.restaurant) {
        directRestaurants.push(foodDoc.restaurant);
      }
      if (Array.isArray(foodDoc.restaurants) && foodDoc.restaurants.length > 0) {
        foodDoc.restaurants.forEach((r) => {
          if (r && r._id && !directRestaurants.some((dr) => dr._id.toString() === r._id.toString())) {
            directRestaurants.push(r);
          }
        });
      }
    }

    // 2. Fetch RestaurantFood collection links
    const links = await RestaurantFood.find({ foodId, availability: true })
      .populate('restaurantId')
      .lean();

    links.forEach((link) => {
      const r = link.restaurantId;
      if (r && r._id && !directRestaurants.some((dr) => dr._id.toString() === r._id.toString())) {
        directRestaurants.push({
          ...r,
          customPrice: link.price,
        });
      }
    });

    // 3. Fetch admin delivery settings
    const AppSettings = require('../models/AppSettings');
    const settingsDoc = await AppSettings.findOne().lean();
    const isFeeEnabled = settingsDoc ? settingsDoc.deliveryFeeEnabled !== false : true;
    const feeAmount = settingsDoc && settingsDoc.deliveryFeeAmount != null ? Number(settingsDoc.deliveryFeeAmount) : 20;
    const calculatedDeliveryFee = isFeeEnabled ? feeAmount : 0;

    // 4. If no linked restaurant exists yet, fallback to all active restaurants
    if (directRestaurants.length === 0) {
      const allActive = await Restaurant.find({ status: { $ne: 'suspended' } }).limit(10).lean();
      directRestaurants = allActive;
    }

    const data = directRestaurants
      .map((rest) => {
        if (!rest || !rest._id) return null;

        let distance = 3.5;
        if (lat && lng && rest.latitude && rest.longitude) {
          const R = 6371;
          const dLat = ((rest.latitude - lat) * Math.PI) / 180;
          const dLon = ((rest.longitude - lng) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat * Math.PI) / 180) *
              Math.cos((rest.latitude * Math.PI) / 180) *
              Math.sin(dLon / 2) *
              Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          distance = R * c;
        }

        const prepTime = rest.deliveryTime ? parseInt(rest.deliveryTime, 10) || 25 : 25;
        const deliveryTime = Math.round(prepTime + distance * 3);

        return {
          restaurantId: rest._id,
          name: rest.name || 'Delivo Kitchen',
          image: rest.bannerImage || rest.image || 'https://via.placeholder.com/300x160?text=Restaurant',
          rating: rest.rating || 4.5,
          isOpen: rest.isOpen !== false,
          price: rest.customPrice || foodDoc?.price || 0,
          prepTime,
          distance: parseFloat(distance.toFixed(1)),
          deliveryFee: calculatedDeliveryFee,
          deliveryFeeEnabled: isFeeEnabled,
          deliveryTime: `${prepTime}-${deliveryTime}`,
        };
      })
      .filter(Boolean);

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error('❌ getFoodRestaurants error:', error);
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