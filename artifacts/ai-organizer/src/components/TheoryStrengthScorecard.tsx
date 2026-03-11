/**
 * TheoryStrengthScorecard Component (N)
 *
 * Aggregated dashboard showing overall theory health:
 * - Evidence coverage score
 * - Falsifiability score
 * - Internal consistency score
 * - Boundary completeness score
 * - Contradiction resolution rate
 * - Predictive power score
 * - Overall composite grade
 *
 * Pulls data from localStorage of other Think!Hub tools when available.
 * Persists its own assessments to localStorage.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';

// ── Types ──

interface DimensionScore {
  id: string;
  dimension: string;
  score: number; // 0–100
  weight: number; // 0–1
  notes: string;
  autoDetected: boolean;
  lastUpdated: string;
}

interface TheoryStrengthScorecardProps {
  open: boolean;
  onClose: () => void;
}

// ── Constants ──

const STORAGE_KEY = 'thinkspace-theory-scorecard';

const DEFAULT_DIMENSIONS: Omit<DimensionScore, 'id' | 'lastUpdated'>[] = [
  { dimension: 'Evidence Coverage', score: 0, weight: 0.20, notes: '', autoDetected: false },
  { dimension: 'Falsifiability', score: 0, weight: 0.15, notes: '', autoDetected: false },
  { dimension: 'Internal Consistency', score: 0, weight: 0.15, notes: '', autoDetected: false },
  { dimension: 'Boundary Completeness', score: 0, weight: 0.10, notes: '', autoDetected: false },
  { dimension: 'Contradiction Resolution', score: 0, weight: 0.10, notes: '', autoDetected: false },
  { dimension: 'Predictive Power', score: 0, weight: 0.10, notes: '', autoDetected: false },
  { dimension: 'Reproducibility', score: 0, weight: 0.08, notes: '', autoDetected: false },
  { dimension: 'Peer Review Readiness', score: 0, weight: 0.07, notes: '', autoDetected: false },
  { dimension: 'Conceptual Clarity', score: 0, weight: 0.05, notes: '', autoDetected: false },
];

const GRADE_THRESHOLDS: { min: number; grade: string; label: string; color: string; bg: string }[] = [
  { min: 90, grade: 'A+', label: 'Exceptional', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  { min: 80, grade: 'A', label: 'Strong', color: '#34d399', bg: 'rgba(52,211,153,0.10)' },
  { min: 70, grade: 'B', label: 'Good', color: '#3b82f6', bg: 'rgba(59,130,246,0.10)' },
  { min: 60, grade: 'C', label: 'Adequate', color: '#f59e0b', bg: 'rgba(245,158,11,0.10)' },
  { min: 50, grade: 'D', label: 'Weak', color: '#f97316', bg: 'rgba(249,115,22,0.10)' },
  { min: 0, grade: 'F', label: 'Insufficient', color: '#ef4444', bg: 'rgba(239,68,68,0.10)' },
];

// ── Component ──

export function TheoryStrengthScorecard({ open, onClose }: TheoryStrengthScorecardProps) {
  const { colors, isDark } = useTheme();
  const [dimensions, setDimensions] = useState<DimensionScore[]>([]);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [theoryName, setTheoryName] = useState('');
  const [view, setView] = useState<'scorecard' | 'details' | 'history'>('scorecard');
  const [history, setHistory] = useState<{ date: string; composite: number; grade: string }[]>([]);

  // ── Load / Save ──
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        setDimensions(data.dimensions || []);
        setTheoryName(data.theoryName || '');
        setHistory(data.history || []);
      } else {
        // Initialize with defaults
        const now = new Date().toISOString();
        const initial = DEFAULT_DIMENSIONS.map((d, i) => ({
          ...d,
          id: `dim-${i}`,
          lastUpdated: now,
        }));
        setDimensions(initial);
      }
    } catch { /* ignore */ }
  }, []);

  const persist = useCallback((dims: DimensionScore[], name: string, hist: { date: string; composite: number; grade: string }[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ dimensions: dims, theoryName: name, history: hist }));
  }, []);

  // ── Auto-detect from other tools ──
  const autoDetect = useCallback(() => {
    const now = new Date().toISOString();
    const updated = [...dimensions];

    // Boundary conditions
    try {
      const bcRaw = localStorage.getItem('thinkspace-boundary-conditions');
      if (bcRaw) {
        const bc = JSON.parse(bcRaw);
        const condCount = (bc.conditions || []).length;
        const claimCount = (bc.claims || []).length;
        const idx = updated.findIndex(d => d.dimension === 'Boundary Completeness');
        if (idx >= 0 && condCount > 0) {
          const ratio = claimCount > 0 ? Math.min(condCount / (claimCount * 3), 1) : 0;
          updated[idx] = { ...updated[idx], score: Math.round(ratio * 100), autoDetected: true, lastUpdated: now, notes: `${condCount} conditions across ${claimCount} claims` };
        }
      }
    } catch { /* ignore */ }

    // Contradictions
    try {
      const ctrRaw = localStorage.getItem('thinkspace-contradictions');
      if (ctrRaw) {
        const ctrs: { resolution: string }[] = JSON.parse(ctrRaw);
        if (ctrs.length > 0) {
          const resolved = ctrs.filter(c => c.resolution !== 'unresolved').length;
          const rate = Math.round((resolved / ctrs.length) * 100);
          const idx = updated.findIndex(d => d.dimension === 'Contradiction Resolution');
          if (idx >= 0) {
            updated[idx] = { ...updated[idx], score: rate, autoDetected: true, lastUpdated: now, notes: `${resolved}/${ctrs.length} resolved` };
          }
        }
      }
    } catch { /* ignore */ }

    // Argument map
    try {
      const amRaw = localStorage.getItem('thinkspace-argument-map');
      if (amRaw) {
        const am = JSON.parse(amRaw);
        const nodeCount = (am.nodes || []).length;
        const edgeCount = (am.edges || []).length;
        const claimNodes = (am.nodes || []).filter((n: { type: string }) => n.type === 'claim').length;
        const validatedClaims = (am.nodes || []).filter((n: { type: string; status: string }) => n.type === 'claim' && n.status === 'validated').length;
        const evidenceNodes = (am.nodes || []).filter((n: { type: string }) => n.type === 'evidence').length;

        const evidIdx = updated.findIndex(d => d.dimension === 'Evidence Coverage');
        if (evidIdx >= 0 && claimNodes > 0) {
          const ratio = Math.min(evidenceNodes / claimNodes, 1);
          updated[evidIdx] = { ...updated[evidIdx], score: Math.round(ratio * 100), autoDetected: true, lastUpdated: now, notes: `${evidenceNodes} evidence for ${claimNodes} claims` };
        }

        const consIdx = updated.findIndex(d => d.dimension === 'Conceptual Clarity');
        if (consIdx >= 0 && nodeCount > 0) {
          const connectivity = edgeCount / nodeCount;
          const score = Math.min(Math.round(connectivity * 50), 100);
          updated[consIdx] = { ...updated[consIdx], score, autoDetected: true, lastUpdated: now, notes: `${nodeCount} nodes, ${edgeCount} edges` };
        }

        const falsIdx = updated.findIndex(d => d.dimension === 'Falsifiability');
        if (falsIdx >= 0 && claimNodes > 0) {
          const score = Math.round((validatedClaims / claimNodes) * 100);
          updated[falsIdx] = { ...updated[falsIdx], score, autoDetected: true, lastUpdated: now, notes: `${validatedClaims}/${claimNodes} claims validated` };
        }
      }
    } catch { /* ignore */ }

    setDimensions(updated);
    persist(updated, theoryName, history);
  }, [dimensions, theoryName, history, persist]);

  // ── Update score ──
  const updateScore = useCallback((idx: number, score: number) => {
    const updated = [...dimensions];
    updated[idx] = { ...updated[idx], score: Math.max(0, Math.min(100, score)), autoDetected: false, lastUpdated: new Date().toISOString() };
    setDimensions(updated);
    persist(updated, theoryName, history);
  }, [dimensions, theoryName, history, persist]);

  const updateNotes = useCallback((idx: number, notes: string) => {
    const updated = [...dimensions];
    updated[idx] = { ...updated[idx], notes };
    setDimensions(updated);
    persist(updated, theoryName, history);
  }, [dimensions, theoryName, history, persist]);

  const updateWeight = useCallback((idx: number, weight: number) => {
    const updated = [...dimensions];
    updated[idx] = { ...updated[idx], weight: Math.max(0, Math.min(1, weight)) };
    setDimensions(updated);
    persist(updated, theoryName, history);
  }, [dimensions, theoryName, history, persist]);

  // ── Snapshot history ──
  const takeSnapshot = useCallback(() => {
    const composite = compositeScore;
    const grade = getGrade(composite);
    const newEntry = { date: new Date().toISOString(), composite, grade: grade.grade };
    const updated = [...history, newEntry];
    setHistory(updated);
    persist(dimensions, theoryName, updated);
  }, [dimensions, theoryName, history, persist]);

  // ── Computed values ──
  const compositeScore = useMemo(() => {
    const totalWeight = dimensions.reduce((sum, d) => sum + d.weight, 0);
    if (totalWeight === 0) return 0;
    const weighted = dimensions.reduce((sum, d) => sum + d.score * d.weight, 0);
    return Math.round(weighted / totalWeight);
  }, [dimensions]);

  const getGrade = (score: number) => GRADE_THRESHOLDS.find(g => score >= g.min) || GRADE_THRESHOLDS[GRADE_THRESHOLDS.length - 1];
  const grade = getGrade(compositeScore);

  const weakest = useMemo(() => {
    return [...dimensions].sort((a, b) => a.score - b.score).slice(0, 3);
  }, [dimensions]);

  const strongest = useMemo(() => {
    return [...dimensions].sort((a, b) => b.score - a.score).slice(0, 3);
  }, [dimensions]);

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '90vw', maxWidth: 900, maxHeight: '88vh',
        background: isDark ? 'linear-gradient(135deg, #1a1a2e 0%, #0d1b2a 100%)' : '#ffffff',
        borderRadius: 16, border: `1px solid ${isDark ? `${grade.color}30` : 'rgba(0,0,0,0.1)'}`,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: isDark ? '0 25px 60px rgba(0,0,0,0.5)' : '0 25px 60px rgba(0,0,0,0.15)',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: `${grade.color}06`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: grade.bg, border: `2px solid ${grade.color}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 900, color: grade.color,
            }}>{grade.grade}</div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, color: colors.textPrimary, fontWeight: 700 }}>Think!Hub Theory Strength Scorecard</h2>
              <div style={{ fontSize: 11, color: colors.textMuted }}>
                Composite: {compositeScore}/100 — {grade.label}
                {theoryName && <span> — {theoryName}</span>}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {(['scorecard', 'details', 'history'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                border: view === v ? `1px solid ${grade.color}50` : (isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)'),
                background: view === v ? `${grade.color}12` : 'transparent',
                color: view === v ? grade.color : colors.textMuted,
                cursor: 'pointer',
              }}>
                {v === 'scorecard' ? '📊 Score' : v === 'details' ? '🔍 Details' : '📈 History'}
              </button>
            ))}
            <button onClick={autoDetect} title="Auto-detect from other Think!Hub tools" style={{
              padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
              border: '1px solid rgba(6,182,212,0.3)', background: 'rgba(6,182,212,0.08)',
              color: '#67e8f9', cursor: 'pointer',
            }}>🔄 Sync</button>
            <button onClick={onClose} style={{
              marginLeft: 4, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
              borderRadius: 8, color: colors.textMuted, cursor: 'pointer', padding: '6px 12px', fontSize: 13,
            }}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>

          {/* ── SCORECARD VIEW ── */}
          {view === 'scorecard' && (
            <div>
              {/* Theory name */}
              <div style={{ marginBottom: 16 }}>
                <input value={theoryName} onChange={e => { setTheoryName(e.target.value); persist(dimensions, e.target.value, history); }}
                  placeholder="Theory name (optional)..."
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: 8, boxSizing: 'border-box',
                    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                    color: colors.textPrimary, fontSize: 14, fontWeight: 600,
                  }} />
              </div>

              {/* Composite score display */}
              <div style={{
                textAlign: 'center', padding: '24px 20px', marginBottom: 20,
                borderRadius: 12, background: grade.bg, border: `1px solid ${grade.color}25`,
              }}>
                <div style={{ fontSize: 56, fontWeight: 900, color: grade.color, lineHeight: 1 }}>
                  {compositeScore}
                </div>
                <div style={{ fontSize: 14, color: grade.color, fontWeight: 600, marginTop: 4 }}>
                  {grade.grade} — {grade.label}
                </div>
                <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 8 }}>
                  Weighted composite across {dimensions.length} dimensions
                </div>
              </div>

              {/* Dimension bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {dimensions.map((dim, idx) => {
                  const dimGrade = getGrade(dim.score);
                  return (
                    <div key={dim.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', borderRadius: 8,
                      background: editingIdx === idx ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)') : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)'),
                      border: `1px solid ${editingIdx === idx ? (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)') : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)')}`,
                      cursor: 'pointer',
                    }} onClick={() => setEditingIdx(editingIdx === idx ? null : idx)}>
                      {/* Label */}
                      <div style={{ width: 160, fontSize: 12, color: colors.textPrimary, fontWeight: 500 }}>
                        {dim.dimension}
                        {dim.autoDetected && <span style={{ fontSize: 9, color: '#67e8f9', marginLeft: 4 }}>🔄</span>}
                      </div>

                      {/* Bar */}
                      <div style={{ flex: 1, height: 10, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)', borderRadius: 5, overflow: 'hidden' }}>
                        <div style={{
                          width: `${dim.score}%`, height: '100%',
                          background: `linear-gradient(90deg, ${dimGrade.color}80, ${dimGrade.color})`,
                          borderRadius: 5, transition: 'width 0.4s ease',
                        }} />
                      </div>

                      {/* Score */}
                      <div style={{ width: 40, textAlign: 'right', fontSize: 13, fontWeight: 700, color: dimGrade.color }}>
                        {dim.score}
                      </div>

                      {/* Weight */}
                      <div style={{ width: 35, textAlign: 'right', fontSize: 10, color: colors.textMuted }}>
                        ×{dim.weight.toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Inline editor */}
              {editingIdx !== null && dimensions[editingIdx] && (
                <div style={{
                  padding: 14, borderRadius: 10,
                  background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                  marginBottom: 16,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary, marginBottom: 10 }}>
                    {dimensions[editingIdx].dimension}
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 11, color: colors.textMuted, display: 'block', marginBottom: 3 }}>Score (0–100)</label>
                      <input type="range" min={0} max={100} value={dimensions[editingIdx].score}
                        onChange={e => updateScore(editingIdx, parseInt(e.target.value))}
                        style={{ width: '100%' }} />
                      <div style={{ textAlign: 'center', fontSize: 18, fontWeight: 700, color: getGrade(dimensions[editingIdx].score).color }}>
                        {dimensions[editingIdx].score}
                      </div>
                    </div>
                    <div style={{ width: 100 }}>
                      <label style={{ fontSize: 11, color: colors.textMuted, display: 'block', marginBottom: 3 }}>Weight</label>
                      <input type="number" min={0} max={1} step={0.01}
                        value={dimensions[editingIdx].weight}
                        onChange={e => updateWeight(editingIdx, parseFloat(e.target.value) || 0)}
                        style={{
                          width: '100%', padding: '6px 8px', borderRadius: 6,
                          background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                          color: colors.textPrimary, fontSize: 12, textAlign: 'center', boxSizing: 'border-box',
                        }} />
                    </div>
                  </div>
                  <textarea value={dimensions[editingIdx].notes}
                    onChange={e => updateNotes(editingIdx, e.target.value)}
                    rows={2} placeholder="Notes..."
                    style={{
                      width: '100%', padding: '6px 10px', borderRadius: 6, boxSizing: 'border-box',
                      background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                      color: colors.textPrimary, fontSize: 11, resize: 'vertical',
                    }} />
                </div>
              )}

              {/* Strengths / Weaknesses */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ padding: 12, borderRadius: 10, background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.12)' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fca5a5', marginBottom: 8 }}>⚠️ Weakest Dimensions</div>
                  {weakest.map(d => (
                    <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 11 }}>
                      <span style={{ color: colors.textMuted }}>{d.dimension}</span>
                      <span style={{ color: getGrade(d.score).color, fontWeight: 700 }}>{d.score}</span>
                    </div>
                  ))}
                </div>
                <div style={{ padding: 12, borderRadius: 10, background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.12)' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#6ee7b7', marginBottom: 8 }}>💪 Strongest Dimensions</div>
                  {strongest.map(d => (
                    <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 11 }}>
                      <span style={{ color: colors.textMuted }}>{d.dimension}</span>
                      <span style={{ color: getGrade(d.score).color, fontWeight: 700 }}>{d.score}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Snapshot button */}
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <button onClick={takeSnapshot} style={{
                  padding: '8px 20px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)',
                  color: '#c4b5fd', cursor: 'pointer',
                }}>📸 Take Snapshot</button>
              </div>
            </div>
          )}

          {/* ── DETAILS VIEW ── */}
          {view === 'details' && (
            <div>
              <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: colors.textPrimary }}>🔍 Dimension Details</h3>
              {dimensions.map((dim, idx) => {
                const dimGrade = getGrade(dim.score);
                return (
                  <div key={dim.id} style={{
                    padding: '12px 14px', borderRadius: 10, marginBottom: 8,
                    background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', border: `1px solid ${dimGrade.color}18`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{
                        display: 'inline-block', width: 28, height: 28, borderRadius: 6,
                        background: dimGrade.bg, textAlign: 'center', lineHeight: '28px',
                        fontSize: 11, fontWeight: 800, color: dimGrade.color,
                      }}>{dimGrade.grade}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>{dim.dimension}</div>
                        <div style={{ fontSize: 10, color: colors.textMuted }}>
                          Score: {dim.score}/100 — Weight: {(dim.weight * 100).toFixed(0)}%
                          {dim.autoDetected && <span style={{ color: '#67e8f9' }}> (auto-synced)</span>}
                        </div>
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: dimGrade.color }}>{dim.score}</div>
                    </div>
                    {dim.notes && (
                      <div style={{ fontSize: 11, color: colors.textMuted, fontStyle: 'italic', paddingLeft: 38 }}>
                        {dim.notes}
                      </div>
                    )}
                    <div style={{ paddingLeft: 38, marginTop: 6 }}>
                      <input type="range" min={0} max={100} value={dim.score}
                        onChange={e => updateScore(idx, parseInt(e.target.value))}
                        style={{ width: '100%' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── HISTORY VIEW ── */}
          {view === 'history' && (
            <div>
              <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: colors.textPrimary }}>📈 Score History</h3>
              {history.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: colors.textMuted, fontSize: 13 }}>
                  No snapshots yet. Click "📸 Take Snapshot" in the Scorecard view.
                </div>
              ) : (
                <div>
                  {/* Mini chart */}
                  <div style={{
                    padding: '16px', borderRadius: 10, marginBottom: 16,
                    background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
                    height: 120, display: 'flex', alignItems: 'flex-end', gap: 4,
                  }}>
                    {history.map((h, i) => {
                      const g = getGrade(h.composite);
                      return (
                        <div key={i} style={{
                          flex: 1, maxWidth: 40,
                          height: `${h.composite}%`,
                          background: `${g.color}40`, border: `1px solid ${g.color}60`,
                          borderRadius: '4px 4px 0 0',
                          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                          paddingTop: 4,
                        }}>
                          <span style={{ fontSize: 9, fontWeight: 700, color: g.color }}>{h.composite}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* History list */}
                  {[...history].reverse().map((h, i) => {
                    const g = getGrade(h.composite);
                    return (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 12px', borderRadius: 8, marginBottom: 4,
                        background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                      }}>
                        <span style={{
                          width: 28, height: 28, borderRadius: 6,
                          background: g.bg, textAlign: 'center', lineHeight: '28px',
                          fontSize: 11, fontWeight: 800, color: g.color,
                        }}>{h.grade}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: g.color }}>{h.composite}/100</span>
                        <span style={{ flex: 1, fontSize: 11, color: colors.textMuted }}>
                          {new Date(h.date).toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TheoryStrengthScorecard;
