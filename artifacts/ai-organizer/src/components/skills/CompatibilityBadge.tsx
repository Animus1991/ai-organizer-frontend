/**
 * CompatibilityBadge — circular SVG score ring showing profile match %
 * Reads 'profile_skills_v1' from localStorage.
 * Self-contained, no external context beyond ThemeContext.
 */
import React, { useMemo } from 'react';

interface Props {
  /** Expertise tags of the person being compared against */
  expertiseTags: string[];
  /** Whether the person is open to collaboration */
  openToCollab?: boolean;
  /** Size of the badge in px (default 36) */
  size?: number;
  /** Show numeric label inside (default true) */
  showLabel?: boolean;
}

function loadMyProfile() {
  try {
    const r = localStorage.getItem('profile_skills_v1');
    return r ? JSON.parse(r) : null;
  } catch { return null; }
}

function computeScore(myProfile: any, tags: string[], openToCollab: boolean): number {
  if (!myProfile) return 0;
  const mySkills = new Set<string>(
    (myProfile.skills || []).map((s: any) => String(s.name).toLowerCase())
  );
  const overlap = tags.filter(t => mySkills.has(t.toLowerCase())).length;
  let score = Math.min(50, overlap * 12);
  if (openToCollab) score += 10;
  if (myProfile.availableForCollab) score += 10;
  if ((myProfile.skills || []).length >= 3) score += 10;
  if ((myProfile.intents || []).length > 0) score += 20;
  return Math.min(100, score);
}

function scoreColor(score: number): string {
  if (score >= 70) return '#22c55e';
  if (score >= 45) return '#f59e0b';
  if (score >= 20) return '#6366f1';
  return '#6b7280';
}

export const CompatibilityBadge: React.FC<Props> = ({
  expertiseTags,
  openToCollab = false,
  size = 36,
  showLabel = true,
}) => {
  const score = useMemo(() => {
    const profile = loadMyProfile();
    return computeScore(profile, expertiseTags, openToCollab);
  }, [expertiseTags, openToCollab]);

  const color = scoreColor(score);
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - 5) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const fontSize = size <= 30 ? 8 : size <= 40 ? 9 : 11;

  const label =
    score >= 70 ? 'Strong match' :
    score >= 45 ? 'Good match' :
    score >= 20 ? 'Some overlap' :
    'Low match';

  return (
    <div
      title={`${score}% compatibility — ${label}`}
      style={{ position: 'relative', width: size, height: size, flexShrink: 0, cursor: 'default' }}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={3}
        />
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      {showLabel && (
        <span style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: `${fontSize}px`, fontWeight: 700, color,
        }}>
          {score}
        </span>
      )}
    </div>
  );
};

/** Compact inline text badge for list views */
export const CompatibilityPill: React.FC<{ expertiseTags: string[]; openToCollab?: boolean }> = ({
  expertiseTags, openToCollab = false,
}) => {
  const score = useMemo(() => {
    const profile = loadMyProfile();
    return computeScore(profile, expertiseTags, openToCollab);
  }, [expertiseTags, openToCollab]);

  if (score === 0) return null;
  const color = scoreColor(score);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '3px',
      padding: '2px 7px', borderRadius: '20px', fontSize: '10px', fontWeight: 700,
      background: `${color}18`, color, border: `1px solid ${color}35`,
    }}>
      ◎ {score}%
    </span>
  );
};
