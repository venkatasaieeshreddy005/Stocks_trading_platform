const express = require('express');
const { requireAuth } = require('../middleware/auth');
const tradeController = require('../controllers/tradeController');

const router = express.Router();

// Order execution & management
router.post('/buy', requireAuth, tradeController.buy);
router.post('/sell', requireAuth, tradeController.sell);
router.post('/cancel/:id', requireAuth, tradeController.cancelOrder);

// Order history & Stock-wise P&L metrics
router.get('/orders', requireAuth, tradeController.getOrders);
router.get('/stock-pnl', requireAuth, tradeController.getStockPnL);

module.exports = router;
