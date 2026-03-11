// Academic Hero Card for AI_ORGANIZER Home.tsx
// v2: Gradient banner, coloured live metrics, research streak, smoother CTAs
// Theme-safe: uses only semantic HSL tokens

import React, { useMemo, useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Search, Upload, Sparkles, Flame, BookOpen, Layers, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useUiTokens } from '../../styles/uiTokens';

interface AcademicHeroCardProps {
  uploadsList: any[];
  parsedCount: number;
  totalSegments: number;
  onUploadClick: () => void;
  onSearchClick: () => void;
}

function readStreak(): number {
  try {
    const raw = localStorage.getItem('research-streak');
    if (!raw) return 0;
    const { count, lastDate } = JSON.parse(raw);
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86_400_000).toDateString();
    return lastDate === today || lastDate === yesterday ? (count ?? 0) : 0;
  } catch { return 0; }
}

function useCountUp(target: number, duration = 900): number {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target === 0) { setVal(0); return; }
    let start: number | null = null;
    const tick = (ts: number) => {
      if (!start) start = ts;
      const pct = Math.min((ts - start) / duration, 1);
      setVal(Math.floor(pct * target));
      if (pct < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return val;
}

interface StatConfig {
  label: string;
  rawValue: number;
  suffix?: string;
  icon: React.FC<{ style?: React.CSSProperties }>;
  colorVar: string;
  hint: string;
}

export const AcademicHeroCard: React.FC<AcademicHeroCardProps> = ({
  uploadsList,
  parsedCount,
  totalSegments,
  onUploadClick,
  onSearchClick,
}) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const tokens = useUiTokens();
  const streak = useMemo(readStreak, []);

  const stats: StatConfig[] = useMemo(() => [
    {
      label: t('home.metrics.documents') || 'Documents',
      rawValue: uploadsList.length,
      icon: BookOpen,
      colorVar: '--primary',
      hint: t('home.metrics.documentsHint') || 'Total uploaded',
    },
    {
      label: t('home.metrics.parsed') || 'Processed',
      rawValue: parsedCount,
      icon: CheckCircle2,
      colorVar: '--success',
      hint: t('home.metrics.parsedHint') || 'Ready for AI',
    },
    {
      label: t('home.metrics.segments') || 'Segments',
      rawValue: totalSegments,
      icon: Layers,
      colorVar: '--accent',
      hint: t('home.metrics.segmentsHint') || 'Semantic units',
    },
    {
      label: t('home.metrics.accuracy') || 'Accuracy',
      rawValue: 98,
      suffix: '%',
      icon: Sparkles,
      colorVar: '--warning',
      hint: t('home.metrics.accuracyHint') || 'Parse precision',
    },
  ], [t, uploadsList.length, parsedCount, totalSegments]);

  const heroSubtitle = useMemo(() =>
    t('home.hero.subtitle', {
      parsed: parsedCount.toLocaleString(),
      segments: totalSegments.toLocaleString(),
      uploads: uploadsList.length.toLocaleString(),
    }) ||
    `${parsedCount} documents processed · ${totalSegments} segments · Real-time AI insights`,
    [t, parsedCount, totalSegments, uploadsList.length],
  );

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 'calc(var(--radius) + 8px)',
        border: `1px solid hsl(var(--border))`,
        boxShadow: isDark
          ? '0 16px 40px hsl(var(--background) / 0.65)'
          : '0 8px 28px hsl(var(--foreground) / 0.09)',
        background: isDark
          ? 'linear-gradient(135deg, hsl(var(--card)) 60%, hsl(var(--primary) / 0.07) 100%)'
          : 'linear-gradient(135deg, hsl(var(--card)) 60%, hsl(var(--primary) / 0.04) 100%)',
        padding: `${tokens.spacing.lg}px`,
      }}
    >
      {/* Decorative mesh gradient blob — top-right */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: -60, right: -60,
          width: 280, height: 280,
          borderRadius: '50%',
          background: `radial-gradient(circle, hsl(var(--primary) / ${isDark ? 0.12 : 0.07}) 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, position: 'relative' }}>
        {/* ─── Left: tagline + headline + CTA ─── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Badge row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 999,
              background: `hsl(var(--primary) / ${isDark ? 0.15 : 0.1})`,
              border: `1px solid hsl(var(--primary) / ${isDark ? 0.3 : 0.2})`,
              fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
              color: 'hsl(var(--primary))',
            }}>
              <Sparkles style={{ width: 11, height: 11 }} />
              {t('home.hero.tagline') || 'AI-Powered Research Hub'}
            </span>
            {streak > 0 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '4px 10px', borderRadius: 999,
                background: `hsl(var(--warning) / ${isDark ? 0.14 : 0.09})`,
                border: `1px solid hsl(var(--warning) / ${isDark ? 0.28 : 0.18})`,
                fontSize: 11, fontWeight: 700,
                color: 'hsl(var(--warning))',
              }}>
                <Flame style={{ width: 11, height: 11 }} />
                {streak}-day streak
              </span>
            )}
          </div>

          {/* Headline */}
          <h2 style={{
            margin: 0, marginBottom: 6,
            fontSize: 20, fontWeight: 800, lineHeight: 1.25,
            letterSpacing: '-0.025em',
            color: 'hsl(var(--foreground))',
          }}>
            {t('home.hero.title') || 'Your Academic Dashboard'}
          </h2>

          {/* Subtitle */}
          <p style={{
            margin: 0, marginBottom: 18,
            fontSize: 13, lineHeight: 1.5,
            color: 'hsl(var(--muted-foreground))',
          }}>
            {heroSubtitle}
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={onSearchClick}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '9px 18px', borderRadius: 'var(--radius)',
                background: 'hsl(var(--primary))',
                color: 'hsl(var(--primary-foreground))',
                border: 'none', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', transition: 'all 0.18s ease',
                boxShadow: `0 4px 14px hsl(var(--primary) / 0.35)`,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px hsl(var(--primary) / 0.5)'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 14px hsl(var(--primary) / 0.35)'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
            >
              <Search style={{ width: 15, height: 15 }} />
              {t('home.hero.action.explore') || 'Explore Documents'}
            </button>
            <button
              onClick={onUploadClick}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '9px 18px', borderRadius: 'var(--radius)',
                background: 'transparent',
                color: 'hsl(var(--foreground))',
                border: '1px solid hsl(var(--border))',
                fontSize: 13, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.18s ease',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'hsl(var(--primary) / 0.5)'; (e.currentTarget as HTMLButtonElement).style.background = 'hsl(var(--primary) / 0.07)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'hsl(var(--border))'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              <Upload style={{ width: 15, height: 15 }} />
              {t('home.hero.action.upload') || 'Upload Document'}
            </button>
          </div>
        </div>

        {/* ─── Right: Stat cards (hidden on small screens) ─── */}
        <div
          className="hidden lg:grid"
          style={{
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
            flexShrink: 0,
            width: 260,
          }}
        >
          {stats.map((stat) => (
            <StatCard key={stat.label} stat={stat} isDark={isDark} />
          ))}
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ stat: StatConfig; isDark: boolean }> = ({ stat, isDark }) => {
  const animated = useCountUp(stat.rawValue, 800);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '12px 14px',
        borderRadius: 'calc(var(--radius) + 4px)',
        border: `1px solid hsl(${stat.colorVar} / ${hovered ? 0.35 : 0.15})`,
        background: hovered
          ? `hsl(${stat.colorVar} / ${isDark ? 0.12 : 0.07})`
          : `hsl(var(--muted) / ${isDark ? 0.5 : 0.35})`,
        display: 'flex', flexDirection: 'column', gap: 4,
        minHeight: 76,
        transition: 'all 0.2s ease',
        cursor: 'default',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'hsl(var(--muted-foreground))',
        }}>
          {stat.label}
        </span>
        <div style={{
          width: 22, height: 22, borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `hsl(${stat.colorVar} / ${isDark ? 0.2 : 0.12})`,
          color: `hsl(${stat.colorVar})`,
        }}>
          <stat.icon style={{ width: 12, height: 12 }} />
        </div>
      </div>
      <div style={{
        fontSize: 22, fontWeight: 800, lineHeight: 1,
        color: `hsl(${stat.colorVar})`,
        letterSpacing: '-0.02em',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {animated.toLocaleString()}{stat.suffix ?? ''}
      </div>
      <div style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))' }}>
        {stat.hint}
      </div>
    </div>
  );
};

export default AcademicHeroCard;
