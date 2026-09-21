import React from 'react';
import { CheckCircle, ArrowUpRight, ArrowDownLeft, X, Receipt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function OrderConfirmModal({ isOpen, onClose, orderDetails }) {
  const navigate = useNavigate();

  if (!isOpen || !orderDetails) return null;

  const isBuy = orderDetails.side === 'BUY';
  const totalAmount = orderDetails.quantity * orderDetails.price;

  return (
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
        borderRadius: '16px',
        width: '100%',
        maxWidth: '440px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        overflow: 'hidden',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#fafafa'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#dcfce7',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckCircle size={20} />
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                Order Executed
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Transaction confirmed instantly
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              color: '#94a3b8',
              padding: '4px',
              borderRadius: '6px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px' }}>
          {/* Main Badge Summary */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderRadius: '12px',
            backgroundColor: isBuy ? '#f0fdf4' : '#fff1f2',
            border: `1px solid ${isBuy ? '#bbf7d0' : '#fecdd3'}`,
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '13px',
                fontWeight: 700,
                color: isBuy ? '#15803d' : '#be123c',
                padding: '2px 8px',
                borderRadius: '6px',
                backgroundColor: isBuy ? '#dcfce7' : '#ffe4e6'
              }}>
                {isBuy ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                {orderDetails.side}
              </span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>
                {orderDetails.quantity} × {orderDetails.symbol}
              </span>
            </div>
            <span style={{
              fontSize: '12px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '6px',
              backgroundColor: '#ffffff',
              color: '#475569',
              border: '1px solid #e2e8f0'
            }}>
              {orderDetails.orderType || 'MARKET'}
            </span>
          </div>

          {/* Details Table */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            fontSize: '13px',
            borderBottom: '1px solid #f1f5f9',
            paddingBottom: '16px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Execution Rate</span>
              <span style={{ fontWeight: 600, color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
                ₹{orderDetails.price?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Quantity</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>
                {orderDetails.quantity} Shares
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Order Total</span>
              <span style={{ fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
                ₹{totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Brokerage & Taxes</span>
              <span style={{ fontWeight: 600, color: '#16a34a' }}>
                ₹0.00 (Demo Free)
              </span>
            </div>

            {/* Realized P&L on sell orders */}
            {!isBuy && orderDetails.realizedPnL !== undefined && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '8px',
                borderTop: '1px dashed #e2e8f0'
              }}>
                <span style={{ fontWeight: 600, color: '#334155' }}>Realized P&L</span>
                <span style={{
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: orderDetails.realizedPnL >= 0 ? '#16a34a' : '#dc2626'
                }}>
                  {orderDetails.realizedPnL >= 0 ? '+' : ''}₹{orderDetails.realizedPnL?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}

            {orderDetails.newBalance !== undefined && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Updated Virtual Cash</span>
                <span style={{ fontWeight: 600, color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
                  ₹{orderDetails.newBalance?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => {
                onClose();
                navigate('/orders');
              }}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                fontWeight: 600,
                color: '#334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Receipt size={16} />
              View Orders
            </button>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: '8px',
                backgroundColor: '#0f172a',
                fontSize: '13px',
                fontWeight: 600,
                color: '#ffffff'
              }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

