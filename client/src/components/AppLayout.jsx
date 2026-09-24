import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import HeaderTicker from './HeaderTicker';
import Sidebar from './Sidebar';
import ZenAICopilot from './ZenAICopilot';
import { useAuth } from '../context/AuthContext';
import { LogOut, Wallet } from 'lucide-react';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <div
      style={{
        height: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: '#f9fafb'
      }}
    >
      <div style={{ flexShrink: 0 }}>
        <HeaderTicker />
      </div>

      <div className="app-layout">
        <Sidebar />

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            minHeight: 0
          }}
        >
          <header
            style={{
              height: '56px',
              flexShrink: 0,
              backgroundColor: '#ffffff',
              borderBottom: '1px solid #e5e7eb',
              padding: '0 32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxSizing: 'border-box'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: '#64748b'
              }}
            >
              <span>Paper Trading Arena</span>
              <span>·</span>
              <span style={{ color: '#10b981', fontWeight: 600 }}>Live Simulated Feed</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Link
                to="/add-funds"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  color: '#0f172a'
                }}
              >
                <Wallet size={15} color="#10b981" />
                <span>
                  ₹{user?.virtualCashBalance?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '50,000.00'}
                </span>
              </Link>

              <button
                onClick={handleSignOut}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fecdd3',
                  color: '#dc2626',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                title="Sign out of your TradeZen account"
              >
                <LogOut size={14} />
                <span>Sign out</span>
              </button>
            </div>
          </header>

          <main className="app-scroll">
            <div className="app-main">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      <ZenAICopilot />
    </div>
  );
}