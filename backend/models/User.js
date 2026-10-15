const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    select: false // never returned by default; login uses .select('+password')
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },

  // 6-digit email verification code (stored hashed, with expiry + attempt limit)
  emailVerification: {
    codeHash: { type: String, default: null },
    expiresAt: { type: Date, default: null },
    attempts: { type: Number, default: 0 }
  },

  // 6-digit password reset code (stored hashed, with expiry + attempt limit)
  passwordReset: {
    codeHash: { type: String, default: null },
    expiresAt: { type: Date, default: null },
    attempts: { type: Number, default: 0 }
  },

  virtualCashBalance: {
    type: Number,
    default: 50000.00 // Default initial ₹50,000 demo capital
  },
  experiencePoints: {
    type: Number,
    default: 100
  },
  currentDisciplineLevel: {
    type: Number,
    default: 1
  },
  metrics: {
    totalTradesExecuted: {
      type: Number,
      default: 0
    },
    profitableTradesCount: {
      type: Number,
      default: 0
    },
    stopLossUsageCount: {
      type: Number,
      default: 0
    },
    tradeTimestamps: {
      type: [Date],
      default: []
    }
  },
  watchlist: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

// Password hashing middleware
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  this.password = await bcryptjs.hash(this.password, 10);
});

// Password comparison method (document must be loaded with .select('+password'))
userSchema.methods.comparePassword = async function (password) {
  return await bcryptjs.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);