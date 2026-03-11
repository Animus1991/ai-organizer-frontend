/**
 * MessengerContacts - Contact list with search, online status, blockchain indicators
 */
import React, { useState } from 'react';
import { Search, Plus, Users, Pin, VolumeX, ShieldCheck, Lock } from 'lucide-react';
import type { Conversation, MessengerUser } from './types';
import { formatDistanceToNow } from 'date-fns';
import { el } from 'date-fns/locale';

interface MessengerContactsProps {
  conversations: Conversation[];
  currentUserId: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onNewGroup: () => void;
  onShowOnline: () => void;
  selectedId?: string;
}

const statusColors: Record<string, string> = {
  online: 'hsl(142 71% 45%)',
  away: 'hsl(38 92% 50%)',
  busy: 'hsl(0 84% 60%)',
  offline: 'hsl(var(--muted-foreground) / 0.4)',
};

function getOtherParticipant(conv: Conversation, uid: string): MessengerUser | undefined {
  return conv.participants.find(p => p.id !== uid);
}
function getDisplayName(conv: Conversation, uid: string): string {
  if (conv.type === 'group') return conv.name || 'Group';
  return getOtherParticipant(conv, uid)?.name || 'Unknown';
}
function getStatus(conv: Conversation, uid: string): string {
  if (conv.type === 'group') return 'online';
  return getOtherParticipant(conv, uid)?.status || 'offline';
}
function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
}

export function MessengerContacts({ conversations, currentUserId, onSelectConversation, onNewChat, onNewGroup, onShowOnline, selectedId }: MessengerContactsProps) {
  const [search, setSearch] = useState('');

  const filtered = conversations.filter(c => getDisplayName(c, currentUserId).toLowerCase().includes(search.toLowerCase()));
  const sorted = [...filtered].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return (b.lastMessage?.timestamp.getTime() || 0) - (a.lastMessage?.timestamp.getTime() || 0);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid hsl(var(--border))' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontWeight: 700, fontSize: '15px', color: 'hsl(var(--foreground))' }}>Μηνύματα</span>
          <div style={{ display: 'flex', gap: '3px' }}>
            <button onClick={onShowOnline} title="Online χρήστες" style={iconBtnStyle}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'hsl(142 71% 45%)' }} />
            </button>
            <button onClick={onNewChat} title="Νέα συνομιλία" style={iconBtnStyle}><Plus size={16} /></button>
            <button onClick={onNewGroup} title="Νέα ομάδα" style={iconBtnStyle}><Users size={16} /></button>
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'hsl(var(--muted) / 0.5)', borderRadius: '8px', padding: '5px 8px',
        }}>
          <Search size={14} style={{ color: 'hsl(var(--muted-foreground))', flexShrink: 0 }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Αναζήτηση..."
            style={{ background: 'transparent', border: 'none', outline: 'none', flex: 1, color: 'hsl(var(--foreground))', fontSize: '12.5px' }}
          />
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {sorted.length === 0 && (
          <p style={{ color: 'hsl(var(--muted-foreground))', textAlign: 'center', padding: '20px', fontSize: '12px' }}>Δεν βρέθηκαν συνομιλίες</p>
        )}
        {sorted.map(conv => {
          const name = getDisplayName(conv, currentUserId);
          const status = getStatus(conv, currentUserId);
          const isSelected = conv.id === selectedId;
          const lastMsg = conv.lastMessage;
          const isTyping = conv.typing.length > 0;

          return (
            <div
              key={conv.id}
              onClick={() => onSelectConversation(conv.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 12px', cursor: 'pointer',
                background: isSelected ? 'hsl(var(--primary) / 0.1)' : 'transparent',
                borderLeft: isSelected ? '3px solid hsl(var(--primary))' : '3px solid transparent',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'hsl(var(--muted) / 0.3)'; }}
              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: conv.type === 'group' ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--accent))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', fontWeight: 600, color: 'hsl(var(--foreground))',
                }}>
                  {conv.type === 'group' ? <Users size={16} /> : getInitials(name)}
                </div>
                {conv.type === 'direct' && (
                  <div style={{
                    position: 'absolute', bottom: 0, right: 0,
                    width: 10, height: 10, borderRadius: '50%',
                    background: statusColors[status], border: '2px solid hsl(var(--card))',
                  }} />
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontWeight: conv.unreadCount > 0 ? 700 : 500, fontSize: '12.5px',
                    color: 'hsl(var(--foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    display: 'flex', alignItems: 'center', gap: '3px',
                  }}>
                    {conv.pinned && <Pin size={10} />}
                    {conv.muted && <VolumeX size={10} style={{ opacity: 0.4 }} />}
                    {conv.blockchain.enabled && <ShieldCheck size={10} style={{ color: 'hsl(142 71% 45%)' }} />}
                    {conv.nda.enabled && <Lock size={10} style={{ color: 'hsl(var(--destructive))' }} />}
                    {name}
                  </span>
                  {lastMsg && (
                    <span style={{ fontSize: '10px', color: 'hsl(var(--muted-foreground))', flexShrink: 0 }}>
                      {formatDistanceToNow(lastMsg.timestamp, { addSuffix: false, locale: el })}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1px' }}>
                  <span style={{
                    fontSize: '11px',
                    color: isTyping ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                    fontStyle: isTyping ? 'italic' : 'normal',
                    fontWeight: conv.unreadCount > 0 ? 600 : 400,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '170px',
                  }}>
                    {isTyping ? 'γράφει...' : (lastMsg?.content || 'Ξεκίνα συνομιλία')}
                  </span>
                  {conv.unreadCount > 0 && (
                    <span style={{
                      minWidth: '16px', height: '16px', borderRadius: '8px',
                      background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))',
                      fontSize: '9px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '0 4px', flexShrink: 0,
                    }}>{conv.unreadCount}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const iconBtnStyle: React.CSSProperties = {
  background: 'hsl(var(--muted) / 0.5)', border: 'none', borderRadius: '6px',
  padding: '5px', cursor: 'pointer', color: 'hsl(var(--foreground))', display: 'flex', alignItems: 'center',
};
