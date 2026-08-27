import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Uncaught error in component tree:', error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}>
          <div>
            <h1>Delivo could not load</h1>
            <p>Please retry the page. Your account and cart data have not been removed.</p>
            <button type="button" onClick={this.handleRetry}>Retry</button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
