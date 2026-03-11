import React from "react";
import { ResearchCard } from "./ResearchCard";

type DocumentContextCardProps = {
  selectedDocumentId: number | null;
  uploads: { documentId: number; filename: string }[];
  onSelectDocument: (id: number | null) => void;
  metrics: any | null;
  containerRef?: React.Ref<HTMLDivElement>;
  containerStyle?: React.CSSProperties;
};

export function DocumentContextCard({
  selectedDocumentId,
  uploads,
  onSelectDocument,
  metrics,
  containerRef,
  containerStyle,
}: DocumentContextCardProps) {
  return (
    <ResearchCard
      containerRef={containerRef}
      containerStyle={containerStyle}
      title="Document Research Context"
      subtitle="Choose a document to power knowledge tools."
    >
      <select
        value={selectedDocumentId ?? ""}
        onChange={(e) => onSelectDocument(e.target.value ? Number(e.target.value) : null)}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: "8px",
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(0,0,0,0.3)",
          color: "#eaeaea",
        }}
      >
        <option value="">-- Select uploaded document --</option>
        {uploads.map((u) => (
          <option key={u.documentId} value={u.documentId}>
            {u.filename} (docId={u.documentId})
          </option>
        ))}
      </select>
      {metrics && (
        <div style={{ marginTop: "10px", fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>
          Segments: {metrics.totalSegments} • Links: {metrics.linkMetrics?.totalLinks ?? 0}
        </div>
      )}
    </ResearchCard>
  );
}
