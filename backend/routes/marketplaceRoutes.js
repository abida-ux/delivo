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
  getAdminOverview,
} = require('../controllers/marketplaceController');

router.get('/categories', getCategories);
router.post('/categories', authenticate, authorizeRoles('admin'), createCategory);
router.put('/categories/:id', authenticate, authorizeRoles('admin'), updateCategory);
router.delete('/categories/:id', authenticate, authorizeRoles('admin'), deleteCategory);

router.get('/products', getProducts);
router.get('/products/:id', getProductById);
router.get('/admin/overview', authenticate, authorizeRoles('admin'), getAdminOverview);
router.post('/products', authenticate, authorizeRoles('admin'), createProduct);
router.put('/products/:id', authenticate, authorizeRoles('admin'), updateProduct);
router.delete('/products/:id', authenticate, authorizeRoles('admin'), deleteProduct);

module.exports = router;
