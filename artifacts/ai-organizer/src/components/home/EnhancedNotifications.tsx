/**
 * EnhancedNotifications - GitHub-style notification center for the Home page
 * Grouping by project, read/unread filtering, per-project settings, notification preferences
 */
import { useState, useMemo, useCallback } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

const accent = '#6366f1';

type NotifType = 'mention' | 'review' | 'comment' | 'ci' | 'release' | 'security' | 'team' | 'system';
type NotifPriority = 'low' | 'medium' | 'high' | 'urgent';

interface EnhancedNotification {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  project?: string;
  timestamp: string;
  read: boolean;
  priority: NotifPriority;
  actor?: string;
  actionUrl?: string;
}

interface ProjectNotifSettings {
  projectName: string;
  enabled: boolean;
  mentions: boolean;
  reviews: boolean;
  comments: boolean;
  releases: boolean;
}

const TYPE_CONFIG: Record<NotifType, { icon: string; color: string; label: string }> = {
  mention: { icon: '@', color: '#6366f1', label: 'Mention' },
  review: { icon: '👁️', color: '#8b5cf6', label: 'Review' },
  comment: { icon: '💬', color: '#10b981', label: 'Comment' },
  ci: { icon: '✅', color: '#22c55e', label: 'CI/Build' },
  release: { icon: '🚀', color: '#f59e0b', label: 'Release' },
  security: { icon: '🔒', color: '#ef4444', label: 'Security' },
  team: { icon: '👥', color: '#ec4899', label: 'Team' },
  system: { icon: '⚙️', color: '#6b7280', label: 'System' },
};

const PRIORITY_CONFIG: Record<NotifPriority, { color: string; bg: string }> = {
  low: { color: '#6b7280', bg: 'rgba(107,114,128,0.15)' },
  medium: { color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  high: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  urgent: { color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
};

function generateNotifications(): EnhancedNotification[] {
  const now = Date.now();
  return [
    { id: 'n1', type: 'mention', title: 'Mentioned in discussion', message: '@you was mentioned in "Quantum coherence methodology review"', project: 'Quantum Coherence Study', timestamp: new Date(now - 1800000).toISOString(), read: false, priority: 'high', actor: 'Dr. Smith' },
    { id: 'n2', type: 'review', title: 'Review requested', message: 'Your review is requested on "Neural network interpretability framework v2"', project: 'Neural Interpretability', timestamp: new Date(now - 3600000).toISOString(), read: false, priority: 'high', actor: 'Prof. Chen' },
    { id: 'n3', type: 'comment', title: 'New comment on your claim', message: 'Dr. Johnson commented on claim "Quantum effects in photosynthesis"', project: 'Quantum Coherence Study', timestamp: new Date(now - 7200000).toISOString(), read: false, priority: 'medium', actor: 'Dr. Johnson' },
    { id: 'n4', type: 'ci', title: 'Validation passed', message: 'All evidence checks passed for "Climate Model Validation Framework"', project: 'Climate Validation', timestamp: new Date(now - 14400000).toISOString(), read: true, priority: 'low', actor: 'System' },
    { id: 'n5', type: 'release', title: 'New version published', message: 'Protein Folding Dynamics v1.3 has been published with updated methodology', project: 'Protein Folding', timestamp: new Date(now - 28800000).toISOString(), read: true, priority: 'medium', actor: 'Dr. Lee' },
    { id: 'n6', type: 'security', title: 'Access change', message: 'Your access level changed to "Editor" on "Social Network Analysis"', project: 'Social Network Analysis', timestamp: new Date(now - 43200000).toISOString(), read: false, priority: 'high', actor: 'Admin' },
    { id: 'n7', type: 'team', title: 'New collaborator joined', message: 'Dr. Martinez joined "Epistemological Foundations of AI" as a reviewer', project: 'Epistemology of AI', timestamp: new Date(now - 57600000).toISOString(), read: true, priority: 'low', actor: 'Dr. Martinez' },
    { id: 'n8', type: 'comment', title: 'Reply to your comment', message: 'Prof. Wilson replied to your comment on "Neural pathway analysis"', project: 'Neural Interpretability', timestamp: new Date(now - 72000000).toISOString(), read: false, priority: 'medium', actor: 'Prof. Wilson' },
    { id: 'n9', type: 'system', title: 'Weekly digest ready', message: 'Your weekly research activity digest is ready to view', timestamp: new Date(now - 86400000).toISOString(), read: true, priority: 'low', actor: 'System' },
    { id: 'n10', type: 'mention', title: 'Tagged in evidence', message: '@you was tagged in evidence item "fMRI data analysis results"', project: 'Quantum Coherence Study', timestamp: new Date(now - 100800000).toISOString(), read: true, priority: 'medium', actor: 'Dr. Park' },
    { id: 'n11', type: 'review', title: 'Review completed', message: 'Your review of "Climate prediction accuracy assessment" was submitted', project: 'Climate Validation', timestamp: new Date(now - 115200000).toISOString(), read: true, priority: 'low', actor: 'You' },
    { id: 'n12', type: 'release', title: 'Think!Hub v2.5 released', message: 'Platform update: New AI evidence linking, faster parsing, community profiles', timestamp: new Date(now - 172800000).toISOString(), read: false, priority: 'medium', actor: 'Think!Hub' },
  ];
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

export interface EnhancedNotificationsProps {
  /** Lifted state: when provided, parent owns groupByProject/showSettings */
  groupByProject?: boolean;
  showSettings?: boolean;
  onToggleGroup?: () => void;
  onToggleSettings?: () => void;
  onMarkAllRead?: () => void;
}

export function EnhancedNotifications({
  groupByProject: groupByProjectProp,
  showSettings: showSettingsProp,
  onToggleGroup,
  onToggleSettings,
  onMarkAllRead,
}: EnhancedNotificationsProps = {}) {
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();

  const textColor = isDark ? '#eaeaea' : colors.textPrimary;
  const textMuted = isDark ? 'rgba(255,255,255,0.6)' : colors.textSecondary;
  const bgCard = isDark ? 'rgba(255,255,255,0.03)' : colors.bgCard;
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : colors.borderPrimary;
  const groupHeaderBg = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(15,23,42,0.02)';
  const rowHoverBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.03)';
  const unreadRowBg = isDark ? 'rgba(99,102,241,0.03)' : 'rgba(99,102,241,0.06)';
  const actorColor = isDark ? 'rgba(255,255,255,0.5)' : colors.textSecondary;
  const metaColor = isDark ? 'rgba(255,255,255,0.35)' : colors.textMuted;
  const secondaryAccentText = isDark ? '#a5b4fc' : colors.accentPrimary;

  const [notifications, setNotifications] = useState<EnhancedNotification[]>(() => {
    try {
      const stored = localStorage.getItem('thinkspace-enhanced-notifs');
      if (stored) return JSON.parse(stored);
    } catch { /* ignore */ }
    const sample = generateNotifications();
    localStorage.setItem('thinkspace-enhanced-notifs', JSON.stringify(sample));
    return sample;
  });

  const [filter, setFilter] = useState<'all' | 'unread' | NotifType>('all');
  const [groupByProjectLocal, setGroupByProjectLocal] = useState(true);
  const [showSettingsLocal, setShowSettingsLocal] = useState(false);
  const groupByProject = groupByProjectProp !== undefined ? groupByProjectProp : groupByProjectLocal;
  const showSettings = showSettingsProp !== undefined ? showSettingsProp : showSettingsLocal;

  const [projectSettings, setProjectSettings] = useState<ProjectNotifSettings[]>(() => {
    const projects = Array.from(new Set(notifications.filter(n => n.project).map(n => n.project!)));
    return projects.map(p => ({
      projectName: p,
      enabled: true,
      mentions: true,
      reviews: true,
      comments: true,
      releases: true,
    }));
  });

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const filtered = useMemo(() => {
    let result = notifications;
    if (filter === 'unread') result = result.filter(n => !n.read);
    else if (filter !== 'all') result = result.filter(n => n.type === filter);
    return result;
  }, [notifications, filter]);

  const grouped = useMemo(() => {
    if (!groupByProject) return null;
    const groups = new Map<string, EnhancedNotification[]>();
    filtered.forEach(n => {
      const key = n.project || t('enhNotif.general') || 'General';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(n);
    });
    return Array.from(groups.entries()).sort((a, b) => {
      const aLatest = Math.max(...a[1].map(n => new Date(n.timestamp).getTime()));
      const bLatest = Math.max(...b[1].map(n => new Date(n.timestamp).getTime()));
      return bLatest - aLatest;
    });
  }, [filtered, groupByProject, t]);

  const markRead = useCallback((id: string) => {
    setNotifications(prev => {
      const next = prev.map(n => n.id === id ? { ...n, read: true } : n);
      localStorage.setItem('thinkspace-enhanced-notifs', JSON.stringify(next));
      return next;
    });
  }, []);

  const markAllReadInternal = useCallback(() => {
    setNotifications(prev => {
      const next = prev.map(n => ({ ...n, read: true }));
      localStorage.setItem('thinkspace-enhanced-notifs', JSON.stringify(next));
      return next;
    });
  }, []);

  const handleToggleGroup = onToggleGroup ?? (() => setGroupByProjectLocal(g => !g));
  const handleToggleSettings = onToggleSettings ?? (() => setShowSettingsLocal(s => !s));
  void handleToggleGroup; void handleToggleSettings;
  void (onMarkAllRead ? () => { onMarkAllRead(); markAllReadInternal(); } : markAllReadInternal);

  const toggleProjectSetting = useCallback((projectName: string, key: keyof Omit<ProjectNotifSettings, 'projectName'>) => {
    setProjectSettings(prev => prev.map(p =>
      p.projectName === projectName ? { ...p, [key]: !p[key] } : p
    ));
  }, []);

  const renderNotification = (notif: EnhancedNotification) => {
    const cfg = TYPE_CONFIG[notif.type];
    const priCfg = PRIORITY_CONFIG[notif.priority];
    return (
      <div
        key={notif.id}
        onClick={() => markRead(notif.id)}
        onMouseEnter={(e) => { e.currentTarget.style.background = rowHoverBg; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = notif.read ? 'transparent' : unreadRowBg; }}
        style={{
          display: 'flex', alignItems: 'flex-start', gap: '12px',
          padding: '10px 14px', cursor: 'pointer',
          borderBottom: `1px solid ${borderColor}`,
          background: notif.read ? 'transparent' : unreadRowBg,
          transition: 'background 0.15s ease',
        }}
      >
        {/* Unread dot */}
        <div style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: notif.read ? 'transparent' : accent,
          flexShrink: 0, marginTop: '8px',
        }} />

        {/* Type icon */}
        <div style={{
          width: '32px', height: '32px', borderRadius: '8px',
          background: `${cfg.color}15`, border: `1px solid ${cfg.color}25`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', flexShrink: 0,
          color: cfg.color, fontWeight: 700,
        }}>
          {cfg.icon}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
            <span style={{
              fontSize: '13px', fontWeight: notif.read ? 500 : 600,
              color: notif.read ? textMuted : textColor,
            }}>
              {notif.title}
            </span>
            {notif.priority === 'high' || notif.priority === 'urgent' ? (
              <span style={{
                fontSize: '9px', padding: '1px 5px', borderRadius: '4px',
                background: priCfg.bg, color: priCfg.color,
                fontWeight: 700, textTransform: 'uppercase',
              }}>
                {notif.priority}
              </span>
            ) : null}
          </div>
          <div style={{
            fontSize: '12px', color: textMuted, lineHeight: 1.4,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {notif.message}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '11px' }}>
            {notif.actor && (
              <span style={{ color: actorColor }}>{notif.actor}</span>
            )}
            <span style={{ color: metaColor }}>·</span>
            <span style={{ color: metaColor }}>{timeAgo(notif.timestamp)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ marginBottom: '8px' }}>

      {/* Per-project settings panel */}
      {showSettings && (
        <div style={{
          marginBottom: '16px', padding: '16px',
          background: bgCard, border: `1px solid ${borderColor}`, borderRadius: '12px',
        }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: textColor, marginBottom: '12px' }}>
            📋 {t('enhNotif.projectSettings') || 'Per-Project Notification Settings'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {projectSettings.map((ps) => (
              <div key={ps.projectName} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', borderRadius: '8px',
                background: groupHeaderBg, border: `1px solid ${borderColor}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => toggleProjectSetting(ps.projectName, 'enabled')}
                    style={{
                      width: '16px', height: '16px', borderRadius: '4px',
                      border: `1px solid ${ps.enabled ? accent : borderColor}`,
                      background: ps.enabled ? accent : 'transparent',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: '10px',
                    }}
                  >
                    {ps.enabled ? '✓' : ''}
                  </button>
                  <span style={{ fontSize: '13px', color: ps.enabled ? textColor : textMuted }}>
                    {ps.projectName}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {(['mentions', 'reviews', 'comments', 'releases'] as const).map(key => (
                    <button
                      key={key}
                      onClick={() => toggleProjectSetting(ps.projectName, key)}
                      style={{
                        padding: '2px 6px', fontSize: '10px', fontWeight: 500,
                        borderRadius: '4px', cursor: 'pointer',
                        border: `1px solid ${ps[key] ? accent + '40' : borderColor}`,
                        background: ps[key] ? `${accent}15` : 'transparent',
                        color: ps[key] ? secondaryAccentText : textMuted,
                      }}
                    >
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', marginTop: '3px', flexWrap: 'wrap' }}>
        {(['all', 'unread'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '4px 10px', fontSize: '11px', fontWeight: 500,
              borderRadius: '16px', cursor: 'pointer',
              border: `1px solid ${filter === f ? accent + '50' : borderColor}`,
              background: filter === f ? `${accent}20` : 'transparent',
              color: filter === f ? secondaryAccentText : textMuted,
            }}
          >
            {f === 'all' ? (t('enhNotif.all') || 'All') : `${t('enhNotif.unreadOnly') || 'Unread'} (${unreadCount})`}
          </button>
        ))}
        <div style={{ width: '1px', height: '20px', background: borderColor, margin: '0 4px' }} />
        {(Object.keys(TYPE_CONFIG) as NotifType[]).map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            style={{
              padding: '4px 10px', fontSize: '11px', fontWeight: 500,
              borderRadius: '16px', cursor: 'pointer',
              border: `1px solid ${filter === type ? TYPE_CONFIG[type].color + '50' : borderColor}`,
              background: filter === type ? `${TYPE_CONFIG[type].color}20` : 'transparent',
              color: filter === type ? TYPE_CONFIG[type].color : textMuted,
            }}
          >
            {TYPE_CONFIG[type].icon} {TYPE_CONFIG[type].label}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div style={{
        border: `1px solid ${borderColor}`,
        borderRadius: '12px', overflow: 'hidden',
      }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔕</div>
            <div style={{ fontSize: '13px', color: textMuted }}>
              {t('enhNotif.noNotifications') || 'No notifications to show'}
            </div>
          </div>
        ) : groupByProject && grouped ? (
          grouped.map(([project, notifs]) => (
            <div key={project}>
              <div style={{
                padding: '8px 14px',
                background: groupHeaderBg,
                borderBottom: `1px solid ${borderColor}`,
                fontSize: '12px', fontWeight: 600, color: textMuted,
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <span>📁</span>
                <span>{project}</span>
                <span style={{
                  fontSize: '10px', padding: '1px 6px', borderRadius: '8px',
                  background: `${accent}15`, color: secondaryAccentText,
                }}>
                  {notifs.filter(n => !n.read).length}/{notifs.length}
                </span>
              </div>
              {notifs.map(renderNotification)}
            </div>
          ))
        ) : (
          filtered.map(renderNotification)
        )}
      </div>
    </div>
  );
}
