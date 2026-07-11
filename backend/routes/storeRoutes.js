const express = require('express');
const router = express.Router();
const storeTypeController = require('../controllers/storeTypeController');
const storeController = require('../controllers/storeController');

// Store Type Routes
router.get('/types', storeTypeController.getAllStoreTypes);
router.get('/types/:id', storeTypeController.getStoreType);
router.post('/types', storeTypeController.createStoreType);
router.put('/types/:id', storeTypeController.updateStoreType);
router.delete('/types/:id', storeTypeController.deleteStoreType);

// Store Routes
router.get('/', storeController.getAllStores);
router.get('/:id', storeController.getStore);
router.post('/', storeController.createStore);
router.put('/:id', storeController.updateStore);
router.delete('/:id', storeController.deleteStore);

// Store Product Routes
router.post('/product/add', storeController.addProductToStore);
router.post('/product/remove', storeController.removeProductFromStore);

module.exports = router;
