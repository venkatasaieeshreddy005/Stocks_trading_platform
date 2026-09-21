const express = require('express');
const { requireAuth } = require('../middleware/auth');
const User = require('../models/User');
const Alert = require('../models/Alert');
const { getInstrument } = require('../engine/simulation');

const router = express.Router();

/**
 * GET /api/watchlist
 * Returns user's watched instruments populated with live simulated prices
 */
router.get('/', requireAuth, async (req, res) => {
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
});

/**
 * POST /api/watchlist/toggle
 * Adds or removes a symbol from user watchlist
 */
router.post('/toggle', requireAuth, async (req, res) => {
  try {
    const { symbol } = req.body;
    if (!symbol) {
      return res.status(400).json({ message: 'Symbol is required.' });
    }

    const upperSymbol = symbol.toUpperCase();
    const user = await User.findById(req.user._id);

    const index = user.watchlist.indexOf(upperSymbol);
    let isAdded = false;

    if (index > -1) {
      user.watchlist.splice(index, 1);
      isAdded = false;
    } else {
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
});

/**
 * GET /api/watchlist/alerts
 * Returns alerts relevant to user's watchlist or general market alerts
 */
router.get('/alerts', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const symbols = user.watchlist || [];

    const alerts = await Alert.find({
      $or: [
        { userId: user._id },
        { instrumentToken: { $in: symbols } },
        { userId: null }
      ]
    }).sort({ createdAt: -1 }).limit(30);

    res.json({ alerts });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch alerts.' });
  }
});

/**
 * DELETE /api/watchlist/alerts/:id
 */
router.delete('/alerts/:id', requireAuth, async (req, res) => {
  try {
    await Alert.findByIdAndDelete(req.params.id);
    res.json({ message: 'Alert dismissed.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to dismiss alert.' });
  }
});

/**
 * DELETE /api/watchlist/alerts
 */
router.delete('/alerts', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    await Alert.deleteMany({
      $or: [
        { userId: user._id },
        { instrumentToken: { $in: user.watchlist || [] } }
      ]
    });
    res.json({ message: 'All alerts cleared.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to clear alerts.' });
  }
});

module.exports = router;

