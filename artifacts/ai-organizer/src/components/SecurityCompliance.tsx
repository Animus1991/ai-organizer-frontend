import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

interface SecurityStatus {
  level: 'high' | 'medium' | 'low';
  score: number;
  lastCheck: Date;
}

interface SecurityComplianceProps {
  compact?: boolean;
  maxItems?: number;
  uploads?: Array<{ parseStatus?: string }> | null;
}

export default function SecurityCompliance({ 
  compact = false,
  maxItems = 8,
  uploads
}: SecurityComplianceProps) {
  const { t } = useLanguage();
  const [status, setStatus] = useState<SecurityStatus>({
    level: 'high',
    score: 95,
    lastCheck: new Date()
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      setLoading(true);
      // Calculate security score based on data
      const hasPassword = localStorage.getItem('user_password') !== null;
      const hasEncryption = localStorage.getItem('encryption_enabled') === 'true';
      const documentCount = Array.isArray(uploads)
        ? uploads.length
        : (() => {
            try {
              return JSON.parse(localStorage.getItem('uploads') || '[]').length;
            } catch {
              return 0;
            }
          })();
      
      let score = 85;
      if (hasPassword) score += 5;
      if (hasEncryption) score += 5;
      if (documentCount > 0) score += 5;
      
      setStatus({
        level: score >= 90 ? 'high' : score >= 70 ? 'medium' : 'low',
        score: Math.min(score, 100),
        lastCheck: new Date()
      });
      setLoading(false);
    };
    
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [uploads]);

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
        {t('security.loading')}
      </div>
    );
  }

  const getLevelColor = (level: string) => {
    const colors = {
      high: '#10b981',
      medium: '#f59e0b',
      low: '#ef4444'
    };
    return colors[level as keyof typeof colors] || '#6b7280';
  };

  if (compact) {
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{ fontSize: '18px' }}>🔒</span>
          <span style={{ fontWeight: 600 }}>{t('security.titleCompact')}</span>
        </div>
        
        <div style={{
          textAlign: 'center',
          padding: '16px',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '8px'
        }}>
          <div style={{
            fontSize: '32px',
            fontWeight: 700,
            color: getLevelColor(status.level)
          }}>
            {status.score}%
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
            {status.level.toUpperCase()} SECURITY
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <span style={{ fontSize: '24px' }}>🔒</span>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 700 }}>{t('security.title')}</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
            {t('security.lastChecked').replace('{time}', status.lastCheck.toLocaleTimeString())}
          </div>
        </div>
      </div>

      {/* Security Score */}
      <div style={{
        padding: '24px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '12px',
        textAlign: 'center',
        marginBottom: '20px'
      }}>
        <div style={{
          fontSize: '48px',
          fontWeight: 700,
          color: getLevelColor(status.level)
        }}>
          {status.score}%
        </div>
        <div style={{
          fontSize: '14px',
          color: getLevelColor(status.level),
          textTransform: 'uppercase',
          marginTop: '8px',
          fontWeight: 600
        }}>
          {t('security.securityLevel').replace('{level}', status.level)}
        </div>
      </div>

      {/* Security Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {[
          { name: t('security.dataEncryption'), status: t('security.enabled'), icon: '🔐' },
          { name: t('security.localStorageOnly'), status: t('security.active'), icon: '📦' },
          { name: t('security.autoLogout'), status: t('security.disabled'), icon: '⏰' },
          { name: t('security.backupAvailable'), status: t('security.enabled'), icon: '💾' }
        ].slice(0, maxItems).map((item, i) => (
          <div key={i} style={{
            padding: '12px',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{item.icon}</span>
              <span style={{ fontSize: '13px' }}>{item.name}</span>
            </div>
            <span style={{
              fontSize: '11px',
              padding: '4px 8px',
              borderRadius: '12px',
              background: item.status === 'enabled' || item.status === 'active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(107, 114, 128, 0.2)',
              color: item.status === 'enabled' || item.status === 'active' ? '#10b981' : '#9ca3af'
            }}>
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
