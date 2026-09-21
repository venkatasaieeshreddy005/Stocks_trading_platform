const express = require('express');
const { requireAuth } = require('../middleware/auth');
const Order = require('../models/Order');
const Holding = require('../models/Holding');
const User = require('../models/User');
const { getInstrument } = require('../engine/simulation');

const router = express.Router();

/**
 * POST /api/trades/buy
 * Place a Buy order (Market or Limit) with strict price integrity and balance check
 */
router.post('/buy', requireAuth, async (req, res) => {
  try {
    const { symbol, quantity, orderType = 'MARKET', targetPrice, stopLossPrice, quotedPrice } = req.body;

    const qty = parseInt(quantity, 10);
    if (!symbol || isNaN(qty) || qty <= 0) {
      return res.status(400).json({ message: 'Invalid symbol or quantity. Quantity must be at least 1.' });
    }

    const instrument = getInstrument(symbol);
    if (!instrument) {
      return res.status(404).json({ message: `Instrument '${symbol}' not found in active market.` });
    }

    // Price integrity: use the quotedPrice requested by client if provided, else current market price
    const executionPrice = orderType === 'LIMIT' 
      ? parseFloat(Number(targetPrice).toFixed(2))
      : (quotedPrice && quotedPrice > 0 ? parseFloat(Number(quotedPrice).toFixed(2)) : instrument.currentPrice);

    if (isNaN(executionPrice) || executionPrice <= 0) {
      return res.status(400).json({ message: 'Invalid execution price.' });
    }

    const totalCost = parseFloat((executionPrice * qty).toFixed(2));
    const charges = 0.00; // Zero demo charges for paper trading

    const user = await User.findById(req.user._id);
    if (user.virtualCashBalance < totalCost) {
      return res.status(400).json({
        message: `Insufficient balance: Required ₹${totalCost.toLocaleString('en-IN')}, Available ₹${user.virtualCashBalance.toLocaleString('en-IN')}`,
        required: totalCost,
        available: user.virtualCashBalance
      });
    }

    if (orderType === 'LIMIT') {
      // Pending Limit Order
      // Reserve cash so it cannot be double-spent
      user.virtualCashBalance = parseFloat((user.virtualCashBalance - totalCost).toFixed(2));
      await user.save();

      const newOrder = new Order({
        userId: user._id,
        instrumentToken: instrument.symbol,
        name: instrument.name,
        orderType: 'LIMIT',
        side: 'BUY',
        quantity: qty,
        price: executionPrice,
        triggerPrice: executionPrice,
        stopLossPrice: stopLossPrice ? parseFloat(Number(stopLossPrice).toFixed(2)) : null,
        status: 'PENDING',
        charges: charges,
        realizedPnL: 0
      });
      await newOrder.save();

      return res.status(201).json({
        message: `Limit Buy order placed for ${qty} shares of ${instrument.symbol} at ₹${executionPrice}. Waiting for trigger.`,
        order: newOrder,
        newBalance: user.virtualCashBalance
      });
    }

    // MARKET ORDER: Execute immediately at exact price with zero slippage
    user.virtualCashBalance = parseFloat((user.virtualCashBalance - totalCost).toFixed(2));
    user.metrics.totalTradesExecuted += 1;
    if (stopLossPrice) {
      user.metrics.stopLossUsageCount += 1;
    }
    user.metrics.tradeTimestamps.push(new Date());

    // Update / Create Holding
    let holding = await Holding.findOne({ userId: user._id, instrumentToken: instrument.symbol });
    if (holding) {
      const oldTotal = holding.averageWeightedBuyPrice * holding.totalQuantity;
      const newTotal = executionPrice * qty;
      holding.totalQuantity += qty;
      holding.averageWeightedBuyPrice = parseFloat(((oldTotal + newTotal) / holding.totalQuantity).toFixed(2));
      if (stopLossPrice) holding.stopLossPrice = parseFloat(Number(stopLossPrice).toFixed(2));
      await holding.save();
    } else {
      holding = new Holding({
        userId: user._id,
        instrumentToken: instrument.symbol,
        name: instrument.name,
        sector: instrument.sector,
        type: instrument.type,
        totalQuantity: qty,
        averageWeightedBuyPrice: executionPrice,
        stopLossPrice: stopLossPrice ? parseFloat(Number(stopLossPrice).toFixed(2)) : null
      });
      await holding.save();
    }

    // Create Executed Order Record
    const order = new Order({
      userId: user._id,
      instrumentToken: instrument.symbol,
      name: instrument.name,
      orderType: 'MARKET',
      side: 'BUY',
      quantity: qty,
      price: executionPrice,
      stopLossPrice: stopLossPrice ? parseFloat(Number(stopLossPrice).toFixed(2)) : null,
      status: 'EXECUTED',
      charges: charges,
      realizedPnL: 0
    });
    await order.save();
    await user.save();

    res.status(201).json({
      message: `Successfully bought ${qty} ${instrument.symbol} at exact rate ₹${executionPrice}.`,
      order,
      holding,
      newBalance: user.virtualCashBalance
    });
  } catch (err) {
    console.error('Buy order error:', err);
    res.status(500).json({ message: 'Server error while executing buy order.' });
  }
});

/**
 * POST /api/trades/sell
 * Place a Sell order (Market or Limit) with exact price integrity and realized P&L computation
 */
router.post('/sell', requireAuth, async (req, res) => {
  try {
    const { symbol, quantity, orderType = 'MARKET', targetPrice, quotedPrice } = req.body;

    const qty = parseInt(quantity, 10);
    if (!symbol || isNaN(qty) || qty <= 0) {
      return res.status(400).json({ message: 'Invalid symbol or quantity.' });
    }

    const user = await User.findById(req.user._id);
    const holding = await Holding.findOne({ userId: user._id, instrumentToken: symbol.toUpperCase() });

    if (!holding || holding.totalQuantity < qty) {
      return res.status(400).json({
        message: `Insufficient holdings. You own ${holding ? holding.totalQuantity : 0} shares of ${symbol.toUpperCase()}.`
      });
    }

    const instrument = getInstrument(symbol);
    const executionPrice = orderType === 'LIMIT'
      ? parseFloat(Number(targetPrice).toFixed(2))
      : (quotedPrice && quotedPrice > 0 ? parseFloat(Number(quotedPrice).toFixed(2)) : (instrument ? instrument.currentPrice : holding.averageWeightedBuyPrice));

    if (isNaN(executionPrice) || executionPrice <= 0) {
      return res.status(400).json({ message: 'Invalid execution price.' });
    }

    if (orderType === 'LIMIT') {
      const newOrder = new Order({
        userId: user._id,
        instrumentToken: holding.instrumentToken,
        name: holding.name,
        orderType: 'LIMIT',
        side: 'SELL',
        quantity: qty,
        price: executionPrice,
        triggerPrice: executionPrice,
        status: 'PENDING',
        charges: 0
      });
      await newOrder.save();

      return res.status(201).json({
        message: `Limit Sell order placed for ${qty} shares of ${holding.instrumentToken} at ₹${executionPrice}.`,
        order: newOrder
      });
    }

    // Market Sell Execution
    const proceeds = parseFloat((executionPrice * qty).toFixed(2));
    const realizedPnL = parseFloat(((executionPrice - holding.averageWeightedBuyPrice) * qty).toFixed(2));

    user.virtualCashBalance = parseFloat((user.virtualCashBalance + proceeds).toFixed(2));
    user.metrics.totalTradesExecuted += 1;
    if (realizedPnL > 0) {
      user.metrics.profitableTradesCount += 1;
      user.experiencePoints += Math.min(100, Math.max(10, Math.floor(realizedPnL / 100)));
    }
    user.metrics.tradeTimestamps.push(new Date());

    if (holding.totalQuantity <= qty) {
      await Holding.deleteOne({ _id: holding._id });
    } else {
      holding.totalQuantity -= qty;
      await holding.save();
    }

    const order = new Order({
      userId: user._id,
      instrumentToken: holding.instrumentToken,
      name: holding.name,
      orderType: 'MARKET',
      side: 'SELL',
      quantity: qty,
      price: executionPrice,
      status: 'EXECUTED',
      charges: 0,
      realizedPnL: realizedPnL
    });
    await order.save();
    await user.save();

    res.status(201).json({
      message: `Sold ${qty} shares of ${holding.instrumentToken} at ₹${executionPrice}. Realized P&L: ₹${realizedPnL >= 0 ? '+' : ''}${realizedPnL}.`,
      order,
      realizedPnL,
      newBalance: user.virtualCashBalance
    });
  } catch (err) {
    console.error('Sell order error:', err);
    res.status(500).json({ message: 'Server error while executing sell order.' });
  }
});

/**
 * POST /api/trades/cancel/:id
 * Cancel a pending limit order
 */
router.post('/cancel/:id', requireAuth, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user._id, status: 'PENDING' });
    if (!order) {
      return res.status(404).json({ message: 'Pending order not found or already executed.' });
    }

    // If it was a buy order, release reserved funds back to user
    if (order.side === 'BUY') {
      const user = await User.findById(req.user._id);
      const refund = order.price * order.quantity;
      user.virtualCashBalance = parseFloat((user.virtualCashBalance + refund).toFixed(2));
      await user.save();
    }

    order.status = 'CANCELLED';
    await order.save();

    res.json({ message: 'Order cancelled successfully.', orderId: order._id });
  } catch (err) {
    console.error('Cancel order error:', err);
    res.status(500).json({ message: 'Server error cancelling order.' });
  }
});

/**
 * GET /api/trades/orders
 * Returns all executed and pending orders
 */
router.get('/orders', requireAuth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving order history.' });
  }
});

/**
 * GET /api/trades/stock-pnl
 * Aggregates per-stock metrics: Total Buy Qty, Avg Buy Rate, Total Sell Qty, Avg Sell Rate, and Realized P&L
 */
router.get('/stock-pnl', requireAuth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id, status: 'EXECUTED' });
    const holdings = await Holding.find({ userId: req.user._id });
    const holdingMap = new Map(holdings.map(h => [h.instrumentToken, h]));

    const stockSummary = {};

    orders.forEach(ord => {
      const sym = ord.instrumentToken;
      if (!stockSummary[sym]) {
        stockSummary[sym] = {
          symbol: sym,
          name: ord.name,
          totalBuyQty: 0,
          totalBuyAmount: 0,
          totalSellQty: 0,
          totalSellAmount: 0,
          realizedPnL: 0,
          tradesCount: 0
        };
      }

      stockSummary[sym].tradesCount += 1;

      if (ord.side === 'BUY') {
        stockSummary[sym].totalBuyQty += ord.quantity;
        stockSummary[sym].totalBuyAmount += (ord.price * ord.quantity);
      } else if (ord.side === 'SELL') {
        stockSummary[sym].totalSellQty += ord.quantity;
        stockSummary[sym].totalSellAmount += (ord.price * ord.quantity);
        stockSummary[sym].realizedPnL += (ord.realizedPnL || 0);
      }
    });

    const result = Object.values(stockSummary).map(item => {
      const avgBuyRate = item.totalBuyQty > 0 ? parseFloat((item.totalBuyAmount / item.totalBuyQty).toFixed(2)) : 0;
      const avgSellRate = item.totalSellQty > 0 ? parseFloat((item.totalSellAmount / item.totalSellQty).toFixed(2)) : 0;
      const currentHolding = holdingMap.get(item.symbol);
      const inst = getInstrument(item.symbol);

      return {
        symbol: item.symbol,
        name: item.name,
        totalBuyQty: item.totalBuyQty,
        avgBuyRate,
        totalSellQty: item.totalSellQty,
        avgSellRate,
        realizedPnL: parseFloat(item.realizedPnL.toFixed(2)),
        currentHoldingQty: currentHolding ? currentHolding.totalQuantity : 0,
        currentMarketPrice: inst ? inst.currentPrice : avgBuyRate,
        tradesCount: item.tradesCount
      };
    });

    res.json({ stocks: result });
  } catch (err) {
    console.error('Stock P&L summary error:', err);
    res.status(500).json({ message: 'Failed to calculate per-stock P&L metrics.' });
  }
});

module.exports = router;
