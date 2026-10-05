const {
  getMarketInstrumentsSnapshot,
  getInstrument,
  getHistoricalData,
  getMarketSentiment,
  getTopMovers,
  getSectorHeatmap
} = require('../engine/simulation');

/**
 * GET /api/markets/instruments
 * Returns all active instruments
 */
exports.getInstruments = (req, res) => {
  try {
    const instruments = getMarketInstrumentsSnapshot();
    res.json({ count: instruments.length, instruments });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch instruments.' });
  }
};

/**
 * GET /api/markets/instruments/:symbol
 * Detailed instrument information with historical timeframe data (1D, 1W, 1M, 1Y)
 */
exports.getInstrumentDetail = (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const timeframe = req.query.timeframe || '1D';
    const instrument = getInstrument(symbol);

    if (!instrument) {
      return res.status(404).json({ message: `Instrument '${symbol}' not found.` });
    }

    const historical = getHistoricalData(symbol, timeframe);

    res.json({
      instrument,
      timeframe,
      historical
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch instrument details.' });
  }
};

/**
 * GET /api/markets/movers
 */
exports.getMovers = (req, res) => {
  try {
    res.json(getTopMovers());
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch top movers.' });
  }
};

/**
 * GET /api/markets/sentiment
 */
exports.getSentiment = (req, res) => {
  try {
    res.json(getMarketSentiment());
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch market sentiment.' });
  }
};

/**
 * GET /api/markets/sectors
 */
exports.getSectors = (req, res) => {
  try {
    res.json(getSectorHeatmap());
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch sector heatmap.' });
  }
};
