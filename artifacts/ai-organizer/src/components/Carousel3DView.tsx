import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { FullscreenPanel } from "./FullscreenPanel";

export type Carousel3DItem = {
  id: string | number;
  title?: string;
  subtitle?: string;
  content?: string;
  icon?: string;
  renderCard?: () => React.ReactNode;
};

type Carousel3DViewProps = {
  items: Carousel3DItem[];
  onPick?: (item: Carousel3DItem) => void;
  onDoubleClick?: (item: Carousel3DItem) => void;
  onTripleClick?: (item: Carousel3DItem) => void;
  onAction?: (item: Carousel3DItem, action: string) => void;
  title?: string;
  /** Card width in px (center card) */
  cardWidth?: number;
  /** Card height in px or css string */
  cardHeight?: string;
  /** Enable keyboard navigation */
  keyboardNav?: boolean;
  /** Additional class name */
  className?: string;
  /** Action buttons per card */
  actions?: {label: string;icon?: string;key: string;}[];
  /** Empty state message */
  emptyMessage?: string;
  /** Show navigation dots */
  showDots?: boolean;
  /** Show navigation arrows */
  showArrows?: boolean;
  /** Show navigation bar with jump/step controls */
  showNavigation?: boolean;
  /** Show step size controls in navigation bar (default true) */
  showStep?: boolean;
  /** Scale factor for side cards (0-1) */
  sideScale?: number;
  /** Rotation angle in degrees for side cards */
  sideRotation?: number;
  /** How far side cards are offset horizontally (px) */
  sideOffset?: number;
  /** Enable auto-play */
  autoPlay?: boolean;
  /** Auto-play interval in ms */
  autoPlayInterval?: number;
};

export function Carousel3DView({
  items,
  onPick,
  onDoubleClick,
  onTripleClick,
  onAction,
  title,
  cardWidth: propCardWidth,
  cardHeight = "auto",
  keyboardNav = true,
  className,
  actions,
  emptyMessage,
  showDots = true,
  showArrows = true,
  showNavigation = false,
  showStep = true,
  sideScale = 0.75,
  sideRotation = 35,
  sideOffset: propSideOffset,
  autoPlay = false,
  autoPlayInterval = 5000
}: Carousel3DViewProps) {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragDelta, setDragDelta] = useState(0);
  const [containerWidth, setContainerWidth] = useState(800);
  const [stepSize, setStepSize] = useState(3);
  const [expandedItem, setExpandedItem] = useState<Carousel3DItem | null>(null);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickCountRef = useRef(0);
  const hasDraggedRef = useRef(false);
  const isDraggingRef = useRef(false);
  const mouseDownRef = useRef(false);
  const mouseStartXRef = useRef(0);
  const dragStartXRef = useRef(0);

  // Responsive card width
  const cardWidth = useMemo(() => {
    if (propCardWidth) return propCardWidth;
    return Math.min(Math.max(containerWidth * 0.55, 280), 600);
  }, [propCardWidth, containerWidth]);

  const sideOffset = useMemo(() => {
    if (propSideOffset) return propSideOffset;
    return cardWidth * 0.62;
  }, [propSideOffset, cardWidth]);

  // Measure container
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Auto-play
  useEffect(() => {
    if (!autoPlay || items.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length);
    }, autoPlayInterval);
    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, items.length]);

  // Keyboard navigation — local (when container focused) + global carouselNav event
  useEffect(() => {
    if (!keyboardNav) return;
    const el = containerRef.current;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {e.preventDefault();goNext();} else
      if (e.key === "ArrowLeft") {e.preventDefault();goPrev();}
    };
    const onNavEvent = (e: Event) => {
      const dir = (e as CustomEvent<{dir: number;}>).detail?.dir;
      if (dir === 1) goNext();else
      if (dir === -1) goPrev();
    };
    if (el) el.addEventListener("keydown", onKey);
    window.addEventListener("carouselNav", onNavEvent);
    return () => {
      if (el) el.removeEventListener("keydown", onKey);
      window.removeEventListener("carouselNav", onNavEvent);
    };
  }, [keyboardNav, activeIndex, items.length]);

  const goNext = useCallback(() => {
    setActiveIndex((prev) => Math.min(prev + 1, items.length - 1));
  }, [items.length]);

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const goTo = useCallback((idx: number) => {
    setActiveIndex(Math.max(0, Math.min(idx, items.length - 1)));
  }, [items.length]);

  // Touch/mouse drag handling - ALL refs to avoid stale closure bugs
  const DRAG_THRESHOLD = 8;

  const finishDrag = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const currentDelta = dragDelta;
    const threshold = cardWidth * 0.2;
    if (currentDelta < -threshold) {
      goNext();
    } else if (currentDelta > threshold) {
      goPrev();
    }
    setDragDelta(0);
    setTimeout(() => {hasDraggedRef.current = false;}, 10);
  }, [dragDelta, cardWidth, goNext, goPrev]);

  // Mouse events - use refs for immediate values, state only for render
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    mouseDownRef.current = true;
    mouseStartXRef.current = e.clientX;
    hasDraggedRef.current = false;
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!mouseDownRef.current) return;
    const dx = e.clientX - mouseStartXRef.current;
    if (!isDraggingRef.current && Math.abs(dx) > DRAG_THRESHOLD) {
      isDraggingRef.current = true;
      dragStartXRef.current = mouseStartXRef.current;
      hasDraggedRef.current = true;
    }
    if (isDraggingRef.current) {
      setDragDelta(e.clientX - dragStartXRef.current);
    }
  }, []);

  const onMouseUp = useCallback(() => {
    mouseDownRef.current = false;
    finishDrag();
  }, [finishDrag]);

  const onMouseLeave = useCallback(() => {
    mouseDownRef.current = false;
    finishDrag();
  }, [finishDrag]);

  // Touch events
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    mouseStartXRef.current = e.touches[0].clientX;
    hasDraggedRef.current = false;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - mouseStartXRef.current;
    if (!isDraggingRef.current && Math.abs(dx) > DRAG_THRESHOLD) {
      isDraggingRef.current = true;
      dragStartXRef.current = mouseStartXRef.current;
      hasDraggedRef.current = true;
    }
    if (isDraggingRef.current) {
      setDragDelta(e.touches[0].clientX - dragStartXRef.current);
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    finishDrag();
  }, [finishDrag]);

  // Navigation helpers
  const jumpToStart = useCallback(() => setActiveIndex(0), []);
  const jumpToEnd = useCallback(() => setActiveIndex(Math.max(0, items.length - 1)), [items.length]);
  const stepForward = useCallback(() => {
    setActiveIndex((prev) => Math.min(prev + stepSize, items.length - 1));
  }, [stepSize, items.length]);
  const stepBackward = useCallback(() => {
    setActiveIndex((prev) => Math.max(prev - stepSize, 0));
  }, [stepSize]);

  // Calculate transform for each card based on its position relative to active
  const getCardStyle = useCallback((index: number): React.CSSProperties => {
    const diff = index - activeIndex;
    const dragInfluence = isDraggingRef.current ? dragDelta / cardWidth : 0;
    const effectiveDiff = diff + dragInfluence;
    const absDiff = Math.abs(effectiveDiff);

    // Scale: center = 1, sides decrease
    const scale = Math.max(0.5, 1 - absDiff * (1 - sideScale));

    // Z position: center is closest
    const zTranslate = -absDiff * 120;

    // X position
    const xTranslate = effectiveDiff * sideOffset;

    // Y rotation: cards rotate toward center
    const yRotation = effectiveDiff * -sideRotation;
    const clampedRotation = Math.max(-60, Math.min(60, yRotation));

    // Opacity: fade out distant cards
    const opacity = absDiff > 2.5 ? 0 : Math.max(0.3, 1 - absDiff * 0.25);

    // Z-index: center card on top
    const zIndex = items.length - Math.round(absDiff);

    return {
      position: "absolute" as const,
      width: cardWidth,
      height: cardHeight === "auto" ? undefined : cardHeight,
      left: "50%",
      top: "47%",
      transform: `
        translate(-50%, -50%)
        translateX(${xTranslate}px)
        translateZ(${zTranslate}px)
        rotateY(${clampedRotation}deg)
        scale(${scale})
      `,
      zIndex,
      opacity,
      transition: isDraggingRef.current ? "none" : "all 0.5s cubic-bezier(0.32, 0.72, 0, 1)",
      cursor: "pointer",
      pointerEvents: absDiff > 2.5 ? "none" as const : "auto" as const
    };
  }, [activeIndex, dragDelta, cardWidth, cardHeight, sideScale, sideRotation, sideOffset, items.length]);

  if (items.length === 0) {
    return (
      <div className={`c3d-view ${className || ""}`}>
        {title && <div className="c3d-title">{title}</div>}
        <div className="c3d-empty">{emptyMessage || t("workspace.noSegments")}</div>
        <style>{getCarousel3DStyles(isDark)}</style>
      </div>);

  }

  return (
    <div className={`c3d-view ${className || ""}`}>
      {/* Header */}
      {title &&
      <div className="c3d-header">
          <div className="c3d-title">{title}</div>
          <div className="c3d-counter">
            {activeIndex + 1} / {items.length}
          </div>
        </div>
      }

      {/* 3D Stage */}
      <div
        className="c3d-stage"
        ref={containerRef}
        tabIndex={0}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ minHeight: cardHeight === "auto" ? 780 : undefined, height: cardHeight !== "auto" ? `calc(${cardHeight} + 60px)` : undefined }}>
        
        <div className="c3d-perspective">
          {items.map((item, idx) => {
            const diff = Math.abs(idx - activeIndex);
            if (diff > 3) return null; // Only render nearby cards for performance
            return (
              <div
                key={item.id}
                className={`c3d-card${idx === activeIndex ? " c3d-card--active" : ""}`}
                style={getCardStyle(idx)}
                onClick={() => {
                  if (hasDraggedRef.current) return;
                  if (idx !== activeIndex) {
                    goTo(idx);
                    return;
                  }
                  clickCountRef.current += 1;
                  if (clickCountRef.current === 1) {
                    clickTimerRef.current = setTimeout(() => {
                      if (clickCountRef.current === 1) {
                        setExpandedItem(item);
                      }
                      clickCountRef.current = 0;
                    }, 320);
                  } else if (clickCountRef.current === 2) {
                    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
                    clickTimerRef.current = setTimeout(() => {
                      if (clickCountRef.current === 2) {
                        onDoubleClick?.(item);
                      }
                      clickCountRef.current = 0;
                    }, 320);
                  } else if (clickCountRef.current >= 3) {
                    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
                    clickCountRef.current = 0;
                    onTripleClick?.(item);
                  }
                }}
                draggable={idx === activeIndex}
                onDragStart={(e) => {
                  if (idx !== activeIndex) return;
                  e.dataTransfer.effectAllowed = "copy";
                  e.dataTransfer.setData(
                    "application/x-ai-organizer-segment",
                    JSON.stringify({ id: item.id, title: item.title || "", text: item.content || "" })
                  );
                }}>
                
                {/* Glow effect for active card */}
                {idx === activeIndex && <div className="c3d-card-glow" />}

                {item.renderCard ?
                <div className="c3d-card-custom">{item.renderCard()}</div> :

                <>
                    <div className="c3d-card-header">
                      {item.icon && <span className="c3d-card-icon">{item.icon}</span>}
                      <span className="c3d-card-title">{item.title || `#${item.id}`}</span>
                      <span className="c3d-card-index">{idx + 1}/{items.length}</span>
                    </div>
                    {item.subtitle &&
                  <div className="c3d-card-subtitle">{item.subtitle}</div>
                  }
                    <div className="c3d-card-body">
                      {item.content ?
                    item.content :
                    ""}
                    </div>
                    {actions && actions.length > 0 &&
                  <div className="c3d-card-actions">
                        {actions.map((a) =>
                    <button
                      key={a.key}
                      className="c3d-action-btn"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAction?.(item, a.key);
                      }}>
                      
                            {a.icon && <span>{a.icon}</span>}
                            {a.label}
                          </button>
                    )}
                      </div>
                  }
                  </>
                }

                {/* Panel name label */}
                {item.title &&
                <div className="c3d-card-label">{item.icon ? `${item.icon} ` : ''}{item.title}</div>
                }

                {/* Reflection effect */}
                <div className="c3d-card-reflection" />
              </div>);

          })}
        </div>

        {/* Navigation Arrows */}
        {showArrows && activeIndex > 0 &&
        <button
          className="c3d-arrow c3d-arrow--left"
          onClick={(e) => {e.stopPropagation();goPrev();}}
          aria-label="Previous"
          type="button">
          
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        }
        {showArrows && activeIndex < items.length - 1 &&
        <button
          className="c3d-arrow c3d-arrow--right"
          onClick={(e) => {e.stopPropagation();goNext();}}
          aria-label="Next"
          type="button">
          
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        }
      </div>

      {/* Progress dots - condensed when many items */}
      {showDots && items.length > 1 &&
      <div className="c3d-dots">
          {items.length <= 20 ?
        items.map((_, i) =>
        <button
          key={i}
          className={`c3d-dot${i === activeIndex ? " c3d-dot--active" : ""}`}
          onClick={() => goTo(i)}
          type="button"
          aria-label={`Go to ${i + 1}`} />

        ) :

        <>
              {/* Show first, nearby, and last dots for large sets */}
              {[0, 1, 2].filter((i) => i < items.length).map((i) =>
          <button key={i} className={`c3d-dot${i === activeIndex ? " c3d-dot--active" : ""}`} onClick={() => goTo(i)} type="button" />
          )}
              {activeIndex > 5 && <span className="c3d-dot-ellipsis">…</span>}
              {Array.from({ length: 5 }, (_, k) => activeIndex - 2 + k).
          filter((i) => i > 2 && i < items.length - 3).
          map((i) =>
          <button key={i} className={`c3d-dot${i === activeIndex ? " c3d-dot--active" : ""}`} onClick={() => goTo(i)} type="button" />
          )}
              {activeIndex < items.length - 6 && <span className="c3d-dot-ellipsis">…</span>}
              {[items.length - 3, items.length - 2, items.length - 1].filter((i) => i >= 3).map((i) =>
          <button key={i} className={`c3d-dot${i === activeIndex ? " c3d-dot--active" : ""}`} onClick={() => goTo(i)} type="button" />
          )}
            </>
        }
        </div>
      }

      {/* Navigation Bar */}
      {showNavigation && items.length > 1 &&
      <div className="c3d-nav-bar rounded">
          <button className="c3d-nav-btn" onClick={jumpToStart} disabled={activeIndex === 0} type="button" title="Jump to start">⏮</button>
          {showStep && <button className="c3d-nav-btn" onClick={stepBackward} disabled={activeIndex === 0} type="button" title={`Back ${stepSize}`}>⏪</button>}
          <button className="c3d-nav-btn" onClick={goPrev} disabled={activeIndex === 0} type="button" title="Previous">◀</button>
          <div className="c3d-nav-position">
            <span className="c3d-nav-current">{activeIndex + 1}</span>
            <span className="c3d-nav-sep">/</span>
            <span className="c3d-nav-total">{items.length}</span>
          </div>
          <button className="c3d-nav-btn" onClick={goNext} disabled={activeIndex >= items.length - 1} type="button" title="Next">▶</button>
          {showStep && <button className="c3d-nav-btn" onClick={stepForward} disabled={activeIndex >= items.length - 1} type="button" title={`Forward ${stepSize}`}>⏩</button>}
          <button className="c3d-nav-btn" onClick={jumpToEnd} disabled={activeIndex >= items.length - 1} type="button" title="Jump to end">⏭</button>
          {showStep &&
        <div className="c3d-nav-step">
              <label className="c3d-nav-step-label">Step:</label>
              <input
            className="c3d-nav-step-input"
            type="number"
            min={1}
            max={items.length}
            value={stepSize}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v) && v >= 1) setStepSize(Math.min(v, items.length));
            }}
            onPointerDown={(e) => e.stopPropagation()} />
          
            </div>
        }
        </div>
      }

      {/* Active card info bar */}
      {items[activeIndex] &&
      <div className="c3d-info-bar">
          <span className="c3d-info-icon">{items[activeIndex].icon || "📄"}</span>
          <span className="c3d-info-title">{items[activeIndex].title || `Item ${activeIndex + 1}`}</span>
          {items[activeIndex].subtitle &&
        <span className="c3d-info-subtitle">{items[activeIndex].subtitle}</span>
        }
        </div>
      }

      {/* Fullscreen Expanded Panel */}
      {expandedItem &&
      <FullscreenPanel
        item={expandedItem}
        onClose={() => setExpandedItem(null)}
        actions={actions}
        onAction={onAction}
        t={t} />

      }

      <style>{getCarousel3DStyles(isDark)}</style>
    </div>);

}

const carousel3DStyles = `
  .c3d-view {
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
    box-sizing: border-box;
  }

  .c3d-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 8px;
  }

  .c3d-title {
    font-size: 15px;
    font-weight: 700;
    color: hsl(var(--foreground));
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .c3d-counter {
    font-size: 11px;
    color: hsl(var(--muted-foreground));
    font-weight: 600;
    background: hsl(var(--muted) / 0.3);
    padding: 4px 12px;
    border-radius: 999px;
    border: 1px solid hsl(var(--border));
  }

  .c3d-stage {
    position: relative;
    width: 100%;
    min-height: 872px;
    overflow: hidden;

  @media (max-width: 640px) {
    min-height: 1020px;
  }
    cursor: grab;
    user-select: none;
    outline: none;
    border-radius: 16px;

        .c3d-perspective {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: inherit;
          perspective: 1200px;
          perspective-origin: 50% 50%;
          transform-style: preserve-3d;
        }

        .c3d-card {
          position: absolute;
          top: 50%;
          left: 50%;
          border-radius: 20px;
          background: hsl(var(--card));
          border: 1px solid hsl(var(--border));
          backdrop-filter: blur(16px);
          box-shadow: 0 8px 32px hsl(var(--foreground) / 0.1);
          overflow: hidden;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
        }
    perspective-origin: 50% 50%;
    transform-style: preserve-3d;
  }

  .c3d-card--active {
    background: hsl(var(--card)) !important;
    border: 1.5px solid hsl(var(--primary) / 0.35);
    border-radius: 20px;
    filter: saturate(1.0) brightness(1.0);
    color: hsl(var(--foreground)) !important;
    box-shadow:
      0 0 0 1px hsl(var(--primary) / 0.08),
      0 28px 80px hsl(var(--foreground) / 0.15),
      0 12px 36px hsl(var(--foreground) / 0.1),
      0 0 40px hsl(var(--primary) / 0.06),
      inset 0 1px 0 hsl(var(--border) / 0.5),
      inset 0 -1px 0 hsl(var(--primary) / 0.06);
    position: relative;
  }

  /* Force theme-aware colors on ALL cards */
  .c3d-card .c3d-card-custom [style*="color"] {
    color: hsl(var(--foreground)) !important;
  }
  .c3d-card .c3d-card-custom [style*="rgba(255"] {
    color: hsl(var(--muted-foreground)) !important;
  }
  .c3d-card .c3d-card-custom [style*="background"][style*="rgba(255"] {
    background: hsl(var(--muted) / 0.3) !important;
  }
  .c3d-card .c3d-card-custom [style*="border"][style*="rgba(255"] {
    border-color: hsl(var(--border)) !important;
  }

  .c3d-card--active,
  .c3d-card--active .c3d-card-custom,
  .c3d-card--active .c3d-card-custom * {
    color: hsl(var(--foreground)) !important;
  }

  .c3d-card--active .c3d-card-custom [style*="background"] {
    background: transparent !important;
  }
  .c3d-card--active .c3d-card-custom > [style*="background"] {
    background: transparent !important;
    border-color: hsl(var(--border)) !important;
  }
  .c3d-card--active .c3d-card-custom [style*="Background"] {
    background: transparent !important;
  }

  /* Mobile-optimized card content */
  @media (max-width: 640px) {
    .c3d-card .c3d-card-custom {
      font-size: 12px;
    }
    .c3d-card .c3d-card-custom [style*="font-size: 48"] {
      font-size: 28px !important;
    }
    .c3d-card .c3d-card-custom [style*="font-size: 32"] {
      font-size: 22px !important;
    }
    .c3d-card .c3d-card-custom [style*="padding: 24px"] {
      padding: 12px !important;
    }
    .c3d-card .c3d-card-custom [style*="padding: 20px"] {
      padding: 10px !important;
    }
    .c3d-card .c3d-card-custom [style*="gap: 12px"] {
      gap: 8px !important;
    }
    .c3d-card .c3d-card-custom [style*="font-size: 18"] {
      font-size: 14px !important;
    }
    .c3d-card .c3d-card-custom [style*="marginBottom: 20"] {
      margin-bottom: 10px !important;
    }
    .c3d-card .c3d-card-custom button {
      font-size: 11px !important;
      padding: 5px 8px !important;
    }
  }

  .c3d-card--active::before {
    content: '';
    position: absolute;
    top: -2px; left: -2px; right: -2px; bottom: -2px;
    border-radius: 22px;
    background: linear-gradient(145deg, hsl(var(--primary) / 0.22), hsl(var(--primary) / 0.12), hsl(var(--primary) / 0.18));
    z-index: -2;
    pointer-events: none;
  }

  .c3d-card-glow {
    position: absolute;
    top: -6px; left: -6px; right: -6px; bottom: -6px;
    border-radius: 26px;
    background: radial-gradient(ellipse at 50% 0%, hsl(var(--primary) / 0.12), transparent 55%),
               radial-gradient(ellipse at 50% 100%, hsl(var(--primary) / 0.06), transparent 55%);
    z-index: -1;
    animation: c3d-glow-pulse 3s ease-in-out infinite;
    pointer-events: none;
    filter: blur(8px);
  }

  @keyframes c3d-glow-pulse {
    0%, 100% { opacity: 0.4; transform: scale(1); }
    50% { opacity: 0.85; transform: scale(1.005); }
  }

  .c3d-card-reflection {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 40%;
    background: linear-gradient(to bottom, transparent, hsl(var(--card) / 0.05));
    pointer-events: none;
    border-radius: 0 0 20px 20px;
  }

  .c3d-card-custom {
    padding: 0;
    overflow-y: auto;
    max-height: calc(100% - 4px);
    pointer-events: auto;
    background: hsl(var(--card));
    flex: 1;
  }

  .c3d-card-label {
    padding: 8px 16px 10px;
    font-size: 12px;
    font-weight: 600;
    color: hsl(var(--muted-foreground));
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: center;
    border-top: 1px solid hsl(var(--border) / 0.3);
    background: hsl(var(--card));
    flex-shrink: 0;
  }

  .c3d-card--active .c3d-card-label {
    color: hsl(var(--foreground));
    font-weight: 700;
    border-top-color: hsl(var(--border) / 0.5);
    background: transparent;
  }

  .c3d-card-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 20px 22px 12px;
    background: transparent;
  }

  .c3d-card--active .c3d-card-header {
    background: transparent;
    border-bottom: 1px solid hsl(var(--border) / 0.3);
  }

  .c3d-card-icon {
    font-size: 22px;
    flex-shrink: 0;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
  }

  .c3d-card-title {
    font-size: 15px;
    font-weight: 700;
    color: hsl(var(--foreground));
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    letter-spacing: -0.01em;
  }

  .c3d-card-index {
    font-size: 10px;
    color: hsl(var(--muted-foreground));
    flex-shrink: 0;
    background: hsl(var(--muted) / 0.3);
    padding: 3px 8px;
    border-radius: 999px;
    font-weight: 600;
  }

  .c3d-card-subtitle {
    font-size: 12px;
    color: hsl(var(--muted-foreground));
    padding: 0 20px 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .c3d-card-body {
    font-size: 13px;
    color: hsl(var(--muted-foreground));
    line-height: 1.7;
    padding: 8px 22px 16px;
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    min-height: 0;
  }

  .c3d-card--active .c3d-card-title {
    color: hsl(var(--foreground));
  }

  .c3d-card--active .c3d-card-body {
    color: hsl(var(--foreground) / 0.85);
    line-height: 1.8;
  }

  .c3d-card--active .c3d-card-subtitle {
    color: hsl(var(--muted-foreground));
  }

  .c3d-card--active .c3d-card-icon {
    filter: drop-shadow(0 2px 6px hsl(var(--foreground) / 0.15)) brightness(1.1);
  }

  .c3d-card-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    padding: 12px 20px 16px;
    border-top: 1px solid hsl(var(--border) / 0.3);
  }

  .c3d-action-btn {
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

  .c3d-action-btn:hover {
    background: hsl(var(--primary) / 0.12);
    border-color: hsl(var(--primary) / 0.35);
    color: hsl(var(--foreground));
    transform: translateY(-1px);
  }

  /* Navigation Arrows */
  .c3d-arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 100;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 1px solid hsl(var(--border));
    background: hsl(var(--card) / 0.9);
    color: hsl(var(--foreground));
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.32, 0.72, 0, 1);
    backdrop-filter: blur(12px);
    box-shadow: 0 4px 20px hsl(var(--foreground) / 0.1);
  }

  .c3d-arrow:hover {
    background: hsl(var(--primary) / 0.15);
    border-color: hsl(var(--primary) / 0.4);
    transform: translateY(-50%) scale(1.12);
    box-shadow: 0 8px 28px hsl(var(--primary) / 0.15);
  }

  .c3d-arrow--left {
    left: 16px;
  }

  .c3d-arrow--right {
    right: 16px;
  }

  /* Dots */
  .c3d-dots {
    display: flex;
    gap: 4px;
    justify-content: center;
    align-items: center;
    padding: 4px 20px;
    max-width: calc(100% - 40px);
    margin: 0 auto;
    flex-wrap: wrap;
  }

  @media (max-width: 640px) {
    .c3d-dots {
      display: none;
    }
  }

  .c3d-dot-ellipsis {
    color: hsl(var(--muted-foreground));
    font-size: 12px;
    padding: 0 2px;
    user-select: none;
  }

  .c3d-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    border: none;
    background: hsl(var(--muted-foreground) / 0.2);
    cursor: pointer;
    transition: all 0.35s cubic-bezier(0.32, 0.72, 0, 1);
    padding: 0;
  }

  .c3d-dot:hover {
    background: hsl(var(--muted-foreground) / 0.5);
    transform: scale(1.3);
  }

  .c3d-dot--active {
    background: hsl(var(--primary) / 0.5);
    width: 20px;
    border-radius: 999px;
    box-shadow: 0 0 6px hsl(var(--primary) / 0.2);
  }

  /* Info Bar */
  .c3d-info-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    background: hsl(var(--primary) / 0.06);
    border: 1px solid hsl(var(--border));
    border-radius: 12px;
    backdrop-filter: blur(8px);
  }

  .c3d-info-icon {
    font-size: 18px;
    flex-shrink: 0;
  }

  .c3d-info-title {
    font-size: 13px;
    font-weight: 700;
    color: hsl(var(--foreground));
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .c3d-info-subtitle {
    font-size: 11px;
    color: hsl(var(--muted-foreground));
    flex-shrink: 0;
  }

  .c3d-empty {
    text-align: center;
    padding: 60px 20px;
    color: hsl(var(--muted-foreground));
    font-size: 14px;
    font-weight: 500;
  }

  /* Navigation Bar */
  .c3d-nav-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 16px;
    background: hsl(var(--muted) / 0.2);
    border: 1px solid hsl(var(--border));
    border-radius: 12px;
    flex-wrap: wrap;
  }

  .c3d-nav-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 1px solid hsl(var(--border));
    background: hsl(var(--muted) / 0.2);
    color: hsl(var(--muted-foreground));
    font-size: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    padding: 0;
  }

  .c3d-nav-btn:hover:not(:disabled) {
    background: hsl(var(--primary) / 0.12);
    border-color: hsl(var(--primary) / 0.35);
    color: hsl(var(--foreground));
    transform: scale(1.05);
  }

  .c3d-nav-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .c3d-nav-position {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 12px;
    background: hsl(var(--muted) / 0.3);
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    min-width: 60px;
    justify-content: center;
  }

  .c3d-nav-current {
    color: hsl(var(--foreground));
  }

  .c3d-nav-sep {
    color: hsl(var(--muted-foreground));
  }

  .c3d-nav-total {
    color: hsl(var(--muted-foreground));
  }

  .c3d-nav-step {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-left: 8px;
    padding-left: 8px;
    border-left: 1px solid hsl(var(--border));
  }

  .c3d-nav-step-label {
    font-size: 11px;
    color: hsl(var(--muted-foreground));
    font-weight: 500;
  }

  .c3d-nav-step-input {
    width: 44px;
    height: 28px;
    border-radius: 6px;
    border: 1px solid hsl(var(--border));
    background: hsl(var(--card));
    color: hsl(var(--foreground));
    font-size: 13px;
    font-weight: 600;
    text-align: center;
    outline: none;
    padding: 0 4px;
    -moz-appearance: textfield;
  }

  .c3d-nav-step-input::-webkit-inner-spin-button,
  .c3d-nav-step-input::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  .c3d-nav-step-input:focus {
    border-color: hsl(var(--primary) / 0.4);
    box-shadow: 0 0 8px hsl(var(--primary) / 0.15);
  }

  /* Fullscreen styles are now in FullscreenPanel component */
`;
// Light/Dark theme-aware CSS: return dark base styles or append light-mode overrides
const getCarousel3DStyles = (isDark: boolean) => {
  // Replace hardcoded dark card backgrounds with HSL tokens
  const tokenized = carousel3DStyles.
  replace(/background:\s*linear-gradient\(145deg,\s*rgba\(20,\s*24,\s*36,\s*0\.95\)\s*0%,\s*rgba\(12,\s*16,\s*24,\s*0\.98\)\s*100%\)/g,
  'background: hsl(var(--card))').
  replace(/background:\s*linear-gradient\(165deg,\s*rgba\(20,\s*24,\s*40,\s*0\.99\)\s*0%,\s*rgba\(12,\s*14,\s*28,\s*1\)\s*100%\)/g,
  'background: hsl(var(--card))').
  replace(/border:\s*1px solid rgba\(255,255,255,0\.08\)/g,
  'border: 1px solid hsl(var(--border))').
  replace(/border:\s*1\.5px solid rgba\(180,\s*195,\s*220,\s*0\.35\)/g,
  'border: 1.5px solid hsl(var(--primary) / 0.3)').
  replace(/color:\s*rgba\(255,255,255,0\.9\)/g, 'color: hsl(var(--foreground))').
  replace(/color:\s*rgba\(255,255,255,0\.5\)/g, 'color: hsl(var(--muted-foreground))').
  replace(/color:\s*rgba\(255,255,255,0\.92\)/g, 'color: hsl(var(--foreground))').
  replace(/color:\s*rgba\(255,255,255,0\.75\)/g, 'color: hsl(var(--foreground) / 0.75)').
  replace(/color:\s*rgba\(255,255,255,0\.7\)/g, 'color: hsl(var(--muted-foreground))').
  replace(/color:\s*rgba\(255,255,255,0\.6\)/g, 'color: hsl(var(--muted-foreground))').
  replace(/color:\s*rgba\(255,255,255,0\.45\)/g, 'color: hsl(var(--muted-foreground))').
  replace(/color:\s*rgba\(255,255,255,0\.35\)/g, 'color: hsl(var(--muted-foreground))').
  replace(/color:\s*rgba\(255,255,255,0\.4\)/g, 'color: hsl(var(--muted-foreground))').
  replace(/background:\s*rgba\(255,255,255,0\.06\)/g, 'background: hsl(var(--muted))').
  replace(/background:\s*rgba\(255,255,255,0\.04\)/g, 'background: hsl(var(--muted) / 0.5)').
  replace(/background:\s*rgba\(255,255,255,0\.15\)/g, 'background: hsl(var(--muted-foreground) / 0.25)').
  replace(/border-top:\s*1px solid rgba\(255,255,255,0\.04\)/g, 'border-top: 1px solid hsl(var(--border))').
  replace(/border-top-color:\s*rgba\(255,255,255,0\.08\)/g, 'border-top-color: hsl(var(--border))').
  replace(/border:\s*1px solid rgba\(255,255,255,0\.1\)/g, 'border: 1px solid hsl(var(--border))').
  replace(/border:\s*1px solid rgba\(255,255,255,0\.15\)/g, 'border: 1px solid hsl(var(--border))').
  replace(/border-left:\s*1px solid rgba\(255,255,255,0\.08\)/g, 'border-left: 1px solid hsl(var(--border))');

  // Light mode overrides no longer needed — base styles now use HSL tokens
  return tokenized;
};