import React, { useRef } from "react";
import type { FloatingPad, FloatingPadPatch } from "../types";
import { useLanguage } from "../../../context/LanguageContext";

type FloatingNotepadProps = {
  pad: FloatingPad;
  onClose: () => void;
  onChange: (patch: FloatingPadPatch) => void;
  onBringToFront: () => void;
  onDownload: () => void;
  onDock: () => void;
};

export function FloatingNotepad({
  pad,
  onClose,
  onChange,
  onBringToFront,
  onDownload,
  onDock,
}: FloatingNotepadProps) {
  const { t } = useLanguage();
  const dragOffset = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const windowRef = useRef<HTMLDivElement | null>(null);

  // Remove automatic size setting to prevent infinite loops
  // Size will be set only when user manually resizes

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    // Only start dragging if not clicking on a button
    if ((event.target as HTMLElement).tagName === 'BUTTON') return;
    
    onBringToFront();
    isDragging.current = true;
    dragOffset.current = {
      x: event.clientX - pad.x,
      y: event.clientY - pad.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    onChange({
      x: Math.max(10, event.clientX - dragOffset.current.x),
      y: Math.max(10, event.clientY - dragOffset.current.y),
    });
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <div
      className={`floatingWindow${pad.minimized ? " minimized" : ""}`}
      style={{
        left: pad.x,
        top: pad.y,
        width: Math.max(pad.w || 380, 320),
        height: pad.minimized ? 48 : Math.max(pad.h || 840, 280),
        zIndex: pad.z,
        maxWidth: 'calc(100vw - 20px)',
        maxHeight: pad.minimized ? 48 : 'calc(100vh - 20px)',
      }}
      onPointerDown={onBringToFront}
      ref={windowRef}
    >
      {/* Always-visible minimize button - same height as close */}
      <button
        className="floatingMinBtn"
        onClick={(event) => {
          event.stopPropagation();
          onChange({ minimized: !pad.minimized });
        }}
        type="button"
        title={pad.minimized ? t("notepad.expand") : t("notepad.minimize")}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {pad.minimized ? "▢" : "▁"}
      </button>

      {/* Always-visible close button */}
      <button
        className="floatingCloseBtn"
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
        type="button"
        title={t("notepad.close")}
        onPointerDown={(e) => e.stopPropagation()}
      >
        ×
      </button>

      <div
        className="floatingHeader"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div className="floatingTitle">📝 {pad.title}</div>
      </div>
      {!pad.minimized && (
        <>
          <div className="floatingToolbar" onPointerDown={(e) => e.stopPropagation()}>
            <button className="miniBtn" onClick={() => onChange({ wrap: !pad.wrap })} type="button">
              {pad.wrap ? t("notepad.wrap") : t("notepad.noWrap")}
            </button>
            <button className="miniBtn" onClick={() => navigator.clipboard.writeText(pad.text || "")} type="button">
              {t("notepad.copy")}
            </button>
            <button className="miniBtn" onClick={() => onChange({ text: "" })} type="button">
              {t("notepad.clear")}
            </button>
            <button className="miniBtn" onClick={() => onDownload()} type="button">
              ↓ {t("notepad.save")}
            </button>
            <button className="miniBtn" onClick={() => onDock()} type="button">
              {t("notepad.dock")}
            </button>
            <button
              className="miniBtn"
              onClick={() => onChange({ sticky: !pad.sticky })}
              type="button"
              title={pad.sticky ? t("notepad.stickyFloatTitle") : t("notepad.stickyDockTitle")}
            >
              📌 {pad.sticky ? t("notepad.stickyOn") : t("notepad.stickyOff")}
            </button>
          </div>
          <div className="floatingBody">
            <textarea
              className="floatingTextarea"
              value={pad.text}
              onChange={(event) => onChange({ text: event.target.value })}
              style={{ whiteSpace: pad.wrap ? "pre-wrap" : "pre" }}
            />
          </div>
        </>
      )}
    </div>
  );
}
