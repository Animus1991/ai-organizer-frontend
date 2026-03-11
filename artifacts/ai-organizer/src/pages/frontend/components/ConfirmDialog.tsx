/**
 * ConfirmDialog Component - Polished confirmation dialog
 * Semantic design tokens, animations, accessibility & responsive support
 */

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'default' | 'destructive' | 'warning';
};

export function ConfirmDialog({ 
  isOpen, 
  title, 
  message, 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  onConfirm, 
  onCancel,
  variant = 'default'
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Handle keyboard events
  useEffect(() => {
    if (!isOpen) return;

    previousActiveElement.current = document.activeElement as HTMLElement;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    // Focus first button
    setTimeout(() => {
      const firstButton = dialogRef.current?.querySelector<HTMLButtonElement>('button');
      firstButton?.focus();
    }, 50);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      previousActiveElement.current?.focus();
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'destructive':
        return 'bg-destructive hover:bg-destructive/90 text-destructive-foreground';
      case 'warning':
        return 'bg-warning hover:bg-warning/90 text-warning-foreground';
      default:
        return 'bg-primary hover:bg-primary/90 text-primary-foreground';
    }
  };

  const content = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
    >
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fade-in"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className="relative w-full max-w-md
          bg-gradient-to-br from-card/98 to-background/98
          border border-border/50
          rounded-2xl
          shadow-2xl shadow-black/40
          overflow-hidden
          animate-in fade-in-0 zoom-in-95 duration-300
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-border/50">
          <h2 
            id="confirm-dialog-title"
            className="text-base sm:text-lg font-semibold text-foreground m-0"
          >
            {title}
          </h2>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6">
          <p 
            id="confirm-dialog-message"
            className="text-sm text-muted-foreground m-0 leading-relaxed"
          >
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 p-4 sm:p-5 border-t border-border/50">
          <button 
            onClick={onCancel}
            type="button"
            className="px-4 py-2 text-sm font-medium
              bg-secondary hover:bg-secondary/80
              text-secondary-foreground
              border border-border
              rounded-lg
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background
            "
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            type="button"
            className={`px-4 py-2 text-sm font-medium
              border border-transparent
              rounded-lg
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background
              ${getVariantStyles()}
            `}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
