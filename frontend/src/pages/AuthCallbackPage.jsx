import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { RefreshCw } from 'lucide-react';

export default function AuthCallbackPage({ setActivePage }) {
  const { demoLogin } = useAuth();

  useEffect(() => {
    async function handleCallback() {
      try {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        if (token) {
          localStorage.setItem('atlas_auth_token', token);
        } else {
          // If no token in callback query, verify or fallback to demo
          const existing = localStorage.getItem('atlas_auth_token');
          if (!existing) {
            await demoLogin();
          }
        }
        const destination = sessionStorage.getItem('atlas_redirect_after_login') || 'dashboard';
        sessionStorage.removeItem('atlas_redirect_after_login');
        setActivePage(destination.replace(/^\//, '') || 'dashboard');
      } catch (err) {
        console.error('[Auth Callback Error]:', err);
        setActivePage('login');
      }
    }
    handleCallback();
  }, []);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-teal-600/10 text-teal-500 flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin" />
      </div>
      <p className="text-xs font-semibold text-slate-400">
        Authenticating and verifying session...
      </p>
    </div>
  );
}

