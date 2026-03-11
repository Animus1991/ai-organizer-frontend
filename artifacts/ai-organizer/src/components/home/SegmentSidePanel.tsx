// src/components/home/SegmentSidePanel.tsx
// Extracted segment detail side panel from Home.tsx
import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";

export interface SegmentData {
  id: number | string;
  orderIndex: number;
  title: string;
  mode: string;
  content: string;
}

export interface SegmentSidePanelProps {
  openSeg: SegmentData | null;
  onClose: () => void;
  copied: boolean;
  onCopy: (withTitle: boolean) => void;
  onExportTxt: () => void;
}

export const SegmentSidePanel: React.FC<SegmentSidePanelProps> = ({
  openSeg,
  onClose,
  copied,
  onCopy,
  onExportTxt,
}) => {
  const nav = useNavigate();
  const { colors, isDark } = useTheme();
  const panelRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation - Esc to close
  useEffect(() => {
    if (!openSeg) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [openSeg, onClose]);

  // Focus trap - focus panel when opened
  useEffect(() => {
    if (openSeg && panelRef.current) {
      panelRef.current.focus();
    }
  }, [openSeg]);

  if (!openSeg) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: colors.bgOverlay,
          backdropFilter: "blur(4px)",
          zIndex: 50,
          transition: "all 0.2s ease",
        }}
        role="presentation"
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="segment-panel-title"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          width: "min(640px, 92vw)",
          background: isDark
            ? "linear-gradient(135deg, rgba(11, 14, 20, 0.98) 0%, rgba(8, 10, 16, 0.98) 100%)"
            : colors.bgSecondary,
          backdropFilter: "blur(20px)",
          borderLeft: `1px solid ${colors.borderPrimary}`,
          zIndex: 60,
          display: "flex",
          flexDirection: "column",
          boxShadow: isDark
            ? "-8px 0 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05) inset"
            : `-8px 0 32px ${colors.shadowLg.replace('0 10px 25px ', '')}`,
          animation: "slideIn 0.3s ease-out",
          outline: "none",
        }}
      >
          <style>{`
            @keyframes slideIn {
              from {
                transform: translateX(100%);
              }
              to {
                transform: translateX(0);
              }
            }
          `}</style>
          <div
            style={{
              padding: "28px 32px",
              borderBottom: `1px solid ${colors.borderPrimary}`,
              background: isDark
                ? "linear-gradient(135deg, rgba(36, 36, 48, 0.6) 0%, rgba(24, 24, 36, 0.4) 100%)"
                : colors.bgSecondary,
              display: "flex",
              gap: "20px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: "1 1 200px", minWidth: "200px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid rgba(99, 102, 241, 0.3)",
                    fontWeight: 700,
                    fontSize: "var(--font-size-base)",
              lineHeight: "var(--line-height-relaxed)",
                    color: isDark ? "#c7d2fe" : "#6366f1",
                  }}
                >
                  #{openSeg.orderIndex + 1}
            </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "22px", color: colors.textPrimary, lineHeight: "1.3" }}>
                    {openSeg.title}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    background: isDark ? "rgba(255, 255, 255, 0.05)" : colors.bgTertiary,
                    border: `1px solid ${colors.borderPrimary}`,
                    color: colors.textSecondary,
                  }}
                >
                  Mode
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "4px 12px",
                    borderRadius: "20px",
                    fontSize: "var(--font-size-sm)",
              lineHeight: "var(--line-height-normal)",
                    fontWeight: 600,
                    ...(openSeg.mode === "qa"
                      ? {
                          background: isDark ? "rgba(59, 130, 246, 0.2)" : "rgba(99, 102, 241, 0.2)",
                          color: isDark ? "#93c5fd" : "#6366f1",
                          border: isDark ? "1px solid rgba(59, 130, 246, 0.3)" : "1px solid rgba(99, 102, 241, 0.3)",
                        }
                      : {
                          background: isDark ? "rgba(16, 185, 129, 0.2)" : "rgba(34, 197, 94, 0.2)",
                          color: isDark ? "#6ee7b7" : "#10b981",
                          border: isDark ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(34, 197, 94, 0.3)",
                        }),
                  }}
                >
                  {openSeg.mode === "qa" ? "Q&A" : "Paragraphs"}
                </span>
              </div>
          </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                onClick={() => onCopy(false)}
                style={{
                  padding: "11px 18px",
                  background: copied ? isDark ? "rgba(16, 185, 129, 0.15)" : "rgba(34, 197, 94, 0.15)" : isDark ? "rgba(255, 255, 255, 0.06)" : colors.bgTertiary,
                  border: copied ? isDark ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(34, 197, 94, 0.3)" : `1px solid ${colors.borderPrimary}`,
                  borderRadius: "12px",
                  color: copied ? isDark ? "#6ee7b7" : "#10b981" : colors.textPrimary,
                  fontWeight: 600,
                  fontSize: "var(--font-size-sm)",
              lineHeight: "var(--line-height-normal)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: copied ? isDark ? "0 2px 8px rgba(16, 185, 129, 0.2)" : "0 2px 8px rgba(34, 197, 94, 0.2)" : "none",
                }}
                onMouseEnter={(e) => {
                  if (!copied) {
                    e.currentTarget.style.background = isDark ? "rgba(255, 255, 255, 0.1)" : colors.bgActive;
                    e.currentTarget.style.borderColor = isDark ? "rgba(255, 255, 255, 0.18)" : colors.borderPrimary;
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!copied) {
                    e.currentTarget.style.background = isDark ? "rgba(255, 255, 255, 0.06)" : colors.bgTertiary;
                    e.currentTarget.style.borderColor = colors.borderPrimary;
                    e.currentTarget.style.transform = "translateY(0)";
                  }
                }}
              >
                <svg style={{ width: "14px", height: "14px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            {copied ? "Copied!" : "Copy"}
          </button>

              <button
                onClick={() => onCopy(true)}
                style={{
                  padding: "11px 18px",
                  background: isDark ? "rgba(255, 255, 255, 0.06)" : colors.bgTertiary,
                  border: `1px solid ${colors.borderPrimary}`,
                  borderRadius: "12px",
                  color: colors.textPrimary,
                  fontWeight: 600,
                  fontSize: "var(--font-size-sm)",
              lineHeight: "var(--line-height-normal)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDark ? "rgba(255, 255, 255, 0.1)" : colors.bgActive;
                  e.currentTarget.style.borderColor = isDark ? "rgba(255, 255, 255, 0.18)" : colors.borderPrimary;
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isDark ? "rgba(255, 255, 255, 0.06)" : colors.bgTertiary;
                  e.currentTarget.style.borderColor = colors.borderPrimary;
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <svg style={{ width: "14px", height: "14px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            Copy Title+Text
          </button>

              <button
                onClick={onExportTxt}
                style={{
                  padding: "11px 18px",
                  background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                  border: "none",
                  borderRadius: "12px",
                  color: "white",
                  fontWeight: 600,
                  fontSize: "var(--font-size-sm)",
              lineHeight: "var(--line-height-normal)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: "0 2px 10px rgba(99, 102, 241, 0.35)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(99, 102, 241, 0.45)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 10px rgba(99, 102, 241, 0.35)";
                }}
              >
                <svg style={{ width: "14px", height: "14px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            Export .txt
          </button>

              <button
                onClick={onClose}
                style={{
                  padding: "11px 18px",
                  background: isDark ? "rgba(255, 255, 255, 0.06)" : colors.bgTertiary,
                  border: `1px solid ${colors.borderPrimary}`,
                  borderRadius: "12px",
                  color: colors.textPrimary,
                  fontWeight: 600,
                  fontSize: "var(--font-size-sm)",
              lineHeight: "var(--line-height-normal)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)";
                  e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.3)";
                  e.currentTarget.style.color = "#fca5a5";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isDark ? "rgba(255, 255, 255, 0.06)" : colors.bgTertiary;
                  e.currentTarget.style.borderColor = colors.borderPrimary;
                  e.currentTarget.style.color = colors.textPrimary;
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <svg style={{ width: "14px", height: "14px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            Close
          </button>

              <button
                onClick={() => nav(`/segments/${openSeg.id}`)}
                style={{
                  padding: "11px 18px",
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  border: "none",
                  borderRadius: "12px",
                  color: "white",
                  fontWeight: 600,
                  fontSize: "var(--font-size-sm)",
              lineHeight: "var(--line-height-normal)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: "0 2px 10px rgba(16, 185, 129, 0.35)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(16, 185, 129, 0.45)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 10px rgba(16, 185, 129, 0.35)";
                }}
              >
                <svg style={{ width: "14px", height: "14px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
            Open details
          </button>
            </div>
        </div>

          <div
            style={{
              padding: "32px",
              overflow: "auto",
              flex: "1 1 auto",
              minHeight: 0,
              background: isDark
                ? "linear-gradient(180deg, rgba(15, 15, 20, 0.5) 0%, rgba(10, 10, 15, 0.8) 100%)"
                : colors.bgSecondary,
              position: "relative",
            }}
          >
            <div
              style={{
                maxWidth: "100%",
                fontSize: "14px",
                lineHeight: 1.8,
                color: colors.textPrimary,
                whiteSpace: "pre-wrap",
                wordWrap: "break-word",
                padding: "24px",
                background: isDark ? "rgba(255, 255, 255, 0.02)" : colors.bgCard,
                borderRadius: "12px",
                border: `1px solid ${colors.borderPrimary}`,
                boxShadow: isDark ? "0 2px 8px rgba(0, 0, 0, 0.2) inset" : "none",
              }}
            >
              {openSeg.content}
            </div>
        </div>
      </div>
    </>
  );
};
