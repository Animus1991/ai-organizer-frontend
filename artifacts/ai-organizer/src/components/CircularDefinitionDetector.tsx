// src/components/CircularDefinitionDetector.tsx
// Circular Definition Detector — finds circular references in concept definitions
import { useState, useMemo, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────────────
interface ConceptDef {
  id: string;
  term: string;
  definition: string;
  referencedTerms: string[];
}

interface CircularChain {
  id: string;
  terms: string[];
  severity: 'critical' | 'warning' | 'indirect';
  description: string;
}

interface CircularDefinitionDetectorProps {
  open: boolean;
  onClose: () => void;
}

// ─── Constants ───────────────────────────────────────────────────────
const STORAGE_KEY = 'thinkspace-circular-defs';

const SEVERITY_INFO: Record<string, { icon: string; color: string; label: string; bg: string }> = {
  critical: { icon: '🔴', color: '#ef4444', label: 'Direct Circular', bg: 'rgba(239,68,68,0.06)' },
  warning:  { icon: '🟡', color: '#f59e0b', label: 'Mutual Reference', bg: 'rgba(245,158,11,0.06)' },
  indirect: { icon: '🟠', color: '#f97316', label: 'Indirect Cycle',   bg: 'rgba(249,115,22,0.06)' },
};

function generateId(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

function loadConcepts(): ConceptDef[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveConcepts(concepts: ConceptDef[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(concepts));
}

// ─── Graph cycle detection ──────────────────────────────────────────
function normalizeToken(t: string): string {
  return t.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '').trim();
}

function extractReferences(definition: string, allTerms: string[]): string[] {
  const defLower = definition.toLowerCase();
  const refs: string[] = [];
  for (const term of allTerms) {
    const normalized = normalizeToken(term);
    if (normalized.length > 1 && defLower.includes(normalized)) {
      refs.push(term);
    }
  }
  return refs;
}

function detectCircles(concepts: ConceptDef[]): CircularChain[] {
  const chains: CircularChain[] = [];
  const termToRefs = new Map<string, Set<string>>();

  // Build adjacency
  for (const c of concepts) {
    const key = normalizeToken(c.term);
    if (!termToRefs.has(key)) termToRefs.set(key, new Set());
    for (const ref of c.referencedTerms) {
      const refKey = normalizeToken(ref);
      if (refKey !== key) {
        termToRefs.get(key)!.add(refKey);
      }
    }
  }

  // 1. Self-references (A → A)
  for (const c of concepts) {
    const key = normalizeToken(c.term);
    if (normalizeToken(c.definition).includes(key) && key.length > 2) {
      chains.push({
        id: generateId(),
        terms: [c.term],
        severity: 'critical',
        description: `"${c.term}" is defined using itself`,
      });
    }
  }

  // 2. Direct mutual (A → B → A)
  const checked = new Set<string>();
  for (const [a, aRefs] of termToRefs) {
    for (const b of aRefs) {
      const bRefs = termToRefs.get(b);
      if (bRefs?.has(a) && !checked.has(`${b}-${a}`)) {
        checked.add(`${a}-${b}`);
        const termA = concepts.find(c => normalizeToken(c.term) === a)?.term || a;
        const termB = concepts.find(c => normalizeToken(c.term) === b)?.term || b;
        chains.push({
          id: generateId(),
          terms: [termA, termB],
          severity: 'warning',
          description: `"${termA}" and "${termB}" reference each other`,
        });
      }
    }
  }

  // 3. Longer cycles (DFS)
  const allKeys = [...termToRefs.keys()];
  for (const start of allKeys) {
    const visited = new Set<string>();
    const path: string[] = [];

    const dfs = (node: string): boolean => {
      if (path.includes(node) && node === start && path.length > 2) {
        // Found cycle
        const termNames = path.map(k => concepts.find(c => normalizeToken(c.term) === k)?.term || k);
        // Avoid duplicates
        const signature = [...path].sort().join('-');
        if (!chains.some(ch => ch.terms.map(t => normalizeToken(t)).sort().join('-') === signature)) {
          chains.push({
            id: generateId(),
            terms: termNames,
            severity: 'indirect',
            description: `Indirect cycle: ${termNames.join(' → ')} → ${termNames[0]}`,
          });
        }
        return true;
      }
      if (visited.has(node)) return false;
      visited.add(node);
      path.push(node);

      const refs = termToRefs.get(node);
      if (refs) {
        for (const ref of refs) {
          dfs(ref);
        }
      }
      path.pop();
      return false;
    };

    dfs(start);
  }

  return chains;
}

// ─── Component ───────────────────────────────────────────────────────
export function CircularDefinitionDetector({ open, onClose }: CircularDefinitionDetectorProps) {
  const [concepts, setConcepts] = useState<ConceptDef[]>(() => loadConcepts());
  const [analysisRun, setAnalysisRun] = useState(false);
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);
  const [newTerm, setNewTerm] = useState('');
  const [newDefinition, setNewDefinition] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [highlightCycle, setHighlightCycle] = useState<string[] | null>(null);

  const persist = useCallback((updated: ConceptDef[]) => {
    setConcepts(updated);
    saveConcepts(updated);
    setAnalysisRun(false); // reset analysis on data change
  }, []);

  const allTerms = useMemo(() => concepts.map(c => c.term), [concepts]);

  const circles = useMemo(() => {
    if (!analysisRun) return [];
    return detectCircles(concepts);
  }, [concepts, analysisRun]);

  const addConcept = useCallback(() => {
    if (!newTerm.trim()) return;
    const refs = extractReferences(newDefinition, allTerms);
    const concept: ConceptDef = {
      id: generateId(),
      term: newTerm.trim(),
      definition: newDefinition.trim(),
      referencedTerms: refs,
    };
    persist([...concepts, concept]);
    setNewTerm('');
    setNewDefinition('');
    setShowAddForm(false);
  }, [newTerm, newDefinition, concepts, allTerms, persist]);

  const updateConcept = useCallback((id: string, updates: Partial<ConceptDef>) => {
    const updated = concepts.map(c => {
      if (c.id !== id) return c;
      const merged = { ...c, ...updates };
      // Auto-detect references when definition changes
      if (updates.definition !== undefined) {
        const otherTerms = concepts.filter(cc => cc.id !== id).map(cc => cc.term);
        merged.referencedTerms = extractReferences(merged.definition, otherTerms);
      }
      return merged;
    });
    persist(updated);
  }, [concepts, persist]);

  const removeConcept = useCallback((id: string) => {
    persist(concepts.filter(c => c.id !== id));
    if (selectedConceptId === id) setSelectedConceptId(null);
  }, [concepts, persist, selectedConceptId]);

  const refreshReferences = useCallback(() => {
    const updated = concepts.map(c => {
      const otherTerms = concepts.filter(cc => cc.id !== c.id).map(cc => cc.term);
      return { ...c, referencedTerms: extractReferences(c.definition, otherTerms) };
    });
    persist(updated);
  }, [concepts, persist]);

  const runAnalysis = useCallback(() => {
    refreshReferences();
    setTimeout(() => setAnalysisRun(true), 100);
  }, [refreshReferences]);

  const isTermInCycle = useCallback((term: string) => {
    if (!highlightCycle) return false;
    return highlightCycle.some(t => normalizeToken(t) === normalizeToken(term));
  }, [highlightCycle]);

  const selectedConcept = concepts.find(c => c.id === selectedConceptId) || null;

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
          width: '92vw', maxWidth: 1200, maxHeight: '90vh',
          background: 'linear-gradient(165deg, rgba(16,18,30,0.98), rgba(8,10,18,1))',
          border: '1px solid rgba(239,68,68,0.2)', borderRadius: 20,
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(239,68,68,0.06), rgba(245,158,11,0.05))',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
              🔄 Circular Definition Detector
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
              Detects self-references, mutual dependencies, and indirect cycles in concept definitions
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowAddForm(!showAddForm)} style={{
              padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600,
              border: '1px solid rgba(16,185,129,0.3)',
              background: 'rgba(16,185,129,0.1)', color: '#6ee7b7', cursor: 'pointer',
            }}>+ Add Concept</button>
            <button onClick={runAnalysis} disabled={concepts.length < 2} style={{
              padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600,
              border: '1px solid rgba(239,68,68,0.3)',
              background: 'rgba(239,68,68,0.1)', color: '#fca5a5', cursor: concepts.length < 2 ? 'not-allowed' : 'pointer',
              opacity: concepts.length < 2 ? 0.5 : 1,
            }}>🔍 Detect Circles</button>
            <button onClick={onClose} style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10, padding: '8px 12px', color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer', fontSize: 18,
            }}>✕</button>
          </div>
        </div>

        {/* Add form */}
        {showAddForm && (
          <div style={{
            padding: '12px 24px', borderBottom: '1px solid rgba(255,255,255,0.04)',
            background: 'rgba(16,185,129,0.03)',
            display: 'flex', gap: 10,
          }}>
            <input value={newTerm} onChange={e => setNewTerm(e.target.value)}
              placeholder="Term / Concept"
              style={{ width: 200, padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 13, outline: 'none' }} />
            <input value={newDefinition} onChange={e => setNewDefinition(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addConcept()}
              placeholder="Definition (references to other terms will be auto-detected)"
              style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 13, outline: 'none' }} />
            <button onClick={addConcept} style={{
              padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              border: '1px solid rgba(16,185,129,0.3)',
              background: 'rgba(16,185,129,0.1)', color: '#6ee7b7', cursor: 'pointer',
            }}>Add</button>
          </div>
        )}

        {/* Stats bar */}
        {analysisRun && (
          <div style={{
            padding: '10px 24px', borderBottom: '1px solid rgba(255,255,255,0.04)',
            display: 'flex', gap: 20, background: 'rgba(0,0,0,0.1)',
          }}>
            <StatBadge label="Concepts" value={concepts.length} color="#6366f1" />
            <StatBadge label="Circular issues" value={circles.length} color={circles.length > 0 ? '#ef4444' : '#10b981'} />
            <StatBadge label="Critical" value={circles.filter(c => c.severity === 'critical').length} color="#ef4444" />
            <StatBadge label="Mutual" value={circles.filter(c => c.severity === 'warning').length} color="#f59e0b" />
            <StatBadge label="Indirect" value={circles.filter(c => c.severity === 'indirect').length} color="#f97316" />
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
          {/* Concepts list */}
          <div style={{
            width: selectedConcept ? '40%' : '100%',
            borderRight: selectedConcept ? '1px solid rgba(255,255,255,0.06)' : 'none',
            overflow: 'auto', padding: '12px',
          }}>
            {concepts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 16px', color: 'rgba(255,255,255,0.4)' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔄</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>No concepts defined</div>
                <div style={{ fontSize: 12 }}>Add terms and their definitions, then detect circular references</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {concepts.map(concept => {
                  const inCycle = isTermInCycle(concept.term);
                  return (
                    <button key={concept.id}
                      onClick={() => setSelectedConceptId(selectedConceptId === concept.id ? null : concept.id)}
                      style={{
                        padding: '10px 12px', borderRadius: 10, textAlign: 'left', width: '100%',
                        border: selectedConceptId === concept.id
                          ? '1px solid rgba(99,102,241,0.3)'
                          : inCycle
                            ? '1px solid rgba(239,68,68,0.3)'
                            : '1px solid rgba(255,255,255,0.06)',
                        background: selectedConceptId === concept.id
                          ? 'rgba(99,102,241,0.06)'
                          : inCycle
                            ? 'rgba(239,68,68,0.04)'
                            : 'rgba(255,255,255,0.02)',
                        color: '#fff', cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: inCycle ? '#ef4444' : '#a5b4fc' }}>
                          {concept.term}
                        </span>
                        {inCycle && <span style={{ fontSize: 10, color: '#ef4444' }}>⚠ in cycle</span>}
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }}>
                          refs: {concept.referencedTerms.length}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {concept.definition || '(no definition)'}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Circles display */}
            {analysisRun && circles.length > 0 && (
              <div style={{ marginTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', marginBottom: 8 }}>
                  🔴 Detected Circular References ({circles.length})
                </div>
                {circles.map(circle => {
                  const sev = SEVERITY_INFO[circle.severity];
                  return (
                    <div key={circle.id}
                      onClick={() => setHighlightCycle(highlightCycle === circle.terms ? null : circle.terms)}
                      style={{
                        padding: '10px 12px', borderRadius: 10, marginBottom: 6,
                        background: sev.bg, border: `1px solid ${sev.color}20`,
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span>{sev.icon}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: sev.color }}>{sev.label}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{circle.description}</div>
                      <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                        {circle.terms.map((t, i) => (
                          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{
                              fontSize: 11, fontWeight: 600, color: sev.color,
                              background: `${sev.color}15`, padding: '2px 8px',
                              borderRadius: 6, border: `1px solid ${sev.color}25`,
                            }}>{t}</span>
                            {i < circle.terms.length - 1 && <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>→</span>}
                          </span>
                        ))}
                        {circle.terms.length > 1 && (
                          <>
                            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>→</span>
                            <span style={{
                              fontSize: 11, fontWeight: 600, color: sev.color,
                              background: `${sev.color}15`, padding: '2px 8px',
                              borderRadius: 6, border: `1px solid ${sev.color}25`,
                            }}>{circle.terms[0]}</span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {analysisRun && circles.length === 0 && (
              <div style={{
                marginTop: 16, padding: '16px', borderRadius: 10,
                background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)',
                textAlign: 'center',
              }}>
                <span style={{ fontSize: 20 }}>✅</span>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#10b981', marginTop: 4 }}>
                  No circular definitions detected
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                  All {concepts.length} concepts are acyclic
                </div>
              </div>
            )}
          </div>

          {/* Concept detail */}
          {selectedConcept && (
            <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 4, display: 'block' }}>Term</label>
                  <input value={selectedConcept.term}
                    onChange={e => updateConcept(selectedConcept.id, { term: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 15, fontWeight: 600, outline: 'none', boxSizing: 'border-box' }} />
                </div>

                <div>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 4, display: 'block' }}>Definition</label>
                  <textarea value={selectedConcept.definition}
                    onChange={e => updateConcept(selectedConcept.id, { definition: e.target.value })}
                    placeholder="Define this concept..."
                    rows={6} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 13, outline: 'none', resize: 'vertical', lineHeight: 1.7, boxSizing: 'border-box' }} />
                </div>

                {/* Detected references */}
                <div>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 6, display: 'block' }}>
                    Auto-detected References ({selectedConcept.referencedTerms.length})
                  </label>
                  {selectedConcept.referencedTerms.length === 0 ? (
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
                      No references to other defined terms detected
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {selectedConcept.referencedTerms.map((ref, i) => {
                        const inCycle = isTermInCycle(ref);
                        return (
                          <span key={i} style={{
                            padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                            background: inCycle ? 'rgba(239,68,68,0.12)' : 'rgba(99,102,241,0.12)',
                            color: inCycle ? '#fca5a5' : '#a5b4fc',
                            border: inCycle ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(99,102,241,0.2)',
                            cursor: 'pointer',
                          }}
                            onClick={() => {
                              const target = concepts.find(c => normalizeToken(c.term) === normalizeToken(ref));
                              if (target) setSelectedConceptId(target.id);
                            }}
                          >
                            {ref} {inCycle && '⚠️'}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Referenced by */}
                <div>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 6, display: 'block' }}>
                    Referenced By
                  </label>
                  {(() => {
                    const referencedBy = concepts.filter(c =>
                      c.id !== selectedConcept.id &&
                      c.referencedTerms.some(r => normalizeToken(r) === normalizeToken(selectedConcept.term))
                    );
                    if (referencedBy.length === 0) return (
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
                        No other concepts reference this term
                      </div>
                    );
                    return (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {referencedBy.map(c => (
                          <span key={c.id}
                            onClick={() => setSelectedConceptId(c.id)}
                            style={{
                              padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                              background: 'rgba(139,92,246,0.12)', color: '#c4b5fd',
                              border: '1px solid rgba(139,92,246,0.2)', cursor: 'pointer',
                            }}
                          >{c.term}</span>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* Delete */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => removeConcept(selectedConcept.id)} style={{
                    padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    border: '1px solid rgba(239,68,68,0.2)',
                    background: 'rgba(239,68,68,0.08)', color: '#fca5a5', cursor: 'pointer',
                  }}>🗑 Remove Concept</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatBadge({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{label}</span>
      <span style={{
        fontSize: 13, fontWeight: 700, color,
        background: `${color}15`, padding: '2px 8px',
        borderRadius: 6, border: `1px solid ${color}25`,
      }}>{value}</span>
    </div>
  );
}

export default CircularDefinitionDetector;
