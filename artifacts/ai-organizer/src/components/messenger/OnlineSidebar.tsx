/**
 * OnlineSidebar - Shows online users in a compact sidebar panel
 */
import React from 'react';
import { Circle } from 'lucide-react';
import type { MessengerUser } from './types';

interface OnlineSidebarProps {
  users: MessengerUser[];
  currentUserId: string;
  onSelectUser: (userId: string) => void;
}

const statusConfig: Record<string, { color: string; label: string }> = {
  online: { color: 'hsl(142 71% 45%)', label: 'Online' },
  away: { color: 'hsl(38 92% 50%)', label: 'Away' },
  busy: { color: 'hsl(0 84% 60%)', label: 'Busy' },
  offline: { color: 'hsl(var(--muted-foreground) / 0.3)', label: 'Offline' },
};

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
}

export function OnlineSidebar({ users, currentUserId, onSelectUser }: OnlineSidebarProps) {
  const otherUsers = users.filter(u => u.id !== currentUserId);
  const online = otherUsers.filter(u => u.status === 'online');
  const away = otherUsers.filter(u => u.status === 'away' || u.status === 'busy');
  const offline = otherUsers.filter(u => u.status === 'offline');

  const renderUser = (user: MessengerUser) => {
    const cfg = statusConfig[user.status];
    return (
      <div
        key={user.id}
        onClick={() => onSelectUser(user.id)}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '6px 10px', cursor: 'pointer', borderRadius: '8px',
          transition: 'background 0.12s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'hsl(var(--muted) / 0.4)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
      >
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'hsl(var(--accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', fontWeight: 600, color: 'hsl(var(--foreground))',
          }}>
            {getInitials(user.name)}
          </div>
          <div style={{
            position: 'absolute', bottom: -1, right: -1,
            width: 10, height: 10, borderRadius: '50%',
            background: cfg.color,
            border: '2px solid hsl(var(--card))',
          }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '12px', fontWeight: 500, color: 'hsl(var(--foreground))',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {user.name}
          </div>
          {user.bio && (
            <div style={{
              fontSize: '10px', color: 'hsl(var(--muted-foreground))',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {user.bio}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '10px 6px' }}>
      <div style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--muted-foreground))', padding: '0 10px 6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        Online — {online.length}
      </div>
      {online.map(renderUser)}

      {away.length > 0 && (
        <>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--muted-foreground))', padding: '10px 10px 6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Away / Busy — {away.length}
          </div>
          {away.map(renderUser)}
        </>
      )}

      {offline.length > 0 && (
        <>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--muted-foreground))', padding: '10px 10px 6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Offline — {offline.length}
          </div>
          {offline.map(renderUser)}
        </>
      )}
    </div>
  );
}
