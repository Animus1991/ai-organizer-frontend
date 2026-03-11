import React from "react";
import { ResearchCard } from "./ResearchCard";
import type { ResultItem } from "../types";

type ResultsSectionProps = {
  openalexResults: ResultItem[];
  openalexVisibleCount: number;
  openalexLoadRef: React.RefObject<HTMLDivElement>;
  openalexIsLoadingMore: boolean;
  semanticResults: ResultItem[];
  semanticVisibleCount: number;
  semanticLoadRef: React.RefObject<HTMLDivElement>;
  semanticIsLoadingMore: boolean;
  arxivResults: ResultItem[];
  arxivVisibleCount: number;
  arxivLoadRef: React.RefObject<HTMLDivElement>;
  arxivIsLoadingMore: boolean;
  renderList: (
    items: ResultItem[],
    visibleCount: number,
    loadRef: React.RefObject<HTMLDivElement>,
    isLoading: boolean
  ) => React.ReactNode;
};

export function ResultsSection({
  openalexResults,
  openalexVisibleCount,
  openalexLoadRef,
  openalexIsLoadingMore,
  semanticResults,
  semanticVisibleCount,
  semanticLoadRef,
  semanticIsLoadingMore,
  arxivResults,
  arxivVisibleCount,
  arxivLoadRef,
  arxivIsLoadingMore,
  renderList,
}: ResultsSectionProps) {
  return (
    <div style={{ marginTop: "var(--section-gap)", display: "grid", gap: "20px" }}>
      <ResearchCard title="OpenAlex Results" subtitle="High-coverage academic works.">
        {openalexResults.length ? (
          renderList(openalexResults, openalexVisibleCount, openalexLoadRef, openalexIsLoadingMore)
        ) : (
          <div style={{ opacity: 0.6 }}>No results yet.</div>
        )}
      </ResearchCard>
      <ResearchCard title="Semantic Scholar Results" subtitle="AI‑curated citations and authors.">
        {semanticResults.length ? (
          renderList(semanticResults, semanticVisibleCount, semanticLoadRef, semanticIsLoadingMore)
        ) : (
          <div style={{ opacity: 0.6 }}>No results yet.</div>
        )}
      </ResearchCard>
      <ResearchCard title="arXiv Results" subtitle="Preprints for fast‑moving fields.">
        {arxivResults.length ? (
          renderList(arxivResults, arxivVisibleCount, arxivLoadRef, arxivIsLoadingMore)
        ) : (
          <div style={{ opacity: 0.6 }}>No results yet.</div>
        )}
      </ResearchCard>
    </div>
  );
}
