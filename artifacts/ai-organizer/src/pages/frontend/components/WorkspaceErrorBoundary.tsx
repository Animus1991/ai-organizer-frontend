import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class WorkspaceErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Workspace Error Boundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

function ErrorFallback({ error }: { error?: Error }) {
  const { isDark } = useTheme();
  const { t } = useLanguage();

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    padding: '40px',
    background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(47,41,65,0.03)',
    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(47,41,65,0.08)',
    borderRadius: '16px',
    textAlign: 'center'
  };

  const iconStyle: React.CSSProperties = {
    fontSize: '48px',
    marginBottom: '16px',
    opacity: 0.7
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: '600',
    color: isDark ? 'rgba(255,255,255,0.9)' : '#2f2941',
    margin: '0 0 8px 0'
  };

  const messageStyle: React.CSSProperties = {
    fontSize: '14px',
    color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(47,41,65,0.6)',
    margin: '0 0 24px 0',
    maxWidth: '400px',
    lineHeight: 1.5
  };

  const buttonStyle: React.CSSProperties = {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, rgba(99,102,241,0.9), rgba(139,92,246,0.9))',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  };

  return (
    <div style={containerStyle}>
      <div style={iconStyle}>⚠️</div>
      <h2 style={titleStyle}>{t('workspace.errorTitle')}</h2>
      <p style={messageStyle}>
        {t('workspace.errorMessage')}
        {error && import.meta.env.DEV && (
          <details style={{ marginTop: '12px', fontSize: '12px', textAlign: 'left' }}>
            <summary style={{ cursor: 'pointer', fontWeight: '600' }}>
              {t('workspace.errorDetails')}
            </summary>
            <pre style={{ 
              background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)',
              padding: '8px',
              borderRadius: '4px',
              marginTop: '8px',
              overflow: 'auto',
              fontSize: '11px'
            }}>
              {error.stack}
            </pre>
          </details>
        )}
      </p>
      <button 
        style={buttonStyle}
        onClick={() => window.location.reload()}
      >
        {t('workspace.reloadButton')}
      </button>
    </div>
  );
}

export default WorkspaceErrorBoundary;
