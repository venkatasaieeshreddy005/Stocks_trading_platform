const User = require('../models/User');

/**
 * POST /api/funds/add
 * Mock leverage capital expansion
 */
exports.addFunds = async (req, res) => {
  try {
    const { amountPaid, virtualCashAdded, packageTitle } = req.body;

    const cashToAdd = parseFloat(virtualCashAdded);
    if (isNaN(cashToAdd) || cashToAdd <= 0) {
      return res.status(400).json({ message: 'Invalid virtual cash amount.' });
    }

    const user = await User.findById(req.user._id);
    user.virtualCashBalance = parseFloat((user.virtualCashBalance + cashToAdd).toFixed(2));
    user.experiencePoints += 50; // Bonus XP for expanding capital
    await user.save();

    res.json({
      message: `Leverage expansion successful! ₹${cashToAdd.toLocaleString('en-IN')} demo capital credited to your account.`,
      newBalance: user.virtualCashBalance,
      packageTitle: packageTitle || 'Custom Capital Expansion'
    });
  } catch (err) {
    console.error('Add funds error:', err);
    res.status(500).json({ message: 'Server error processing fund addition.' });
  }
};
