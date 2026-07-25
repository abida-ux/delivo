const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');
const storeTypeController = require('../controllers/storeTypeController');
const storeController = require('../controllers/storeController');

// Store Type Routes
router.get('/types', storeTypeController.getAllStoreTypes);
router.get('/types/:id', storeTypeController.getStoreType);
router.post('/types', authenticate, authorizeRoles('admin'), storeTypeController.createStoreType);
router.put('/types/:id', authenticate, authorizeRoles('admin'), storeTypeController.updateStoreType);
router.delete('/types/:id', authenticate, authorizeRoles('admin'), storeTypeController.deleteStoreType);

// Store Routes
router.get('/', storeController.getAllStores);
router.get('/:id', storeController.getStore);
router.post('/', authenticate, authorizeRoles('admin'), storeController.createStore);
router.put('/:id', authenticate, authorizeRoles('admin'), storeController.updateStore);
router.delete('/:id', authenticate, authorizeRoles('admin'), storeController.deleteStore);

// Store Product Routes
router.post('/product/add', authenticate, authorizeRoles('admin'), storeController.addProductToStore);
router.post('/product/remove', authenticate, authorizeRoles('admin'), storeController.removeProductFromStore);

module.exports = router;
