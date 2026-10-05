const Holding = require('../models/Holding');
const Order = require('../models/Order');
const User = require('../models/User');
const { getInstrument } = require('../engine/simulation');

/**
 * Calculates Discipline Level and Behavioral Coaching Tips
 * Note: Raw formula is kept strictly in server logic; client displays tier badge, progress and tips
 */
function computeDisciplineLevel(metrics) {
  const total = metrics.totalTradesExecuted || 0;
  const profitable = metrics.profitableTradesCount || 0;
  const slUsed = metrics.stopLossUsageCount || 0;

  // Filter trades in past 60 minutes for overtrading metric
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentTrades = (metrics.tradeTimestamps || []).filter(t => new Date(t) > oneHourAgo).length;

  if (total === 0) {
    return {
      level: 1,
      tier: 'Novice Trader',
      disciplineScore: 50,
      winRate: 0,
      stopLossRatio: 0,
      overtradingCount: 0,
      xpProgress: 20,
      nextLevelXP: 100,
      coachingTip: 'Execute your first trade with a stop-loss to establish risk management habits.'
    };
  }

  const pWin = (profitable / total) * 100;
  const sLossRatio = (slUsed / total) * 100;
  const oCount = recentTrades;

  // Algorithmic Discipline Score
  let score = (pWin * 0.5) + (sLossRatio * 0.4) - (oCount * 0.1);
  score = Math.max(5, Math.min(100, parseFloat(score.toFixed(1))));

  let level = 1;
  let tier = 'Novice Trader';

  if (score >= 85) {
    level = Math.min(25, Math.floor(score / 4));
    tier = 'Zen Market Master';
  } else if (score >= 70) {
    level = Math.floor(10 + (score - 70) / 3);
    tier = 'Risk Manager';
  } else if (score >= 50) {
    level = Math.floor(5 + (score - 50) / 4);
    tier = 'Calculated Scalper';
  } else if (score >= 30) {
    level = Math.floor(2 + (score - 30) / 10);
    tier = 'Cautious Explorer';
  } else {
    level = 1;
    tier = 'Novice Trader';
  }

  let coachingTip = 'Keep your losses small and let winners run.';
  if (oCount > 10) {
    coachingTip = 'Warning: Overtrading detected in the last hour. Focus on high-probability setups.';
  } else if (sLossRatio < 30) {
    coachingTip = 'Risk discipline alert: Utilize Stop-Loss orders more frequently to safeguard capital.';
  } else if (pWin > 60) {
    coachingTip = 'Outstanding win rate! Maintain strict position sizing to preserve gains.';
  }

  const xpProgress = (score % 10) * 10;

  return {
    level,
    tier,
    disciplineScore: score,
    winRate: parseFloat(pWin.toFixed(1)),
    stopLossRatio: parseFloat(sLossRatio.toFixed(1)),
    overtradingCount: oCount,
    xpProgress,
    nextLevelXP: 100,
    coachingTip
  };
}

/**
 * GET /api/portfolio
 * Full portfolio overview: active holdings with live valuation, realized P&L and discipline tier
 */
exports.getPortfolio = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const holdings = await Holding.find({ userId: req.user._id });
    const executedOrders = await Order.find({ userId: req.user._id, status: 'EXECUTED', side: 'SELL' });

    let totalInvestment = 0;
    let totalCurrentValue = 0;

    const populatedHoldings = holdings.map(h => {
      const stock = getInstrument(h.instrumentToken);
      const currentPrice = stock ? stock.currentPrice : h.averageWeightedBuyPrice;
      const dayChangePercent = stock ? stock.dailyPercentageChange : 0;
      const investedValue = parseFloat((h.averageWeightedBuyPrice * h.totalQuantity).toFixed(2));
      const currentValue = parseFloat((currentPrice * h.totalQuantity).toFixed(2));
      const unrealizedPnL = parseFloat((currentValue - investedValue).toFixed(2));
      const returnsPercent = investedValue > 0 ? parseFloat(((unrealizedPnL / investedValue) * 100).toFixed(2)) : 0;

      totalInvestment += investedValue;
      totalCurrentValue += currentValue;

      return {
        id: h._id,
        symbol: h.instrumentToken,
        name: h.name,
        sector: h.sector,
        type: h.type,
        quantity: h.totalQuantity,
        avgBuyPrice: h.averageWeightedBuyPrice,
        currentPrice: currentPrice,
        dayChangePercent: dayChangePercent,
        investedValue,
        currentValue,
        unrealizedPnL,
        returnsPercent,
        stopLossPrice: h.stopLossPrice
      };
    });

    const totalUnrealizedPnL = parseFloat((totalCurrentValue - totalInvestment).toFixed(2));
    const totalRealizedPnL = parseFloat(
      executedOrders.reduce((sum, ord) => sum + (ord.realizedPnL || 0), 0).toFixed(2)
    );
    const totalNetWorth = parseFloat((user.virtualCashBalance + totalCurrentValue).toFixed(2));

    const discipline = computeDisciplineLevel(user.metrics || {});

    res.json({
      summary: {
        virtualCashBalance: user.virtualCashBalance,
        totalInvestment: parseFloat(totalInvestment.toFixed(2)),
        totalCurrentValue: parseFloat(totalCurrentValue.toFixed(2)),
        totalUnrealizedPnL,
        totalRealizedPnL,
        totalNetWorth,
        unrealizedReturnsPercent: totalInvestment > 0 ? parseFloat(((totalUnrealizedPnL / totalInvestment) * 100).toFixed(2)) : 0
      },
      holdings: populatedHoldings,
      discipline
    });
  } catch (err) {
    console.error('Portfolio error:', err);
    res.status(500).json({ message: 'Error retrieving portfolio data.' });
  }
};
