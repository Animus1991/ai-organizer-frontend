import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

export type TrustLevel = 'new' | 'basic' | 'member' | 'regular' | 'verified' | 'trusted' | 'elder';

export interface TrustTier {
  level: TrustLevel;
  label: string;
  icon: string;
  color: string;
  dmLimit: number | null;
  description: string;
  requirements: string;
}

export const TRUST_TIERS: Record<TrustLevel, TrustTier> = {
  new:      { level:'new',      label:'New',       icon:'🌱', color:'#6b7280', dmLimit:3,    description:'Recently joined account', requirements:'Account < 7 days old' },
  basic:    { level:'basic',    label:'Basic',     icon:'🔵', color:'#3b82f6', dmLimit:10,   description:'Basic account in good standing', requirements:'Account > 7 days, no violations' },
  member:   { level:'member',   label:'Member',    icon:'🟢', color:'#22c55e', dmLimit:25,   description:'Active community member', requirements:'7+ posts, 15+ days' },
  regular:  { level:'regular',  label:'Regular',   icon:'🟡', color:'#f59e0b', dmLimit:50,   description:'Regular contributor', requirements:'50+ posts, 30+ days, 10+ likes received' },
  verified: { level:'verified', label:'Verified',  icon:'✅', color:'#6366f1', dmLimit:null, description:'Email-verified researcher', requirements:'Verified institutional email' },
  trusted:  { level:'trusted',  label:'Trusted',   icon:'🏅', color:'#8b5cf6', dmLimit:null, description:'Trusted long-term member', requirements:'6+ months, 200+ posts, community vouches' },
  elder:    { level:'elder',    label:'Elder',     icon:'⭐', color:'#f97316', dmLimit:null, description:'Distinguished community elder', requirements:'12+ months, significant contributions' },
};

const SK = 'user_trust_level_v1';
export function getUserTrustLevel(): TrustLevel {
  try { const r = localStorage.getItem(SK); if (r && r in TRUST_TIERS) return r as TrustLevel; } catch {}
  return 'member';
}
export function setUserTrustLevel(level: TrustLevel) {
  try { localStorage.setItem(SK, level); } catch {}
}

// ── Badge component ───────────────────────────────────────────────────────────
interface TrustBadgeProps {
  level?: TrustLevel;
  size?: 'xs' | 'sm' | 'md';
  showLabel?: boolean;
  showDMLimit?: boolean;
  tooltip?: boolean;
}

export function TrustBadge({ level, size = 'sm', showLabel = false, showDMLimit = false, tooltip = true }: TrustBadgeProps) {
  const { colors } = useTheme();
  const [showTip, setShowTip] = useState(false);
  const resolvedLevel = level ?? getUserTrustLevel();
  const tier = TRUST_TIERS[resolvedLevel];

  const sizes = { xs: { font: '9px', pad: '1px 5px', icon: '10px' }, sm: { font: '10px', pad: '2px 7px', icon: '11px' }, md: { font: '12px', pad: '4px 10px', icon: '14px' } };
  const s = sizes[size];

  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
      <span
        onMouseEnter={() => tooltip && setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: s.pad, borderRadius: '20px',
          background: `${tier.color}18`, border: `1px solid ${tier.color}40`, color: tier.color,
          fontSize: s.font, fontWeight: 700, cursor: tooltip ? 'help' : 'default', whiteSpace: 'nowrap' }}>
        <span style={{ fontSize: s.icon }}>{tier.icon}</span>
        {showLabel && <span>{tier.label}</span>}
      </span>
      {showDMLimit && (
        <span style={{ fontSize: s.font, color: colors.textMuted, whiteSpace: 'nowrap' }}>
          · {tier.dmLimit === null ? '∞' : tier.dmLimit} DMs/day
        </span>
      )}
      {showTip && tooltip && (
        <div style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)',
          background: '#1e1e2e', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px',
          padding: '10px 13px', minWidth: '200px', zIndex: 500, boxShadow: '0 8px 24px rgba(0,0,0,0.4)', pointerEvents: 'none' }}>
          <div style={{ fontWeight: 700, color: tier.color, marginBottom: '4px', fontSize: '12px' }}>{tier.icon} {tier.label} Trust Level</div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', lineHeight: 1.5, marginBottom: '4px' }}>{tier.description}</div>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '10px' }}>DM limit: {tier.dmLimit === null ? 'Unlimited' : `${tier.dmLimit}/day`}</div>
        </div>
      )}
    </span>
  );
}

// ── DM Limit Indicator ────────────────────────────────────────────────────────
interface DMIndicatorProps { level?: TrustLevel; used?: number; }
export function DMIndicator({ level, used = 0 }: DMIndicatorProps) {
  const { isDark, colors } = useTheme();
  const resolvedLevel = level ?? getUserTrustLevel();
  const tier = TRUST_TIERS[resolvedLevel];
  if (tier.dmLimit === null) return null;
  const pct = Math.min(used / tier.dmLimit, 1);
  const color = pct > 0.8 ? '#ef4444' : pct > 0.5 ? '#f59e0b' : '#22c55e';
  return (
    <div style={{ padding: '8px 12px', borderRadius: '10px', border: `1px solid ${colors.borderPrimary}`, background: isDark ? 'rgba(255,255,255,0.02)' : '#f9fafb', display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
        <span style={{ color: colors.textSecondary, fontWeight: 600 }}>DMs Today</span>
        <span style={{ color, fontWeight: 700 }}>{used}/{tier.dmLimit}</span>
      </div>
      <div style={{ height: '4px', borderRadius: '2px', background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
        <div style={{ height: '100%', borderRadius: '2px', width: `${pct * 100}%`, background: color, transition: 'width 0.3s' }}/>
      </div>
      {pct >= 1 && <div style={{ fontSize: '10px', color: '#ef4444' }}>Daily DM limit reached. Resets at midnight.</div>}
    </div>
  );
}

// ── Trust Tier Progress panel (for Settings / Profile) ────────────────────────
export function TrustTierPanel() {
  const { isDark, colors } = useTheme();
  const current = getUserTrustLevel();
  const levels: TrustLevel[] = ['new','basic','member','regular','verified','trusted','elder'];
  const currentIdx = levels.indexOf(current);

  return (
    <div style={{ padding: '16px', borderRadius: '14px', border: `1px solid ${colors.borderPrimary}`, background: isDark ? 'rgba(255,255,255,0.02)' : '#fff' }}>
      <div style={{ fontWeight: 700, fontSize: '14px', color: colors.textPrimary, marginBottom: '12px' }}>🛡️ Trust Level</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {levels.map((lvl, i) => {
          const t = TRUST_TIERS[lvl];
          const isCurrent = lvl === current;
          const isPast = i < currentIdx;
          return (
            <div key={lvl} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '9px',
              background: isCurrent ? `${t.color}15` : 'transparent',
              border: `1px solid ${isCurrent ? t.color+'40' : 'transparent'}`, opacity: i > currentIdx + 1 ? 0.45 : 1 }}>
              <span style={{ fontSize: '16px', filter: i > currentIdx ? 'grayscale(1)' : 'none' }}>{t.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: isCurrent ? 700 : 500, color: isCurrent ? t.color : colors.textSecondary }}>{t.label} {isCurrent && '← you'}</div>
                <div style={{ fontSize: '10px', color: colors.textMuted }}>{t.requirements}</div>
              </div>
              <span style={{ fontSize: '10px', color: colors.textMuted, whiteSpace: 'nowrap' }}>
                {t.dmLimit === null ? '∞ DMs' : `${t.dmLimit} DMs/day`}
              </span>
              {isPast && <span style={{ fontSize: '10px', color: '#22c55e' }}>✓</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}