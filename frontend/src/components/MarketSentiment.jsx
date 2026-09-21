import React from 'react';
import { TrendingUp, TrendingDown, Gauge, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export default function MarketSentiment() {
  const { sentiment, instruments } = useSocket();

  // Pick top active sample stocks
  const sampleStocks = instruments.slice(0, 4);

  const isBullish = sentiment.mood === 'Bullish';
  const isBearish = sentiment.mood === 'Bearish';

  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '20px',
      padding: '28px',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #f1f5f9',
        paddingBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Gauge size={20} color="#64748b" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Demo Market Sentiment
          </span>
        </div>
        <span style={{
          fontSize: '12px',
          fontWeight: 600,
          color: '#10b981',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            display: 'inline-block'
          }} />
          LIVE SIMULATION
        </span>
      </div>

      {/* Sentiment Mood Card */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: isBullish ? '#f0fdf4' : isBearish ? '#fff1f2' : '#f8fafc',
        border: `1px solid ${isBullish ? '#bbf7d0' : isBearish ? '#fecdd3' : '#e2e8f0'}`,
        borderRadius: '14px',
        padding: '16px 20px'
      }}>
        <div>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
            Market Breadth Indicator
          </div>
          <div style={{
            fontSize: '24px',
            fontWeight: 800,
            color: isBullish ? '#15803d' : isBearish ? '#be123c' : '#0f172a',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {sentiment.mood}
            <span style={{ fontSize: '14px', fontWeight: 600 }}>
              ({sentiment.ratio}%)
            </span>
          </div>
        </div>

        <div style={{
          textAlign: 'right',
          fontSize: '12px',
          fontWeight: 600
        }}>
          <div style={{ color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
            <ArrowUpRight size={14} /> {sentiment.upCount} Advancing
          </div>
          <div style={{ color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginTop: '2px' }}>
            <ArrowDownLeft size={14} /> {sentiment.downCount} Declining
          </div>
        </div>
      </div>

      {/* Sample Live Instruments */}
      <div>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '10px', textTransform: 'uppercase' }}>
          Live Market Ticks
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {(sampleStocks.length > 0 ? sampleStocks : [
            { symbol: 'RELIANCE', name: 'Reliance Industries', currentPrice: 2985.4, dailyPercentageChange: 1.45 },
            { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', currentPrice: 1650.2, dailyPercentageChange: -0.62 },
            { symbol: 'MCX-GOLD', name: 'Gold 10g 999', currentPrice: 74850.0, dailyPercentageChange: 0.84 },
            { symbol: 'NIFTY-FUT', name: 'Nifty 50 Futures', currentPrice: 24510.5, dailyPercentageChange: 0.32 }
          ]).map((st) => {
            const up = st.dailyPercentageChange >= 0;
            return (
              <div
                key={st.symbol}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #f1f5f9'
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                    {st.symbol}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    {st.name}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
                    ₹{st.currentPrice?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: up ? '#059669' : '#e11d48'
                  }}>
                    {up ? '+' : ''}{st.dailyPercentageChange?.toFixed(2)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

