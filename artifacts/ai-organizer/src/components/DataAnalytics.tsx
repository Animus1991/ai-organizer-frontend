import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

interface AnalyticsData {
  totalDocuments: number;
  parsedDocuments: number;
  pendingDocuments: number;
  failedDocuments: number;
  totalStorageMB: number;
  averageDocumentSize: number;
  documentsByType: Record<string, number>;
  recentActivity: Array<{
    action: string;
    timestamp: Date;
    details: string;
  }>;
}

interface DataAnalyticsProps {
  compact?: boolean;
  showCharts?: boolean;
  showReports?: boolean;
  showExport?: boolean;
  maxCharts?: number;
  maxReports?: number;
  uploads?: Array<{ parseStatus?: string; sizeBytes?: number; contentType?: string; filename?: string; createdAt?: string }> | null;
}

export default function DataAnalytics({ 
  compact = false,
  showCharts = true,
  showReports = true,
  showExport = true,
  maxCharts = 6,
  maxReports = 8,
  uploads
}: DataAnalyticsProps) {
  const { t } = useLanguage();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const generateRealAnalytics = (): AnalyticsData => {
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

    const parsed = uploadList.filter((u: any) => u.parseStatus === 'ok');
    const pending = uploadList.filter((u: any) => u.parseStatus === 'pending');
    const failed = uploadList.filter((u: any) => u.parseStatus === 'error');
    
    const totalSize = uploadList.reduce((sum: number, u: any) => sum + (u.sizeBytes || 0), 0);
    
    const byType: Record<string, number> = {};
    uploadList.forEach((u: any) => {
      const type = u.contentType || 'unknown';
      byType[type] = (byType[type] || 0) + 1;
    });

    const activity = uploadList.slice(0, 5).map((u: any) => ({
      action: u.parseStatus === 'ok' ? t('analytics.docParsed') : t('analytics.docUploaded'),
      timestamp: new Date(u.createdAt || Date.now()),
      details: u.filename
    }));

    return {
      totalDocuments: uploadList.length,
      parsedDocuments: parsed.length,
      pendingDocuments: pending.length,
      failedDocuments: failed.length,
      totalStorageMB: Math.round((totalSize / 1024 / 1024) * 100) / 100,
      averageDocumentSize: uploadList.length > 0 ? Math.round(totalSize / uploadList.length / 1024) : 0,
      documentsByType: byType,
      recentActivity: activity
    };
  };

  useEffect(() => {
    const loadData = () => {
      setLoading(true);
      setData(generateRealAnalytics());
      setLoading(false);
    };
    
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [uploads]);

  if (loading || !data) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
        {t('analytics.loading')}
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
          <span style={{ fontSize: '14px' }}>📈</span>
          <span style={{ fontWeight: 600, fontSize: '13px' }}>{t('analytics.titleCompact')}</span>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          <div style={{ textAlign: 'center', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#6366f1' }}>{data.totalDocuments}</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>{t('analytics.documents')}</div>
          </div>
          <div style={{ textAlign: 'center', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#10b981' }}>{data.parsedDocuments}</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>{t('analytics.parsed')}</div>
          </div>
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '18px' }}>📈</span>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>{t('analytics.title')}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
              {t('analytics.subtitle')}
            </div>
          </div>
        </div>
        {showExport && (
          <button style={{
            padding: '8px 16px',
            background: 'rgba(99, 102, 241, 0.2)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '8px',
            color: '#a5b4fc',
            cursor: 'pointer',
            fontSize: '13px'
          }}>
            📥 {t('analytics.exportData')}
          </button>
        )}
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '12px',
        marginBottom: '20px'
      }}>
        {[
          { label: t('analytics.totalDocuments'), value: data.totalDocuments, color: '#6366f1' },
          { label: t('analytics.parsed'), value: data.parsedDocuments, color: '#10b981' },
          { label: t('analytics.pending'), value: data.pendingDocuments, color: '#f59e0b' },
          { label: t('analytics.failed'), value: data.failedDocuments, color: '#ef4444' },
          { label: t('analytics.storage'), value: `${data.totalStorageMB} MB`, color: '#8b5cf6' },
          { label: t('analytics.avgSize'), value: `${data.averageDocumentSize} KB`, color: '#06b6d4' }
        ].slice(0, maxCharts).map(stat => (
          <div key={stat.label} style={{
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
              {stat.label}
            </div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: stat.color }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Document Types */}
      {showCharts && Object.keys(data.documentsByType).length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>
            {t('analytics.documentsByType')}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {Object.entries(data.documentsByType).map(([type, count]) => (
              <div key={type} style={{
                padding: '8px 12px',
                background: 'rgba(99, 102, 241, 0.1)',
                borderRadius: '20px',
                fontSize: '12px'
              }}>
                <span style={{ color: '#a5b4fc' }}>{type}:</span>
                <span style={{ marginLeft: '4px', fontWeight: 600 }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {showReports && data.recentActivity.length > 0 && (
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>
            {t('analytics.recentActivity')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {data.recentActivity.slice(0, maxReports).map((activity, i) => (
              <div key={i} style={{
                padding: '10px 12px',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 500 }}>{activity.action}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{activity.details}</div>
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                  {new Date(activity.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
