import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-4">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4v2m0 4v2M6.343 3.665c-.256-.256-.671-.256-.928 0l-8.485 8.485c-.256.256-.256.671 0 .928l8.485 8.485c.257.256.671.256.928 0l8.485-8.485c.256-.257.256-.672 0-.928L6.343 3.665z"
                />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
              Oops! Something Went Wrong
            </h1>

            <p className="text-center text-gray-600 mb-6">
              We're sorry for the inconvenience. The application encountered an unexpected error. 
              Please try refreshing the page or contact support if the problem persists.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 bg-red-50 border border-red-200 rounded p-4">
                <summary className="cursor-pointer font-semibold text-red-900 mb-2">
                  Error Details (Development Only)
                </summary>
                <div className="text-xs text-red-800 font-mono overflow-auto max-h-40 bg-white p-2 rounded border border-red-100">
                  <p className="font-bold mb-2">Error:</p>
                  <p className="mb-4">{this.state.error.toString()}</p>
                  {this.state.errorInfo && (
                    <>
                      <p className="font-bold mb-2">Component Stack:</p>
                      <pre className="whitespace-pre-wrap break-words">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                </div>
              </details>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.resetError}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition duration-200"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
