import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Star, 
  ArrowLeft, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ShieldAlert, 
  Check, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import OrderConfirmModal from '../components/OrderConfirmModal';

export default function InstrumentDetail() {
  const { id } = useParams();
  const symbol = id ? id.toUpperCase() : '';
  const { instrumentsMap, socket } = useSocket();
  const { user, token, refreshUserData } = useAuth();

  const [timeframe, setTimeframe] = useState('1D');
  const [historicalData, setHistoricalData] = useState([]);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Trade form state
  const [tradeSide, setTradeSide] = useState('BUY'); // 'BUY' | 'SELL'
  const [orderType, setOrderType] = useState('MARKET'); // 'MARKET' | 'LIMIT'
  const [quantity, setQuantity] = useState(1);
  const [limitPrice, setLimitPrice] = useState('');
  const [stopLossPrice, setStopLossPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tradeError, setTradeError] = useState('');

  // Watchlist state
  const [isWatchlisted, setIsWatchlisted] = useState(false);

  // Order confirmation modal state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [lastExecutedOrder, setLastExecutedOrder] = useState(null);

  // User holdings for this symbol
  const [userHolding, setUserHolding] = useState(null);

  const instrument = instrumentsMap.get(symbol);

  // Check watchlist status from user object
  useEffect(() => {
    if (user?.watchlist) {
      setIsWatchlisted(user.watchlist.includes(symbol));
    }
  }, [user?.watchlist, symbol]);

  // Fetch historical timeframe chart data and user holding
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/markets/instruments/${symbol}?timeframe=${timeframe}`);
        if (res.ok) {
          const data = await res.json();
          setHistoricalData(data.historical || []);
        }

        if (token) {
          const portRes = await fetch('/api/portfolio', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (portRes.ok) {
            const portData = await portRes.json();
            const h = (portData.holdings || []).find((item) => item.symbol === symbol);
            setUserHolding(h || null);
          }
        }
      } catch (err) {
        console.error('Failed to load instrument chart:', err);
      }
    }

    loadData();
  }, [symbol, timeframe, token]);

  // Default limit price to currentPrice
  useEffect(() => {
    if (instrument && !limitPrice) {
      setLimitPrice(instrument.currentPrice.toString());
    }
  }, [instrument]);

  const currentPrice = instrument ? instrument.currentPrice : 0;
  const isUp = instrument ? instrument.dailyPercentageChange >= 0 : true;

  // Active execution price strictly preserved (no slippage)
  const activePrice = orderType === 'LIMIT' && limitPrice ? parseFloat(limitPrice) : currentPrice;
  const orderTotal = activePrice * quantity;
  const availableBalance = user?.virtualCashBalance || 0;
  const isInsufficientBalance = tradeSide === 'BUY' && orderTotal > availableBalance;

  // Toggle watchlist
  const handleToggleWatchlist = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/watchlist/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ symbol })
      });
      if (res.ok) {
        const data = await res.json();
        setIsWatchlisted(data.isAdded);
        refreshUserData();
      }
    } catch (err) {
      console.error('Watchlist toggle error:', err);
    }
  };

  // Submit Trade
  const handleExecuteTrade = async (e) => {
    e.preventDefault();
    if (!token) {
      setTradeError('Please log in to place trades.');
      return;
    }

    if (quantity <= 0) {
      setTradeError('Quantity must be at least 1.');
      return;
    }

    if (tradeSide === 'BUY' && isInsufficientBalance) {
      setTradeError('Insufficient virtual cash balance.');
      return;
    }

    if (tradeSide === 'SELL' && (!userHolding || userHolding.quantity < quantity)) {
      setTradeError(`You only own ${userHolding ? userHolding.quantity : 0} shares.`);
      return;
    }

    setTradeError('');
    setIsSubmitting(true);

    try {
      const endpoint = tradeSide === 'BUY' ? '/api/trades/buy' : '/api/trades/sell';
      const body = {
        symbol,
        quantity,
        orderType,
        quotedPrice: activePrice, // Strict price integrity
        targetPrice: orderType === 'LIMIT' ? parseFloat(limitPrice) : undefined,
        stopLossPrice: stopLossPrice ? parseFloat(stopLossPrice) : undefined
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        setTradeError(data.message || 'Trade execution failed.');
      } else {
        // Set order confirmation details and open modal
        setLastExecutedOrder({
          symbol,
          side: tradeSide,
          orderType,
          quantity,
          price: activePrice,
          realizedPnL: data.realizedPnL,
          newBalance: data.newBalance
        });
        setConfirmModalOpen(true);
        refreshUserData();

        // Refresh user holding
        const portRes = await fetch('/api/portfolio', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (portRes.ok) {
          const portData = await portRes.json();
          const h = (portData.holdings || []).find((item) => item.symbol === symbol);
          setUserHolding(h || null);
        }
      }
    } catch (err) {
      setTradeError('Network error. Failed to place order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Build clean responsive SVG path for the chart
  const chartWidth = 620;
  const chartHeight = 240;
  const padding = 20;

  const chartPoints = useMemo(() => {
    if (!historicalData || historicalData.length < 2) return [];
    const prices = historicalData.map((d) => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min === 0 ? 1 : max - min;
    const innerH = chartHeight - padding * 2;
    const innerW = chartWidth - padding * 2;

    return historicalData.map((item, idx) => {
      const x = padding + (idx / (historicalData.length - 1)) * innerW;
      const y = chartHeight - padding - ((item.price - min) / range) * innerH;
      return { x, y, price: item.price, time: item.time };
    });
  }, [historicalData]);

  const svgPathD = useMemo(() => {
    if (chartPoints.length === 0) return '';
    const pointsStr = chartPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ');
    return `M ${pointsStr}`;
  }, [chartPoints]);

  const svgAreaD = useMemo(() => {
    if (chartPoints.length === 0) return '';
    return `${svgPathD} L ${chartPoints[chartPoints.length - 1].x},${chartHeight - padding} L ${padding},${chartHeight - padding} Z`;
  }, [svgPathD, chartPoints]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Top Breadcrumb & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link
          to="/markets"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            fontWeight: 600,
            color: '#64748b'
          }}
        >
          <ArrowLeft size={16} /> Back to Markets
        </Link>

        {/* Watchlist Star Button */}
        <button
          onClick={handleToggleWatchlist}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '10px',
            backgroundColor: isWatchlisted ? '#fef3c7' : '#ffffff',
            color: isWatchlisted ? '#d97706' : '#64748b',
            border: `1px solid ${isWatchlisted ? '#fde68a' : '#e2e8f0'}`,
            fontSize: '13px',
            fontWeight: 600
          }}
        >
          <Star size={16} fill={isWatchlisted ? '#d97706' : 'none'} />
          <span>{isWatchlisted ? 'Watchlisted' : 'Add to Watchlist'}</span>
        </button>
      </div>

      {/* Instrument Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
              {symbol}
            </h1>
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '3px 8px',
              borderRadius: '6px',
              backgroundColor: '#f1f5f9',
              color: '#475569'
            }}>
              {instrument?.type || 'Equity'}
            </span>
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '3px 8px',
              borderRadius: '6px',
              backgroundColor: '#ecfdf5',
              color: '#059669'
            }}>
              {instrument?.sector || 'General'}
            </span>
          </div>
          <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
            {instrument?.name}
          </div>
        </div>

        {/* Live Price & Change */}
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: '32px',
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
            color: '#0f172a',
            letterSpacing: '-0.5px'
          }}>
            ₹{currentPrice?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{
            fontSize: '14px',
            fontWeight: 700,
            color: isUp ? '#059669' : '#e11d48',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '4px'
          }}>
            {isUp ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
            {isUp ? '+' : ''}{instrument?.dailyPercentageChange?.toFixed(2)}% Today
          </div>
        </div>
      </div>

      {/* Main Grid: Chart & Statistics (Left) vs Execution Action Panel (Right) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.4fr) minmax(360px, 1fr)',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Left: Chart & Stats Container */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Chart Card */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
          }}>
            {/* Timeframe Controls */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>
                Price Trend Canvas
              </div>

              <div style={{ display: 'flex', gap: '6px', backgroundColor: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
                {['1D', '1W', '1M', '1Y'].map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      backgroundColor: timeframe === tf ? '#ffffff' : 'transparent',
                      color: timeframe === tf ? '#0f172a' : '#64748b',
                      boxShadow: timeframe === tf ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
                    }}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {/* Hovered Point Tooltip */}
            <div style={{ minHeight: '22px', fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
              {hoveredPoint ? (
                <span>
                  <strong style={{ color: '#0f172a' }}>₹{hoveredPoint.price}</strong> at {hoveredPoint.time}
                </span>
              ) : (
                <span>Hover over graph to inspect historical ticks</span>
              )}
            </div>

            {/* Responsive Clean SVG Area Chart */}
            <div style={{ width: '100%', overflow: 'hidden' }}>
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                style={{ width: '100%', height: 'auto', display: 'block' }}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={isUp ? '#10b981' : '#f43f5e'} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={isUp ? '#10b981' : '#f43f5e'} stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid guidelines */}
                <line x1={padding} y1={chartHeight / 2} x2={chartWidth - padding} y2={chartHeight / 2} stroke="#f1f5f9" strokeDasharray="4 4" />
                <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="#f1f5f9" />

                {/* Area and Line */}
                {svgAreaD && <path d={svgAreaD} fill="url(#chartGrad)" />}
                {svgPathD && (
                  <path
                    d={svgPathD}
                    fill="none"
                    stroke={isUp ? '#10b981' : '#f43f5e'}
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Interactive Points */}
                {chartPoints.map((pt, i) => (
                  <circle
                    key={i}
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredPoint?.time === pt.time ? 4.5 : 2.5}
                    fill={isUp ? '#10b981' : '#f43f5e'}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    style={{ cursor: 'pointer', transition: 'r 0.1s ease' }}
                    onMouseEnter={() => setHoveredPoint(pt)}
                  />
                ))}
              </svg>
            </div>
          </div>

          {/* High / Low Summary Blocks */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '12px'
          }}>
            <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Day High</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                ₹{instrument?.dayHigh?.toLocaleString('en-IN') || '—'}
              </div>
            </div>

            <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Day Low</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                ₹{instrument?.dayLow?.toLocaleString('en-IN') || '—'}
              </div>
            </div>

            <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Prev Close</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                ₹{instrument?.previousClose?.toLocaleString('en-IN') || '—'}
              </div>
            </div>

            <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Sim Volume</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                {instrument?.volume?.toLocaleString('en-IN') || '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Action Execution Panel */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {/* Buy / Sell Tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              onClick={() => { setTradeSide('BUY'); setTradeError(''); }}
              style={{
                padding: '12px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '14px',
                backgroundColor: tradeSide === 'BUY' ? '#10b981' : '#f1f5f9',
                color: tradeSide === 'BUY' ? '#ffffff' : '#64748b',
                boxShadow: tradeSide === 'BUY' ? '0 4px 10px rgba(16, 185, 129, 0.25)' : 'none'
              }}
            >
              BUY
            </button>
            <button
              onClick={() => { setTradeSide('SELL'); setTradeError(''); }}
              style={{
                padding: '12px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '14px',
                backgroundColor: tradeSide === 'SELL' ? '#e11d48' : '#f1f5f9',
                color: tradeSide === 'SELL' ? '#ffffff' : '#64748b',
                boxShadow: tradeSide === 'SELL' ? '0 4px 10px rgba(225, 29, 72, 0.25)' : 'none'
              }}
            >
              SELL
            </button>
          </div>

          {/* User Holdings Banner if exists */}
          {userHolding && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '10px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              fontSize: '12px',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <span style={{ color: '#64748b' }}>Your Holdings:</span>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>
                {userHolding.quantity} Shares (Avg: ₹{userHolding.avgBuyPrice})
              </span>
            </div>
          )}

          {/* Order Type Toggle: Market vs Limit */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setOrderType('MARKET')}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: orderType === 'MARKET' ? '#0f172a' : '#ffffff',
                color: orderType === 'MARKET' ? '#ffffff' : '#64748b',
                border: '1px solid #cbd5e1'
              }}
            >
              Market Order
            </button>
            <button
              onClick={() => setOrderType('LIMIT')}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: orderType === 'LIMIT' ? '#0f172a' : '#ffffff',
                color: orderType === 'LIMIT' ? '#ffffff' : '#64748b',
                border: '1px solid #cbd5e1'
              }}
            >
              Limit Order
            </button>
          </div>

          {/* INSUFFICIENT BALANCE WARNING BANNER ABOVE QUANTITY INPUT */}
          {isInsufficientBalance && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '10px',
              backgroundColor: '#fff1f2',
              border: '1px solid #fecdd3',
              color: '#be123c',
              fontSize: '12px',
              fontWeight: 600
            }}>
              <AlertCircle size={16} />
              <span>
                Insufficient Balance: Required ₹{orderTotal.toLocaleString('en-IN')}, Available ₹{availableBalance.toLocaleString('en-IN')}
              </span>
            </div>
          )}

          {tradeError && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '10px',
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              fontSize: '12px',
              fontWeight: 500
            }}>
              {tradeError}
            </div>
          )}

          {/* Execution Form */}
          <form onSubmit={handleExecuteTrade} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Quantity Input & Presets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                <span>Quantity</span>
                <span style={{ color: '#94a3b8', fontSize: '12px' }}>Shares to trade</span>
              </div>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#0f172a'
                }}
                required
              />

              {/* Quantity Preset Buttons */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {[1, 5, 10, 25, 50, 100].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setQuantity(preset)}
                    style={{
                      flex: 1,
                      padding: '4px 0',
                      borderRadius: '6px',
                      backgroundColor: quantity === preset ? '#0f172a' : '#f1f5f9',
                      color: quantity === preset ? '#ffffff' : '#64748b',
                      fontSize: '11px',
                      fontWeight: 600
                    }}
                  >
                    +{preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Limit Price Input if Limit Order */}
            {orderType === 'LIMIT' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                  Target Limit Price (₹)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#0f172a'
                  }}
                  required
                />
              </div>
            )}

            {/* Stop-Loss Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                  Stop-Loss Trigger (Optional)
                </label>
                <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>+Discipline XP</span>
              </div>
              <input
                type="number"
                step="0.05"
                placeholder={tradeSide === 'BUY' ? `e.g. ${(currentPrice * 0.97).toFixed(2)}` : ''}
                value={stopLossPrice}
                onChange={(e) => setStopLossPrice(e.target.value)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  color: '#0f172a'
                }}
              />
            </div>

            {/* Order Cost Calculation Summary */}
            <div style={{
              padding: '14px',
              borderRadius: '12px',
              backgroundColor: '#f8fafc',
              border: '1px solid #f1f5f9',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              fontSize: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                <span>Rate per share</span>
                <span style={{ fontWeight: 600, color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
                  ₹{activePrice?.toFixed(2)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                <span>Available Cash</span>
                <span style={{ fontWeight: 600, color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
                  ₹{availableBalance?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                <span>Brokerage</span>
                <span style={{ fontWeight: 600, color: '#10b981' }}>₹0.00 Free</span>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '6px',
                borderTop: '1px dashed #e2e8f0',
                fontSize: '13px'
              }}>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>Order Total</span>
                <span style={{ fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
                  ₹{orderTotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Submit Execution Button */}
            <button
              type="submit"
              disabled={isSubmitting || (tradeSide === 'BUY' && isInsufficientBalance)}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                backgroundColor: tradeSide === 'BUY' ? '#10b981' : '#e11d48',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 700,
                cursor: (tradeSide === 'BUY' && isInsufficientBalance) ? 'not-allowed' : 'pointer',
                opacity: (tradeSide === 'BUY' && isInsufficientBalance) ? 0.5 : 1,
                boxShadow: tradeSide === 'BUY' ? '0 4px 12px rgba(16, 185, 129, 0.25)' : '0 4px 12px rgba(225, 29, 72, 0.25)'
              }}
            >
              {isSubmitting
                ? 'Executing...'
                : (tradeSide === 'BUY' && isInsufficientBalance)
                ? 'Insufficient Balance'
                : `${tradeSide} ${quantity} ${symbol} at ₹${activePrice?.toFixed(2)}`}
            </button>
          </form>
        </div>
      </div>

      {/* Instant Order Confirmation Dialog */}
      <OrderConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        orderDetails={lastExecutedOrder}
      />
    </div>
  );
}

