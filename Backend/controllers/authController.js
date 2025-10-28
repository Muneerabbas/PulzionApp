const User = require('../models/User');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'user-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const generateToken = (userId) => {
  return jwt.sign(
    { user: { id: userId } },
    process.env.JWT_SECRET,
    { expiresIn: '30d' } 
  );
};

const validateRegisterInput = (username, email, password) => {
  const errors = [];

  if (!username || username.trim().length < 3) {
    errors.push('Username must be at least 3 characters long');
  }

  if (!email || !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
    errors.push('Please provide a valid email address');
  }

  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  return errors;
};

const registerUser = async (req, res) => {
  const { username, email, password } = req.body;
  const photo = req.file ? req.file.path : null;

  try {
    const validationErrors = validateRegisterInput(username, email, password);
    if (validationErrors.length > 0) {
      if (photo && fs.existsSync(photo)) {
        fs.unlinkSync(photo);
      }
      return res.status(400).json({
        success: false,
        errors: validationErrors,
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });

    if (existingUser) {
      if (photo && fs.existsSync(photo)) {
        fs.unlinkSync(photo);
      }

      if (existingUser.email === email.toLowerCase()) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered',
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Username already taken',
        });
      }
    }

      const user = new User({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      passwordHash: password,
      photo,
    });

    await user.save();

    const token = generateToken(user._id);

    const userProfile = user.getPublicProfile();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: userProfile,
    });
  } catch (err) {
    console.error('Register error:', err);

    if (photo && fs.existsSync(photo)) {
      fs.unlinkSync(photo);
    }

    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        errors,
      });
    }

    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during registration',
    });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      isActive: true,
    }).select('+passwordHash');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Get public profile
    const userProfile = user.getPublicProfile();

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userProfile,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
    });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      user: user.getPublicProfile(),
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// Update user preferences
const updateUserPreferences = async (req, res) => {
  try {
    const { preferences } = req.body;
    const userId = req.user.id;

    // Validate preferences
    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid preferences format',
      });
    }

    // Update only the preferences that are provided
    const updateData = {};
    
    if (preferences.categories && Array.isArray(preferences.categories)) {
      updateData['preferences.categories'] = preferences.categories;
    }
    
    if (typeof preferences.emailNotifications === 'boolean') {
      updateData['preferences.emailNotifications'] = preferences.emailNotifications;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      user: updatedUser.getPublicProfile(),
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating preferences',
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  const { username, email, currentPassword, newPassword } = req.body;
  const userId = req.user.id;
  const photo = req.file ? req.file.path : null;

  try {
    // Find the user
    const user = await User.findById(userId).select('+passwordHash');
    if (!user) {
      // Clean up uploaded file if user not found
      if (photo && fs.existsSync(photo)) {
        fs.unlinkSync(photo);
      }
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Object to store updates
    const updates = {};
    const errors = [];

    // Validate and update username if provided
    if (username && username !== user.username) {
      if (username.length < 3) {
        errors.push('Username must be at least 3 characters long');
      } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        errors.push('Username can only contain letters, numbers, and underscores');
      } else {
        // Check if username is already taken
        const existingUser = await User.findOne({ username });
        if (existingUser && existingUser._id.toString() !== userId) {
          errors.push('Username is already taken');
        } else {
          updates.username = username.trim();
        }
      }
    }

    // Validate and update email if provided
    if (email && email !== user.email) {
      if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
        errors.push('Please provide a valid email address');
      } else {
        // Check if email is already registered
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser && existingUser._id.toString() !== userId) {
          errors.push('Email is already registered');
        } else {
          updates.email = email.toLowerCase().trim();
        }
      }
    }

    // Handle password change if currentPassword and newPassword are provided
    if (currentPassword && newPassword) {
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        errors.push('Current password is incorrect');
      } else if (newPassword.length < 6) {
        errors.push('New password must be at least 6 characters long');
      } else {
        updates.passwordHash = newPassword;
      }
    } else if ((currentPassword && !newPassword) || (!currentPassword && newPassword)) {
      errors.push('Both current password and new password are required to change password');
    }

    // Update photo if provided
    if (photo) {
      // Delete old photo if it exists
      if (user.photo && fs.existsSync(user.photo)) {
        try {
          fs.unlinkSync(user.photo);
        } catch (err) {
          console.error('Error deleting old profile photo:', err);
        }
      }
      updates.photo = photo;
    }

    // Return errors if any
    if (errors.length > 0) {
      // Clean up uploaded file if there are errors
      if (photo && fs.existsSync(photo)) {
        fs.unlinkSync(photo);
      }
      return res.status(400).json({
        success: false,
        errors,
      });
    }

    // If no updates, return current user data
    if (Object.keys(updates).length === 0) {
      return res.json({
        success: true,
        message: 'No changes detected',
        user: user.getPublicProfile(),
      });
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    // Get updated user profile
    const userProfile = updatedUser.getPublicProfile();

    // Generate new token if email or password was changed
    let token;
    if (updates.email || updates.passwordHash) {
      token = generateToken(updatedUser._id);
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: userProfile,
      ...(token && { token }), // Include new token if generated
    });
  } catch (error) {
    console.error('Update profile error:', error);
    
    // Clean up uploaded file if there's an error
    if (photo && fs.existsSync(photo)) {
      fs.unlinkSync(photo);
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        errors,
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating profile',
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserPreferences,
  updateProfile,
  upload,
};