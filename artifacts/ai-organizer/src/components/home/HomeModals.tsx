// src/components/home/HomeModals.tsx
// Modal overlays: Conversation Browser, Analytics, Viewer, Widget Popup, Benchmark Email
import React, { useEffect, useRef } from "react";
import { useTheme } from "../../context/ThemeContext";
import { X } from "lucide-react";
import {
  StoredConversation,
  conversationStorage,
  ConversationBrowser,
  ConversationViewer,
  ConversationAnalytics,
} from "../../features/chat-import";

/* ── Shared Modal Shell ─────────────────────────────────────────────── */

const ModalShell: React.FC<{
  onClose: () => void;
  children: React.ReactNode;
  zIndex?: number;
  maxWidth?: string;
  ariaLabel?: string;
}> = ({ onClose, children, zIndex = 100, maxWidth = "90vw", ariaLabel }) => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'hsl(var(--foreground) / 0.5)',
        backdropFilter: 'blur(8px)',
        zIndex,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: isMobile ? '8px' : '24px',
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        style={{
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '16px',
          width: maxWidth,
          maxWidth,
          height: '85vh',
          overflow: 'hidden',
          boxShadow: '0 25px 60px hsl(var(--foreground) / 0.15)',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

/* ── Widget Popup Modal ─────────────────────────────────────────────── */

export interface WidgetPopupInfo {
  id: string;
  title: string;
  icon: string;
}

interface WidgetPopupModalProps {
  widgetPopup: WidgetPopupInfo | null;
  onClose: () => void;
  renderWidgetById: (id: string) => React.ReactNode;
}

export const WidgetPopupModal: React.FC<WidgetPopupModalProps> = ({
  widgetPopup, onClose, renderWidgetById,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!widgetPopup) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [widgetPopup, onClose]);

  useEffect(() => {
    if (widgetPopup && modalRef.current) modalRef.current.focus();
  }, [widgetPopup]);

  if (!widgetPopup) return null;

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'hsl(var(--foreground) / 0.5)',
      backdropFilter: 'blur(8px)',
      zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: isMobile ? '8px' : '24px',
    }} onClick={onClose}>
      <div
        ref={modalRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="widget-modal-title"
        style={{
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '16px',
          width: '90vw',
          maxWidth: '900px',
          height: '85vh',
          overflow: 'hidden',
          boxShadow: '0 25px 60px hsl(var(--foreground) / 0.15)',
          display: 'flex',
          flexDirection: 'column',
          outline: 'none',
        }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: isMobile ? '12px 16px' : '16px 24px',
          borderBottom: '1px solid hsl(var(--border))',
          background: 'hsl(var(--primary) / 0.04)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>{widgetPopup.icon}</span>
            <span id="widget-modal-title" style={{ fontSize: '15px', fontWeight: 700, color: 'hsl(var(--foreground))' }}>
              {widgetPopup.title}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px', height: '32px', borderRadius: '10px',
              border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--muted) / 0.5)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'hsl(var(--muted-foreground))',
            }}
            title="Κλείσιμο (Esc)"
            aria-label="Κλείσιμο"
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>
        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: isMobile ? '12px' : '20px 24px' }}>
          {renderWidgetById(widgetPopup.id)}
        </div>
      </div>
    </div>
  );
};

/* ── Conversation Browser Modal ─────────────────────────────────────── */

interface ConversationBrowserModalProps {
  open: boolean;
  onClose: () => void;
  onSelectConversation: (conv: StoredConversation) => void;
  onViewAnalytics: () => void;
  onImportClick: () => void;
}

export const ConversationBrowserModal: React.FC<ConversationBrowserModalProps> = ({
  open, onClose, onSelectConversation, onViewAnalytics, onImportClick,
}) => {
  if (!open) return null;
  return (
    <ModalShell onClose={onClose} ariaLabel="Περιήγηση Συνομιλιών">
      <ConversationBrowser
        onSelectConversation={onSelectConversation}
        onDeleteConversation={(id) => conversationStorage.deleteConversation(id)}
        onViewAnalytics={onViewAnalytics}
        onImportClick={onImportClick}
        onClose={onClose}
      />
    </ModalShell>
  );
};

/* ── Conversation Analytics Modal ───────────────────────────────────── */

interface ConversationAnalyticsModalProps {
  open: boolean;
  onClose: () => void;
}

export const ConversationAnalyticsModal: React.FC<ConversationAnalyticsModalProps> = ({
  open, onClose,
}) => {
  if (!open) return null;
  return (
    <ModalShell onClose={onClose} maxWidth="1200px" ariaLabel="Αναλυτικά Συνομιλιών">
      <div style={{ flex: 1, overflow: 'auto' }}>
        <ConversationAnalytics
          conversations={conversationStorage.getAllConversations()}
          stats={conversationStorage.getStats()}
          onClose={onClose}
        />
      </div>
    </ModalShell>
  );
};

/* ── Conversation Viewer Modal ──────────────────────────────────────── */

interface ConversationViewerModalProps {
  conversation: StoredConversation | null;
  onClose: () => void;
}

export const ConversationViewerModal: React.FC<ConversationViewerModalProps> = ({
  conversation, onClose,
}) => {
  if (!conversation) return null;
  return (
    <ModalShell onClose={onClose} zIndex={101} ariaLabel="Προβολή Συνομιλίας">
      <ConversationViewer
        conversation={conversation}
        onClose={onClose}
        onExport={() => {
          const json = conversationStorage.exportToJSON();
          const blob = new Blob([json], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `conversation_${conversation.id}.json`;
          a.click();
        }}
      />
    </ModalShell>
  );
};

/* ── Benchmark Email Modal ──────────────────────────────────────────── */

interface BenchmarkEmailModalProps {
  benchmarkEmailModal: null | "json" | "zip";
  benchmarkEmailTo: string;
  benchmarkEmailError: string | null;
  benchmarkAction: null | string;
  t: (key: string) => string;
  onClose: () => void;
  onSubmit: () => void;
  onEmailChange: (value: string) => void;
  onClearError: () => void;
}

export const BenchmarkEmailModal: React.FC<BenchmarkEmailModalProps> = ({
  benchmarkEmailModal, benchmarkEmailTo, benchmarkEmailError, benchmarkAction, t,
  onClose, onSubmit, onEmailChange, onClearError,
}) => {
  if (!benchmarkEmailModal) return null;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const btnBase: React.CSSProperties = {
    padding: '10px 14px',
    borderRadius: '10px',
    fontWeight: 700,
    fontSize: '13px',
    cursor: benchmarkAction !== null ? 'not-allowed' : 'pointer',
    opacity: benchmarkAction !== null ? 0.6 : 1,
    transition: 'all 0.15s ease',
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "hsl(var(--foreground) / 0.4)",
          backdropFilter: "blur(4px)",
          zIndex: 80,
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("doc.benchmarkEmailDialog")}
        style={{
          position: "fixed", left: "50%", top: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(520px, 92vw)",
          borderRadius: "16px",
          border: "1px solid hsl(var(--border))",
          background: "hsl(var(--card))",
          boxShadow: "0 16px 48px hsl(var(--foreground) / 0.15)",
          padding: isMobile ? "16px" : "18px",
          zIndex: 90,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 800, color: "hsl(var(--foreground))" }}>
              {benchmarkEmailModal === "json" ? t("doc.benchmarkEmailJsonTitle") : t("doc.benchmarkEmailZipTitle")}
            </div>
            <div style={{ fontSize: "12px", color: "hsl(var(--muted-foreground))", marginTop: "4px" }}>
              {t("doc.benchmarkEmailHint")}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px', height: '32px', borderRadius: '10px',
              border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--muted) / 0.5)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'hsl(var(--muted-foreground))',
            }}
            aria-label={t("action.close")}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        <div style={{ marginTop: "14px" }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "hsl(var(--foreground))", marginBottom: "8px" }}>
            {t("doc.benchmarkEmailTo")}
          </label>
          <input
            value={benchmarkEmailTo}
            onChange={(e) => { onEmailChange(e.target.value); if (benchmarkEmailError) onClearError(); }}
            autoFocus
            placeholder="name@example.com"
            style={{
              width: "100%", padding: "12px 14px", borderRadius: "10px",
              border: `1px solid hsl(var(--${benchmarkEmailError ? 'destructive' : 'border'}))`,
              background: "hsl(var(--muted) / 0.3)",
              color: "hsl(var(--foreground))",
              fontSize: "14px", outline: "none",
            }}
          />
          {benchmarkEmailError && (
            <div style={{ marginTop: "8px", fontSize: "12px", color: "hsl(var(--destructive))", fontWeight: 700 }}>
              {benchmarkEmailError}
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "16px" }}>
          <button onClick={onClose} disabled={benchmarkAction !== null} style={{
            ...btnBase,
            background: 'hsl(var(--muted) / 0.5)',
            color: 'hsl(var(--muted-foreground))',
            border: '1px solid hsl(var(--border))',
          }}>
            {t("action.cancel")}
          </button>
          <button onClick={onSubmit} disabled={benchmarkAction !== null} style={{
            ...btnBase,
            background: 'hsl(var(--primary))',
            color: 'hsl(var(--primary-foreground))',
            border: 'none',
          }}>
            {benchmarkAction === "email_json" || benchmarkAction === "email_zip" ? t("doc.benchmarkSending") : t("doc.benchmarkSend")}
          </button>
        </div>
      </div>
    </>
  );
};
