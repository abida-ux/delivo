const MarketplaceCategory = require('../models/MarketplaceCategory');
const MarketplaceProduct = require('../models/MarketplaceProduct');

const normalizeProduct = (product) => {
  if (!product) return null;
  const price = Number(product.price || 0);
  const discount = Number(product.discount || 0);
  const finalPrice = price - discount;
  return {
    ...product.toObject ? product.toObject() : product,
    finalPrice: Math.max(0, finalPrice),
  };
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await MarketplaceCategory.find({ isActive: true }).sort({ sortOrder: 1, createdAt: 1 });
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

exports.getProducts = async (req, res) => {
  try {
    const { categoryType, category, search, featured, page = 1, limit = 12 } = req.query;
    const filter = { isActive: true };

    if (categoryType) filter.categoryType = categoryType;
    if (category) filter.category = category;
    if (featured === 'true') filter.featured = true;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
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
    const payload = {
      ...req.body,
      slug: req.body.slug || req.body.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      image: req.body.image || req.body.images?.[0] || '',
    };
    const product = await MarketplaceProduct.create(payload);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (payload.name && !payload.slug) {
      payload.slug = payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
    if (payload.images?.length && !payload.image) payload.image = payload.images[0];
    const product = await MarketplaceProduct.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.status(200).json({ success: true, data: product });
  } catch (error) {
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

exports.getAdminOverview = async (req, res) => {
  try {
    const [categories, products, lowStockProducts] = await Promise.all([
      MarketplaceCategory.countDocuments({ isActive: true }),
      MarketplaceProduct.countDocuments({ isActive: true }),
      MarketplaceProduct.find({ stock: { $lte: 5 }, isActive: true }).limit(8).sort({ stock: 1 }),
    ]);

    res.status(200).json({ success: true, data: { categories, products, lowStockProducts } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
