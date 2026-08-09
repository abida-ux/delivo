const FoodFlashSale = require('../models/FoodFlashSale');
const Food = require('../models/Food');

// Create Flash Sale
exports.createFlashSale = async (req, res) => {
  try {
    const { title, description, startAt, endAt, items } = req.body;

    if (!title || !startAt || !endAt || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields or items list is empty',
      });
    }

    const startDate = new Date(startAt);
    const endDate = new Date(endAt);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid start date/time or end date/time',
      });
    }

    if (endDate <= startDate) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time',
      });
    }

    // Validate items
    const validatedItems = [];
    const foodIdsSeen = new Set();

    for (const item of items) {
      if (!item.foodId || item.originalPrice === undefined || item.salePrice === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Each item must include foodId, originalPrice, and salePrice',
        });
      }

      if (foodIdsSeen.has(item.foodId.toString())) {
        return res.status(400).json({
          success: false,
          message: 'Duplicate food selection detected',
        });
      }
      foodIdsSeen.add(item.foodId.toString());

      const originalPrice = Number(item.originalPrice);
      const salePrice = Number(item.salePrice);

      if (isNaN(originalPrice) || isNaN(salePrice) || originalPrice < 0 || salePrice < 0) {
        return res.status(400).json({
          success: false,
          message: 'Prices must be non-negative numbers',
        });
      }

      if (salePrice >= originalPrice) {
        return res.status(400).json({
          success: false,
          message: 'Sale price must be strictly less than the original price',
        });
      }

      // Check if food exists
      const food = await Food.findById(item.foodId);
      if (!food) {
        return res.status(400).json({
          success: false,
          message: `Food item with ID ${item.foodId} not found`,
        });
      }

      validatedItems.push({
        foodId: item.foodId,
        originalPrice,
        salePrice,
      });
    }

    const newSale = await FoodFlashSale.create({
      title,
      description,
      startAt: startDate,
      endAt: endDate,
      items: validatedItems,
      createdBy: req.user?._id,
    });

    return res.status(201).json({
      success: true,
      data: newSale,
    });
  } catch (error) {
    console.error('Error creating food flash sale:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create flash sale',
    });
  }
};

// Get Flash Sales (Admin, filtered by status)
exports.getFlashSales = async (req, res) => {
  try {
    const { status } = req.query;
    const now = new Date();
    let query = {};

    if (status === 'active') {
      query.startAt = { $lte: now };
      query.endAt = { $gt: now };
    } else if (status === 'upcoming') {
      query.startAt = { $gt: now };
    } else if (status === 'expired') {
      query.endAt = { $lte: now };
    }

    const sales = await FoodFlashSale.find(query)
      .populate({
        path: 'items.foodId',
        select: 'name price image restaurant restaurants defaultAvailability isAvailable',
        populate: {
          path: 'restaurant',
          select: 'name isOpen',
        }
      })
      .sort({ startAt: -1 });

    return res.status(200).json({
      success: true,
      data: sales,
    });
  } catch (error) {
    console.error('Error fetching food flash sales:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch flash sales',
    });
  }
};

// Update Flash Sale
exports.updateFlashSale = async (req, res) => {
  try {
    const { title, description, startAt, endAt, items } = req.body;
    const { id } = req.params;

    const sale = await FoodFlashSale.findById(id);
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Flash sale not found',
      });
    }

    const startDate = startAt ? new Date(startAt) : new Date(sale.startAt);
    const endDate = endAt ? new Date(endAt) : new Date(sale.endAt);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid start date/time or end date/time',
      });
    }

    if (endDate <= startDate) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time',
      });
    }

    let validatedItems = sale.items;
    if (items) {
      if (!Array.isArray(items)) {
        return res.status(400).json({
          success: false,
          message: 'Items must be an array',
        });
      }

      validatedItems = [];
      const foodIdsSeen = new Set();

      for (const item of items) {
        if (!item.foodId || item.originalPrice === undefined || item.salePrice === undefined) {
          return res.status(400).json({
            success: false,
            message: 'Each item must include foodId, originalPrice, and salePrice',
          });
        }

        if (foodIdsSeen.has(item.foodId.toString())) {
          return res.status(400).json({
            success: false,
            message: 'Duplicate food selection detected',
          });
        }
        foodIdsSeen.add(item.foodId.toString());

        const originalPrice = Number(item.originalPrice);
        const salePrice = Number(item.salePrice);

        if (isNaN(originalPrice) || isNaN(salePrice) || originalPrice < 0 || salePrice < 0) {
          return res.status(400).json({
            success: false,
            message: 'Prices must be non-negative numbers',
          });
        }

        if (salePrice >= originalPrice) {
          return res.status(400).json({
            success: false,
            message: 'Sale price must be strictly less than the original price',
          });
        }

        const food = await Food.findById(item.foodId);
        if (!food) {
          return res.status(400).json({
            success: false,
            message: `Food item with ID ${item.foodId} not found`,
          });
        }

        validatedItems.push({
          foodId: item.foodId,
          originalPrice,
          salePrice,
        });
      }
    }

    sale.title = title || sale.title;
    sale.description = description !== undefined ? description : sale.description;
    sale.startAt = startDate;
    sale.endAt = endDate;
    sale.items = validatedItems;

    await sale.save();

    return res.status(200).json({
      success: true,
      data: sale,
    });
  } catch (error) {
    console.error('Error updating food flash sale:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update flash sale',
    });
  }
};

// Delete Flash Sale
exports.deleteFlashSale = async (req, res) => {
  try {
    const sale = await FoodFlashSale.findByIdAndDelete(req.params.id);
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Flash sale not found',
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Flash sale deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting food flash sale:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete flash sale',
    });
  }
};

// Get Active Flash Sales (Public customer homepage)
exports.getActiveFlashSales = async (req, res) => {
  try {
    const now = new Date();
    console.log(`[FlashSale API] Querying active sales at: ${now.toISOString()}`);
    
    const activeSales = await FoodFlashSale.find({
      startAt: { $lte: now },
      endAt: { $gt: now },
    }).populate({
      path: 'items.foodId',
      select: 'name price image restaurant restaurants defaultAvailability isAvailable rating numReviews category',
      populate: {
        path: 'restaurant',
        select: 'name isOpen',
      }
    });

    console.log(`[FlashSale API] Found ${activeSales.length} active sales.`);
    activeSales.forEach(s => {
      console.log(` - Sale: "${s.title}" (Start: ${s.startAt.toISOString()} | End: ${s.endAt.toISOString()})`);
    });

    // Safely filter out null/deleted food references
    const activeDeals = [];
    activeSales.forEach(sale => {
      sale.items.forEach(item => {
        if (item.foodId) {
          activeDeals.push({
            _id: item.foodId._id,
            name: item.foodId.name,
            image: item.foodId.image,
            category: item.foodId.category,
            restaurant: item.foodId.restaurant,
            restaurants: item.foodId.restaurants,
            rating: item.foodId.rating,
            numReviews: item.foodId.numReviews,
            originalPrice: item.originalPrice,
            price: item.salePrice,
            isAvailable: item.foodId.isAvailable && item.foodId.defaultAvailability,
            flashSaleEnd: sale.endAt,
            flashSaleId: sale._id,
          });
        } else {
          console.warn(`[FlashSale API] Item foodId reference is null or deleted in sale: ${sale._id}`);
        }
      });
    });

    console.log(`[FlashSale API] Returning ${activeDeals.length} active deal items.`);

    const nearestUpcoming = await FoodFlashSale.findOne({
      startAt: { $gt: now }
    }).sort({ startAt: 1 });

    return res.status(200).json({
      success: true,
      data: activeDeals,
      upcoming: nearestUpcoming ? {
        title: nearestUpcoming.title,
        startAt: nearestUpcoming.startAt,
        endAt: nearestUpcoming.endAt,
      } : null
    });
  } catch (error) {
    console.error('Error fetching active food flash sales:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch active flash sales',
    });
  }
};
