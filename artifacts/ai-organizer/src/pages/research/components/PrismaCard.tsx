import React from "react";
import { ResearchCard } from "./ResearchCard";

type PrismaCardProps = {
  selectedDocumentId: number | null;
  prisma: any;
  onUpdatePrisma: (next: any) => void;
  exportPrismaCsv: () => void;
  exportPrismaExcel: () => void;
  containerRef?: React.Ref<HTMLDivElement>;
  containerStyle?: React.CSSProperties;
};

export function PrismaCard({
  selectedDocumentId,
  prisma,
  onUpdatePrisma,
  exportPrismaCsv,
  exportPrismaExcel,
  containerRef,
  containerStyle,
}: PrismaCardProps) {
  return (
    <ResearchCard
      containerRef={containerRef}
      containerStyle={containerStyle}
      title="PRISMA Workflow"
      subtitle="Systematic review tracking with audit‑ready counts."
    >
      {selectedDocumentId ? (
        <div style={{ display: "grid", gap: "8px", fontSize: "12px" }}>
          {[
            ["Identified", "identified"],
            ["Screened", "screened"],
            ["Excluded", "excluded"],
            ["Full‑text assessed", "fullTextAssessed"],
            ["Included", "included"],
          ].map(([label, key]) => (
            <label key={key as string} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span style={{ minWidth: "140px", color: "rgba(255,255,255,0.75)" }}>{label}</span>
              <input
                type="number"
                value={prisma[key as keyof typeof prisma] || 0}
                onChange={(e) => onUpdatePrisma({ ...prisma, [key]: Number(e.target.value) })}
                style={{
                  flex: "1 1 120px",
                  padding: "8px 10px",
                  borderRadius: "6px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(0,0,0,0.3)",
                  color: "#eaeaea",
                }}
              />
            </label>
          ))}
          <textarea
            value={prisma.notes || ""}
            onChange={(e) => onUpdatePrisma({ ...prisma, notes: e.target.value })}
            placeholder="Notes / inclusion criteria"
            style={{
              minHeight: "70px",
              padding: "8px 10px",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(0,0,0,0.3)",
              color: "#eaeaea",
            }}
          />
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              onClick={exportPrismaCsv}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid rgba(20,184,166,0.4)",
                background: "rgba(20,184,166,0.15)",
                color: "#5eead4",
                cursor: "pointer",
              }}
            >
              Export CSV
            </button>
            <button
              onClick={exportPrismaExcel}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid rgba(245,158,11,0.4)",
                background: "rgba(245,158,11,0.15)",
                color: "#fde68a",
                cursor: "pointer",
              }}
            >
              Export Excel
            </button>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>
          Select a document to manage PRISMA counts.
        </div>
      )}
    </ResearchCard>
  );
}
