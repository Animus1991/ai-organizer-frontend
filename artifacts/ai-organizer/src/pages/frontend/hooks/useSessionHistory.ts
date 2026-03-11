// src/pages/frontend/hooks/useSessionHistory.ts
// Extracted from useSlots.ts — session history tracking
import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "frontendWorkspaceSessionHistory";

export interface HistoryItem {
  id: string;
  title: string;
  type: 'search' | 'segment' | 'document';
  timestamp: number;
  content?: string;
  docId?: number;
}

function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function useSessionHistory() {
  const [sessionHistory, setSessionHistory] = useState<HistoryItem[]>(loadHistory);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionHistory)); } catch {}
  }, [sessionHistory]);

  const addToHistory = useCallback((item: Omit<HistoryItem, 'timestamp'>) => {
    setSessionHistory((prev) => {
      const filtered = prev.filter(h => h.id !== item.id);
      return [...filtered, { ...item, timestamp: Date.now() }].slice(-50);
    });
  }, []);

  const clearHistory = useCallback(() => setSessionHistory([]), []);

  return { sessionHistory, addToHistory, clearHistory };
}
