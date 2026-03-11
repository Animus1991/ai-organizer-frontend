/**
 * DocumentDiffPage — GitHub-style Diff/Compare View for documents
 * Shows side-by-side comparison of document versions with additions/deletions highlighted
 * Similar to `git diff` but for academic document content
 */

import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useIsMobile } from "../hooks/useMediaQuery";

// ─── Types ───────────────────────────────────────────────────
interface DiffLine {
  type: "unchanged" | "added" | "removed" | "modified";
  lineNumber: { old: number | null; new: number | null };
  content: string;
  oldContent?: string;
}

interface DiffSection {
  title: string;
  sectionIndex: number;
  lines: DiffLine[];
  stats: { added: number; removed: number; unchanged: number };
}

interface DiffData {
  documentId: string;
  documentName: string;
  oldVersion: { label: string; date: Date; author: string };
  newVersion: { label: string; date: Date; author: string };
  sections: DiffSection[];
  totalStats: { added: number; removed: number; unchanged: number; files: number };
}

type DiffViewMode = "split" | "unified";

// ─── Sample Data Generator ───────────────────────────────────
function generateDiffData(documentId: string): DiffData {
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

  const sectionData: { title: string; lines: DiffLine[] }[] = [
    {
      title: "Abstract",
      lines: [
        { type: "unchanged", lineNumber: { old: 1, new: 1 }, content: "This paper presents a comprehensive analysis of cognitive processes" },
        { type: "unchanged", lineNumber: { old: 2, new: 2 }, content: "in collaborative academic environments. Our research examines" },
        { type: "removed", lineNumber: { old: 3, new: null }, content: "the impact of traditional methodologies on research outcomes." },
        { type: "added", lineNumber: { old: null, new: 3 }, content: "the impact of mixed-methods approaches on research outcomes," },
        { type: "added", lineNumber: { old: null, new: 4 }, content: "incorporating both quantitative and qualitative data sources." },
        { type: "unchanged", lineNumber: { old: 4, new: 5 }, content: "Results indicate significant improvements in collaboration efficiency." },
      ],
    },
    {
      title: "Introduction",
      lines: [
        { type: "unchanged", lineNumber: { old: 5, new: 6 }, content: "The field of academic collaboration has undergone significant" },
        { type: "unchanged", lineNumber: { old: 6, new: 7 }, content: "transformation in recent years, driven by technological advances" },
        { type: "modified", lineNumber: { old: 7, new: 8 }, content: "and evolving pedagogical frameworks that emphasize interdisciplinary work.", oldContent: "and evolving pedagogical frameworks." },
        { type: "unchanged", lineNumber: { old: 8, new: 9 }, content: "This study builds upon foundational research by Smith et al. (2023)" },
        { type: "added", lineNumber: { old: null, new: 10 }, content: "and extends the theoretical model proposed by Johnson (2024)," },
        { type: "added", lineNumber: { old: null, new: 11 }, content: "which identified three key dimensions of effective collaboration." },
        { type: "unchanged", lineNumber: { old: 9, new: 12 }, content: "Our contribution lies in the empirical validation of these frameworks." },
      ],
    },
    {
      title: "Methodology",
      lines: [
        { type: "unchanged", lineNumber: { old: 10, new: 13 }, content: "We employed a mixed-methods research design combining" },
        { type: "removed", lineNumber: { old: 11, new: null }, content: "survey data from 150 participants across 5 institutions" },
        { type: "removed", lineNumber: { old: 12, new: null }, content: "with semi-structured interviews of 20 key informants." },
        { type: "added", lineNumber: { old: null, new: 14 }, content: "survey data from 312 participants across 12 institutions" },
        { type: "added", lineNumber: { old: null, new: 15 }, content: "with semi-structured interviews of 45 key informants," },
        { type: "added", lineNumber: { old: null, new: 16 }, content: "representing a significant expansion of the original sample." },
        { type: "unchanged", lineNumber: { old: 13, new: 17 }, content: "Data analysis followed established protocols for thematic coding." },
        { type: "unchanged", lineNumber: { old: 14, new: 18 }, content: "Inter-rater reliability was assessed using Cohen's kappa." },
      ],
    },
    {
      title: "Results",
      lines: [
        { type: "unchanged", lineNumber: { old: 15, new: 19 }, content: "Our findings reveal three primary themes:" },
        { type: "unchanged", lineNumber: { old: 16, new: 20 }, content: "1. Enhanced knowledge sharing through structured collaboration" },
        { type: "modified", lineNumber: { old: 17, new: 21 }, content: "2. Improved research quality through systematic peer review (p < 0.001)", oldContent: "2. Improved research quality through peer review" },
        { type: "unchanged", lineNumber: { old: 18, new: 22 }, content: "3. Accelerated publication timelines via parallel workflows" },
        { type: "added", lineNumber: { old: null, new: 23 }, content: "4. Increased citation impact through cross-disciplinary connections" },
        { type: "added", lineNumber: { old: null, new: 24 }, content: "5. Higher researcher satisfaction scores (mean = 4.2/5.0, SD = 0.7)" },
      ],
    },
    {
      title: "Discussion",
      lines: [
        { type: "unchanged", lineNumber: { old: 19, new: 25 }, content: "These results align with and extend previous findings in the field." },
        { type: "removed", lineNumber: { old: 20, new: null }, content: "However, several limitations should be noted." },
        { type: "added", lineNumber: { old: null, new: 26 }, content: "The expanded sample size strengthens the generalizability of our findings." },
        { type: "added", lineNumber: { old: null, new: 27 }, content: "However, several limitations should be acknowledged and addressed." },
        { type: "unchanged", lineNumber: { old: 21, new: 28 }, content: "Future research should explore longitudinal designs to capture" },
        { type: "modified", lineNumber: { old: 22, new: 29 }, content: "temporal dynamics and causal relationships between collaboration patterns and outcomes.", oldContent: "temporal dynamics in collaboration patterns." },
      ],
    },
  ];

  const sections: DiffSection[] = sectionData.map((s, i) => {
    const stats = {
      added: s.lines.filter((l) => l.type === "added").length,
      removed: s.lines.filter((l) => l.type === "removed").length,
      unchanged: s.lines.filter((l) => l.type === "unchanged").length,
    };
    return { title: s.title, sectionIndex: i, lines: s.lines, stats };
  });

  const totalStats = {
    added: sections.reduce((sum, s) => sum + s.stats.added, 0),
    removed: sections.reduce((sum, s) => sum + s.stats.removed, 0),
    unchanged: sections.reduce((sum, s) => sum + s.stats.unchanged, 0),
    files: sections.length,
  };

  return {
    documentId,
    documentName: docName,
    oldVersion: { label: "v1.2.0", date: new Date(now.getTime() - 7 * 86400000), author: "Dr. Elena Vasquez" },
    newVersion: { label: "v1.3.0", date: now, author: "You" },
    sections,
    totalStats,
  };
}

// ─── Diff Line Colors ────────────────────────────────────────
function getDiffLineStyle(type: DiffLine["type"], isDark: boolean): React.CSSProperties {
  switch (type) {
    case "added":
      return {
        background: isDark ? "rgba(16, 185, 129, 0.1)" : "rgba(16, 185, 129, 0.12)",
        borderLeft: "3px solid #10b981",
      };
    case "removed":
      return {
        background: isDark ? "rgba(239, 68, 68, 0.1)" : "rgba(239, 68, 68, 0.12)",
        borderLeft: "3px solid #ef4444",
        textDecoration: "line-through",
        opacity: 0.7,
      };
    case "modified":
      return {
        background: isDark ? "rgba(245, 158, 11, 0.08)" : "rgba(245, 158, 11, 0.1)",
        borderLeft: "3px solid #f59e0b",
      };
    default:
      return { borderLeft: "3px solid transparent" };
  }
}

// ─── Component ───────────────────────────────────────────────
export default function DocumentDiffPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const isDark = true; // semantic tokens handle theming

  const colors = {
    bgPrimary: 'hsl(var(--background))',
    textPrimary: 'hsl(var(--foreground))',
    textSecondary: 'hsl(var(--muted-foreground))',
    borderPrimary: 'hsl(var(--border))',
  };

  const [diffData, setDiffData] = useState<DiffData | null>(null);
  const [viewMode, setViewMode] = useState<DiffViewMode>("unified");
  const [showUnchanged, setShowUnchanged] = useState(true);
  const [collapsedSections, setCollapsedSections] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (documentId) {
      setDiffData(generateDiffData(documentId));
    }
  }, [documentId]);

  const toggleSection = (index: number) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const visibleSections = useMemo(() => {
    if (!diffData) return [];
    return diffData.sections.map((section) => ({
      ...section,
      lines: showUnchanged ? section.lines : section.lines.filter((l) => l.type !== "unchanged"),
    }));
  }, [diffData, showUnchanged]);

  if (!diffData) {
    return (
      <div style={{ minHeight: "100vh", background: colors.bgPrimary, color: colors.textPrimary, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p>{t("diff.loading") || "Loading diff data..."}</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: colors.bgPrimary, color: colors.textPrimary, padding: isMobile ? "12px" : "24px", paddingTop: "72px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
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
                🔀 {t("diff.title") || "Compare Versions"}
              </h1>
            </div>
            <p style={{ margin: "6px 0 0", fontSize: "14px", color: colors.textSecondary }}>
              {diffData.documentName} — {diffData.oldVersion.label} → {diffData.newVersion.label}
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => navigate(`/documents/${documentId}/blame`)}
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
              📝 {t("diff.viewBlame") || "Blame"}
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div style={{
          display: "flex",
          gap: isMobile ? "8px" : "16px",
          marginBottom: "16px",
          padding: isMobile ? "10px 12px" : "12px 16px",
          background: 'hsl(var(--card))',
          border: `1px solid ${colors.borderPrimary}`,
          borderRadius: "10px",
          alignItems: "center",
          flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "13px", color: colors.textSecondary }}>Showing</span>
            <span style={{ fontWeight: 600, color: colors.textPrimary }}>{diffData.totalStats.files} sections</span>
            <span style={{ fontSize: "13px", color: colors.textSecondary }}>with</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ color: "#10b981", fontWeight: 600 }}>+{diffData.totalStats.added}</span>
            <span style={{ fontSize: "12px", color: colors.textSecondary }}>additions</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ color: "#ef4444", fontWeight: 600 }}>-{diffData.totalStats.removed}</span>
            <span style={{ fontSize: "12px", color: colors.textSecondary }}>deletions</span>
          </div>

          {/* Diff bar visualization */}
          <div style={{ display: isMobile ? "none" : "flex", height: "8px", borderRadius: "4px", overflow: "hidden", flex: 1, minWidth: "100px", maxWidth: "200px" }}>
            <div style={{ width: `${(diffData.totalStats.added / (diffData.totalStats.added + diffData.totalStats.removed + diffData.totalStats.unchanged)) * 100}%`, background: "#10b981" }} />
            <div style={{ width: `${(diffData.totalStats.removed / (diffData.totalStats.added + diffData.totalStats.removed + diffData.totalStats.unchanged)) * 100}%`, background: "#ef4444" }} />
            <div style={{ flex: 1, background: 'hsl(var(--muted) / 0.3)' }} />
          </div>

          <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
            {/* View mode toggle */}
            <div style={{ display: "flex", borderRadius: "6px", overflow: "hidden", border: `1px solid ${colors.borderPrimary}` }}>
              {(["unified", "split"] as DiffViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  style={{
                    padding: "4px 10px",
                    fontSize: "12px",
                    background: viewMode === mode ? "rgba(99,102,241,0.2)" : "transparent",
                    color: viewMode === mode ? colors.textPrimary : colors.textSecondary,
                    border: "none",
                    cursor: "pointer",
                    fontWeight: viewMode === mode ? 600 : 400,
                  }}
                >
                  {mode === "unified" ? "Unified" : "Split"}
                </button>
              ))}
            </div>
            {/* Show unchanged toggle */}
            <button
              onClick={() => setShowUnchanged(!showUnchanged)}
              style={{
                padding: "4px 10px",
                fontSize: "12px",
                background: showUnchanged ? "rgba(99,102,241,0.15)" : "transparent",
                border: `1px solid ${colors.borderPrimary}`,
                borderRadius: "6px",
                color: colors.textSecondary,
                cursor: "pointer",
              }}
            >
              {showUnchanged ? "Hide" : "Show"} unchanged
            </button>
          </div>
        </div>

        {/* Version comparison header */}
        <div style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? "8px" : "16px",
          marginBottom: "16px",
          fontSize: "13px",
        }}>
          <div style={{
            flex: 1,
            padding: "10px 14px",
            background: "rgba(239,68,68,0.06)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            <span style={{ color: "#ef4444", fontWeight: 600 }}>{diffData.oldVersion.label}</span>
            <span style={{ color: colors.textSecondary }}>by {diffData.oldVersion.author}</span>
            <span style={{ color: colors.textSecondary, marginLeft: "auto", fontSize: "11px" }}>
              {diffData.oldVersion.date.toLocaleDateString()}
            </span>
          </div>
          <div style={{
            flex: 1,
            padding: "10px 14px",
            background: "rgba(16,185,129,0.06)",
            border: "1px solid rgba(16,185,129,0.2)",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            <span style={{ color: "#10b981", fontWeight: 600 }}>{diffData.newVersion.label}</span>
            <span style={{ color: colors.textSecondary }}>by {diffData.newVersion.author}</span>
            <span style={{ color: colors.textSecondary, marginLeft: "auto", fontSize: "11px" }}>
              {diffData.newVersion.date.toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Diff Sections */}
        {visibleSections.map((section) => {
          const isCollapsed = collapsedSections.has(section.sectionIndex);
          return (
            <div
              key={section.sectionIndex}
              style={{
                marginBottom: "16px",
                border: `1px solid ${colors.borderPrimary}`,
                borderRadius: "10px",
                overflow: "hidden",
              }}
            >
              {/* Section header */}
              <div
                onClick={() => toggleSection(section.sectionIndex)}
                style={{
                  padding: "10px 16px",
                  background: 'hsl(var(--muted) / 0.15)',
                  borderBottom: isCollapsed ? "none" : `1px solid ${colors.borderPrimary}`,
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  cursor: "pointer",
                  fontSize: "13px",
                }}
              >
                <span style={{ fontSize: "10px", color: colors.textSecondary }}>{isCollapsed ? "▶" : "▼"}</span>
                <span style={{ fontWeight: 600, color: colors.textPrimary }}>§{section.sectionIndex + 1} {section.title}</span>
                <div style={{ display: "flex", gap: "8px", marginLeft: "auto" }}>
                  {section.stats.added > 0 && (
                    <span style={{ color: "#10b981", fontSize: "12px", fontWeight: 600 }}>+{section.stats.added}</span>
                  )}
                  {section.stats.removed > 0 && (
                    <span style={{ color: "#ef4444", fontSize: "12px", fontWeight: 600 }}>-{section.stats.removed}</span>
                  )}
                </div>
              </div>

              {/* Diff lines */}
              {!isCollapsed && (
                <div style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace", fontSize: "13px" }}>
                  {viewMode === "unified" ? (
                    // Unified view
                    section.lines.map((line, lineIdx) => (
                      <div
                        key={lineIdx}
                        style={{
                          display: "flex",
                          padding: "4px 16px",
                          ...getDiffLineStyle(line.type, isDark),
                        }}
                      >
                        <span style={{ width: "40px", textAlign: "right", color: colors.textSecondary, opacity: 0.5, fontSize: "11px", paddingRight: "8px", userSelect: "none" }}>
                          {line.lineNumber.old ?? ""}
                        </span>
                        <span style={{ width: "40px", textAlign: "right", color: colors.textSecondary, opacity: 0.5, fontSize: "11px", paddingRight: "12px", userSelect: "none" }}>
                          {line.lineNumber.new ?? ""}
                        </span>
                        <span style={{ width: "16px", textAlign: "center", fontWeight: 700, color: line.type === "added" ? "#10b981" : line.type === "removed" ? "#ef4444" : line.type === "modified" ? "#f59e0b" : "transparent", userSelect: "none" }}>
                          {line.type === "added" ? "+" : line.type === "removed" ? "-" : line.type === "modified" ? "~" : " "}
                        </span>
                        <span style={{ flex: 1, color: colors.textPrimary }}>
                          {line.type === "modified" && line.oldContent ? (
                            <>
                              <span style={{ textDecoration: "line-through", opacity: 0.5, color: "#ef4444" }}>{line.oldContent}</span>
                              {" → "}
                              <span style={{ color: "#10b981" }}>{line.content}</span>
                            </>
                          ) : (
                            line.content
                          )}
                        </span>
                      </div>
                    ))
                  ) : (
                    // Split view
                    <div style={{ display: "flex" }}>
                      {/* Old version */}
                      <div style={{ flex: 1, borderRight: `1px solid ${colors.borderPrimary}` }}>
                        {section.lines.filter((l) => l.type !== "added").map((line, lineIdx) => (
                          <div
                            key={lineIdx}
                            style={{
                              display: "flex",
                              padding: "4px 12px",
                              ...(line.type === "removed" || line.type === "modified"
                                ? { background: isDark ? "rgba(239,68,68,0.08)" : "rgba(239,68,68,0.1)" }
                                : {}),
                            }}
                          >
                            <span style={{ width: "35px", textAlign: "right", color: colors.textSecondary, opacity: 0.5, fontSize: "11px", paddingRight: "8px", userSelect: "none" }}>
                              {line.lineNumber.old ?? ""}
                            </span>
                            <span style={{ flex: 1, color: colors.textPrimary, textDecoration: line.type === "removed" ? "line-through" : "none", opacity: line.type === "removed" ? 0.6 : 1 }}>
                              {line.type === "modified" ? (line.oldContent || line.content) : line.content}
                            </span>
                          </div>
                        ))}
                      </div>
                      {/* New version */}
                      <div style={{ flex: 1 }}>
                        {section.lines.filter((l) => l.type !== "removed").map((line, lineIdx) => (
                          <div
                            key={lineIdx}
                            style={{
                              display: "flex",
                              padding: "4px 12px",
                              ...(line.type === "added" || line.type === "modified"
                                ? { background: isDark ? "rgba(16,185,129,0.08)" : "rgba(16,185,129,0.1)" }
                                : {}),
                            }}
                          >
                            <span style={{ width: "35px", textAlign: "right", color: colors.textSecondary, opacity: 0.5, fontSize: "11px", paddingRight: "8px", userSelect: "none" }}>
                              {line.lineNumber.new ?? ""}
                            </span>
                            <span style={{ flex: 1, color: colors.textPrimary }}>
                              {line.content}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Footer */}
        <div style={{ marginTop: "16px", fontSize: "12px", color: colors.textSecondary, textAlign: "center" }}>
          {diffData.totalStats.files} sections changed · {diffData.totalStats.added} additions · {diffData.totalStats.removed} deletions
        </div>
      </div>
    </div>
  );
}
