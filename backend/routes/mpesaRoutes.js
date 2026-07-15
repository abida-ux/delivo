const express = require('express');
const router = express.Router();
const { handleMpesaStkPush, handleMpesaCallback, handleMpesaStatus } = require('../controllers/mpesaController');

router.post('/stk-push', handleMpesaStkPush);
router.post('/callback', handleMpesaCallback);
router.get('/status', handleMpesaStatus);

module.exports = router;
