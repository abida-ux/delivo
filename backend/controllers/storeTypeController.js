const StoreType = require('../models/StoreType');

// Get all store types
exports.getAllStoreTypes = async (req, res) => {
  try {
    const storeTypes = await StoreType.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: storeTypes.length,
      data: storeTypes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get single store type
exports.getStoreType = async (req, res) => {
  try {
    const storeType = await StoreType.findById(req.params.id);
    if (!storeType) {
      return res.status(404).json({
        success: false,
        message: 'Store type not found',
      });
    }
    res.status(200).json({
      success: true,
      data: storeType,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Create store type
exports.createStoreType = async (req, res) => {
  try {
    const { name, icon, description, color } = req.body;

    if (!name || !icon) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    const storeType = await StoreType.create({
      name,
      icon,
      description,
      color,
    });

    res.status(201).json({
      success: true,
      data: storeType,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update store type
exports.updateStoreType = async (req, res) => {
  try {
    const storeType = await StoreType.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!storeType) {
      return res.status(404).json({
        success: false,
        message: 'Store type not found',
      });
    }

    res.status(200).json({
      success: true,
      data: storeType,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete store type
exports.deleteStoreType = async (req, res) => {
  try {
    const storeType = await StoreType.findByIdAndDelete(req.params.id);

    if (!storeType) {
      return res.status(404).json({
        success: false,
        message: 'Store type not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Store type deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
