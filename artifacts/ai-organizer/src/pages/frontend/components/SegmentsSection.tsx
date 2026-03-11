import React, { useMemo } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import type { SegmentRow } from '../../../hooks/home/useHomeState';

interface SegmentsSectionProps {
  segments: SegmentRow[];
  segmentQuery: string;
  viewMode: 'list' | 'carousel' | '3d';
  onViewModeChange: (mode: 'list' | 'carousel' | '3d') => void;
  onSegmentClick: (segment: SegmentRow) => void;
  onSegmentPreview: (segment: SegmentRow) => void;
  loading?: boolean;
}

export const SegmentsSection: React.FC<SegmentsSectionProps> = ({
  segments,
  segmentQuery,
  viewMode,
  onViewModeChange,
  onSegmentClick,
  onSegmentPreview,
  loading = false
}) => {
  const { isDark } = useTheme();
  const { t } = useLanguage();

  const filteredSegments = useMemo(() => {
    if (!segmentQuery) return segments;
    return segments.filter(seg => 
      seg.title?.toLowerCase().includes(segmentQuery.toLowerCase()) ||
      seg.content?.toLowerCase().includes(segmentQuery.toLowerCase())
    );
  }, [segments, segmentQuery]);

  const containerStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.06) 0%, rgba(139, 92, 246, 0.04) 100%)',
    borderRadius: '16px',
    border: '1px solid rgba(99, 102, 241, 0.12)',
    padding: '16px 20px',
    marginBottom: '16px',
    backdropFilter: 'blur(16px)',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: '600',
    color: isDark ? 'rgba(255,255,255,0.9)' : '#2f2941',
    margin: 0
  };

  const viewModeToggleStyle: React.CSSProperties = {
    display: 'flex',
    gap: '4px',
    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(47,41,65,0.04)',
    padding: '3px',
    borderRadius: '10px',
    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(47,41,65,0.1)',
  };

  const viewModeButtonStyle = (isActive: boolean) => ({
    padding: '6px 12px',
    borderRadius: '8px',
    border: 'none',
    background: isActive ? 'linear-gradient(135deg, rgba(99,102,241,0.4), rgba(139,92,246,0.35))' : 'transparent',
    color: isActive ? '#fff' : (isDark ? 'rgba(255,255,255,0.6)' : 'rgba(47,41,65,0.5)'),
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: isActive ? '0 2px 8px rgba(99,102,241,0.3)' : 'none',
  });

  const segmentsListStyle: React.CSSProperties = {
    maxHeight: '400px',
    overflowY: 'auto',
    padding: '4px'
  };

  const segmentCardStyle: React.CSSProperties = {
    background: isDark ? "rgba(255,255,255,0.04)" : "rgba(47,41,65,0.04)",
    border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(47,41,65,0.08)"}`,
    borderRadius: "12px",
    padding: "12px",
    marginBottom: "8px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  };

  const segmentTitleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: "14px",
    fontWeight: 600,
    color: isDark ? "rgba(255,255,255,0.9)" : "rgba(47,41,65,0.9)",
    lineHeight: 1.4,
  };

  const segmentContentStyle: React.CSSProperties = {
    margin: "8px 0 0 0",
    fontSize: "12px",
    color: isDark ? "rgba(255,255,255,0.6)" : "rgba(47,41,65,0.6)",
    lineHeight: 1.5,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  };

  const emptyStateStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '40px 20px',
    color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(47,41,65,0.5)',
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <h3 style={titleStyle}>{t('workspace.segments')}</h3>
        </div>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(47,41,65,0.6)' }}>
            {t('workspace.loadingSegments')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <section style={containerStyle}>
      <div style={headerStyle}>
        <h3 style={titleStyle}>
          {t('workspace.segments')} ({filteredSegments.length})
        </h3>
        <div style={viewModeToggleStyle}>
          <button
            style={viewModeButtonStyle(viewMode === 'list')}
            onClick={() => onViewModeChange('list')}
          >
            📋 {t('workspace.listView')}
          </button>
          <button
            style={viewModeButtonStyle(viewMode === 'carousel')}
            onClick={() => onViewModeChange('carousel')}
          >
            🎠 {t('workspace.carouselView')}
          </button>
          <button
            style={viewModeButtonStyle(viewMode === '3d')}
            onClick={() => onViewModeChange('3d')}
          >
            🎯 {t('workspace.3dView')}
          </button>
        </div>
      </div>

      {viewMode === 'list' && (
        <div style={segmentsListStyle}>
          {filteredSegments.length === 0 ? (
            <div style={emptyStateStyle}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>📄</div>
              <div>{t('workspace.noSegmentsFound')}</div>
            </div>
          ) : (
            filteredSegments.map((segment, index) => (
              <div
                key={segment.id || index}
                style={segmentCardStyle}
                onClick={() => onSegmentClick(segment)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  onSegmentPreview(segment);
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = isDark 
                    ? '0 8px 32px rgba(0,0,0,0.4)' 
                    : '0 8px 32px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <h4 style={segmentTitleStyle}>
                  {segment.title || t('workspace.untitledSegment')}
                </h4>
                {segment.content && (
                  <p style={segmentContentStyle}>
                    {segment.content}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {viewMode === 'carousel' && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎠</div>
          <div style={{ 
            fontSize: '16px', 
            color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(47,41,65,0.7)' 
          }}>
            {t('workspace.carouselViewComingSoon')}
          </div>
        </div>
      )}

      {viewMode === '3d' && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
          <div style={{ 
            fontSize: '16px', 
            color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(47,41,65,0.7)' 
          }}>
            {t('workspace.3dViewComingSoon')}
          </div>
        </div>
      )}
    </section>
  );
};

export default SegmentsSection;
