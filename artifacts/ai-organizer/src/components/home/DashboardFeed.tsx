/**
 * DashboardFeed - GitHub-style dashboard feed for the Home page
 * Top projects sidebar, platform updates, quick actions, trending topics
 */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

const accent = '#6366f1';

interface FeedItem {
  id: string;
  type: 'update' | 'release' | 'tip' | 'announcement' | 'feature';
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  link?: string;
}

interface TrendingTopic {
  id: string;
  name: string;
  category: string;
  mentions: number;
  trend: 'up' | 'down' | 'stable';
  color: string;
}

interface TopProject {
  id: string;
  name: string;
  description: string;
  stars: number;
  activity: number;
  language: string;
  languageColor: string;
}

function generateFeedItems(): FeedItem[] {
  return [
    { id: 'f1', type: 'release', title: 'Think!Hub v2.5 Released', description: 'New AI-powered evidence linking, improved theory validation, and 40% faster document parsing.', timestamp: new Date(Date.now() - 3600000).toISOString(), icon: '🚀' },
    { id: 'f2', type: 'feature', title: 'Cross-Project Search Now Available', description: 'Search across all your projects, documents, claims, and evidence from a single unified interface.', timestamp: new Date(Date.now() - 7200000).toISOString(), icon: '🔍' },
    { id: 'f3', type: 'tip', title: 'Pro Tip: Keyboard Shortcuts', description: 'Press Ctrl+K to open the command palette. Use G then H to go home, G then T for Theory Hub.', timestamp: new Date(Date.now() - 14400000).toISOString(), icon: '💡' },
    { id: 'f4', type: 'announcement', title: 'Community Profiles Launch', description: 'Discover researchers, follow their work, and find collaborators in the new Community section.', timestamp: new Date(Date.now() - 28800000).toISOString(), icon: '👥' },
    { id: 'f5', type: 'update', title: 'Plugin Marketplace Expansion', description: '15 new plugins available including LaTeX export, citation manager, and statistical analysis tools.', timestamp: new Date(Date.now() - 43200000).toISOString(), icon: '🧩' },
    { id: 'f6', type: 'feature', title: 'Discussion Forums Enhanced', description: 'Threaded discussions now support reactions, pinning, locking, and answer marking.', timestamp: new Date(Date.now() - 86400000).toISOString(), icon: '💬' },
    { id: 'f7', type: 'tip', title: 'Organize with Pinned Projects', description: 'Pin your most important projects to your profile for quick access and visibility.', timestamp: new Date(Date.now() - 172800000).toISOString(), icon: '📌' },
    { id: 'f8', type: 'release', title: 'Contribution Graph Improvements', description: 'Year selector, color scheme toggle, and detailed tooltips now available on contribution graphs.', timestamp: new Date(Date.now() - 259200000).toISOString(), icon: '📊' },
  ];
}

function generateTrending(): TrendingTopic[] {
  return [
    { id: 't1', name: 'Machine Learning Interpretability', category: 'AI/ML', mentions: 342, trend: 'up', color: '#6366f1' },
    { id: 't2', name: 'Quantum Computing Applications', category: 'Physics', mentions: 289, trend: 'up', color: '#8b5cf6' },
    { id: 't3', name: 'Climate Change Modeling', category: 'Environmental', mentions: 256, trend: 'stable', color: '#10b981' },
    { id: 't4', name: 'CRISPR Gene Editing', category: 'Biology', mentions: 198, trend: 'down', color: '#ec4899' },
    { id: 't5', name: 'Large Language Models', category: 'AI/ML', mentions: 445, trend: 'up', color: '#f59e0b' },
    { id: 't6', name: 'Neuroscience & Consciousness', category: 'Neuroscience', mentions: 167, trend: 'stable', color: '#14b8a6' },
  ];
}

function generateTopProjects(): TopProject[] {
  return [
    { id: 'tp1', name: 'quantum-coherence-bio', description: 'Quantum effects in biological systems', stars: 47, activity: 92, language: 'Research', languageColor: '#6366f1' },
    { id: 'tp2', name: 'neural-interpretability', description: 'Understanding deep learning decisions', stars: 35, activity: 78, language: 'Theory', languageColor: '#8b5cf6' },
    { id: 'tp3', name: 'climate-validation-fw', description: 'Climate model cross-validation framework', stars: 62, activity: 85, language: 'Analysis', languageColor: '#10b981' },
    { id: 'tp4', name: 'protein-folding-sim', description: 'Computational protein structure prediction', stars: 28, activity: 65, language: 'Simulation', languageColor: '#f59e0b' },
    { id: 'tp5', name: 'epistemology-of-ai', description: 'Philosophical analysis of machine knowledge', stars: 19, activity: 42, language: 'Philosophy', languageColor: '#ec4899' },
  ];
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const FEED_TYPE_COLORS: Record<string, string> = {
  update: '#3b82f6',
  release: '#10b981',
  tip: '#f59e0b',
  announcement: '#8b5cf6',
  feature: '#6366f1',
};

export function DashboardFeed() {
  const nav = useNavigate();
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();

  const textColor = isDark ? '#eaeaea' : colors.textPrimary;
  const textMuted = isDark ? 'rgba(255,255,255,0.6)' : colors.textSecondary;
  const bgCard = isDark ? 'rgba(255,255,255,0.03)' : colors.bgCard;
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : colors.borderPrimary;
  const pillAccentText = isDark ? '#a5b4fc' : colors.accentPrimary;
  const rowHoverBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.03)';
  const [feedFilter, setFeedFilter] = useState<string>('all');
  const [showAllFeed, setShowAllFeed] = useState(false);

  const feedItems = useMemo(() => generateFeedItems(), []);
  const trending = useMemo(() => generateTrending(), []);
  const topProjects = useMemo(() => generateTopProjects(), []);

  const filteredFeed = useMemo(() => {
    const items = feedFilter === 'all' ? feedItems : feedItems.filter(f => f.type === feedFilter);
    return showAllFeed ? items : items.slice(0, 5);
  }, [feedItems, feedFilter, showAllFeed]);

  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 320px',
        gap: '24px',
      }}>
        {/* Left: Feed + Quick Actions */}
        <div>
          {/* Quick Actions */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px',
            marginBottom: '20px', marginTop: '3px',
          }}>
            {[
              { icon: '�', label: t('nav.library') || 'Βιβλιοθήκη', action: () => nav('/library'), color: '#3b82f6' },
              { icon: '🏗️', label: t('dashFeed.newTheory') || 'New Theory', action: () => nav('/theory-hub'), color: '#6366f1' },
              { icon: '🔬', label: t('dashFeed.researchLab') || 'Research Lab', action: () => nav('/research-lab'), color: '#10b981' },
              { icon: '🔍', label: t('dashFeed.search') || 'Search', action: () => nav('/search'), color: '#f59e0b' },
            ].map((qa) => (
              <button
                key={qa.label}
                onClick={qa.action}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${qa.color}50`; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = borderColor; e.currentTarget.style.transform = 'translateY(0)'; }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
                  padding: '11px 8px', borderRadius: '12px',
                  background: bgCard, border: `1px solid ${borderColor}`,
                  cursor: 'pointer', transition: 'all 0.2s ease',
                  color: textColor, fontSize: '12px', fontWeight: 500,
                }}
              >
                <span style={{ fontSize: '20px' }}>{qa.icon}</span>
                {qa.label}
              </button>
            ))}
          </div>

          {/* Feed filter pills */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
            {['all', 'release', 'feature', 'update', 'tip', 'announcement'].map(type => (
              <button
                key={type}
                onClick={() => setFeedFilter(type)}
                style={{
                  padding: '4px 10px', fontSize: '11px', fontWeight: 500,
                  borderRadius: '16px', cursor: 'pointer',
                  border: `1px solid ${feedFilter === type ? accent + '50' : borderColor}`,
                  background: feedFilter === type ? `${accent}20` : 'transparent',
                  color: feedFilter === type ? pillAccentText : textMuted,
                  transition: 'all 0.15s ease',
                }}
              >
                {t(`dashFeed.filter.${type}`) || type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          {/* Feed items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredFeed.map((item) => {
              const typeColor = FEED_TYPE_COLORS[item.type] || accent;
              return (
                <div
                  key={item.id}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${typeColor}30`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = borderColor; }}
                  style={{
                    padding: '14px 16px',
                    background: bgCard, border: `1px solid ${borderColor}`,
                    borderRadius: '10px', transition: 'border-color 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <span style={{
                      fontSize: '20px', width: '36px', height: '36px',
                      borderRadius: '10px', background: `${typeColor}15`,
                      border: `1px solid ${typeColor}25`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {item.icon}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: textColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.title}
                        </span>
                        <span style={{
                          fontSize: '10px', padding: '1px 6px', borderRadius: '4px',
                          background: `${typeColor}15`, color: typeColor,
                          fontWeight: 600, textTransform: 'uppercase',
                        }}>
                          {item.type}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: textMuted, lineHeight: 1.5, marginBottom: '6px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>
                        <span style={{ color: textMuted }}>{item.description}</span>
                      </div>
                      <span style={{ fontSize: '11px', color: textMuted }}>
                        {timeAgo(item.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {feedItems.length > 5 && (
            <button
              onClick={() => setShowAllFeed(!showAllFeed)}
              style={{
                marginTop: '10px', width: '100%', padding: '8px',
                fontSize: '12px', fontWeight: 500, color: pillAccentText,
                background: `${accent}08`, border: `1px solid ${accent}25`,
                borderRadius: '8px', cursor: 'pointer',
              }}
            >
              {showAllFeed
                ? (t('dashFeed.showLess') || 'Show less')
                : (t('dashFeed.showMore') || `Show all ${feedItems.length} updates`)}
            </button>
          )}
        </div>

        {/* Right Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Top Projects */}
          <div style={{
            background: bgCard, border: `1px solid ${borderColor}`,
            borderRadius: '12px', padding: '16px',
          }}>
            <div style={{
              fontSize: '14px', fontWeight: 600, color: textColor,
              marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              🔥 {t('dashFeed.topProjects') || 'Top Projects'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {topProjects.map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => nav('/projects')}
                  onMouseEnter={(e) => { e.currentTarget.style.background = rowHoverBg; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  style={{
                    padding: '8px 10px', borderRadius: '8px',
                    cursor: 'pointer', transition: 'background 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: textColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {proj.name}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: textMuted, marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {proj.description}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <span style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: proj.languageColor, display: 'inline-block',
                      }} />
                      <span style={{ color: textMuted }}>{proj.language}</span>
                    </span>
                    <span style={{ color: textMuted }}>⭐ {proj.stars}</span>
                    <span style={{ color: textMuted }}>📈 {proj.activity}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trending Topics */}
          <div style={{
            background: bgCard, border: `1px solid ${borderColor}`,
            borderRadius: '12px', padding: '16px',
          }}>
            <div style={{
              fontSize: '14px', fontWeight: 600, color: textColor,
              marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              📈 {t('dashFeed.trending') || 'Trending Topics'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {trending.map((topic) => (
                <div
                  key={topic.id}
                  onMouseEnter={(e) => { e.currentTarget.style.background = rowHoverBg; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '6px 10px', borderRadius: '8px',
                    cursor: 'pointer', transition: 'background 0.15s ease',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: textColor, marginBottom: '2px' }}>
                      {topic.name}
                    </div>
                    <div style={{ fontSize: '11px', color: textMuted }}>
                      {topic.category} · {topic.mentions} {t('dashFeed.mentions') || 'mentions'}
                    </div>
                  </div>
                  <span style={{
                    fontSize: '14px',
                    color: topic.trend === 'up' ? '#10b981' : topic.trend === 'down' ? '#ef4444' : textMuted,
                  }}>
                    {topic.trend === 'up' ? '↗' : topic.trend === 'down' ? '↘' : '→'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Platform Stats */}
          <div style={{
            background: bgCard, border: `1px solid ${borderColor}`,
            borderRadius: '12px', padding: '16px',
          }}>
            <div style={{
              fontSize: '14px', fontWeight: 600, color: textColor,
              marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              📊 {t('dashFeed.platformStats') || 'Platform Stats'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: t('dashFeed.activeResearchers') || 'Active Researchers', value: '1,247', color: '#6366f1' },
                { label: t('dashFeed.projectsCreated') || 'Projects Created', value: '3,891', color: '#10b981' },
                { label: t('dashFeed.theoriesValidated') || 'Theories Validated', value: '892', color: '#8b5cf6' },
                { label: t('dashFeed.evidenceLinked') || 'Evidence Linked', value: '12,456', color: '#f59e0b' },
              ].map((stat) => (
                <div key={stat.label} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '6px 0',
                }}>
                  <span style={{ fontSize: '12px', color: textMuted }}>{stat.label}</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: stat.color }}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
