import React from "react";
import { AspectRatio } from "../../../components/ui/AspectRatio";
import { ResearchCard } from "./ResearchCard";

type OpenAlexAnalyticsCardProps = {
  authorQuery: string;
  onAuthorQueryChange: (value: string) => void;
  institutionQuery: string;
  onInstitutionQueryChange: (value: string) => void;
  authorResults: any[];
  institutionResults: any[];
  runAuthorSearch: () => void;
  runInstitutionSearch: () => void;
  renderBars: (items: any[], field: "worksCount" | "citedByCount") => React.ReactNode;
  exportOpenAlexCsv: (kind: "authors" | "institutions") => void;
  exportOpenAlexPng: (kind: "authors" | "institutions") => void;
  containerRef?: React.Ref<HTMLDivElement>;
  containerStyle?: React.CSSProperties;
};

export function OpenAlexAnalyticsCard({
  authorQuery,
  onAuthorQueryChange,
  institutionQuery,
  onInstitutionQueryChange,
  authorResults,
  institutionResults,
  runAuthorSearch,
  runInstitutionSearch,
  renderBars,
  exportOpenAlexCsv,
  exportOpenAlexPng,
  containerRef,
  containerStyle,
}: OpenAlexAnalyticsCardProps) {
  return (
    <ResearchCard
      containerRef={containerRef}
      containerStyle={containerStyle}
      title="OpenAlex Analytics"
      subtitle="Author and institution discovery."
    >
      <div style={{ display: "grid", gap: "8px" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <input
            value={authorQuery}
            onChange={(e) => onAuthorQueryChange(e.target.value)}
            placeholder="Search authors"
            style={{
              flex: "1 1 200px",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(0,0,0,0.3)",
              color: "#eaeaea",
            }}
          />
          <button
            onClick={runAuthorSearch}
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              border: "1px solid rgba(20,184,166,0.4)",
              background: "rgba(20,184,166,0.15)",
              color: "#5eead4",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Search
          </button>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <input
            value={institutionQuery}
            onChange={(e) => onInstitutionQueryChange(e.target.value)}
            placeholder="Search institutions"
            style={{
              flex: "1 1 200px",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(0,0,0,0.3)",
              color: "#eaeaea",
            }}
          />
          <button
            onClick={runInstitutionSearch}
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              border: "1px solid rgba(20,184,166,0.4)",
              background: "rgba(20,184,166,0.15)",
              color: "#5eead4",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Search
          </button>
        </div>
        <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", marginBottom: "6px" }}>Top authors</div>
            <AspectRatio ratio={4 / 3}>{renderBars(authorResults, "worksCount")}</AspectRatio>
            <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
              <button
                onClick={() => exportOpenAlexCsv("authors")}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid rgba(20,184,166,0.4)",
                  background: "rgba(20,184,166,0.15)",
                  color: "#5eead4",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                Export Authors CSV
              </button>
              <button
                onClick={() => exportOpenAlexPng("authors")}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid rgba(59,130,246,0.4)",
                  background: "rgba(59,130,246,0.15)",
                  color: "#93c5fd",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                Export Authors PNG
              </button>
            </div>
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", marginBottom: "6px" }}>
              Top institutions
            </div>
            <AspectRatio ratio={4 / 3}>{renderBars(institutionResults, "worksCount")}</AspectRatio>
            <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
              <button
                onClick={() => exportOpenAlexCsv("institutions")}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid rgba(20,184,166,0.4)",
                  background: "rgba(20,184,166,0.15)",
                  color: "#5eead4",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                Export Institutions CSV
              </button>
              <button
                onClick={() => exportOpenAlexPng("institutions")}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid rgba(244,114,182,0.4)",
                  background: "rgba(244,114,182,0.15)",
                  color: "#f9a8d4",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                Export Institutions PNG
              </button>
            </div>
          </div>
        </div>
      </div>
    </ResearchCard>
  );
}
