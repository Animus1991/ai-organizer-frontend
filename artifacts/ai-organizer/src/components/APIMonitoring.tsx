import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function APIMonitoring({ compact = false, maxItems = 8, online }: { compact?: boolean; maxItems?: number; online?: boolean }) {
  const { t } = useLanguage();
  const [apis, setApis] = useState([
    { name: 'Document API', status: 'operational', latency: 0 },
    { name: 'Upload API', status: 'operational', latency: 0 },
    { name: 'AI Analysis API', status: 'operational', latency: 0 }
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      setLoading(true);
      const apiBase = import.meta.env.VITE_API_BASE_URL?.toString() || "";
      const entries = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
      const apiEntries = entries.filter((entry) =>
        apiBase ? entry.name.startsWith(apiBase) : entry.name.includes("/api/")
      );
      const average = (match: (name: string) => boolean) => {
        const matched = apiEntries.filter((e) => match(e.name));
        if (!matched.length) return 0;
        return Math.round(matched.reduce((sum, e) => sum + e.duration, 0) / matched.length);
      };
      const isOnline = online ?? navigator.onLine;
      const nextApis = [
        {
          name: t('apiMon.documentApi'),
          latency: average((name) => name.includes("/documents")),
        },
        {
          name: t('apiMon.uploadApi'),
          latency: average((name) => name.includes("/upload") || name.includes("/uploads")),
        },
        {
          name: t('apiMon.aiAnalysisApi'),
          latency: average((name) => name.includes("/segment") || name.includes("/graph")),
        },
      ].map((api) => ({
        ...api,
        status: !isOnline ? "down" : api.latency > 1500 ? "degraded" : "operational",
      }));

      setApis(nextApis);
      setLoading(false);
    };

    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [online]);

  if (loading) return <div style={{ padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>{t('apiMon.loading')}</div>;

  if (compact) {
    return (
      <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{ fontSize: '18px' }}>🔌</span>
          <span style={{ fontWeight: 600 }}>{t('apiMon.titleCompact')}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {apis.slice(0, maxItems).map(api => (
            <div key={api.name} style={{ padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
              <span>{api.name}</span>
              <span style={{ color: api.status === 'operational' ? '#10b981' : '#ef4444' }}>●</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <span style={{ fontSize: '24px' }}>🔌</span>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 700 }}>{t('apiMon.title')}</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>{t('apiMon.operational').replace('{count}', String(apis.filter(a => a.status === 'operational').length)).replace('{total}', String(apis.length))}</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {apis.slice(0, maxItems).map(api => (
          <div key={api.name} style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>{api.name}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{t('apiMon.latency').replace('{ms}', String(api.latency))}</div>
            </div>
            <span style={{ padding: '4px 12px', borderRadius: '12px', background: api.status === 'operational' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: api.status === 'operational' ? '#10b981' : '#ef4444', fontSize: '12px', textTransform: 'uppercase' }}>{api.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
