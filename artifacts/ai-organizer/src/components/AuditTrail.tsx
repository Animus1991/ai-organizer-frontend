import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function AuditTrail({ compact = false, maxItems = 20, uploads, userEmail }: { compact?: boolean; maxItems?: number; uploads?: Array<{ parseStatus?: string; filename?: string; createdAt?: string; documentId?: number }> | null; userEmail?: string | null }) {
  const { t } = useLanguage();
  const [events, setEvents] = useState<Array<{ id: string; action: string; user: string; timestamp: Date }>>([]);
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
      const auditEvents = uploadList.slice(0, maxItems).map((u: any, i: number) => ({
        id: `audit-${i}`,
        action: u.parseStatus === 'ok' ? 'DOCUMENT_UPLOADED' : 'DOCUMENT_UPLOAD_FAILED',
        user: userEmail || t('users.currentUser'),
        timestamp: new Date(u.createdAt || Date.now())
      }));
      setEvents(auditEvents.reverse());
      setLoading(false);
    };
    loadData();
  }, [maxItems, uploads, userEmail]);

  if (loading) return <div style={{ padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>{t('audit.loading')}</div>;

  if (compact) {
    return (
      <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{ fontSize: '18px' }}>📋</span>
          <span style={{ fontWeight: 600 }}>{t('audit.titleCompact')}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {events.slice(0, 5).map(event => (
            <div key={event.id} style={{ padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', fontSize: '11px' }}>
              <span style={{ color: '#a5b4fc' }}>{event.action}</span>
              <span style={{ color: 'rgba(255,255,255,0.4)', marginLeft: '8px' }}>{event.timestamp.toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <span style={{ fontSize: '24px' }}>📋</span>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 700 }}>{t('audit.title')}</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>{t('audit.events').replace('{count}', String(events.length))}</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {events.slice(0, maxItems).map(event => (
          <div key={event.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ color: '#a5b4fc', fontSize: '12px', fontWeight: 600 }}>{event.action}</span>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginLeft: '8px' }}>{t('audit.by').replace('{user}', event.user)}</span>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>{event.timestamp.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
