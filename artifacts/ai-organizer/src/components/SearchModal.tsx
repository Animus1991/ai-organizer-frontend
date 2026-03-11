// src/components/SearchModal.tsx
import { useState, useEffect, useRef, useMemo } from "react";
import { search, SearchResultItem } from "../lib/api";
import { useLoading } from "../hooks/useLoading";
import { highlightSearch, truncateWithHighlight } from "../lib/searchUtils";
import SynonymsManager from "./SynonymsManager";
import OntologyManager from "./OntologyManager";
import { ClaimChangelog } from "./ClaimChangelog";
import { CaseLaboratory } from "./CaseLaboratory";
import { TheoryVersionManager } from "./TheoryVersionManager";
import { ConsistencyChecker } from "./ConsistencyChecker";
import { CircularDefinitionDetector } from "./CircularDefinitionDetector";
import { BoundaryConditionsPanel } from "./BoundaryConditionsPanel";
import { ContradictionFinder } from "./ContradictionFinder";
import { ArgumentMapVisualizer } from "./ArgumentMapVisualizer";
import { TheoryStrengthScorecard } from "./TheoryStrengthScorecard";
import { PropositionTypeCategorizer } from "./PropositionTypeCategorizer";
import { EvidenceRequirementsGenerator } from "./EvidenceRequirementsGenerator";
import { PublicationReadinessChecker } from "./PublicationReadinessChecker";
import { CounterTheoryRegistry } from "./CounterTheoryRegistry";
import { EvidenceChainBuilder } from "./EvidenceChainBuilder";
import { TheoryEvolutionTimeline } from "./TheoryEvolutionTimeline";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  onSelectResult?: (result: SearchResultItem) => void;
}

type SortOption = "relevance" | "score" | "title" | "type";

export default function SearchModal({ open, onClose, onSelectResult }: SearchModalProps) {
  const { t } = useLanguage();
  const { isDark, colors } = useTheme();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [selectedType, setSelectedType] = useState<"all" | "document" | "segment">("all");
  const [selectedMode, setSelectedMode] = useState<"all" | "qa" | "paragraphs">("all");
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [semantic, setSemantic] = useState(false);
  const [lang, setLang] = useState<"auto" | "el" | "en">("auto");
  const [expandVariations, setExpandVariations] = useState(true);
  const [searchResponse, setSearchResponse] = useState<{ semantic?: boolean; variations?: string[] } | null>(null);
  const [synonymsManagerOpen, setSynonymsManagerOpen] = useState(false);
  const [ontologyManagerOpen, setOntologyManagerOpen] = useState(false);
  const [claimChangelogOpen, setClaimChangelogOpen] = useState(false);
  const [caseLaboratoryOpen, setCaseLaboratoryOpen] = useState(false);
  const [theoryVersionsOpen, setTheoryVersionsOpen] = useState(false);
  const [consistencyCheckerOpen, setConsistencyCheckerOpen] = useState(false);
  const [circularDetectorOpen, setCircularDetectorOpen] = useState(false);
  const [boundaryPanelOpen, setBoundaryPanelOpen] = useState(false);
  const [contradictionFinderOpen, setContradictionFinderOpen] = useState(false);
  const [argumentMapOpen, setArgumentMapOpen] = useState(false);
  const [theoryScorecardOpen, setTheoryScorecardOpen] = useState(false);
  const [propCategorizerOpen, setPropCategorizerOpen] = useState(false);
  const [evidenceReqsOpen, setEvidenceReqsOpen] = useState(false);
  const [pubReadinessOpen, setPubReadinessOpen] = useState(false);
  const [counterTheoryOpen, setCounterTheoryOpen] = useState(false);
  const [evidenceChainOpen, setEvidenceChainOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const { loading, execute } = useLoading();

  // Recent searches — localStorage persistence
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("search-recent") || "[]"); } catch { return []; }
  });
  const saveRecent = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setRecentSearches(prev => {
      const next = [trimmed, ...prev.filter(r => r !== trimmed)].slice(0, 8);
      try { localStorage.setItem("search-recent", JSON.stringify(next)); } catch {}
      return next;
    });
  };
  const removeRecent = (q: string) => {
    setRecentSearches(prev => {
      const next = prev.filter(r => r !== q);
      try { localStorage.setItem("search-recent", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [open]);

  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearchResponse(null);
      setSearchError(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      execute(async () => {
        try {
          setSearchError(null);
          const response = await search(query, {
            type: selectedType === "all" ? undefined : selectedType,
            mode: selectedMode === "all" ? undefined : selectedMode,
            limit: 100,
            semantic,
            lang,
            expand_variations: expandVariations,
          });
          setResults(response.results);
          setSearchResponse({ semantic: response.semantic, variations: response.variations });
          setSelectedIndex(0);
          return response;
        } catch (error: any) {
          console.error("Search error:", error);
          setSearchError(error.message || t("searchModal.errorFallback"));
          setResults([]);
          setSearchResponse(null);
        }
      });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, selectedType, selectedMode, semantic, lang, expandVariations, execute, t]);

  // Sort results
  const sortedResults = useMemo(() => {
    const sorted = [...results];
    switch (sortBy) {
      case "score":
        return sorted.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
      case "title":
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case "type":
        return sorted.sort((a, b) => a.type.localeCompare(b.type));
      case "relevance":
      default:
        return sorted;
    }
  }, [results, sortBy]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, sortedResults.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && sortedResults.length > 0) {
        e.preventDefault();
        handleSelect(sortedResults[selectedIndex]);
      }
    };

    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, sortedResults, selectedIndex, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current && sortedResults.length > 0) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [selectedIndex, sortedResults.length]);

  const handleSelect = (result: SearchResultItem) => {
    saveRecent(query);
    if (onSelectResult) {
      onSelectResult(result);
    }
    onClose();
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: isDark ? "rgba(0, 0, 0, 0.85)" : colors.bgOverlay,
        backdropFilter: "blur(16px)",
        zIndex: 10000,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "8vh",
        padding: "8vh 16px 16px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1000,
          maxHeight: "85vh",
          background: isDark
            ? "linear-gradient(135deg, rgba(11, 14, 20, 0.98) 0%, rgba(8, 10, 16, 0.98) 100%)"
            : "#ffffff",
          backdropFilter: "blur(20px)",
          border: `1px solid ${colors.borderPrimary}`,
          borderRadius: "16px",
          boxShadow: isDark
            ? "0 24px 64px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05) inset"
            : colors.shadowLg,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Compact Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${colors.borderPrimary}`,
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexShrink: 0,
          }}
        >
          <div style={{ flex: 1, position: "relative" }}>
            <svg
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "18px",
                height: "18px",
                color: isDark ? "rgba(255, 255, 255, 0.5)" : "rgba(47, 41, 65, 0.55)",
                pointerEvents: "none",
                zIndex: 10,
              }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchModal.placeholder")}
              style={{
                width: "100%",
                padding: "10px 14px 10px 44px",
                borderRadius: "10px",
                border: query.trim()
                  ? "1px solid rgba(99, 102, 241, 0.4)"
                  : `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : colors.borderPrimary}`,
                background: isDark ? "rgba(0, 0, 0, 0.3)" : colors.bgInput,
                color: isDark ? "#eaeaea" : colors.textPrimary,
                fontSize: 15,
                outline: "none",
                transition: "all 0.2s ease",
              }}
            />
            {query.trim() && (
              <button
                onClick={() => setQuery("")}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: isDark ? "rgba(255, 255, 255, 0.5)" : "rgba(47, 41, 65, 0.6)",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 10,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = isDark ? "rgba(255, 255, 255, 0.8)" : "rgba(47, 41, 65, 0.85)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = isDark ? "rgba(255, 255, 255, 0.5)" : "rgba(47, 41, 65, 0.6)";
                }}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <button
            onClick={() => setSynonymsManagerOpen(true)}
            style={{
              padding: "7px 11px",
              background: isDark ? "rgba(99,102,241,0.18)" : "rgba(99,102,241,0.09)",
              border: `1px solid ${isDark ? "rgba(99,102,241,0.3)" : "rgba(99,102,241,0.22)"}`,
              borderRadius: "8px",
              color: isDark ? "#a5b4fc" : "#4338ca",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 500,
              whiteSpace: "nowrap",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? "rgba(99,102,241,0.28)" : "rgba(99,102,241,0.15)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = isDark ? "rgba(99,102,241,0.18)" : "rgba(99,102,241,0.09)"; }}
            title={t("searchModal.synonymsTitle")}
          >
            📚 {t("searchModal.synonyms")}
          </button>
          <button
            onClick={() => setOntologyManagerOpen(true)}
            style={{ padding: "7px 11px", background: isDark ? "rgba(139,92,246,0.15)" : "rgba(139,92,246,0.08)", border: `1px solid ${isDark ? "rgba(139,92,246,0.3)" : "rgba(139,92,246,0.22)"}`, borderRadius: "8px", color: isDark ? "#c4b5fd" : "#6d28d9", cursor: "pointer", fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", transition: "all 0.2s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? "rgba(139,92,246,0.25)" : "rgba(139,92,246,0.15)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = isDark ? "rgba(139,92,246,0.15)" : "rgba(139,92,246,0.08)"; }}
            title="Ontology & Glossary Manager"
          >
            📖 Ontology
          </button>
          <button
            onClick={() => setClaimChangelogOpen(true)}
            style={{ padding: "7px 11px", background: isDark ? "rgba(16,185,129,0.15)" : "rgba(16,185,129,0.08)", border: `1px solid ${isDark ? "rgba(16,185,129,0.3)" : "rgba(16,185,129,0.22)"}`, borderRadius: "8px", color: isDark ? "#6ee7b7" : "#059669", cursor: "pointer", fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", transition: "all 0.2s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? "rgba(16,185,129,0.25)" : "rgba(16,185,129,0.15)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = isDark ? "rgba(16,185,129,0.15)" : "rgba(16,185,129,0.08)"; }}
            title="Claim Changelog & Traceability"
          >
            📜 Changelog
          </button>
          <button
            onClick={() => setCaseLaboratoryOpen(true)}
            style={{ padding: "7px 11px", background: isDark ? "rgba(245,158,11,0.15)" : "rgba(245,158,11,0.08)", border: `1px solid ${isDark ? "rgba(245,158,11,0.3)" : "rgba(245,158,11,0.22)"}`, borderRadius: "8px", color: isDark ? "#fcd34d" : "#b45309", cursor: "pointer", fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", transition: "all 0.2s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? "rgba(245,158,11,0.25)" : "rgba(245,158,11,0.15)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = isDark ? "rgba(245,158,11,0.15)" : "rgba(245,158,11,0.08)"; }}
            title="Case Laboratory"
          >
            🧪 Cases
          </button>
          <button
            onClick={() => setTheoryVersionsOpen(true)}
            style={{ padding: "8px 12px", background: isDark ? "rgba(236, 72, 153, 0.15)" : "rgba(236, 72, 153, 0.08)", border: `1px solid ${isDark ? "rgba(236, 72, 153, 0.3)" : "rgba(236, 72, 153, 0.22)"}`, borderRadius: "8px", color: isDark ? "#f9a8d4" : "#9d174d", cursor: "pointer", fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", transition: "all 0.2s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? "rgba(236, 72, 153, 0.25)" : "rgba(236, 72, 153, 0.15)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = isDark ? "rgba(236, 72, 153, 0.15)" : "rgba(236, 72, 153, 0.08)"; }}
            title="Theory Version Manager"
          >
            🔄 Versions
          </button>
          <button
            onClick={() => setConsistencyCheckerOpen(true)}
            style={{ padding: "8px 12px", background: isDark ? "rgba(14, 165, 233, 0.15)" : "rgba(14, 165, 233, 0.08)", border: `1px solid ${isDark ? "rgba(14, 165, 233, 0.3)" : "rgba(14, 165, 233, 0.22)"}`, borderRadius: "8px", color: isDark ? "#7dd3fc" : "#0369a1", cursor: "pointer", fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", transition: "all 0.2s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? "rgba(14, 165, 233, 0.25)" : "rgba(14, 165, 233, 0.15)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = isDark ? "rgba(14, 165, 233, 0.15)" : "rgba(14, 165, 233, 0.08)"; }}
            title="Consistency Checker"
          >
            ✅ Consistency
          </button>
          <button
            onClick={() => setCircularDetectorOpen(true)}
            style={{ padding: "8px 12px", background: isDark ? "rgba(168, 85, 247, 0.15)" : "rgba(168, 85, 247, 0.08)", border: `1px solid ${isDark ? "rgba(168, 85, 247, 0.3)" : "rgba(168, 85, 247, 0.22)"}`, borderRadius: "8px", color: isDark ? "#d8b4fe" : "#6d28d9", cursor: "pointer", fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", transition: "all 0.2s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? "rgba(168, 85, 247, 0.25)" : "rgba(168, 85, 247, 0.15)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = isDark ? "rgba(168, 85, 247, 0.15)" : "rgba(168, 85, 247, 0.08)"; }}
            title="Circular Definition Detector"
          >
            🔁 Circular
          </button>
          <button
            onClick={() => setBoundaryPanelOpen(true)}
            style={{ padding: "8px 12px", background: isDark ? "rgba(6, 182, 212, 0.15)" : "rgba(6, 182, 212, 0.08)", border: `1px solid ${isDark ? "rgba(6, 182, 212, 0.3)" : "rgba(6, 182, 212, 0.22)"}`, borderRadius: "8px", color: isDark ? "#67e8f9" : "#0e7490", cursor: "pointer", fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", transition: "all 0.2s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? "rgba(6, 182, 212, 0.25)" : "rgba(6, 182, 212, 0.15)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = isDark ? "rgba(6, 182, 212, 0.15)" : "rgba(6, 182, 212, 0.08)"; }}
            title="Boundary Conditions Panel"
          >
            🛡️ Boundaries
          </button>
          <button
            onClick={() => setContradictionFinderOpen(true)}
            style={{ padding: "8px 12px", background: isDark ? "rgba(239, 68, 68, 0.15)" : "rgba(239, 68, 68, 0.08)", border: `1px solid ${isDark ? "rgba(239, 68, 68, 0.3)" : "rgba(239, 68, 68, 0.22)"}`, borderRadius: "8px", color: isDark ? "#fca5a5" : "#dc2626", cursor: "pointer", fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", transition: "all 0.2s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? "rgba(239, 68, 68, 0.25)" : "rgba(239, 68, 68, 0.15)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = isDark ? "rgba(239, 68, 68, 0.15)" : "rgba(239, 68, 68, 0.08)"; }}
            title="Contradiction Finder"
          >
            ⚡ Contradictions
          </button>
          <button
            onClick={() => setArgumentMapOpen(true)}
            style={{ padding: "8px 12px", background: isDark ? "rgba(59, 130, 246, 0.15)" : "rgba(59, 130, 246, 0.08)", border: `1px solid ${isDark ? "rgba(59, 130, 246, 0.3)" : "rgba(59, 130, 246, 0.22)"}`, borderRadius: "8px", color: isDark ? "#93c5fd" : "#1d4ed8", cursor: "pointer", fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", transition: "all 0.2s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? "rgba(59, 130, 246, 0.25)" : "rgba(59, 130, 246, 0.15)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = isDark ? "rgba(59, 130, 246, 0.15)" : "rgba(59, 130, 246, 0.08)"; }}
            title="Argument Map Visualizer"
          >
            🗺️ Arg Map
          </button>
          <button
            onClick={() => setTheoryScorecardOpen(true)}
            style={{ padding: "8px 12px", background: isDark ? "rgba(16, 185, 129, 0.15)" : "rgba(16, 185, 129, 0.08)", border: `1px solid ${isDark ? "rgba(16, 185, 129, 0.3)" : "rgba(16, 185, 129, 0.22)"}`, borderRadius: "8px", color: isDark ? "#6ee7b7" : "#047857", cursor: "pointer", fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", transition: "all 0.2s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? "rgba(16, 185, 129, 0.25)" : "rgba(16, 185, 129, 0.15)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = isDark ? "rgba(16, 185, 129, 0.15)" : "rgba(16, 185, 129, 0.08)"; }}
            title="Theory Strength Scorecard"
          >
            📊 Scorecard
          </button>
          <button
            onClick={() => setPropCategorizerOpen(true)}
            style={{ padding: "8px 12px", background: isDark ? "rgba(167,139,250,0.15)" : "rgba(167,139,250,0.08)", border: `1px solid ${isDark ? "rgba(167,139,250,0.3)" : "rgba(167,139,250,0.22)"}`, borderRadius: "8px", color: isDark ? "#c4b5fd" : "#5b21b6", cursor: "pointer", fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", transition: "all 0.2s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? "rgba(167,139,250,0.25)" : "rgba(167,139,250,0.15)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = isDark ? "rgba(167,139,250,0.15)" : "rgba(167,139,250,0.08)"; }}
            title="Proposition Type Categorizer"
          >
            🏷️ Types
          </button>
          <button
            onClick={() => setEvidenceReqsOpen(true)}
            style={{ padding: "8px 12px", background: isDark ? "rgba(251,191,36,0.15)" : "rgba(251,191,36,0.08)", border: `1px solid ${isDark ? "rgba(251,191,36,0.3)" : "rgba(251,191,36,0.22)"}`, borderRadius: "8px", color: isDark ? "#fde68a" : "#92400e", cursor: "pointer", fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", transition: "all 0.2s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? "rgba(251,191,36,0.25)" : "rgba(251,191,36,0.15)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = isDark ? "rgba(251,191,36,0.15)" : "rgba(251,191,36,0.08)"; }}
            title="Evidence Requirements Generator"
          >
            📋 Evidence Reqs
          </button>
          <button
            onClick={() => setPubReadinessOpen(true)}
            style={{ padding: "8px 12px", background: isDark ? "rgba(34,197,94,0.15)" : "rgba(34,197,94,0.08)", border: `1px solid ${isDark ? "rgba(34,197,94,0.3)" : "rgba(34,197,94,0.22)"}`, borderRadius: "8px", color: isDark ? "#86efac" : "#166534", cursor: "pointer", fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", transition: "all 0.2s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? "rgba(34,197,94,0.25)" : "rgba(34,197,94,0.15)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = isDark ? "rgba(34,197,94,0.15)" : "rgba(34,197,94,0.08)"; }}
            title="Publication Readiness Checker"
          >
            📑 Readiness
          </button>
          <button
            onClick={() => setCounterTheoryOpen(true)}
            style={{ padding: "8px 12px", background: isDark ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.08)", border: `1px solid ${isDark ? "rgba(239,68,68,0.3)" : "rgba(239,68,68,0.22)"}`, borderRadius: "8px", color: isDark ? "#fca5a5" : "#b91c1c", cursor: "pointer", fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", transition: "all 0.2s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? "rgba(239,68,68,0.25)" : "rgba(239,68,68,0.15)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = isDark ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.08)"; }}
            title="Counter-Theory Registry"
          >
            ⚔️ Counter
          </button>
          <button
            onClick={() => setEvidenceChainOpen(true)}
            style={{ padding: "8px 12px", background: isDark ? "rgba(96,165,250,0.15)" : "rgba(96,165,250,0.08)", border: `1px solid ${isDark ? "rgba(96,165,250,0.3)" : "rgba(96,165,250,0.22)"}`, borderRadius: "8px", color: isDark ? "#93c5fd" : "#1e40af", cursor: "pointer", fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", transition: "all 0.2s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? "rgba(96,165,250,0.25)" : "rgba(96,165,250,0.15)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = isDark ? "rgba(96,165,250,0.15)" : "rgba(96,165,250,0.08)"; }}
            title="Evidence Chain Builder"
          >
            🔗 Chain
          </button>
          <button
            onClick={() => setTimelineOpen(true)}
            style={{ padding: "8px 12px", background: isDark ? "rgba(244,114,182,0.15)" : "rgba(244,114,182,0.08)", border: `1px solid ${isDark ? "rgba(244,114,182,0.3)" : "rgba(244,114,182,0.22)"}`, borderRadius: "8px", color: isDark ? "#f9a8d4" : "#9d174d", cursor: "pointer", fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", transition: "all 0.2s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? "rgba(244,114,182,0.25)" : "rgba(244,114,182,0.15)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = isDark ? "rgba(244,114,182,0.15)" : "rgba(244,114,182,0.08)"; }}
            title="Theory Evolution Timeline"
          >
            📅 Timeline
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "10px",
              background: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(47, 41, 65, 0.06)",
              border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : `1px solid ${colors.borderPrimary}`,
              borderRadius: "8px",
              color: isDark ? "#eaeaea" : colors.textSecondary,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(47, 41, 65, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(47, 41, 65, 0.06)";
            }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "18px", height: "18px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Compact Filters Row */}
        <div
          style={{
            padding: "12px 20px",
            borderBottom: `1px solid ${colors.borderPrimary}`,
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            alignItems: "center",
            background: isDark ? "rgba(0, 0, 0, 0.2)" : "rgba(47, 41, 65, 0.04)",
            flexShrink: 0,
          }}
        >
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as any)}
            style={{
              padding: "6px 10px",
              borderRadius: "8px",
              border: selectedType !== "all"
                ? "1px solid rgba(99, 102, 241, 0.4)"
                : `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : colors.borderPrimary}`,
              background: isDark ? "rgba(0, 0, 0, 0.3)" : colors.bgInput,
              color: isDark ? "#eaeaea" : colors.textPrimary,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            <option value="all">{t("searchModal.allTypes")}</option>
            <option value="document">📄 {t("searchModal.documents")}</option>
            <option value="segment">📝 {t("searchModal.segments")}</option>
          </select>
          {(selectedType === "segment" || selectedType === "all") && (
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value as any)}
              style={{
                padding: "6px 10px",
                borderRadius: "8px",
                border: selectedMode !== "all"
                  ? "1px solid rgba(99, 102, 241, 0.4)"
                  : `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : colors.borderPrimary}`,
                background: isDark ? "rgba(0, 0, 0, 0.3)" : colors.bgInput,
                color: isDark ? "#eaeaea" : colors.textPrimary,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              <option value="all">{t("searchModal.allModes")}</option>
              <option value="qa">{t("searchModal.qa")}</option>
              <option value="paragraphs">{t("searchModal.paragraphs")}</option>
            </select>
          )}
          
          {/* Advanced Options Toggle */}
          <button
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            style={{
              padding: "6px 10px",
              background: filtersExpanded
                ? (isDark ? "rgba(99, 102, 241, 0.2)" : "rgba(99, 102, 241, 0.14)")
                : (isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(47, 41, 65, 0.06)"),
              border: filtersExpanded
                ? "1px solid rgba(99, 102, 241, 0.4)"
                : `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : colors.borderPrimary}`,
              borderRadius: "8px",
              color: isDark ? "#eaeaea" : colors.textPrimary,
              cursor: "pointer",
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "14px", height: "14px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            {t("searchModal.options")}
          </button>
          
          <div style={{ flex: 1 }} />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            style={{
              padding: "6px 10px",
              borderRadius: "8px",
              border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : colors.borderPrimary}`,
              background: isDark ? "rgba(0, 0, 0, 0.3)" : colors.bgInput,
              color: isDark ? "#eaeaea" : colors.textPrimary,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            <option value="relevance">{t("searchModal.sortRelevance")}</option>
            <option value="score">{t("searchModal.sortScore")}</option>
            <option value="title">{t("searchModal.sortTitle")}</option>
            <option value="type">{t("searchModal.sortType")}</option>
          </select>
          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: isDark ? "rgba(255, 255, 255, 0.6)" : colors.textSecondary, fontSize: 11 }}>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24" style={{ width: "14px", height: "14px" }}>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {t("searchModal.searching")}
            </div>
          )}
        </div>

        {/* Expanded Advanced Options */}
        {filtersExpanded && (
          <div
            style={{
              padding: "12px 20px",
              borderBottom: `1px solid ${colors.borderPrimary}`,
              background: isDark ? "rgba(99, 102, 241, 0.05)" : "rgba(99, 102, 241, 0.06)",
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              alignItems: "center",
              fontSize: 12,
            }}
          >
            <label 
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "6px", 
                cursor: "pointer", 
                color: isDark ? "rgba(255, 255, 255, 0.8)" : colors.textSecondary,
                padding: "4px 8px",
                borderRadius: "6px",
                background: semantic ? (isDark ? "rgba(99, 102, 241, 0.15)" : "rgba(99, 102, 241, 0.12)") : "transparent",
                transition: "background 0.2s",
              }}
              title={t("searchModal.semanticTitle")}
            >
              <input
                type="checkbox"
                checked={semantic}
                onChange={(e) => setSemantic(e.target.checked)}
                style={{ cursor: "pointer", transform: "scale(1.1)" }}
              />
              <span style={{ fontWeight: semantic ? 600 : 400 }}>🧠 {t("searchModal.semantic")}</span>
            </label>
            {semantic && (
              <>
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value as "auto" | "el" | "en")}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "6px",
                    border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : colors.borderPrimary}`,
                    background: isDark ? "rgba(0, 0, 0, 0.3)" : colors.bgInput,
                    color: isDark ? "#eaeaea" : colors.textPrimary,
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                  title={t("searchModal.languageTitle")}
                >
                  <option value="auto">🌐 {t("searchModal.lang.auto")}</option>
                  <option value="el">🇬🇷 {t("searchModal.lang.el")}</option>
                  <option value="en">🇬🇧 {t("searchModal.lang.en")}</option>
                </select>
                <label 
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "6px", 
                    cursor: "pointer", 
                    color: isDark ? "rgba(255, 255, 255, 0.8)" : colors.textSecondary,
                    padding: "4px 8px",
                    borderRadius: "6px",
                    background: expandVariations ? (isDark ? "rgba(99, 102, 241, 0.1)" : "rgba(99, 102, 241, 0.08)") : "transparent",
                    transition: "background 0.2s",
                  }}
                  title={t("searchModal.variationsTitle")}
                >
                  <input
                    type="checkbox"
                    checked={expandVariations}
                    onChange={(e) => setExpandVariations(e.target.checked)}
                    style={{ cursor: "pointer", transform: "scale(1.1)" }}
                  />
                  <span style={{ fontWeight: expandVariations ? 600 : 400 }}>📝 {t("searchModal.variations")}</span>
                </label>
              </>
            )}
          </div>
        )}
        
        {/* Search Info */}
        {searchResponse && query.trim() && (searchResponse.semantic || searchResponse.variations?.length) && (
          <div
            style={{
              padding: "8px 20px",
              borderBottom: `1px solid ${colors.borderPrimary}`,
              fontSize: 11,
              color: isDark ? "rgba(255, 255, 255, 0.7)" : colors.textSecondary,
              background: isDark ? "rgba(99, 102, 241, 0.08)" : "rgba(99, 102, 241, 0.06)",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            {searchResponse.semantic && (
              <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "rgba(99, 102, 241, 0.9)", fontWeight: 500 }}>
                <span>🧠</span>
                <span>{t("searchModal.semanticEnabled")}</span>
              </span>
            )}
            {searchResponse.variations && searchResponse.variations.length > 1 && (
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ opacity: 0.6 }}>📝</span>
                <span>
                  <strong>{t("searchModal.variations")}:</strong> {searchResponse.variations.slice(0, 3).join(", ")}
                  {searchResponse.variations.length > 3 &&
                    t("searchModal.moreCount", { count: searchResponse.variations.length - 3 })}
                </span>
              </span>
            )}
          </div>
        )}
        
        {/* Warning if semantic search is requested but not available */}
        {semantic && !searchResponse?.semantic && query.trim() && !loading && results.length > 0 && (
          <div
            style={{
              padding: "8px 20px",
              borderBottom: `1px solid ${colors.borderPrimary}`,
              fontSize: 11,
              color: colors.accentWarning,
              background: isDark ? "rgba(217, 119, 6, 0.16)" : "rgba(217, 119, 6, 0.1)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>⚠️</span>
            <span>{t("searchModal.semanticNotAvailable")}</span>
          </div>
        )}
        
        {/* Search Error */}
        {searchError && query.trim() && (
          <div
            style={{
              padding: "10px 20px",
              borderBottom: `1px solid ${colors.borderPrimary}`,
              fontSize: 12,
              color: colors.accentError,
              background: isDark ? "rgba(220, 38, 38, 0.16)" : "rgba(220, 38, 38, 0.1)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>❌</span>
            <span>{searchError}</span>
            <button
              onClick={() => setSearchError(null)}
              style={{
                marginLeft: "auto",
                padding: "4px 8px",
                background: isDark ? "rgba(255, 255, 255, 0.1)" : colors.bgHover,
                border: "none",
                borderRadius: "4px",
                color: isDark ? "rgba(255, 255, 255, 0.8)" : colors.textSecondary,
                cursor: "pointer",
                fontSize: 11,
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Results */}
        <div
          ref={resultsRef}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px",
            minHeight: 0,
          }}
        >
          {!query.trim() ? (
            <div style={{ padding: "20px 4px" }}>
              {/* Recent searches */}
              {recentSearches.length > 0 && (
                <div style={{ marginBottom: "24px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>🕐 Recent</span>
                    <button onClick={() => { setRecentSearches([]); try { localStorage.removeItem("search-recent"); } catch {} }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "11px", color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)", padding: "2px 6px", borderRadius: "4px" }}>Clear all</button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    {recentSearches.map(r => (
                      <div key={r} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 10px", borderRadius: "9px", cursor: "pointer", transition: "background 0.12s", background: "transparent" }}
                        onMouseEnter={e => { e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                        onClick={() => setQuery(r)}
                      >
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "13px", height: "13px", flexShrink: 0, color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span style={{ flex: 1, fontSize: "13px", color: isDark ? "rgba(255,255,255,0.75)" : "#374151" }}>{r}</span>
                        <button onClick={e => { e.stopPropagation(); removeRecent(r); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)", lineHeight: 1, borderRadius: "4px", fontSize: "14px" }}>×</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick navigation grid */}
              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>⚡ Quick Navigation</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "8px" }}>
                  {[
                    { icon: "📚", label: "Library", path: "/library" },
                    { icon: "🔬", label: "Research Hub", path: "/research" },
                    { icon: "📊", label: "Activity", path: "/activity" },
                    { icon: "🔭", label: "Discover", path: "/discover" },
                    { icon: "📂", label: "Collections", path: "/collections" },
                    { icon: "⚙️", label: "Settings", path: "/settings" },
                  ].map(item => (
                    <button key={item.path} onClick={() => { onClose(); window.location.href = item.path; }}
                      style={{
                        display: "flex", alignItems: "center", gap: "8px",
                        padding: "9px 12px", borderRadius: "10px",
                        background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                        border: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.07)",
                        color: isDark ? "rgba(255,255,255,0.7)" : "#374151",
                        fontSize: "13px", cursor: "pointer", transition: "all 0.12s", textAlign: "left",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = isDark ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.07)"; e.currentTarget.style.color = isDark ? "#a5b4fc" : "#4338ca"; e.currentTarget.style.borderColor = isDark ? "rgba(99,102,241,0.3)" : "rgba(99,102,241,0.2)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)"; e.currentTarget.style.color = isDark ? "rgba(255,255,255,0.7)" : "#374151"; e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"; }}
                    >
                      <span style={{ fontSize: "16px" }}>{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : sortedResults.length === 0 && !loading ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: isDark ? "rgba(255, 255, 255, 0.5)" : colors.textMuted }}>
              <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>🔎</div>
              <p style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>{t("searchModal.noResults")} "{query}"</p>
              <p style={{ fontSize: 12, opacity: 0.7 }}>
                {t("searchModal.tryDifferent")}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {sortedResults.map((result, index) => {
                const isSelected = index === selectedIndex;
                const { parts, truncated } = truncateWithHighlight(result.content || "", query, 200);
                
                return (
                  <div
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelect(result)}
                    style={{
                      padding: "14px",
                      background: isSelected
                        ? (isDark ? "rgba(99, 102, 241, 0.2)" : "rgba(99, 102, 241, 0.14)")
                        : (isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(47, 41, 65, 0.04)"),
                      border: isSelected
                        ? (isDark ? "1px solid rgba(99, 102, 241, 0.5)" : "1px solid rgba(47, 41, 65, 0.34)")
                        : `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : colors.borderPrimary}`,
                      borderRadius: "10px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(47, 41, 65, 0.06)";
                        e.currentTarget.style.borderColor = isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(74, 50, 34, 0.26)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(47, 41, 65, 0.04)";
                        e.currentTarget.style.borderColor = isDark ? "rgba(255, 255, 255, 0.1)" : colors.borderPrimary;
                      }
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "8px" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: "6px",
                              fontSize: 10,
                              fontWeight: 600,
                              background: result.type === "document" ? "rgba(59, 130, 246, 0.2)" : "rgba(139, 92, 246, 0.2)",
                              color: result.type === "document" ? "#93c5fd" : "#c4b5fd",
                            }}
                          >
                            {result.type === "document" ? `📄 ${t("searchModal.document")}` : `📝 ${t("searchModal.segment")}`}
                          </span>
                          {result.mode && (
                            <span
                              style={{
                                padding: "3px 8px",
                                borderRadius: "6px",
                                fontSize: 10,
                                color: isDark ? "rgba(255, 255, 255, 0.6)" : colors.textSecondary,
                                background: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(47, 41, 65, 0.06)",
                              }}
                            >
                              {result.mode}
                            </span>
                          )}
                          {result.score !== null && (
                            <span
                              style={{
                                fontSize: 10,
                                color: isDark ? "rgba(255, 255, 255, 0.4)" : colors.textMuted,
                              }}
                            >
                              {t("searchModal.score")}: {result.score.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <h3
                          style={{
                            fontSize: 15,
                            fontWeight: 600,
                            color: isDark ? "#eaeaea" : colors.textPrimary,
                            marginBottom: "6px",
                          }}
                        >
                          {query.trim() ? (
                            highlightSearch(result.title, query).map((part, idx) => (
                              <span
                                key={idx}
                                style={part.highlighted ? {
                                  background: isDark ? "rgba(99, 102, 241, 0.3)" : "rgba(99, 102, 241, 0.18)",
                                  color: isDark ? "#a5b4fc" : colors.textPrimary,
                                  fontWeight: 700,
                                  padding: "2px 4px",
                                  borderRadius: 4,
                                } : {}}
                              >
                                {part.text}
                              </span>
                            ))
                          ) : (
                            result.title
                          )}
                        </h3>
                      </div>
                    </div>
                    {result.content && (
                      <p
                        style={{
                          fontSize: 12,
                          color: isDark ? "rgba(255, 255, 255, 0.7)" : colors.textSecondary,
                          lineHeight: 1.6,
                          margin: 0,
                        }}
                      >
                        {parts.map((part, idx) => (
                          <span
                            key={idx}
                            style={part.highlighted ? {
                              background: isDark ? "rgba(99, 102, 241, 0.3)" : "rgba(99, 102, 241, 0.18)",
                              color: isDark ? "#a5b4fc" : colors.textPrimary,
                              fontWeight: 600,
                            } : {}}
                          >
                            {part.text}
                          </span>
                        ))}
                        {truncated && "..."}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Compact Footer */}
        {sortedResults.length > 0 && (
          <div
            style={{
              padding: "10px 20px",
              borderTop: `1px solid ${colors.borderPrimary}`,
              fontSize: 11,
              color: isDark ? "rgba(255, 255, 255, 0.5)" : colors.textSecondary,
              textAlign: "center",
              background: isDark ? "rgba(0, 0, 0, 0.2)" : "rgba(47, 41, 65, 0.04)",
              flexShrink: 0,
            }}
          >
            {sortedResults.length} {t("searchModal.resultsFound")}
            {selectedIndex >= 0 && (
              <span style={{ marginLeft: "12px" }}>
                • {t("searchModal.pressEnter")}
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Synonyms Manager Modal */}
      <SynonymsManager open={synonymsManagerOpen} onClose={() => setSynonymsManagerOpen(false)} />
      <OntologyManager open={ontologyManagerOpen} onClose={() => setOntologyManagerOpen(false)} />
      <ClaimChangelog open={claimChangelogOpen} onClose={() => setClaimChangelogOpen(false)} />
      <CaseLaboratory open={caseLaboratoryOpen} onClose={() => setCaseLaboratoryOpen(false)} />
      <TheoryVersionManager open={theoryVersionsOpen} onClose={() => setTheoryVersionsOpen(false)} />
      <ConsistencyChecker open={consistencyCheckerOpen} onClose={() => setConsistencyCheckerOpen(false)} />
      <CircularDefinitionDetector open={circularDetectorOpen} onClose={() => setCircularDetectorOpen(false)} />
      <BoundaryConditionsPanel open={boundaryPanelOpen} onClose={() => setBoundaryPanelOpen(false)} />
      <ContradictionFinder open={contradictionFinderOpen} onClose={() => setContradictionFinderOpen(false)} />
      <ArgumentMapVisualizer open={argumentMapOpen} onClose={() => setArgumentMapOpen(false)} />
      <TheoryStrengthScorecard open={theoryScorecardOpen} onClose={() => setTheoryScorecardOpen(false)} />
      <PropositionTypeCategorizer open={propCategorizerOpen} onClose={() => setPropCategorizerOpen(false)} />
      <EvidenceRequirementsGenerator open={evidenceReqsOpen} onClose={() => setEvidenceReqsOpen(false)} />
      <PublicationReadinessChecker open={pubReadinessOpen} onClose={() => setPubReadinessOpen(false)} />
      <CounterTheoryRegistry open={counterTheoryOpen} onClose={() => setCounterTheoryOpen(false)} />
      <EvidenceChainBuilder open={evidenceChainOpen} onClose={() => setEvidenceChainOpen(false)} />
      <TheoryEvolutionTimeline open={timelineOpen} onClose={() => setTimelineOpen(false)} />
    </div>
  );
}
