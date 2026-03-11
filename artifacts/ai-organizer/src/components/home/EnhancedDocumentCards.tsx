/**
 * EnhancedDocumentCards - GitHub-style document cards for the Home page
 * Status badges, contributor avatars, open tasks, progress bars
 */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

const accent = '#6366f1';

type CardStatus = 'active' | 'completed' | 'stalled' | 'archived';

interface TaskItem {
  id: string;
  title: string;
  done: boolean;
}

interface Contributor {
  name: string;
  initials: string;
  color: string;
}

interface EnhancedCard {
  id: string;
  title: string;
  description: string;
  status: CardStatus;
  progress: number;
  stars: number;
  forks: number;
  language: string;
  languageColor: string;
  updatedAt: string;
  contributors: Contributor[];
  tasks: TaskItem[];
  tags: string[];
}

const STATUS_CONFIG: Record<CardStatus, { icon: string; color: string; bg: string; label: string }> = {
  active: { icon: '🟢', color: '#10b981', bg: 'rgba(16,185,129,0.15)', label: 'Active' },
  completed: { icon: '✅', color: '#6366f1', bg: 'rgba(99,102,241,0.15)', label: 'Completed' },
  stalled: { icon: '⏸️', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', label: 'Stalled' },
  archived: { icon: '📦', color: '#6b7280', bg: 'rgba(107,114,128,0.15)', label: 'Archived' },
};

const AVATAR_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#14b8a6'];

function generateCards(): EnhancedCard[] {
  return [
    {
      id: 'ec1', title: 'Quantum Coherence in Biological Systems',
      description: 'Investigating quantum effects in photosynthesis and bird navigation mechanisms',
      status: 'active', progress: 72, stars: 47, forks: 12,
      language: 'Research', languageColor: '#6366f1',
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
      contributors: [
        { name: 'Dr. Smith', initials: 'DS', color: AVATAR_COLORS[0] },
        { name: 'Prof. Chen', initials: 'PC', color: AVATAR_COLORS[1] },
        { name: 'Dr. Johnson', initials: 'DJ', color: AVATAR_COLORS[2] },
        { name: 'Dr. Lee', initials: 'DL', color: AVATAR_COLORS[3] },
      ],
      tasks: [
        { id: 't1', title: 'Literature review update', done: true },
        { id: 't2', title: 'Experimental protocol design', done: true },
        { id: 't3', title: 'Data collection phase 1', done: false },
        { id: 't4', title: 'Statistical analysis', done: false },
        { id: 't5', title: 'Peer review submission', done: false },
      ],
      tags: ['quantum', 'biology', 'photosynthesis'],
    },
    {
      id: 'ec2', title: 'Neural Network Interpretability Framework',
      description: 'Building tools to understand and explain deep learning model decisions',
      status: 'active', progress: 58, stars: 35, forks: 8,
      language: 'Theory', languageColor: '#8b5cf6',
      updatedAt: new Date(Date.now() - 14400000).toISOString(),
      contributors: [
        { name: 'Prof. Wilson', initials: 'PW', color: AVATAR_COLORS[4] },
        { name: 'Dr. Park', initials: 'DP', color: AVATAR_COLORS[5] },
      ],
      tasks: [
        { id: 't6', title: 'Attention visualization module', done: true },
        { id: 't7', title: 'Feature attribution methods', done: true },
        { id: 't8', title: 'Benchmark dataset creation', done: false },
        { id: 't9', title: 'User study design', done: false },
      ],
      tags: ['AI', 'interpretability', 'deep-learning'],
    },
    {
      id: 'ec3', title: 'Climate Model Validation Framework',
      description: 'Cross-validating climate prediction models against historical data',
      status: 'completed', progress: 100, stars: 62, forks: 19,
      language: 'Analysis', languageColor: '#10b981',
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
      contributors: [
        { name: 'Dr. Martinez', initials: 'DM', color: AVATAR_COLORS[6] },
        { name: 'Prof. Chen', initials: 'PC', color: AVATAR_COLORS[1] },
        { name: 'Dr. Kim', initials: 'DK', color: AVATAR_COLORS[7] },
      ],
      tasks: [
        { id: 't10', title: 'Data preprocessing pipeline', done: true },
        { id: 't11', title: 'Model comparison framework', done: true },
        { id: 't12', title: 'Validation report', done: true },
      ],
      tags: ['climate', 'validation', 'modeling'],
    },
    {
      id: 'ec4', title: 'Protein Folding Dynamics Simulation',
      description: 'Computational approaches to predicting protein tertiary structure',
      status: 'stalled', progress: 34, stars: 28, forks: 5,
      language: 'Simulation', languageColor: '#f59e0b',
      updatedAt: new Date(Date.now() - 259200000).toISOString(),
      contributors: [
        { name: 'Dr. Lee', initials: 'DL', color: AVATAR_COLORS[3] },
      ],
      tasks: [
        { id: 't13', title: 'Force field parameterization', done: true },
        { id: 't14', title: 'MD simulation setup', done: false },
        { id: 't15', title: 'Energy minimization', done: false },
        { id: 't16', title: 'Trajectory analysis', done: false },
        { id: 't17', title: 'Visualization pipeline', done: false },
        { id: 't18', title: 'Results validation', done: false },
      ],
      tags: ['protein', 'molecular-dynamics', 'bioinformatics'],
    },
    {
      id: 'ec5', title: 'Epistemological Foundations of AI',
      description: 'Philosophical analysis of machine knowledge and understanding',
      status: 'active', progress: 45, stars: 19, forks: 3,
      language: 'Philosophy', languageColor: '#ec4899',
      updatedAt: new Date(Date.now() - 172800000).toISOString(),
      contributors: [
        { name: 'Prof. Wilson', initials: 'PW', color: AVATAR_COLORS[4] },
        { name: 'Dr. Smith', initials: 'DS', color: AVATAR_COLORS[0] },
        { name: 'Dr. Martinez', initials: 'DM', color: AVATAR_COLORS[6] },
      ],
      tasks: [
        { id: 't19', title: 'Conceptual framework', done: true },
        { id: 't20', title: 'Case study analysis', done: true },
        { id: 't21', title: 'Argument mapping', done: false },
        { id: 't22', title: 'Peer commentary', done: false },
      ],
      tags: ['philosophy', 'epistemology', 'AI-ethics'],
    },
    {
      id: 'ec6', title: 'Social Network Analysis Toolkit',
      description: 'Graph-based analysis of academic collaboration networks',
      status: 'archived', progress: 100, stars: 41, forks: 14,
      language: 'Analysis', languageColor: '#10b981',
      updatedAt: new Date(Date.now() - 604800000).toISOString(),
      contributors: [
        { name: 'Dr. Park', initials: 'DP', color: AVATAR_COLORS[5] },
        { name: 'Dr. Kim', initials: 'DK', color: AVATAR_COLORS[7] },
      ],
      tasks: [
        { id: 't23', title: 'Network extraction', done: true },
        { id: 't24', title: 'Centrality metrics', done: true },
        { id: 't25', title: 'Community detection', done: true },
        { id: 't26', title: 'Visualization dashboard', done: true },
      ],
      tags: ['networks', 'graph-theory', 'collaboration'],
    },
  ];
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function EnhancedDocumentCards() {
  const nav = useNavigate();
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();

  const textColor = isDark ? '#eaeaea' : colors.textPrimary;
  const textMuted = isDark ? 'rgba(255,255,255,0.6)' : colors.textSecondary;
  const bgCard = isDark ? 'rgba(255,255,255,0.03)' : colors.bgCard;
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : colors.borderPrimary;
  const trackBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)';
  const [statusFilter, setStatusFilter] = useState<CardStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const cards = useMemo(() => generateCards(), []);

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return cards;
    return cards.filter(c => c.status === statusFilter);
  }, [cards, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: cards.length };
    cards.forEach(c => { counts[c.status] = (counts[c.status] || 0) + 1; });
    return counts;
  }, [cards]);

  return (
    <div style={{ marginBottom: '32px' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '16px', paddingBottom: '12px',
        borderBottom: `1px solid ${borderColor}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '18px', fontWeight: 700, color: textColor }}>
            🗂️ {t('enhCards.title') || 'Project Cards'}
          </span>
          <span style={{
            fontSize: '12px', padding: '2px 10px', borderRadius: '10px',
            background: `${accent}20`,
            color: isDark ? '#a5b4fc' : colors.accentPrimary,
            fontWeight: 600,
          }}>
            {cards.length}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {(['grid', 'list'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                padding: '5px 10px', fontSize: '11px', fontWeight: 500,
                borderRadius: '6px', cursor: 'pointer',
                border: `1px solid ${viewMode === mode ? accent + '50' : borderColor}`,
                background: viewMode === mode ? `${accent}15` : 'transparent',
                color: viewMode === mode ? '#a5b4fc' : textMuted,
              }}
            >
              {mode === 'grid' ? '▦' : '☰'} {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Status filter pills */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setStatusFilter('all')}
          style={{
            padding: '4px 10px', fontSize: '11px', fontWeight: 500,
            borderRadius: '16px', cursor: 'pointer',
            border: `1px solid ${statusFilter === 'all' ? accent + '50' : borderColor}`,
            background: statusFilter === 'all' ? `${accent}20` : 'transparent',
            color: statusFilter === 'all' ? (isDark ? '#a5b4fc' : colors.accentPrimary) : textMuted,
          }}
        >
          {t('enhCards.all') || 'All'} ({statusCounts.all})
        </button>
        {(Object.entries(STATUS_CONFIG) as [CardStatus, typeof STATUS_CONFIG[CardStatus]][]).map(([status, cfg]) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            style={{
              padding: '4px 10px', fontSize: '11px', fontWeight: 500,
              borderRadius: '16px', cursor: 'pointer',
              border: `1px solid ${statusFilter === status ? cfg.color + '50' : borderColor}`,
              background: statusFilter === status ? `${cfg.color}20` : 'transparent',
              color: statusFilter === status ? cfg.color : textMuted,
            }}
          >
            {cfg.icon} {t(`enhCards.status.${status}`) || cfg.label}
            {statusCounts[status] ? ` (${statusCounts[status]})` : ''}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div style={{
        display: viewMode === 'grid' ? 'grid' : 'flex',
        gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(340px, 1fr))' : undefined,
        flexDirection: viewMode === 'list' ? 'column' : undefined,
        gap: '16px',
      }}>
        {filtered.map((card) => {
          const sts = STATUS_CONFIG[card.status];
          const doneTasks = card.tasks.filter(t => t.done).length;
          const totalTasks = card.tasks.length;

          return (
            <div
              key={card.id}
              onClick={() => nav('/projects')}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${sts.color}40`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = borderColor; e.currentTarget.style.transform = 'translateY(0)'; }}
              style={{
                padding: '18px',
                background: bgCard,
                border: `1px solid ${borderColor}`,
                borderRadius: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {/* Top row: title + status */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 600, color: '#a5b4fc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                      {card.title}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: textMuted, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>
                    {card.description}
                  </div>
                </div>
                <span style={{
                  fontSize: '10px', padding: '3px 8px', borderRadius: '6px',
                  background: sts.bg, color: sts.color,
                  fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0, marginLeft: '8px',
                }}>
                  {sts.icon} {sts.label}
                </span>
              </div>

              {/* Tags */}
              <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', flexWrap: 'wrap' }}>
                {card.tags.map(tag => (
                  <span key={tag} style={{
                    fontSize: '10px', padding: '2px 8px', borderRadius: '12px',
                    background: `${accent}10`, color: '#a5b4fc',
                    border: `1px solid ${accent}20`,
                  }}>
                    {tag}
                  </span>
                ))}
              </div>

              {/* Progress bar */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', color: textMuted }}>
                    {t('enhCards.progress') || 'Progress'}
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: sts.color }}>
                    {card.progress}%
                  </span>
                </div>
                <div style={{
                  height: '6px', borderRadius: '3px',
                  background: trackBg,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', borderRadius: '3px',
                    width: `${card.progress}%`,
                    background: `linear-gradient(90deg, ${sts.color}, ${sts.color}cc)`,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>

              {/* Tasks */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', color: textMuted, marginBottom: '6px' }}>
                  📋 {doneTasks}/{totalTasks} {t('enhCards.tasksComplete') || 'tasks complete'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {card.tasks.slice(0, 3).map(task => (
                    <div key={task.id} style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      fontSize: '11px',
                    }}>
                      <span style={{
                        width: '14px', height: '14px', borderRadius: '3px',
                        border: `1px solid ${task.done ? '#10b981' : borderColor}`,
                        background: task.done ? 'rgba(16,185,129,0.2)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#10b981', fontSize: '9px', flexShrink: 0,
                      }}>
                        {task.done ? '✓' : ''}
                      </span>
                      <span style={{
                        color: task.done
                          ? (isDark ? 'rgba(255,255,255,0.4)' : colors.textMuted)
                          : textMuted,
                        textDecoration: task.done ? 'line-through' : 'none',
                      }}>
                        {task.title}
                      </span>
                    </div>
                  ))}
                  {card.tasks.length > 3 && (
                    <span style={{ fontSize: '10px', color: textMuted, paddingLeft: '20px' }}>
                      +{card.tasks.length - 3} {t('enhCards.moreTasks') || 'more'}
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom row: contributors, stats, time */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                paddingTop: '10px', borderTop: `1px solid ${borderColor}`,
              }}>
                {/* Contributors */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {card.contributors.slice(0, 4).map((c, i) => (
                    <div
                      key={c.name}
                      title={c.name}
                      style={{
                        width: '24px', height: '24px', borderRadius: '50%',
                        background: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '9px', fontWeight: 700, color: '#fff',
                        border: '2px solid rgba(0,0,0,0.3)',
                        marginLeft: i > 0 ? '-6px' : '0',
                        zIndex: 4 - i,
                        position: 'relative',
                      }}
                    >
                      {c.initials}
                    </div>
                  ))}
                  {card.contributors.length > 4 && (
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '50%',
                      background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '9px', color: textMuted, marginLeft: '-6px',
                      border: isDark ? '2px solid rgba(0,0,0,0.3)' : '2px solid rgba(255,255,255,0.8)', position: 'relative',
                    }}>
                      +{card.contributors.length - 4}
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', color: textMuted }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <span style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: card.languageColor, display: 'inline-block',
                    }} />
                    {card.language}
                  </span>
                  <span>⭐ {card.stars}</span>
                  <span>🔀 {card.forks}</span>
                  <span>{timeAgo(card.updatedAt)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
