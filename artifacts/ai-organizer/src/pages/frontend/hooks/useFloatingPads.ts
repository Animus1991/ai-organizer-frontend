// src/pages/frontend/hooks/useFloatingPads.ts
// Extracted from useSlots.ts — floating notepad management
import { useState, useCallback, useEffect, useRef } from "react";
import type { FloatingPad, FloatingPadPatch, Slot } from "../types";

const STORAGE_KEY = "frontendWorkspaceFloatingPads";
const makeId = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));

function loadPads(): FloatingPad[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function useFloatingPads(
  normalizedSlots: Slot[],
  lockedSlots: Set<string>,
  dockToSlotFn: (pad: FloatingPad, slotId?: string) => void,
) {
  const [floatingPads, setFloatingPads] = useState<FloatingPad[]>(loadPads);
  const zCounter = useRef(1000);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(floatingPads)); } catch {}
  }, [floatingPads]);

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

  const closeFloatingPad = useCallback((id: string) => {
    setFloatingPads((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const updateFloatingPad = useCallback((id: string, patch: FloatingPadPatch) => {
    setFloatingPads((prev) =>
      prev.map((pad) => {
        if (pad.id !== id) return pad;
        const next = { ...pad, ...patch };

        if (patch.sticky === true && !pad.sticky) {
          const emptySlot = normalizedSlots.find(slot =>
            slot.kind === "empty" && !lockedSlots.has(slot.slotId)
          );
          if (emptySlot) {
            Promise.resolve().then(() => dockToSlotFn(pad, emptySlot.slotId));
            return next;
          }
          zCounter.current += 1;
          next.z = zCounter.current;
        }
        return next;
      })
    );
  }, [normalizedSlots, lockedSlots, dockToSlotFn]);

  const bringToFront = useCallback((id: string) => {
    zCounter.current += 1;
    setFloatingPads((prev) =>
      prev.map((pad) => (pad.id === id ? { ...pad, z: zCounter.current } : pad))
    );
  }, []);

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

  return {
    floatingPads,
    setFloatingPads,
    newFloatingNotepad,
    closeFloatingPad,
    updateFloatingPad,
    bringToFront,
    downloadFloatingPad,
  };
}
