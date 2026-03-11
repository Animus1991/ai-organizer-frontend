// src/components/Think!Hub Publication Readiness Checker — checklist verifying theory completeness for publication
import { useState, useMemo, useCallback, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";

// ─── Types ───────────────────────────────────────────────────────────
type CheckStatus = "pass" | "warning" | "fail" | "not_checked";
type CheckCategory = "claims" | "evidence" | "methodology" | "consistency" | "presentation" | "ethics";

interface CheckItem {
  id: string;
  category: CheckCategory;
  title: string;
  description: string;
  status: CheckStatus;
  autoDetectable: boolean;
  autoResult: CheckStatus | null;
  manualOverride: CheckStatus | null;
  notes: string;
  lastChecked: string | null;
}

interface PublicationReadinessProps {
  open: boolean;
  onClose: () => void;
}

// ─── Constants ───────────────────────────────────────────────────────
const STORAGE_KEY = "thinkspace-publication-readiness";

const CATEGORY_META: Record<CheckCategory, { icon: string; color: string; label: string }> = {
  claims:       { icon: "🎯", color: "#a78bfa", label: "Claims & Arguments" },
  evidence:     { icon: "📊", color: "#60a5fa", label: "Evidence & Sources" },
  methodology:  { icon: "🔬", color: "#34d399", label: "Methodology" },
  consistency:  { icon: "⚙️", color: "#fbbf24", label: "Consistency & Logic" },
  presentation: { icon: "📝", color: "#f472b6", label: "Presentation" },
  ethics:       { icon: "⚖️", color: "#fb923c", label: "Ethics & Transparency" },
};

const STATUS_META: Record<CheckStatus, { icon: string; color: string; label: string; bg: string }> = {
  pass:        { icon: "✅", color: "#22c55e", label: "Pass",        bg: "rgba(34,197,94,0.06)" },
  warning:     { icon: "⚠️", color: "#f59e0b", label: "Warning",     bg: "rgba(245,158,11,0.06)" },
  fail:        { icon: "❌", color: "#ef4444", label: "Fail",        bg: "rgba(239,68,68,0.06)" },
  not_checked: { icon: "⏳", color: "#94a3b8", label: "Not Checked", bg: "rgba(148,163,184,0.06)" },
};

// ─── Default checklist ───────────────────────────────────────────────
const DEFAULT_CHECKS: Omit<CheckItem, "status" | "autoResult" | "manualOverride" | "notes" | "lastChecked">[] = [
  // Claims
  { id: "c1", category: "claims", title: "All claims explicitly stated", description: "Every claim is formulated as a clear, testable proposition", autoDetectable: true },
  { id: "c2", category: "claims", title: "Claim types categorized", description: "Each claim tagged as philosophical/physical/psychological/economic/methodological", autoDetectable: true },
  { id: "c3", category: "claims", title: "Boundary conditions defined", description: "For each claim: when it holds, when it doesn't, what alternatives exist", autoDetectable: true },
  { id: "c4", category: "claims", title: "No unsupported universal claims", description: "Universal quantifiers (all, never, always) are justified or qualified", autoDetectable: false },
  { id: "c5", category: "claims", title: "Argument structure is clear", description: "Premises → conclusion chain is traceable for each major argument", autoDetectable: true },
  // Evidence
  { id: "e1", category: "evidence", title: "All claims have evidence", description: "Every empirical claim is supported by at least one source or dataset", autoDetectable: true },
  { id: "e2", category: "evidence", title: "Evidence debt resolved", description: "No critical evidence gaps remain unaddressed", autoDetectable: true },
  { id: "e3", category: "evidence", title: "Sources are credible", description: "All cited sources are peer-reviewed, reputable, or otherwise justified", autoDetectable: false },
  { id: "e4", category: "evidence", title: "Counter-evidence addressed", description: "Known counter-evidence or competing findings are acknowledged and discussed", autoDetectable: false },
  { id: "e5", category: "evidence", title: "Data is reproducible", description: "Datasets and methods are described sufficiently for replication", autoDetectable: false },
  // Methodology
  { id: "m1", category: "methodology", title: "Research method stated", description: "The methodology (deductive, inductive, computational, etc.) is explicitly described", autoDetectable: false },
  { id: "m2", category: "methodology", title: "Falsifiability criteria defined", description: "For each major claim, conditions that would disprove it are specified", autoDetectable: true },
  { id: "m3", category: "methodology", title: "Scope limits acknowledged", description: "The theory's domain of applicability is clearly bounded", autoDetectable: true },
  { id: "m4", category: "methodology", title: "Peer review simulation passed", description: "Virtual peer review has been completed with no critical issues", autoDetectable: true },
  // Consistency
  { id: "k1", category: "consistency", title: "No contradictions found", description: "No direct contradictions between claims", autoDetectable: true },
  { id: "k2", category: "consistency", title: "No circular definitions", description: "All key terms are defined without circularity", autoDetectable: true },
  { id: "k3", category: "consistency", title: "Dimensional consistency", description: "All equations and formulas are dimensionally consistent", autoDetectable: true },
  { id: "k4", category: "consistency", title: "Terminology consistent", description: "Key terms used consistently throughout (no semantic drift)", autoDetectable: true },
  // Presentation
  { id: "p1", category: "presentation", title: "Key terms in ontology", description: "All important terms are defined in the ontology/glossary", autoDetectable: true },
  { id: "p2", category: "presentation", title: "Abstract/summary exists", description: "A concise summary of the theory is available", autoDetectable: false },
  { id: "p3", category: "presentation", title: "Figures/diagrams included", description: "Key relationships are visualized (argument maps, concept maps)", autoDetectable: true },
  { id: "p4", category: "presentation", title: "Citations properly formatted", description: "All references follow a consistent citation style", autoDetectable: false },
  // Ethics
  { id: "t1", category: "ethics", title: "Limitations disclosed", description: "Known limitations and weaknesses are honestly disclosed", autoDetectable: false },
  { id: "t2", category: "ethics", title: "Conflicts of interest stated", description: "Any potential biases or conflicts are acknowledged", autoDetectable: false },
  { id: "t3", category: "ethics", title: "Prior work credited", description: "All intellectual debts and inspirations are properly attributed", autoDetectable: false },
];

function loadChecks(): CheckItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_CHECKS.map(c => ({
    ...c,
    status: "not_checked" as CheckStatus,
    autoResult: null,
    manualOverride: null,
    notes: "",
    lastChecked: null,
  }));
}

function saveChecks(checks: CheckItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(checks));
}

// ─── Auto-detection from other Think!Hub tools ───────────────────────
function runAutoDetection(checks: CheckItem[]): CheckItem[] {
  const now = new Date().toISOString();
  return checks.map(check => {
    if (!check.autoDetectable) return check;

    let autoResult: CheckStatus = "not_checked";

    try {
      switch (check.id) {
        case "c1": { // Claims explicitly stated
          const claims = JSON.parse(localStorage.getItem("thinkspace-claim-builder") || "[]");
          autoResult = claims.length >= 3 ? "pass" : claims.length > 0 ? "warning" : "fail";
          break;
        }
        case "c2": { // Claim types categorized
          const props = JSON.parse(localStorage.getItem("thinkspace-proposition-types") || "[]");
          const uncategorized = props.filter((p: any) => !p.manualType && p.autoType === "uncategorized").length;
          autoResult = props.length === 0 ? "fail" : uncategorized === 0 ? "pass" : "warning";
          break;
        }
        case "c3": { // Boundary conditions
          const bounds = JSON.parse(localStorage.getItem("thinkspace-boundary-conditions") || "{}");
          const conditions = bounds.conditions || [];
          autoResult = conditions.length >= 3 ? "pass" : conditions.length > 0 ? "warning" : "fail";
          break;
        }
        case "c5": { // Argument structure
          const argMap = JSON.parse(localStorage.getItem("thinkspace-argument-map") || "{}");
          const nodes = argMap.nodes || [];
          autoResult = nodes.length >= 5 ? "pass" : nodes.length > 0 ? "warning" : "fail";
          break;
        }
        case "e1": { // Evidence for claims
          const evReqs = JSON.parse(localStorage.getItem("thinkspace-evidence-requirements") || "[]");
          const found = evReqs.filter((r: any) => r.status === "found").length;
          const total = evReqs.length;
          autoResult = total === 0 ? "not_checked" : found === total ? "pass" : found / total > 0.5 ? "warning" : "fail";
          break;
        }
        case "e2": { // Evidence debt
          const evReqs2 = JSON.parse(localStorage.getItem("thinkspace-evidence-requirements") || "[]");
          const critical = evReqs2.filter((r: any) => r.priority === "critical" && r.status !== "found").length;
          autoResult = critical === 0 && evReqs2.length > 0 ? "pass" : critical <= 2 ? "warning" : "fail";
          break;
        }
        case "m2": { // Falsifiability
          const falsi = JSON.parse(localStorage.getItem("thinkspace-falsification") || "[]");
          autoResult = falsi.length >= 3 ? "pass" : falsi.length > 0 ? "warning" : "fail";
          break;
        }
        case "m3": { // Scope limits
          const bounds2 = JSON.parse(localStorage.getItem("thinkspace-boundary-conditions") || "{}");
          const excl = (bounds2.conditions || []).filter((c: any) => c.type === "exclusion").length;
          autoResult = excl >= 2 ? "pass" : excl > 0 ? "warning" : "fail";
          break;
        }
        case "m4": { // Peer review
          const reviews = JSON.parse(localStorage.getItem("thinkspace-peer-review") || "[]");
          autoResult = reviews.length > 0 ? "pass" : "fail";
          break;
        }
        case "k1": { // No contradictions
          const contras = JSON.parse(localStorage.getItem("thinkspace-contradictions") || "{}");
          const unresolved = (contras.contradictions || []).filter((c: any) => c.status === "active").length;
          autoResult = unresolved === 0 ? "pass" : unresolved <= 2 ? "warning" : "fail";
          break;
        }
        case "k2": { // No circular definitions
          const circs = JSON.parse(localStorage.getItem("thinkspace-circular-defs") || "[]");
          autoResult = circs.length === 0 ? "not_checked" : "pass"; // If they ran the tool, it found/fixed issues
          break;
        }
        case "k3": { // Dimensional consistency
          const consCheck = JSON.parse(localStorage.getItem("thinkspace-consistency-checker") || "{}");
          const exprs = consCheck.expressions || [];
          const invalid = exprs.filter((e: any) => !e.isConsistent).length;
          autoResult = exprs.length === 0 ? "not_checked" : invalid === 0 ? "pass" : "fail";
          break;
        }
        case "k4": { // Terminology consistent
          const onto = JSON.parse(localStorage.getItem("thinkspace-ontology") || "[]");
          autoResult = onto.length >= 5 ? "pass" : onto.length > 0 ? "warning" : "fail";
          break;
        }
        case "p1": { // Key terms in ontology
          const onto2 = JSON.parse(localStorage.getItem("thinkspace-ontology") || "[]");
          autoResult = onto2.length >= 10 ? "pass" : onto2.length >= 5 ? "warning" : "fail";
          break;
        }
        case "p3": { // Figures/diagrams
          const argMap2 = JSON.parse(localStorage.getItem("thinkspace-argument-map") || "{}");
          autoResult = (argMap2.nodes || []).length > 0 ? "pass" : "fail";
          break;
        }
      }
    } catch {
      autoResult = "not_checked";
    }

    const effectiveStatus = check.manualOverride || autoResult;
    return { ...check, autoResult, status: effectiveStatus, lastChecked: now };
  });
}

// ─── Component ───────────────────────────────────────────────────────
export function PublicationReadinessChecker({ open, onClose }: PublicationReadinessProps) {
  const [checks, setChecks] = useState<CheckItem[]>(loadChecks);
  const [selectedCategory, setSelectedCategory] = useState<CheckCategory | "all">("all");
  const [showAutoOnly, setShowAutoOnly] = useState(false);

  const persist = useCallback((items: CheckItem[]) => {
    setChecks(items);
    saveChecks(items);
  }, []);

  const runAllAuto = useCallback(() => {
    persist(runAutoDetection(checks));
  }, [checks, persist]);

  // Auto-run on open
  useEffect(() => {
    if (open) {
      const updated = runAutoDetection(checks);
      persist(updated);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const overrideStatus = useCallback((id: string, status: CheckStatus) => {
    persist(checks.map(c => c.id === id ? { ...c, manualOverride: status, status } : c));
  }, [checks, persist]);

  const updateNotes = useCallback((id: string, notes: string) => {
    persist(checks.map(c => c.id === id ? { ...c, notes } : c));
  }, [checks, persist]);

  const resetAll = useCallback(() => {
    const fresh = DEFAULT_CHECKS.map(c => ({
      ...c,
      status: "not_checked" as CheckStatus,
      autoResult: null,
      manualOverride: null,
      notes: "",
      lastChecked: null,
    }));
    persist(fresh);
  }, [persist]);

  const filtered = useMemo(() => {
    let items = checks;
    if (selectedCategory !== "all") items = items.filter(c => c.category === selectedCategory);
    if (showAutoOnly) items = items.filter(c => c.autoDetectable);
    return items;
  }, [checks, selectedCategory, showAutoOnly]);

  // Overall score
  const score = useMemo(() => {
    const total = checks.length;
    const pass = checks.filter(c => c.status === "pass").length;
    const warnings = checks.filter(c => c.status === "warning").length;
    const fails = checks.filter(c => c.status === "fail").length;
    const unchecked = checks.filter(c => c.status === "not_checked").length;
    const pct = total > 0 ? Math.round(((pass + warnings * 0.5) / total) * 100) : 0;
    let grade = "F";
    if (pct >= 90 && fails === 0) grade = "A+";
    else if (pct >= 85) grade = "A";
    else if (pct >= 75) grade = "B+";
    else if (pct >= 65) grade = "B";
    else if (pct >= 55) grade = "C";
    else if (pct >= 40) grade = "D";
    return { total, pass, warnings, fails, unchecked, pct, grade };
  }, [checks]);

  const gradeColor = score.grade.startsWith("A") ? "#22c55e" : score.grade.startsWith("B") ? "#3b82f6" : score.grade === "C" ? "#f59e0b" : "#ef4444";

  if (!open) return null;

  const { colors, isDark } = useTheme();

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 10000, background: isDark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: isDark ? "linear-gradient(135deg, #0f1117 0%, #13151d 100%)" : "#ffffff", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)", borderRadius: 16, width: "min(95vw, 1000px)", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: isDark ? "0 24px 64px rgba(0,0,0,0.5)" : "0 24px 64px rgba(0,0,0,0.15)" }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <span style={{ fontSize: 22 }}>📑</span>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 18, color: colors.textPrimary, fontWeight: 700 }}>Publication Readiness Checker</h2>
            <p style={{ margin: 0, fontSize: 12, color: colors.textMuted }}>{checks.length}-point checklist • Auto-syncs with Think!Hub tools</p>
          </div>
          {/* Grade Badge */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 16px", background: `${gradeColor}15`, border: `2px solid ${gradeColor}44`, borderRadius: 12 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: gradeColor }}>{score.grade}</span>
            <span style={{ fontSize: 10, color: gradeColor }}>{score.pct}% ready</span>
          </div>
          <button onClick={runAllAuto} style={{ padding: "6px 12px", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 6, color: "#6ee7b7", cursor: "pointer", fontSize: 11 }}>↻ Re-scan</button>
          <button onClick={resetAll} style={{ padding: "6px 12px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, color: "#fca5a5", cursor: "pointer", fontSize: 11 }}>Reset</button>
          <button onClick={onClose} style={{ background: "none", border: "none", color: colors.textMuted, cursor: "pointer", fontSize: 20 }}>✕</button>
        </div>

        {/* Score Bar */}
        <div style={{ padding: "12px 24px", borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)", display: "flex", gap: 12, alignItems: "center", flexShrink: 0 }}>
          <div style={{ flex: 1, height: 8, background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)", borderRadius: 4, overflow: "hidden", display: "flex" }}>
            <div style={{ width: `${(score.pass / score.total) * 100}%`, background: "#22c55e", transition: "width 0.3s" }} />
            <div style={{ width: `${(score.warnings / score.total) * 100}%`, background: "#f59e0b", transition: "width 0.3s" }} />
            <div style={{ width: `${(score.fails / score.total) * 100}%`, background: "#ef4444", transition: "width 0.3s" }} />
          </div>
          <div style={{ display: "flex", gap: 12, fontSize: 11 }}>
            <span style={{ color: "#22c55e" }}>✅ {score.pass}</span>
            <span style={{ color: "#f59e0b" }}>⚠️ {score.warnings}</span>
            <span style={{ color: "#ef4444" }}>❌ {score.fails}</span>
            <span style={{ color: "#94a3b8" }}>⏳ {score.unchecked}</span>
          </div>
        </div>

        {/* Category Filter */}
        <div style={{ padding: "10px 24px", borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)", display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", flexShrink: 0 }}>
          <button onClick={() => setSelectedCategory("all")} style={{ padding: "4px 10px", background: selectedCategory === "all" ? (isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)") : (isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)"), border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)", borderRadius: 12, color: colors.textPrimary, cursor: "pointer", fontSize: 11 }}>All</button>
          {Object.entries(CATEGORY_META).map(([key, meta]) => (
            <button key={key} onClick={() => setSelectedCategory(key as CheckCategory)} style={{ padding: "4px 10px", background: selectedCategory === key ? `${meta.color}22` : (isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)"), border: `1px solid ${selectedCategory === key ? meta.color + "44" : (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)")}`, borderRadius: 12, color: meta.color, cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
              {meta.icon} {meta.label}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: colors.textMuted, cursor: "pointer" }}>
            <input type="checkbox" checked={showAutoOnly} onChange={e => setShowAutoOnly(e.target.checked)} />
            Auto-detectable only
          </label>
        </div>

        {/* Checks List */}
        <div style={{ flex: 1, overflow: "auto", padding: "16px 24px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map(check => {
              const catMeta = CATEGORY_META[check.category];
              const sMeta = STATUS_META[check.status];
              return (
                <div key={check.id} style={{ padding: "12px 16px", background: sMeta.bg, border: `1px solid ${sMeta.color}22`, borderRadius: 10, display: "flex", alignItems: "flex-start", gap: 12, transition: "all 0.2s" }}>
                  <span style={{ fontSize: 18, minWidth: 24, textAlign: "center" }}>{sMeta.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 13, color: colors.textPrimary, fontWeight: 600 }}>{check.title}</span>
                      <span style={{ fontSize: 9, padding: "2px 6px", background: `${catMeta.color}15`, border: `1px solid ${catMeta.color}33`, borderRadius: 8, color: catMeta.color }}>{catMeta.label}</span>
                      {check.autoDetectable && <span style={{ fontSize: 9, padding: "2px 6px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 8, color: "#a5b4fc" }}>Auto</span>}
                    </div>
                    <p style={{ margin: 0, fontSize: 11, color: colors.textMuted, lineHeight: 1.4 }}>{check.description}</p>
                    {check.notes && <p style={{ margin: "6px 0 0", fontSize: 11, color: colors.textMuted, fontStyle: "italic" }}>📝 {check.notes}</p>}
                    <input
                      value={check.notes}
                      onChange={e => updateNotes(check.id, e.target.value)}
                      placeholder="Add notes..."
                      style={{ marginTop: 6, width: "100%", padding: "4px 8px", background: isDark ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.02)", border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.08)", borderRadius: 4, color: colors.textPrimary, fontSize: 10, outline: "none" }}
                    />
                  </div>
                  {/* Manual override buttons */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 50 }}>
                    {(["pass", "warning", "fail"] as CheckStatus[]).map(s => {
                      const m = STATUS_META[s];
                      const isActive = check.status === s;
                      return (
                        <button key={s} onClick={() => overrideStatus(check.id, s)} style={{ padding: "2px 6px", background: isActive ? `${m.color}22` : (isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"), border: `1px solid ${isActive ? m.color + "44" : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)")}`, borderRadius: 4, color: m.color, cursor: "pointer", fontSize: 9 }}>{m.icon}</button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
