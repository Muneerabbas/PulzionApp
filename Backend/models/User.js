const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters long'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false,
    },
    photo: {
      type: String,
      default: null,
    },
    bookmarks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Article',
      },
    ],
    preferences: {
      categories: {
        type: [String],
        default: ['general'],
      },
      emailNotifications: {
        type: Boolean,
        default: false,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    isSubscribed: {   
      type: Boolean,            
      default: false,             
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  try {
    return await bcrypt.compare(enteredPassword, this.passwordHash);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

userSchema.methods.getPublicProfile = function () {
  return {
    _id: this._id,
    username: this.username,
    email: this.email,
    photo: this.photo,
    preferences: this.preferences,
    isSubscribed: this.isSubscribed, 
    createdAt: this.createdAt,
    lastLogin: this.lastLogin,
  };
};

userSchema.statics.findByCredentials = async function (email, password) {
  const user = await this.findOne({ email, isActive: true }).select('+passwordHash');
  
  if (!user) throw new Error('Invalid credentials');

  const isMatch = await user.matchPassword(password);
  if (!isMatch) throw new Error('Invalid credentials');

  return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
