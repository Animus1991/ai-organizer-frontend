/**
 * ClaimBuilder Component
 *
 * A structured pipeline for building scientific claims step-by-step:
 * 1. Define the claim statement
 * 2. Classify type & proposition level
 * 3. Specify boundary conditions
 * 4. List assumptions
 * 5. Link evidence
 * 6. Add falsifiability criteria
 * 7. Review & finalize
 */

import { useState, useCallback, useMemo } from 'react';
import {
  type ClaimType,
  type PropositionLevel,
  getClaimTypeLabel,
  getClaimTypeColor,
  getPropositionLevelLabel,
  getPropositionLevelColor,
} from '../hooks/useAIClaimDetection';

// ── Types ──

export interface BuiltClaim {
  id: string;
  statement: string;
  claimType: ClaimType;
  propositionLevel: PropositionLevel;
  boundaryConditions: string[];
  assumptions: string[];
  evidenceLinks: EvidenceLink[];
  falsifiabilityCriteria: string[];
  confidence: number;
  status: 'draft' | 'review' | 'finalized';
  createdAt: string;
  notes: string;
}

interface EvidenceLink {
  id: string;
  description: string;
  grade: 'E0' | 'E1' | 'E2' | 'E3' | 'E4';
  source?: string;
}

interface ClaimBuilderProps {
  onClaimBuilt?: (claim: BuiltClaim) => void;
  existingClaims?: BuiltClaim[];
}

// ── Constants ──

const PIPELINE_STEPS = [
  { key: 'statement', label: 'Statement', icon: '📝' },
  { key: 'classify', label: 'Classify', icon: '🏷️' },
  { key: 'boundaries', label: 'Boundaries', icon: '🛡️' },
  { key: 'assumptions', label: 'Assumptions', icon: '🧠' },
  { key: 'evidence', label: 'Evidence', icon: '📊' },
  { key: 'falsifiability', label: 'Falsifiability', icon: '🔬' },
  { key: 'review', label: 'Review', icon: '✅' },
] as const;


const ALL_CLAIM_TYPES: ClaimType[] = [
  'factual', 'hypothesis', 'definition', 'axiom', 'derivation',
  'prediction', 'open_question', 'counterargument', 'evidence',
  'methodological', 'opinion',
];

const ALL_PROPOSITION_LEVELS: PropositionLevel[] = [
  'philosophical', 'physical', 'psychological', 'economic',
  'methodological_level', 'informational', 'unclassified',
];

const EVIDENCE_GRADES: { value: EvidenceLink['grade']; label: string; color: string }[] = [
  { value: 'E0', label: 'E0 — No evidence', color: '#ef4444' },
  { value: 'E1', label: 'E1 — Internal logic only', color: '#f97316' },
  { value: 'E2', label: 'E2 — Referenced literature', color: '#f59e0b' },
  { value: 'E3', label: 'E3 — Verified data', color: '#22c55e' },
  { value: 'E4', label: 'E4 — Reproducible data', color: '#06b6d4' },
];

function generateId(): string {
  return `cb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ── Component ──

export default function ClaimBuilder({ onClaimBuilt, existingClaims = [] }: ClaimBuilderProps) {
  const [currentStep, setCurrentStep] = useState<number>(0);

  // Claim data
  const [statement, setStatement] = useState('');
  const [claimType, setClaimType] = useState<ClaimType>('hypothesis');
  const [propositionLevel, setPropositionLevel] = useState<PropositionLevel>('unclassified');
  const [boundaryConditions, setBoundaryConditions] = useState<string[]>([]);
  const [newBoundary, setNewBoundary] = useState('');
  const [assumptions, setAssumptions] = useState<string[]>([]);
  const [newAssumption, setNewAssumption] = useState('');
  const [evidenceLinks, setEvidenceLinks] = useState<EvidenceLink[]>([]);
  const [newEvDesc, setNewEvDesc] = useState('');
  const [newEvGrade, setNewEvGrade] = useState<EvidenceLink['grade']>('E1');
  const [newEvSource, setNewEvSource] = useState('');
  const [falsifiabilityCriteria, setFalsifiabilityCriteria] = useState<string[]>([]);
  const [newFalsif, setNewFalsif] = useState('');
  const [confidence, setConfidence] = useState(50);
  const [notes, setNotes] = useState('');

  // Built claims history
  const [builtClaims, setBuiltClaims] = useState<BuiltClaim[]>(existingClaims);
  const [showHistory, setShowHistory] = useState(false);

  const stepKey = PIPELINE_STEPS[currentStep].key;

  const canAdvance = useMemo(() => {
    switch (stepKey) {
      case 'statement': return statement.trim().length >= 10;
      case 'classify': return true;
      case 'boundaries': return true;
      case 'assumptions': return true;
      case 'evidence': return true;
      case 'falsifiability': return true;
      case 'review': return true;
      default: return false;
    }
  }, [stepKey, statement]);

  const completionScore = useMemo(() => {
    let score = 0;
    if (statement.trim().length >= 10) score += 20;
    if (claimType !== 'opinion') score += 10;
    if (propositionLevel !== 'unclassified') score += 10;
    if (boundaryConditions.length > 0) score += 15;
    if (assumptions.length > 0) score += 10;
    if (evidenceLinks.length > 0) score += 20;
    if (falsifiabilityCriteria.length > 0) score += 15;
    return Math.min(100, score);
  }, [statement, claimType, propositionLevel, boundaryConditions, assumptions, evidenceLinks, falsifiabilityCriteria]);

  // ── Handlers ──

  const goNext = useCallback(() => {
    if (currentStep < PIPELINE_STEPS.length - 1) setCurrentStep(s => s + 1);
  }, [currentStep]);

  const goBack = useCallback(() => {
    if (currentStep > 0) setCurrentStep(s => s - 1);
  }, [currentStep]);

  const addBoundary = useCallback(() => {
    if (!newBoundary.trim()) return;
    setBoundaryConditions(prev => [...prev, newBoundary.trim()]);
    setNewBoundary('');
  }, [newBoundary]);

  const removeBoundary = useCallback((idx: number) => {
    setBoundaryConditions(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const addAssumption = useCallback(() => {
    if (!newAssumption.trim()) return;
    setAssumptions(prev => [...prev, newAssumption.trim()]);
    setNewAssumption('');
  }, [newAssumption]);

  const removeAssumption = useCallback((idx: number) => {
    setAssumptions(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const addEvidence = useCallback(() => {
    if (!newEvDesc.trim()) return;
    setEvidenceLinks(prev => [...prev, {
      id: generateId(),
      description: newEvDesc.trim(),
      grade: newEvGrade,
      source: newEvSource.trim() || undefined,
    }]);
    setNewEvDesc('');
    setNewEvSource('');
  }, [newEvDesc, newEvGrade, newEvSource]);

  const removeEvidence = useCallback((id: string) => {
    setEvidenceLinks(prev => prev.filter(e => e.id !== id));
  }, []);

  const addFalsif = useCallback(() => {
    if (!newFalsif.trim()) return;
    setFalsifiabilityCriteria(prev => [...prev, newFalsif.trim()]);
    setNewFalsif('');
  }, [newFalsif]);

  const removeFalsif = useCallback((idx: number) => {
    setFalsifiabilityCriteria(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const finalizeClaim = useCallback(() => {
    const claim: BuiltClaim = {
      id: generateId(),
      statement: statement.trim(),
      claimType,
      propositionLevel,
      boundaryConditions,
      assumptions,
      evidenceLinks,
      falsifiabilityCriteria,
      confidence: confidence / 100,
      status: 'finalized',
      createdAt: new Date().toISOString(),
      notes: notes.trim(),
    };
    setBuiltClaims(prev => [...prev, claim]);
    onClaimBuilt?.(claim);
    // Reset
    setStatement('');
    setClaimType('hypothesis');
    setPropositionLevel('unclassified');
    setBoundaryConditions([]);
    setAssumptions([]);
    setEvidenceLinks([]);
    setFalsifiabilityCriteria([]);
    setConfidence(50);
    setNotes('');
    setCurrentStep(0);
  }, [statement, claimType, propositionLevel, boundaryConditions, assumptions, evidenceLinks, falsifiabilityCriteria, confidence, notes, onClaimBuilt]);

  // ── Shared styles ──

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px', color: '#fafafa', fontSize: '13px', outline: 'none',
  };

  const chipStyle = (color: string): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '5px 10px', borderRadius: '6px', fontSize: '12px',
    background: `${color}15`, color, border: `1px solid ${color}30`,
  });

  const removeBtn: React.CSSProperties = {
    padding: '2px 5px', background: 'rgba(239,68,68,0.15)', border: 'none',
    borderRadius: '4px', color: '#fca5a5', cursor: 'pointer', fontSize: '11px',
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '16px', padding: '24px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 700, color: '#fafafa' }}>
            Claim Builder Pipeline
          </h2>
          <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
            Structured claim construction in {PIPELINE_STEPS.length} steps
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {builtClaims.length > 0 && (
            <button onClick={() => setShowHistory(!showHistory)} style={{
              padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
              background: showHistory ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
              color: showHistory ? '#a5b4fc' : 'rgba(255,255,255,0.5)',
              fontSize: '12px', cursor: 'pointer',
            }}>
              History ({builtClaims.length})
            </button>
          )}
          <div style={{
            padding: '6px 14px', borderRadius: '10px',
            background: completionScore >= 80 ? 'rgba(34,197,94,0.15)' : 'rgba(99,102,241,0.15)',
            color: completionScore >= 80 ? '#86efac' : '#a5b4fc',
            fontSize: '12px', fontWeight: 700,
          }}>
            {completionScore}% complete
          </div>
        </div>
      </div>

      {/* Pipeline Steps Indicator */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
        {PIPELINE_STEPS.map((step, idx) => (
          <button key={step.key} onClick={() => setCurrentStep(idx)} style={{
            flex: 1, minWidth: '80px', padding: '8px 6px', borderRadius: '8px',
            border: idx === currentStep ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.06)',
            background: idx < currentStep ? 'rgba(34,197,94,0.08)'
              : idx === currentStep ? 'rgba(99,102,241,0.12)'
              : 'rgba(255,255,255,0.02)',
            color: idx < currentStep ? '#86efac'
              : idx === currentStep ? '#a5b4fc'
              : 'rgba(255,255,255,0.4)',
            fontSize: '11px', fontWeight: 500, cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
          }}>
            <span style={{ fontSize: '14px' }}>{idx < currentStep ? '✓' : step.icon}</span>
            {step.label}
          </button>
        ))}
      </div>

      {/* History Panel */}
      {showHistory && builtClaims.length > 0 && (
        <div style={{
          marginBottom: '16px', padding: '14px',
          background: 'rgba(255,255,255,0.02)', borderRadius: '10px',
          border: '1px solid rgba(255,255,255,0.06)', maxHeight: '200px', overflowY: 'auto',
        }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
            Built Claims
          </h4>
          {builtClaims.map(c => (
            <div key={c.id} style={{
              padding: '8px 10px', marginBottom: '6px',
              background: 'rgba(255,255,255,0.02)', borderRadius: '6px',
              borderLeft: `3px solid ${getClaimTypeColor(c.claimType)}`,
            }}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '4px' }}>
                <span style={chipStyle(getClaimTypeColor(c.claimType))}>{getClaimTypeLabel(c.claimType)}</span>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                  {new Date(c.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>
                {c.statement.slice(0, 120)}{c.statement.length > 120 ? '…' : ''}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── STEP: Statement ── */}
      {stepKey === 'statement' && (
        <div>
          <h3 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 600, color: '#fafafa' }}>
            📝 Step 1: Define your claim
          </h3>
          <p style={{ margin: '0 0 12px', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
            Write a clear, testable statement. Be specific.
          </p>
          <textarea
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            placeholder="e.g., Increased CO₂ levels directly cause a measurable rise in average global surface temperature within a 10-year window."
            rows={4}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
          />
          <div style={{ marginTop: '8px', fontSize: '11px', color: statement.trim().length >= 10 ? '#22c55e' : 'rgba(255,255,255,0.3)' }}>
            {statement.trim().length} characters {statement.trim().length < 10 ? '(minimum 10)' : '✓'}
          </div>
        </div>
      )}

      {/* ── STEP: Classify ── */}
      {stepKey === 'classify' && (
        <div>
          <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 600, color: '#fafafa' }}>
            🏷️ Step 2: Classify the claim
          </h3>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '8px' }}>
              Claim Type
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {ALL_CLAIM_TYPES.map(ct => (
                <button key={ct} onClick={() => setClaimType(ct)} style={{
                  padding: '6px 12px', borderRadius: '8px',
                  background: claimType === ct ? `${getClaimTypeColor(ct)}20` : 'rgba(255,255,255,0.04)',
                  color: claimType === ct ? getClaimTypeColor(ct) : 'rgba(255,255,255,0.5)',
                  fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                  border: claimType === ct ? `1px solid ${getClaimTypeColor(ct)}40` : '1px solid transparent',
                }}>
                  {getClaimTypeLabel(ct)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '8px' }}>
              Proposition Level
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {ALL_PROPOSITION_LEVELS.map(pl => (
                <button key={pl} onClick={() => setPropositionLevel(pl)} style={{
                  padding: '6px 12px', borderRadius: '8px',
                  background: propositionLevel === pl ? `${getPropositionLevelColor(pl)}20` : 'rgba(255,255,255,0.04)',
                  color: propositionLevel === pl ? getPropositionLevelColor(pl) : 'rgba(255,255,255,0.5)',
                  fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                  border: propositionLevel === pl ? `1px solid ${getPropositionLevelColor(pl)}40` : '1px solid transparent',
                }}>
                  {getPropositionLevelLabel(pl)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── STEP: Boundaries ── */}
      {stepKey === 'boundaries' && (
        <div>
          <h3 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 600, color: '#fafafa' }}>
            🛡️ Step 3: Boundary Conditions
          </h3>
          <p style={{ margin: '0 0 12px', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
            Under what conditions does this claim hold? Specify limits.
          </p>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input type="text" value={newBoundary} onChange={(e) => setNewBoundary(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addBoundary(); }}
              placeholder="e.g., Only valid for temperatures above 0°C"
              style={{ ...inputStyle, flex: 1 }} />
            <button onClick={addBoundary} disabled={!newBoundary.trim()} style={{
              padding: '10px 18px', background: newBoundary.trim() ? 'rgba(6,182,212,0.2)' : 'rgba(255,255,255,0.05)',
              border: 'none', borderRadius: '8px', color: '#67e8f9', fontSize: '13px', fontWeight: 600,
              cursor: newBoundary.trim() ? 'pointer' : 'not-allowed',
            }}>Add</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {boundaryConditions.map((bc, idx) => (
              <div key={idx} style={{ ...chipStyle('#06b6d4'), justifyContent: 'space-between' }}>
                <span>{bc}</span>
                <button onClick={() => removeBoundary(idx)} style={removeBtn}>✕</button>
              </div>
            ))}
            {boundaryConditions.length === 0 && (
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
                No boundary conditions added yet. Consider temporal, spatial, or parameter limits.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── STEP: Assumptions ── */}
      {stepKey === 'assumptions' && (
        <div>
          <h3 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 600, color: '#fafafa' }}>
            🧠 Step 4: Assumptions
          </h3>
          <p style={{ margin: '0 0 12px', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
            What underlying assumptions does this claim rely on?
          </p>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input type="text" value={newAssumption} onChange={(e) => setNewAssumption(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addAssumption(); }}
              placeholder="e.g., We assume a closed thermodynamic system"
              style={{ ...inputStyle, flex: 1 }} />
            <button onClick={addAssumption} disabled={!newAssumption.trim()} style={{
              padding: '10px 18px', background: newAssumption.trim() ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.05)',
              border: 'none', borderRadius: '8px', color: '#c4b5fd', fontSize: '13px', fontWeight: 600,
              cursor: newAssumption.trim() ? 'pointer' : 'not-allowed',
            }}>Add</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {assumptions.map((a, idx) => (
              <div key={idx} style={{ ...chipStyle('#8b5cf6'), justifyContent: 'space-between' }}>
                <span>{a}</span>
                <button onClick={() => removeAssumption(idx)} style={removeBtn}>✕</button>
              </div>
            ))}
            {assumptions.length === 0 && (
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
                No assumptions added yet. Explicitly stating assumptions strengthens your claim.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── STEP: Evidence ── */}
      {stepKey === 'evidence' && (
        <div>
          <h3 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 600, color: '#fafafa' }}>
            📊 Step 5: Link Evidence
          </h3>
          <p style={{ margin: '0 0 12px', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
            What evidence supports this claim? Rate its quality.
          </p>
          <div style={{
            padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.06)', marginBottom: '14px',
          }}>
            <input type="text" value={newEvDesc} onChange={(e) => setNewEvDesc(e.target.value)}
              placeholder="Evidence description..." style={{ ...inputStyle, marginBottom: '8px' }} />
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <select value={newEvGrade} onChange={(e) => setNewEvGrade(e.target.value as EvidenceLink['grade'])}
                style={{ ...inputStyle, width: 'auto', minWidth: '180px', cursor: 'pointer' }}>
                {EVIDENCE_GRADES.map(g => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
              <input type="text" value={newEvSource} onChange={(e) => setNewEvSource(e.target.value)}
                placeholder="Source (optional)" style={{ ...inputStyle, flex: 1 }} />
              <button onClick={addEvidence} disabled={!newEvDesc.trim()} style={{
                padding: '10px 18px', background: newEvDesc.trim() ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)',
                border: 'none', borderRadius: '8px', color: '#86efac', fontSize: '13px', fontWeight: 600,
                cursor: newEvDesc.trim() ? 'pointer' : 'not-allowed',
              }}>Add</button>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {evidenceLinks.map(ev => {
              const gradeInfo = EVIDENCE_GRADES.find(g => g.value === ev.grade)!;
              return (
                <div key={ev.id} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '8px 12px', background: 'rgba(255,255,255,0.02)',
                  borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700,
                    background: `${gradeInfo.color}20`, color: gradeInfo.color,
                  }}>{ev.grade}</span>
                  <span style={{ flex: 1, fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>{ev.description}</span>
                  {ev.source && <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>{ev.source}</span>}
                  <button onClick={() => removeEvidence(ev.id)} style={removeBtn}>✕</button>
                </div>
              );
            })}
            {evidenceLinks.length === 0 && (
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
                No evidence linked yet. Claims without evidence weaken your argument.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── STEP: Falsifiability ── */}
      {stepKey === 'falsifiability' && (
        <div>
          <h3 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 600, color: '#fafafa' }}>
            🔬 Step 6: Falsifiability Criteria
          </h3>
          <p style={{ margin: '0 0 12px', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
            How could this claim be disproven? What would count as counter-evidence?
          </p>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input type="text" value={newFalsif} onChange={(e) => setNewFalsif(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addFalsif(); }}
              placeholder="e.g., If global temperatures decrease while CO₂ rises over 10 years"
              style={{ ...inputStyle, flex: 1 }} />
            <button onClick={addFalsif} disabled={!newFalsif.trim()} style={{
              padding: '10px 18px', background: newFalsif.trim() ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)',
              border: 'none', borderRadius: '8px', color: '#fca5a5', fontSize: '13px', fontWeight: 600,
              cursor: newFalsif.trim() ? 'pointer' : 'not-allowed',
            }}>Add</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {falsifiabilityCriteria.map((fc, idx) => (
              <div key={idx} style={{ ...chipStyle('#ef4444'), justifyContent: 'space-between' }}>
                <span>{fc}</span>
                <button onClick={() => removeFalsif(idx)} style={removeBtn}>✕</button>
              </div>
            ))}
            {falsifiabilityCriteria.length === 0 && (
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
                No falsifiability criteria added. A claim that cannot be falsified is not scientifically testable.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── STEP: Review ── */}
      {stepKey === 'review' && (
        <div>
          <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 600, color: '#fafafa' }}>
            ✅ Step 7: Review & Finalize
          </h3>

          {/* Claim summary card */}
          <div style={{
            padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.08)', marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span style={chipStyle(getClaimTypeColor(claimType))}>{getClaimTypeLabel(claimType)}</span>
              {propositionLevel !== 'unclassified' && (
                <span style={chipStyle(getPropositionLevelColor(propositionLevel))}>
                  {getPropositionLevelLabel(propositionLevel)}
                </span>
              )}
            </div>
            <p style={{ margin: '0 0 12px', fontSize: '14px', color: '#fafafa', lineHeight: 1.6, fontWeight: 500 }}>
              "{statement}"
            </p>

            {/* Summary grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>
                  Boundary Conditions ({boundaryConditions.length})
                </div>
                {boundaryConditions.length > 0 ? boundaryConditions.map((bc, i) => (
                  <div key={i} style={{ fontSize: '12px', color: '#67e8f9', marginBottom: '2px' }}>• {bc}</div>
                )) : <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>None specified</div>}
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>
                  Assumptions ({assumptions.length})
                </div>
                {assumptions.length > 0 ? assumptions.map((a, i) => (
                  <div key={i} style={{ fontSize: '12px', color: '#c4b5fd', marginBottom: '2px' }}>• {a}</div>
                )) : <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>None specified</div>}
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>
                  Evidence ({evidenceLinks.length})
                </div>
                {evidenceLinks.length > 0 ? evidenceLinks.map(ev => (
                  <div key={ev.id} style={{ fontSize: '12px', color: '#86efac', marginBottom: '2px' }}>
                    [{ev.grade}] {ev.description}
                  </div>
                )) : <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>None linked</div>}
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>
                  Falsifiability ({falsifiabilityCriteria.length})
                </div>
                {falsifiabilityCriteria.length > 0 ? falsifiabilityCriteria.map((fc, i) => (
                  <div key={i} style={{ fontSize: '12px', color: '#fca5a5', marginBottom: '2px' }}>• {fc}</div>
                )) : <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>None specified</div>}
              </div>
            </div>
          </div>

          {/* Confidence slider */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '6px' }}>
              Confidence: {confidence}%
            </label>
            <input type="range" min="0" max="100" value={confidence}
              onChange={(e) => setConfidence(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: '#6366f1' }} />
          </div>

          {/* Notes */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '6px' }}>
              Additional Notes
            </label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional context, caveats, or links..."
              rows={2} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
          </div>

          {/* Completeness warnings */}
          {completionScore < 80 && (
            <div style={{
              padding: '10px 14px', marginBottom: '14px', borderRadius: '8px',
              background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
              fontSize: '12px', color: '#fbbf24',
            }}>
              Completeness: {completionScore}%. Consider adding:
              {boundaryConditions.length === 0 && ' boundary conditions,'}
              {assumptions.length === 0 && ' assumptions,'}
              {evidenceLinks.length === 0 && ' evidence,'}
              {falsifiabilityCriteria.length === 0 && ' falsifiability criteria'}
            </div>
          )}

          <button onClick={finalizeClaim} disabled={!statement.trim()} style={{
            width: '100%', padding: '14px',
            background: statement.trim() ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.08)',
            border: 'none', borderRadius: '10px', color: 'white',
            fontSize: '15px', fontWeight: 700,
            cursor: statement.trim() ? 'pointer' : 'not-allowed',
          }}>
            Finalize Claim
          </button>
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={goBack} disabled={currentStep === 0} style={{
          padding: '8px 18px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.04)',
          color: currentStep === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)',
          fontSize: '13px', cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
        }}>
          ← Back
        </button>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', alignSelf: 'center' }}>
          Step {currentStep + 1} of {PIPELINE_STEPS.length}
        </span>
        {currentStep < PIPELINE_STEPS.length - 1 && (
          <button onClick={goNext} disabled={!canAdvance} style={{
            padding: '8px 18px', borderRadius: '8px', border: 'none',
            background: canAdvance ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)',
            color: canAdvance ? '#a5b4fc' : 'rgba(255,255,255,0.3)',
            fontSize: '13px', fontWeight: 600,
            cursor: canAdvance ? 'pointer' : 'not-allowed',
          }}>
            Next →
          </button>
        )}
      </div>
    </div>
  );
}
