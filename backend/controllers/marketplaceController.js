const MarketplaceCategory = require('../models/MarketplaceCategory');
const MarketplaceProduct = require('../models/MarketplaceProduct');
const MarketplaceStore = require('../models/MarketplaceStore');
const MarketplaceBanner = require('../models/MarketplaceBanner');
const MarketplaceFlashSale = require('../models/MarketplaceFlashSale');
const MarketplaceCoupon = require('../models/MarketplaceCoupon');
const MarketplaceReview = require('../models/MarketplaceReview');
const SecondHandListing = require('../models/SecondHandListing');
const MarketplaceOrder = require('../models/MarketplaceOrder');
const { normalizeMarketplaceProductPayload } = require('../utils/marketplacePayload');

const normalizeProduct = (product) => {
  if (!product) return null;
  const p = product.toObject ? product.toObject() : product;
  const price = Number(p.price || 0);
  const discount = Number(p.discount || p.discountPrice || 0);
  const finalPrice = discount > 0 ? (price > discount ? price - discount : discount) : price;
  return {
    ...p,
    finalPrice: Math.max(0, finalPrice),
  };
};

/* ── CATEGORIES ── */
exports.getCategories = async (req, res) => {
  try {
    const { includeInactive } = req.query;
    const filter = includeInactive === 'true' ? {} : { isActive: true };
    const categories = await MarketplaceCategory.find(filter).sort({ sortOrder: 1, createdAt: 1 });
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      slug: req.body.slug || req.body.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    };
    const category = await MarketplaceCategory.create(payload);
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    console.error('createCategory error', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (payload.name && !payload.slug) {
      payload.slug = payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
    const category = await MarketplaceCategory.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    res.status(200).json({ success: true, data: category });
  } catch (error) {
    console.error('updateCategory error', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    await MarketplaceCategory.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ── PRODUCTS ── */
exports.getProducts = async (req, res) => {
  try {
    const {
      categoryType,
      category,
      search,
      featured,
      trending,
      flashSale,
      bestSeller,
      newArrival,
      includeInactive,
      page = 1,
      limit = 24,
    } = req.query;

    const filter = {};
    if (includeInactive !== 'true') filter.isActive = true;
    if (categoryType) filter.categoryType = categoryType;
    if (category) filter.category = category;
    if (featured === 'true') filter.featured = true;
    if (trending === 'true') filter.trending = true;
    if (flashSale === 'true') filter.flashSale = true;
    if (bestSeller === 'true') filter.bestSeller = true;
    if (newArrival === 'true') filter.newArrival = true;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { store: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await MarketplaceProduct.countDocuments(filter);
    const products = await MarketplaceProduct.find(filter)
      .populate('category')
      .sort({ featured: -1, createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.status(200).json({ success: true, count: total, data: products.map(normalizeProduct) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await MarketplaceProduct.findById(req.params.id).populate('category');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.status(200).json({ success: true, data: normalizeProduct(product) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const catType = req.body.categoryType || 'supermarket';
    let matchingCategory = null;
    if (req.body.category) {
      matchingCategory = await MarketplaceCategory.findById(req.body.category);
    }
    if (!matchingCategory && req.body.categoryType) {
      matchingCategory = await MarketplaceCategory.findOne({ categoryType: req.body.categoryType });
    }
    if (!matchingCategory) {
      matchingCategory = await MarketplaceCategory.findOne({ isActive: true });
    }
    if (!matchingCategory) {
      matchingCategory = await MarketplaceCategory.create({
        name: catType.charAt(0).toUpperCase() + catType.slice(1),
        slug: catType,
        categoryType: catType,
        icon: '🛍️',
        isActive: true,
      });
    }

    const payload = normalizeMarketplaceProductPayload({
      ...req.body,
      slug: req.body.slug || req.body.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      image: req.body.image || req.body.images?.[0] || '',
      category: matchingCategory._id,
      categoryType: catType,
    }, matchingCategory);

    const product = await MarketplaceProduct.create(payload);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    console.error('createProduct error', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const catType = req.body.categoryType || 'supermarket';
    let matchingCategory = null;
    if (req.body.category) {
      matchingCategory = await MarketplaceCategory.findById(req.body.category);
    }
    if (!matchingCategory && req.body.categoryType) {
      matchingCategory = await MarketplaceCategory.findOne({ categoryType: req.body.categoryType });
    }
    if (!matchingCategory) {
      matchingCategory = await MarketplaceCategory.findOne({ isActive: true });
    }

    const payload = normalizeMarketplaceProductPayload({
      ...req.body,
      slug: req.body.slug || req.body.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      image: req.body.image || req.body.images?.[0] || '',
      category: matchingCategory?._id,
      categoryType: catType,
    }, matchingCategory);

    if (payload.images?.length && !payload.image) payload.image = payload.images[0];
    const product = await MarketplaceProduct.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    console.error('updateProduct error', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    await MarketplaceProduct.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.duplicateProduct = async (req, res) => {
  try {
    const existing = await MarketplaceProduct.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Product not found' });
    const obj = existing.toObject();
    delete obj._id;
    delete obj.createdAt;
    delete obj.updatedAt;
    obj.name = `${obj.name} (Copy)`;
    obj.slug = `${obj.slug}-copy-${Date.now()}`;
    const copy = await MarketplaceProduct.create(obj);
    res.status(201).json({ success: true, data: copy });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.bulkProductAction = async (req, res) => {
  try {
    const { ids, action } = req.body;
    if (!Array.isArray(ids) || !ids.length) {
      return res.status(400).json({ success: false, message: 'No product IDs provided' });
    }
    if (action === 'delete') {
      await MarketplaceProduct.deleteMany({ _id: { $in: ids } });
    } else if (action === 'publish') {
      await MarketplaceProduct.updateMany({ _id: { $in: ids } }, { isActive: true });
    } else if (action === 'unpublish') {
      await MarketplaceProduct.updateMany({ _id: { $in: ids } }, { isActive: false });
    }
    res.status(200).json({ success: true, message: `Bulk action '${action}' completed successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ── STORES ── */
exports.getStores = async (req, res) => {
  try {
    const stores = await MarketplaceStore.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: stores });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createStore = async (req, res) => {
  try {
    const store = await MarketplaceStore.create(req.body);
    res.status(201).json({ success: true, data: store });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateStore = async (req, res) => {
  try {
    const store = await MarketplaceStore.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, data: store });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteStore = async (req, res) => {
  try {
    await MarketplaceStore.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Store deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ── BANNERS ── */
exports.getBanners = async (req, res) => {
  try {
    const { includeDisabled } = req.query;
    const filter = includeDisabled === 'true' ? {} : { enable: true };
    const banners = await MarketplaceBanner.find(filter).sort({ displayOrder: 1, createdAt: -1 });
    res.status(200).json({ success: true, data: banners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createBanner = async (req, res) => {
  try {
    const banner = await MarketplaceBanner.create(req.body);
    res.status(201).json({ success: true, data: banner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateBanner = async (req, res) => {
  try {
    const banner = await MarketplaceBanner.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, data: banner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteBanner = async (req, res) => {
  try {
    await MarketplaceBanner.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Banner deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ── FLASH SALES ── */
exports.getFlashSales = async (req, res) => {
  try {
    const sales = await MarketplaceFlashSale.find().populate('products').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: sales });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createFlashSale = async (req, res) => {
  try {
    const sale = await MarketplaceFlashSale.create(req.body);
    res.status(201).json({ success: true, data: sale });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateFlashSale = async (req, res) => {
  try {
    const sale = await MarketplaceFlashSale.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, data: sale });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteFlashSale = async (req, res) => {
  try {
    await MarketplaceFlashSale.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Flash sale deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ── COUPONS ── */
exports.getCoupons = async (req, res) => {
  try {
    const coupons = await MarketplaceCoupon.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createCoupon = async (req, res) => {
  try {
    const coupon = await MarketplaceCoupon.create(req.body);
    res.status(201).json({ success: true, data: coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCoupon = async (req, res) => {
  try {
    const coupon = await MarketplaceCoupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, data: coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteCoupon = async (req, res) => {
  try {
    await MarketplaceCoupon.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Coupon deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ── REVIEWS ── */
exports.getReviews = async (req, res) => {
  try {
    const reviews = await MarketplaceReview.find().populate('product').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createReview = async (req, res) => {
  try {
    const review = await MarketplaceReview.create(req.body);
    res.status(201).json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const review = await MarketplaceReview.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    await MarketplaceReview.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Review deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ── SECOND-HAND LISTINGS ── */
exports.getSecondHandListings = async (req, res) => {
  try {
    const { status, approvalStatus, search } = req.query;
    const filter = {};
    if (approvalStatus) filter.approvalStatus = approvalStatus;
    if (status) filter.listingStatus = status;
    if (search) {
      filter.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { seller: { $regex: search, $options: 'i' } },
      ];
    }
    const listings = await SecondHandListing.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: listings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createSecondHandListing = async (req, res) => {
  try {
    const listing = await SecondHandListing.create(req.body);
    res.status(201).json({ success: true, data: listing });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateSecondHandListing = async (req, res) => {
  try {
    const listing = await SecondHandListing.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, data: listing });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteSecondHandListing = async (req, res) => {
  try {
    await SecondHandListing.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Second-hand listing deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ── MARKETPLACE ORDERS ── */
exports.getMarketplaceOrders = async (req, res) => {
  try {
    const orders = await MarketplaceOrder.find().populate('items.product').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createMarketplaceOrder = async (req, res) => {
  try {
    const count = await MarketplaceOrder.countDocuments();
    const orderNumber = `MKT-${Date.now().toString().slice(-6)}-${count + 1}`;
    const order = await MarketplaceOrder.create({
      ...req.body,
      orderNumber,
    });
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateMarketplaceOrder = async (req, res) => {
  try {
    const order = await MarketplaceOrder.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteMarketplaceOrder = async (req, res) => {
  try {
    await MarketplaceOrder.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Marketplace order deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ── ADMIN OVERVIEW ── */
exports.getAdminOverview = async (req, res) => {
  try {
    const [
      categoriesCount,
      productsCount,
      storesCount,
      ordersCount,
      secondHandPending,
      bannersCount,
    ] = await Promise.all([
      MarketplaceCategory.countDocuments({ isActive: true }),
      MarketplaceProduct.countDocuments({ isActive: true }),
      MarketplaceStore.countDocuments(),
      MarketplaceOrder.countDocuments(),
      SecondHandListing.countDocuments({ approvalStatus: 'pending' }),
      MarketplaceBanner.countDocuments({ enable: true }),
    ]);

    const recentOrders = await MarketplaceOrder.find().limit(5).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        categories: categoriesCount,
        products: productsCount,
        stores: storesCount,
        orders: ordersCount,
        secondHandPending,
        banners: bannersCount,
        recentOrders,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
