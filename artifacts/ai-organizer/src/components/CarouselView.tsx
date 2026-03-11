import { useState, useRef, useCallback, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { FullscreenPanel } from "./FullscreenPanel";

export type CarouselItem = {
  id: string | number;
  title?: string;
  subtitle?: string;
  content?: string;
  icon?: string;
  renderCard?: () => React.ReactNode;
};

type CarouselViewProps = {
  items: CarouselItem[];
  onPick?: (item: CarouselItem) => void;
  onAction?: (item: CarouselItem, action: string) => void;
  title?: string;
  /** Number of visible cards at a time (auto-calculated if not set) */
  visibleCount?: number;
  /** Show page dots */
  showDots?: boolean;
  /** Show navigation arrows */
  showArrows?: boolean;
  /** Card min width in px */
  cardMinWidth?: number;
  /** Enable keyboard navigation */
  keyboardNav?: boolean;
  /** Additional class name */
  className?: string;
  /** Action buttons per card */
  actions?: { label: string; icon?: string; key: string }[];
  /** Empty state message */
  emptyMessage?: string;
  /** Max height per card (e.g. 'calc(100vh - 300px)') */
  cardMaxHeight?: string;
  /** Show navigation bar with jump/step controls */
  showNavigation?: boolean;
  /** Minimum height for the carousel container */
  containerMinHeight?: string;
};

export function CarouselView({
  items,
  onPick,
  onAction,
  title,
  visibleCount,
  showDots = true,
  showArrows = true,
  cardMinWidth = 280,
  keyboardNav = true,
  className,
  actions,
  emptyMessage,
  cardMaxHeight,
  showNavigation = false,
  containerMinHeight,
}: CarouselViewProps) {
  const { t } = useLanguage();
  const { isDark, colors } = useTheme();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [cardWidth, setCardWidth] = useState(cardMinWidth);
  const [maxVisible, setMaxVisible] = useState(visibleCount ?? 3);
  const [expandedItem, setExpandedItem] = useState<CarouselItem | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const scrollStartRef = useRef(0);
  const hasDraggedRef = useRef(false);

  // Measure container and calculate visible cards
  const measureContainer = useCallback(() => {
    if (!scrollRef.current) return;
    const containerWidth = scrollRef.current.offsetWidth;
    const gap = 16;
    const computed = Math.max(1, Math.floor((containerWidth + gap) / (cardMinWidth + gap)));
    const effective = visibleCount ?? computed;
    setMaxVisible(effective);
    // Adjust card width to fill container evenly
    const totalGap = (effective - 1) * gap;
    setCardWidth(Math.floor((containerWidth - totalGap) / effective));
  }, [cardMinWidth, visibleCount]);

  useEffect(() => {
    measureContainer();
    const ro = new ResizeObserver(measureContainer);
    if (scrollRef.current) ro.observe(scrollRef.current);
    return () => ro.disconnect();
  }, [measureContainer]);

  const totalPages = Math.max(1, Math.ceil(items.length / maxVisible));
  const currentPage = Math.min(Math.floor(activeIndex / maxVisible), totalPages - 1);

  const scrollToIndex = useCallback(
    (index: number) => {
      if (!scrollRef.current) return;
      const gap = 16;
      const targetScroll = index * (cardWidth + gap);
      scrollRef.current.scrollTo({ left: targetScroll, behavior: "smooth" });
      setActiveIndex(index);
    },
    [cardWidth]
  );

  const goToPage = useCallback(
    (page: number) => {
      const clamped = Math.max(0, Math.min(page, totalPages - 1));
      scrollToIndex(clamped * maxVisible);
    },
    [maxVisible, totalPages, scrollToIndex]
  );

  const goNext = useCallback(() => goToPage(currentPage + 1), [currentPage, goToPage]);
  const goPrev = useCallback(() => goToPage(currentPage - 1), [currentPage, goToPage]);

  // Navigation bar helpers
  const [stepSize, setStepSize] = useState(3);
  const jumpToStart = useCallback(() => goToPage(0), [goToPage]);
  const jumpToEnd = useCallback(() => goToPage(totalPages - 1), [goToPage, totalPages]);
  const stepForward = useCallback(() => {
    goToPage(Math.min(currentPage + stepSize, totalPages - 1));
  }, [currentPage, stepSize, totalPages, goToPage]);
  const stepBackward = useCallback(() => {
    goToPage(Math.max(currentPage - stepSize, 0));
  }, [currentPage, stepSize, goToPage]);

  // Sync active index on scroll
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const gap = 16;
    const scrollLeft = scrollRef.current.scrollLeft;
    const idx = Math.round(scrollLeft / (cardWidth + gap));
    setActiveIndex(idx);
  }, [cardWidth]);

  // Mouse drag support for desktop
  const onTrackMouseDown = useCallback((e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    dragStartXRef.current = e.clientX;
    scrollStartRef.current = scrollRef.current.scrollLeft;
    scrollRef.current.style.cursor = 'grabbing';
    scrollRef.current.style.scrollBehavior = 'auto';
  }, []);

  // Global carouselNav event — ArrowLeft/Right dispatched from Home.tsx keyboard handler
  useEffect(() => {
    if (!keyboardNav) return;
    const onNavEvent = (e: Event) => {
      const dir = (e as CustomEvent<{ dir: number }>).detail?.dir;
      if (dir === 1) goNext();
      else if (dir === -1) goPrev();
    };
    window.addEventListener("carouselNav", onNavEvent);
    return () => window.removeEventListener("carouselNav", onNavEvent);
  }, [keyboardNav, goNext, goPrev]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !scrollRef.current) return;
      const dx = e.clientX - dragStartXRef.current;
      if (Math.abs(dx) > 5) hasDraggedRef.current = true;
      scrollRef.current.scrollLeft = scrollStartRef.current - dx;
    };
    const onMouseUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      if (scrollRef.current) {
        scrollRef.current.style.cursor = 'grab';
        scrollRef.current.style.scrollBehavior = 'smooth';
      }
      setTimeout(() => { hasDraggedRef.current = false; }, 10);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!keyboardNav) return;
    const el = scrollRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [keyboardNav, goNext, goPrev]);

  if (items.length === 0) {
    return (
      <div className={`carousel-view ${className || ""}`}>
        {title && <div className="carousel-title">{title}</div>}
        <div className="carousel-empty">{emptyMessage || t("workspace.noSegments")}</div>
      </div>
    );
  }

  return (
    <div className={`carousel-view ${className || ""}`} style={containerMinHeight ? { minHeight: containerMinHeight } : undefined}>
      {/* Header */}
      <div className="carousel-header">
        {title && <div className="carousel-title">{title}</div>}
        <div className="carousel-page-info">
          {currentPage + 1} / {totalPages}
        </div>
      </div>

      {/* Track container */}
      <div className="carousel-wrapper">
        {showArrows && currentPage > 0 && (
          <button
            className="carousel-arrow carousel-arrow--left"
            onClick={goPrev}
            aria-label="Previous"
            type="button"
          >
            ‹
          </button>
        )}

        <div
          className="carousel-track"
          ref={scrollRef}
          onScroll={handleScroll}
          onMouseDown={onTrackMouseDown}
          tabIndex={0}
          role="list"
        >
          {items.map((item, idx) => (
            <div
              key={item.id}
              className={`carousel-card${idx === activeIndex ? " carousel-card--active" : ""}`}
              style={{ minWidth: cardWidth, maxWidth: cardWidth, ...(cardMaxHeight ? { height: cardMaxHeight, maxHeight: cardMaxHeight, overflowY: 'hidden' as const } : {}) }}
              role="listitem"
              onClick={() => { if (!hasDraggedRef.current) setExpandedItem(item); }}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = "copy";
                e.dataTransfer.setData(
                  "application/x-ai-organizer-segment",
                  JSON.stringify({ id: item.id, title: item.title || "", text: item.content || "" })
                );
              }}
            >
              {item.renderCard ? (
                item.renderCard()
              ) : (
                <>
                  <div className="carousel-card-header">
                    {item.icon && <span className="carousel-card-icon">{item.icon}</span>}
                    <span className="carousel-card-title">{item.title || `#${item.id}`}</span>
                    <span className="carousel-card-index">{idx + 1}/{items.length}</span>
                  </div>
                  {item.subtitle && (
                    <div className="carousel-card-subtitle">{item.subtitle}</div>
                  )}
                  <div className="carousel-card-body">
                    {item.content || ""}
                  </div>
                  {actions && actions.length > 0 && (
                    <div className="carousel-card-actions">
                      {actions.map((a) => (
                        <button
                          key={a.key}
                          className="carousel-action-btn"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAction?.(item, a.key);
                          }}
                        >
                          {a.icon && <span>{a.icon}</span>}
                          {a.label}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {showArrows && currentPage < totalPages - 1 && (
          <button
            className="carousel-arrow carousel-arrow--right"
            onClick={goNext}
            aria-label="Next"
            type="button"
          >
            ›
          </button>
        )}
      </div>

      {/* Dots - condensed when many pages */}
      {showDots && totalPages > 1 && (
        <div className="carousel-dots">
          {totalPages <= 12 ? (
            Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                className={`carousel-dot${i === currentPage ? " carousel-dot--active" : ""}`}
                onClick={() => goToPage(i)}
                type="button"
                aria-label={`Page ${i + 1}`}
              />
            ))
          ) : (
            <>
              {[0, 1, 2].filter(i => i < totalPages).map(i => (
                <button key={i} className={`carousel-dot${i === currentPage ? " carousel-dot--active" : ""}`} onClick={() => goToPage(i)} type="button" />
              ))}
              {currentPage > 5 && <span className="carousel-dot-ellipsis">…</span>}
              {Array.from({ length: 5 }, (_, k) => currentPage - 2 + k)
                .filter(i => i > 2 && i < totalPages - 3)
                .map(i => (
                  <button key={i} className={`carousel-dot${i === currentPage ? " carousel-dot--active" : ""}`} onClick={() => goToPage(i)} type="button" />
                ))}
              {currentPage < totalPages - 6 && <span className="carousel-dot-ellipsis">…</span>}
              {[totalPages - 3, totalPages - 2, totalPages - 1].filter(i => i >= 3).map(i => (
                <button key={i} className={`carousel-dot${i === currentPage ? " carousel-dot--active" : ""}`} onClick={() => goToPage(i)} type="button" />
              ))}
            </>
          )}
        </div>
      )}

      {/* Navigation Bar */}
      {showNavigation && totalPages > 1 && (
        <div className="carousel-nav-bar">
          <button className="carousel-nav-btn" onClick={jumpToStart} disabled={currentPage === 0} type="button" title="Jump to start">⏮</button>
          <button className="carousel-nav-btn" onClick={stepBackward} disabled={currentPage === 0} type="button" title={`Back ${stepSize}`}>⏪</button>
          <button className="carousel-nav-btn" onClick={goPrev} disabled={currentPage === 0} type="button" title="Previous">◀</button>
          <div className="carousel-nav-position">
            <span className="carousel-nav-current">{currentPage + 1}</span>
            <span className="carousel-nav-sep">/</span>
            <span className="carousel-nav-total">{totalPages}</span>
          </div>
          <button className="carousel-nav-btn" onClick={goNext} disabled={currentPage >= totalPages - 1} type="button" title="Next">▶</button>
          <button className="carousel-nav-btn" onClick={stepForward} disabled={currentPage >= totalPages - 1} type="button" title={`Forward ${stepSize}`}>⏩</button>
          <button className="carousel-nav-btn" onClick={jumpToEnd} disabled={currentPage >= totalPages - 1} type="button" title="Jump to end">⏭</button>
          <div className="carousel-nav-step">
            <label className="carousel-nav-step-label">Step:</label>
            <input
              className="carousel-nav-step-input"
              type="number"
              min={1}
              max={totalPages}
              value={stepSize}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v) && v >= 1) setStepSize(Math.min(v, totalPages));
              }}
            />
          </div>
        </div>
      )}

      {/* Fullscreen Expanded Panel */}
      {expandedItem && (
        <FullscreenPanel
          item={expandedItem}
          onClose={() => setExpandedItem(null)}
          actions={actions}
          onAction={onAction}
          t={t}
        />
      )}

      <style>{`
        .carousel-view {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
          box-sizing: border-box;
        }
        .carousel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 4px;
        }
        .carousel-title {
          font-size: 14px;
          font-weight: 700;
          color: hsl(var(--foreground));
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .carousel-page-info {
          font-size: 11px;
          color: hsl(var(--muted-foreground));
          font-weight: 500;
          background: hsl(var(--muted));
          padding: 3px 10px;
          border-radius: 999px;
        }
        .carousel-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .carousel-track {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          padding: 8px 4px 12px;
          outline: none;
          cursor: grab;
          user-select: none;
        }
        .carousel-track:active { cursor: grabbing; }
        .carousel-track::-webkit-scrollbar { display: none; }
        .carousel-card {
          flex-shrink: 0;
          scroll-snap-align: start;
          background: hsl(var(--card));
          border: 1px solid hsl(var(--border));
          border-radius: 16px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(12px);
          box-shadow: 0 4px 20px hsl(var(--foreground) / 0.06);
          position: relative;
          overflow: hidden;
        }
        .carousel-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, hsl(var(--primary) / 0.6), hsl(var(--accent) / 0.6));
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .carousel-card:hover {
          border-color: hsl(var(--primary) / 0.4);
          transform: translateY(-4px);
          box-shadow: 0 12px 32px hsl(var(--primary) / 0.12);
        }
        .carousel-card:hover::before { opacity: 1; }
        .carousel-card--active {
          border-color: hsl(var(--primary) / 0.3);
          box-shadow: 0 12px 36px hsl(var(--primary) / 0.1);
          background: hsl(var(--card));
        }
        .carousel-card--active::before { opacity: 1; }
        .carousel-card--active .carousel-card-body { color: hsl(var(--foreground) / 0.85); }
        .carousel-card--active .carousel-card-title { color: hsl(var(--foreground)); }
        /* Force theme-aware colors */
        .carousel-card [style*="color"] {
          color: hsl(var(--foreground)) !important;
        }
        .carousel-card [style*="rgba(255"] {
          color: hsl(var(--muted-foreground)) !important;
        }
        .carousel-card [style*="background"][style*="rgba(255"] {
          background: hsl(var(--muted) / 0.3) !important;
        }
        .carousel-card [style*="border"][style*="rgba(255"] {
          border-color: hsl(var(--border)) !important;
        }
        @media (max-width: 640px) {
          .carousel-card {
            font-size: 12px;
            padding: 12px !important;
          }
          .carousel-card [style*="font-size: 48"] { font-size: 28px !important; }
          .carousel-card [style*="font-size: 32"] { font-size: 22px !important; }
          .carousel-card [style*="padding: 24px"] { padding: 12px !important; }
          .carousel-card [style*="font-size: 18"] { font-size: 14px !important; }
          .carousel-card button { font-size: 11px !important; padding: 5px 8px !important; }
        }
        .carousel-card-header {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .carousel-card-icon { font-size: 18px; flex-shrink: 0; }
        .carousel-card-title {
          font-size: 13px;
          font-weight: 700;
          color: hsl(var(--foreground));
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .carousel-card-index {
          font-size: 10px;
          color: hsl(var(--muted-foreground));
          flex-shrink: 0;
          background: hsl(var(--muted));
          padding: 2px 6px;
          border-radius: 999px;
        }
        .carousel-card-subtitle {
          font-size: 11px;
          color: hsl(var(--muted-foreground));
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .carousel-card-body {
          font-size: 13px;
          color: hsl(var(--muted-foreground));
          line-height: 1.7;
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          min-height: 0;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .carousel-card-actions {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          padding-top: 6px;
          border-top: 1px solid hsl(var(--border));
        }
        .carousel-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border: 1px solid hsl(var(--border));
          border-radius: 999px;
          background: hsl(var(--card));
          color: hsl(var(--foreground));
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .carousel-action-btn:hover {
          background: hsl(var(--primary) / 0.12);
          border-color: hsl(var(--primary) / 0.35);
        }
        .carousel-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 5;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--card));
          color: hsl(var(--foreground));
          font-size: 22px;
          font-weight: 300;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.25s ease;
          backdrop-filter: blur(8px);
          box-shadow: 0 4px 16px hsl(var(--foreground) / 0.08);
        }
        .carousel-arrow:hover {
          background: hsl(var(--primary) / 0.15);
          border-color: hsl(var(--primary) / 0.4);
          transform: translateY(-50%) scale(1.1);
        }
        .carousel-arrow--left { left: -6px; }
        .carousel-arrow--right { right: -6px; }
        .carousel-dots {
          display: flex;
          gap: 6px;
          justify-content: center;
          align-items: center;
          padding: 4px 0;
          max-width: calc(100% - 80px);
          margin: 0 auto;
          overflow: hidden;
        }
        .carousel-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: none;
          background: hsl(var(--muted-foreground) / 0.25);
          cursor: pointer;
          transition: all 0.25s ease;
          padding: 0;
          flex-shrink: 0;
        }
        .carousel-dot:hover {
          background: hsl(var(--muted-foreground) / 0.45);
          transform: scale(1.2);
        }
        .carousel-dot--active {
          background: hsl(var(--primary));
          width: 22px;
          border-radius: 999px;
          box-shadow: 0 0 8px hsl(var(--primary) / 0.4);
        }
        .carousel-dot-ellipsis {
          color: hsl(var(--muted-foreground));
          font-size: 12px;
          line-height: 1;
          user-select: none;
          flex-shrink: 0;
        }
        .carousel-nav-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 0 4px;
          flex-wrap: wrap;
        }
        .carousel-nav-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--card));
          color: hsl(var(--foreground));
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .carousel-nav-btn:hover:not(:disabled) {
          background: hsl(var(--primary) / 0.12);
          border-color: hsl(var(--primary) / 0.3);
        }
        .carousel-nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .carousel-nav-position {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 0 8px;
          font-size: 13px;
          font-weight: 600;
          color: hsl(var(--foreground));
          background: hsl(var(--muted) / 0.5);
          border-radius: 8px;
          min-width: 60px;
          justify-content: center;
        }
        .carousel-nav-sep { color: hsl(var(--muted-foreground)); }
        .carousel-nav-step {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-left: 8px;
          padding-left: 8px;
          border-left: 1px solid hsl(var(--border));
        }
        .carousel-nav-step-label {
          font-size: 11px;
          color: hsl(var(--muted-foreground));
          font-weight: 500;
        }
        .carousel-nav-step-input {
          width: 42px;
          padding: 4px 6px;
          border-radius: 6px;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--card));
          color: hsl(var(--foreground));
          font-size: 12px;
          text-align: center;
          outline: none;
        }
        .carousel-nav-step-input:focus {
          border-color: hsl(var(--primary) / 0.4);
          box-shadow: 0 0 0 3px hsl(var(--primary) / 0.1);
        }
        .carousel-empty {
          text-align: center;
          padding: 40px 20px;
          color: hsl(var(--muted-foreground));
          font-size: 13px;
        }
      `}</style>
    </div>
  );
}
