import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { DocumentDTO } from '../lib/api';

interface EngagementMetric {
  id: string;
  documentId: number;
  documentTitle: string;
  timestamp: Date;
  action: 'view' | 'edit' | 'analyze' | 'export' | 'share' | 'bookmark' | 'search' | 'download';
  duration?: number; // in seconds
  metadata?: {
    segmentsViewed?: number;
    searchesPerformed?: number;
    analysisType?: string;
    exportFormat?: string;
    shareMethod?: string;
  };
}

interface DocumentEngagementStats {
  documentId: number;
  documentTitle: string;
  totalViews: number;
  totalEdits: number;
  totalAnalyses: number;
  totalExports: number;
  totalShares: number;
  totalBookmarks: number;
  totalSearches: number;
  totalDownloads: number;
  averageSessionDuration: number;
  lastActivity: Date;
  engagementScore: number; // 0-100
  trendDirection: 'up' | 'down' | 'stable';
  topActions: Array<{ action: string; count: number; percentage: number }>;
  hourlyActivity: number[]; // 24-hour activity pattern
  dailyActivity: number[]; // 7-day activity pattern
}

interface DocumentEngagementMetricsProps {
  documentId?: number;
  timeframe: 'day' | 'week' | 'month' | 'year' | 'all';
  onMetricClick?: (metric: EngagementMetric) => void;
  showDetailed?: boolean;
  documents?: DocumentDTO[];
}

export default function DocumentEngagementMetrics({ 
  documentId,
  timeframe = 'week',
  onMetricClick,
  showDetailed = true,
  documents
}: DocumentEngagementMetricsProps) {
  const nav = useNavigate();
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const [metrics, setMetrics] = useState<EngagementMetric[]>([]);
  const [stats, setStats] = useState<DocumentEngagementStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [dateRange] = useState<{ start: Date; end: Date }>(() => {
    const end = new Date();
    const start = new Date();
    
    switch (timeframe) {
      case 'day':
        start.setDate(end.getDate() - 1);
        break;
      case 'week':
        start.setDate(end.getDate() - 7);
        break;
      case 'month':
        start.setMonth(end.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(end.getFullYear() - 1);
        break;
      case 'all':
        start.setFullYear(2020, 0, 1); // Far back date
        break;
    }
    
    return { start, end };
  });

  const surfaceBg = isDark ? 'rgba(255, 255, 255, 0.05)' : '#ffffff';
  const surfaceBgSubtle = isDark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff';
  const surfaceBorder = isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.12)';
  const controlBorder = isDark ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.2)';
  const textPrimary = isDark ? 'white' : '#000000';
  const textSecondary = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.62)';
  const textMuted = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';

  void onMetricClick;

  const getDocumentTitle = (id: number) => {
    const doc = documents?.find((d) => d.id === id);
    return doc?.title || doc?.filename || `Document ${id}`;
  };

  // Load engagement metrics from analytics + collaboration events
  useEffect(() => {
    const loadMetrics = () => {
      setLoading(true);
      
      const storedEvents = localStorage.getItem('aiorg_analytics_queue');
      const storedActivities = localStorage.getItem('collab_activities');
      let allMetrics: EngagementMetric[] = [];

      if (storedEvents) {
        try {
          const events = JSON.parse(storedEvents);
          events.forEach((event: any, index: number) => {
            if (event.category === 'document' && event.label) {
              const docId = Number(event.label);
              if (Number.isNaN(docId)) return;
              const actionMap: Record<string, EngagementMetric['action']> = {
                view: 'view',
                segment: 'analyze',
                upload: 'edit',
                delete: 'edit'
              };
              const action = actionMap[event.action] || 'view';
              allMetrics.push({
                id: `metric-${event.category}-${index}`,
                documentId: docId,
                documentTitle: getDocumentTitle(docId),
                timestamp: new Date(event.timestamp),
                action,
                duration: event.value || undefined
              });
            }
            if (event.category === 'search') {
              // Search is global; assign to selected document if available
              if (documentId) {
                allMetrics.push({
                  id: `metric-search-${index}`,
                  documentId,
                  documentTitle: getDocumentTitle(documentId),
                  timestamp: new Date(event.timestamp),
                  action: 'search',
                  metadata: { searchesPerformed: 1 }
                });
              }
            }
          });
        } catch {
          allMetrics = [];
        }
      }

      if (storedActivities) {
        try {
          const activities = JSON.parse(storedActivities);
          activities.forEach((activity: any, index: number) => {
            if (activity.resourceType === 'document' && activity.resourceId) {
              const docId = Number(activity.resourceId);
              if (Number.isNaN(docId)) return;
              const action: EngagementMetric['action'] =
                activity.type === 'share' ? 'share' : activity.type === 'comment' ? 'edit' : 'edit';
              allMetrics.push({
                id: `metric-collab-${index}`,
                documentId: docId,
                documentTitle: getDocumentTitle(docId),
                timestamp: new Date(activity.timestamp),
                action,
                metadata: { analysisType: activity.type }
              });
            }
          });
        } catch {
          // ignore
        }
      }
      
      // Filter by date range
      const filteredMetrics = allMetrics.filter(m => 
        m.timestamp >= dateRange.start && m.timestamp <= dateRange.end
      );
      
      // Filter by document if specified
      const finalMetrics = documentId 
        ? filteredMetrics.filter(m => m.documentId === documentId)
        : filteredMetrics;
      
      setMetrics(finalMetrics);
      
      // Calculate stats
      const calculatedStats = calculateEngagementStats(finalMetrics);
      setStats(calculatedStats);
      
      setLoading(false);
    };
    
    loadMetrics();
  }, [documentId, timeframe, dateRange, documents]);

  // No sample data: metrics are derived from real events

  // Calculate engagement statistics
  const calculateEngagementStats = (metrics: EngagementMetric[]): DocumentEngagementStats[] => {
    const documentStats = new Map<number, DocumentEngagementStats>();
    
    metrics.forEach(metric => {
      if (!documentStats.has(metric.documentId)) {
        documentStats.set(metric.documentId, {
          documentId: metric.documentId,
          documentTitle: metric.documentTitle,
          totalViews: 0,
          totalEdits: 0,
          totalAnalyses: 0,
          totalExports: 0,
          totalShares: 0,
          totalBookmarks: 0,
          totalSearches: 0,
          totalDownloads: 0,
          averageSessionDuration: 0,
          lastActivity: metric.timestamp,
          engagementScore: 0,
          trendDirection: 'stable',
          topActions: [],
          hourlyActivity: new Array(24).fill(0),
          dailyActivity: new Array(7).fill(0)
        });
      }
      
      const stats = documentStats.get(metric.documentId)!;
      
      // Update counters
      switch (metric.action) {
        case 'view': stats.totalViews++; break;
        case 'edit': stats.totalEdits++; break;
        case 'analyze': stats.totalAnalyses++; break;
        case 'export': stats.totalExports++; break;
        case 'share': stats.totalShares++; break;
        case 'bookmark': stats.totalBookmarks++; break;
        case 'search': stats.totalSearches++; break;
        case 'download': stats.totalDownloads++; break;
      }
      
      // Update last activity
      if (metric.timestamp > stats.lastActivity) {
        stats.lastActivity = metric.timestamp;
      }
      
      // Update hourly activity
      const hour = metric.timestamp.getHours();
      stats.hourlyActivity[hour]++;
      
      // Update daily activity
      const day = metric.timestamp.getDay();
      stats.dailyActivity[day]++;
    });
    
    // Calculate derived metrics
    documentStats.forEach(stats => {
      // Calculate engagement score
      const actionWeights = {
        view: 1,
        edit: 3,
        analyze: 5,
        export: 4,
        share: 3,
        bookmark: 2,
        search: 2,
        download: 4
      };
      
      let weightedScore = 0;
      weightedScore += stats.totalViews * actionWeights.view;
      weightedScore += stats.totalEdits * actionWeights.edit;
      weightedScore += stats.totalAnalyses * actionWeights.analyze;
      weightedScore += stats.totalExports * actionWeights.export;
      weightedScore += stats.totalShares * actionWeights.share;
      weightedScore += stats.totalBookmarks * actionWeights.bookmark;
      weightedScore += stats.totalSearches * actionWeights.search;
      weightedScore += stats.totalDownloads * actionWeights.download;
      
      // Normalize to 0-100 scale
      stats.engagementScore = Math.min(100, Math.round((weightedScore / 50) * 100));
      
      // Calculate top actions
      const actionCounts = [
        { action: 'Views', count: stats.totalViews },
        { action: 'Edits', count: stats.totalEdits },
        { action: 'Analyses', count: stats.totalAnalyses },
        { action: 'Exports', count: stats.totalExports },
        { action: 'Shares', count: stats.totalShares },
        { action: 'Bookmarks', count: stats.totalBookmarks },
        { action: 'Searches', count: stats.totalSearches },
        { action: 'Downloads', count: stats.totalDownloads }
      ].filter(a => a.count > 0);
      
      const totalActions = actionCounts.reduce((sum, a) => sum + a.count, 0);
      stats.topActions = actionCounts
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
        .map(a => ({
          ...a,
          percentage: Math.round((a.count / totalActions) * 100)
        }));
      
      // Determine trend (simplified)
      stats.trendDirection = stats.engagementScore > 70 ? 'up' : 
                            stats.engagementScore < 30 ? 'down' : 'stable';
    });
    
    return Array.from(documentStats.values()).sort((a, b) => b.engagementScore - a.engagementScore);
  };

  // Filter metrics by action
  const filteredMetrics = useMemo(() => {
    if (selectedAction === 'all') return metrics;
    return metrics.filter(m => m.action === selectedAction);
  }, [metrics, selectedAction]);

  // Get action statistics
  const actionStats = useMemo(() => {
    const stats = new Map<string, number>();
    metrics.forEach(m => {
      stats.set(m.action, (stats.get(m.action) || 0) + 1);
    });
    return Array.from(stats.entries()).map(([action, count]) => ({
      action,
      count,
      icon: getActionIcon(action),
      color: getActionColor(action)
    })).sort((a, b) => b.count - a.count);
  }, [metrics]);

  function getActionIcon(action: string): string {
    const icons = {
      view: '👁️',
      edit: '✏️',
      analyze: '🔬',
      export: '📤',
      share: '🔗',
      bookmark: '🔖',
      search: '🔍',
      download: '⬇️'
    };
    return icons[action as keyof typeof icons] || '📄';
  }

  function getActionColor(action: string): string {
    const colors = {
      view: '#6366f1',
      edit: '#f59e0b',
      analyze: '#10b981',
      export: '#8b5cf6',
      share: '#ef4444',
      bookmark: '#ec4899',
      search: '#14b8a6',
      download: '#64748b'
    };
    return colors[action as keyof typeof colors] || '#6b7280';
  }

  function getActionLabel(action: string): string {
    const labels: Record<string, string> = {
      view: t('engagement.action.view') || 'View',
      edit: t('engagement.action.edit') || 'Edit',
      analyze: t('engagement.action.analyze') || 'Analyze',
      export: t('engagement.action.export') || 'Export',
      share: t('engagement.action.share') || 'Share',
      bookmark: t('engagement.action.bookmark') || 'Bookmark',
      search: t('engagement.action.search') || 'Search',
      download: t('engagement.action.download') || 'Download'
    };
    return labels[action] || action.charAt(0).toUpperCase() + action.slice(1);
  }

  function getEngagementColor(score: number): string {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  }

  function getTrendIcon(trend: string): string {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➡️';
    }
  }

  if (loading) {
    return (
      <div style={{
        background: surfaceBg,
        borderRadius: '16px',
        border: surfaceBorder,
        padding: '40px',
        textAlign: 'center',
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(99, 102, 241, 0.3)',
          borderTop: '3px solid #6366f1',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }}></div>
        <div style={{ color: textPrimary, fontSize: '13px' }}>{t("engagement.loading")}</div>
      </div>
    );
  }

  return (
    <div className="document-engagement-metrics" style={{
      background: surfaceBg,
      borderRadius: '16px',
      border: surfaceBorder,
      padding: '20px',
      backdropFilter: 'blur(10px)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
      }}>
        <div>
          <h3 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: textPrimary,
            margin: '0 0 6px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            📊 {t("engagement.title")}
          </h3>
          <p style={{
            fontSize: '13px',
            color: textSecondary,
            margin: 0,
          }}>
            {t("engagement.subtitle")}
          </p>
        </div>
        
        <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
        }}>
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            style={{
              padding: '8px 12px',
              border: controlBorder,
              borderRadius: '8px',
              background: surfaceBg,
              color: textPrimary,
              fontSize: '13px',
            }}
          >
            <option value="all">{t("engagement.allActions")}</option>
            {actionStats.map(({ action, icon }) => (
              <option key={action} value={action}>
                {icon} {getActionLabel(action)}
              </option>
            ))}
          </select>
          
          <div style={{
            fontSize: '12px',
            color: textMuted,
            background: surfaceBg,
            border: surfaceBorder,
            padding: '4px 8px',
            borderRadius: '6px',
          }}>
            {filteredMetrics.length} {t("engagement.events")}
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '12px',
        marginBottom: '24px',
      }}>
        <div style={{
          background: 'rgba(96, 165, 250, 0.1)',
          border: '1px solid rgba(96, 165, 250, 0.2)',
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#a5b4fc', marginBottom: '4px' }}>
            {stats.length}
          </div>
          <div style={{ fontSize: '12px', color: textSecondary }}>
            {t("engagement.documentsTracked")}
          </div>
        </div>

        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#34d399', marginBottom: '4px' }}>
            {filteredMetrics.length}
          </div>
          <div style={{ fontSize: '12px', color: textSecondary }}>
            {t("engagement.totalActions")}
          </div>
        </div>

        <div style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#fbbf24', marginBottom: '4px' }}>
            {stats.length > 0 ? Math.round(stats.reduce((sum, s) => sum + s.engagementScore, 0) / stats.length) : 0}
          </div>
          <div style={{ fontSize: '12px', color: textSecondary }}>
            {t("engagement.avgEngagementScore")}
          </div>
        </div>

        <div style={{
          background: 'rgba(139, 92, 246, 0.1)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#a78bfa', marginBottom: '4px' }}>
            {actionStats.length}
          </div>
          <div style={{ fontSize: '12px', color: textSecondary }}>
            {t("engagement.actionTypes")}
          </div>
        </div>
      </div>

      {/* Action Distribution */}
      <div style={{
        background: surfaceBgSubtle,
        border: surfaceBorder,
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '24px',
      }}>
        <h4 style={{
          fontSize: '14px',
          fontWeight: '600',
          color: textPrimary,
          margin: '0 0 12px 0',
        }}>
          {t("engagement.actionDistribution")}
        </h4>
        
        <div style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
        }}>
          {actionStats.map(({ action, count, icon, color }) => {
            const percentage = Math.round((count / filteredMetrics.length) * 100);
            return (
              <div
                key={action}
                style={{
                  flex: '1',
                  minWidth: '120px',
                  background: surfaceBg,
                  border: surfaceBorder,
                  borderRadius: '8px',
                  padding: '12px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '16px', marginBottom: '4px' }}>{icon}</div>
                <div style={{ 
                  fontSize: '13px',
                  fontWeight: '600',
                  color: textPrimary,
                  marginBottom: '4px',
                }}>
                  {count}
                </div>
                <div style={{ 
                  fontSize: '11px', 
                  color: textSecondary,
                  marginBottom: '4px'
                }}>
                  {getActionLabel(action)}
                </div>
                <div style={{
                  fontSize: '10px',
                  color: color,
                  fontWeight: '600',
                }}>
                  {percentage}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Engaged Documents */}
      {showDetailed && stats.length > 0 && (
        <div style={{
          background: surfaceBgSubtle,
          border: surfaceBorder,
          borderRadius: '12px',
          padding: '16px',
        }}>
          <h4 style={{
            fontSize: '13px',
            fontWeight: '600',
            color: textPrimary,
            margin: '0 0 12px 0',
          }}>
            {t("engagement.topEngagedDocuments")}
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {stats.slice(0, 5).map((stat) => (
              <div
                key={stat.documentId}
                onClick={() => nav(`/documents/${stat.documentId}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  background: surfaceBg,
                  border: surfaceBorder,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = surfaceBg;
                  e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.12)';
                }}
              >
                {/* Engagement Score */}
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  background: getEngagementColor(stat.engagementScore),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: 'white',
                }}>
                  {stat.engagementScore}
                </div>
                
                {/* Document Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: textPrimary,
                    marginBottom: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    {stat.documentTitle}
                    <span style={{ fontSize: '12px' }}>
                      {getTrendIcon(stat.trendDirection)}
                    </span>
                  </div>
                  
                  {/* Top Actions */}
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap',
                  }}>
                    {stat.topActions.map(({ action, count, percentage }) => (
                      <span
                        key={action}
                        style={{
                          fontSize: '10px',
                          background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.82)',
                        }}
                      >
                        {action}: {count} ({percentage}%)
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Stats */}
                <div style={{
                  textAlign: 'right',
                  fontSize: '11px',
                  color: textSecondary,
                }}>
                  <div>{t("engagement.views")}: {stat.totalViews}</div>
                  <div>{t("engagement.edits")}: {stat.totalEdits}</div>
                  <div>{t("engagement.analyses")}: {stat.totalAnalyses}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        marginTop: '20px',
        padding: '12px',
        background: 'rgba(99, 102, 241, 0.1)',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        borderRadius: '8px',
        fontSize: '11px',
        color: isDark ? '#a5b4fc' : '#000000',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          📊 {t("engagement.tracking", { events: filteredMetrics.length, documents: stats.length })}
        </div>
        <div>
          ⏱️ {dateRange.start.toLocaleDateString()} - {dateRange.end.toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
