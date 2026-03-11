import React from "react";
import { ResearchCard } from "./ResearchCard";

type UnifiedSearchCardProps = {
  query: string;
  onQueryChange: (value: string) => void;
  onSearch: () => void;
  dedupeOpenalex: boolean;
  onToggleDedupe: (next: boolean) => void;
  openalexInsights: {
    count: number;
    yearRange: string;
    medianYear?: number | null;
    topVenue?: string | null;
    topAuthors?: string[] | null;
  } | null;
  exportOpenAlexWorksCsv: (mode: "full" | "doi-only" | "citation-only") => void;
  openalexYearFrom: string;
  openalexYearTo: string;
  openalexVenue: string;
  onOpenalexYearFromChange: (value: string) => void;
  onOpenalexYearToChange: (value: string) => void;
  onOpenalexVenueChange: (value: string) => void;
  status: string;
  containerRef?: React.Ref<HTMLDivElement>;
  containerStyle?: React.CSSProperties;
};

export function UnifiedSearchCard({
  query,
  onQueryChange,
  onSearch,
  dedupeOpenalex,
  onToggleDedupe,
  openalexInsights,
  exportOpenAlexWorksCsv,
  openalexYearFrom,
  openalexYearTo,
  openalexVenue,
  onOpenalexYearFromChange,
  onOpenalexYearToChange,
  onOpenalexVenueChange,
  status,
  containerRef,
  containerStyle,
}: UnifiedSearchCardProps) {
  return (
    <ResearchCard
      containerRef={containerRef}
      containerStyle={containerStyle}
      title="Unified Literature Search"
      subtitle="Search OpenAlex, Semantic Scholar, and arXiv in one action."
    >
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="e.g., retrieval augmented generation"
          style={{
            flex: "1 1 220px",
            padding: "10px 12px",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(0,0,0,0.3)",
            color: "#eaeaea",
          }}
        />
        <button
          onClick={onSearch}
          style={{
            padding: "10px 14px",
            borderRadius: "8px",
            border: "1px solid rgba(16,185,129,0.4)",
            background: "rgba(16,185,129,0.15)",
            color: "#6ee7b7",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Search
        </button>
      </div>
      <div style={{ marginTop: "10px", fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>
        Tip: Export OpenAlex results within a specific year range for cleaner bibliographies.
      </div>
      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "8px", flexWrap: "wrap" }}>
        <label style={{ display: "flex", gap: "6px", alignItems: "center", fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>
          <input
            type="checkbox"
            checked={dedupeOpenalex}
            onChange={(e) => onToggleDedupe(e.target.checked)}
          />
          Deduplicate DOI + title
        </label>
        {openalexInsights && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {[
              `${openalexInsights.count} results`,
              `Years ${openalexInsights.yearRange}`,
              openalexInsights.medianYear ? `Median ${openalexInsights.medianYear}` : "",
              openalexInsights.topVenue ? `Top venue: ${openalexInsights.topVenue}` : "",
              openalexInsights.topAuthors?.length ? `Top authors: ${openalexInsights.topAuthors.join(", ")}` : "",
            ]
              .filter(Boolean)
              .map((text) => (
                <span
                  key={text}
                  style={{
                    fontSize: "11px",
                    color: "rgba(255,255,255,0.7)",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    padding: "2px 6px",
                    borderRadius: "999px",
                  }}
                >
                  {text}
                </span>
              ))}
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
        <input
          value={openalexYearFrom}
          onChange={(e) => onOpenalexYearFromChange(e.target.value)}
          placeholder="Year from"
          style={{
            width: "120px",
            padding: "8px 10px",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(0,0,0,0.3)",
            color: "#eaeaea",
          }}
        />
        <input
          value={openalexYearTo}
          onChange={(e) => onOpenalexYearToChange(e.target.value)}
          placeholder="Year to"
          style={{
            width: "120px",
            padding: "8px 10px",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(0,0,0,0.3)",
            color: "#eaeaea",
          }}
        />
        <input
          value={openalexVenue}
          onChange={(e) => onOpenalexVenueChange(e.target.value)}
          placeholder="Venue contains…"
          style={{
            flex: "1 1 180px",
            padding: "8px 10px",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(0,0,0,0.3)",
            color: "#eaeaea",
          }}
        />
        <button
          onClick={() => exportOpenAlexWorksCsv("full")}
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
          Export OpenAlex CSV
        </button>
        <button
          onClick={() => exportOpenAlexWorksCsv("doi-only")}
          style={{
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid rgba(16,185,129,0.4)",
            background: "rgba(16,185,129,0.15)",
            color: "#6ee7b7",
            cursor: "pointer",
            fontSize: "12px",
          }}
        >
          Export DOI‑only
        </button>
        <button
          onClick={() => exportOpenAlexWorksCsv("citation-only")}
          style={{
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid rgba(245,158,11,0.4)",
            background: "rgba(245,158,11,0.15)",
            color: "#fde68a",
            cursor: "pointer",
            fontSize: "12px",
          }}
        >
          Export citations
        </button>
      </div>
      {status && <div style={{ marginTop: "8px", fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>{status}</div>}
    </ResearchCard>
  );
}
