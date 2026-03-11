/**
 * SkillsEditor — inline skill taxonomy editor for ProfilePage
 * localStorage key: 'profile_skills_v1'
 * No external context. Fully self-contained.
 */
import React, { useState, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';

export type ProfLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export interface SkillEntry { name: string; proficiency: ProfLevel; }

interface SkillsEditorProps {
  skills: SkillEntry[];
  onChange: (skills: SkillEntry[]) => void;
}

const PROF_LEVELS: ProfLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];
const PROF_CONFIG: Record<ProfLevel, { label: string; color: string; bars: number }> = {
  beginner:     { label: 'Beginner',     color: '#6b7280', bars: 1 },
  intermediate: { label: 'Intermediate', color: '#3b82f6', bars: 2 },
  advanced:     { label: 'Advanced',     color: '#8b5cf6', bars: 3 },
  expert:       { label: 'Expert',       color: '#f59e0b', bars: 4 },
};

const SUGGESTED_SKILLS = [
  'Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision', 'Data Analysis',
  'Statistics', 'Python', 'R', 'Web Development', 'React', 'TypeScript',
  'Research Methods', 'Academic Writing', 'Grant Writing', 'Peer Review',
  'Bioinformatics', 'Climate Science', 'Literature Review', 'UX/UI Design',
  'Product Management', 'Project Management', 'Quantum Computing', 'Genomics',
];

export const SkillsEditor: React.FC<SkillsEditorProps> = ({ skills, onChange }) => {
  const { colors, isDark } = useTheme();
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const accent = '#6366f1';

  const addSkill = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed || skills.some(s => s.name.toLowerCase() === trimmed.toLowerCase())) return;
    onChange([...skills, { name: trimmed, proficiency: 'intermediate' }]);
    setInput('');
    setShowSuggestions(false);
  }, [skills, onChange]);

  const removeSkill = useCallback((name: string) => {
    onChange(skills.filter(s => s.name !== name));
  }, [skills, onChange]);

  const updateProficiency = useCallback((name: string, proficiency: ProfLevel) => {
    onChange(skills.map(s => s.name === name ? { ...s, proficiency } : s));
  }, [skills, onChange]);

  const filteredSuggestions = SUGGESTED_SKILLS.filter(s =>
    s.toLowerCase().includes(input.toLowerCase()) &&
    !skills.some(sk => sk.name.toLowerCase() === s.toLowerCase())
  );

  const inputStyle: React.CSSProperties = {
    flex: 1, padding: '8px 12px', borderRadius: '8px', fontSize: '13px',
    border: `1px solid ${colors.borderPrimary}`,
    background: isDark ? 'rgba(255,255,255,0.05)' : '#fff',
    color: colors.textPrimary, outline: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Input row */}
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            value={input}
            onChange={e => { setInput(e.target.value); setShowSuggestions(true); }}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(input); } }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Add a skill (e.g. Machine Learning)…"
            style={inputStyle}
          />
          <button
            onClick={() => addSkill(input)}
            disabled={!input.trim()}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none',
              background: input.trim() ? accent : colors.borderPrimary,
              color: input.trim() ? '#fff' : colors.textMuted,
              fontSize: '13px', fontWeight: 600, cursor: input.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            Add
          </button>
        </div>
        {/* Suggestions dropdown */}
        {showSuggestions && input.length > 0 && filteredSuggestions.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
            background: isDark ? colors.bgSecondary : '#fff',
            border: `1px solid ${colors.borderPrimary}`, borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)', marginTop: '4px', overflow: 'hidden',
          }}>
            {filteredSuggestions.slice(0, 6).map(s => (
              <div
                key={s}
                onMouseDown={() => addSkill(s)}
                style={{
                  padding: '9px 14px', fontSize: '13px', cursor: 'pointer',
                  color: colors.textPrimary,
                  borderBottom: `1px solid ${colors.borderPrimary}`,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(99,102,241,0.06)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {s}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick add chips */}
      {skills.length < 3 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {SUGGESTED_SKILLS.filter(s => !skills.some(sk => sk.name === s)).slice(0, 6).map(s => (
            <button
              key={s}
              onClick={() => addSkill(s)}
              style={{
                padding: '4px 10px', borderRadius: '20px', fontSize: '11px',
                border: `1px dashed ${colors.borderPrimary}`,
                background: 'transparent', color: colors.textSecondary, cursor: 'pointer',
              }}
            >
              + {s}
            </button>
          ))}
        </div>
      )}

      {/* Skill list */}
      {skills.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {skills.map(skill => {
            const cfg = PROF_CONFIG[skill.proficiency];
            return (
              <div
                key={skill.name}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '8px 12px', borderRadius: '8px',
                  background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  border: `1px solid ${colors.borderPrimary}`,
                }}
              >
                {/* Proficiency bars */}
                <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                  {[1, 2, 3, 4].map(n => (
                    <div
                      key={n}
                      style={{
                        width: '4px', height: '16px', borderRadius: '2px',
                        background: n <= cfg.bars ? cfg.color : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
                      }}
                    />
                  ))}
                </div>
                {/* Name */}
                <span style={{ flex: 1, fontSize: '13px', fontWeight: 500, color: colors.textPrimary }}>
                  {skill.name}
                </span>
                {/* Proficiency selector */}
                <select
                  value={skill.proficiency}
                  onChange={e => updateProficiency(skill.name, e.target.value as ProfLevel)}
                  style={{
                    padding: '3px 6px', borderRadius: '6px', fontSize: '11px',
                    border: `1px solid ${cfg.color}40`,
                    background: `${cfg.color}15`, color: cfg.color,
                    outline: 'none', cursor: 'pointer',
                  }}
                >
                  {PROF_LEVELS.map(l => (
                    <option key={l} value={l}>{PROF_CONFIG[l].label}</option>
                  ))}
                </select>
                {/* Remove */}
                <button
                  onClick={() => removeSkill(skill.name)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '14px', color: colors.textMuted, padding: '0 2px',
                    lineHeight: 1,
                  }}
                  title="Remove skill"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

      {skills.length === 0 && (
        <p style={{ fontSize: '12px', color: colors.textMuted, margin: 0, fontStyle: 'italic' }}>
          Add skills to showcase your expertise and improve profile matching.
        </p>
      )}
    </div>
  );
};
