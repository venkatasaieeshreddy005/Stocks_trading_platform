const mongoose = require('mongoose');
const Order = require('../models/Order');
const Holding = require('../models/Holding');
const User = require('../models/User');
const { getInstrument, recordExecutedTrade } = require('../engine/simulation');

const MAX_TRADE_TIMESTAMPS = 200;
const round2 = (n) => parseFloat(Number(n).toFixed(2));

/**
 * PRICE INTEGRITY (zero slippage, but no cheating):
 * The client sends the price it was looking at (`quotedPrice`). We honour it ONLY if it
 * is one of the last few ticks the server actually published. Otherwise the order is
 * rejected with 409 so the user can retry at the fresh price. This stops anyone from
 * calling the API with quotedPrice = 1 and buying everything for ₹1.
 */
const QUOTE_TICK_WINDOW = 3;

function resolveMarketPrice(instrument, quotedPrice) {
  const live = instrument.currentPrice;
  const quoted = Number(quotedPrice);

  if (!Number.isFinite(quoted) || quoted <= 0) {
    return { price: live };
  }

  const recentTicks = (instrument.sparkline || []).slice(-QUOTE_TICK_WINDOW);
  const isRecentTick = recentTicks.some((p) => Math.abs(p - quoted) < 0.005);

  if (isRecentTick) {
    return { price: round2(quoted) };
  }
  return { stale: true, livePrice: live };
}

function parseStopLoss(value) {
  if (value === undefined || value === null || value === '') return null;
  const n = round2(value);
  return Number.isFinite(n) && n > 0 ? n : NaN;
}

function userMetricsUpdate({ stopLoss = false, profitable = false, xp = 0 } = {}) {
  const inc = { 'metrics.totalTradesExecuted': 1 };
  if (stopLoss) inc['metrics.stopLossUsageCount'] = 1;
  if (profitable) inc['metrics.profitableTradesCount'] = 1;
  if (xp) inc.experiencePoints = xp;
  return {
    inc,
    push: {
      'metrics.tradeTimestamps': { $each: [new Date()], $slice: -MAX_TRADE_TIMESTAMPS }
    }
  };
}

/**
 * Buy Order (Market or Limit) with strict price integrity and market-impact recording
 */
exports.buy = async (req, res) => {
  try {
    const { symbol, quantity, orderType = 'MARKET', targetPrice, stopLossPrice, quotedPrice } = req.body || {};

    const qty = parseInt(quantity, 10);
    if (!symbol || isNaN(qty) || qty <= 0) {
      return res.status(400).json({ message: 'Invalid symbol or quantity. Quantity must be at least 1.' });
    }
    if (orderType !== 'MARKET' && orderType !== 'LIMIT') {
      return res.status(400).json({ message: 'Order type must be MARKET or LIMIT.' });
    }

    const instrument = getInstrument(symbol);
    if (!instrument) {
      return res.status(404).json({ message: `Instrument '${symbol}' not found in active market.` });
    }

    // Decide the execution price
    let executionPrice;
    if (orderType === 'LIMIT') {
      executionPrice = round2(targetPrice);
    } else {
      const resolved = resolveMarketPrice(instrument, quotedPrice);
      if (resolved.stale) {
        return res.status(409).json({
          message: `Price moved. ${instrument.symbol} is now ₹${resolved.livePrice}. Please review and place the order again.`,
          livePrice: resolved.livePrice
        });
      }
      executionPrice = resolved.price;
    }

    if (!Number.isFinite(executionPrice) || executionPrice <= 0) {
      return res.status(400).json({ message: 'Invalid execution price.' });
    }

    const stopLoss = parseStopLoss(stopLossPrice);
    if (Number.isNaN(stopLoss)) {
      return res.status(400).json({ message: 'Invalid stop-loss price.' });
    }
    if (stopLoss !== null && stopLoss >= executionPrice) {
      return res.status(400).json({
        message: `Stop-loss (₹${stopLoss}) must be below your buy price (₹${executionPrice}), otherwise it would trigger immediately.`
      });
    }

    const totalCost = round2(executionPrice * qty);
    const charges = 0.0;

    // ---- Atomic cash debit (prevents double-spending with parallel requests) ----
    const metricsUpdate = userMetricsUpdate({ stopLoss: orderType === 'MARKET' && stopLoss !== null });
    const update = { $inc: { virtualCashBalance: -totalCost } };
    if (orderType === 'MARKET') {
      update.$inc = { ...update.$inc, ...metricsUpdate.inc };
      update.$push = metricsUpdate.push;
    }

    const user = await User.findOneAndUpdate(
      { _id: req.user._id, virtualCashBalance: { $gte: totalCost - 0.005 } },
      update,
      { new: true }
    );

    if (!user) {
      const current = await User.findById(req.user._id).select('virtualCashBalance');
      const available = current ? current.virtualCashBalance : 0;
      return res.status(400).json({
        message: `Insufficient balance: Required ₹${totalCost.toLocaleString('en-IN')}, Available ₹${round2(available).toLocaleString('en-IN')}`,
        required: totalCost,
        available: round2(available)
      });
    }

    const refundCash = () =>
      User.updateOne({ _id: req.user._id }, { $inc: { virtualCashBalance: totalCost } }).catch((e) =>
        console.error('CRITICAL: failed to refund cash after failed buy:', e.message)
      );

    // ---- LIMIT: cash stays in escrow until the engine fills or the user cancels ----
    if (orderType === 'LIMIT') {
      try {
        const newOrder = await Order.create({
          userId: user._id,
          instrumentToken: instrument.symbol,
          name: instrument.name,
          orderType: 'LIMIT',
          side: 'BUY',
          quantity: qty,
          price: executionPrice,
          triggerPrice: executionPrice,
          stopLossPrice: stopLoss,
          status: 'PENDING',
          charges,
          realizedPnL: 0
        });

        return res.status(201).json({
          message: `Limit Buy order placed for ${qty} shares of ${instrument.symbol} at ₹${executionPrice}. Waiting for trigger.`,
          order: newOrder,
          newBalance: round2(user.virtualCashBalance)
        });
      } catch (err) {
        await refundCash();
        throw err;
      }
    }

    // ---- MARKET: execute immediately ----
    let holding;
    let order;
    try {
      holding = await Holding.findOne({ userId: user._id, instrumentToken: instrument.symbol });
      if (holding) {
        const oldTotal = holding.averageWeightedBuyPrice * holding.totalQuantity;
        const newTotal = executionPrice * qty;
        holding.totalQuantity += qty;
        holding.averageWeightedBuyPrice = round2((oldTotal + newTotal) / holding.totalQuantity);
        if (stopLoss !== null) holding.stopLossPrice = stopLoss;
        await holding.save();
      } else {
        holding = await Holding.create({
          userId: user._id,
          instrumentToken: instrument.symbol,
          name: instrument.name,
          sector: instrument.sector,
          type: instrument.type,
          totalQuantity: qty,
          averageWeightedBuyPrice: executionPrice,
          stopLossPrice: stopLoss
        });
      }

      order = await Order.create({
        userId: user._id,
        instrumentToken: instrument.symbol,
        name: instrument.name,
        orderType: 'MARKET',
        side: 'BUY',
        quantity: qty,
        price: executionPrice,
        stopLossPrice: stopLoss,
        status: 'EXECUTED',
        charges,
        realizedPnL: 0
      });
    } catch (err) {
      await refundCash();
      throw err;
    }

    // RECORD MARKET IMPACT: upward buying pressure
    recordExecutedTrade(instrument.symbol, 'BUY', qty, executionPrice);

    return res.status(201).json({
      message: `Successfully bought ${qty} ${instrument.symbol} at exact rate ₹${executionPrice}.`,
      order,
      holding,
      newBalance: round2(user.virtualCashBalance)
    });
  } catch (err) {
    console.error('Buy order error:', err);
    return res.status(500).json({ message: 'Server error while executing buy order.' });
  }
};

/**
 * Sell Order (Market or Limit) with exact price integrity and market-impact recording
 */
exports.sell = async (req, res) => {
  try {
    const { symbol, quantity, orderType = 'MARKET', targetPrice, quotedPrice } = req.body || {};

    const qty = parseInt(quantity, 10);
    if (!symbol || isNaN(qty) || qty <= 0) {
      return res.status(400).json({ message: 'Invalid symbol or quantity.' });
    }
    if (orderType !== 'MARKET' && orderType !== 'LIMIT') {
      return res.status(400).json({ message: 'Order type must be MARKET or LIMIT.' });
    }

    const upperSymbol = String(symbol).toUpperCase();
    const holding = await Holding.findOne({ userId: req.user._id, instrumentToken: upperSymbol });

    if (!holding || holding.totalQuantity < qty) {
      return res.status(400).json({
        message: `Insufficient holdings. You own ${holding ? holding.totalQuantity : 0} shares of ${upperSymbol}.`
      });
    }

    const instrument = getInstrument(upperSymbol);

    let executionPrice;
    if (orderType === 'LIMIT') {
      executionPrice = round2(targetPrice);
    } else {
      if (!instrument) {
        return res.status(404).json({ message: `Instrument '${upperSymbol}' not found in active market.` });
      }
      const resolved = resolveMarketPrice(instrument, quotedPrice);
      if (resolved.stale) {
        return res.status(409).json({
          message: `Price moved. ${instrument.symbol} is now ₹${resolved.livePrice}. Please review and place the order again.`,
          livePrice: resolved.livePrice
        });
      }
      executionPrice = resolved.price;
    }

    if (!Number.isFinite(executionPrice) || executionPrice <= 0) {
      return res.status(400).json({ message: 'Invalid execution price.' });
    }

    // ---- LIMIT: queue it, the engine fills it when price reaches the target ----
    if (orderType === 'LIMIT') {
      const newOrder = await Order.create({
        userId: req.user._id,
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

      return res.status(201).json({
        message: `Limit Sell order placed for ${qty} shares of ${holding.instrumentToken} at ₹${executionPrice}.`,
        order: newOrder
      });
    }

    // ---- MARKET SELL ----
    const proceeds = round2(executionPrice * qty);
    const realizedPnL = round2((executionPrice - holding.averageWeightedBuyPrice) * qty);

    // Atomically take the shares out (prevents selling the same shares twice in parallel)
    const updatedHolding = await Holding.findOneAndUpdate(
      { _id: holding._id, totalQuantity: { $gte: qty } },
      { $inc: { totalQuantity: -qty } },
      { new: true }
    );
    if (!updatedHolding) {
      return res.status(400).json({ message: 'Insufficient holdings. Your position changed, please refresh.' });
    }
    if (updatedHolding.totalQuantity <= 0) {
      await Holding.deleteOne({ _id: updatedHolding._id });
    }

    const xp = realizedPnL > 0 ? Math.min(100, Math.max(10, Math.floor(realizedPnL / 100))) : 0;
    const metricsUpdate = userMetricsUpdate({ profitable: realizedPnL > 0, xp });
    metricsUpdate.inc.virtualCashBalance = proceeds;

    const user = await User.findOneAndUpdate(
      { _id: req.user._id },
      { $inc: metricsUpdate.inc, $push: metricsUpdate.push },
      { new: true }
    );

    const order = await Order.create({
      userId: req.user._id,
      instrumentToken: holding.instrumentToken,
      name: holding.name,
      orderType: 'MARKET',
      side: 'SELL',
      quantity: qty,
      price: executionPrice,
      status: 'EXECUTED',
      charges: 0,
      realizedPnL
    });

    // RECORD MARKET IMPACT: downward selling pressure
    recordExecutedTrade(holding.instrumentToken, 'SELL', qty, executionPrice);

    return res.status(201).json({
      message: `Sold ${qty} shares of ${holding.instrumentToken} at ₹${executionPrice}. Realized P&L: ₹${realizedPnL >= 0 ? '+' : ''}${realizedPnL}.`,
      order,
      realizedPnL,
      newBalance: round2(user.virtualCashBalance)
    });
  } catch (err) {
    console.error('Sell order error:', err);
    return res.status(500).json({ message: 'Server error while executing sell order.' });
  }
};

/**
 * Cancel Pending Limit Order
 * The order is "claimed" atomically first, so it cannot be cancelled AND filled by the engine.
 */
exports.cancelOrder = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Pending order not found or already executed.' });
    }

    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, status: 'PENDING' },
      { $set: { status: 'CANCELLED' } },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Pending order not found or already executed.' });
    }

    let newBalance;
    if (order.side === 'BUY') {
      const refund = round2(order.price * order.quantity);
      const user = await User.findOneAndUpdate(
        { _id: req.user._id },
        { $inc: { virtualCashBalance: refund } },
        { new: true }
      );
      newBalance = user ? round2(user.virtualCashBalance) : undefined;
    }

    return res.json({ message: 'Order cancelled successfully.', orderId: order._id, newBalance });
  } catch (err) {
    console.error('Cancel order error:', err);
    return res.status(500).json({ message: 'Server error cancelling order.' });
  }
};

/**
 * Get User Orders
 */
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(500);
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving order history.' });
  }
};

/**
 * Get Per-Stock P&L breakdown
 */
exports.getStockPnL = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id, status: 'EXECUTED' });
    const holdings = await Holding.find({ userId: req.user._id });
    const holdingMap = new Map(holdings.map((h) => [h.instrumentToken, h]));

    const stockSummary = {};

    orders.forEach((ord) => {
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
        stockSummary[sym].totalBuyAmount += ord.price * ord.quantity;
      } else if (ord.side === 'SELL') {
        stockSummary[sym].totalSellQty += ord.quantity;
        stockSummary[sym].totalSellAmount += ord.price * ord.quantity;
        stockSummary[sym].realizedPnL += ord.realizedPnL || 0;
      }
    });

    const result = Object.values(stockSummary).map((item) => {
      const avgBuyRate = item.totalBuyQty > 0 ? round2(item.totalBuyAmount / item.totalBuyQty) : 0;
      const avgSellRate = item.totalSellQty > 0 ? round2(item.totalSellAmount / item.totalSellQty) : 0;
      const currentHolding = holdingMap.get(item.symbol);
      const inst = getInstrument(item.symbol);

      return {
        symbol: item.symbol,
        name: item.name,
        totalBuyQty: item.totalBuyQty,
        avgBuyRate,
        totalSellQty: item.totalSellQty,
        avgSellRate,
        realizedPnL: round2(item.realizedPnL),
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
};