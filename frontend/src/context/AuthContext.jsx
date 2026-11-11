import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    try {
      const savedToken = localStorage.getItem('atlas_auth_token');
      return savedToken && savedToken !== 'null' && savedToken !== 'undefined' ? savedToken : null;
    } catch (e) {
      return null;
    }
  });

  const [merchant, setMerchant] = useState(() => {
    try {
      const saved = localStorage.getItem('atlas_merchant');
      return saved && saved !== 'undefined' && saved !== 'null' ? JSON.parse(saved) : null;
    } catch (e) {
      try {
        localStorage.removeItem('atlas_merchant');
      } catch (_) {}
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      if (!token) {
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      try {
        const res = await api.auth.getMe();
        if (isMounted && res?.merchant) {
          setMerchant(res.merchant);
          try {
            localStorage.setItem('atlas_merchant', JSON.stringify(res.merchant));
          } catch (_) {}
        }
      } catch (err) {
        if (!isMounted) return;

        // Distinguish genuine 401/403 auth failures from transient network or server errors
        const isAuthExpired = err.status === 401 || err.status === 403;

        if (isAuthExpired) {
          console.warn('[Auth] Token invalid or expired, resetting session:', err.message);
          logout();
        } else {
          // Network error (status 0) or temporary server downtime (500+):
          // Preserve valid local credentials and cached merchant profile rather than abruptly clearing session
          console.warn('[Auth] Backend profile sync temporarily unavailable (network/server issue); maintaining active session:', err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleAuthSuccess = (res) => {
    if (!res) return;
    setToken(res.token);
    setMerchant(res.merchant);
    try {
      if (res.token) localStorage.setItem('atlas_auth_token', res.token);
      if (res.merchant) localStorage.setItem('atlas_merchant', JSON.stringify(res.merchant));
    } catch (e) {
      console.warn('[Auth] Unable to save auth data to localStorage:', e);
    }
  };

  const login = async (email, password) => {
    const res = await api.auth.login({ email, password });
    handleAuthSuccess(res);
    return res;
  };

  const register = async (email, password, company_name, default_currency) => {
    const res = await api.auth.register({ email, password, company_name, default_currency });
    handleAuthSuccess(res);
    return res;
  };

  const demoLogin = async () => {
    const res = await api.auth.demoLogin();
    handleAuthSuccess(res);
    return res;
  };

  const logout = () => {
    setToken(null);
    setMerchant(null);
    try {
      localStorage.removeItem('atlas_auth_token');
      localStorage.removeItem('atlas_merchant');
    } catch (_) {}
  };

  const forgotPassword = async (email) => {
    return await api.auth.forgotPassword({ email });
  };

  const resetPassword = async (email, resetToken, new_password) => {
    return await api.auth.resetPassword({ email, token: resetToken, new_password });
  };

  return (
    <AuthContext.Provider value={{
      token,
      merchant,
      isAuthenticated: Boolean(token),
      loading,
      login,
      register,
      demoLogin,
      logout,
      forgotPassword,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
