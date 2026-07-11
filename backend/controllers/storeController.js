const Store = require('../models/Store');
const StoreType = require('../models/StoreType');
const Food = require('../models/Food');

// Get all stores
exports.getAllStores = async (req, res) => {
  try {
    const { storeTypeId } = req.query;
    let query = {};

    if (storeTypeId) {
      query.storeType = storeTypeId;
    }

    const stores = await Store.find(query)
      .populate('storeType')
      .populate('products')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: stores.length,
      data: stores,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get single store with all its products
exports.getStore = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id)
      .populate('storeType')
      .populate({
        path: 'products',
        model: 'Food',
      });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found',
      });
    }

    res.status(200).json({
      success: true,
      data: store,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Create store
exports.createStore = async (req, res) => {
  try {
    const { name, bannerImage, storeType, rating, deliveryTime, cuisine } = req.body;

    if (!name || !bannerImage || !storeType) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    // Verify storeType exists
    const typeExists = await StoreType.findById(storeType);
    if (!typeExists) {
      return res.status(400).json({
        success: false,
        message: 'Invalid store type',
      });
    }

    const store = await Store.create({
      name,
      bannerImage,
      storeType,
      rating,
      deliveryTime,
      cuisine,
    });

    // Populate storeType in response
    await store.populate('storeType');

    res.status(201).json({
      success: true,
      data: store,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update store
exports.updateStore = async (req, res) => {
  try {
    let store = await Store.findById(req.params.id);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found',
      });
    }

    store = await Store.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('storeType')
      .populate('products');

    res.status(200).json({
      success: true,
      data: store,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete store
exports.deleteStore = async (req, res) => {
  try {
    const store = await Store.findByIdAndDelete(req.params.id);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found',
      });
    }

    // Delete all products from this store
    await Food.deleteMany({ store: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Store deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Add product to store
exports.addProductToStore = async (req, res) => {
  try {
    const { storeId, foodId } = req.body;

    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found',
      });
    }

    const food = await Food.findById(foodId);
    if (!food) {
      return res.status(404).json({
        success: false,
        message: 'Food not found',
      });
    }

    if (!store.products.includes(foodId)) {
      store.products.push(foodId);
      await store.save();
    }

    res.status(200).json({
      success: true,
      data: store,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Remove product from store
exports.removeProductFromStore = async (req, res) => {
  try {
    const { storeId, foodId } = req.body;

    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found',
      });
    }

    store.products = store.products.filter(id => id.toString() !== foodId);
    await store.save();

    res.status(200).json({
      success: true,
      data: store,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
