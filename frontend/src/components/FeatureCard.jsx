import React from 'react';

export default function FeatureCard({ icon: Icon, title, description, badge }) {
  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '16px',
      padding: '28px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
      transition: 'all 0.2s ease',
      position: 'relative'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 12px 20px -3px rgba(0, 0, 0, 0.08)';
      e.currentTarget.style.borderColor = '#cbd5e1';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
      e.currentTarget.style.borderColor = '#e2e8f0';
    }}>
      {badge && (
        <span style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          fontSize: '11px',
          fontWeight: 700,
          color: '#059669',
          backgroundColor: '#ecfdf5',
          padding: '2px 8px',
          borderRadius: '9999px',
          border: '1px solid #a7f3d0'
        }}>
          {badge}
        </span>
      )}

      <div style={{
        width: '44px',
        height: '44px',
        borderRadius: '12px',
        backgroundColor: '#f1f5f9',
        color: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Icon size={22} strokeWidth={2} />
      </div>

      <h3 style={{
        fontSize: '18px',
        fontWeight: 700,
        color: '#0f172a',
        marginTop: '4px'
      }}>
        {title}
      </h3>

      <p style={{
        fontSize: '14px',
        color: '#64748b',
        lineHeight: 1.6
      }}>
        {description}
      </p>
    </div>
  );
}

