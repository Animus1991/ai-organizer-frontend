import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getDocument } from "../../../lib/api";
import type { FloatingPad, FloatingPadPatch, Slot } from "../types";
import { extractTitleFromText, stripIdsFromText } from "../utils/text";

const DEFAULT_SLOTS = 9;
const STICKY_SLOT = "slot5";
const STORAGE_KEYS = {
  slots: "frontendWorkspaceSlots",
  pads: "frontendWorkspaceFloatingPads",
  sticky: "frontendWorkspaceStickyEnabled",
  total: "frontendWorkspaceTotalSlots",
  locked: "frontendWorkspaceLockedSlots",
  lockPasswords: "frontendWorkspaceLockPasswords",
  pinned: "frontendWorkspacePinnedChunks",
  history: "frontendWorkspaceSessionHistory",
};

const createEmptySlot = (index: number): Slot => ({
  slotId: `slot${index + 1}`,
  kind: "empty",
  title: "(empty)",
});

const normalizeSlots = (input: Slot[], total: number): Slot[] => {
  const next = [...input];
  for (let i = 0; i < total; i += 1) {
    if (!next[i]) {
      next[i] = createEmptySlot(i);
    } else if (!next[i].slotId) {
      next[i] = { ...next[i], slotId: `slot${i + 1}` } as Slot;
    }
  }
  return next.slice(0, total);
};

const makeId = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));

const loadJson = <T,>(key: string, fallback: T) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const loadTotalSlots = () => {
  const parsed = loadJson<number | null>(STORAGE_KEYS.total, null);
  return Number.isFinite(parsed) && parsed ? parsed : DEFAULT_SLOTS;
};

const serializeSlots = (input: Slot[]) =>
  input.map((slot) => {
    if (slot.kind === "empty") {
      return { slotId: slot.slotId, kind: slot.kind, title: slot.title };
    }
    if (slot.kind === "doc") {
      return { slotId: slot.slotId, kind: slot.kind, title: slot.title, docId: slot.docId, text: slot.text };
    }
    return { slotId: slot.slotId, kind: slot.kind, title: slot.title, text: slot.text, wrap: slot.wrap };
  });

const loadSlots = (totalSlots: number) => {
  const parsed = loadJson<Slot[]>(STORAGE_KEYS.slots, []);
  return normalizeSlots(parsed, totalSlots);
};

const loadPads = () => loadJson<FloatingPad[]>(STORAGE_KEYS.pads, []);
const loadLocked = () => new Set(loadJson<string[]>(STORAGE_KEYS.locked, []));
const loadLockPasswords = () => loadJson<Record<string, string>>(STORAGE_KEYS.lockPasswords, {});
const loadPinned = () => loadJson<{ id: string; title: string; content: string; timestamp: number }[]>(STORAGE_KEYS.pinned, []);
const loadHistory = () => loadJson<{ id: string; title: string; type: 'search' | 'segment' | 'document'; timestamp: number; content?: string; docId?: number }[]>(STORAGE_KEYS.history, []);

export function useSlots() {
  const initialTotalSlots = loadTotalSlots();
  const [slots, setSlots] = useState<Slot[]>(() => loadSlots(initialTotalSlots));
  const [totalSlots, setTotalSlots] = useState(initialTotalSlots);
  const [floatingPads, setFloatingPads] = useState<FloatingPad[]>(() => loadPads());
  const [stickyEnabled, setStickyEnabled] = useState(loadJson<boolean>(STORAGE_KEYS.sticky, false));
  const [lockedSlots, setLockedSlots] = useState<Set<string>>(() => loadLocked());
  const [lockPasswords, setLockPasswords] = useState<Record<string, string>>(() => loadLockPasswords());
  const [pinnedChunks, setPinnedChunks] = useState<{ id: string; title: string; content: string; timestamp: number }[]>(() => loadPinned());
  const [sessionHistory, setSessionHistory] = useState<{ id: string; title: string; type: 'search' | 'segment' | 'document'; timestamp: number; content?: string; docId?: number }[]>(() => loadHistory());
  const [draggingItem, setDraggingItem] = useState<{
    type: "slot" | "floating";
    id: string;
    slotId?: string;
    floatingId?: string;
  } | null>(null);
  const rr = useRef(0);
  const zCounter = useRef(1000);
  const history = useRef<Slot[][]>([]);

  const normalizedSlots = useMemo(() => normalizeSlots(slots, totalSlots), [slots, totalSlots]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.slots, JSON.stringify(serializeSlots(normalizedSlots)));
      localStorage.setItem(STORAGE_KEYS.total, JSON.stringify(totalSlots));
    } catch {
      // ignore
    }
  }, [normalizedSlots, totalSlots]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.pads, JSON.stringify(floatingPads));
    } catch {
      // ignore
    }
  }, [floatingPads]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.sticky, JSON.stringify(stickyEnabled));
    } catch {
      // ignore
    }
  }, [stickyEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.locked, JSON.stringify(Array.from(lockedSlots)));
      localStorage.setItem(STORAGE_KEYS.lockPasswords, JSON.stringify(lockPasswords));
    } catch {
      // ignore
    }
  }, [lockedSlots, lockPasswords]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.pinned, JSON.stringify(pinnedChunks));
    } catch {
      // ignore
    }
  }, [pinnedChunks]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(sessionHistory));
    } catch {
      // ignore
    }
  }, [sessionHistory]);

  const pushHistory = useCallback((snapshot: Slot[]) => {
    history.current = [...history.current, snapshot.slice(0, totalSlots)];
    if (history.current.length > 20) {
      history.current = history.current.slice(-20);
    }
  }, [totalSlots]);

  const undoLast = useCallback(() => {
    const last = history.current[history.current.length - 1];
    if (!last) return;
    history.current = history.current.slice(0, -1);
    setSlots(normalizeSlots(last, totalSlots));
  }, [totalSlots]);

  const setNotepadText = useCallback((slotId: string, text: string) => {
    setSlots((prev) =>
      normalizeSlots(
        prev.map((slot) => (slot.slotId === slotId && slot.kind === "notepad" ? { ...slot, text } : slot)),
        totalSlots
      )
    );
  }, [totalSlots]);

  const toggleWrap = useCallback((slotId: string) => {
    setSlots((prev) =>
      normalizeSlots(
        prev.map((slot) =>
          slot.slotId === slotId && slot.kind === "notepad" ? { ...slot, wrap: !slot.wrap } : slot
        ),
        totalSlots
      )
    );
  }, [totalSlots]);

  const insertTime = useCallback((slotId: string) => {
    const now = new Date().toISOString();
    setSlots((prev) =>
      normalizeSlots(
        prev.map((slot) =>
          slot.slotId === slotId && slot.kind === "notepad"
            ? { ...slot, text: `${slot.text}${slot.text ? "\n" : ""}${now}` }
            : slot
        ),
        totalSlots
      )
    );
  }, [totalSlots]);

  const downloadNotepad = useCallback((slotId: string) => {
    setSlots((currentSlots) => {
      const slot = currentSlots.find((s) => s.slotId === slotId);
      if (!slot || slot.kind !== "notepad") return currentSlots;
      const blob = new Blob([slot.text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${slot.title || "notepad"}.txt`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      return currentSlots;
    });
  }, []);

  const clearNotepad = useCallback((slotId: string) => {
    setSlots((prev) =>
      normalizeSlots(
        prev.map((slot) =>
          slot.slotId === slotId && slot.kind === "notepad" ? { ...slot, text: "" } : slot
        ),
        totalSlots
      )
    );
  }, [totalSlots]);

  const closeSlot = useCallback((slotId: string) => {
    setSlots((prev) => {
      pushHistory(prev);
      return normalizeSlots(
        prev.map((slot, idx) => (slot.slotId === slotId ? createEmptySlot(idx) : slot)),
        totalSlots
      );
    });
  }, [pushHistory, totalSlots]);

  const placeDocIntoSlot = useCallback(async (slotId: string, docId: number) => {
    if (lockedSlots.has(slotId)) return;
    const doc = await getDocument(docId);
    const title = stripIdsFromText(doc.title || extractTitleFromText(doc.text || "")) || "Untitled";
    const text = stripIdsFromText(doc.text || "");
    setSlots((prev) => {
      pushHistory(prev);
      return normalizeSlots(
        prev.map((slot) =>
          slot.slotId === slotId ? { slotId, kind: "doc", title, docId, text } : slot
        ),
        totalSlots
      );
    });
  }, [lockedSlots, pushHistory, totalSlots]);

  const placeTextIntoSlot = useCallback((slotId: string, title: string, text: string) => {
    if (lockedSlots.has(slotId)) return;
    setSlots((prev) => {
      pushHistory(prev);
      return normalizeSlots(
        prev.map((slot) =>
          slot.slotId === slotId ? { slotId, kind: "doc", title, docId: 0, text } : slot
        ),
        totalSlots
      );
    });
  }, [lockedSlots, pushHistory, totalSlots]);

  const onClickSlot = useCallback((slotId: string) => {
    if (lockedSlots.has(slotId)) return;
    setSlots((prev) => {
      pushHistory(prev);
      return normalizeSlots(
        prev.map((slot) => {
          if (slot.slotId !== slotId) return slot;
          if (slot.kind !== "empty") return slot;
          return {
            slotId,
            kind: "notepad",
            title: "Notepad",
            text: "",
            wrap: true,
          };
        }),
        totalSlots
      );
    });
  }, [lockedSlots, pushHistory, totalSlots]);

  const openNotepadFromDoc = useCallback((title: string, text: string) => {
    setSlots((prev) => {
      pushHistory(prev);
      const next = normalizeSlots(prev, totalSlots);
      const targetIndex = next.findIndex((slot) => slot.kind === "empty" && !lockedSlots.has(slot.slotId));
      const index = targetIndex === -1 ? 0 : targetIndex;
      if (lockedSlots.has(next[index].slotId)) return next;
      next[index] = {
        slotId: next[index].slotId,
        kind: "notepad",
        title,
        text,
        wrap: true,
      };
      return next;
    });
  }, [lockedSlots, pushHistory, totalSlots]);

  const newFloatingNotepad = useCallback((prefillTitle?: string, prefillText?: string, position?: { x: number; y: number }, sourceSlotId?: string) => {
    const id = makeId();
    zCounter.current += 1;
    setFloatingPads((prev) => [
      ...prev,
      {
        id,
        title: prefillTitle || "Notepad",
        text: prefillText || "",
        wrap: true,
        x: position?.x ?? 280,
        y: position?.y ?? 140,
        w: 560,
        h: 840,
        z: zCounter.current,
        sticky: false,
        sourceSlotId,
      },
    ]);
    return id;
  }, []);

  const floatSlotToNotepad = useCallback((slotId: string) => {
    const slot = normalizedSlots.find((s) => s.slotId === slotId);
    if (!slot || slot.kind === "empty") return;
    if (lockedSlots.has(slotId)) return;
    // Create floating pad with sourceSlotId connection
    newFloatingNotepad(slot.title, slot.text, undefined, slotId);
    setSlots((prev) => {
      pushHistory(prev);
      return normalizeSlots(
        prev.map((s, idx) => (s.slotId === slotId ? createEmptySlot(idx) : s)),
        totalSlots
      );
    });
  }, [lockedSlots, newFloatingNotepad, normalizedSlots, pushHistory, totalSlots]);

  const smartOpen = useCallback(async (docId: number) => {
    const candidates = normalizedSlots.filter((slot) => {
      if (lockedSlots.has(slot.slotId)) return false;
      if (!stickyEnabled) return true;
      return !(slot.slotId === STICKY_SLOT && slot.kind === "notepad");
    });
    const empty = candidates.filter((slot) => slot.kind === "empty");
    const pool = empty.length ? empty : candidates;
    const idx = pool.length ? rr.current % pool.length : 0;
    rr.current += 1;
    const target = pool[idx] || normalizedSlots[0];
    if (target) {
      await placeDocIntoSlot(target.slotId, docId);
    }
  }, [lockedSlots, normalizedSlots, placeDocIntoSlot, stickyEnabled]);

  const smartOpenText = useCallback((title: string, text: string) => {
    const candidates = normalizedSlots.filter((slot) => {
      if (lockedSlots.has(slot.slotId)) return false;
      if (!stickyEnabled) return true;
      return !(slot.slotId === STICKY_SLOT && slot.kind === "notepad");
    });
    const empty = candidates.filter((slot) => slot.kind === "empty");
    const pool = empty.length ? empty : candidates;
    const idx = pool.length ? rr.current % pool.length : 0;
    rr.current += 1;
    const target = pool[idx] || normalizedSlots[0];
    if (target) {
      placeTextIntoSlot(target.slotId, title, text);
    }
  }, [lockedSlots, normalizedSlots, placeTextIntoSlot, stickyEnabled]);

  const downloadFloatingPad = useCallback((id: string) => {
    const pad = floatingPads.find((p) => p.id === id);
    if (!pad) return;
    const blob = new Blob([pad.text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${pad.title || "notepad"}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, [floatingPads]);

  const dockFloatingToSlot = useCallback((floatingId: string, slotId?: string) => {
    const pad = floatingPads.find((p) => p.id === floatingId);
    if (!pad) return;
    setSlots((prev) => {
      pushHistory(prev);
      const next = normalizeSlots(prev, totalSlots);
      const targetIndex = slotId
        ? next.findIndex((slot) => slot.slotId === slotId)
        : next.findIndex((slot) => slot.kind === "empty");
      const index = targetIndex === -1 ? 0 : targetIndex;
      if (lockedSlots.has(next[index].slotId)) {
        return next;
      }
      next[index] = {
        slotId: next[index].slotId,
        kind: "notepad",
        title: pad.title || "Notepad",
        text: pad.text,
        wrap: pad.wrap,
      };
      return next;
    });
    setFloatingPads((prev) => prev.filter((p) => p.id !== floatingId));
  }, [floatingPads, lockedSlots, pushHistory, totalSlots]);

  const closeFloatingPad = useCallback((id: string) => {
    // First, find pad before any state changes
    setFloatingPads((prev) => {
      const pad = prev.find((p) => p.id === id);
      const next = prev.filter((p) => p.id !== id);
      
      // If this floating pad has a source slot, restore content immediately
      if (pad?.sourceSlotId) {
        // Schedule slot restoration after the floating pad removal
        Promise.resolve().then(() => {
          setSlots((slotsPrev) => {
            return normalizeSlots(
              slotsPrev.map((slot) => 
                slot.slotId === pad.sourceSlotId 
                  ? { 
                      slotId: slot.slotId, 
                      kind: "notepad", 
                      title: pad.title || "Notepad",
                      text: pad.text || "",
                      wrap: pad.wrap
                    }
                  : slot
              ),
              totalSlots
            );
          });
        });
      }
      
      return next;
    });
  }, [totalSlots]);

  const updateFloatingPad = useCallback((id: string, patch: FloatingPadPatch) => {
    setFloatingPads((prev) =>
      prev.map((pad) => {
        if (pad.id !== id) return pad;
        const next = { ...pad, ...patch };
        
        // When sticky is turned ON, try to dock to empty slot
        if (patch.sticky === true && !pad.sticky) {
          const emptySlot = normalizedSlots.find(slot => 
            slot.kind === "empty" && !lockedSlots.has(slot.slotId)
          );
          
          if (emptySlot) {
            // Auto-dock to empty slot
            Promise.resolve().then(() => {
              dockFloatingToSlot(id, emptySlot.slotId);
            });
            return next;
          }
          // If no empty slot, keep floating but bring to front
          zCounter.current += 1;
          next.z = zCounter.current;
        }
        
        // When sticky is turned OFF, allow normal behavior
        if (patch.sticky === false && pad.sticky) {
          // Just turn off sticky, keep floating
        }
        
        return next;
      })
    );
  }, [normalizedSlots, lockedSlots, dockFloatingToSlot]);

  const bringToFront = useCallback((id: string) => {
    zCounter.current += 1;
    setFloatingPads((prev) =>
      prev.map((pad) => (pad.id === id ? { ...pad, z: zCounter.current } : pad))
    );
  }, []);

  const toggleStickyNotepad = useCallback(() => {
    setStickyEnabled((prev) => !prev);
  }, []);

  const pinChunk = useCallback((id: string, title: string, content: string) => {
    setPinnedChunks((prev) => {
      // Check if already pinned
      if (prev.some(chunk => chunk.id === id)) return prev;
      // Add new pinned chunk
      return [...prev, { id, title, content, timestamp: Date.now() }];
    });
  }, []);

  const unpinChunk = useCallback((id: string) => {
    setPinnedChunks((prev) => prev.filter(chunk => chunk.id !== id));
  }, []);

  const clearPinnedChunks = useCallback(() => {
    setPinnedChunks([]);
  }, []);

  const addToHistory = useCallback((item: { id: string; title: string; type: 'search' | 'segment' | 'document'; content?: string; docId?: number }) => {
    setSessionHistory((prev) => {
      // Remove existing item with same id and add new one
      const filtered = prev.filter(h => h.id !== item.id);
      return [...filtered, { ...item, timestamp: Date.now() }].slice(-50); // Keep last 50 items
    });
  }, []);

  const clearHistory = useCallback(() => {
    setSessionHistory([]);
  }, []);

  const onDragStart = useCallback((type: "slot" | "floating", id: string, slotId?: string, floatingId?: string) => {
    setDraggingItem({ type, id, slotId, floatingId });
  }, []);

  const onDragEnd = useCallback(() => {
    setDraggingItem(null);
  }, []);

  const onDropToSlot = useCallback(async (targetSlotId: string) => {
    if (!draggingItem) return;
    if (draggingItem.type === "slot" && draggingItem.slotId) {
      if (lockedSlots.has(draggingItem.slotId) || lockedSlots.has(targetSlotId)) {
        onDragEnd();
        return;
      }
      setSlots((prev) => {
        pushHistory(prev);
        const next = normalizeSlots(prev, totalSlots);
        const sourceIndex = next.findIndex((slot) => slot.slotId === draggingItem.slotId);
        const targetIndex = next.findIndex((slot) => slot.slotId === targetSlotId);
        if (sourceIndex === -1 || targetIndex === -1) return next;
        const temp = next[sourceIndex];
        next[sourceIndex] = next[targetIndex];
        next[targetIndex] = temp;
        return next;
      });
    }
    onDragEnd();
  }, [draggingItem, lockedSlots, onDragEnd, pushHistory, totalSlots]);

  const onDropToFloating = useCallback((x: number, y: number) => {
    if (!draggingItem || draggingItem.type !== "slot" || !draggingItem.slotId) return;
    const slot = normalizedSlots.find((s) => s.slotId === draggingItem.slotId);
    if (!slot || slot.kind === "empty") return;
    if (lockedSlots.has(draggingItem.slotId)) return;
    newFloatingNotepad(slot.title, slot.text, { x, y });
    setSlots((prev) => {
      pushHistory(prev);
      return normalizeSlots(
        prev.map((s, idx) => (s.slotId === draggingItem.slotId ? createEmptySlot(idx) : s)),
        totalSlots
      );
    });
    onDragEnd();
  }, [draggingItem, lockedSlots, newFloatingNotepad, normalizedSlots, onDragEnd, pushHistory, totalSlots]);

  const slotsWithHandlers = useMemo(
    () =>
      normalizedSlots.map((slot) => {
        const withLock = { ...slot, locked: lockedSlots.has(slot.slotId) };
        if (slot.kind !== "notepad") return withLock;
        return {
          ...withLock,
          onToggleWrap: () => toggleWrap(slot.slotId),
          onInsertTime: () => insertTime(slot.slotId),
          onDownload: () => downloadNotepad(slot.slotId),
          onClear: () => clearNotepad(slot.slotId),
          onFloat: () => floatSlotToNotepad(slot.slotId),
        };
      }),
    [clearNotepad, downloadNotepad, floatSlotToNotepad, insertTime, lockedSlots, normalizedSlots, toggleWrap]
  );

  const renameSlot = useCallback((slotId: string, newTitle: string) => {
    setSlots((prev) =>
      normalizeSlots(
        prev.map((slot) =>
          slot.slotId === slotId && slot.kind !== "empty"
            ? { ...slot, title: newTitle }
            : slot
        ),
        totalSlots
      )
    );
  }, [totalSlots]);

  const addSlot = useCallback(() => {
    const newTotal = totalSlots + 1;
    setTotalSlots(newTotal);
    setSlots((prev) => normalizeSlots(prev, newTotal));
  }, [totalSlots]);

  const toggleSlotLock = useCallback((slotId: string, password?: string) => {
  // Find the slot to check if it's empty
  const slot = normalizedSlots.find(s => s.slotId === slotId);
  if (slot?.kind === "empty") {
    throw new Error("Cannot lock empty slots");
  }
  
  // If slot is currently locked, check password if provided
  if (lockedSlots.has(slotId)) {
    const storedPassword = lockPasswords[slotId];
    if (storedPassword && storedPassword !== password) {
      throw new Error("Incorrect password");
    }
    // Unlock
    setLockedSlots((prev) => {
      const next = new Set(prev);
      next.delete(slotId);
      return next;
    });
    setLockPasswords((prev) => {
      const next = { ...prev };
      delete next[slotId];
      return next;
    });
  } else {
    // Lock with optional password
    setLockedSlots((prev) => new Set(prev).add(slotId));
    if (password) {
      setLockPasswords((prev) => ({ ...prev, [slotId]: password }));
    }
  }
}, [lockedSlots, lockPasswords, normalizedSlots]);

  // Named snapshots — save/load/delete workspace state
  const SNAPSHOTS_KEY = "frontendWorkspaceNamedSnapshots";
  const [namedSnapshots, setNamedSnapshots] = useState<{ name: string; slots: Slot[]; timestamp: number }[]>(() =>
    loadJson<{ name: string; slots: Slot[]; timestamp: number }[]>(SNAPSHOTS_KEY, [])
  );

  const saveNamedSnapshot = useCallback((name: string) => {
    setNamedSnapshots(prev => {
      const updated = [{ name, slots: serializeSlots(normalizedSlots) as Slot[], timestamp: Date.now() }, ...prev.filter(s => s.name !== name)].slice(0, 20);
      try { localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
      return updated;
    });
  }, [normalizedSlots]);

  const loadNamedSnapshot = useCallback((name: string) => {
    const snap = namedSnapshots.find(s => s.name === name);
    if (!snap) return;
    pushHistory(normalizedSlots);
    setSlots(normalizeSlots(snap.slots, totalSlots));
  }, [namedSnapshots, normalizedSlots, pushHistory, totalSlots]);

  const deleteNamedSnapshot = useCallback((name: string) => {
    setNamedSnapshots(prev => {
      const updated = prev.filter(s => s.name !== name);
      try { localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
      return updated;
    });
  }, []);

  return {
    slots: slotsWithHandlers,
    setNotepadText,
    onNotepadChange: setNotepadText,
    closeSlot,
    onClickSlot,
    placeDocIntoSlot,
    placeTextIntoSlot,
    smartOpen,
    smartOpenText,
    openNotepadFromDoc,
    toggleSlotLock,
    lockedSlots,
    undoLast,
    canUndo: history.current.length > 0,
    setTotalSlots,
    totalSlots,
    renameSlot,
    addSlot,
    floatingPads,
    newFloatingNotepad,
    closeFloatingPad,
    updateFloatingPad,
    bringToFront,
    downloadFloatingPad,
    dockFloatingToSlot,
    stickyEnabled,
    toggleStickyNotepad,
    pinnedChunks,
    pinChunk,
    unpinChunk,
    clearPinnedChunks,
    sessionHistory,
    addToHistory,
    clearHistory,
    draggingItem,
    onDragStart,
    onDragEnd,
    onDropToSlot,
    onDropToFloating,
    namedSnapshots,
    saveNamedSnapshot,
    loadNamedSnapshot,
    deleteNamedSnapshot,
    stats: {},
  };
}
