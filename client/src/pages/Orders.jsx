import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ReceiptText, 
  Clock, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Orders() {
  const { token, refreshUserData } = useAuth();

  const [activeTab, setActiveTab] = useState('AUDIT'); // 'AUDIT' | 'PENDING' | 'STOCK_PNL'
  const [orders, setOrders] = useState([]);
  const [stockPnL, setStockPnL] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelMessage, setCancelMessage] = useState('');

  // Fetch orders and per-stock P&L metrics
  useEffect(() => {
    async function loadOrdersData() {
      if (!token) return;
      try {
        const [ordRes, pnlRes] = await Promise.all([
          fetch('/api/trades/orders', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/trades/stock-pnl', { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if (ordRes.ok) {
          const ordData = await ordRes.json();
          setOrders(ordData.orders || []);
        }

        if (pnlRes.ok) {
          const pnlData = await pnlRes.json();
          setStockPnL(pnlData.stocks || []);
        }
      } catch (err) {
        console.error('Error loading orders data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadOrdersData();
  }, [token]);

  // Cancel pending order
  const handleCancelOrder = async (orderId) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/trades/cancel/${orderId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setCancelMessage('Order cancelled successfully. Funds restored.');
        setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status: 'CANCELLED' } : o)));
        refreshUserData();
        setTimeout(() => setCancelMessage(''), 3000);
      }
    } catch (err) {
      console.error('Failed to cancel order:', err);
    }
  };

  const executedOrders = orders.filter((o) => o.status === 'EXECUTED');
  const pendingOrders = orders.filter((o) => o.status === 'PENDING');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: '4px' }}>
          Orders & Transactions
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b' }}>
          Live order queue, executed transaction audit logs, and per-stock P&L breakdown.
        </p>
      </div>

      {cancelMessage && (
        <div style={{
          padding: '10px 16px',
          borderRadius: '10px',
          backgroundColor: '#ecfdf5',
          border: '1px solid #a7f3d0',
          color: '#059669',
          fontSize: '13px',
          fontWeight: 600
        }}>
          {cancelMessage}
        </div>
      )}

      {/* Tabs Switcher */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid #e2e8f0',
        paddingBottom: '12px'
      }}>
        <button
          onClick={() => setActiveTab('AUDIT')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 600,
            backgroundColor: activeTab === 'AUDIT' ? '#0f172a' : '#ffffff',
            color: activeTab === 'AUDIT' ? '#ffffff' : '#64748b',
            border: `1px solid ${activeTab === 'AUDIT' ? '#0f172a' : '#e2e8f0'}`
          }}
        >
          <ReceiptText size={16} /> All Executions ({executedOrders.length})
        </button>

        <button
          onClick={() => setActiveTab('PENDING')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 600,
            backgroundColor: activeTab === 'PENDING' ? '#0f172a' : '#ffffff',
            color: activeTab === 'PENDING' ? '#ffffff' : '#64748b',
            border: `1px solid ${activeTab === 'PENDING' ? '#0f172a' : '#e2e8f0'}`
          }}
        >
          <Clock size={16} /> Pending Queue ({pendingOrders.length})
        </button>

        <button
          onClick={() => setActiveTab('STOCK_PNL')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 600,
            backgroundColor: activeTab === 'STOCK_PNL' ? '#0f172a' : '#ffffff',
            color: activeTab === 'STOCK_PNL' ? '#ffffff' : '#64748b',
            border: `1px solid ${activeTab === 'STOCK_PNL' ? '#0f172a' : '#e2e8f0'}`
          }}
        >
          <BarChart3 size={16} /> Per-Stock P&L Breakdown ({stockPnL.length})
        </button>
      </div>

      {/* TAB 1: ALL EXECUTED ORDERS */}
      {activeTab === 'AUDIT' && (
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden'
        }}>
          {executedOrders.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: '#94a3b8' }}>
              <ReceiptText size={32} style={{ marginBottom: '10px', color: '#cbd5e1' }} />
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>No orders executed yet</div>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>
                Visit <Link to="/markets" style={{ color: '#10b981', textDecoration: 'underline' }}>Markets</Link> to buy your first stock!
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
                    <th style={{ padding: '12px 24px', textAlign: 'left' }}>Time</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Type</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Instrument</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Quantity</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Executed Price</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Total Value</th>
                    <th style={{ padding: '12px 24px', textAlign: 'right' }}>Realized P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {executedOrders.map((ord) => {
                    const isBuy = ord.side === 'BUY';
                    const totalVal = ord.quantity * ord.price;
                    const dateStr = new Date(ord.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' });
                    const timeStr = new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    return (
                      <tr
                        key={ord._id}
                        style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.15s ease' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <td style={{ padding: '14px 24px', color: '#64748b', whiteSpace: 'nowrap' }}>
                          <div>{dateStr}</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{timeStr}</div>
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            backgroundColor: isBuy ? '#ecfdf5' : '#fff1f2',
                            color: isBuy ? '#059669' : '#e11d48'
                          }}>
                            {isBuy ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
                            {ord.side}
                          </span>
                        </td>

                        {/* Clickable stock symbol that directly redirects to /markets/:id */}
                        <td style={{ padding: '14px 16px' }}>
                          <Link
                            to={`/markets/${ord.instrumentToken}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontWeight: 700,
                              color: '#0f172a'
                            }}
                            title="Click to view instrument in market"
                          >
                            <span>{ord.instrumentToken}</span>
                            <ExternalLink size={12} color="#94a3b8" />
                          </Link>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{ord.name}</div>
                        </td>

                        <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 600, color: '#1e293b' }}>
                          {ord.quantity}
                        </td>

                        <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#0f172a' }}>
                          ₹{ord.price?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>

                        <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#0f172a' }}>
                          ₹{totalVal?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>

                        <td style={{
                          padding: '14px 24px',
                          textAlign: 'right',
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono)',
                          color: !isBuy ? (ord.realizedPnL >= 0 ? '#059669' : '#e11d48') : '#94a3b8'
                        }}>
                          {!isBuy ? `${ord.realizedPnL >= 0 ? '+' : ''}₹${ord.realizedPnL?.toFixed(2)}` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PENDING LIMIT ORDERS */}
      {activeTab === 'PENDING' && (
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden'
        }}>
          {pendingOrders.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: '#94a3b8' }}>
              <Clock size={32} style={{ marginBottom: '10px', color: '#cbd5e1' }} />
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>No pending limit orders</div>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>
                When you place a limit order with a trigger price, it waits in this execution queue until the market hits your target.
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
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Side</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Quantity</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Trigger Limit Price</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Order Total</th>
                    <th style={{ padding: '12px 24px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingOrders.map((ord) => (
                    <tr key={ord._id} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '14px 24px' }}>
                        <Link to={`/markets/${ord.instrumentToken}`} style={{ fontWeight: 700, color: '#0f172a' }}>
                          {ord.instrumentToken}
                        </Link>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{ord.name}</div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: ord.side === 'BUY' ? '#ecfdf5' : '#fff1f2',
                          color: ord.side === 'BUY' ? '#059669' : '#e11d48'
                        }}>
                          {ord.side} LIMIT
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 600 }}>
                        {ord.quantity}
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#0f172a' }}>
                        ₹{ord.triggerPrice?.toFixed(2)}
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                        ₹{(ord.quantity * ord.triggerPrice).toFixed(2)}
                      </td>

                      <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleCancelOrder(ord._id)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            backgroundColor: '#fee2e2',
                            color: '#b91c1c',
                            fontSize: '12px',
                            fontWeight: 600
                          }}
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PER-STOCK P&L BREAKDOWN (BUY RATE, SELL RATE, NET PROFIT/LOSS) */}
      {activeTab === 'STOCK_PNL' && (
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
              Stock-Wise Profit & Loss Analysis
            </h2>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              Summary of all trades grouped by instrument with average buy rates, average sell rates, and total realized profit/loss.
            </p>
          </div>

          {stockPnL.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: '#94a3b8' }}>
              <BarChart3 size={32} style={{ marginBottom: '10px', color: '#cbd5e1' }} />
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>No stock transaction data</div>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>
                Buy and sell stocks to populate your stock-wise P&L metrics!
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
                    <th style={{ padding: '12px 24px', textAlign: 'left' }}>Stock Symbol</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Total Bought</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Avg Buy Rate</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Total Sold</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Avg Sell Rate</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Open Holding</th>
                    <th style={{ padding: '12px 24px', textAlign: 'right' }}>Realized P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {stockPnL.map((item) => {
                    const isProfit = item.realizedPnL >= 0;
                    return (
                      <tr
                        key={item.symbol}
                        style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.15s ease' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        {/* Clickable stock symbol redirecting to /markets/:id */}
                        <td style={{ padding: '14px 24px' }}>
                          <Link
                            to={`/markets/${item.symbol}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontWeight: 700,
                              color: '#0f172a'
                            }}
                          >
                            <span>{item.symbol}</span>
                            <ExternalLink size={12} color="#94a3b8" />
                          </Link>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{item.name}</div>
                        </td>

                        <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 600, color: '#1e293b' }}>
                          {item.totalBuyQty}
                        </td>

                        <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: '#475569' }}>
                          ₹{item.avgBuyRate?.toFixed(2)}
                        </td>

                        <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 600, color: '#1e293b' }}>
                          {item.totalSellQty}
                        </td>

                        <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: '#475569' }}>
                          ₹{item.avgSellRate > 0 ? item.avgSellRate?.toFixed(2) : '—'}
                        </td>

                        <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 600, color: '#1e293b' }}>
                          {item.currentHoldingQty > 0 ? `${item.currentHoldingQty} shares` : 'Closed'}
                        </td>

                        <td style={{
                          padding: '14px 24px',
                          textAlign: 'right',
                          fontWeight: 800,
                          fontFamily: 'var(--font-mono)',
                          color: isProfit ? '#059669' : '#e11d48',
                          fontSize: '14px'
                        }}>
                          {isProfit ? '+' : ''}₹{item.realizedPnL?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

