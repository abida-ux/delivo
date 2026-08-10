const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');
const { getAdminLogs } = require('../controllers/adminLogController');

router.get('/', authenticate, authorizeRoles('admin'), getAdminLogs);

module.exports = router;
