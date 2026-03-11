import React from "react";

type WorkspaceLeftPaneProps = {
  docText: string | null;
  highlightedDoc: { before: string; mid: string; after: string };
  highlightRef: React.RefObject<HTMLSpanElement | null>;
  selectedSeg: any | null;
};

export function WorkspaceLeftPane({
  docText,
  highlightedDoc,
  highlightRef,
  selectedSeg,
}: WorkspaceLeftPaneProps) {
  return (
    <div
      className="flex-1 min-w-0 min-h-0 border-r border-border flex flex-col"
      style={{
        flex: "1 1 65%",
        minWidth: 0,
        minHeight: 0,
        borderRight: "1px solid rgba(255,255,255,0.10)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Enhanced Document Header - Following Home.tsx Pattern */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          background: "linear-gradient(135deg, rgba(30, 30, 40, 0.55) 0%, rgba(14, 16, 28, 0.65) 100%)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <div style={{
          width: "36px",
          height: "36px",
          background: "linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%)",
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid rgba(16, 185, 129, 0.3)",
        }}>
          <span style={{ fontSize: "18px" }}>📄</span>
        </div>
        <div style={{ flex: 1 }}>
          <span style={{ 
            fontWeight: 700, 
            fontSize: "var(--font-size-base)",
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            Full Document
          </span>
          {selectedSeg ? (
            <div style={{ 
              marginTop: "2px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}>
              <span style={{
                fontSize: "var(--font-size-xs)",
                padding: "3px 8px",
                background: "rgba(99, 102, 241, 0.15)",
                border: "1px solid rgba(99, 102, 241, 0.25)",
                borderRadius: "6px",
                color: "#a5b4fc",
                fontWeight: 500,
              }}>
                #{(((selectedSeg as any).orderIndex ?? 0) as number) + 1}
              </span>
              <span style={{
                fontSize: "var(--font-size-xs)",
                padding: "3px 8px",
                background: "rgba(245, 158, 11, 0.15)",
                border: "1px solid rgba(245, 158, 11, 0.25)",
                borderRadius: "6px",
                color: "#fcd34d",
                fontWeight: 500,
              }}>
                {(selectedSeg as any).mode}
              </span>
              <span style={{
                fontSize: "var(--font-size-xs)",
                padding: "3px 8px",
                background: (selectedSeg as any).isManual 
                  ? "rgba(236, 72, 153, 0.15)" 
                  : "rgba(16, 185, 129, 0.15)",
                border: (selectedSeg as any).isManual 
                  ? "1px solid rgba(236, 72, 153, 0.25)" 
                  : "1px solid rgba(16, 185, 129, 0.25)",
                borderRadius: "6px",
                color: (selectedSeg as any).isManual ? "#f9a8d4" : "#6ee7b7",
                fontWeight: 500,
              }}>
                {(selectedSeg as any).isManual ? "manual" : "auto"}
              </span>
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: "var(--font-size-xs)", color: "rgba(255, 255, 255, 0.55)" }}>
              Click a chunk to highlight in document
            </p>
          )}
        </div>
      </div>

      {/* Document Content - Optimized Typography */}
      <div style={{ 
        padding: "16px 20px", 
        overflow: "auto", 
        flex: "1 1 auto", 
        minHeight: 0,
        background: "hsl(var(--card) / 0.45)",
      }}>
        {docText ? (
          <div style={{ 
            whiteSpace: "pre-wrap", 
            margin: 0, 
            fontFamily: "var(--font-family-sans)",
            fontSize: "var(--font-size-sm)",
            lineHeight: "var(--line-height-relaxed)",
            color: "hsl(var(--foreground) / 0.9)",
            letterSpacing: "var(--letter-spacing-normal)",
          }}>
            {highlightedDoc.before}
            {highlightedDoc.mid ? (
              <span
                ref={highlightRef}
                style={{
                  background: "rgba(99, 102, 241, 0.25)",
                  boxShadow: "0 0 0 2px rgba(99, 102, 241, 0.3)",
                  borderRadius: "4px",
                  padding: "2px 4px",
                  color: "#a5b4fc",
                }}
              >
                {highlightedDoc.mid}
              </span>
            ) : null}
            {highlightedDoc.after}
          </div>
        ) : (
          <div style={{ opacity: 0.5, fontSize: "14px" }}>No document text available</div>
        )}
      </div>
    </div>
  );
}
