/**
 * CrossProjectSearchPage — GitHub Code Search equivalent for academic research
 * Features: unified search across projects, documents, claims, evidence, theories
 * with filters, facets, and advanced query syntax
 */

import { useState, useMemo, useCallback, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useIsMobile } from "../hooks/useMediaQuery";

// ─── Types ───────────────────────────────────────────────────
type SearchResultType = "document" | "claim" | "evidence" | "theory" | "discussion" | "segment" | "note";
type SearchScope = "all" | "documents" | "claims" | "evidence" | "theories" | "discussions";
type SortMode = "relevance" | "newest" | "oldest" | "most-cited";

interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  excerpt: string;
  projectName: string;
  projectIcon: string;
  author: string;
  authorAvatar: string;
  matchCount: number;
  relevanceScore: number;
  createdAt: number;
  updatedAt: number;
  citations: number;
  tags: string[];
  highlights: string[];
  path: string;
}

interface SearchFilter {
  scope: SearchScope;
  dateRange: "any" | "today" | "week" | "month" | "year";
  author: string;
  project: string;
  sortBy: SortMode;
}

interface RecentSearch {
  id: string;
  query: string;
  timestamp: number;
  resultCount: number;
}

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: SearchFilter;
  createdAt: number;
}

// ─── Constants ───────────────────────────────────────────────
const STORAGE_KEY = "thinkspace-cross-search";

const TYPE_CONFIG: Record<SearchResultType, { icon: string; color: string; label: string }> = {
  document:   { icon: "📄", color: "#3b82f6", label: "Document" },
  claim:      { icon: "🎯", color: "#f59e0b", label: "Claim" },
  evidence:   { icon: "🔬", color: "#22c55e", label: "Evidence" },
  theory:     { icon: "🏗️", color: "#8b5cf6", label: "Theory" },
  discussion: { icon: "💬", color: "#ec4899", label: "Discussion" },
  segment:    { icon: "📝", color: "#6366f1", label: "Segment" },
  note:       { icon: "🗒️", color: "#14b8a6", label: "Note" },
};

function generateId(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

// ─── Sample Data ─────────────────────────────────────────────
function createSampleResults(): SearchResult[] {
  const now = Date.now();
  return [
    {
      id: generateId(), type: "document", title: "Quantum Coherence in Photosynthetic Light Harvesting",
      excerpt: "We demonstrate that quantum coherence persists in the FMO complex at physiological temperatures, challenging the classical view of energy transfer in biological systems...",
      projectName: "Quantum Biology Research", projectIcon: "🧬", author: "Dr. Elena Vasquez", authorAvatar: "🧬",
      matchCount: 12, relevanceScore: 0.95, createdAt: now - 86400000 * 30, updatedAt: now - 86400000 * 2,
      citations: 45, tags: ["quantum", "photosynthesis", "coherence"], highlights: ["quantum coherence", "FMO complex", "energy transfer"],
      path: "/documents/quantum-coherence-photosynthesis",
    },
    {
      id: generateId(), type: "claim", title: "Quantum tunneling enhances enzyme catalysis rates by 10-100x",
      excerpt: "Based on kinetic isotope effect measurements and computational modeling, we claim that hydrogen tunneling contributes significantly to the catalytic rate enhancement in alcohol dehydrogenase...",
      projectName: "Quantum Biology Research", projectIcon: "🧬", author: "Dr. Marco Rossi", authorAvatar: "🔬",
      matchCount: 8, relevanceScore: 0.88, createdAt: now - 86400000 * 20, updatedAt: now - 86400000 * 5,
      citations: 23, tags: ["tunneling", "enzymes", "catalysis"], highlights: ["quantum tunneling", "enzyme catalysis", "kinetic isotope"],
      path: "/claims/quantum-tunneling-enzymes",
    },
    {
      id: generateId(), type: "evidence", title: "2D Electronic Spectroscopy Data — FMO Complex at 300K",
      excerpt: "Experimental data showing long-lived quantum beats in the FMO complex at room temperature. Measurements taken using ultrafast 2D electronic spectroscopy with 15fs pulse duration...",
      projectName: "Quantum Biology Research", projectIcon: "🧬", author: "Dr. Elena Vasquez", authorAvatar: "🧬",
      matchCount: 6, relevanceScore: 0.92, createdAt: now - 86400000 * 15, updatedAt: now - 86400000 * 3,
      citations: 34, tags: ["spectroscopy", "FMO", "experimental"], highlights: ["2D spectroscopy", "quantum beats", "room temperature"],
      path: "/evidence/fmo-spectroscopy-300k",
    },
    {
      id: generateId(), type: "theory", title: "Non-Markovian Decoherence Protection in Protein Scaffolds",
      excerpt: "We propose that the structured noise environment created by protein scaffolds generates non-Markovian dynamics that actively protect quantum coherence, rather than destroying it...",
      projectName: "Quantum Biology Research", projectIcon: "🧬", author: "Dr. Elena Vasquez", authorAvatar: "🧬",
      matchCount: 10, relevanceScore: 0.90, createdAt: now - 86400000 * 7, updatedAt: now - 86400000,
      citations: 12, tags: ["decoherence", "non-Markovian", "protein"], highlights: ["non-Markovian", "decoherence protection", "protein scaffold"],
      path: "/theories/non-markovian-protection",
    },
    {
      id: generateId(), type: "document", title: "Neural Architecture Search for Scientific Data Analysis",
      excerpt: "We present ScienceNAS, a framework for automatically discovering neural network architectures optimized for scientific data analysis tasks including regression, classification, and anomaly detection...",
      projectName: "AI for Scientific Discovery", projectIcon: "🤖", author: "Prof. James Chen", authorAvatar: "🤖",
      matchCount: 15, relevanceScore: 0.87, createdAt: now - 86400000 * 45, updatedAt: now - 86400000 * 10,
      citations: 67, tags: ["NAS", "neural-networks", "scientific-data"], highlights: ["neural architecture search", "scientific data", "ScienceNAS"],
      path: "/documents/sciencenas-framework",
    },
    {
      id: generateId(), type: "discussion", title: "Best practices for training scientific foundation models",
      excerpt: "Discussion thread about strategies for pre-training large language models on scientific corpora. Key topics: data curation, tokenization of equations, handling of structured data...",
      projectName: "AI for Scientific Discovery", projectIcon: "🤖", author: "Prof. James Chen", authorAvatar: "🤖",
      matchCount: 7, relevanceScore: 0.82, createdAt: now - 86400000 * 5, updatedAt: now - 3600000,
      citations: 0, tags: ["foundation-models", "training", "LLM"], highlights: ["foundation models", "scientific corpora", "pre-training"],
      path: "/discussions/foundation-model-training",
    },
    {
      id: generateId(), type: "claim", title: "CRISPR-Cas13 achieves 99.7% RNA targeting specificity",
      excerpt: "Through systematic optimization of guide RNA design and delivery conditions, we demonstrate that our modified Cas13 system achieves 99.7% on-target specificity with minimal collateral cleavage...",
      projectName: "Gene Editing Toolkit", projectIcon: "🧪", author: "Dr. Sarah Kim", authorAvatar: "🧪",
      matchCount: 5, relevanceScore: 0.85, createdAt: now - 86400000 * 10, updatedAt: now - 86400000 * 4,
      citations: 18, tags: ["CRISPR", "Cas13", "RNA", "specificity"], highlights: ["CRISPR-Cas13", "99.7% specificity", "guide RNA"],
      path: "/claims/crispr-cas13-specificity",
    },
    {
      id: generateId(), type: "segment", title: "Methods: Kinetic Isotope Effect Measurements",
      excerpt: "Kinetic isotope effects were measured by comparing reaction rates with protiated and deuterated substrates under identical conditions. Temperature-dependent KIE measurements were performed from 5°C to 45°C...",
      projectName: "Quantum Biology Research", projectIcon: "🧬", author: "Dr. Marco Rossi", authorAvatar: "🔬",
      matchCount: 4, relevanceScore: 0.78, createdAt: now - 86400000 * 25, updatedAt: now - 86400000 * 8,
      citations: 8, tags: ["KIE", "methods", "isotope"], highlights: ["kinetic isotope effect", "deuterated substrates", "temperature-dependent"],
      path: "/segments/kie-methods",
    },
    {
      id: generateId(), type: "note", title: "Research Notes: Potential collaboration with Fleming Lab",
      excerpt: "Met with Prof. Fleming's group at the APS March Meeting. They have new ultrafast spectroscopy data on the LHCII complex that could complement our FMO work. Follow up scheduled for next week...",
      projectName: "Quantum Biology Research", projectIcon: "🧬", author: "Dr. Elena Vasquez", authorAvatar: "🧬",
      matchCount: 3, relevanceScore: 0.72, createdAt: now - 86400000 * 12, updatedAt: now - 86400000 * 12,
      citations: 0, tags: ["collaboration", "spectroscopy", "LHCII"], highlights: ["Fleming Lab", "LHCII complex", "ultrafast spectroscopy"],
      path: "/notes/fleming-collaboration",
    },
    {
      id: generateId(), type: "evidence", title: "Computational Model: Lindblad Master Equation for FMO",
      excerpt: "Numerical simulation of the FMO complex dynamics using a modified Lindblad master equation with structured spectral density. Results show coherence lifetimes of ~300fs at 300K...",
      projectName: "Quantum Biology Research", projectIcon: "🧬", author: "Dr. Elena Vasquez", authorAvatar: "🧬",
      matchCount: 9, relevanceScore: 0.86, createdAt: now - 86400000 * 18, updatedAt: now - 86400000 * 6,
      citations: 15, tags: ["simulation", "Lindblad", "FMO", "computational"], highlights: ["Lindblad master equation", "spectral density", "coherence lifetimes"],
      path: "/evidence/lindblad-fmo-simulation",
    },
  ];
}

interface StoredData {
  recentSearches: RecentSearch[];
  savedSearches: SavedSearch[];
}

function loadData(): StoredData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {
    recentSearches: [
      { id: generateId(), query: "quantum coherence photosynthesis", timestamp: Date.now() - 3600000, resultCount: 8 },
      { id: generateId(), query: "CRISPR specificity", timestamp: Date.now() - 86400000, resultCount: 5 },
      { id: generateId(), query: "neural architecture search", timestamp: Date.now() - 86400000 * 3, resultCount: 12 },
    ],
    savedSearches: [
      { id: generateId(), name: "My Quantum Biology Papers", query: "quantum biology coherence", filters: { scope: "all", dateRange: "any", author: "", project: "", sortBy: "relevance" }, createdAt: Date.now() - 86400000 * 10 },
    ],
  };
}

function saveData(data: StoredData) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

// ─── Component ───────────────────────────────────────────────
export default function CrossProjectSearchPage() {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const accent = "hsl(var(--primary))";
  const textColor = "hsl(var(--foreground))";

  const allResults = useMemo(() => createSampleResults(), []);
  const [data, setData] = useState<StoredData>(loadData);
  const [query, setQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [filters, setFilters] = useState<SearchFilter>({
    scope: "all", dateRange: "any", author: "", project: "", sortBy: "relevance",
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState("");

  useEffect(() => { saveData(data); }, [data]);

  // ─── Search Logic ──────────────────────────────────────
  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    let results = allResults.filter((r) => {
      const textMatch = r.title.toLowerCase().includes(q) || r.excerpt.toLowerCase().includes(q) ||
        r.tags.some((tag) => tag.toLowerCase().includes(q)) || r.highlights.some((h) => h.toLowerCase().includes(q));
      if (!textMatch) return false;

      if (filters.scope !== "all") {
        const scopeMap: Record<SearchScope, SearchResultType[]> = {
          all: [], documents: ["document"], claims: ["claim"], evidence: ["evidence"],
          theories: ["theory"], discussions: ["discussion"],
        };
        if (!scopeMap[filters.scope].includes(r.type)) return false;
      }
      if (filters.author && !r.author.toLowerCase().includes(filters.author.toLowerCase())) return false;
      if (filters.project && !r.projectName.toLowerCase().includes(filters.project.toLowerCase())) return false;
      if (filters.dateRange !== "any") {
        const now = Date.now();
        const ranges: Record<string, number> = { today: 86400000, week: 604800000, month: 2592000000, year: 31536000000 };
        if (now - r.updatedAt > (ranges[filters.dateRange] || Infinity)) return false;
      }
      return true;
    });

    switch (filters.sortBy) {
      case "relevance": results.sort((a, b) => b.relevanceScore - a.relevanceScore); break;
      case "newest": results.sort((a, b) => b.updatedAt - a.updatedAt); break;
      case "oldest": results.sort((a, b) => a.updatedAt - b.updatedAt); break;
      case "most-cited": results.sort((a, b) => b.citations - a.citations); break;
    }
    return results;
  }, [query, allResults, filters]);

  // ─── Handlers ──────────────────────────────────────────
  const handleSearch = useCallback(() => {
    if (!query.trim()) return;
    setHasSearched(true);
    setData((prev) => ({
      ...prev,
      recentSearches: [
        { id: generateId(), query: query.trim(), timestamp: Date.now(), resultCount: searchResults.length },
        ...prev.recentSearches.filter((s) => s.query !== query.trim()).slice(0, 9),
      ],
    }));
  }, [query, searchResults.length]);

  const handleSaveSearch = useCallback(() => {
    if (!saveName.trim() || !query.trim()) return;
    setData((prev) => ({
      ...prev,
      savedSearches: [
        ...prev.savedSearches,
        { id: generateId(), name: saveName.trim(), query: query.trim(), filters, createdAt: Date.now() },
      ],
    }));
    setSaveName(""); setShowSaveModal(false);
  }, [saveName, query, filters]);

  const handleLoadSearch = useCallback((saved: SavedSearch) => {
    setQuery(saved.query);
    setFilters(saved.filters);
    setHasSearched(true);
  }, []);

  const handleDeleteSavedSearch = useCallback((id: string) => {
    setData((prev) => ({ ...prev, savedSearches: prev.savedSearches.filter((s) => s.id !== id) }));
  }, []);

  const handleClearRecent = useCallback(() => {
    setData((prev) => ({ ...prev, recentSearches: [] }));
  }, []);

  const formatDate = (ts: number): string => {
    const diff = Date.now() - ts;
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "today";
    if (days === 1) return "yesterday";
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return new Date(ts).toLocaleDateString();
  };

  // ─── Facets ────────────────────────────────────────────
  const facets = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    const projectCounts: Record<string, number> = {};
    const authorCounts: Record<string, number> = {};
    searchResults.forEach((r) => {
      typeCounts[r.type] = (typeCounts[r.type] || 0) + 1;
      projectCounts[r.projectName] = (projectCounts[r.projectName] || 0) + 1;
      authorCounts[r.author] = (authorCounts[r.author] || 0) + 1;
    });
    return { typeCounts, projectCounts, authorCounts };
  }, [searchResults]);

  // ─── Styles ────────────────────────────────────────────
  const cardStyle: React.CSSProperties = {
    background: "hsl(var(--card))", border: "1px solid hsl(var(--border))",
    borderRadius: "10px", padding: "16px", transition: "all 0.2s",
  };

  const btnStyle = (primary = false): React.CSSProperties => ({
    padding: "8px 16px", borderRadius: "10px", border: primary ? "none" : "1px solid hsl(var(--border))",
    background: primary ? "hsl(var(--primary))" : "hsl(var(--muted))", color: primary ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
    cursor: "pointer", fontSize: "13px", fontWeight: 600,
  });

  const pillStyle = (active: boolean): React.CSSProperties => ({
    padding: "5px 12px", borderRadius: "20px",
    border: `1px solid ${active ? "hsl(var(--primary))" : "hsl(var(--border))"}`,
    background: active ? "hsl(var(--primary) / 0.12)" : "transparent",
    color: active ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
    cursor: "pointer", fontSize: "12px", fontWeight: 500,
  });

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: "10px",
    border: "1px solid hsl(var(--border))", background: "hsl(var(--muted) / 0.3)",
    color: "hsl(var(--foreground))", fontSize: "14px", outline: "none", boxSizing: "border-box",
  };

  // ─── Render ────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "hsl(var(--background))", color: textColor, padding: isMobile ? "16px 12px" : "32px 24px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 700, margin: 0 }}>🔍 {t("crossSearch.title")}</h1>
          <p className="text-muted-foreground mt-2 text-sm">{t("crossSearch.subtitle")}</p>
        </div>

        {/* Search Bar */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: isMobile ? "wrap" : "nowrap" }}>
          <div style={{ flex: 1, position: "relative", minWidth: 0 }}>
            <input
              type="text" value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
              placeholder={t("crossSearch.placeholder")}
              style={{ ...inputStyle, padding: "14px 20px", fontSize: "15px" }}
            />
          </div>
          <button onClick={handleSearch} style={{ ...btnStyle(true), padding: isMobile ? "10px 16px" : "14px 24px" }}>
            🔍 {!isMobile && t("crossSearch.search")}
          </button>
          <button onClick={() => setShowAdvanced(!showAdvanced)} style={btnStyle()}>
            ⚙️ {!isMobile && t("crossSearch.advanced")}
          </button>
          {query.trim() && hasSearched && (
            <button onClick={() => setShowSaveModal(true)} style={btnStyle()}>
              💾 {!isMobile && t("crossSearch.save")}
            </button>
          )}
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div style={{ ...cardStyle, marginBottom: "16px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>⚙️ {t("crossSearch.advancedFilters")}</h3>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t("crossSearch.scope")}</label>
                <select value={filters.scope} onChange={(e) => setFilters((f) => ({ ...f, scope: e.target.value as SearchScope }))} style={{ ...inputStyle, padding: "8px 10px" }}>
                  <option value="all">{t("common.all")}</option>
                  <option value="documents">{t("crossSearch.documents")}</option>
                  <option value="claims">{t("crossSearch.claims")}</option>
                  <option value="evidence">{t("crossSearch.evidence")}</option>
                  <option value="theories">{t("crossSearch.theories")}</option>
                  <option value="discussions">{t("crossSearch.discussions")}</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t("crossSearch.dateRange")}</label>
                <select value={filters.dateRange} onChange={(e) => setFilters((f) => ({ ...f, dateRange: e.target.value as SearchFilter["dateRange"] }))} style={{ ...inputStyle, padding: "8px 10px" }}>
                  <option value="any">{t("crossSearch.anyTime")}</option>
                  <option value="today">{t("crossSearch.today")}</option>
                  <option value="week">{t("crossSearch.thisWeek")}</option>
                  <option value="month">{t("crossSearch.thisMonth")}</option>
                  <option value="year">{t("crossSearch.thisYear")}</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t("crossSearch.sortBy")}</label>
                <select value={filters.sortBy} onChange={(e) => setFilters((f) => ({ ...f, sortBy: e.target.value as SortMode }))} style={{ ...inputStyle, padding: "8px 10px" }}>
                  <option value="relevance">{t("crossSearch.sortRelevance")}</option>
                  <option value="newest">{t("crossSearch.sortNewest")}</option>
                  <option value="oldest">{t("crossSearch.sortOldest")}</option>
                  <option value="most-cited">{t("crossSearch.sortCited")}</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t("crossSearch.author")}</label>
                <input value={filters.author} onChange={(e) => setFilters((f) => ({ ...f, author: e.target.value }))} placeholder={t("crossSearch.filterByAuthor")} style={{ ...inputStyle, padding: "8px 10px" }} />
              </div>
            </div>
          </div>
        )}

        {/* Scope Pills */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "20px", flexWrap: "wrap" }}>
          {(["all", "documents", "claims", "evidence", "theories", "discussions"] as SearchScope[]).map((scope) => (
            <button key={scope} onClick={() => setFilters((f) => ({ ...f, scope }))} style={pillStyle(filters.scope === scope)}>
              {scope === "all" ? t("common.all") : t(`crossSearch.${scope}`)}
              {hasSearched && facets.typeCounts[scope === "documents" ? "document" : scope === "claims" ? "claim" : scope === "theories" ? "theory" : scope === "discussions" ? "discussion" : ""] ? (
                <span style={{ marginLeft: "4px", opacity: 0.6 }}>({facets.typeCounts[scope === "documents" ? "document" : scope === "claims" ? "claim" : scope === "theories" ? "theory" : scope === "discussions" ? "discussion" : ""] || 0})</span>
              ) : null}
            </button>
          ))}
        </div>

        {/* No Search Yet — Show Recent & Saved */}
        {!hasSearched && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "20px" }}>
            {/* Recent Searches */}
            <div style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: 600, margin: 0 }}>🕐 {t("crossSearch.recentSearches")}</h3>
                {data.recentSearches.length > 0 && (
                  <button onClick={handleClearRecent} className="text-xs text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer">
                    {t("crossSearch.clearAll")}
                  </button>
                )}
              </div>
              {data.recentSearches.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t("crossSearch.noRecent")}</p>
              ) : (
                data.recentSearches.map((search) => (
                  <div key={search.id} onClick={() => { setQuery(search.query); setHasSearched(true); }}
                    className="py-2 border-b border-border/30 cursor-pointer flex justify-between items-center"
                  >
                    <div>
                      <span className="text-sm">🔍 {search.query}</span>
                      <span className="text-xs text-muted-foreground ml-2">{search.resultCount} results</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(search.timestamp)}</span>
                  </div>
                ))
              )}
            </div>

            {/* Saved Searches */}
            <div style={cardStyle}>
              <h3 style={{ fontSize: "15px", fontWeight: 600, margin: "0 0 12px" }}>💾 {t("crossSearch.savedSearches")}</h3>
              {data.savedSearches.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t("crossSearch.noSaved")}</p>
              ) : (
                data.savedSearches.map((saved) => (
                  <div key={saved.id} className="py-2 border-b border-border/30 flex justify-between items-center">
                    <div onClick={() => handleLoadSearch(saved)} className="cursor-pointer flex-1">
                      <div className="text-sm font-semibold">{saved.name}</div>
                      <div className="text-xs text-muted-foreground">"{saved.query}" · {formatDate(saved.createdAt)}</div>
                    </div>
                    <button onClick={() => handleDeleteSavedSearch(saved.id)} className="bg-transparent border-none text-destructive cursor-pointer text-xs">✕</button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Search Results */}
        {hasSearched && (
          <div>
            {/* Results Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span className="text-sm text-muted-foreground">
                {searchResults.length} {t("crossSearch.resultsFor")} "<strong className="text-foreground">{query}</strong>"
              </span>
            </div>

            {/* Results List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {searchResults.map((result) => {
                const typeConf = TYPE_CONFIG[result.type];
                return (
                  <div key={result.id} style={{ ...cardStyle, cursor: "pointer" }}>
                    <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: `${typeConf.color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>
                        {typeConf.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 600, fontSize: "15px", color: accent }}>{result.title}</span>
                          <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "8px", background: `${typeConf.color}22`, color: typeConf.color, border: `1px solid ${typeConf.color}44` }}>
                            {typeConf.label}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-sm mb-2 line-clamp-2">
                          {result.excerpt}
                        </p>
                        <div className="flex gap-3 items-center flex-wrap text-xs text-muted-foreground">
                          <span>{result.projectIcon} {result.projectName}</span>
                          <span>{result.authorAvatar} {result.author}</span>
                          <span>📊 {result.matchCount} matches</span>
                          {result.citations > 0 && <span>📖 {result.citations} citations</span>}
                          <span>{formatDate(result.updatedAt)}</span>
                        </div>
                        {result.highlights.length > 0 && (
                          <div style={{ display: "flex", gap: "4px", marginTop: "6px", flexWrap: "wrap" }}>
                            {result.highlights.map((h) => (
                              <span key={h} style={{ fontSize: "10px", color: "#f59e0b", background: "#f59e0b15", padding: "1px 6px", borderRadius: "6px" }}>
                                {h}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: "18px", fontWeight: 700, color: accent }}>{Math.round(result.relevanceScore * 100)}%</div>
                        <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>{t("crossSearch.relevance")}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {searchResults.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <div className="text-5xl mb-4">🔍</div>
                <p className="font-semibold">{t("crossSearch.noResults")}</p>
                <p className="text-sm">{t("crossSearch.noResultsHint")}</p>
              </div>
            )}
          </div>
        )}

        {/* Save Search Modal */}
        {showSaveModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-5"
            onClick={(e) => { if (e.target === e.currentTarget) setShowSaveModal(false); }}
          >
            <div className="bg-popover border border-border rounded-2xl p-7 max-w-[400px] w-full shadow-xl">
              <h3 className="text-base font-bold mb-4">💾 {t("crossSearch.saveSearch")}</h3>
              <input value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder={t("crossSearch.searchName")} style={{ ...inputStyle, marginBottom: "12px" }} />
              <p className="text-xs text-muted-foreground mb-4">
                {t("crossSearch.query")}: "{query}"
              </p>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button onClick={() => setShowSaveModal(false)} style={btnStyle()}>{t("common.cancel") || "Cancel"}</button>
                <button onClick={handleSaveSearch} disabled={!saveName.trim()} style={{ ...btnStyle(true), opacity: saveName.trim() ? 1 : 0.5 }}>
                  💾 {t("crossSearch.save")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
