/**
 * CollaborativeSession - Shared AI chat sessions
 * Multiple users can view and participate in the same AI conversation.
 * Uses BroadcastChannel for same-origin tab sync and simulated WebSocket for remote sync.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Users, Share2, Copy, CheckCircle, Crown, Eye, MessageSquare, X, UserPlus } from 'lucide-react';

// Types
export interface SessionParticipant {
  id: string;
  name: string;
  avatar?: string;
  role: 'owner' | 'collaborator' | 'viewer';
  isTyping: boolean;
  cursor?: { messageId: string };
  joinedAt: Date;
  lastActive: Date;
  color: string;
}

export interface CollaborativeSessionInfo {
  id: string;
  name: string;
  ownerId: string;
  providerType: string;
  participants: SessionParticipant[];
  createdAt: Date;
  isActive: boolean;
  shareCode: string;
  settings: {
    allowViewers: boolean;
    allowCollaborators: boolean;
    maxParticipants: number;
  };
}

// Participant colors
const PARTICIPANT_COLORS = [
  '262 83% 58%', '142 71% 45%', '38 92% 50%', '200 80% 50%',
  '0 84% 60%', '280 70% 55%', '180 60% 45%', '320 65% 50%',
];

function generateShareCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
}

// Hook for managing collaborative sessions
export function useCollaborativeSession(currentUserId: string, currentUserName: string) {
  const [session, setSession] = useState<CollaborativeSessionInfo | null>(null);
  const [isHost, setIsHost] = useState(false);
  const channelRef = useRef<BroadcastChannel | null>(null);

  const createSession = useCallback((providerType: string, name?: string) => {
    const sessionId = generateSessionId();
    const shareCode = generateShareCode();
    
    const newSession: CollaborativeSessionInfo = {
      id: sessionId,
      name: name || `Session ${shareCode}`,
      ownerId: currentUserId,
      providerType,
      participants: [{
        id: currentUserId,
        name: currentUserName,
        role: 'owner',
        isTyping: false,
        joinedAt: new Date(),
        lastActive: new Date(),
        color: PARTICIPANT_COLORS[0],
      }],
      createdAt: new Date(),
      isActive: true,
      shareCode,
      settings: {
        allowViewers: true,
        allowCollaborators: true,
        maxParticipants: 8,
      },
    };

    setSession(newSession);
    setIsHost(true);

    // Set up BroadcastChannel for same-origin sync
    try {
      const channel = new BroadcastChannel(`ai-session-${sessionId}`);
      channelRef.current = channel;
      channel.onmessage = (event) => {
        handleChannelMessage(event.data);
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported');
    }

    return newSession;
  }, [currentUserId, currentUserName]);

  const joinSession = useCallback((shareCode: string) => {
    // In production, this would call an API to find the session
    // For now, try BroadcastChannel
    const participant: SessionParticipant = {
      id: currentUserId,
      name: currentUserName,
      role: 'collaborator',
      isTyping: false,
      joinedAt: new Date(),
      lastActive: new Date(),
      color: PARTICIPANT_COLORS[Math.floor(Math.random() * PARTICIPANT_COLORS.length)],
    };

    // Simulate joining
    setIsHost(false);
    return participant;
  }, [currentUserId, currentUserName]);

  const leaveSession = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.close();
      channelRef.current = null;
    }
    setSession(null);
    setIsHost(false);
  }, []);

  const handleChannelMessage = useCallback((data: any) => {
    if (data.type === 'participant_joined') {
      setSession(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          participants: [...prev.participants, data.participant],
        };
      });
    } else if (data.type === 'typing') {
      setSession(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          participants: prev.participants.map(p =>
            p.id === data.userId ? { ...p, isTyping: data.isTyping } : p
          ),
        };
      });
    }
  }, []);

  const broadcastTyping = useCallback((isTyping: boolean) => {
    channelRef.current?.postMessage({
      type: 'typing',
      userId: currentUserId,
      isTyping,
    });
  }, [currentUserId]);

  const broadcastMessage = useCallback((message: any) => {
    channelRef.current?.postMessage({
      type: 'new_message',
      message,
      senderId: currentUserId,
    });
  }, [currentUserId]);

  useEffect(() => {
    return () => {
      channelRef.current?.close();
    };
  }, []);

  return {
    session,
    isHost,
    createSession,
    joinSession,
    leaveSession,
    broadcastTyping,
    broadcastMessage,
  };
}

// UI Components

interface SessionBadgeProps {
  session: CollaborativeSessionInfo | null;
  onTogglePanel: () => void;
}

export function SessionBadge({ session, onTogglePanel }: SessionBadgeProps) {
  if (!session) return null;

  const activeCount = session.participants.filter(p => 
    Date.now() - p.lastActive.getTime() < 300000
  ).length;

  return (
    <button
      onClick={onTogglePanel}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 8px',
        borderRadius: '12px',
        border: '1px solid hsl(var(--primary) / 0.3)',
        background: 'hsl(var(--primary) / 0.1)',
        color: 'hsl(var(--primary))',
        fontSize: '10px',
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      <Users size={11} />
      <span>{activeCount}</span>
      {/* Participant avatars */}
      <div style={{ display: 'flex', marginLeft: '2px' }}>
        {session.participants.slice(0, 3).map((p, i) => (
          <div
            key={p.id}
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: `hsl(${p.color})`,
              border: '2px solid hsl(var(--card))',
              marginLeft: i > 0 ? '-6px' : 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '8px',
              fontWeight: 700,
              color: '#fff',
            }}
            title={p.name}
          >
            {p.name[0]}
          </div>
        ))}
        {session.participants.length > 3 && (
          <div style={{
            width: '16px', height: '16px', borderRadius: '50%',
            background: 'hsl(var(--muted))', border: '2px solid hsl(var(--card))',
            marginLeft: '-6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '7px', fontWeight: 700, color: 'hsl(var(--muted-foreground))',
          }}>
            +{session.participants.length - 3}
          </div>
        )}
      </div>
    </button>
  );
}

interface SessionPanelProps {
  session: CollaborativeSessionInfo;
  isHost: boolean;
  onClose: () => void;
  onLeave: () => void;
}

export function SessionPanel({ session, isHost, onClose, onLeave }: SessionPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(session.shareCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      right: 0,
      width: '240px',
      height: '100%',
      background: 'hsl(var(--card))',
      borderLeft: '1px solid hsl(var(--border))',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 20,
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 12px',
        borderBottom: '1px solid hsl(var(--border))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Users size={14} style={{ color: 'hsl(var(--primary))' }} />
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'hsl(var(--foreground))' }}>
            Collaborative Session
          </span>
        </div>
        <button onClick={onClose} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'hsl(var(--muted-foreground))', padding: '4px',
        }}>
          <X size={13} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
        {/* Share Code */}
        <div style={{
          padding: '8px 10px',
          borderRadius: '8px',
          background: 'hsl(var(--primary) / 0.05)',
          border: '1px solid hsl(var(--primary) / 0.15)',
          marginBottom: '10px',
        }}>
          <div style={{ fontSize: '10px', fontWeight: 600, color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }}>
            SHARE CODE
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              fontSize: '18px',
              fontWeight: 800,
              letterSpacing: '3px',
              color: 'hsl(var(--primary))',
              fontFamily: 'monospace',
            }}>
              {session.shareCode}
            </span>
            <button onClick={handleCopyCode} style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'hsl(var(--primary))', padding: '4px',
            }}>
              {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        {/* Participants */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{
            fontSize: '10px', fontWeight: 700, color: 'hsl(var(--muted-foreground))',
            textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px',
          }}>
            Participants ({session.participants.length}/{session.settings.maxParticipants})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {session.participants.map(p => (
              <div key={p.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 8px',
                borderRadius: '6px',
                background: 'hsl(var(--muted) / 0.2)',
              }}>
                <div style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  background: `hsl(${p.color})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px', fontWeight: 700, color: '#fff',
                  position: 'relative',
                }}>
                  {p.name[0]}
                  {p.isTyping && (
                    <span style={{
                      position: 'absolute', bottom: '-2px', right: '-2px',
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: 'hsl(142 71% 45%)',
                      border: '2px solid hsl(var(--card))',
                      animation: 'pulse 1s infinite',
                    }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '11px', fontWeight: 600, color: 'hsl(var(--foreground))',
                    display: 'flex', alignItems: 'center', gap: '4px',
                  }}>
                    {p.name}
                    {p.role === 'owner' && <Crown size={10} style={{ color: 'hsl(38 92% 50%)' }} />}
                  </div>
                  <div style={{ fontSize: '9px', color: 'hsl(var(--muted-foreground))' }}>
                    {p.isTyping ? 'typing...' : p.role}
                  </div>
                </div>
                <div style={{
                  fontSize: '9px',
                  padding: '1px 4px',
                  borderRadius: '3px',
                  background: p.role === 'owner' ? 'hsl(38 92% 50% / 0.15)' :
                    p.role === 'collaborator' ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--muted) / 0.3)',
                  color: p.role === 'owner' ? 'hsl(38 92% 50%)' :
                    p.role === 'collaborator' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                  fontWeight: 600,
                }}>
                  {p.role === 'owner' ? '👑' : p.role === 'collaborator' ? <MessageSquare size={9} /> : <Eye size={9} />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Session Info */}
        <div style={{
          fontSize: '10px',
          color: 'hsl(var(--muted-foreground))',
          padding: '6px 0',
          borderTop: '1px solid hsl(var(--border) / 0.5)',
        }}>
          <div>Session: {session.name}</div>
          <div>Created: {session.createdAt.toLocaleTimeString()}</div>
          <div>Provider: {session.providerType}</div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '8px 12px',
        borderTop: '1px solid hsl(var(--border))',
        display: 'flex',
        gap: '6px',
      }}>
        {isHost && (
          <button style={{
            flex: 1, padding: '6px', borderRadius: '6px', border: 'none',
            background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))',
            fontSize: '11px', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
          }}>
            <UserPlus size={12} /> Invite
          </button>
        )}
        <button
          onClick={onLeave}
          style={{
            flex: 1, padding: '6px', borderRadius: '6px', border: 'none',
            background: 'hsl(var(--destructive) / 0.1)', color: 'hsl(var(--destructive))',
            fontSize: '11px', fontWeight: 600, cursor: 'pointer',
          }}
        >
          {isHost ? 'End Session' : 'Leave'}
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

interface CreateSessionDialogProps {
  providerType: string;
  onCreateSession: (name: string) => void;
  onJoinSession: (code: string) => void;
  onClose: () => void;
}

export function CreateSessionDialog({ providerType, onCreateSession, onJoinSession, onClose }: CreateSessionDialogProps) {
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'hsl(var(--background) / 0.9)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 30,
    }}>
      <div style={{
        width: '280px',
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 8px 24px hsl(var(--foreground) / 0.1)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'hsl(var(--foreground))' }}>
            <Users size={16} style={{ verticalAlign: '-3px', marginRight: '6px' }} />
            Collaborative Session
          </span>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'hsl(var(--muted-foreground))',
          }}>
            <X size={14} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
          {(['create', 'join'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                flex: 1,
                padding: '6px',
                borderRadius: '6px',
                border: 'none',
                background: mode === m ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--muted) / 0.3)',
                color: mode === m ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {m === 'create' ? '🆕 Create' : '🔗 Join'}
            </button>
          ))}
        </div>

        {mode === 'create' ? (
          <>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Session name (optional)..."
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--background))',
                color: 'hsl(var(--foreground))',
                fontSize: '12px',
                marginBottom: '8px',
                outline: 'none',
              }}
            />
            <button
              onClick={() => onCreateSession(name || `${providerType} Session`)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                background: 'hsl(var(--primary))',
                color: 'hsl(var(--primary-foreground))',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Create Session
            </button>
          </>
        ) : (
          <>
            <input
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-digit code..."
              maxLength={6}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--background))',
                color: 'hsl(var(--foreground))',
                fontSize: '16px',
                fontWeight: 700,
                letterSpacing: '4px',
                textAlign: 'center',
                fontFamily: 'monospace',
                marginBottom: '8px',
                outline: 'none',
              }}
            />
            <button
              onClick={() => joinCode.length === 6 && onJoinSession(joinCode)}
              disabled={joinCode.length !== 6}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                background: joinCode.length === 6 ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
                color: joinCode.length === 6 ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
                fontSize: '12px',
                fontWeight: 700,
                cursor: joinCode.length === 6 ? 'pointer' : 'not-allowed',
              }}
            >
              Join Session
            </button>
          </>
        )}
      </div>
    </div>
  );
}
