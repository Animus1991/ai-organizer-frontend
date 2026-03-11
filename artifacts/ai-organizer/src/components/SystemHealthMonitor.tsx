import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function SystemHealthMonitor({ compact = false, maxItems = 8, uploads }: { compact?: boolean; maxItems?: number; uploads?: Array<{ parseStatus?: string }> | null }) {
  const { t } = useLanguage();
  const [health, setHealth] = useState({ status: 'healthy', score: 98 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      setLoading(true);
      // Calculate health based on data
      const uploadList = Array.isArray(uploads)
        ? uploads
        : (() => {
            try {
              return JSON.parse(localStorage.getItem('uploads') || '[]');
            } catch {
              return [];
            }
          })();
      const failed = uploadList.filter((u: any) => u.parseStatus === 'error').length;
      const score = Math.max(0, 100 - failed * 5);
      
      setHealth({
        status: score > 90 ? 'healthy' : score > 70 ? 'degraded' : 'critical',
        score
      });
      setLoading(false);
    };
    loadData();
  }, [uploads]);

  if (loading) return <div style={{ padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>{t('health.loading')}</div>;

  const color = health.status === 'healthy' ? '#10b981' : health.status === 'degraded' ? '#f59e0b' : '#ef4444';

  if (compact) {
    return (
      <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{ fontSize: '18px' }}>❤️</span>
          <span style={{ fontWeight: 600 }}>{t('health.titleCompact')}</span>
        </div>
        <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
          <div style={{ fontSize: '28px', fontWeight: 700, color }}>{health.score}%</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>{health.status}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <span style={{ fontSize: '24px' }}>❤️</span>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 700 }}>{t('health.title')}</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>{t('health.overallStatus')}</div>
        </div>
      </div>
      <div style={{ textAlign: 'center', padding: '32px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
        <div style={{ fontSize: '56px', fontWeight: 700, color }}>{health.score}%</div>
        <div style={{ fontSize: '16px', color, textTransform: 'uppercase', marginTop: '8px', fontWeight: 600 }}>{health.status}</div>
      </div>
    </div>
  );
}
