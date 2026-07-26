const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');

router.get('/', getCategories);
router.post('/', authenticate, authorizeRoles('admin'), createCategory);
router.put('/:id', authenticate, authorizeRoles('admin'), updateCategory);
router.delete('/:id', authenticate, authorizeRoles('admin'), deleteCategory);

module.exports = router;
