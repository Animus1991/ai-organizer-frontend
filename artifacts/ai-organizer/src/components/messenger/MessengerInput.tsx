/**
 * MessengerInput - Rich input with tag selector, attachments, emoji
 */
import React, { useState, useRef } from 'react';
import { Paperclip, Smile, Mic, Send, Image, FileText, Camera, Tag, Hash } from 'lucide-react';
import type { MessageTag } from './types';
import { MESSAGE_TAG_CONFIG } from './types';

interface MessengerInputProps {
  onSend: (content: string, tag?: MessageTag) => void;
  disabled?: boolean;
  blockchainEnabled?: boolean;
}

const EMOJI_QUICK = ['😀', '😂', '❤️', '👍', '🔥', '🎉', '😢', '🤔', '👏', '💯', '✨', '🙌'];

export function MessengerInput({ onSend, disabled, blockchainEnabled }: MessengerInputProps) {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [selectedTag, setSelectedTag] = useState<MessageTag | undefined>();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed, selectedTag);
    setText('');
    setSelectedTag(undefined);
    setShowEmoji(false);
    setShowTags(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const closeAll = () => { setShowEmoji(false); setShowAttach(false); setShowTags(false); };

  return (
    <div style={{ position: 'relative' }}>
      {/* Selected tag indicator */}
      {selectedTag && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '4px 12px', borderTop: '1px solid hsl(var(--border))',
          background: `hsl(${MESSAGE_TAG_CONFIG[selectedTag].color} / 0.08)`,
        }}>
          <span style={{ fontSize: '12px' }}>{MESSAGE_TAG_CONFIG[selectedTag].icon}</span>
          <span style={{ fontSize: '11px', fontWeight: 600, color: `hsl(${MESSAGE_TAG_CONFIG[selectedTag].color})` }}>
            {MESSAGE_TAG_CONFIG[selectedTag].label}
          </span>
          <button
            onClick={() => setSelectedTag(undefined)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))', fontSize: '12px', marginLeft: 'auto', padding: '0 2px' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Tag picker */}
      {showTags && (
        <div style={{
          position: 'absolute', bottom: '100%', left: '8px',
          background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
          borderRadius: '12px', padding: '6px', marginBottom: '4px',
          boxShadow: '0 4px 16px hsl(var(--foreground) / 0.1)',
          display: 'flex', flexDirection: 'column', gap: '1px', zIndex: 20,
          minWidth: '170px',
        }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(var(--muted-foreground))', padding: '4px 8px', textTransform: 'uppercase' }}>
            Ετικέτα μηνύματος
          </div>
          {(Object.entries(MESSAGE_TAG_CONFIG) as [MessageTag, typeof MESSAGE_TAG_CONFIG[MessageTag]][]).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => { setSelectedTag(key); setShowTags(false); inputRef.current?.focus(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '7px 10px', background: selectedTag === key ? `hsl(${cfg.color} / 0.12)` : 'transparent',
                border: 'none', borderRadius: '6px', cursor: 'pointer',
                color: 'hsl(var(--foreground))', fontSize: '12.5px',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = `hsl(${cfg.color} / 0.12)`; }}
              onMouseLeave={e => { if (selectedTag !== key) e.currentTarget.style.background = 'transparent'; }}
            >
              <span>{cfg.icon}</span>
              <span style={{ fontWeight: 500 }}>{cfg.label}</span>
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: `hsl(${cfg.color})`, marginLeft: 'auto',
              }} />
            </button>
          ))}
        </div>
      )}

      {/* Emoji picker */}
      {showEmoji && (
        <div style={{
          position: 'absolute', bottom: '100%', left: '40px',
          background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
          borderRadius: '12px', padding: '8px', marginBottom: '4px',
          boxShadow: '0 4px 16px hsl(var(--foreground) / 0.1)',
          display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '2px', zIndex: 20,
        }}>
          {EMOJI_QUICK.map(emoji => (
            <button
              key={emoji}
              onClick={() => { setText(prev => prev + emoji); setShowEmoji(false); inputRef.current?.focus(); }}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '20px', padding: '4px', borderRadius: '6px' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'hsl(var(--muted) / 0.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Attachment menu */}
      {showAttach && (
        <div style={{
          position: 'absolute', bottom: '100%', right: '8px',
          background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
          borderRadius: '12px', padding: '6px', marginBottom: '4px',
          boxShadow: '0 4px 16px hsl(var(--foreground) / 0.1)',
          display: 'flex', flexDirection: 'column', gap: '1px', zIndex: 20,
          minWidth: '180px',
        }}>
          {[
            { icon: Image, label: 'Φωτογραφία', color: 'hsl(142 71% 45%)' },
            { icon: Camera, label: 'Κάμερα', color: 'hsl(200 80% 50%)' },
            { icon: FileText, label: 'Paper / Αρχείο', color: 'hsl(38 92% 50%)' },
            { icon: Hash, label: 'Dataset', color: 'hsl(280 70% 55%)' },
            { icon: Mic, label: 'Ηχητικό μήνυμα', color: 'hsl(0 84% 60%)' },
          ].map(item => (
            <button
              key={item.label}
              onClick={() => { setShowAttach(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '7px 12px', background: 'transparent',
                border: 'none', borderRadius: '6px', cursor: 'pointer',
                color: 'hsl(var(--foreground))', fontSize: '12.5px',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'hsl(var(--muted) / 0.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <item.icon size={15} style={{ color: item.color }} />
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: '4px',
        padding: '6px 8px', borderTop: '1px solid hsl(var(--border))',
        background: 'hsl(var(--card))',
      }}>
        <button onClick={() => { closeAll(); setShowTags(!showTags); }} style={{ ...actionBtn, color: selectedTag ? `hsl(${MESSAGE_TAG_CONFIG[selectedTag].color})` : undefined }} title="Ετικέτα">
          <Tag size={17} />
        </button>
        <button onClick={() => { closeAll(); setShowEmoji(!showEmoji); }} style={actionBtn} title="Emoji">
          <Smile size={17} />
        </button>
        <textarea
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Γράψε μήνυμα..."
          disabled={disabled}
          rows={1}
          style={{
            flex: 1, resize: 'none', border: 'none', outline: 'none',
            background: 'hsl(var(--muted) / 0.4)', borderRadius: '16px',
            padding: '7px 12px', fontSize: '13px', lineHeight: '1.4',
            color: 'hsl(var(--foreground))', maxHeight: '80px', fontFamily: 'inherit',
          }}
        />
        <button onClick={() => { closeAll(); setShowAttach(!showAttach); }} style={actionBtn} title="Επισύναψη">
          <Paperclip size={17} />
        </button>
        {text.trim() ? (
          <button onClick={handleSend} style={{ ...actionBtn, color: 'hsl(var(--primary))' }} title="Αποστολή">
            <Send size={17} />
          </button>
        ) : (
          <button style={actionBtn} title="Ηχητικό μήνυμα">
            <Mic size={17} />
          </button>
        )}
      </div>

      {/* Blockchain indicator */}
      {blockchainEnabled && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
          padding: '2px 0', background: 'hsl(142 71% 45% / 0.06)',
          borderTop: '1px solid hsl(142 71% 45% / 0.15)',
        }}>
          <div style={{
            width: '5px', height: '5px', borderRadius: '50%',
            background: 'hsl(142 71% 45%)', animation: 'pulse 2s infinite',
          }} />
          <span style={{ fontSize: '9.5px', color: 'hsl(142 71% 45% / 0.7)', fontWeight: 500 }}>
            Blockchain recording
          </span>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

const actionBtn: React.CSSProperties = {
  background: 'transparent', border: 'none', cursor: 'pointer',
  color: 'hsl(var(--muted-foreground))', display: 'flex', alignItems: 'center',
  padding: '5px', borderRadius: '50%', flexShrink: 0, transition: 'color 0.15s',
};
