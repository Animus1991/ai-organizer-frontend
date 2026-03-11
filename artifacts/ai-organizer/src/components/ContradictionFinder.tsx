/**
 * ContradictionFinder Component (4.2)
 *
 * Detects contradictory claims within a theory:
 * - Direct contradictions (A says X, B says NOT X)
 * - Tension pairs (claims that pull in opposite directions)
 * - Scope conflicts (overlapping domains with incompatible conclusions)
 * - Resolution actions: merge, keep alternatives, deprecate
 *
 * Persists to localStorage.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';

// ── Types ──

type ContradictionType = 'direct' | 'tension' | 'scope_conflict' | 'assumption_clash' | 'temporal';
type ResolutionStatus = 'unresolved' | 'merged' | 'kept_alternatives' | 'deprecated_one' | 'resolved_other';

interface ClaimRef {
  id: string;
  label: string;
  source?: string;
}

interface Contradiction {
  id: string;
  type: ContradictionType;
  claimA: ClaimRef;
  claimB: ClaimRef;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  domain?: string;
  resolution: ResolutionStatus;
  resolutionNotes: string;
  detectedAt: string;
  resolvedAt?: string;
}

interface ContradictionFinderProps {
  open: boolean;
  onClose: () => void;
}

// ── Constants ──

const STORAGE_KEY = 'thinkspace-contradictions';

const CONTRADICTION_TYPES: { value: ContradictionType; label: string; icon: string; color: string; desc: string }[] = [
  { value: 'direct', label: 'Direct Contradiction', icon: '⚡', color: '#ef4444', desc: 'Claim A directly negates Claim B' },
  { value: 'tension', label: 'Tension Pair', icon: '↔️', color: '#f59e0b', desc: 'Claims pull in opposite directions without explicit negation' },
  { value: 'scope_conflict', label: 'Scope Conflict', icon: '🔀', color: '#8b5cf6', desc: 'Overlapping domains with incompatible conclusions' },
  { value: 'assumption_clash', label: 'Assumption Clash', icon: '🧠', color: '#3b82f6', desc: 'Underlying assumptions of two claims are incompatible' },
  { value: 'temporal', label: 'Temporal Conflict', icon: '⏳', color: '#06b6d4', desc: 'Claims valid at different times but treated as simultaneous' },
];

const RESOLUTION_OPTIONS: { value: ResolutionStatus; label: string; icon: string; color: string }[] = [
  { value: 'unresolved', label: 'Unresolved', icon: '❓', color: '#6b7280' },
  { value: 'merged', label: 'Merged', icon: '🔗', color: '#10b981' },
  { value: 'kept_alternatives', label: 'Kept as Alternatives', icon: '🔀', color: '#3b82f6' },
  { value: 'deprecated_one', label: 'Deprecated One', icon: '🗑️', color: '#f59e0b' },
  { value: 'resolved_other', label: 'Resolved Otherwise', icon: '✅', color: '#8b5cf6' },
];

const DOMAINS = [
  'General', 'Economics', 'Psychology', 'Physics', 'Biology',
  'Sociology', 'Philosophy', 'Mathematics', 'Methodology', 'Institutional',
];

const TEMPLATES: { name: string; type: ContradictionType; claimA: string; claimB: string; description: string }[] = [
  { name: 'Rational vs Irrational Agent', type: 'direct', claimA: 'Agents act rationally to maximize utility', claimB: 'Agents systematically deviate from rational behavior', description: 'Core assumption conflict between neoclassical and behavioral economics' },
  { name: 'Equilibrium vs Disequilibrium', type: 'tension', claimA: 'Markets tend toward equilibrium', claimB: 'Systems exhibit persistent entropy/disequilibrium', description: 'Tension between classical equilibrium theory and thermodynamic entropy view' },
  { name: 'Micro vs Macro Scope', type: 'scope_conflict', claimA: 'Individual decision-making follows X pattern', claimB: 'Aggregate behavior exhibits emergent Y pattern', description: 'Micro-level claims may not compose to macro-level observations' },
  { name: 'Static vs Dynamic Model', type: 'temporal', claimA: 'System state is determined by current parameters', claimB: 'System state depends on historical path (hysteresis)', description: 'Conflict between snapshot analysis and path-dependent dynamics' },
];

// ── Component ──

export function ContradictionFinder({ open, onClose }: ContradictionFinderProps) {
  const [contradictions, setContradictions] = useState<Contradiction[]>([]);
  const [view, setView] = useState<'list' | 'add' | 'stats'>('list');
  const [filterType, setFilterType] = useState<ContradictionType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<ResolutionStatus | 'all'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'severity' | 'date' | 'type'>('severity');
  const [batchSelected, setBatchSelected] = useState<Set<string>>(new Set());

  // Form state
  const [formType, setFormType] = useState<ContradictionType>('direct');
  const [formClaimALabel, setFormClaimALabel] = useState('');
  const [formClaimASource, setFormClaimASource] = useState('');
  const [formClaimBLabel, setFormClaimBLabel] = useState('');
  const [formClaimBSource, setFormClaimBSource] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSeverity, setFormSeverity] = useState<'critical' | 'warning' | 'info'>('warning');
  const [formDomain, setFormDomain] = useState('General');
  const [formResolution, setFormResolution] = useState<ResolutionStatus>('unresolved');
  const [formResolutionNotes, setFormResolutionNotes] = useState('');

  // ── Load / Save ──
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setContradictions(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const persist = useCallback((data: Contradiction[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, []);

  // ── Reset form ──
  const resetForm = useCallback(() => {
    setFormType('direct');
    setFormClaimALabel('');
    setFormClaimASource('');
    setFormClaimBLabel('');
    setFormClaimBSource('');
    setFormDescription('');
    setFormSeverity('warning');
    setFormDomain('General');
    setFormResolution('unresolved');
    setFormResolutionNotes('');
    setEditingId(null);
  }, []);

  // ── Save ──
  const save = useCallback(() => {
    if (!formClaimALabel.trim() || !formClaimBLabel.trim() || !formDescription.trim()) return;

    const now = new Date().toISOString();
    if (editingId) {
      const updated = contradictions.map(c => c.id === editingId ? {
        ...c,
        type: formType,
        claimA: { id: c.claimA.id, label: formClaimALabel.trim(), source: formClaimASource.trim() || undefined },
        claimB: { id: c.claimB.id, label: formClaimBLabel.trim(), source: formClaimBSource.trim() || undefined },
        description: formDescription.trim(),
        severity: formSeverity,
        domain: formDomain,
        resolution: formResolution,
        resolutionNotes: formResolutionNotes,
        resolvedAt: formResolution !== 'unresolved' ? now : undefined,
      } : c);
      setContradictions(updated);
      persist(updated);
    } else {
      const newItem: Contradiction = {
        id: `ctr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: formType,
        claimA: { id: `ca-${Date.now()}`, label: formClaimALabel.trim(), source: formClaimASource.trim() || undefined },
        claimB: { id: `cb-${Date.now()}`, label: formClaimBLabel.trim(), source: formClaimBSource.trim() || undefined },
        description: formDescription.trim(),
        severity: formSeverity,
        domain: formDomain,
        resolution: formResolution,
        resolutionNotes: formResolutionNotes,
        detectedAt: now,
        resolvedAt: formResolution !== 'unresolved' ? now : undefined,
      };
      const updated = [...contradictions, newItem];
      setContradictions(updated);
      persist(updated);
    }
    resetForm();
    setView('list');
  }, [formType, formClaimALabel, formClaimASource, formClaimBLabel, formClaimBSource, formDescription, formSeverity, formDomain, formResolution, formResolutionNotes, editingId, contradictions, persist, resetForm]);

  // ── Delete ──
  const deleteItem = useCallback((id: string) => {
    const updated = contradictions.filter(c => c.id !== id);
    setContradictions(updated);
    persist(updated);
  }, [contradictions, persist]);

  // ── Start edit ──
  const startEdit = useCallback((c: Contradiction) => {
    setFormType(c.type);
    setFormClaimALabel(c.claimA.label);
    setFormClaimASource(c.claimA.source || '');
    setFormClaimBLabel(c.claimB.label);
    setFormClaimBSource(c.claimB.source || '');
    setFormDescription(c.description);
    setFormSeverity(c.severity);
    setFormDomain(c.domain || 'General');
    setFormResolution(c.resolution);
    setFormResolutionNotes(c.resolutionNotes);
    setEditingId(c.id);
    setView('add');
  }, []);

  // ── Apply template ──
  const applyTemplate = useCallback((tmpl: typeof TEMPLATES[0]) => {
    setFormType(tmpl.type);
    setFormClaimALabel(tmpl.claimA);
    setFormClaimBLabel(tmpl.claimB);
    setFormDescription(tmpl.description);
  }, []);

  // ── Quick resolve ──
  const quickResolve = useCallback((id: string, resolution: ResolutionStatus) => {
    const now = new Date().toISOString();
    const updated = contradictions.map(c => c.id === id ? {
      ...c, resolution, resolvedAt: resolution !== 'unresolved' ? now : undefined,
    } : c);
    setContradictions(updated);
    persist(updated);
  }, [contradictions, persist]);

  // ── Batch operations ──
  const toggleBatchSelect = useCallback((id: string) => {
    setBatchSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const batchResolve = useCallback((resolution: ResolutionStatus) => {
    const now = new Date().toISOString();
    const updated = contradictions.map(c => batchSelected.has(c.id) ? {
      ...c, resolution, resolvedAt: resolution !== 'unresolved' ? now : undefined,
    } : c);
    setContradictions(updated);
    persist(updated);
    setBatchSelected(new Set());
  }, [contradictions, batchSelected, persist]);

  const batchDelete = useCallback(() => {
    const updated = contradictions.filter(c => !batchSelected.has(c.id));
    setContradictions(updated);
    persist(updated);
    setBatchSelected(new Set());
  }, [contradictions, batchSelected, persist]);

  // ── Filtered + sorted ──
  const SEV_ORDER: Record<string, number> = { critical: 0, warning: 1, info: 2 };
  const filtered = useMemo(() => {
    const list = contradictions.filter(c => {
      if (filterType !== 'all' && c.type !== filterType) return false;
      if (filterStatus !== 'all' && c.resolution !== filterStatus) return false;
      return true;
    });
    if (sortBy === 'severity') list.sort((a, b) => (SEV_ORDER[a.severity] ?? 9) - (SEV_ORDER[b.severity] ?? 9));
    else if (sortBy === 'date') list.sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime());
    else if (sortBy === 'type') list.sort((a, b) => a.type.localeCompare(b.type));
    return list;
  }, [contradictions, filterType, filterStatus, sortBy]);

  // ── Stats ──
  const stats = useMemo(() => {
    const byType: Record<string, number> = {};
    const byResolution: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    contradictions.forEach(c => {
      byType[c.type] = (byType[c.type] || 0) + 1;
      byResolution[c.resolution] = (byResolution[c.resolution] || 0) + 1;
      bySeverity[c.severity] = (bySeverity[c.severity] || 0) + 1;
    });
    const unresolved = contradictions.filter(c => c.resolution === 'unresolved').length;
    const resolved = contradictions.length - unresolved;
    const resolutionRate = contradictions.length > 0 ? Math.round((resolved / contradictions.length) * 100) : 0;
    return { total: contradictions.length, unresolved, resolved, resolutionRate, byType, byResolution, bySeverity };
  }, [contradictions]);

  const { isDark, colors } = useTheme();

  if (!open) return null;

  const getTypeInfo = (type: ContradictionType) => CONTRADICTION_TYPES.find(t => t.value === type)!;
  const getResolutionInfo = (res: ResolutionStatus) => RESOLUTION_OPTIONS.find(r => r.value === res)!;
  const sevColors: Record<string, string> = { critical: '#ef4444', warning: '#f59e0b', info: '#6b7280' };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '90vw', maxWidth: 980, maxHeight: '88vh',
        background: isDark ? 'linear-gradient(135deg, #1a1a2e 0%, #1e1225 100%)' : '#ffffff',
        borderRadius: 16, border: isDark ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(0,0,0,0.1)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: isDark ? '0 25px 60px rgba(0,0,0,0.5)' : '0 25px 60px rgba(0,0,0,0.15)',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: isDark ? 'rgba(239,68,68,0.04)' : 'rgba(239,68,68,0.03)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22 }}>⚡</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: colors.textPrimary }}>Contradiction Finder</div>
              <div style={{ fontSize: 11, color: colors.textMuted }}>
                {stats.total} contradictions — {stats.unresolved} unresolved — {stats.resolutionRate}% resolved
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {(['list', 'add', 'stats'] as const).map(v => (
              <button key={v} onClick={() => { if (v === 'add') resetForm(); setView(v); }} style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                border: view === v ? '1px solid rgba(239,68,68,0.5)' : (isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)'),
                background: view === v ? 'rgba(239,68,68,0.12)' : 'transparent',
                color: view === v ? '#fca5a5' : colors.textMuted,
                cursor: 'pointer',
              }}>
                {v === 'list' ? '📋 List' : v === 'add' ? '➕ Add' : '📊 Stats'}
              </button>
            ))}
            <button onClick={onClose} style={{
              marginLeft: 8, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
              borderRadius: 8, color: colors.textMuted, cursor: 'pointer', padding: '6px 12px', fontSize: 13,
            }}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>

          {/* ── LIST VIEW ── */}
          {view === 'list' && (
            <div>
              {/* Filters */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <select value={filterType} onChange={e => setFilterType(e.target.value as ContradictionType | 'all')} style={{
                  padding: '6px 10px', borderRadius: 8, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', color: colors.textPrimary, fontSize: 12,
                }}>
                  <option value="all">All Types</option>
                  {CONTRADICTION_TYPES.map(ct => <option key={ct.value} value={ct.value}>{ct.icon} {ct.label}</option>)}
                </select>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as ResolutionStatus | 'all')} style={{
                  padding: '6px 10px', borderRadius: 8, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', color: colors.textPrimary, fontSize: 12,
                }}>
                  <option value="all">All Status</option>
                  {RESOLUTION_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.icon} {r.label}</option>)}
                </select>
                <select value={sortBy} onChange={e => setSortBy(e.target.value as 'severity' | 'date' | 'type')} style={{
                  padding: '6px 10px', borderRadius: 8, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', color: colors.textPrimary, fontSize: 12,
                }}>
                  <option value="severity">Sort: Severity</option>
                  <option value="date">Sort: Newest</option>
                  <option value="type">Sort: Type</option>
                </select>
                <span style={{ fontSize: 11, color: colors.textMuted, marginLeft: 'auto' }}>
                  {filtered.length} shown
                </span>
              </div>

              {/* Batch action bar */}
              {batchSelected.size > 0 && (
                <div style={{
                  display: 'flex', gap: 6, alignItems: 'center', padding: '8px 12px', marginBottom: 12,
                  borderRadius: 8, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                }}>
                  <span style={{ fontSize: 12, color: '#a5b4fc', fontWeight: 600 }}>{batchSelected.size} selected</span>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                    {RESOLUTION_OPTIONS.filter(r => r.value !== 'unresolved').map(r => (
                      <button key={r.value} onClick={() => batchResolve(r.value)} style={{
                        padding: '3px 8px', borderRadius: 6, fontSize: 10,
                        background: `${r.color}10`, border: `1px solid ${r.color}25`,
                        color: r.color, cursor: 'pointer', whiteSpace: 'nowrap',
                      }}>{r.icon} {r.label}</button>
                    ))}
                    <button onClick={batchDelete} style={{
                      padding: '3px 8px', borderRadius: 6, fontSize: 10,
                      background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                      color: '#fca5a5', cursor: 'pointer',
                    }}>🗑️ Delete</button>
                    <button onClick={() => setBatchSelected(new Set())} style={{
                      padding: '3px 8px', borderRadius: 6, fontSize: 10,
                      background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                      color: colors.textMuted, cursor: 'pointer',
                    }}>Clear</button>
                  </div>
                </div>
              )}

              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: colors.textMuted }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>⚡</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>No contradictions recorded</div>
                  <div style={{ fontSize: 12 }}>Click "➕ Add" to log contradictions between claims.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {filtered.map(ctr => {
                    const typeInfo = getTypeInfo(ctr.type);
                    const resInfo = getResolutionInfo(ctr.resolution);
                    return (
                      <div key={ctr.id} style={{
                        padding: '14px', borderRadius: 10,
                        background: batchSelected.has(ctr.id) ? 'rgba(99,102,241,0.08)' : ctr.resolution === 'unresolved' ? (isDark ? 'rgba(239,68,68,0.04)' : 'rgba(239,68,68,0.03)') : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)'),
                        border: `1px solid ${batchSelected.has(ctr.id) ? 'rgba(99,102,241,0.3)' : ctr.resolution === 'unresolved' ? typeInfo.color + '30' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)')}`,
                      }}>
                        {/* Header row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <input type="checkbox" checked={batchSelected.has(ctr.id)} onChange={() => toggleBatchSelect(ctr.id)}
                            style={{ accentColor: '#6366f1', cursor: 'pointer', width: 14, height: 14 }} />
                          <span style={{ fontSize: 16 }}>{typeInfo.icon}</span>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                            background: `${typeInfo.color}22`, color: typeInfo.color,
                            textTransform: 'uppercase', letterSpacing: 0.5,
                          }}>{typeInfo.label}</span>
                          <span style={{
                            fontSize: 10, padding: '2px 6px', borderRadius: 4,
                            background: `${sevColors[ctr.severity]}18`, color: sevColors[ctr.severity],
                            fontWeight: 600,
                          }}>{ctr.severity}</span>
                          <span style={{
                            fontSize: 10, padding: '2px 6px', borderRadius: 4,
                            background: `${resInfo.color}18`, color: resInfo.color,
                          }}>{resInfo.icon} {resInfo.label}</span>
                          {ctr.domain && ctr.domain !== 'General' && (
                            <span style={{ fontSize: 10, color: '#c4b5fd', padding: '2px 6px', borderRadius: 4, background: 'rgba(139,92,246,0.1)' }}>
                              {ctr.domain}
                            </span>
                          )}
                          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                            <button onClick={() => startEdit(ctr)} style={{
                              padding: '3px 8px', borderRadius: 6, fontSize: 11,
                              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                              color: colors.textMuted, cursor: 'pointer',
                            }}>✏️</button>
                            <button onClick={() => deleteItem(ctr.id)} style={{
                              padding: '3px 8px', borderRadius: 6, fontSize: 11,
                              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
                              color: '#fca5a5', cursor: 'pointer',
                            }}>🗑️</button>
                          </div>
                        </div>

                        {/* Claims comparison */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, marginBottom: 8 }}>
                          <div style={{
                            padding: '8px 10px', borderRadius: 8,
                            background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)',
                          }}>
                            <div style={{ fontSize: 10, color: colors.textMuted, marginBottom: 3, fontWeight: 600 }}>CLAIM A</div>
                            <div style={{ fontSize: 12, color: '#fca5a5', lineHeight: 1.4 }}>{ctr.claimA.label}</div>
                            {ctr.claimA.source && <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 3 }}>📄 {ctr.claimA.source}</div>}
                          </div>
                          <div style={{ alignSelf: 'center', fontSize: 18, color: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }}>⚔️</div>
                          <div style={{
                            padding: '8px 10px', borderRadius: 8,
                            background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)',
                          }}>
                            <div style={{ fontSize: 10, color: colors.textMuted, marginBottom: 3, fontWeight: 600 }}>CLAIM B</div>
                            <div style={{ fontSize: 12, color: '#93c5fd', lineHeight: 1.4 }}>{ctr.claimB.label}</div>
                            {ctr.claimB.source && <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 3 }}>📄 {ctr.claimB.source}</div>}
                          </div>
                        </div>

                        {/* Description */}
                        <div style={{ fontSize: 12, color: colors.textPrimary, lineHeight: 1.5, marginBottom: 6 }}>
                          {ctr.description}
                        </div>

                        {/* Quick resolution buttons */}
                        {ctr.resolution === 'unresolved' && (
                          <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                            <span style={{ fontSize: 10, color: colors.textMuted, alignSelf: 'center', marginRight: 4 }}>Resolve:</span>
                            {RESOLUTION_OPTIONS.filter(r => r.value !== 'unresolved').map(r => (
                              <button key={r.value} onClick={() => quickResolve(ctr.id, r.value)} style={{
                                padding: '3px 8px', borderRadius: 6, fontSize: 10,
                                background: `${r.color}10`, border: `1px solid ${r.color}25`,
                                color: r.color, cursor: 'pointer', whiteSpace: 'nowrap',
                              }}>{r.icon} {r.label}</button>
                            ))}
                          </div>
                        )}

                        {ctr.resolutionNotes && (
                          <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 6, fontStyle: 'italic' }}>
                            Resolution: {ctr.resolutionNotes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── STATS VIEW ── */}
          {view === 'stats' && (
            <div>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: colors.textPrimary }}>📊 Contradiction Analysis</h3>

              {/* Summary cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
                {[
                  { label: 'Total', value: stats.total, color: '#8b5cf6' },
                  { label: 'Unresolved', value: stats.unresolved, color: '#ef4444' },
                  { label: 'Resolved', value: stats.resolved, color: '#10b981' },
                  { label: 'Resolution Rate', value: `${stats.resolutionRate}%`, color: stats.resolutionRate >= 70 ? '#10b981' : '#f59e0b' },
                ].map((card, i) => (
                  <div key={i} style={{
                    padding: '14px', borderRadius: 10, textAlign: 'center',
                    background: `${card.color}08`, border: `1px solid ${card.color}20`,
                  }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: card.color }}>{card.value}</div>
                    <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 4 }}>{card.label}</div>
                  </div>
                ))}
              </div>

              {/* By type */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary, marginBottom: 8 }}>By Type</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {CONTRADICTION_TYPES.map(ct => {
                    const count = stats.byType[ct.value] || 0;
                    const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                    return (
                      <div key={ct.value} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, width: 24, textAlign: 'center' }}>{ct.icon}</span>
                        <span style={{ fontSize: 12, color: colors.textSecondary, width: 140 }}>{ct.label}</span>
                        <div style={{ flex: 1, height: 8, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: ct.color, borderRadius: 4, transition: 'width 0.3s ease' }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: ct.color, width: 30, textAlign: 'right' }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* By severity */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary, marginBottom: 8 }}>By Severity</div>
                <div style={{ display: 'flex', gap: 12 }}>
                  {(['critical', 'warning', 'info'] as const).map(sev => (
                    <div key={sev} style={{
                      flex: 1, padding: '12px', borderRadius: 10, textAlign: 'center',
                      background: `${sevColors[sev]}08`, border: `1px solid ${sevColors[sev]}20`,
                    }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: sevColors[sev] }}>{stats.bySeverity[sev] || 0}</div>
                      <div style={{ fontSize: 11, color: colors.textMuted, textTransform: 'capitalize' }}>{sev}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── ADD / EDIT VIEW ── */}
          {view === 'add' && (
            <div>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: colors.textPrimary }}>
                {editingId ? '✏️ Edit Contradiction' : '⚡ Log New Contradiction'}
              </h3>

              {/* Templates */}
              {!editingId && (
                <div style={{
                  marginBottom: 16, padding: 12, borderRadius: 8,
                  background: isDark ? 'rgba(139,92,246,0.05)' : 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.12)',
                }}>
                  <div style={{ fontSize: 12, color: '#c4b5fd', marginBottom: 8, fontWeight: 600 }}>📋 Quick Templates</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {TEMPLATES.map((tmpl, i) => (
                      <button key={i} onClick={() => applyTemplate(tmpl)} style={{
                        padding: '5px 12px', borderRadius: 6, fontSize: 11,
                        background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)',
                        color: '#c4b5fd', cursor: 'pointer',
                      }}>{tmpl.name}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Contradiction type */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: colors.textMuted, display: 'block', marginBottom: 6 }}>Type</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {CONTRADICTION_TYPES.map(ct => (
                    <button key={ct.value} onClick={() => setFormType(ct.value)} style={{
                      padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                      border: formType === ct.value ? `1px solid ${ct.color}80` : (isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)'),
                      background: formType === ct.value ? `${ct.color}18` : 'transparent',
                      color: formType === ct.value ? ct.color : colors.textMuted,
                      cursor: 'pointer', whiteSpace: 'nowrap',
                    }}>{ct.icon} {ct.label}</button>
                  ))}
                </div>
              </div>

              {/* Claims */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#fca5a5', display: 'block', marginBottom: 4 }}>Claim A *</label>
                  <textarea value={formClaimALabel} onChange={e => setFormClaimALabel(e.target.value)}
                    rows={2} placeholder="First claim..."
                    style={{
                      width: '100%', padding: '8px 10px', borderRadius: 8,
                      background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
                      color: colors.textPrimary, fontSize: 12, resize: 'vertical', boxSizing: 'border-box',
                    }} />
                  <input value={formClaimASource} onChange={e => setFormClaimASource(e.target.value)}
                    placeholder="Source (optional)"
                    style={{
                      width: '100%', marginTop: 4, padding: '5px 10px', borderRadius: 6,
                      background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                      color: colors.textSecondary, fontSize: 11, boxSizing: 'border-box',
                    }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#93c5fd', display: 'block', marginBottom: 4 }}>Claim B *</label>
                  <textarea value={formClaimBLabel} onChange={e => setFormClaimBLabel(e.target.value)}
                    rows={2} placeholder="Contradicting claim..."
                    style={{
                      width: '100%', padding: '8px 10px', borderRadius: 8,
                      background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)',
                      color: colors.textPrimary, fontSize: 12, resize: 'vertical', boxSizing: 'border-box',
                    }} />
                  <input value={formClaimBSource} onChange={e => setFormClaimBSource(e.target.value)}
                    placeholder="Source (optional)"
                    style={{
                      width: '100%', marginTop: 4, padding: '5px 10px', borderRadius: 6,
                      background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                      color: colors.textSecondary, fontSize: 11, boxSizing: 'border-box',
                    }} />
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: colors.textMuted, display: 'block', marginBottom: 4 }}>Description *</label>
                <textarea value={formDescription} onChange={e => setFormDescription(e.target.value)}
                  rows={2} placeholder="Explain the contradiction..."
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: 8,
                    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                    color: colors.textPrimary, fontSize: 13, resize: 'vertical', boxSizing: 'border-box',
                  }} />
              </div>

              {/* Severity + Domain */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: colors.textMuted, display: 'block', marginBottom: 4 }}>Severity</label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {(['critical', 'warning', 'info'] as const).map(s => (
                      <button key={s} onClick={() => setFormSeverity(s)} style={{
                        flex: 1, padding: '6px 0', borderRadius: 6, fontSize: 11, fontWeight: 600,
                        border: formSeverity === s ? `1px solid ${sevColors[s]}80` : (isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)'),
                        background: formSeverity === s ? `${sevColors[s]}18` : 'transparent',
                        color: formSeverity === s ? sevColors[s] : colors.textMuted,
                        cursor: 'pointer', textTransform: 'capitalize',
                      }}>{s}</button>
                    ))}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: colors.textMuted, display: 'block', marginBottom: 4 }}>Domain</label>
                  <select value={formDomain} onChange={e => setFormDomain(e.target.value)} style={{
                    width: '100%', padding: '8px 10px', borderRadius: 8,
                    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                    color: colors.textPrimary, fontSize: 13,
                  }}>
                    {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              {/* Resolution (for editing) */}
              {editingId && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, color: colors.textMuted, display: 'block', marginBottom: 6 }}>Resolution</label>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                    {RESOLUTION_OPTIONS.map(r => (
                      <button key={r.value} onClick={() => setFormResolution(r.value)} style={{
                        padding: '5px 10px', borderRadius: 6, fontSize: 11,
                        border: formResolution === r.value ? `1px solid ${r.color}80` : (isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)'),
                        background: formResolution === r.value ? `${r.color}18` : 'transparent',
                        color: formResolution === r.value ? r.color : colors.textMuted,
                        cursor: 'pointer',
                      }}>{r.icon} {r.label}</button>
                    ))}
                  </div>
                  <textarea value={formResolutionNotes} onChange={e => setFormResolutionNotes(e.target.value)}
                    rows={2} placeholder="Resolution notes..."
                    style={{
                      width: '100%', padding: '8px 10px', borderRadius: 8,
                      background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                      color: colors.textPrimary, fontSize: 12, resize: 'vertical', boxSizing: 'border-box',
                    }} />
                </div>
              )}

              {/* Save */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={save} disabled={!formClaimALabel.trim() || !formClaimBLabel.trim() || !formDescription.trim()} style={{
                  flex: 1, padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                  background: (formClaimALabel.trim() && formClaimBLabel.trim() && formDescription.trim()) ? 'rgba(239,68,68,0.15)' : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'),
                  border: (formClaimALabel.trim() && formClaimBLabel.trim() && formDescription.trim()) ? '1px solid rgba(239,68,68,0.4)' : (isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)'),
                  color: (formClaimALabel.trim() && formClaimBLabel.trim() && formDescription.trim()) ? '#fca5a5' : colors.textMuted,
                  cursor: (formClaimALabel.trim() && formClaimBLabel.trim() && formDescription.trim()) ? 'pointer' : 'not-allowed',
                }}>
                  {editingId ? '💾 Update' : '⚡ Log Contradiction'}
                </button>
                {editingId && (
                  <button onClick={() => { resetForm(); setView('list'); }} style={{
                    padding: '10px 20px', borderRadius: 8, fontSize: 13,
                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                    color: colors.textMuted, cursor: 'pointer',
                  }}>Cancel</button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ContradictionFinder;
