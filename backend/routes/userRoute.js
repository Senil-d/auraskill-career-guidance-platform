const express = require('express');
const { registerUser, loginUser, getUserProfile, updateProfile } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/get-user', protect, getUserProfile);
router.put('/update-profile', protect, updateProfile);

module.exports = router;
