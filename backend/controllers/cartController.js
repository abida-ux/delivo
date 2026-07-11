const Cart = require('../models/Cart');
const Food = require('../models/Food');
const User = require('../models/User');

// Get user's cart
exports.getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    
    let cart = await Cart.findOne({ userId }).populate('items.foodId');
    
    // Create empty cart if doesn't exist
    if (!cart) {
      cart = await Cart.create({ userId, items: [] });
    }
    
    res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching cart',
      error: error.message,
    });
  }
};

// Add item to cart
exports.addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { foodId, quantity = 1 } = req.body;

    if (!foodId) {
      return res.status(400).json({
        success: false,
        message: 'Food ID is required',
      });
    }

    // Get food details
    const food = await Food.findById(foodId);
    if (!food) {
      return res.status(404).json({
        success: false,
        message: 'Food not found',
      });
    }

    // Find or create cart
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = await Cart.create({ userId, items: [] });
    }

    // Check if item already exists in cart
    const existingItem = cart.items.find(
      (item) => item.foodId.toString() === foodId
    );

    if (existingItem) {
      // Update quantity if item already in cart
      existingItem.quantity += parseInt(quantity);
    } else {
      // Add new item to cart
      cart.items.push({
        foodId,
        name: food.name,
        price: food.price,
        image: food.image,
        quantity: parseInt(quantity),
      });
    }

    await cart.save();
    
    // Populate foodId for consistent response
    await cart.populate('items.foodId');

    res.status(200).json({
      success: true,
      message: 'Item added to cart',
      cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding to cart',
      error: error.message,
    });
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { foodId } = req.params;

    if (!foodId) {
      return res.status(400).json({
        success: false,
        message: 'Food ID is required',
      });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    // Remove item from cart
    cart.items = cart.items.filter(
      (item) => item.foodId.toString() !== foodId
    );

    await cart.save();
    
    // Populate foodId for consistent response
    await cart.populate('items.foodId');

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing from cart',
      error: error.message,
    });
  }
};

// Update item quantity in cart
exports.updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { foodId } = req.params;
    const { quantity } = req.body;

    if (!foodId || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Food ID and quantity are required',
      });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    const item = cart.items.find(
      (item) => item.foodId.toString() === foodId
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart',
      });
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      cart.items = cart.items.filter(
        (item) => item.foodId.toString() !== foodId
      );
    } else {
      item.quantity = parseInt(quantity);
    }

    await cart.save();
    
    // Populate foodId for consistent response
    await cart.populate('items.foodId');

    res.status(200).json({
      success: true,
      message: 'Cart item updated',
      cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating cart',
      error: error.message,
    });
  }
};

// Clear entire cart
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    cart.items = [];
    await cart.save();
    
    // Populate foodId for consistent response
    await cart.populate('items.foodId');

    res.status(200).json({
      success: true,
      message: 'Cart cleared',
      cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error clearing cart',
      error: error.message,
    });
  }
};
