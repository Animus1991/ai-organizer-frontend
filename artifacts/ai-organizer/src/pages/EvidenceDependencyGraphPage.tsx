/**
 * EvidenceDependencyGraphPage — GitHub Insights equivalent
 * 
 * Full-page visualization of how evidence, claims, and theories interconnect.
 * Features:
 * - Interactive dependency graph with nodes and edges
 * - Filter by node type (source, claim, theory, evidence)
 * - Strength indicators for each dependency link
 * - Statistics dashboard (coverage, gaps, strength distribution)
 * - Evidence gap detection
 * - Export dependency report
 */

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { PageShell } from "../components/layout/PageShell";
import { useIsMobile } from "../hooks/useMediaQuery";

// ─── Types ───────────────────────────────────────────────────────────

type NodeType = "source" | "claim" | "theory" | "evidence" | "prediction" | "assumption";
type LinkStrength = "strong" | "moderate" | "weak" | "missing";
type ViewMode = "graph" | "matrix" | "list" | "gaps";

interface DependencyNode {
  id: string;
  type: NodeType;
  label: string;
  description: string;
  confidence: number; // 0-100
  status: "verified" | "pending" | "disputed" | "retracted";
  createdAt: number;
  tags: string[];
}

interface DependencyLink {
  id: string;
  sourceId: string;
  targetId: string;
  strength: LinkStrength;
  description: string;
  bidirectional: boolean;
}

interface EvidenceGap {
  id: string;
  claimId: string;
  claimLabel: string;
  gapType: "no-evidence" | "weak-evidence" | "single-source" | "outdated";
  severity: "critical" | "high" | "medium" | "low";
  suggestion: string;
}

// ─── Constants ───────────────────────────────────────────────────────

const STORAGE_KEY = "evidence_dependency_graph";

const NODE_CONFIG: Record<NodeType, { icon: string; color: string; label: string }> = {
  source: { icon: "📄", color: "#60a5fa", label: "Source" },
  claim: { icon: "🎯", color: "#f472b6", label: "Claim" },
  theory: { icon: "🏗️", color: "#fbbf24", label: "Theory" },
  evidence: { icon: "🔬", color: "#34d399", label: "Evidence" },
  prediction: { icon: "🔮", color: "#a78bfa", label: "Prediction" },
  assumption: { icon: "💭", color: "#fb923c", label: "Assumption" },
};

const STRENGTH_CONFIG: Record<LinkStrength, { color: string; label: string; width: number; dash: string }> = {
  strong: { color: "#22c55e", label: "Strong", width: 3, dash: "none" },
  moderate: { color: "#3b82f6", label: "Moderate", width: 2, dash: "none" },
  weak: { color: "#f59e0b", label: "Weak", width: 1, dash: "6,3" },
  missing: { color: "#ef4444", label: "Missing", width: 1, dash: "3,3" },
};

const STATUS_CONFIG: Record<DependencyNode["status"], { color: string; label: string; icon: string }> = {
  verified: { color: "#10b981", label: "Verified", icon: "✅" },
  pending: { color: "#f59e0b", label: "Pending", icon: "⏳" },
  disputed: { color: "#ef4444", label: "Disputed", icon: "⚡" },
  retracted: { color: "#6b7280", label: "Retracted", icon: "🚫" },
};

const GAP_SEVERITY_CONFIG: Record<EvidenceGap["severity"], { color: string; icon: string }> = {
  critical: { color: "#ef4444", icon: "🔴" },
  high: { color: "#f97316", icon: "🟠" },
  medium: { color: "#f59e0b", icon: "🟡" },
  low: { color: "#6b7280", icon: "⚪" },
};

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ─── Sample Data ─────────────────────────────────────────────────────

function createSampleData(): { nodes: DependencyNode[]; links: DependencyLink[] } {
  const now = Date.now();
  const day = 86400000;

  const nodes: DependencyNode[] = [
    { id: "t1", type: "theory", label: "Cognitive Load Theory (Extended)", description: "Working memory constraints limit instructional processing", confidence: 92, status: "verified", createdAt: now - 60 * day, tags: ["core", "psychology"] },
    { id: "t2", type: "theory", label: "Dual-Process Integration", description: "System 1/System 2 framework applied to cognitive load", confidence: 78, status: "pending", createdAt: now - 30 * day, tags: ["extension", "psychology"] },
    { id: "c1", type: "claim", label: "WM capacity is 7±2 chunks", description: "Working memory has a finite capacity", confidence: 95, status: "verified", createdAt: now - 55 * day, tags: ["foundational"] },
    { id: "c2", type: "claim", label: "Cognitive load is additive", description: "Intrinsic + extraneous + germane load", confidence: 85, status: "verified", createdAt: now - 50 * day, tags: ["foundational"] },
    { id: "c3", type: "claim", label: "System 1 bypasses WM constraints", description: "Automatic processing doesn't consume WM", confidence: 72, status: "pending", createdAt: now - 25 * day, tags: ["hypothesis"] },
    { id: "c4", type: "claim", label: "Boundary: novice-intermediate learners", description: "Theory applies primarily to instructional contexts", confidence: 88, status: "verified", createdAt: now - 15 * day, tags: ["scope"] },
    { id: "c5", type: "claim", label: "Quantum probability explains conjunction fallacy", description: "Quantum models better explain certain cognitive phenomena", confidence: 45, status: "disputed", createdAt: now - 10 * day, tags: ["speculative"] },
    { id: "e1", type: "evidence", label: "Miller (1956) — Magic Number 7", description: "Seminal study on WM capacity limits", confidence: 98, status: "verified", createdAt: now - 58 * day, tags: ["classic"] },
    { id: "e2", type: "evidence", label: "Sweller (1988) — CLT Original", description: "Original cognitive load theory paper", confidence: 96, status: "verified", createdAt: now - 55 * day, tags: ["classic"] },
    { id: "e3", type: "evidence", label: "Kahneman (2011) — Fast & Slow", description: "Dual-process theory comprehensive work", confidence: 90, status: "verified", createdAt: now - 28 * day, tags: ["review"] },
    { id: "e4", type: "evidence", label: "Paas & van Merriënboer (2020)", description: "Boundary conditions for CLT", confidence: 87, status: "verified", createdAt: now - 14 * day, tags: ["recent"] },
    { id: "e5", type: "evidence", label: "Busemeyer & Bruza (2012)", description: "Quantum models of cognition", confidence: 65, status: "pending", createdAt: now - 8 * day, tags: ["quantum"] },
    { id: "s1", type: "source", label: "Eye-tracking dataset (n=120)", description: "Experimental data from eye-tracking study", confidence: 82, status: "verified", createdAt: now - 20 * day, tags: ["primary"] },
    { id: "s2", type: "source", label: "fMRI imaging results", description: "Brain imaging data during cognitive tasks", confidence: 75, status: "pending", createdAt: now - 12 * day, tags: ["primary"] },
    { id: "p1", type: "prediction", label: "Order effects follow quantum interference", description: "Testable prediction from quantum cognition hypothesis", confidence: 40, status: "pending", createdAt: now - 5 * day, tags: ["testable"] },
    { id: "a1", type: "assumption", label: "Dual-channel information processing", description: "Visual and auditory channels are separate", confidence: 90, status: "verified", createdAt: now - 55 * day, tags: ["foundational"] },
    { id: "a2", type: "assumption", label: "Unlimited LTM capacity", description: "Long-term memory has effectively unlimited capacity", confidence: 85, status: "verified", createdAt: now - 50 * day, tags: ["foundational"] },
  ];

  const links: DependencyLink[] = [
    { id: "l1", sourceId: "e1", targetId: "c1", strength: "strong", description: "Direct evidence for WM capacity", bidirectional: false },
    { id: "l2", sourceId: "e2", targetId: "c2", strength: "strong", description: "Original formulation of additive load", bidirectional: false },
    { id: "l3", sourceId: "e2", targetId: "t1", strength: "strong", description: "Foundational paper for CLT", bidirectional: false },
    { id: "l4", sourceId: "c1", targetId: "t1", strength: "strong", description: "Core claim of the theory", bidirectional: false },
    { id: "l5", sourceId: "c2", targetId: "t1", strength: "strong", description: "Core claim of the theory", bidirectional: false },
    { id: "l6", sourceId: "e3", targetId: "c3", strength: "moderate", description: "Supports System 1 bypass hypothesis", bidirectional: false },
    { id: "l7", sourceId: "c3", targetId: "t2", strength: "moderate", description: "Key claim for dual-process integration", bidirectional: false },
    { id: "l8", sourceId: "t1", targetId: "t2", strength: "strong", description: "Extension builds on core theory", bidirectional: false },
    { id: "l9", sourceId: "e4", targetId: "c4", strength: "strong", description: "Defines boundary conditions", bidirectional: false },
    { id: "l10", sourceId: "c4", targetId: "t1", strength: "moderate", description: "Scoping claim", bidirectional: false },
    { id: "l11", sourceId: "e5", targetId: "c5", strength: "weak", description: "Preliminary quantum cognition evidence", bidirectional: false },
    { id: "l12", sourceId: "c5", targetId: "p1", strength: "moderate", description: "Prediction derived from claim", bidirectional: false },
    { id: "l13", sourceId: "s1", targetId: "e4", strength: "moderate", description: "Data supports boundary findings", bidirectional: false },
    { id: "l14", sourceId: "s2", targetId: "c3", strength: "weak", description: "Preliminary imaging evidence", bidirectional: false },
    { id: "l15", sourceId: "a1", targetId: "t1", strength: "strong", description: "Foundational assumption", bidirectional: false },
    { id: "l16", sourceId: "a2", targetId: "t1", strength: "strong", description: "Foundational assumption", bidirectional: false },
    { id: "l17", sourceId: "a1", targetId: "c2", strength: "moderate", description: "Assumption underlies additive model", bidirectional: false },
  ];

  return { nodes, links };
}

// ─── Helpers ─────────────────────────────────────────────────────────

function loadData(): { nodes: DependencyNode[]; links: DependencyLink[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.nodes?.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  const sample = createSampleData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sample));
  return sample;
}

function saveData(data: { nodes: DependencyNode[]; links: DependencyLink[] }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function detectGaps(nodes: DependencyNode[], links: DependencyLink[]): EvidenceGap[] {
  const gaps: EvidenceGap[] = [];
  const claims = nodes.filter((n) => n.type === "claim");

  for (const claim of claims) {
    const supportingLinks = links.filter((l) => l.targetId === claim.id);
    const evidenceLinks = supportingLinks.filter((l) => {
      const source = nodes.find((n) => n.id === l.sourceId);
      return source?.type === "evidence" || source?.type === "source";
    });

    if (evidenceLinks.length === 0) {
      gaps.push({
        id: generateId(),
        claimId: claim.id,
        claimLabel: claim.label,
        gapType: "no-evidence",
        severity: "critical",
        suggestion: `Add at least 2 evidence sources supporting "${claim.label}"`,
      });
    } else if (evidenceLinks.length === 1) {
      gaps.push({
        id: generateId(),
        claimId: claim.id,
        claimLabel: claim.label,
        gapType: "single-source",
        severity: "high",
        suggestion: `Add additional evidence sources for "${claim.label}" to strengthen support`,
      });
    } else if (evidenceLinks.every((l) => l.strength === "weak")) {
      gaps.push({
        id: generateId(),
        claimId: claim.id,
        claimLabel: claim.label,
        gapType: "weak-evidence",
        severity: "medium",
        suggestion: `Strengthen evidence links for "${claim.label}" — all current links are weak`,
      });
    }

    // Check for outdated evidence
    const evidenceNodes = evidenceLinks
      .map((l) => nodes.find((n) => n.id === l.sourceId))
      .filter(Boolean) as DependencyNode[];
    const fiveYearsAgo = Date.now() - 5 * 365 * 86400000;
    if (evidenceNodes.length > 0 && evidenceNodes.every((e) => e.createdAt < fiveYearsAgo)) {
      gaps.push({
        id: generateId(),
        claimId: claim.id,
        claimLabel: claim.label,
        gapType: "outdated",
        severity: "low",
        suggestion: `Consider adding more recent evidence for "${claim.label}"`,
      });
    }
  }

  return gaps;
}

// ─── Styles ──────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: "hsl(var(--card) / 0.5)",
  border: "1px solid hsl(var(--border) / 0.5)",
  borderRadius: 10,
  padding: 20,
};

const btnStyle = (active: boolean, color = "hsl(var(--primary))"): React.CSSProperties => ({
  padding: "6px 14px",
  borderRadius: 10,
  fontSize: 12,
  fontWeight: 600,
  border: active ? `1px solid ${color}` : "1px solid hsl(var(--border))",
  background: active ? `${color}15` : "transparent",
  color: active ? color : "hsl(var(--muted-foreground))",
  cursor: "pointer",
  transition: "all 0.2s ease",
});

const statCardStyle = (color: string): React.CSSProperties => ({
  ...cardStyle,
  borderColor: `${color}20`,
  background: `${color}06`,
  textAlign: "center" as const,
  minWidth: 120,
  flex: 1,
});

// ─── Component ───────────────────────────────────────────────────────

const EvidenceDependencyGraphPage: React.FC = () => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [data, setData] = useState(() => loadData());
  const [viewMode, setViewMode] = useState<ViewMode>("graph");
  const [filterType, setFilterType] = useState<NodeType | "all">("all");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showAddNode, setShowAddNode] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);

  // New node form
  const [newNode, setNewNode] = useState<Partial<DependencyNode>>({
    type: "claim",
    label: "",
    description: "",
    confidence: 70,
    status: "pending",
    tags: [],
  });

  // New link form
  const [newLink, setNewLink] = useState<Partial<DependencyLink>>({
    sourceId: "",
    targetId: "",
    strength: "moderate",
    description: "",
    bidirectional: false,
  });

  useEffect(() => {
    saveData(data);
  }, [data]);

  // ─── Computed ──────────────────────────────────────────────────────

  const filteredNodes = useMemo(() => {
    if (filterType === "all") return data.nodes;
    return data.nodes.filter((n) => n.type === filterType);
  }, [data.nodes, filterType]);

  const gaps = useMemo(() => detectGaps(data.nodes, data.links), [data.nodes, data.links]);

  const selectedNode = useMemo(
    () => data.nodes.find((n) => n.id === selectedNodeId) || null,
    [data.nodes, selectedNodeId]
  );

  const selectedNodeLinks = useMemo(() => {
    if (!selectedNodeId) return [];
    return data.links.filter((l) => l.sourceId === selectedNodeId || l.targetId === selectedNodeId);
  }, [data.links, selectedNodeId]);

  const stats = useMemo(() => {
    const byType: Record<string, number> = {};
    for (const n of data.nodes) {
      byType[n.type] = (byType[n.type] || 0) + 1;
    }
    const byStrength: Record<string, number> = {};
    for (const l of data.links) {
      byStrength[l.strength] = (byStrength[l.strength] || 0) + 1;
    }
    const avgConfidence = data.nodes.length > 0
      ? Math.round(data.nodes.reduce((s, n) => s + n.confidence, 0) / data.nodes.length)
      : 0;

    return { byType, byStrength, avgConfidence, totalNodes: data.nodes.length, totalLinks: data.links.length, totalGaps: gaps.length };
  }, [data.nodes, data.links, gaps]);

  // ─── Actions ───────────────────────────────────────────────────────

  const addNode = useCallback(() => {
    if (!newNode.label?.trim()) return;
    const node: DependencyNode = {
      id: generateId(),
      type: newNode.type || "claim",
      label: newNode.label.trim(),
      description: newNode.description || "",
      confidence: newNode.confidence || 70,
      status: (newNode.status as DependencyNode["status"]) || "pending",
      createdAt: Date.now(),
      tags: newNode.tags || [],
    };
    setData((prev) => ({ ...prev, nodes: [...prev.nodes, node] }));
    setNewNode({ type: "claim", label: "", description: "", confidence: 70, status: "pending", tags: [] });
    setShowAddNode(false);
  }, [newNode]);

  const addLink = useCallback(() => {
    if (!newLink.sourceId || !newLink.targetId || newLink.sourceId === newLink.targetId) return;
    const link: DependencyLink = {
      id: generateId(),
      sourceId: newLink.sourceId,
      targetId: newLink.targetId,
      strength: (newLink.strength as LinkStrength) || "moderate",
      description: newLink.description || "",
      bidirectional: newLink.bidirectional || false,
    };
    setData((prev) => ({ ...prev, links: [...prev.links, link] }));
    setNewLink({ sourceId: "", targetId: "", strength: "moderate", description: "", bidirectional: false });
    setShowAddLink(false);
  }, [newLink]);

  const deleteNode = useCallback((nodeId: string) => {
    setData((prev) => ({
      nodes: prev.nodes.filter((n) => n.id !== nodeId),
      links: prev.links.filter((l) => l.sourceId !== nodeId && l.targetId !== nodeId),
    }));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  }, [selectedNodeId]);

  const deleteLink = useCallback((linkId: string) => {
    setData((prev) => ({ ...prev, links: prev.links.filter((l) => l.id !== linkId) }));
  }, []);

  const updateNodeConfidence = useCallback((nodeId: string, confidence: number) => {
    setData((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === nodeId ? { ...n, confidence } : n)),
    }));
  }, []);

  // ─── Render Helpers ────────────────────────────────────────────────

  const renderNodeBadge = (node: DependencyNode, small = false) => {
    const cfg = NODE_CONFIG[node.type];
    const sCfg = STATUS_CONFIG[node.status];
    return (
      <div
        key={node.id}
        onClick={() => setSelectedNodeId(selectedNodeId === node.id ? null : node.id)}
        style={{
          padding: small ? "6px 10px" : "12px 16px",
          borderRadius: small ? 8 : 12,
          border: selectedNodeId === node.id ? `2px solid ${cfg.color}` : "1px solid rgba(255,255,255,0.08)",
          background: selectedNodeId === node.id ? `${cfg.color}12` : "rgba(255,255,255,0.02)",
          cursor: "pointer",
          transition: "all 0.2s ease",
          display: "flex",
          alignItems: "center",
          gap: small ? 6 : 10,
          minWidth: small ? undefined : 200,
        }}
      >
        <span style={{ fontSize: small ? 14 : 18 }}>{cfg.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: small ? 11 : 13,
            fontWeight: 600,
            color: "#fff",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {node.label}
          </div>
          {!small && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <span style={{
                fontSize: 10,
                fontWeight: 600,
                padding: "1px 6px",
                borderRadius: 4,
                background: `${cfg.color}15`,
                color: cfg.color,
              }}>
                {cfg.label}
              </span>
              <span style={{
                fontSize: 10,
                fontWeight: 600,
                padding: "1px 6px",
                borderRadius: 4,
                background: `${sCfg.color}15`,
                color: sCfg.color,
              }}>
                {sCfg.icon} {sCfg.label}
              </span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
                {node.confidence}%
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─── Graph View ────────────────────────────────────────────────────

  const renderGraphView = () => {
    // Group nodes by type for layered layout
    const typeOrder: NodeType[] = ["source", "evidence", "assumption", "claim", "theory", "prediction"];
    const grouped = typeOrder.map((type) => ({
      type,
      nodes: filteredNodes.filter((n) => n.type === type),
    })).filter((g) => g.nodes.length > 0);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Legend */}
        <div style={{ ...cardStyle, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>
            {t("evidence.legend") || "Legend"}:
          </span>
          {Object.entries(NODE_CONFIG).map(([key, cfg]) => (
            <span key={key} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: cfg.color }}>
              {cfg.icon} {cfg.label}
            </span>
          ))}
          <span style={{ margin: "0 8px", color: "rgba(255,255,255,0.1)" }}>|</span>
          {Object.entries(STRENGTH_CONFIG).map(([key, cfg]) => (
            <span key={key} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: cfg.color }}>
              <span style={{ display: "inline-block", width: 20, height: cfg.width, background: cfg.color, borderRadius: 2 }} />
              {cfg.label}
            </span>
          ))}
        </div>

        {/* Layered graph */}
        {grouped.map((group) => {
          const cfg = NODE_CONFIG[group.type];
          return (
            <div key={group.type}>
              <div style={{
                fontSize: 12,
                fontWeight: 700,
                color: cfg.color,
                marginBottom: 8,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}>
                {cfg.icon} {cfg.label}s ({group.nodes.length})
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {group.nodes.map((node) => renderNodeBadge(node))}
              </div>
              {/* Show links from this layer */}
              {group.nodes.map((node) => {
                const outLinks = data.links.filter((l) => l.sourceId === node.id);
                if (outLinks.length === 0) return null;
                return (
                  <div key={`links-${node.id}`} style={{ marginLeft: 24, marginTop: 4, marginBottom: 4 }}>
                    {outLinks.map((link) => {
                      const target = data.nodes.find((n) => n.id === link.targetId);
                      if (!target) return null;
                      const sCfg = STRENGTH_CONFIG[link.strength];
                      const tCfg = NODE_CONFIG[target.type];
                      return (
                        <div key={link.id} style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 11,
                          color: "rgba(255,255,255,0.4)",
                          padding: "2px 0",
                        }}>
                          <span style={{ width: 30, height: sCfg.width, background: sCfg.color, borderRadius: 2, display: "inline-block" }} />
                          <span style={{ color: sCfg.color, fontWeight: 600 }}>{sCfg.label}</span>
                          <span>→</span>
                          <span style={{ color: tCfg.color }}>{tCfg.icon} {target.label}</span>
                          {link.description && (
                            <span style={{ color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>
                              — {link.description}
                            </span>
                          )}
                          <button
                            onClick={() => deleteLink(link.id)}
                            style={{
                              marginLeft: "auto",
                              background: "transparent",
                              border: "none",
                              color: "rgba(255,255,255,0.15)",
                              cursor: "pointer",
                              fontSize: 11,
                              padding: "2px 4px",
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  // ─── Matrix View ───────────────────────────────────────────────────

  const renderMatrixView = () => {
    const nodesList = filteredNodes;
    return (
      <div style={{ overflow: "auto" }}>
        <table style={{ borderCollapse: "collapse", fontSize: 11, width: "100%" }}>
          <thead>
            <tr>
              <th style={{ padding: "8px 12px", textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontWeight: 600, position: "sticky", left: 0, background: "#0a0b14", zIndex: 1 }}>
                Source → Target
              </th>
              {nodesList.map((n) => (
                <th key={n.id} style={{
                  padding: "6px 8px",
                  textAlign: "center",
                  borderBottom: "1px solid rgba(255,255,255,0.1)",
                  color: NODE_CONFIG[n.type].color,
                  fontWeight: 600,
                  fontSize: 10,
                  maxWidth: 80,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {NODE_CONFIG[n.type].icon} {n.label.slice(0, 15)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {nodesList.map((source) => (
              <tr key={source.id}>
                <td style={{
                  padding: "6px 12px",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  color: NODE_CONFIG[source.type].color,
                  fontWeight: 600,
                  fontSize: 10,
                  position: "sticky",
                  left: 0,
                  background: "#0a0b14",
                  zIndex: 1,
                  maxWidth: 120,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {NODE_CONFIG[source.type].icon} {source.label.slice(0, 20)}
                </td>
                {nodesList.map((target) => {
                  const link = data.links.find(
                    (l) => l.sourceId === source.id && l.targetId === target.id
                  );
                  if (source.id === target.id) {
                    return (
                      <td key={target.id} style={{
                        padding: 4,
                        textAlign: "center",
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        background: "rgba(255,255,255,0.02)",
                      }}>
                        —
                      </td>
                    );
                  }
                  return (
                    <td key={target.id} style={{
                      padding: 4,
                      textAlign: "center",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      background: link ? `${STRENGTH_CONFIG[link.strength].color}08` : "transparent",
                    }}>
                      {link ? (
                        <span style={{
                          display: "inline-block",
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          background: STRENGTH_CONFIG[link.strength].color,
                          opacity: 0.8,
                        }} title={`${STRENGTH_CONFIG[link.strength].label}: ${link.description}`} />
                      ) : (
                        <span style={{ color: "rgba(255,255,255,0.1)" }}>·</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // ─── List View ─────────────────────────────────────────────────────

  const renderListView = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {filteredNodes.map((node) => {
        const cfg = NODE_CONFIG[node.type];
        const sCfg = STATUS_CONFIG[node.status];
        const inLinks = data.links.filter((l) => l.targetId === node.id);
        const outLinks = data.links.filter((l) => l.sourceId === node.id);
        return (
          <div key={node.id} style={{
            ...cardStyle,
            display: "flex",
            alignItems: "center",
            gap: 16,
            cursor: "pointer",
            borderColor: selectedNodeId === node.id ? `${cfg.color}40` : undefined,
          }} onClick={() => setSelectedNodeId(selectedNodeId === node.id ? null : node.id)}>
            <span style={{ fontSize: 24 }}>{cfg.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{node.label}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{node.description}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: `${cfg.color}15`, color: cfg.color }}>{cfg.label}</span>
                <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: `${sCfg.color}15`, color: sCfg.color }}>{sCfg.icon} {sCfg.label}</span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>↗ {outLinks.length} out · ↙ {inLinks.length} in</span>
              </div>
            </div>
            <div style={{ textAlign: "center", minWidth: 60 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: node.confidence >= 80 ? "#10b981" : node.confidence >= 50 ? "#f59e0b" : "#ef4444" }}>
                {node.confidence}%
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{t("evidence.confidence") || "Confidence"}</div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); deleteNode(node.id); }}
              style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.15)", cursor: "pointer", fontSize: 16, padding: "4px 8px" }}
            >
              🗑
            </button>
          </div>
        );
      })}
    </div>
  );

  // ─── Gaps View ─────────────────────────────────────────────────────

  const renderGapsView = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {gaps.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: "center", padding: 40, color: "rgba(255,255,255,0.4)" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{t("evidence.noGaps") || "No evidence gaps detected"}</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>{t("evidence.noGapsHint") || "All claims have adequate evidence support"}</div>
        </div>
      ) : (
        gaps.map((gap) => {
          const sevCfg = GAP_SEVERITY_CONFIG[gap.severity];
          return (
            <div key={gap.id} style={{
              ...cardStyle,
              borderColor: `${sevCfg.color}20`,
              background: `${sevCfg.color}04`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 16 }}>{sevCfg.icon}</span>
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 4,
                  background: `${sevCfg.color}15`,
                  color: sevCfg.color,
                  textTransform: "uppercase",
                }}>
                  {gap.severity}
                </span>
                <span style={{
                  fontSize: 10,
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 4,
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.5)",
                }}>
                  {gap.gapType.replace("-", " ")}
                </span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 4 }}>
                🎯 {gap.claimLabel}
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
                💡 {gap.suggestion}
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  // ─── Selected Node Detail ─────────────────────────────────────────

  const renderNodeDetail = () => {
    if (!selectedNode) return null;
    const cfg = NODE_CONFIG[selectedNode.type];
    const sCfg = STATUS_CONFIG[selectedNode.status];
    return (
      <div style={{ ...cardStyle, borderColor: `${cfg.color}20`, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: 24 }}>{cfg.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{selectedNode.label}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{selectedNode.description}</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: `${cfg.color}15`, color: cfg.color }}>{cfg.label}</span>
            <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: `${sCfg.color}15`, color: sCfg.color }}>{sCfg.icon} {sCfg.label}</span>
          </div>
          <button onClick={() => setSelectedNodeId(null)} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>

        {/* Confidence slider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>{t("evidence.confidence") || "Confidence"}:</span>
          <input
            type="range"
            min={0}
            max={100}
            value={selectedNode.confidence}
            onChange={(e) => updateNodeConfidence(selectedNode.id, parseInt(e.target.value))}
            style={{ flex: 1, accentColor: cfg.color }}
          />
          <span style={{ fontSize: 13, fontWeight: 700, color: selectedNode.confidence >= 80 ? "#10b981" : selectedNode.confidence >= 50 ? "#f59e0b" : "#ef4444", minWidth: 36 }}>
            {selectedNode.confidence}%
          </span>
        </div>

        {/* Connected links */}
        {selectedNodeLinks.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>
              {t("evidence.connections") || "Connections"} ({selectedNodeLinks.length})
            </div>
            {selectedNodeLinks.map((link) => {
              const isSource = link.sourceId === selectedNode.id;
              const otherId = isSource ? link.targetId : link.sourceId;
              const other = data.nodes.find((n) => n.id === otherId);
              if (!other) return null;
              const oCfg = NODE_CONFIG[other.type];
              const lCfg = STRENGTH_CONFIG[link.strength];
              return (
                <div key={link.id} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 8px",
                  borderRadius: 6,
                  background: "rgba(255,255,255,0.02)",
                  marginBottom: 4,
                  fontSize: 11,
                }}>
                  <span style={{ color: isSource ? "#10b981" : "#60a5fa" }}>{isSource ? "→" : "←"}</span>
                  <span style={{ width: 16, height: lCfg.width, background: lCfg.color, borderRadius: 2, display: "inline-block" }} />
                  <span style={{ color: lCfg.color, fontWeight: 600 }}>{lCfg.label}</span>
                  <span style={{ color: oCfg.color }}>{oCfg.icon} {other.label}</span>
                  {link.description && <span style={{ color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>— {link.description}</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ─── Add Forms ─────────────────────────────────────────────────────

  const renderAddNodeForm = () => {
    if (!showAddNode) return null;
    return (
      <div style={{ ...cardStyle, borderColor: "rgba(99,102,241,0.2)", marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 12 }}>
          {t("evidence.addNode") || "Add Node"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <div>
            <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600, display: "block", marginBottom: 4 }}>Type</label>
            <select
              value={newNode.type}
              onChange={(e) => setNewNode((p) => ({ ...p, type: e.target.value as NodeType }))}
              style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)", color: "#fff", fontSize: 12, outline: "none" }}
            >
              {Object.entries(NODE_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.icon} {v.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600, display: "block", marginBottom: 4 }}>Status</label>
            <select
              value={newNode.status}
              onChange={(e) => setNewNode((p) => ({ ...p, status: e.target.value as DependencyNode["status"] }))}
              style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)", color: "#fff", fontSize: 12, outline: "none" }}
            >
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.icon} {v.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600, display: "block", marginBottom: 4 }}>Label</label>
          <input
            value={newNode.label || ""}
            onChange={(e) => setNewNode((p) => ({ ...p, label: e.target.value }))}
            placeholder="Node label..."
            style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)", color: "#fff", fontSize: 12, outline: "none", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600, display: "block", marginBottom: 4 }}>Description</label>
          <input
            value={newNode.description || ""}
            onChange={(e) => setNewNode((p) => ({ ...p, description: e.target.value }))}
            placeholder="Brief description..."
            style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)", color: "#fff", fontSize: 12, outline: "none", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={() => setShowAddNode(false)} style={btnStyle(false)}>Cancel</button>
          <button onClick={addNode} style={btnStyle(true, "#10b981")}>Add Node</button>
        </div>
      </div>
    );
  };

  const renderAddLinkForm = () => {
    if (!showAddLink) return null;
    return (
      <div style={{ ...cardStyle, borderColor: "rgba(16,185,129,0.2)", marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 12 }}>
          {t("evidence.addLink") || "Add Link"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
          <div>
            <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600, display: "block", marginBottom: 4 }}>Source</label>
            <select
              value={newLink.sourceId || ""}
              onChange={(e) => setNewLink((p) => ({ ...p, sourceId: e.target.value }))}
              style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)", color: "#fff", fontSize: 11, outline: "none" }}
            >
              <option value="">Select source...</option>
              {data.nodes.map((n) => (
                <option key={n.id} value={n.id}>{NODE_CONFIG[n.type].icon} {n.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600, display: "block", marginBottom: 4 }}>Target</label>
            <select
              value={newLink.targetId || ""}
              onChange={(e) => setNewLink((p) => ({ ...p, targetId: e.target.value }))}
              style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)", color: "#fff", fontSize: 11, outline: "none" }}
            >
              <option value="">Select target...</option>
              {data.nodes.map((n) => (
                <option key={n.id} value={n.id}>{NODE_CONFIG[n.type].icon} {n.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600, display: "block", marginBottom: 4 }}>Strength</label>
            <select
              value={newLink.strength || "moderate"}
              onChange={(e) => setNewLink((p) => ({ ...p, strength: e.target.value as LinkStrength }))}
              style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)", color: "#fff", fontSize: 11, outline: "none" }}
            >
              {Object.entries(STRENGTH_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600, display: "block", marginBottom: 4 }}>Description</label>
          <input
            value={newLink.description || ""}
            onChange={(e) => setNewLink((p) => ({ ...p, description: e.target.value }))}
            placeholder="Link description..."
            style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)", color: "#fff", fontSize: 12, outline: "none", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={() => setShowAddLink(false)} style={btnStyle(false)}>Cancel</button>
          <button onClick={addLink} style={btnStyle(true, "#10b981")}>Add Link</button>
        </div>
      </div>
    );
  };

  // ─── Main Render ───────────────────────────────────────────────────

  return (
    <PageShell>
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "12px" : "24px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: isMobile ? 18 : 22, fontWeight: 700, color: "hsl(var(--foreground))", display: "flex", alignItems: "center", gap: 10 }}>
            🔬 {t("evidence.title") || "Evidence Dependency Graph"}
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "hsl(var(--muted-foreground))" }}>
            {t("evidence.subtitle") || "Visualize how evidence, claims, and theories interconnect"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowAddNode(true)} style={btnStyle(false, "#6366f1")}>
            + {!isMobile ? (t("evidence.addNode") || "Add Node") : ""}
          </button>
          <button onClick={() => setShowAddLink(true)} style={btnStyle(false, "#10b981")}>
            + {!isMobile ? (t("evidence.addLink") || "Add Link") : ""}
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={statCardStyle("#6366f1")}>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#a5b4fc" }}>{stats.totalNodes}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{t("evidence.nodes") || "Nodes"}</div>
        </div>
        <div style={statCardStyle("#10b981")}>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#6ee7b7" }}>{stats.totalLinks}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{t("evidence.links") || "Links"}</div>
        </div>
        <div style={statCardStyle("#f59e0b")}>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#fcd34d" }}>{stats.avgConfidence}%</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{t("evidence.avgConfidence") || "Avg Confidence"}</div>
        </div>
        <div style={statCardStyle(gaps.length > 0 ? "#ef4444" : "#10b981")}>
          <div style={{ fontSize: 24, fontWeight: 700, color: gaps.length > 0 ? "#fca5a5" : "#6ee7b7" }}>{stats.totalGaps}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{t("evidence.gaps") || "Evidence Gaps"}</div>
        </div>
        {Object.entries(stats.byType).map(([type, count]) => {
          const cfg = NODE_CONFIG[type as NodeType];
          return (
            <div key={type} style={statCardStyle(cfg.color)}>
              <div style={{ fontSize: 18, fontWeight: 700, color: cfg.color }}>{count}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{cfg.icon} {cfg.label}s</div>
            </div>
          );
        })}
      </div>

      {/* View Mode & Filter Toolbar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 4 }}>
          {(["graph", "matrix", "list", "gaps"] as ViewMode[]).map((mode) => (
            <button key={mode} onClick={() => setViewMode(mode)} style={btnStyle(viewMode === mode)}>
              {mode === "graph" ? "🗺 Graph" : mode === "matrix" ? "📊 Matrix" : mode === "list" ? "📋 List" : `⚠️ Gaps (${gaps.length})`}
            </button>
          ))}
        </div>
        <span style={{ color: "rgba(255,255,255,0.1)", margin: "0 4px" }}>|</span>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={() => setFilterType("all")} style={btnStyle(filterType === "all", "#71717a")}>
            All
          </button>
          {Object.entries(NODE_CONFIG).map(([key, cfg]) => (
            <button key={key} onClick={() => setFilterType(key as NodeType)} style={btnStyle(filterType === key, cfg.color)}>
              {cfg.icon} {cfg.label}
            </button>
          ))}
        </div>
      </div>

      {/* Add Forms */}
      {renderAddNodeForm()}
      {renderAddLinkForm()}

      {/* Selected Node Detail */}
      {renderNodeDetail()}

      {/* Content */}
      <div style={cardStyle}>
        {viewMode === "graph" && renderGraphView()}
        {viewMode === "matrix" && renderMatrixView()}
        {viewMode === "list" && renderListView()}
        {viewMode === "gaps" && renderGapsView()}
      </div>
    </div>
    </PageShell>
  );
};

export default EvidenceDependencyGraphPage;
