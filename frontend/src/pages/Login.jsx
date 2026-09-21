import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, X, Clock } from 'lucide-react';
import '../styles/Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState(1); // Step 1: Request Email, Step 2: Enter Code & New Password
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [rateLimitCooldown, setRateLimitCooldown] = useState(0);

  const { login, demoLogin, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Rate-limit countdown timer
  useEffect(() => {
    if (rateLimitCooldown <= 0) return;
    const timer = setInterval(() => {
      setRateLimitCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [rateLimitCooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to log in');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await demoLogin();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Request Reset Code
  const handleForgotPasswordRequest = async (e) => {
    e.preventDefault();
    if (rateLimitCooldown > 0) return;

    setForgotError('');
    setForgotMessage('');
    setForgotLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });

      const data = await res.json();
      if (!res.ok) {
        setForgotError(data.message || 'Request failed.');
        if (res.status === 429) {
          setRateLimitCooldown(60);
        }
      } else {
        setForgotMessage(data.message || 'Reset code sent successfully!');
        // Transition to Step 2: Enter verification code & new password
        setForgotStep(2);
        setRateLimitCooldown(60);
      }
    } catch (err) {
      setForgotError('Network error. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 2: Verify Code and Update Password (using backend-matching 'resetCode')
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotMessage('');
    setForgotLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail,
          resetCode: resetCode.trim(), // Matches backend req.body.resetCode
          newPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setForgotError(data.message || 'Failed to reset password.');
      } else {
        setForgotMessage('Password successfully updated! You can now log in.');
        setTimeout(() => {
          setShowForgotModal(false);
          setForgotStep(1);
          setResetCode('');
          setNewPassword('');
        }, 2000);
      }
    } catch (err) {
      setForgotError('Network error. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <Activity size={20} strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
              TradeZen
            </span>
          </Link>
        </div>

        <div className="auth-header">
          <h1>Welcome back</h1>
          <p>Log in to your account</p>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {/* Continue with Google button */}
        <button
          type="button"
          className="google-btn"
          onClick={handleDemoLogin}
          title="Sign in with Google demo authentication"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          Continue with Google
        </button>

        <div className="divider">
          <span>OR</span>
        </div>

        {/* Login Form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label" htmlFor="login-password">Password</label>
              <button
                type="button"
                className="forgot-link"
                onClick={() => {
                  setForgotEmail(email);
                  setForgotStep(1);
                  setResetCode('');
                  setNewPassword('');
                  setForgotError('');
                  setForgotMessage('');
                  setShowForgotModal(true);
                }}
              >
                Forgot password?
              </button>
            </div>
            <input
              id="login-password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>

          <button
            type="button"
            className="demo-login-btn"
            onClick={handleDemoLogin}
            disabled={loading}
          >
            ⚡ Instant 1-Click Demo Login (₹50k Demo Cash)
          </button>
        </form>

        <div className="auth-footer">
          Don’t have an account? <Link to="/signup">Create one.</Link>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
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
            maxWidth: '420px',
            padding: '28px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                {forgotStep === 1 ? 'Reset Password' : 'Enter Reset Code & New Password'}
              </h3>
              <button onClick={() => setShowForgotModal(false)} style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {forgotError && <div className="error-banner" style={{ marginBottom: '12px' }}>{forgotError}</div>}
            {forgotMessage && <div className="success-banner" style={{ marginBottom: '12px', padding: '10px', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '8px', fontSize: '13px' }}>{forgotMessage}</div>}

            {/* STEP 1: Enter Email Form */}
            {forgotStep === 1 && (
              <>
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '18px', lineHeight: 1.5 }}>
                  Enter your account email below. We will generate and send your secure reset code.
                </p>
                <form onSubmit={handleForgotPasswordRequest} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="you@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />

                  <button
                    type="submit"
                    className="submit-btn"
                    disabled={forgotLoading || rateLimitCooldown > 0}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    {rateLimitCooldown > 0 ? (
                      <>
                        <Clock size={16} /> Wait {rateLimitCooldown}s
                      </>
                    ) : forgotLoading ? (
                      'Sending Code...'
                    ) : (
                      'Send Reset Code'
                    )}
                  </button>
                </form>
              </>
            )}

            {/* STEP 2: Enter Code & New Password Form */}
            {forgotStep === 2 && (
              <form onSubmit={handleResetPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px', lineHeight: 1.5 }}>
                  Code sent to <strong>{forgotEmail}</strong>. Enter the code and your new password below.
                </p>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>Reset Code</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter reset code"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="submit-btn"
                  disabled={forgotLoading}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '6px' }}
                >
                  {forgotLoading ? 'Updating Password...' : 'Reset Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}