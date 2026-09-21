import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, ShieldCheck, Sparkles, Mail, CheckCircle2, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import '../styles/Login.css';
import '../styles/Signup.css';

export default function Signup() {
  const [step, setStep] = useState('REGISTER'); // 'REGISTER' | 'VERIFY'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [devCode, setDevCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const { demoLogin, isAuthenticated, setUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    if (password.length < 6) {
      return setError('Password must be at least 6 characters long.');
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Registration failed');
      } else {
        setStep('VERIFY');
        setDevCode(data.verificationCode || '');
        setSuccess(`Verification code dispatched to ${email}.`);
        setResendCooldown(60);
      }
    } catch (err) {
      setError('Network error. Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      return setError('Please enter the 6-digit verification code.');
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otpCode.trim() })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Verification failed.');
      } else {
        localStorage.setItem('tradezen_token', data.token);
        setUser(data.user);

        // Confetti burst for receiving ₹50,000 demo cash
        try {
          confetti({
            particleCount: 90,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch (err) {}

        navigate('/dashboard');
      }
    } catch (err) {
      setError('Network error during verification.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Failed to resend code.');
      } else {
        setDevCode(data.verificationCode || '');
        setSuccess('A new 6-digit code has been sent.');
        setResendCooldown(60);
      }
    } catch (err) {
      setError('Network error resending code.');
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    setLoading(true);
    try {
      await demoLogin();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Google signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-wrapper">
      <div className="signup-card">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
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

        {step === 'REGISTER' ? (
          <>
            <div className="signup-header">
              <h1>Create your account</h1>
              <p>Sign up to get started</p>
            </div>

            <div className="capital-badge">
              <Sparkles size={16} /> ₹50,000 Demo Capital Credited Automatically
            </div>

            {error && <div className="error-banner">{error}</div>}

            {/* Continue with Google */}
            <button
              type="button"
              className="google-btn"
              onClick={handleGoogleSignup}
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

            <form className="signup-form" onSubmit={handleRegisterSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="signup-name">Full Name</label>
                <input
                  id="signup-name"
                  type="text"
                  className="form-input"
                  placeholder="Venkat Kasireddy"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="signup-email">Email Address</label>
                <input
                  id="signup-email"
                  type="email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="signup-password">Password</label>
                <input
                  id="signup-password"
                  type="password"
                  className="form-input"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="signup-confirm-password">Confirm Password</label>
                <input
                  id="signup-confirm-password"
                  type="password"
                  className="form-input"
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={loading}
              >
                {loading ? 'Sending Code...' : 'Create account & Verify'}
              </button>
            </form>

            <div className="auth-footer">
              Already have an account? <Link to="/login">Log in.</Link>
            </div>
          </>
        ) : (
          /* STEP 2: 6-DIGIT EMAIL VERIFICATION SCREEN */
          <div>
            <div className="signup-header">
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#ecfdf5',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px auto'
              }}>
                <Mail size={24} />
              </div>
              <h1>Verify your email</h1>
              <p>We sent a 6-digit code to <strong>{email}</strong></p>
            </div>

            {error && <div className="error-banner">{error}</div>}
            {success && <div className="success-banner">{success}</div>}

            {devCode && (
              <div style={{
                padding: '10px 14px',
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '10px',
                fontSize: '12px',
                color: '#1e40af',
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                🔑 Verification Code: <strong style={{ letterSpacing: '2px', fontSize: '15px' }}>{devCode}</strong>
                <button
                  type="button"
                  onClick={() => setOtpCode(devCode)}
                  style={{
                    marginLeft: '8px',
                    color: '#2563eb',
                    fontWeight: 700,
                    textDecoration: 'underline'
                  }}
                >
                  Auto-fill
                </button>
              </div>
            )}

            <form onSubmit={handleVerifySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label" style={{ textAlign: 'center' }}>
                  Enter 6-Digit Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '24px',
                    fontWeight: 800,
                    textAlign: 'center',
                    letterSpacing: '8px',
                    borderRadius: '12px',
                    border: '2px solid #cbd5e1',
                    fontFamily: 'var(--font-mono)',
                    boxSizing: 'border-box'
                  }}
                  autoFocus
                  required
                />
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={loading || otpCode.length !== 6}
              >
                {loading ? 'Verifying...' : 'Verify & Activate Account'}
              </button>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '13px',
                marginTop: '10px'
              }}>
                <button
                  type="button"
                  onClick={() => setStep('REGISTER')}
                  style={{ color: '#64748b' }}
                >
                  ← Change email
                </button>

                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0}
                  style={{
                    color: resendCooldown > 0 ? '#94a3b8' : '#10b981',
                    fontWeight: 600,
                    cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
