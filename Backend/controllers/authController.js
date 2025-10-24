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
    const { categories, emailNotifications } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (categories) {
      user.preferences.categories = categories;
    }

    if (emailNotifications !== undefined) {
      user.preferences.emailNotifications = emailNotifications;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      user: user.getPublicProfile(),
    });
  } catch (err) {
    console.error('Update preferences error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserPreferences,
  upload,
};