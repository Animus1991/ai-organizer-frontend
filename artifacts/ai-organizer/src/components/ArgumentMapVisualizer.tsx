/**
 * ArgumentMapVisualizer Component (M)
 *
 * Interactive argument map showing claims → evidence → counter-arguments
 * as a directed graph. Nodes colored by status (validated/disputed/draft).
 * Supports adding nodes, edges, and visualizing argument structure.
 *
 * Persists to localStorage.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';

// ── Types ──

type NodeType = 'claim' | 'evidence' | 'counter' | 'assumption' | 'definition' | 'prediction';
type NodeStatus = 'draft' | 'validated' | 'disputed' | 'deprecated' | 'needs_evidence';
type EdgeType = 'supports' | 'contradicts' | 'depends_on' | 'refines' | 'generalizes' | 'is_example_of';

interface ArgNode {
  id: string;
  label: string;
  type: NodeType;
  status: NodeStatus;
  description: string;
  domain?: string;
  createdAt: string;
}

interface ArgEdge {
  id: string;
  from: string;
  to: string;
  type: EdgeType;
  label?: string;
}

interface ArgumentMapVisualizerProps {
  open: boolean;
  onClose: () => void;
}

// ── Constants ──

const STORAGE_KEY = 'thinkspace-argument-map';

const NODE_TYPES: { value: NodeType; label: string; icon: string; color: string }[] = [
  { value: 'claim', label: 'Claim', icon: '💬', color: '#3b82f6' },
  { value: 'evidence', label: 'Evidence', icon: '📄', color: '#10b981' },
  { value: 'counter', label: 'Counter-Argument', icon: '⚔️', color: '#ef4444' },
  { value: 'assumption', label: 'Assumption', icon: '🧠', color: '#8b5cf6' },
  { value: 'definition', label: 'Definition', icon: '📖', color: '#06b6d4' },
  { value: 'prediction', label: 'Prediction', icon: '🔮', color: '#f59e0b' },
];

const NODE_STATUSES: { value: NodeStatus; label: string; color: string }[] = [
  { value: 'draft', label: 'Draft', color: '#6b7280' },
  { value: 'validated', label: 'Validated', color: '#10b981' },
  { value: 'disputed', label: 'Disputed', color: '#ef4444' },
  { value: 'deprecated', label: 'Deprecated', color: '#4b5563' },
  { value: 'needs_evidence', label: 'Needs Evidence', color: '#f59e0b' },
];

const EDGE_TYPES: { value: EdgeType; label: string; color: string; arrow: string }[] = [
  { value: 'supports', label: 'Supports', color: '#10b981', arrow: '→' },
  { value: 'contradicts', label: 'Contradicts', color: '#ef4444', arrow: '⇥' },
  { value: 'depends_on', label: 'Depends On', color: '#3b82f6', arrow: '←' },
  { value: 'refines', label: 'Refines', color: '#8b5cf6', arrow: '→' },
  { value: 'generalizes', label: 'Generalizes', color: '#06b6d4', arrow: '→' },
  { value: 'is_example_of', label: 'Is Example Of', color: '#f59e0b', arrow: '→' },
];

// ── Component ──

export function ArgumentMapVisualizer({ open, onClose }: ArgumentMapVisualizerProps) {
  const [nodes, setNodes] = useState<ArgNode[]>([]);
  const [edges, setEdges] = useState<ArgEdge[]>([]);
  const [view, setView] = useState<'graph' | 'add_node' | 'add_edge' | 'list'>('graph');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

  // Form state - Node
  const [nLabel, setNLabel] = useState('');
  const [nType, setNType] = useState<NodeType>('claim');
  const [nStatus, setNStatus] = useState<NodeStatus>('draft');
  const [nDescription, setNDescription] = useState('');
  const [nDomain, setNDomain] = useState('General');

  // Form state - Edge
  const [eFrom, setEFrom] = useState('');
  const [eTo, setETo] = useState('');
  const [eType, setEType] = useState<EdgeType>('supports');
  const [eLabel, setELabel] = useState('');

  // ── Load / Save ──
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
      }
    } catch { /* ignore */ }
  }, []);

  const persist = useCallback((n: ArgNode[], e: ArgEdge[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes: n, edges: e }));
  }, []);

  // ── Node CRUD ──
  const resetNodeForm = useCallback(() => {
    setNLabel(''); setNType('claim'); setNStatus('draft');
    setNDescription(''); setNDomain('General'); setEditingNodeId(null);
  }, []);

  const saveNode = useCallback(() => {
    if (!nLabel.trim()) return;
    const now = new Date().toISOString();

    if (editingNodeId) {
      const updated = nodes.map(n => n.id === editingNodeId ? {
        ...n, label: nLabel.trim(), type: nType, status: nStatus,
        description: nDescription, domain: nDomain,
      } : n);
      setNodes(updated);
      persist(updated, edges);
    } else {
      const newNode: ArgNode = {
        id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        label: nLabel.trim(), type: nType, status: nStatus,
        description: nDescription, domain: nDomain, createdAt: now,
      };
      const updated = [...nodes, newNode];
      setNodes(updated);
      persist(updated, edges);
    }
    resetNodeForm();
    setView('graph');
  }, [nLabel, nType, nStatus, nDescription, nDomain, editingNodeId, nodes, edges, persist, resetNodeForm]);

  const startEditNode = useCallback((n: ArgNode) => {
    setNLabel(n.label); setNType(n.type); setNStatus(n.status);
    setNDescription(n.description); setNDomain(n.domain || 'General');
    setEditingNodeId(n.id); setView('add_node');
  }, []);

  const deleteNode = useCallback((id: string) => {
    const updatedNodes = nodes.filter(n => n.id !== id);
    const updatedEdges = edges.filter(e => e.from !== id && e.to !== id);
    setNodes(updatedNodes);
    setEdges(updatedEdges);
    persist(updatedNodes, updatedEdges);
    if (selectedNodeId === id) setSelectedNodeId(null);
  }, [nodes, edges, selectedNodeId, persist]);

  // ── Edge CRUD ──
  const saveEdge = useCallback(() => {
    if (!eFrom || !eTo || eFrom === eTo) return;
    const existing = edges.find(e => e.from === eFrom && e.to === eTo && e.type === eType);
    if (existing) return;

    const newEdge: ArgEdge = {
      id: `edge-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      from: eFrom, to: eTo, type: eType, label: eLabel.trim() || undefined,
    };
    const updated = [...edges, newEdge];
    setEdges(updated);
    persist(nodes, updated);
    setEFrom(''); setETo(''); setEType('supports'); setELabel('');
    setView('graph');
  }, [eFrom, eTo, eType, eLabel, edges, nodes, persist]);

  const deleteEdge = useCallback((id: string) => {
    const updated = edges.filter(e => e.id !== id);
    setEdges(updated);
    persist(nodes, updated);
  }, [edges, nodes, persist]);

  // ── Stats ──
  const stats = useMemo(() => {
    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    nodes.forEach(n => {
      byType[n.type] = (byType[n.type] || 0) + 1;
      byStatus[n.status] = (byStatus[n.status] || 0) + 1;
    });

    // Calculate argument strength
    const totalClaims = nodes.filter(n => n.type === 'claim').length;
    const validatedClaims = nodes.filter(n => n.type === 'claim' && n.status === 'validated').length;
    const evidenceCount = nodes.filter(n => n.type === 'evidence').length;
    const counterCount = nodes.filter(n => n.type === 'counter').length;
    const supportEdges = edges.filter(e => e.type === 'supports').length;
    const contradictEdges = edges.filter(e => e.type === 'contradicts').length;

    const claimCoverage = totalClaims > 0 ? Math.round((validatedClaims / totalClaims) * 100) : 0;
    const evidenceRatio = totalClaims > 0 ? (evidenceCount / totalClaims).toFixed(1) : '0';
    const supportRatio = (supportEdges + contradictEdges) > 0
      ? Math.round((supportEdges / (supportEdges + contradictEdges)) * 100) : 0;

    return {
      totalNodes: nodes.length, totalEdges: edges.length,
      byType, byStatus, claimCoverage, evidenceRatio, supportRatio,
      totalClaims, evidenceCount, counterCount,
    };
  }, [nodes, edges]);

  // ── Selected node details ──
  const selectedNode = useMemo(() => nodes.find(n => n.id === selectedNodeId), [nodes, selectedNodeId]);
  const selectedEdges = useMemo(() => {
    if (!selectedNodeId) return { incoming: [] as (ArgEdge & { node: ArgNode })[], outgoing: [] as (ArgEdge & { node: ArgNode })[] };
    const incoming = edges.filter(e => e.to === selectedNodeId).map(e => ({
      ...e, node: nodes.find(n => n.id === e.from)!,
    })).filter(e => e.node);
    const outgoing = edges.filter(e => e.from === selectedNodeId).map(e => ({
      ...e, node: nodes.find(n => n.id === e.to)!,
    })).filter(e => e.node);
    return { incoming, outgoing };
  }, [selectedNodeId, edges, nodes]);

  if (!open) return null;

  const getNodeTypeInfo = (type: NodeType) => NODE_TYPES.find(t => t.value === type)!;
  const getStatusInfo = (status: NodeStatus) => NODE_STATUSES.find(s => s.value === status)!;
  const getEdgeTypeInfo = (type: EdgeType) => EDGE_TYPES.find(t => t.value === type)!;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '92vw', maxWidth: 1050, maxHeight: '90vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #0f2027 100%)',
        borderRadius: 16, border: '1px solid rgba(59,130,246,0.2)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(59,130,246,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22 }}>🗺️</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#fafafa' }}>Argument Map</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                {stats.totalNodes} nodes — {stats.totalEdges} edges — {stats.claimCoverage}% claims validated
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {(['graph', 'list', 'add_node', 'add_edge'] as const).map(v => (
              <button key={v} onClick={() => { if (v === 'add_node') resetNodeForm(); setView(v); }} style={{
                padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                border: view === v ? '1px solid rgba(59,130,246,0.5)' : '1px solid rgba(255,255,255,0.1)',
                background: view === v ? 'rgba(59,130,246,0.12)' : 'transparent',
                color: view === v ? '#93c5fd' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
              }}>
                {v === 'graph' ? '🗺️ Map' : v === 'list' ? '📋 List' : v === 'add_node' ? '➕ Node' : '🔗 Edge'}
              </button>
            ))}
            <button onClick={onClose} style={{
              marginLeft: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '6px 12px', fontSize: 13,
            }}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>

          {/* ── GRAPH VIEW ── */}
          {view === 'graph' && (
            <div>
              {/* Stats row */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                {NODE_TYPES.map(nt => (
                  <div key={nt.value} style={{
                    padding: '8px 14px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6,
                    background: `${nt.color}08`, border: `1px solid ${nt.color}20`,
                  }}>
                    <span>{nt.icon}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: nt.color }}>{stats.byType[nt.value] || 0}</span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{nt.label}</span>
                  </div>
                ))}
              </div>

              {nodes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px 20px', color: 'rgba(255,255,255,0.3)' }}>
                  <div style={{ fontSize: 44, marginBottom: 12 }}>🗺️</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>No argument nodes yet</div>
                  <div style={{ fontSize: 12 }}>Click "➕ Node" to add claims, evidence, and counter-arguments.</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: selectedNode ? '1fr 320px' : '1fr', gap: 16 }}>
                  {/* Nodes grid */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignContent: 'flex-start' }}>
                    {nodes.map(node => {
                      const typeInfo = getNodeTypeInfo(node.type);
                      const statusInfo = getStatusInfo(node.status);
                      const isSelected = selectedNodeId === node.id;
                      const incomingCount = edges.filter(e => e.to === node.id).length;
                      const outgoingCount = edges.filter(e => e.from === node.id).length;

                      return (
                        <div key={node.id} onClick={() => setSelectedNodeId(isSelected ? null : node.id)} style={{
                          padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                          background: isSelected ? `${typeInfo.color}15` : 'rgba(255,255,255,0.03)',
                          border: `2px solid ${isSelected ? typeInfo.color + '60' : statusInfo.color + '30'}`,
                          minWidth: 140, maxWidth: 220, transition: 'all 0.2s ease',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <span style={{ fontSize: 14 }}>{typeInfo.icon}</span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {node.label}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            <span style={{
                              fontSize: 9, padding: '1px 5px', borderRadius: 3,
                              background: `${statusInfo.color}22`, color: statusInfo.color,
                              fontWeight: 600,
                            }}>{statusInfo.label}</span>
                            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>
                              ←{incomingCount} →{outgoingCount}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Selected node detail */}
                  {selectedNode && (
                    <div style={{
                      padding: '14px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <span style={{ fontSize: 20 }}>{getNodeTypeInfo(selectedNode.type).icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#fafafa' }}>{selectedNode.label}</div>
                          <div style={{ fontSize: 10, color: getStatusInfo(selectedNode.status).color }}>
                            {getStatusInfo(selectedNode.status).label}
                          </div>
                        </div>
                        <button onClick={() => startEditNode(selectedNode)} style={{
                          padding: '4px 8px', borderRadius: 6, fontSize: 11,
                          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                          color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
                        }}>✏️</button>
                        <button onClick={() => deleteNode(selectedNode.id)} style={{
                          padding: '4px 8px', borderRadius: 6, fontSize: 11,
                          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
                          color: '#fca5a5', cursor: 'pointer',
                        }}>🗑️</button>
                      </div>

                      {selectedNode.description && (
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 10, lineHeight: 1.5 }}>
                          {selectedNode.description}
                        </div>
                      )}

                      {/* Incoming edges */}
                      {selectedEdges.incoming.length > 0 && (
                        <div style={{ marginBottom: 8 }}>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase' }}>
                            Incoming ({selectedEdges.incoming.length})
                          </div>
                          {selectedEdges.incoming.map(e => {
                            const edgeInfo = getEdgeTypeInfo(e.type);
                            return (
                              <div key={e.id} style={{
                                display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px',
                                borderRadius: 6, background: 'rgba(255,255,255,0.02)', marginBottom: 3,
                              }}>
                                <span style={{ fontSize: 11 }}>{getNodeTypeInfo(e.node.type).icon}</span>
                                <span style={{ fontSize: 11, color: '#e2e8f0', flex: 1 }}>{e.node.label}</span>
                                <span style={{ fontSize: 9, color: edgeInfo.color, fontWeight: 600 }}>{edgeInfo.label}</span>
                                <button onClick={() => deleteEdge(e.id)} style={{
                                  padding: '1px 4px', borderRadius: 4, fontSize: 9,
                                  background: 'transparent', border: 'none',
                                  color: 'rgba(255,255,255,0.2)', cursor: 'pointer',
                                }}>✕</button>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Outgoing edges */}
                      {selectedEdges.outgoing.length > 0 && (
                        <div>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase' }}>
                            Outgoing ({selectedEdges.outgoing.length})
                          </div>
                          {selectedEdges.outgoing.map(e => {
                            const edgeInfo = getEdgeTypeInfo(e.type);
                            return (
                              <div key={e.id} style={{
                                display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px',
                                borderRadius: 6, background: 'rgba(255,255,255,0.02)', marginBottom: 3,
                              }}>
                                <span style={{ fontSize: 9, color: edgeInfo.color, fontWeight: 600 }}>{edgeInfo.label}</span>
                                <span style={{ fontSize: 11 }}>{getNodeTypeInfo(e.node.type).icon}</span>
                                <span style={{ fontSize: 11, color: '#e2e8f0', flex: 1 }}>{e.node.label}</span>
                                <button onClick={() => deleteEdge(e.id)} style={{
                                  padding: '1px 4px', borderRadius: 4, fontSize: 9,
                                  background: 'transparent', border: 'none',
                                  color: 'rgba(255,255,255,0.2)', cursor: 'pointer',
                                }}>✕</button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── LIST VIEW ── */}
          {view === 'list' && (
            <div>
              <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: '#fafafa' }}>All Nodes & Edges</h3>

              {/* Nodes */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                  Nodes ({nodes.length})
                </div>
                {nodes.map(n => {
                  const t = getNodeTypeInfo(n.type);
                  const s = getStatusInfo(n.status);
                  return (
                    <div key={n.id} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
                      borderRadius: 6, background: 'rgba(255,255,255,0.02)', marginBottom: 4,
                    }}>
                      <span>{t.icon}</span>
                      <span style={{ flex: 1, fontSize: 12, color: '#e2e8f0' }}>{n.label}</span>
                      <span style={{ fontSize: 9, color: t.color, fontWeight: 600 }}>{t.label}</span>
                      <span style={{ fontSize: 9, color: s.color }}>{s.label}</span>
                      <button onClick={() => startEditNode(n)} style={{
                        padding: '2px 6px', borderRadius: 4, fontSize: 10,
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                        color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
                      }}>✏️</button>
                      <button onClick={() => deleteNode(n.id)} style={{
                        padding: '2px 6px', borderRadius: 4, fontSize: 10,
                        background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)',
                        color: '#fca5a5', cursor: 'pointer',
                      }}>🗑️</button>
                    </div>
                  );
                })}
              </div>

              {/* Edges */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                  Edges ({edges.length})
                </div>
                {edges.map(e => {
                  const fromNode = nodes.find(n => n.id === e.from);
                  const toNode = nodes.find(n => n.id === e.to);
                  const eInfo = getEdgeTypeInfo(e.type);
                  if (!fromNode || !toNode) return null;
                  return (
                    <div key={e.id} style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px',
                      borderRadius: 6, background: 'rgba(255,255,255,0.02)', marginBottom: 3,
                    }}>
                      <span style={{ fontSize: 11, color: '#e2e8f0' }}>{fromNode.label}</span>
                      <span style={{ fontSize: 10, color: eInfo.color, fontWeight: 700 }}>
                        {eInfo.arrow} {eInfo.label}
                      </span>
                      <span style={{ fontSize: 11, color: '#e2e8f0' }}>{toNode.label}</span>
                      <button onClick={() => deleteEdge(e.id)} style={{
                        marginLeft: 'auto', padding: '2px 6px', borderRadius: 4, fontSize: 10,
                        background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)',
                        color: '#fca5a5', cursor: 'pointer',
                      }}>🗑️</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── ADD NODE VIEW ── */}
          {view === 'add_node' && (
            <div>
              <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: '#fafafa' }}>
                {editingNodeId ? '✏️ Edit Node' : '➕ Add Node'}
              </h3>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>Label *</label>
                <input value={nLabel} onChange={e => setNLabel(e.target.value)} placeholder="Node label..."
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: 8, boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fafafa', fontSize: 13,
                  }} />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>Type</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {NODE_TYPES.map(nt => (
                    <button key={nt.value} onClick={() => setNType(nt.value)} style={{
                      padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                      border: nType === nt.value ? `1px solid ${nt.color}80` : '1px solid rgba(255,255,255,0.08)',
                      background: nType === nt.value ? `${nt.color}18` : 'transparent',
                      color: nType === nt.value ? nt.color : 'rgba(255,255,255,0.4)',
                      cursor: 'pointer',
                    }}>{nt.icon} {nt.label}</button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>Status</label>
                <div style={{ display: 'flex', gap: 4 }}>
                  {NODE_STATUSES.map(ns => (
                    <button key={ns.value} onClick={() => setNStatus(ns.value)} style={{
                      flex: 1, padding: '6px 0', borderRadius: 6, fontSize: 11, fontWeight: 600,
                      border: nStatus === ns.value ? `1px solid ${ns.color}80` : '1px solid rgba(255,255,255,0.08)',
                      background: nStatus === ns.value ? `${ns.color}18` : 'transparent',
                      color: nStatus === ns.value ? ns.color : 'rgba(255,255,255,0.4)',
                      cursor: 'pointer',
                    }}>{ns.label}</button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>Description</label>
                <textarea value={nDescription} onChange={e => setNDescription(e.target.value)}
                  rows={3} placeholder="Describe this argument node..."
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: 8, boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fafafa', fontSize: 12, resize: 'vertical',
                  }} />
              </div>

              <button onClick={saveNode} disabled={!nLabel.trim()} style={{
                width: '100%', padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                background: nLabel.trim() ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)',
                border: nLabel.trim() ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(255,255,255,0.08)',
                color: nLabel.trim() ? '#93c5fd' : 'rgba(255,255,255,0.2)',
                cursor: nLabel.trim() ? 'pointer' : 'not-allowed',
              }}>
                {editingNodeId ? '💾 Update Node' : '➕ Add Node'}
              </button>
            </div>
          )}

          {/* ── ADD EDGE VIEW ── */}
          {view === 'add_edge' && (
            <div>
              <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: '#fafafa' }}>🔗 Add Edge</h3>

              {nodes.length < 2 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                  Add at least 2 nodes before creating edges.
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, marginBottom: 14 }}>
                    <div>
                      <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>From *</label>
                      <select value={eFrom} onChange={e => setEFrom(e.target.value)} style={{
                        width: '100%', padding: '8px 10px', borderRadius: 8,
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fafafa', fontSize: 12,
                      }}>
                        <option value="">— Select —</option>
                        {nodes.map(n => <option key={n.id} value={n.id}>{getNodeTypeInfo(n.type).icon} {n.label}</option>)}
                      </select>
                    </div>
                    <div style={{ alignSelf: 'flex-end', paddingBottom: 8, fontSize: 18, color: 'rgba(255,255,255,0.2)' }}>→</div>
                    <div>
                      <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>To *</label>
                      <select value={eTo} onChange={e => setETo(e.target.value)} style={{
                        width: '100%', padding: '8px 10px', borderRadius: 8,
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fafafa', fontSize: 12,
                      }}>
                        <option value="">— Select —</option>
                        {nodes.filter(n => n.id !== eFrom).map(n => <option key={n.id} value={n.id}>{getNodeTypeInfo(n.type).icon} {n.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>Relationship</label>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {EDGE_TYPES.map(et => (
                        <button key={et.value} onClick={() => setEType(et.value)} style={{
                          padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                          border: eType === et.value ? `1px solid ${et.color}80` : '1px solid rgba(255,255,255,0.08)',
                          background: eType === et.value ? `${et.color}18` : 'transparent',
                          color: eType === et.value ? et.color : 'rgba(255,255,255,0.4)',
                          cursor: 'pointer',
                        }}>{et.arrow} {et.label}</button>
                      ))}
                    </div>
                  </div>

                  <button onClick={saveEdge} disabled={!eFrom || !eTo || eFrom === eTo} style={{
                    width: '100%', padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                    background: (eFrom && eTo && eFrom !== eTo) ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)',
                    border: (eFrom && eTo && eFrom !== eTo) ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(255,255,255,0.08)',
                    color: (eFrom && eTo && eFrom !== eTo) ? '#93c5fd' : 'rgba(255,255,255,0.2)',
                    cursor: (eFrom && eTo && eFrom !== eTo) ? 'pointer' : 'not-allowed',
                  }}>🔗 Create Edge</button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ArgumentMapVisualizer;
