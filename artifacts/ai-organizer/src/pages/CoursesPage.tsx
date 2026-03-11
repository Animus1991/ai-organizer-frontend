import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useIsMobile } from '../hooks/useMediaQuery';
import { useNotifications } from '../context/NotificationContext';
import { useUserSkills } from '../context/UserSkillsContext';
import { PageShell } from '../components/layout/PageShell';
import {
  COURSES, CAT_CFG, LVL_CFG, MOD_CFG,
  loadProgress, saveProgress,
  getCoursePct, isCourseComplete, renderStars,
  type CourseCategory, type CourseLevel, type ProgressMap,
} from './CoursesPageData';

// ── XP per module ──────────────────────────────────────────────────────────────
const XP_PER_MODULE = 50;

// ── Component ──────────────────────────────────────────────────────────────────
export default function CoursesPage() {
  const { isDark } = useTheme();
  const isMobile = useIsMobile();
  const colors = {
    textPrimary: 'hsl(var(--foreground))',
    textSecondary: 'hsl(var(--muted-foreground))',
    textMuted: 'hsl(var(--muted-foreground) / 0.7)',
    borderPrimary: 'hsl(var(--border))',
    bgCard: 'hsl(var(--card))',
    bgSecondary: 'hsl(var(--secondary))',
  };
  const { addNotification } = useNotifications();
  const { skillsProfile } = useUserSkills();

  const [progress, setProgress] = useState<ProgressMap>(loadProgress);
  const [search, setSearch]         = useState('');
  const [filterCat, setFilterCat]   = useState<CourseCategory | 'all'>('all');
  const [filterLevel, setFilterLevel] = useState<CourseLevel | 'all'>('all');
  const [filterTab, setFilterTab]   = useState<'all' | 'enrolled' | 'featured'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const persist = useCallback((next: ProgressMap) => { setProgress(next); saveProgress(next); }, []);

  // Track module completions to fire XP milestone toasts
  const prevModsDoneRef = useRef(0);
  const totalModsDoneForXP = useMemo(() =>
    Object.values(progress).reduce((a, p) => a + p.completedModules.length, 0),
  [progress]);
  useEffect(() => {
    const earned = (totalModsDoneForXP - prevModsDoneRef.current) * XP_PER_MODULE;
    if (earned > 0) {
      addNotification({ type: 'success', title: `+${earned} XP earned!`, message: `Module completed — keep going!`, duration: 2500 });
    }
    prevModsDoneRef.current = totalModsDoneForXP;
  }, [totalModsDoneForXP, addNotification]);

  const enroll = useCallback((courseId: string) => {
    if (progress[courseId]) return;
    const next = { ...progress, [courseId]: { completedModules: [], enrolledAt: Date.now(), lastAccessedAt: Date.now() } };
    persist(next);
    const c = COURSES.find(x => x.id === courseId);
    addNotification({ type: 'success', title: '🎓 Enrolled!', message: `"${c?.title}" added to your learning path`, duration: 3000 });
  }, [progress, persist, addNotification]);

  const toggleModule = useCallback((courseId: string, moduleId: string) => {
    const cp = progress[courseId];
    if (!cp) return;
    const done = cp.completedModules.includes(moduleId)
      ? cp.completedModules.filter(id => id !== moduleId)
      : [...cp.completedModules, moduleId];
    const next = { ...progress, [courseId]: { ...cp, completedModules: done, lastAccessedAt: Date.now() } };
    persist(next);
    const course = COURSES.find(c => c.id === courseId);
    if (course && done.length === course.modules.length) {
      addNotification({ type: 'success', title: '🏆 Course Complete!', message: `You finished "${course.title}"!`, duration: 5000 });
    }
  }, [progress, persist, addNotification]);

  const unenroll = useCallback((courseId: string) => {
    const next = { ...progress };
    delete next[courseId];
    persist(next);
    if (selectedId === courseId) setSelectedId(null);
    addNotification({ type: 'info', title: 'Unenrolled', message: 'Course removed from your learning path', duration: 2500 });
  }, [progress, persist, selectedId, addNotification]);

  const filtered = useMemo(() => COURSES.filter(c => {
    if (filterTab === 'enrolled' && !progress[c.id]) return false;
    if (filterTab === 'featured' && !c.featured) return false;
    if (filterCat !== 'all' && c.category !== filterCat) return false;
    if (filterLevel !== 'all' && c.level !== filterLevel) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        c.instructor.toLowerCase().includes(q) ||
        c.tags.some(t => t.toLowerCase().includes(q)) ||
        c.description.toLowerCase().includes(q)
      );
    }
    return true;
  }), [filterTab, filterCat, filterLevel, search, progress]);

  const selected  = COURSES.find(c => c.id === selectedId);
  const selCp     = selectedId ? progress[selectedId] : undefined;
  const selPct    = selected ? getCoursePct(selected, selCp) : 0;
  const selDone   = selCp?.completedModules.length ?? 0;
  const selTotal  = selected?.modules.length ?? 0;
  const enrolled  = (id: string) => !!progress[id];
  const complete  = (id: string) => { const c = COURSES.find(x => x.id === id); return isCourseComplete(c!, progress[id]); };

  const totalEnrolled  = Object.keys(progress).length;
  const totalCompleted = COURSES.filter(c => isCourseComplete(c, progress[c.id])).length;
  const totalModsDone  = totalModsDoneForXP;

  // ── Role-based recommendations ──────────────────────────────────────────────
  const myRole = skillsProfile.role || '';
  const mySkillNames = useMemo(() => new Set(skillsProfile.skills.map(s => s.name.toLowerCase())), [skillsProfile.skills]);
  const recommended = useMemo(() => {
    return COURSES.filter(c => {
      if (progress[c.id]) return false; // already enrolled
      const tagMatch = c.tags.some(t => mySkillNames.has(t.toLowerCase()));
      const roleMatch = myRole && (
        c.tags.some(t => t.toLowerCase().includes(myRole.toLowerCase())) ||
        c.description.toLowerCase().includes(myRole.toLowerCase())
      );
      return tagMatch || roleMatch;
    }).slice(0, 3);
  }, [progress, mySkillNames, myRole]);

  // ── Style helpers ────────────────────────────────────────────────────────────
  const cardStyle = (sel = false): React.CSSProperties => ({
    background: sel ? 'hsl(var(--primary) / 0.06)' : 'hsl(var(--card))',
    border: `1px solid ${sel ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
    borderRadius: '10px', padding: '18px', cursor: 'pointer', transition: 'all 0.15s',
  });

  const btnStyle = (primary = false, danger = false): React.CSSProperties => ({
    padding: primary ? '9px 20px' : '7px 14px', borderRadius: '10px', cursor: 'pointer',
    border: danger ? '1px solid hsl(var(--destructive) / 0.4)' : primary ? 'none' : '1px solid hsl(var(--border))',
    background: danger ? 'hsl(var(--destructive) / 0.08)' : primary ? 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))' : 'hsl(var(--muted) / 0.4)',
    color: danger ? 'hsl(var(--destructive))' : primary ? '#fff' : 'hsl(var(--muted-foreground))',
    fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' as const,
  });

  const pillStyle = (active: boolean, color = '#6366f1'): React.CSSProperties => ({
    padding: '5px 12px', borderRadius: '20px', cursor: 'pointer', fontSize: '11px', fontWeight: 600,
    border: `1px solid ${active ? color : 'hsl(var(--border))'}`,
    background: active ? `${color}18` : 'transparent',
    color: active ? color : 'hsl(var(--muted-foreground) / 0.7)',
  });

  const tagStyle = (color: string): React.CSSProperties => ({
    fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: '8px',
    background: `${color}15`, color, border: `1px solid ${color}30`,
  });

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <PageShell>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: isMobile ? '16px 12px' : '32px 24px' }}>

        {/* ── Role-based Recommendations banner ── */}
        {recommended.length > 0 && (
          <div style={{ marginBottom: '24px', padding: '16px 20px', borderRadius: '10px', background: 'hsl(var(--primary) / 0.05)', border: '1px solid hsl(var(--primary) / 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '16px' }}>🎯</span>
              <span style={{ fontWeight: 700, fontSize: '13px', color: 'hsl(var(--primary))' }}>Recommended for you</span>
              {myRole && <span style={{ fontSize: '11px', color: colors.textMuted }}>based on your role: <strong>{myRole}</strong></span>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '10px' }}>
              {recommended.map(c => (
                <button key={c.id} onClick={() => { enroll(c.id); setSelectedId(c.id); }}
                  style={{ textAlign: 'left', padding: '12px 14px', borderRadius: '10px', border: `1px solid ${CAT_CFG[c.category].color}30`, background: `${CAT_CFG[c.category].color}0a`, cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'center' }}
                >
                  <span style={{ fontSize: '24px' }}>{c.thumbnail}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '12px', color: colors.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
                    <div style={{ fontSize: '10px', color: colors.textMuted }}>{c.duration} · {c.modules.length} modules</div>
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '8px', background: `${CAT_CFG[c.category].color}18`, color: CAT_CFG[c.category].color, whiteSpace: 'nowrap' }}>Enroll</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
          <div>
            <h1 style={{ margin: '0 0 6px', fontSize: '28px', fontWeight: 800, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              🎓 Learning Hub
            </h1>
            <p style={{ margin: 0, color: colors.textSecondary, fontSize: '14px' }}>Skill tracks and courses for researchers</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {([
              { label: 'Enrolled',     value: totalEnrolled,  icon: '📚', color: '#6366f1' },
              { label: 'Completed',    value: totalCompleted, icon: '🏆', color: '#22c55e' },
              { label: 'Modules Done', value: totalModsDone,  icon: '✅', color: '#f59e0b' },
            ] as const).map(s => (
              <div key={s.label} style={{ padding: '10px 18px', borderRadius: '12px', border: `1px solid ${s.color}30`, background: `${s.color}10`, textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '10px', color: colors.textMuted, fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: (!isMobile && selectedId) ? '1fr 420px' : '1fr', gap: '24px', alignItems: 'start' }}>

          {/* ── LEFT: Catalogue ── */}
          <div>
            {/* Search + tab row */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="🔍  Search courses, instructors, tags…"
                style={{ flex: '1 1 200px', padding: '9px 14px', borderRadius: '10px', border: `1px solid ${colors.borderPrimary}`, background: isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb', color: colors.textPrimary, fontSize: '13px', outline: 'none' }}
              />
              {(['all', 'enrolled', 'featured'] as const).map(t => (
                <button key={t} onClick={() => setFilterTab(t)} style={pillStyle(filterTab === t)}>
                  {t === 'enrolled' ? `📚 My Courses (${totalEnrolled})` : t === 'featured' ? '⭐ Featured' : 'All Courses'}
                </button>
              ))}
            </div>

            {/* Category + level filter row */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '18px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button onClick={() => setFilterCat('all')} style={pillStyle(filterCat === 'all')}>All</button>
              {(Object.keys(CAT_CFG) as CourseCategory[]).map(cat => (
                <button key={cat} onClick={() => setFilterCat(cat)} style={pillStyle(filterCat === cat, CAT_CFG[cat].color)}>
                  {CAT_CFG[cat].icon} {CAT_CFG[cat].label}
                </button>
              ))}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                <button onClick={() => setFilterLevel('all')} style={pillStyle(filterLevel === 'all')}>All Levels</button>
                {(['beginner', 'intermediate', 'advanced'] as CourseLevel[]).map(lv => (
                  <button key={lv} onClick={() => setFilterLevel(lv)} style={pillStyle(filterLevel === lv, LVL_CFG[lv].color)}>
                    {LVL_CFG[lv].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Course grid */}
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: colors.textMuted, fontSize: '14px' }}>
                No courses match your filters.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: '14px' }}>
                {filtered.map(course => {
                  const isEnrolled = enrolled(course.id);
                  const isComplete = complete(course.id);
                  const pct = getCoursePct(course, progress[course.id]);
                  const cat = CAT_CFG[course.category];
                  const lv  = LVL_CFG[course.level];
                  const isSel = selectedId === course.id;
                  return (
                    <div key={course.id} onClick={() => setSelectedId(isSel ? null : course.id)} style={cardStyle(isSel)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <span style={{ fontSize: '36px' }}>{course.thumbnail}</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                          {course.featured && <span style={tagStyle('#fbbf24')}>⭐ FEATURED</span>}
                          <span style={tagStyle(cat.color)}>{cat.icon} {cat.label}</span>
                          <span style={tagStyle(lv.color)}>{lv.label}</span>
                          {isComplete && <span style={tagStyle('#22c55e')}>🏆 Done</span>}
                        </div>
                      </div>

                      <div style={{ fontWeight: 700, fontSize: '14px', color: colors.textPrimary, marginBottom: '3px', lineHeight: 1.35 }}>{course.title}</div>
                      <div style={{ fontSize: '11px', color: colors.textMuted, marginBottom: '7px' }}>{course.instructorAvatar} {course.instructor}</div>
                      <p style={{ fontSize: '12px', color: colors.textSecondary, lineHeight: 1.5, margin: '0 0 10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{course.description}</p>

                      <div style={{ display: 'flex', gap: '10px', fontSize: '11px', color: colors.textMuted, marginBottom: '10px', flexWrap: 'wrap' }}>
                        <span>⏱ {course.duration}</span>
                        <span>📦 {course.modules.length} modules</span>
                        <span style={{ color: '#f59e0b' }}>★ {course.rating}</span>
                        <span>👥 {course.enrolled.toLocaleString()}</span>
                      </div>

                      {isEnrolled && (
                        <div style={{ marginBottom: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '4px' }}>
                            <span style={{ color: colors.textMuted }}>{progress[course.id].completedModules.length}/{course.modules.length} modules</span>
                            <span style={{ fontWeight: 700, color: isComplete ? '#22c55e' : '#6366f1' }}>{pct}%</span>
                          </div>
                          <div style={{ height: '4px', borderRadius: '2px', background: 'hsl(var(--muted))' }}>
                            <div style={{ height: '100%', borderRadius: '2px', width: `${pct}%`, background: isComplete ? '#22c55e' : 'linear-gradient(90deg,#6366f1,#8b5cf6)', transition: 'width 0.3s' }} />
                          </div>
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
                        {isEnrolled
                          ? <button style={btnStyle(false, false)} onClick={() => setSelectedId(isSel ? null : course.id)}>📖 Continue</button>
                          : <button style={btnStyle(true)} onClick={() => enroll(course.id)}>🎓 Enroll Free</button>
                        }
                        {isEnrolled && (
                          <button style={btnStyle(false, true)} onClick={() => unenroll(course.id)}>✕ Unenroll</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── RIGHT: Course detail panel ── */}
          {selected && (
            <div style={{ position: 'sticky', top: '24px', background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '10px', overflow: 'hidden' }}>
              {/* Panel header */}
              <div style={{ padding: '20px 20px 0', background: `linear-gradient(135deg,${CAT_CFG[selected.category].color}18,transparent)` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span style={{ fontSize: '44px' }}>{selected.thumbnail}</span>
                  <button onClick={() => setSelectedId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted, fontSize: '18px', lineHeight: 1, padding: '4px' }}>✕</button>
                </div>
                <div style={{ fontWeight: 800, fontSize: '17px', color: colors.textPrimary, marginBottom: '4px', lineHeight: 1.3 }}>{selected.title}</div>
                <div style={{ fontSize: '12px', color: colors.textMuted, marginBottom: '10px' }}>{selected.instructorAvatar} {selected.instructor}</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  <span style={tagStyle(CAT_CFG[selected.category].color)}>{CAT_CFG[selected.category].icon} {CAT_CFG[selected.category].label}</span>
                  <span style={tagStyle(LVL_CFG[selected.level].color)}>{LVL_CFG[selected.level].label}</span>
                  <span style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 700 }}>★ {selected.rating} ({renderStars(selected.rating)})</span>
                  <span style={{ fontSize: '10px', color: colors.textMuted }}>👥 {selected.enrolled.toLocaleString()} enrolled</span>
                </div>
              </div>

              <div style={{ padding: '0 20px 20px', overflowY: 'auto', maxHeight: 'calc(100vh - 220px)' }}>
                <p style={{ fontSize: '13px', color: colors.textSecondary, lineHeight: 1.6, margin: '14px 0' }}>{selected.description}</p>

                {/* Stats row */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                {[{ icon: '⏱', label: selected.duration }, { icon: '📦', label: `${selected.modules.length} modules` }].map(s => (
                    <div key={s.label} style={{ flex: 1, minWidth: '90px', padding: '8px 12px', borderRadius: '10px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--muted) / 0.3)', textAlign: 'center' }}>
                      <div style={{ fontSize: '16px' }}>{s.icon}</div>
                      <div style={{ fontSize: '11px', color: colors.textSecondary, fontWeight: 600 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Progress bar (if enrolled) */}
                {enrolled(selected.id) && (
                  <div style={{ marginBottom: '16px', padding: '12px', borderRadius: '10px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--primary) / 0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px' }}>
                      <span style={{ color: colors.textSecondary, fontWeight: 600 }}>Your Progress</span>
                      <span style={{ fontWeight: 800, color: isCourseComplete(selected, selCp) ? '#22c55e' : '#6366f1' }}>{selPct}%</span>
                    </div>
                    <div style={{ height: '6px', borderRadius: '3px', background: 'hsl(var(--muted))' }}>
                      <div style={{ height: '100%', borderRadius: '3px', width: `${selPct}%`, background: isCourseComplete(selected, selCp) ? '#22c55e' : 'linear-gradient(90deg,#6366f1,#8b5cf6)', transition: 'width 0.3s' }} />
                    </div>
                    <div style={{ fontSize: '10px', color: colors.textMuted, marginTop: '5px' }}>{selDone} of {selTotal} modules completed</div>
                  </div>
                )}

                {/* What you'll learn */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontWeight: 700, fontSize: '12px', color: colors.textPrimary, marginBottom: '8px' }}>📌 What you'll learn</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {selected.whatYouLearn.map((item, i) => (
                      <div key={i} style={{ display: 'flex', gap: '8px', fontSize: '12px', color: colors.textSecondary }}>
                        <span style={{ color: '#22c55e', flexShrink: 0 }}>✓</span>{item}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  {selected.tags.map(tag => (
                    <span key={tag} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '8px', background: 'hsl(var(--muted) / 0.5)', color: 'hsl(var(--muted-foreground))' }}>{tag}</span>
                  ))}
                </div>

                {/* Modules list */}
                <div style={{ fontWeight: 700, fontSize: '12px', color: colors.textPrimary, marginBottom: '8px' }}>📦 Modules</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                  {selected.modules.map((mod, i) => {
                    const modCfg  = MOD_CFG[mod.type];
                    const isDone  = selCp?.completedModules.includes(mod.id) ?? false;
                    const canMark = enrolled(selected.id);
                    return (
                      <div key={mod.id}
                        style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '10px 12px', borderRadius: '10px', border: `1px solid ${isDone ? '#22c55e30' : 'hsl(var(--border))'}`, background: isDone ? 'hsl(var(--success) / 0.05)' : 'hsl(var(--muted) / 0.3)', cursor: canMark ? 'pointer' : 'default', transition: 'all 0.15s' }}
                        onClick={() => canMark && toggleModule(selected.id, mod.id)}
                      >
                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, border: `2px solid ${isDone ? '#22c55e' : 'hsl(var(--border))'}`, background: isDone ? '#22c55e' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#fff', fontWeight: 700 }}>
                          {isDone ? '✓' : i + 1}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: isDone ? '#22c55e' : colors.textPrimary, marginBottom: '2px' }}>{mod.title}</div>
                          {mod.description && <div style={{ fontSize: '10px', color: colors.textMuted, lineHeight: 1.4 }}>{mod.description}</div>}
                          <div style={{ display: 'flex', gap: '8px', marginTop: '4px', fontSize: '10px', color: colors.textMuted }}>
                            <span style={{ color: modCfg.color, fontWeight: 600 }}>{modCfg.icon} {modCfg.label}</span>
                            <span>⏱ {mod.duration}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* CTA */}
                {enrolled(selected.id) ? (
                  <button style={{ ...btnStyle(false, true), width: '100%', padding: '10px', textAlign: 'center' }} onClick={() => unenroll(selected.id)}>
                    ✕ Unenroll from this course
                  </button>
                ) : (
                  <button style={{ ...btnStyle(true), width: '100%', padding: '12px', textAlign: 'center', fontSize: '14px' }} onClick={() => enroll(selected.id)}>
                    🎓 Enroll Free — Start Learning
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
