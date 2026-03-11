/**
 * ChatHeader - Chat header with actions, search, info panel toggle
 */
import React from 'react';
import { ArrowLeft, Video, Users, Pin, Shield, ShieldCheck, Lock, Search, Info, Download, Sparkles } from 'lucide-react';
import type { Conversation, Message } from './types';
import { formatDistanceToNow } from 'date-fns';
import { el } from 'date-fns/locale';

interface ChatHeaderProps {
  conversation: Conversation;
  currentUserId: string;
  pinnedCount: number;
  isTyping: boolean;
  searchOpen: boolean;
  onBack: () => void;
  onTogglePinned: () => void;
  onToggleNDA: (enabled: boolean) => void;
  onToggleBlockchain: () => void;
  onToggleSearch: () => void;
  onToggleInfo: () => void;
  onExportAudit: () => void;
  onToggleSummary?: () => void;
  summaryOpen?: boolean;
}

function getOtherName(conv: Conversation, uid: string): string {
  if (conv.type === 'group') return conv.name || 'Group';
  return conv.participants.find(p => p.id !== uid)?.name || 'Unknown';
}

function getOtherStatus(conv: Conversation, uid: string): string {
  if (conv.type === 'group') {
    const online = conv.participants.filter(p => p.id !== uid && p.status === 'online').length;
    return `${conv.participants.length} μέλη, ${online} online`;
  }
  const other = conv.participants.find(p => p.id !== uid);
  if (!other) return '';
  if (other.status === 'online') return 'online';
  if (other.lastSeen) return `τελευταία φορά ${formatDistanceToNow(other.lastSeen, { addSuffix: true, locale: el })}`;
  return 'offline';
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
}

export function ChatHeader({
  conversation, currentUserId, pinnedCount, isTyping,
  searchOpen, onBack, onTogglePinned, onToggleNDA,
  onToggleBlockchain, onToggleSearch, onToggleInfo, onExportAudit,
  onToggleSummary, summaryOpen,
}: ChatHeaderProps) {
  const otherName = getOtherName(conversation, currentUserId);
  const otherStatus = getOtherStatus(conversation, currentUserId);

  return (
    <div style={{
      padding: '6px 8px', borderBottom: '1px solid hsl(var(--border))',
      display: 'flex', alignItems: 'center', gap: '6px',
      background: 'hsl(var(--card) / 0.95)', flexShrink: 0,
    }}>
      <button onClick={onBack} style={iconBtn}><ArrowLeft size={17} /></button>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: conversation.type === 'group' ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--accent))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '12px', fontWeight: 600, color: 'hsl(var(--foreground))', flexShrink: 0,
      }}>
        {conversation.type === 'group' ? <Users size={15} /> : getInitials(otherName)}
      </div>
      <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={onToggleInfo}>
        <div style={{
          fontWeight: 600, fontSize: '13px', color: 'hsl(var(--foreground))',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          display: 'flex', alignItems: 'center', gap: '4px',
        }}>
          {otherName}
          {conversation.nda.enabled && (
            <span style={{
              fontSize: '8px', padding: '1px 4px', borderRadius: '3px',
              background: 'hsl(var(--destructive) / 0.1)', color: 'hsl(var(--destructive))',
              fontWeight: 700, letterSpacing: '0.5px',
            }}>NDA</span>
          )}
          {conversation.blockchain.enabled && (
            <ShieldCheck size={11} style={{ color: 'hsl(142 71% 45%)' }} />
          )}
        </div>
        <div style={{
          fontSize: '10.5px',
          color: isTyping ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
          fontStyle: isTyping ? 'italic' : 'normal',
        }}>
          {isTyping ? 'γράφει...' : otherStatus}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '1px', alignItems: 'center' }}>
        <button onClick={onToggleSearch} style={{ ...iconBtn, color: searchOpen ? 'hsl(var(--primary))' : undefined }} title="Αναζήτηση">
          <Search size={14} />
        </button>
        {pinnedCount > 0 && (
          <button onClick={onTogglePinned} style={{ ...iconBtn, color: 'hsl(var(--primary))' }} title={`${pinnedCount} pinned`}>
            <Pin size={14} />
            <span style={{ fontSize: '8px', fontWeight: 700 }}>{pinnedCount}</span>
          </button>
        )}
        <button
          onClick={() => onToggleNDA(!conversation.nda.enabled)}
          style={{ ...iconBtn, color: conversation.nda.enabled ? 'hsl(var(--destructive))' : undefined }}
          title="NDA Mode"
        >
          <Lock size={14} />
        </button>
        <button
          onClick={onToggleBlockchain}
          style={{ ...iconBtn, color: conversation.blockchain.enabled ? 'hsl(142 71% 45%)' : undefined }}
          title="Blockchain"
        >
          {conversation.blockchain.enabled ? <ShieldCheck size={14} /> : <Shield size={14} />}
        </button>
        {onToggleSummary && (
          <button onClick={onToggleSummary} style={{ ...iconBtn, color: summaryOpen ? 'hsl(var(--primary))' : undefined }} title="AI Σύνοψη">
            <Sparkles size={14} />
          </button>
        )}
        {(conversation.nda.enabled || conversation.blockchain.enabled) && (
          <button onClick={onExportAudit} style={iconBtn} title="Export Audit Trail">
            <Download size={14} />
          </button>
        )}
        <button onClick={onToggleInfo} style={iconBtn} title="Πληροφορίες">
          <Info size={14} />
        </button>
      </div>
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  background: 'transparent', border: 'none', cursor: 'pointer',
  color: 'hsl(var(--foreground))', display: 'flex', alignItems: 'center', gap: '2px',
  padding: '4px', borderRadius: '6px', flexShrink: 0,
};
