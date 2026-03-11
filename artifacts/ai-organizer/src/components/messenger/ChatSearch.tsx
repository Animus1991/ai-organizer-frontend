/**
 * ChatSearch - In-chat search with navigation between results
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import type { Message } from './types';

interface ChatSearchProps {
  messages: Message[];
  onClose: () => void;
  onHighlight: (query: string) => void;
  onScrollToMessage: (messageId: string) => void;
}

export function ChatSearch({ messages, onClose, onHighlight, onScrollToMessage }: ChatSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Message[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      onHighlight('');
      return;
    }
    const q = query.toLowerCase();
    const found = messages.filter(m => !m.deleted && m.content.toLowerCase().includes(q));
    setResults(found);
    setCurrentIndex(found.length > 0 ? found.length - 1 : 0);
    onHighlight(query);
    if (found.length > 0) {
      onScrollToMessage(found[found.length - 1].id);
    }
  }, [query, messages]);

  const goUp = useCallback(() => {
    if (results.length === 0) return;
    const next = (currentIndex - 1 + results.length) % results.length;
    setCurrentIndex(next);
    onScrollToMessage(results[next].id);
  }, [currentIndex, results, onScrollToMessage]);

  const goDown = useCallback(() => {
    if (results.length === 0) return;
    const next = (currentIndex + 1) % results.length;
    setCurrentIndex(next);
    onScrollToMessage(results[next].id);
  }, [currentIndex, results, onScrollToMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.shiftKey ? goUp() : goDown(); }
    if (e.key === 'Escape') { onClose(); onHighlight(''); }
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '6px',
      padding: '5px 8px', borderBottom: '1px solid hsl(var(--border))',
      background: 'hsl(var(--card))', flexShrink: 0,
    }}>
      <Search size={13} style={{ color: 'hsl(var(--muted-foreground))', flexShrink: 0 }} />
      <input
        autoFocus
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Αναζήτηση στα μηνύματα..."
        style={{
          flex: 1, background: 'transparent', border: 'none', outline: 'none',
          color: 'hsl(var(--foreground))', fontSize: '12px',
        }}
      />
      {results.length > 0 && (
        <span style={{ fontSize: '10px', color: 'hsl(var(--muted-foreground))', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
          {currentIndex + 1}/{results.length}
        </span>
      )}
      {query && results.length === 0 && (
        <span style={{ fontSize: '10px', color: 'hsl(var(--destructive))', flexShrink: 0 }}>0</span>
      )}
      <button onClick={goUp} style={navBtn} title="Προηγούμενο"><ChevronUp size={14} /></button>
      <button onClick={goDown} style={navBtn} title="Επόμενο"><ChevronDown size={14} /></button>
      <button onClick={() => { onClose(); onHighlight(''); }} style={navBtn} title="Κλείσιμο"><X size={14} /></button>
    </div>
  );
}

const navBtn: React.CSSProperties = {
  background: 'transparent', border: 'none', cursor: 'pointer',
  color: 'hsl(var(--muted-foreground))', display: 'flex', alignItems: 'center',
  padding: '2px', borderRadius: '4px', flexShrink: 0,
};
