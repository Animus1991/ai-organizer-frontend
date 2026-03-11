// src/components/EvidenceChainBuilder.tsx
// Evidence Chain Builder — visual chain: Source → Interpretation → Claim → Theory
import { useState, useMemo, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";

// ─── Types ───────────────────────────────────────────────────────────
type ChainNodeType = "source" | "interpretation" | "claim" | "theory" | "prediction";
type LinkStrength = "strong" | "moderate" | "weak" | "missing";

interface ChainNode {
  id: string;
  type: ChainNodeType;
  label: string;
  description: string;
  confidence: number; // 0-100
  createdAt: string;
}

interface ChainLink {
  id: string;
  fromId: string;
  toId: string;
  strength: LinkStrength;
  justification: string;
}

interface EvidenceChainBuilderProps {
  open: boolean;
  onClose: () => void;
}

// ─── Constants ───────────────────────────────────────────────────────
const STORAGE_KEY = "thinkspace-evidence-chains";

const NODE_META: Record<ChainNodeType, { icon: string; color: string; label: string; order: number }> = {
  source:         { icon: "📄", color: "#60a5fa", label: "Primary Source",   order: 0 },
  interpretation: { icon: "🔍", color: "#a78bfa", label: "Interpretation",   order: 1 },
  claim:          { icon: "🎯", color: "#f472b6", label: "Claim",            order: 2 },
  theory:         { icon: "🏗️", color: "#fbbf24", label: "Theory Component", order: 3 },
  prediction:     { icon: "🔮", color: "#34d399", label: "Prediction",       order: 4 },
};

const STRENGTH_META: Record<LinkStrength, { icon: string; color: string; label: string; width: number }> = {
  strong:   { icon: "━━━", color: "#22c55e", label: "Strong",   width: 3 },
  moderate: { icon: "───", color: "#3b82f6", label: "Moderate", width: 2 },
  weak:     { icon: "╌╌╌", color: "#f59e0b", label: "Weak",     width: 1 },
  missing:  { icon: "···", color: "#ef4444", label: "Missing",  width: 1 },
};

function generateId(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

function loadData(): { nodes: ChainNode[]; links: ChainLink[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { nodes: [], links: [] };
}

function saveData(data: { nodes: ChainNode[]; links: ChainLink[] }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ─── Component ───────────────────────────────────────────────────────
export function EvidenceChainBuilder({ open, onClose }: EvidenceChainBuilderProps) {
  const [data, setData] = useState(loadData);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [linkMode, setLinkMode] = useState<{ fromId: string } | null>(null);
  const [addType, setAddType] = useState<ChainNodeType>("source");
  const [addLabel, setAddLabel] = useState("");
  const [addDesc, setAddDesc] = useState("");
  const [showGaps, setShowGaps] = useState(false);

  const persist = useCallback((newData: typeof data) => {
    setData(newData);
    saveData(newData);
  }, []);

  const addNode = useCallback(() => {
    if (!addLabel.trim()) return;
    const node: ChainNode = {
      id: generateId(),
      type: addType,
      label: addLabel.trim(),
      description: addDesc.trim(),
      confidence: 50,
      createdAt: new Date().toISOString(),
    };
    persist({ ...data, nodes: [...data.nodes, node] });
    setAddLabel("");
    setAddDesc("");
  }, [addType, addLabel, addDesc, data, persist]);

  const removeNode = useCallback((id: string) => {
    persist({
      nodes: data.nodes.filter(n => n.id !== id),
      links: data.links.filter(l => l.fromId !== id && l.toId !== id),
    });
    if (selectedNodeId === id) setSelectedNodeId(null);
  }, [data, persist, selectedNodeId]);

  const addLink = useCallback((fromId: string, toId: string) => {
    if (fromId === toId) return;
    if (data.links.some(l => l.fromId === fromId && l.toId === toId)) return;
    const link: ChainLink = {
      id: generateId(),
      fromId,
      toId,
      strength: "moderate",
      justification: "",
    };
    persist({ ...data, links: [...data.links, link] });
    setLinkMode(null);
  }, [data, persist]);

  const removeLink = useCallback((id: string) => {
    persist({ ...data, links: data.links.filter(l => l.id !== id) });
  }, [data, persist]);

  const updateLinkStrength = useCallback((id: string, strength: LinkStrength) => {
    persist({ ...data, links: data.links.map(l => l.id === id ? { ...l, strength } : l) });
  }, [data, persist]);

  const updateLinkJustification = useCallback((id: string, justification: string) => {
    persist({ ...data, links: data.links.map(l => l.id === id ? { ...l, justification } : l) });
  }, [data, persist]);

  const updateNodeConfidence = useCallback((id: string, confidence: number) => {
    persist({ ...data, nodes: data.nodes.map(n => n.id === id ? { ...n, confidence } : n) });
  }, [data, persist]);

  // Group nodes by type (column layout)
  const columns = useMemo(() => {
    const cols: Record<ChainNodeType, ChainNode[]> = { source: [], interpretation: [], claim: [], theory: [], prediction: [] };
    for (const n of data.nodes) cols[n.type].push(n);
    return cols;
  }, [data]);

  // Gap analysis
  const gaps = useMemo(() => {
    const issues: { type: string; description: string; severity: "critical" | "warning" }[] = [];
    // Claims without sources
    const claimNodes = data.nodes.filter(n => n.type === "claim");
    for (const claim of claimNodes) {
      const incoming = data.links.filter(l => l.toId === claim.id);
      if (incoming.length === 0) {
        issues.push({ type: "Missing Link", description: `Claim "${claim.label}" has no supporting evidence chain`, severity: "critical" });
      }
      const weakLinks = incoming.filter(l => l.strength === "weak" || l.strength === "missing");
      if (weakLinks.length > 0) {
        issues.push({ type: "Weak Link", description: `Claim "${claim.label}" has ${weakLinks.length} weak/missing link(s)`, severity: "warning" });
      }
    }
    // Theories without claims
    const theoryNodes = data.nodes.filter(n => n.type === "theory");
    for (const theory of theoryNodes) {
      const incoming = data.links.filter(l => l.toId === theory.id);
      if (incoming.length === 0) {
        issues.push({ type: "Unsupported Theory", description: `Theory "${theory.label}" has no supporting claims`, severity: "critical" });
      }
    }
    // Orphan sources
    const sourceNodes = data.nodes.filter(n => n.type === "source");
    for (const src of sourceNodes) {
      const outgoing = data.links.filter(l => l.fromId === src.id);
      if (outgoing.length === 0) {
        issues.push({ type: "Unused Source", description: `Source "${src.label}" is not connected to any interpretation`, severity: "warning" });
      }
    }
    return issues;
  }, [data]);

  // Stats
  const stats = useMemo(() => ({
    nodes: data.nodes.length,
    links: data.links.length,
    gaps: gaps.filter(g => g.severity === "critical").length,
    avgConfidence: data.nodes.length > 0 ? Math.round(data.nodes.reduce((s, n) => s + n.confidence, 0) / data.nodes.length) : 0,
  }), [data, gaps]);

  const { isDark, colors } = useTheme();

  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 10000, background: isDark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: isDark ? "linear-gradient(135deg, #0f1117 0%, #13151d 100%)" : "#ffffff", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)", borderRadius: 16, width: "min(95vw, 1200px)", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: isDark ? "0 24px 64px rgba(0,0,0,0.5)" : "0 24px 64px rgba(0,0,0,0.15)" }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <span style={{ fontSize: 22 }}>🔗</span>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 18, color: colors.textPrimary, fontWeight: 700 }}>Evidence Chain Builder</h2>
            <p style={{ margin: 0, fontSize: 12, color: colors.textMuted }}>Source → Interpretation → Claim → Theory • {stats.nodes} nodes, {stats.links} links</p>
          </div>
          <div style={{ display: "flex", gap: 8, fontSize: 11 }}>
            <span style={{ color: stats.gaps > 0 ? "#ef4444" : "#22c55e" }}>🔴 {stats.gaps} gaps</span>
            <span style={{ color: stats.avgConfidence > 60 ? "#22c55e" : "#f59e0b" }}>📊 {stats.avgConfidence}% avg conf.</span>
          </div>
          <button onClick={() => setShowGaps(!showGaps)} style={{ padding: "6px 12px", background: showGaps ? "rgba(239,68,68,0.15)" : (isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"), border: `1px solid ${showGaps ? "rgba(239,68,68,0.3)" : (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)")}`, borderRadius: 6, color: showGaps ? "#fca5a5" : colors.textMuted, cursor: "pointer", fontSize: 11 }}>
            {showGaps ? "Hide" : "Show"} Gaps ({gaps.length})
          </button>
          <button onClick={onClose} style={{ background: "none", border: "none", color: colors.textMuted, cursor: "pointer", fontSize: 20 }}>✕</button>
        </div>

        {/* Gap Analysis */}
        {showGaps && gaps.length > 0 && (
          <div style={{ padding: "12px 24px", borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)", maxHeight: 150, overflow: "auto" }}>
            {gaps.map((gap, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", padding: "4px 0", fontSize: 11 }}>
                <span style={{ color: gap.severity === "critical" ? "#ef4444" : "#f59e0b" }}>{gap.severity === "critical" ? "🔴" : "⚠️"}</span>
                <span style={{ color: gap.severity === "critical" ? "#fca5a5" : "#fcd34d", fontWeight: 600 }}>{gap.type}:</span>
                <span style={{ color: colors.textMuted }}>{gap.description}</span>
              </div>
            ))}
          </div>
        )}

        {/* Add Node Bar */}
        <div style={{ padding: "12px 24px", borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)", display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 4 }}>
            {Object.entries(NODE_META).map(([key, meta]) => (
              <button key={key} onClick={() => setAddType(key as ChainNodeType)} style={{ padding: "4px 10px", background: addType === key ? `${meta.color}22` : (isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)"), border: `1px solid ${addType === key ? meta.color + "44" : (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)")}`, borderRadius: 6, color: meta.color, cursor: "pointer", fontSize: 10 }}>
                {meta.icon} {meta.label}
              </button>
            ))}
          </div>
          <input value={addLabel} onChange={e => setAddLabel(e.target.value)} onKeyDown={e => e.key === "Enter" && addNode()} placeholder={`New ${NODE_META[addType].label}...`} style={{ flex: 1, minWidth: 200, padding: "6px 10px", background: isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.03)", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)", borderRadius: 6, color: colors.textPrimary, fontSize: 12, outline: "none" }} />
          <input value={addDesc} onChange={e => setAddDesc(e.target.value)} placeholder="Description (optional)" style={{ width: 180, padding: "6px 10px", background: isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.03)", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)", borderRadius: 6, color: colors.textPrimary, fontSize: 11, outline: "none" }} />
          <button onClick={addNode} disabled={!addLabel.trim()} style={{ padding: "6px 14px", background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 6, color: "#a5b4fc", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>+ Add</button>
        </div>

        {/* Link Mode Banner */}
        {linkMode && (
          <div style={{ padding: "8px 24px", background: "rgba(59,130,246,0.1)", borderBottom: "1px solid rgba(59,130,246,0.2)", display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
            <span style={{ color: "#93c5fd" }}>🔗 Link mode: click a target node to connect from "{data.nodes.find(n => n.id === linkMode.fromId)?.label}"</span>
            <button onClick={() => setLinkMode(null)} style={{ padding: "3px 8px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 4, color: "#fca5a5", cursor: "pointer", fontSize: 10 }}>Cancel</button>
          </div>
        )}

        {/* Main Content - Column Layout */}
        <div style={{ flex: 1, overflow: "auto", padding: "16px 24px" }}>
          {data.nodes.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: colors.textMuted }}>
              <p style={{ fontSize: 36, margin: "0 0 12px" }}>🔗</p>
              <p style={{ fontSize: 14, margin: 0 }}>Add nodes above to build your evidence chain.</p>
              <p style={{ fontSize: 12, margin: "8px 0 0", color: colors.textMuted }}>Recommended flow: Source → Interpretation → Claim → Theory → Prediction</p>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 16, minHeight: 300 }}>
              {Object.entries(NODE_META).map(([type, meta]) => {
                const colNodes = columns[type as ChainNodeType];
                return (
                  <div key={type} style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ padding: "8px 12px", background: `${meta.color}10`, borderRadius: "8px 8px 0 0", borderBottom: `2px solid ${meta.color}44`, textAlign: "center" }}>
                      <span style={{ fontSize: 16 }}>{meta.icon}</span>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: meta.color, fontWeight: 700 }}>{meta.label} ({colNodes.length})</p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "8px 0" }}>
                      {colNodes.map(node => {
                        const isSelected = selectedNodeId === node.id;
                        const inLinks = data.links.filter(l => l.toId === node.id);
                        const outLinks = data.links.filter(l => l.fromId === node.id);
                        return (
                          <div
                            key={node.id}
                            onClick={() => {
                              if (linkMode) {
                                addLink(linkMode.fromId, node.id);
                              } else {
                                setSelectedNodeId(isSelected ? null : node.id);
                              }
                            }}
                            style={{
                              padding: "8px 10px", background: isSelected ? `${meta.color}15` : (isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"),
                              border: `1px solid ${isSelected ? meta.color + "44" : linkMode ? "rgba(59,130,246,0.3)" : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)")}`,
                              borderRadius: 8, cursor: "pointer", transition: "all 0.15s",
                            }}
                          >
                            <p style={{ margin: 0, fontSize: 12, color: colors.textPrimary, fontWeight: 600 }}>{node.label}</p>
                            {node.description && <p style={{ margin: "2px 0 0", fontSize: 10, color: colors.textMuted }}>{node.description}</p>}
                            <div style={{ display: "flex", gap: 6, marginTop: 4, fontSize: 9, color: colors.textMuted }}>
                              <span>📊 {node.confidence}%</span>
                              <span>← {inLinks.length}</span>
                              <span>→ {outLinks.length}</span>
                            </div>
                            {isSelected && (
                              <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                                <button onClick={e => { e.stopPropagation(); setLinkMode({ fromId: node.id }); }} style={{ padding: "2px 6px", background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 4, color: "#93c5fd", cursor: "pointer", fontSize: 9 }}>🔗 Link</button>
                                <input type="range" min={0} max={100} value={node.confidence} onChange={e => { e.stopPropagation(); updateNodeConfidence(node.id, Number(e.target.value)); }} onClick={e => e.stopPropagation()} style={{ flex: 1, height: 12 }} />
                                <button onClick={e => { e.stopPropagation(); removeNode(node.id); }} style={{ padding: "2px 6px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 4, color: "#fca5a5", cursor: "pointer", fontSize: 9 }}>✕</button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Links Section */}
          {data.links.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h4 style={{ margin: "0 0 8px", fontSize: 13, color: colors.textMuted }}>Chain Links ({data.links.length})</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {data.links.map(link => {
                  const fromNode = data.nodes.find(n => n.id === link.fromId);
                  const toNode = data.nodes.find(n => n.id === link.toId);
                  if (!fromNode || !toNode) return null;
                  const sMeta = STRENGTH_META[link.strength];
                  return (
                    <div key={link.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)", border: isDark ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(0,0,0,0.06)", borderRadius: 6 }}>
                      <span style={{ fontSize: 11, color: NODE_META[fromNode.type].color }}>{NODE_META[fromNode.type].icon} {fromNode.label}</span>
                      <span style={{ color: sMeta.color, fontWeight: 700, letterSpacing: 2, fontSize: 12 }}>{sMeta.icon}</span>
                      <span style={{ fontSize: 11, color: NODE_META[toNode.type].color }}>{NODE_META[toNode.type].icon} {toNode.label}</span>
                      <div style={{ flex: 1 }} />
                      <select value={link.strength} onChange={e => updateLinkStrength(link.id, e.target.value as LinkStrength)} style={{ padding: "2px 4px", background: isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.03)", border: `1px solid ${sMeta.color}44`, borderRadius: 4, color: sMeta.color, fontSize: 9, cursor: "pointer" }}>
                        {Object.entries(STRENGTH_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
                      </select>
                      <input value={link.justification} onChange={e => updateLinkJustification(link.id, e.target.value)} placeholder="Justification..." style={{ width: 140, padding: "2px 6px", background: isDark ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.03)", border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.08)", borderRadius: 4, color: colors.textPrimary, fontSize: 9, outline: "none" }} />
                      <button onClick={() => removeLink(link.id)} style={{ padding: "2px 4px", background: "none", border: "none", color: colors.textMuted, cursor: "pointer", fontSize: 10 }}>✕</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
