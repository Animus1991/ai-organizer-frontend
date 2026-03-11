// src/components/home/HomeSegmentViewer.tsx
// Extracted segment viewer (cards + table views) from Home.tsx
import React, { useState, useCallback } from "react";
import { ErrorBoundary } from "../ErrorBoundary";
import { SegmentViewModes } from "../SegmentViewModes";
import { preview120 } from "../../lib/documentWorkspace/utils";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import { SectionHeader } from "../ui/SectionHeader";

const REACTIONS_CONFIG = [
  { emoji: "👍", label: "Insightful" },
  { emoji: "🔥", label: "Key Finding" },
  { emoji: "❓", label: "Needs Clarification" },
  { emoji: "⭐", label: "Bookmark" },
] as const;
type ReactionEmoji = typeof REACTIONS_CONFIG[number]["emoji"];

function loadSegmentReactions(): Record<number, ReactionEmoji[]> {
  try { return JSON.parse(localStorage.getItem("segment-reactions") || "{}"); } catch { return {}; }
}
function saveSegmentReactions(r: Record<number, ReactionEmoji[]>) {
  try { localStorage.setItem("segment-reactions", JSON.stringify(r)); } catch {}
}
function loadSegmentComments(): Record<number, { id: string; text: string; ts: number }[]> {
  try { return JSON.parse(localStorage.getItem("segment-comments") || "{}"); } catch { return {}; }
}
function saveSegmentComments(c: Record<number, { id: string; text: string; ts: number }[]>) {
  try { localStorage.setItem("segment-comments", JSON.stringify(c)); } catch {}
}

export interface SegmentItem {
  id: number;
  title: string;
  content: string;
  mode: string;
  orderIndex: number;
  [key: string]: unknown;
}

export interface HomeSegmentViewerProps {
  segments: SegmentItem[];
  filteredSegments: SegmentItem[];
  query: string;
  setQuery: (q: string) => void;
  modeFilter: string;
  setModeFilter: (f: any) => void;
  segmentViewMode: "cards" | "table";
  onViewModeChange: (mode: "cards" | "table") => void;
  openSeg: SegmentItem | null;
  onPickSegment: (seg: SegmentItem) => void;
  enableBenchmarkUi?: boolean;
  benchmarkChecked?: boolean;
  benchmarkAllowed?: boolean;
}

const MODE_STYLE_MAP: Record<string, { background: string; color: string; border: string }> = {
  qa: { background: "rgba(59, 130, 246, 0.2)", color: "#93c5fd", border: "1px solid rgba(59, 130, 246, 0.3)" },
  paragraphs: { background: "rgba(16, 185, 129, 0.2)", color: "#6ee7b7", border: "1px solid rgba(16, 185, 129, 0.3)" },
  keywords: { background: "rgba(168, 85, 247, 0.2)", color: "#c4b5fd", border: "1px solid rgba(168, 85, 247, 0.3)" },
  sections: { background: "rgba(249, 115, 22, 0.2)", color: "#fdba74", border: "1px solid rgba(249, 115, 22, 0.3)" },
  semantic: { background: "rgba(236, 72, 153, 0.2)", color: "#fbcfe8", border: "1px solid rgba(236, 72, 153, 0.3)" },
  topics: { background: "rgba(34, 197, 94, 0.2)", color: "#86efac", border: "1px solid rgba(34, 197, 94, 0.3)" },
  questions: { background: "rgba(59, 130, 246, 0.2)", color: "#93c5fd", border: "1px solid rgba(59, 130, 246, 0.3)" },
  arguments: { background: "rgba(239, 68, 68, 0.2)", color: "#fca5a5", border: "1px solid rgba(239, 68, 68, 0.3)" },
  concepts: { background: "rgba(16, 185, 129, 0.2)", color: "#6ee7b7", border: "1px solid rgba(16, 185, 129, 0.3)" },
  hybrid: { background: "rgba(124, 58, 237, 0.2)", color: "#c4b5fd", border: "1px solid rgba(124, 58, 237, 0.3)" },
  temporal: { background: "rgba(245, 158, 11, 0.2)", color: "#fde68a", border: "1px solid rgba(245, 158, 11, 0.3)" },
  sentiment: { background: "rgba(236, 72, 153, 0.2)", color: "#f9a8d4", border: "1px solid rgba(236, 72, 153, 0.3)" },
  dialogue: { background: "rgba(6, 182, 212, 0.2)", color: "#67e8f9", border: "1px solid rgba(6, 182, 212, 0.3)" },
  texttiling: { background: "rgba(244, 63, 94, 0.2)", color: "#fda4af", border: "1px solid rgba(244, 63, 94, 0.3)" },
  c99: { background: "rgba(79, 70, 229, 0.2)", color: "#c7d2fe", border: "1px solid rgba(79, 70, 229, 0.3)" },
  changepoint: { background: "rgba(14, 165, 233, 0.2)", color: "#7dd3fc", border: "1px solid rgba(14, 165, 233, 0.3)" },
  graph: { background: "rgba(34, 197, 94, 0.2)", color: "#86efac", border: "1px solid rgba(34, 197, 94, 0.3)" },
  layout: { background: "rgba(245, 158, 11, 0.2)", color: "#fde68a", border: "1px solid rgba(245, 158, 11, 0.3)" },
};
const DEFAULT_MODE_STYLE = { background: "rgba(100, 116, 139, 0.2)", color: "#cbd5e1", border: "1px solid rgba(100, 116, 139, 0.3)" };

const MODE_LABEL_MAP: Record<string, string> = {
  qa: "Q&A", paragraphs: "Paragraph", keywords: "Keywords", sections: "Sections",
  semantic: "Semantic", topics: "Topics", concepts: "Concepts", hybrid: "Hybrid",
  temporal: "Temporal", sentiment: "Sentiment", dialogue: "Dialogue",
  texttiling: "TextTiling", c99: "C99", changepoint: "Change-Point",
  graph: "Graph", layout: "Layout",
};

export const HomeSegmentViewer: React.FC<HomeSegmentViewerProps> = ({
  segments,
  filteredSegments,
  query,
  setQuery,
  modeFilter,
  setModeFilter,
  segmentViewMode,
  onViewModeChange,
  openSeg,
  onPickSegment,
  enableBenchmarkUi,
  benchmarkChecked,
  benchmarkAllowed,
}) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();

  const [reactions, setReactions] = useState<Record<number, ReactionEmoji[]>>(() => loadSegmentReactions());
  const [comments, setComments] = useState<Record<number, { id: string; text: string; ts: number }[]>>(() => loadSegmentComments());
  const [openCommentSegId, setOpenCommentSegId] = useState<number | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [bookmarkFilter, setBookmarkFilter] = useState(false);

  const toggleReaction = useCallback((segId: number, emoji: ReactionEmoji, e: React.MouseEvent) => {
    e.stopPropagation();
    setReactions(prev => {
      const cur = prev[segId] || [];
      const next = cur.includes(emoji) ? cur.filter(r => r !== emoji) : [...cur, emoji];
      const updated = { ...prev, [segId]: next };
      saveSegmentReactions(updated);
      return updated;
    });
  }, []);

  const addComment = useCallback((segId: number) => {
    if (!commentDraft.trim()) return;
    setComments(prev => {
      const cur = prev[segId] || [];
      const updated = { ...prev, [segId]: [...cur, { id: `c-${Date.now()}`, text: commentDraft.trim(), ts: Date.now() }] };
      saveSegmentComments(updated);
      return updated;
    });
    setCommentDraft("");
  }, [commentDraft]);

  const bookmarkedIds = new Set(
    Object.entries(reactions)
      .filter(([, emojis]) => emojis.includes("⭐"))
      .map(([id]) => Number(id))
  );

  const displayedSegments = bookmarkFilter
    ? filteredSegments.filter(s => bookmarkedIds.has(s.id))
    : filteredSegments;

  // Empty state when no segments
  if (segments.length === 0) {
    return (
      <div
        data-testid="segments"
        data-tour="segments"
        style={{
          marginTop: "32px",
          borderRadius: "var(--radius)",
          border: "1px dashed hsl(var(--border))",
          padding: "48px 24px",
          textAlign: "center",
          background: `hsl(var(--muted) / ${isDark ? 0.3 : 0.5})`,
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.5 }}>📄</div>
        <h3 style={{ fontSize: "18px", fontWeight: 600, color: "hsl(var(--foreground))", marginBottom: "8px" }}>
          {t("segments.empty.title") || "No segments yet"}
        </h3>
        <p style={{ fontSize: "14px", color: "hsl(var(--muted-foreground))", maxWidth: "400px", margin: "0 auto" }}>
          {t("segments.empty.description") || "Select a document and click 'Segment' to create segments. Segments will appear here."}
        </p>
      </div>
    );
  }

  return (
    <div
      data-testid="segments"
      data-tour="segments"
      style={{
        marginTop: "32px",
        borderRadius: "var(--radius)",
        border: "1px solid hsl(var(--border))",
        overflow: "hidden",
        boxShadow: isDark
          ? "0 8px 32px hsl(var(--background) / 0.4)"
          : "0 8px 32px hsl(var(--foreground) / 0.06)",
        background: "hsl(var(--card))",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Header with view toggle, count, search, filter */}
      <div
        style={{
          padding: "24px",
          borderBottom: "1px solid hsl(var(--border))",
          background: `hsl(var(--muted) / ${isDark ? 0.3 : 0.5})`,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap", marginBottom: "20px" }}>
          {/* Bookmark filter toggle */}
          <button
            onClick={() => setBookmarkFilter(f => !f)}
            title={bookmarkFilter ? "Show all segments" : "Show bookmarked only"}
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              border: bookmarkFilter ? "1px solid hsl(var(--warning) / 0.5)" : "1px solid hsl(var(--border))",
              background: bookmarkFilter ? "hsl(var(--warning) / 0.15)" : "transparent",
              color: bookmarkFilter ? "hsl(var(--warning))" : "hsl(var(--muted-foreground))",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              transition: "all 0.2s ease",
              marginLeft: "auto",
            }}
          >
            ⭐ {bookmarkFilter ? `${bookmarkedIds.size} Bookmarked` : "My Bookmarks"}
          </button>
          <SectionHeader
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "16px", height: "16px", color: "#a78bfa" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            }
            iconGradient="linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)"
            title={t("segments.title") || "Segments"}
            size="sm"
            style={{ margin: 0, flex: 1 }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* View Mode Toggle */}
            <div style={{
              display: "flex",
              gap: "2px",
              background: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0,0,0,0.04)",
              padding: "3px",
              borderRadius: "10px",
              border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0,0,0,0.07)"}`,
            }}>
              <button
                onClick={() => onViewModeChange("table")}
                style={{
                  padding: "6px 12px",
                  background: segmentViewMode === "table" ? "linear-gradient(135deg, rgba(99, 102, 241, 0.4) 0%, rgba(139, 92, 246, 0.35) 100%)" : "transparent",
                  border: "none",
                  borderRadius: "7px",
                  color: segmentViewMode === "table" ? (isDark ? "#fff" : "#4338ca") : (isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(47,41,65,0.55)"),
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: 500,
                  transition: "all 0.2s ease",
                }}
                title={t("home.segView.table")}
              >
                ☰ {t("home.segView.table")}
              </button>
              <button
                onClick={() => onViewModeChange("cards")}
                style={{
                  padding: "6px 12px",
                  background: segmentViewMode === "cards" ? "linear-gradient(135deg, rgba(99, 102, 241, 0.4) 0%, rgba(139, 92, 246, 0.35) 100%)" : "transparent",
                  border: "none",
                  borderRadius: "7px",
                  color: segmentViewMode === "cards" ? (isDark ? "#fff" : "#4338ca") : (isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(47,41,65,0.55)"),
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: 500,
                  transition: "all 0.2s ease",
                }}
                title={t("home.segView.cards")}
              >
                ▦ {t("home.segView.cards")}
              </button>
            </div>
            <span
              style={{
                fontSize: "var(--font-size-sm)",
                lineHeight: "var(--line-height-normal)",
                fontWeight: 600,
                padding: "6px 14px",
                borderRadius: "20px",
                background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)",
                color: isDark ? "#c7d2fe" : "#6366f1",
                border: "1px solid rgba(99, 102, 241, 0.3)",
              }}
              role="status"
              aria-live="polite"
            >
              {segments.length ? `${filteredSegments.length}/${segments.length} segments` : "No segments"}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
          <div style={{ flex: "1 1 300px", minWidth: "300px", maxWidth: "calc(100% - 320px)", position: "relative", overflow: "hidden" }}>
            <svg
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "18px",
                height: "18px",
                color: isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(47,41,65,0.45)",
                pointerEvents: "none",
                flexShrink: 0,
                zIndex: 10,
              }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={(el) => {
                if (el) {
                  el.style.setProperty("padding-left", "48px", "important");
                  el.style.setProperty("padding-right", "16px", "important");
                  el.style.setProperty("padding-top", "12px", "important");
                  el.style.setProperty("padding-bottom", "12px", "important");
                }
              }}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search segments..."
              style={{
                width: "100%",
                borderRadius: "12px",
              border: "1px solid hsl(var(--border))",
              background: isDark ? "hsl(var(--muted) / 0.5)" : "hsl(var(--card))",
              color: "hsl(var(--foreground))",
                fontSize: "var(--font-size-sm)",
                lineHeight: "var(--line-height-normal)",
                transition: "all 0.2s ease",
                position: "relative",
                zIndex: 1,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.5)";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "hsl(var(--border))";
                e.currentTarget.style.boxShadow = "none";
              }}
              aria-label={t("segments.search") || "Search segments"}
            />
          </div>

          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            style={{
              padding: "12px 16px",
              borderRadius: "12px",
              border: "1px solid hsl(var(--border))",
              background: isDark ? "hsl(var(--muted) / 0.5)" : "hsl(var(--card))",
              color: "hsl(var(--foreground))",
              fontSize: "var(--font-size-sm)",
              lineHeight: "var(--line-height-normal)",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.5)";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0,0,0,0.07)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <option value="all">All modes</option>
            <option value="qa">Q&A</option>
            <option value="paragraphs">Paragraphs</option>
            <option value="keywords">Keywords</option>
            <option value="sections">Sections</option>
            <option value="semantic">Semantic</option>
            <option value="topics">Topics</option>
            <option value="questions">Questions</option>
            <option value="arguments">Arguments</option>
            <option value="concepts">Concepts</option>
            <option value="hybrid">Hybrid</option>
            <option value="temporal">Temporal</option>
            <option value="sentiment">Sentiment</option>
            <option value="dialogue">Dialogue</option>
            <option value="texttiling">TextTiling</option>
            <option value="c99">C99</option>
            <option value="changepoint">Change-Point</option>
            <option value="graph">Graph</option>
            <option value="layout">Layout</option>
          </select>

          <button
            onClick={() => {
              setQuery("");
              setModeFilter("all");
            }}
            disabled={!query && modeFilter === "all"}
            style={{
              padding: "12px 18px",
              background: isDark ? "hsl(var(--muted) / 0.5)" : "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "12px",
              color: "hsl(var(--foreground))",
              fontWeight: 500,
              fontSize: "var(--font-size-sm)",
              lineHeight: "var(--line-height-normal)",
              cursor: !query && modeFilter === "all" ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.2s ease",
              opacity: !query && modeFilter === "all" ? 0.4 : 1,
            }}
            onMouseEnter={(e) => {
              if (query || modeFilter !== "all") {
                e.currentTarget.style.background = isDark ? "hsl(var(--accent))" : "hsl(var(--muted))";
                e.currentTarget.style.transform = "translateY(-1px)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isDark ? "hsl(var(--muted) / 0.5)" : "hsl(var(--card))";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <svg style={{ width: "14px", height: "14px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear
          </button>
        </div>
      </div>

      {/* Cards View using SegmentViewModes */}
      {segmentViewMode === "cards" && (
        <div style={{ padding: "16px" }}>
          <SegmentViewModes
            segments={filteredSegments}
            query={query}
            setQuery={setQuery}
            onPick={(seg) => onPickSegment(seg as any)}
            onExport={(seg) => {
              const filename = `${seg.title || `segment-${seg.id}`}.txt`;
              const content = `${seg.title}\n\n${seg.content || ""}\n`;
              const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = filename;
              document.body.appendChild(a);
              a.click();
              a.remove();
              setTimeout(() => URL.revokeObjectURL(url), 300);
            }}
            title=""
            showSearch={false}
            showBatchControls={true}
            defaultViewMode="tiles"
            storageKey="homeSegmentCardsViewMode"
          />
        </div>
      )}

      {/* Table View */}
      {segmentViewMode === "table" && (
        <ErrorBoundary
          key="segment-table"
          fallback={
            <div style={{ 
              padding: "48px 24px", 
              textAlign: "center",
              background: "hsl(var(--card))",
              borderRadius: "12px",
              margin: "12px",
              border: "1px solid hsl(var(--border))",
            }}>
              <div style={{ 
                width: "48px", 
                height: "48px", 
                background: "rgba(239, 68, 68, 0.2)", 
                borderRadius: "12px",
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                margin: "0 auto 16px" 
              }}>
                <svg style={{ width: "24px", height: "24px", color: "#ef4444" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, color: "hsl(var(--foreground))", marginBottom: "8px" }}>
                Error loading segments
              </h3>
              <p style={{ fontSize: "14px", color: "hsl(var(--muted-foreground))", textAlign: "center", marginBottom: "16px" }}>
                An error occurred while loading the segments list. Please try refreshing the page.
              </p>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: "8px 16px",
                  background: "hsl(var(--muted))",
                  border: "1px solid hsl(var(--primary) / 0.3)",
                  borderRadius: "8px",
                  color: "hsl(var(--primary))",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Refresh Page
              </button>
            </div>
          }
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    textAlign: "left",
                    background: isDark ? "hsl(var(--muted) / 0.3)" : "hsl(var(--muted))",
                    borderBottom: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(0,0,0,0.07)",
                  }}
                >
                  <th style={{ padding: "16px 24px", width: "80px", fontWeight: 600, color: "hsl(var(--muted-foreground))", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    #
                  </th>
                  <th style={{ padding: "16px 24px", width: "140px", fontWeight: 600, color: "hsl(var(--muted-foreground))", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Type
                  </th>
                  <th style={{ padding: "16px 24px", width: "380px", fontWeight: 600, color: "hsl(var(--muted-foreground))", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Title
                  </th>
                  <th style={{ padding: "16px 24px", fontWeight: 600, color: "hsl(var(--muted-foreground))", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Preview
                  </th>
                  <th style={{ padding: "16px 24px", fontWeight: 600, color: "hsl(var(--muted-foreground))", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
                    Reactions
                  </th>
                </tr>
              </thead>
              <tbody>
                {!segments.length ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "48px 24px", textAlign: "center", opacity: 0.6 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
                        <div
                          style={{
                            width: "64px",
                            height: "64px",
                            background: "rgba(255, 255, 255, 0.05)",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                          }}
                        >
                          <svg style={{ width: "32px", height: "32px", color: isDark ? "rgba(255, 255, 255, 0.4)" : "rgba(47,41,65,0.3)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p style={{ color: isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(47,41,65,0.75)", fontWeight: 600, fontSize: "16px", margin: 0, marginBottom: "8px" }}>
                            No segments loaded yet
                          </p>
                          <p style={{ fontSize: "13px", opacity: 0.7, margin: 0, color: isDark ? "rgba(255, 255, 255, 0.5)" : "rgba(47,41,65,0.55)" }}>
                            Click <span style={{ color: "#6366f1", fontWeight: 600 }}>List Segments</span> to get started
                          </p>
                        </div>
                        {import.meta.env.VITE_ENABLE_BENCHMARK_UI === "false" && (
                          <div
                            style={{
                              marginTop: "16px",
                              width: "min(860px, 92%)",
                              background: "rgba(255, 255, 255, 0.04)",
                              border: "1px solid rgba(255, 255, 255, 0.08)",
                              borderRadius: "12px",
                              padding: "14px",
                              textAlign: "left",
                              fontSize: "13px",
                              color: isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(47,41,65,0.75)",
                            }}
                          >
                            Benchmark UI is disabled. Set
                            <span style={{ color: "#93c5fd" }}> VITE_ENABLE_BENCHMARK_UI=true</span> and restart Vite.
                          </div>
                        )}
                        {enableBenchmarkUi && benchmarkChecked && !benchmarkAllowed && (
                          <div
                            style={{
                              marginTop: "16px",
                              width: "min(860px, 92%)",
                              background: "rgba(255, 255, 255, 0.04)",
                              border: "1px solid rgba(255, 255, 255, 0.08)",
                              borderRadius: "12px",
                              padding: "14px",
                              textAlign: "left",
                              fontSize: "13px",
                              color: isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(47,41,65,0.75)",
                            }}
                          >
                            Admin benchmark controls are hidden. Add your email to
                            <span style={{ color: "#93c5fd" }}> AIORG_ADMIN_EMAILS</span> (and optionally set
                            <span style={{ color: "#93c5fd" }}> AIORG_ADMIN_BOOTSTRAP_EMAIL</span> /
                            <span style={{ color: "#93c5fd" }}> AIORG_ADMIN_BOOTSTRAP_PASSWORD</span>), then restart
                            backend and log in with that email. Also ensure
                            <span style={{ color: "#93c5fd" }}> AIORG_BENCHMARK_ENABLED=true</span>.
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : !filteredSegments.length ? (
                  <tr>
                    <td colSpan={4} style={{ padding: "48px 24px", textAlign: "center", opacity: 0.6 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
                        <div
                          style={{
                            width: "64px",
                            height: "64px",
                            background: "rgba(255, 255, 255, 0.05)",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                          }}
                        >
                          <svg style={{ width: "32px", height: "32px", color: isDark ? "rgba(255, 255, 255, 0.4)" : "rgba(47,41,65,0.3)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        <div>
                          <p style={{ color: isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(47,41,65,0.75)", fontWeight: 600, fontSize: "16px", margin: 0, marginBottom: "8px" }}>
                            No results found
                          </p>
                          <p style={{ fontSize: "13px", opacity: 0.7, margin: 0, color: isDark ? "rgba(255, 255, 255, 0.5)" : "rgba(47,41,65,0.55)" }}>Try adjusting your search or filter</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedSegments.map((s) => {
                    const isActive = openSeg?.id === s.id;
                    const modeStyle = MODE_STYLE_MAP[s.mode] || DEFAULT_MODE_STYLE;
                    const modeLabel = MODE_LABEL_MAP[s.mode] || s.mode;
                    const segReactions = reactions[s.id] || [];
                    const segComments = comments[s.id] || [];
                    const isCommentOpen = openCommentSegId === s.id;
                    return (
                      <React.Fragment key={s.id}>
                      <tr
                        onClick={() => onPickSegment(s)}
                        style={{
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          borderBottom: isCommentOpen ? "none" : `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}`,
                          background: isActive ? "rgba(99, 102, 241, 0.1)" : "transparent",
                          borderLeft: isActive ? "4px solid #6366f1" : "4px solid transparent",
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) e.currentTarget.style.background = isActive ? "rgba(99, 102, 241, 0.1)" : "transparent";
                        }}
                      >
                        <td style={{ padding: "16px 24px", opacity: 0.9 }}>
                          <span style={{ fontSize: "var(--font-size-sm)", lineHeight: "var(--line-height-normal)", fontFamily: "monospace", background: "rgba(255, 255, 255, 0.05)", padding: "4px 10px", borderRadius: "6px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
                            #{s.orderIndex + 1}
                          </span>
                        </td>
                        <td style={{ padding: "16px 24px" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", padding: "6px 12px", borderRadius: "20px", fontSize: "var(--font-size-sm)", lineHeight: "var(--line-height-normal)", fontWeight: 600, ...modeStyle }}>
                            {modeLabel}
                          </span>
                        </td>
                        <td style={{ padding: "16px 24px" }}>
                          <div style={{ fontWeight: 600, color: "hsl(var(--foreground))", transition: "color 0.2s ease" }}>{s.title}</div>
                        </td>
                        <td style={{ padding: "16px 24px", opacity: 0.75, fontSize: "13px" }}>
                          <div style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {preview120(s.content)}
                          </div>
                        </td>
                        {/* Reactions + Comment column */}
                        <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }} onClick={e => e.stopPropagation()}>
                          <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                            {REACTIONS_CONFIG.map(({ emoji, label }) => (
                              <button
                                key={emoji}
                                onClick={e => toggleReaction(s.id, emoji as ReactionEmoji, e)}
                                title={label}
                                style={{
                                  padding: "4px 8px",
                                  borderRadius: "12px",
                                  border: segReactions.includes(emoji as ReactionEmoji) ? "1px solid rgba(99,102,241,0.5)" : `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
                                  background: segReactions.includes(emoji as ReactionEmoji) ? "rgba(99,102,241,0.2)" : "transparent",
                                  cursor: "pointer",
                                  fontSize: "13px",
                                  transition: "all 0.15s ease",
                                  lineHeight: 1,
                                }}
                              >
                                {emoji}
                              </button>
                            ))}
                            <button
                              onClick={e => { e.stopPropagation(); setOpenCommentSegId(isCommentOpen ? null : s.id); setCommentDraft(""); }}
                              title="Comment"
                              style={{
                                padding: "4px 10px",
                                borderRadius: "12px",
                                border: isCommentOpen ? "1px solid rgba(99,102,241,0.5)" : `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
                                background: isCommentOpen ? "rgba(99,102,241,0.2)" : "transparent",
                                cursor: "pointer",
                                fontSize: "12px",
                                color: isCommentOpen ? "#a5b4fc" : (isDark ? "rgba(255,255,255,0.6)" : "rgba(47,41,65,0.5)"),
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                transition: "all 0.15s ease",
                              }}
                            >
                              💬 {segComments.length > 0 ? segComments.length : ""}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Inline comment thread */}
                      {isCommentOpen && (
                        <tr style={{ borderBottom: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(0,0,0,0.05)" }}>
                          <td colSpan={5} style={{ padding: "0 24px 16px 24px", background: isDark ? "rgba(99,102,241,0.05)" : "rgba(99,102,241,0.03)" }} onClick={e => e.stopPropagation()}>
                            <div style={{ borderTop: "1px solid rgba(99,102,241,0.15)", paddingTop: "12px" }}>
                              {segComments.length > 0 && (
                                <div style={{ marginBottom: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                                  {segComments.map(c => (
                                    <div key={c.id} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                                      <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "#fff", fontWeight: 700, flexShrink: 0 }}>U</div>
                                      <div style={{ flex: 1, background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", borderRadius: "8px", padding: "8px 12px" }}>
                                        <div style={{ fontSize: "13px", color: "hsl(var(--foreground))" }}>{c.text}</div>
                                        <div style={{ fontSize: "11px", color: "hsl(var(--muted-foreground))", marginTop: "4px" }}>{new Date(c.ts).toLocaleString()}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div style={{ display: "flex", gap: "8px" }}>
                                <input
                                  value={commentDraft}
                                  onChange={e => setCommentDraft(e.target.value)}
                                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addComment(s.id); } }}
                                  placeholder={t("segments.addComment") || "Add a comment... (Enter to submit)"}
                                  style={{ flex: 1, padding: "8px 12px", borderRadius: "8px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))", fontSize: "13px" }}
                                />
                                <button
                                  onClick={() => addComment(s.id)}
                                  disabled={!commentDraft.trim()}
                                  style={{ padding: "8px 16px", borderRadius: "8px", background: commentDraft.trim() ? "hsl(var(--primary))" : "hsl(var(--muted))", border: "none", color: commentDraft.trim() ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))", cursor: commentDraft.trim() ? "pointer" : "not-allowed", fontSize: "13px", fontWeight: 600 }}
                                >
                                  {t("action.send") || "Send"}
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </ErrorBoundary>
      )}
    </div>
  );
};
