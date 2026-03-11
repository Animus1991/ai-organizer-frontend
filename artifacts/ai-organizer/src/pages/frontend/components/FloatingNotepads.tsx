import React, { useState, useRef, useEffect, useCallback } from "react";
import type { FloatingPad, FloatingPadPatch } from "../types";
import { useLanguage } from "../../../context/LanguageContext";
import { useTheme } from "../../../context/ThemeContext";

type FloatingNotepadsProps = {
  pads: FloatingPad[];
  onClose: (id: string) => void;
  onChange: (id: string, patch: FloatingPadPatch) => void;
  onBringToFront: (id: string) => void;
  onDownload: (id: string) => void;
  onDock: (id: string) => void;
  onAdd?: () => void;
};

export function FloatingNotepads({
  pads,
  onClose,
  onChange,
  onBringToFront,
  onDownload,
  onDock,
  onAdd,
}: FloatingNotepadsProps) {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const [activeTabId, setActiveTabId] = useState<string>("");
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [minimized, setMinimized] = useState(false);
  const [windowPos, setWindowPos] = useState({ x: 280, y: 140 });
  const [windowSize] = useState({ w: 560, h: 840 });
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const titleInputRef = useRef<HTMLInputElement>(null);
  const tabInputRef = useRef<HTMLInputElement>(null);
  const initialized = useRef(false);

  // Initialize window position from first pad
  useEffect(() => {
    if (pads && pads.length > 0 && !initialized.current) {
      setWindowPos({ x: pads[0].x, y: pads[0].y });
      setActiveTabId(pads[0].id);
      initialized.current = true;
    }
  }, [pads]);

  // Keep activeTabId valid when pads change
  useEffect(() => {
    if (pads && pads.length > 0 && !pads.find((p) => p.id === activeTabId)) {
      setActiveTabId(pads[pads.length - 1].id);
    }
  }, [pads, activeTabId]);

  // Auto-select newly added pad
  const prevPadCount = useRef(pads?.length || 0);
  useEffect(() => {
    if (pads && pads.length > prevPadCount.current && pads.length > 0) {
      setActiveTabId(pads[pads.length - 1].id);
      setMinimized(false);
    }
    prevPadCount.current = pads?.length || 0;
  }, [pads]);

  // Focus title input when editing starts
  useEffect(() => {
    if (editingTitleId) {
      setTimeout(() => {
        titleInputRef.current?.focus();
        titleInputRef.current?.select();
        tabInputRef.current?.focus();
        tabInputRef.current?.select();
      }, 0);
    }
  }, [editingTitleId]);

  const startEditTitle = useCallback((padId: string) => {
    const pad = pads?.find((p) => p.id === padId);
    if (pad) {
      setEditingTitleId(padId);
      setEditValue(pad.title);
    }
  }, [pads]);

  const saveTitle = useCallback(() => {
    if (editingTitleId && editValue.trim()) {
      onChange(editingTitleId, { title: editValue.trim() });
    }
    setEditingTitleId(null);
  }, [editingTitleId, editValue, onChange]);

  const handleHeaderPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "BUTTON" || target.tagName === "INPUT") return;
    onBringToFront(activePad?.id || pads?.[0]?.id);
    isDragging.current = true;
    dragOffset.current = {
      x: e.clientX - windowPos.x,
      y: e.clientY - windowPos.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleHeaderPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    setWindowPos({
      x: Math.max(10, e.clientX - dragOffset.current.x),
      y: Math.max(10, e.clientY - dragOffset.current.y),
    });
  };

  const handleHeaderPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleCloseTab = (padId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    onClose(padId);
  };

  if (!pads || !pads.length) return null;

  const activePad = pads.find((p) => p.id === activeTabId) || pads[0];
  const maxZ = Math.max(...pads.map((p) => p.z), 1000);

  return (
    <div className="floatingOverlay">
      <div
        className={`floatingWindow${minimized ? " minimized" : ""}`}
        style={{
          left: windowPos.x,
          top: windowPos.y,
          width: Math.max(windowSize.w, 400),
          height: minimized ? (pads.length > 1 ? 84 : 48) : Math.max(windowSize.h, 280),
          zIndex: maxZ,
          maxWidth: "calc(100vw - 20px)",
          maxHeight: minimized ? (pads.length > 1 ? 84 : 48) : "calc(100vh - 20px)",
        }}
        onPointerDown={() => onBringToFront(activePad.id)}
      >
        {/* Minimize button */}
        <button
          className="floatingMinBtn"
          onClick={(e) => {
            e.stopPropagation();
            setMinimized(!minimized);
          }}
          type="button"
          title={minimized ? t("notepad.expand") : t("notepad.minimize")}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {minimized ? "▢" : "▁"}
        </button>

        {/* Close active tab */}
        <button
          className="floatingCloseBtn"
          onClick={(e) => {
            e.stopPropagation();
            handleCloseTab(activePad.id);
          }}
          type="button"
          title={t("notepad.close")}
          onPointerDown={(e) => e.stopPropagation()}
        >
          ×
        </button>

        {/* Draggable header with editable title */}
        <div
          className="floatingHeader"
          onPointerDown={handleHeaderPointerDown}
          onPointerMove={handleHeaderPointerMove}
          onPointerUp={handleHeaderPointerUp}
        >
          {editingTitleId === activePad.id && pads.length <= 1 ? (
            <input
              ref={titleInputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveTitle();
                if (e.key === "Escape") setEditingTitleId(null);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              style={{
                background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
                border: "1px solid rgba(99,102,241,0.5)",
                borderRadius: "6px",
                color: isDark ? "#fff" : "#2f2941",
                fontSize: "13px",
                fontWeight: 600,
                padding: "2px 8px",
                outline: "none",
                width: "100%",
                maxWidth: "300px",
              }}
            />
          ) : (
            <div
              className="floatingTitle"
              onClick={(e) => {
                e.stopPropagation();
                startEditTitle(activePad.id);
              }}
              title="Click to rename"
              style={{ cursor: "text" }}
            >
              📝 {activePad.title}
            </div>
          )}
        </div>

        {/* Tab Bar — browser-like tabs */}
        <div className="floatingTabBar" onPointerDown={(e) => e.stopPropagation()}>
          {pads.map((pad) => (
            <div
              key={pad.id}
              className={`floatingTab${pad.id === activeTabId ? " floatingTab--active" : ""}`}
              onClick={() => setActiveTabId(pad.id)}
            >
              {editingTitleId === pad.id ? (
                <input
                  ref={tabInputRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveTitle();
                    if (e.key === "Escape") setEditingTitleId(null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="floatingTab-input"
                />
              ) : (
                <span
                  className="floatingTab-title"
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    startEditTitle(pad.id);
                  }}
                  title="Double-click to rename"
                >
                  {pad.title}
                </span>
              )}
              {pads.length > 1 && (
                <button
                  className="floatingTab-close"
                  onClick={(e) => handleCloseTab(pad.id, e)}
                  title={t("notepad.close")}
                  type="button"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {onAdd && (
            <button
              className="floatingTab floatingTab-add"
              onClick={(e) => { e.stopPropagation(); onAdd(); }}
              title="New tab"
              type="button"
              style={{ minWidth: '32px', maxWidth: '32px', justifyContent: 'center', opacity: 0.7 }}
            >
              +
            </button>
          )}
        </div>

        {/* Active tab content */}
        {!minimized && activePad && (
          <>
            <div className="floatingToolbar" onPointerDown={(e) => e.stopPropagation()}>
              <button className="miniBtn" onClick={() => onChange(activePad.id, { wrap: !activePad.wrap })} type="button">
                {activePad.wrap ? t("notepad.wrap") : t("notepad.noWrap")}
              </button>
              <button className="miniBtn" onClick={() => navigator.clipboard.writeText(activePad.text || "")} type="button">
                {t("notepad.copy")}
              </button>
              <button className="miniBtn" onClick={() => onChange(activePad.id, { text: "" })} type="button">
                {t("notepad.clear")}
              </button>
              <button className="miniBtn" onClick={() => onDownload(activePad.id)} type="button">
                ↓ {t("notepad.save")}
              </button>
              <button className="miniBtn" onClick={() => onDock(activePad.id)} type="button">
                {t("notepad.dock")}
              </button>
              <button
                className="miniBtn"
                onClick={() => onChange(activePad.id, { sticky: !activePad.sticky })}
                type="button"
                title={activePad.sticky ? t("notepad.stickyFloatTitle") : t("notepad.stickyDockTitle")}
              >
                📌 {activePad.sticky ? t("notepad.stickyOn") : t("notepad.stickyOff")}
              </button>
            </div>
            <div className="floatingBody">
              <textarea
                className="floatingTextarea"
                value={activePad.text}
                onChange={(e) => onChange(activePad.id, { text: e.target.value })}
                style={{ whiteSpace: activePad.wrap ? "pre-wrap" : "pre" }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
