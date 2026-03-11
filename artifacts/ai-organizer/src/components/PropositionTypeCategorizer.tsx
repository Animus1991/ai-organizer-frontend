// src/components/PropositionTypeCategorizer.tsx
// Proposition Type Categorizer — auto-categorize claims by epistemological domain
import { useState, useMemo, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";

// ─── Types ───────────────────────────────────────────────────────────
type PropositionType =
  | "philosophical"
  | "physical"
  | "psychological"
  | "economic"
  | "methodological"
  | "mathematical"
  | "sociological"
  | "biological"
  | "technological"
  | "uncategorized";

interface Proposition {
  id: string;
  text: string;
  manualType: PropositionType | null;
  autoType: PropositionType;
  confidence: number;
  notes: string;
  tags: string[];
  createdAt: string;
}

interface PropositionTypeCatProps {
  open: boolean;
  onClose: () => void;
}

// ─── Constants ───────────────────────────────────────────────────────
const STORAGE_KEY = "thinkspace-proposition-types";

const TYPE_META: Record<PropositionType, { icon: string; color: string; bg: string; label: string; description: string }> = {
  philosophical:   { icon: "🏛️", color: "#a78bfa", bg: "rgba(167,139,250,0.08)", label: "Philosophical",   description: "Ontological, epistemological, or normative claims about the nature of reality, knowledge, or values" },
  physical:        { icon: "⚛️", color: "#60a5fa", bg: "rgba(96,165,250,0.08)",  label: "Physical",        description: "Claims about physical laws, forces, energy, matter, or natural phenomena" },
  psychological:   { icon: "🧠", color: "#f472b6", bg: "rgba(244,114,182,0.08)", label: "Psychological",   description: "Claims about cognition, behavior, perception, motivation, or mental processes" },
  economic:        { icon: "📈", color: "#34d399", bg: "rgba(52,211,153,0.08)",  label: "Economic",        description: "Claims about markets, value, exchange, production, or resource allocation" },
  methodological:  { icon: "🔬", color: "#fbbf24", bg: "rgba(251,191,36,0.08)", label: "Methodological",  description: "Claims about methods, procedures, measurement approaches, or research design" },
  mathematical:    { icon: "∑",  color: "#818cf8", bg: "rgba(129,140,248,0.08)", label: "Mathematical",    description: "Formal propositions, equations, proofs, or quantitative relationships" },
  sociological:    { icon: "👥", color: "#fb923c", bg: "rgba(251,146,60,0.08)",  label: "Sociological",    description: "Claims about social structures, institutions, collective behavior, or cultural phenomena" },
  biological:      { icon: "🧬", color: "#4ade80", bg: "rgba(74,222,128,0.08)",  label: "Biological",      description: "Claims about living systems, evolution, genetics, or biological processes" },
  technological:   { icon: "⚙️", color: "#22d3ee", bg: "rgba(34,211,238,0.08)", label: "Technological",   description: "Claims about tools, systems, engineering, computation, or technical capabilities" },
  uncategorized:   { icon: "❓", color: "#94a3b8", bg: "rgba(148,163,184,0.08)", label: "Uncategorized",   description: "Not yet categorized — requires manual classification" },
};

// ─── Keyword-based auto-detection ────────────────────────────────────
const TYPE_KEYWORDS: Record<PropositionType, string[]> = {
  philosophical:  ["ontology", "epistemology", "metaphysics", "being", "existence", "truth", "reality", "consciousness", "essence", "phenomenology", "hermeneutic", "dialectic", "a priori", "a posteriori", "transcendental", "normative", "ethics", "morality", "axiology", "teleology", "deontological", "virtue", "ought", "meaning", "purpose", "free will", "determinism", "dualism", "monism", "realism", "idealism", "pragmatism", "relativism", "objectivism", "subjectivism"],
  physical:       ["energy", "entropy", "thermodynamic", "force", "mass", "velocity", "quantum", "wave", "particle", "field", "gravity", "electromagnetic", "temperature", "pressure", "volume", "equilibrium", "conservation", "momentum", "acceleration", "frequency", "amplitude", "radiation", "atom", "molecule", "electron", "photon", "relativity", "spacetime", "dimension", "phase transition", "dissipation"],
  psychological:  ["cognition", "perception", "motivation", "behavior", "emotion", "memory", "attention", "learning", "decision", "bias", "heuristic", "cognitive", "affect", "personality", "consciousness", "unconscious", "schema", "mental model", "intelligence", "creativity", "stress", "anxiety", "depression", "wellbeing", "resilience", "attachment", "self-efficacy", "metacognition", "mindset"],
  economic:       ["market", "price", "demand", "supply", "utility", "cost", "profit", "value", "exchange", "production", "consumption", "investment", "capital", "labor", "scarcity", "allocation", "efficiency", "equilibrium", "externality", "monopoly", "competition", "gdp", "inflation", "interest rate", "fiscal", "monetary", "trade", "commodity", "asset", "risk", "return", "optimization"],
  methodological: ["method", "methodology", "measurement", "experiment", "hypothesis", "variable", "control", "sample", "data", "analysis", "statistical", "qualitative", "quantitative", "validity", "reliability", "replicability", "falsifiability", "operationalization", "instrument", "protocol", "systematic", "meta-analysis", "randomized", "double-blind", "longitudinal", "cross-sectional", "survey", "interview", "observation"],
  mathematical:   ["equation", "theorem", "proof", "integral", "derivative", "function", "matrix", "vector", "topology", "algebra", "calculus", "probability", "statistics", "distribution", "convergence", "divergence", "differential", "stochastic", "linear", "nonlinear", "optimization", "constraint", "boundary", "eigenvalue", "manifold", "tensor", "group theory", "set theory", "logic", "axiom"],
  sociological:   ["society", "institution", "culture", "norm", "role", "stratification", "inequality", "power", "class", "gender", "race", "ethnicity", "community", "collective", "social", "organization", "bureaucracy", "legitimacy", "deviance", "socialization", "identity", "discourse", "hegemony", "agency", "structure", "network", "globalization", "urbanization", "migration"],
  biological:     ["gene", "protein", "cell", "organism", "evolution", "natural selection", "mutation", "adaptation", "ecosystem", "biodiversity", "metabolism", "homeostasis", "dna", "rna", "mitosis", "meiosis", "phenotype", "genotype", "species", "taxonomy", "symbiosis", "predation", "competition", "niche", "population", "ecology"],
  technological:  ["algorithm", "software", "hardware", "network", "system", "automation", "computation", "digital", "artificial intelligence", "machine learning", "data processing", "interface", "protocol", "architecture", "platform", "scalability", "optimization", "sensor", "actuator", "robotics", "blockchain", "encryption", "bandwidth"],
  uncategorized:  [],
};

function generateId(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

function autoDetectType(text: string): { type: PropositionType; confidence: number } {
  const lower = text.toLowerCase();
  const scores: Record<PropositionType, number> = {} as any;
  let maxScore = 0;
  let maxType: PropositionType = "uncategorized";

  for (const [type, keywords] of Object.entries(TYPE_KEYWORDS)) {
    if (type === "uncategorized") continue;
    let score = 0;
    let matchCount = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        score += kw.split(" ").length; // multi-word keywords score higher
        matchCount++;
      }
    }
    scores[type as PropositionType] = score;
    if (score > maxScore) {
      maxScore = score;
      maxType = type as PropositionType;
    }
  }

  // Calculate confidence based on how dominant the top category is
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = totalScore > 0 ? Math.min(0.95, (maxScore / totalScore) * 0.8 + 0.15) : 0;

  return { type: maxScore > 0 ? maxType : "uncategorized", confidence };
}

function loadPropositions(): Proposition[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function savePropositions(props: Proposition[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(props));
}

// ─── Component ───────────────────────────────────────────────────────
export function PropositionTypeCategorizer({ open, onClose }: PropositionTypeCatProps) {
  const [propositions, setPropositions] = useState<Proposition[]>(loadPropositions);
  const [newText, setNewText] = useState("");
  const [filterType, setFilterType] = useState<PropositionType | "all">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [showBulk, setShowBulk] = useState(false);

  const persist = useCallback((items: Proposition[]) => {
    setPropositions(items);
    savePropositions(items);
  }, []);

  const addProposition = useCallback(() => {
    if (!newText.trim()) return;
    const { type, confidence } = autoDetectType(newText.trim());
    const prop: Proposition = {
      id: generateId(),
      text: newText.trim(),
      manualType: null,
      autoType: type,
      confidence,
      notes: "",
      tags: [],
      createdAt: new Date().toISOString(),
    };
    persist([prop, ...propositions]);
    setNewText("");
  }, [newText, propositions, persist]);

  const bulkAdd = useCallback(() => {
    if (!bulkText.trim()) return;
    const lines = bulkText.split("\n").filter(l => l.trim());
    const newProps = lines.map(line => {
      const { type, confidence } = autoDetectType(line.trim());
      return {
        id: generateId(),
        text: line.trim(),
        manualType: null as PropositionType | null,
        autoType: type,
        confidence,
        notes: "",
        tags: [],
        createdAt: new Date().toISOString(),
      };
    });
    persist([...newProps, ...propositions]);
    setBulkText("");
    setShowBulk(false);
  }, [bulkText, propositions, persist]);

  const updateType = useCallback((id: string, type: PropositionType) => {
    persist(propositions.map(p => p.id === id ? { ...p, manualType: type } : p));
  }, [propositions, persist]);

  const removeProposition = useCallback((id: string) => {
    persist(propositions.filter(p => p.id !== id));
  }, [propositions, persist]);

  const updateNotes = useCallback((id: string, notes: string) => {
    persist(propositions.map(p => p.id === id ? { ...p, notes } : p));
  }, [propositions, persist]);

  const reAnalyze = useCallback(() => {
    persist(propositions.map(p => {
      const { type, confidence } = autoDetectType(p.text);
      return { ...p, autoType: type, confidence };
    }));
  }, [propositions, persist]);

  const filtered = useMemo(() => {
    if (filterType === "all") return propositions;
    return propositions.filter(p => (p.manualType || p.autoType) === filterType);
  }, [propositions, filterType]);

  // Stats
  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of propositions) {
      const t = p.manualType || p.autoType;
      counts[t] = (counts[t] || 0) + 1;
    }
    return counts;
  }, [propositions]);

  if (!open) return null;

  const { colors, isDark } = useTheme();

  const overlayStyle: React.CSSProperties = {
    position: "fixed", inset: 0, zIndex: 10000,
    background: isDark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)",
    display: "flex", alignItems: "center", justifyContent: "center",
  };

  const modalStyle: React.CSSProperties = {
    background: isDark ? "linear-gradient(135deg, #0f1117 0%, #13151d 100%)" : "#ffffff",
    border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)", borderRadius: 16,
    width: "min(95vw, 1000px)", maxHeight: "90vh",
    display: "flex", flexDirection: "column", overflow: "hidden",
    boxShadow: isDark ? "0 24px 64px rgba(0,0,0,0.5)" : "0 24px 64px rgba(0,0,0,0.15)",
  };

  const headerStyle: React.CSSProperties = {
    padding: "20px 24px", borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)",
    display: "flex", alignItems: "center", gap: 12, flexShrink: 0,
  };

  const inputStyle: React.CSSProperties = {
    flex: 1, padding: "8px 12px",
    background: isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.02)", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)",
    borderRadius: 6, color: colors.textPrimary, fontSize: 12, outline: "none",
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={headerStyle}>
          <span style={{ fontSize: 22 }}>🏷️</span>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 18, color: colors.textPrimary, fontWeight: 700 }}>Proposition Type Categorizer</h2>
            <p style={{ margin: 0, fontSize: 12, color: colors.textMuted }}>Auto-classify claims by epistemological domain • {propositions.length} propositions</p>
          </div>
          <button onClick={() => setShowGuide(!showGuide)} style={{ padding: "6px 12px", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 6, color: "#a5b4fc", cursor: "pointer", fontSize: 11 }}>
            {showGuide ? "Hide" : "Guide"}
          </button>
          <button onClick={reAnalyze} style={{ padding: "6px 12px", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 6, color: "#6ee7b7", cursor: "pointer", fontSize: 11 }}>
            ↻ Re-analyze All
          </button>
          <button onClick={onClose} style={{ background: "none", border: "none", color: colors.textMuted, cursor: "pointer", fontSize: 20 }}>✕</button>
        </div>

        {/* Guide Panel */}
        {showGuide && (
          <div style={{ padding: "16px 24px", borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)", background: "rgba(99,102,241,0.04)", maxHeight: 200, overflow: "auto" }}>
            <p style={{ margin: "0 0 8px", fontSize: 13, color: "#c4b5fd", fontWeight: 600 }}>Category Definitions:</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 8 }}>
              {Object.entries(TYPE_META).filter(([k]) => k !== "uncategorized").map(([key, meta]) => (
                <div key={key} style={{ display: "flex", gap: 8, padding: 8, background: meta.bg, borderRadius: 6, fontSize: 11 }}>
                  <span>{meta.icon}</span>
                  <div>
                    <span style={{ color: meta.color, fontWeight: 600 }}>{meta.label}</span>
                    <p style={{ margin: "2px 0 0", color: colors.textMuted, fontSize: 10, lineHeight: 1.4 }}>{meta.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div style={{ padding: "16px 24px", borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={newText}
              onChange={e => setNewText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addProposition()}
              placeholder="Enter a proposition or claim to categorize..."
              style={inputStyle}
            />
            <button onClick={addProposition} style={{ padding: "10px 18px", background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 8, color: "#a5b4fc", cursor: "pointer", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>
              + Categorize
            </button>
            <button onClick={() => setShowBulk(!showBulk)} style={{ padding: "10px 12px", background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 8, color: "#fcd34d", cursor: "pointer", fontSize: 11 }}>
              Bulk
            </button>
          </div>
          {showBulk && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <textarea
                value={bulkText}
                onChange={e => setBulkText(e.target.value)}
                placeholder="Paste multiple propositions (one per line)..."
                rows={4}
                style={inputStyle}
              />
              <button onClick={bulkAdd} style={{ padding: "8px 16px", background: "rgba(245,158,11,0.2)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 6, color: "#fcd34d", cursor: "pointer", fontSize: 12, alignSelf: "flex-end" }}>
                Categorize All Lines
              </button>
            </div>
          )}
        </div>

        {/* Stats Bar */}
        {propositions.length > 0 && (
          <div style={{ padding: "10px 24px", borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)", display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", flexShrink: 0 }}>
            <button
              onClick={() => setFilterType("all")}
              style={{ padding: "4px 10px", background: filterType === "all" ? (isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)") : (isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)"), border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)", borderRadius: 12, color: colors.textPrimary, cursor: "pointer", fontSize: 11 }}
            >
              All ({propositions.length})
            </button>
            {Object.entries(stats).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
              const meta = TYPE_META[type as PropositionType];
              return (
                <button
                  key={type}
                  onClick={() => setFilterType(type as PropositionType)}
                  style={{
                    padding: "4px 10px",
                    background: filterType === type ? `${meta.color}22` : (isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)"),
                    border: `1px solid ${filterType === type ? meta.color + "44" : (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)")}`,
                    borderRadius: 12, color: meta.color, cursor: "pointer", fontSize: 11,
                    display: "flex", alignItems: "center", gap: 4,
                  }}
                >
                  {meta.icon} {meta.label} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Propositions List */}
        <div style={{ flex: 1, overflow: "auto", padding: "16px 24px" }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: colors.textMuted }}>
              <p style={{ fontSize: 36, margin: "0 0 12px" }}>🏷️</p>
              <p style={{ fontSize: 14, margin: 0, color: colors.textMuted }}>No propositions yet. Add one above to begin categorization.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filtered.map(prop => {
                const effectiveType = prop.manualType || prop.autoType;
                const meta = TYPE_META[effectiveType];
                const isEditing = editingId === prop.id;
                return (
                  <div key={prop.id} style={{ padding: "14px 16px", background: meta.bg, border: `1px solid ${meta.color}22`, borderRadius: 10, transition: "all 0.2s" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      {/* Badge */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 56 }}>
                        <span style={{ fontSize: 20 }}>{meta.icon}</span>
                        <span style={{ fontSize: 9, color: meta.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>{meta.label}</span>
                        {!prop.manualType && (
                          <span style={{ fontSize: 9, color: colors.textMuted, fontStyle: "italic" }}>
                            {Math.round(prop.confidence * 100)}% conf
                          </span>
                        )}
                        {prop.manualType && (
                          <span style={{ fontSize: 8, color: "#6ee7b7", fontWeight: 600 }}>MANUAL</span>
                        )}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: "0 0 6px", fontSize: 13, color: colors.textPrimary, lineHeight: 1.5 }}>{prop.text}</p>

                        {/* Category selector */}
                        {isEditing && (
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
                            {Object.entries(TYPE_META).map(([key, m]) => (
                              <button
                                key={key}
                                onClick={() => { updateType(prop.id, key as PropositionType); setEditingId(null); }}
                                style={{
                                  padding: "3px 8px", fontSize: 10, borderRadius: 10,
                                  background: effectiveType === key ? `${m.color}33` : (isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)"),
                                  border: `1px solid ${effectiveType === key ? m.color : (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)")}`,
                                  color: m.color, cursor: "pointer",
                                }}
                              >
                                {m.icon} {m.label}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Notes */}
                        {isEditing && (
                          <textarea
                            value={prop.notes}
                            onChange={e => updateNotes(prop.id, e.target.value)}
                            placeholder="Add notes about this categorization..."
                            rows={2}
                            style={{ width: "100%", padding: "6px 10px", background: isDark ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.02)", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)", borderRadius: 6, color: colors.textPrimary, fontSize: 11, resize: "vertical", outline: "none" }}
                          />
                        )}
                        {!isEditing && prop.notes && (
                          <p style={{ margin: 0, fontSize: 11, color: colors.textMuted, fontStyle: "italic" }}>💬 {prop.notes}</p>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{ display: "flex", gap: 4 }}>
                        <button
                          onClick={() => setEditingId(isEditing ? null : prop.id)}
                          style={{ padding: "4px 8px", background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)", borderRadius: 4, color: colors.textMuted, cursor: "pointer", fontSize: 10 }}
                        >
                          {isEditing ? "Done" : "Edit"}
                        </button>
                        <button
                          onClick={() => removeProposition(prop.id)}
                          style={{ padding: "4px 8px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 4, color: "#fca5a5", cursor: "pointer", fontSize: 10 }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
