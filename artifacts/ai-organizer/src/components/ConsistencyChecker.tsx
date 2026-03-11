// src/components/ConsistencyChecker.tsx
// Math/Dimensional Consistency Checker — validates dimensional analysis and mathematical consistency
import { useState, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";

// ─── Types ───────────────────────────────────────────────────────────
type DimensionCategory = 'physical' | 'economic' | 'social' | 'temporal' | 'spatial' | 'informational' | 'custom';
type Severity = 'error' | 'warning' | 'info';

interface DimensionDef {
  id: string;
  name: string;
  symbol: string;
  category: DimensionCategory;
  baseUnits: string;
  description: string;
}

interface ConsistencyCheck {
  id: string;
  expressionLeft: string;
  operator: '=' | '≈' | '∝' | '>' | '<' | '≥' | '≤';
  expressionRight: string;
  leftDimensions: string[];
  rightDimensions: string[];
  status: 'valid' | 'invalid' | 'warning' | 'unchecked';
  notes: string;
  issues: ConsistencyIssue[];
}

interface ConsistencyIssue {
  id: string;
  severity: Severity;
  message: string;
  suggestion: string;
}

interface ConsistencyCheckerProps {
  open: boolean;
  onClose: () => void;
}

// ─── Constants ───────────────────────────────────────────────────────
const STORAGE_KEY = 'thinkspace-consistency-checker';

const CATEGORY_INFO: Record<DimensionCategory, { icon: string; color: string }> = {
  physical:      { icon: '⚛️', color: '#6366f1' },
  economic:      { icon: '💰', color: '#10b981' },
  social:        { icon: '👥', color: '#f59e0b' },
  temporal:      { icon: '⏱', color: '#06b6d4' },
  spatial:       { icon: '📏', color: '#8b5cf6' },
  informational: { icon: '📊', color: '#ec4899' },
  custom:        { icon: '🔧', color: '#6b7280' },
};

const SEVERITY_INFO: Record<Severity, { icon: string; color: string; bg: string }> = {
  error:   { icon: '❌', color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
  warning: { icon: '⚠️', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
  info:    { icon: 'ℹ️', color: '#06b6d4', bg: 'rgba(6,182,212,0.08)' },
};

const STATUS_INFO: Record<string, { icon: string; color: string }> = {
  valid:     { icon: '✅', color: '#10b981' },
  invalid:   { icon: '❌', color: '#ef4444' },
  warning:   { icon: '⚠️', color: '#f59e0b' },
  unchecked: { icon: '⬜', color: '#6b7280' },
};

const PRESET_DIMENSIONS: DimensionDef[] = [
  { id: 'd1', name: 'Mass', symbol: 'M', category: 'physical', baseUnits: 'kg', description: 'Physical mass' },
  { id: 'd2', name: 'Length', symbol: 'L', category: 'physical', baseUnits: 'm', description: 'Physical distance' },
  { id: 'd3', name: 'Time', symbol: 'T', category: 'physical', baseUnits: 's', description: 'Duration' },
  { id: 'd4', name: 'Temperature', symbol: 'Θ', category: 'physical', baseUnits: 'K', description: 'Thermodynamic temperature' },
  { id: 'd5', name: 'Currency', symbol: '$', category: 'economic', baseUnits: 'USD', description: 'Monetary value' },
  { id: 'd6', name: 'Population', symbol: 'P', category: 'social', baseUnits: 'persons', description: 'Number of people' },
  { id: 'd7', name: 'Rate', symbol: 'R', category: 'temporal', baseUnits: '1/s', description: 'Change per time unit' },
  { id: 'd8', name: 'Area', symbol: 'A', category: 'spatial', baseUnits: 'm²', description: 'Surface area' },
  { id: 'd9', name: 'Information', symbol: 'I', category: 'informational', baseUnits: 'bits', description: 'Information quantity' },
  { id: 'd10', name: 'Probability', symbol: 'p', category: 'informational', baseUnits: '[0,1]', description: 'Probability measure (dimensionless)' },
];

function generateId(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

interface StoredState {
  dimensions: DimensionDef[];
  checks: ConsistencyCheck[];
}

function loadState(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { dimensions: [...PRESET_DIMENSIONS], checks: [] };
}

function saveState(state: StoredState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ─── Analysis helpers ────────────────────────────────────────────────
function analyzeConsistency(check: ConsistencyCheck, dimensions: DimensionDef[]): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];
  const leftDims = check.leftDimensions;
  const rightDims = check.rightDimensions;

  // Check for mismatched dimensions
  if (leftDims.length > 0 && rightDims.length > 0) {
    const leftSet = new Set(leftDims);
    const rightSet = new Set(rightDims);

    // Find dimensions only on one side
    for (const d of leftSet) {
      if (!rightSet.has(d)) {
        const dim = dimensions.find(dd => dd.id === d);
        issues.push({
          id: generateId(),
          severity: 'error',
          message: `Dimension "${dim?.name || d}" appears only on the left side`,
          suggestion: `Add or remove ${dim?.symbol || d} to balance the equation`,
        });
      }
    }
    for (const d of rightSet) {
      if (!leftSet.has(d)) {
        const dim = dimensions.find(dd => dd.id === d);
        issues.push({
          id: generateId(),
          severity: 'error',
          message: `Dimension "${dim?.name || d}" appears only on the right side`,
          suggestion: `Add or remove ${dim?.symbol || d} to balance the equation`,
        });
      }
    }
  }

  // Check for empty expressions
  if (!check.expressionLeft.trim() || !check.expressionRight.trim()) {
    issues.push({
      id: generateId(),
      severity: 'info',
      message: 'One or both expressions are empty',
      suggestion: 'Fill in both sides of the equation to check consistency',
    });
  }

  // Check for dimensionless comparison
  if (leftDims.length === 0 && rightDims.length === 0 && check.expressionLeft.trim() && check.expressionRight.trim()) {
    issues.push({
      id: generateId(),
      severity: 'info',
      message: 'No dimensions assigned to either side',
      suggestion: 'Assign dimensions to check for consistency',
    });
  }

  // Check proportionality operator usage
  if (check.operator === '∝' && leftDims.length > 0 && rightDims.length > 0) {
    const extraLeft = leftDims.filter(d => !rightDims.includes(d));
    if (extraLeft.length > 0) {
      issues.push({
        id: generateId(),
        severity: 'warning',
        message: 'Proportionality may hide a dimensional constant',
        suggestion: 'Ensure the proportionality constant accounts for the missing dimensions',
      });
    }
  }

  return issues;
}

// ─── Component ───────────────────────────────────────────────────────
export function ConsistencyChecker({ open, onClose }: ConsistencyCheckerProps) {
  const [state, setState] = useState<StoredState>(() => loadState());
  const [activeTab, setActiveTab] = useState<'checks' | 'dimensions'>('checks');
  const [selectedCheckId, setSelectedCheckId] = useState<string | null>(null);
  const [showAddDimension, setShowAddDimension] = useState(false);

  const persist = useCallback((updated: StoredState) => {
    setState(updated);
    saveState(updated);
  }, []);

  // ── Check operations ─────────────────────────────────────────────
  const addCheck = useCallback(() => {
    const check: ConsistencyCheck = {
      id: generateId(), expressionLeft: '', operator: '=', expressionRight: '',
      leftDimensions: [], rightDimensions: [],
      status: 'unchecked', notes: '', issues: [],
    };
    persist({ ...state, checks: [check, ...state.checks] });
    setSelectedCheckId(check.id);
    setActiveTab('checks');
  }, [state, persist]);

  const updateCheck = useCallback((id: string, updates: Partial<ConsistencyCheck>) => {
    persist({
      ...state,
      checks: state.checks.map(c => c.id === id ? { ...c, ...updates } : c),
    });
  }, [state, persist]);

  const runCheck = useCallback((id: string) => {
    const check = state.checks.find(c => c.id === id);
    if (!check) return;
    const issues = analyzeConsistency(check, state.dimensions);
    const status = issues.some(i => i.severity === 'error') ? 'invalid'
      : issues.some(i => i.severity === 'warning') ? 'warning'
      : issues.length === 0 && check.expressionLeft.trim() && check.expressionRight.trim() ? 'valid'
      : 'unchecked';
    updateCheck(id, { issues, status });
  }, [state, updateCheck]);

  const deleteCheck = useCallback((id: string) => {
    persist({ ...state, checks: state.checks.filter(c => c.id !== id) });
    if (selectedCheckId === id) setSelectedCheckId(null);
  }, [state, persist, selectedCheckId]);

  // ── Dimension operations ──────────────────────────────────────────
  const addDimension = useCallback((dim: Omit<DimensionDef, 'id'>) => {
    persist({ ...state, dimensions: [...state.dimensions, { ...dim, id: generateId() }] });
    setShowAddDimension(false);
  }, [state, persist]);

  const removeDimension = useCallback((id: string) => {
    persist({ ...state, dimensions: state.dimensions.filter(d => d.id !== id) });
  }, [state, persist]);

  const toggleDimension = useCallback((checkId: string, side: 'left' | 'right', dimId: string) => {
    const check = state.checks.find(c => c.id === checkId);
    if (!check) return;
    const key = side === 'left' ? 'leftDimensions' : 'rightDimensions';
    const current = check[key];
    const updated = current.includes(dimId)
      ? current.filter(d => d !== dimId)
      : [...current, dimId];
    updateCheck(checkId, { [key]: updated });
  }, [state, updateCheck]);

  const selectedCheck = state.checks.find(c => c.id === selectedCheckId) || null;
  const { isDark, colors } = useTheme();

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '92vw', maxWidth: 1200, maxHeight: '90vh',
          background: isDark ? 'linear-gradient(165deg, rgba(16,18,30,0.98), rgba(8,10,18,1))' : '#ffffff',
          border: isDark ? '1px solid rgba(6,182,212,0.2)' : '1px solid rgba(0,0,0,0.1)', borderRadius: 20,
          display: 'flex', flexDirection: 'column',
          boxShadow: isDark ? '0 32px 80px rgba(0,0,0,0.6)' : '0 32px 80px rgba(0,0,0,0.15)', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: isDark ? 'linear-gradient(135deg, rgba(6,182,212,0.08), rgba(99,102,241,0.06))' : 'rgba(6,182,212,0.04)',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: colors.textPrimary, display: 'flex', alignItems: 'center', gap: 10 }}>
              📐 Math & Dimensional Consistency
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: colors.textMuted }}>
              Validate dimensional analysis and mathematical consistency of expressions
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={addCheck} style={{
              padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600,
              border: '1px solid rgba(16,185,129,0.3)',
              background: 'rgba(16,185,129,0.1)', color: '#6ee7b7', cursor: 'pointer',
            }}>+ New Check</button>
            <button onClick={onClose} style={{
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
              borderRadius: 10, padding: '8px 12px', color: colors.textMuted,
              cursor: 'pointer', fontSize: 18,
            }}>✕</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          padding: '8px 24px', borderBottom: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.06)',
          display: 'flex', gap: 4, background: isDark ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.02)',
        }}>
          {(['checks', 'dimensions'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              border: activeTab === tab ? '1px solid rgba(6,182,212,0.3)' : '1px solid transparent',
              background: activeTab === tab ? 'rgba(6,182,212,0.1)' : 'transparent',
              color: activeTab === tab ? '#67e8f9' : colors.textMuted,
              cursor: 'pointer', textTransform: 'capitalize',
            }}>
              {tab === 'checks' ? `📐 Checks (${state.checks.length})` : `📏 Dimensions (${state.dimensions.length})`}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
          {activeTab === 'checks' ? (
            <>
              {/* Checks list */}
              <div style={{
                width: selectedCheck ? '35%' : '100%',
                borderRight: selectedCheck ? (isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)') : 'none',
                overflow: 'auto', padding: '12px',
              }}>
                {state.checks.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 16px', color: colors.textMuted }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📐</div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>No consistency checks</div>
                    <div style={{ fontSize: 12 }}>Click "+ New Check" to verify dimensional consistency</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {state.checks.map(check => {
                      const sInfo = STATUS_INFO[check.status];
                      return (
                        <button key={check.id}
                          onClick={() => setSelectedCheckId(selectedCheckId === check.id ? null : check.id)}
                          style={{
                            padding: '10px 12px', borderRadius: 10, textAlign: 'left', width: '100%',
                            border: selectedCheckId === check.id ? '1px solid rgba(6,182,212,0.3)' : (isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)'),
                            background: selectedCheckId === check.id ? 'rgba(6,182,212,0.06)' : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)'),
                            color: colors.textPrimary, cursor: 'pointer',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <span style={{ fontSize: 14 }}>{sInfo.icon}</span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: sInfo.color }}>{check.status}</span>
                            {check.issues.length > 0 && (
                              <span style={{ fontSize: 10, color: colors.textMuted, marginLeft: 'auto' }}>
                                {check.issues.length} issues
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: colors.textSecondary, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {check.expressionLeft || '...'} {check.operator} {check.expressionRight || '...'}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Check detail */}
              {selectedCheck && (
                <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Expression editor */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, alignItems: 'end' }}>
                      <div>
                        <label style={{ fontSize: 11, color: colors.textMuted, fontWeight: 600, marginBottom: 4, display: 'block' }}>Left Expression</label>
                        <input value={selectedCheck.expressionLeft}
                          onChange={e => updateCheck(selectedCheck.id, { expressionLeft: e.target.value })}
                          placeholder="e.g. F = ma"
                          style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.03)', color: colors.textPrimary, fontSize: 14, fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                      <select value={selectedCheck.operator}
                        onChange={e => updateCheck(selectedCheck.id, { operator: e.target.value as ConsistencyCheck['operator'] })}
                        style={{ padding: '10px 12px', borderRadius: 10, border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.03)', color: colors.textPrimary, fontSize: 16, fontFamily: 'monospace', outline: 'none', cursor: 'pointer', textAlign: 'center' }}>
                        {['=', '≈', '∝', '>', '<', '≥', '≤'].map(op => (
                          <option key={op} value={op}>{op}</option>
                        ))}
                      </select>
                      <div>
                        <label style={{ fontSize: 11, color: colors.textMuted, fontWeight: 600, marginBottom: 4, display: 'block' }}>Right Expression</label>
                        <input value={selectedCheck.expressionRight}
                          onChange={e => updateCheck(selectedCheck.id, { expressionRight: e.target.value })}
                          placeholder="e.g. kg⋅m/s²"
                          style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.03)', color: colors.textPrimary, fontSize: 14, fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                    </div>

                    {/* Dimension assignment */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      {(['left', 'right'] as const).map(side => (
                        <div key={side}>
                          <label style={{ fontSize: 11, color: colors.textMuted, fontWeight: 600, marginBottom: 6, display: 'block', textTransform: 'capitalize' }}>
                            {side} Dimensions
                          </label>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {state.dimensions.map(dim => {
                              const dims = side === 'left' ? selectedCheck.leftDimensions : selectedCheck.rightDimensions;
                              const isActive = dims.includes(dim.id);
                              const catInfo = CATEGORY_INFO[dim.category];
                              return (
                                <button key={dim.id}
                                  onClick={() => toggleDimension(selectedCheck.id, side, dim.id)}
                                  style={{
                                    padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                                    border: isActive ? `1px solid ${catInfo.color}50` : (isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)'),
                                    background: isActive ? `${catInfo.color}15` : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'),
                                    color: isActive ? catInfo.color : colors.textMuted,
                                    cursor: 'pointer',
                                  }}
                                  title={dim.description}
                                >{dim.symbol}</button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Run check button */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => runCheck(selectedCheck.id)} style={{
                        padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                        border: '1px solid rgba(6,182,212,0.3)',
                        background: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(99,102,241,0.1))',
                        color: '#67e8f9', cursor: 'pointer',
                      }}>▶ Run Consistency Check</button>
                      <button onClick={() => deleteCheck(selectedCheck.id)} style={{
                        padding: '10px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                        border: '1px solid rgba(239,68,68,0.2)',
                        background: 'rgba(239,68,68,0.08)', color: '#fca5a5', cursor: 'pointer',
                        marginLeft: 'auto',
                      }}>🗑</button>
                    </div>

                    {/* Issues */}
                    {selectedCheck.issues.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: colors.textSecondary }}>
                          Issues ({selectedCheck.issues.length})
                        </div>
                        {selectedCheck.issues.map(issue => {
                          const sev = SEVERITY_INFO[issue.severity];
                          return (
                            <div key={issue.id} style={{
                              padding: '10px 14px', borderRadius: 10,
                              background: sev.bg, border: `1px solid ${sev.color}20`,
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                <span style={{ fontSize: 14 }}>{sev.icon}</span>
                                <span style={{ fontSize: 12, fontWeight: 600, color: sev.color }}>{issue.severity.toUpperCase()}</span>
                              </div>
                              <div style={{ fontSize: 12, color: colors.textPrimary, marginBottom: 4 }}>{issue.message}</div>
                              <div style={{ fontSize: 11, color: colors.textMuted, fontStyle: 'italic' }}>💡 {issue.suggestion}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Notes */}
                    <div>
                      <label style={{ fontSize: 11, color: colors.textMuted, fontWeight: 600, marginBottom: 4, display: 'block' }}>Notes</label>
                      <textarea value={selectedCheck.notes}
                        onChange={e => updateCheck(selectedCheck.id, { notes: e.target.value })}
                        placeholder="Any notes about this consistency check..."
                        rows={3} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.03)', color: colors.textPrimary, fontSize: 12, outline: 'none', resize: 'vertical', lineHeight: 1.5, boxSizing: 'border-box' }} />
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Dimensions tab */
            <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: colors.textSecondary }}>
                  Defined Dimensions
                </div>
                <button onClick={() => setShowAddDimension(!showAddDimension)} style={{
                  padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  border: '1px solid rgba(16,185,129,0.3)',
                  background: 'rgba(16,185,129,0.1)', color: '#6ee7b7', cursor: 'pointer',
                }}>+ Add Dimension</button>
              </div>

              {showAddDimension && <AddDimensionForm onAdd={addDimension} onCancel={() => setShowAddDimension(false)} />}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 10 }}>
                {state.dimensions.map(dim => {
                  const catInfo = CATEGORY_INFO[dim.category];
                  return (
                    <div key={dim.id} style={{
                      padding: '12px 14px', borderRadius: 12,
                      border: `1px solid ${catInfo.color}20`,
                      background: `${catInfo.color}05`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 16 }}>{catInfo.icon}</span>
                        <span style={{ fontSize: 18, fontWeight: 700, color: catInfo.color, fontFamily: 'monospace' }}>{dim.symbol}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>{dim.name}</span>
                        <button onClick={() => removeDimension(dim.id)}
                          style={{ marginLeft: 'auto', border: 'none', background: 'transparent', color: colors.textMuted, cursor: 'pointer', fontSize: 14 }}>✕</button>
                      </div>
                      <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 2 }}>{dim.description}</div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <span style={{ fontSize: 10, color: colors.textMuted, background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', padding: '1px 6px', borderRadius: 4 }}>{dim.category}</span>
                        <span style={{ fontSize: 10, color: colors.textMuted, background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', padding: '1px 6px', borderRadius: 4 }}>{dim.baseUnits}</span>
                      </div>
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

// ─── Add dimension form ──────────────────────────────────────────────
function AddDimensionForm({ onAdd, onCancel }: { onAdd: (d: Omit<DimensionDef, 'id'>) => void; onCancel: () => void }) {
  const { isDark, colors } = useTheme();
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [category, setCategory] = useState<DimensionCategory>('custom');
  const [baseUnits, setBaseUnits] = useState('');
  const [description, setDescription] = useState('');

  const inputStyle: React.CSSProperties = {
    padding: '6px 8px', borderRadius: 6,
    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
    background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.03)',
    color: colors.textPrimary, fontSize: 12, outline: 'none',
  };

  return (
    <div style={{
      padding: '14px', borderRadius: 12, marginBottom: 14,
      border: '1px solid rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.04)',
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr 100px', gap: 8, marginBottom: 8 }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Name"
          style={inputStyle} />
        <input value={symbol} onChange={e => setSymbol(e.target.value)} placeholder="Symbol"
          style={{ ...inputStyle, fontFamily: 'monospace' }} />
        <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description"
          style={inputStyle} />
        <input value={baseUnits} onChange={e => setBaseUnits(e.target.value)} placeholder="Units"
          style={inputStyle} />
      </div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
        {Object.entries(CATEGORY_INFO).map(([k, v]) => (
          <button key={k} onClick={() => setCategory(k as DimensionCategory)} style={{
            padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600,
            border: category === k ? `1px solid ${v.color}40` : (isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)'),
            background: category === k ? `${v.color}15` : 'transparent',
            color: category === k ? v.color : colors.textMuted,
            cursor: 'pointer',
          }}>{v.icon} {k}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{ padding: '4px 12px', borderRadius: 6, fontSize: 11, border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', background: 'transparent', color: colors.textMuted, cursor: 'pointer' }}>Cancel</button>
        <button onClick={() => { if (name && symbol) onAdd({ name, symbol, category, baseUnits, description }); }}
          style={{ padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.1)', color: '#6ee7b7', cursor: 'pointer' }}>Add</button>
      </div>
    </div>
  );
}

export default ConsistencyChecker;
