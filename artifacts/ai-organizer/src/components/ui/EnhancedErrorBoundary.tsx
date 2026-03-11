/**
 * EnhancedErrorBoundary - Robust error handling with recovery options
 * Provides graceful error states and retry functionality across the application
 */

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  componentName?: string;
  retryable?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showErrorDetails: boolean;
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showErrorDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log to console in development
    console.error("EnhancedErrorBoundary caught an error:", error, errorInfo);
    
    // Call optional error handler
    this.props.onError?.(error, errorInfo);
    
    // Store error for analytics (if needed)
    try {
      const errorLog = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        componentName: this.props.componentName || "Unknown",
      };
      
      // Store in localStorage for debugging
      const existingErrors = JSON.parse(localStorage.getItem("appErrorLog") || "[]");
      existingErrors.unshift(errorLog);
      localStorage.setItem("appErrorLog", JSON.stringify(existingErrors.slice(0, 20)));
    } catch {
      // Ignore localStorage errors
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showErrorDetails: false,
    });
  };

  toggleDetails = () => {
    this.setState((prev) => ({ showErrorDetails: !prev.showErrorDetails }));
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div
          style={{
            padding: "20px",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "12px",
            color: "#fca5a5",
            margin: "10px 0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "20px" }}>⚠️</span>
            <div>
              <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#fca5a5" }}>
                {this.props.componentName ? `Error in ${this.props.componentName}` : "Something went wrong"}
              </h4>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#f87171", opacity: 0.8 }}>
                {this.state.error?.message || "An unexpected error occurred"}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {this.props.retryable !== false && (
              <button
                onClick={this.handleRetry}
                style={{
                  padding: "8px 14px",
                  background: "rgba(239, 68, 68, 0.2)",
                  border: "1px solid rgba(239, 68, 68, 0.4)",
                  borderRadius: "8px",
                  color: "#fca5a5",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.2s ease",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "rgba(239, 68, 68, 0.3)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
                }}
              >
                🔄 Retry
              </button>
            )}

            {this.props.showDetails !== false && (
              <button
                onClick={this.toggleDetails}
                style={{
                  padding: "8px 14px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  color: "#94a3b8",
                  fontSize: "12px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                }}
              >
                {this.state.showErrorDetails ? "Hide Details" : "Show Details"}
              </button>
            )}
          </div>

          {this.state.showErrorDetails && (
            <div
              style={{
                marginTop: "12px",
                padding: "12px",
                background: "rgba(0,0,0,0.3)",
                borderRadius: "8px",
                fontSize: "11px",
                fontFamily: "monospace",
                color: "#94a3b8",
                maxHeight: "200px",
                overflow: "auto",
              }}
            >
              <div style={{ marginBottom: "8px" }}>
                <strong style={{ color: "#f87171" }}>Error:</strong> {this.state.error?.message}
              </div>
              {this.state.error?.stack && (
                <div style={{ marginBottom: "8px" }}>
                  <strong style={{ color: "#f87171" }}>Stack:</strong>
                  <pre style={{ margin: "4px 0 0", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {this.state.error.stack}
                  </pre>
                </div>
              )}
              {this.state.errorInfo?.componentStack && (
                <div>
                  <strong style={{ color: "#f87171" }}>Component Stack:</strong>
                  <pre style={{ margin: "4px 0 0", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {this.state.errorInfo.componentStack}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper for easier usage with hooks
export const withErrorBoundary = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
): React.FC<P> => {
  const WithErrorBoundary: React.FC<P> = (props) => (
    <EnhancedErrorBoundary componentName={componentName}>
      <WrappedComponent {...props} />
    </EnhancedErrorBoundary>
  );
  
  WithErrorBoundary.displayName = `withErrorBoundary(${componentName || WrappedComponent.displayName || WrappedComponent.name || "Component"})`;
  
  return WithErrorBoundary;
};

// Simple inline error display for minor errors
interface InlineErrorProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const InlineError: React.FC<InlineErrorProps> = ({ message, onRetry, onDismiss }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "10px",
      padding: "10px 14px",
      background: "rgba(239, 68, 68, 0.1)",
      border: "1px solid rgba(239, 68, 68, 0.2)",
      borderRadius: "8px",
      fontSize: "12px",
      color: "#fca5a5",
    }}
  >
    <span>⚠️</span>
    <span style={{ flex: 1 }}>{message}</span>
    {onRetry && (
      <button
        onClick={onRetry}
        style={{
          padding: "4px 10px",
          background: "rgba(239, 68, 68, 0.2)",
          border: "none",
          borderRadius: "4px",
          color: "#fca5a5",
          fontSize: "11px",
          cursor: "pointer",
        }}
      >
        Retry
      </button>
    )}
    {onDismiss && (
      <button
        onClick={onDismiss}
        style={{
          padding: "4px 8px",
          background: "transparent",
          border: "none",
          color: "#94a3b8",
          fontSize: "14px",
          cursor: "pointer",
        }}
      >
        ×
      </button>
    )}
  </div>
);

export default EnhancedErrorBoundary;
