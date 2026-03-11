import React from "react";
import { ResearchCard } from "./ResearchCard";

type KnowledgeGraphCardProps = {
  topLinked: { id: number | string; label: string; linkCount: number }[];
  selectedDocumentId: number | null;
  onOpenGraph: () => void;
  containerRef?: React.Ref<HTMLDivElement>;
  containerStyle?: React.CSSProperties;
};

export function KnowledgeGraphCard({
  topLinked,
  selectedDocumentId,
  onOpenGraph,
  containerRef,
  containerStyle,
}: KnowledgeGraphCardProps) {
  return (
    <ResearchCard
      containerRef={containerRef}
      containerStyle={containerStyle}
      title="Knowledge Graph & Backlinks"
      subtitle="Graph overview plus top linked segments."
    >
      {topLinked.length ? (
        <div style={{ display: "grid", gap: "6px", fontSize: "12px" }}>
          {topLinked.map((n) => (
            <div key={n.id} style={{ color: "rgba(255,255,255,0.75)" }}>
              {n.label} • links: {n.linkCount}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>
          Select a document to view graph insights.
        </div>
      )}
      {selectedDocumentId && (
        <button
          onClick={onOpenGraph}
          style={{
            marginTop: "8px",
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid rgba(13,148,136,0.4)",
            background: "rgba(13,148,136,0.15)",
            color: "#5eead4",
            cursor: "pointer",
          }}
        >
          Open Graph View
        </button>
      )}
    </ResearchCard>
  );
}
