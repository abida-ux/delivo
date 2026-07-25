const Offer = require('../models/Offer');
const User = require('../models/User');

// Get all active offers
exports.getOffers = async (req, res) => {
  try {
    const offers = await Offer.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: offers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve offers',
      error: error.message,
    });
  }
};

// Create a new offer (Admin only)
exports.createOffer = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Admin access required',
      });
    }

    const { code, title, description, discount, minOrder, expiry } = req.body;

    if (!code || !title || !description || !discount || !expiry) {
      return res.status(400).json({
        success: false,
        message: 'All fields (code, title, description, discount, expiry) are required',
      });
    }

    // Check if code already exists
    const existingOffer = await Offer.findOne({ code: code.toUpperCase() });
    if (existingOffer) {
      return res.status(400).json({
        success: false,
        message: `An offer with code ${code.toUpperCase()} already exists`,
      });
    }

    const offer = await Offer.create({
      code: code.toUpperCase(),
      title,
      description,
      discount,
      minOrder: minOrder || 'KSh 0',
      expiry,
    });

    res.status(201).json({
      success: true,
      message: 'Offer created successfully',
      data: offer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create offer',
      error: error.message,
    });
  }
};

// Delete an offer (Admin only)
exports.deleteOffer = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Admin access required',
      });
    }

    const { id } = req.params;
    const offer = await Offer.findByIdAndDelete(id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Offer deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete offer',
      error: error.message,
    });
  }
};
