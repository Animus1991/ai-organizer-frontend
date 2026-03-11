/**
 * OntologyManager Component
 * 
 * Full glossary/ontology manager for scientific knowledge management:
 * - Term definitions with formal notation
 * - Symbols and units tracking
 * - Relationships between concepts (is-a, part-of, causes, contradicts, etc.)
 * - Auto-detect term meaning changes across documents
 * - Export glossary as structured data
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';

// ── Types ──

export interface OntologyTerm {
  id: string;
  term: string;
  definition: string;
  symbol?: string;
  unit?: string;
  domain: string;
  aliases: string[];
  relationships: OntologyRelationship[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface OntologyRelationship {
  type: RelationshipType;
  targetTermId: string;
  targetTermName: string;
  description?: string;
}

export type RelationshipType =
  | 'is-a' | 'part-of' | 'has-part' | 'causes' | 'caused-by'
  | 'contradicts' | 'refines' | 'generalizes' | 'depends-on'
  | 'synonym-of' | 'antonym-of' | 'instance-of' | 'related-to';

const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  'is-a': 'Is a',
  'part-of': 'Part of',
  'has-part': 'Has part',
  'causes': 'Causes',
  'caused-by': 'Caused by',
  'contradicts': 'Contradicts',
  'refines': 'Refines',
  'generalizes': 'Generalizes',
  'depends-on': 'Depends on',
  'synonym-of': 'Synonym of',
  'antonym-of': 'Antonym of',
  'instance-of': 'Instance of',
  'related-to': 'Related to',
};

const RELATIONSHIP_COLORS: Record<RelationshipType, string> = {
  'is-a': '#6366f1',
  'part-of': '#8b5cf6',
  'has-part': '#a78bfa',
  'causes': '#f59e0b',
  'caused-by': '#fbbf24',
  'contradicts': '#ef4444',
  'refines': '#06b6d4',
  'generalizes': '#14b8a6',
  'depends-on': '#f97316',
  'synonym-of': '#22c55e',
  'antonym-of': '#e11d48',
  'instance-of': '#3b82f6',
  'related-to': '#6b7280',
};

const DOMAINS = [
  'General', 'Physics', 'Mathematics', 'Biology', 'Psychology',
  'Economics', 'Philosophy', 'Computer Science', 'Sociology',
  'Methodology', 'Statistics', 'Custom',
];

interface OntologyManagerProps {
  open: boolean;
  onClose: () => void;
  initialTerms?: OntologyTerm[];
  onTermsChange?: (terms: OntologyTerm[]) => void;
}

const STORAGE_KEY = 'thinkspace-ontology-terms';

function generateId(): string {
  return `ont-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export default function OntologyManager({ open, onClose, initialTerms, onTermsChange }: OntologyManagerProps) {
  const [terms, setTerms] = useState<OntologyTerm[]>(() => {
    if (initialTerms && initialTerms.length > 0) return initialTerms;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [activeTab, setActiveTab] = useState<'glossary' | 'add' | 'relationships' | 'export'>('glossary');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('All');
  const [expandedTermId, setExpandedTermId] = useState<string | null>(null);

  // New term form
  const [newTerm, setNewTerm] = useState('');
  const [newDefinition, setNewDefinition] = useState('');
  const [newSymbol, setNewSymbol] = useState('');
  const [newUnit, setNewUnit] = useState('');
  const [newDomain, setNewDomain] = useState('General');
  const [newAliases, setNewAliases] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Relationship form
  const [relSourceId, setRelSourceId] = useState('');
  const [relTargetId, setRelTargetId] = useState('');
  const [relType, setRelType] = useState<RelationshipType>('related-to');
  const [relDescription, setRelDescription] = useState('');

  const saveTerms = useCallback((updated: OntologyTerm[]) => {
    setTerms(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    onTermsChange?.(updated);
  }, [onTermsChange]);

  const filteredTerms = useMemo(() => {
    let result = terms;
    if (selectedDomain !== 'All') {
      result = result.filter(t => t.domain === selectedDomain);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.term.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q) ||
        t.aliases.some(a => a.toLowerCase().includes(q)) ||
        (t.symbol && t.symbol.toLowerCase().includes(q))
      );
    }
    return result.sort((a, b) => a.term.localeCompare(b.term));
  }, [terms, searchQuery, selectedDomain]);

  const domainCounts = useMemo(() => {
    const counts: Record<string, number> = { All: terms.length };
    terms.forEach(t => {
      counts[t.domain] = (counts[t.domain] || 0) + 1;
    });
    return counts;
  }, [terms]);

  const handleAddTerm = useCallback(() => {
    if (!newTerm.trim() || !newDefinition.trim()) return;

    const duplicate = terms.find(t => t.term.toLowerCase() === newTerm.trim().toLowerCase());
    if (duplicate) {
      alert(`Term "${newTerm}" already exists in the glossary.`);
      return;
    }

    const term: OntologyTerm = {
      id: generateId(),
      term: newTerm.trim(),
      definition: newDefinition.trim(),
      symbol: newSymbol.trim() || undefined,
      unit: newUnit.trim() || undefined,
      domain: newDomain,
      aliases: newAliases.split(',').map(a => a.trim()).filter(Boolean),
      relationships: [],
      notes: newNotes.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveTerms([...terms, term]);
    setNewTerm('');
    setNewDefinition('');
    setNewSymbol('');
    setNewUnit('');
    setNewDomain('General');
    setNewAliases('');
    setNewNotes('');
    setActiveTab('glossary');
  }, [newTerm, newDefinition, newSymbol, newUnit, newDomain, newAliases, newNotes, terms, saveTerms]);

  const handleDeleteTerm = useCallback((id: string) => {
    if (!confirm('Delete this term from the ontology?')) return;
    const updated = terms.filter(t => t.id !== id).map(t => ({
      ...t,
      relationships: t.relationships.filter(r => r.targetTermId !== id),
    }));
    saveTerms(updated);
  }, [terms, saveTerms]);

  const handleAddRelationship = useCallback(() => {
    if (!relSourceId || !relTargetId || relSourceId === relTargetId) return;

    const source = terms.find(t => t.id === relSourceId);
    const target = terms.find(t => t.id === relTargetId);
    if (!source || !target) return;

    const alreadyExists = source.relationships.some(
      r => r.targetTermId === relTargetId && r.type === relType
    );
    if (alreadyExists) {
      alert('This relationship already exists.');
      return;
    }

    const newRel: OntologyRelationship = {
      type: relType,
      targetTermId: relTargetId,
      targetTermName: target.term,
      description: relDescription.trim() || undefined,
    };

    const updated = terms.map(t =>
      t.id === relSourceId
        ? { ...t, relationships: [...t.relationships, newRel], updatedAt: new Date().toISOString() }
        : t
    );
    saveTerms(updated);
    setRelDescription('');
  }, [relSourceId, relTargetId, relType, relDescription, terms, saveTerms]);

  const handleRemoveRelationship = useCallback((termId: string, targetId: string, type: RelationshipType) => {
    const updated = terms.map(t =>
      t.id === termId
        ? { ...t, relationships: t.relationships.filter(r => !(r.targetTermId === targetId && r.type === type)) }
        : t
    );
    saveTerms(updated);
  }, [terms, saveTerms]);

  const handleExportGlossary = useCallback(() => {
    const exportData = {
      exportDate: new Date().toISOString(),
      totalTerms: terms.length,
      terms: terms.map(t => ({
        term: t.term,
        definition: t.definition,
        symbol: t.symbol,
        unit: t.unit,
        domain: t.domain,
        aliases: t.aliases,
        relationships: t.relationships.map(r => ({
          type: r.type,
          target: r.targetTermName,
          description: r.description,
        })),
        notes: t.notes,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ontology-glossary-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [terms]);

  const handleExportLatex = useCallback(() => {
    let latex = '\\section{Glossary}\n\\begin{description}\n';
    terms.sort((a, b) => a.term.localeCompare(b.term)).forEach(t => {
      latex += `  \\item[${t.term}]`;
      if (t.symbol) latex += ` (\\(${t.symbol}\\))`;
      latex += ` ${t.definition}`;
      if (t.unit) latex += ` [${t.unit}]`;
      latex += '\n';
    });
    latex += '\\end{description}\n';

    const blob = new Blob([latex], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `glossary-${new Date().toISOString().slice(0, 10)}.tex`;
    a.click();
    URL.revokeObjectURL(url);
  }, [terms]);

  if (!open) return null;

  const { colors, isDark } = useTheme();

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px',
    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
    borderRadius: '8px', color: colors.textPrimary, fontSize: '13px', outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '12px', color: colors.textMuted,
    display: 'block', marginBottom: '4px', fontWeight: 500,
  };

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
        zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: '95%', maxWidth: 1000, maxHeight: '92vh',
          background: isDark ? 'linear-gradient(135deg, rgba(20,20,30,0.97), rgba(15,15,25,0.97))' : '#ffffff',
          border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', borderRadius: '20px',
          boxShadow: isDark ? '0 12px 48px rgba(0,0,0,0.5)' : '0 12px 48px rgba(0,0,0,0.15)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: colors.textPrimary, display: 'flex', alignItems: 'center', gap: '8px' }}>
              📖 Ontology & Glossary Manager
              <span style={{ fontSize: '12px', background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', padding: '3px 10px', borderRadius: '99px' }}>
                {terms.length} terms
              </span>
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: colors.textMuted }}>
              Definitions, symbols, units, and concept relationships
            </p>
          </div>
          <button onClick={onClose} style={{
            padding: '8px', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
            borderRadius: '8px', color: colors.textPrimary, cursor: 'pointer', fontSize: '16px',
          }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', padding: '12px 24px', borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)' }}>
          {[
            { key: 'glossary', label: 'Glossary', icon: '📚' },
            { key: 'add', label: 'Add Term', icon: '➕' },
            { key: 'relationships', label: 'Relationships', icon: '🔗' },
            { key: 'export', label: 'Export', icon: '📤' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              style={{
                padding: '8px 16px', borderRadius: '8px', border: 'none',
                background: activeTab === tab.key ? 'rgba(99,102,241,0.2)' : 'transparent',
                color: activeTab === tab.key ? '#a5b4fc' : colors.textMuted,
                fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* ── GLOSSARY TAB ── */}
          {activeTab === 'glossary' && (
            <div>
              {/* Search & Filter */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search terms, definitions, symbols..."
                  style={{ ...inputStyle, flex: 1, minWidth: '200px' }}
                />
                <select
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  style={{ ...inputStyle, width: 'auto', minWidth: '130px', cursor: 'pointer' }}
                >
                  <option value="All">All Domains ({domainCounts['All'] || 0})</option>
                  {DOMAINS.map(d => domainCounts[d] ? (
                    <option key={d} value={d}>{d} ({domainCounts[d]})</option>
                  ) : null)}
                </select>
              </div>

              {/* Terms List */}
              {filteredTerms.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: colors.textMuted }}>
                  {terms.length === 0
                    ? 'No terms yet. Click "Add Term" to create your first glossary entry.'
                    : 'No terms match your search.'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {filteredTerms.map(term => (
                    <div key={term.id} style={{
                      background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                      border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
                      borderRadius: '12px', padding: '14px 16px',
                      borderLeft: '3px solid #6366f1',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '15px', fontWeight: 700, color: colors.textPrimary }}>{term.term}</span>
                            {term.symbol && (
                              <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '12px', background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', fontFamily: 'monospace' }}>
                                {term.symbol}
                              </span>
                            )}
                            {term.unit && (
                              <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '11px', background: 'rgba(245,158,11,0.12)', color: '#fbbf24' }}>
                                [{term.unit}]
                              </span>
                            )}
                            <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '10px', background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', color: colors.textMuted }}>
                              {term.domain}
                            </span>
                          </div>
                          <p style={{ margin: '0 0 6px', fontSize: '13px', color: colors.textSecondary, lineHeight: 1.5 }}>
                            {term.definition}
                          </p>
                          {term.aliases.length > 0 && (
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '4px' }}>
                              <span style={{ fontSize: '11px', color: colors.textMuted }}>Also: </span>
                              {term.aliases.map((alias, i) => (
                                <span key={i} style={{ fontSize: '11px', color: '#a5b4fc', fontStyle: 'italic' }}>{alias}{i < term.aliases.length - 1 ? ', ' : ''}</span>
                              ))}
                            </div>
                          )}
                          {term.relationships.length > 0 && (
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                              {term.relationships.map((rel, i) => (
                                <span key={i} style={{
                                  padding: '2px 8px', borderRadius: '6px', fontSize: '10px',
                                  background: `${RELATIONSHIP_COLORS[rel.type]}15`,
                                  color: RELATIONSHIP_COLORS[rel.type],
                                  border: `1px solid ${RELATIONSHIP_COLORS[rel.type]}30`,
                                }}>
                                  {RELATIONSHIP_LABELS[rel.type]} → {rel.targetTermName}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button onClick={() => setExpandedTermId(expandedTermId === term.id ? null : term.id)}
                            style={{ padding: '6px 8px', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', border: 'none', borderRadius: '6px', color: colors.textSecondary, cursor: 'pointer', fontSize: '11px' }}>
                            {expandedTermId === term.id ? '▼' : '▶'}
                          </button>
                          <button onClick={() => handleDeleteTerm(term.id)}
                            style={{ padding: '6px 8px', background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '6px', color: '#fca5a5', cursor: 'pointer', fontSize: '11px' }}>
                            ✕
                          </button>
                        </div>
                      </div>

                      {expandedTermId === term.id && (
                        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)' }}>
                          {term.notes && (
                            <div style={{ marginBottom: '8px' }}>
                              <span style={{ fontSize: '11px', color: colors.textMuted }}>Notes: </span>
                              <span style={{ fontSize: '12px', color: colors.textSecondary }}>{term.notes}</span>
                            </div>
                          )}
                          <div style={{ fontSize: '10px', color: colors.textMuted }}>
                            Created: {new Date(term.createdAt).toLocaleDateString()} · Updated: {new Date(term.updatedAt).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── ADD TERM TAB ── */}
          {activeTab === 'add' && (
            <div style={{ maxWidth: '600px' }}>
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Term *</label>
                <input type="text" value={newTerm} onChange={(e) => setNewTerm(e.target.value)}
                  placeholder="e.g., Entropy" style={inputStyle} />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Definition *</label>
                <textarea value={newDefinition} onChange={(e) => setNewDefinition(e.target.value)}
                  placeholder="A formal, precise definition of this term..."
                  rows={3} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={labelStyle}>Symbol (optional)</label>
                  <input type="text" value={newSymbol} onChange={(e) => setNewSymbol(e.target.value)}
                    placeholder="e.g., S, ΔG, σ" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Unit (optional)</label>
                  <input type="text" value={newUnit} onChange={(e) => setNewUnit(e.target.value)}
                    placeholder="e.g., J/K, m/s²" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Domain</label>
                  <select value={newDomain} onChange={(e) => setNewDomain(e.target.value)}
                    style={{ ...inputStyle, cursor: 'pointer' }}>
                    {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Aliases (comma-separated)</label>
                <input type="text" value={newAliases} onChange={(e) => setNewAliases(e.target.value)}
                  placeholder="e.g., thermodynamic entropy, S_therm" style={inputStyle} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Notes</label>
                <textarea value={newNotes} onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Additional context, usage notes, or references..."
                  rows={2} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
              <button
                onClick={handleAddTerm}
                disabled={!newTerm.trim() || !newDefinition.trim()}
                style={{
                  padding: '12px 24px',
                  background: (!newTerm.trim() || !newDefinition.trim()) ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)') : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  border: 'none', borderRadius: '10px', color: 'white',
                  fontSize: '14px', fontWeight: 600, cursor: (!newTerm.trim() || !newDefinition.trim()) ? 'not-allowed' : 'pointer',
                  opacity: (!newTerm.trim() || !newDefinition.trim()) ? 0.5 : 1,
                }}
              >
                Add to Glossary
              </button>
            </div>
          )}

          {/* ── RELATIONSHIPS TAB ── */}
          {activeTab === 'relationships' && (
            <div>
              <div style={{
                background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)',
                borderRadius: '12px', padding: '16px', marginBottom: '20px',
              }}>
                <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600, color: colors.textPrimary }}>Add Relationship</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '10px', alignItems: 'end', marginBottom: '10px' }}>
                  <div>
                    <label style={labelStyle}>Source Term</label>
                    <select value={relSourceId} onChange={(e) => setRelSourceId(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                      <option value="">Select...</option>
                      {terms.map(t => <option key={t.id} value={t.id}>{t.term}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Relationship</label>
                    <select value={relType} onChange={(e) => setRelType(e.target.value as RelationshipType)} style={{ ...inputStyle, cursor: 'pointer' }}>
                      {(Object.keys(RELATIONSHIP_LABELS) as RelationshipType[]).map(rt => (
                        <option key={rt} value={rt}>{RELATIONSHIP_LABELS[rt]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Target Term</label>
                    <select value={relTargetId} onChange={(e) => setRelTargetId(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                      <option value="">Select...</option>
                      {terms.filter(t => t.id !== relSourceId).map(t => <option key={t.id} value={t.id}>{t.term}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="text" value={relDescription} onChange={(e) => setRelDescription(e.target.value)}
                    placeholder="Optional description..." style={{ ...inputStyle, flex: 1 }} />
                  <button onClick={handleAddRelationship}
                    disabled={!relSourceId || !relTargetId}
                    style={{
                      padding: '10px 20px', background: (!relSourceId || !relTargetId) ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)') : 'rgba(99,102,241,0.3)',
                      border: '1px solid rgba(99,102,241,0.4)', borderRadius: '8px',
                      color: '#a5b4fc', fontSize: '13px', fontWeight: 600,
                      cursor: (!relSourceId || !relTargetId) ? 'not-allowed' : 'pointer',
                    }}>
                    Add Link
                  </button>
                </div>
              </div>

              {/* Existing relationships */}
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: colors.textPrimary, marginBottom: '12px' }}>
                All Relationships ({terms.reduce((s, t) => s + t.relationships.length, 0)})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {terms.filter(t => t.relationships.length > 0).map(term => (
                  term.relationships.map((rel, i) => (
                    <div key={`${term.id}-${i}`} style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '8px 12px', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                      borderRadius: '8px', border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
                    }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: colors.textPrimary, minWidth: '100px' }}>{term.term}</span>
                      <span style={{
                        padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 600,
                        background: `${RELATIONSHIP_COLORS[rel.type]}20`,
                        color: RELATIONSHIP_COLORS[rel.type],
                      }}>
                        {RELATIONSHIP_LABELS[rel.type]}
                      </span>
                      <span style={{ fontSize: '12px', color: colors.textMuted }}>→</span>
                      <span style={{ fontSize: '13px', color: '#a5b4fc' }}>{rel.targetTermName}</span>
                      {rel.description && (
                        <span style={{ fontSize: '11px', color: colors.textMuted, fontStyle: 'italic', marginLeft: '4px' }}>
                          ({rel.description})
                        </span>
                      )}
                      <button onClick={() => handleRemoveRelationship(term.id, rel.targetTermId, rel.type)}
                        style={{ marginLeft: 'auto', padding: '4px 6px', background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '4px', color: '#fca5a5', cursor: 'pointer', fontSize: '10px' }}>
                        ✕
                      </button>
                    </div>
                  ))
                ))}
                {terms.every(t => t.relationships.length === 0) && (
                  <div style={{ padding: '24px', textAlign: 'center', color: colors.textMuted, fontSize: '13px' }}>
                    No relationships defined yet. Add relationships above.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── EXPORT TAB ── */}
          {activeTab === 'export' && (
            <div style={{ maxWidth: '500px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: colors.textPrimary, marginBottom: '16px' }}>Export Glossary</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button onClick={handleExportGlossary} style={{
                  padding: '14px 20px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                  borderRadius: '10px', color: '#a5b4fc', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                  textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px',
                }}>
                  📄 Export as JSON
                  <span style={{ fontSize: '11px', color: colors.textMuted, marginLeft: 'auto' }}>
                    Full structured data with relationships
                  </span>
                </button>
                <button onClick={handleExportLatex} style={{
                  padding: '14px 20px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
                  borderRadius: '10px', color: '#86efac', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                  textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px',
                }}>
                  📜 Export as LaTeX
                  <span style={{ fontSize: '11px', color: colors.textMuted, marginLeft: 'auto' }}>
                    \\description environment for papers
                  </span>
                </button>
              </div>

              <div style={{ marginTop: '24px', padding: '16px', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderRadius: '10px', border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 600, color: colors.textSecondary }}>Statistics</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{ fontSize: '12px', color: colors.textMuted }}>Total terms: <strong style={{ color: colors.textPrimary }}>{terms.length}</strong></div>
                  <div style={{ fontSize: '12px', color: colors.textMuted }}>With symbols: <strong style={{ color: colors.textPrimary }}>{terms.filter(t => t.symbol).length}</strong></div>
                  <div style={{ fontSize: '12px', color: colors.textMuted }}>With units: <strong style={{ color: colors.textPrimary }}>{terms.filter(t => t.unit).length}</strong></div>
                  <div style={{ fontSize: '12px', color: colors.textMuted }}>Relationships: <strong style={{ color: colors.textPrimary }}>{terms.reduce((s, t) => s + t.relationships.length, 0)}</strong></div>
                  <div style={{ fontSize: '12px', color: colors.textMuted }}>Domains: <strong style={{ color: colors.textPrimary }}>{new Set(terms.map(t => t.domain)).size}</strong></div>
                  <div style={{ fontSize: '12px', color: colors.textMuted }}>Aliases: <strong style={{ color: colors.textPrimary }}>{terms.reduce((s, t) => s + t.aliases.length, 0)}</strong></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '10px 24px', borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
          fontSize: '11px', color: colors.textMuted, textAlign: 'center',
        }}>
          Ontology data stored locally · {terms.length} terms · {terms.reduce((s, t) => s + t.relationships.length, 0)} relationships
        </div>
      </div>
    </div>
  );
}

export { OntologyManager };
