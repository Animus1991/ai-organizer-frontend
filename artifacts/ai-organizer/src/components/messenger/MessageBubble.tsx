/**
 * MessageBubble - Individual message bubble with reactions, tags, blockchain proof
 */
import React from 'react';
import { Check, CheckCheck, Pin, ShieldCheck, Smile, Reply, Trash2, Tag, MessageSquare } from 'lucide-react';
import type { Message, MessageTag, Conversation } from './types';
import { MESSAGE_TAG_CONFIG } from './types';
import { format } from 'date-fns';
import { RichMessageContent } from './RichMessageContent';
import { ThreadIndicator } from './ThreadView';

interface MessageBubbleProps {
  msg: Message;
  isMine: boolean;
  isGroup: boolean;
  senderName?: string;
  replyMsg?: Message | null;
  showActions: boolean;
  showReactions: boolean;
  showTagPicker: boolean;
  searchHighlight?: string;
  threadReplyCount?: number;
  onShowActions: () => void;
  onHideActions: () => void;
  onToggleReactions: () => void;
  onToggleTagPicker: () => void;
  onReply: () => void;
  onReaction: (emoji: string) => void;
  onPin: () => void;
  onDelete: () => void;
  onTag: (tag: MessageTag) => void;
  onOpenThread?: () => void;
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

function StatusIcon({ status }: { status: Message['status'] }) {
  if (status === 'sending') return <span style={{ fontSize: '10px', color: 'hsl(var(--muted-foreground) / 0.5)' }}>●</span>;
  if (status === 'sent') return <Check size={12} style={{ color: 'hsl(var(--muted-foreground) / 0.6)' }} />;
  if (status === 'delivered') return <CheckCheck size={12} style={{ color: 'hsl(var(--muted-foreground) / 0.6)' }} />;
  if (status === 'read') return <CheckCheck size={12} style={{ color: 'hsl(var(--primary))' }} />;
  return null;
}

// highlightText moved to RichMessageContent

export function MessageBubble({
  msg, isMine, isGroup, senderName, replyMsg,
  showActions, showReactions, showTagPicker, searchHighlight, threadReplyCount,
  onShowActions, onHideActions, onToggleReactions, onToggleTagPicker,
  onReply, onReaction, onPin, onDelete, onTag, onOpenThread,
}: MessageBubbleProps) {
  const tagCfg = msg.tag ? MESSAGE_TAG_CONFIG[msg.tag] : null;

  return (
    <div
      style={{
        display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start',
        marginBottom: '3px', position: 'relative',
      }}
      onMouseEnter={onShowActions}
      onMouseLeave={onHideActions}
    >
      <div style={{ maxWidth: '80%', position: 'relative' }}>
        {/* Group sender name */}
        {isGroup && !isMine && senderName && (
          <div style={{ fontSize: '10px', fontWeight: 600, color: 'hsl(var(--primary))', marginBottom: '1px', paddingLeft: '8px' }}>
            {senderName}
          </div>
        )}

        {/* Reply preview */}
        {replyMsg && (
          <div style={{
            fontSize: '10px', color: 'hsl(var(--muted-foreground))',
            borderLeft: '2px solid hsl(var(--primary))', padding: '1px 6px', marginBottom: '1px',
            background: 'hsl(var(--muted) / 0.3)', borderRadius: '0 4px 4px 0',
          }}>
            {replyMsg.content.substring(0, 50)}
          </div>
        )}

        {/* Tag badge */}
        {tagCfg && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '3px',
            padding: '1px 6px', borderRadius: '4px 4px 0 0',
            background: `hsl(${tagCfg.color} / 0.12)`,
            fontSize: '9.5px', fontWeight: 600, color: `hsl(${tagCfg.color})`,
            marginLeft: isMine ? 'auto' : '0',
          }}>
            <span>{tagCfg.icon}</span>
            {tagCfg.label}
          </div>
        )}

        {/* Bubble */}
        <div style={{
          padding: '7px 10px',
          borderRadius: isMine ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
          background: isMine ? 'hsl(var(--primary))' : 'hsl(var(--muted) / 0.6)',
          color: isMine ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
          fontSize: '13px', lineHeight: '1.4', position: 'relative',
          borderTop: tagCfg ? `2px solid hsl(${tagCfg.color} / 0.4)` : undefined,
        }}>
          {msg.deleted ? (
            <span style={{ fontStyle: 'italic', opacity: 0.6 }}>Μήνυμα διαγράφηκε</span>
          ) : (
            <>
              {msg.pinned && <Pin size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px', opacity: 0.6 }} />}
              <RichMessageContent content={msg.content} isMine={isMine} searchHighlight={searchHighlight} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px', marginTop: '2px' }}>
                {msg.blockchainProof && (
                  <span title={`Hash: ${msg.blockchainProof.hash.substring(0, 12)}...`}>
                    <ShieldCheck size={10} style={{ color: isMine ? 'hsl(var(--primary-foreground) / 0.7)' : 'hsl(142 71% 45%)' }} />
                  </span>
                )}
                {msg.edited && <span style={{ fontSize: '9px', opacity: 0.5 }}>edited</span>}
                <span style={{ fontSize: '9px', opacity: 0.6, fontVariantNumeric: 'tabular-nums' }}>
                  {format(msg.timestamp, 'HH:mm')}
                </span>
                {isMine && <StatusIcon status={msg.status} />}
              </div>
            </>
          )}
        </div>

        {/* Reactions */}
        {msg.reactions.length > 0 && (
          <div style={{ display: 'flex', gap: '2px', marginTop: '1px', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
            {Object.entries(msg.reactions.reduce((a, r) => { a[r.emoji] = (a[r.emoji] || 0) + 1; return a; }, {} as Record<string, number>)).map(([emoji, count]) => (
              <span key={emoji} style={{
                fontSize: '11px', background: 'hsl(var(--muted) / 0.6)', borderRadius: '8px',
                padding: '0px 4px', border: '1px solid hsl(var(--border))',
              }}>
                {emoji}{count > 1 && <span style={{ fontSize: '9px' }}>{count}</span>}
              </span>
            ))}
          </div>
        )}

        {/* Thread indicator */}
        {threadReplyCount && threadReplyCount > 0 && onOpenThread && (
          <div style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
            <ThreadIndicator replyCount={threadReplyCount} onClick={onOpenThread} />
          </div>
        )}

        {/* Hover actions */}
        {showActions && !msg.deleted && (
          <div style={{
            position: 'absolute', top: '-26px', [isMine ? 'left' : 'right']: '0',
            display: 'flex', gap: '1px', background: 'hsl(var(--card))', borderRadius: '8px',
            padding: '2px', border: '1px solid hsl(var(--border))',
            boxShadow: '0 2px 8px hsl(var(--foreground) / 0.1)', zIndex: 10,
          }}>
          <button onClick={onToggleReactions} style={microBtn} title="Αντίδραση"><Smile size={13} /></button>
            <button onClick={onReply} style={microBtn} title="Απάντηση"><Reply size={13} /></button>
            <button onClick={onPin} style={microBtn} title="Καρφίτσωμα"><Pin size={13} /></button>
            <button onClick={onToggleTagPicker} style={microBtn} title="Ετικέτα"><Tag size={13} /></button>
            {onOpenThread && <button onClick={onOpenThread} style={microBtn} title="Thread"><MessageSquare size={13} /></button>}
            {isMine && <button onClick={onDelete} style={microBtn} title="Διαγραφή"><Trash2 size={13} /></button>}
          </div>
        )}

        {/* Reaction picker */}
        {showReactions && (
          <div style={{
            position: 'absolute', top: '-52px', [isMine ? 'left' : 'right']: '0',
            display: 'flex', gap: '1px', background: 'hsl(var(--card))', borderRadius: '16px',
            padding: '3px 5px', border: '1px solid hsl(var(--border))',
            boxShadow: '0 4px 12px hsl(var(--foreground) / 0.1)', zIndex: 11,
          }}>
            {QUICK_REACTIONS.map(emoji => (
              <button key={emoji} onClick={() => onReaction(emoji)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '2px 3px', borderRadius: '4px', transition: 'transform 0.1s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              >{emoji}</button>
            ))}
          </div>
        )}

        {/* Tag picker */}
        {showTagPicker && (
          <div style={{
            position: 'absolute', top: '-26px', [isMine ? 'left' : 'right']: isMine ? '-120px' : '-120px',
            background: 'hsl(var(--card))', borderRadius: '8px', padding: '4px',
            border: '1px solid hsl(var(--border))', boxShadow: '0 4px 12px hsl(var(--foreground) / 0.1)',
            zIndex: 12, minWidth: '120px',
          }}>
            {(Object.entries(MESSAGE_TAG_CONFIG) as [MessageTag, typeof MESSAGE_TAG_CONFIG[MessageTag]][]).map(([key, cfg]) => (
              <button key={key} onClick={() => onTag(key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px', width: '100%',
                  padding: '4px 6px', background: 'transparent', border: 'none',
                  borderRadius: '4px', cursor: 'pointer', fontSize: '11px', color: 'hsl(var(--foreground))',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = `hsl(${cfg.color} / 0.1)`; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <span>{cfg.icon}</span><span>{cfg.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const microBtn: React.CSSProperties = {
  background: 'transparent', border: 'none', cursor: 'pointer',
  color: 'hsl(var(--muted-foreground))', display: 'flex', alignItems: 'center',
  padding: '3px', borderRadius: '4px',
};
