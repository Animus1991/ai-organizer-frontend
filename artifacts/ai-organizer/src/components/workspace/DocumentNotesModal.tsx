/**
 * DocumentNotesModal Component - Polished modal for document notes
 * Semantic design tokens, animations, accessibility & responsive support
 */

import { Suspense, lazy, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "../../context/LanguageContext";

// Lazy load the heavy TipTap editor (only load when modal is opened)
const RichTextEditor = lazy(() => import("../../editor/RichTextEditor").then(module => ({ default: module.RichTextEditor })));

export interface DocumentNotesModalProps {
  // Modal state
  open: boolean;
  onClose: () => void;
  
  // Notes content
  html: string;
  text: string;
  onHtmlChange: (html: string) => void;
  onTextChange: (text: string) => void;
  
  // Save functionality
  onSave: () => void;
  onResetFromDocument: () => void;
  
  // Status
  dirty: boolean;
  status: string;
}

/**
 * DocumentNotesModal - Modal for document notes
 */
export default function DocumentNotesModal({
  open,
  onClose,
  html,
  text,
  onHtmlChange,
  onTextChange,
  onSave,
  onResetFromDocument,
  dirty,
  status,
}: DocumentNotesModalProps) {
  const { t } = useLanguage();
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  
  const hasUnsavedChanges = dirty && text.trim();

  // Handle keyboard events & focus management
  useEffect(() => {
    if (!open) return;

    previousActiveElement.current = document.activeElement as HTMLElement;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (hasUnsavedChanges) {
          onSave();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      previousActiveElement.current?.focus();
    };
  }, [open, onClose, onSave, hasUnsavedChanges]);
  
  if (!open) return null;

  const content = (
    <div 
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notes-modal-title"
    >
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-xl animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div
        ref={modalRef}
        className="relative w-full max-w-[1400px] h-full max-h-[95vh]
          bg-gradient-to-br from-card/98 to-background/98
          backdrop-blur-2xl
          border border-border/50
          rounded-3xl
          overflow-hidden
          flex flex-col
          shadow-2xl shadow-black/60
          animate-in fade-in-0 zoom-in-95 duration-300
        "
      >
        {/* Compact Header */}
        <div className="flex items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 border-b border-border/50 bg-muted/30 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 mb-1">
              <h2 
                id="notes-modal-title"
                className="text-base sm:text-lg font-semibold text-foreground m-0"
              >
                📝 {t("docNotes.title")}
              </h2>
              {hasUnsavedChanges && (
                <span className="text-xs px-2 py-0.5 bg-warning/20 rounded-full text-warning font-medium whitespace-nowrap">
                  • {t("docNotes.unsaved")}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground m-0 truncate">
              {status || t("docNotes.defaultStatus")}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 items-center flex-shrink-0">
            <button 
              onClick={onSave} 
              disabled={!text.trim() || !hasUnsavedChanges}
              className={`
                px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background
                whitespace-nowrap
                ${hasUnsavedChanges 
                  ? 'bg-success/20 hover:bg-success/30 text-success border border-success/40 hover:border-success/60' 
                  : 'bg-muted/50 text-muted-foreground border border-border opacity-60 cursor-not-allowed'
                }
              `}
              title="Ctrl/Cmd + S"
            >
              💾 {hasUnsavedChanges ? t("action.save") : t("status.saved")}
            </button>
            
            <button 
              onClick={onResetFromDocument}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium
                bg-secondary hover:bg-secondary/80
                text-secondary-foreground
                border border-border
                rounded-lg
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background
                whitespace-nowrap
              "
              title={t("docNotes.copyTextTitle")}
            >
              📄 <span className="hidden sm:inline">{t("docNotes.copyText")}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 
                bg-muted/50 hover:bg-muted
                text-muted-foreground hover:text-foreground
                border border-transparent hover:border-border
                rounded-lg
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background
              "
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-h-0 flex flex-col p-3 sm:p-4 gap-3">
          {/* Rich Text Editor */}
          <div className="flex-1 min-h-0 flex flex-col bg-background/20 rounded-xl border border-border/30 overflow-hidden">
            <Suspense
              fallback={
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-xs text-muted-foreground">{t("editor.loading")}</p>
                  </div>
                </div>
              }
            >
              <RichTextEditor
                valueHtml={html}
                onChange={({ html, text }) => {
                  onHtmlChange(html);
                  onTextChange(text);
                }}
                placeholder={t("docNotes.placeholder")}
              />
            </Suspense>
          </div>

          {/* Info Bar */}
          <div className="flex items-center justify-between gap-3 p-2.5 sm:p-3 bg-muted/30 rounded-lg border border-border/30 text-xs text-muted-foreground">
            <div className="flex gap-3 sm:gap-4 items-center">
              <span className="flex items-center gap-1.5">
                <span>💡</span>
                <strong className="hidden sm:inline">{t("docNotes.tipLabel")}:</strong>
                <span className="hidden md:inline">{t("docNotes.tipCopyText")}</span>
              </span>
            </div>
            {status && (
              <span className={`
                px-2 py-1 rounded text-xs font-medium whitespace-nowrap
                ${status.includes("✅") 
                  ? "bg-success/15 text-success" 
                  : "bg-muted text-muted-foreground"
                }
              `}>
                {status}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
