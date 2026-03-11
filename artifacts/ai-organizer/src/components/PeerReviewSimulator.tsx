/**
 * PeerReviewSimulator Component
 * 
 * Simulates a structured peer review process for scientific manuscripts:
 * - Multi-criteria evaluation (novelty, methodology, clarity, evidence, reproducibility)
 * - Reviewer persona simulation (sympathetic, critical, methodological, domain expert)
 * - Structured feedback generation with severity ratings
 * - Decision recommendation (accept, minor revision, major revision, reject)
 * - Review checklist with progress tracking
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';

// ── Types ──

interface ReviewCriterion {
  id: string;
  name: string;
  description: string;
  score: number; // 0-10
  weight: number; // 0-1
  comments: string;
  icon: string;
}

interface ReviewComment {
  id: string;
  type: 'strength' | 'weakness' | 'suggestion' | 'question' | 'critical';
  text: string;
  section?: string;
  severity: 'minor' | 'major' | 'critical';
  addressed: boolean;
}

type ReviewerPersona = 'balanced' | 'critical' | 'sympathetic' | 'methodological' | 'domain_expert';
type ReviewDecision = 'accept' | 'minor_revision' | 'major_revision' | 'reject' | 'pending';

interface ReviewState {
  persona: ReviewerPersona;
  criteria: ReviewCriterion[];
  comments: ReviewComment[];
  decision: ReviewDecision;
  summary: string;
  checklist: ChecklistItem[];
}

interface ChecklistItem {
  id: string;
  category: string;
  text: string;
  checked: boolean;
}

interface PeerReviewSimulatorProps {
  documentTitle?: string;
  documentText?: string;
  onReviewComplete?: (review: ReviewState) => void;
}

// ── Constants ──

const PERSONAS: Record<ReviewerPersona, { label: string; icon: string; color: string; description: string }> = {
  balanced: { label: 'Balanced', icon: '⚖️', color: '#6366f1', description: 'Fair and thorough evaluation' },
  critical: { label: 'Critical', icon: '🔍', color: '#ef4444', description: 'Focuses on weaknesses and gaps' },
  sympathetic: { label: 'Sympathetic', icon: '💡', color: '#22c55e', description: 'Highlights potential and strengths' },
  methodological: { label: 'Methodological', icon: '🔬', color: '#3b82f6', description: 'Focuses on rigor and methods' },
  domain_expert: { label: 'Domain Expert', icon: '🎓', color: '#f59e0b', description: 'Deep domain knowledge perspective' },
};

const DEFAULT_CRITERIA: ReviewCriterion[] = [
  { id: 'novelty', name: 'Novelty & Originality', description: 'Does this work present new ideas, methods, or findings?', score: 0, weight: 0.2, comments: '', icon: '🌟' },
  { id: 'methodology', name: 'Methodology & Rigor', description: 'Are the methods sound, reproducible, and appropriate?', score: 0, weight: 0.25, comments: '', icon: '🔬' },
  { id: 'clarity', name: 'Clarity & Writing', description: 'Is the text well-organized, clear, and complete?', score: 0, weight: 0.15, comments: '', icon: '📝' },
  { id: 'evidence', name: 'Evidence Quality', description: 'Is the evidence sufficient, relevant, and well-cited?', score: 0, weight: 0.2, comments: '', icon: '📊' },
  { id: 'significance', name: 'Significance & Impact', description: 'Does this work advance the field meaningfully?', score: 0, weight: 0.1, comments: '', icon: '🎯' },
  { id: 'reproducibility', name: 'Reproducibility', description: 'Can the results be independently reproduced?', score: 0, weight: 0.1, comments: '', icon: '🔄' },
];

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: 'c1', category: 'Structure', text: 'Title accurately reflects content', checked: false },
  { id: 'c2', category: 'Structure', text: 'Abstract summarizes key points', checked: false },
  { id: 'c3', category: 'Structure', text: 'Introduction states problem and objectives', checked: false },
  { id: 'c4', category: 'Structure', text: 'Literature review is comprehensive', checked: false },
  { id: 'c5', category: 'Methodology', text: 'Methods are described in detail', checked: false },
  { id: 'c6', category: 'Methodology', text: 'Sample/data selection is justified', checked: false },
  { id: 'c7', category: 'Methodology', text: 'Statistical methods are appropriate', checked: false },
  { id: 'c8', category: 'Evidence', text: 'Results are clearly presented', checked: false },
  { id: 'c9', category: 'Evidence', text: 'Claims are supported by data', checked: false },
  { id: 'c10', category: 'Evidence', text: 'Limitations are acknowledged', checked: false },
  { id: 'c11', category: 'Quality', text: 'No logical fallacies detected', checked: false },
  { id: 'c12', category: 'Quality', text: 'All key terms are defined', checked: false },
  { id: 'c13', category: 'Quality', text: 'Citations are complete and accurate', checked: false },
  { id: 'c14', category: 'Quality', text: 'Conclusions follow from evidence', checked: false },
  { id: 'c15', category: 'Ethics', text: 'Ethical considerations addressed', checked: false },
  { id: 'c16', category: 'Ethics', text: 'No plagiarism concerns', checked: false },
];

const DECISION_INFO: Record<ReviewDecision, { label: string; color: string; icon: string }> = {
  accept: { label: 'Accept', color: '#22c55e', icon: '✅' },
  minor_revision: { label: 'Minor Revision', color: '#f59e0b', icon: '📝' },
  major_revision: { label: 'Major Revision', color: '#f97316', icon: '🔧' },
  reject: { label: 'Reject', color: '#ef4444', icon: '❌' },
  pending: { label: 'Pending', color: '#6b7280', icon: '⏳' },
};

function generateId(): string {
  return `pr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ── Component ──

export const PeerReviewSimulator: React.FC<PeerReviewSimulatorProps> = ({
  documentTitle = 'Untitled Document',
  documentText: _documentText = '',
  onReviewComplete,
}) => {
  const { isDark, colors } = useTheme();
  const [review, setReview] = useState<ReviewState>({
    persona: 'balanced',
    criteria: DEFAULT_CRITERIA.map(c => ({ ...c })),
    comments: [],
    decision: 'pending',
    summary: '',
    checklist: DEFAULT_CHECKLIST.map(c => ({ ...c })),
  });

  const [activeSection, setActiveSection] = useState<'criteria' | 'comments' | 'checklist' | 'decision'>('criteria');
  const [newCommentText, setNewCommentText] = useState('');
  const [newCommentType, setNewCommentType] = useState<ReviewComment['type']>('weakness');
  const [newCommentSeverity, setNewCommentSeverity] = useState<ReviewComment['severity']>('major');

  // ── Computed values ──

  const overallScore = useMemo(() => {
    const totalWeight = review.criteria.reduce((s, c) => s + c.weight, 0);
    if (totalWeight === 0) return 0;
    const weighted = review.criteria.reduce((s, c) => s + (c.score * c.weight), 0);
    return Math.round((weighted / totalWeight) * 10) / 10;
  }, [review.criteria]);

  const checklistProgress = useMemo(() => {
    const total = review.checklist.length;
    const checked = review.checklist.filter(c => c.checked).length;
    return { total, checked, percent: total > 0 ? Math.round((checked / total) * 100) : 0 };
  }, [review.checklist]);

  const commentStats = useMemo(() => {
    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    review.comments.forEach(c => {
      byType[c.type] = (byType[c.type] || 0) + 1;
      bySeverity[c.severity] = (bySeverity[c.severity] || 0) + 1;
    });
    const addressed = review.comments.filter(c => c.addressed).length;
    return { byType, bySeverity, total: review.comments.length, addressed };
  }, [review.comments]);

  const suggestedDecision = useMemo((): ReviewDecision => {
    if (overallScore >= 8) return 'accept';
    if (overallScore >= 6) return 'minor_revision';
    if (overallScore >= 4) return 'major_revision';
    if (overallScore > 0) return 'reject';
    return 'pending';
  }, [overallScore]);

  // ── Handlers ──

  const updateCriterionScore = useCallback((id: string, score: number) => {
    setReview(prev => ({
      ...prev,
      criteria: prev.criteria.map(c => c.id === id ? { ...c, score } : c),
    }));
  }, []);

  const updateCriterionComments = useCallback((id: string, comments: string) => {
    setReview(prev => ({
      ...prev,
      criteria: prev.criteria.map(c => c.id === id ? { ...c, comments } : c),
    }));
  }, []);

  const addComment = useCallback(() => {
    if (!newCommentText.trim()) return;
    const comment: ReviewComment = {
      id: generateId(),
      type: newCommentType,
      text: newCommentText.trim(),
      severity: newCommentSeverity,
      addressed: false,
    };
    setReview(prev => ({ ...prev, comments: [...prev.comments, comment] }));
    setNewCommentText('');
  }, [newCommentText, newCommentType, newCommentSeverity]);

  const toggleCommentAddressed = useCallback((id: string) => {
    setReview(prev => ({
      ...prev,
      comments: prev.comments.map(c => c.id === id ? { ...c, addressed: !c.addressed } : c),
    }));
  }, []);

  const removeComment = useCallback((id: string) => {
    setReview(prev => ({ ...prev, comments: prev.comments.filter(c => c.id !== id) }));
  }, []);

  const toggleChecklist = useCallback((id: string) => {
    setReview(prev => ({
      ...prev,
      checklist: prev.checklist.map(c => c.id === id ? { ...c, checked: !c.checked } : c),
    }));
  }, []);

  const setDecision = useCallback((decision: ReviewDecision) => {
    setReview(prev => ({ ...prev, decision }));
  }, []);

  const setSummary = useCallback((summary: string) => {
    setReview(prev => ({ ...prev, summary }));
  }, []);

  const setPersona = useCallback((persona: ReviewerPersona) => {
    setReview(prev => ({ ...prev, persona }));
  }, []);

  const finalizeReview = useCallback(() => {
    onReviewComplete?.(review);
  }, [review, onReviewComplete]);

  // ── Styles ──
  const COMMENT_TYPE_COLORS: Record<string, string> = {
    strength: '#22c55e',
    weakness: '#ef4444',
    suggestion: '#f59e0b',
    question: '#3b82f6',
    critical: '#dc2626',
  };

  const SEVERITY_COLORS: Record<string, string> = {
    minor: '#6b7280',
    major: '#f59e0b',
    critical: '#ef4444',
  };

  return (
    <div style={{
      background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
      border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
      borderRadius: '16px',
      padding: '24px',
    }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 700, color: colors.textPrimary, display: 'flex', alignItems: 'center', gap: '8px' }}>
              Peer Review Simulator
            </h2>
            <p style={{ margin: 0, fontSize: '12px', color: colors.textMuted }}>
              Reviewing: {documentTitle}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              padding: '6px 14px', borderRadius: '10px',
              background: `${DECISION_INFO[review.decision].color}15`,
              border: `1px solid ${DECISION_INFO[review.decision].color}30`,
              color: DECISION_INFO[review.decision].color,
              fontSize: '13px', fontWeight: 600,
            }}>
              {DECISION_INFO[review.decision].icon} {DECISION_INFO[review.decision].label}
            </div>
            <div style={{
              padding: '6px 14px', borderRadius: '10px',
              background: 'rgba(99,102,241,0.15)',
              color: '#a5b4fc', fontSize: '13px', fontWeight: 700,
            }}>
              {overallScore}/10
            </div>
          </div>
        </div>

        {/* Reviewer Persona */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {(Object.keys(PERSONAS) as ReviewerPersona[]).map(p => (
            <button key={p} onClick={() => setPersona(p)} style={{
              padding: '5px 12px', borderRadius: '8px', border: 'none',
              background: review.persona === p ? `${PERSONAS[p].color}20` : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
              color: review.persona === p ? PERSONAS[p].color : colors.textMuted,
              fontSize: '12px', fontWeight: 500, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '4px',
            }}>
              {PERSONAS[p].icon} {PERSONAS[p].label}
            </button>
          ))}
        </div>

        {/* Section Tabs */}
        <div style={{ display: 'flex', gap: '4px', borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)', paddingBottom: '8px' }}>
          {[
            { key: 'criteria', label: 'Criteria', count: `${overallScore}/10` },
            { key: 'comments', label: 'Comments', count: `${commentStats.total}` },
            { key: 'checklist', label: 'Checklist', count: `${checklistProgress.percent}%` },
            { key: 'decision', label: 'Decision', count: '' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveSection(tab.key as typeof activeSection)} style={{
              padding: '7px 14px', borderRadius: '8px', border: 'none',
              background: activeSection === tab.key ? 'rgba(99,102,241,0.15)' : 'transparent',
              color: activeSection === tab.key ? '#a5b4fc' : colors.textMuted,
              fontSize: '13px', fontWeight: 500, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              {tab.label}
              {tab.count && (
                <span style={{ padding: '1px 6px', borderRadius: '6px', fontSize: '10px', background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', color: colors.textMuted }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── CRITERIA SECTION ── */}
      {activeSection === 'criteria' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {review.criteria.map(criterion => (
            <div key={criterion.id} style={{
              background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
              border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
              borderRadius: '10px', padding: '14px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: colors.textPrimary }}>
                    {criterion.icon} {criterion.name}
                  </span>
                  <span style={{ fontSize: '10px', color: colors.textMuted, marginLeft: '8px' }}>
                    Weight: {Math.round(criterion.weight * 100)}%
                  </span>
                </div>
                <span style={{
                  fontSize: '18px', fontWeight: 700,
                  color: criterion.score >= 7 ? '#22c55e' : criterion.score >= 5 ? '#f59e0b' : criterion.score > 0 ? '#ef4444' : colors.textMuted,
                }}>
                  {criterion.score}/10
                </span>
              </div>
              <p style={{ margin: '0 0 8px', fontSize: '11px', color: colors.textMuted }}>
                {criterion.description}
              </p>
              {/* Score slider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="range" min="0" max="10" step="1"
                  value={criterion.score}
                  onChange={(e) => updateCriterionScore(criterion.id, parseInt(e.target.value))}
                  style={{ flex: 1, accentColor: '#6366f1' }}
                />
                <div style={{ display: 'flex', gap: '2px' }}>
                  {Array.from({ length: 10 }, (_, i) => (
                    <div key={i} style={{
                      width: '8px', height: '8px', borderRadius: '2px',
                      background: i < criterion.score
                        ? (criterion.score >= 7 ? '#22c55e' : criterion.score >= 5 ? '#f59e0b' : '#ef4444')
                        : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                    }} />
                  ))}
                </div>
              </div>
              <textarea
                value={criterion.comments}
                onChange={(e) => updateCriterionComments(criterion.id, e.target.value)}
                placeholder={`Comments on ${criterion.name.toLowerCase()}...`}
                rows={2}
                style={{
                  width: '100%', padding: '8px 10px',
                  background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
                  borderRadius: '6px', color: colors.textPrimary, fontSize: '12px',
                  resize: 'vertical', outline: 'none', fontFamily: 'inherit',
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* ── COMMENTS SECTION ── */}
      {activeSection === 'comments' && (
        <div>
          {/* Add Comment */}
          <div style={{
            background: isDark ? 'rgba(99,102,241,0.05)' : 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.12)',
            borderRadius: '10px', padding: '14px', marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              {(['strength', 'weakness', 'suggestion', 'question', 'critical'] as const).map(type => (
                <button key={type} onClick={() => setNewCommentType(type)} style={{
                  padding: '4px 10px', borderRadius: '6px', border: 'none',
                  background: newCommentType === type ? `${COMMENT_TYPE_COLORS[type]}20` : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
                  color: newCommentType === type ? COMMENT_TYPE_COLORS[type] : colors.textMuted,
                  fontSize: '11px', fontWeight: 500, cursor: 'pointer', textTransform: 'capitalize',
                }}>
                  {type}
                </button>
              ))}
              <span style={{ margin: '0 4px', color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' }}>|</span>
              {(['minor', 'major', 'critical'] as const).map(sev => (
                <button key={sev} onClick={() => setNewCommentSeverity(sev)} style={{
                  padding: '4px 10px', borderRadius: '6px', border: 'none',
                  background: newCommentSeverity === sev ? `${SEVERITY_COLORS[sev]}20` : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
                  color: newCommentSeverity === sev ? SEVERITY_COLORS[sev] : colors.textMuted,
                  fontSize: '11px', fontWeight: 500, cursor: 'pointer', textTransform: 'capitalize',
                }}>
                  {sev}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addComment(); }}
                placeholder="Add reviewer comment..."
                style={{
                  flex: 1, padding: '10px 12px',
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                  borderRadius: '8px', color: colors.textPrimary, fontSize: '13px', outline: 'none',
                }}
              />
              <button onClick={addComment} disabled={!newCommentText.trim()} style={{
                padding: '10px 18px',
                background: newCommentText.trim() ? 'rgba(99,102,241,0.3)' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
                border: 'none', borderRadius: '8px', color: '#a5b4fc',
                fontSize: '13px', fontWeight: 600, cursor: newCommentText.trim() ? 'pointer' : 'not-allowed',
              }}>
                Add
              </button>
            </div>
          </div>

          {/* Comments List */}
          {review.comments.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: colors.textMuted, fontSize: '13px' }}>
              No comments yet. Add feedback above.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {review.comments.map(comment => (
                <div key={comment.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  padding: '10px 14px',
                  background: comment.addressed ? 'rgba(34,197,94,0.04)' : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)'),
                  border: `1px solid ${comment.addressed ? 'rgba(34,197,94,0.12)' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)')}`,
                  borderLeft: `3px solid ${COMMENT_TYPE_COLORS[comment.type]}`,
                  borderRadius: '8px',
                  opacity: comment.addressed ? 0.7 : 1,
                }}>
                  <button onClick={() => toggleCommentAddressed(comment.id)} style={{
                    width: '20px', height: '20px', borderRadius: '4px', flexShrink: 0,
                    background: comment.addressed ? 'rgba(34,197,94,0.2)' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                    border: `1px solid ${comment.addressed ? '#22c55e' : (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)')}`,
                    color: comment.addressed ? '#22c55e' : 'transparent',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px',
                  }}>
                    {comment.addressed ? '✓' : ''}
                  </button>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{
                        padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 600,
                        background: `${COMMENT_TYPE_COLORS[comment.type]}15`,
                        color: COMMENT_TYPE_COLORS[comment.type], textTransform: 'capitalize',
                      }}>
                        {comment.type}
                      </span>
                      <span style={{
                        padding: '2px 6px', borderRadius: '4px', fontSize: '10px',
                        background: `${SEVERITY_COLORS[comment.severity]}15`,
                        color: SEVERITY_COLORS[comment.severity], textTransform: 'capitalize',
                      }}>
                        {comment.severity}
                      </span>
                    </div>
                    <p style={{
                      margin: 0, fontSize: '13px', color: colors.textSecondary, lineHeight: 1.5,
                      textDecoration: comment.addressed ? 'line-through' : 'none',
                    }}>
                      {comment.text}
                    </p>
                  </div>
                  <button onClick={() => removeComment(comment.id)} style={{
                    padding: '4px', background: 'none', border: 'none',
                    color: colors.textMuted, cursor: 'pointer', fontSize: '12px',
                  }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CHECKLIST SECTION ── */}
      {activeSection === 'checklist' && (
        <div>
          {/* Progress */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', color: colors.textSecondary }}>Review Checklist</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: checklistProgress.percent === 100 ? '#22c55e' : '#f59e0b' }}>
                {checklistProgress.checked}/{checklistProgress.total} ({checklistProgress.percent}%)
              </span>
            </div>
            <div style={{ height: '6px', background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                width: `${checklistProgress.percent}%`, height: '100%',
                background: checklistProgress.percent === 100 ? '#22c55e' : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                borderRadius: '3px', transition: 'width 0.3s ease',
              }} />
            </div>
          </div>

          {/* Grouped checklist */}
          {(() => {
            const categories = [...new Set(review.checklist.map(c => c.category))];
            return categories.map(cat => (
              <div key={cat} style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 600, color: colors.textSecondary }}>
                  {cat}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {review.checklist.filter(c => c.category === cat).map(item => (
                    <label key={item.id} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '8px 10px', borderRadius: '6px', cursor: 'pointer',
                      background: item.checked ? 'rgba(34,197,94,0.04)' : 'transparent',
                    }}>
                      <input type="checkbox" checked={item.checked}
                        onChange={() => toggleChecklist(item.id)}
                        style={{ accentColor: '#6366f1' }}
                      />
                      <span style={{
                        fontSize: '13px',
                        color: item.checked ? colors.textMuted : colors.textSecondary,
                        textDecoration: item.checked ? 'line-through' : 'none',
                      }}>
                        {item.text}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ));
          })()}
        </div>
      )}

      {/* ── DECISION SECTION ── */}
      {activeSection === 'decision' && (
        <div>
          {/* Suggested Decision */}
          {suggestedDecision !== 'pending' && (
            <div style={{
              padding: '12px 16px', marginBottom: '16px',
              background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)',
              borderRadius: '10px', fontSize: '13px', color: colors.textSecondary,
            }}>
              Based on scores, suggested decision: <strong style={{ color: DECISION_INFO[suggestedDecision].color }}>
                {DECISION_INFO[suggestedDecision].icon} {DECISION_INFO[suggestedDecision].label}
              </strong> (overall score: {overallScore}/10)
            </div>
          )}

          {/* Decision Buttons */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {(Object.keys(DECISION_INFO) as ReviewDecision[]).filter(d => d !== 'pending').map(d => (
              <button key={d} onClick={() => setDecision(d)} style={{
                padding: '10px 18px', borderRadius: '10px',
                background: review.decision === d ? `${DECISION_INFO[d].color}20` : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
                color: review.decision === d ? DECISION_INFO[d].color : colors.textMuted,
                fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                border: `1px solid ${review.decision === d ? DECISION_INFO[d].color : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')}`,
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                {DECISION_INFO[d].icon} {DECISION_INFO[d].label}
              </button>
            ))}
          </div>

          {/* Summary */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', color: colors.textMuted, display: 'block', marginBottom: '6px', fontWeight: 500 }}>
              Review Summary
            </label>
            <textarea
              value={review.summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Write an overall summary of your review, including main strengths, weaknesses, and recommendations..."
              rows={5}
              style={{
                width: '100%', padding: '12px',
                background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                borderRadius: '10px', color: colors.textPrimary, fontSize: '13px',
                resize: 'vertical', outline: 'none', fontFamily: 'inherit', lineHeight: 1.6,
              }}
            />
          </div>

          {/* Summary Stats */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px',
            padding: '16px', background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', borderRadius: '10px',
            border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)', marginBottom: '16px',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#a5b4fc' }}>{overallScore}</div>
              <div style={{ fontSize: '11px', color: colors.textMuted }}>Overall Score</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#fbbf24' }}>{commentStats.total}</div>
              <div style={{ fontSize: '11px', color: colors.textMuted }}>Comments</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#22c55e' }}>{commentStats.addressed}</div>
              <div style={{ fontSize: '11px', color: colors.textMuted }}>Addressed</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: checklistProgress.percent === 100 ? '#22c55e' : '#f59e0b' }}>
                {checklistProgress.percent}%
              </div>
              <div style={{ fontSize: '11px', color: colors.textMuted }}>Checklist</div>
            </div>
          </div>

          {/* Finalize */}
          <button onClick={finalizeReview} style={{
            width: '100%', padding: '14px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none', borderRadius: '10px', color: 'white',
            fontSize: '15px', fontWeight: 700, cursor: 'pointer',
          }}>
            Finalize Review
          </button>
        </div>
      )}
    </div>
  );
};

export default PeerReviewSimulator;
