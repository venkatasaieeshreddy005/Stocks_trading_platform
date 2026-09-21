import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Layers, 
  Cpu, 
  Award, 
  Zap, 
  TrendingUp, 
  Activity, 
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import FeatureCard from '../components/FeatureCard';
import MarketSentiment from '../components/MarketSentiment';
import HeaderTicker from '../components/HeaderTicker';
import { useAuth } from '../context/AuthContext';
import '../styles/Home.css';

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="home-container">
      {/* Live Scrolling Ticker Header */}
      <HeaderTicker />

      {/* Top Navigation */}
      <header className="home-nav">
        <div className="brand-logo-area">
          <div className="logo-icon-box">
            <Activity size={24} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
              TradeZen
            </div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
              PAPER TRADING
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn-primary" style={{ padding: '10px 20px', fontSize: '14px' }}>
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" style={{ fontSize: '14px', fontWeight: 600, color: '#475569', padding: '8px 16px' }}>
                Log in
              </Link>
              <Link to="/signup" className="btn-primary" style={{ padding: '10px 20px', fontSize: '14px' }}>
                Open Demo Account
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="home-hero">
        <div className="hero-content">
          <div className="hero-badge">
            <ShieldCheck size={16} /> 100% Risk-Free Virtual Capital
          </div>

          <h1 className="hero-title">
            Master the markets without risking a rupee.
          </h1>

          <p className="hero-subtitle">
            TradeZen is a gamified paper-trading platform. Practise on a live, simulated market with ₹50,000 of demo capital — build skill, build discipline, build confidence before you ever trade for real.
          </p>

          <div className="hero-actions">
            <Link to="/signup" className="btn-primary">
              Open a demo account <ArrowRight size={18} style={{ marginLeft: '8px' }} />
            </Link>
            <Link to="/markets" className="btn-secondary">
              Explore the market
            </Link>
          </div>
        </div>

        {/* Right-side market sentiment card */}
        <div>
          <MarketSentiment />
        </div>
      </section>

      {/* Feature Highlights Section */}
      <section className="home-section" style={{ backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
        <div className="section-header">
          <h2 className="section-title">Why Beginners & Pros Choose TradeZen</h2>
          <p className="section-subtitle">A professional Zerodha-style execution environment engineered for true financial literacy.</p>
        </div>

        <div className="features-grid">
          <FeatureCard
            icon={ShieldCheck}
            badge="ZERO RISK"
            title="No Real Money"
            description="Start with ₹50,000 in simulated demo cash. Experience real trading psychology, emotional management, and margin flows without losing a single paisa."
          />
          <FeatureCard
            icon={Layers}
            badge="MULTI ASSET"
            title="130+ Instruments"
            description="Trade leading Indian Equities (Reliance, INFY, HDFC), Precious Metals (Gold, Silver), Commodities (Crude, Gas), Govt. Bonds, and Index F&O."
          />
          <FeatureCard
            icon={Cpu}
            badge="AUTONOMOUS"
            title="Real-Time Price Engine"
            description="Powered by a high-performance stochastic engine streaming price ticks every 2 seconds via Socket.io. Experience realistic market drift, pullbacks, and breakout patterns 24/7."
          />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="home-section">
        <div className="section-header">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">From zero experience to disciplined market execution in three simple steps.</p>
        </div>

        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Register & Get ₹50,000</h3>
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
              Create your account in seconds. You instantly receive ₹50,000 of virtual practice capital ready to deploy across equities and commodities.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">2</div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Trade Real Technical Patterns</h3>
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
              Study support & resistance bounces, breakout channels, and momentum trends. Execute Market orders, Limit orders, and Stop-Loss configurations.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">3</div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Level Up Your Discipline</h3>
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
              Our algorithmic engine monitors win rate, risk mitigation, and trade pacing to advance your Trading Discipline Level from Novice to Market Master.
            </p>
          </div>
        </div>
      </section>

      {/* How To Profit & Benefit Section */}
      <section className="home-section" style={{ backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
        <div className="benefit-box">
          <div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Strategic Edge
            </span>
            <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', margin: '12px 0 16px 0', lineHeight: 1.25 }}>
              How You Benefit & Learn Real Profitability
            </h2>
            <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.7, marginBottom: '20px' }}>
              90% of retail traders lose real capital due to emotional overtrading, failing to cut losses early, and erratic position sizing. TradeZen solves this through algorithmic coaching.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={20} color="#10b981" />
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>
                  Learn Stop-Loss Discipline — Protect capital before looking for profits.
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={20} color="#10b981" />
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>
                  Eliminate Overtrading Penalties — Trade high-conviction setups only.
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={20} color="#10b981" />
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>
                  Full Per-Stock Audit — Track exact buy/sell rates and net realized P&L.
                </span>
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: '#0f172a',
            borderRadius: '16px',
            padding: '32px',
            color: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 700, letterSpacing: '1px' }}>
              DISCIPLINE TIER MATRIX
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700 }}>
              Level 14: Risk Manager
            </div>
            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6 }}>
              "Your stop-loss adherence is 88%. Losses are tightly capped at 1.5% while average winner generates 4.2%. Keep executing your risk playbook."
            </p>
            <div style={{
              height: '8px',
              backgroundColor: '#334155',
              borderRadius: '9999px',
              overflow: 'hidden'
            }}>
              <div style={{ width: '74%', height: '100%', backgroundColor: '#10b981' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8' }}>
              <span>Win Rate: 68%</span>
              <span>SL Ratio: 88%</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <p className="footer-disclaimer">
          Demo platform for education only. Prices are simulated and not investment advice. TradeZen does not solicit real funds or offer real securities brokerage.
        </p>
        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '12px' }}>
          &copy; {new Date().getFullYear()} TradeZen Financial Technologies. Engineered with MERN Stack & Socket.io.
        </div>
      </footer>
    </div>
  );
}

