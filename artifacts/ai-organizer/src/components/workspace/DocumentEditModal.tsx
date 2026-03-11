/**
 * DocumentEditModal Component
 * 
 * Modal for editing the entire document text.
 * 
 * @module components/workspace/DocumentEditModal
 */

import { Suspense, lazy } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";

// Lazy load the heavy TipTap editor (only load when modal is opened)
const RichTextEditor = lazy(() => import("../../editor/RichTextEditor").then(module => ({ default: module.RichTextEditor })));

export interface DocumentEditModalProps {
  // Modal state
  open: boolean;
  onClose: () => void;
  
  // Document content
  html: string;
  text: string;
  onHtmlChange: (html: string) => void;
  onTextChange: (text: string) => void;
  
  // Save functionality
  onSave: () => Promise<void>;
  
  // Status
  status: string;
  saving: boolean;
  docId?: number;
}

/**
 * DocumentEditModal - Modal for editing document text
 */
export default function DocumentEditModal({
  open,
  onClose,
  html,
  text,
  onHtmlChange,
  onTextChange,
  onSave,
  status,
  saving,
  docId,
}: DocumentEditModalProps) {

  const { t } = useLanguage();
  const { isDark } = useTheme();
  
  if (!open) return null;

  const handleSave = async () => {
    await onSave();
  };

  const localKey = docId != null ? `docEdit:${docId}` : "docEdit:global";

  const handleSaveLocal = () => {
    try {
      const payload = { html, text };
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(localKey, JSON.stringify(payload));
      }
    } catch {
      // Silently ignore localStorage errors
    }
  };

  const handleLoadLocal = () => {
    try {
      if (typeof window === "undefined" || !window.localStorage) return;
      const raw = window.localStorage.getItem(localKey);
      if (!raw) return;
      const payload = JSON.parse(raw) as { html?: string; text?: string };
      if (payload.html) onHtmlChange(payload.html);
      if (payload.text) onTextChange(payload.text);
    } catch {
      // Silently ignore parse errors
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", padding: 18, zIndex: 70 }}>
      <div
        style={{
          flex: 1,
          background: isDark ? "#0b0e14" : "#ffffff",
          border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(47, 41, 65, 0.15)",
          borderRadius: 14,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        {/* Enhanced Header - Following Home.tsx Pattern */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(47, 41, 65, 0.1)",
            display: "flex",
            alignItems: "center",
            gap: 14,
            flex: "0 0 auto",
            background: isDark ? "linear-gradient(135deg, rgba(30, 30, 40, 0.5) 0%, rgba(20, 20, 30, 0.3) 100%)" : "linear-gradient(135deg, rgba(99, 102, 241, 0.04) 0%, rgba(139, 92, 246, 0.02) 100%)",
          }}
        >
          <div style={{
            width: "40px",
            height: "40px",
            background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(99, 102, 241, 0.3)",
          }}>
            <span style={{ fontSize: "20px" }}>✏️</span>
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ 
              margin: 0,
              fontSize: "18px",
              fontWeight: 700,
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              {t("docEdit.title")}
            </h2>
            <p style={{ margin: 0, fontSize: "11px", color: isDark ? "rgba(255, 255, 255, 0.5)" : "rgba(47, 41, 65, 0.5)" }}>
              {t("docEdit.subtitle")}
            </p>
          </div>
          {status && (
            <span style={{ 
              fontSize: "11px", 
              padding: "6px 12px",
              background: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              borderRadius: "8px",
              color: isDark ? "#6ee7b7" : "#065f46",
              fontWeight: 500,
            }}>
              {status}
            </span>
          )}
          <button 
            onClick={onClose} 
            style={{ 
              padding: "10px 16px",
              background: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(47, 41, 65, 0.05)",
              border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(47, 41, 65, 0.15)",
              borderRadius: "10px",
              color: isDark ? "#eaeaea" : "#2f2941",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(47, 41, 65, 0.08)";
              e.currentTarget.style.borderColor = isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(47, 41, 65, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(47, 41, 65, 0.05)";
              e.currentTarget.style.borderColor = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(47, 41, 65, 0.15)";
            }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "14px", height: "14px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            {t("action.close")}
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10, flex: "1 1 auto", minHeight: 0 }}>
          {/* Warning Banner */}
          <div style={{ 
            fontSize: "12px", 
            padding: "12px 16px",
            background: "rgba(245, 158, 11, 0.1)",
            border: "1px solid rgba(245, 158, 11, 0.2)",
            borderRadius: "10px",
            color: isDark ? "#fcd34d" : "#92400e",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}>
            <span style={{ fontSize: "16px" }}>⚠️</span>
            <span>
              <strong>{t("docEdit.noteLabel")}:</strong> {t("docEdit.warningText")}
            </span>
          </div>

          {/* Rich Text Editor */}
          <div style={{ flex: "1 1 auto", minHeight: 0, display: "flex", flexDirection: "column" }}>
            <Suspense
              fallback={
                <div style={{ 
                  minHeight: "200px", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  background: isDark ? "rgba(0, 0, 0, 0.2)" : "rgba(47, 41, 65, 0.04)",
                  borderRadius: "8px",
                  border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(47, 41, 65, 0.1)"
                }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ 
                      width: "32px", 
                      height: "32px", 
                      border: "3px solid rgba(99, 102, 241, 0.2)", 
                      borderTopColor: "#6366f1",
                      borderRadius: "50%", 
                      animation: "spin 1s linear infinite",
                      margin: "0 auto 12px"
                    }} />
                    <p style={{ fontSize: "12px", color: isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(47, 41, 65, 0.6)" }}>{t("editor.loading")}</p>
                    <style>{`
                      @keyframes spin {
                        to { transform: rotate(360deg); }
                      }
                    `}</style>
                  </div>
                </div>
              }
            >
              <RichTextEditor
                valueHtml={html}
                onChange={({ html, text }) => {
                  onHtmlChange(html);
                  onTextChange(text);
                }}
                placeholder={t("docEdit.placeholder")}
                onSaveLocal={docId != null ? handleSaveLocal : undefined}
                onLoadLocal={docId != null ? handleLoadLocal : undefined}
              />
            </Suspense>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", paddingTop: "8px" }}>
            <button 
              onClick={onClose} 
              style={{ 
                padding: "12px 20px",
                background: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(47, 41, 65, 0.05)",
                border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(47, 41, 65, 0.15)",
                borderRadius: "10px",
                color: isDark ? "#eaeaea" : "#2f2941",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(47, 41, 65, 0.08)";
                e.currentTarget.style.borderColor = isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(47, 41, 65, 0.2)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(47, 41, 65, 0.05)";
                e.currentTarget.style.borderColor = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(47, 41, 65, 0.15)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {t("action.cancel")}
            </button>
            <button 
              disabled={saving} 
              onClick={handleSave} 
              style={{ 
                padding: "12px 24px",
                background: saving ? "rgba(107, 114, 128, 0.3)" : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                border: "none",
                borderRadius: "10px",
                color: "white",
                cursor: saving ? "not-allowed" : "pointer",
                fontSize: "13px",
                fontWeight: 600,
                opacity: saving ? 0.6 : 1,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s ease",
                boxShadow: saving ? "none" : "0 4px 12px rgba(16, 185, 129, 0.3)",
              }}
              onMouseEnter={(e) => {
                if (!saving) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(16, 185, 129, 0.4)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = saving ? "none" : "0 4px 12px rgba(16, 185, 129, 0.3)";
              }}
            >
              {saving ? (
                <>
                  <svg style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {t("status.saving")}
                </>
              ) : (
                <>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "16px", height: "16px" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {t("docEdit.saveChanges")}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

