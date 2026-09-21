const rawInstruments = require('../data/instruments');
const Order = require('../models/Order');
const Holding = require('../models/Holding');
const User = require('../models/User');
const Alert = require('../models/Alert');

// Box-Muller transform for true standard normal distribution
function randomGaussian() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// In-memory simulation state for all 140+ instruments
const marketState = new Map();

// Initialize instruments with realistic starting points and historic ticks
rawInstruments.forEach((item, index) => {
  // Give each stock a unique cycle phase and initial drift
  const initialOffsetPercent = (Math.sin(index * 0.7) * 2.5); // Between -2.5% and +2.5%
  const currentPrice = parseFloat((item.basePrice * (1 + initialOffsetPercent / 100)).toFixed(2));
  const dayHigh = Math.max(item.basePrice, currentPrice);
  const dayLow = Math.min(item.basePrice, currentPrice);
  const dailyPercentageChange = parseFloat(((currentPrice - item.basePrice) / item.basePrice * 100).toFixed(2));
  
  // Seed initial 20 sparkline points with realistic wave patterns
  const sparkline = [];
  let walk = item.basePrice;
  for (let i = 0; i < 20; i++) {
    const factor = Math.sin((i / 20) * Math.PI * 2 + index) * (item.volatility * 0.6) + (randomGaussian() * item.volatility * 0.2);
    walk = parseFloat((walk * (1 + factor / 100)).toFixed(2));
    sparkline.push(walk);
  }
  sparkline.push(currentPrice);

  marketState.set(item.symbol, {
    symbol: item.symbol,
    name: item.name,
    type: item.type,
    sector: item.sector,
    basePrice: item.basePrice,
    currentPrice: currentPrice,
    previousClose: item.basePrice,
    dayHigh: dayHigh,
    dayLow: dayLow,
    dailyPercentageChange: dailyPercentageChange,
    volatility: item.volatility,
    volume: Math.floor(100000 + Math.random() * 900000),
    cyclePhase: (index * 0.4) % (Math.PI * 2),
    cycleSpeed: 0.05 + (Math.random() * 0.05),
    sparkline: sparkline
  });
});

/**
 * Returns current snapshot of all active instruments
 */
function getMarketInstrumentsSnapshot() {
  return Array.from(marketState.values());
}

/**
 * Returns a single instrument's current simulated state
 */
function getInstrument(symbol) {
  if (!symbol) return null;
  return marketState.get(symbol.toUpperCase()) || null;
}

/**
 * Generates historical timeseries points for an instrument: 1D, 1W, 1M, 1Y
 */
function getHistoricalData(symbol, timeframe = '1D') {
  const stock = getInstrument(symbol);
  if (!stock) return [];

  const pointsCount = timeframe === '1D' ? 40 : timeframe === '1W' ? 50 : timeframe === '1M' ? 60 : 70;
  const history = [];
  const now = Date.now();
  let intervalMs;
  let volatilityMult;

  switch (timeframe) {
    case '1D':
      intervalMs = 5 * 60 * 1000; // 5 min intervals
      volatilityMult = 0.2;
      break;
    case '1W':
      intervalMs = 3 * 3600 * 1000; // 3 hr intervals
      volatilityMult = 0.6;
      break;
    case '1M':
      intervalMs = 24 * 3600 * 1000; // 1 day intervals
      volatilityMult = 1.2;
      break;
    case '1Y':
    default:
      intervalMs = 5 * 24 * 3600 * 1000; // 5 day intervals
      volatilityMult = 2.5;
      break;
  }

  // Generate realistic smooth price path using backward simulation from current price
  let current = stock.currentPrice;
  for (let i = pointsCount - 1; i >= 0; i--) {
    const timestamp = new Date(now - (i * intervalMs));
    const timeLabel = timeframe === '1D' 
      ? timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : timestamp.toLocaleDateString([], { month: 'short', day: 'numeric' });

    // Mean reverting wave + noise
    const wave = Math.sin((i / 8) * Math.PI) * (stock.volatility * volatilityMult);
    const noise = randomGaussian() * (stock.volatility * volatilityMult * 0.4);
    const price = Math.max(1, parseFloat((current * (1 - (wave + noise) / 100)).toFixed(2)));

    history.unshift({
      time: timeLabel,
      timestamp: timestamp.toISOString(),
      price: price
    });
  }

  // Ensure last point aligns with currentPrice
  if (history.length > 0) {
    history[history.length - 1].price = stock.currentPrice;
  }

  return history;
}

/**
 * Calculates Market Sentiment Index:
 * Ratio of gaining stocks vs losing stocks and net breadth
 */
function getMarketSentiment() {
  const instruments = Array.from(marketState.values());
  let up = 0;
  let down = 0;
  let neutral = 0;

  instruments.forEach(inst => {
    if (inst.dailyPercentageChange > 0.05) up++;
    else if (inst.dailyPercentageChange < -0.05) down++;
    else neutral++;
  });

  const total = instruments.length || 1;
  const ratio = (up / total) * 100;
  const netBreadth = parseFloat((((up - down) / total) * 100).toFixed(2));

  let mood = 'Neutral';
  if (ratio > 58) mood = 'Bullish';
  else if (ratio < 42) mood = 'Bearish';

  return {
    mood,
    upCount: up,
    downCount: down,
    neutralCount: neutral,
    ratio: Math.round(ratio),
    netBreadth: netBreadth > 0 ? `+${netBreadth}%` : `${netBreadth}%`
  };
}

/**
 * Calculates Top Movers: Top 5 Gainers and Top 5 Losers
 */
function getTopMovers() {
  const instruments = Array.from(marketState.values());
  const sorted = [...instruments].sort((a, b) => b.dailyPercentageChange - a.dailyPercentageChange);

  const gainers = sorted.slice(0, 5).map(s => ({
    symbol: s.symbol,
    name: s.name,
    currentPrice: s.currentPrice,
    dailyPercentageChange: s.dailyPercentageChange
  }));

  const losers = sorted.slice(-5).reverse().map(s => ({
    symbol: s.symbol,
    name: s.name,
    currentPrice: s.currentPrice,
    dailyPercentageChange: s.dailyPercentageChange
  }));

  return { gainers, losers };
}

/**
 * Calculates Sector Heatmap averages
 */
function getSectorHeatmap() {
  const sectorMap = new Map();
  marketState.forEach(inst => {
    if (!sectorMap.has(inst.sector)) {
      sectorMap.set(inst.sector, { totalChange: 0, count: 0 });
    }
    const sec = sectorMap.get(inst.sector);
    sec.totalChange += inst.dailyPercentageChange;
    sec.count += 1;
  });

  const heatmap = [];
  sectorMap.forEach((val, sectorName) => {
    const avgChange = parseFloat((val.totalChange / val.count).toFixed(2));
    heatmap.push({
      sector: sectorName,
      changePercent: avgChange,
      isPositive: avgChange >= 0
    });
  });

  return heatmap.sort((a, b) => b.changePercent - a.changePercent);
}

/**
 * Matches pending limit orders and executes stop-losses
 */
async function processLimitOrdersAndStopLosses(io) {
  try {
    // 1. Process Pending Limit Orders
    const pendingOrders = await Order.find({ status: 'PENDING' });
    for (const order of pendingOrders) {
      const stock = marketState.get(order.instrumentToken);
      if (!stock) continue;

      let shouldExecute = false;
      if (order.side === 'BUY' && stock.currentPrice <= order.triggerPrice) {
        shouldExecute = true;
      } else if (order.side === 'SELL' && stock.currentPrice >= order.triggerPrice) {
        shouldExecute = true;
      }

      if (shouldExecute) {
        const user = await User.findById(order.userId);
        if (!user) continue;

        const executionPrice = order.triggerPrice;
        order.price = executionPrice;
        order.status = 'EXECUTED';
        order.executedAt = new Date();

        if (order.side === 'BUY') {
          // Update/create holding
          let holding = await Holding.findOne({ userId: user._id, instrumentToken: order.instrumentToken });
          if (holding) {
            const oldTotalCost = holding.averageWeightedBuyPrice * holding.totalQuantity;
            const newCost = executionPrice * order.quantity;
            holding.totalQuantity += order.quantity;
            holding.averageWeightedBuyPrice = parseFloat(((oldTotalCost + newCost) / holding.totalQuantity).toFixed(2));
            if (order.stopLossPrice) holding.stopLossPrice = order.stopLossPrice;
            await holding.save();
          } else {
            holding = new Holding({
              userId: user._id,
              instrumentToken: order.instrumentToken,
              name: order.name,
              sector: stock.sector,
              type: stock.type,
              totalQuantity: order.quantity,
              averageWeightedBuyPrice: executionPrice,
              stopLossPrice: order.stopLossPrice || null
            });
            await holding.save();
          }
        } else if (order.side === 'SELL') {
          // Sell order execution
          const holding = await Holding.findOne({ userId: user._id, instrumentToken: order.instrumentToken });
          if (holding) {
            const realizedPnL = parseFloat(((executionPrice - holding.averageWeightedBuyPrice) * order.quantity).toFixed(2));
            order.realizedPnL = realizedPnL;
            user.virtualCashBalance = parseFloat((user.virtualCashBalance + (order.quantity * executionPrice)).toFixed(2));
            if (realizedPnL > 0) user.metrics.profitableTradesCount += 1;

            if (holding.totalQuantity <= order.quantity) {
              await Holding.deleteOne({ _id: holding._id });
            } else {
              holding.totalQuantity -= order.quantity;
              await holding.save();
            }
          }
        }

        user.metrics.totalTradesExecuted += 1;
        user.metrics.tradeTimestamps.push(new Date());
        await user.save();
        await order.save();

        // Send alert notification
        const alert = new Alert({
          userId: user._id,
          instrumentToken: order.instrumentToken,
          title: `Limit Order Executed: ${order.side} ${order.quantity} × ${order.instrumentToken}`,
          message: `Your limit ${order.side.toLowerCase()} order was filled at ₹${executionPrice.toLocaleString('en-IN')}`,
          type: 'PRICE_ALERT'
        });
        await alert.save();

        if (io) {
          io.to(`user_${user._id}`).emit('ORDER_EXECUTED', { order, alert });
        }
      }
    }

    // 2. Process Holdings Stop-Loss
    const holdingsWithStopLoss = await Holding.find({ stopLossPrice: { $ne: null } });
    for (const holding of holdingsWithStopLoss) {
      const stock = marketState.get(holding.instrumentToken);
      if (!stock) continue;

      if (stock.currentPrice <= holding.stopLossPrice) {
        const user = await User.findById(holding.userId);
        if (!user) continue;

        const sellPrice = stock.currentPrice;
        const totalCashBack = holding.totalQuantity * sellPrice;
        const realizedPnL = parseFloat(((sellPrice - holding.averageWeightedBuyPrice) * holding.totalQuantity).toFixed(2));

        // Create stop loss execution order
        const slOrder = new Order({
          userId: user._id,
          instrumentToken: holding.instrumentToken,
          name: holding.name,
          orderType: 'MARKET',
          side: 'SELL',
          quantity: holding.totalQuantity,
          price: sellPrice,
          status: 'EXECUTED',
          realizedPnL: realizedPnL,
          stopLossPrice: holding.stopLossPrice
        });
        await slOrder.save();

        user.virtualCashBalance = parseFloat((user.virtualCashBalance + totalCashBack).toFixed(2));
        user.metrics.totalTradesExecuted += 1;
        user.metrics.stopLossUsageCount += 1;
        if (realizedPnL > 0) user.metrics.profitableTradesCount += 1;
        user.metrics.tradeTimestamps.push(new Date());
        await user.save();

        await Holding.deleteOne({ _id: holding._id });

        const alert = new Alert({
          userId: user._id,
          instrumentToken: holding.instrumentToken,
          title: `Stop-Loss Triggered: ${holding.instrumentToken}`,
          message: `Position auto-closed at ₹${sellPrice} to protect your capital. Realized P&L: ₹${realizedPnL}`,
          type: 'PRICE_ALERT'
        });
        await alert.save();

        if (io) {
          io.to(`user_${user._id}`).emit('STOP_LOSS_TRIGGERED', { order: slOrder, alert });
        }
      }
    }
  } catch (err) {
    console.error('Error in limit order / stop loss processing loop:', err.message);
  }
}

/**
 * Autonomous real-time price simulation loop
 * Uses Geometric Brownian Motion with Mean Reversion and Cyclic Micro-waves
 */
function startSimulationLoop(io) {
  console.log('TradeZen Autonomous Market Simulation Engine Initialized with 140+ instruments.');

  let tickCounter = 0;

  setInterval(async () => {
    tickCounter++;

    // Update each instrument's price organically
    marketState.forEach(stock => {
      // 1. Advance harmonic cycle phase
      stock.cyclePhase += stock.cycleSpeed;
      if (stock.cyclePhase > Math.PI * 2) {
        stock.cyclePhase -= Math.PI * 2;
      }

      // 2. Harmonic wave factor (simulates natural support/resistance oscillations)
      const waveFactor = Math.sin(stock.cyclePhase) * (stock.volatility * 0.08);

      // 3. Mean-reverting pull towards base price (prevents unrealistic runaway divergence)
      const deviationFromBase = (stock.currentPrice - stock.basePrice) / stock.basePrice;
      const meanReversionPull = -0.05 * deviationFromBase;

      // 4. Gaussian stochastic shock (Wiener process)
      const stochasticShock = randomGaussian() * (stock.volatility * 0.18);

      // 5. Total combined delta percent
      const totalDeltaPercent = (waveFactor + meanReversionPull + stochasticShock) / 100;
      const deltaPrice = stock.currentPrice * totalDeltaPercent;

      // New price bounded and rounded
      let newPrice = stock.currentPrice + deltaPrice;
      if (newPrice <= 0.5) newPrice = 0.5; // Floor check

      newPrice = parseFloat(newPrice.toFixed(2));
      stock.currentPrice = newPrice;
      stock.dayHigh = Math.max(stock.dayHigh, newPrice);
      stock.dayLow = Math.min(stock.dayLow, newPrice);
      stock.dailyPercentageChange = parseFloat(((newPrice - stock.basePrice) / stock.basePrice * 100).toFixed(2));
      stock.volume += Math.floor(10 + Math.random() * 90);

      // Append to sparkline
      stock.sparkline.push(newPrice);
      if (stock.sparkline.length > 25) {
        stock.sparkline.shift();
      }
    });

    // Check limit orders & stop-losses
    await processLimitOrdersAndStopLosses(io);

    // Periodically generate simulated market alerts (every ~20 ticks)
    if (tickCounter % 20 === 0) {
      const allStocks = Array.from(marketState.values());
      const randomStock = allStocks[Math.floor(Math.random() * allStocks.length)];
      const alertTemplates = [
        {
          title: `${randomStock.symbol} price breakout`,
          message: `Stock surged past resistance with high volume of ${(randomStock.volume).toLocaleString('en-IN')} units.`,
          type: 'BREAKOUT'
        },
        {
          title: `${randomStock.symbol} corporate action`,
          message: `Board approved an interim dividend. Record date declared for shareholders.`,
          type: 'CORPORATE_ACTION'
        },
        {
          title: `${randomStock.symbol} volume spike`,
          message: `Unusual buying momentum detected with +${Math.abs(randomStock.dailyPercentageChange)}% intraday shift.`,
          type: 'VOLUME'
        }
      ];
      const selected = alertTemplates[Math.floor(Math.random() * alertTemplates.length)];
      
      try {
        const newAlert = new Alert({
          instrumentToken: randomStock.symbol,
          title: selected.title,
          message: selected.message,
          type: selected.type
        });
        await newAlert.save();
        io.emit('NEW_ALERT', newAlert);
      } catch (e) {
        // Silently continue
      }
    }

    // Broadcast system snapshot uniformly every 2 seconds
    const snapshot = getMarketInstrumentsSnapshot();
    const sentiment = getMarketSentiment();
    const movers = getTopMovers();
    const sectorHeatmap = getSectorHeatmap();

    io.emit('MARKET_TICK_STREAM', snapshot);
    io.emit('SENTIMENT_STREAM', sentiment);
    io.emit('MOVERS_STREAM', movers);
    io.emit('SECTOR_STREAM', sectorHeatmap);

  }, 2000);
}

module.exports = {
  marketState,
  getMarketInstrumentsSnapshot,
  getInstrument,
  getHistoricalData,
  getMarketSentiment,
  getTopMovers,
  getSectorHeatmap,
  startSimulationLoop
};

