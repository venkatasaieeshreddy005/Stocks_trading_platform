const User = require('../models/User');
const Alert = require('../models/Alert');
const { getInstrument } = require('../engine/simulation');

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
    const { symbol } = req.body;
    if (!symbol) {
      return res.status(400).json({ message: 'Symbol is required.' });
    }

    const upperSymbol = symbol.toUpperCase();
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
 * Strictly filtered to user's personal alerts and watchlisted stocks only
 */
exports.getAlerts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const symbols = user.watchlist || [];

    // Filter condition: user's personal order notifications OR alerts for stocks in their watchlist
    const queryConditions = [{ userId: user._id }];
    if (symbols.length > 0) {
      queryConditions.push({ instrumentToken: { $in: symbols } });
    }

    const alerts = await Alert.find({
      $or: queryConditions
    }).sort({ createdAt: -1 }).limit(30);

    res.json({ alerts });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch alerts.' });
  }
};

/**
 * DELETE /api/watchlist/alerts/:id
 */
exports.dismissAlert = async (req, res) => {
  try {
    await Alert.findByIdAndDelete(req.params.id);
    res.json({ message: 'Alert dismissed.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to dismiss alert.' });
  }
};

/**
 * DELETE /api/watchlist/alerts
 */
exports.clearAlerts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const symbols = user.watchlist || [];

    const deleteConditions = [{ userId: user._id }];
    if (symbols.length > 0) {
      deleteConditions.push({ instrumentToken: { $in: symbols } });
    }

    await Alert.deleteMany({
      $or: deleteConditions
    });

    res.json({ message: 'All alerts cleared.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to clear alerts.' });
  }
};
