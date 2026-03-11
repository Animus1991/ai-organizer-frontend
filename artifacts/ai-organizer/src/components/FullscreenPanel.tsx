import { useRef, useCallback, useEffect } from "react";

export type FullscreenPanelItem = {
  id: string | number;
  title?: string;
  subtitle?: string;
  content?: string;
  icon?: string;
  renderCard?: () => React.ReactNode;
};

interface FullscreenPanelProps {
  item: FullscreenPanelItem;
  onClose: () => void;
  actions?: { label: string; icon?: string; key: string }[];
  onAction?: (item: FullscreenPanelItem, action: string) => void;
  t: (key: string) => string;
}

export function FullscreenPanel({ item, onClose, actions, onAction, t }: FullscreenPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const touchDeltaY = useRef(0);
  const isDragging = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchDeltaY.current = 0;
    isDragging.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const dy = e.touches[0].clientY - touchStartY.current;
    touchDeltaY.current = dy;
    if (dy > 10) {
      isDragging.current = true;
      if (panelRef.current) {
        const progress = Math.min(dy / 300, 1);
        panelRef.current.style.transform = `translateY(${dy * 0.5}px)`;
        panelRef.current.style.opacity = String(1 - progress * 0.4);
      }
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (isDragging.current && touchDeltaY.current > 100) {
      onClose();
    } else if (panelRef.current) {
      panelRef.current.style.transform = "";
      panelRef.current.style.opacity = "";
    }
    isDragging.current = false;
  }, [onClose]);

  // ESC key to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fs-overlay" onClick={onClose}>
      <div
        ref={panelRef}
        className="fs-panel"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Swipe indicator for mobile */}
        <div className="fs-swipe-hint">
          <div className="fs-swipe-bar" />
        </div>

        <button
          className="fs-back"
          onClick={onClose}
          type="button"
          title={t("workspace.back") || "Back"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span>Πίσω</span>
        </button>

        <div className="fs-header">
          {item.icon && <span style={{ fontSize: 24 }}>{item.icon}</span>}
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "hsl(var(--foreground))", margin: 0 }}>
            {item.title || `#${item.id}`}
          </h2>
          {item.subtitle && (
            <span style={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }}>{item.subtitle}</span>
          )}
        </div>

        <div className="fs-body">
          {item.renderCard ? item.renderCard() : (
            <div style={{ fontSize: 14, lineHeight: 1.8, color: "hsl(var(--foreground))" }}>
              {item.content}
            </div>
          )}
        </div>

        {actions && actions.length > 0 && (
          <div className="fs-actions">
            {actions.map((a) => (
              <button
                key={a.key}
                className="fs-action-btn"
                type="button"
                onClick={() => onAction?.(item, a.key)}
              >
                {a.icon && <span>{a.icon}</span>}
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .fs-overlay {
          position: fixed;
          inset: 0;
          z-index: 10000;
          background: hsl(var(--background));
          display: flex;
          flex-direction: column;
          animation: fs-fade-in 0.25s ease;
        }
        @keyframes fs-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .fs-panel {
          width: 100%;
          height: 100%;
          background: hsl(var(--card));
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: transform 0.2s ease, opacity 0.2s ease;
        }
        .fs-swipe-hint {
          display: flex;
          justify-content: center;
          padding: 8px 0 4px;
          flex-shrink: 0;
        }
        .fs-swipe-bar {
          width: 36px;
          height: 4px;
          border-radius: 2px;
          background: hsl(var(--muted-foreground) / 0.3);
        }
        @media (min-width: 768px) {
          .fs-swipe-hint { display: none; }
        }
        .fs-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin: 8px 16px 0;
          padding: 6px 14px;
          border-radius: 10px;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--muted) / 0.3);
          color: hsl(var(--muted-foreground));
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          align-self: flex-start;
        }
        .fs-back:hover {
          background: hsl(var(--primary) / 0.1);
          border-color: hsl(var(--primary) / 0.3);
          color: hsl(var(--foreground));
        }
        .fs-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px 12px;
          border-bottom: 1px solid hsl(var(--border));
          flex-shrink: 0;
        }
        .fs-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          min-height: 0;
        }
        .fs-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          padding: 12px 20px 16px;
          border-top: 1px solid hsl(var(--border));
          flex-shrink: 0;
        }
        .fs-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 14px;
          border: 1px solid hsl(var(--border));
          border-radius: 999px;
          background: hsl(var(--muted) / 0.2);
          color: hsl(var(--muted-foreground));
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .fs-action-btn:hover {
          background: hsl(var(--primary) / 0.12);
          border-color: hsl(var(--primary) / 0.35);
          color: hsl(var(--foreground));
        }
      `}</style>
    </div>
  );
}
