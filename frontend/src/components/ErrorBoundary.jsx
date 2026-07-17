import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Uncaught error in component tree:', error, info);
    this.setState({ info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, textAlign: 'center' }}>
          <h2>Something went wrong</h2>
          <p>We're sorry — an unexpected error occurred while rendering this page.</p>
          <details style={{ whiteSpace: 'pre-wrap', textAlign: 'left', margin: '16px auto', maxWidth: 800 }}>
            {this.state.error && this.state.error.toString()}
            {this.state.info && '\n' + (this.state.info.componentStack || '')}
          </details>
          <p>Please try refreshing the page. If the problem persists, contact support.</p>
        </div>
      );
    }

    return this.props.children;
  }
}
