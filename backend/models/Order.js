const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
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
  orderType: {
    type: String,
    enum: ['MARKET', 'LIMIT'],
    default: 'MARKET'
  },
  side: {
    type: String,
    enum: ['BUY', 'SELL'],
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true // Exact execution price - no inflation
  },
  triggerPrice: {
    type: Number,
    default: null // Target price for LIMIT orders
  },
  stopLossPrice: {
    type: Number,
    default: null
  },
  status: {
    type: String,
    enum: ['EXECUTED', 'PENDING', 'CANCELLED', 'REJECTED'],
    default: 'EXECUTED'
  },
  charges: {
    type: Number,
    default: 0.00 // Paper trading ₹0 or nominal
  },
  realizedPnL: {
    type: Number,
    default: 0.00 // Realized P&L on sell orders
  },
  executedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

orderSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);

