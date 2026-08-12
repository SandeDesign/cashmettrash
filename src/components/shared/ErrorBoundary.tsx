import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { logError } from '../../utils/errorLogger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    logError(error, 'ErrorBoundary');
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#0f172a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: '#1e293b',
            padding: '2rem',
            borderRadius: '0.5rem',
            maxWidth: '28rem',
            width: '100%',
            textAlign: 'center'
          }}>
            <AlertTriangle style={{
              width: '3rem',
              height: '3rem',
              color: '#ef4444',
              margin: '0 auto 1rem'
            }} />
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: 'white',
              marginBottom: '0.5rem'
            }}>
              Er is iets misgegaan
            </h2>
            <p style={{
              color: '#94a3b8',
              marginBottom: '1rem',
              fontSize: '0.875rem'
            }}>
              Er is een onverwachte fout opgetreden. Vernieuw de pagina om het opnieuw te proberen.
            </p>
            {this.state.error && (
              <details style={{
                marginBottom: '1rem',
                textAlign: 'left',
                background: '#0f172a',
                padding: '0.75rem',
                borderRadius: '0.25rem'
              }}>
                <summary style={{
                  color: '#64748b',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  marginBottom: '0.5rem'
                }}>
                  Technische details
                </summary>
                <code style={{
                  color: '#f87171',
                  fontSize: '0.75rem',
                  wordBreak: 'break-word'
                }}>
                  {this.state.error.message}
                </code>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#22c55e',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Pagina vernieuwen
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;