const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Null if broadcast to all watching
  },
  instrumentToken: {
    type: String,
    required: true,
    uppercase: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['BREAKOUT', 'VOLUME', 'EARNINGS', 'CORPORATE_ACTION', 'PRICE_ALERT'],
    default: 'BREAKOUT'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Alert', alertSchema);

