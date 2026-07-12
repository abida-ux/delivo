const AppSettings = require('../models/AppSettings');
const User = require('../models/User');

// Ensure a singleton app settings document exists
const getSingletonSettings = async () => {
  let settings = await AppSettings.findOne();
  if (!settings) {
    settings = await AppSettings.create({});
  }
  return settings;
};

exports.getSettings = async (req, res) => {
  try {
    const settings = await getSingletonSettings();
    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error fetching app settings:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to load app settings',
      error: error.message,
    });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can update app settings',
      });
    }

    const update = {
      deliveryFeeEnabled: req.body.deliveryFeeEnabled,
      deliveryFeeAmount: req.body.deliveryFeeAmount,
      freeDeliveryEnabled: req.body.freeDeliveryEnabled,
      freeDeliveryMinimum: req.body.freeDeliveryMinimum,
      promoNotifications: req.body.promoNotifications,
      notificationMessage: req.body.notificationMessage,
      updatedAt: Date.now(),
    };

    const settings = await AppSettings.findOneAndUpdate({}, update, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    });

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error updating app settings:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to save app settings',
      error: error.message,
    });
  }
};
