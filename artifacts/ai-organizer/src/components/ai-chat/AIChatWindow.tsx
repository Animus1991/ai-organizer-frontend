/**
 * AIChatWindow - Full-featured AI Chat Window
 * 
 * Features:
 * - Drag & resize with localStorage persistence
 * - Markdown rendering, conversation history, persistence
 * - Prompt templates, multi-format export
 * - SSE Streaming, Collaborative Sessions
 * - Context Window, Multi-Agent Workflows
 * - Citations, Knowledge Graph
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { ChatWindow, ChatMessage } from './types';
import type { ChatMessage as APIChatMessage } from '../../lib/api/aiChat';
import { AIChatInput } from './AIChatInput';
import { AIChatMessages } from './AIChatMessages';
import { AIChatAuthDialog } from './AIChatAuthDialog';
import { PromptTemplatesPanel } from './PromptTemplates';
import { checkSession, logoutProvider } from '../../lib/api/aiChat';
import { saveConversation, loadConversation, clearConversation } from './ChatPersistence';
import { exportConversation } from './ChatExport';
import { useStreamingChat, StreamingIndicator } from './StreamingChat';
import { useCollaborativeSession, SessionBadge, SessionPanel, CreateSessionDialog } from './CollaborativeSession';
import { manageContextWindow, ContextWindowIndicator, ContextWindowPanel } from './ContextWindowManager';
import { WorkflowPanel } from './MultiAgentWorkflow';
import { extractAllCitations, CitationsPanel } from './CitationExtractor';
import { extractAllEntities, KnowledgeGraphPanel } from './KnowledgeGraphIntegration';
import {
  BookOpen, Download, Trash2, MoreVertical, X, Users, GitBranch,
  BookMarked, Network, BarChart3, Zap,
} from 'lucide-react';

// ── localStorage helpers ──

const LAYOUT_STORAGE_KEY = 'ai-chat-window-layouts';

interface SavedLayout {
  position: { x: number; y: number };
  size: { width: number; height: number };
}

function loadSavedLayout(providerType: string): SavedLayout | null {
  try {
    const data = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (!data) return null;
    const all = JSON.parse(data) as Record<string, SavedLayout>;
    return all[providerType] || null;
  } catch { return null; }
}

function saveSavedLayout(providerType: string, layout: SavedLayout) {
  try {
    const data = localStorage.getItem(LAYOUT_STORAGE_KEY);
    const all = data ? JSON.parse(data) : {};
    all[providerType] = layout;
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(all));
  } catch { /* ignore */ }
}

// ── Component ──

interface AIChatWindowProps {
  window: ChatWindow;
  onClose: () => void;
  onUpdate: (updates: Partial<ChatWindow>) => void;
  onBringToFront: () => void;
  layoutMode?: 'floating' | 'sticky';
  minimizedIndex?: number;
  totalMinimized?: number;
}

export function AIChatWindow({
  window: chatWindow, onClose, onUpdate, onBringToFront,
  layoutMode = 'floating', minimizedIndex = 0, totalMinimized = 1,
}: AIChatWindowProps) {
  // ── Core state ──
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState<string | false>(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, w: 0, h: 0, px: 0, py: 0 });
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const windowRef = useRef<HTMLDivElement>(null);

  // ── Panel toggles ──
  const [showTemplates, setShowTemplates] = useState(false);
  const [showWorkflows, setShowWorkflows] = useState(false);
  const [showCitations, setShowCitations] = useState(false);
  const [showKnowledgeGraph, setShowKnowledgeGraph] = useState(false);
  const [showContextPanel, setShowContextPanel] = useState(false);
  const [showSessionPanel, setShowSessionPanel] = useState(false);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [templatePrompt, setTemplatePrompt] = useState<string | null>(null);

  // ── Streaming ──
  const streaming = useStreamingChat();

  // ── Collaborative ──
  const collab = useCollaborativeSession('current-user', 'You');

  // ── Derived data ──
  const citations = useMemo(
    () => extractAllCitations(messages.filter(m => m.role === 'assistant')),
    [messages]
  );
  const entities = useMemo(
    () => extractAllEntities(messages.filter(m => m.role === 'assistant')),
    [messages]
  );
  const contextState = useMemo(
    () => manageContextWindow(messages, chatWindow.providerType),
    [messages, chatWindow.providerType]
  );

  // ── Persist messages ──
  useEffect(() => {
    if (chatWindow.providerType) {
      const saved = loadConversation(chatWindow.providerType);
      if (saved.length > 0) setMessages(saved);
    }
  }, [chatWindow.providerType]);

  useEffect(() => {
    if (chatWindow.providerType && messages.length > 0) {
      saveConversation(chatWindow.providerType, messages);
    }
  }, [messages, chatWindow.providerType]);

  // ── Restore saved layout on mount ──
  useEffect(() => {
    if (chatWindow.providerType) {
      const saved = loadSavedLayout(chatWindow.providerType);
      if (saved) {
        onUpdate({ position: saved.position, size: saved.size });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Save layout on position/size change ──
  useEffect(() => {
    if (chatWindow.providerType && !isDragging && !isResizing) {
      saveSavedLayout(chatWindow.providerType, {
        position: chatWindow.position,
        size: chatWindow.size,
      });
    }
  }, [chatWindow.position, chatWindow.size, chatWindow.providerType, isDragging, isResizing]);

  // ── Connection check ──
  useEffect(() => {
    if (!chatWindow.providerType) return;
    const check = async () => {
      try {
        const session = await checkSession(chatWindow.providerType);
        if (session.connected && !session.expired) setIsConnected(true);
        else if (session.autoConnect && session.expired) setShowAuthDialog(true);
      } catch (error) {
        if (error instanceof Error && error.message.includes('Cannot connect')) {
          console.debug('Backend not available');
        }
        setIsConnected(false);
      }
    };
    check();
  }, [chatWindow.providerType]);

  // ── Drag handling ──
  const handleMouseDown = (e: React.MouseEvent) => {
    if (layoutMode === 'sticky') return;
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.chat-header-drag')) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - chatWindow.position.x, y: e.clientY - chatWindow.position.y });
      onBringToFront();
    }
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => {
      onUpdate({
        position: { x: e.clientX - dragStart.x, y: e.clientY - dragStart.y },
      });
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [isDragging, dragStart]);

  // ── Resize handling ──
  const handleResizeStart = (e: React.MouseEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(handle);
    setResizeStart({
      x: e.clientX, y: e.clientY,
      w: chatWindow.size.width, h: chatWindow.size.height,
      px: chatWindow.position.x, py: chatWindow.position.y,
    });
    onBringToFront();
  };

  useEffect(() => {
    if (!isResizing) return;
    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - resizeStart.x;
      const dy = e.clientY - resizeStart.y;
      const MIN_W = 320, MIN_H = 280;

      let newW = resizeStart.w, newH = resizeStart.h;
      let newX = resizeStart.px, newY = resizeStart.py;

      if (isResizing.includes('e')) newW = Math.max(MIN_W, resizeStart.w + dx);
      if (isResizing.includes('w')) { newW = Math.max(MIN_W, resizeStart.w - dx); newX = resizeStart.px + (resizeStart.w - newW); }
      if (isResizing.includes('s')) newH = Math.max(MIN_H, resizeStart.h + dy);
      if (isResizing.includes('n')) { newH = Math.max(MIN_H, resizeStart.h - dy); newY = resizeStart.py + (resizeStart.h - newH); }

      onUpdate({ size: { width: newW, height: newH }, position: { x: newX, y: newY } });
    };
    const onUp = () => setIsResizing(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [isResizing, resizeStart]);

  // ── Actions ──
  const handleClearChat = useCallback(() => {
    setMessages([]);
    clearConversation(chatWindow.providerType);
    setShowMenu(false);
  }, [chatWindow.providerType]);

  const handleExport = useCallback((format: 'markdown' | 'text' | 'html' | 'bibtex') => {
    exportConversation({ providerType: chatWindow.providerType, messages, format, includeTimestamps: true, includeMetadata: true });
    setShowMenu(false);
  }, [chatWindow.providerType, messages]);

  const handleTemplateSelect = useCallback((prompt: string) => {
    setTemplatePrompt(prompt);
    setShowTemplates(false);
  }, []);

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages(prev => [...prev, msg]);
  }, []);

  const closeAllPanels = useCallback(() => {
    setShowTemplates(false);
    setShowWorkflows(false);
    setShowCitations(false);
    setShowKnowledgeGraph(false);
    setShowContextPanel(false);
    setShowSessionPanel(false);
    setShowCreateSession(false);
  }, []);

  const togglePanel = useCallback((setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    closeAllPanels();
    setter(prev => !prev);
  }, [closeAllPanels]);

  // ── Minimized view ──
  if (chatWindow.minimized) {
    return (
      <div
        data-ai-chat-window
        ref={windowRef}
        style={{
          position: 'fixed',
          left: chatWindow.position.x,
          top: chatWindow.position.y + chatWindow.size.height - 40,
          width: 200, height: 40,
          background: 'hsl(var(--card))', backdropFilter: 'blur(20px)',
          border: '1px solid hsl(var(--border))', borderRadius: '12px',
          zIndex: chatWindow.zIndex, cursor: 'pointer',
          display: 'flex', alignItems: 'center', padding: '0 12px',
          boxShadow: '0 4px 24px hsl(var(--foreground) / 0.1)',
        }}
        onClick={() => onUpdate({ minimized: false })}
      >
        <AIIcon size={18} />
        <span style={{ color: 'hsl(var(--foreground) / 0.8)', fontSize: '14px', marginLeft: '8px' }}>
          {chatWindow.providerType}
        </span>
        {messages.length > 0 && (
          <span style={{
            marginLeft: 'auto', fontSize: '10px',
            background: 'hsl(var(--primary) / 0.2)', color: 'hsl(var(--primary))',
            borderRadius: '8px', padding: '1px 6px', fontWeight: 600,
          }}>
            {messages.length}
          </span>
        )}
      </div>
    );
  }

  // ── Resize handles ──
  const resizeHandles = layoutMode === 'floating' ? (
    <>
      {['n','s','e','w','ne','nw','se','sw'].map(h => (
        <div
          key={h}
          onMouseDown={e => handleResizeStart(e, h)}
          style={{
            position: 'absolute',
            ...(h.includes('n') ? { top: -3 } : {}),
            ...(h.includes('s') ? { bottom: -3 } : {}),
            ...(h.includes('e') ? { right: -3 } : {}),
            ...(h.includes('w') ? { left: -3 } : {}),
            ...(h === 'n' || h === 's' ? { left: 8, right: 8, height: 6 } : {}),
            ...(h === 'e' || h === 'w' ? { top: 8, bottom: 8, width: 6 } : {}),
            ...(h.length === 2 ? { width: 12, height: 12 } : {}),
            cursor: {
              n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize',
              ne: 'nesw-resize', nw: 'nwse-resize', se: 'nwse-resize', sw: 'nesw-resize',
            }[h],
            zIndex: 10,
          }}
        />
      ))}
    </>
  ) : null;

  return (
    <>
      <div
        data-ai-chat-window
        ref={windowRef}
        style={{
          position: 'fixed',
          left: chatWindow.position.x, top: chatWindow.position.y,
          width: chatWindow.size.width, height: chatWindow.size.height,
          background: 'hsl(var(--card))', backdropFilter: 'blur(20px)',
          border: '1px solid hsl(var(--border))', borderRadius: '12px',
          zIndex: chatWindow.zIndex,
          display: 'flex', flexDirection: 'column',
          boxShadow: isDragging || isResizing
            ? '0 12px 48px hsl(var(--foreground) / 0.2)'
            : '0 8px 32px hsl(var(--foreground) / 0.12)',
          overflow: 'hidden',
          transition: isDragging || isResizing ? 'none' : 'box-shadow 0.2s',
        }}
        onMouseDown={() => onBringToFront()}
      >
        {/* ── Resize handles ── */}
        {resizeHandles}

        {/* ── Header ── */}
        <div
          className="chat-header-drag"
          onMouseDown={layoutMode === 'floating' ? handleMouseDown : undefined}
          style={{
            padding: '8px 10px',
            borderBottom: '1px solid hsl(var(--border))',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: layoutMode === 'floating' ? 'move' : 'default',
            background: 'hsl(var(--card) / 0.95)', flexShrink: 0,
            userSelect: 'none',
          }}
        >
          {/* Left: icon + name + status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
            <AIIcon size={18} />
            <span style={{
              color: 'hsl(var(--foreground) / 0.9)', fontWeight: 600, fontSize: '13px',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {chatWindow.providerType}
            </span>
            {isConnected && <span style={{
              width: '7px', height: '7px', borderRadius: '50%',
              background: 'hsl(142 71% 45%)', display: 'inline-block', flexShrink: 0,
            }} title="Connected" />}
          </div>

          {/* Right: action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1px', flexShrink: 0 }}>
            {isConnected && (
              <>
                {/* Templates */}
                <HeaderBtn
                  icon={<BookOpen size={13} />}
                  active={showTemplates}
                  title="Prompt Templates"
                  onClick={() => togglePanel(setShowTemplates)}
                />
                {/* Collaborative Session */}
                {collab.session ? (
                  <SessionBadge session={collab.session} onTogglePanel={() => togglePanel(setShowSessionPanel)} />
                ) : (
                  <HeaderBtn
                    icon={<Users size={13} />}
                    title="Collaborative Session"
                    onClick={() => togglePanel(setShowCreateSession)}
                  />
                )}
                {/* Workflows */}
                <HeaderBtn
                  icon={<GitBranch size={13} />}
                  active={showWorkflows}
                  title="Multi-Agent Workflows"
                  onClick={() => togglePanel(setShowWorkflows)}
                />
                {/* Citations */}
                <HeaderBtn
                  icon={<BookMarked size={13} />}
                  active={showCitations}
                  title={`Citations (${citations.length})`}
                  onClick={() => togglePanel(setShowCitations)}
                  badge={citations.length > 0 ? citations.length : undefined}
                />
                {/* Knowledge Graph */}
                <HeaderBtn
                  icon={<Network size={13} />}
                  active={showKnowledgeGraph}
                  title={`Knowledge Graph (${entities.length})`}
                  onClick={() => togglePanel(setShowKnowledgeGraph)}
                  badge={entities.length > 0 ? entities.length : undefined}
                />
                {/* Context Window */}
                <HeaderBtn
                  icon={<BarChart3 size={13} />}
                  active={showContextPanel}
                  title="Context Window"
                  onClick={() => togglePanel(setShowContextPanel)}
                />
              </>
            )}

            {/* Menu */}
            <div style={{ position: 'relative' }}>
              <HeaderBtn icon={<MoreVertical size={13} />} title="Options" onClick={() => setShowMenu(!showMenu)} />
              {showMenu && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0,
                  background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
                  borderRadius: '8px', boxShadow: '0 4px 16px hsl(var(--foreground) / 0.1)',
                  zIndex: 100, minWidth: '160px', padding: '4px',
                }}>
                  <MenuButton icon={<Download size={12} />} label="Export Markdown" onClick={() => handleExport('markdown')} disabled={messages.length === 0} />
                  <MenuButton icon={<Download size={12} />} label="Export Text" onClick={() => handleExport('text')} disabled={messages.length === 0} />
                  <MenuButton icon={<Download size={12} />} label="Export HTML/PDF" onClick={() => handleExport('html')} disabled={messages.length === 0} />
                  <MenuButton icon={<Download size={12} />} label="Export BibTeX" onClick={() => handleExport('bibtex')} disabled={messages.length === 0} />
                  <div style={{ height: '1px', background: 'hsl(var(--border))', margin: '4px 0' }} />
                  <MenuButton icon={<Trash2 size={12} />} label="Clear Chat" onClick={handleClearChat} disabled={messages.length === 0} destructive />
                  {isConnected && (
                    <MenuButton
                      icon={<X size={12} />}
                      label="Logout"
                      onClick={async () => {
                        try { await logoutProvider(chatWindow.providerType); setIsConnected(false); setShowMenu(false); } catch {}
                      }}
                      destructive
                    />
                  )}
                </div>
              )}
            </div>

            {/* Minimize */}
            <HeaderBtn
              icon={<svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>}
              title="Minimize"
              onClick={() => onUpdate({ minimized: true })}
            />
            {/* Close */}
            <HeaderBtn
              icon={<X size={13} />}
              title="Close"
              onClick={onClose}
            />
          </div>
        </div>

        {/* ── Context window indicator (always visible when connected) ── */}
        {isConnected && messages.length > 0 && (
          <div style={{
            borderBottom: '1px solid hsl(var(--border) / 0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 4px',
          }}>
            <ContextWindowIndicator state={contextState} providerType={chatWindow.providerType} />
            {streaming.isStreaming && (
              <StreamingIndicator tokensPerSecond={streaming.getTokensPerSecond()} tokensReceived={streaming.tokensReceived} />
            )}
          </div>
        )}

        {/* ── Context Window Panel ── */}
        {showContextPanel && (
          <ContextWindowPanel state={contextState} providerType={chatWindow.providerType} onClose={() => setShowContextPanel(false)} />
        )}

        {/* ── Content ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
          {!isConnected ? (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '24px', gap: '16px',
            }}>
              <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '14px', textAlign: 'center' }}>
                Connect to {chatWindow.providerType || 'AI Provider'} to start chatting
              </p>
              <button
                onClick={() => { if (chatWindow.providerType) setShowAuthDialog(true); }}
                style={{
                  padding: '10px 20px', background: 'hsl(var(--primary))',
                  border: 'none', borderRadius: '8px',
                  color: 'hsl(var(--primary-foreground))', fontWeight: 600, cursor: 'pointer',
                }}
              >
                Connect
              </button>
              {messages.length > 0 && (
                <p style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground) / 0.6)' }}>
                  {messages.length} cached messages
                </p>
              )}
            </div>
          ) : (
            <>
              {/* Messages area */}
              <AIChatMessages
                providerType={chatWindow.providerType}
                messages={messages}
                onNewMessage={addMessage}
              />

              {/* Streaming live text */}
              {streaming.isStreaming && streaming.currentContent && (
                <div style={{
                  padding: '6px 12px',
                  borderTop: '1px solid hsl(var(--border) / 0.3)',
                  fontSize: '12px', color: 'hsl(var(--foreground) / 0.7)',
                  maxHeight: '80px', overflowY: 'auto',
                  background: 'hsl(var(--muted) / 0.1)',
                  fontStyle: 'italic',
                }}>
                  {streaming.currentContent}
                </div>
              )}

              {/* ── Overlay panels ── */}
              {showTemplates && (
                <PromptTemplatesPanel onSelectTemplate={handleTemplateSelect} onClose={() => setShowTemplates(false)} />
              )}
              {showWorkflows && (
                <WorkflowPanel onClose={() => setShowWorkflows(false)} isConnected={isConnected} />
              )}
              {showCreateSession && (
                <CreateSessionDialog
                  providerType={chatWindow.providerType}
                  onCreateSession={(name) => { collab.createSession(chatWindow.providerType, name); setShowCreateSession(false); }}
                  onJoinSession={(code) => { collab.joinSession(code); setShowCreateSession(false); }}
                  onClose={() => setShowCreateSession(false)}
                />
              )}
              {showSessionPanel && collab.session && (
                <SessionPanel
                  session={collab.session}
                  isHost={collab.isHost}
                  onClose={() => setShowSessionPanel(false)}
                  onLeave={() => { collab.leaveSession(); setShowSessionPanel(false); }}
                />
              )}

              {/* ── Bottom panels ── */}
              {showCitations && (
                <CitationsPanel citations={citations} onClose={() => setShowCitations(false)} />
              )}
              {showKnowledgeGraph && (
                <KnowledgeGraphPanel
                  entities={entities}
                  onLinkEntity={() => {}}
                  onUnlinkEntity={() => {}}
                  onClose={() => setShowKnowledgeGraph(false)}
                />
              )}

              {/* Input */}
              <div style={{ padding: '8px 12px', borderTop: '1px solid hsl(var(--border))' }}>
                <AIChatInput
                  providerType={chatWindow.providerType}
                  conversationHistory={messages}
                  onMessageSent={(msg: APIChatMessage) => {
                    addMessage({
                      id: `msg-${Date.now()}`, role: msg.role,
                      content: msg.content, timestamp: new Date(),
                    });
                  }}
                  onResponseReceived={(content) => {
                    addMessage({
                      id: `msg-${Date.now()}-resp`, role: 'assistant',
                      content, timestamp: new Date(),
                    });
                  }}
                  onError={(error) => console.error('Chat error:', error)}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {showAuthDialog && chatWindow.providerType && (
        <AIChatAuthDialog
          providerType={chatWindow.providerType}
          onClose={() => setShowAuthDialog(false)}
          onSuccess={() => { setShowAuthDialog(false); setIsConnected(true); }}
        />
      )}
    </>
  );
}

// ── Small components ──

function AIIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ flexShrink: 0 }}>
      <ellipse cx="50" cy="50" rx="42" ry="16" fill="none" stroke="hsl(var(--primary))" strokeWidth="4" opacity="0.85" />
      <ellipse cx="50" cy="50" rx="42" ry="16" fill="none" stroke="hsl(var(--primary))" strokeWidth="4" transform="rotate(60 50 50)" opacity="0.85" />
      <ellipse cx="50" cy="50" rx="42" ry="16" fill="none" stroke="hsl(var(--primary))" strokeWidth="4" transform="rotate(-60 50 50)" opacity="0.85" />
      <text x="50" y="50" textAnchor="middle" dominantBaseline="central" fontSize="26" fontWeight="700" fill="hsl(var(--foreground))" fontFamily="system-ui, sans-serif">AI</text>
    </svg>
  );
}

function HeaderBtn({ icon, title, onClick, active, badge }: {
  icon: React.ReactNode; title: string; onClick: () => void;
  active?: boolean; badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        padding: '4px', background: active ? 'hsl(var(--primary) / 0.1)' : 'transparent',
        border: 'none',
        color: active ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
        cursor: 'pointer', borderRadius: '5px',
        display: 'flex', alignItems: 'center', gap: '1px',
        position: 'relative',
      }}
    >
      {icon}
      {badge !== undefined && badge > 0 && (
        <span style={{
          position: 'absolute', top: -2, right: -4,
          fontSize: '8px', fontWeight: 700, minWidth: '12px', height: '12px',
          borderRadius: '6px', background: 'hsl(var(--primary))',
          color: 'hsl(var(--primary-foreground))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 2px',
        }}>
          {badge}
        </span>
      )}
    </button>
  );
}

function MenuButton({ icon, label, onClick, disabled, destructive }: {
  icon: React.ReactNode; label: string; onClick: () => void;
  disabled?: boolean; destructive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        width: '100%', padding: '6px 10px',
        background: 'transparent', border: 'none', borderRadius: '6px',
        color: disabled
          ? 'hsl(var(--muted-foreground) / 0.4)'
          : destructive
          ? 'hsl(var(--destructive))'
          : 'hsl(var(--foreground))',
        fontSize: '12px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        textAlign: 'left',
      }}
    >
      {icon}
      {label}
    </button>
  );
}
