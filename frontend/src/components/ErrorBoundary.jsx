import React from 'react';
import { safeGetParsedItem, loadSanitizedCart } from '../utils/storageUtils';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Uncaught error in component tree:', error, info);

    // Safety fallback: if error involves storage or parsing, attempt to repair guest cart
    try {
      const msg = String(error?.message || error);
      if (msg.includes('JSON') || msg.includes('cart') || msg.includes('storage')) {
        // Attempt to load and sanitize the guest cart; this will remove or repair corrupted data
        try {
          const repaired = loadSanitizedCart('delivo_guest_cart');
          if (!repaired || repaired.length === 0) {
            // ensure removal if unrecoverable
            try { localStorage.removeItem('delivo_guest_cart'); } catch (e) {}
          }
        } catch (e) {
          try { localStorage.removeItem('delivo_guest_cart'); } catch (e) {}
        }
      }
    } catch (e) {}
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: '#f8fafc',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            maxWidth: '480px',
            backgroundColor: '#ffffff',
            padding: '2.5rem 2rem',
            borderRadius: '16px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛍️</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.5rem' }}>
              Something went wrong loading the page
            </h2>
            <p style={{ fontSize: '0.95rem', color: '#64748b', lineHeight: '1.6', marginBottom: '1.75rem' }}>
              We ran into an issue displaying this page. Your session and cart data are safe. Please try refreshing.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={this.handleReset}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  fontWeight: '600',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  transition: 'background-color 0.2s'
                }}
              >
                Reload Page
              </button>
              <a
                href="/"
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#f1f5f9',
                  color: '#334155',
                  fontWeight: '600',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                  display: 'inline-block'
                }}
              >
                Go to Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

