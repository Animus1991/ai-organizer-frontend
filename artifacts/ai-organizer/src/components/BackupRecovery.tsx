import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

interface BackupJob {
  id: string;
  name: string;
  type: 'auto' | 'manual';
  status: 'completed' | 'running' | 'failed';
  size: number;
  createdAt: Date;
  documents: number;
}

interface BackupRecoveryProps {
  compact?: boolean;
  showJobs?: boolean;
  showRestorePoints?: boolean;
  showMetrics?: boolean;
  maxItems?: number;
  uploads?: Array<{ sizeBytes?: number }> | null;
}

export default function BackupRecovery({ 
  compact = false,
  showJobs = true,
  showRestorePoints = true,
  showMetrics = true,
  maxItems = 8,
  uploads
}: BackupRecoveryProps) {
  const { t } = useLanguage();
  const [backups, setBackups] = useState<BackupJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      setLoading(true);
      
      // Generate backup data from localStorage
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
      const totalSize = uploadList.reduce((sum: number, u: any) => sum + (u.sizeBytes || 0), 0);

      const backupList: BackupJob[] = [];
      
      if (documentCount > 0) {
        // Create backup entries based on document history
        const now = Date.now();
        for (let i = 0; i < Math.min(3, Math.ceil(documentCount / 5)); i++) {
          backupList.push({
            id: `backup-${i}`,
            name: t('backup.autoBackup').replace('{n}', String(i + 1)),
            type: 'auto',
            status: 'completed',
            size: Math.floor(totalSize / (i + 1)),
            createdAt: new Date(now - 1000 * 60 * 60 * 24 * (i + 1)),
            documents: Math.floor(documentCount / (i + 1))
          });
        }
      }
      
      setBackups(backupList);
      setLoading(false);
    };
    
    loadData();
  }, [uploads]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const formatTimeAgo = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const days = Math.floor(diff / 86400000);
    if (days < 1) return t('backup.today');
    if (days === 1) return t('backup.yesterday');
    return t('backup.daysAgo').replace('{days}', String(days));
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
        {t('backup.loading')}
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
          <span style={{ fontSize: '18px' }}>💾</span>
          <span style={{ fontWeight: 600 }}>{t('backup.titleCompact')}</span>
          <span style={{
            background: backups.length > 0 ? '#10b981' : '#6b7280',
            color: 'white',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '11px'
          }}>
            {backups.length}
          </span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {backups.slice(0, maxItems).map(backup => (
            <div key={backup.id} style={{
              padding: '10px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '8px',
              fontSize: '12px'
            }}>
              <div style={{ fontWeight: 500 }}>{backup.name}</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                {formatSize(backup.size)} • {formatTimeAgo(backup.createdAt)}
              </div>
            </div>
          ))}
          {backups.length === 0 && (
            <div style={{ textAlign: 'center', padding: '16px', color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
              {t('backup.noBackups')}
            </div>
          )}
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
        <span style={{ fontSize: '24px' }}>💾</span>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 700 }}>{t('backup.title')}</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
            {t('backup.available').replace('{count}', String(backups.length))}
          </div>
        </div>
      </div>

      {/* Backup Actions */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <button style={{
          padding: '10px 20px',
          background: 'rgba(99, 102, 241, 0.2)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: '8px',
          color: '#a5b4fc',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 500
        }}>
          📥 {t('backup.exportData')}
        </button>
        <button style={{
          padding: '10px 20px',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '8px',
          color: 'white',
          cursor: 'pointer',
          fontSize: '13px'
        }}>
          📤 {t('backup.importData')}
        </button>
      </div>

      {/* Backup List */}
      {showJobs && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {backups.slice(0, maxItems).map(backup => (
            <div key={backup.id} style={{
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px'
                }}>
                  💾
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>{backup.name}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                    {backup.documents} {t('backup.documents')} • {formatSize(backup.size)}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontSize: '11px',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#10b981',
                  textTransform: 'uppercase'
                }}>
                  {backup.status}
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
                  {formatTimeAgo(backup.createdAt)}
                </div>
              </div>
            </div>
          ))}
          {backups.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: 'rgba(255,255,255,0.5)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>💾</div>
              <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                {t('backup.noBackupsTitle')}
              </div>
              <div style={{ fontSize: '14px' }}>
                {t('backup.noBackupsMsg')}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Restore Points */}
      {showRestorePoints && backups.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
            🔄 {t('backup.restorePoints')}
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
            {t('backup.restoreAvailable').replace('{count}', String(backups.length))}
          </div>
        </div>
      )}

      {/* Metrics */}
      {showMetrics && backups.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
            📊 {t('backup.metrics')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#10b981' }}>
                {backups.reduce((sum, b) => sum + b.documents, 0)}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>{t('backup.totalDocuments')}</div>
            </div>
            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#6366f1' }}>
                {formatSize(backups.reduce((sum, b) => sum + b.size, 0))}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>{t('backup.totalSize')}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
