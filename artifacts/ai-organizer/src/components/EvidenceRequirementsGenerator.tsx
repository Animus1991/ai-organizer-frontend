// src/components/EvidenceRequirementsGenerator.tsx
// Evidence Requirements Generator — auto-generate evidence tasks per claim
import { useState, useMemo, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";

// ─── Types ───────────────────────────────────────────────────────────
type EvidenceType = "empirical" | "statistical" | "experimental" | "theoretical" | "testimonial" | "documentary" | "computational";
type Priority = "critical" | "high" | "medium" | "low";
type RequirementStatus = "pending" | "in_progress" | "found" | "insufficient" | "unavailable";

interface EvidenceRequirement {
  id: string;
  claimText: string;
  requirement: string;
  type: EvidenceType;
  priority: Priority;
  status: RequirementStatus;
  source: string;
  notes: string;
  createdAt: string;
  completedAt: string | null;
}

interface EvidenceRequirementsProps {
  open: boolean;
  onClose: () => void;
}

// ─── Constants ───────────────────────────────────────────────────────
const STORAGE_KEY = "thinkspace-evidence-requirements";

const TYPE_META: Record<EvidenceType, { icon: string; color: string; label: string }> = {
  empirical:     { icon: "📊", color: "#60a5fa", label: "Empirical Data" },
  statistical:   { icon: "📈", color: "#34d399", label: "Statistical Analysis" },
  experimental:  { icon: "🧪", color: "#f472b6", label: "Experimental" },
  theoretical:   { icon: "📐", color: "#a78bfa", label: "Theoretical Proof" },
  testimonial:   { icon: "🗣️", color: "#fbbf24", label: "Expert Testimony" },
  documentary:   { icon: "📄", color: "#fb923c", label: "Documentary" },
  computational: { icon: "💻", color: "#22d3ee", label: "Computational" },
};

const PRIORITY_META: Record<Priority, { icon: string; color: string; label: string }> = {
  critical: { icon: "🔴", color: "#ef4444", label: "Critical" },
  high:     { icon: "🟠", color: "#f97316", label: "High" },
  medium:   { icon: "🟡", color: "#eab308", label: "Medium" },
  low:      { icon: "🟢", color: "#22c55e", label: "Low" },
};

const STATUS_META: Record<RequirementStatus, { icon: string; color: string; label: string }> = {
  pending:       { icon: "⏳", color: "#94a3b8", label: "Pending" },
  in_progress:   { icon: "🔄", color: "#3b82f6", label: "In Progress" },
  found:         { icon: "✅", color: "#22c55e", label: "Found" },
  insufficient:  { icon: "⚠️", color: "#f59e0b", label: "Insufficient" },
  unavailable:   { icon: "❌", color: "#ef4444", label: "Unavailable" },
};

// ─── Auto-generation templates ───────────────────────────────────────
const CLAIM_PATTERNS: { pattern: RegExp; requirements: { template: string; type: EvidenceType; priority: Priority }[] }[] = [
  {
    pattern: /\b(increases?|decreases?|raises?|lowers?|affects?|impacts?|influences?|causes?|leads?\s+to)\b/i,
    requirements: [
      { template: "Quantitative data showing the causal relationship", type: "empirical", priority: "critical" },
      { template: "Statistical significance test (p-value, confidence interval)", type: "statistical", priority: "high" },
      { template: "Control for confounding variables", type: "experimental", priority: "high" },
    ],
  },
  {
    pattern: /\b(always|never|all|every|no\s+\w+\s+can|universal)\b/i,
    requirements: [
      { template: "Counter-example search to test universality", type: "empirical", priority: "critical" },
      { template: "Boundary conditions where claim may not hold", type: "theoretical", priority: "high" },
    ],
  },
  {
    pattern: /\b(correlated?|relationship|association|linked|connected)\b/i,
    requirements: [
      { template: "Correlation coefficient and sample size", type: "statistical", priority: "critical" },
      { template: "Scatter plot or regression analysis", type: "computational", priority: "high" },
      { template: "Check for spurious correlation", type: "statistical", priority: "medium" },
    ],
  },
  {
    pattern: /\b(predict|forecast|expect|project|anticipate)\b/i,
    requirements: [
      { template: "Historical data for backtesting predictions", type: "empirical", priority: "critical" },
      { template: "Confidence intervals for predictions", type: "statistical", priority: "high" },
      { template: "Comparison with null/baseline model", type: "computational", priority: "medium" },
    ],
  },
  {
    pattern: /\b(define|definition|means|refers\s+to|is\s+defined\s+as)\b/i,
    requirements: [
      { template: "Established definitions from domain literature", type: "documentary", priority: "high" },
      { template: "Expert consensus on terminology", type: "testimonial", priority: "medium" },
    ],
  },
  {
    pattern: /\b(equation|formula|model|function|f\(|=\s*\d)\b/i,
    requirements: [
      { template: "Mathematical derivation or proof", type: "theoretical", priority: "critical" },
      { template: "Dimensional analysis verification", type: "computational", priority: "high" },
      { template: "Numerical validation against known cases", type: "computational", priority: "high" },
    ],
  },
  {
    pattern: /\b(should|ought|must|need\s+to|important\s+that|necessary)\b/i,
    requirements: [
      { template: "Empirical basis for normative claim", type: "empirical", priority: "high" },
      { template: "Ethical framework justification", type: "documentary", priority: "medium" },
    ],
  },
];

function generateId(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

function autoGenerateRequirements(claimText: string): Omit<EvidenceRequirement, "id" | "createdAt" | "completedAt" | "source" | "notes">[] {
  const reqs: Omit<EvidenceRequirement, "id" | "createdAt" | "completedAt" | "source" | "notes">[] = [];
  const seenTemplates = new Set<string>();

  for (const { pattern, requirements } of CLAIM_PATTERNS) {
    if (pattern.test(claimText)) {
      for (const r of requirements) {
        if (!seenTemplates.has(r.template)) {
          seenTemplates.add(r.template);
          reqs.push({ claimText, requirement: r.template, type: r.type, priority: r.priority, status: "pending" });
        }
      }
    }
  }

  // Default if no pattern matched
  if (reqs.length === 0) {
    reqs.push(
      { claimText, requirement: "Primary source or reference for this claim", type: "documentary", priority: "high", status: "pending" },
      { claimText, requirement: "Supporting data or evidence", type: "empirical", priority: "medium", status: "pending" },
    );
  }

  return reqs;
}

function loadRequirements(): EvidenceRequirement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveRequirements(reqs: EvidenceRequirement[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reqs));
}

// ─── Component ───────────────────────────────────────────────────────
export function EvidenceRequirementsGenerator({ open, onClose }: EvidenceRequirementsProps) {
  const [requirements, setRequirements] = useState<EvidenceRequirement[]>(loadRequirements);
  const [claimInput, setClaimInput] = useState("");
  const [filterStatus, setFilterStatus] = useState<RequirementStatus | "all">("all");
  const [filterPriority, setFilterPriority] = useState<Priority | "all">("all");
  const [expandedClaim, setExpandedClaim] = useState<string | null>(null);

  const persist = useCallback((items: EvidenceRequirement[]) => {
    setRequirements(items);
    saveRequirements(items);
  }, []);

  const generateForClaim = useCallback(() => {
    if (!claimInput.trim()) return;
    const autoReqs = autoGenerateRequirements(claimInput.trim());
    const newReqs: EvidenceRequirement[] = autoReqs.map(r => ({
      ...r,
      id: generateId(),
      source: "",
      notes: "",
      createdAt: new Date().toISOString(),
      completedAt: null,
    }));
    persist([...newReqs, ...requirements]);
    setClaimInput("");
  }, [claimInput, requirements, persist]);

  const addManualReq = useCallback((claimText: string) => {
    const req: EvidenceRequirement = {
      id: generateId(),
      claimText,
      requirement: "Custom evidence requirement",
      type: "documentary",
      priority: "medium",
      status: "pending",
      source: "",
      notes: "",
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    persist([req, ...requirements]);
  }, [requirements, persist]);

  const updateStatus = useCallback((id: string, status: RequirementStatus) => {
    persist(requirements.map(r => r.id === id ? { ...r, status, completedAt: status === "found" ? new Date().toISOString() : null } : r));
  }, [requirements, persist]);

  const updateField = useCallback((id: string, field: "source" | "notes" | "requirement" | "type" | "priority", value: string) => {
    persist(requirements.map(r => r.id === id ? { ...r, [field]: value } : r));
  }, [requirements, persist]);

  const removeReq = useCallback((id: string) => {
    persist(requirements.filter(r => r.id !== id));
  }, [requirements, persist]);

  const filtered = useMemo(() => {
    return requirements.filter(r => {
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (filterPriority !== "all" && r.priority !== filterPriority) return false;
      return true;
    });
  }, [requirements, filterStatus, filterPriority]);

  // Group by claim
  const groupedByClaim = useMemo(() => {
    const groups = new Map<string, EvidenceRequirement[]>();
    for (const r of filtered) {
      const existing = groups.get(r.claimText) || [];
      existing.push(r);
      groups.set(r.claimText, existing);
    }
    return groups;
  }, [filtered]);

  // Stats
  const stats = useMemo(() => {
    const total = requirements.length;
    const found = requirements.filter(r => r.status === "found").length;
    const critical = requirements.filter(r => r.priority === "critical" && r.status !== "found").length;
    const debtRatio = total > 0 ? ((total - found) / total * 100).toFixed(0) : "0";
    return { total, found, critical, debtRatio };
  }, [requirements]);

  const { isDark, colors } = useTheme();

  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 10000, background: isDark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: isDark ? "linear-gradient(135deg, #0f1117 0%, #13151d 100%)" : "#ffffff", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)", borderRadius: 16, width: "min(95vw, 1050px)", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: isDark ? "0 24px 64px rgba(0,0,0,0.5)" : "0 24px 64px rgba(0,0,0,0.15)" }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <span style={{ fontSize: 22 }}>📋</span>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 18, color: colors.textPrimary, fontWeight: 700 }}>Evidence Requirements Generator</h2>
            <p style={{ margin: 0, fontSize: 12, color: colors.textMuted }}>Auto-generate evidence tasks per claim • Evidence debt: {stats.debtRatio}%</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: colors.textMuted, cursor: "pointer", fontSize: 20 }}>✕</button>
        </div>

        {/* Stats Bar */}
        <div style={{ padding: "12px 24px", borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)", display: "flex", gap: 16, flexShrink: 0 }}>
          {[
            { label: "Total", value: stats.total, color: "#94a3b8" },
            { label: "Found", value: stats.found, color: "#22c55e" },
            { label: "Critical Gaps", value: stats.critical, color: "#ef4444" },
            { label: "Debt Ratio", value: `${stats.debtRatio}%`, color: Number(stats.debtRatio) > 50 ? "#ef4444" : "#22c55e" },
          ].map(s => (
            <div key={s.label} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</span>
              <span style={{ fontSize: 10, color: colors.textMuted }}>{s.label}</span>
            </div>
          ))}
          <div style={{ flex: 1 }} />
          {/* Filters */}
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} style={{ padding: "4px 8px", background: isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.03)", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)", borderRadius: 6, color: colors.textPrimary, fontSize: 11 }}>
            <option value="all">All Status</option>
            {Object.entries(STATUS_META).map(([k, m]) => <option key={k} value={k}>{m.icon} {m.label}</option>)}
          </select>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value as any)} style={{ padding: "4px 8px", background: isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.03)", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)", borderRadius: 6, color: colors.textPrimary, fontSize: 11 }}>
            <option value="all">All Priority</option>
            {Object.entries(PRIORITY_META).map(([k, m]) => <option key={k} value={k}>{m.icon} {m.label}</option>)}
          </select>
        </div>

        {/* Input */}
        <div style={{ padding: "14px 24px", borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)", display: "flex", gap: 8, flexShrink: 0 }}>
          <input
            value={claimInput}
            onChange={e => setClaimInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && generateForClaim()}
            placeholder="Enter a claim to generate evidence requirements..."
            style={{ flex: 1, padding: "10px 14px", background: isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.03)", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)", borderRadius: 8, color: colors.textPrimary, fontSize: 13, outline: "none" }}
          />
          <button onClick={generateForClaim} style={{ padding: "10px 18px", background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 8, color: "#6ee7b7", cursor: "pointer", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>
            ⚡ Generate Requirements
          </button>
        </div>

        {/* Requirements List */}
        <div style={{ flex: 1, overflow: "auto", padding: "16px 24px" }}>
          {groupedByClaim.size === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: colors.textMuted }}>
              <p style={{ fontSize: 36, margin: "0 0 12px" }}>📋</p>
              <p style={{ fontSize: 14, margin: 0 }}>Enter a claim above to auto-generate evidence requirements.</p>
            </div>
          ) : (
            Array.from(groupedByClaim.entries()).map(([claim, reqs]) => {
              const isExpanded = expandedClaim === claim || expandedClaim === null;
              const claimFound = reqs.filter(r => r.status === "found").length;
              const claimTotal = reqs.length;
              return (
                <div key={claim} style={{ marginBottom: 16 }}>
                  <div
                    onClick={() => setExpandedClaim(expandedClaim === claim ? null : claim)}
                    style={{ padding: "10px 14px", background: isDark ? "rgba(99,102,241,0.06)" : "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, marginBottom: isExpanded ? 8 : 0 }}
                  >
                    <span style={{ color: "#a5b4fc", fontSize: 12 }}>{isExpanded ? "▼" : "▶"}</span>
                    <span style={{ flex: 1, color: colors.textPrimary, fontSize: 13, fontWeight: 600 }}>{claim}</span>
                    <span style={{ fontSize: 11, color: claimFound === claimTotal ? "#22c55e" : "#f59e0b" }}>
                      {claimFound}/{claimTotal} resolved
                    </span>
                    <button onClick={(e) => { e.stopPropagation(); addManualReq(claim); }} style={{ padding: "3px 8px", background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)", borderRadius: 4, color: colors.textMuted, cursor: "pointer", fontSize: 10 }}>
                      + Add
                    </button>
                  </div>
                  {isExpanded && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingLeft: 16 }}>
                      {reqs.map(req => {
                        const tMeta = TYPE_META[req.type];
                        const pMeta = PRIORITY_META[req.priority];
                        const sMeta = STATUS_META[req.status];
                        return (
                          <div key={req.id} style={{ padding: "10px 14px", background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)", border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)", borderRadius: 8, display: "flex", alignItems: "center", gap: 10 }}>
                            <span title={tMeta.label} style={{ fontSize: 16 }}>{tMeta.icon}</span>
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: 0, fontSize: 12, color: colors.textPrimary }}>{req.requirement}</p>
                              {req.source && <p style={{ margin: "4px 0 0", fontSize: 10, color: colors.textMuted }}>📎 {req.source}</p>}
                            </div>
                            <span style={{ fontSize: 10, color: pMeta.color, fontWeight: 600 }}>{pMeta.icon} {pMeta.label}</span>
                            <select
                              value={req.status}
                              onChange={e => updateStatus(req.id, e.target.value as RequirementStatus)}
                              style={{ padding: "3px 6px", background: isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.03)", border: `1px solid ${sMeta.color}44`, borderRadius: 4, color: sMeta.color, fontSize: 10, cursor: "pointer" }}
                            >
                              {Object.entries(STATUS_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
                            </select>
                            <input
                              value={req.source}
                              onChange={e => updateField(req.id, "source", e.target.value)}
                              placeholder="Source..."
                              style={{ width: 120, padding: "3px 6px", background: isDark ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.02)", border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)", borderRadius: 4, color: colors.textPrimary, fontSize: 10, outline: "none" }}
                            />
                            <button onClick={() => removeReq(req.id)} style={{ padding: "3px 6px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 4, color: "#fca5a5", cursor: "pointer", fontSize: 10 }}>✕</button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
