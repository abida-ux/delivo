const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  duplicateProduct,
  bulkProductAction,
  getStores,
  createStore,
  updateStore,
  deleteStore,
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  getFlashSales,
  createFlashSale,
  updateFlashSale,
  deleteFlashSale,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getReviews,
  createReview,
  updateReview,
  deleteReview,
  getSecondHandListings,
  createSecondHandListing,
  updateSecondHandListing,
  deleteSecondHandListing,
  getMarketplaceOrders,
  createMarketplaceOrder,
  updateMarketplaceOrder,
  deleteMarketplaceOrder,
  getAdminOverview,
} = require('../controllers/marketplaceController');

/* ── Public Marketplace Routes ── */
router.get('/categories', getCategories);
router.get('/products', getProducts);
router.get('/products/:id', getProductById);
router.get('/stores', getStores);
router.get('/banners', getBanners);
router.get('/flash-sales', getFlashSales);
router.get('/coupons', getCoupons);
router.get('/reviews', getReviews);
router.get('/second-hand', getSecondHandListings);
router.post('/second-hand', createSecondHandListing);
router.get('/orders', getMarketplaceOrders);
router.post('/orders', createMarketplaceOrder);

/* ── Admin Management Routes ── */
router.get('/admin/overview', authenticate, authorizeRoles('admin'), getAdminOverview);

/* Categories */
router.post('/categories', authenticate, authorizeRoles('admin'), createCategory);
router.put('/categories/:id', authenticate, authorizeRoles('admin'), updateCategory);
router.delete('/categories/:id', authenticate, authorizeRoles('admin'), deleteCategory);

/* Products */
router.post('/products', authenticate, authorizeRoles('admin'), createProduct);
router.put('/products/:id', authenticate, authorizeRoles('admin'), updateProduct);
router.delete('/products/:id', authenticate, authorizeRoles('admin'), deleteProduct);
router.post('/products/:id/duplicate', authenticate, authorizeRoles('admin'), duplicateProduct);
router.post('/products/bulk', authenticate, authorizeRoles('admin'), bulkProductAction);

/* Stores */
router.post('/stores', authenticate, authorizeRoles('admin'), createStore);
router.put('/stores/:id', authenticate, authorizeRoles('admin'), updateStore);
router.delete('/stores/:id', authenticate, authorizeRoles('admin'), deleteStore);

/* Banners */
router.post('/banners', authenticate, authorizeRoles('admin'), createBanner);
router.put('/banners/:id', authenticate, authorizeRoles('admin'), updateBanner);
router.delete('/banners/:id', authenticate, authorizeRoles('admin'), deleteBanner);

/* Flash Sales */
router.post('/flash-sales', authenticate, authorizeRoles('admin'), createFlashSale);
router.put('/flash-sales/:id', authenticate, authorizeRoles('admin'), updateFlashSale);
router.delete('/flash-sales/:id', authenticate, authorizeRoles('admin'), deleteFlashSale);

/* Coupons */
router.post('/coupons', authenticate, authorizeRoles('admin'), createCoupon);
router.put('/coupons/:id', authenticate, authorizeRoles('admin'), updateCoupon);
router.delete('/coupons/:id', authenticate, authorizeRoles('admin'), deleteCoupon);

/* Reviews */
router.post('/reviews', createReview);
router.put('/reviews/:id', authenticate, authorizeRoles('admin'), updateReview);
router.delete('/reviews/:id', authenticate, authorizeRoles('admin'), deleteReview);

/* Second-Hand Listings Admin */
router.put('/second-hand/:id', authenticate, authorizeRoles('admin'), updateSecondHandListing);
router.delete('/second-hand/:id', authenticate, authorizeRoles('admin'), deleteSecondHandListing);

/* Marketplace Orders Admin */
router.put('/orders/:id', authenticate, authorizeRoles('admin'), updateMarketplaceOrder);
router.delete('/orders/:id', authenticate, authorizeRoles('admin'), deleteMarketplaceOrder);

module.exports = router;
