const mongoose = require('mongoose');

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
    required: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationCode: {
    type: String,
    default: null
  },
  emailVerificationExpires: {
    type: Date,
    default: null
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
    default: [] // EMPTY by default - stocks added ONLY if user explicitly stars them
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  lastResetRequestTime: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
