/**
 * ThreadView - Sub-thread within a conversation for topic organization
 */
import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, MessageSquare, Send } from 'lucide-react';
import type { Message, MessageTag } from './types';
import { MESSAGE_TAG_CONFIG } from './types';
import { format } from 'date-fns';
import { RichMessageContent } from './RichMessageContent';

export interface Thread {
  id: string;
  rootMessageId: string;
  title: string;
  replies: Message[];
  participantIds: string[];
  createdAt: Date;
}

interface ThreadViewProps {
  thread: Thread;
  rootMessage: Message;
  currentUserId: string;
  participantNames: Record<string, string>;
  onClose: () => void;
  onSendReply: (threadId: string, content: string) => void;
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
}

export function ThreadView({ thread, rootMessage, currentUserId, participantNames, onClose, onSendReply }: ThreadViewProps) {
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread.replies.length]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSendReply(thread.id, trimmed);
    setText('');
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      borderLeft: '1px solid hsl(var(--border))',
      background: 'hsl(var(--card))', width: '100%', maxWidth: '280px',
    }}>
      {/* Header */}
      <div style={{
        padding: '8px 10px', borderBottom: '1px solid hsl(var(--border))',
        display: 'flex', alignItems: 'center', gap: '6px',
      }}>
        <button onClick={onClose} style={closeBtn}>
          <ArrowLeft size={14} />
        </button>
        <MessageSquare size={14} style={{ color: 'hsl(var(--primary))' }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '11px', color: 'hsl(var(--foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Thread
          </div>
          <div style={{ fontSize: '9.5px', color: 'hsl(var(--muted-foreground))' }}>
            {thread.replies.length} απαντήσεις • {thread.participantIds.length} μέλη
          </div>
        </div>
      </div>

      {/* Root message */}
      <div style={{
        padding: '8px 12px', borderBottom: '1px solid hsl(var(--border))',
        background: 'hsl(var(--muted) / 0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <div style={{
            width: 20, height: 20, borderRadius: '50%',
            background: 'hsl(var(--accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '8px', fontWeight: 600, color: 'hsl(var(--foreground))',
          }}>
            {getInitials(participantNames[rootMessage.senderId] || 'U')}
          </div>
          <span style={{ fontSize: '10.5px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
            {participantNames[rootMessage.senderId] || 'Unknown'}
          </span>
          <span style={{ fontSize: '9px', color: 'hsl(var(--muted-foreground))', fontVariantNumeric: 'tabular-nums' }}>
            {format(rootMessage.timestamp, 'HH:mm')}
          </span>
        </div>
        <div style={{ fontSize: '12px', color: 'hsl(var(--foreground))', lineHeight: '1.4' }}>
          <RichMessageContent content={rootMessage.content} isMine={false} />
        </div>
      </div>

      {/* Thread replies */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 10px' }}>
        {thread.replies.map(reply => {
          const isMine = reply.senderId === currentUserId;
          return (
            <div key={reply.id} style={{ marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%',
                  background: isMine ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--accent))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '7px', fontWeight: 600, color: 'hsl(var(--foreground))',
                }}>
                  {getInitials(participantNames[reply.senderId] || 'U')}
                </div>
                <span style={{ fontSize: '10px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                  {participantNames[reply.senderId] || 'Unknown'}
                </span>
                <span style={{ fontSize: '9px', color: 'hsl(var(--muted-foreground))', fontVariantNumeric: 'tabular-nums' }}>
                  {format(reply.timestamp, 'HH:mm')}
                </span>
              </div>
              <div style={{
                marginLeft: '23px', padding: '5px 8px',
                borderRadius: '0 8px 8px 8px',
                background: isMine ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--muted) / 0.4)',
                fontSize: '12px', lineHeight: '1.4', color: 'hsl(var(--foreground))',
              }}>
                <RichMessageContent content={reply.content} isMine={false} />
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '4px',
        padding: '6px 8px', borderTop: '1px solid hsl(var(--border))',
      }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
          placeholder="Απάντηση στο thread..."
          style={{
            flex: 1, background: 'hsl(var(--muted) / 0.4)', border: 'none',
            outline: 'none', borderRadius: '12px', padding: '6px 10px',
            fontSize: '12px', color: 'hsl(var(--foreground))',
          }}
        />
        {text.trim() && (
          <button onClick={handleSend} style={{ ...closeBtn, color: 'hsl(var(--primary))' }}>
            <Send size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

/** Thread indicator badge shown on a message */
export function ThreadIndicator({ replyCount, onClick }: { replyCount: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '4px',
        padding: '2px 8px', marginTop: '2px',
        background: 'hsl(var(--primary) / 0.08)', border: '1px solid hsl(var(--primary) / 0.15)',
        borderRadius: '12px', cursor: 'pointer',
        fontSize: '10px', fontWeight: 600, color: 'hsl(var(--primary))',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'hsl(var(--primary) / 0.15)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'hsl(var(--primary) / 0.08)'; }}
    >
      <MessageSquare size={10} />
      {replyCount} {replyCount === 1 ? 'απάντηση' : 'απαντήσεις'}
    </button>
  );
}

const closeBtn: React.CSSProperties = {
  background: 'transparent', border: 'none', cursor: 'pointer',
  color: 'hsl(var(--muted-foreground))', display: 'flex', alignItems: 'center',
  padding: '3px', borderRadius: '4px',
};
