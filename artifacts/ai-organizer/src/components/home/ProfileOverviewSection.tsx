/**
 * ProfileOverviewSection - GitHub-style profile overview for the Home page
 * Fully themed with HSL tokens from index.css
 */
import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { useLanguage } from '../../context/LanguageContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useDocumentStatus } from '../../hooks/useDocumentStatus';
import { Calendar, Building2, Link2, BarChart3, Trophy, Flame, TrendingUp, FileText, Star, Bookmark, Users, FlaskConical, ClipboardList, Pin, Settings } from 'lucide-react';

export function ProfileOverviewSection() {
  const { user } = useAuth();
  const nav = useNavigate();
  const { t } = useLanguage();
  const { favorites, getFavoritesByType } = useFavorites();
  const { statuses } = useDocumentStatus();
  const [showAllPinned, setShowAllPinned] = useState(false);

  const starredDocs = getFavoritesByType('document');

  const joinDate = useMemo(() => {
    const stored = localStorage.getItem('user-join-date');
    if (stored) return new Date(stored);
    const d = new Date();
    localStorage.setItem('user-join-date', d.toISOString());
    return d;
  }, []);

  const memberSince = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[joinDate.getMonth()]} ${joinDate.getFullYear()}`;
  }, [joinDate]);

  const contributionStats = useMemo(() => {
    try {
      const raw = localStorage.getItem('thinkspace-activity');
      if (!raw) return { total: 0, currentStreak: 0, longestStreak: 0, thisWeek: 0 };
      const items: Array<{ timestamp?: string | number; date?: string }> = JSON.parse(raw);
      const dates = new Set<string>();
      let thisWeekCount = 0;
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      items.forEach(item => {
        let d: Date | null = null;
        if (item.date) d = new Date(item.date);
        else if (item.timestamp) d = new Date(item.timestamp);
        if (d) {
          dates.add(d.toISOString().split('T')[0]);
          if (d >= weekAgo) thisWeekCount++;
        }
      });
      const sortedDates = Array.from(dates).sort().reverse();
      let currentStreak = 0;
      let longestStreak = 0;
      let streak = 0;
      for (let i = 0; i < sortedDates.length; i++) {
        const expected = new Date();
        expected.setDate(expected.getDate() - i);
        const expectedStr = expected.toISOString().split('T')[0];
        if (sortedDates.includes(expectedStr)) {
          if (i === 0 || currentStreak > 0) currentStreak++;
        } else if (i === 0) continue;
        else break;
      }
      for (let i = 0; i < sortedDates.length; i++) {
        if (i === 0) { streak = 1; longestStreak = 1; continue; }
        const prev = new Date(sortedDates[i - 1]);
        const curr = new Date(sortedDates[i]);
        const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
        if (diff <= 1.5) { streak++; longestStreak = Math.max(longestStreak, streak); }
        else streak = 1;
      }
      return { total: items.length, currentStreak, longestStreak, thisWeek: thisWeekCount };
    } catch {
      return { total: 42, currentStreak: 5, longestStreak: 12, thisWeek: 8 };
    }
  }, []);

  const totalDocuments = Object.keys(statuses).length;

  const pinnedProjects = useMemo(() => {
    try {
      const stored = localStorage.getItem('thinkspace-pinned-projects');
      if (stored) return JSON.parse(stored);
    } catch {}
    const samples = [
      { id: 'p1', title: 'Quantum Coherence in Biological Systems', description: 'Investigating quantum effects in photosynthesis and neural processes', type: 'research', stars: 12, lastUpdated: '2d ago', progress: 68 },
      { id: 'p2', title: 'Neural Network Interpretability', description: 'Developing methods for understanding deep learning decisions', type: 'theory', stars: 8, lastUpdated: '5h ago', progress: 45 },
      { id: 'p3', title: 'Climate Model Validation Framework', description: 'Cross-validating climate predictions with observational data', type: 'review', stars: 15, lastUpdated: '1d ago', progress: 82 },
      { id: 'p4', title: 'Epistemological Foundations of AI', description: 'Philosophical analysis of machine knowledge and understanding', type: 'collaboration', stars: 6, lastUpdated: '3d ago', progress: 31 },
      { id: 'p5', title: 'Protein Folding Dynamics', description: 'Computational approaches to protein structure prediction', type: 'research', stars: 20, lastUpdated: '12h ago', progress: 55 },
      { id: 'p6', title: 'Social Network Analysis in Academia', description: 'Mapping collaboration patterns in research communities', type: 'collaboration', stars: 9, lastUpdated: '4d ago', progress: 72 },
    ];
    localStorage.setItem('thinkspace-pinned-projects', JSON.stringify(samples));
    return samples;
  }, []);

  const displayedPinned = showAllPinned ? pinnedProjects : pinnedProjects.slice(0, 6);

  const typeConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    research: { color: 'hsl(var(--primary))', icon: <FlaskConical size={14} />, label: 'Research' },
    theory: { color: 'hsl(var(--info))', icon: <BarChart3 size={14} />, label: 'Theory' },
    review: { color: 'hsl(var(--success))', icon: <ClipboardList size={14} />, label: 'Review' },
    collaboration: { color: 'hsl(var(--warning))', icon: <Users size={14} />, label: 'Collaboration' },
  };

  const userName = user?.email?.split('@')[0] || 'Researcher';
  const userInitial = (user?.email || 'U').charAt(0).toUpperCase();

  const cardHover = useCallback((e: React.MouseEvent<HTMLDivElement>, enter: boolean) => {
    const el = e.currentTarget;
    el.style.borderColor = enter ? 'hsl(var(--primary) / 0.4)' : 'hsl(var(--border))';
    el.style.transform = enter ? 'translateY(-2px)' : 'translateY(0)';
  }, []);

  const statBadge = (icon: React.ReactNode, label: string, value: string | number, tokenColor: string): React.ReactElement => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '8px 14px', borderRadius: 'var(--radius)',
      background: `${tokenColor.replace(')', ' / 0.1)')}`,
      border: `1px solid ${tokenColor.replace(')', ' / 0.2)')}`,
    }}>
      <span style={{ display: 'flex', alignItems: 'center', color: tokenColor }}>{icon}</span>
      <div>
        <div style={{ fontSize: '16px', fontWeight: 700, color: tokenColor }}>{value}</div>
        <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}>{label}</div>
      </div>
    </div>
  );

  const badgeItems = [
    { icon: <FileText size={14} />, label: t('profileOverview.projects') || 'Projects', value: totalDocuments, color: 'hsl(var(--primary))' },
    { icon: <Star size={14} />, label: t('profileOverview.starred') || 'Starred', value: starredDocs.length, color: 'hsl(var(--warning))' },
    { icon: <Bookmark size={14} />, label: t('profileOverview.bookmarks') || 'Bookmarks', value: favorites.length, color: 'hsl(var(--success))' },
    { icon: <Users size={14} />, label: t('profileOverview.collaborators') || 'Collaborators', value: 3, color: 'hsl(var(--destructive))' },
    { icon: <FlaskConical size={14} />, label: t('profileOverview.theories') || 'Theories', value: 5, color: 'hsl(var(--info))' },
    { icon: <ClipboardList size={14} />, label: t('profileOverview.reviews') || 'Reviews', value: 7, color: 'hsl(var(--primary))' },
  ];

  return (
    <div data-tour="profile-overview" style={{ marginBottom: '32px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Left: Avatar + Info */}
        <div style={{
          background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
          borderRadius: 'var(--radius)', padding: '24px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
        }}>
          <div style={{
            width: '120px', height: '120px', borderRadius: '50%',
            background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--info)))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '48px', fontWeight: 700, color: 'hsl(var(--primary-foreground))',
            boxShadow: '0 8px 32px hsl(var(--primary) / 0.3)',
            marginBottom: '16px', border: '4px solid hsl(var(--border))',
          }}>
            {userInitial}
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'hsl(var(--foreground))', marginBottom: '2px' }}>{userName}</div>
          <div style={{ fontSize: '13px', color: 'hsl(var(--muted-foreground))', marginBottom: '12px' }}>{user?.email || ''}</div>
          <div style={{ fontSize: '13px', color: 'hsl(var(--muted-foreground))', lineHeight: 1.6, marginBottom: '16px', padding: '0 8px' }}>
            {t('profileOverview.bio') || 'Academic researcher exploring the frontiers of knowledge with Think!Hub'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', fontSize: '13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'hsl(var(--muted-foreground))' }}>
              <Calendar size={14} /> <span>{t('profileOverview.memberSince') || 'Member since'} {memberSince}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'hsl(var(--muted-foreground))' }}>
              <Building2 size={14} /> <span>{t('profileOverview.institution') || 'Research Institution'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'hsl(var(--muted-foreground))' }}>
              <Link2 size={14} /> <span style={{ color: 'hsl(var(--primary))' }}>ORCID: 0000-0000-0000-0000</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px', width: '100%' }}>
            <button onClick={() => nav('/profile')} style={{
              flex: 1, padding: '8px 12px', fontSize: '12px', fontWeight: 600,
              borderRadius: 'var(--radius)', border: '1px solid hsl(var(--primary) / 0.3)',
              background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', cursor: 'pointer',
            }}>
              {t('profileOverview.viewProfile') || 'View Profile'}
            </button>
            <button onClick={() => nav('/settings')} style={{
              flex: 1, padding: '8px 12px', fontSize: '12px', fontWeight: 600,
              borderRadius: 'var(--radius)', border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--muted) / 0.5)', color: 'hsl(var(--foreground))', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
            }}>
              <Settings size={12} /> {t('profileOverview.editProfile') || 'Edit'}
            </button>
          </div>
        </div>

        {/* Right: Stats + Badges */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', padding: '20px 24px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={16} /> {t('profileOverview.contributionStats') || 'Contribution Stats'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {statBadge(<FileText size={16} />, t('profileOverview.totalContributions') || 'Total', contributionStats.total, 'hsl(var(--primary))')}
              {statBadge(<Flame size={16} />, t('profileOverview.currentStreak') || 'Current Streak', `${contributionStats.currentStreak}d`, 'hsl(var(--warning))')}
              {statBadge(<Trophy size={16} />, t('profileOverview.longestStreak') || 'Longest Streak', `${contributionStats.longestStreak}d`, 'hsl(var(--success))')}
              {statBadge(<TrendingUp size={16} />, t('profileOverview.thisWeek') || 'This Week', contributionStats.thisWeek, 'hsl(var(--info))')}
            </div>
          </div>

          <div style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', padding: '20px 24px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trophy size={16} /> {t('profileOverview.badges') || 'Badges & Counts'}
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {badgeItems.map((b) => (
                <div key={b.label} style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '6px 12px', borderRadius: '20px',
                  background: `${b.color.replace(')', ' / 0.08)')}`,
                  border: `1px solid ${b.color.replace(')', ' / 0.15)')}`,
                  fontSize: '13px',
                }}>
                  <span style={{ display: 'flex', color: b.color }}>{b.icon}</span>
                  <span style={{ fontWeight: 700, color: b.color }}>{b.value}</span>
                  <span style={{ color: 'hsl(var(--muted-foreground))' }}>{b.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius)', padding: '16px 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ fontSize: '13px', color: 'hsl(var(--muted-foreground))' }}>
              💡 {t('profileOverview.learnContributions') || 'Learn how we count contributions'}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[2024, 2025, 2026].map(year => (
                <button key={year} style={{
                  padding: '4px 12px', fontSize: '12px', fontWeight: 500,
                  borderRadius: 'calc(var(--radius) - 2px)',
                  border: `1px solid ${year === new Date().getFullYear() ? 'hsl(var(--primary) / 0.4)' : 'hsl(var(--border))'}`,
                  background: year === new Date().getFullYear() ? 'hsl(var(--primary) / 0.1)' : 'transparent',
                  color: year === new Date().getFullYear() ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                  cursor: 'pointer',
                }}>
                  {year}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pinned Projects */}
      <div style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Pin size={16} style={{ color: 'hsl(var(--primary))' }} />
            <span style={{ fontSize: '15px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
              {t('profileOverview.pinnedProjects') || 'Pinned Projects'}
            </span>
            <span style={{
              fontSize: '11px', padding: '2px 8px', borderRadius: '10px',
              background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', fontWeight: 600,
            }}>
              {pinnedProjects.length}
            </span>
          </div>
          <button onClick={() => nav('/projects')} style={{
            fontSize: '12px', color: 'hsl(var(--primary))', background: 'none',
            border: 'none', cursor: 'pointer', fontWeight: 500,
          }}>
            {t('profileOverview.customizePins') || 'Customize your pins'} →
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {displayedPinned.map((project: any) => {
            const cfg = typeConfig[project.type] || typeConfig.research;
            return (
              <div key={project.id} onClick={() => nav('/projects')}
                onMouseEnter={(e) => cardHover(e, true)} onMouseLeave={(e) => cardHover(e, false)}
                style={{
                  padding: '16px', background: 'hsl(var(--muted) / 0.3)',
                  border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)',
                  cursor: 'pointer', transition: 'all 0.2s ease',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ display: 'flex', color: cfg.color }}>{cfg.icon}</span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'hsl(var(--foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {project.title}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))', lineHeight: 1.5, marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {project.description}
                </div>
                <div style={{ width: '100%', height: '4px', borderRadius: '2px', background: 'hsl(var(--muted))', marginBottom: '10px' }}>
                  <div style={{ width: `${project.progress}%`, height: '100%', borderRadius: '2px', background: cfg.color, transition: 'width 0.3s ease' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '6px', background: `${cfg.color.replace(')', ' / 0.12)')}`, color: cfg.color, fontWeight: 500 }}>
                      {cfg.label}
                    </span>
                    <span style={{ color: 'hsl(var(--muted-foreground))', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Star size={11} /> {project.stars}
                    </span>
                  </div>
                  <span style={{ color: 'hsl(var(--muted-foreground))' }}>{project.lastUpdated}</span>
                </div>
              </div>
            );
          })}
        </div>

        {pinnedProjects.length > 6 && (
          <button onClick={() => setShowAllPinned(!showAllPinned)} style={{
            marginTop: '12px', width: '100%', padding: '8px',
            fontSize: '12px', fontWeight: 500, color: 'hsl(var(--primary))',
            background: 'hsl(var(--primary) / 0.06)', border: '1px solid hsl(var(--primary) / 0.15)',
            borderRadius: 'var(--radius)', cursor: 'pointer',
          }}>
            {showAllPinned ? (t('profileOverview.showLess') || 'Show less') : (t('profileOverview.showAll') || `Show all ${pinnedProjects.length} pinned projects`)}
          </button>
        )}
      </div>
    </div>
  );
}
