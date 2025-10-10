import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  maxRetries?: number;
}

export class DashboardErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Dashboard Error Boundary caught an error:', error, errorInfo);
    
    // Store error info in state for display
    this.setState({ errorInfo });
    
    // Log to error tracking service (e.g., Sentry, LogRocket)
    this.logErrorToService(error, errorInfo);
    
    this.props.onError?.(error, errorInfo);
  }

  logErrorToService = (error: Error, errorInfo: React.ErrorInfo) => {
    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
      console.log('Error logged to tracking service:', error.message);
    }
  };

  handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount < maxRetries) {
      console.log(`Retry attempt ${retryCount + 1} of ${maxRetries}`);
      this.setState({ 
        hasError: false, 
        error: undefined,
        errorInfo: undefined,
        retryCount: retryCount + 1 
      });
    } else {
      console.warn('Max retry attempts reached');
      // Reset retry count but keep error state
      this.setState({ retryCount: 0 });
    }
  };

  render() {
    if (this.state.hasError) {
      const { maxRetries = 3 } = this.props;
      const { retryCount, error } = this.state;
      const canRetry = retryCount < maxRetries;

      return this.props.fallback || (
        <div className="min-h-[400px] flex items-center justify-center bg-gray-50 rounded-xl border border-gray-200">
          <div className="text-center p-6 max-w-2xl">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
            <p className="text-gray-600 mb-2">
              We encountered an error while loading this dashboard.
            </p>
            
            {/* Error details (only in development) */}
            {process.env.NODE_ENV === 'development' && error && (
              <details className="mt-4 mb-4 text-left">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                  Error Details (Development Only)
                </summary>
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs font-mono text-red-800 whitespace-pre-wrap break-all">
                    {error.message}
                  </p>
                  {error.stack && (
                    <p className="text-xs font-mono text-red-700 mt-2 whitespace-pre-wrap break-all">
                      {error.stack.substring(0, 500)}...
                    </p>
                  )}
                </div>
              </details>
            )}

            {/* Retry counter */}
            {retryCount > 0 && (
              <p className="text-sm text-gray-500 mb-4">
                Retry attempts: {retryCount} of {maxRetries}
              </p>
            )}
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="bg-fuchsia-700 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-fuchsia-800 transition-colors shadow-sm"
              >
                Refresh Page
              </button>
              {canRetry && (
                <button
                  onClick={this.handleRetry}
                  className="bg-white text-fuchsia-700 border border-fuchsia-700 px-5 py-2.5 rounded-lg font-medium hover:bg-fuchsia-50 transition-colors"
                >
                  Try Again
                </button>
              )}
              {!canRetry && retryCount >= maxRetries && (
                <button
                  onClick={() => window.history.back()}
                  className="bg-white text-gray-700 border border-gray-300 px-5 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Go Back
                </button>
              )}
            </div>
            
            <p className="text-xs text-gray-500 mt-4">
              If the problem persists, please contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default DashboardErrorBoundary;