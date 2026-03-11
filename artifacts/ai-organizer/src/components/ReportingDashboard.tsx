import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function ReportingDashboard({ compact = false, maxItems = 10, uploads }: { compact?: boolean; maxItems?: number; uploads?: Array<{ parseStatus?: string }> | null }) {
  const { t } = useLanguage();
  const [reports, setReports] = useState<Array<{ id: string; name: string; type: string; generatedAt: Date }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      setLoading(true);
      const uploadList = Array.isArray(uploads)
        ? uploads
        : (() => {
            try {
              return JSON.parse(localStorage.getItem('uploads') || '[]');
            } catch {
              return [];
            }
          })();
      const documentCount = uploadList.length;
      
      const reportList = [];
      if (documentCount > 0) {
        reportList.push(
          { id: 'r1', name: t('reports.docAnalysis'), type: 'analysis', generatedAt: new Date() },
          { id: 'r2', name: t('reports.storageUsage'), type: 'system', generatedAt: new Date(Date.now() - 86400000) }
        );
      }
      setReports(reportList);
      setLoading(false);
    };
    loadData();
  }, [uploads]);

  if (loading) return <div style={{ padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>{t('reports.loading')}</div>;

  if (compact) {
    return (
      <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{ fontSize: '18px' }}>📄</span>
          <span style={{ fontWeight: 600 }}>{t('reports.titleCompact')}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {reports.slice(0, maxItems).map(report => (
            <div key={report.id} style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', fontSize: '12px' }}>
              <div style={{ fontWeight: 500 }}>{report.name}</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>{report.type}</div>
            </div>
          ))}
          {reports.length === 0 && <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>{t('reports.noReports')}</div>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <span style={{ fontSize: '24px' }}>📄</span>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 700 }}>{t('reports.title')}</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>{t('reports.available').replace('{count}', String(reports.length))}</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {reports.slice(0, maxItems).map(report => (
          <div key={report.id} style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>{report.name}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{report.type} • {report.generatedAt.toLocaleDateString()}</div>
            </div>
            <button style={{ padding: '8px 16px', background: 'rgba(99, 102, 241, 0.2)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '6px', color: '#a5b4fc', fontSize: '12px', cursor: 'pointer' }}>{t('reports.download')}</button>
          </div>
        ))}
        {reports.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px', color: 'rgba(255,255,255,0.5)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
            <div style={{ fontSize: '16px', fontWeight: 600 }}>{t('reports.noReportsTitle')}</div>
            <div style={{ fontSize: '14px' }}>{t('reports.noReportsMsg')}</div>
          </div>
        )}
      </div>
    </div>
  );
}
