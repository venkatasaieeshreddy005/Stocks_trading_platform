import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, TrendingUp, TrendingDown, ArrowDown } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export function Sparkline({ points = [], isUp = true, width = 100, height = 32 }) {
  if (!points || points.length < 2) {
    return <div style={{ width: `${width}px`, height: `${height}px` }} />;
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min === 0 ? 1 : max - min;
  const padding = 4;
  const h = height - padding * 2;

  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = height - padding - ((p - min) / range) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${coords.join(' L ')}`;
  const strokeColor = isUp ? '#10b981' : '#f43f5e';
  const fillColor = isUp ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)';

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <polygon points={`${coords.join(' ')} ${width},${height} 0,${height}`} fill={fillColor} />
      <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MoversCard({ title, items, isGain, onSelect }) {
  const color = isGain ? '#059669' : '#e11d48';
  const Icon = isGain ? TrendingUp : TrendingDown;

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '20px 24px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Icon size={18} color={color} />
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>{title}</h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {(items || []).slice(0, 5).map((stock, idx) => {
          const pct = Number(stock.dailyPercentageChange);
          return (
            <div
              key={stock.symbol}
              onClick={() => onSelect(stock.symbol)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 0',
                borderBottom: idx < 4 ? '1px solid #f8fafc' : 'none',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', width: '12px' }}>
                  {idx + 1}
                </span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{stock.symbol}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                    ₹{stock.currentPrice?.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color }}>
                {isGain && pct > 0 ? '+' : ''}
                {pct.toFixed(2)}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Markets() {
  const { instruments, movers } = useSocket();
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  const moversRef = useRef(null);

  const [typeFilter, setTypeFilter] = useState('All');
  const [sectorFilter, setSectorFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const typeTabs = ['All', 'Equity', 'Futures', 'Options', 'Govt Bond', 'Sovereign Gold'];

  const sectors = useMemo(() => {
    const set = new Set();
    instruments.forEach((item) => {
      if (item.sector) set.add(item.sector);
    });
    return ['All', ...Array.from(set).sort()];
  }, [instruments]);

  const filteredInstruments = useMemo(() => {
    return instruments.filter((item) => {
      const matchesType = typeFilter === 'All' || item.type === typeFilter;
      const matchesSector = sectorFilter === 'All' || item.sector === sectorFilter;
      const matchesSearch =
        searchQuery.trim() === '' ||
        item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesType && matchesSector && matchesSearch;
    });
  }, [instruments, typeFilter, sectorFilter, searchQuery]);

  const openInstrument = (symbol) => navigate(`/markets/${symbol}`);

  const scrollToMovers = () => {
    moversRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', paddingBottom: '90px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: '4px' }}>
            Markets
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            Discover and trade {instruments.length || 140} live simulated instruments.
          </p>
        </div>

        <button
          onClick={scrollToMovers}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '9999px',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: 600,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          <TrendingUp size={15} color="#34d399" />
          <TrendingDown size={15} color="#fb7185" />
          <span>Top Gainers & Losers</span>
          <ArrowDown size={15} />
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {typeTabs.map((tab) => {
            const isActive = typeFilter === tab;
            return (
              <button
                key={tab}
                onClick={() => setTypeFilter(tab)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '9999px',
                  fontSize: '13px',
                  fontWeight: 600,
                  backgroundColor: isActive ? '#0f172a' : '#ffffff',
                  color: isActive ? '#ffffff' : '#64748b',
                  border: `1px solid ${isActive ? '#0f172a' : '#e2e8f0'}`,
                  boxShadow: isActive ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>

        <div
          style={{
            position: 'relative',
            minWidth: '280px',
            maxWidth: '360px',
            width: '100%'
          }}
        >
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '13px' }} />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search symbol or name... (⌘K)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 38px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              fontSize: '13px',
              color: '#0f172a'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '11px',
                fontSize: '12px',
                color: '#94a3b8'
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '8px',
          whiteSpace: 'nowrap'
        }}
      >
        {sectors.map((sec) => {
          const isActive = sectorFilter === sec;
          return (
            <button
              key={sec}
              onClick={() => setSectorFilter(sec)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 500,
                backgroundColor: isActive ? '#ecfdf5' : '#ffffff',
                color: isActive ? '#059669' : '#64748b',
                border: `1px solid ${isActive ? '#a7f3d0' : '#f1f5f9'}`
              }}
            >
              {sec}
            </button>
          );
        })}
      </div>

      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
            All Instruments ({filteredInstruments.length})
          </h2>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr
                style={{
                  backgroundColor: '#f8fafc',
                  borderBottom: '1px solid #f1f5f9',
                  color: '#64748b',
                  fontWeight: 600,
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                <th style={{ padding: '12px 24px' }}>Instrument</th>
                <th style={{ padding: '12px 16px' }}>Sector</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Price</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Change</th>
                <th style={{ padding: '12px 24px', textAlign: 'center' }}>Trend</th>
                <th style={{ padding: '12px 24px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredInstruments.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                    No instruments match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredInstruments.map((item) => {
                  const isUp = item.dailyPercentageChange >= 0;
                  return (
                    <tr
                      key={item.symbol}
                      style={{
                        borderBottom: '1px solid #f8fafc',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '14px 24px' }}>
                        <Link to={`/markets/${item.symbol}`} style={{ display: 'block' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.symbol}</div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{item.name}</div>
                        </Link>
                      </td>

                      <td style={{ padding: '14px 16px', color: '#475569' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            backgroundColor: '#f1f5f9',
                            fontSize: '11px',
                            fontWeight: 500
                          }}
                        >
                          {item.sector}
                        </span>
                      </td>

                      <td
                        style={{
                          padding: '14px 16px',
                          textAlign: 'right',
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono)',
                          color: '#0f172a'
                        }}
                      >
                        ₹{item.currentPrice?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      <td
                        style={{
                          padding: '14px 16px',
                          textAlign: 'right',
                          fontWeight: 700,
                          color: isUp ? '#059669' : '#e11d48'
                        }}
                      >
                        {isUp ? '+' : ''}
                        {item.dailyPercentageChange?.toFixed(2)}%
                      </td>

                      <td style={{ padding: '14px 24px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-block' }}>
                          <Sparkline points={item.sparkline} isUp={isUp} width={90} height={28} />
                        </div>
                      </td>

                      <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                        <Link
                          to={`/markets/${item.symbol}`}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '8px',
                            backgroundColor: '#0f172a',
                            color: '#ffffff',
                            fontWeight: 600,
                            fontSize: '12px',
                            display: 'inline-block'
                          }}
                        >
                          Trade
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div
        ref={moversRef}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '20px'
        }}
      >
        <MoversCard title="Top Gainers" items={movers.gainers} isGain={true} onSelect={openInstrument} />
        <MoversCard title="Top Losers" items={movers.losers} isGain={false} onSelect={openInstrument} />
      </div>
    </div>
  );
}