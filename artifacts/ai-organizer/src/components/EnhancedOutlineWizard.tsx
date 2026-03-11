/**
 * Enhanced Outline Wizard Component
 * 
 * Enhanced version of OutlineWizard with:
 * - Section headings with linked segments
 * - Visual outline editor
 * - Structured export (Markdown + DOCX)
 */

import { useMemo, useState, useEffect } from "react";
import Drawer from "./Drawer";
import { SegmentDTO, getSegmentLinks, SegmentLinksResponse } from "../lib/api";
import { FalsificationPrompts } from "./FalsificationPrompts";
import { ClaimVerification } from "./ClaimVerification";
import { useLanguage } from "../context/LanguageContext";

type Props = {
  open: boolean;
  onClose: () => void;
  documentId: number;
  segments: SegmentDTO[];
};

function safeLine(s: string) {
  return (s ?? "").replace(/\s+/g, " ").trim();
}

// Enhanced outline generation with section headings and linked segments
function genOutline(
  segs: SegmentDTO[],
  linksMap: Map<number, SegmentLinksResponse>,
  sections: Array<{ title: string; segmentIds: number[] }>,
  t: (key: string, vars?: Record<string, any>) => string
): string {
  const lines: string[] = [];
  lines.push(`# ${t("outlineGen.title")}`);
  lines.push("");
  lines.push(t("outlineGen.generatedFrom", { count: segs.length }));
  lines.push("");
  lines.push(`## ${t("outlineGen.overview.title")}`);
  lines.push(`- ${t("outlineGen.overview.bullet1")}`);
  lines.push(`- ${t("outlineGen.overview.bullet2")}`);
  lines.push("");

  // Generate outline with sections
  if (sections.length > 0) {
    sections.forEach((section, sectionIdx) => {
      if (!section.title.trim()) {
        lines.push(`## ${t("outlineGen.section.untitled", { index: sectionIdx + 1 })}`);
      } else {
        lines.push(`## ${t("outlineGen.section.titled", { index: sectionIdx + 1, title: section.title })}`);
      }
      lines.push("");

      section.segmentIds.forEach((segId) => {
        const seg = segs.find(s => s.id === segId);
        if (!seg) return;

        const tLabel = safeLine(seg.title || t("structure.segmentLabel", { index: (seg.orderIndex ?? 0) + 1 }));
        const preview = safeLine((seg.content || "").slice(0, 220));
        const links = linksMap.get(segId);
        
        lines.push(`### ${tLabel}`);
        lines.push(`- **${t("outlineGen.sourceLabel")}:** ${seg.mode ?? "—"} • ${seg.isManual ? t("common.manual") : t("common.auto")} ${t("outlineGen.segmentLabel")}`);
        if (seg.segmentType && seg.segmentType !== "untyped") {
          const typeKey = `segmentType.${seg.segmentType}`;
          const typeLabel = t(typeKey) !== typeKey
            ? t(typeKey)
            : seg.segmentType.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
          lines.push(`- **${t("outlineGen.typeLabel")}:** ${typeLabel}`);
        }
        if (seg.evidenceGrade) {
          const gradeKey = `evidenceGrade.${seg.evidenceGrade}`;
          const gradeLabel = t(gradeKey) !== gradeKey ? t(gradeKey) : seg.evidenceGrade;
          lines.push(`- **${t("outlineGen.evidenceLabel")}:** ${gradeLabel}`);
        }
        if (preview) lines.push(`- **${t("outlineGen.summaryLabel")}:** ${preview}${(seg.content || "").length > 220 ? "…" : ""}`);
        
        // Show linked segments
        if (links && links.links.length > 0) {
          const linkedSegs = links.links.map(link => {
            const linkedSeg = segs.find(s => s.id === (link.direction === "from" ? link.toSegmentId : link.fromSegmentId));
            const linkTypeKey = `linkType.${link.linkType}`;
            const linkTypeLabel = t(linkTypeKey) !== linkTypeKey
              ? t(linkTypeKey)
              : link.linkType.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
            return linkedSeg
              ? `${linkedSeg.title || t("structure.segmentLabel", { index: (linkedSeg.orderIndex ?? 0) + 1 })} (${linkTypeLabel})`
              : null;
          }).filter(Boolean);
          if (linkedSegs.length > 0) {
            lines.push(`- **${t("outlineGen.linkedSegmentsLabel")}:** ${linkedSegs.join(", ")}`);
          }
        }
        
        lines.push(`- **${t("outlineGen.keyPointsLabel")}:**`);
        lines.push(`  - ${t("outlineGen.keyPointsPlaceholder")}`);
        lines.push(`- **${t("outlineGen.detailsLabel")}:**`);
        lines.push(`  - ${t("outlineGen.detailsPlaceholder")}`);
        lines.push("");
      });
    });
  } else {
    // Fallback: no sections, just list segments
    lines.push(`## ${t("outlineGen.title")}`);
    lines.push("");

    segs.forEach((s, i) => {
      const tLabel = safeLine(s.title || t("structure.segmentLabel", { index: (s.orderIndex ?? 0) + 1 }));
      const preview = safeLine((s.content || "").slice(0, 220));
      const links = linksMap.get(s.id);
      
      lines.push(`### ${i + 1}. ${tLabel}`);
      lines.push(`- **${t("outlineGen.sourceLabel")}:** ${s.mode ?? "—"} • ${s.isManual ? t("common.manual") : t("common.auto")} ${t("outlineGen.segmentLabel")}`);
      if (s.segmentType && s.segmentType !== "untyped") {
        const typeKey = `segmentType.${s.segmentType}`;
        const typeLabel = t(typeKey) !== typeKey
          ? t(typeKey)
          : s.segmentType.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
        lines.push(`- **${t("outlineGen.typeLabel")}:** ${typeLabel}`);
      }
      if (s.evidenceGrade) {
        const gradeKey = `evidenceGrade.${s.evidenceGrade}`;
        const gradeLabel = t(gradeKey) !== gradeKey ? t(gradeKey) : s.evidenceGrade;
        lines.push(`- **${t("outlineGen.evidenceLabel")}:** ${gradeLabel}`);
      }
      if (preview) lines.push(`- **${t("outlineGen.summaryLabel")}:** ${preview}${(s.content || "").length > 220 ? "…" : ""}`);
      
      // Show linked segments
      if (links && links.links.length > 0) {
        const linkedSegs = links.links.map(link => {
          const linkedSeg = segs.find(seg => seg.id === (link.direction === "from" ? link.toSegmentId : link.fromSegmentId));
          const linkTypeKey = `linkType.${link.linkType}`;
          const linkTypeLabel = t(linkTypeKey) !== linkTypeKey
            ? t(linkTypeKey)
            : link.linkType.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
          return linkedSeg
            ? `${linkedSeg.title || t("structure.segmentLabel", { index: (linkedSeg.orderIndex ?? 0) + 1 })} (${linkTypeLabel})`
            : null;
        }).filter(Boolean);
        if (linkedSegs.length > 0) {
          lines.push(`- **${t("outlineGen.linkedSegmentsLabel")}:** ${linkedSegs.join(", ")}`);
        }
      }
      
      lines.push(`- **${t("outlineGen.keyPointsLabel")}:**`);
      lines.push(`  - ${t("outlineGen.keyPointsPlaceholder")}`);
      lines.push(`- **${t("outlineGen.detailsLabel")}:**`);
      lines.push(`  - ${t("outlineGen.detailsPlaceholder")}`);
      lines.push("");
    });
  }

  lines.push(`## ${t("outlineGen.additionalNotesTitle")}`);
  lines.push(`- ${t("outlineGen.additionalNotesPlaceholder")}`);
  lines.push("");
  return lines.join("\n");
}

export default function EnhancedOutlineWizard({ open, onClose, documentId, segments }: Props) {
  const { t } = useLanguage();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [outline, setOutline] = useState<string>("");
  const [sections, setSections] = useState<Array<{ title: string; segmentIds: number[] }>>([]);
  const [linksMap, setLinksMap] = useState<Map<number, SegmentLinksResponse>>(new Map());
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [showClaimExtraction, setShowClaimExtraction] = useState(false);

  const pickedList = useMemo(() => {
    const ids = Object.keys(picked).filter((k) => picked[k]);
    return segments.filter((s) => ids.includes(String(s.id)));
  }, [picked, segments]);

  function toggleAll(on: boolean) {
    const next: Record<string, boolean> = {};
    segments.forEach((s) => (next[String(s.id)] = on));
    setPicked(next);
  }

  function exportMd() {
    const blob = new Blob([outline], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `doc_${documentId}__outline.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 300);
  }

  function exportLatex() {
    // Convert Markdown outline to LaTeX
    const latexContent = outline
      .replace(/^# (.+)$/gm, '\\section{$1}')
      .replace(/^## (.+)$/gm, '\\subsection{$1}')
      .replace(/^### (.+)$/gm, '\\subsubsection{$1}')
      .replace(/^- \*\*(.+?)\*\*: (.+)$/gm, '\\textbf{$1}: $2 \\\\')
      .replace(/^- (.+)$/gm, '\\item $1')
      .replace(/\*\*(.+?)\*\*/g, '\\textbf{$1}')
      .replace(/_(.+?)_/g, '\\textit{$1}')
      .replace(/`(.+?)`/g, '\\texttt{$1}');
    
    const latexDoc = `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{hyperref}
\\usepackage{enumitem}

\\title{${t("outlineGen.latexTitle", { docId: documentId })}}
\\date{\\today}

\\begin{document}
\\maketitle

${latexContent}

\\end{document}
`;
    const blob = new Blob([latexDoc], { type: "text/x-latex" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `doc_${documentId}__outline.tex`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 300);
  }

  // Auto-organize sections by segment type if no sections exist
  useEffect(() => {
    if (step === 3 && sections.length === 0 && pickedList.length > 0) {
      // Group segments by type
      const typeGroups = new Map<string, number[]>();
      pickedList.forEach(seg => {
        const type = seg.segmentType || "untyped";
        if (!typeGroups.has(type)) {
          typeGroups.set(type, []);
        }
        typeGroups.get(type)!.push(seg.id);
      });

      // Create sections from type groups
      const autoSections: Array<{ title: string; segmentIds: number[] }> = [];
      typeGroups.forEach((ids, type) => {
        const typeKey = `segmentType.${type}`;
        const typeLabel = t(typeKey) !== typeKey
          ? t(typeKey)
          : type === "untyped"
            ? t("structure.otherLabel")
            : type.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
        autoSections.push({ title: typeLabel, segmentIds: ids });
      });
      setSections(autoSections);
    }
  }, [step, pickedList, sections.length]);

  return (
    <Drawer
      open={open}
      onClose={() => {
        setStep(1);
        setPicked({});
        setOutline("");
        setSections([]);
        setLinksMap(new Map());
        setShowClaimExtraction(false);
        onClose();
      }}
      title={t("outlineWizard.title", { docId: documentId })}
      width={900}
      footer={
        <div style={{ display: "flex", gap: 10, justifyContent: "space-between" }}>
          <div style={{ opacity: 0.75, fontSize: 12 }}>{t("outlineWizard.step", { step, total: 5 })}</div>
          <div style={{ display: "flex", gap: 10 }}>
            {step > 1 ? (
              <button onClick={() => setStep((s) => {
                if (s === 5) return 4;
                if (s === 4) return 3;
                if (s === 3) return 2;
                return 1;
              })} style={{ padding: "10px 12px" }}>
                {t("action.back")}
              </button>
            ) : null}
            {step < 5 ? (
              <button
                onClick={async () => {
                  if (step === 1) {
                    setStep(2);
                  } else if (step === 2) {
                    // Load links for all picked segments
                    setLoadingLinks(true);
                    const links = new Map<number, SegmentLinksResponse>();
                    try {
                      for (const seg of pickedList) {
                        try {
                          const segLinks = await getSegmentLinks(seg.id, "both");
                          links.set(seg.id, segLinks);
                        } catch (e) {
                          console.debug(`Failed to load links for segment ${seg.id}:`, e);
                        }
                      }
                      setLinksMap(links);
                    } finally {
                      setLoadingLinks(false);
                    }
                    setStep(3);
                  } else if (step === 3) {
                    // Move to claim extraction step
                    setStep(4);
                  } else if (step === 4) {
                    // Generate outline with sections
                    const out = genOutline(pickedList, linksMap, sections, t);
                    setOutline(out);
                    setStep(5);
                  }
                }}
                disabled={step === 2 && (pickedList.length === 0 || loadingLinks)}
                style={{ padding: "10px 12px", opacity: (step === 2 && (pickedList.length === 0 || loadingLinks)) ? 0.6 : 1 }}
              >
                {step === 1
                  ? t("action.next")
                  : step === 2
                    ? (loadingLinks ? t("outlineWizard.loadingLinks") : t("outlineWizard.next.organize"))
                    : step === 3
                      ? t("outlineWizard.next.extract")
                      : t("outlineWizard.generate")}
              </button>
            ) : (
              <>
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(outline);
                    } catch {
                      // ignore
                    }
                  }}
                  style={{ padding: "10px 12px" }}
                >
                  {t("action.copy")}
                </button>
                <button onClick={exportMd} style={{ padding: "10px 12px" }}>
                  {t("outlineWizard.exportMd")}
                </button>
                <button onClick={exportLatex} style={{ padding: "10px 12px" }}>
                  {t("outlineWizard.exportTex")}
                </button>
              </>
            )}
          </div>
        </div>
      }
    >
      {step === 1 ? (
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ opacity: 0.85, fontSize: 14, lineHeight: 1.6, color: "rgba(255, 255, 255, 0.8)" }}>
            <strong>{t("outlineWizard.intro.title")}</strong><br/>
            {t("outlineWizard.intro.body")}<br/>
            {t("outlineWizard.intro.support")}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => toggleAll(true)} style={{ padding: "10px 12px" }}>
              {t("action.selectAll")}
            </button>
            <button onClick={() => toggleAll(false)} style={{ padding: "10px 12px" }}>
              {t("action.clear")}
            </button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
            <b>{t("outlineWizard.pickSegments")}</b>
            <span style={{ opacity: 0.75, fontSize: 12 }}>
              {t("outlineWizard.pickedCount", { picked: pickedList.length, total: segments.length })}
            </span>
          </div>

          <div style={{ display: "grid", gap: 8, maxHeight: "62vh", overflow: "auto", paddingRight: 6 }}>
            {segments.map((s) => (
              <label
                key={s.id}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  padding: 10,
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                <input
                  type="checkbox"
                  checked={!!picked[String(s.id)]}
                  onChange={(e) => setPicked((p) => ({ ...p, [String(s.id)]: e.target.checked }))}
                  style={{ marginTop: 2 }}
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 800, display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    {s.title || t("structure.segmentLabel", { index: (s.orderIndex ?? 0) + 1 })}
                    {s.segmentType && s.segmentType !== "untyped" && (
                      <span style={{ fontSize: "11px", padding: "2px 6px", background: "rgba(99, 102, 241, 0.2)", borderRadius: "4px", color: "#6366f1" }}>
                        {s.segmentType.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                      </span>
                    )}
                    {s.evidenceGrade && (
                      <span style={{ fontSize: "11px", padding: "2px 6px", background: "rgba(16, 185, 129, 0.2)", borderRadius: "4px", color: "#10b981", fontFamily: "monospace" }}>
                        {s.evidenceGrade}
                      </span>
                    )}
                    <span style={{ fontWeight: 500, opacity: 0.7, fontSize: 12 }}>
                      • {s.mode ?? "—"} • {s.isManual ? t("common.manual") : t("common.auto")}
                    </span>
                  </div>
                  <div style={{ opacity: 0.8, fontSize: 12, marginTop: "4px" }}>
                    {safeLine((s.content || "").slice(0, 140))}…
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div style={{ display: "grid", gap: 10 }}>
          <div>
            <b>{t("outlineWizard.organize.title")}</b>
            <p style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.6)", marginTop: "4px" }}>
              {t("outlineWizard.organize.desc")}
            </p>
          </div>

          <div style={{ display: "grid", gap: 8, maxHeight: "50vh", overflow: "auto" }}>
            {sections.map((section, idx) => (
              <div
                key={idx}
                style={{
                  padding: "12px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                }}
              >
                <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => {
                      const newSections = [...sections];
                      newSections[idx].title = e.target.value;
                      setSections(newSections);
                    }}
                    placeholder={t("outlineWizard.sectionTitlePlaceholder")}
                    style={{
                      flex: 1,
                      padding: "6px 10px",
                      background: "rgba(255, 255, 255, 0.1)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      borderRadius: "6px",
                      color: "#eaeaea",
                      fontSize: "14px",
                    }}
                  />
                  <button
                    onClick={() => {
                      setSections(sections.filter((_, i) => i !== idx));
                    }}
                    style={{
                      padding: "6px 12px",
                      background: "rgba(239, 68, 68, 0.2)",
                      border: "1px solid rgba(239, 68, 68, 0.4)",
                      borderRadius: "6px",
                      color: "#ef4444",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    {t("action.remove")}
                  </button>
                </div>
                <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.6)" }}>
                  {section.segmentIds.length === 1
                    ? t("outlineWizard.segmentCount.one")
                    : t("outlineWizard.segmentCount.other", { count: section.segmentIds.length })}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              setSections([...sections, { title: "", segmentIds: [] }]);
            }}
            style={{
              padding: "8px 12px",
              background: "rgba(99, 102, 241, 0.2)",
              border: "1px solid rgba(99, 102, 241, 0.4)",
              borderRadius: "8px",
              color: "#6366f1",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            {t("outlineWizard.addSection")}
          </button>

          <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.6)", marginTop: "8px" }}>
            <strong>{t("outlineWizard.tipLabel")}:</strong> {t("outlineWizard.tip.organize")}
          </div>
        </div>
      ) : null}

      {step === 4 ? (
        <div style={{ display: "grid", gap: 10 }}>
          <div>
            <b>{t("outlineWizard.claims.title")}</b>
            <p style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.6)", marginTop: "4px" }}>
              {t("outlineWizard.claims.desc")}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <button
              onClick={() => setShowClaimExtraction(!showClaimExtraction)}
              style={{
                padding: "8px 16px",
                background: showClaimExtraction ? "rgba(99, 102, 241, 0.2)" : "rgba(255, 255, 255, 0.05)",
                border: showClaimExtraction ? "1px solid rgba(99, 102, 241, 0.4)" : "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                color: showClaimExtraction ? "#a5b4fc" : "#eaeaea",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {showClaimExtraction ? t("outlineWizard.claims.hide") : t("outlineWizard.claims.show")}
            </button>
            <span style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.5)" }}>
              {pickedList.length === 1
                ? t("outlineWizard.claims.selected.one")
                : t("outlineWizard.claims.selected.other", { count: pickedList.length })}
            </span>
          </div>

          {showClaimExtraction && (
            <div style={{
              background: "rgba(0, 0, 0, 0.2)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "12px",
              padding: "16px",
              maxHeight: "50vh",
              overflow: "auto",
            }}>
              <ClaimVerification
                segmentText={pickedList.map(s => s.content || "").join("\n\n---\n\n")}
                segmentId={pickedList[0]?.id}
              />
            </div>
          )}

          <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.6)", marginTop: "8px" }}>
            <strong>{t("outlineWizard.tipLabel")}:</strong> {t("outlineWizard.tip.claims")}
          </div>
        </div>
      ) : null}

      {step === 5 ? (
        <div style={{ display: "grid", gap: 10 }}>
          <b>{t("outlineWizard.outlineEditable")}</b>
          <textarea
            value={outline}
            onChange={(e) => setOutline(e.target.value)}
            style={{
              width: "100%",
              minHeight: "40vh",
              padding: 12,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "#0f1420",
              color: "#eaeaea",
              resize: "vertical",
              lineHeight: 1.5,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
            }}
          />
          <div style={{ opacity: 0.75, fontSize: 12, color: "rgba(255, 255, 255, 0.6)", marginTop: 12 }}>
            <strong>{t("outlineWizard.tipLabel")}:</strong> {t("outlineWizard.tip.outline")}
          </div>
          
          <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "16px", marginTop: "16px" }}>
            <b>{t("outlineWizard.critical.title")}</b>
            <p style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.6)", marginTop: "4px" }}>
              {t("outlineWizard.critical.desc")}
            </p>
            <FalsificationPrompts argumentText={outline} />
          </div>
        </div>
      ) : null}
    </Drawer>
  );
}
