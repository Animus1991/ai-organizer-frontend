import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import type { Pending, Slot } from "../types";
import { stripIdsFromText } from "../utils/text";
import { generateSmartTitle, generateSmartSummary } from "../utils/aiContentAnalysis";
import { ConfirmDialog } from "./ConfirmDialog";
import { useLanguage } from "../../../context/LanguageContext";

type SlotCardProps = {
  slot: Slot;
  pending?: Pending | null;
  onClickSlot: () => void;
  onClose: () => void;
  onNotepadChange?: (v: string) => void;
  onEditToNotepad?: (title: string, text: string) => void;
  onDragStart?: (slotId: string) => void;
  onDragEnd?: () => void;
  onDropToSlot?: (slotId: string) => void;
  onDropSegment?: (slotId: string, payload: { id: string; title: string; text: string }) => void;
  onToggleLock?: (password?: string) => void;
  onRenameSlot?: (slotId: string, newTitle: string) => void;
  compareMode?: boolean;
  compareSelected?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onAiTitle?: (slotId: string, content: string) => Promise<string>;
  onAiSummary?: (slotId: string, content: string) => Promise<string>;
};

export function SlotCard({
  slot,
  pending,
  onClickSlot,
  onClose,
  onNotepadChange,
  onEditToNotepad,
  onDragStart,
  onDragEnd,
  onDropToSlot,
  onDropSegment,
  onToggleLock,
  onRenameSlot,
  compareMode,
  compareSelected,
  isCollapsed = false,
  onToggleCollapse,
  onAiTitle,
  onAiSummary,
}: SlotCardProps) {
  const { t } = useLanguage();
  const showPendingGlow = Boolean(pending);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(slot.title);
  const [confirmDialogConfig, setConfirmDialogConfig] = useState({
    title: "",
    message: "",
    onConfirm: () => {},
  });
  
  const handleEdit = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!onEditToNotepad) return;
    if (slot.kind === "doc" || slot.kind === "notepad") {
      onEditToNotepad(slot.title, slot.text);
    }
  };

  const handleTitleDoubleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (slot.kind === "empty") return;
    setIsRenaming(true);
    setRenameValue(slot.title);
  };

  const handleRenameSubmit = () => {
    if (renameValue.trim() && renameValue !== slot.title) {
      onRenameSlot?.(slot.slotId, renameValue.trim());
    }
    setIsRenaming(false);
  };

  const handleRenameKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      handleRenameSubmit();
    } else if (event.key === "Escape") {
      setIsRenaming(false);
      setRenameValue(slot.title);
    }
  };

  const handleHeaderClick = (event: React.MouseEvent) => {
    // If clicking on the title area (not buttons), toggle collapse
    const target = event.target as HTMLElement;
    if (target.closest(".slotHeaderBtns") || target.closest(".slotTitle")) return;
    onToggleCollapse?.();
  };

  const handleLockToggle = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (slot.locked) {
      // Try to unlock
      const storedPassword = (slot as any).lockPassword;
      if (storedPassword) {
        setShowPasswordDialog(true);
        setError("");
      } else {
        // No password, just unlock with confirmation
        setConfirmDialogConfig({
          title: "Unlock Slot",
          message: "Unlock this slot? This will allow modifications.",
          onConfirm: () => {
            onToggleLock?.();
            setShowConfirmDialog(false);
          },
        });
        setShowConfirmDialog(true);
      }
    } else {
      // Don't allow locking empty slots
      if (slot.kind === "empty") {
        setConfirmDialogConfig({
          title: "Cannot Lock Empty Slot",
          message: "Cannot lock empty slots. Add content first, then lock.",
          onConfirm: () => setShowConfirmDialog(false),
        });
        setShowConfirmDialog(true);
        return;
      }
      
      // Lock with optional password
      const message = "Set password for this slot?\n\n" +
        "• Leave empty for no password\n" +
        "• Locked slots cannot be modified, moved, or overwritten\n" +
        "• You can unlock anytime with the password (if set)";
      
      const password = window.prompt(message);
      if (password !== null) {
        try {
          onToggleLock?.(password);
          // Show success feedback
          setConfirmDialogConfig({
            title: "Slot Locked",
            message: password ? "Slot locked with password!" : "Slot locked without password!",
            onConfirm: () => setShowConfirmDialog(false),
          });
          setShowConfirmDialog(true);
        } catch (err: any) {
          setError(err.message);
        }
      }
    }
  };

  const handlePasswordSubmit = () => {
    try {
      onToggleLock?.(password);
      setShowPasswordDialog(false);
      setPassword("");
      setError("");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const isFilled = slot.kind !== "empty";
  const [customHeight, setCustomHeight] = useState<number | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [autoSized, setAutoSized] = useState(false);
  const [aiTitleLoading, setAiTitleLoading] = useState(false);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [summaryText, setSummaryText] = useState<string | null>(null);
  const [widthExpansion, setWidthExpansion] = useState<0 | 1 | 2>(0); // 0 = normal, 1 = 2 slots wide, 2 = 3 slots wide
  const [expandDirection, setExpandDirection] = useState<'left' | 'right' | 'both' | null>(null);
  const slotRef = React.useRef<HTMLDivElement>(null);
  const lastClickTimeRef = React.useRef<{ left: number; right: number }>({ left: 0, right: 0 });

  // Handle left border click for width expansion
  const handleLeftBorderClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    const timeSinceLastClick = now - lastClickTimeRef.current.left;
    lastClickTimeRef.current.left = now;

    if (timeSinceLastClick < 300) {
      // Double click - expand to 3 slots or collapse by 2
      if (expandDirection === 'left' && widthExpansion === 2) {
        setWidthExpansion(0);
        setExpandDirection(null);
      } else if (expandDirection === 'left' && widthExpansion === 1) {
        setWidthExpansion(0);
        setExpandDirection(null);
      } else {
        setWidthExpansion(2);
        setExpandDirection('left');
      }
    } else {
      // Single click - expand to 2 slots or collapse by 1
      setTimeout(() => {
        if (Date.now() - lastClickTimeRef.current.left >= 280) {
          if (expandDirection === 'left' && widthExpansion >= 1) {
            setWidthExpansion((prev) => Math.max(0, prev - 1) as 0 | 1 | 2);
            if (widthExpansion === 1) setExpandDirection(null);
          } else if (widthExpansion === 0) {
            setWidthExpansion(1);
            setExpandDirection('left');
          }
        }
      }, 300);
    }
  };

  // Handle right border click for width expansion
  const handleRightBorderClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    const timeSinceLastClick = now - lastClickTimeRef.current.right;
    lastClickTimeRef.current.right = now;

    if (timeSinceLastClick < 300) {
      // Double click - expand to 3 slots or collapse by 2
      if (expandDirection === 'right' && widthExpansion === 2) {
        setWidthExpansion(0);
        setExpandDirection(null);
      } else if (expandDirection === 'right' && widthExpansion === 1) {
        setWidthExpansion(0);
        setExpandDirection(null);
      } else {
        setWidthExpansion(2);
        setExpandDirection('right');
      }
    } else {
      // Single click - expand to 2 slots or collapse by 1
      setTimeout(() => {
        if (Date.now() - lastClickTimeRef.current.right >= 280) {
          if (expandDirection === 'right' && widthExpansion >= 1) {
            setWidthExpansion((prev) => Math.max(0, prev - 1) as 0 | 1 | 2);
            if (widthExpansion === 1) setExpandDirection(null);
          } else if (widthExpansion === 0) {
            setWidthExpansion(1);
            setExpandDirection('right');
          }
        }
      }, 300);
    }
  };

  // Calculate width class based on expansion
  const getWidthClass = () => {
    if (widthExpansion === 1) return ' slotWidth2';
    if (widthExpansion === 2) return ' slotWidth3';
    return '';
  };

  // Mouse resize handler
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    const startY = e.clientY;
    const startHeight = slotRef.current?.offsetHeight || 320;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const newHeight = Math.max(80, startHeight + deltaY);
      setCustomHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };
  
  return (
    <div
      ref={slotRef}
      className={`slotCard${isFilled ? " slotFilled" : ""}${showPendingGlow ? " slotPendingGlow" : ""}${compareSelected ? " compareSelected" : ""}${slot.locked && slot.kind !== "empty" ? " locked" : ""}${isCollapsed ? " slotCollapsed" : ""}${isResizing ? " slotResizing" : ""}${getWidthClass()}${expandDirection ? ` expandDir-${expandDirection}` : ""}`}
      style={customHeight && !isCollapsed ? { height: `${customHeight}px`, minHeight: "auto" } : undefined}
      onClick={onClickSlot}
      role="button"
      tabIndex={0}
      onDragOver={(event) => {
        event.preventDefault();
      }}
      onDrop={(event) => {
        event.preventDefault();
        const segmentPayload = event.dataTransfer.getData("application/x-ai-organizer-segment");
        if (segmentPayload) {
          try {
            const parsed = JSON.parse(segmentPayload) as { id: string; title: string; text: string };
            onDropSegment?.(slot.slotId, parsed);
            return;
          } catch {
            // fallthrough to slot swap
          }
        }
        onDropToSlot?.(slot.slotId);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") onClickSlot();
      }}
    >
      {/* Left border click zone for width expansion */}
      {isFilled && !isCollapsed && (
        <div
          className="slotBorderClickZone slotBorderLeft"
          onClick={handleLeftBorderClick}
          title="Click to expand left (1x = 2 slots, 2x = 3 slots)"
        />
      )}
      {/* Right border click zone for width expansion */}
      {isFilled && !isCollapsed && (
        <div
          className="slotBorderClickZone slotBorderRight"
          onClick={handleRightBorderClick}
          title="Click to expand right (1x = 2 slots, 2x = 3 slots)"
        />
      )}
      <div
        className={`slotHeader${isCollapsed ? " slotHeaderCollapsed" : ""}`}
        draggable={slot.kind !== "empty" && !slot.locked && !isCollapsed}
        onDragStart={(event) => {
          if (slot.locked || isCollapsed) return;
          event.dataTransfer.effectAllowed = "move";
          onDragStart?.(slot.slotId);
        }}
        onDragEnd={() => onDragEnd?.()}
        onClick={handleHeaderClick}
      >
        {/* Top row: title + collapse */}
        <div className="slotTitleRow">
          {isRenaming ? (
            <input
              className="slotTitleInput"
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={handleRenameKeyDown}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          ) : (
            <div 
              className="slotTitle" 
              onDoubleClick={handleTitleDoubleClick}
              title={slot.kind !== "empty" ? t("workspace.doubleClickRename") || "Double-click to rename" : undefined}
            >
              {slot.title}
            </div>
          )}
          {onToggleCollapse && (
            <button
              className="miniBtn miniBtnCollapse"
              onClick={(event) => {
                event.stopPropagation();
                onToggleCollapse();
              }}
              type="button"
              title={isCollapsed ? t("workspace.expand") || "Expand" : t("workspace.collapse") || "Collapse"}
            >
              {isCollapsed ? "▼" : "▲"}
            </button>
          )}
        </div>
        {/* Bottom row: action buttons */}
        {!isCollapsed && (
        <div className="slotHeaderBtns">
          <button
            className="miniBtn"
            onClick={handleLockToggle}
            type="button"
            title={slot.locked ? t("workspace.unlock") || "Unlock" : t("workspace.lockSlot") || "Lock"}
          >
            {slot.locked ? "🔓" : "🔒"}
          </button>
          {slot.kind !== "empty" && (
            <button className="miniBtn" onClick={handleEdit} type="button" title={t("workspace.editSlot") || "Edit"}>
              ✏️
            </button>
          )}
          {isFilled && (
            <button
              className="miniBtn"
              onClick={(event) => {
                event.stopPropagation();
                if (autoSized) {
                  setCustomHeight(null);
                  setAutoSized(false);
                } else {
                  if (slotRef.current) {
                    const body = slotRef.current.querySelector(".slotBody");
                    if (body) {
                      const scrollH = body.scrollHeight;
                      const headerH = slotRef.current.querySelector(".slotHeader")?.getBoundingClientRect().height || 60;
                      setCustomHeight(scrollH + headerH + 40);
                      setAutoSized(true);
                    }
                  }
                }
              }}
              type="button"
              title={autoSized ? t("workspace.resetSize") || "Reset size" : t("workspace.fitContent") || "Fit to content"}
            >
              {autoSized ? "↔" : "↕"}
            </button>
          )}
          {isFilled && (
            <button
              className={`miniBtn${aiTitleLoading ? " loading" : ""}`}
              onClick={async (event) => {
                event.stopPropagation();
                if (aiTitleLoading) return;
                setAiTitleLoading(true);
                try {
                  const content = slot.text || "";
                  if (!content.trim()) return;
                  if (onAiTitle) {
                    const title = await onAiTitle(slot.slotId, content);
                    if (title) onRenameSlot?.(slot.slotId, title);
                  } else {
                    const smartTitle = await generateSmartTitle(content);
                    onRenameSlot?.(slot.slotId, smartTitle);
                  }
                } finally {
                  setAiTitleLoading(false);
                }
              }}
              type="button"
              title={t("workspace.aiAutoTitle") || "AI Auto-Title"}
            >
              {aiTitleLoading ? "⏳" : "✨"}
            </button>
          )}
          {isFilled && (
            <button
              className={`miniBtn${aiSummaryLoading ? " loading" : ""}`}
              onClick={async (event) => {
                event.stopPropagation();
                if (aiSummaryLoading) return;
                if (summaryText) {
                  setSummaryText(null);
                  return;
                }
                setAiSummaryLoading(true);
                try {
                  const content = slot.text || "";
                  if (!content.trim()) return;
                  if (onAiSummary) {
                    const summary = await onAiSummary(slot.slotId, content);
                    setSummaryText(summary);
                  } else {
                    const smartSummary = await generateSmartSummary(content);
                    setSummaryText(smartSummary);
                  }
                } finally {
                  setAiSummaryLoading(false);
                }
              }}
              type="button"
              title={summaryText ? t("workspace.hideSummary") || "Hide summary" : t("workspace.aiSummary") || "AI Summary"}
            >
              {aiSummaryLoading ? "⏳" : "✨"}
            </button>
          )}
          <button
            className="miniBtn miniBtnDanger"
            onClick={(event) => {
              event.stopPropagation();
              onClose();
            }}
            type="button"
            draggable={false}
            title={t("workspace.closeSlot") || "Close"}
          >
            ×
          </button>
        </div>
        )}
      </div>
      {!isCollapsed && (
      <div className="slotBody" onClick={compareMode ? undefined : (event) => event.stopPropagation()}>
        {summaryText && (
          <div className="slotSummaryBanner">
            <div className="slotSummaryLabel">📝 {t("workspace.summaryLabel") || "Summary"}</div>
            <div className="slotSummaryText">{summaryText}</div>
          </div>
        )}
        {slot.kind === "empty" && (
          <div className="slotEmpty">
            <div className="slotEmptyIcon">📂</div>
            <div className="slotEmptyTitle">{t("workspace.emptySlotTitle") || "Empty Slot"}</div>
            <div className="slotEmptyHint">{t("workspace.emptySlotHint") || "Drag a document, segment, or search result here to begin working"}</div>
          </div>
        )}
        {slot.kind === "doc" && (
          <div className="slotDocBody">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                table: ({ children }) => (
                  <div className="slotTableWrap">
                    <table>{children}</table>
                  </div>
                ),
              }}
            >
              {stripIdsFromText(slot.text)}
            </ReactMarkdown>
          </div>
        )}
        {slot.kind === "notepad" && (
          <>
            <div className="slotToolbar">
              <button
                className="slotToolbarBtn"
                onClick={(event) => {
                  event.stopPropagation();
                  slot.onToggleWrap?.();
                }}
                type="button"
              >
                {slot.wrap ? "↩ " + (t("workspace.wrap") || "Wrap") : "→ " + (t("workspace.noWrap") || "No Wrap")}
              </button>
              <button
                className="slotToolbarBtn"
                onClick={(event) => {
                  event.stopPropagation();
                  navigator.clipboard.writeText(slot.text || "");
                }}
                type="button"
              >
                📋 {t("workspace.copy") || "Copy"}
              </button>
              <button
                className="slotToolbarBtn"
                onClick={(event) => {
                  event.stopPropagation();
                  slot.onInsertTime?.();
                }}
                type="button"
              >
                🕐 {t("workspace.insertTime") || "Time"}
              </button>
              <button
                className="slotToolbarBtn"
                onClick={(event) => {
                  event.stopPropagation();
                  slot.onClear?.();
                }}
                type="button"
              >
                🗑️ {t("workspace.clear") || "Clear"}
              </button>
              <button
                className="slotToolbarBtn"
                onClick={(event) => {
                  event.stopPropagation();
                  slot.onFloat?.();
                }}
                type="button"
              >
                ⧉ {t("workspace.floatWindow") || "Float"}
              </button>
              <button
                className="slotToolbarBtn"
                onClick={(event) => {
                  event.stopPropagation();
                  slot.onDownload?.();
                }}
                type="button"
              >
                ⬇️ {t("workspace.download") || "Save"}
              </button>
              <button
                className="slotToolbarBtn"
                onClick={(event) => {
                  event.stopPropagation();
                  const content = slot.text || "";
                  const mdContent = `# ${slot.title}\n\n${content}`;
                  const blob = new Blob([mdContent], { type: "text/markdown;charset=utf-8" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${(slot.title || "notepad").replace(/[^a-zA-Z0-9_\-\u0370-\u03FF\u0400-\u04FF]/g, "_")}.md`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                type="button"
              >
                📄 {t("workspace.exportMarkdown") || "Export .md"}
              </button>
              <span className="slotToolbarInfo">
                {(slot.text || "").split(/\s+/).filter(Boolean).length} {t("workspace.words") || "words"}
              </span>
            </div>
            <textarea
              className="slotTextarea"
              value={slot.text}
              onChange={(event) => onNotepadChange?.(event.target.value)}
              style={{ whiteSpace: slot.wrap ? "pre-wrap" : "pre" }}
            />
          </>
        )}
      </div>
      )}
      {showPasswordDialog && (
        <div className="passwordDialogOverlay" onClick={() => setShowPasswordDialog(false)}>
          <div className="passwordDialog" onClick={(e) => e.stopPropagation()}>
            <h3>Enter Password to Unlock</h3>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoFocus
            />
            {error && <div className="passwordError">{error}</div>}
            <div className="passwordDialogButtons">
              <button onClick={handlePasswordSubmit}>Unlock</button>
              <button onClick={() => setShowPasswordDialog(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        title={confirmDialogConfig.title}
        message={confirmDialogConfig.message}
        onConfirm={confirmDialogConfig.onConfirm}
        onCancel={() => setShowConfirmDialog(false)}
      />
      {/* Resize handle at bottom of slot */}
      {!isCollapsed && isFilled && (
        <div
          className="slotResizeHandle"
          onMouseDown={handleResizeMouseDown}
          title="Drag to resize"
        />
      )}
    </div>
  );
}
