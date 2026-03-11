// src/pages/frontend/hooks/usePinnedChunks.ts
// Extracted from useSlots.ts — pinned chunks management
import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "frontendWorkspacePinnedChunks";

export interface PinnedChunk {
  id: string;
  title: string;
  content: string;
  timestamp: number;
}

function loadPinned(): PinnedChunk[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function usePinnedChunks() {
  const [pinnedChunks, setPinnedChunks] = useState<PinnedChunk[]>(loadPinned);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(pinnedChunks)); } catch {}
  }, [pinnedChunks]);

  const pinChunk = useCallback((id: string, title: string, content: string) => {
    setPinnedChunks((prev) => {
      if (prev.some(c => c.id === id)) return prev;
      return [...prev, { id, title, content, timestamp: Date.now() }];
    });
  }, []);

  const unpinChunk = useCallback((id: string) => {
    setPinnedChunks((prev) => prev.filter(c => c.id !== id));
  }, []);

  const clearPinnedChunks = useCallback(() => setPinnedChunks([]), []);

  return { pinnedChunks, pinChunk, unpinChunk, clearPinnedChunks };
}
