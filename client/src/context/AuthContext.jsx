import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

const TOKEN_KEY = 'tradezen_token';

function readStoredToken() {
  const t = localStorage.getItem(TOKEN_KEY);
  // guard against a previously stored "undefined" / "null" string
  return t && t !== 'undefined' && t !== 'null' ? t : null;
}

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [token, setToken] = useState(() => readStoredToken());
  const [loading, setLoading] = useState(true);

  // Load user data on mount if token exists
  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setUserState(null);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`
          },
          credentials: 'include'
        });

        if (res.ok) {
          const data = await res.json();
          setUserState(data.user);
        } else if (res.status === 401) {
          // Token invalid or expired
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setUserState(null);
        }
      } catch (err) {
        console.error('Failed to load user:', err);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [token]);

  /**
   * Public setUser.
   * Signup/Login pages store the new token in localStorage and then call setUser(user).
   * We also pick that token up here, so the rest of the app (which reads `token`
   * from this context) is authenticated immediately - without a page reload.
   */
  const setUser = useCallback((nextUser) => {
    setUserState(nextUser);
    const stored = readStoredToken();
    if (stored) {
      setToken((prev) => (prev === stored ? prev : stored));
    }
  }, []);

  // Login handler
  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      if (res.status === 403 && data.needsVerification) {
        return { needsVerification: true, email: data.email, verificationCode: data.verificationCode, message: data.message };
      }
      throw new Error(data.message || 'Login failed');
    }

    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUserState(data.user);
    return data.user;
  };

  // Register handler (₹50,000 demo capital credited after email verification)
  // Returns { needsVerification, email, verificationCode } - the user must verify with the 6-digit code.
  const register = async (name, email, password) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    return {
      needsVerification: true,
      email: data.email || email,
      verificationCode: data.verificationCode,
      message: data.message
    };
  };

  // Demo 1-Click Login handler
  const demoLogin = async () => {
    const res = await fetch('/api/auth/demo-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Demo login failed');
    }

    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUserState(data.user);
    return data.user;
  };

  // Refresh user balance and metrics
  const refreshUserData = useCallback(async () => {
    const currentToken = readStoredToken();
    if (!currentToken) return;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${currentToken}` },
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setUserState(data.user);
      } else if (res.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUserState(null);
      }
    } catch (err) {
      console.error('Refresh user data error:', err);
    }
  }, []);

  // Logout handler
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (e) {
      // Ignore network errors on logout
    }
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUserState(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    demoLogin,
    logout,
    refreshUserData,
    setUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
