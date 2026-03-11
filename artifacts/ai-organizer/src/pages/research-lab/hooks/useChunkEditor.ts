/**
 * useChunkEditor - Chunk tab management, auto-save, resize, diff
 */

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import type { ChunkTab } from "../types";
import type { SegmentRow } from "../../../hooks/home/useHomeState";
import { plainTextToHtml } from "../../../editor/utils/text";

const DEFAULT_EDITOR_HEIGHT = 320;
const MIN_EDITOR_HEIGHT = 160;
const COLLAPSED_DOCK_HEIGHT = 44;

export function useChunkEditor() {
  const [chunkTabs, setChunkTabs] = useState<ChunkTab[]>([]);
  const [activeChunkTabKey, setActiveChunkTabKey] = useState<string | null>(null);
  const [editorHeight, setEditorHeight] = useState<number>(0);
  const [editorCollapsed, setEditorCollapsed] = useState(false);
  const [showDiffView, setShowDiffView] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"saving" | "saved" | null>(null);

  const lastExpandedHeightRef = useRef<number>(DEFAULT_EDITOR_HEIGHT);
  const resizingRef = useRef(false);
  const resizeStartRef = useRef<{ y: number; h: number }>({ y: 0, h: DEFAULT_EDITOR_HEIGHT });
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track last expanded height
  useEffect(() => {
    if (!editorCollapsed && editorHeight > 0) {
      lastExpandedHeightRef.current = editorHeight;
    }
  }, [editorCollapsed, editorHeight]);

  const activeChunkTab = useMemo(() => {
    if (!activeChunkTabKey) return null;
    return chunkTabs.find(t => t.key === activeChunkTabKey) ?? null;
  }, [activeChunkTabKey, chunkTabs]);

  const activeTabWordCount = useMemo(() => {
    if (!activeChunkTab) return 0;
    const text = activeChunkTab.html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").trim();
    return text ? text.split(/\s+/).filter(Boolean).length : 0;
  }, [activeChunkTab?.html]);

  const openSegmentInTab = useCallback((seg: SegmentRow) => {
    setChunkTabs(prev => {
      const existing = prev.find(t => t.segmentId === seg.id);
      if (existing) {
        setActiveChunkTabKey(existing.key);
        return prev;
      }
      const key = `seg-${seg.id}`;
      const stored = localStorage.getItem(`researchLabChunkEditor:${seg.id}`);
      const html = stored ?? plainTextToHtml(seg.content || "");
      const next: ChunkTab = { key, segmentId: seg.id, title: seg.title || `Segment ${seg.id}`, html, lastSavedHtml: stored ?? undefined };
      setActiveChunkTabKey(key);
      return [...prev, next];
    });
    setEditorCollapsed(false);
    setEditorHeight(h => (h > 0 ? h : DEFAULT_EDITOR_HEIGHT));
  }, []);

  const openSegmentsInTabs = useCallback((segs: SegmentRow[]) => {
    for (const s of segs) openSegmentInTab(s);
  }, [openSegmentInTab]);

  const closeChunkTab = useCallback((key: string) => {
    setChunkTabs(prev => {
      const idx = prev.findIndex(t => t.key === key);
      if (idx === -1) return prev;
      const next = prev.filter(t => t.key !== key);
      setActiveChunkTabKey(current => {
        if (current !== key) return current;
        const fallback = next[idx - 1] ?? next[idx] ?? next[0] ?? null;
        return fallback?.key ?? null;
      });
      if (next.length === 0) setEditorHeight(0);
      return next;
    });
  }, []);

  const setActiveTabHtml = useCallback((key: string, html: string) => {
    setChunkTabs(prev => prev.map(t => (t.key === key ? { ...t, html } : t)));
  }, []);

  const saveActiveTabLocal = useCallback(() => {
    if (!activeChunkTab) return;
    localStorage.setItem(`researchLabChunkEditor:${activeChunkTab.segmentId}`, activeChunkTab.html);
    setChunkTabs(prev => prev.map(t => t.key === activeChunkTab.key ? { ...t, lastSavedHtml: activeChunkTab.html } : t));
  }, [activeChunkTab]);

  const loadActiveTabLocal = useCallback(() => {
    if (!activeChunkTab) return;
    const stored = localStorage.getItem(`researchLabChunkEditor:${activeChunkTab.segmentId}`);
    if (!stored) return;
    setChunkTabs(prev => prev.map(t => (t.key === activeChunkTab.key ? { ...t, html: stored, lastSavedHtml: stored } : t)));
  }, [activeChunkTab]);

  const saveAllTabs = useCallback(() => {
    setChunkTabs(prev => prev.map(t => {
      localStorage.setItem(`researchLabChunkEditor:${t.segmentId}`, t.html);
      return { ...t, lastSavedHtml: t.html };
    }));
    setAutoSaveStatus("saved");
    setTimeout(() => setAutoSaveStatus(null), 2000);
  }, []);

  // Auto-save debounce
  useEffect(() => {
    if (!activeChunkTab) return;
    const isDirty = activeChunkTab.lastSavedHtml !== undefined && activeChunkTab.html !== activeChunkTab.lastSavedHtml;
    if (!isDirty) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    setAutoSaveStatus("saving");
    autoSaveTimerRef.current = setTimeout(() => {
      saveActiveTabLocal();
      setAutoSaveStatus("saved");
      setTimeout(() => setAutoSaveStatus(null), 2000);
    }, 3000);
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  }, [activeChunkTab?.html, activeChunkTab?.lastSavedHtml, activeChunkTab?.key, saveActiveTabLocal]);

  // Resize handlers
  const beginResize = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const startH = editorHeight || lastExpandedHeightRef.current || DEFAULT_EDITOR_HEIGHT;
    if (editorCollapsed) {
      setEditorCollapsed(false);
      setEditorHeight(startH);
    }
    resizingRef.current = true;
    resizeStartRef.current = { y: e.clientY, h: startH };
    document.body.style.cursor = "row-resize";
    e.preventDefault();
  }, [editorHeight, editorCollapsed]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!resizingRef.current) return;
      const delta = resizeStartRef.current.y - e.clientY;
      const nextH = resizeStartRef.current.h + delta;
      const maxH = Math.max(MIN_EDITOR_HEIGHT, Math.round(window.innerHeight * 0.75));
      setEditorHeight(Math.max(MIN_EDITOR_HEIGHT, Math.min(nextH, maxH)));
    };
    const onUp = () => {
      if (!resizingRef.current) return;
      resizingRef.current = false;
      document.body.style.cursor = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, []);

  const toggleEditorCollapse = useCallback(() => {
    if (!editorCollapsed) {
      lastExpandedHeightRef.current = editorHeight || DEFAULT_EDITOR_HEIGHT;
      setEditorCollapsed(true);
    } else {
      setEditorCollapsed(false);
      setEditorHeight(h => (h > 0 ? h : lastExpandedHeightRef.current || DEFAULT_EDITOR_HEIGHT));
    }
  }, [editorCollapsed, editorHeight]);

  return {
    chunkTabs,
    activeChunkTabKey,
    setActiveChunkTabKey,
    activeChunkTab,
    activeTabWordCount,
    editorHeight,
    editorCollapsed,
    showDiffView,
    setShowDiffView,
    autoSaveStatus,
    openSegmentInTab,
    openSegmentsInTabs,
    closeChunkTab,
    setActiveTabHtml,
    saveActiveTabLocal,
    loadActiveTabLocal,
    saveAllTabs,
    beginResize,
    toggleEditorCollapse,
    DEFAULT_EDITOR_HEIGHT,
    MIN_EDITOR_HEIGHT,
    COLLAPSED_DOCK_HEIGHT,
  };
}
