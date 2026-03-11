/**
 * MessengerChat - Research-grade chat orchestrator
 * Composes ChatHeader, MessageBubble, ChatSearch, ConversationInfoPanel, NDA, Threads
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Message, Conversation, MessageTag } from './types';
import { isToday, isYesterday, format } from 'date-fns';
import { el } from 'date-fns/locale';
import { MessengerInput } from './MessengerInput';
import { BlockchainToggle } from './BlockchainToggle';
import { NDABanner, NDAWatermark } from './NDAIndicator';
import { ChatHeader } from './ChatHeader';
import { MessageBubble } from './MessageBubble';
import { ChatSearch } from './ChatSearch';
import { ConversationInfoPanel } from './ConversationInfoPanel';
import { ThreadView } from './ThreadView';
import type { Thread } from './ThreadView';
import { exportAuditTrail } from './NDAExportAuditTrail';
import { AISummaryPanel } from './AISummaryPanel';
import { currentUser } from './mockData';

interface MessengerChatProps {
  conversation: Conversation;
  messages: Message[];
  currentUserId: string;
  onBack: () => void;
  onSendMessage: (content: string, replyTo?: string, tag?: MessageTag) => void;
  onReaction: (messageId: string, emoji: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onPinMessage: (messageId: string) => void;
  onTagMessage: (messageId: string, tag: MessageTag) => void;
  onToggleBlockchain: (enabled: boolean) => void;
  onToggleNDA: (enabled: boolean) => void;
}

function formatDateDivider(date: Date): string {
  if (isToday(date)) return 'Σήμερα';
  if (isYesterday(date)) return 'Χθες';
  return format(date, 'dd MMM yyyy', { locale: el });
}

export function MessengerChat({
  conversation, messages, currentUserId,
  onBack, onSendMessage, onReaction, onDeleteMessage,
  onPinMessage, onTagMessage, onToggleBlockchain, onToggleNDA,
}: MessengerChatProps) {
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showReactions, setShowReactions] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [showTagPicker, setShowTagPicker] = useState<string | null>(null);
  const [showBlockchain, setShowBlockchain] = useState(false);
  const [showPinned, setShowPinned] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [searchHighlight, setSearchHighlight] = useState('');
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [threads, setThreads] = useState<Record<string, Thread>>({});
  const bottomRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const isTyping = conversation.typing.length > 0;
  const pinnedMsgs = messages.filter(m => m.pinned || conversation.pinnedMessages.includes(m.id));

  const otherName = conversation.type === 'group'
    ? (conversation.name || 'Group')
    : (conversation.participants.find(p => p.id !== currentUserId)?.name || 'Unknown');

  // Participant name map for threads
  const participantNames: Record<string, string> = {};
  conversation.participants.forEach(p => { participantNames[p.id] = p.name; });

  // Group by date
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  messages.forEach(msg => {
    const dateStr = formatDateDivider(msg.timestamp);
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === dateStr) last.messages.push(msg);
    else groupedMessages.push({ date: dateStr, messages: [msg] });
  });

  const scrollToMessage = useCallback((msgId: string) => {
    const el = messageRefs.current[msgId];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const handleExportAudit = useCallback(() => {
    exportAuditTrail({ conversation, messages, currentUserId });
  }, [conversation, messages, currentUserId]);

  const handleOpenThread = useCallback((msgId: string) => {
    if (!threads[msgId]) {
      // Create thread for this message
      setThreads(prev => ({
        ...prev,
        [msgId]: {
          id: `thread-${msgId}`,
          rootMessageId: msgId,
          title: messages.find(m => m.id === msgId)?.content.substring(0, 40) || 'Thread',
          replies: [],
          participantIds: [currentUserId],
          createdAt: new Date(),
        },
      }));
    }
    setActiveThread(msgId);
    setShowInfo(false);
  }, [threads, messages, currentUserId]);

  const handleThreadReply = useCallback((threadId: string, content: string) => {
    setThreads(prev => {
      const msgId = Object.keys(prev).find(k => prev[k].id === threadId);
      if (!msgId) return prev;
      const thread = prev[msgId];
      const reply: Message = {
        id: `thread-reply-${Date.now()}`,
        conversationId: conversation.id,
        senderId: currentUserId,
        content,
        timestamp: new Date(),
        status: 'read',
        reactions: [],
        attachments: [],
      };
      return {
        ...prev,
        [msgId]: {
          ...thread,
          replies: [...thread.replies, reply],
          participantIds: [...new Set([...thread.participantIds, currentUserId])],
        },
      };
    });
  }, [conversation.id, currentUserId]);

  const activeThreadData = activeThread ? threads[activeThread] : null;
  const activeRootMessage = activeThread ? messages.find(m => m.id === activeThread) : null;

  return (
    <div style={{ display: 'flex', height: '100%', position: 'relative' }}>
      {/* Main chat column */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        {/* Header */}
        <ChatHeader
          conversation={conversation}
          currentUserId={currentUserId}
          pinnedCount={pinnedMsgs.length}
          isTyping={isTyping}
          searchOpen={showSearch}
          onBack={onBack}
          onTogglePinned={() => setShowPinned(!showPinned)}
          onToggleNDA={onToggleNDA}
          onToggleBlockchain={() => setShowBlockchain(!showBlockchain)}
          onToggleSearch={() => setShowSearch(!showSearch)}
          onToggleInfo={() => { setShowInfo(!showInfo); setActiveThread(null); setShowSummary(false); }}
          onExportAudit={handleExportAudit}
          onToggleSummary={() => { setShowSummary(!showSummary); setShowInfo(false); setActiveThread(null); }}
          summaryOpen={showSummary}
        />

        {/* Search bar */}
        {showSearch && (
          <ChatSearch
            messages={messages}
            onClose={() => setShowSearch(false)}
            onHighlight={setSearchHighlight}
            onScrollToMessage={scrollToMessage}
          />
        )}

        {/* Blockchain panel */}
        {showBlockchain && (
          <BlockchainToggle
            settings={conversation.blockchain}
            currentUserId={currentUserId}
            otherParticipantName={otherName}
            isGroup={conversation.type === 'group'}
            onToggle={onToggleBlockchain}
            onClose={() => setShowBlockchain(false)}
          />
        )}

        {/* Pinned messages bar */}
        {showPinned && pinnedMsgs.length > 0 && (
          <div style={{
            padding: '6px 10px', background: 'hsl(var(--primary) / 0.05)',
            borderBottom: '1px solid hsl(var(--border))',
            maxHeight: '80px', overflowY: 'auto',
          }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(var(--primary))', marginBottom: '4px' }}>
              📌 Καρφιτσωμένα ({pinnedMsgs.length})
            </div>
            {pinnedMsgs.map(m => (
              <div key={m.id} onClick={() => scrollToMessage(m.id)}
                style={{
                  fontSize: '11px', color: 'hsl(var(--muted-foreground))', padding: '2px 0',
                  borderLeft: '2px solid hsl(var(--primary))', paddingLeft: '6px', marginBottom: '2px', cursor: 'pointer',
                }}>
                {m.content.substring(0, 50)}{m.content.length > 50 ? '...' : ''}
              </div>
            ))}
          </div>
        )}

        {/* NDA Banner */}
        {conversation.nda.enabled && (
          <NDABanner settings={conversation.nda} participantCount={conversation.participants.length} />
        )}

        {/* Messages area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 10px', background: 'hsl(var(--background) / 0.5)', position: 'relative' }}>
          {conversation.nda.enabled && (
            <NDAWatermark userName={conversation.participants.find(p => p.id === currentUserId)?.name || 'User'} />
          )}

          {groupedMessages.map(group => (
            <React.Fragment key={group.date}>
              <div style={{ textAlign: 'center', margin: '10px 0 6px' }}>
                <span style={{
                  fontSize: '10px', color: 'hsl(var(--muted-foreground))',
                  background: 'hsl(var(--muted) / 0.5)', borderRadius: '10px', padding: '2px 10px',
                }}>
                  {group.date}
                </span>
              </div>
              {group.messages.map(msg => {
                const isMine = msg.senderId === currentUserId;
                const sender = conversation.participants.find(p => p.id === msg.senderId);
                const replyMsg = msg.replyTo ? messages.find(m => m.id === msg.replyTo) : null;
                const thread = threads[msg.id];

                return (
                  <div key={msg.id} ref={el => { messageRefs.current[msg.id] = el; }}>
                    <MessageBubble
                      msg={msg}
                      isMine={isMine}
                      isGroup={conversation.type === 'group'}
                      senderName={sender?.name}
                      replyMsg={replyMsg}
                      showActions={showMenu === msg.id}
                      showReactions={showReactions === msg.id}
                      showTagPicker={showTagPicker === msg.id}
                      searchHighlight={searchHighlight}
                      threadReplyCount={thread?.replies.length}
                      onShowActions={() => setShowMenu(msg.id)}
                      onHideActions={() => { setShowMenu(null); setShowReactions(null); setShowTagPicker(null); }}
                      onToggleReactions={() => setShowReactions(showReactions === msg.id ? null : msg.id)}
                      onToggleTagPicker={() => setShowTagPicker(showTagPicker === msg.id ? null : msg.id)}
                      onReply={() => setReplyTo(msg)}
                      onReaction={(emoji) => { onReaction(msg.id, emoji); setShowReactions(null); }}
                      onPin={() => onPinMessage(msg.id)}
                      onDelete={() => onDeleteMessage(msg.id)}
                      onTag={(tag) => { onTagMessage(msg.id, tag); setShowTagPicker(null); }}
                      onOpenThread={() => handleOpenThread(msg.id)}
                    />
                  </div>
                );
              })}
            </React.Fragment>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '4px' }}>
              <div style={{ padding: '8px 14px', borderRadius: '14px 14px 14px 3px', background: 'hsl(var(--muted) / 0.6)' }}>
                <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} style={{
                      width: '5px', height: '5px', borderRadius: '50%',
                      background: 'hsl(var(--muted-foreground) / 0.5)',
                      animation: `typingBounce 1.4s ${i * 0.2}s infinite ease-in-out`,
                    }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Reply bar */}
        {replyTo && (
          <div style={{
            padding: '5px 10px', borderTop: '1px solid hsl(var(--border))',
            display: 'flex', alignItems: 'center', gap: '6px', background: 'hsl(var(--muted) / 0.3)',
          }}>
            <div style={{ flex: 1, borderLeft: '2px solid hsl(var(--primary))', paddingLeft: '6px' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: 'hsl(var(--primary))' }}>Απάντηση</div>
              <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {replyTo.content.substring(0, 50)}
              </div>
            </div>
            <button onClick={() => setReplyTo(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'hsl(var(--foreground))', padding: '3px' }}>✕</button>
          </div>
        )}

        {/* Input */}
        <MessengerInput
          onSend={(content, tag) => { onSendMessage(content, replyTo?.id, tag); setReplyTo(null); }}
          blockchainEnabled={conversation.blockchain.enabled}
        />
      </div>

      {/* Thread panel */}
      {activeThreadData && activeRootMessage && (
        <ThreadView
          thread={activeThreadData}
          rootMessage={activeRootMessage}
          currentUserId={currentUserId}
          participantNames={participantNames}
          onClose={() => setActiveThread(null)}
          onSendReply={handleThreadReply}
        />
      )}

      {/* AI Summary panel */}
      {showSummary && !activeThread && !showInfo && (
        <AISummaryPanel
          conversation={conversation}
          messages={messages}
          currentUserId={currentUserId}
          onClose={() => setShowSummary(false)}
        />
      )}

      {/* Info panel */}
      {showInfo && !activeThread && (
        <ConversationInfoPanel
          conversation={conversation}
          messages={messages}
          currentUserId={currentUserId}
          onClose={() => setShowInfo(false)}
        />
      )}

      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
