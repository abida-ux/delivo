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
        let basePrice = link.combinationId.price;
        if (basePrice == null || basePrice === 0) {
          basePrice = (link.combinationId.components || []).reduce((sum, c) => {
            const compPrice = c.customPrice != null ? c.customPrice : (c.foodId?.price || 0);
            return sum + (compPrice * (c.defaultQuantity || 1));
          }, 0);
        }
        const sellingPrice = link.price != null && link.price > 0 ? link.price : basePrice;
        return {
          _id: link.combinationId._id,
          name: link.combinationId.name,
          description: link.combinationId.description,
          image: link.combinationId.image,
          categories: link.combinationId.categories,
          components: link.combinationId.components,
          basePrice,
          price: sellingPrice,
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

    const comboIds = combos.map(c => c._id);
    const allComboLinks = await RestaurantCombination.find({ combinationId: { $in: comboIds } }).lean();

    const linksByCombo = {};
    allComboLinks.forEach(link => {
      if (!link.combinationId) return;
      const cId = link.combinationId.toString();
      if (!linksByCombo[cId]) {
        linksByCombo[cId] = [];
      }
      linksByCombo[cId].push(link);
    });

    const data = combos.map((combo) => {
      const cId = combo._id.toString();
      const links = linksByCombo[cId] || [];
      
      let basePrice = combo.price;
      if (basePrice == null || basePrice === 0) {
        basePrice = (combo.components || []).reduce((sum, c) => {
          const compPrice = c.customPrice != null ? c.customPrice : (c.foodId?.price || 0);
          return sum + (compPrice * (c.defaultQuantity || 1));
        }, 0);
      }

      return {
        ...combo,
        basePrice,
        price: basePrice,
        isCombination: true,
        restaurantCount: links.length,
      };
    });

    return res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Create combination template
exports.createCombination = async (req, res) => {
  try {
    const body = { ...req.body };

    // ── Auto-generate name from component food names if not provided ──
    if (!body.name || !body.name.trim()) {
      if (Array.isArray(body.components) && body.components.length > 0) {
        const Food = require('../models/Food');
        const foodIds = body.components.map(c => c.foodId).filter(Boolean);
        const foods = await Food.find({ _id: { $in: foodIds } }).select('name').lean();
        const foodMap = {};
        foods.forEach(f => { foodMap[f._id.toString()] = f.name; });
        const names = body.components
          .map(c => foodMap[c.foodId?.toString()])
          .filter(Boolean);
        body.name = names.join(' & ');
      }
    }

    // ── Use a placeholder image if none provided ──
    if (!body.image || !body.image.trim()) {
      body.image = 'https://via.placeholder.com/400x300?text=Combo+Meal';
    }

    const combo = await FoodCombination.create(body);
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
    if (!restaurantId || !combinationId) {
      return res.status(400).json({ success: false, message: 'Please provide restaurantId and combinationId' });
    }

    const existing = await RestaurantCombination.findOne({ restaurantId, combinationId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Combination is already linked to this restaurant' });
    }

    let finalPrice = price;
    if (finalPrice === undefined || finalPrice === null || finalPrice === '') {
      const comboDoc = await FoodCombination.findById(combinationId)
        .populate('components.foodId', 'price')
        .lean();
      if (comboDoc) {
        finalPrice = comboDoc.price;
        if (finalPrice == null || finalPrice === 0) {
          finalPrice = (comboDoc.components || []).reduce((sum, c) => {
            const compPrice = c.customPrice != null ? c.customPrice : (c.foodId?.price || 0);
            return sum + (compPrice * (c.defaultQuantity || 1));
          }, 0);
        }
      } else {
        finalPrice = 0;
      }
    } else {
      finalPrice = parseFloat(finalPrice) || 0;
    }

    const link = await RestaurantCombination.create({
      restaurantId,
      combinationId,
      price: finalPrice,
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
