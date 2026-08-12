// src/components/shared/ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { logError } from '../../utils/errorLogger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Vangt render-fouten op. Gebruikt bewust inline styles: als de fout vroeg optreedt
 * is het stylesheet mogelijk nog niet geladen.
 */
class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logError(error, 'ErrorBoundary');
    console.error('[ErrorBoundary]', error, errorInfo.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#F5F3EE',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          fontFamily: "'Poppins', system-ui, sans-serif",
        }}
      >
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e3dfd6',
            padding: '2rem',
            borderRadius: '18px',
            maxWidth: '28rem',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 4px 14px rgba(20, 24, 31, 0.08)',
          }}
        >
          <AlertTriangle
            style={{ width: '2.5rem', height: '2.5rem', color: '#c0392b', margin: '0 auto 1rem' }}
          />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#14181f', marginBottom: '0.5rem' }}>
            Er is iets misgegaan
          </h2>
          <p style={{ color: '#4a525e', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
            Er is een onverwachte fout opgetreden. Vernieuw de pagina om het opnieuw te proberen.
          </p>
          {this.state.error && (
            <details
              style={{
                marginBottom: '1.25rem',
                textAlign: 'left',
                background: '#faf9f6',
                border: '1px solid #e3dfd6',
                padding: '0.75rem',
                borderRadius: '8px',
              }}
            >
              <summary style={{ color: '#7c8593', cursor: 'pointer', fontSize: '0.75rem' }}>
                Technische details
              </summary>
              <code
                style={{
                  display: 'block',
                  marginTop: '0.5rem',
                  color: '#c0392b',
                  fontSize: '0.75rem',
                  wordBreak: 'break-word',
                }}
              >
                {this.state.error.message}
              </code>
            </details>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#0E8F6C',
              color: '#ffffff',
              padding: '0.75rem 1.25rem',
              borderRadius: '999px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontFamily: 'inherit',
            }}
          >
            Pagina vernieuwen
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
