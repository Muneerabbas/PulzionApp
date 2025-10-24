const express = require('express');
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserPreferences,
  upload,
} = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.post('/register', upload.single('photo'), registerUser);
router.post('/login', loginUser);

// Protected routes (require authentication)
router.get('/profile', authMiddleware, getUserProfile);
router.put('/preferences', authMiddleware, updateUserPreferences);

module.exports = router;