import React from "react";
import { badge } from "../../../lib/documentWorkspace/utils";

type WorkspaceHeaderProps = {
  docId: number;
  filename: string | null;
  parseStatus: string | null;
  sourceType: string | null;
  canSegment: boolean;
  onEditDocument: () => void;
  onBackHome: () => void;
  onViewDocument: () => void;
  onStartTour: () => void;
  tourRef: React.RefObject<HTMLDivElement | null>;
  highlightStyle?: React.CSSProperties;
};

export function WorkspaceHeader({
  docId,
  filename,
  parseStatus,
  sourceType,
  canSegment,
  onEditDocument,
  onBackHome,
  onViewDocument,
  onStartTour,
  tourRef,
  highlightStyle,
}: WorkspaceHeaderProps) {
  return (
    <>
      <div
        ref={tourRef}
        className="page-header"
        style={{
          padding: "18px 24px",
          paddingTop: "98px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
          flex: "0 0 auto",
          background: "linear-gradient(135deg, rgba(24, 24, 36, 0.95) 0%, rgba(18, 18, 30, 0.95) 100%)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
          ...(highlightStyle || {}),
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
            }}
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "20px", height: "20px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h1
              style={{
                fontSize: "var(--font-size-xl)",
                lineHeight: "var(--line-height-snug)",
                fontWeight: 700,
                letterSpacing: "var(--letter-spacing-tight)",
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                margin: 0,
                marginBottom: "4px",
              }}
            >
              Document #{docId}
            </h1>
            <p style={{ margin: 0, fontSize: "var(--font-size-sm)", lineHeight: "var(--line-height-normal)", color: "rgba(255, 255, 255, 0.6)", fontWeight: 400 }}>
              {filename ?? "—"}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 16, paddingLeft: 16, borderLeft: "1px solid rgba(255, 255, 255, 0.1)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 500, color: "rgba(255, 255, 255, 0.5)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Ingest:</span>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "3px 8px",
                  borderRadius: "6px",
                  fontSize: 10,
                  fontWeight: 600,
                  cursor: "help",
                  ...(parseStatus === "ok"
                    ? {
                        background: "rgba(16, 185, 129, 0.15)",
                        color: "#6ee7b7",
                        border: "1px solid rgba(16, 185, 129, 0.25)",
                      }
                    : parseStatus === "failed"
                    ? {
                        background: "rgba(239, 68, 68, 0.15)",
                        color: "#fca5a5",
                        border: "1px solid rgba(239, 68, 68, 0.25)",
                      }
                    : {
                        background: "rgba(251, 191, 36, 0.15)",
                        color: "#fcd34d",
                        border: "1px solid rgba(251, 191, 36, 0.25)",
                      }),
                }}
                title={
                  parseStatus === "ok"
                    ? "Document parsed successfully. Ready for segmentation."
                    : parseStatus === "failed"
                    ? "Parsing failed. See error below."
                    : "Document is waiting for parsing."
                }
              >
                {badge(parseStatus ?? undefined)}
              </div>
              {sourceType && (
                <span
                  style={{
                    fontSize: 10,
                    color: "rgba(255, 255, 255, 0.5)",
                    background: "rgba(255, 255, 255, 0.05)",
                    padding: "3px 6px",
                    borderRadius: "4px",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    fontWeight: 500,
                  }}
                >
                  {sourceType}
                </span>
              )}
              {canSegment && (
                <span
                  style={{
                    fontSize: 10,
                    color: "#6ee7b7",
                    background: "rgba(16, 185, 129, 0.1)",
                    padding: "3px 6px",
                    borderRadius: "4px",
                    border: "1px solid rgba(16, 185, 129, 0.2)",
                    fontWeight: 500,
                  }}
                >
                  ✅ Ready
                </span>
              )}
            </div>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 200 }} />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button
            onClick={onEditDocument}
            style={{
              padding: "10px 18px",
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              border: "none",
              borderRadius: "10px",
              color: "white",
              fontWeight: 500,
              fontSize: "14px",
              lineHeight: 1.4,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s ease",
              boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(99, 102, 241, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.3)";
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "16px", height: "16px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit document
          </button>
          <button
            onClick={onViewDocument}
            style={{
              padding: "10px 18px",
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              border: "none",
              borderRadius: "10px",
              color: "white",
              fontWeight: 500,
              fontSize: "14px",
              lineHeight: 1.4,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s ease",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(16, 185, 129, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.3)";
            }}
            title="View document with reading tools"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "16px", height: "16px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View Document
          </button>
          <button
            onClick={onBackHome}
            style={{
              padding: "6px 12px",
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "999px",
              color: "rgba(255, 255, 255, 0.88)",
              fontWeight: 500,
              fontSize: "12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.2s ease",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.18)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)";
            }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "14px", height: "14px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            🏠 Home
          </button>
        </div>
      </div>

      <div style={{ padding: "8px 24px", display: "flex", justifyContent: "flex-end", gap: "10px", borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
        <button
          onClick={onStartTour}
          style={{
            padding: "6px 12px",
            borderRadius: "999px",
            border: "1px solid rgba(114, 255, 191, 0.6)",
            background: "linear-gradient(135deg, rgba(114, 255, 191, 0.2), rgba(99, 102, 241, 0.15))",
            color: "rgba(114, 255, 191, 0.95)",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "6px",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "linear-gradient(135deg, rgba(114, 255, 191, 0.3), rgba(99, 102, 241, 0.25))";
            e.currentTarget.style.borderColor = "rgba(114, 255, 191, 0.8)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "linear-gradient(135deg, rgba(114, 255, 191, 0.2), rgba(99, 102, 241, 0.15))";
            e.currentTarget.style.borderColor = "rgba(114, 255, 191, 0.6)";
          }}
          title="Take a guided tour of the workspace features"
        >
          🚀 Start Tour
        </button>
      </div>
    </>
  );
}
