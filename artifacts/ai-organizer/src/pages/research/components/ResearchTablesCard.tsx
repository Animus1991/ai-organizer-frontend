import React from "react";
import { ResearchCard } from "./ResearchCard";

type ResearchTablesCardProps = {
  segmentRows: any[];
  selectedDocumentId: number | null;
  onOpenDashboard: () => void;
  containerRef?: React.Ref<HTMLDivElement>;
  containerStyle?: React.CSSProperties;
};

export function ResearchTablesCard({
  segmentRows,
  selectedDocumentId,
  onOpenDashboard,
  containerRef,
  containerStyle,
}: ResearchTablesCardProps) {
  return (
    <ResearchCard
      containerRef={containerRef}
      containerStyle={containerStyle}
      title="Research Tables"
      subtitle="Claims, evidence, and key segments with grades."
    >
      {segmentRows.length ? (
        <div style={{ display: "grid", gap: "6px", fontSize: "12px" }}>
          {segmentRows.slice(0, 8).map((s: any) => (
            <div key={s.id} style={{ color: "rgba(255,255,255,0.75)" }}>
              {s.title || "Untitled"} • {s.segmentType || "untyped"} • {s.evidenceGrade || "E0"}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>
          Select a document to view research tables.
        </div>
      )}
      {selectedDocumentId && (
        <button
          onClick={onOpenDashboard}
          style={{
            marginTop: "8px",
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid rgba(16,185,129,0.4)",
            background: "rgba(16,185,129,0.15)",
            color: "#6ee7b7",
            cursor: "pointer",
          }}
        >
          Open Evidence Dashboard
        </button>
      )}
    </ResearchCard>
  );
}
