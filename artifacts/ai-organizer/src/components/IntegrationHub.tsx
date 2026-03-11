import { useState, useEffect } from 'react';
import { getAccessToken } from '../lib/api';
import { useLanguage } from '../context/LanguageContext';

export default function IntegrationHub({ compact = false, maxItems = 10 }: { compact?: boolean; maxItems?: number }) {
  const { t } = useLanguage();
  const [integrations, setIntegrations] = useState([
    { id: '1', name: 'Local Storage', status: 'connected', type: 'storage' },
    { id: '2', name: 'AI Engine', status: 'connected', type: 'ai' },
    { id: '3', name: 'Export Module', status: 'connected', type: 'export' },
    { id: '4', name: 'Auth Session', status: 'connected', type: 'auth' }
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      setLoading(true);
      let storageOk = true;
      try {
        localStorage.setItem("__aiorg_test__", "1");
        localStorage.removeItem("__aiorg_test__");
      } catch {
        storageOk = false;
      }
      const isOnline = navigator.onLine;
      const hasToken = Boolean(getAccessToken());

      setIntegrations([
        { id: '1', name: t('integrations.localStorage'), status: storageOk ? 'connected' : 'disconnected', type: 'storage' },
        { id: '2', name: t('integrations.aiEngine'), status: isOnline ? 'connected' : 'disconnected', type: 'ai' },
        { id: '3', name: t('integrations.exportModule'), status: 'connected', type: 'export' },
        { id: '4', name: t('integrations.authSession'), status: hasToken ? 'connected' : 'disconnected', type: 'auth' }
      ]);
      setLoading(false);
    };
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div style={{ padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>{t('integrations.loading')}</div>;

  const getStatusColor = (status: string) => status === 'connected' ? '#10b981' : '#ef4444';

  if (compact) {
    return (
      <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{ fontSize: '18px' }}>🔗</span>
          <span style={{ fontWeight: 600 }}>{t('integrations.titleCompact')}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {integrations.slice(0, maxItems).map(int => (
            <div key={int.id} style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
              <span>{int.name}</span>
              <span style={{ color: getStatusColor(int.status) }}>●</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <span style={{ fontSize: '24px' }}>🔗</span>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 700 }}>{t('integrations.title')}</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>{t('integrations.connectedCount').replace('{count}', String(integrations.filter(i => i.status === 'connected').length)).replace('{total}', String(integrations.length))}</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {integrations.slice(0, maxItems).map(integration => (
          <div key={integration.id} style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🔗</div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>{integration.name}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{integration.type}</div>
              </div>
            </div>
            <span style={{ padding: '4px 12px', borderRadius: '12px', background: `${getStatusColor(integration.status)}20`, color: getStatusColor(integration.status), fontSize: '12px', textTransform: 'uppercase' }}>{integration.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
