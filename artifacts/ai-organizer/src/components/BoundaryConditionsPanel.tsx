/**
 * BoundaryConditionsPanel Component (H)
 *
 * Dedicated panel for managing boundary conditions for claims/theories:
 * - When does a claim hold? (validity domain)
 * - When does it NOT hold? (exclusion domain)
 * - What are the alternative hypotheses?
 * - Parameter ranges and constraints
 * - Edge cases and failure modes
 *
 * Persists to localStorage and can be opened as a modal.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';

// ── Types ──

type ConditionType = 'validity' | 'exclusion' | 'alternative' | 'parameter' | 'edge_case';
type Severity = 'critical' | 'important' | 'minor' | 'informational';

interface BoundaryCondition {
  id: string;
  claimId: string;
  claimLabel: string;
  type: ConditionType;
  description: string;
  severity: Severity;
  domain?: string; // e.g., "economics", "psychology", "physics"
  parameterName?: string;
  parameterMin?: string;
  parameterMax?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface ClaimEntry {
  id: string;
  label: string;
  conditionCount: number;
}

interface BoundaryConditionsPanelProps {
  open: boolean;
  onClose: () => void;
}

// ── Constants ──

const STORAGE_KEY = 'thinkspace-boundary-conditions';

const CONDITION_TYPES: { value: ConditionType; label: string; icon: string; color: string; desc: string }[] = [
  { value: 'validity', label: 'Validity Domain', icon: '✅', color: '#10b981', desc: 'When does this claim hold true?' },
  { value: 'exclusion', label: 'Exclusion Domain', icon: '🚫', color: '#ef4444', desc: 'When does this claim NOT hold?' },
  { value: 'alternative', label: 'Alternative Hypothesis', icon: '🔀', color: '#f59e0b', desc: 'What competing explanations exist?' },
  { value: 'parameter', label: 'Parameter Constraint', icon: '📊', color: '#3b82f6', desc: 'What parameter ranges apply?' },
  { value: 'edge_case', label: 'Edge Case / Failure', icon: '⚠️', color: '#8b5cf6', desc: 'Where might this break down?' },
];

const SEVERITIES: { value: Severity; label: string; color: string }[] = [
  { value: 'critical', label: 'Critical', color: '#ef4444' },
  { value: 'important', label: 'Important', color: '#f59e0b' },
  { value: 'minor', label: 'Minor', color: '#3b82f6' },
  { value: 'informational', label: 'Info', color: '#6b7280' },
];

const DOMAINS = [
  'General', 'Economics', 'Psychology', 'Physics', 'Biology',
  'Sociology', 'Philosophy', 'Mathematics', 'Methodology', 'Institutional',
];

const TEMPLATES: { name: string; conditions: Partial<BoundaryCondition>[] }[] = [
  {
    name: 'Standard Claim Boundaries',
    conditions: [
      { type: 'validity', description: 'Holds under normal market conditions with rational agents', severity: 'important', domain: 'Economics' },
      { type: 'exclusion', description: 'Does NOT hold during extreme crises or black swan events', severity: 'critical', domain: 'Economics' },
      { type: 'parameter', description: 'Valid for sample sizes N > 30', severity: 'important', parameterName: 'N', parameterMin: '30', parameterMax: '' },
      { type: 'alternative', description: 'Classical equilibrium theory offers a competing explanation', severity: 'minor' },
      { type: 'edge_case', description: 'Breaks down when information asymmetry approaches 100%', severity: 'critical' },
    ],
  },
  {
    name: 'Thermodynamic Theory Boundaries',
    conditions: [
      { type: 'validity', description: 'Applies to systems with measurable entropy gradients', severity: 'critical', domain: 'Physics' },
      { type: 'exclusion', description: 'Does not apply to quantum-scale phenomena without modification', severity: 'important', domain: 'Physics' },
      { type: 'parameter', description: 'Temperature range: above absolute zero', severity: 'critical', parameterName: 'T', parameterMin: '0K', parameterMax: '' },
      { type: 'alternative', description: 'Statistical mechanics provides micro-level alternative', severity: 'minor', domain: 'Physics' },
      { type: 'edge_case', description: 'Near phase transitions, linearization assumptions fail', severity: 'important' },
    ],
  },
  {
    name: 'Psychological Model Boundaries',
    conditions: [
      { type: 'validity', description: 'Validated for adult populations in Western cultures', severity: 'important', domain: 'Psychology' },
      { type: 'exclusion', description: 'Not validated for children under 12 or non-WEIRD populations', severity: 'critical', domain: 'Psychology' },
      { type: 'parameter', description: 'Effect size d > 0.2 (small) to be meaningful', severity: 'important', parameterName: 'd', parameterMin: '0.2', parameterMax: '' },
      { type: 'alternative', description: 'Behavioral economics offers alternative framing', severity: 'minor', domain: 'Economics' },
    ],
  },
];

// ── Component ──

export function BoundaryConditionsPanel({ open, onClose }: BoundaryConditionsPanelProps) {
  const [conditions, setConditions] = useState<BoundaryCondition[]>([]);
  const [claims, setClaims] = useState<ClaimEntry[]>([]);
  const [selectedClaimId, setSelectedClaimId] = useState<string>('');
  const [filterType, setFilterType] = useState<ConditionType | 'all'>('all');
  const [filterSeverity, setFilterSeverity] = useState<Severity | 'all'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'matrix' | 'add'>('list');

  // Form state
  const [formClaimId, setFormClaimId] = useState('');
  const [formClaimLabel, setFormClaimLabel] = useState('');
  const [formType, setFormType] = useState<ConditionType>('validity');
  const [formDescription, setFormDescription] = useState('');
  const [formSeverity, setFormSeverity] = useState<Severity>('important');
  const [formDomain, setFormDomain] = useState('General');
  const [formParamName, setFormParamName] = useState('');
  const [formParamMin, setFormParamMin] = useState('');
  const [formParamMax, setFormParamMax] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // ── Load / Save ──
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        setConditions(data.conditions || []);
        setClaims(data.claims || []);
      }
    } catch { /* ignore */ }
  }, []);

  const persist = useCallback((c: BoundaryCondition[], cl: ClaimEntry[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ conditions: c, claims: cl }));
  }, []);

  // ── Claim management ──
  const _addClaim = useCallback((label: string) => {
    if (!label.trim()) return;
    const newClaim: ClaimEntry = { id: `claim-${Date.now()}`, label: label.trim(), conditionCount: 0 };
    const updated = [...claims, newClaim];
    setClaims(updated);
    persist(conditions, updated);
    setFormClaimId(newClaim.id);
    setFormClaimLabel(newClaim.label);
  }, [claims, conditions, persist]);

  // ── Add / Edit condition ──
  const resetForm = useCallback(() => {
    setFormClaimId('');
    setFormClaimLabel('');
    setFormType('validity');
    setFormDescription('');
    setFormSeverity('important');
    setFormDomain('General');
    setFormParamName('');
    setFormParamMin('');
    setFormParamMax('');
    setFormNotes('');
    setEditingId(null);
  }, []);

  const saveCondition = useCallback(() => {
    if (!formDescription.trim()) return;

    let claimId = formClaimId;
    let claimLabel = formClaimLabel;

    // Auto-create claim if new label provided
    if (!claimId && claimLabel.trim()) {
      const newClaim: ClaimEntry = { id: `claim-${Date.now()}`, label: claimLabel.trim(), conditionCount: 0 };
      const updatedClaims = [...claims, newClaim];
      setClaims(updatedClaims);
      claimId = newClaim.id;
      claimLabel = newClaim.label;
    }

    const now = new Date().toISOString();
    if (editingId) {
      const updated = conditions.map(c => c.id === editingId ? {
        ...c,
        claimId,
        claimLabel,
        type: formType,
        description: formDescription.trim(),
        severity: formSeverity,
        domain: formDomain,
        parameterName: formParamName,
        parameterMin: formParamMin,
        parameterMax: formParamMax,
        notes: formNotes,
        updatedAt: now,
      } : c);
      setConditions(updated);
      updateClaimCounts(updated, claims);
    } else {
      const newCondition: BoundaryCondition = {
        id: `bc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        claimId,
        claimLabel,
        type: formType,
        description: formDescription.trim(),
        severity: formSeverity,
        domain: formDomain,
        parameterName: formParamName,
        parameterMin: formParamMin,
        parameterMax: formParamMax,
        notes: formNotes,
        createdAt: now,
        updatedAt: now,
      };
      const updated = [...conditions, newCondition];
      setConditions(updated);
      updateClaimCounts(updated, claims);
    }

    resetForm();
    setView('list');
  }, [formClaimId, formClaimLabel, formType, formDescription, formSeverity, formDomain, formParamName, formParamMin, formParamMax, formNotes, editingId, conditions, claims, resetForm]);

  const updateClaimCounts = useCallback((conds: BoundaryCondition[], cls: ClaimEntry[]) => {
    const counts: Record<string, number> = {};
    conds.forEach(c => { counts[c.claimId] = (counts[c.claimId] || 0) + 1; });
    const updated = cls.map(cl => ({ ...cl, conditionCount: counts[cl.id] || 0 }));
    setClaims(updated);
    persist(conds, updated);
  }, [persist]);

  const startEdit = useCallback((cond: BoundaryCondition) => {
    setFormClaimId(cond.claimId);
    setFormClaimLabel(cond.claimLabel);
    setFormType(cond.type);
    setFormDescription(cond.description);
    setFormSeverity(cond.severity);
    setFormDomain(cond.domain || 'General');
    setFormParamName(cond.parameterName || '');
    setFormParamMin(cond.parameterMin || '');
    setFormParamMax(cond.parameterMax || '');
    setFormNotes(cond.notes);
    setEditingId(cond.id);
    setView('add');
  }, []);

  const deleteCondition = useCallback((id: string) => {
    const updated = conditions.filter(c => c.id !== id);
    setConditions(updated);
    updateClaimCounts(updated, claims);
  }, [conditions, claims, updateClaimCounts]);

  const applyTemplate = useCallback((template: typeof TEMPLATES[0]) => {
    if (!formClaimId && !formClaimLabel.trim()) return;

    let claimId = formClaimId;
    let claimLabel = formClaimLabel;
    let currentClaims = [...claims];

    if (!claimId && claimLabel.trim()) {
      const newClaim: ClaimEntry = { id: `claim-${Date.now()}`, label: claimLabel.trim(), conditionCount: 0 };
      currentClaims = [...currentClaims, newClaim];
      setClaims(currentClaims);
      claimId = newClaim.id;
      claimLabel = newClaim.label;
    }

    const now = new Date().toISOString();
    const newConditions = template.conditions.map((tc, i) => ({
      id: `bc-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
      claimId,
      claimLabel,
      type: tc.type || 'validity' as ConditionType,
      description: tc.description || '',
      severity: tc.severity || 'important' as Severity,
      domain: tc.domain || 'General',
      parameterName: tc.parameterName || '',
      parameterMin: tc.parameterMin || '',
      parameterMax: tc.parameterMax || '',
      notes: '',
      createdAt: now,
      updatedAt: now,
    }));

    const updated = [...conditions, ...newConditions];
    setConditions(updated);
    updateClaimCounts(updated, currentClaims);
    setView('list');
  }, [formClaimId, formClaimLabel, claims, conditions, updateClaimCounts]);

  // ── Filtered conditions ──
  const filtered = useMemo(() => {
    return conditions.filter(c => {
      if (selectedClaimId && c.claimId !== selectedClaimId) return false;
      if (filterType !== 'all' && c.type !== filterType) return false;
      if (filterSeverity !== 'all' && c.severity !== filterSeverity) return false;
      return true;
    });
  }, [conditions, selectedClaimId, filterType, filterSeverity]);

  // ── Stats ──
  const stats = useMemo(() => {
    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    conditions.forEach(c => {
      byType[c.type] = (byType[c.type] || 0) + 1;
      bySeverity[c.severity] = (bySeverity[c.severity] || 0) + 1;
    });
    return { total: conditions.length, byType, bySeverity, claimCount: claims.length };
  }, [conditions, claims]);

  // ── Matrix data ──
  const matrixData = useMemo(() => {
    const types = CONDITION_TYPES.map(t => t.value);
    return claims.map(cl => {
      const row: Record<string, number> = {};
      types.forEach(t => {
        row[t] = conditions.filter(c => c.claimId === cl.id && c.type === t).length;
      });
      return { claim: cl, counts: row };
    });
  }, [claims, conditions]);

  const { isDark, colors } = useTheme();

  if (!open) return null;

  const getTypeInfo = (type: ConditionType) => CONDITION_TYPES.find(t => t.value === type)!;
  const getSeverityInfo = (severity: Severity) => SEVERITIES.find(s => s.value === severity)!;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '90vw', maxWidth: 960, maxHeight: '88vh',
        background: isDark ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' : '#ffffff',
        borderRadius: 16, border: isDark ? '1px solid rgba(6,182,212,0.2)' : '1px solid rgba(0,0,0,0.1)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: isDark ? '0 25px 60px rgba(0,0,0,0.5)' : '0 25px 60px rgba(0,0,0,0.15)',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: isDark ? 'rgba(6,182,212,0.05)' : 'rgba(6,182,212,0.03)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22 }}>🛡️</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: colors.textPrimary }}>Boundary Conditions Panel</div>
              <div style={{ fontSize: 11, color: colors.textMuted }}>
                {stats.total} conditions across {stats.claimCount} claims
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {(['list', 'matrix', 'add'] as const).map(v => (
              <button key={v} onClick={() => { if (v === 'add') resetForm(); setView(v); }} style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                border: view === v ? '1px solid rgba(6,182,212,0.5)' : (isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)'),
                background: view === v ? 'rgba(6,182,212,0.15)' : 'transparent',
                color: view === v ? '#67e8f9' : colors.textMuted,
                cursor: 'pointer',
              }}>
                {v === 'list' ? '📋 List' : v === 'matrix' ? '📊 Matrix' : '➕ Add'}
              </button>
            ))}
            <button onClick={onClose} style={{
              marginLeft: 8, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
              borderRadius: 8, color: colors.textMuted, cursor: 'pointer', padding: '6px 12px', fontSize: 13,
            }}>✕</button>
          </div>
        </div>

        {/* Stats bar */}
        <div style={{
          padding: '8px 20px', borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
          display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center',
          background: isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.02)',
        }}>
          {CONDITION_TYPES.map(ct => (
            <span key={ct.value} style={{
              fontSize: 11, color: ct.color, display: 'flex', alignItems: 'center', gap: 4,
            }}>
              {ct.icon} {stats.byType[ct.value] || 0}
            </span>
          ))}
          <span style={{ color: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)' }}>|</span>
          {SEVERITIES.map(s => (
            <span key={s.value} style={{ fontSize: 11, color: s.color }}>
              {s.label}: {stats.bySeverity[s.value] || 0}
            </span>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>

          {/* ── LIST VIEW ── */}
          {view === 'list' && (
            <div>
              {/* Filters */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <select value={selectedClaimId} onChange={e => setSelectedClaimId(e.target.value)} style={{
                  padding: '6px 10px', borderRadius: 8, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
                  border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', color: colors.textPrimary, fontSize: 12,
                }}>
                  <option value="">All Claims</option>
                  {claims.map(cl => (
                    <option key={cl.id} value={cl.id}>{cl.label} ({cl.conditionCount})</option>
                  ))}
                </select>

                <select value={filterType} onChange={e => setFilterType(e.target.value as ConditionType | 'all')} style={{
                  padding: '6px 10px', borderRadius: 8, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
                  border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', color: colors.textPrimary, fontSize: 12,
                }}>
                  <option value="all">All Types</option>
                  {CONDITION_TYPES.map(ct => (
                    <option key={ct.value} value={ct.value}>{ct.icon} {ct.label}</option>
                  ))}
                </select>

                <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value as Severity | 'all')} style={{
                  padding: '6px 10px', borderRadius: 8, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
                  border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', color: colors.textPrimary, fontSize: 12,
                }}>
                  <option value="all">All Severity</option>
                  {SEVERITIES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>

                <span style={{ fontSize: 11, color: colors.textMuted, marginLeft: 'auto' }}>
                  {filtered.length} of {conditions.length} shown
                </span>
              </div>

              {/* Conditions list */}
              {filtered.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '40px 20px', color: colors.textMuted,
                }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🛡️</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>No boundary conditions yet</div>
                  <div style={{ fontSize: 12 }}>Click "➕ Add" to define when your claims hold and when they don't.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {filtered.map(cond => {
                    const typeInfo = getTypeInfo(cond.type);
                    const sevInfo = getSeverityInfo(cond.severity);
                    return (
                      <div key={cond.id} style={{
                        padding: '12px 14px', borderRadius: 10,
                        background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)',
                        border: `1px solid ${typeInfo.color}22`,
                        transition: 'all 0.2s ease',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                          <span style={{ fontSize: 18 }}>{typeInfo.icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <span style={{
                                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                                background: `${typeInfo.color}22`, color: typeInfo.color,
                                textTransform: 'uppercase', letterSpacing: 0.5,
                              }}>{typeInfo.label}</span>
                              <span style={{
                                fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                                background: `${sevInfo.color}22`, color: sevInfo.color,
                              }}>{sevInfo.label}</span>
                              {cond.domain && cond.domain !== 'General' && (
                                <span style={{
                                  fontSize: 10, padding: '2px 6px', borderRadius: 4,
                                  background: 'rgba(139,92,246,0.1)', color: '#c4b5fd',
                                }}>{cond.domain}</span>
                              )}
                            </div>
                            <div style={{ fontSize: 13, color: colors.textPrimary, marginBottom: 4, lineHeight: 1.5 }}>
                              {cond.description}
                            </div>
                            {cond.parameterName && (
                              <div style={{ fontSize: 11, color: '#93c5fd', marginBottom: 2 }}>
                                📊 {cond.parameterName}: {cond.parameterMin || '−∞'} → {cond.parameterMax || '+∞'}
                              </div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                              <span style={{ fontSize: 10, color: colors.textMuted }}>
                                Claim: {cond.claimLabel || 'Unassigned'}
                              </span>
                            </div>
                            {cond.notes && (
                              <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 4, fontStyle: 'italic' }}>
                                {cond.notes}
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button onClick={() => startEdit(cond)} style={{
                              padding: '4px 8px', borderRadius: 6, fontSize: 11,
                              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                              color: colors.textMuted, cursor: 'pointer',
                            }}>✏️</button>
                            <button onClick={() => deleteCondition(cond.id)} style={{
                              padding: '4px 8px', borderRadius: 6, fontSize: 11,
                              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
                              color: '#fca5a5', cursor: 'pointer',
                            }}>🗑️</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── MATRIX VIEW ── */}
          {view === 'matrix' && (
            <div>
              <div style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 12 }}>
                Coverage matrix — which boundary condition types are defined for each claim.
              </div>
              {matrixData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: colors.textMuted, fontSize: 13 }}>
                  Add claims and conditions first.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '8px 10px', color: colors.textSecondary, borderBottom: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)' }}>
                          Claim
                        </th>
                        {CONDITION_TYPES.map(ct => (
                          <th key={ct.value} style={{
                            textAlign: 'center', padding: '8px 6px',
                            color: ct.color, borderBottom: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                            fontSize: 11, whiteSpace: 'nowrap',
                          }}>
                            {ct.icon} {ct.label}
                          </th>
                        ))}
                        <th style={{ textAlign: 'center', padding: '8px 6px', color: colors.textMuted, borderBottom: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)' }}>
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {matrixData.map(row => {
                        const total = Object.values(row.counts).reduce((a, b) => a + b, 0);
                        const coverage = Object.values(row.counts).filter(v => v > 0).length;
                        const pct = Math.round((coverage / CONDITION_TYPES.length) * 100);
                        return (
                          <tr key={row.claim.id} style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.04)' }}>
                            <td style={{ padding: '10px', color: colors.textPrimary, fontWeight: 500 }}>
                              {row.claim.label}
                              <div style={{ fontSize: 10, color: colors.textMuted }}>
                                Coverage: {pct}%
                              </div>
                            </td>
                            {CONDITION_TYPES.map(ct => (
                              <td key={ct.value} style={{ textAlign: 'center', padding: '8px 6px' }}>
                                {row.counts[ct.value] > 0 ? (
                                  <span style={{
                                    display: 'inline-block', minWidth: 24, padding: '3px 8px',
                                    borderRadius: 6, fontSize: 12, fontWeight: 700,
                                    background: `${ct.color}22`, color: ct.color,
                                  }}>{row.counts[ct.value]}</span>
                                ) : (
                                  <span style={{ color: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)', fontSize: 16 }}>·</span>
                                )}
                              </td>
                            ))}
                            <td style={{
                              textAlign: 'center', padding: '8px 6px',
                              fontWeight: 700, color: pct >= 80 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444',
                            }}>{total}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── ADD / EDIT VIEW ── */}
          {view === 'add' && (
            <div>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: colors.textPrimary }}>
                {editingId ? '✏️ Edit Boundary Condition' : '➕ New Boundary Condition'}
              </h3>

              {/* Claim selection */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: colors.textMuted, display: 'block', marginBottom: 4 }}>
                  Claim *
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <select value={formClaimId} onChange={e => {
                    setFormClaimId(e.target.value);
                    const cl = claims.find(c => c.id === e.target.value);
                    if (cl) setFormClaimLabel(cl.label);
                  }} style={{
                    flex: 1, padding: '8px 10px', borderRadius: 8,
                    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                    color: colors.textPrimary, fontSize: 13,
                  }}>
                    <option value="">— Select or type new —</option>
                    {claims.map(cl => (
                      <option key={cl.id} value={cl.id}>{cl.label}</option>
                    ))}
                  </select>
                  <input
                    value={formClaimLabel}
                    onChange={e => { setFormClaimLabel(e.target.value); setFormClaimId(''); }}
                    placeholder="Or type new claim label..."
                    style={{
                      flex: 1, padding: '8px 10px', borderRadius: 8,
                      background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                      color: colors.textPrimary, fontSize: 13,
                    }}
                  />
                </div>
              </div>

              {/* Condition type */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: colors.textMuted, display: 'block', marginBottom: 6 }}>
                  Condition Type
                </label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {CONDITION_TYPES.map(ct => (
                    <button key={ct.value} onClick={() => setFormType(ct.value)} style={{
                      padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                      border: formType === ct.value ? `1px solid ${ct.color}80` : (isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)'),
                      background: formType === ct.value ? `${ct.color}18` : 'transparent',
                      color: formType === ct.value ? ct.color : colors.textMuted,
                      cursor: 'pointer', whiteSpace: 'nowrap',
                    }}>
                      {ct.icon} {ct.label}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 4 }}>
                  {CONDITION_TYPES.find(ct => ct.value === formType)?.desc}
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: colors.textMuted, display: 'block', marginBottom: 4 }}>
                  Description *
                </label>
                <textarea
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe the boundary condition..."
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: 8,
                    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                    color: colors.textPrimary, fontSize: 13, resize: 'vertical', boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Severity + Domain row */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: colors.textMuted, display: 'block', marginBottom: 4 }}>
                    Severity
                  </label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {SEVERITIES.map(s => (
                      <button key={s.value} onClick={() => setFormSeverity(s.value)} style={{
                        flex: 1, padding: '6px 0', borderRadius: 6, fontSize: 11, fontWeight: 600,
                        border: formSeverity === s.value ? `1px solid ${s.color}80` : (isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)'),
                        background: formSeverity === s.value ? `${s.color}18` : 'transparent',
                        color: formSeverity === s.value ? s.color : colors.textMuted,
                        cursor: 'pointer',
                      }}>{s.label}</button>
                    ))}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: colors.textMuted, display: 'block', marginBottom: 4 }}>
                    Domain
                  </label>
                  <select value={formDomain} onChange={e => setFormDomain(e.target.value)} style={{
                    width: '100%', padding: '8px 10px', borderRadius: 8,
                    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                    color: colors.textPrimary, fontSize: 13,
                  }}>
                    {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              {/* Parameter constraints (only for parameter type) */}
              {formType === 'parameter' && (
                <div style={{
                  marginBottom: 14, padding: 12, borderRadius: 8,
                  background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)',
                }}>
                  <label style={{ fontSize: 12, color: '#93c5fd', display: 'block', marginBottom: 8 }}>
                    📊 Parameter Constraints
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={formParamName} onChange={e => setFormParamName(e.target.value)}
                      placeholder="Parameter name" style={{
                        flex: 2, padding: '6px 10px', borderRadius: 6,
                        background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                        color: colors.textPrimary, fontSize: 12,
                      }} />
                    <input value={formParamMin} onChange={e => setFormParamMin(e.target.value)}
                      placeholder="Min" style={{
                        flex: 1, padding: '6px 10px', borderRadius: 6,
                        background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                        color: colors.textPrimary, fontSize: 12,
                      }} />
                    <span style={{ color: colors.textMuted, alignSelf: 'center' }}>→</span>
                    <input value={formParamMax} onChange={e => setFormParamMax(e.target.value)}
                      placeholder="Max" style={{
                        flex: 1, padding: '6px 10px', borderRadius: 6,
                        background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                        color: colors.textPrimary, fontSize: 12,
                      }} />
                  </div>
                </div>
              )}

              {/* Notes */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: colors.textMuted, display: 'block', marginBottom: 4 }}>
                  Notes (optional)
                </label>
                <textarea value={formNotes} onChange={e => setFormNotes(e.target.value)}
                  rows={2} placeholder="Additional context..."
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: 8,
                    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                    color: colors.textPrimary, fontSize: 12, resize: 'vertical', boxSizing: 'border-box',
                  }} />
              </div>

              {/* Templates */}
              {!editingId && (
                <div style={{
                  marginBottom: 14, padding: 12, borderRadius: 8,
                  background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.12)',
                }}>
                  <div style={{ fontSize: 12, color: '#c4b5fd', marginBottom: 8, fontWeight: 600 }}>
                    📋 Quick Templates (auto-fills for selected claim)
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {TEMPLATES.map((tmpl, i) => (
                      <button key={i} onClick={() => applyTemplate(tmpl)} style={{
                        padding: '5px 12px', borderRadius: 6, fontSize: 11,
                        background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)',
                        color: '#c4b5fd', cursor: 'pointer',
                      }}>{tmpl.name} ({tmpl.conditions.length})</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Save button */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={saveCondition} disabled={!formDescription.trim()} style={{
                  flex: 1, padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                  background: formDescription.trim() ? 'rgba(6,182,212,0.2)' : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                  border: formDescription.trim() ? '1px solid rgba(6,182,212,0.4)' : (isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)'),
                  color: formDescription.trim() ? '#67e8f9' : colors.textMuted,
                  cursor: formDescription.trim() ? 'pointer' : 'not-allowed',
                }}>
                  {editingId ? '💾 Update Condition' : '➕ Add Condition'}
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

export default BoundaryConditionsPanel;
