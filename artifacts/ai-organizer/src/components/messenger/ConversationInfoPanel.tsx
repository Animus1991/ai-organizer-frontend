/**
 * ConversationInfoPanel - Right sidebar with members, pinned, shared files, blockchain & NDA status
 */
import React, { useState } from 'react';
import { X, Users, Pin, Shield, ShieldCheck, Lock, FileText, Image, Hash } from 'lucide-react';
import type { Conversation, Message, MessengerUser } from './types';
import { MESSAGE_TAG_CONFIG } from './types';
import { format } from 'date-fns';
import { el } from 'date-fns/locale';

interface ConversationInfoPanelProps {
  conversation: Conversation;
  messages: Message[];
  currentUserId: string;
  onClose: () => void;
}

type InfoTab = 'overview' | 'media' | 'research';

const statusColors: Record<string, string> = {
  online: 'hsl(142 71% 45%)',
  away: 'hsl(38 92% 50%)',
  busy: 'hsl(0 84% 60%)',
  offline: 'hsl(var(--muted-foreground) / 0.3)',
};

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
}

export function ConversationInfoPanel({ conversation, messages, currentUserId, onClose }: ConversationInfoPanelProps) {
  const [tab, setTab] = useState<InfoTab>('overview');

  const pinnedMsgs = messages.filter(m => m.pinned);
  const taggedMsgs = messages.filter(m => m.tag);
  const blockchainMsgs = messages.filter(m => m.blockchainProof);
  const mediaAttachments = messages.flatMap(m => m.attachments).filter(a => ['image', 'video'].includes(a.type));
  const fileAttachments = messages.flatMap(m => m.attachments).filter(a => ['file', 'paper', 'dataset'].includes(a.type));

  const tabs: { key: InfoTab; label: string }[] = [
    { key: 'overview', label: 'Γενικά' },
    { key: 'media', label: 'Media' },
    { key: 'research', label: 'Research' },
  ];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      borderLeft: '1px solid hsl(var(--border))', background: 'hsl(var(--card))',
      width: '100%', maxWidth: '260px', minWidth: '180px', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '8px 10px', borderBottom: '1px solid hsl(var(--border))',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontWeight: 700, fontSize: '12px', color: 'hsl(var(--foreground))' }}>Πληροφορίες</span>
        <button onClick={onClose} style={closeBtn}>
          <X size={14} />
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: '2px', padding: '6px 8px',
        background: 'hsl(var(--muted) / 0.2)',
      }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1, padding: '4px 6px', borderRadius: '6px', border: 'none',
              fontSize: '10.5px', fontWeight: 600, cursor: 'pointer',
              background: tab === t.key ? 'hsl(var(--primary))' : 'transparent',
              color: tab === t.key ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
              transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {tab === 'overview' && (
          <>
            {/* Members */}
            <Section title={`Μέλη (${conversation.participants.length})`} icon={<Users size={12} />}>
              {conversation.participants.map(user => (
                <div key={user.id} style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0',
                }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%',
                      background: 'hsl(var(--accent))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '10px', fontWeight: 600, color: 'hsl(var(--foreground))',
                    }}>
                      {getInitials(user.name)}
                    </div>
                    <div style={{
                      position: 'absolute', bottom: -1, right: -1,
                      width: 8, height: 8, borderRadius: '50%',
                      background: statusColors[user.status],
                      border: '2px solid hsl(var(--card))',
                    }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '11px', fontWeight: 500, color: 'hsl(var(--foreground))' }}>
                      {user.name} {user.id === currentUserId && <span style={{ opacity: 0.5 }}>(εσύ)</span>}
                    </div>
                    {user.institution && (
                      <div style={{ fontSize: '9.5px', color: 'hsl(var(--muted-foreground))' }}>{user.institution}</div>
                    )}
                  </div>
                </div>
              ))}
            </Section>

            {/* NDA Status */}
            {conversation.nda.enabled && (
              <Section title="NDA Status" icon={<Lock size={12} style={{ color: 'hsl(var(--destructive))' }} />}>
                <div style={{
                  padding: '6px 8px', borderRadius: '6px',
                  background: 'hsl(var(--destructive) / 0.06)',
                  fontSize: '11px', color: 'hsl(var(--destructive))',
                }}>
                  <div style={{ fontWeight: 600, marginBottom: '2px' }}>🔒 NDA Protected</div>
                  <div style={{ fontSize: '10px', color: 'hsl(var(--muted-foreground))' }}>
                    Αποδοχές: {conversation.nda.acceptedBy.length}/{conversation.participants.length}
                  </div>
                  {conversation.nda.activatedAt && (
                    <div style={{ fontSize: '10px', color: 'hsl(var(--muted-foreground))', fontVariantNumeric: 'tabular-nums' }}>
                      Ενεργοποιήθηκε: {format(conversation.nda.activatedAt, 'dd MMM yyyy HH:mm', { locale: el })}
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* Blockchain Status */}
            {conversation.blockchain.enabled && (
              <Section title="Blockchain" icon={<ShieldCheck size={12} style={{ color: 'hsl(142 71% 45%)' }} />}>
                <div style={{
                  padding: '6px 8px', borderRadius: '6px',
                  background: 'hsl(142 71% 45% / 0.06)',
                  fontSize: '11px', color: 'hsl(142 71% 45%)',
                }}>
                  <div style={{ fontWeight: 600 }}>
                    {conversation.blockchain.acceptedByAll ? '🔗 Αμοιβαία Επαλήθευση' : '🔗 Μονομερής'}
                  </div>
                  <div style={{ fontSize: '10px', color: 'hsl(var(--muted-foreground))' }}>
                    {blockchainMsgs.length} verified μηνύματα
                  </div>
                </div>
              </Section>
            )}

            {/* Pinned messages */}
            {pinnedMsgs.length > 0 && (
              <Section title={`Καρφιτσωμένα (${pinnedMsgs.length})`} icon={<Pin size={12} />}>
                {pinnedMsgs.slice(0, 5).map(m => (
                  <div key={m.id} style={{
                    fontSize: '10.5px', color: 'hsl(var(--muted-foreground))',
                    padding: '3px 0', borderLeft: '2px solid hsl(var(--primary))',
                    paddingLeft: '6px', marginBottom: '2px',
                  }}>
                    {m.content.substring(0, 60)}{m.content.length > 60 ? '...' : ''}
                  </div>
                ))}
              </Section>
            )}
          </>
        )}

        {tab === 'media' && (
          <>
            <Section title={`Εικόνες (${mediaAttachments.length})`} icon={<Image size={12} />}>
              {mediaAttachments.length === 0 && <EmptyState text="Δεν υπάρχουν εικόνες" />}
            </Section>
            <Section title={`Αρχεία (${fileAttachments.length})`} icon={<FileText size={12} />}>
              {fileAttachments.length === 0 && <EmptyState text="Δεν υπάρχουν αρχεία" />}
            </Section>
          </>
        )}

        {tab === 'research' && (
          <>
            {/* Tagged messages */}
            <Section title={`Research Tags (${taggedMsgs.length})`} icon={<Hash size={12} />}>
              {taggedMsgs.length === 0 && <EmptyState text="Δεν υπάρχουν ετικέτες" />}
              {taggedMsgs.slice(0, 10).map(m => {
                const cfg = m.tag ? MESSAGE_TAG_CONFIG[m.tag] : null;
                return cfg ? (
                  <div key={m.id} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '6px',
                    padding: '3px 0', fontSize: '10.5px',
                  }}>
                    <span style={{
                      padding: '1px 4px', borderRadius: '3px',
                      background: `hsl(${cfg.color} / 0.12)`,
                      color: `hsl(${cfg.color})`, fontSize: '9px', fontWeight: 600,
                      flexShrink: 0,
                    }}>
                      {cfg.icon} {cfg.label}
                    </span>
                    <span style={{ color: 'hsl(var(--muted-foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.content.substring(0, 40)}
                    </span>
                  </div>
                ) : null;
              })}
            </Section>

            {/* Blockchain audit */}
            {blockchainMsgs.length > 0 && (
              <Section title={`Verified Messages (${blockchainMsgs.length})`} icon={<ShieldCheck size={12} style={{ color: 'hsl(142 71% 45%)' }} />}>
                {blockchainMsgs.slice(0, 5).map(m => (
                  <div key={m.id} style={{
                    fontSize: '10px', padding: '3px 0',
                    display: 'flex', alignItems: 'center', gap: '4px',
                  }}>
                    <ShieldCheck size={10} style={{ color: 'hsl(142 71% 45%)', flexShrink: 0 }} />
                    <span style={{ color: 'hsl(var(--muted-foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                      {format(m.timestamp, 'HH:mm')} — {m.blockchainProof?.hash.substring(0, 10)}...
                    </span>
                  </div>
                ))}
              </Section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '5px',
        fontSize: '10px', fontWeight: 700, color: 'hsl(var(--muted-foreground))',
        textTransform: 'uppercase', letterSpacing: '0.3px',
        marginBottom: '6px', padding: '0 2px',
      }}>
        {icon} {title}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground) / 0.5)', textAlign: 'center', padding: '8px' }}>
      {text}
    </div>
  );
}

const closeBtn: React.CSSProperties = {
  background: 'transparent', border: 'none', cursor: 'pointer',
  color: 'hsl(var(--muted-foreground))', display: 'flex',
  alignItems: 'center', padding: '2px',
};
