import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  status: 'active' | 'inactive';
  lastActive: Date;
  documentsCreated: number;
}

interface UserManagementProps {
  compact?: boolean;
  maxItems?: number;
  uploads?: Array<{ parseStatus?: string }> | null;
  userEmail?: string | null;
}

export default function UserManagement({ 
  compact = false,
  maxItems = 8,
  uploads,
  userEmail
}: UserManagementProps) {
  const { t } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      setLoading(true);
      
      // Get current user info
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

      // Create user list (single user for now)
      const userList: User[] = [
        {
          id: 'user-1',
          name: t('users.currentUser'),
          email: userEmail || 'user@aiorganizer.local',
          role: 'admin',
          status: 'active',
          lastActive: new Date(),
          documentsCreated: documentCount
        }
      ];
      
      setUsers(userList);
      setLoading(false);
    };
    
    loadData();
  }, [uploads, userEmail]);

  const getRoleColor = (role: string) => {
    const colors = {
      admin: '#ef4444',
      user: '#3b82f6',
      viewer: '#6b7280'
    };
    return colors[role as keyof typeof colors] || '#6b7280';
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
        {t('users.loading')}
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
          <span style={{ fontSize: '18px' }}>👥</span>
          <span style={{ fontWeight: 600 }}>{t('users.titleCompact')}</span>
          <span style={{
            background: '#3b82f6',
            color: 'white',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '11px'
          }}>
            {users.length}
          </span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {users.slice(0, maxItems).map(user => (
            <div key={user.id} style={{
              padding: '10px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px'
              }}>
                {user.name.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>{user.name}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{user.role}</div>
              </div>
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <span style={{ fontSize: '24px' }}>👥</span>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 700 }}>{t('users.title')}</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
            {t('users.subtitleCount').replace('{count}', String(users.length)).replace('{active}', String(users.filter(u => u.status === 'active').length))}
          </div>
        </div>
      </div>

      {/* Users List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {users.slice(0, maxItems).map(user => (
          <div key={user.id} style={{
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              fontWeight: 600
            }}>
              {user.name.charAt(0)}
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '15px', fontWeight: 600 }}>{user.name}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>
                {user.email}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
                {t('users.docsCreated').replace('{count}', String(user.documentsCreated))}
              </div>
            </div>
            
            <div style={{ textAlign: 'right' }}>
              <span style={{
                fontSize: '11px',
                padding: '4px 10px',
                borderRadius: '12px',
                background: `${getRoleColor(user.role)}20`,
                color: getRoleColor(user.role),
                textTransform: 'uppercase',
                fontWeight: 600
              }}>
                {user.role}
              </span>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '6px' }}>
                {t('users.activeNow')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
