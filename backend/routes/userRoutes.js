const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  deleteUser,
  createUser,
} = require('../controllers/userController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/', createUser);
router.get('/', getAllUsers);
router.get('/:id', getUserProfile);
router.put('/:id', updateUserProfile);
router.delete('/:id', deleteUser);

module.exports = router;
