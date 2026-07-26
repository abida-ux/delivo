const Address = require('../models/Address');

// Get all saved addresses for the logged-in user
exports.getAddresses = async (req, res, next) => {
  try {
    const addresses = await Address.find({ userId: req.user.id }).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: addresses.length,
      data: addresses,
    });
  } catch (error) {
    next(error);
  }
};

// Create a new address
exports.createAddress = async (req, res, next) => {
  try {
    const { label, latitude, longitude, formattedAddress, notes, isDefault } = req.body;

    if (isDefault) {
      // Set all other addresses for this user to not default
      await Address.updateMany({ userId: req.user.id }, { isDefault: false });
    }

    const address = await Address.create({
      userId: req.user.id,
      label,
      latitude,
      longitude,
      formattedAddress,
      notes: notes || '',
      isDefault: !!isDefault,
    });

    return res.status(201).json({
      success: true,
      message: 'Address saved successfully',
      data: address,
    });
  } catch (error) {
    next(error);
  }
};

// Update an existing address
exports.updateAddress = async (req, res, next) => {
  try {
    let address = await Address.findOne({ _id: req.params.id, userId: req.user.id });
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found or unauthorized',
      });
    }

    const { label, latitude, longitude, formattedAddress, notes, isDefault } = req.body;

    if (isDefault) {
      // Set all other addresses for this user to not default
      await Address.updateMany({ userId: req.user.id }, { isDefault: false });
    }

    address.label = label || address.label;
    address.latitude = latitude !== undefined ? latitude : address.latitude;
    address.longitude = longitude !== undefined ? longitude : address.longitude;
    address.formattedAddress = formattedAddress || address.formattedAddress;
    address.notes = notes !== undefined ? notes : address.notes;
    address.isDefault = isDefault !== undefined ? !!isDefault : address.isDefault;

    await address.save();

    return res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      data: address,
    });
  } catch (error) {
    next(error);
  }
};

// Delete an address
exports.deleteAddress = async (req, res, next) => {
  try {
    const address = await Address.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found or unauthorized',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Address deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
