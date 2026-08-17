const Cart = require('../models/Cart');
const Food = require('../models/Food');
const MarketplaceProduct = require('../models/MarketplaceProduct');
const User = require('../models/User');

// Get user's cart
exports.getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    
    let cart = await Cart.findOne({ userId }).populate('items.foodId').populate('items.marketplaceProductId');
    
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
    const { foodId, marketplaceProductId, quantity = 1, isCombination = false, components = [], price, productType = 'meal', restaurantId = null, restaurantName = null } = req.body;

    if (!foodId && !marketplaceProductId) {
      return res.status(400).json({
        success: false,
        message: 'A product ID is required',
      });
    }

    let name, image, itemPrice;

    if (productType === 'marketplace') {
      const product = await MarketplaceProduct.findById(marketplaceProductId);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Marketplace product not found' });
      }
      name = product.name;
      image = product.image || product.images?.[0] || '';
      itemPrice = price !== undefined && price !== null ? price : product.price - (product.discount || 0);
    } else if (isCombination) {
      const FoodCombination = require('../models/FoodCombination');
      const combo = await FoodCombination.findById(foodId);
      if (!combo) {
        return res.status(404).json({ success: false, message: 'Combination meal not found' });
      }
      name = combo.name;
      image = combo.image;
      itemPrice = price !== undefined ? price : null;
    } else {
      const food = await Food.findById(foodId);
      if (!food) {
        return res.status(404).json({ success: false, message: 'Food not found' });
      }
      name = food.name;
      image = food.image;
      itemPrice = price !== undefined ? price : (restaurantId ? food.price : null);
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = await Cart.create({ userId, items: [] });
    }

    const existingItem = cart.items.find((item) => {
      if (productType === 'marketplace') {
        return item.marketplaceProductId?.toString() === marketplaceProductId && item.productType === 'marketplace';
      }
      const itemFoodId = item.foodId?._id ? item.foodId._id.toString() : item.foodId?.toString();
      if (itemFoodId !== foodId) return false;
      if (isCombination) {
        if (item.components?.length !== components.length) return false;
        return item.components.every(c1 => 
          components.some(c2 => c2.foodId?.toString() === c1.foodId?.toString() && c2.quantity === c1.quantity)
        );
      }
      // If restaurantId matches or both null
      const itemRest = item.restaurantId?.toString() || null;
      const targetRest = restaurantId ? restaurantId.toString() : null;
      return itemRest === targetRest;
    });

    if (existingItem) {
      existingItem.quantity += parseInt(quantity);
      if (price !== undefined && price !== null) existingItem.price = price;
      if (restaurantId) {
        existingItem.restaurantId = restaurantId;
        existingItem.restaurantName = restaurantName;
      }
    } else {
      cart.items.push({
        productType,
        foodId: productType === 'marketplace' ? undefined : foodId,
        marketplaceProductId: productType === 'marketplace' ? marketplaceProductId : undefined,
        restaurantId: restaurantId || null,
        restaurantName: restaurantName || null,
        name,
        price: itemPrice,
        image,
        quantity: parseInt(quantity),
        isCombination,
        combinationId: isCombination ? foodId : undefined,
        components: isCombination ? components : undefined,
      });
    }

    await cart.save();
    
    await cart.populate({
      path: 'items.foodId',
      match: { _id: { $exists: true } }
    });
    await cart.populate('items.marketplaceProductId');

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

// Update item restaurant and price in cart
exports.updateCartItemRestaurant = async (req, res) => {
  try {
    const userId = req.user.id;
    const { foodId, restaurantId, restaurantName, price } = req.body;

    if (!foodId) {
      return res.status(400).json({ success: false, message: 'foodId is required' });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const item = cart.items.find((i) => {
      const iFoodId = i.foodId?._id ? i.foodId._id.toString() : i.foodId?.toString();
      return iFoodId === foodId.toString();
    });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    item.restaurantId = restaurantId || null;
    item.restaurantName = restaurantName || null;
    if (price !== undefined && price !== null) {
      item.price = Number(price);
    }

    await cart.save();
    await cart.populate('items.foodId');
    await cart.populate('items.marketplaceProductId');

    res.status(200).json({
      success: true,
      message: 'Cart item restaurant updated',
      cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating cart item restaurant',
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
    cart.items = cart.items.filter((item) => {
      const itemFoodId = item.foodId._id ? item.foodId._id.toString() : item.foodId.toString();
      return itemFoodId !== foodId;
    });

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

    const item = cart.items.find((item) => {
      const itemFoodId = item.foodId._id ? item.foodId._id.toString() : item.foodId.toString();
      return itemFoodId === foodId;
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart',
      });
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      cart.items = cart.items.filter((item) => {
        const itemFoodId = item.foodId._id ? item.foodId._id.toString() : item.foodId.toString();
        return itemFoodId !== foodId;
      });
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

// Merge guest cart with user cart
exports.mergeCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { items = [] } = req.body;

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = await Cart.create({ userId, items: [] });
    }

    for (const guestItem of items) {
      const foodId = typeof guestItem.foodId === 'object' ? guestItem.foodId._id : guestItem.foodId;
      if (!foodId) continue;

      const isCombination = !!guestItem.isCombination;
      const guestComponents = guestItem.components || [];

      // Check if identical item already exists in user cart
      const existingItem = cart.items.find((userItem) => {
        const userFoodId = typeof userItem.foodId === 'object' ? userItem.foodId._id : userItem.foodId;
        if (userFoodId?.toString() !== foodId.toString()) return false;
        
        if (isCombination) {
          if (!userItem.isCombination) return false;
          if (userItem.components.length !== guestComponents.length) return false;
          return userItem.components.every(uComp => 
            guestComponents.some(gComp => {
              const gCompId = typeof gComp.foodId === 'object' ? gComp.foodId._id : gComp.foodId;
              const uCompId = typeof uComp.foodId === 'object' ? uComp.foodId._id : uComp.foodId;
              return gCompId.toString() === uCompId.toString() && gComp.quantity === uComp.quantity;
            })
          );
        }

        const userRest = userItem.restaurantId?.toString() || null;
        const guestRest = guestItem.restaurantId?.toString() || null;
        return userRest === guestRest && !userItem.isCombination;
      });

      if (existingItem) {
        existingItem.quantity += parseInt(guestItem.quantity || 1, 10);
      } else {
        cart.items.push({
          foodId,
          restaurantId: guestItem.restaurantId || null,
          restaurantName: guestItem.restaurantName || null,
          name: guestItem.name,
          price: guestItem.price !== undefined && guestItem.price !== null ? parseFloat(guestItem.price) : null,
          image: guestItem.image,
          quantity: parseInt(guestItem.quantity || 1, 10),
          isCombination,
          combinationId: isCombination ? foodId : undefined,
          components: isCombination ? guestComponents : undefined,
        });
      }
    }

    await cart.save();
    await cart.populate('items.foodId');
    await cart.populate('items.marketplaceProductId');

    return res.status(200).json({
      success: true,
      message: 'Cart merged successfully',
      cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error merging cart',
      error: error.message,
    });
  }
};
