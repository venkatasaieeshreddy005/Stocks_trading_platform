const rawInstruments = require('../data/instruments');
const Order = require('../models/Order');
const Holding = require('../models/Holding');
const User = require('../models/User');
const Alert = require('../models/Alert');

const TICK_INTERVAL_MS = 2000;
const SPARKLINE_LENGTH = 25;
const MAX_TICK_IMPACT_PERCENT = 0.005;
const ALERT_EVERY_N_TICKS = 250;
const MAX_TRADE_TIMESTAMPS = 200;

const round2 = (n) => parseFloat(Number(n).toFixed(2));

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function randomGaussian(rng = Math.random) {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function todayKey() {
  return new Date().toDateString();
}

const marketState = new Map();
const orderPressure = new Map();

let lastDayKey = todayKey();
let simulationHandle = null;

function recordExecutedTrade(symbol, side, quantity, price) {
  if (!symbol || !quantity || !price) return;
  const sym = String(symbol).toUpperCase();

  if (!orderPressure.has(sym)) {
    orderPressure.set(sym, {
      buyVolume: 0,
      sellVolume: 0,
      buyValue: 0,
      sellValue: 0,
      buyCount: 0,
      sellCount: 0
    });
  }

  const p = orderPressure.get(sym);
  const tradeVal = quantity * price;

  if (side === 'BUY') {
    p.buyVolume += quantity;
    p.buyValue += tradeVal;
    p.buyCount += 1;
  } else if (side === 'SELL') {
    p.sellVolume += quantity;
    p.sellValue += tradeVal;
    p.sellCount += 1;
  }
}

rawInstruments.forEach((item, index) => {
  const symbol = String(item.symbol).toUpperCase();
  const initialOffsetPercent = Math.sin(index * 0.7) * 2.5;
  const currentPrice = round2(item.basePrice * (1 + initialOffsetPercent / 100));
  const dayHigh = Math.max(item.basePrice, currentPrice);
  const dayLow = Math.min(item.basePrice, currentPrice);
  const dailyPercentageChange = round2(((currentPrice - item.basePrice) / item.basePrice) * 100);

  const sparkline = [currentPrice];
  let walk = currentPrice;
  for (let i = 0; i < SPARKLINE_LENGTH - 1; i++) {
    const factor =
      Math.sin((i / 20) * Math.PI * 2 + index) * (item.volatility * 0.6) +
      randomGaussian() * item.volatility * 0.2;
    walk = round2(Math.max(0.5, walk * (1 - factor / 100)));
    sparkline.unshift(walk);
  }

  marketState.set(symbol, {
    symbol,
    name: item.name,
    type: item.type,
    sector: item.sector,
    basePrice: item.basePrice,
    currentPrice,
    previousClose: item.basePrice,
    dayHigh,
    dayLow,
    dailyPercentageChange,
    volatility: item.volatility,
    volume: Math.floor(100000 + Math.random() * 900000),
    cyclePhase: (index * 0.4) % (Math.PI * 2),
    cycleSpeed: 0.05 + Math.random() * 0.05,
    sparkline
  });
});

function getMarketInstrumentsSnapshot() {
  return Array.from(marketState.values());
}

function getInstrument(symbol) {
  if (!symbol) return null;
  return marketState.get(String(symbol).toUpperCase()) || null;
}

function getHistoricalData(symbol, timeframe = '1D') {
  const stock = getInstrument(symbol);
  if (!stock) return [];

  let pointsCount;
  let intervalMs;
  let volatilityMult;

  switch (timeframe) {
    case '1D':
      pointsCount = 78;
      intervalMs = 5 * 60 * 1000;
      volatilityMult = 0.2;
      break;
    case '1W':
      pointsCount = 56;
      intervalMs = 3 * 3600 * 1000;
      volatilityMult = 0.6;
      break;
    case '1M':
      pointsCount = 30;
      intervalMs = 24 * 3600 * 1000;
      volatilityMult = 1.2;
      break;
    case '1Y':
    default:
      timeframe = '1Y';
      pointsCount = 73;
      intervalMs = 5 * 24 * 3600 * 1000;
      volatilityMult = 2.5;
      break;
  }

  const rng = mulberry32(hashString(`${stock.symbol}:${timeframe}`));
  const prices = new Array(pointsCount);
  prices[pointsCount - 1] = stock.currentPrice;

  for (let i = pointsCount - 2; i >= 0; i--) {
    const stepsFromEnd = pointsCount - 1 - i;
    const wave = Math.sin((stepsFromEnd / 8) * Math.PI) * (stock.volatility * volatilityMult * 0.3);
    const noise = randomGaussian(rng) * (stock.volatility * volatilityMult * 0.4);
    let p = prices[i + 1] * (1 - (wave + noise) / 100);
    p += (stock.basePrice - p) * 0.02;
    prices[i] = Math.max(1, round2(p));
  }

  const now = Date.now();
  const history = [];
  for (let i = 0; i < pointsCount; i++) {
    const timestamp = new Date(now - (pointsCount - 1 - i) * intervalMs);
    const timeLabel =
      timeframe === '1D'
        ? timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : timestamp.toLocaleDateString([], { month: 'short', day: 'numeric' });

    history.push({
      time: timeLabel,
      timestamp: timestamp.toISOString(),
      price: prices[i]
    });
  }

  return history;
}

function getMarketSentiment() {
  const instruments = Array.from(marketState.values());
  let up = 0;
  let down = 0;
  let neutral = 0;

  instruments.forEach((inst) => {
    if (inst.dailyPercentageChange > 0.05) up++;
    else if (inst.dailyPercentageChange < -0.05) down++;
    else neutral++;
  });

  const total = instruments.length || 1;
  const ratio = (up / total) * 100;
  const netBreadth = round2(((up - down) / total) * 100);

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

function getTopMovers() {
  const instruments = Array.from(marketState.values());
  const sorted = [...instruments].sort((a, b) => b.dailyPercentageChange - a.dailyPercentageChange);

  const pick = (s) => ({
    symbol: s.symbol,
    name: s.name,
    currentPrice: s.currentPrice,
    dailyPercentageChange: s.dailyPercentageChange
  });

  const gainers = sorted.slice(0, 5).map(pick);
  const losers = sorted.slice(-5).reverse().map(pick);

  return { gainers, losers };
}

function getSectorHeatmap() {
  const sectorMap = new Map();
  marketState.forEach((inst) => {
    if (!sectorMap.has(inst.sector)) {
      sectorMap.set(inst.sector, { totalChange: 0, count: 0 });
    }
    const sec = sectorMap.get(inst.sector);
    sec.totalChange += inst.dailyPercentageChange;
    sec.count += 1;
  });

  const heatmap = [];
  sectorMap.forEach((val, sectorName) => {
    const avgChange = round2(val.totalChange / val.count);
    heatmap.push({
      sector: sectorName,
      changePercent: avgChange,
      isPositive: avgChange >= 0
    });
  });

  return heatmap.sort((a, b) => b.changePercent - a.changePercent);
}

async function applyTradeToUser(userId, { cashDelta = 0, profitable = false, stopLoss = false }) {
  const inc = { 'metrics.totalTradesExecuted': 1 };
  if (cashDelta) inc.virtualCashBalance = round2(cashDelta);
  if (profitable) inc['metrics.profitableTradesCount'] = 1;
  if (stopLoss) inc['metrics.stopLossUsageCount'] = 1;

  await User.updateOne(
    { _id: userId },
    {
      $inc: inc,$push: {
        'metrics.tradeTimestamps': { $each: [new Date()],$slice: -MAX_TRADE_TIMESTAMPS }
      }
    }
  );
}

async function createAndEmitAlert(io, userId, instrumentToken, title, message, type, eventName, extra = {}) {
  const alert = new Alert({ userId, instrumentToken, title, message, type });
  await alert.save();
  if (io) {
    io.to(`user_${userId}`).emit(eventName, { ...extra, alert });
  }
  return alert;
}

async function cancelOrder(io, order, reason) {
  const res = await Order.updateOne({ _id: order._id, status: 'PENDING' }, { $set: { status: 'CANCELLED' } });
  if (!res.modifiedCount) return;

  try {
    await createAndEmitAlert(
      io,
      order.userId,
      order.instrumentToken,
      `Order Cancelled: ${order.side} ${order.quantity} × ${order.instrumentToken}`,
      reason,
      'PRICE_ALERT',
      'ORDER_CANCELLED',
      { orderId: order._id }
    );
  } catch (err) {
    console.error('Failed to send cancellation alert:', err.message);
  }
}

async function processPendingOrder(order, io) {
  const symbol = String(order.instrumentToken).toUpperCase();
  const stock = marketState.get(symbol);
  if (!stock) return;
  if (!Number.isFinite(order.triggerPrice)) return;

  const isBuy = order.side === 'BUY';
  const isSell = order.side === 'SELL';
  if (!isBuy && !isSell) return;

  const shouldExecute = isBuy
    ? stock.currentPrice <= order.triggerPrice
    : stock.currentPrice >= order.triggerPrice;
  if (!shouldExecute) return;

  const userExists = await User.exists({ _id: order.userId });
  if (!userExists) return;

  const executionPrice = round2(
    isBuy ? Math.min(stock.currentPrice, order.triggerPrice) : Math.max(stock.currentPrice, order.triggerPrice)
  );

  let sellHolding = null;
  let realizedPnL = 0;
  if (isSell) {
    sellHolding = await Holding.findOne({ userId: order.userId, instrumentToken: symbol });
    if (!sellHolding || sellHolding.totalQuantity < order.quantity) {
      await cancelOrder(io, order, 'Insufficient holdings to fill this sell order.');
      return;
    }
    realizedPnL = round2((executionPrice - sellHolding.averageWeightedBuyPrice) * order.quantity);
  }

  const claimUpdate = { status: 'EXECUTED', price: executionPrice, executedAt: new Date() };
  if (isSell) claimUpdate.realizedPnL = realizedPnL;

  const claimed = await Order.findOneAndUpdate(
    { _id: order._id, status: 'PENDING' },
    { $set: claimUpdate },
    { new: true }
  );
  if (!claimed) return;

  if (isBuy) {
    let holding = await Holding.findOne({ userId: order.userId, instrumentToken: symbol });
    if (holding) {
      const oldTotalCost = holding.averageWeightedBuyPrice * holding.totalQuantity;
      const newCost = executionPrice * order.quantity;
      holding.totalQuantity += order.quantity;
      holding.averageWeightedBuyPrice = round2((oldTotalCost + newCost) / holding.totalQuantity);
      if (order.stopLossPrice) holding.stopLossPrice = order.stopLossPrice;
      await holding.save();
    } else {
      holding = new Holding({
        userId: order.userId,
        instrumentToken: symbol,
        name: order.name || stock.name,
        sector: stock.sector,
        type: stock.type,
        totalQuantity: order.quantity,
        averageWeightedBuyPrice: executionPrice,
        stopLossPrice: order.stopLossPrice || null
      });
      await holding.save();
    }
  } else {
    const updated = await Holding.findOneAndUpdate(
      { _id: sellHolding._id, totalQuantity: { $gte: order.quantity } },
      { $inc: { totalQuantity: -order.quantity } },
      { new: true }
    );

    if (!updated) {
      await Order.updateOne({ _id: order._id }, { $set: { status: 'CANCELLED' },$unset: { realizedPnL: '' } });
      return;
    }
    if (updated.totalQuantity <= 0) {
      await Holding.deleteOne({ _id: updated._id });
    }
  }

  await applyTradeToUser(order.userId, {
    cashDelta: isSell ? order.quantity * executionPrice : 0,
    profitable: isSell && realizedPnL > 0
  });

  recordExecutedTrade(symbol, order.side, order.quantity, executionPrice);

  try {
    await createAndEmitAlert(
      io,
      order.userId,
      symbol,
      `Limit Order Executed: ${order.side} ${order.quantity} × ${symbol}`,
      `Your limit ${order.side.toLowerCase()} order was filled at ₹${executionPrice.toLocaleString('en-IN')}`,
      'PRICE_ALERT',
      'ORDER_EXECUTED',
      { order: claimed }
    );
  } catch (err) {
    console.error('Order executed but alert failed:', err.message);
  }
}

async function processStopLoss(holding, io) {
  const symbol = String(holding.instrumentToken).toUpperCase();
  const stock = marketState.get(symbol);
  if (!stock) return;
  if (!Number.isFinite(holding.stopLossPrice) || holding.stopLossPrice <= 0) return;
  if (stock.currentPrice > holding.stopLossPrice) return;

  const userExists = await User.exists({ _id: holding.userId });
  if (!userExists) return;

  const closed = await Holding.findOneAndDelete({
    _id: holding._id,
    stopLossPrice: { $gte: stock.currentPrice }
  });
  if (!closed) return;

  const sellPrice = stock.currentPrice;
  const totalCashBack = closed.totalQuantity * sellPrice;
  const realizedPnL = round2((sellPrice - closed.averageWeightedBuyPrice) * closed.totalQuantity);

  const slOrder = new Order({
    userId: closed.userId,
    instrumentToken: symbol,
    name: closed.name,
    orderType: 'MARKET',
    side: 'SELL',
    quantity: closed.totalQuantity,
    price: sellPrice,
    status: 'EXECUTED',
    realizedPnL,
    stopLossPrice: closed.stopLossPrice
  });
  await slOrder.save();

  await applyTradeToUser(closed.userId, {
    cashDelta: totalCashBack,
    profitable: realizedPnL > 0,
    stopLoss: true
  });

  await Order.updateMany(
    { userId: closed.userId, instrumentToken: symbol, side: 'SELL', status: 'PENDING' },
    { $set: { status: 'CANCELLED' } }
  );

  recordExecutedTrade(symbol, 'SELL', closed.totalQuantity, sellPrice);

  try {
    await createAndEmitAlert(
      io,
      closed.userId,
      symbol,
      `Stop-Loss Triggered: ${symbol}`,
      `Position auto-closed at ₹${sellPrice} to protect your capital. Realized P&L: ₹${realizedPnL}`,
      'PRICE_ALERT',
      'STOP_LOSS_TRIGGERED',
      { order: slOrder }
    );
  } catch (err) {
    console.error('Stop-loss executed but alert failed:', err.message);
  }
}

async function processLimitOrdersAndStopLosses(io) {
  let pendingOrders = [];
  try {
    pendingOrders = await Order.find({ status: 'PENDING' });
  } catch (err) {
    console.error('Error loading pending orders:', err.message);
  }

  for (const order of pendingOrders) {
    try {
      await processPendingOrder(order, io);
    } catch (err) {
      console.error(`Error processing order ${order._id}:`, err.message);
    }
  }

  let holdingsWithStopLoss = [];
  try {
    holdingsWithStopLoss = await Holding.find({ stopLossPrice: { $ne: null } });
  } catch (err) {
    console.error('Error loading stop-loss holdings:', err.message);
  }

  for (const holding of holdingsWithStopLoss) {
    try {
      await processStopLoss(holding, io);
    } catch (err) {
      console.error(`Error processing stop-loss for holding ${holding._id}:`, err.message);
    }
  }
}

function updatePrices() {
  const currentDay = todayKey();
  if (currentDay !== lastDayKey) {
    lastDayKey = currentDay;
    marketState.forEach((stock) => {
      stock.dayHigh = stock.currentPrice;
      stock.dayLow = stock.currentPrice;
      stock.previousClose = stock.currentPrice;
    });
  }

  marketState.forEach((stock) => {
    stock.cyclePhase += stock.cycleSpeed;
    if (stock.cyclePhase > Math.PI * 2) {
      stock.cyclePhase -= Math.PI * 2;
    }

    const waveFactor = Math.sin(stock.cyclePhase) * (stock.volatility * 0.08);
    const deviationFromBase = (stock.currentPrice - stock.basePrice) / stock.basePrice;
    const meanReversionPull = -0.05 * deviationFromBase * 100;
    const stochasticShock = randomGaussian() * (stock.volatility * 0.18);

    const organicDeltaPercent = (waveFactor + meanReversionPull + stochasticShock) / 100;
    const organicDeltaPrice = stock.currentPrice * organicDeltaPercent;

    let impactDeltaPrice = 0;
    const pressure = orderPressure.get(stock.symbol);

    if (pressure && (pressure.buyValue > 0 || pressure.sellValue > 0)) {
      const nominalLiquidity = Math.max(stock.currentPrice * 4000, 400000);
      const netValueImbalance = pressure.buyValue - pressure.sellValue;

      if (netValueImbalance !== 0) {
        let impactPercent = (netValueImbalance / nominalLiquidity) * 0.004;
        impactPercent = Math.max(-MAX_TICK_IMPACT_PERCENT, Math.min(MAX_TICK_IMPACT_PERCENT, impactPercent));
        impactDeltaPrice = stock.currentPrice * impactPercent;
      }

      pressure.buyValue *= 0.5;
      pressure.sellValue *= 0.5;
      pressure.buyVolume = Math.floor(pressure.buyVolume * 0.5);
      pressure.sellVolume = Math.floor(pressure.sellVolume * 0.5);

      if (pressure.buyValue < 5 && pressure.sellValue < 5) {
        pressure.buyValue = 0;
        pressure.sellValue = 0;
        pressure.buyVolume = 0;
        pressure.sellVolume = 0;
        pressure.buyCount = 0;
        pressure.sellCount = 0;
      }
    }

    let newPrice = stock.currentPrice + organicDeltaPrice + impactDeltaPrice;
    if (newPrice <= 0.5) newPrice = 0.5;

    newPrice = round2(newPrice);
    stock.currentPrice = newPrice;
    stock.dayHigh = Math.max(stock.dayHigh, newPrice);
    stock.dayLow = Math.min(stock.dayLow, newPrice);
    stock.dailyPercentageChange = round2(((newPrice - stock.basePrice) / stock.basePrice) * 100);
    stock.volume += Math.floor(10 + Math.random() * 90);

    stock.sparkline.push(newPrice);
    if (stock.sparkline.length > SPARKLINE_LENGTH) {
      stock.sparkline.shift();
    }
  });
}

async function generateWatchlistAlerts(io) {
  const usersWithWatchlist = await User.find({ 'watchlist.0': { $exists: true } }).select('_id watchlist');

  const watchedSymbolSet = new Set();
  usersWithWatchlist.forEach((u) => {
    (u.watchlist || []).forEach((sym) => watchedSymbolSet.add(String(sym).toUpperCase()));
  });

  const watchedSymbols = Array.from(watchedSymbolSet);
  if (watchedSymbols.length === 0) return;

  const chosenSymbol = watchedSymbols[Math.floor(Math.random() * watchedSymbols.length)];
  const stock = marketState.get(chosenSymbol);
  if (!stock) return;

  const change = stock.dailyPercentageChange;
  const templates = [];

  if (change > 0) {
    templates.push({
      title: `${stock.symbol} price breakout`,
      message: `Watched stock ${stock.symbol} is up ${change}% today on volume of ${stock.volume.toLocaleString('en-IN')} units.`,
      type: 'BREAKOUT'
    });
  } else {
    templates.push({
      title: `${stock.symbol} under pressure`,
      message: `Watched stock ${stock.symbol} is down ${Math.abs(change)}% today.`,
      type: 'PRICE_ALERT'
    });
  }

  templates.push({
    title: `${stock.symbol} volume spike`,
    message: `Heavy trading in ${stock.symbol}: ${stock.volume.toLocaleString('en-IN')} units traded, ${change > 0 ? '+' : ''}${change}% move.`,
    type: 'VOLUME'
  });

  const selected = templates[Math.floor(Math.random() * templates.length)];

  const targetUsers = usersWithWatchlist.filter((u) =>
    (u.watchlist || []).some((s) => String(s).toUpperCase() === chosenSymbol)
  );

  for (const u of targetUsers) {
    try {
      const newAlert = new Alert({
        userId: u._id,
        instrumentToken: stock.symbol,
        title: selected.title,
        message: selected.message,
        type: selected.type
      });
      await newAlert.save();

      if (io) {
        io.to(`user_${u._id}`).emit('NEW_ALERT', newAlert);
      }
    } catch (err) {
      console.error(`Failed to create watchlist alert for user ${u._id}:`, err.message);
    }
  }
}

function broadcast(io) {
  if (!io) return;
  io.emit('MARKET_TICK_STREAM', getMarketInstrumentsSnapshot());
  io.emit('SENTIMENT_STREAM', getMarketSentiment());
  io.emit('MOVERS_STREAM', getTopMovers());
  io.emit('SECTOR_STREAM', getSectorHeatmap());
}

function startSimulationLoop(io) {
  if (simulationHandle) {
    console.warn('TradeZen simulation loop already running; ignoring duplicate start.');
    return simulationHandle;
  }

  console.log(`TradeZen Autonomous Market Simulation Engine Initialized with ${marketState.size} instruments.`);

  let tickCounter = 0;
  let running = false;

  simulationHandle = setInterval(async () => {
    if (running) return;
    running = true;

    try {
      tickCounter++;

      updatePrices();

      await processLimitOrdersAndStopLosses(io);

      if (tickCounter % ALERT_EVERY_N_TICKS === 0) {
        try {
          await generateWatchlistAlerts(io);
        } catch (err) {
          console.error('Error in watchlisted alerts runner:', err.message);
        }
      }

      broadcast(io);
    } catch (err) {
      console.error('Simulation tick failed:', err.message);
    } finally {
      running = false;
    }
  }, TICK_INTERVAL_MS);

  return simulationHandle;
}

function stopSimulationLoop() {
  if (simulationHandle) {
    clearInterval(simulationHandle);
    simulationHandle = null;
  }
}

module.exports = {
  marketState,
  orderPressure,
  recordExecutedTrade,
  getMarketInstrumentsSnapshot,
  getInstrument,
  getHistoricalData,
  getMarketSentiment,
  getTopMovers,
  getSectorHeatmap,
  startSimulationLoop,
  stopSimulationLoop
};