const mongoose = require('mongoose');
const User = require('../models/User');
const Alert = require('../models/Alert');
const { getInstrument } = require('../engine/simulation');

const MAX_WATCHLIST_SIZE = 50;

/**
 * Alerts visible to a user:
 *  - alerts addressed to that user (order fills, stop-loss, their watchlist alerts)
 *  - broadcast alerts (userId = null) for symbols on their watchlist
 * Alerts that belong to OTHER users are never returned.
 */
function buildAlertFilter(user) {
  const symbols = user.watchlist || [];
  const conditions = [{ userId: user._id }];
  if (symbols.length > 0) {
    conditions.push({ userId: null, instrumentToken: { $in: symbols } });
  }
  return { $or: conditions };
}

/**
 * GET /api/watchlist
 * Returns user's watched instruments populated with live simulated prices
 */
exports.getWatchlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const symbols = user.watchlist || [];

    const watchlistItems = symbols.map(sym => {
      const stock = getInstrument(sym);
      if (!stock) return null;
      return {
        symbol: stock.symbol,
        name: stock.name,
        type: stock.type,
        sector: stock.sector,
        currentPrice: stock.currentPrice,
        dailyPercentageChange: stock.dailyPercentageChange,
        dayHigh: stock.dayHigh,
        dayLow: stock.dayLow,
        sparkline: stock.sparkline
      };
    }).filter(Boolean);

    res.json({ watchlist: watchlistItems });
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve watchlist.' });
  }
};

/**
 * POST /api/watchlist/toggle
 * Adds or removes a symbol from user watchlist
 */
exports.toggleWatchlist = async (req, res) => {
  try {
    const { symbol } = req.body || {};
    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({ message: 'Symbol is required.' });
    }

    const upperSymbol = symbol.trim().toUpperCase();
    if (!getInstrument(upperSymbol)) {
      return res.status(404).json({ message: `Instrument '${upperSymbol}' not found.` });
    }

    const user = await User.findById(req.user._id);

    if (!user.watchlist) {
      user.watchlist = [];
    }

    const index = user.watchlist.indexOf(upperSymbol);
    let isAdded = false;

    if (index > -1) {
      user.watchlist.splice(index, 1);
      isAdded = false;
    } else {
      if (user.watchlist.length >= MAX_WATCHLIST_SIZE) {
        return res.status(400).json({ message: `Watchlist is full (max ${MAX_WATCHLIST_SIZE} instruments).` });
      }
      user.watchlist.push(upperSymbol);
      isAdded = true;
    }

    await user.save();

    res.json({
      message: isAdded ? `Added ${upperSymbol} to watchlist.` : `Removed ${upperSymbol} from watchlist.`,
      isAdded,
      watchlist: user.watchlist
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to toggle watchlist.' });
  }
};

/**
 * GET /api/watchlist/alerts
 * Strictly filtered to the user's personal alerts and broadcast alerts for their watchlist
 */
exports.getAlerts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const alerts = await Alert.find(buildAlertFilter(user))
      .sort({ createdAt: -1 })
      .limit(30);

    res.json({ alerts });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch alerts.' });
  }
};

/**
 * DELETE /api/watchlist/alerts/:id
 * A user can only dismiss their OWN alerts.
 */
exports.dismissAlert = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Alert not found.' });
    }

    const deleted = await Alert.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!deleted) {
      return res.status(404).json({ message: 'Alert not found.' });
    }

    res.json({ message: 'Alert dismissed.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to dismiss alert.' });
  }
};

/**
 * DELETE /api/watchlist/alerts
 * Clears only the current user's own alerts (shared broadcast alerts are left for others).
 */
exports.clearAlerts = async (req, res) => {
  try {
    await Alert.deleteMany({ userId: req.user._id });
    res.json({ message: 'All alerts cleared.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to clear alerts.' });
  }
};