import React, { useMemo } from 'react';
import { useSocket } from '../context/SocketContext';
import { Link } from 'react-router-dom';

export default function HeaderTicker() {
  const { instruments } = useSocket();

  // Select top 30-40 liquid instruments for smooth continuous marquee
  const tickerItems = useMemo(() => {
    if (!instruments || instruments.length === 0) return [];
    return instruments.slice(0, 45);
  }, [instruments]);

  if (tickerItems.length === 0) {
    return (
      <div style={{
        height: '36px',
        backgroundColor: '#0a0a0c',
        color: '#9ca3af',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        fontWeight: 500,
        letterSpacing: '0.5px'
      }}>
        Loading TradeZen live market feed...
      </div>
    );
  }

  // Duplicate items array once to achieve infinite seamless loop
  const displayItems = [...tickerItems, ...tickerItems];

  return (
    <div
      className="ticker-container"
      style={{
        height: '36px',
        backgroundColor: '#09090b',
        borderBottom: '1px solid #27272a',
        overflow: 'hidden',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center'
      }}
    >
      <div className="ticker-marquee">
        {displayItems.map((item, idx) => {
          const isUp = item.dailyPercentageChange >= 0;
          return (
            <Link
              key={`${item.symbol}-${idx}`}
              to={`/markets/${item.symbol}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0 16px',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                textDecoration: 'none',
                color: '#e4e4e7',
                transition: 'opacity 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.75')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              <span style={{ fontWeight: 600, marginRight: '6px', color: '#f4f4f5' }}>
                {item.symbol}
              </span>
              <span style={{ marginRight: '6px', color: '#a1a1aa' }}>
                ₹{item.currentPrice?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span
                style={{
                  fontWeight: 600,
                  color: isUp ? '#10b981' : '#f43f5e',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px'
                }}
              >
                {isUp ? '▲' : '▼'} {isUp ? '+' : ''}{item.dailyPercentageChange?.toFixed(2)}%
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

