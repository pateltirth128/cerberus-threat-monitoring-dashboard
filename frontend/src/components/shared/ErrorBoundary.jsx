import React from 'react';
import { HiExclamationCircle } from 'react-icons/hi';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <HiExclamationCircle className="text-5xl text-bad mb-4" />
          <h2 className="text-xl font-semibold text-ink mb-2">Something went wrong</h2>
          <p className="text-sm text-muted mb-6 max-w-md">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="bg-accent hover:brightness-110 text-white py-2 px-5 rounded-xl text-sm font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
