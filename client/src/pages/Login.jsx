import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, X, Clock, Mail, CheckCircle2, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import '../styles/Login.css';
import '../styles/Signup.css';

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

  // Email verification modal state (for unverified accounts during login)
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [verifySuccess, setVerifySuccess] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyCooldown, setVerifyCooldown] = useState(0);
  const [devCode, setDevCode] = useState('');

  const { login, demoLogin, isAuthenticated, setUser } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Rate-limit countdown timer for forgot password
  useEffect(() => {
    if (rateLimitCooldown <= 0) return;
    const timer = setInterval(() => {
      setRateLimitCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [rateLimitCooldown]);

  // Resend cooldown timer for email verification
  useEffect(() => {
    if (verifyCooldown <= 0) return;
    const timer = setInterval(() => {
      setVerifyCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [verifyCooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res && res.needsVerification) {
        setVerifyEmail(res.email || email);
        setDevCode(res.verificationCode || '');
        setVerifyError('');
        setVerifySuccess(res.message || 'Your email is not verified yet. We sent a 6-digit code to activate your account.');
        setShowVerifyModal(true);
        setVerifyCooldown(60);
        return;
      }
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
        credentials: 'include',
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
        setForgotStep(2);
        setRateLimitCooldown(60);
      }
    } catch (err) {
      setForgotError('Network error. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 2: Verify Code and Update Password
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotMessage('');
    setForgotLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: forgotEmail,
          resetCode: resetCode.trim(),
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

  // Verify Email Submit
  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!verifyCode || verifyCode.trim().length !== 6) {
      return setVerifyError('Please enter the 6-digit verification code.');
    }

    setVerifyError('');
    setVerifyLoading(true);

    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: verifyEmail, code: verifyCode.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        setVerifyError(data.message || 'Verification failed.');
      } else {
        localStorage.setItem('tradezen_token', data.token);
        setUser(data.user);
        try {
          confetti({
            particleCount: 90,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch (err) {}
        setShowVerifyModal(false);
        navigate('/dashboard');
      }
    } catch (err) {
      setVerifyError('Network error during verification.');
    } finally {
      setVerifyLoading(false);
    }
  };

  // Resend Email Verification Code
  const handleResendVerifyCode = async () => {
    if (verifyCooldown > 0) return;
    setVerifyError('');
    setVerifySuccess('');

    try {
      const res = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: verifyEmail })
      });

      const data = await res.json();
      if (!res.ok) {
        setVerifyError(data.message || 'Failed to resend code.');
      } else {
        setDevCode(data.verificationCode || '');
        setVerifySuccess(`New 6-digit code dispatched to ${verifyEmail}.`);
        setVerifyCooldown(60);
      }
    } catch (err) {
      setVerifyError('Network error resending verification code.');
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

        <div className="auth-footer" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div>
            Don’t have an account? <Link to="/signup" style={{ fontWeight: 700, color: '#10b981' }}>Create one.</Link>
          </div>
          <div>
            <button
              type="button"
              onClick={() => {
                setVerifyEmail(email);
                setVerifyCode('');
                setVerifyError('');
                setVerifySuccess('');
                setShowVerifyModal(true);
              }}
              style={{ fontSize: '12px', color: '#64748b', textDecoration: 'underline', cursor: 'pointer' }}
            >
              Need to verify your email? Enter code here
            </button>
          </div>
        </div>
      </div>

      {/* Email Verification Modal (for unverified email accounts) */}
      {showVerifyModal && (
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
            padding: '32px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={20} color="#10b981" />
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  Verify Your Email
                </h3>
              </div>
              <button onClick={() => setShowVerifyModal(false)} style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px', lineHeight: 1.5 }}>
              Enter the 6-digit verification code sent to <strong>{verifyEmail || 'your email'}</strong> to activate your ₹50,000 demo capital.
            </p>

            {devCode && (
              <div style={{
                backgroundColor: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '12px',
                color: '#065f46',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <CheckCircle2 size={16} color="#10b981" />
                <span>Verification Code: <strong>{devCode}</strong></span>
              </div>
            )}

            {verifyError && <div className="error-banner" style={{ marginBottom: '16px' }}>{verifyError}</div>}
            {verifySuccess && !devCode && (
              <div style={{
                backgroundColor: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '12px',
                color: '#065f46',
                marginBottom: '16px'
              }}>
                {verifySuccess}
              </div>
            )}

            <form onSubmit={handleVerifySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {!verifyEmail && (
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '12px' }}>Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="you@example.com"
                    value={verifyEmail}
                    onChange={(e) => setVerifyEmail(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '12px' }}>6-Digit OTP Code</label>
                <input
                  type="text"
                  maxLength={6}
                  className="form-input"
                  placeholder="123456"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                  style={{ textAlign: 'center', fontSize: '22px', fontWeight: 800, letterSpacing: '6px' }}
                  required
                />
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={verifyLoading}
                style={{ marginTop: '6px' }}
              >
                {verifyLoading ? 'Verifying...' : 'Verify & Enter TradeZen'}
              </button>

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={handleResendVerifyCode}
                  disabled={verifyCooldown > 0}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    color: verifyCooldown > 0 ? '#94a3b8' : '#10b981',
                    fontWeight: 600,
                    cursor: verifyCooldown > 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  <RefreshCw size={13} />
                  {verifyCooldown > 0 ? `Resend code in ${verifyCooldown}s` : 'Resend 6-Digit Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
            {forgotMessage && <div className="success-banner" style={{ marginBottom: '12px' }}>{forgotMessage}</div>}

            {/* STEP 1: Request Reset Code Form */}
            {forgotStep === 1 && (
              <>
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '14px', lineHeight: 1.5 }}>
                  Enter your registered TradeZen email address to receive password reset instructions.
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