import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, Bell, Plus, X, ArrowUpRight, ArrowDownLeft, AlertCircle } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { Sparkline } from './Markets';

export default function Watchlist() {
  const { instrumentsMap, liveAlerts, dismissAlert, clearAllAlerts } = useSocket();
  const { user, token, refreshUserData } = useAuth();
  const navigate = useNavigate();

  const [watchlistSymbols, setWatchlistSymbols] = useState([]);
  const [dbAlerts, setDbAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWatchlist() {
      if (!token) return;
      try {
        const [watchRes, alertRes] = await Promise.all([
          fetch('/api/watchlist', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/watchlist/alerts', { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if (watchRes.ok) {
          const wData = await watchRes.json();
          setWatchlistSymbols((wData.watchlist || []).map((w) => w.symbol));
        }

        if (alertRes.ok) {
          const aData = await alertRes.json();
          setDbAlerts(aData.alerts || []);
        }
      } catch (err) {
        console.error('Failed to load watchlist:', err);
      } finally {
        setLoading(false);
      }
    }

    loadWatchlist();
  }, [token]);

  // Combine live WebSocket alerts with DB alerts
  const allAlerts = [...liveAlerts, ...dbAlerts].filter(
    (v, i, a) => a.findIndex((t) => (t._id && t._id === v._id) || (t.title === v.title && t.message === v.message)) === i
  );

  const handleRemove = async (symbol) => {
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
        setWatchlistSymbols((prev) => prev.filter((s) => s !== symbol));
        refreshUserData();
      }
    } catch (err) {
      console.error('Error removing from watchlist:', err);
    }
  };

  const handleClearAlerts = async () => {
    clearAllAlerts();
    setDbAlerts([]);
    if (!token) return;
    try {
      await fetch('/api/watchlist/alerts', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {}
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: '4px' }}>
            Watchlist & Alerts
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            Track favorites and get instant breakout, volume and corporate-action alerts.
          </p>
        </div>

        <Link
          to="/markets"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px',
            backgroundColor: '#10b981',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: 700,
            boxShadow: '0 4px 10px rgba(16, 185, 129, 0.25)'
          }}
        >
          <Plus size={16} /> Add stocks
        </Link>
      </div>

      {/* Main 2-Column Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.4fr) minmax(340px, 1fr)',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Left: My Watchlist Table */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Star size={18} color="#eab308" fill="#eab308" />
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
              My Watchlist ({watchlistSymbols.length})
            </h2>
          </div>

          {watchlistSymbols.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: '#94a3b8' }}>
              <Star size={32} style={{ marginBottom: '10px', color: '#cbd5e1' }} />
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>Your watchlist is empty</div>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>
                Star any stock from the Markets page or Stock Detail to monitor live movements here.
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
                    <th style={{ padding: '12px 20px', textAlign: 'left' }}>Instrument</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>LTP</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Day</th>
                    <th style={{ padding: '12px 20px', textAlign: 'center' }}>Trend</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {watchlistSymbols.map((sym) => {
                    const stock = instrumentsMap.get(sym);
                    const isUp = stock ? stock.dailyPercentageChange >= 0 : true;

                    return (
                      <tr
                        key={sym}
                        style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.15s ease' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <td style={{ padding: '14px 20px' }}>
                          <Link to={`/markets/${sym}`}>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{sym}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{stock?.name || 'Stock'}</div>
                          </Link>
                        </td>

                        <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                          ₹{stock?.currentPrice?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '—'}
                        </td>

                        <td style={{
                          padding: '14px 16px',
                          textAlign: 'right',
                          fontWeight: 700,
                          color: isUp ? '#059669' : '#e11d48'
                        }}>
                          {isUp ? '+' : ''}{stock?.dailyPercentageChange?.toFixed(2)}%
                        </td>

                        <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-block' }}>
                            <Sparkline points={stock?.sparkline} isUp={isUp} width={80} height={24} />
                          </div>
                        </td>

                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                            <Link
                              to={`/markets/${sym}`}
                              style={{
                                padding: '4px 10px',
                                borderRadius: '6px',
                                backgroundColor: '#0f172a',
                                color: '#ffffff',
                                fontSize: '11px',
                                fontWeight: 600
                              }}
                            >
                              Trade
                            </Link>
                            <button
                              onClick={() => handleRemove(sym)}
                              title="Remove from watchlist"
                              style={{
                                padding: '4px',
                                borderRadius: '6px',
                                color: '#94a3b8'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Live Market & Watchlist Alerts */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={18} color="#f43f5e" />
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                Alerts ({allAlerts.length})
              </h2>
            </div>
            {allAlerts.length > 0 && (
              <button
                onClick={handleClearAlerts}
                style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}
              >
                Clear
              </button>
            )}
          </div>

          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '500px', overflowY: 'auto' }}>
            {allAlerts.length === 0 ? (
              <div style={{ padding: '36px 16px', textAlign: 'center', color: '#94a3b8' }}>
                <Bell size={28} style={{ marginBottom: '8px' }} />
                <div style={{ fontSize: '13px', fontWeight: 600 }}>No active alerts</div>
                <div style={{ fontSize: '11px', marginTop: '2px' }}>
                  Breakout warnings, dividend notices, and volume spikes will appear here in real-time.
                </div>
              </div>
            ) : (
              allAlerts.map((alt, idx) => (
                <div
                  key={alt._id || idx}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: alt.type === 'BREAKOUT' ? '#10b981' : alt.type === 'CORPORATE_ACTION' ? '#f59e0b' : '#3b82f6',
                      marginTop: '6px',
                      flexShrink: 0
                    }} />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                        {alt.title}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', lineHeight: 1.4 }}>
                        {alt.message}
                      </div>
                      <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
                        {alt.createdAt ? new Date(alt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => dismissAlert(alt._id)}
                    style={{ color: '#94a3b8', padding: '2px' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

