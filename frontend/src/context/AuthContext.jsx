import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('atlas_auth_token'));
  const [merchant, setMerchant] = useState(() => {
    const saved = localStorage.getItem('atlas_merchant');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res = await api.auth.getMe();
          setMerchant(res.merchant);
          localStorage.setItem('atlas_merchant', JSON.stringify(res.merchant));
        } catch (err) {
          console.warn('[Auth] Token invalid or expired, resetting:', err.message);
          logout();
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  const handleAuthSuccess = (res) => {
    setToken(res.token);
    setMerchant(res.merchant);
    localStorage.setItem('atlas_auth_token', res.token);
    localStorage.setItem('atlas_merchant', JSON.stringify(res.merchant));
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
    localStorage.removeItem('atlas_auth_token');
    localStorage.removeItem('atlas_merchant');
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
      logout
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

