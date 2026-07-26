const FoodCategory = require('../models/FoodCategory');
const Food = require('../models/Food');

// Get all categories (sorted by order)
exports.getCategories = async (req, res) => {
  try {
    const existing = await FoodCategory.find();
    
    const defaultCategories = [
      { name: 'Breakfast', icon: 'Coffee', image: 'https://images.unsplash.com/photo-1533089860891-a7c6f0a88666?w=600' },
      { name: 'Lunch', icon: 'Utensils', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600' },
      { name: 'Dinner', icon: 'UtensilsCrossed', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600' },
      { name: 'Fast Food', icon: 'Flame', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600' },
      { name: 'Street Food', icon: 'MapPin', image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=600' },
      { name: 'Snacks', icon: 'Snail', image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600' },
      { name: 'Drinks', icon: 'CupSoda', image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600' },
      { name: 'Desserts', icon: 'Cake', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600' },
      { name: 'Healthy', icon: 'Apple', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600' },
      { name: 'Bakery', icon: 'Croissant', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600' },
      { name: 'Pizza', icon: 'Pizza', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600' },
      { name: 'Burgers', icon: 'Flame', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600' }
    ];

    const toInsert = [];
    defaultCategories.forEach((item, index) => {
      const exists = existing.some(c => c.name.toLowerCase() === item.name.toLowerCase());
      if (!exists) {
        toInsert.push({
          name: item.name,
          icon: item.icon,
          image: item.image,
          order: index,
          isEnabled: true
        });
      }
    });

    if (toInsert.length > 0) {
      await FoodCategory.insertMany(toInsert);
    }

    const categories = toInsert.length > 0 
      ? await FoodCategory.find().sort({ order: 1 })
      : existing.sort((a, b) => (a.order || 0) - (b.order || 0));

    return res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Create category (Admin only)
exports.createCategory = async (req, res) => {
  try {
    const category = await FoodCategory.create(req.body);
    return res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update category (Admin only)
exports.updateCategory = async (req, res) => {
  try {
    const category = await FoodCategory.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    return res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete category (Admin only)
exports.deleteCategory = async (req, res) => {
  try {
    const category = await FoodCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    await category.deleteOne();
    return res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
