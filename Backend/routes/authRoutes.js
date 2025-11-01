const express = require('express');
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserPreferences,
  updateProfile,
  upload,
} = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { getBookmarks, addBookmark } = require('../controllers/bookmarkController');
const User = require('../models/User');
const router = express.Router();
router.post('/register', upload.single('photo'), registerUser);
router.post('/login', loginUser);
router.get('/subscribed', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('isSubscribed');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, isSubscribed: user.isSubscribed });
  } catch (err) {
    console.error('Get subscription error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
router.patch('/subscribed', authMiddleware, async (req, res) => {
  try {
    const { subscribe } = req.body; // boolean true/false
    if (typeof subscribe !== 'boolean') {
      return res.status(400).json({ success: false, message: 'subscribe must be a boolean' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { isSubscribed: subscribe } },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({
      success: true,
      message: subscribe ? 'Subscribed successfully' : 'Unsubscribed successfully',
      isSubscribed: updatedUser.isSubscribed,
    });
  } catch (err) {
    console.error('Toggle subscription error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
router.get('/profile', authMiddleware, getUserProfile);
router.put('/preferences', authMiddleware, updateUserPreferences);
router.put('/profile', authMiddleware, upload.single('photo'), updateProfile);
router.get('/bookmarks', authMiddleware, getBookmarks);
router.post('/bookmarks', authMiddleware, addBookmark);

module.exports = router;