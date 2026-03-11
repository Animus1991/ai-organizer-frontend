// src/components/CounterTheoryRegistry.tsx
// Counter-Theory Registry — register and compare competing/alternative theories
import { useState, useMemo, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";

// ─── Types ───────────────────────────────────────────────────────────
type TheoryRelation = "competing" | "complementary" | "subsumes" | "subsumed_by" | "orthogonal";
type ComparisonDimension = "assumptions" | "predictions" | "scope" | "evidence" | "falsifiability" | "parsimony" | "explanatory_power";

interface CounterTheory {
  id: string;
  name: string;
  author: string;
  description: string;
  relation: TheoryRelation;
  keyAssumptions: string[];
  keyPredictions: string[];
  strengths: string[];
  weaknesses: string[];
  divergencePoints: string[];
  references: string[];
  notes: string;
  createdAt: string;
}

interface ComparisonEntry {
  dimension: ComparisonDimension;
  myTheory: string;
  counterTheory: string;
  verdict: "mine_better" | "theirs_better" | "comparable" | "incomparable" | "unknown";
}

interface CounterTheoryRegistryProps {
  open: boolean;
  onClose: () => void;
}

// ─── Constants ───────────────────────────────────────────────────────
const STORAGE_KEY = "thinkspace-counter-theories";

const RELATION_META: Record<TheoryRelation, { icon: string; color: string; label: string; description: string }> = {
  competing:      { icon: "⚔️", color: "#ef4444", label: "Competing",      description: "Directly competes — explains same phenomena differently" },
  complementary:  { icon: "🤝", color: "#22c55e", label: "Complementary",  description: "Addresses different aspects of the same domain" },
  subsumes:       { icon: "⬆️", color: "#3b82f6", label: "Subsumes",       description: "My theory is a generalization of this one" },
  subsumed_by:    { icon: "⬇️", color: "#f59e0b", label: "Subsumed By",    description: "This theory is more general than mine" },
  orthogonal:     { icon: "↗️", color: "#a78bfa", label: "Orthogonal",     description: "Different domain, but potentially relevant" },
};

const DIM_META: Record<ComparisonDimension, { icon: string; label: string }> = {
  assumptions:       { icon: "📌", label: "Core Assumptions" },
  predictions:       { icon: "🔮", label: "Predictions" },
  scope:             { icon: "🌐", label: "Scope" },
  evidence:          { icon: "📊", label: "Empirical Evidence" },
  falsifiability:    { icon: "🧪", label: "Falsifiability" },
  parsimony:         { icon: "✂️", label: "Parsimony" },
  explanatory_power: { icon: "💡", label: "Explanatory Power" },
};

const VERDICT_META: Record<string, { icon: string; color: string; label: string }> = {
  mine_better:  { icon: "✅", color: "#22c55e", label: "Mine Superior" },
  theirs_better: { icon: "⬆️", color: "#f59e0b", label: "Theirs Superior" },
  comparable:    { icon: "⚖️", color: "#3b82f6", label: "Comparable" },
  incomparable:  { icon: "↔️", color: "#a78bfa", label: "Incomparable" },
  unknown:       { icon: "❓", color: "#94a3b8", label: "Not Assessed" },
};

function generateId(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

function loadData(): { theories: CounterTheory[]; comparisons: Record<string, ComparisonEntry[]> } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { theories: [], comparisons: {} };
}

function saveData(data: { theories: CounterTheory[]; comparisons: Record<string, ComparisonEntry[]> }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ─── Component ───────────────────────────────────────────────────────
export function CounterTheoryRegistry({ open, onClose }: CounterTheoryRegistryProps) {
  const [data, setData] = useState(loadData);
  const [selectedTheoryId, setSelectedTheoryId] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "compare" | "add">("list");
  const [form, setForm] = useState({ name: "", author: "", description: "", relation: "competing" as TheoryRelation });
  const [newItem, setNewItem] = useState("");
  const [addingField, setAddingField] = useState<"assumptions" | "predictions" | "strengths" | "weaknesses" | "divergence" | "references" | null>(null);

  const persist = useCallback((newData: typeof data) => {
    setData(newData);
    saveData(newData);
  }, []);

  const addTheory = useCallback(() => {
    if (!form.name.trim()) return;
    const theory: CounterTheory = {
      id: generateId(),
      name: form.name.trim(),
      author: form.author.trim(),
      description: form.description.trim(),
      relation: form.relation,
      keyAssumptions: [],
      keyPredictions: [],
      strengths: [],
      weaknesses: [],
      divergencePoints: [],
      references: [],
      notes: "",
      createdAt: new Date().toISOString(),
    };
    const defaultComparisons: ComparisonEntry[] = Object.keys(DIM_META).map(d => ({
      dimension: d as ComparisonDimension,
      myTheory: "",
      counterTheory: "",
      verdict: "unknown",
    }));
    persist({
      theories: [...data.theories, theory],
      comparisons: { ...data.comparisons, [theory.id]: defaultComparisons },
    });
    setForm({ name: "", author: "", description: "", relation: "competing" });
    setSelectedTheoryId(theory.id);
    setView("compare");
  }, [form, data, persist]);

  const removeTheory = useCallback((id: string) => {
    const newComps = { ...data.comparisons };
    delete newComps[id];
    persist({ theories: data.theories.filter(t => t.id !== id), comparisons: newComps });
    if (selectedTheoryId === id) setSelectedTheoryId(null);
  }, [data, persist, selectedTheoryId]);

  const addListItem = useCallback((theoryId: string, field: string, value: string) => {
    if (!value.trim()) return;
    const fieldMap: Record<string, keyof CounterTheory> = {
      assumptions: "keyAssumptions", predictions: "keyPredictions",
      strengths: "strengths", weaknesses: "weaknesses",
      divergence: "divergencePoints", references: "references",
    };
    const key = fieldMap[field];
    if (!key) return;
    persist({
      ...data,
      theories: data.theories.map(t => t.id === theoryId ? { ...t, [key]: [...(t[key] as string[]), value.trim()] } : t),
    });
    setNewItem("");
  }, [data, persist]);

  const removeListItem = useCallback((theoryId: string, field: string, index: number) => {
    const fieldMap: Record<string, keyof CounterTheory> = {
      assumptions: "keyAssumptions", predictions: "keyPredictions",
      strengths: "strengths", weaknesses: "weaknesses",
      divergence: "divergencePoints", references: "references",
    };
    const key = fieldMap[field];
    if (!key) return;
    persist({
      ...data,
      theories: data.theories.map(t => {
        if (t.id !== theoryId) return t;
        const arr = [...(t[key] as string[])];
        arr.splice(index, 1);
        return { ...t, [key]: arr };
      }),
    });
  }, [data, persist]);

  const updateComparison = useCallback((theoryId: string, dimIdx: number, field: keyof ComparisonEntry, value: string) => {
    const comps = [...(data.comparisons[theoryId] || [])];
    comps[dimIdx] = { ...comps[dimIdx], [field]: value };
    persist({ ...data, comparisons: { ...data.comparisons, [theoryId]: comps } });
  }, [data, persist]);

  const selectedTheory = useMemo(() => data.theories.find(t => t.id === selectedTheoryId) || null, [data, selectedTheoryId]);
  const selectedComparisons = useMemo(() => (selectedTheoryId ? data.comparisons[selectedTheoryId] || [] : []), [data, selectedTheoryId]);

  // Stats
  const stats = useMemo(() => {
    const byRelation: Record<string, number> = {};
    for (const t of data.theories) {
      byRelation[t.relation] = (byRelation[t.relation] || 0) + 1;
    }
    return { total: data.theories.length, byRelation };
  }, [data]);

  const { isDark, colors } = useTheme();

  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 10000, background: isDark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: isDark ? "linear-gradient(135deg, #0f1117 0%, #13151d 100%)" : "#ffffff", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)", borderRadius: 16, width: "min(95vw, 1100px)", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: isDark ? "0 24px 64px rgba(0,0,0,0.5)" : "0 24px 64px rgba(0,0,0,0.15)" }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <span style={{ fontSize: 22 }}>⚔️</span>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 18, color: colors.textPrimary, fontWeight: 700 }}>Counter-Theory Registry</h2>
            <p style={{ margin: 0, fontSize: 12, color: colors.textMuted }}>Register and compare competing theories • {stats.total} registered</p>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {(["list", "compare", "add"] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{ padding: "6px 12px", background: view === v ? "rgba(99,102,241,0.2)" : (isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)"), border: `1px solid ${view === v ? "rgba(99,102,241,0.3)" : (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)")}`, borderRadius: 6, color: view === v ? "#a5b4fc" : colors.textMuted, cursor: "pointer", fontSize: 11, textTransform: "capitalize" }}>
                {v === "add" ? "+ New" : v}
              </button>
            ))}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: colors.textMuted, cursor: "pointer", fontSize: 20 }}>✕</button>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "16px 24px" }}>
          {/* ADD VIEW */}
          {view === "add" && (
            <div style={{ maxWidth: 600, margin: "0 auto" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Theory name..." style={{ padding: "10px 14px", background: isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.03)", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)", borderRadius: 8, color: colors.textPrimary, fontSize: 14, outline: "none" }} />
                <input value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} placeholder="Author(s)..." style={{ padding: "10px 14px", background: isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.03)", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)", borderRadius: 8, color: colors.textPrimary, fontSize: 13, outline: "none" }} />
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description..." rows={3} style={{ padding: "10px 14px", background: isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.03)", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)", borderRadius: 8, color: colors.textPrimary, fontSize: 13, outline: "none", resize: "vertical" }} />
                <div>
                  <p style={{ margin: "0 0 6px", fontSize: 12, color: colors.textMuted }}>Relationship to your theory:</p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {Object.entries(RELATION_META).map(([key, meta]) => (
                      <button key={key} onClick={() => setForm({ ...form, relation: key as TheoryRelation })} style={{ padding: "6px 12px", background: form.relation === key ? `${meta.color}22` : (isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)"), border: `1px solid ${form.relation === key ? meta.color + "44" : (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)")}`, borderRadius: 8, color: meta.color, cursor: "pointer", fontSize: 11 }}>
                        {meta.icon} {meta.label}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={addTheory} disabled={!form.name.trim()} style={{ padding: "12px 24px", background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 8, color: "#a5b4fc", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>Register Theory</button>
              </div>
            </div>
          )}

          {/* LIST VIEW */}
          {view === "list" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {data.theories.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 0", color: colors.textMuted }}>
                  <p style={{ fontSize: 36, margin: "0 0 12px" }}>⚔️</p>
                  <p style={{ fontSize: 14, margin: 0 }}>No counter-theories registered. Click "+ New" to add one.</p>
                </div>
              ) : data.theories.map(theory => {
                const rel = RELATION_META[theory.relation];
                return (
                  <div key={theory.id} style={{ padding: "14px 16px", background: `${rel.color}08`, border: `1px solid ${rel.color}22`, borderRadius: 10, cursor: "pointer" }} onClick={() => { setSelectedTheoryId(theory.id); setView("compare"); }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 20 }}>{rel.icon}</span>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: 0, fontSize: 15, color: colors.textPrimary, fontWeight: 700 }}>{theory.name}</h3>
                        {theory.author && <p style={{ margin: "2px 0 0", fontSize: 11, color: colors.textMuted }}>by {theory.author}</p>}
                        <p style={{ margin: "4px 0 0", fontSize: 12, color: colors.textSecondary }}>{theory.description || "No description"}</p>
                      </div>
                      <span style={{ fontSize: 10, padding: "3px 8px", background: `${rel.color}15`, border: `1px solid ${rel.color}33`, borderRadius: 8, color: rel.color }}>{rel.label}</span>
                      <button onClick={e => { e.stopPropagation(); removeTheory(theory.id); }} style={{ padding: "4px 8px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 4, color: "#fca5a5", cursor: "pointer", fontSize: 10 }}>✕</button>
                    </div>
                    <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 10, color: colors.textMuted }}>
                      <span>📌 {theory.keyAssumptions.length} assumptions</span>
                      <span>🔮 {theory.keyPredictions.length} predictions</span>
                      <span>💪 {theory.strengths.length} strengths</span>
                      <span>⚠️ {theory.weaknesses.length} weaknesses</span>
                      <span>↔️ {theory.divergencePoints.length} divergences</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* COMPARE VIEW */}
          {view === "compare" && selectedTheory && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button onClick={() => setView("list")} style={{ padding: "4px 10px", background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)", borderRadius: 6, color: colors.textMuted, cursor: "pointer", fontSize: 11 }}>← Back</button>
                <h3 style={{ margin: 0, fontSize: 16, color: colors.textPrimary }}>
                  {RELATION_META[selectedTheory.relation].icon} {selectedTheory.name}
                </h3>
              </div>

              {/* Comparison Table */}
              <div style={{ border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "160px 1fr 1fr 100px", background: "rgba(99,102,241,0.06)", borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)" }}>
                  <div style={{ padding: "10px 14px", fontSize: 11, fontWeight: 700, color: "#a5b4fc" }}>Dimension</div>
                  <div style={{ padding: "10px 14px", fontSize: 11, fontWeight: 700, color: "#6ee7b7" }}>Your Theory</div>
                  <div style={{ padding: "10px 14px", fontSize: 11, fontWeight: 700, color: "#fca5a5" }}>{selectedTheory.name}</div>
                  <div style={{ padding: "10px 14px", fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>Verdict</div>
                </div>
                {selectedComparisons.map((comp, idx) => {
                  const dim = DIM_META[comp.dimension];
                  const verdict = VERDICT_META[comp.verdict];
                  return (
                    <div key={comp.dimension} style={{ display: "grid", gridTemplateColumns: "160px 1fr 1fr 100px", borderBottom: isDark ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(0,0,0,0.04)" }}>
                      <div style={{ padding: "8px 14px", fontSize: 11, color: colors.textSecondary, display: "flex", alignItems: "center", gap: 6 }}>{dim.icon} {dim.label}</div>
                      <div style={{ padding: "6px 10px" }}>
                        <textarea value={comp.myTheory} onChange={e => updateComparison(selectedTheory.id, idx, "myTheory", e.target.value)} rows={2} style={{ width: "100%", padding: "4px 8px", background: isDark ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.02)", border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)", borderRadius: 4, color: colors.textPrimary, fontSize: 10, outline: "none", resize: "vertical" }} />
                      </div>
                      <div style={{ padding: "6px 10px" }}>
                        <textarea value={comp.counterTheory} onChange={e => updateComparison(selectedTheory.id, idx, "counterTheory", e.target.value)} rows={2} style={{ width: "100%", padding: "4px 8px", background: isDark ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.02)", border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)", borderRadius: 4, color: colors.textPrimary, fontSize: 10, outline: "none", resize: "vertical" }} />
                      </div>
                      <div style={{ padding: "6px 10px" }}>
                        <select value={comp.verdict} onChange={e => updateComparison(selectedTheory.id, idx, "verdict", e.target.value)} style={{ width: "100%", padding: "4px 6px", background: isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.03)", border: `1px solid ${verdict.color}44`, borderRadius: 4, color: verdict.color, fontSize: 9, cursor: "pointer" }}>
                          {Object.entries(VERDICT_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Detail Lists */}
              {(["assumptions", "predictions", "strengths", "weaknesses", "divergence", "references"] as const).map(field => {
                const fieldMap: Record<string, { key: keyof CounterTheory; icon: string; label: string; color: string }> = {
                  assumptions: { key: "keyAssumptions", icon: "📌", label: "Key Assumptions", color: "#60a5fa" },
                  predictions: { key: "keyPredictions", icon: "🔮", label: "Key Predictions", color: "#a78bfa" },
                  strengths:   { key: "strengths", icon: "💪", label: "Strengths", color: "#22c55e" },
                  weaknesses:  { key: "weaknesses", icon: "⚠️", label: "Weaknesses", color: "#f59e0b" },
                  divergence:  { key: "divergencePoints", icon: "↔️", label: "Divergence Points", color: "#ef4444" },
                  references:  { key: "references", icon: "📎", label: "References", color: "#94a3b8" },
                };
                const meta = fieldMap[field];
                const items = selectedTheory[meta.key] as string[];
                return (
                  <div key={field} style={{ padding: "10px 14px", background: `${meta.color}06`, border: `1px solid ${meta.color}15`, borderRadius: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 14 }}>{meta.icon}</span>
                      <span style={{ fontSize: 12, color: meta.color, fontWeight: 600 }}>{meta.label} ({items.length})</span>
                      <div style={{ flex: 1 }} />
                      <button onClick={() => setAddingField(addingField === field ? null : field)} style={{ padding: "3px 8px", background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)", borderRadius: 4, color: colors.textMuted, cursor: "pointer", fontSize: 10 }}>
                        {addingField === field ? "Done" : "+ Add"}
                      </button>
                    </div>
                    {addingField === field && (
                      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                        <input value={newItem} onChange={e => setNewItem(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { addListItem(selectedTheory.id, field, newItem); } }} placeholder={`Add ${meta.label.toLowerCase()}...`} style={{ flex: 1, padding: "6px 10px", background: isDark ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.02)", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)", borderRadius: 4, color: colors.textPrimary, fontSize: 11, outline: "none" }} />
                        <button onClick={() => addListItem(selectedTheory.id, field, newItem)} style={{ padding: "6px 10px", background: `${meta.color}15`, border: `1px solid ${meta.color}33`, borderRadius: 4, color: meta.color, cursor: "pointer", fontSize: 10 }}>Add</button>
                      </div>
                    )}
                    {items.length === 0 ? (
                      <p style={{ margin: 0, fontSize: 11, color: colors.textMuted, fontStyle: "italic" }}>None added yet</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {items.map((item, idx) => (
                          <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 8px", background: isDark ? "rgba(0,0,0,0.1)" : "rgba(0,0,0,0.02)", borderRadius: 4 }}>
                            <span style={{ flex: 1, fontSize: 11, color: colors.textPrimary }}>{item}</span>
                            <button onClick={() => removeListItem(selectedTheory.id, field, idx)} style={{ padding: "2px 4px", background: "none", border: "none", color: colors.textMuted, cursor: "pointer", fontSize: 10 }}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {view === "compare" && !selectedTheory && (
            <div style={{ textAlign: "center", padding: "48px 0", color: colors.textMuted }}>
              <p style={{ fontSize: 14 }}>Select a theory from the list view to compare.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
