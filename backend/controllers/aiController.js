const { getInstrument, getMarketSentiment } = require('../engine/simulation');

function normalizeSymbol(symbol) {
  if (!symbol) return null;
  return String(symbol).trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
}

/**
 * Automatically detects known stock symbols from natural language messages.
 */
function detectSymbolFromMessage(message) {
  const text = String(message || '').toUpperCase();
  const knownSymbols = [
    'INFY', 'TCS', 'RELIANCE', 'HDFCBANK', 'ICICIBANK', 'SBIN', 'ITC',
    'WIPRO', 'HCLTECH', 'LT', 'AXISBANK', 'KOTAKBANK', 'MARUTI',
    'TATAMOTORS', 'TATASTEEL', 'SUNPHARMA', 'ADANIENT', 'ADANIPORTS',
    'BHARTIARTL', 'MCX-GOLD', 'GOLD', 'SILVER', 'NIFTY', 'BANKNIFTY'
  ];

  for (const symbol of knownSymbols) {
    const escapedSymbol = symbol.replace(/-/g, '\\-');
    const regex = new RegExp(`\\b${escapedSymbol}\\b`, 'i');
    if (regex.test(text)) {
      return symbol;
    }
  }
  return null;
}

function getStockContext(message, suppliedSymbol) {
  const normalizedSupplied = normalizeSymbol(suppliedSymbol);
  let symbol = normalizedSupplied || detectSymbolFromMessage(message);

  if (!symbol) return null;

  let stock = getInstrument(symbol);
  if (!stock && symbol === 'GOLD') {
    stock = getInstrument('MCX-GOLD');
  }
  return stock || null;
}

/**
 * Fallback algorithmic AI market analyst if OpenRouter is unavailable.
 */
function generateAlgorithmicAIResponse(query, stock = null) {
  const sentiment = getMarketSentiment();
  const queryLower = (query || '').toLowerCase();

  if (stock) {
    const isBull = stock.dailyPercentageChange > 0;
    const rsiEstimate = Math.min(85, Math.max(25, Math.round(50 + stock.dailyPercentageChange * 6)));
    const support = (stock.dayLow * 0.995).toFixed(2);
    const resistance = (stock.dayHigh * 1.005).toFixed(2);

    return `### 🤖 ZenAI Technical Breakdown: **${stock.symbol}** (${stock.name})

- **Asset Category**: ${stock.type} (${stock.sector})
- **Last Traded Price**: ₹${stock.currentPrice} (${isBull ? '+' : ''}${stock.dailyPercentageChange}%)
- **Estimated Intraday RSI (14)**: **${rsiEstimate}** ${rsiEstimate > 70 ? '⚠️ (Overbought)' : rsiEstimate < 35 ? '🟢 (Oversold)' : '⚪ (Neutral)'}
- **Key Support Level**: ₹${support}
- **Key Resistance Level**: ₹${resistance}

#### 💡 Actionable Strategy:
${isBull 
  ? `The instrument is displaying upward momentum. If entering long, maintain a protective stop-loss below ₹${support}.`
  : `The asset is testing intraday lows. Wait for a confirmed volume breakout above ₹${resistance} before fresh entries.`
}`;
  }

  if (queryLower.includes('sentiment') || queryLower.includes('market')) {
    return `### 🌐 ZenAI Market Breadth Analysis
The live simulated market is currently **${sentiment.mood}** with **${sentiment.upCount} advancing** and **${sentiment.downCount} declining** instruments (Net Breadth: ${sentiment.netBreadth}).`;
  }

  return `### 🤖 ZenAI Trading Intelligence
I am your AI Trading Copilot on TradeZen. Ask me about market sentiment, stock technicals, or risk management rules!`;
}

/**
 * POST /api/ai/chat
 */
exports.chat = async (req, res) => {
  try {
    const { message, symbol, history } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ message: 'Message prompt is required.' });
    }

    const apiKey = process.env.OPENROUTER_API_KEY?.trim();
    const marketSentiment = getMarketSentiment();
    const stock = getStockContext(message, symbol);
    const model = process.env.OPENROUTER_MODEL || 'openrouter/free';

    // If API Key exists, try calling OpenRouter with conversation history
    if (apiKey) {
      try {
        const systemPrompt = `You are ZenAI, an intelligent AI assistant and trading coach inside TradeZen, a paper-trading and financial education platform.
Market Sentiment: ${marketSentiment.mood} (${marketSentiment.upCount} up, ${marketSentiment.downCount} down).
${stock ? `Current Instrument: ${stock.symbol} (${stock.name}), Price: ₹${stock.currentPrice}, Change: ${stock.dailyPercentageChange}%` : ''}
User Profile: ${req.user.name}, Cash: ₹${req.user.virtualCashBalance}, Level: ${req.user.currentDisciplineLevel}.
Keep answers conversational, educational, beginner-friendly, and concise.`;

        const safeHistory = Array.isArray(history)
          ? history.filter(item => item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string').slice(-10)
          : [];

        const messages = [
          { role: 'system', content: systemPrompt },
          ...safeHistory,
          { role: 'user', content: message.trim() }
        ];

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
            'X-Title': 'TradeZen AI Copilot'
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: 0.5,
            max_tokens: 1200
          })
        });

        if (response.ok) {
          const data = await response.json();
          const reply = data?.choices?.[0]?.message?.content;
          if (reply) {
            return res.json({
              reply,
              provider: `OpenRouter (${model})`,
              symbol: stock?.symbol || null
            });
          }
        }
      } catch (openRouterErr) {
        console.warn('OpenRouter request failed, falling back to algorithmic AI:', openRouterErr.message);
      }
    }

    // Fallback response if OpenRouter is unconfigured or fails
    const reply = generateAlgorithmicAIResponse(message, stock);
    return res.json({
      reply,
      provider: 'ZenAI Algorithmic Fallback',
      symbol: stock?.symbol || null
    });

  } catch (error) {
    console.error('ZenAI route error:', error);
    return res.status(500).json({ message: 'ZenAI could not process your request.' });
  }
};

/**
 * POST /api/ai/analyze-stock
 */
exports.analyzeStock = async (req, res) => {
  try {
    const symbol = normalizeSymbol(req.body?.symbol);
    if (!symbol) {
      return res.status(400).json({ message: 'Symbol is required.' });
    }

    const stock = getInstrument(symbol);
    if (!stock) {
      return res.status(404).json({ message: `Instrument '${symbol}' not found.` });
    }

    const analysis = generateAlgorithmicAIResponse(`Analyze ${stock.symbol}`, stock);
    return res.json({
      analysis,
      symbol: stock.symbol,
      provider: 'ZenAI Stock Analyzer'
    });

  } catch (error) {
    console.error('Stock analysis error:', error);
    return res.status(500).json({ message: 'Failed to analyze stock.' });
  }
};
