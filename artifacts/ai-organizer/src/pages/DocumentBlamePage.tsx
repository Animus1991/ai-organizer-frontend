/**
 * DocumentBlamePage — GitHub-style Blame View for documents
 * Shows who edited each section/segment and when, with visual attribution
 * Similar to `git blame` but for academic document segments
 */

import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useIsMobile } from "../hooks/useMediaQuery";

// ─── Types ───────────────────────────────────────────────────
interface BlameEntry {
  segmentIndex: number;
  title: string;
  content: string;
  author: string;
  authorAvatar: string;
  editedAt: Date;
  editSummary: string;
  wordCount: number;
  changeType: "created" | "modified" | "reviewed" | "merged";
}

interface BlameData {
  documentId: string;
  documentName: string;
  totalSegments: number;
  entries: BlameEntry[];
  lastUpdated: Date;
}

// ─── Sample Data Generator ───────────────────────────────────
const AUTHORS = [
  { name: "You", avatar: "👤" },
  { name: "Dr. Elena Vasquez", avatar: "🧬" },
  { name: "Marcus Chen", avatar: "🔬" },
  { name: "Sofia Andersson", avatar: "📊" },
  { name: "AI Assistant", avatar: "🤖" },
];

const CHANGE_TYPES: BlameEntry["changeType"][] = ["created", "modified", "reviewed", "merged"];

function generateBlameData(documentId: string): BlameData {
  const docName = (() => {
    try {
      const stored = localStorage.getItem("uploads");
      if (stored) {
        const uploads = JSON.parse(stored);
        const doc = uploads.find((u: { id?: string; documentId?: string }) =>
          (u.documentId || u.id) === documentId
        );
        if (doc) return doc.name || doc.filename || "Untitled Document";
      }
    } catch { /* ignore */ }
    return "Research Document";
  })();

  const now = new Date();
  const segmentCount = 8 + Math.floor(Math.random() * 12);
  const entries: BlameEntry[] = [];

  const sectionTitles = [
    "Abstract", "Introduction", "Literature Review", "Methodology",
    "Theoretical Framework", "Data Collection", "Analysis", "Results",
    "Discussion", "Implications", "Limitations", "Future Work",
    "Conclusion", "References", "Appendix A", "Appendix B",
    "Acknowledgments", "Supplementary Materials", "Ethics Statement", "Funding",
  ];

  for (let i = 0; i < segmentCount; i++) {
    const author = AUTHORS[Math.floor(Math.random() * AUTHORS.length)];
    const daysAgo = Math.floor(Math.random() * 90);
    const editDate = new Date(now.getTime() - daysAgo * 86400000);
    const changeType = CHANGE_TYPES[Math.floor(Math.random() * CHANGE_TYPES.length)];

    const summaries: Record<BlameEntry["changeType"], string[]> = {
      created: ["Initial draft", "Added new section", "Created from template", "Wrote first version"],
      modified: ["Updated findings", "Revised methodology", "Expanded analysis", "Fixed citations", "Improved clarity"],
      reviewed: ["Peer review feedback applied", "Addressed reviewer comments", "Post-review revision"],
      merged: ["Merged from branch 'alt-methodology'", "Incorporated co-author changes", "Merged review suggestions"],
    };

    const contentSamples = [
      "This section presents the core findings of our research, demonstrating significant correlations between the identified variables and the proposed theoretical framework.",
      "The methodology employed in this study follows a mixed-methods approach, combining quantitative analysis with qualitative interviews to triangulate findings.",
      "Building upon the foundational work of previous researchers, we propose a novel framework that addresses the identified gaps in current understanding.",
      "Our analysis reveals three primary themes that emerged from the data, each contributing to a more nuanced understanding of the phenomenon under study.",
      "The implications of these findings extend beyond the immediate scope of this research, suggesting potential applications in related fields.",
      "We acknowledge several limitations in our approach, including sample size constraints and the cross-sectional nature of the data collection.",
      "Future research should explore longitudinal designs to capture temporal dynamics that our current methodology could not fully address.",
      "The theoretical contributions of this work lie in the integration of previously disparate frameworks into a unified model of understanding.",
    ];

    entries.push({
      segmentIndex: i,
      title: sectionTitles[i % sectionTitles.length],
      content: contentSamples[i % contentSamples.length],
      author: author.name,
      authorAvatar: author.avatar,
      editedAt: editDate,
      editSummary: summaries[changeType][Math.floor(Math.random() * summaries[changeType].length)],
      wordCount: 50 + Math.floor(Math.random() * 400),
      changeType,
    });
  }

  // Sort by segment index
  entries.sort((a, b) => a.segmentIndex - b.segmentIndex);

  return {
    documentId,
    documentName: docName,
    totalSegments: segmentCount,
    entries,
    lastUpdated: now,
  };
}

// ─── Change Type Config ──────────────────────────────────────
const CHANGE_TYPE_CONFIG: Record<BlameEntry["changeType"], { label: string; color: string; icon: string }> = {
  created: { label: "Created", color: "#10b981", icon: "+" },
  modified: { label: "Modified", color: "#3b82f6", icon: "~" },
  reviewed: { label: "Reviewed", color: "#8b5cf6", icon: "✓" },
  merged: { label: "Merged", color: "#f59e0b", icon: "⇄" },
};

// ─── Component ───────────────────────────────────────────────
export default function DocumentBlamePage() {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const isDark = true;

  const colors = {
    bgPrimary: 'hsl(var(--background))',
    textPrimary: 'hsl(var(--foreground))',
    textSecondary: 'hsl(var(--muted-foreground))',
    borderPrimary: 'hsl(var(--border))',
  };

  const [blameData, setBlameData] = useState<BlameData | null>(null);
  const [filterAuthor, setFilterAuthor] = useState<string>("all");
  const [filterType, setFilterType] = useState<BlameEntry["changeType"] | "all">("all");
  const [expandedSegment, setExpandedSegment] = useState<number | null>(null);

  useEffect(() => {
    if (documentId) {
      setBlameData(generateBlameData(documentId));
    }
  }, [documentId]);

  const filteredEntries = useMemo(() => {
    if (!blameData) return [];
    return blameData.entries.filter((entry) => {
      if (filterAuthor !== "all" && entry.author !== filterAuthor) return false;
      if (filterType !== "all" && entry.changeType !== filterType) return false;
      return true;
    });
  }, [blameData, filterAuthor, filterType]);

  const uniqueAuthors = useMemo(() => {
    if (!blameData) return [];
    const authors = new Set(blameData.entries.map((e) => e.author));
    return Array.from(authors);
  }, [blameData]);

  const authorStats = useMemo(() => {
    if (!blameData) return {};
    const stats: Record<string, { segments: number; words: number }> = {};
    blameData.entries.forEach((entry) => {
      if (!stats[entry.author]) stats[entry.author] = { segments: 0, words: 0 };
      stats[entry.author].segments++;
      stats[entry.author].words += entry.wordCount;
    });
    return stats;
  }, [blameData]);

  if (!blameData) {
    return (
      <div style={{ minHeight: "100vh", background: colors.bgPrimary, color: colors.textPrimary, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p>{t("blame.loading") || "Loading blame data..."}</p>
      </div>
    );
  }

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  // Author color assignment for the gutter
  const authorColors: Record<string, string> = {};
  const palette = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#3b82f6", "#ec4899"];
  uniqueAuthors.forEach((author, i) => {
    authorColors[author] = palette[i % palette.length];
  });

  return (
    <div style={{ minHeight: "100vh", background: colors.bgPrimary, color: colors.textPrimary, padding: isMobile ? "12px" : "24px", paddingTop: "72px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", marginBottom: "24px", gap: isMobile ? "12px" : "0" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                onClick={() => navigate(-1)}
                style={{
                  background: 'hsl(var(--muted) / 0.4)',
                  border: `1px solid ${colors.borderPrimary}`,
                  borderRadius: "10px",
                  color: colors.textSecondary,
                  padding: "6px 10px",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                ← Back
              </button>
              <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 700 }}>
                📝 {t("blame.title") || "Blame View"}
              </h1>
            </div>
            <p style={{ margin: "6px 0 0", fontSize: "14px", color: colors.textSecondary }}>
              {blameData.documentName} — {t("blame.subtitle") || "Who wrote what and when"}
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => navigate(`/documents/${documentId}/history`)}
              style={{
                padding: "8px 14px",
                background: 'hsl(var(--muted) / 0.4)',
                border: `1px solid ${colors.borderPrimary}`,
                borderRadius: "10px",
                color: colors.textSecondary,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              📜 {t("blame.viewHistory") || "History"}
            </button>
            <button
              onClick={() => navigate(`/documents/${documentId}/diff`)}
              style={{
                padding: "8px 14px",
                background: 'hsl(var(--muted) / 0.4)',
                border: `1px solid ${colors.borderPrimary}`,
                borderRadius: "10px",
                color: colors.textSecondary,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              🔀 {t("blame.viewDiff") || "Compare"}
            </button>
          </div>
        </div>

        {/* Author Stats Bar */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
          {uniqueAuthors.map((author) => {
            const stats = authorStats[author];
            const isActive = filterAuthor === author;
            return (
              <button
                key={author}
                onClick={() => setFilterAuthor(filterAuthor === author ? "all" : author)}
                style={{
                  padding: "8px 14px",
                  background: isActive ? `${authorColors[author]}22` : 'hsl(var(--muted) / 0.15)',
                  border: isActive ? `1px solid ${authorColors[author]}66` : `1px solid ${colors.borderPrimary}`,
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  color: colors.textPrimary,
                  fontSize: "13px",
                }}
              >
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: authorColors[author] }} />
                <span style={{ fontWeight: isActive ? 600 : 400 }}>{author}</span>
                <span style={{ fontSize: "11px", color: colors.textSecondary }}>
                  {stats?.segments || 0} sections · {stats?.words || 0} words
                </span>
              </button>
            );
          })}
        </div>

        {/* Change Type Filter */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          <button
            onClick={() => setFilterType("all")}
            style={{
              padding: "4px 10px",
              borderRadius: "4px",
              fontSize: "12px",
              background: filterType === "all" ? "rgba(99,102,241,0.2)" : "transparent",
              border: filterType === "all" ? "1px solid rgba(99,102,241,0.4)" : `1px solid ${colors.borderPrimary}`,
              color: colors.textSecondary,
              cursor: "pointer",
            }}
          >
            All
          </button>
          {Object.entries(CHANGE_TYPE_CONFIG).map(([type, config]) => (
            <button
              key={type}
              onClick={() => setFilterType(filterType === type ? "all" : type as BlameEntry["changeType"])}
              style={{
                padding: "4px 10px",
                borderRadius: "4px",
                fontSize: "12px",
                background: filterType === type ? `${config.color}22` : "transparent",
                border: filterType === type ? `1px solid ${config.color}66` : `1px solid ${colors.borderPrimary}`,
                color: filterType === type ? config.color : colors.textSecondary,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span>{config.icon}</span> {config.label}
            </button>
          ))}
        </div>

        {/* Blame Entries */}
        <div style={{
          border: `1px solid ${colors.borderPrimary}`,
          borderRadius: "10px",
          overflow: "hidden",
        }}>
          {filteredEntries.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center", color: colors.textSecondary }}>
              <div style={{ fontSize: "32px", marginBottom: "12px" }}>📝</div>
              <div style={{ fontSize: "14px" }}>{t("blame.noEntries") || "No blame entries match your filters"}</div>
            </div>
          ) : (
            filteredEntries.map((entry, idx) => {
              const isExpanded = expandedSegment === entry.segmentIndex;
              const typeConfig = CHANGE_TYPE_CONFIG[entry.changeType];
              return (
                <div
                  key={entry.segmentIndex}
                  style={{
                    display: "flex",
                    flexDirection: isMobile ? "column" : "row",
                    borderBottom: idx < filteredEntries.length - 1 ? `1px solid ${colors.borderPrimary}` : "none",
                    cursor: "pointer",
                  }}
                  onClick={() => setExpandedSegment(isExpanded ? null : entry.segmentIndex)}
                >
                  {/* Author gutter */}
                  <div style={{
                    width: isMobile ? "100%" : "200px",
                    minWidth: isMobile ? "auto" : "200px",
                    padding: "12px 16px",
                    background: 'hsl(var(--muted) / 0.15)',
                    borderRight: isMobile ? "none" : `3px solid ${authorColors[entry.author]}`,
                    borderBottom: isMobile ? `3px solid ${authorColors[entry.author]}` : "none",
                    display: "flex",
                    flexDirection: isMobile ? "row" : "column",
                    gap: "4px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "14px" }}>{entry.authorAvatar}</span>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: colors.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {entry.author}
                      </span>
                    </div>
                    <div style={{ fontSize: "11px", color: colors.textSecondary }}>
                      {formatDate(entry.editedAt)}
                    </div>
                    <div style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "3px",
                      padding: "1px 6px",
                      borderRadius: "3px",
                      fontSize: "10px",
                      fontWeight: 600,
                      color: typeConfig.color,
                      background: `${typeConfig.color}15`,
                      width: "fit-content",
                    }}>
                      {typeConfig.icon} {typeConfig.label}
                    </div>
                  </div>

                  {/* Content area */}
                  <div style={{ flex: 1, padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "11px", color: colors.textSecondary, fontFamily: "monospace" }}>
                        §{entry.segmentIndex + 1}
                      </span>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: colors.textPrimary }}>
                        {entry.title}
                      </span>
                      <span style={{ fontSize: "11px", color: colors.textSecondary, marginLeft: "auto" }}>
                        {entry.wordCount} words
                      </span>
                    </div>
                    <div style={{
                      fontSize: "12px",
                      color: colors.textSecondary,
                      fontStyle: "italic",
                      marginBottom: isExpanded ? "8px" : 0,
                    }}>
                      "{entry.editSummary}"
                    </div>
                    {isExpanded && (
                      <div style={{
                        fontSize: "13px",
                        color: colors.textPrimary,
                        lineHeight: 1.6,
                        padding: "12px",
                        background: 'hsl(var(--muted) / 0.15)',
                        borderRadius: "6px",
                        borderLeft: `3px solid ${authorColors[entry.author]}`,
                      }}>
                        {entry.content}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: "16px", fontSize: "12px", color: colors.textSecondary, textAlign: "center" }}>
          {filteredEntries.length} of {blameData.totalSegments} segments · {uniqueAuthors.length} contributors
        </div>
      </div>
    </div>
  );
}
