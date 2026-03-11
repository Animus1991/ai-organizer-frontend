// src/components/CaseLaboratory.tsx
// Case Laboratory — apply theory to historical events/crises via structured templates
import { useState, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────────────
interface CaseStudy {
  id: string;
  title: string;
  domain: string;
  period: string;
  description: string;
  theoryApplication: string;
  predictions: CasePrediction[];
  observations: CaseObservation[];
  verdict: 'supports' | 'partially_supports' | 'contradicts' | 'inconclusive' | '';
  verdictNotes: string;
  createdAt: number;
}

interface CasePrediction {
  id: string;
  text: string;
  outcome: 'confirmed' | 'refuted' | 'partial' | 'untested';
  evidence: string;
}

interface CaseObservation {
  id: string;
  text: string;
  source: string;
  relevance: 'high' | 'medium' | 'low';
}

interface CaseLaboratoryProps {
  open: boolean;
  onClose: () => void;
}

// ─── Constants ───────────────────────────────────────────────────────
const STORAGE_KEY = 'thinkspace-case-laboratory';

const DOMAINS = [
  'Economics', 'Political Science', 'History', 'Sociology', 'Psychology',
  'International Relations', 'Public Health', 'Technology', 'Environment',
  'Philosophy', 'Law', 'Education', 'Military', 'Culture', 'Other',
];

const VERDICT_INFO: Record<string, { icon: string; label: string; color: string }> = {
  supports:           { icon: '✅', label: 'Supports Theory',           color: '#10b981' },
  partially_supports: { icon: '🟡', label: 'Partially Supports',       color: '#f59e0b' },
  contradicts:        { icon: '❌', label: 'Contradicts Theory',        color: '#ef4444' },
  inconclusive:       { icon: '❓', label: 'Inconclusive',              color: '#6b7280' },
};

const OUTCOME_INFO: Record<string, { icon: string; color: string }> = {
  confirmed: { icon: '✅', color: '#10b981' },
  refuted:   { icon: '❌', color: '#ef4444' },
  partial:   { icon: '🟡', color: '#f59e0b' },
  untested:  { icon: '⬜', color: '#6b7280' },
};

const RELEVANCE_COLORS: Record<string, string> = {
  high: '#10b981', medium: '#f59e0b', low: '#6b7280',
};

const CASE_TEMPLATES: { title: string; domain: string; period: string; description: string }[] = [
  { title: 'Financial Crisis 2008', domain: 'Economics', period: '2007-2009', description: 'Global financial meltdown triggered by subprime mortgage collapse. Test how your theory explains systemic risk propagation.' },
  { title: 'COVID-19 Pandemic Response', domain: 'Public Health', period: '2020-2023', description: 'Global pandemic and varying governmental responses. Analyze through the lens of your theoretical framework.' },
  { title: 'Arab Spring', domain: 'Political Science', period: '2010-2012', description: 'Wave of protests across MENA region. Test theories of collective action, regime stability, and social media influence.' },
  { title: 'Industrial Revolution', domain: 'History', period: '1760-1840', description: 'Transition to industrial processes. Examine economic, social, and technological transformations through your theory.' },
  { title: 'Climate Change Agreements', domain: 'International Relations', period: '1992-present', description: 'From Rio to Paris. Analyze collective action problems in global governance through your framework.' },
  { title: 'Digital Transformation', domain: 'Technology', period: '2000-present', description: 'Societal shift driven by digital technologies. Apply your theory to explain adoption patterns and disruptions.' },
];

function generateId(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

function loadCases(): CaseStudy[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveCases(cases: CaseStudy[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
}

// ─── Component ───────────────────────────────────────────────────────
export function CaseLaboratory({ open, onClose }: CaseLaboratoryProps) {
  const [cases, setCases] = useState<CaseStudy[]>(() => loadCases());
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'predictions' | 'observations' | 'verdict'>('overview');

  const persist = useCallback((updated: CaseStudy[]) => {
    setCases(updated);
    saveCases(updated);
  }, []);

  const selectedCase = cases.find(c => c.id === selectedCaseId) || null;

  const createCase = useCallback((template?: typeof CASE_TEMPLATES[0]) => {
    const newCase: CaseStudy = {
      id: generateId(),
      title: template?.title || 'New Case Study',
      domain: template?.domain || 'Other',
      period: template?.period || '',
      description: template?.description || '',
      theoryApplication: '',
      predictions: [],
      observations: [],
      verdict: '',
      verdictNotes: '',
      createdAt: Date.now(),
    };
    persist([newCase, ...cases]);
    setSelectedCaseId(newCase.id);
    setShowTemplates(false);
    setActiveTab('overview');
  }, [cases, persist]);

  const updateCase = useCallback((id: string, updates: Partial<CaseStudy>) => {
    persist(cases.map(c => c.id === id ? { ...c, ...updates } : c));
  }, [cases, persist]);

  const deleteCase = useCallback((id: string) => {
    persist(cases.filter(c => c.id !== id));
    if (selectedCaseId === id) setSelectedCaseId(null);
  }, [cases, persist, selectedCaseId]);

  const addPrediction = useCallback((caseId: string) => {
    const c = cases.find(cs => cs.id === caseId);
    if (!c) return;
    const pred: CasePrediction = { id: generateId(), text: '', outcome: 'untested', evidence: '' };
    updateCase(caseId, { predictions: [...c.predictions, pred] });
  }, [cases, updateCase]);

  const updatePrediction = useCallback((caseId: string, predId: string, updates: Partial<CasePrediction>) => {
    const c = cases.find(cs => cs.id === caseId);
    if (!c) return;
    updateCase(caseId, {
      predictions: c.predictions.map(p => p.id === predId ? { ...p, ...updates } : p),
    });
  }, [cases, updateCase]);

  const removePrediction = useCallback((caseId: string, predId: string) => {
    const c = cases.find(cs => cs.id === caseId);
    if (!c) return;
    updateCase(caseId, { predictions: c.predictions.filter(p => p.id !== predId) });
  }, [cases, updateCase]);

  const addObservation = useCallback((caseId: string) => {
    const c = cases.find(cs => cs.id === caseId);
    if (!c) return;
    const obs: CaseObservation = { id: generateId(), text: '', source: '', relevance: 'medium' };
    updateCase(caseId, { observations: [...c.observations, obs] });
  }, [cases, updateCase]);

  const updateObservation = useCallback((caseId: string, obsId: string, updates: Partial<CaseObservation>) => {
    const c = cases.find(cs => cs.id === caseId);
    if (!c) return;
    updateCase(caseId, {
      observations: c.observations.map(o => o.id === obsId ? { ...o, ...updates } : o),
    });
  }, [cases, updateCase]);

  const removeObservation = useCallback((caseId: string, obsId: string) => {
    const c = cases.find(cs => cs.id === caseId);
    if (!c) return;
    updateCase(caseId, { observations: c.observations.filter(o => o.id !== obsId) });
  }, [cases, updateCase]);

  // Score summary
  const getScoreSummary = (c: CaseStudy) => {
    const total = c.predictions.length;
    if (total === 0) return null;
    const confirmed = c.predictions.filter(p => p.outcome === 'confirmed').length;
    const refuted = c.predictions.filter(p => p.outcome === 'refuted').length;
    const partial = c.predictions.filter(p => p.outcome === 'partial').length;
    return { total, confirmed, refuted, partial, untested: total - confirmed - refuted - partial };
  };

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
          border: '1px solid rgba(245,158,11,0.2)', borderRadius: 20,
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(234,88,12,0.06))',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
              🧪 Case Laboratory
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
              Apply your theory to historical events & crises — generate predictions and test them
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowTemplates(!showTemplates)} style={{
              padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600,
              border: '1px solid rgba(245,158,11,0.3)',
              background: 'rgba(245,158,11,0.1)', color: '#fcd34d', cursor: 'pointer',
            }}>📋 Templates</button>
            <button onClick={() => createCase()} style={{
              padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600,
              border: '1px solid rgba(16,185,129,0.3)',
              background: 'rgba(16,185,129,0.1)', color: '#6ee7b7', cursor: 'pointer',
            }}>+ New Case</button>
            <button onClick={onClose} style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10, padding: '8px 12px', color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer', fontSize: 18,
            }}>✕</button>
          </div>
        </div>

        {/* Templates panel */}
        {showTemplates && (
          <div style={{
            padding: '12px 24px', borderBottom: '1px solid rgba(255,255,255,0.04)',
            background: 'rgba(245,158,11,0.03)',
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10,
          }}>
            {CASE_TEMPLATES.map((tmpl, idx) => (
              <button key={idx} onClick={() => createCase(tmpl)} style={{
                padding: '12px 14px', borderRadius: 10, textAlign: 'left',
                border: '1px solid rgba(245,158,11,0.15)',
                background: 'rgba(255,255,255,0.02)', color: '#fff', cursor: 'pointer',
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{tmpl.title}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'flex', gap: 8 }}>
                  <span>{tmpl.domain}</span> · <span>{tmpl.period}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
          {/* Cases list */}
          <div style={{
            width: selectedCase ? 280 : '100%', minWidth: selectedCase ? 280 : undefined,
            borderRight: selectedCase ? '1px solid rgba(255,255,255,0.06)' : 'none',
            overflow: 'auto', padding: '12px',
          }}>
            {cases.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 16px', color: 'rgba(255,255,255,0.4)' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🧪</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>No case studies yet</div>
                <div style={{ fontSize: 12 }}>Click "Templates" or "+ New Case" to start</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {cases.map(c => {
                  const score = getScoreSummary(c);
                  return (
                    <button key={c.id}
                      onClick={() => { setSelectedCaseId(selectedCaseId === c.id ? null : c.id); setActiveTab('overview'); }}
                      style={{
                        padding: '10px 12px', borderRadius: 10, textAlign: 'left', width: '100%',
                        border: selectedCaseId === c.id ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.06)',
                        background: selectedCaseId === c.id ? 'rgba(245,158,11,0.06)' : 'rgba(255,255,255,0.02)',
                        color: '#fff', cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{c.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', padding: '1px 6px', borderRadius: 4 }}>{c.domain}</span>
                        {c.period && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{c.period}</span>}
                        {c.verdict && VERDICT_INFO[c.verdict] && (
                          <span style={{ fontSize: 10, color: VERDICT_INFO[c.verdict].color }}>
                            {VERDICT_INFO[c.verdict].icon}
                          </span>
                        )}
                        {score && (
                          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }}>
                            {score.confirmed}/{score.total}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Case detail */}
          {selectedCase && (
            <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
              {/* Tabs */}
              <div style={{
                padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)',
                display: 'flex', gap: 4, background: 'rgba(0,0,0,0.1)',
              }}>
                {(['overview', 'predictions', 'observations', 'verdict'] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)} style={{
                    padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    border: activeTab === tab ? '1px solid rgba(245,158,11,0.3)' : '1px solid transparent',
                    background: activeTab === tab ? 'rgba(245,158,11,0.1)' : 'transparent',
                    color: activeTab === tab ? '#fcd34d' : 'rgba(255,255,255,0.4)',
                    cursor: 'pointer', textTransform: 'capitalize',
                  }}>
                    {tab === 'predictions' ? `Predictions (${selectedCase.predictions.length})`
                      : tab === 'observations' ? `Observations (${selectedCase.observations.length})`
                      : tab}
                  </button>
                ))}
                <button onClick={() => deleteCase(selectedCase.id)} style={{
                  marginLeft: 'auto', padding: '4px 10px', borderRadius: 6,
                  fontSize: 11, fontWeight: 600, border: '1px solid rgba(239,68,68,0.2)',
                  background: 'rgba(239,68,68,0.08)', color: '#fca5a5', cursor: 'pointer',
                }}>🗑</button>
              </div>

              {/* Tab content */}
              <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
                {activeTab === 'overview' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <Field label="Title" value={selectedCase.title}
                      onChange={v => updateCase(selectedCase.id, { title: v })} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 4, display: 'block' }}>Domain</label>
                        <select value={selectedCase.domain}
                          onChange={e => updateCase(selectedCase.id, { domain: e.target.value })}
                          style={{
                            width: '100%', padding: '8px 10px', borderRadius: 8,
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(0,0,0,0.3)', color: '#eaeaea', fontSize: 13,
                            outline: 'none', cursor: 'pointer',
                          }}
                        >
                          {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <Field label="Period" value={selectedCase.period}
                        onChange={v => updateCase(selectedCase.id, { period: v })} />
                    </div>
                    <TextArea label="Case Description" value={selectedCase.description}
                      onChange={v => updateCase(selectedCase.id, { description: v })}
                      placeholder="Describe the historical event or crisis..."
                      rows={4} />
                    <TextArea label="Theory Application — How does your theory explain this case?"
                      value={selectedCase.theoryApplication}
                      onChange={v => updateCase(selectedCase.id, { theoryApplication: v })}
                      placeholder="Explain how your theoretical framework applies to this case..."
                      rows={5} />
                  </div>
                )}

                {activeTab === 'predictions' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
                        What does your theory predict about this case?
                      </div>
                      <button onClick={() => addPrediction(selectedCase.id)} style={{
                        padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                        border: '1px solid rgba(16,185,129,0.3)',
                        background: 'rgba(16,185,129,0.1)', color: '#6ee7b7', cursor: 'pointer',
                      }}>+ Add Prediction</button>
                    </div>
                    {selectedCase.predictions.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                        Add predictions that your theory makes about this case.
                      </div>
                    ) : (
                      selectedCase.predictions.map((pred, idx) => (
                        <div key={pred.id} style={{
                          padding: '12px 14px', borderRadius: 12,
                          border: '1px solid rgba(255,255,255,0.06)',
                          background: 'rgba(255,255,255,0.02)',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>P{idx + 1}</span>
                            {/* Outcome buttons */}
                            {(Object.entries(OUTCOME_INFO) as [string, { icon: string; color: string }][]).map(([k, v]) => (
                              <button key={k} onClick={() => updatePrediction(selectedCase.id, pred.id, { outcome: k as CasePrediction['outcome'] })}
                                style={{
                                  padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                                  border: pred.outcome === k ? `1px solid ${v.color}40` : '1px solid transparent',
                                  background: pred.outcome === k ? `${v.color}15` : 'transparent',
                                  color: pred.outcome === k ? v.color : 'rgba(255,255,255,0.3)',
                                  cursor: 'pointer',
                                }}
                              >{v.icon} {k}</button>
                            ))}
                            <button onClick={() => removePrediction(selectedCase.id, pred.id)}
                              style={{ marginLeft: 'auto', border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', fontSize: 14 }}>✕</button>
                          </div>
                          <input value={pred.text}
                            onChange={e => updatePrediction(selectedCase.id, pred.id, { text: e.target.value })}
                            placeholder="What does your theory predict?"
                            style={{
                              width: '100%', padding: '8px 10px', borderRadius: 8,
                              border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)',
                              color: '#fff', fontSize: 13, outline: 'none', marginBottom: 6,
                              boxSizing: 'border-box',
                            }} />
                          <input value={pred.evidence}
                            onChange={e => updatePrediction(selectedCase.id, pred.id, { evidence: e.target.value })}
                            placeholder="Supporting evidence or outcome..."
                            style={{
                              width: '100%', padding: '6px 10px', borderRadius: 8,
                              border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.15)',
                              color: 'rgba(255,255,255,0.6)', fontSize: 12, outline: 'none',
                              boxSizing: 'border-box',
                            }} />
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'observations' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
                        Key observations from this case
                      </div>
                      <button onClick={() => addObservation(selectedCase.id)} style={{
                        padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                        border: '1px solid rgba(6,182,212,0.3)',
                        background: 'rgba(6,182,212,0.1)', color: '#67e8f9', cursor: 'pointer',
                      }}>+ Add Observation</button>
                    </div>
                    {selectedCase.observations.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                        Add key observations from the historical record.
                      </div>
                    ) : (
                      selectedCase.observations.map((obs, idx) => (
                        <div key={obs.id} style={{
                          padding: '12px 14px', borderRadius: 12,
                          border: '1px solid rgba(255,255,255,0.06)',
                          background: 'rgba(255,255,255,0.02)',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>O{idx + 1}</span>
                            {(['high', 'medium', 'low'] as const).map(r => (
                              <button key={r} onClick={() => updateObservation(selectedCase.id, obs.id, { relevance: r })}
                                style={{
                                  padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                                  border: obs.relevance === r ? `1px solid ${RELEVANCE_COLORS[r]}40` : '1px solid transparent',
                                  background: obs.relevance === r ? `${RELEVANCE_COLORS[r]}15` : 'transparent',
                                  color: obs.relevance === r ? RELEVANCE_COLORS[r] : 'rgba(255,255,255,0.3)',
                                  cursor: 'pointer', textTransform: 'capitalize',
                                }}
                              >{r}</button>
                            ))}
                            <button onClick={() => removeObservation(selectedCase.id, obs.id)}
                              style={{ marginLeft: 'auto', border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', fontSize: 14 }}>✕</button>
                          </div>
                          <input value={obs.text}
                            onChange={e => updateObservation(selectedCase.id, obs.id, { text: e.target.value })}
                            placeholder="What was observed?"
                            style={{
                              width: '100%', padding: '8px 10px', borderRadius: 8,
                              border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)',
                              color: '#fff', fontSize: 13, outline: 'none', marginBottom: 6,
                              boxSizing: 'border-box',
                            }} />
                          <input value={obs.source}
                            onChange={e => updateObservation(selectedCase.id, obs.id, { source: e.target.value })}
                            placeholder="Source (reference, dataset, etc.)"
                            style={{
                              width: '100%', padding: '6px 10px', borderRadius: 8,
                              border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.15)',
                              color: 'rgba(255,255,255,0.6)', fontSize: 12, outline: 'none',
                              boxSizing: 'border-box',
                            }} />
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'verdict' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Score summary */}
                    {(() => {
                      const score = getScoreSummary(selectedCase);
                      if (!score) return <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Add predictions first to see score summary.</div>;
                      return (
                        <div style={{
                          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10,
                        }}>
                          {[
                            { label: 'Confirmed', value: score.confirmed, color: '#10b981' },
                            { label: 'Refuted', value: score.refuted, color: '#ef4444' },
                            { label: 'Partial', value: score.partial, color: '#f59e0b' },
                            { label: 'Untested', value: score.untested, color: '#6b7280' },
                          ].map(s => (
                            <div key={s.label} style={{
                              padding: '12px', borderRadius: 10, textAlign: 'center',
                              background: `${s.color}08`, border: `1px solid ${s.color}20`,
                            }}>
                              <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{s.label}</div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}

                    {/* Verdict selection */}
                    <div>
                      <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 8, display: 'block' }}>Overall Verdict</label>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {Object.entries(VERDICT_INFO).map(([k, v]) => (
                          <button key={k} onClick={() => updateCase(selectedCase.id, { verdict: k as CaseStudy['verdict'] })}
                            style={{
                              padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                              border: selectedCase.verdict === k ? `1px solid ${v.color}40` : '1px solid rgba(255,255,255,0.08)',
                              background: selectedCase.verdict === k ? `${v.color}15` : 'rgba(255,255,255,0.03)',
                              color: selectedCase.verdict === k ? v.color : 'rgba(255,255,255,0.4)',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                            }}
                          >{v.icon} {v.label}</button>
                        ))}
                      </div>
                    </div>

                    <TextArea label="Verdict Notes — Summarize your findings"
                      value={selectedCase.verdictNotes}
                      onChange={v => updateCase(selectedCase.id, { verdictNotes: v })}
                      placeholder="Summarize what this case study reveals about your theory..."
                      rows={6} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Helper sub-components ───────────────────────────────────────────
function Field({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 4, display: 'block' }}>{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{
          width: '100%', padding: '8px 10px', borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)',
          color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box',
        }} />
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <div>
      <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 4, display: 'block' }}>{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        style={{
          width: '100%', padding: '10px 12px', borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)',
          color: '#fff', fontSize: 13, outline: 'none', resize: 'vertical',
          lineHeight: 1.6, boxSizing: 'border-box',
        }} />
    </div>
  );
}

export default CaseLaboratory;
