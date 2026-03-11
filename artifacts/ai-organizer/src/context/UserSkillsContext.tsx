/**
 * UserSkillsContext — shared Skills Taxonomy + Intent Cards layer
 * localStorage key: profile_skills_v1 (same key as ProfilePage so data is shared)
 */
import React, { createContext, useContext, useState, useCallback } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
export type ProfLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type IntentType =
  | 'looking_cofounder' | 'looking_collaborator' | 'offering_mentoring'
  | 'seeking_mentoring' | 'looking_investor' | 'open_to_invest'
  | 'hiring' | 'job_seeking' | 'offering_expertise' | 'seeking_expertise'
  | 'building_team' | 'open_to_freelance';

export interface SkillEntry { name: string; proficiency: ProfLevel; category?: string; }
export interface IntentEntry { type: IntentType; description?: string; }
export interface SkillsProfile {
  skills: SkillEntry[];
  intents: IntentEntry[];
  availableForCollab: boolean;
  availableAsMentor: boolean;
  availabilityHoursPerWeek: number;
  remoteOk: boolean;
  stagePrefs: string[];
  role: string;
}

export const INTENT_LABELS: Record<IntentType, { label: string; icon: string; color: string }> = {
  looking_cofounder:    { label: 'Looking for Co-founder', icon: '🤝', color: '#6366f1' },
  looking_collaborator: { label: 'Seeking Collaborator',   icon: '🔗', color: '#3b82f6' },
  offering_mentoring:   { label: 'Offering Mentoring',     icon: '🎓', color: '#10b981' },
  seeking_mentoring:    { label: 'Seeking Mentor',          icon: '📚', color: '#f59e0b' },
  looking_investor:     { label: 'Seeking Investment',      icon: '💰', color: '#22c55e' },
  open_to_invest:       { label: 'Open to Invest',          icon: '📈', color: '#14b8a6' },
  hiring:               { label: 'Hiring',                  icon: '📢', color: '#8b5cf6' },
  job_seeking:          { label: 'Open to Work',            icon: '💼', color: '#ec4899' },
  offering_expertise:   { label: 'Offering Expertise',      icon: '⭐', color: '#f97316' },
  seeking_expertise:    { label: 'Seeking Expertise',       icon: '🔍', color: '#06b6d4' },
  building_team:        { label: 'Building a Team',         icon: '👥', color: '#a855f7' },
  open_to_freelance:    { label: 'Open to Freelance',       icon: '🚀', color: '#64748b' },
};

export const PROF_COLORS: Record<ProfLevel, string> = {
  beginner: '#6b7280', intermediate: '#3b82f6', advanced: '#8b5cf6', expert: '#f59e0b',
};

export const PROF_DOTS: Record<ProfLevel, number> = {
  beginner: 1, intermediate: 2, advanced: 3, expert: 4,
};

export const SKILL_CATEGORIES = ['Research', 'Technical', 'Design', 'Business', 'Communication', 'Domain', 'Other'];

export const SUGGESTED_SKILLS: { name: string; category: string }[] = [
  { name: 'Machine Learning', category: 'Technical' },
  { name: 'Web Development', category: 'Technical' },
  { name: 'Python', category: 'Technical' },
  { name: 'React', category: 'Technical' },
  { name: 'Data Analysis', category: 'Technical' },
  { name: 'Statistics', category: 'Research' },
  { name: 'Research Methods', category: 'Research' },
  { name: 'Literature Review', category: 'Research' },
  { name: 'Academic Writing', category: 'Communication' },
  { name: 'Grant Writing', category: 'Communication' },
  { name: 'Peer Review', category: 'Research' },
  { name: 'Product Management', category: 'Business' },
  { name: 'UX/UI Design', category: 'Design' },
  { name: 'Bioinformatics', category: 'Domain' },
  { name: 'Climate Science', category: 'Domain' },
  { name: 'NLP', category: 'Technical' },
  { name: 'Deep Learning', category: 'Technical' },
  { name: 'Fundraising', category: 'Business' },
  { name: 'Go-to-Market', category: 'Business' },
  { name: 'Public Speaking', category: 'Communication' },
];

export const STAGE_PREFS = ['Idea', 'MVP', 'Traction', 'Seed', 'Series A', 'Growth'];

const SKILLS_KEY = 'profile_skills_v1';

function loadSkillsProfile(): SkillsProfile {
  try {
    const r = localStorage.getItem(SKILLS_KEY);
    if (r) {
      const parsed = JSON.parse(r);
      return {
        skills: parsed.skills ?? [],
        intents: parsed.intents ?? [],
        availableForCollab: parsed.availableForCollab ?? true,
        availableAsMentor: parsed.availableAsMentor ?? false,
        availabilityHoursPerWeek: parsed.availabilityHoursPerWeek ?? 10,
        remoteOk: parsed.remoteOk ?? true,
        stagePrefs: parsed.stagePrefs ?? [],
        role: parsed.role ?? '',
      };
    }
  } catch {}
  return { skills: [], intents: [], availableForCollab: true, availableAsMentor: false, availabilityHoursPerWeek: 10, remoteOk: true, stagePrefs: [], role: '' };
}

function persistSkillsProfile(p: SkillsProfile) {
  try { localStorage.setItem(SKILLS_KEY, JSON.stringify(p)); } catch {}
}

// ── Context ───────────────────────────────────────────────────────────────────
interface UserSkillsContextType {
  skillsProfile: SkillsProfile;
  addSkill: (name: string, proficiency: ProfLevel, category?: string) => void;
  removeSkill: (name: string) => void;
  setSkillProf: (name: string, proficiency: ProfLevel) => void;
  addIntent: (type: IntentType, description?: string) => void;
  removeIntent: (type: IntentType) => void;
  hasIntent: (type: IntentType) => boolean;
  setAvailableForCollab: (v: boolean) => void;
  setAvailableAsMentor: (v: boolean) => void;
  setAvailabilityHours: (h: number) => void;
  setRemoteOk: (v: boolean) => void;
  setStagePrefs: (prefs: string[]) => void;
  setRole: (role: string) => void;
  updateProfile: (updater: (p: SkillsProfile) => SkillsProfile) => void;
}

const UserSkillsContext = createContext<UserSkillsContextType | null>(null);

export function UserSkillsProvider({ children }: { children: React.ReactNode }) {
  const [skillsProfile, setSkillsProfile] = useState<SkillsProfile>(loadSkillsProfile);

  const update = useCallback((updater: (p: SkillsProfile) => SkillsProfile) => {
    setSkillsProfile(prev => {
      const next = updater(prev);
      persistSkillsProfile(next);
      return next;
    });
  }, []);

  const addSkill = useCallback((name: string, proficiency: ProfLevel, category?: string) => {
    if (!name.trim()) return;
    update(p => ({
      ...p,
      skills: p.skills.find(s => s.name === name)
        ? p.skills.map(s => s.name === name ? { ...s, proficiency, category: category ?? s.category } : s)
        : [...p.skills, { name: name.trim(), proficiency, category }],
    }));
  }, [update]);

  const removeSkill = useCallback((name: string) => {
    update(p => ({ ...p, skills: p.skills.filter(s => s.name !== name) }));
  }, [update]);

  const setSkillProf = useCallback((name: string, proficiency: ProfLevel) => {
    update(p => ({ ...p, skills: p.skills.map(s => s.name === name ? { ...s, proficiency } : s) }));
  }, [update]);

  const addIntent = useCallback((type: IntentType, description?: string) => {
    update(p => ({
      ...p,
      intents: [...p.intents.filter(i => i.type !== type), { type, description }],
    }));
  }, [update]);

  const removeIntent = useCallback((type: IntentType) => {
    update(p => ({ ...p, intents: p.intents.filter(i => i.type !== type) }));
  }, [update]);

  const hasIntent = useCallback((type: IntentType) => {
    return skillsProfile.intents.some(i => i.type === type);
  }, [skillsProfile.intents]);

  const setAvailableForCollab = useCallback((v: boolean) => update(p => ({ ...p, availableForCollab: v })), [update]);
  const setAvailableAsMentor = useCallback((v: boolean) => update(p => ({ ...p, availableAsMentor: v })), [update]);
  const setAvailabilityHours = useCallback((h: number) => update(p => ({ ...p, availabilityHoursPerWeek: h })), [update]);
  const setRemoteOk = useCallback((v: boolean) => update(p => ({ ...p, remoteOk: v })), [update]);
  const setStagePrefs = useCallback((prefs: string[]) => update(p => ({ ...p, stagePrefs: prefs })), [update]);
  const setRole = useCallback((role: string) => update(p => ({ ...p, role })), [update]);

  return (
    <UserSkillsContext.Provider value={{
      skillsProfile, addSkill, removeSkill, setSkillProf,
      addIntent, removeIntent, hasIntent,
      setAvailableForCollab, setAvailableAsMentor, setAvailabilityHours,
      setRemoteOk, setStagePrefs, setRole, updateProfile: update,
    }}>
      {children}
    </UserSkillsContext.Provider>
  );
}

export function useUserSkills() {
  const ctx = useContext(UserSkillsContext);
  if (!ctx) throw new Error('useUserSkills must be used within UserSkillsProvider');
  return ctx;
}
