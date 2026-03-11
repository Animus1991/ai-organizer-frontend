import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  status: 'optimal' | 'warning' | 'critical';
}

interface PerformanceMonitoringProps {
  compact?: boolean;
  showAlerts?: boolean;
  showHistory?: boolean;
  refreshInterval?: number;
  maxMetrics?: number;
  uploads?: Array<{ parseStatus?: string; sizeBytes?: number }> | null;
}

export default function PerformanceMonitoring({ 
  compact = false,
  showAlerts = true,
  showHistory = true,
  refreshInterval = 5000,
  maxMetrics = 12,
  uploads
}: PerformanceMonitoringProps) {
  const { t } = useLanguage();
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate real performance metrics
  const generateRealMetrics = (): PerformanceMetric[] => {
    const uploadList = Array.isArray(uploads)
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

    const documentCount = uploadList.length;
    const parsedCount = uploadList.filter((u: any) => u.parseStatus === 'ok').length;

    // Calculate memory usage from localStorage
    let totalSize = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        totalSize += localStorage.getItem(key)?.length || 0;
      }
    }
    const memoryUsageMB = (totalSize / 1024 / 1024);
    const memoryPercent = Math.min((memoryUsageMB / 5) * 100, 100); // Assume 5MB limit

    // Calculate metrics
    const parseSuccessRate = documentCount > 0 ? (parsedCount / documentCount) * 100 : 100;
    
    const apiBase = import.meta.env.VITE_API_BASE_URL?.toString() || "";
    const entries = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
    const apiEntries = entries.filter((entry) =>
      apiBase ? entry.name.startsWith(apiBase) : entry.name.includes("/api/")
    );
    const avgLatency = apiEntries.length
      ? Math.round(apiEntries.reduce((sum, entry) => sum + entry.duration, 0) / apiEntries.length)
      : 0;

    return [
      {
        name: t('perf.documentsStored'),
        value: documentCount,
        unit: 'docs',
        status: documentCount > 100 ? 'warning' : 'optimal'
      },
      {
        name: t('perf.parseSuccessRate'),
        value: Math.round(parseSuccessRate),
        unit: '%',
        status: parseSuccessRate < 90 ? 'warning' : 'optimal'
      },
      {
        name: t('perf.localStorageUsage'),
        value: Math.round(memoryPercent),
        unit: '%',
        status: memoryPercent > 80 ? 'critical' : memoryPercent > 60 ? 'warning' : 'optimal'
      },
      {
        name: t('perf.aiModelsReady'),
        value: 3,
        unit: 'models',
        status: 'optimal'
      },
      {
        name: t('perf.responseTime'),
        value: avgLatency || 0,
        unit: 'ms',
        status: avgLatency > 1500 ? 'critical' : avgLatency > 600 ? 'warning' : 'optimal'
      },
      {
        name: t('perf.activeSessions'),
        value: 1,
        unit: 'user',
        status: 'optimal'
      }
    ];
  };

  useEffect(() => {
    const loadData = () => {
      setLoading(true);
      setMetrics(generateRealMetrics());
      setLoading(false);
    };
    
    loadData();
    const interval = setInterval(loadData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, uploads]);

  const getStatusColor = (status: string) => {
    const colors = {
      optimal: '#10b981',
      warning: '#f59e0b',
      critical: '#ef4444'
    };
    return colors[status as keyof typeof colors] || '#6b7280';
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
        {t('perf.loading')}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{ fontSize: '14px' }}>📊</span>
          <span style={{ fontWeight: 600, fontSize: '13px' }}>{t('perf.titleCompact')}</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {metrics.slice(0, maxMetrics).map(metric => (
            <div key={metric.name} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '6px'
            }}>
              <span style={{ fontSize: '12px' }}>{metric.name}</span>
              <span style={{
                fontSize: '12px',
                fontWeight: 600,
                color: getStatusColor(metric.status)
              }}>
                {metric.value}{metric.unit}
              </span>
            </div>
          ))}
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
          <span style={{ fontSize: '18px' }}>📊</span>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>{t('perf.title')}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
              {t('perf.subtitle')}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px'
      }}>
        {metrics.slice(0, maxMetrics).map(metric => (
          <div key={metric.name} style={{
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            border: `1px solid ${getStatusColor(metric.status)}30`
          }}>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
              {metric.name}
            </div>
            <div style={{
              fontSize: '16px',
              fontWeight: 600,
              color: getStatusColor(metric.status)
            }}>
              {metric.value}
              <span style={{ fontSize: '12px', marginLeft: '4px' }}>{metric.unit}</span>
            </div>
            <div style={{
              fontSize: '11px',
              color: getStatusColor(metric.status),
              textTransform: 'uppercase',
              marginTop: '4px'
            }}>
              {metric.status}
            </div>
          </div>
        ))}
      </div>

      {/* Alerts Section */}
      {showAlerts && metrics.some(m => m.status !== 'optimal') && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>
            ⚠️ {t('perf.activeAlerts')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {metrics.filter(m => m.status !== 'optimal').map(metric => (
              <div key={metric.name} style={{
                padding: '12px',
                background: metric.status === 'critical' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                borderRadius: '8px',
                borderLeft: `3px solid ${getStatusColor(metric.status)}`,
                fontSize: '13px'
              }}>
                <span style={{ fontWeight: 600 }}>{metric.name}</span> is at {metric.value}{metric.unit} - {metric.status}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History Section */}
      {showHistory && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>
            📊 {t('perf.recentHistory')}
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
            {t('perf.refreshedEvery').replace('{seconds}', String(refreshInterval / 1000))}
          </div>
        </div>
      )}
    </div>
  );
}
