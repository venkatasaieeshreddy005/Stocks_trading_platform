import React, { useState } from 'react';
import { CreditCard, Zap, CheckCircle2, ShieldCheck, Sparkles, X, QrCode } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';

export default function AddFunds() {
  const { user, token, refreshUserData } = useAuth();

  const [selectedPkg, setSelectedPkg] = useState(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState('CHOICE'); // 'CHOICE' | 'PROCESSING' | 'SUCCESS'
  const [successMessage, setSuccessMessage] = useState('');

  const packages = [
    {
      id: 'pkg_starter',
      title: 'Starter Leverage',
      price: 100,
      virtualCash: 10000,
      leverage: '100x',
      badge: 'Popular for Beginners',
      description: 'Perfect for testing intraday strategies on high-beta tech & banking stocks.'
    },
    {
      id: 'pkg_pro',
      title: 'Pro Trader Pack',
      price: 500,
      virtualCash: 100000,
      leverage: '200x',
      badge: 'Most Value',
      description: 'Ample headroom to run diversified equity portfolios & commodity swings.'
    },
    {
      id: 'pkg_master',
      title: 'Master Strategist',
      price: 1000,
      virtualCash: 250000,
      leverage: '250x',
      badge: 'Advanced',
      description: 'Enables advanced swing trading and Index options hedge strategies.'
    },
    {
      id: 'pkg_whale',
      title: 'Market Maker Tier',
      price: 2500,
      virtualCash: 1000000,
      leverage: '400x',
      badge: 'Max Leverage',
      description: 'Full high-net-worth portfolio simulation with 10 Lakhs in virtual cash.'
    }
  ];

  const handleStartCheckout = (pkg) => {
    setSelectedPkg(pkg);
    setCheckoutStep('CHOICE');
    setIsCheckingOut(true);
  };

  const handleSimulatePayment = async () => {
    if (!selectedPkg || !token) return;

    setCheckoutStep('PROCESSING');

    try {
      const res = await fetch('/api/funds/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amountPaid: selectedPkg.price,
          virtualCashAdded: selectedPkg.virtualCash,
          packageTitle: selectedPkg.title
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMessage(data.message);
        setCheckoutStep('SUCCESS');
        refreshUserData();

        // Celebration confetti burst
        try {
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.6 }
          });
        } catch (err) {}
      } else {
        alert(data.message || 'Payment simulation failed.');
        setIsCheckingOut(false);
      }
    } catch (err) {
      console.error('Add funds error:', err);
      setIsCheckingOut(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: '4px' }}>
          Leverage Expansion Hub
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b' }}>
          Expand your demo trading capital with micro-leverage conversion packages.
        </p>
      </div>

      {/* Current Balance Bar */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: '#10b981',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CreditCard size={20} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
              Current Available Demo Cash
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
              ₹{user?.virtualCashBalance?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '50,000.00'}
            </div>
          </div>
        </div>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 14px',
          borderRadius: '9999px',
          backgroundColor: '#f1f5f9',
          color: '#475569',
          fontSize: '12px',
          fontWeight: 600
        }}>
          <ShieldCheck size={16} color="#10b981" /> Instant Simulated Fulfillment
        </div>
      </div>

      {/* Packages Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px'
      }}>
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '28px 24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '20px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
              position: 'relative',
              transition: 'all 0.2s ease'
            }}
          >
            {pkg.badge && (
              <span style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                fontSize: '11px',
                fontWeight: 700,
                color: '#059669',
                backgroundColor: '#ecfdf5',
                padding: '3px 8px',
                borderRadius: '9999px',
                border: '1px solid #a7f3d0'
              }}>
                {pkg.badge}
              </span>
            )}

            <div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                {pkg.title}
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '6px', lineHeight: 1.5 }}>
                {pkg.description}
              </div>

              {/* Leverage Multiplier Badge */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '8px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                fontSize: '12px',
                fontWeight: 700,
                color: '#0f172a',
                marginTop: '16px'
              }}>
                <Zap size={14} color="#f59e0b" fill="#f59e0b" />
                {pkg.leverage} Leverage Multiplier
              </div>

              {/* Capital Amount Display */}
              <div style={{ marginTop: '20px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                  You Receive
                </div>
                <div style={{
                  fontSize: '28px',
                  fontWeight: 800,
                  color: '#059669',
                  fontFamily: 'var(--font-mono)'
                }}>
                  +₹{pkg.virtualCash.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Practice Virtual Capital
                </div>
              </div>
            </div>

            {/* Action Purchase Button */}
            <button
              onClick={() => handleStartCheckout(pkg)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)'
              }}
            >
              Expand for ₹{pkg.price}
            </button>
          </div>
        ))}
      </div>

      {/* Mock Payment Modal */}
      {isCheckingOut && selectedPkg && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '440px',
            padding: '28px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            position: 'relative'
          }}>
            <button
              onClick={() => setIsCheckingOut(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                color: '#94a3b8'
              }}
            >
              <X size={20} />
            </button>

            {checkoutStep === 'CHOICE' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
                    Mock Payment Gateway
                  </h3>
                  <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                    Simulate capital purchase without real transactions.
                  </p>
                </div>

                <div style={{
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                    <span style={{ color: '#64748b' }}>Package:</span>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{selectedPkg.title}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                    <span style={{ color: '#64748b' }}>Price:</span>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>₹{selectedPkg.price} (Simulated)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderTop: '1px dashed #cbd5e1', paddingTop: '8px' }}>
                    <span style={{ fontWeight: 600, color: '#059669' }}>Virtual Cash Credited:</span>
                    <span style={{ fontWeight: 800, color: '#059669', fontFamily: 'var(--font-mono)' }}>
                      ₹{selectedPkg.virtualCash.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '20px',
                  backgroundColor: '#fafafa',
                  borderRadius: '12px',
                  border: '1px solid #f1f5f9'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <QrCode size={90} color="#0f172a" style={{ margin: '0 auto 8px auto' }} />
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Demo Scan & Pay Simulation</div>
                  </div>
                </div>

                <button
                  onClick={handleSimulatePayment}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 700,
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
                  }}
                >
                  Confirm & Credit ₹{selectedPkg.virtualCash.toLocaleString('en-IN')}
                </button>
              </div>
            )}

            {checkoutStep === 'PROCESSING' && (
              <div style={{ textAlign: 'center', padding: '40px 16px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  border: '4px solid #e2e8f0',
                  borderTopColor: '#10b981',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 16px auto'
                }} />
                <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                  Processing Simulation...
                </h4>
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                  Adding leverage capital to your TradeZen ledger.
                </p>
              </div>
            )}

            {checkoutStep === 'SUCCESS' && (
              <div style={{ textAlign: 'center', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: '#dcfce7',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto'
                }}>
                  <CheckCircle2 size={32} />
                </div>

                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
                    Capital Expanded!
                  </h3>
                  <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                    {successMessage}
                  </p>
                </div>

                <button
                  onClick={() => setIsCheckingOut(false)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginTop: '8px'
                  }}
                >
                  Continue Trading
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

