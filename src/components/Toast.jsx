import React, { useEffect, useState, useContext, createContext } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

/**
 * Toast notification component
 */
const Toast = ({ type = 'info', message, duration = 4000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const toastStyles = {
    success: {
      bg: 'bg-green-500/20',
      border: 'border-green-500/30',
      text: 'text-green-300',
      icon: CheckCircle,
    },
    error: {
      bg: 'bg-red-500/20',
      border: 'border-red-500/30',
      text: 'text-red-300',
      icon: AlertTriangle,
    },
    warning: {
      bg: 'bg-yellow-500/20',
      border: 'border-yellow-500/30',
      text: 'text-yellow-300',
      icon: AlertCircle,
    },
    info: {
      bg: 'bg-blue-500/20',
      border: 'border-blue-500/30',
      text: 'text-blue-300',
      icon: Info,
    },
  };

  const style = toastStyles[type] || toastStyles.info;
  const Icon = style.icon;

  return (
    <div
      className={`
        fixed bottom-6 right-6 max-w-sm rounded-lg border
        backdrop-blur-xl p-4 flex items-start gap-3
        ${style.bg} ${style.border} ${style.text}
        animate-in fade-in slide-in-from-bottom-4 duration-300
        shadow-xl z-50
      `}
    >
      <Icon size={20} className="flex-shrink-0 mt-0.5" />
      <p className="text-sm font-medium flex-1">{message}</p>
      <button
        onClick={() => {
          setIsVisible(false);
          onClose?.();
        }}
        className="flex-shrink-0 hover:opacity-70 transition-opacity"
      >
        <X size={18} />
      </button>
    </div>
  );
};

/**
 * Toast Manager Context Provider
 */
let toastId = 0;

const useToast = () => {
  const [toasts, setToasts] = React.useState([]);

  const addToast = React.useCallback((message, type = 'info', duration = 4000) => {
    const id = toastId++;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    return id;
  }, []);

  const removeToast = React.useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showSuccess = React.useCallback((message) => addToast(message, 'success'), [addToast]);
  const showError = React.useCallback((message) => addToast(message, 'error'), [addToast]);
  const showWarning = React.useCallback((message) => addToast(message, 'warning'), [addToast]);
  const showInfo = React.useCallback((message) => addToast(message, 'info'), [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};

/**
 * Toast Container component
 */
const ToastContainer = ({ toasts, onRemove }) => {
  return (
    <div className="fixed bottom-6 right-6 space-y-3 pointer-events-none z-50">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            type={toast.type}
            message={toast.message}
            duration={toast.duration}
            onClose={() => onRemove(toast.id)}
          />
        </div>
      ))}
    </div>
  );
};

const ToastContext = createContext(null);

const ToastProvider = ({ children }) => {
  const toast = useToast();
  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </ToastContext.Provider>
  );
};

const useToastContext = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToastContext must be used within ToastProvider');
  return ctx;
};

export { useToast, useToastContext, ToastProvider, ToastContainer, Toast };
