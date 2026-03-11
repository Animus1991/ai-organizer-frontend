import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { DocumentDTO } from '../lib/api';

interface AIInsight {
  id: string;
  type: 'trend' | 'recommendation' | 'anomaly' | 'prediction' | 'pattern' | 'efficiency';
  title: string;
  description: string;
  confidence: number; // 0-1
  impact: 'low' | 'medium' | 'high' | 'critical';
  category: 'productivity' | 'quality' | 'collaboration' | 'research' | 'workflow';
  timestamp: Date;
  data?: any;
  actions?: string[];
  relatedDocuments?: number[];
  relatedTasks?: string[];
  metadata?: {
    source: string;
    methodology: string;
    timeframe: string;
    accuracy?: number;
  };
}

interface AnalyticsMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  change: number; // percentage change
  trend: 'up' | 'down' | 'stable';
  category: string;
  description: string;
  target?: number;
  historical?: Array<{ date: Date; value: number }>;
}

interface AIInsightsAnalyticsProps {
  documentId?: number;
  timeframe?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  showPredictions?: boolean;
  showRecommendations?: boolean;
  compact?: boolean;
  documents?: DocumentDTO[];
}

export default function AIInsightsAnalytics({ 
  documentId,
  timeframe = 'week',
  showPredictions = true,
  showRecommendations = true,
  compact = false,
  documents
}: AIInsightsAnalyticsProps) {
  const nav = useNavigate();
  const { t } = useLanguage();
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedInsightType, setSelectedInsightType] = useState<string>('all');

  const localizeSampleInsight = (insight: AIInsight): AIInsight => {
    const map: Record<string, { titleKey: string; descKey: string; actionKeys?: string[] }> = {
      'insight-1': {
        titleKey: 'sample.aiInsights.insight.researchProductivitySurge.title',
        descKey: 'sample.aiInsights.insight.researchProductivitySurge.description',
        actionKeys: [
          'sample.aiInsights.insight.researchProductivitySurge.action.1',
          'sample.aiInsights.insight.researchProductivitySurge.action.2',
          'sample.aiInsights.insight.researchProductivitySurge.action.3',
        ],
      },
      'insight-2': {
        titleKey: 'sample.aiInsights.insight.optimizeDocumentCategorization.title',
        descKey: 'sample.aiInsights.insight.optimizeDocumentCategorization.description',
        actionKeys: [
          'sample.aiInsights.insight.optimizeDocumentCategorization.action.1',
          'sample.aiInsights.insight.optimizeDocumentCategorization.action.2',
          'sample.aiInsights.insight.optimizeDocumentCategorization.action.3',
        ],
      },
      'insight-3': {
        titleKey: 'sample.aiInsights.insight.unusualDocumentAccessPattern.title',
        descKey: 'sample.aiInsights.insight.unusualDocumentAccessPattern.description',
        actionKeys: [
          'sample.aiInsights.insight.unusualDocumentAccessPattern.action.1',
          'sample.aiInsights.insight.unusualDocumentAccessPattern.action.2',
          'sample.aiInsights.insight.unusualDocumentAccessPattern.action.3',
        ],
      },
      'insight-4': {
        titleKey: 'sample.aiInsights.insight.projectCompletionForecast.title',
        descKey: 'sample.aiInsights.insight.projectCompletionForecast.description',
        actionKeys: [
          'sample.aiInsights.insight.projectCompletionForecast.action.1',
          'sample.aiInsights.insight.projectCompletionForecast.action.2',
          'sample.aiInsights.insight.projectCompletionForecast.action.3',
        ],
      },
      'insight-5': {
        titleKey: 'sample.aiInsights.insight.peakProductivityHoursIdentified.title',
        descKey: 'sample.aiInsights.insight.peakProductivityHoursIdentified.description',
        actionKeys: [
          'sample.aiInsights.insight.peakProductivityHoursIdentified.action.1',
          'sample.aiInsights.insight.peakProductivityHoursIdentified.action.2',
          'sample.aiInsights.insight.peakProductivityHoursIdentified.action.3',
        ],
      },
      'insight-6': {
        titleKey: 'sample.aiInsights.insight.searchOptimizationOpportunity.title',
        descKey: 'sample.aiInsights.insight.searchOptimizationOpportunity.description',
        actionKeys: [
          'sample.aiInsights.insight.searchOptimizationOpportunity.action.1',
          'sample.aiInsights.insight.searchOptimizationOpportunity.action.2',
          'sample.aiInsights.insight.searchOptimizationOpportunity.action.3',
        ],
      },
    };

    const entry = map[insight.id];
    if (!entry) return insight;

    return {
      ...insight,
      title: t(entry.titleKey),
      description: t(entry.descKey),
      actions: entry.actionKeys ? entry.actionKeys.map((k) => t(k)) : insight.actions,
    };
  };

  const localizeSampleMetric = (metric: AnalyticsMetric): AnalyticsMetric => {
    const map: Record<string, { nameKey: string; descKey: string; unitKey?: string }> = {
      'metric-1': {
        nameKey: 'sample.aiInsights.metric.documentsProcessed.name',
        descKey: 'sample.aiInsights.metric.documentsProcessed.description',
        unitKey: 'sample.aiInsights.metric.documentsProcessed.unit',
      },
      'metric-2': { nameKey: 'sample.aiInsights.metric.analysisAccuracy.name', descKey: 'sample.aiInsights.metric.analysisAccuracy.description' },
      'metric-3': { nameKey: 'sample.aiInsights.metric.searchEfficiency.name', descKey: 'sample.aiInsights.metric.searchEfficiency.description' },
      'metric-4': { nameKey: 'sample.aiInsights.metric.taskCompletionRate.name', descKey: 'sample.aiInsights.metric.taskCompletionRate.description' },
      'metric-5': {
        nameKey: 'sample.aiInsights.metric.collaborationScore.name',
        descKey: 'sample.aiInsights.metric.collaborationScore.description',
        unitKey: 'sample.aiInsights.metric.collaborationScore.unit',
      },
      'metric-6': {
        nameKey: 'sample.aiInsights.metric.researchVelocity.name',
        descKey: 'sample.aiInsights.metric.researchVelocity.description',
        unitKey: 'sample.aiInsights.metric.researchVelocity.unit',
      },
    };

    const entry = map[metric.id];
    if (!entry) return metric;

    return {
      ...metric,
      name: t(entry.nameKey),
      description: t(entry.descKey),
      unit: entry.unitKey ? t(entry.unitKey) : metric.unit,
    };
  };

  // Load AI insights and analytics data (real, deterministic)
  useEffect(() => {
    const loadInsightsData = () => {
      setLoading(true);

      const docs = documents || [];
      const totalDocuments = docs.length;
      const parsedDocs = docs.filter((d) => d.parseStatus === 'ok').length;
      const pendingDocs = docs.filter((d) => d.parseStatus === 'pending').length;
      const failedDocs = docs.filter((d) => d.parseStatus === 'error' || d.parseStatus === 'failed').length;
      const parseSuccessRate = totalDocuments > 0 ? Math.round((parsedDocs / totalDocuments) * 100) : 0;

      const storedEvents = localStorage.getItem('aiorg_analytics_queue');
      const events = storedEvents ? (() => { try { return JSON.parse(storedEvents); } catch { return []; } })() : [];
      const searches = events.filter((e: any) => e.category === 'search').length;
      const segments = events.filter((e: any) => e.category === 'document' && e.action === 'segment').length;

      const storedActivities = localStorage.getItem('collab_activities');
      const activities = storedActivities ? (() => { try { return JSON.parse(storedActivities); } catch { return []; } })() : [];
      const collaborationCount = activities.length;

      const insightsList: AIInsight[] = [];
      if (failedDocs > 0) {
        insightsList.push({
          id: 'insight-failed',
          type: 'anomaly',
          title: t('aiInsights.failedDocumentsTitle') || 'Document parse failures detected',
          description: t('aiInsights.failedDocumentsDesc') || `${failedDocs} document(s) failed to parse. Review the files and retry.`,
          confidence: 0.8,
          impact: failedDocs > 3 ? 'high' : 'medium',
          category: 'quality',
          timestamp: new Date(),
          relatedDocuments: docs.filter((d) => d.parseStatus === 'failed' || d.parseStatus === 'error').map((d) => d.id),
          metadata: { source: 'uploads', methodology: 'status_analysis', timeframe: 'current' }
        });
      }
      if (pendingDocs > 0 && showPredictions) {
        insightsList.push({
          id: 'insight-pending',
          type: 'prediction',
          title: t('aiInsights.pendingDocumentsTitle') || 'Documents still processing',
          description: t('aiInsights.pendingDocumentsDesc') || `${pendingDocs} document(s) are still being processed.`,
          confidence: 0.7,
          impact: 'low',
          category: 'workflow',
          timestamp: new Date(),
          metadata: { source: 'uploads', methodology: 'status_analysis', timeframe: 'current' }
        });
      }
      if (showRecommendations && searches > 0) {
        insightsList.push({
          id: 'insight-search',
          type: 'recommendation',
          title: t('aiInsights.searchOptimizationTitle') || 'Search efficiency opportunity',
          description: t('aiInsights.searchOptimizationDesc') || `You ran ${searches} searches recently. Consider refining synonyms or filters.`,
          confidence: 0.65,
          impact: 'medium',
          category: 'research',
          timestamp: new Date(),
          metadata: { source: 'analytics', methodology: 'usage_summary', timeframe: timeframe }
        });
      }

      const metricsList: AnalyticsMetric[] = [
        {
          id: 'metric-documents',
          name: t('aiInsights.metric.documentsProcessed') || 'Documents Processed',
          value: totalDocuments,
          unit: 'docs',
          change: 0,
          trend: 'stable',
          category: 'productivity',
          description: t('aiInsights.metric.documentsProcessedDesc') || 'Total documents in workspace'
        },
        {
          id: 'metric-accuracy',
          name: t('aiInsights.metric.analysisAccuracy') || 'Parse Success Rate',
          value: parseSuccessRate,
          unit: '%',
          change: 0,
          trend: parseSuccessRate >= 90 ? 'up' : 'down',
          category: 'quality',
          description: t('aiInsights.metric.analysisAccuracyDesc') || 'Percent of documents parsed successfully',
          target: 95
        },
        {
          id: 'metric-search',
          name: t('aiInsights.metric.searchEfficiency') || 'Search Activity',
          value: searches,
          unit: 'runs',
          change: 0,
          trend: searches > 0 ? 'up' : 'stable',
          category: 'workflow',
          description: t('aiInsights.metric.searchEfficiencyDesc') || 'Number of recent searches'
        },
        {
          id: 'metric-segments',
          name: t('aiInsights.metric.researchVelocity') || 'Segmentation Runs',
          value: segments,
          unit: 'runs',
          change: 0,
          trend: segments > 0 ? 'up' : 'stable',
          category: 'productivity',
          description: t('aiInsights.metric.researchVelocityDesc') || 'Segmentation operations recorded'
        },
        {
          id: 'metric-collab',
          name: t('aiInsights.metric.collaborationScore') || 'Collaboration Activity',
          value: collaborationCount,
          unit: 'events',
          change: 0,
          trend: collaborationCount > 0 ? 'up' : 'stable',
          category: 'collaboration',
          description: t('aiInsights.metric.collaborationScoreDesc') || 'Shared and commented activity'
        }
      ];

      setInsights(insightsList);
      setMetrics(metricsList);
      setLoading(false);
    };

    loadInsightsData();
  }, [documents, timeframe, showPredictions, showRecommendations, t]);

  // Generate sample AI insights and analytics data
  const generateSampleData = (): { insights: AIInsight[], metrics: AnalyticsMetric[] } => {
    const sampleInsights: AIInsight[] = [
      {
        id: 'insight-1',
        type: 'trend',
        title: t('sample.aiInsights.insight.researchProductivitySurge.title'),
        description: t('sample.aiInsights.insight.researchProductivitySurge.description'),
        confidence: 0.92,
        impact: 'high',
        category: 'productivity',
        timestamp: new Date('2024-01-20'),
        data: {
          previousRate: 12,
          currentRate: 16.2,
          timeframe: '7 days'
        },
        actions: [
          t('sample.aiInsights.insight.researchProductivitySurge.action.1'),
          t('sample.aiInsights.insight.researchProductivitySurge.action.2'),
          t('sample.aiInsights.insight.researchProductivitySurge.action.3'),
        ],
        relatedDocuments: [1, 2, 3],
        metadata: {
          source: 'usage_analytics',
          methodology: 'time_series_analysis',
          timeframe: 'last_7_days',
          accuracy: 0.95
        }
      },
      {
        id: 'insight-2',
        type: 'recommendation',
        title: t('sample.aiInsights.insight.optimizeDocumentCategorization.title'),
        description: t('sample.aiInsights.insight.optimizeDocumentCategorization.description'),
        confidence: 0.87,
        impact: 'medium',
        category: 'workflow',
        timestamp: new Date('2024-01-19'),
        data: {
          uncategorizedDocs: 8,
          suggestedCategory: 'Literature Review',
          potentialEfficiency: 0.23
        },
        actions: [
          t('sample.aiInsights.insight.optimizeDocumentCategorization.action.1'),
          t('sample.aiInsights.insight.optimizeDocumentCategorization.action.2'),
          t('sample.aiInsights.insight.optimizeDocumentCategorization.action.3'),
        ],
        relatedDocuments: [4, 5, 6, 7, 8, 9, 10, 11],
        metadata: {
          source: 'content_analysis',
          methodology: 'ml_classification',
          timeframe: 'current_month',
          accuracy: 0.89
        }
      },
      {
        id: 'insight-3',
        type: 'anomaly',
        title: t('sample.aiInsights.insight.unusualDocumentAccessPattern.title'),
        description: t('sample.aiInsights.insight.unusualDocumentAccessPattern.description'),
        confidence: 0.78,
        impact: 'low',
        category: 'research',
        timestamp: new Date('2024-01-18'),
        data: {
          spikeMultiplier: 4.2,
          affectedDocuments: [12, 13, 14],
          normalAccessRate: 2.1,
          currentAccessRate: 8.8
        },
        actions: [
          t('sample.aiInsights.insight.unusualDocumentAccessPattern.action.1'),
          t('sample.aiInsights.insight.unusualDocumentAccessPattern.action.2'),
          t('sample.aiInsights.insight.unusualDocumentAccessPattern.action.3'),
        ],
        relatedDocuments: [12, 13, 14],
        metadata: {
          source: 'access_patterns',
          methodology: 'anomaly_detection',
          timeframe: 'last_24_hours',
          accuracy: 0.82
        }
      },
      {
        id: 'insight-4',
        type: 'prediction',
        title: t('sample.aiInsights.insight.projectCompletionForecast.title'),
        description: t('sample.aiInsights.insight.projectCompletionForecast.description'),
        confidence: 0.85,
        impact: 'high',
        category: 'research',
        timestamp: new Date('2024-01-17'),
        data: {
          completionProbability: 0.85,
          estimatedCompletion: new Date('2024-02-15'),
          targetDate: new Date('2024-02-20'),
          remainingTasks: 6,
          averageTaskDuration: 2.3
        },
        actions: [
          t('sample.aiInsights.insight.projectCompletionForecast.action.1'),
          t('sample.aiInsights.insight.projectCompletionForecast.action.2'),
          t('sample.aiInsights.insight.projectCompletionForecast.action.3'),
        ],
        relatedTasks: ['task-2', 'task-3', 'task-4'],
        metadata: {
          source: 'progress_analysis',
          methodology: 'predictive_modeling',
          timeframe: 'next_30_days',
          accuracy: 0.88
        }
      },
      {
        id: 'insight-5',
        type: 'pattern',
        title: t('sample.aiInsights.insight.peakProductivityHoursIdentified.title'),
        description: t('sample.aiInsights.insight.peakProductivityHoursIdentified.description'),
        confidence: 0.94,
        impact: 'medium',
        category: 'productivity',
        timestamp: new Date('2024-01-16'),
        data: {
          peakHours: ['09:00', '10:00', '11:00'],
          productivityBoost: 0.4,
          averageTasksPerHour: 3.2,
          peakTasksPerHour: 4.5
        },
        actions: [
          t('sample.aiInsights.insight.peakProductivityHoursIdentified.action.1'),
          t('sample.aiInsights.insight.peakProductivityHoursIdentified.action.2'),
          t('sample.aiInsights.insight.peakProductivityHoursIdentified.action.3'),
        ],
        metadata: {
          source: 'time_tracking',
          methodology: 'pattern_recognition',
          timeframe: 'last_30_days',
          accuracy: 0.96
        }
      },
      {
        id: 'insight-6',
        type: 'efficiency',
        title: t('sample.aiInsights.insight.searchOptimizationOpportunity.title'),
        description: t('sample.aiInsights.insight.searchOptimizationOpportunity.description'),
        confidence: 0.81,
        impact: 'medium',
        category: 'workflow',
        timestamp: new Date('2024-01-15'),
        data: {
          redundantSearches: 47,
          totalSearches: 204,
          redundancyRate: 0.23,
          potentialTimeSavings: 12 // minutes per day
        },
        actions: [
          t('sample.aiInsights.insight.searchOptimizationOpportunity.action.1'),
          t('sample.aiInsights.insight.searchOptimizationOpportunity.action.2'),
          t('sample.aiInsights.insight.searchOptimizationOpportunity.action.3'),
        ],
        metadata: {
          source: 'search_analytics',
          methodology: 'pattern_analysis',
          timeframe: 'last_14_days',
          accuracy: 0.85
        }
      }
    ];

    const sampleMetrics: AnalyticsMetric[] = [
      {
        id: 'metric-1',
        name: t('sample.aiInsights.metric.documentsProcessed.name'),
        value: 156,
        unit: t('sample.aiInsights.metric.documentsProcessed.unit'),
        change: 23.5,
        trend: 'up',
        category: 'productivity',
        description: t('sample.aiInsights.metric.documentsProcessed.description'),
        target: 180,
        historical: [
          { date: new Date('2024-01-14'), value: 142 },
          { date: new Date('2024-01-15'), value: 148 },
          { date: new Date('2024-01-16'), value: 151 },
          { date: new Date('2024-01-17'), value: 153 },
          { date: new Date('2024-01-18'), value: 158 },
          { date: new Date('2024-01-19'), value: 155 },
          { date: new Date('2024-01-20'), value: 156 }
        ]
      },
      {
        id: 'metric-2',
        name: t('sample.aiInsights.metric.analysisAccuracy.name'),
        value: 94.2,
        unit: '%',
        change: 2.8,
        trend: 'up',
        category: 'quality',
        description: t('sample.aiInsights.metric.analysisAccuracy.description'),
        target: 95,
        historical: [
          { date: new Date('2024-01-14'), value: 91.5 },
          { date: new Date('2024-01-15'), value: 92.1 },
          { date: new Date('2024-01-16'), value: 92.8 },
          { date: new Date('2024-01-17'), value: 93.2 },
          { date: new Date('2024-01-18'), value: 93.8 },
          { date: new Date('2024-01-19'), value: 93.9 },
          { date: new Date('2024-01-20'), value: 94.2 }
        ]
      },
      {
        id: 'metric-3',
        name: t('sample.aiInsights.metric.searchEfficiency.name'),
        value: 87.3,
        unit: '%',
        change: -5.2,
        trend: 'down',
        category: 'workflow',
        description: t('sample.aiInsights.metric.searchEfficiency.description'),
        target: 90,
        historical: [
          { date: new Date('2024-01-14'), value: 92.5 },
          { date: new Date('2024-01-15'), value: 91.8 },
          { date: new Date('2024-01-16'), value: 90.2 },
          { date: new Date('2024-01-17'), value: 89.6 },
          { date: new Date('2024-01-18'), value: 88.9 },
          { date: new Date('2024-01-19'), value: 87.8 },
          { date: new Date('2024-01-20'), value: 87.3 }
        ]
      },
      {
        id: 'metric-4',
        name: t('sample.aiInsights.metric.taskCompletionRate.name'),
        value: 78.6,
        unit: '%',
        change: 12.4,
        trend: 'up',
        category: 'productivity',
        description: t('sample.aiInsights.metric.taskCompletionRate.description'),
        target: 85,
        historical: [
          { date: new Date('2024-01-14'), value: 66.2 },
          { date: new Date('2024-01-15'), value: 68.9 },
          { date: new Date('2024-01-16'), value: 71.3 },
          { date: new Date('2024-01-17'), value: 73.8 },
          { date: new Date('2024-01-18'), value: 75.2 },
          { date: new Date('2024-01-19'), value: 77.1 },
          { date: new Date('2024-01-20'), value: 78.6 }
        ]
      },
      {
        id: 'metric-5',
        name: t('sample.aiInsights.metric.collaborationScore.name'),
        value: 82.1,
        unit: t('sample.aiInsights.metric.collaborationScore.unit'),
        change: 8.7,
        trend: 'up',
        category: 'collaboration',
        description: t('sample.aiInsights.metric.collaborationScore.description'),
        target: 90,
        historical: [
          { date: new Date('2024-01-14'), value: 73.4 },
          { date: new Date('2024-01-15'), value: 75.8 },
          { date: new Date('2024-01-16'), value: 77.2 },
          { date: new Date('2024-01-17'), value: 78.9 },
          { date: new Date('2024-01-18'), value: 79.6 },
          { date: new Date('2024-01-19'), value: 80.8 },
          { date: new Date('2024-01-20'), value: 82.1 }
        ]
      },
      {
        id: 'metric-6',
        name: t('sample.aiInsights.metric.researchVelocity.name'),
        value: 4.2,
        unit: t('sample.aiInsights.metric.researchVelocity.unit'),
        change: 15.3,
        trend: 'up',
        category: 'research',
        description: t('sample.aiInsights.metric.researchVelocity.description'),
        target: 5,
        historical: [
          { date: new Date('2024-01-14'), value: 3.6 },
          { date: new Date('2024-01-15'), value: 3.8 },
          { date: new Date('2024-01-16'), value: 3.9 },
          { date: new Date('2024-01-17'), value: 4.0 },
          { date: new Date('2024-01-18'), value: 4.1 },
          { date: new Date('2024-01-19'), value: 4.2 },
          { date: new Date('2024-01-20'), value: 4.2 }
        ]
      }
    ];

    return { insights: sampleInsights, metrics: sampleMetrics };
  };

  // Filter insights based on selections
  const filteredInsights = useMemo(() => {
    let filtered = insights;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(insight => insight.category === selectedCategory);
    }

    // Filter by type
    if (selectedInsightType !== 'all') {
      filtered = filtered.filter(insight => insight.type === selectedInsightType);
    }

    // Filter by document if specified
    if (documentId) {
      filtered = filtered.filter(insight => 
        insight.relatedDocuments?.includes(documentId)
      );
    }

    return filtered.sort((a, b) => {
      // Sort by impact first
      const impactOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const impactDiff = impactOrder[b.impact] - impactOrder[a.impact];
      if (impactDiff !== 0) return impactDiff;

      // Then by confidence
      const confidenceDiff = b.confidence - a.confidence;
      if (confidenceDiff !== 0) return confidenceDiff;

      // Finally by timestamp
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  }, [insights, selectedCategory, selectedInsightType, documentId]);

  // Filter metrics based on timeframe
  const filteredMetrics = useMemo(() => {
    return metrics.filter(metric => {
      // In a real implementation, this would filter based on the selected timeframe
      return true;
    });
  }, [metrics, timeframe]);

  function getInsightTypeIcon(type: string): string {
    const icons = {
      trend: '📈',
      recommendation: '💡',
      anomaly: '⚠️',
      prediction: '🔮',
      pattern: '🔍',
      efficiency: '⚡'
    };
    return icons[type as keyof typeof icons] || '📊';
  }

  function getImpactColor(impact: string): string {
    const colors = {
      low: '#6b7280',
      medium: '#f59e0b',
      high: '#f97316',
      critical: '#ef4444'
    };
    return colors[impact as keyof typeof colors] || '#6b7280';
  }

  function getCategoryColor(category: string): string {
    const colors = {
      productivity: '#10b981',
      quality: '#3b82f6',
      collaboration: '#8b5cf6',
      research: '#f59e0b',
      workflow: '#ef4444'
    };
    return colors[category as keyof typeof colors] || '#6b7280';
  }

  function getTrendIcon(trend: string): string {
    const icons = {
      up: '📈',
      down: '📉',
      stable: '➡️'
    };
    return icons[trend as keyof typeof icons] || '➡️';
  }

  function getTrendColor(trend: string): string {
    const colors = {
      up: '#10b981',
      down: '#ef4444',
      stable: '#6b7280'
    };
    return colors[trend as keyof typeof colors] || '#6b7280';
  }

  function getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      productivity: t('aiInsights.category.productivity') || 'Productivity',
      quality: t('aiInsights.category.quality') || 'Quality',
      collaboration: t('aiInsights.category.collaboration') || 'Collaboration',
      research: t('aiInsights.category.research') || 'Research',
      workflow: t('aiInsights.category.workflow') || 'Workflow'
    };
    return labels[category] || category;
  }

  function getImpactLabel(impact: string): string {
    const labels: Record<string, string> = {
      low: t('aiInsights.impact.low') || 'Low',
      medium: t('aiInsights.impact.medium') || 'Medium',
      high: t('aiInsights.impact.high') || 'High',
      critical: t('aiInsights.impact.critical') || 'Critical'
    };
    return labels[impact] || impact;
  }

  if (loading) {
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
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
        <div style={{ color: 'white', fontSize: '13px' }}>{t("aiInsights.loading")}</div>
      </div>
    );
  }

  return (
    <div className="ai-insights-analytics" style={{
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      padding: compact ? '16px' : '20px',
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
            color: 'white',
            margin: '0 0 6px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            🤖 {t("aiInsights.title")}
          </h3>
          <p style={{
            fontSize: '13px',
            color: 'rgba(255, 255, 255, 0.6)',
            margin: 0,
          }}>
            {t("aiInsights.subtitle")}
          </p>
        </div>
        
        <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
        }}>
          <div style={{
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.5)',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '4px 8px',
            borderRadius: '6px',
          }}>
            {filteredInsights.length} {t("aiInsights.insights")}
          </div>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '12px',
        marginBottom: '20px',
      }}>
        {filteredMetrics.slice(0, 6).map((metric) => (
          <div key={metric.id} style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '12px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '14px', fontWeight: '400', color: 'white', marginBottom: '4px', lineHeight: '1.2' }}>
              {metric.value}<span style={{ fontSize: '12px', fontWeight: '400', marginLeft: '4px' }}>{metric.unit}</span>
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px', lineHeight: '1.2' }}>
              {metric.name}
            </div>
            <div style={{
              fontSize: '10px',
              color: getTrendColor(metric.trend),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
            }}>
              {getTrendIcon(metric.trend)} {metric.change > 0 ? '+' : ''}{metric.change}%
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '20px',
        flexWrap: 'wrap',
      }}>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{
            padding: '6px 10px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '6px',
            background: 'rgba(255, 255, 255, 0.05)',
            color: 'white',
            fontSize: '12px',
          }}
        >
          <option value="all">{t("aiInsights.allCategories")}</option>
          <option value="productivity">{t("aiInsights.category.productivity")}</option>
          <option value="quality">{t("aiInsights.category.quality")}</option>
          <option value="collaboration">{t("aiInsights.category.collaboration")}</option>
          <option value="research">{t("aiInsights.category.research")}</option>
          <option value="workflow">{t("aiInsights.category.workflow")}</option>
        </select>
        
        <select
          value={selectedInsightType}
          onChange={(e) => setSelectedInsightType(e.target.value)}
          style={{
            padding: '6px 10px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '6px',
            background: 'rgba(255, 255, 255, 0.05)',
            color: 'white',
            fontSize: '12px',
          }}
        >
          <option value="all">{t("aiInsights.allTypes")}</option>
          <option value="trend">{t("aiInsights.type.trends")}</option>
          <option value="recommendation">{t("aiInsights.type.recommendations")}</option>
          <option value="anomaly">{t("aiInsights.type.anomalies")}</option>
          <option value="prediction">{t("aiInsights.type.predictions")}</option>
          <option value="pattern">{t("aiInsights.type.patterns")}</option>
          <option value="efficiency">{t("aiInsights.type.efficiency")}</option>
        </select>
      </div>

      {/* AI Insights List */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '16px',
        maxHeight: compact ? '300px' : '400px',
        overflowY: 'auto',
      }}>
        <h4 style={{
          fontSize: '14px',
          fontWeight: '600',
          color: 'white',
          margin: '0 0 12px 0',
        }}>
          {t("aiInsights.insightsCount", { count: filteredInsights.length })}
        </h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredInsights.map((insight) => (
            <div
              key={insight.id}
              style={{
                display: 'flex',
                gap: '12px',
                padding: '14px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              {/* Insight Icon & Type */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                <div style={{ fontSize: '16px' }}>
                  {getInsightTypeIcon(insight.type)}
                </div>
                <div style={{
                  fontSize: '9px',
                  color: getCategoryColor(insight.category),
                  fontWeight: '600',
                  textTransform: 'uppercase',
                }}>
                  {getCategoryLabel(insight.category)}
                </div>
              </div>
              
              {/* Insight Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: 'white',
                  marginBottom: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  {insight.title}
                  <span style={{
                    fontSize: '10px',
                    background: getImpactColor(insight.impact),
                    color: 'white',
                    padding: '1px 4px',
                    borderRadius: '3px',
                    fontWeight: '600',
                  }}>
                    {getImpactLabel(insight.impact)}
                  </span>
                </div>
                
                <div style={{
                  fontSize: '11px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  marginBottom: '6px',
                  lineHeight: '1.4',
                }}>
                  {insight.description}
                </div>
                
                {insight.actions && insight.actions.length > 0 && (
                  <div style={{
                    fontSize: '10px',
                    color: 'rgba(255, 255, 255, 0.5)',
                    marginBottom: '4px',
                  }}>
                    <strong>{t("aiInsights.actions")}:</strong> {insight.actions.slice(0, 2).join(', ')}
                    {insight.actions.length > 2 && ` +${insight.actions.length - 2} ${t("common.more")}`}
                  </div>
                )}
                
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                  fontSize: '9px',
                  color: 'rgba(255, 255, 255, 0.4)',
                }}>
                  <span>🎯 {Math.round(insight.confidence * 100)}% {t("aiInsights.confidence")}</span>
                  <span>📅 {insight.timestamp.toLocaleDateString()}</span>
                </div>
              </div>
              
              {/* Confidence Score */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                minWidth: '50px',
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: `conic-gradient(${getImpactColor(insight.impact)} ${insight.confidence * 360}deg, rgba(255, 255, 255, 0.1) 0deg)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: '700',
                  color: 'white',
                }}>
                  {Math.round(insight.confidence * 100)}%
                </div>
                <div style={{ fontSize: '8px', color: 'rgba(255, 255, 255, 0.5)' }}>
                  {t("aiInsights.confidence")}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredInsights.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: 'rgba(255, 255, 255, 0.5)',
          }}>
            <div style={{ fontSize: '13px', marginBottom: '8px' }}>
              🤖 {t("aiInsights.noInsights")}
            </div>
            <div style={{ fontSize: '12px' }}>
              {t("aiInsights.noInsightsHint")}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        marginTop: '16px',
        padding: '12px',
        background: 'rgba(99, 102, 241, 0.1)',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        borderRadius: '8px',
        fontSize: '11px',
        color: '#a5b4fc',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          🧠 {t("aiInsights.footer.summary", { insights: filteredInsights.length, metrics: filteredMetrics.length })}
        </div>
        <div>
          📊 {t("aiInsights.footer.updated")} {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
