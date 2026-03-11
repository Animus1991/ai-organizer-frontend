// Academic Hero Card for AI_ORGANIZER Home.tsx
// Theme-safe implementation using semantic HSL tokens only

import React, { useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Search, Upload, Sparkles } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useUiTokens } from '../../styles/uiTokens';

interface AcademicHeroCardProps {
  uploadsList: any[];
  parsedCount: number;
  totalSegments: number;
  onUploadClick: () => void;
  onSearchClick: () => void;
}

export const AcademicHeroCard: React.FC<AcademicHeroCardProps> = ({
  uploadsList,
  parsedCount,
  totalSegments,
  onUploadClick,
  onSearchClick
}) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const tokens = useUiTokens();

  const heroSubtitle = useMemo(() =>
  t('home.hero.subtitle', {
    parsed: parsedCount.toLocaleString(),
    segments: totalSegments.toLocaleString(),
    uploads: uploadsList.length.toLocaleString()
  }) || `${parsedCount} documents processed • ${totalSegments} segments generated • ${uploadsList.length} total uploads • Real-time AI insights available`,
  [t, parsedCount, totalSegments, uploadsList.length]);

  const statLabels = useMemo(() => ({
    documents: t('home.metrics.documents') || 'Documents',
    processed: t('home.metrics.parsed') || 'Processed',
    segments: t('home.metrics.segments') || 'Segments',
    accuracy: t('home.metrics.accuracy') || 'Accuracy'
  }), [t]);

  const statCardStyle: React.CSSProperties = {
    background: 'hsl(var(--muted) / 0.45)',
    border: '1px solid hsl(var(--border))',
    borderRadius: 'calc(var(--radius) + 4px)',
    padding: `${tokens.spacing.md}px`,
    textAlign: 'center',
    transition: 'all 0.2s ease'
  };

  return (
    <div
      className="academic-welcome-banner"
      style={{
        background: 'hsl(var(--card))',
        borderRadius: 'calc(var(--radius) + 8px)',
        border: '1px solid hsl(var(--border))',
        boxShadow: isDark ?
        '0 14px 36px hsl(var(--background) / 0.58)' :
        '0 8px 24px hsl(var(--foreground) / 0.08)',
        padding: `${tokens.spacing.md}px ${tokens.spacing.lg}px`
      }}>
      
      <div className="academic-welcome-content">
        <div className="flex items-end justify-between gap-6">
          <div className="flex-1">
            <div className="academic-welcome-header" style={{ marginBottom: `${tokens.spacing.xs}px` }}>
              <Sparkles className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />
              <span style={{ textTransform: 'none', color: 'hsl(var(--primary))' }} className="text-2xl">
                {t('home.hero.tagline') || 'AI-powered research hub'}
              </span>
            </div>

            <h2 className="academic-welcome-title text-[8px]" style={{ color: 'hsl(var(--foreground))' }}>
              {t('home.hero.title') || 'Your Academic Dashboard'}
            </h2>

            <p className="academic-welcome-description" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {heroSubtitle}
            </p>

            <div className="academic-welcome-actions">
              <button
                className="academic-btn-primary"
                onClick={onSearchClick}
                style={{ borderRadius: 'var(--radius)' }}>
                
                <Search className="w-4 h-4 mr-2" />
                {t('home.hero.action.explore') || 'Explore Documents'}
              </button>
              <button
                className="academic-btn-secondary"
                onClick={onUploadClick}
                style={{ borderRadius: 'var(--radius)' }}>
                
                <Upload className="w-4 h-4 mr-2" />
                {t('home.hero.action.upload') || 'Upload Document'}
              </button>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="academic-stats-grid">
              <div className="academic-stat-card" style={statCardStyle}>
                <div className="academic-stat-value" style={{ color: 'hsl(var(--foreground))' }}>{uploadsList.length}</div>
                <div className="academic-stat-label" style={{ color: 'hsl(var(--muted-foreground))' }}>{statLabels.documents}</div>
              </div>
              <div className="academic-stat-card" style={statCardStyle}>
                <div className="academic-stat-value" style={{ color: 'hsl(var(--foreground))' }}>{parsedCount}</div>
                <div className="academic-stat-label" style={{ color: 'hsl(var(--muted-foreground))' }}>{statLabels.processed}</div>
              </div>
              <div className="academic-stat-card" style={statCardStyle}>
                <div className="academic-stat-value" style={{ color: 'hsl(var(--foreground))' }}>{totalSegments}</div>
                <div className="academic-stat-label" style={{ color: 'hsl(var(--muted-foreground))' }}>{statLabels.segments}</div>
              </div>
              <div className="academic-stat-card" style={statCardStyle}>
                <div className="academic-stat-value" style={{ color: 'hsl(var(--foreground))' }}>98%</div>
                <div className="academic-stat-label" style={{ color: 'hsl(var(--muted-foreground))' }}>{statLabels.accuracy}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>);

};

export default AcademicHeroCard;