import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function LogManagement({ compact = false, maxItems = 20, uploads }: { compact?: boolean; maxItems?: number; uploads?: Array<{ parseStatus?: string; filename?: string; createdAt?: string }> | null }) {
  const { t } = useLanguage();
  const [logs, setLogs] = useState<Array<{ id: string; level: string; message: string; timestamp: Date }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      setLoading(true);
      // Generate logs from uploads
      const uploadList = Array.isArray(uploads)
        ? uploads
        : (() => {
            try {
              return JSON.parse(localStorage.getItem('uploads') || '[]');
            } catch {
              return [];
            }
          })();
      const logEntries = uploadList.slice(0, maxItems).map((u: any, i: number) => ({
        id: `log-${i}`,
        level: u.parseStatus === 'ok' ? 'info' : u.parseStatus === 'error' ? 'error' : 'warning',
        message: u.parseStatus === 'ok' ? t('logs.parsed').replace('{name}', u.filename || '') : t('logs.failedParse').replace('{name}', u.filename || ''),
        timestamp: new Date(u.createdAt || Date.now())
      }));
      setLogs(logEntries.reverse());
      setLoading(false);
    };
    loadData();
  }, [maxItems, uploads]);

  if (loading) return <div style={{ padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>{t('logs.loading')}</div>;

  const getLevelColor = (level: string) => {
    const colors = { info: '#3b82f6', warning: '#f59e0b', error: '#ef4444' };
    return colors[level as keyof typeof colors] || '#6b7280';
  };

  if (compact) {
    return (
      <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{ fontSize: '18px' }}>📝</span>
          <span style={{ fontWeight: 600 }}>{t('logs.titleCompact')}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {logs.slice(0, 5).map(log => (
            <div key={log.id} style={{ padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', fontSize: '11px', borderLeft: `3px solid ${getLevelColor(log.level)}` }}>
              <span style={{ color: getLevelColor(log.level), fontWeight: 600 }}>{log.level.toUpperCase()}</span>
              <span style={{ color: 'rgba(255,255,255,0.6)', marginLeft: '8px' }}>{log.message.substring(0, 30)}...</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <span style={{ fontSize: '24px' }}>📝</span>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 700 }}>{t('logs.title')}</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>{t('logs.entries').replace('{count}', String(logs.length))}</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {logs.slice(0, maxItems).map(log => (
          <div key={log.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: `3px solid ${getLevelColor(log.level)}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: getLevelColor(log.level), fontSize: '11px', fontWeight: 600 }}>{log.level.toUpperCase()}</span>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>{log.timestamp.toLocaleTimeString()}</span>
            </div>
            <div style={{ fontSize: '13px', marginTop: '4px' }}>{log.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
