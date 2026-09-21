const mongoose = require('mongoose');

const holdingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  instrumentToken: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true
  },
  sector: {
    type: String,
    default: 'General'
  },
  type: {
    type: String,
    enum: ['Equity', 'Commodity', 'Govt Bond', 'Sovereign Gold', 'Futures', 'Options'],
    default: 'Equity'
  },
  totalQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  averageWeightedBuyPrice: {
    type: Number,
    required: true,
    min: 0
  },
  stopLossPrice: {
    type: Number,
    default: null
  },
  acquiredTimestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

holdingSchema.index({ userId: 1, instrumentToken: 1 }, { unique: true });

module.exports = mongoose.model('Holding', holdingSchema);

