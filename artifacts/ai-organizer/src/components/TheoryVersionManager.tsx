// src/components/TheoryVersionManager.tsx
// Theory Version Manager — manage multiple formulations of a theory
import { useState, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────────────
type FormulationType = 'conceptual' | 'mathematical' | 'computational' | 'bridging' | 'simplified' | 'extended';

interface TheoryVersion {
  id: string;
  name: string;
  formulationType: FormulationType;
  description: string;
  content: string;
  assumptions: string[];
  scope: string;
  limitations: string;
  relationships: VersionRelation[];
  status: 'draft' | 'stable' | 'deprecated' | 'experimental';
  createdAt: number;
  updatedAt: number;
}

interface VersionRelation {
  targetId: string;
  type: 'derives-from' | 'simplifies' | 'extends' | 'contradicts' | 'bridges' | 'replaces';
}

interface TheoryVersionManagerProps {
  open: boolean;
  onClose: () => void;
}

// ─── Constants ───────────────────────────────────────────────────────
const STORAGE_KEY = 'thinkspace-theory-versions';

const FORMULATION_INFO: Record<FormulationType, { icon: string; label: string; color: string; description: string }> = {
  conceptual:     { icon: '💡', label: 'Conceptual',     color: '#6366f1', description: 'Natural language description of the theory' },
  mathematical:   { icon: '📐', label: 'Mathematical',   color: '#10b981', description: 'Formal mathematical formulation' },
  computational:  { icon: '💻', label: 'Computational',  color: '#06b6d4', description: 'Algorithmic/computational model' },
  bridging:       { icon: '🌉', label: 'Bridging',       color: '#f59e0b', description: 'Connects different formulations' },
  simplified:     { icon: '📝', label: 'Simplified',     color: '#8b5cf6', description: 'Accessible simplified version' },
  extended:       { icon: '🔬', label: 'Extended',       color: '#ec4899', description: 'Extended version with additional scope' },
};

const STATUS_INFO: Record<string, { color: string; label: string }> = {
  draft:        { color: '#6366f1', label: 'Draft' },
  stable:       { color: '#10b981', label: 'Stable' },
  deprecated:   { color: '#6b7280', label: 'Deprecated' },
  experimental: { color: '#f59e0b', label: 'Experimental' },
};

const RELATION_INFO: Record<string, { icon: string; label: string; color: string }> = {
  'derives-from': { icon: '⬆️', label: 'Derives from', color: '#6366f1' },
  'simplifies':   { icon: '📝', label: 'Simplifies',   color: '#8b5cf6' },
  'extends':      { icon: '🔬', label: 'Extends',      color: '#10b981' },
  'contradicts':  { icon: '⚡', label: 'Contradicts',  color: '#ef4444' },
  'bridges':      { icon: '🌉', label: 'Bridges to',   color: '#f59e0b' },
  'replaces':     { icon: '🔄', label: 'Replaces',     color: '#06b6d4' },
};

function generateId(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

function loadVersions(): TheoryVersion[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveVersions(versions: TheoryVersion[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(versions));
}

// ─── Component ───────────────────────────────────────────────────────
export function TheoryVersionManager({ open, onClose }: TheoryVersionManagerProps) {
  const [versions, setVersions] = useState<TheoryVersion[]>(() => loadVersions());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [compareId, setCompareId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'detail' | 'compare' | 'graph'>('detail');

  const persist = useCallback((updated: TheoryVersion[]) => {
    setVersions(updated);
    saveVersions(updated);
  }, []);

  const selected = versions.find(v => v.id === selectedId) || null;
  const compareVersion = versions.find(v => v.id === compareId) || null;

  const createVersion = useCallback((type: FormulationType) => {
    const now = Date.now();
    const v: TheoryVersion = {
      id: generateId(), name: `New ${FORMULATION_INFO[type].label} Version`,
      formulationType: type, description: '', content: '',
      assumptions: [], scope: '', limitations: '',
      relationships: [], status: 'draft',
      createdAt: now, updatedAt: now,
    };
    persist([v, ...versions]);
    setSelectedId(v.id);
    setViewMode('detail');
  }, [versions, persist]);

  const updateVersion = useCallback((id: string, updates: Partial<TheoryVersion>) => {
    persist(versions.map(v => v.id === id ? { ...v, ...updates, updatedAt: Date.now() } : v));
  }, [versions, persist]);

  const deleteVersion = useCallback((id: string) => {
    persist(versions.filter(v => v.id !== id));
    if (selectedId === id) setSelectedId(null);
    if (compareId === id) setCompareId(null);
  }, [versions, persist, selectedId, compareId]);

  const addAssumption = useCallback((id: string) => {
    const v = versions.find(ver => ver.id === id);
    if (v) updateVersion(id, { assumptions: [...v.assumptions, ''] });
  }, [versions, updateVersion]);

  const updateAssumption = useCallback((verId: string, idx: number, value: string) => {
    const v = versions.find(ver => ver.id === verId);
    if (v) {
      const updated = [...v.assumptions];
      updated[idx] = value;
      updateVersion(verId, { assumptions: updated });
    }
  }, [versions, updateVersion]);

  const removeAssumption = useCallback((verId: string, idx: number) => {
    const v = versions.find(ver => ver.id === verId);
    if (v) updateVersion(verId, { assumptions: v.assumptions.filter((_, i) => i !== idx) });
  }, [versions, updateVersion]);

  const addRelation = useCallback((fromId: string, toId: string, type: VersionRelation['type']) => {
    const v = versions.find(ver => ver.id === fromId);
    if (v && !v.relationships.some(r => r.targetId === toId && r.type === type)) {
      updateVersion(fromId, { relationships: [...v.relationships, { targetId: toId, type }] });
    }
  }, [versions, updateVersion]);

  const removeRelation = useCallback((fromId: string, idx: number) => {
    const v = versions.find(ver => ver.id === fromId);
    if (v) updateVersion(fromId, { relationships: v.relationships.filter((_, i) => i !== idx) });
  }, [versions, updateVersion]);

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '94vw', maxWidth: 1300, maxHeight: '92vh',
          background: 'linear-gradient(165deg, rgba(16,18,30,0.98), rgba(8,10,18,1))',
          border: '1px solid rgba(139,92,246,0.2)', borderRadius: 20,
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(99,102,241,0.06))',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
              📚 Theory Version Manager
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
              Maintain multiple formulations: conceptual, mathematical, computational, bridging
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10, padding: '8px 12px', color: 'rgba(255,255,255,0.7)',
            cursor: 'pointer', fontSize: 18,
          }}>✕</button>
        </div>

        {/* Toolbar */}
        <div style={{
          padding: '10px 24px', borderBottom: '1px solid rgba(255,255,255,0.04)',
          display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
          background: 'rgba(0,0,0,0.1)',
        }}>
          {/* Create buttons */}
          {Object.entries(FORMULATION_INFO).map(([k, v]) => (
            <button key={k} onClick={() => createVersion(k as FormulationType)}
              style={{
                padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                border: `1px solid ${v.color}25`, background: `${v.color}08`,
                color: v.color, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
              }}
              title={v.description}
            >{v.icon} + {v.label}</button>
          ))}

          {/* View toggle */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
            {(['detail', 'compare', 'graph'] as const).map(m => (
              <button key={m} onClick={() => setViewMode(m)} style={{
                padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                border: viewMode === m ? '1px solid rgba(139,92,246,0.4)' : '1px solid rgba(255,255,255,0.08)',
                background: viewMode === m ? 'rgba(139,92,246,0.15)' : 'transparent',
                color: viewMode === m ? '#c4b5fd' : 'rgba(255,255,255,0.4)',
                cursor: 'pointer', textTransform: 'capitalize',
              }}>{m === 'graph' ? '🗺 Graph' : m === 'compare' ? '⚖ Compare' : '📄 Detail'}</button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
          {/* Versions list */}
          <div style={{
            width: selected ? 260 : '100%', minWidth: selected ? 260 : undefined,
            borderRight: selected ? '1px solid rgba(255,255,255,0.06)' : 'none',
            overflow: 'auto', padding: '12px',
          }}>
            {versions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 16px', color: 'rgba(255,255,255,0.4)' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>No theory versions</div>
                <div style={{ fontSize: 12 }}>Create your first formulation above</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {versions.map(v => {
                  const fInfo = FORMULATION_INFO[v.formulationType];
                  const sInfo = STATUS_INFO[v.status];
                  return (
                    <button key={v.id}
                      onClick={() => setSelectedId(selectedId === v.id ? null : v.id)}
                      style={{
                        padding: '10px 12px', borderRadius: 10, textAlign: 'left', width: '100%',
                        border: selectedId === v.id ? `1px solid ${fInfo.color}40` : '1px solid rgba(255,255,255,0.06)',
                        background: selectedId === v.id ? `${fInfo.color}08` : 'rgba(255,255,255,0.02)',
                        color: '#fff', cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 14 }}>{fInfo.icon}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {v.name}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
                          background: `${fInfo.color}15`, color: fInfo.color,
                          border: `1px solid ${fInfo.color}20`,
                        }}>{fInfo.label}</span>
                        <span style={{
                          fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
                          background: `${sInfo.color}15`, color: sInfo.color,
                        }}>{sInfo.label}</span>
                        {viewMode === 'compare' && (
                          <button
                            onClick={e => { e.stopPropagation(); setCompareId(v.id === compareId ? null : v.id); }}
                            style={{
                              marginLeft: 'auto', padding: '2px 6px', borderRadius: 4,
                              fontSize: 10, fontWeight: 600, cursor: 'pointer',
                              border: compareId === v.id ? '1px solid rgba(245,158,11,0.4)' : '1px solid rgba(255,255,255,0.1)',
                              background: compareId === v.id ? 'rgba(245,158,11,0.15)' : 'transparent',
                              color: compareId === v.id ? '#fcd34d' : 'rgba(255,255,255,0.3)',
                            }}
                          >{compareId === v.id ? '✓ B' : 'B'}</button>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detail/Compare/Graph */}
          {selected && viewMode === 'detail' && (
            <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Name & status */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 4, display: 'block' }}>Version Name</label>
                    <input value={selected.name} onChange={e => updateVersion(selected.id, { name: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 4, display: 'block' }}>Status</label>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {Object.entries(STATUS_INFO).map(([k, v]) => (
                        <button key={k} onClick={() => updateVersion(selected.id, { status: k as TheoryVersion['status'] })}
                          style={{
                            padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                            border: selected.status === k ? `1px solid ${v.color}40` : '1px solid rgba(255,255,255,0.08)',
                            background: selected.status === k ? `${v.color}15` : 'transparent',
                            color: selected.status === k ? v.color : 'rgba(255,255,255,0.3)',
                            cursor: 'pointer',
                          }}>{v.label}</button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 4, display: 'block' }}>Description</label>
                  <textarea value={selected.description} onChange={e => updateVersion(selected.id, { description: e.target.value })}
                    placeholder="Brief description of this formulation..."
                    rows={2} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 13, outline: 'none', resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box' }} />
                </div>

                {/* Content */}
                <div>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 4, display: 'block' }}>
                    {FORMULATION_INFO[selected.formulationType].icon} {FORMULATION_INFO[selected.formulationType].label} Content
                  </label>
                  <textarea value={selected.content} onChange={e => updateVersion(selected.id, { content: e.target.value })}
                    placeholder={selected.formulationType === 'mathematical' ? 'Enter mathematical formulation (LaTeX supported)...' : 'Enter theory content...'}
                    rows={8} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 13, outline: 'none', resize: 'vertical', lineHeight: 1.7, fontFamily: selected.formulationType === 'mathematical' || selected.formulationType === 'computational' ? 'monospace' : 'inherit', boxSizing: 'border-box' }} />
                </div>

                {/* Scope & Limitations */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 4, display: 'block' }}>Scope</label>
                    <textarea value={selected.scope} onChange={e => updateVersion(selected.id, { scope: e.target.value })}
                      placeholder="What does this version cover?" rows={3}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 12, outline: 'none', resize: 'vertical', lineHeight: 1.5, boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 4, display: 'block' }}>Limitations</label>
                    <textarea value={selected.limitations} onChange={e => updateVersion(selected.id, { limitations: e.target.value })}
                      placeholder="Known limitations of this formulation..." rows={3}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 12, outline: 'none', resize: 'vertical', lineHeight: 1.5, boxSizing: 'border-box' }} />
                  </div>
                </div>

                {/* Assumptions */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Assumptions ({selected.assumptions.length})</label>
                    <button onClick={() => addAssumption(selected.id)} style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.08)', color: '#6ee7b7', cursor: 'pointer' }}>+</button>
                  </div>
                  {selected.assumptions.map((a, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', paddingTop: 8, minWidth: 20 }}>{idx + 1}.</span>
                      <input value={a} onChange={e => updateAssumption(selected.id, idx, e.target.value)}
                        placeholder="Assumption..."
                        style={{ flex: 1, padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: 12, outline: 'none' }} />
                      <button onClick={() => removeAssumption(selected.id, idx)}
                        style={{ border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', fontSize: 14, padding: '4px 6px' }}>✕</button>
                    </div>
                  ))}
                </div>

                {/* Relationships */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Relationships ({selected.relationships.length})</label>
                  </div>
                  {selected.relationships.map((rel, idx) => {
                    const target = versions.find(v => v.id === rel.targetId);
                    const rInfo = RELATION_INFO[rel.type];
                    return (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, padding: '4px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <span style={{ fontSize: 12 }}>{rInfo?.icon}</span>
                        <span style={{ fontSize: 11, color: rInfo?.color || '#fff', fontWeight: 600 }}>{rInfo?.label}</span>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{target?.name || 'Unknown'}</span>
                        <button onClick={() => removeRelation(selected.id, idx)} style={{ marginLeft: 'auto', border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', fontSize: 12 }}>✕</button>
                      </div>
                    );
                  })}
                  {/* Add relation */}
                  {versions.filter(v => v.id !== selected.id).length > 0 && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                      <select id="rel-target" style={{ flex: 1, padding: '4px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.3)', color: '#eaeaea', fontSize: 11, outline: 'none' }}>
                        {versions.filter(v => v.id !== selected.id).map(v => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
                      <select id="rel-type" style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.3)', color: '#eaeaea', fontSize: 11, outline: 'none' }}>
                        {Object.entries(RELATION_INFO).map(([k, v]) => (
                          <option key={k} value={k}>{v.icon} {v.label}</option>
                        ))}
                      </select>
                      <button onClick={() => {
                        const target = (document.getElementById('rel-target') as HTMLSelectElement)?.value;
                        const type = (document.getElementById('rel-type') as HTMLSelectElement)?.value as VersionRelation['type'];
                        if (target) addRelation(selected.id, target, type);
                      }} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', cursor: 'pointer' }}>+ Link</button>
                    </div>
                  )}
                </div>

                {/* Delete */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => deleteVersion(selected.id)} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.08)', color: '#fca5a5', cursor: 'pointer' }}>🗑 Delete Version</button>
                </div>
              </div>
            </div>
          )}

          {/* Compare view */}
          {selected && viewMode === 'compare' && (
            <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
              {!compareVersion ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.4)' }}>
                  Select a version from the list and click "B" to compare with the currently selected version.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {[selected, compareVersion].map((v, i) => {
                    const fInfo = FORMULATION_INFO[v.formulationType];
                    return (
                      <div key={v.id} style={{
                        padding: '16px', borderRadius: 14,
                        border: `1px solid ${i === 0 ? 'rgba(99,102,241,0.2)' : 'rgba(245,158,11,0.2)'}`,
                        background: i === 0 ? 'rgba(99,102,241,0.04)' : 'rgba(245,158,11,0.04)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: i === 0 ? '#a5b4fc' : '#fcd34d', background: i === 0 ? 'rgba(99,102,241,0.2)' : 'rgba(245,158,11,0.2)', padding: '2px 8px', borderRadius: 6 }}>
                            Version {i === 0 ? 'A' : 'B'}
                          </span>
                          <span style={{ fontSize: 14 }}>{fInfo.icon}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{v.name}</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 8 }}>{v.description || 'No description'}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: v.formulationType === 'mathematical' ? 'monospace' : 'inherit', padding: '10px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.04)', maxHeight: 300, overflow: 'auto' }}>
                          {v.content || 'No content yet'}
                        </div>
                        <div style={{ marginTop: 10, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                          Assumptions: {v.assumptions.filter(a => a.trim()).length} · Scope: {v.scope ? '✓' : '—'} · Status: {STATUS_INFO[v.status].label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Graph view */}
          {selected && viewMode === 'graph' && (
            <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 12 }}>
                Version Relationship Map
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {versions.map(v => {
                  const fInfo = FORMULATION_INFO[v.formulationType];
                  return (
                    <div key={v.id} style={{
                      padding: '14px', borderRadius: 12, minWidth: 200,
                      border: v.id === selectedId ? `2px solid ${fInfo.color}60` : '1px solid rgba(255,255,255,0.08)',
                      background: `${fInfo.color}06`, cursor: 'pointer',
                    }} onClick={() => setSelectedId(v.id)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <span style={{ fontSize: 16 }}>{fInfo.icon}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{v.name}</span>
                      </div>
                      <div style={{ fontSize: 10, color: fInfo.color, fontWeight: 600, marginBottom: 4 }}>{fInfo.label}</div>
                      {v.relationships.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {v.relationships.map((r, i) => {
                            const target = versions.find(tv => tv.id === r.targetId);
                            const rInfo = RELATION_INFO[r.type];
                            return (
                              <div key={i} style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', display: 'flex', gap: 4 }}>
                                <span style={{ color: rInfo?.color }}>{rInfo?.icon}</span>
                                <span>{rInfo?.label}</span>
                                <span style={{ color: 'rgba(255,255,255,0.5)' }}>{target?.name || '?'}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!selected && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)' }}>
              Select a version from the list
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TheoryVersionManager;
