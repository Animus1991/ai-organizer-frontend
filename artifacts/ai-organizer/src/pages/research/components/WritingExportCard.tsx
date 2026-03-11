import React from "react";
import { ResearchCard } from "./ResearchCard";

type WritingExportCardProps = {
  canExport: boolean;
  onExportMarkdown: () => void;
  onExportLatex: () => void;
  exportStatus: string;
  containerRef?: React.Ref<HTMLDivElement>;
  containerStyle?: React.CSSProperties;
};

export function WritingExportCard({
  canExport,
  onExportMarkdown,
  onExportLatex,
  exportStatus,
  containerRef,
  containerStyle,
}: WritingExportCardProps) {
  return (
    <ResearchCard
      containerRef={containerRef}
      containerStyle={containerStyle}
      title="Writing & Export"
      subtitle="Export structured research outputs."
    >
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button
          onClick={onExportMarkdown}
          disabled={!canExport}
          style={{
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid rgba(20,184,166,0.4)",
            background: "rgba(20,184,166,0.15)",
            color: "#5eead4",
            cursor: canExport ? "pointer" : "not-allowed",
            opacity: canExport ? 1 : 0.5,
          }}
        >
          Export Markdown
        </button>
        <button
          onClick={onExportLatex}
          disabled={!canExport}
          style={{
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid rgba(245,158,11,0.4)",
            background: "rgba(245,158,11,0.15)",
            color: "#fde68a",
            cursor: canExport ? "pointer" : "not-allowed",
            opacity: canExport ? 1 : 0.5,
          }}
        >
          Export LaTeX
        </button>
      </div>
      {exportStatus && (
        <div style={{ marginTop: "8px", fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>
          {exportStatus}
        </div>
      )}
    </ResearchCard>
  );
}
