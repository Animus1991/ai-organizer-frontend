/**
 * MessengerWindow - Research-grade messenger with online sidebar, blockchain, tags
 */
import React, { useState, useCallback } from 'react';
import { X, Minus, MessageCircle, Users } from 'lucide-react';
import type { Conversation, Message, MessengerView, MessageTag } from './types';
import { mockConversations, mockMessages, currentUser, mockUsers } from './mockData';
import { MessengerContacts } from './MessengerContacts';
import { MessengerChat } from './MessengerChat';
import { OnlineSidebar } from './OnlineSidebar';
import { NDAAcceptanceDialog } from './NDAAcceptanceDialog';

interface MessengerWindowProps {
  onClose: () => void;
  onMinimize: () => void;
  minimized: boolean;
  zIndex: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

function generateMockHash(): string {
  return Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

export function MessengerWindow({ onClose, onMinimize, minimized, zIndex, position, size }: MessengerWindowProps) {
  const [view, setView] = useState<MessengerView>('contacts');
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [allMessages, setAllMessages] = useState<Record<string, Message[]>>(mockMessages);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [showNDADialog, setShowNDADialog] = useState<string | null>(null); // conv ID pending NDA acceptance

  const selectedConv = conversations.find(c => c.id === selectedConvId);
  const selectedMessages = selectedConvId ? (allMessages[selectedConvId] || []) : [];

  const handleSelectConversation = useCallback((id: string) => {
    setSelectedConvId(id);
    setView('chat');
    setConversations(prev => prev.map(c => c.id === id ? { ...c, unreadCount: 0 } : c));
    // Simulate typing
    setTimeout(() => {
      setConversations(prev => prev.map(c => {
        if (c.id === id && c.type === 'direct') {
          const other = c.participants.find(p => p.id !== currentUser.id);
          return other ? { ...c, typing: [other.id] } : c;
        }
        return c;
      }));
      setTimeout(() => {
        setConversations(prev => prev.map(c => c.id === id ? { ...c, typing: [] } : c));
      }, 2500);
    }, 3000);
  }, []);

  const handleSendMessage = useCallback((content: string, replyTo?: string, tag?: MessageTag) => {
    if (!selectedConvId) return;
    const conv = conversations.find(c => c.id === selectedConvId);
    const blockchainEnabled = conv?.blockchain.enabled;

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      conversationId: selectedConvId,
      senderId: currentUser.id,
      content,
      timestamp: new Date(),
      status: 'sending',
      replyTo,
      reactions: [],
      attachments: [],
      tag,
      blockchainProof: blockchainEnabled ? {
        hash: generateMockHash(),
        timestamp: new Date(),
        verified: true,
      } : undefined,
    };

    setAllMessages(prev => ({ ...prev, [selectedConvId]: [...(prev[selectedConvId] || []), newMsg] }));
    setConversations(prev => prev.map(c => c.id === selectedConvId ? { ...c, lastMessage: newMsg } : c));

    // Status progression
    setTimeout(() => { setAllMessages(prev => ({ ...prev, [selectedConvId]: prev[selectedConvId]?.map(m => m.id === newMsg.id ? { ...m, status: 'sent' as const } : m) || [] })); }, 500);
    setTimeout(() => { setAllMessages(prev => ({ ...prev, [selectedConvId]: prev[selectedConvId]?.map(m => m.id === newMsg.id ? { ...m, status: 'delivered' as const } : m) || [] })); }, 1200);
    setTimeout(() => { setAllMessages(prev => ({ ...prev, [selectedConvId]: prev[selectedConvId]?.map(m => m.id === newMsg.id ? { ...m, status: 'read' as const } : m) || [] })); }, 2500);

    // Simulate reply
    setTimeout(() => {
      const other = conv?.participants.find(p => p.id !== currentUser.id);
      if (!other) return;
      setConversations(prev => prev.map(c => c.id === selectedConvId ? { ...c, typing: [other.id] } : c));
      setTimeout(() => {
        setConversations(prev => prev.map(c => c.id === selectedConvId ? { ...c, typing: [] } : c));
        const reply: Message = {
          id: `msg-${Date.now()}-reply`, conversationId: selectedConvId,
          senderId: other.id, content: getSimulatedReply(), timestamp: new Date(),
          status: 'read', reactions: [], attachments: [],
          blockchainProof: blockchainEnabled && conv?.blockchain.acceptedByAll ? {
            hash: generateMockHash(), timestamp: new Date(), verified: true,
          } : undefined,
        };
        setAllMessages(prev => ({ ...prev, [selectedConvId]: [...(prev[selectedConvId] || []), reply] }));
        setConversations(prev => prev.map(c => c.id === selectedConvId ? { ...c, lastMessage: reply } : c));
      }, 2000 + Math.random() * 2000);
    }, 3000 + Math.random() * 2000);
  }, [selectedConvId, conversations]);

  const handleReaction = useCallback((messageId: string, emoji: string) => {
    if (!selectedConvId) return;
    setAllMessages(prev => ({
      ...prev,
      [selectedConvId]: prev[selectedConvId]?.map(m => {
        if (m.id !== messageId) return m;
        const existing = m.reactions.findIndex(r => r.emoji === emoji && r.userId === currentUser.id);
        if (existing >= 0) return { ...m, reactions: m.reactions.filter((_, i) => i !== existing) };
        return { ...m, reactions: [...m.reactions, { emoji, userId: currentUser.id, userName: currentUser.name }] };
      }) || [],
    }));
  }, [selectedConvId]);

  const handleDeleteMessage = useCallback((messageId: string) => {
    if (!selectedConvId) return;
    setAllMessages(prev => ({
      ...prev,
      [selectedConvId]: prev[selectedConvId]?.map(m => m.id === messageId ? { ...m, deleted: true, content: '' } : m) || [],
    }));
  }, [selectedConvId]);

  const handlePinMessage = useCallback((messageId: string) => {
    if (!selectedConvId) return;
    setAllMessages(prev => ({
      ...prev,
      [selectedConvId]: prev[selectedConvId]?.map(m => m.id === messageId ? { ...m, pinned: !m.pinned } : m) || [],
    }));
    setConversations(prev => prev.map(c => {
      if (c.id !== selectedConvId) return c;
      const isPinned = c.pinnedMessages.includes(messageId);
      return {
        ...c,
        pinnedMessages: isPinned ? c.pinnedMessages.filter(id => id !== messageId) : [...c.pinnedMessages, messageId],
      };
    }));
  }, [selectedConvId]);

  const handleTagMessage = useCallback((messageId: string, tag: MessageTag) => {
    if (!selectedConvId) return;
    setAllMessages(prev => ({
      ...prev,
      [selectedConvId]: prev[selectedConvId]?.map(m => m.id === messageId ? { ...m, tag: m.tag === tag ? undefined : tag } : m) || [],
    }));
  }, [selectedConvId]);

  const handleToggleBlockchain = useCallback((enabled: boolean) => {
    if (!selectedConvId) return;
    setConversations(prev => prev.map(c => {
      if (c.id !== selectedConvId) return c;
      const enabledBy = enabled
        ? [...new Set([...c.blockchain.enabledBy, currentUser.id])]
        : c.blockchain.enabledBy.filter(id => id !== currentUser.id);
      const allEnabled = c.participants.every(p => enabledBy.includes(p.id));
      return {
        ...c,
        blockchain: {
          enabled: enabledBy.length > 0,
          mode: allEnabled ? 'mutual' : 'self-only',
          acceptedByAll: allEnabled,
          enabledBy,
        },
      };
    }));
  }, [selectedConvId]);

  const handleToggleNDA = useCallback((enabled: boolean) => {
    if (!selectedConvId) return;
    if (enabled) {
      // Show acceptance dialog for NDA activation
      setShowNDADialog(selectedConvId);
    } else {
      setConversations(prev => prev.map(c => c.id === selectedConvId ? {
        ...c,
        nda: { enabled: false, acceptedBy: [], pendingFor: [], terms: '' },
      } : c));
    }
  }, [selectedConvId]);

  const handleAcceptNDA = useCallback(() => {
    if (!showNDADialog) return;
    const conv = conversations.find(c => c.id === showNDADialog);
    if (!conv) return;
    const otherIds = conv.participants.filter(p => p.id !== currentUser.id).map(p => p.id);
    setConversations(prev => prev.map(c => c.id === showNDADialog ? {
      ...c,
      nda: {
        enabled: true,
        acceptedBy: [currentUser.id, ...otherIds], // Mock: all accept
        pendingFor: [],
        terms: c.nda.terms || 'Όλες οι πληροφορίες που ανταλλάσσονται σε αυτή τη συνομιλία είναι αυστηρά εμπιστευτικές. Απαγορεύεται η κοινοποίηση, αναπαραγωγή ή διανομή χωρίς γραπτή συγκατάθεση.',
        activatedAt: new Date(),
        activatedBy: currentUser.id,
      },
    } : c));
    setShowNDADialog(null);
  }, [showNDADialog, conversations]);

  const handleSelectOnlineUser = useCallback((userId: string) => {
    // Find existing conversation with this user or open contacts
    const existing = conversations.find(c => c.type === 'direct' && c.participants.some(p => p.id === userId));
    if (existing) {
      handleSelectConversation(existing.id);
    } else {
      setView('contacts');
    }
  }, [conversations, handleSelectConversation]);

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  if (minimized) {
    return (
      <div data-messenger-window onClick={onMinimize} style={{
        position: 'fixed', left: position.x, top: position.y,
        width: 200, height: 40, zIndex,
        background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
        borderRadius: '12px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', padding: '0 12px', gap: '8px',
        boxShadow: '0 4px 24px hsl(var(--foreground) / 0.1)',
      }}>
        <MessageCircle size={16} style={{ color: 'hsl(var(--primary))' }} />
        <span style={{ color: 'hsl(var(--foreground) / 0.8)', fontSize: '13px' }}>Research Chat</span>
        {totalUnread > 0 && (
          <span style={{
            minWidth: '16px', height: '16px', borderRadius: '8px',
            background: 'hsl(var(--destructive))', color: 'hsl(var(--destructive-foreground))',
            fontSize: '9px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px', marginLeft: 'auto',
          }}>{totalUnread}</span>
        )}
      </div>
    );
  }

  return (
    <div data-messenger-window style={{
      position: 'fixed', left: position.x, top: position.y,
      width: size.width, height: size.height, zIndex,
      background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
      borderRadius: '12px', display: 'flex', flexDirection: 'column',
      boxShadow: '0 8px 32px hsl(var(--foreground) / 0.12)', overflow: 'hidden',
    }}>
      {/* Title bar */}
      <div style={{
        padding: '7px 10px', borderBottom: '1px solid hsl(var(--border))',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'hsl(var(--card) / 0.95)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MessageCircle size={16} style={{ color: 'hsl(var(--primary))' }} />
          <span style={{ fontWeight: 600, fontSize: '13px', color: 'hsl(var(--foreground))' }}>Research Chat</span>
          {totalUnread > 0 && (
            <span style={{
              minWidth: '14px', height: '14px', borderRadius: '7px',
              background: 'hsl(var(--destructive))', color: 'hsl(var(--destructive-foreground))',
              fontSize: '9px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px',
            }}>{totalUnread}</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '2px' }}>
          <button onClick={onMinimize} style={headerBtn}><Minus size={14} /></button>
          <button onClick={onClose} style={headerBtn}><X size={14} /></button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {view === 'contacts' && (
          <MessengerContacts
            conversations={conversations}
            currentUserId={currentUser.id}
            onSelectConversation={handleSelectConversation}
            onNewChat={() => {}}
            onNewGroup={() => {}}
            onShowOnline={() => setView('online')}
            selectedId={selectedConvId || undefined}
          />
        )}
        {view === 'chat' && selectedConv && (
          <MessengerChat
            conversation={selectedConv}
            messages={selectedMessages}
            currentUserId={currentUser.id}
            onBack={() => setView('contacts')}
            onSendMessage={handleSendMessage}
            onReaction={handleReaction}
            onDeleteMessage={handleDeleteMessage}
            onPinMessage={handlePinMessage}
            onTagMessage={handleTagMessage}
            onToggleBlockchain={handleToggleBlockchain}
            onToggleNDA={handleToggleNDA}
          />
        )}
        {view === 'chat' && showNDADialog && (
          <NDAAcceptanceDialog
            terms="Όλες οι πληροφορίες που ανταλλάσσονται σε αυτή τη συνομιλία είναι αυστηρά εμπιστευτικές. Απαγορεύεται η κοινοποίηση, αναπαραγωγή ή διανομή χωρίς γραπτή συγκατάθεση. Παραβίαση συνεπάγεται νομικές κυρώσεις."
            proposedBy={currentUser.name}
            onAccept={handleAcceptNDA}
            onDecline={() => setShowNDADialog(null)}
          />
        )}
        {view === 'online' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{
              padding: '10px 12px', borderBottom: '1px solid hsl(var(--border))',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <button onClick={() => setView('contacts')} style={headerBtn}>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span style={{ fontWeight: 600, fontSize: '13px', color: 'hsl(var(--foreground))' }}>Online Χρήστες</span>
            </div>
            <OnlineSidebar
              users={mockUsers}
              currentUserId={currentUser.id}
              onSelectUser={handleSelectOnlineUser}
            />
          </div>
        )}
      </div>
    </div>
  );
}

const headerBtn: React.CSSProperties = {
  background: 'transparent', border: 'none', cursor: 'pointer',
  color: 'hsl(var(--muted-foreground))', display: 'flex',
  alignItems: 'center', padding: '3px', borderRadius: '4px',
};

function getSimulatedReply(): string {
  const replies = [
    'Ωραία, ακούγεται τέλειο! 🎉',
    'Σύμφωνοι, θα το δούμε αύριο.',
    'Ένα λεπτό, θα σου στείλω τα δεδομένα.',
    'Πολύ καλή ιδέα! Ας το συζητήσουμε αναλυτικά.',
    'Ευχαριστώ! Θα ρίξω μια ματιά. 👀',
    'Ναι, μπορούμε να δουλέψουμε πάνω σε αυτό.',
    'Θα σε ενημερώσω μόλις τελειώσω. ✅',
  ];
  return replies[Math.floor(Math.random() * replies.length)];
}
