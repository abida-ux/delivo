const FoodCombination = require('../models/FoodCombination');
const RestaurantCombination = require('../models/RestaurantCombination');

// Get all combinations (optionally filtered by restaurant or category)
exports.getCombinations = async (req, res) => {
  try {
    const { restaurantId, category } = req.query;
    let filter = {};

    if (category) {
      filter.categories = category;
    }

    if (restaurantId) {
      const links = await RestaurantCombination.find({ restaurantId })
        .populate({
          path: 'combinationId',
          populate: [
            { path: 'components.foodId', select: 'name description image price' },
            { path: 'categories', select: 'name icon image' }
          ]
        })
        .lean();

      const data = links.map(link => {
        if (!link.combinationId) return null;
        return {
          _id: link.combinationId._id,
          name: link.combinationId.name,
          description: link.combinationId.description,
          image: link.combinationId.image,
          categories: link.combinationId.categories,
          components: link.combinationId.components,
          price: link.price,
          discountPrice: link.discountPrice,
          isAvailable: link.availability,
          availability: link.availability,
          isCombination: true,
        };
      }).filter(Boolean);

      return res.status(200).json({ success: true, count: data.length, data });
    }

    const combos = await FoodCombination.find(filter)
      .populate('components.foodId', 'name description image price')
      .populate('categories', 'name icon image')
      .lean();

    const data = await Promise.all(combos.map(async (combo) => {
      const links = await RestaurantCombination.find({ combinationId: combo._id }).lean();
      
      let price = links[0]?.price;
      if (price == null) {
        price = combo.components.reduce((sum, c) => {
          const compPrice = c.foodId?.price || 0;
          return sum + (compPrice * (c.defaultQuantity || 1));
        }, 0);
      }

      return {
        ...combo,
        price,
        isCombination: true,
        restaurantCount: links.length,
      };
    }));

    return res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Create combination template
exports.createCombination = async (req, res) => {
  try {
    const combo = await FoodCombination.create(req.body);
    return res.status(201).json({ success: true, message: 'Combination created successfully', data: combo });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update combination template
exports.updateCombination = async (req, res) => {
  try {
    const combo = await FoodCombination.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!combo) {
      return res.status(404).json({ success: false, message: 'Combination not found' });
    }
    return res.status(200).json({ success: true, message: 'Combination updated successfully', data: combo });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete combination template
exports.deleteCombination = async (req, res) => {
  try {
    const combo = await FoodCombination.findById(req.params.id);
    if (!combo) {
      return res.status(404).json({ success: false, message: 'Combination not found' });
    }
    await RestaurantCombination.deleteMany({ combinationId: combo._id });
    await combo.deleteOne();
    return res.status(200).json({ success: true, message: 'Combination deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Link combination to restaurant (Restaurant assignments)
exports.assignCombinationToRestaurant = async (req, res) => {
  try {
    const { restaurantId, combinationId, price, availability } = req.body;
    if (!restaurantId || !combinationId || price === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide restaurantId, combinationId, and price' });
    }

    const existing = await RestaurantCombination.findOne({ restaurantId, combinationId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Combination is already linked to this restaurant' });
    }

    const link = await RestaurantCombination.create({
      restaurantId,
      combinationId,
      price,
      availability: availability !== undefined ? availability : true,
    });

    return res.status(201).json({ success: true, message: 'Combination linked to restaurant successfully', data: link });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update restaurant-specific pricing / availability for a combination
exports.updateRestaurantCombinationSettings = async (req, res) => {
  try {
    const { restaurantId, combinationId } = req.params;
    const link = await RestaurantCombination.findOneAndUpdate(
      { restaurantId, combinationId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!link) {
      return res.status(404).json({ success: false, message: 'Restaurant-combination mapping not found' });
    }

    return res.status(200).json({ success: true, message: 'Combination settings updated successfully', data: link });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Unlink combination from restaurant
exports.removeCombinationFromRestaurant = async (req, res) => {
  try {
    const { restaurantId, combinationId } = req.params;
    const link = await RestaurantCombination.findOneAndDelete({ restaurantId, combinationId });
    if (!link) {
      return res.status(404).json({ success: false, message: 'Combination link not found' });
    }
    return res.status(200).json({ success: true, message: 'Combination unlinked from restaurant' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
