import React from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

/**
 * Error Boundary component for catching and displaying errors
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState((prev) => ({
      error,
      errorInfo,
      errorCount: prev.errorCount + 1,
    }));

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            {/* Error Card */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-red-500/30 p-8 shadow-2xl">
              {/* Error Icon */}
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-red-500/20 rounded-full">
                  <AlertTriangle className="text-red-400" size={48} />
                </div>
              </div>

              {/* Error Message */}
              <h1 className="text-3xl font-bold text-white text-center mb-4">
                Oops! Something went wrong
              </h1>

              <p className="text-slate-300 text-center mb-6">
                We encountered an unexpected error. Please try refreshing the page or going back to the dashboard.
              </p>

              {/* Error Details (Development Only) */}
              {isDevelopment && this.state.error && (
                <div className="mb-6 p-4 bg-slate-900/50 rounded-lg border border-red-500/20">
                  <h2 className="text-sm font-bold text-red-400 mb-2">Error Details:</h2>
                  <p className="text-xs text-slate-300 font-mono break-words mb-3">
                    {this.state.error.toString()}
                  </p>

                  {this.state.errorInfo && (
                    <details className="cursor-pointer">
                      <summary className="text-xs text-slate-400 hover:text-slate-300">
                        Stack Trace
                      </summary>
                      <pre className="mt-2 text-xs text-slate-400 overflow-auto max-h-40 p-2 bg-slate-800/50 rounded">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Error Count */}
              {this.state.errorCount > 3 && (
                <div className="mb-6 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-sm text-yellow-300">
                    ⚠️ Multiple errors detected ({this.state.errorCount}). We recommend reloading the page.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 flex-col sm:flex-row">
                <button
                  onClick={this.handleReset}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 hover:border-blue-500 rounded-lg text-blue-300 hover:text-blue-200 font-semibold transition-all duration-300"
                >
                  <Home size={20} />
                  Go Back
                </button>

                <button
                  onClick={this.handleReload}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <RefreshCw size={20} />
                  Reload Page
                </button>
              </div>

              {/* Support Info */}
              <p className="text-xs text-slate-400 text-center mt-6">
                If the problem persists, please clear your browser cache and try again.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
