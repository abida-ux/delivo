const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');
const controller = require('../controllers/scheduledAnnouncementController');

router.use(authenticate, authorizeRoles('admin'));
router.get('/', controller.list);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.patch('/:id/toggle', controller.toggle);
router.delete('/:id', controller.remove);

module.exports = router;