/**
 * IntentCardSelector — toggle-card UI for selecting collaboration intents
 * Used in ProfilePage skills section. Self-contained, no external context.
 */
import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export type IntentType =
  | 'looking_cofounder' | 'looking_collaborator' | 'offering_mentoring'
  | 'seeking_mentoring'  | 'looking_investor'    | 'open_to_invest'
  | 'hiring'             | 'job_seeking'          | 'offering_expertise'
  | 'seeking_expertise'  | 'building_team'        | 'open_to_freelance';

export interface IntentEntry { type: IntentType; description?: string; }

export const INTENT_CONFIG: Record<IntentType, { label: string; icon: string; color: string; hint: string }> = {
  looking_cofounder:    { label: 'Looking for Co-founder',  icon: '🤝', color: '#6366f1', hint: 'Find a technical or business co-founder' },
  looking_collaborator: { label: 'Seeking Collaborator',    icon: '🔗', color: '#3b82f6', hint: 'Research or project partner' },
  offering_mentoring:   { label: 'Offering Mentoring',      icon: '🎓', color: '#10b981', hint: 'Guide early-career researchers' },
  seeking_mentoring:    { label: 'Seeking Mentor',          icon: '📚', color: '#f59e0b', hint: 'Looking for guidance and advice' },
  looking_investor:     { label: 'Seeking Investment',      icon: '💰', color: '#22c55e', hint: 'Raising funds for a startup or project' },
  open_to_invest:       { label: 'Open to Invest',          icon: '📈', color: '#14b8a6', hint: 'Angel investing or co-investing' },
  hiring:               { label: 'Hiring',                  icon: '📢', color: '#8b5cf6', hint: 'Looking for team members' },
  job_seeking:          { label: 'Open to Work',            icon: '💼', color: '#ec4899', hint: 'Exploring opportunities' },
  offering_expertise:   { label: 'Offering Expertise',      icon: '⭐', color: '#f97316', hint: 'Consulting or advisory roles' },
  seeking_expertise:    { label: 'Seeking Expertise',       icon: '🔍', color: '#06b6d4', hint: 'Need domain experts' },
  building_team:        { label: 'Building a Team',         icon: '👥', color: '#a855f7', hint: 'Assembling a project team' },
  open_to_freelance:    { label: 'Open to Freelance',       icon: '🚀', color: '#64748b', hint: 'Available for short-term projects' },
};

const ALL_INTENTS = Object.keys(INTENT_CONFIG) as IntentType[];

interface IntentCardSelectorProps {
  selected: IntentEntry[];
  onChange: (intents: IntentEntry[]) => void;
  maxSelect?: number;
}

export const IntentCardSelector: React.FC<IntentCardSelectorProps> = ({
  selected, onChange, maxSelect = 6,
}) => {
  const { colors, isDark } = useTheme();

  const isSelected = (type: IntentType) => selected.some(i => i.type === type);

  const toggle = (type: IntentType) => {
    if (isSelected(type)) {
      onChange(selected.filter(i => i.type !== type));
    } else if (selected.length < maxSelect) {
      onChange([...selected, { type }]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <p style={{ margin: 0, fontSize: '12px', color: colors.textSecondary }}>
        Select up to {maxSelect} intents that describe what you are currently looking for or offering.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '8px' }}>
        {ALL_INTENTS.map(type => {
          const cfg = INTENT_CONFIG[type];
          const active = isSelected(type);
          const disabled = !active && selected.length >= maxSelect;
          return (
            <button
              key={type}
              onClick={() => !disabled && toggle(type)}
              title={cfg.hint}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 12px', borderRadius: '10px', cursor: disabled ? 'not-allowed' : 'pointer',
                border: active ? `2px solid ${cfg.color}` : `1px solid ${colors.borderPrimary}`,
                background: active
                  ? `${cfg.color}18`
                  : isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                opacity: disabled ? 0.45 : 1,
                textAlign: 'left',
                transition: 'all 0.18s',
              }}
            >
              <span style={{ fontSize: '18px', flexShrink: 0 }}>{cfg.icon}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: '12px', fontWeight: 600,
                  color: active ? cfg.color : colors.textPrimary,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {cfg.label}
                </div>
                <div style={{ fontSize: '10px', color: colors.textMuted, marginTop: '1px', lineHeight: 1.3 }}>
                  {cfg.hint}
                </div>
              </div>
              {active && (
                <span style={{
                  marginLeft: 'auto', flexShrink: 0,
                  width: '16px', height: '16px', borderRadius: '50%',
                  background: cfg.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px', color: '#fff', fontWeight: 700,
                }}>✓</span>
              )}
            </button>
          );
        })}
      </div>
      {selected.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
          {selected.map(i => {
            const cfg = INTENT_CONFIG[i.type];
            return (
              <span
                key={i.type}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  padding: '3px 10px', borderRadius: '20px', fontSize: '11px',
                  background: `${cfg.color}20`, color: cfg.color,
                  border: `1px solid ${cfg.color}40`, fontWeight: 500,
                }}
              >
                {cfg.icon} {cfg.label}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};
