import React, { useState } from 'react';
import LoanManager from './LoanManager';
import Login from './components/Login';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastContainer, useToast } from './components/Toast';
import './App.css';

/**
 * Main App Component
 * Wrapper for entire application with error handling and toast notifications
 */
function App() {
  const [currentBranch, setCurrentBranch] = useState(null);
  const { toasts, removeToast } = useToast();

  const handleLogout = () => {
    setCurrentBranch(null);
  };

  return (
    <ErrorBoundary>
      <div className="h-screen bg-slate-900 overflow-hidden">
        {!currentBranch ? (
          <Login onLogin={setCurrentBranch} />
        ) : (
          <LoanManager
            currentBranch={currentBranch}
            onUpdateBranch={setCurrentBranch}
            onLogout={handleLogout}
          />
        )}
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </ErrorBoundary>
  );
}

export default App;
