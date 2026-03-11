// src/components/BenchmarkControls/BenchmarkControls.tsx
// Enhanced Benchmark Controls Component with Modern UI/UX Standards

import React, { useCallback } from "react";
import { useTheme } from "../../context/ThemeContext";

interface BenchmarkReport {
  audit?: {
    run_id?: string;
    timestamp?: string;
  };
  summary?: Record<string, any>;
  returnCode?: number;
}

interface BenchmarkControlsProps {
  onRun: () => void;
  onDownloadJSON: () => void;
  onDownloadZIP: () => void;
  onEmailJSON: () => void;
  onEmailZIP: () => void;
  onAuditPage: () => void;
  onRefreshHistory: () => void;
  latestReport?: BenchmarkReport | null;
  history: BenchmarkReport[];
  isLoading?: boolean;
  allowed?: boolean;
  status?: string;
}

export const BenchmarkControls: React.FC<BenchmarkControlsProps> = ({
  onRun,
  onDownloadJSON,
  onDownloadZIP,
  onEmailJSON,
  onEmailZIP,
  onAuditPage,
  onRefreshHistory,
  latestReport,
  history,
  isLoading = false,
  allowed = false,
  status,
}) => {
  const { isDark } = useTheme();

  // Colors based on theme
  const colors = {
    background: isDark ? "rgba(20, 20, 30, 0.95)" : "rgba(255, 255, 255, 0.95)",
    border: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
    text: isDark ? "#f8fafc" : "#1f2937",
    textSecondary: isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)",
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
    info: "#3b82f6",
    purple: "#8b5cf6",
  };

  // Button styles with accessibility
  const createButtonStyle = (variant: "primary" | "secondary" | "danger" | "success", disabled = false) => ({
    padding: "10px 16px",
    borderRadius: "10px",
    border: "none",
    background: disabled 
      ? "rgba(100, 100, 100, 0.3)"
      : variant === "primary" 
        ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
        : variant === "secondary"
          ? "rgba(255, 255, 255, 0.1)"
          : variant === "danger"
            ? "rgba(239, 68, 68, 0.2)"
            : "rgba(16, 185, 129, 0.2)",
    color: disabled ? "rgba(255, 255, 255, 0.5)" : "#ffffff",
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: "14px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: disabled ? "none" : "0 4px 12px rgba(0, 0, 0, 0.1)",
    opacity: disabled ? 0.6 : 1,
    position: "relative" as const,
    overflow: "hidden",
  });

  // Email handlers with validation
  const handleEmailJSON = useCallback(() => {
    const email = window.prompt("Send JSON benchmark report to email:");
    if (email && email.includes("@")) {
      onEmailJSON();
    } else if (email) {
      alert("Please enter a valid email address");
    }
  }, [onEmailJSON]);

  const handleEmailZIP = useCallback(() => {
    const email = window.prompt("Send ZIP benchmark report to email:");
    if (email && email.includes("@")) {
      onEmailZIP();
    } else if (email) {
      alert("Please enter a valid email address");
    }
  }, [onEmailZIP]);

  
  return (
    <div
      role="region"
      aria-label="Benchmark Controls"
      style={{
        background: colors.background,
        backdropFilter: "blur(20px)",
        border: `1px solid ${colors.border}`,
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
        animation: "fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>

      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px",
        paddingBottom: "16px",
        borderBottom: `1px solid ${colors.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "48px",
            height: "48px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px",
          }}>🧪</div>
          <div>
            <h3 style={{ 
              margin: 0, 
              fontSize: "18px", 
              fontWeight: 700, 
              color: colors.text 
            }}>
              Benchmark Controls
            </h3>
            <p style={{ 
              margin: 0, 
              fontSize: "13px", 
              color: colors.textSecondary 
            }}>
              Performance testing and reporting tools
            </p>
          </div>
        </div>
        
        <button
          onClick={onRefreshHistory}
          disabled={isLoading}
          style={createButtonStyle("secondary", isLoading)}
          title="Refresh benchmark history"
          aria-label="Refresh benchmark history"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Status Display */}
      <div style={{
        background: isDark ? "rgba(0, 0, 0, 0.3)" : "rgba(0, 0, 0, 0.05)",
        borderRadius: "12px",
        padding: "16px",
        marginBottom: "20px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "13px", color: colors.textSecondary, marginBottom: "4px" }}>
              Latest Status
            </div>
            {latestReport ? (
              <div style={{ fontSize: "14px", color: colors.text, fontWeight: 500 }}>
                Run: {latestReport.audit?.run_id || "Unknown"} • 
                Modes: {latestReport.summary ? Object.keys(latestReport.summary).length : "0"} • 
                Return: {latestReport.returnCode ?? "N/A"}
              </div>
            ) : (
              <div style={{ fontSize: "14px", color: colors.textSecondary }}>
                No benchmark report loaded yet
              </div>
            )}
          </div>
          
          {status && (
            <div style={{
              padding: "6px 12px",
              background: "rgba(99, 102, 241, 0.1)",
              border: "1px solid rgba(99, 102, 241, 0.2)",
              borderRadius: "8px",
              color: "#a5b4fc",
              fontSize: "12px",
              fontWeight: 500,
            }}>
              {status}
            </div>
          )}
        </div>
      </div>

      {/* Main Actions */}
      <div style={{ marginBottom: "20px" }}>
        <h4 style={{ 
          margin: "0 0 12px 0", 
          fontSize: "14px", 
          fontWeight: 600, 
          color: colors.textSecondary,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}>
          Main Actions
        </h4>
        
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button
            onClick={onRun}
            disabled={isLoading || !allowed}
            style={createButtonStyle("primary", isLoading || !allowed)}
            title="Run new benchmark test"
            aria-label="Run benchmark test"
          >
            {isLoading ? (
              <>
                <div style={{
                  width: "16px",
                  height: "16px",
                  border: "2px solid rgba(255, 255, 255, 0.3)",
                  borderTopColor: "white",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }} />
                Running...
              </>
            ) : (
              <>
                🧪 Run Benchmark
              </>
            )}
          </button>

          <button
            onClick={onAuditPage}
            disabled={isLoading}
            style={createButtonStyle("secondary", isLoading)}
            title="Navigate to benchmark audit page"
            aria-label="Go to audit page"
          >
            📊 Audit Page
          </button>
        </div>
      </div>

      {/* Export Options */}
      <div style={{ marginBottom: "20px" }}>
        <h4 style={{ 
          margin: "0 0 12px 0", 
          fontSize: "14px", 
          fontWeight: 600, 
          color: colors.textSecondary,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}>
          Export Options
        </h4>
        
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button
            onClick={onDownloadJSON}
            disabled={isLoading || !latestReport}
            style={createButtonStyle("secondary", isLoading || !latestReport)}
            title="Download benchmark report as JSON"
            aria-label="Download JSON report"
          >
            ⬇️ JSON
          </button>

          <button
            onClick={onDownloadZIP}
            disabled={isLoading || !latestReport}
            style={createButtonStyle("secondary", isLoading || !latestReport)}
            title="Download benchmark report as ZIP"
            aria-label="Download ZIP report"
          >
            ⬇️ ZIP
          </button>
        </div>
      </div>

      {/* Share Options */}
      <div style={{ marginBottom: "20px" }}>
        <h4 style={{ 
          margin: "0 0 12px 0", 
          fontSize: "14px", 
          fontWeight: 600, 
          color: colors.textSecondary,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}>
          Share Options
        </h4>
        
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button
            onClick={handleEmailJSON}
            disabled={isLoading || !latestReport}
            style={createButtonStyle("secondary", isLoading || !latestReport)}
            title="Send JSON report via email"
            aria-label="Email JSON report"
          >
            ✉️ Email JSON
          </button>

          <button
            onClick={handleEmailZIP}
            disabled={isLoading || !latestReport}
            style={createButtonStyle("secondary", isLoading || !latestReport)}
            title="Send ZIP report via email"
            aria-label="Email ZIP report"
          >
            ✉️ Email ZIP
          </button>
        </div>
      </div>

      {/* Recent History */}
      {history.length > 0 && (
        <div>
          <h4 style={{ 
            margin: "0 0 12px 0", 
            fontSize: "14px", 
            fontWeight: 600, 
            color: colors.textSecondary,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}>
            Recent History
          </h4>
          
          <div style={{
            display: "grid",
            gap: "8px",
            maxHeight: "200px",
            overflowY: "auto",
          }}>
            {history.slice(0, 5).map((entry, idx) => (
              <div
                key={`${entry.audit?.run_id || idx}-${idx}`}
                style={{
                  padding: "12px",
                  background: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.03)",
                  borderRadius: "8px",
                  border: `1px solid ${colors.border}`,
                  fontSize: "13px",
                  color: colors.text,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDark 
                    ? "rgba(255, 255, 255, 0.05)" 
                    : "rgba(0, 0, 0, 0.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isDark 
                    ? "rgba(255, 255, 255, 0.03)" 
                    : "rgba(0, 0, 0, 0.03)";
                }}
              >
                <div>
                  <div style={{ fontWeight: 500, marginBottom: "2px" }}>
                    {entry.audit?.run_id || `Run #${idx + 1}`}
                  </div>
                  <div style={{ fontSize: "11px", color: colors.textSecondary }}>
                    {entry.audit?.timestamp ? 
                      new Date(entry.audit.timestamp).toLocaleString() : 
                      "No timestamp"
                    }
                  </div>
                </div>
                <div style={{
                  padding: "4px 8px",
                  background: entry.returnCode === 0 
                    ? "rgba(16, 185, 129, 0.2)" 
                    : "rgba(239, 68, 68, 0.2)",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: entry.returnCode === 0 ? "#6ee7b7" : "#fca5a5",
                }}>
                  Return: {entry.returnCode ?? "N/A"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.3)",
          backdropFilter: "blur(4px)",
          borderRadius: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <div style={{
            padding: "20px",
            background: colors.background,
            borderRadius: "12px",
            textAlign: "center",
          }}>
            <div style={{
              width: "32px",
              height: "32px",
              border: "3px solid rgba(99, 102, 241, 0.3)",
              borderTopColor: "#6366f1",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 12px",
            }} />
            <div style={{ color: colors.text, fontSize: "14px", fontWeight: 500 }}>
              Processing...
            </div>
          </div>
        </div>
      )}

      {/* CSS for animations */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default BenchmarkControls;
