import React, { useState, useEffect } from 'react';
import LoanManager from './LoanManager';
import Login from './components/Login';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';
import './App.css';

const SESSION_KEY = 'goldloan_session';
const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours — matches JWT expiry

const getStoredSession = () => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { branch, expiresAt } = JSON.parse(raw);
    if (Date.now() >= expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return { branch, expiresAt };
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
};

function App() {
  const stored = getStoredSession();
  const [currentBranch, setCurrentBranch] = useState(stored?.branch || null);
  const [sessionExpiresAt, setSessionExpiresAt] = useState(stored?.expiresAt || null);

  const handleLogin = (branchData) => {
    const expiresAt = Date.now() + SESSION_DURATION;
    localStorage.setItem(SESSION_KEY, JSON.stringify({ branch: branchData, expiresAt }));
    setCurrentBranch(branchData);
    setSessionExpiresAt(expiresAt);
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setCurrentBranch(null);
    setSessionExpiresAt(null);
  };

  const handleUpdateBranch = (branchData) => {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      const { expiresAt } = JSON.parse(raw);
      localStorage.setItem(SESSION_KEY, JSON.stringify({ branch: branchData, expiresAt }));
    }
    setCurrentBranch(branchData);
  };

  // Auto-logout when JWT expires
  useEffect(() => {
    if (!sessionExpiresAt) return;
    const remaining = sessionExpiresAt - Date.now();
    if (remaining <= 0) { handleLogout(); return; }
    const timer = setTimeout(handleLogout, remaining);
    return () => clearTimeout(timer);
  }, [sessionExpiresAt]);

  // Auto-logout on 401 from any API call
  useEffect(() => {
    const onAuthLogout = () => handleLogout();
    window.addEventListener('auth:logout', onAuthLogout);
    return () => window.removeEventListener('auth:logout', onAuthLogout);
  }, []);

  return (
    <ErrorBoundary>
      <ToastProvider>
        <div className="h-screen bg-slate-900 overflow-hidden">
          {!currentBranch ? (
            <Login onLogin={handleLogin} />
          ) : (
            <LoanManager
              currentBranch={currentBranch}
              onUpdateBranch={handleUpdateBranch}
              onLogout={handleLogout}
              sessionExpiresAt={sessionExpiresAt}
            />
          )}
        </div>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
