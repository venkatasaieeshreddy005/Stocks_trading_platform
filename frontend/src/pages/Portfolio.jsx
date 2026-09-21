import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  TrendingUp, 
  TrendingDown, 
  Award, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownLeft,
  Sparkles,
  Zap
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

export default function Portfolio() {
  const { instrumentsMap } = useSocket();
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [portfolioData, setPortfolioData] = useState({
    summary: {
      virtualCashBalance: 50000,
      totalInvestment: 0,
      totalCurrentValue: 0,
      totalUnrealizedPnL: 0,
      totalRealizedPnL: 0,
      totalNetWorth: 50000,
      unrealizedReturnsPercent: 0
    },
    holdings: [],
    discipline: {
      level: 1,
      tier: 'Novice Trader',
      disciplineScore: 50,
      winRate: 0,
      stopLossRatio: 0,
      overtradingCount: 0,
      xpProgress: 20,
      nextLevelXP: 100,
      coachingTip: 'Execute your first trade with a stop-loss to establish risk management habits.'
    }
  });

  const [loading, setLoading] = useState(true);

  // Fetch portfolio data from backend
  useEffect(() => {
    async function fetchPortfolio() {
      if (!token) return;
      try {
        const res = await fetch('/api/portfolio', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setPortfolioData(data);
        }
      } catch (err) {
        console.error('Failed to fetch portfolio:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPortfolio();
    // Refresh periodically
    const interval = setInterval(fetchPortfolio, 4000);
    return () => clearInterval(interval);
  }, [token]);

  // Recalculate dynamic live values with latest WebSocket ticks
  const liveHoldings = portfolioData.holdings.map((h) => {
    const liveStock = instrumentsMap.get(h.symbol);
    const currentPrice = liveStock ? liveStock.currentPrice : h.currentPrice;
    const currentValue = parseFloat((currentPrice * h.quantity).toFixed(2));
    const investedValue = parseFloat((h.avgBuyPrice * h.quantity).toFixed(2));
    const unrealizedPnL = parseFloat((currentValue - investedValue).toFixed(2));
    const returnsPercent = investedValue > 0 ? parseFloat(((unrealizedPnL / investedValue) * 100).toFixed(2)) : 0;

    return {
      ...h,
      currentPrice,
      currentValue,
      unrealizedPnL,
      returnsPercent
    };
  });

  const liveTotalCurrentValue = liveHoldings.reduce((sum, h) => sum + h.currentValue, 0);
  const liveTotalInvestment = liveHoldings.reduce((sum, h) => sum + h.investedValue, 0);
  const liveTotalUnrealizedPnL = parseFloat((liveTotalCurrentValue - liveTotalInvestment).toFixed(2));
  const currentCash = user?.virtualCashBalance !== undefined ? user.virtualCashBalance : portfolioData.summary.virtualCashBalance;
  const liveTotalNetWorth = parseFloat((currentCash + liveTotalCurrentValue).toFixed(2));
  const liveReturnsPercent = liveTotalInvestment > 0 ? parseFloat(((liveTotalUnrealizedPnL / liveTotalInvestment) * 100).toFixed(2)) : 0;

  const isRealizedUp = portfolioData.summary.totalRealizedPnL >= 0;
  const isUnrealizedUp = liveTotalUnrealizedPnL >= 0;

  const discipline = portfolioData.discipline;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: '4px' }}>
          Portfolio & Holdings
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b' }}>
          Real-time capital ledger, live P&L, and algorithmic discipline scoring.
        </p>
      </div>

      {/* Summary Cards Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '16px'
      }}>
        <div style={{ padding: '20px', borderRadius: '16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Total Net Worth
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-mono)', marginTop: '6px' }}>
            ₹{liveTotalNetWorth?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
            Cash: ₹{currentCash?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div style={{ padding: '20px', borderRadius: '16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Invested Capital
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-mono)', marginTop: '6px' }}>
            ₹{liveTotalInvestment?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
            Across {liveHoldings.length} holdings
          </div>
        </div>

        <div style={{ padding: '20px', borderRadius: '16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Unrealized P&L
          </div>
          <div style={{
            fontSize: '24px',
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
            marginTop: '6px',
            color: isUnrealizedUp ? '#059669' : '#e11d48'
          }}>
            {isUnrealizedUp ? '+' : ''}₹{liveTotalUnrealizedPnL?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: isUnrealizedUp ? '#059669' : '#e11d48', marginTop: '4px' }}>
            {isUnrealizedUp ? '+' : ''}{liveReturnsPercent}% overall
          </div>
        </div>

        <div style={{ padding: '20px', borderRadius: '16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Realized P&L
          </div>
          <div style={{
            fontSize: '24px',
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
            marginTop: '6px',
            color: isRealizedUp ? '#059669' : '#e11d48'
          }}>
            {isRealizedUp ? '+' : ''}₹{portfolioData.summary.totalRealizedPnL?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
            Settled cash from sold positions
          </div>
        </div>
      </div>

      {/* Trading Discipline Level Gamification Card (Raw formula is NOT displayed) */}
      <div style={{
        backgroundColor: '#0f172a',
        borderRadius: '20px',
        padding: '28px 32px',
        color: '#ffffff',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: '#1e293b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10b981'
            }}>
              <Award size={24} />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#10b981', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                TRADING DISCIPLINE LEVEL
              </div>
              <div style={{ fontSize: '22px', fontWeight: 800 }}>
                Level {discipline.level}: {discipline.tier}
              </div>
            </div>
          </div>

          <span style={{
            padding: '6px 14px',
            borderRadius: '9999px',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            color: '#34d399',
            fontSize: '13px',
            fontWeight: 700,
            border: '1px solid rgba(52, 211, 153, 0.3)'
          }}>
            Discipline Score: {discipline.disciplineScore} / 100
          </span>
        </div>

        {/* Level XP Progress Bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
            <span>Progress to Next Tier</span>
            <span>{discipline.xpProgress}% XP</span>
          </div>
          <div style={{ height: '8px', backgroundColor: '#334155', borderRadius: '9999px', overflow: 'hidden' }}>
            <div style={{ width: `${discipline.xpProgress}%`, height: '100%', backgroundColor: '#10b981', transition: 'width 0.3s ease' }} />
          </div>
        </div>

        {/* Behavioral Metrics Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          paddingTop: '12px',
          borderTop: '1px solid #1e293b'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Win Rate</div>
            <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '2px', color: '#f8fafc' }}>
              {discipline.winRate}%
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Stop-Loss Adherence</div>
            <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '2px', color: '#f8fafc' }}>
              {discipline.stopLossRatio}%
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Recent Trades (60m)</div>
            <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '2px', color: discipline.overtradingCount > 10 ? '#f43f5e' : '#f8fafc' }}>
              {discipline.overtradingCount} trades {discipline.overtradingCount > 10 ? '(Overtrading)' : '(Optimal)'}
            </div>
          </div>
        </div>

        {/* Coaching Tip */}
        <div style={{
          backgroundColor: '#1e293b',
          borderRadius: '12px',
          padding: '12px 16px',
          fontSize: '13px',
          color: '#cbd5e1',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Sparkles size={16} color="#10b981" style={{ flexShrink: 0 }} />
          <span>
            <strong>Coaching Tip:</strong> {discipline.coachingTip}
          </span>
        </div>
      </div>

      {/* Active Holdings Ledger Table */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
            Current Asset Holdings ({liveHoldings.length})
          </h2>
          <Link to="/markets" style={{ fontSize: '13px', fontWeight: 600, color: '#10b981' }}>
            + Buy more stocks
          </Link>
        </div>

        {liveHoldings.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: '#94a3b8' }}>
            <Briefcase size={32} style={{ marginBottom: '10px', color: '#cbd5e1' }} />
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>No open positions</div>
            <p style={{ fontSize: '12px', marginTop: '4px' }}>
              You currently have zero active stock investments. Visit <Link to="/markets" style={{ color: '#10b981', textDecoration: 'underline' }}>Markets</Link> to deploy demo capital!
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{
                  backgroundColor: '#f8fafc',
                  borderBottom: '1px solid #f1f5f9',
                  color: '#64748b',
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}>
                  <th style={{ padding: '12px 24px', textAlign: 'left' }}>Instrument</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Shares Held</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Avg Buy Rate</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Current Price</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Current Value</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Unrealized P&L</th>
                  <th style={{ padding: '12px 24px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {liveHoldings.map((h) => {
                  const isHoldingUp = h.unrealizedPnL >= 0;
                  return (
                    <tr
                      key={h.id || h.symbol}
                      style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.15s ease' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '14px 24px' }}>
                        <Link to={`/markets/${h.symbol}`}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{h.symbol}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{h.name}</div>
                        </Link>
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 600, color: '#1e293b' }}>
                        {h.quantity}
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: '#475569' }}>
                        ₹{h.avgBuyPrice?.toFixed(2)}
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#0f172a' }}>
                        ₹{h.currentPrice?.toFixed(2)}
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#0f172a' }}>
                        ₹{h.currentValue?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      <td style={{
                        padding: '14px 16px',
                        textAlign: 'right',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        color: isHoldingUp ? '#059669' : '#e11d48'
                      }}>
                        {isHoldingUp ? '+' : ''}₹{h.unrealizedPnL?.toFixed(2)}
                        <div style={{ fontSize: '11px' }}>
                          ({isHoldingUp ? '+' : ''}{h.returnsPercent}%)
                        </div>
                      </td>

                      <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                        <Link
                          to={`/markets/${h.symbol}`}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '8px',
                            backgroundColor: '#e11d48',
                            color: '#ffffff',
                            fontWeight: 600,
                            fontSize: '12px',
                            display: 'inline-block'
                          }}
                        >
                          Trade / Sell
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

