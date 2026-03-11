import React, { useState, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheoryBranching } from '../context/TheoryBranchingContext';
import { useMediaQuery } from '../hooks/useMediaQuery';

// Types for merge conflict resolution
export interface ConflictSection {
  id: string;
  field: string;
  baseContent: string;
  oursContent: string;
  theirsContent: string;
  resolution: 'pending' | 'ours' | 'theirs' | 'manual' | 'both';
  manualContent?: string;
}

export interface MergeConflict {
  id: string;
  sourceBranch: string;
  targetBranch: string;
  documentId: string;
  documentTitle: string;
  conflicts: ConflictSection[];
  createdAt: string;
  status: 'open' | 'resolved' | 'aborted';
}

interface MergeConflictResolverProps {
  conflict: MergeConflict;
  onResolve: (resolvedConflict: MergeConflict) => void;
  onAbort: () => void;
  onClose: () => void;
}

type ViewMode = 'split' | 'unified' | 'inline';

// Semantic diff colors
const DIFF_COLORS = {
  ours: { bg: 'hsl(142 71% 45% / 0.12)', accent: 'hsl(142 71% 45%)' },
  theirs: { bg: 'hsl(43 96% 56% / 0.12)', accent: 'hsl(43 96% 56%)' },
  base: { bg: 'hsl(var(--muted) / 0.4)', accent: 'hsl(var(--muted-foreground))' },
  conflict: { bg: 'hsl(var(--destructive) / 0.12)', accent: 'hsl(var(--destructive))' },
  resolved: { bg: 'hsl(142 71% 45% / 0.15)', accent: 'hsl(142 71% 45%)' },
};

export const MergeConflictResolver: React.FC<MergeConflictResolverProps> = ({ conflict, onResolve, onAbort, onClose }) => {
  const { t } = useLanguage();
  const { updateMergeRequest, executeMerge } = useTheoryBranching();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const [sections, setSections] = useState<ConflictSection[]>(conflict.conflicts);
  const [activeSection, setActiveSection] = useState<string>(conflict.conflicts[0]?.id || '');
  const [viewMode, setViewMode] = useState<ViewMode>(isMobile ? 'unified' : 'split');
  const [showPreview, setShowPreview] = useState(false);

  const resolvedCount = sections.filter(s => s.resolution !== 'pending').length;
  const totalCount = sections.length;
  const progress = totalCount > 0 ? (resolvedCount / totalCount) * 100 : 0;
  const allResolved = resolvedCount === totalCount;
  const currentSection = sections.find(s => s.id === activeSection);

  const updateResolution = useCallback((sectionId: string, resolution: ConflictSection['resolution'], manualContent?: string) => {
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, resolution, manualContent: manualContent || s.manualContent } : s));
  }, []);

  const acceptAllOurs = useCallback(() => { setSections(prev => prev.map(s => ({ ...s, resolution: 'ours' }))); }, []);
  const acceptAllTheirs = useCallback(() => { setSections(prev => prev.map(s => ({ ...s, resolution: 'theirs' }))); }, []);

  const handleResolve = useCallback(() => {
    if (!allResolved) return;
    const mergeRequestId = conflict.id;
    const resolvedConflicts = sections.map(s => ({ field: s.field, sourceValue: s.oursContent, targetValue: s.theirsContent, resolution: s.resolution === 'ours' ? 'source' as const : s.resolution === 'theirs' ? 'target' as const : 'manual' as const, manualValue: s.manualContent }));
    updateMergeRequest(mergeRequestId, { conflicts: resolvedConflicts, status: 'open' });
    executeMerge(mergeRequestId);
    onResolve({ ...conflict, conflicts: sections, status: 'resolved' });
  }, [allResolved, conflict, sections, onResolve, updateMergeRequest, executeMerge]);

  const renderDiffLine = (content: string, type: 'base' | 'ours' | 'theirs' | 'both') => {
    const lines = content.split('\n');
    const dc = type === 'ours' ? DIFF_COLORS.ours : type === 'theirs' ? DIFF_COLORS.theirs : type === 'base' ? DIFF_COLORS.base : DIFF_COLORS.resolved;
    const prefix = type === 'ours' ? '+' : type === 'theirs' ? '-' : type === 'base' ? ' ' : '±';
    return (
      <div style={{ background: dc.bg, borderLeft: `3px solid ${dc.accent}`, padding: '8px 12px', fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace', fontSize: '12px', lineHeight: '1.5', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {lines.map((line, i) => (
          <div key={i} style={{ display: 'flex', gap: '8px' }}>
            <span style={{ color: dc.accent, userSelect: 'none', minWidth: '14px' }}>{prefix}</span>
            <span style={{ color: 'hsl(var(--foreground))' }}>{line || ' '}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderAcceptButton = (sectionId: string, type: 'ours' | 'theirs', currentResolution: string) => {
    const dc = type === 'ours' ? DIFF_COLORS.ours : DIFF_COLORS.theirs;
    const isActive = currentResolution === type;
    return (
      <button onClick={() => updateResolution(sectionId, type)} style={{ padding: '4px 10px', background: isActive ? dc.accent : 'transparent', border: `1px solid ${dc.accent}`, borderRadius: '10px', color: isActive ? '#ffffff' : dc.accent, fontSize: '10px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s ease' }}>
        {isActive ? '✓ ' : ''}{type === 'ours' ? (t('merge.acceptOurs') || 'Accept') : (t('merge.acceptTheirs') || 'Accept')}
      </button>
    );
  };

  // Split View
  const renderSplitView = () => {
    if (!currentSection) return null;
    return (
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '1px', background: 'hsl(var(--border))', flex: 1, overflow: 'hidden' }}>
        {/* Base */}
        <div style={{ background: 'hsl(var(--card))', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '8px 12px', background: DIFF_COLORS.base.bg, borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <span style={{ fontSize: '13px' }}>📄</span>
            <span style={{ fontWeight: 600, color: DIFF_COLORS.base.accent, fontSize: '12px' }}>{t('merge.base') || 'Base (Original)'}</span>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: '10px' }}>{renderDiffLine(currentSection.baseContent, 'base')}</div>
        </div>
        {/* Ours */}
        <div style={{ background: 'hsl(var(--card))', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '8px 12px', background: DIFF_COLORS.ours.bg, borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px' }}>🟢</span>
              <span style={{ fontWeight: 600, color: DIFF_COLORS.ours.accent, fontSize: '12px' }}>{conflict.targetBranch} {t('merge.ours') || '(Ours)'}</span>
            </div>
            {renderAcceptButton(currentSection.id, 'ours', currentSection.resolution)}
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: '10px' }}>{renderDiffLine(currentSection.oursContent, 'ours')}</div>
        </div>
        {/* Theirs */}
        <div style={{ background: 'hsl(var(--card))', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '8px 12px', background: DIFF_COLORS.theirs.bg, borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px' }}>🟡</span>
              <span style={{ fontWeight: 600, color: DIFF_COLORS.theirs.accent, fontSize: '12px' }}>{conflict.sourceBranch} {t('merge.theirs') || '(Theirs)'}</span>
            </div>
            {renderAcceptButton(currentSection.id, 'theirs', currentSection.resolution)}
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: '10px' }}>{renderDiffLine(currentSection.theirsContent, 'theirs')}</div>
        </div>
      </div>
    );
  };

  // Unified View
  const renderUnifiedView = () => {
    if (!currentSection) return null;
    return (
      <div style={{ flex: 1, overflow: 'auto', padding: isMobile ? '12px' : '16px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ padding: '6px 10px', background: DIFF_COLORS.conflict.bg, borderLeft: `3px solid ${DIFF_COLORS.conflict.accent}`, fontFamily: 'monospace', fontSize: '11px', color: DIFF_COLORS.conflict.accent, marginBottom: '2px' }}>{'<<<<<<< ' + conflict.targetBranch + ' (ours)'}</div>
          {renderDiffLine(currentSection.oursContent, 'ours')}
          <div style={{ padding: '6px 10px', background: DIFF_COLORS.base.bg, borderLeft: `3px solid ${DIFF_COLORS.base.accent}`, fontFamily: 'monospace', fontSize: '11px', color: DIFF_COLORS.base.accent, margin: '2px 0' }}>{'======= base ======='}</div>
          {renderDiffLine(currentSection.baseContent, 'base')}
          <div style={{ padding: '6px 10px', background: DIFF_COLORS.theirs.bg, borderLeft: `3px solid ${DIFF_COLORS.theirs.accent}`, fontFamily: 'monospace', fontSize: '11px', color: DIFF_COLORS.theirs.accent, margin: '2px 0' }}>{'======= theirs ======='}</div>
          {renderDiffLine(currentSection.theirsContent, 'theirs')}
          <div style={{ padding: '6px 10px', background: DIFF_COLORS.conflict.bg, borderLeft: `3px solid ${DIFF_COLORS.conflict.accent}`, fontFamily: 'monospace', fontSize: '11px', color: DIFF_COLORS.conflict.accent, marginTop: '2px' }}>{'>>>>>>> ' + conflict.sourceBranch + ' (theirs)'}</div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '18px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => updateResolution(currentSection.id, 'ours')} style={{ padding: '8px 18px', background: currentSection.resolution === 'ours' ? DIFF_COLORS.ours.accent : 'transparent', border: `2px solid ${DIFF_COLORS.ours.accent}`, borderRadius: '10px', color: currentSection.resolution === 'ours' ? '#ffffff' : DIFF_COLORS.ours.accent, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>🟢 {t('merge.acceptOurs') || 'Accept Ours'}</button>
            <button onClick={() => updateResolution(currentSection.id, 'theirs')} style={{ padding: '8px 18px', background: currentSection.resolution === 'theirs' ? DIFF_COLORS.theirs.accent : 'transparent', border: `2px solid ${DIFF_COLORS.theirs.accent}`, borderRadius: '10px', color: currentSection.resolution === 'theirs' ? '#ffffff' : DIFF_COLORS.theirs.accent, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>🟡 {t('merge.acceptTheirs') || 'Accept Theirs'}</button>
            <button onClick={() => updateResolution(currentSection.id, 'both')} style={{ padding: '8px 18px', background: currentSection.resolution === 'both' ? 'hsl(var(--primary))' : 'transparent', border: '2px solid hsl(var(--primary))', borderRadius: '10px', color: currentSection.resolution === 'both' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--primary))', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>🔀 {t('merge.acceptBoth') || 'Accept Both'}</button>
          </div>
        </div>
      </div>
    );
  };

  // Manual Edit View
  const renderManualEdit = () => {
    if (!currentSection) return null;
    const initialContent = currentSection.manualContent || `${currentSection.oursContent}\n\n--- OR ---\n\n${currentSection.theirsContent}`;
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: isMobile ? '12px' : '14px', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '10px', flex: 1, flexDirection: isMobile ? 'column' : 'row' }}>
          {!isMobile && (
            <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ flex: 1, background: 'hsl(var(--card))', borderRadius: '10px', border: '1px solid hsl(var(--border))', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '7px 10px', background: DIFF_COLORS.ours.bg, borderBottom: '1px solid hsl(var(--border))', fontSize: '11px', fontWeight: 600, color: DIFF_COLORS.ours.accent }}>🟢 Ours</div>
                <div style={{ flex: 1, padding: '8px', overflow: 'auto', fontSize: '11px', fontFamily: 'monospace', color: 'hsl(var(--foreground))' }}>{currentSection.oursContent}</div>
              </div>
              <div style={{ flex: 1, background: 'hsl(var(--card))', borderRadius: '10px', border: '1px solid hsl(var(--border))', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '7px 10px', background: DIFF_COLORS.theirs.bg, borderBottom: '1px solid hsl(var(--border))', fontSize: '11px', fontWeight: 600, color: DIFF_COLORS.theirs.accent }}>🟡 Theirs</div>
                <div style={{ flex: 1, padding: '8px', overflow: 'auto', fontSize: '11px', fontFamily: 'monospace', color: 'hsl(var(--foreground))' }}>{currentSection.theirsContent}</div>
              </div>
            </div>
          )}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '7px 10px', background: DIFF_COLORS.resolved.bg, borderRadius: '10px 10px 0 0', fontSize: '11px', fontWeight: 600, color: DIFF_COLORS.resolved.accent }}>✏️ {t('merge.manualResolution') || 'Manual Resolution'}</div>
            <textarea defaultValue={initialContent} onChange={(e) => updateResolution(currentSection.id, 'manual', e.target.value)} style={{ flex: 1, padding: '10px', background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderTop: 'none', borderRadius: '0 0 10px 10px', color: 'hsl(var(--foreground))', fontSize: '12px', fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace', lineHeight: '1.5', resize: 'none', outline: 'none' }} placeholder={t('merge.manualPlaceholder') || 'Edit the merged content here...'} />
          </div>
        </div>
        <button onClick={() => updateResolution(currentSection.id, 'manual', currentSection.manualContent)} style={{ alignSelf: 'center', padding: '8px 20px', background: currentSection.resolution === 'manual' ? DIFF_COLORS.resolved.accent : 'transparent', border: `2px solid ${DIFF_COLORS.resolved.accent}`, borderRadius: '10px', color: currentSection.resolution === 'manual' ? '#ffffff' : DIFF_COLORS.resolved.accent, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
          {currentSection.resolution === 'manual' ? '✓ ' : ''}{t('merge.useManual') || 'Use Manual Resolution'}
        </button>
      </div>
    );
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '8px' : '20px' }}>
      <div style={{ width: '100%', maxWidth: '1400px', height: isMobile ? '95vh' : '90vh', background: 'hsl(var(--background))', borderRadius: '10px', border: '1px solid hsl(var(--border))', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
        {/* Header */}
        <div style={{ padding: isMobile ? '10px 12px' : '14px 18px', background: 'hsl(var(--muted) / 0.5)', borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🔀</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>{t('merge.resolveConflicts') || 'Resolve Merge Conflicts'}</h2>
              <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginTop: '1px' }}>{conflict.sourceBranch} → {conflict.targetBranch} • {conflict.documentTitle}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: isMobile ? '80px' : '110px', height: '5px', background: 'hsl(var(--muted))', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: allResolved ? DIFF_COLORS.resolved.accent : DIFF_COLORS.theirs.accent, transition: 'width 0.3s ease' }} />
              </div>
              <span style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', fontWeight: 500 }}>{resolvedCount}/{totalCount}</span>
            </div>
            {!isMobile && (
              <div style={{ display: 'flex', background: 'hsl(var(--muted))', borderRadius: '10px', padding: '2px' }}>
                {(['split', 'unified', 'inline'] as ViewMode[]).map(mode => (
                  <button key={mode} onClick={() => setViewMode(mode)} style={{ padding: '5px 10px', background: viewMode === mode ? 'hsl(var(--background))' : 'transparent', border: 'none', borderRadius: '8px', color: viewMode === mode ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))', fontSize: '11px', fontWeight: 500, cursor: 'pointer' }}>
                    {mode === 'split' ? '⫼' : mode === 'unified' ? '≡' : '✏️'} {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            )}
            <button onClick={onClose} style={{ padding: '5px 10px', background: 'transparent', border: '1px solid hsl(var(--border))', borderRadius: '10px', color: 'hsl(var(--muted-foreground))', fontSize: '11px', cursor: 'pointer' }}>✕</button>
          </div>
        </div>

        {/* Toolbar */}
        <div style={{ padding: isMobile ? '8px 12px' : '8px 18px', background: 'hsl(var(--muted) / 0.3)', borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, flexWrap: 'wrap', gap: '6px' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button onClick={acceptAllOurs} style={{ padding: '5px 10px', background: 'transparent', border: `1px solid ${DIFF_COLORS.ours.accent}`, borderRadius: '10px', color: DIFF_COLORS.ours.accent, fontSize: '11px', fontWeight: 500, cursor: 'pointer' }}>✓ {t('merge.acceptAllOurs') || 'Accept All Ours'}</button>
            <button onClick={acceptAllTheirs} style={{ padding: '5px 10px', background: 'transparent', border: `1px solid ${DIFF_COLORS.theirs.accent}`, borderRadius: '10px', color: DIFF_COLORS.theirs.accent, fontSize: '11px', fontWeight: 500, cursor: 'pointer' }}>✓ {t('merge.acceptAllTheirs') || 'Accept All Theirs'}</button>
          </div>
          <button onClick={() => setShowPreview(!showPreview)} style={{ padding: '5px 10px', background: showPreview ? 'hsl(var(--accent))' : 'transparent', border: '1px solid hsl(var(--border))', borderRadius: '10px', color: 'hsl(var(--foreground))', fontSize: '11px', fontWeight: 500, cursor: 'pointer' }}>👁️ {t('merge.preview') || 'Preview'}</button>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', flexDirection: isMobile ? 'column' : 'row' }}>
          {/* Sections sidebar */}
          <div style={{ width: isMobile ? '100%' : '220px', background: 'hsl(var(--muted) / 0.3)', borderRight: isMobile ? 'none' : '1px solid hsl(var(--border))', borderBottom: isMobile ? '1px solid hsl(var(--border))' : 'none', overflow: 'auto', flexShrink: 0, maxHeight: isMobile ? '120px' : 'none' }}>
            <div style={{ padding: '10px 12px', borderBottom: '1px solid hsl(var(--border))' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('merge.conflictingSections') || 'Conflicting Sections'}</div>
            </div>
            {sections.map((section, index) => (
              <button key={section.id} onClick={() => setActiveSection(section.id)} style={{ width: '100%', padding: '10px 12px', background: activeSection === section.id ? 'hsl(var(--accent))' : 'transparent', border: 'none', borderLeft: activeSection === section.id ? '3px solid hsl(var(--primary))' : '3px solid transparent', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: section.resolution === 'pending' ? DIFF_COLORS.conflict.bg : DIFF_COLORS.resolved.bg, border: `2px solid ${section.resolution === 'pending' ? DIFF_COLORS.conflict.accent : DIFF_COLORS.resolved.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: section.resolution === 'pending' ? DIFF_COLORS.conflict.accent : DIFF_COLORS.resolved.accent, flexShrink: 0 }}>
                  {section.resolution === 'pending' ? '!' : '✓'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: 'hsl(var(--foreground))', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{index + 1}. {section.field}</div>
                  <div style={{ fontSize: '10px', color: 'hsl(var(--muted-foreground))' }}>
                    {section.resolution === 'pending' ? t('merge.pending') || 'Pending' : section.resolution === 'ours' ? t('merge.ours') || 'Ours' : section.resolution === 'theirs' ? t('merge.theirs') || 'Theirs' : section.resolution === 'both' ? t('merge.both') || 'Both' : t('merge.manual') || 'Manual'}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Diff viewer */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Mobile view mode selector */}
            {isMobile && (
              <div style={{ display: 'flex', padding: '6px 10px', gap: '4px', background: 'hsl(var(--muted) / 0.2)', borderBottom: '1px solid hsl(var(--border))' }}>
                {(['unified', 'inline'] as ViewMode[]).map(mode => (
                  <button key={mode} onClick={() => setViewMode(mode)} style={{ padding: '4px 10px', background: viewMode === mode ? 'hsl(var(--background))' : 'transparent', border: 'none', borderRadius: '10px', color: viewMode === mode ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))', fontSize: '11px', cursor: 'pointer' }}>
                    {mode === 'unified' ? '≡ Unified' : '✏️ Edit'}
                  </button>
                ))}
              </div>
            )}
            {viewMode === 'split' && renderSplitView()}
            {viewMode === 'unified' && renderUnifiedView()}
            {viewMode === 'inline' && renderManualEdit()}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: isMobile ? '10px 12px' : '12px 18px', background: 'hsl(var(--muted) / 0.5)', borderTop: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, flexWrap: 'wrap', gap: '8px' }}>
          <button onClick={onAbort} style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${DIFF_COLORS.conflict.accent}`, borderRadius: '10px', color: DIFF_COLORS.conflict.accent, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>✕ {t('merge.abort') || 'Abort Merge'}</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>
              {allResolved ? `✓ ${t('merge.allResolved') || 'All conflicts resolved'}` : `${totalCount - resolvedCount} ${t('merge.remaining') || 'conflicts remaining'}`}
            </span>
            <button onClick={handleResolve} disabled={!allResolved} style={{ padding: '8px 20px', background: allResolved ? DIFF_COLORS.resolved.accent : 'hsl(var(--muted))', border: 'none', borderRadius: '10px', color: allResolved ? '#ffffff' : 'hsl(var(--muted-foreground))', fontSize: '12px', fontWeight: 600, cursor: allResolved ? 'pointer' : 'not-allowed', opacity: allResolved ? 1 : 0.6 }}>🔀 {t('merge.completeMerge') || 'Complete Merge'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MergeConflictResolver;
