import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Gauge, 
  Flame, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function Dashboard() {
  const { user, token } = useAuth();
  const { sentiment, movers, sectorHeatmap } = useSocket();

  const [portfolioSummary, setPortfolioSummary] = useState({
    totalRealizedPnL: 0,
    totalUnrealizedPnL: 0,
    virtualCashBalance: user?.virtualCashBalance || 50000
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch portfolio summary and recent activity ledger
  useEffect(() => {
    async function fetchDashboardData() {
      if (!token) return;
      try {
        const [portRes, ordRes] = await Promise.all([
          fetch('/api/portfolio', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/trades/orders', { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if (portRes.ok) {
          const portData = await portRes.json();
          setPortfolioSummary(portData.summary);
        }

        if (ordRes.ok) {
          const ordData = await ordRes.json();
          setRecentOrders((ordData.orders || []).slice(0, 7));
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [token, user?.virtualCashBalance]);

  const displayCash = user?.virtualCashBalance !== undefined 
    ? user.virtualCashBalance 
    : portfolioSummary.virtualCashBalance;

  const realizedPnL = portfolioSummary.totalRealizedPnL || 0;
  const isRealizedPositive = realizedPnL >= 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: '4px' }}>
          Dashboard
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b' }}>
          Your market overview at a glance.
        </p>
      </div>

      {/* Top 3 Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px'
      }}>
        {/* Available Capital Dark Card */}
        <div style={{
          backgroundColor: '#18181b',
          borderRadius: '16px',
          padding: '24px',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '140px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#a1a1aa', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
              AVAILABLE CAPITAL
            </span>
            <div style={{ color: '#10b981' }}>
              <Wallet size={20} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.5px', fontFamily: 'var(--font-mono)' }}>
              ₹{displayCash?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '12px', color: '#71717a', marginTop: '4px' }}>
              Demo cash · play money only
            </div>
          </div>
        </div>

        {/* Realized P&L Card */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '140px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
              REALIZED P&L
            </span>
            <div style={{ color: isRealizedPositive ? '#10b981' : '#f43f5e' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div>
            <div style={{
              fontSize: '32px',
              fontWeight: 800,
              letterSpacing: '-0.5px',
              fontFamily: 'var(--font-mono)',
              color: isRealizedPositive ? '#059669' : '#e11d48'
            }}>
              {isRealizedPositive ? '+' : ''}₹{realizedPnL?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
              From closed positions
            </div>
          </div>
        </div>

        {/* Market Sentiment Card */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '140px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
              MARKET SENTIMENT
            </span>
            <div style={{ color: '#64748b' }}>
              <Gauge size={20} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.5px', color: '#0f172a' }}>
              {sentiment.mood}
            </div>
            <div style={{ fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#059669', fontWeight: 600 }}>{sentiment.upCount} up</span>
              <span style={{ color: '#cbd5e1' }}>·</span>
              <span style={{ color: '#e11d48', fontWeight: 600 }}>{sentiment.downCount} down</span>
              <span style={{ color: '#64748b' }}>({sentiment.netBreadth})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sector Heatmap */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <Flame size={20} color="#f97316" />
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
            Sector Heatmap
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
          gap: '12px'
        }}>
          {sectorHeatmap.map((sec) => (
            <div
              key={sec.sector}
              style={{
                padding: '14px 16px',
                borderRadius: '12px',
                backgroundColor: sec.isPositive ? '#ecfdf5' : '#fff1f2',
                border: `1px solid ${sec.isPositive ? '#a7f3d0' : '#fecdd3'}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                transition: 'transform 0.15s ease'
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                {sec.sector}
              </div>
              <div style={{
                fontSize: '16px',
                fontWeight: 700,
                color: sec.isPositive ? '#059669' : '#e11d48',
                fontFamily: 'var(--font-mono)'
              }}>
                {sec.isPositive ? '+' : ''}{sec.changePercent}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Row: Top Movers & Recent Activity Ledger */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
        gap: '24px'
      }}>
        {/* Top Movers */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
              Top Movers
            </h2>
            <Link to="/markets" style={{ fontSize: '13px', fontWeight: 600, color: '#10b981' }}>
              View all
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Gainers Column */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#059669', textTransform: 'uppercase', marginBottom: '12px' }}>
                Gainers
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(movers.gainers || []).slice(0, 5).map((stock) => (
                  <Link
                    key={stock.symbol}
                    to={`/markets/${stock.symbol}`}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      backgroundColor: '#f8fafc',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{stock.symbol}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                        {stock.currentPrice?.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#059669' }}>
                      +{stock.dailyPercentageChange}%
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Losers Column */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#e11d48', textTransform: 'uppercase', marginBottom: '12px' }}>
                Losers
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(movers.losers || []).slice(0, 5).map((stock) => (
                  <Link
                    key={stock.symbol}
                    to={`/markets/${stock.symbol}`}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      backgroundColor: '#f8fafc',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{stock.symbol}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                        {stock.currentPrice?.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#e11d48' }}>
                      {stock.dailyPercentageChange}%
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Ledger */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
              Recent Activity
            </h2>
            <Link to="/orders" style={{ fontSize: '13px', fontWeight: 600, color: '#10b981' }}>
              All orders
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 16px', color: '#94a3b8' }}>
              <Clock size={28} style={{ marginBottom: '8px' }} />
              <div style={{ fontSize: '14px', fontWeight: 600 }}>No trade executions yet</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>
                Open <Link to="/markets" style={{ color: '#10b981', textDecoration: 'underline' }}>Markets</Link> to buy your first stock!
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recentOrders.map((ord) => {
                const isBuy = ord.side === 'BUY';
                const totalVal = ord.quantity * ord.price;
                const formattedDate = new Date(ord.createdAt).toLocaleDateString([], {
                  day: 'numeric',
                  month: 'short'
                });
                const formattedTime = new Date(ord.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <Link
                    key={ord._id}
                    to={`/markets/${ord.instrumentToken}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #f1f5f9',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        backgroundColor: isBuy ? '#ecfdf5' : '#fff1f2',
                        color: isBuy ? '#059669' : '#e11d48',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {isBuy ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                          {ord.side} {ord.quantity} × {ord.instrumentToken}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          ₹{ord.price?.toLocaleString('en-IN')} · {formattedDate}, {formattedTime}
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
                      ₹{totalVal >= 1000 ? `${(totalVal / 1000).toFixed(2)} K` : totalVal.toFixed(2)}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

