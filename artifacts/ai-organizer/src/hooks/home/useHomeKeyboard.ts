// src/hooks/home/useHomeKeyboard.ts
// Extracted keyboard shortcuts from Home.tsx
import { useEffect, RefObject } from "react";

interface UseHomeKeyboardOptions {
  setGlobalSearchOpen: (open: boolean) => void;
  homeWidgetViewMode: "grid" | "carousel3d" | "carousel";
  updateViewMode: (mode: "grid" | "carousel3d" | "carousel") => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
}

export function useHomeKeyboard({
  setGlobalSearchOpen,
  homeWidgetViewMode,
  updateViewMode,
  fileInputRef,
}: UseHomeKeyboardOptions) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Ctrl/⌘+K → Global search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setGlobalSearchOpen(true);
        return;
      }
      // Ctrl/⌘+U → Upload
      if ((e.metaKey || e.ctrlKey) && e.key === "u") {
        e.preventDefault();
        fileInputRef.current?.click();
        return;
      }
      // Skip when in inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (e.target as HTMLElement)?.isContentEditable) return;

      if (e.key === "g" || e.key === "G") updateViewMode("grid");
      if (e.key === "3") updateViewMode("carousel3d");
      if (e.key === "c" || e.key === "C") updateViewMode("carousel");

      // ArrowLeft/Right → carousel nav
      if ((e.key === "ArrowLeft" || e.key === "ArrowRight") &&
          (homeWidgetViewMode === "carousel" || homeWidgetViewMode === "carousel3d")) {
        window.dispatchEvent(new CustomEvent("carouselNav", { detail: { dir: e.key === "ArrowLeft" ? -1 : 1 } }));
      }
    };
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [setGlobalSearchOpen, updateViewMode, homeWidgetViewMode, fileInputRef]);
}
