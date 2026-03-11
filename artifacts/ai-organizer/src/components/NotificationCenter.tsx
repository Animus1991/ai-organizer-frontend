import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { UploadItemDTO } from '../lib/api';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system' | 'collaboration' | 'ai' | 'document';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: Date;
  read: boolean;
  saved?: boolean;
  participating?: boolean;
  actionable: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  metadata?: {
    source?: string;
    documentId?: number;
    userId?: string;
    category?: string;
  };
  autoHide?: boolean;
  hideAfter?: number;
}

interface NotificationPreferences {
  enableDesktop: boolean;
  enableSound: boolean;
  enableEmail: boolean;
  categories: {
    system: boolean;
    collaboration: boolean;
    ai: boolean;
    document: boolean;
  };
  priorities: {
    low: boolean;
    medium: boolean;
    high: boolean;
    urgent: boolean;
  };
}

interface NotificationCenterProps {
  compact?: boolean;
  showUnreadOnly?: boolean;
  maxNotifications?: number;
  enableSounds?: boolean;
  uploads?: UploadItemDTO[] | null;
}

export default function NotificationCenter({ 
  compact = false,
  showUnreadOnly = false,
  maxNotifications = 10,
  enableSounds: _enableSounds = true,
  uploads
}: NotificationCenterProps) {
  const nav = useNavigate();
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enableDesktop: true,
    enableSound: true,
    enableEmail: false,
    categories: {
      system: true,
      collaboration: true,
      ai: true,
      document: true
    },
    priorities: {
      low: true,
      medium: true,
      high: true,
      urgent: true
    }
  });
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'participating' | 'saved' | 'document' | 'ai' | 'system' | 'collaboration'>('all');

  // Generate real notifications based on document activity
  const generateRealNotifications = (): Notification[] => {
    const notifications: Notification[] = [];
    
    const documents = Array.isArray(uploads)
      ? uploads
      : (() => {
          const storedUploads = localStorage.getItem('uploads');
          if (!storedUploads) return [];
          try {
            return JSON.parse(storedUploads);
          } catch {
            return [];
          }
        })();
    
    if (documents.length > 0) {
      // Recent uploads notifications
      const recentUploads = documents
        .filter((doc: any) => doc.parseStatus === 'ok')
        .slice(0, 3);
      
      recentUploads.forEach((doc: any, index: number) => {
        notifications.push({
          id: `doc-upload-${doc.documentId || index}`,
          title: t('notif.docProcessed'),
          message: t('notif.docProcessedMsg').replace('{name}', doc.filename),
          type: 'document',
          priority: 'medium',
          timestamp: new Date(Date.now() - 1000 * 60 * (index + 1) * 10),
          read: false,
          actionable: true,
          action: {
            label: t('notif.viewDocument'),
            onClick: () => nav(`/documents/${doc.documentId}`)
          },
          metadata: {
            source: t('notif.documentParser'),
            documentId: doc.documentId,
            category: 'processing'
          }
        });
      });
      
      // Pending documents notification
      const pendingDocs = documents.filter((doc: any) => doc.parseStatus === 'pending');
      if (pendingDocs.length > 0) {
        notifications.push({
          id: 'pending-docs',
          title: t('notif.docsProcessing'),
          message: t('notif.docsProcessingMsg').replace('{count}', String(pendingDocs.length)),
          type: 'info',
          priority: 'low',
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          read: false,
          actionable: false,
          metadata: {
            source: t('notif.system'),
            category: 'processing'
          }
        });
      }
      
      // AI Analysis suggestion
      const analyzedDocs = documents.filter((doc: any) => doc.parseStatus === 'ok');
      if (analyzedDocs.length > 0) {
        notifications.push({
          id: 'ai-insights',
          title: t('notif.aiAvailable'),
          message: t('notif.aiAvailableMsg').replace('{count}', String(analyzedDocs.length)),
          type: 'ai',
          priority: 'high',
          timestamp: new Date(Date.now() - 1000 * 60 * 60),
          read: false,
          actionable: true,
          action: {
            label: t('notif.startAnalysis'),
            onClick: () => nav('/')
          },
          metadata: {
            source: t('notif.aiEngine'),
            category: 'analysis'
          }
        });
      }
    }
    
    // Welcome notification for new users
    if (notifications.length === 0) {
      notifications.push({
        id: 'welcome',
        title: t('notif.welcome'),
        message: t('notif.welcomeMsg'),
        type: 'info',
        priority: 'medium',
        timestamp: new Date(),
        read: false,
        actionable: true,
        action: {
          label: t('notif.uploadDocument'),
          onClick: () => nav('/')
        },
        metadata: {
          source: t('notif.system'),
          category: t('notif.welcome')
        }
      });
    }
    
    return notifications;
  };

  // Load notification data
  useEffect(() => {
    const loadNotificationData = () => {
      setLoading(true);
      
      // Load from localStorage or generate real data
      const storedNotifications = localStorage.getItem('notifications');
      const storedPreferences = localStorage.getItem('notificationPreferences');
      
      let allNotifications: Notification[] = [];
      let userPreferences: NotificationPreferences = preferences;
      
      if (storedNotifications) {
        allNotifications = JSON.parse(storedNotifications).map((notif: any) => ({
          ...notif,
          timestamp: new Date(notif.timestamp)
        }));
      }
      
      // Generate fresh notifications based on current documents
      const freshNotifications = generateRealNotifications();
      
      // Merge stored and fresh, avoiding duplicates
      const existingIds = new Set(allNotifications.map(n => n.id));
      freshNotifications.forEach(notif => {
        if (!existingIds.has(notif.id)) {
          allNotifications.push(notif);
        }
      });
      
      if (storedPreferences) {
        userPreferences = JSON.parse(storedPreferences);
      }
      
      // Sort by timestamp (newest first)
      allNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      setNotifications(allNotifications);
      setPreferences(userPreferences);
      setLoading(false);
    };
    
    loadNotificationData();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadNotificationData, 30000);
    return () => clearInterval(interval);
  }, [uploads]);

  // Save to localStorage when notifications change
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('notifications', JSON.stringify(notifications));
    }
  }, [notifications, loading]);

  // Toggle saved/bookmarked
  const toggleSaved = (id: string) => {
    setNotifications(prev => prev.map(n =>
      n.id === id ? { ...n, saved: !n.saved } : n
    ));
  };

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;
    
    if (showUnreadOnly || activeFilter === 'unread') {
      filtered = filtered.filter(n => !n.read);
    } else if (activeFilter === 'saved') {
      filtered = filtered.filter(n => n.saved);
    } else if (activeFilter === 'participating') {
      filtered = filtered.filter(n => n.participating || n.type === 'collaboration' || n.actionable);
    } else if (activeFilter !== 'all') {
      filtered = filtered.filter(n => n.type === activeFilter);
    }
    
    // Apply category filters from preferences
    filtered = filtered.filter(n => {
      const type = n.type;
      if (type === 'system' || type === 'collaboration' || type === 'ai' || type === 'document') {
        return preferences.categories[type];
      }
      return true;
    });
    
    // Apply priority filters
    filtered = filtered.filter(n => preferences.priorities[n.priority]);
    
    // Sort by priority and timestamp
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    filtered.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
    
    return filtered.slice(0, maxNotifications);
  }, [notifications, showUnreadOnly, preferences, maxNotifications, activeFilter]);

  // Group notifications by time period
  const groupedNotifications = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);

    const groups: { label: string; items: typeof filteredNotifications }[] = [];
    const today = filteredNotifications.filter(n => n.timestamp >= todayStart);
    const thisWeek = filteredNotifications.filter(n => n.timestamp >= weekStart && n.timestamp < todayStart);
    const earlier = filteredNotifications.filter(n => n.timestamp < weekStart);

    if (today.length > 0) groups.push({ label: t('notif.today') || 'Today', items: today });
    if (thisWeek.length > 0) groups.push({ label: t('notif.thisWeek') || 'This Week', items: thisWeek });
    if (earlier.length > 0) groups.push({ label: t('notif.earlier') || 'Earlier', items: earlier });

    return groups;
  }, [filteredNotifications, t]);

  // Statistics
  const statistics = useMemo(() => {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.read).length;
    const byType = notifications.reduce((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const byPriority = notifications.reduce((acc, n) => {
      acc[n.priority] = (acc[n.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return { total, unread, byType, byPriority };
  }, [notifications]);

  // Mark as read
  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Delete notification
  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Get type color
  const getTypeColor = (type: string) => {
    const colors = {
      info: '#3b82f6',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      system: '#8b5cf6',
      collaboration: '#06b6d4',
      ai: '#6366f1',
      document: '#10b981'
    };
    return colors[type as keyof typeof colors] || '#6b7280';
  };

  // Get type icon
  const getTypeIcon = (type: string) => {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      system: '⚙️',
      collaboration: '👥',
      ai: '🤖',
      document: '📄'
    };
    return icons[type as keyof typeof icons] || '📌';
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    const colors = {
      low: '#6b7280',
      medium: '#f59e0b',
      high: '#ef4444',
      urgent: '#dc2626'
    };
    return colors[priority as keyof typeof colors] || '#6b7280';
  };

  // Format time ago
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
          {t('notif.loading')}
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🔔</span>
            <span style={{ fontWeight: 600 }}>{t('notif.title')}</span>
            {statistics.unread > 0 && (
              <span style={{
                background: '#ef4444',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 600
              }}>
                {statistics.unread}
              </span>
            )}
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredNotifications.slice(0, 3).map(notif => (
            <div
              key={notif.id}
              onClick={() => {
                markAsRead(notif.id);
                if (notif.action) notif.action.onClick();
              }}
              style={{
                padding: '10px',
                background: notif.read ? 'transparent' : 'rgba(99, 102, 241, 0.1)',
                borderRadius: '8px',
                borderLeft: `3px solid ${getTypeColor(notif.type)}`,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>{getTypeIcon(notif.type)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: notif.read ? 400 : 600,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {notif.title}
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                  {formatTimeAgo(notif.timestamp)}
                </div>
              </div>
            </div>
          ))}
          {filteredNotifications.length === 0 && (
            <div style={{ textAlign: 'center', padding: '16px', color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
              {t('notif.none')}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '16px',
      padding: '24px',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>🔔</span>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700 }}>{t('notif.title')}</div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
              {t('notif.unreadTotal').replace('{unread}', String(statistics.unread)).replace('{total}', String(statistics.total))}
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          {statistics.unread > 0 && (
            <button
              onClick={markAllAsRead}
              style={{
                padding: '8px 16px',
                background: 'rgba(99, 102, 241, 0.2)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: '8px',
                color: '#a5b4fc',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              {t('notif.markAllRead')}
            </button>
          )}
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              padding: '8px 16px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            ⚙️ {t('notif.settings')}
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '16px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        paddingBottom: '12px',
        flexWrap: 'wrap',
      }}>
        {([
          { key: 'all', label: t('notif.filterAll') || 'All', count: notifications.length },
          { key: 'unread', label: t('notif.filterUnread') || 'Unread', count: statistics.unread },
          { key: 'participating', label: '💬 Participating', count: notifications.filter(n => n.participating || n.actionable).length },
          { key: 'saved', label: '🔖 Saved', count: notifications.filter(n => n.saved).length },
          { key: 'document', label: '📄 ' + (t('notif.filterDocs') || 'Documents'), count: statistics.byType['document'] || 0 },
          { key: 'ai', label: '🤖 AI', count: statistics.byType['ai'] || 0 },
          { key: 'system', label: '⚙️ ' + (t('notif.filterSystem') || 'System'), count: statistics.byType['system'] || 0 },
          { key: 'collaboration', label: '👥 ' + (t('notif.filterCollab') || 'Collab'), count: statistics.byType['collaboration'] || 0 },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key as any)}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: activeFilter === tab.key ? 600 : 400,
              borderRadius: '8px',
              border: activeFilter === tab.key ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
              background: activeFilter === tab.key ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              color: activeFilter === tab.key ? '#a5b4fc' : 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span style={{
                padding: '1px 6px',
                borderRadius: '10px',
                fontSize: '10px',
                fontWeight: 600,
                background: activeFilter === tab.key ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255,255,255,0.08)',
                color: activeFilter === tab.key ? '#c7d2fe' : 'rgba(255,255,255,0.4)',
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Grouped Notifications List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {groupedNotifications.map(group => (
          <div key={group.label}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
              padding: '0 4px',
            }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {group.label}
              </span>
              {group.items.some(n => !n.read) && (
                <button
                  onClick={() => group.items.forEach(n => { if (!n.read) markAsRead(n.id); })}
                  style={{
                    padding: '2px 8px',
                    fontSize: '10px',
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '4px',
                    color: 'rgba(255,255,255,0.4)',
                    cursor: 'pointer',
                  }}
                >
                  {t('notif.markGroupRead') || 'Mark read'}
                </button>
              )}
            </div>
            {group.items.map(notif => (
          <div
            key={notif.id}
            style={{
              padding: '16px',
              background: notif.read ? 'rgba(255, 255, 255, 0.03)' : 'rgba(99, 102, 241, 0.08)',
              borderRadius: '12px',
              border: `1px solid ${notif.read ? 'rgba(255,255,255,0.05)' : 'rgba(99, 102, 241, 0.2)'}`,
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start'
            }}
          >
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: `${getTypeColor(notif.type)}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>
              {getTypeIcon(notif.type)}
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '4px'
              }}>
                <span style={{
                  fontWeight: notif.read ? 500 : 700,
                  fontSize: '14px'
                }}>
                  {notif.title}
                </span>
                <span style={{
                  padding: '2px 6px',
                  background: `${getPriorityColor(notif.priority)}20`,
                  color: getPriorityColor(notif.priority),
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}>
                  {notif.priority}
                </span>
                {!notif.read && (
                  <span style={{
                    width: '8px',
                    height: '8px',
                    background: '#ef4444',
                    borderRadius: '50%'
                  }} />
                )}
              </div>
              
              <div style={{
                fontSize: '13px',
                color: 'rgba(255,255,255,0.7)',
                marginBottom: '8px',
                lineHeight: 1.5
              }}>
                {notif.message}
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '12px',
                color: 'rgba(255,255,255,0.5)'
              }}>
                <span>{formatTimeAgo(notif.timestamp)}</span>
                {notif.metadata?.source && (
                  <span>• {notif.metadata.source}</span>
                )}
              </div>
              
              {notif.actionable && notif.action && (
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      markAsRead(notif.id);
                      notif.action?.onClick();
                    }}
                    style={{
                      padding: '8px 16px',
                      background: 'rgba(99, 102, 241, 0.2)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      borderRadius: '6px',
                      color: '#a5b4fc',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 500
                    }}
                  >
                    {notif.action.label}
                  </button>
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '4px', flexDirection: 'column', alignItems: 'center' }}>
              <button
                onClick={() => toggleSaved(notif.id)}
                style={{
                  padding: '6px',
                  background: notif.saved ? 'rgba(99,102,241,0.15)' : 'transparent',
                  border: 'none',
                  color: notif.saved ? '#a5b4fc' : 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
                title={notif.saved ? 'Unsave' : 'Save'}
              >
                {notif.saved ? '🔖' : '📌'}
              </button>
              {!notif.read && (
                <button
                  onClick={() => markAsRead(notif.id)}
                  style={{
                    padding: '6px',
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(255,255,255,0.5)',
                    cursor: 'pointer',
                    borderRadius: '4px'
                  }}
                  title="Mark as read"
                >
                  ✓
                </button>
              )}
              <button
                onClick={() => deleteNotification(notif.id)}
                style={{
                  padding: '6px',
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  borderRadius: '4px'
                }}
                title="Delete"
              >
                🗑️
              </button>
            </div>
          </div>
            ))}
          </div>
        ))}
        
        {filteredNotifications.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '48px 24px',
            color: 'rgba(255,255,255,0.5)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔔</div>
            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
              {t('notif.none')}
            </div>
            <div style={{ fontSize: '14px' }}>
              You're all caught up! New notifications will appear here.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
