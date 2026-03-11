import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DocumentDTO } from '../lib/api';
import { useLanguage } from '../context/LanguageContext';
import { useAnalytics } from './AnalyticsDashboard';
import { useTheme } from '../context/ThemeContext';

interface ResearchMetrics {
  totalDocuments: number;
  activeProjects: number;
  completedAnalysis: number;
  averageEngagementTime: number;
  weeklyActivity: number[];
  topCategories: { name: string; count: number; color: string }[];
  recentActivity: {
    id: string;
    type: 'document' | 'analysis' | 'collaboration';
    title: string;
    timestamp: Date;
    status: 'completed' | 'in-progress' | 'pending';
  }[];
  aiInsights: {
    trend: string;
    confidence: number;
    recommendation: string;
  }[];
}

interface ResearchDashboardProps {
  documents: DocumentDTO[];
}

export default function ResearchDashboard({ documents }: ResearchDashboardProps) {
  const nav = useNavigate();
  const { t } = useLanguage();
  const { metrics: analyticsMetrics, getDailyStats } = useAnalytics();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
  const { isDark } = useTheme();

  // Theme-aware colors (light mode: white bg, black text)
  const panelBg = isDark ? 'rgba(255, 255, 255, 0.05)' : '#ffffff';
  const panelBorder = isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(47, 41, 65, 0.24)';
  const textPrimary = isDark ? 'rgba(255, 255, 255, 0.9)' : '#000000';
  const textSecondary = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.66)';
  const mutedText = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.55)';
  const softSurface = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(47, 41, 65, 0.08)';

  // Calculate metrics from documents + analytics
  const calculatedMetrics = useMemo(() => {
    if (!documents.length) return null;

    // Basic metrics
    const totalDocuments = documents.length;
    const activeProjects = documents.filter(doc =>
      doc.parseStatus === 'ok' || doc.parseStatus === 'pending'
    ).length;
    const completedAnalysis = documents.filter(doc => doc.parseStatus === 'ok').length;

    const dailyStats = getDailyStats(7);
    const weeklyActivity = dailyStats.length
      ? dailyStats.map((d) => d.documentsOpened || d.segmentsCreated || 0)
      : new Array(7).fill(0);

    // Category analysis from source type / content type
    const categoryMap: Record<string, { name: string; color: string; count: number }> = {};
    documents.forEach((doc) => {
      const key = doc.sourceType || doc.upload?.contentType || 'unknown';
      if (!categoryMap[key]) {
        const label =
          key.includes('pdf')
            ? t("dashboard.category.researchPapers")
            : key.includes('word')
            ? t("dashboard.category.reports")
            : key.includes('text')
            ? t("dashboard.category.notes")
            : t("dashboard.category.articles");
        const color =
          key.includes('pdf')
            ? '#6366f1'
            : key.includes('word')
            ? '#10b981'
            : key.includes('text')
            ? '#ef4444'
            : '#f59e0b';
        categoryMap[key] = { name: label, color, count: 0 };
      }
      categoryMap[key].count += 1;
    });
    const topCategories = Object.values(categoryMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    const recentActivity = documents
      .slice()
      .sort((a, b) => (b.upload?.id || b.id) - (a.upload?.id || a.id))
      .slice(0, 5)
      .map((doc) => ({
        id: doc.id.toString(),
        type: 'document' as const,
        title: doc.filename || `Document ${doc.id}`,
        timestamp: new Date(),
        status: doc.parseStatus === 'ok'
          ? 'completed'
          : doc.parseStatus === 'pending'
          ? 'in-progress'
          : 'pending' as const,
      }));

    const parseSuccessRate = totalDocuments > 0 ? completedAnalysis / totalDocuments : 0;
    const aiInsights = [
      {
        trend: parseSuccessRate >= 0.9
          ? t('dashboard.aiInsights.productivityTrend')
          : t('dashboard.aiInsights.efficiencyTrend'),
        confidence: Math.min(0.95, 0.6 + parseSuccessRate),
        recommendation:
          parseSuccessRate >= 0.9
            ? t('dashboard.aiInsights.productivityRec')
            : t('dashboard.aiInsights.efficiencyRec')
      },
      {
        trend: t('dashboard.aiInsights.efficiencyTrend'),
        confidence: Math.min(0.9, 0.5 + (analyticsMetrics.productivityScore / 200)),
        recommendation: t('dashboard.aiInsights.efficiencyRec')
      }
    ];

    return {
      totalDocuments,
      activeProjects,
      completedAnalysis,
      averageEngagementTime: analyticsMetrics.averageSessionMinutes || 0,
      weeklyActivity,
      topCategories,
      recentActivity,
      aiInsights
    } as ResearchMetrics;
  }, [documents, t, getDailyStats, analyticsMetrics]);

  const metrics = calculatedMetrics;

  if (!metrics) {
    return (
      <div className="research-dashboard-empty" style={{
        padding: '32px',
        textAlign: 'center',
        background: panelBg,
        borderRadius: '16px',
        border: panelBorder
      }}>
        <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: textPrimary }}>
          {t("dashboard.noData")}
        </div>
        <div style={{ fontSize: '14px', color: textSecondary }}>
          {t("dashboard.noDataHint")}
        </div>
      </div>
    );
  }

  return (
    <div className="research-dashboard" style={{
      background: panelBg,
      borderRadius: '16px',
      border: panelBorder,
      padding: '24px',
      backdropFilter: 'blur(10px)',
    }}>
      {/* Dashboard Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
      }}>
        <div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: textPrimary,
            margin: '0 0 8px 0',
          }}>
            📊 {t("dashboard.title")}
          </h2>
          <p style={{
            fontSize: '14px',
            color: textSecondary,
            margin: 0,
          }}>
            {t("dashboard.subtitle")}
          </p>
        </div>
        
        {/* Time Range Selector */}
        <div style={{
          display: 'flex',
          gap: '8px',
          background: softSurface,
          padding: '4px',
          borderRadius: '12px',
        }}>
          {(['week', 'month', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '8px',
                background: timeRange === range ? (isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.15)') : 'transparent',
                color: timeRange === range ? (isDark ? '#a5b4fc' : '#5b5bd6') : textSecondary,
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
              }}
            >
              {t(`dashboard.timeRange.${range}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div className="metric-card" style={{
          background: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          borderRadius: '12px',
          padding: '16px',
        }}>
          <div style={{ fontSize: '32px', fontWeight: '700', color: isDark ? '#a5b4fc' : '#4f46e5', marginBottom: '4px' }}>
            {metrics.totalDocuments}
          </div>
          <div style={{ fontSize: '13px', color: textSecondary }}>
            {t("dashboard.totalDocuments")}
          </div>
        </div>

        <div className="metric-card" style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '12px',
          padding: '16px',
        }}>
          <div style={{ fontSize: '32px', fontWeight: '700', color: isDark ? '#6ee7b7' : '#059669', marginBottom: '4px' }}>
            {metrics.activeProjects}
          </div>
          <div style={{ fontSize: '13px', color: textSecondary }}>
            {t("dashboard.activeProjects")}
          </div>
        </div>

        <div className="metric-card" style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          borderRadius: '12px',
          padding: '16px',
        }}>
          <div style={{ fontSize: '32px', fontWeight: '700', color: isDark ? '#fcd34d' : '#d97706', marginBottom: '4px' }}>
            {metrics.completedAnalysis}
          </div>
          <div style={{ fontSize: '13px', color: textSecondary }}>
            {t("dashboard.completedAnalysis")}
          </div>
        </div>

        <div className="metric-card" style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '12px',
          padding: '16px',
        }}>
          <div style={{ fontSize: '32px', fontWeight: '700', color: isDark ? '#fca5a5' : '#ef4444', marginBottom: '4px' }}>
            {metrics.averageEngagementTime}m
          </div>
          <div style={{ fontSize: '13px', color: textSecondary }}>
            {t("dashboard.avgEngagement")}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '24px',
        marginBottom: '24px',
      }}>
        {/* Weekly Activity Chart */}
        <div style={{
          background: panelBg,
          border: panelBorder,
          borderRadius: '12px',
          padding: '20px',
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: textPrimary,
            margin: '0 0 16px 0',
          }}>
            📈 {t("dashboard.weeklyActivity")}
          </h3>
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            height: '120px',
            gap: '8px',
          }}>
            {metrics.weeklyActivity.map((value, index) => (
              <div
                key={index}
                style={{
                  flex: 1,
                  background: 'linear-gradient(to top, #6366f1, #8b5cf6)',
                  borderRadius: '4px',
                  height: `${Math.max(value * 10, 8)}%`,
                  position: 'relative',
                }}
                title={`${value} ${t("home.documents").toLowerCase()}`}
              >
                <div style={{
                  position: 'absolute',
                  bottom: '-20px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '11px',
                  color: mutedText,
                }}>
                  {[t("dashboard.days.mon"), t("dashboard.days.tue"), t("dashboard.days.wed"), t("dashboard.days.thu"), t("dashboard.days.fri"), t("dashboard.days.sat"), t("dashboard.days.sun")][index]}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Categories */}
        <div style={{
          background: panelBg,
          border: panelBorder,
          borderRadius: '12px',
          padding: '20px',
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: textPrimary,
            margin: '0 0 16px 0',
          }}>
            🏷️ {t("dashboard.topCategories")}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {metrics.topCategories.map((category, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: category.color,
                  }}></div>
                  <span style={{
                    fontSize: '13px',
                    color: textPrimary,
                  }}>
                    {category.name}
                  </span>
                </div>
                <span style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: textPrimary,
                }}>
                  {category.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Insights & Recent Activity */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
      }}>
        {/* AI Insights */}
        <div style={{
          background: panelBg,
          border: panelBorder,
          borderRadius: '12px',
          padding: '20px',
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: textPrimary,
            margin: '0 0 16px 0',
          }}>
            🤖 {t("dashboard.aiInsights")}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {metrics.aiInsights.map((insight, index) => (
              <div key={index} style={{
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                borderRadius: '8px',
                padding: '12px',
              }}>
                <div style={{
                  fontSize: '13px',
                  color: textPrimary,
                  marginBottom: '4px',
                }}>
                  {insight.trend}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: textSecondary,
                  marginBottom: '8px',
                }}>
                  {insight.recommendation}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: isDark ? '#a5b4fc' : '#5b5bd6',
                  fontWeight: '500',
                }}>
                  {t("dashboard.confidence")}: {Math.round(insight.confidence * 100)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{
          background: panelBg,
          border: panelBorder,
          borderRadius: '12px',
          padding: '20px',
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: textPrimary,
            margin: '0 0 16px 0',
          }}>
            📋 {t("dashboard.recentActivity")}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {metrics.recentActivity.map((activity) => (
              <div
                key={activity.id}
                onClick={() => nav(`/documents/${activity.id}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: activity.status === 'completed' ? '#10b981' :
                             activity.status === 'in-progress' ? '#f59e0b' : '#ef4444',
                }}></div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '13px',
                    color: textPrimary,
                    marginBottom: '2px',
                  }}>
                    {activity.title}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: textSecondary,
                  }}>
                    {activity.type} • {activity.timestamp.toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
