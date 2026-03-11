import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import html2canvas from 'html2canvas';
import "./UniversalTourGuide.css";
import { useLanguage } from '../context/LanguageContext';
import { useIsAdmin } from '../hooks/useIsAdmin';

export interface TourStep {
  id?: string;
  title: string;
  content: string;
  target?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'custom';
  customPosition?: { x: number; y: number };
  scrollPosition?: number;
  coordinates?: TourCoordinates;
  highlight?: boolean;
  delay?: number;
  autoScroll?: boolean;
  smartPositioning?: boolean;
}

export interface TourCoordinates {
  x: number;
  y: number;
  scrollY?: number;
  viewportWidth?: number;
  viewportHeight?: number;
  target?: string;
  position?: 'absolute' | 'relative' | 'fixed';
}

export interface UniversalTourConfig {
  page: string;
  steps: TourStep[];
  coordinates?: TourCoordinates[];
  autoScroll?: boolean;
  smartPositioning?: boolean;
  responsive?: boolean;
  accessibility?: boolean;
  animations?: boolean;
}

interface UniversalTourGuideProps {
  isOpen: boolean;
  onClose: () => void;
  steps: TourStep[];
  storageKey?: string;
  initialTheme?: 'purple' | 'green';
}

export function UniversalTourGuide({ 
  isOpen, 
  onClose, 
  steps, 
  storageKey = "tourSeen",
  initialTheme = 'purple'
}: UniversalTourGuideProps) {
  const { t } = useLanguage();
  const isAdmin = useIsAdmin();
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<Element | null>(null);
  const [highlightRect, setHighlightRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [theme, setTheme] = useState<'purple' | 'green'>(initialTheme);
  const overlayRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const stepChangedAtRef = useRef<number>(0);

  type TooltipComputed = {
    top: number;
    left: number;
    arrowPosition: 'top' | 'bottom' | 'left' | 'right' | 'none';
    arrowLeft: string;
    arrowTop: string;
    arrowRotation: number;
    forceAbsolute: boolean;
  };

  const [resolvedTooltipPos, setResolvedTooltipPos] = useState<TooltipComputed | null>(null);

  const step = steps[currentStep];

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setTheme(initialTheme);
    }
  }, [isOpen, initialTheme]);

  // Check if tour was seen before
  useEffect(() => {
    if (isOpen && storageKey) {
      const seen = localStorage.getItem(storageKey);
      if (!seen) {
        localStorage.setItem(storageKey, "true");
      }
    }
  }, [isOpen, storageKey]);

  useEffect(() => {
    if (!isOpen) return;

    const targetSelector = step?.target;
    if (!targetSelector) {
      setHighlightedElement(null);
      return;
    }

    const targetElement = document.querySelector(targetSelector);
    if (targetElement) {
      setHighlightedElement(targetElement);
    } else {
      setHighlightedElement(null);
    }
  }, [currentStep, isOpen, step?.target]);

  // Track step change time for stabilization
  useEffect(() => {
    stepChangedAtRef.current = Date.now();
  }, [currentStep]);

  const updateHighlightRect = useCallback(() => {
    if (!step?.highlight) {
      setHighlightRect(null);
      return;
    }

    const targetRect = highlightedElement ? highlightedElement.getBoundingClientRect() : null;

    // Wait for tooltip to settle after step change before including it in combined rect
    const settled = Date.now() - stepChangedAtRef.current > 350;
    const tooltipEl = tooltipRef.current;
    const tooltipRect = settled && tooltipEl ? tooltipEl.getBoundingClientRect() : null;

    if (!targetRect && !tooltipRect) {
      // If step just changed and tooltip hasn't settled, keep previous rect
      if (!settled) return;
      setHighlightRect(null);
      return;
    }

    let top = targetRect ? targetRect.top : (tooltipRect as DOMRect).top;
    let left = targetRect ? targetRect.left : (tooltipRect as DOMRect).left;
    let right = targetRect ? targetRect.right : (tooltipRect as DOMRect).right;
    let bottom = targetRect ? targetRect.bottom : (tooltipRect as DOMRect).bottom;

    if (tooltipRect) {
      top = Math.min(top, tooltipRect.top);
      left = Math.min(left, tooltipRect.left);
      right = Math.max(right, tooltipRect.right);
      bottom = Math.max(bottom, tooltipRect.bottom);
    }

    const pad = 12;
    const next = {
      top: Math.round(top - pad),
      left: Math.round(left - pad),
      width: Math.round(right - left + pad * 2),
      height: Math.round(bottom - top + pad * 2)
    };

    setHighlightRect((prev) => {
      if (
        prev &&
        Math.abs(prev.top - next.top) < 4 &&
        Math.abs(prev.left - next.left) < 4 &&
        Math.abs(prev.width - next.width) < 4 &&
        Math.abs(prev.height - next.height) < 4
      ) {
        return prev;
      }
      return next;
    });
  }, [highlightedElement, step?.highlight]);

  useEffect(() => {
    if (!isOpen) return;

    let rafId = 0;
    let lastUpdate = 0;
    const tick = () => {
      const now = Date.now();
      if (now - lastUpdate >= 80) {
        updateHighlightRect();
        lastUpdate = now;
      }
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [isOpen, updateHighlightRect]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  // Universal Tour Positioning System
  const getUniversalPosition = useCallback((): TooltipComputed => {
    const safeDefault: TooltipComputed = {
      top: 120,
      left: 120,
      arrowPosition: 'none',
      arrowLeft: '50%',
      arrowTop: '',
      arrowRotation: 0,
      forceAbsolute: true,
    };

    if (!step) return safeDefault;

    // Priority 1: Use coordinates if available - FORCE ABSOLUTE POSITIONING
    if (step.coordinates) {
      return {
        top: step.coordinates.y,
        left: step.coordinates.x,
        arrowPosition: 'none' as const,
        arrowLeft: '50%',
        arrowTop: '',
        arrowRotation: 0,
        // FORCE ABSOLUTE POSITIONING - IGNORE SMART POSITIONING
        forceAbsolute: true
      };
    }

    // Priority 2: Use custom position if available
    if (step.position === 'custom' && step.customPosition) {
      return {
        top: step.customPosition.y,
        left: step.customPosition.x,
        arrowPosition: 'none' as const,
        arrowLeft: '50%',
        arrowTop: '',
        arrowRotation: 0,
        forceAbsolute: true
      };
    }

    // Priority 3: Use element-based positioning (only if no coordinates)
    if (!highlightedElement) return safeDefault;

    const rect = highlightedElement.getBoundingClientRect();
    const tooltipWidth = 380;
    const tooltipHeight = 260;
    const arrowSize = 16;
    const margin = 35;
    const taskbarHeight = 48;
    const safeMargin = 120;

    let top = rect.top;
    let left = rect.left;
    let arrowPosition: TooltipComputed['arrowPosition'] = 'bottom';
    let arrowLeft = '50%';
    let arrowTop = '';
    let arrowRotation = 0;

    const spaceAbove = rect.top - safeMargin;
    const spaceBelow = window.innerHeight - rect.bottom - safeMargin - taskbarHeight;
    const spaceLeft = rect.left - safeMargin;
    const spaceRight = window.innerWidth - rect.right - safeMargin;

    // Smart positioning with collision detection (only for element-based)
    if (spaceBelow >= tooltipHeight + margin && rect.left + tooltipWidth <= window.innerWidth - safeMargin) {
      top = rect.bottom + margin;
      left = Math.max(safeMargin, Math.min(rect.left + (rect.width / 2) - (tooltipWidth / 2), window.innerWidth - tooltipWidth - safeMargin));
      arrowPosition = 'top';
      arrowLeft = `${rect.left + (rect.width / 2) - left}px`;
      arrowTop = `-${arrowSize}px`;
      arrowRotation = 180;
    } else if (spaceAbove >= tooltipHeight + margin && rect.left + tooltipWidth <= window.innerWidth - safeMargin) {
      top = rect.top - tooltipHeight - margin;
      left = Math.max(safeMargin, Math.min(rect.left + (rect.width / 2) - (tooltipWidth / 2), window.innerWidth - tooltipWidth - safeMargin));
      arrowPosition = 'bottom';
      arrowLeft = `${rect.left + (rect.width / 2) - left}px`;
      arrowTop = `${tooltipHeight}px`;
      arrowRotation = 0;
    } else if (spaceRight >= tooltipWidth + margin) {
      top = Math.max(safeMargin, Math.min(rect.top + (rect.height / 2) - (tooltipHeight / 2), window.innerHeight - tooltipHeight - safeMargin - taskbarHeight));
      left = rect.right + margin;
      arrowPosition = 'left';
      arrowLeft = `-${arrowSize}px`;
      arrowTop = '50%';
      arrowRotation = -90;
    } else if (spaceLeft >= tooltipWidth + margin) {
      top = Math.max(safeMargin, Math.min(rect.top + (rect.height / 2) - (tooltipHeight / 2), window.innerHeight - tooltipHeight - safeMargin - taskbarHeight));
      left = rect.left - tooltipWidth - margin;
      arrowPosition = 'right';
      arrowLeft = `${tooltipWidth}px`;
      arrowTop = '50%';
      arrowRotation = 90;
    } else {
      top = safeMargin;
      left = safeMargin;
      arrowPosition = 'none';
    }

    // Maximum safety constraints (only for element-based)
    left = Math.max(safeMargin, Math.min(left, window.innerWidth - tooltipWidth - safeMargin));
    top = Math.max(safeMargin, Math.min(top, window.innerHeight - tooltipHeight - safeMargin - taskbarHeight));

    return {
      top,
      left,
      arrowPosition,
      arrowLeft,
      arrowTop,
      arrowRotation,
      forceAbsolute: false
    };
  }, [step, highlightedElement]);

  useEffect(() => {
    if (!isOpen) {
      setResolvedTooltipPos(null);
      return;
    }
    // Keep previous position during transition to avoid flash; compute new after DOM settles
    const delay = Math.max(step?.delay || 0, 60);
    const timer = window.setTimeout(() => {
      setResolvedTooltipPos(getUniversalPosition());
    }, delay);
    return () => window.clearTimeout(timer);
  }, [currentStep, getUniversalPosition, isOpen, step?.delay]);

  useEffect(() => {
    if (!isOpen) return;
    const handleResize = () => {
      setResolvedTooltipPos((prev) => {
        if (!prev) return prev;
        return getUniversalPosition();
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [getUniversalPosition, isOpen]);

  // Auto-scroll functionality
  const scrollToPosition = useCallback(() => {
    if (!step) return;

    // Priority 1: Use scrollPosition from step
    if (step.scrollPosition !== undefined) {
      window.scrollTo({
        top: step.scrollPosition,
        behavior: 'smooth'
      });
      return;
    }

    // Priority 2: Use coordinates.scrollY
    if (step.coordinates?.scrollY !== undefined) {
      window.scrollTo({
        top: step.coordinates.scrollY,
        behavior: 'smooth'
      });
      return;
    }

    // Priority 3: Use element-based scroll
    if (step.target && step.autoScroll !== false) {
      const targetElement = document.querySelector(step.target);
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center'
        });
      }
    }
  }, [step]);

  // Apply auto-scroll when step changes
  useEffect(() => {
    if (isOpen && step) {
      const delay = step.delay || 300;
      const timer = setTimeout(() => {
        scrollToPosition();
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [currentStep, isOpen, step, scrollToPosition]);

  // Drag and drop functionality for tour panels
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [customPosition, setCustomPosition] = useState<{ x: number; y: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (target?.closest('button, input, textarea, select, a')) {
      return;
    }

    const tooltip = e.currentTarget as HTMLElement;
    const rect = tooltip.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // Keep within viewport bounds
    const maxX = window.innerWidth - 450; // tooltip width
    const maxY = window.innerHeight - 260 - 48; // tooltip height - taskbar
    
    setCustomPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  }, [isDragging, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Reset custom position when step changes
  useEffect(() => {
    setCustomPosition(null);
  }, [currentStep]);

  if (!isOpen) return null;
  
  const tooltipStyle = resolvedTooltipPos || getUniversalPosition();

  const getArrowStyles = () => {
    const styles: any = {
      left: tooltipStyle.arrowLeft,
      top: tooltipStyle.arrowTop,
      transform: `rotate(${tooltipStyle.arrowRotation}deg)`
    };
    
    if (tooltipStyle.arrowPosition !== 'none' && tooltipStyle.arrowPosition) {
      (styles as any)[tooltipStyle.arrowPosition] = '100%';
    }
    
    return styles;
  };

  return (
    <div className={`tourOverlay ${theme === 'green' ? 'tourThemeGreen' : 'tourThemePurple'}`} ref={overlayRef}>
      {/* Highlight overlay - CRITICAL: Fixed positioning with maximum z-index */}
      {step?.highlight && highlightRect && (
        <div 
          className="tour-highlight" 
          style={{
            position: 'fixed',
            top: highlightRect.top,
            left: highlightRect.left,
            width: highlightRect.width,
            height: highlightRect.height,
            zIndex: 1000000,
            transform: 'translateZ(0)',
          }}
        />
      )}

      {/* Tooltip - FIXED positioning so it stays in place during scroll */}
      <div 
        className="tourTooltip" 
        style={{
          top: customPosition ? customPosition.y : (step?.coordinates ? step.coordinates.y : tooltipStyle.top),
          left: customPosition ? customPosition.x : (step?.coordinates ? step.coordinates.x : tooltipStyle.left),
          zIndex: 1000001,
          transform: 'translateZ(0)',
          position: 'fixed',
          cursor: isDragging ? 'grabbing' : 'grab',
          transition: isDragging ? 'none' : 'top 0.35s cubic-bezier(0.4,0,0.2,1), left 0.35s cubic-bezier(0.4,0,0.2,1), box-shadow 0.2s ease'
        }}
        onMouseDown={handleMouseDown}
        ref={tooltipRef}
      >
        {/* Arrow */}
        {tooltipStyle.arrowPosition !== 'none' && (
          <div 
            className="tourTooltipArrow"
            style={getArrowStyles()}
          />
        )}
        
        <div className="tourTooltipHeader">
          <div className="tourTooltipTitle">{step?.title}</div>
          <div className="tourTooltipHeaderControls">
            {isAdmin && (
            <button
              type="button"
              className="tourTooltipCopyCoords"
              onClick={() => setTheme((p) => (p === 'green' ? 'purple' : 'green'))}
              title={theme === 'green' ? 'Switch to purple highlight' : 'Switch to green highlight'}
              style={{
                background: theme === 'green' ? 'rgba(167, 139, 250, 0.18)' : 'rgba(74, 222, 128, 0.18)',
                border: theme === 'green' ? '1px solid rgba(167, 139, 250, 0.35)' : '1px solid rgba(74, 222, 128, 0.35)',
                borderRadius: '6px',
                padding: '4px 8px',
                cursor: 'pointer',
                fontSize: '12px',
                marginRight: '8px'
              }}
            >
              {theme === 'green' ? '🟣' : '🟢'}
            </button>
            )}
            {isAdmin && (
            <button 
              className="tourTooltipCopyCoords" 
              onClick={() => {
                const tourPanel = document.querySelector('.tourTooltip') as HTMLElement;
                const panelRect = tourPanel?.getBoundingClientRect();
                const coords = {
                  timestamp: new Date().toISOString(),
                  page: "Research Hub",
                  url: window.location.href,
                  scrollY: window.scrollY,
                  scrollX: window.scrollX,
                  viewport: { width: window.innerWidth, height: window.innerHeight },
                  tourPanelPosition: {
                    x: Math.round(panelRect?.left || 0),
                    y: Math.round(panelRect?.top || 0),
                    width: Math.round(panelRect?.width || 0),
                    height: Math.round(panelRect?.height || 0)
                  },
                  configuredPosition: step?.coordinates ? {
                    x: step.coordinates.x, y: step.coordinates.y, scrollY: step.coordinates.scrollY
                  } : null,
                  mousePosition: { x: 0, y: 0 },
                  activeElement: document.activeElement?.tagName || 'none',
                  selectedText: window.getSelection()?.toString() || ''
                };
                const coordsText = `📍 Coordinates\n📅 ${coords.timestamp}\n🌐 ${coords.url}\n📏 Viewport: ${coords.viewport.width}x${coords.viewport.height}\n📍 Scroll: X:${coords.scrollX}, Y:${coords.scrollY}\n🎯 Tour Panel: X:${coords.tourPanelPosition.x}, Y:${coords.tourPanelPosition.y}\n📏 Panel Size: ${coords.tourPanelPosition.width}x${coords.tourPanelPosition.height}\n${coords.configuredPosition ? `⚙️ Configured: X:${coords.configuredPosition.x}, Y:${coords.configuredPosition.y}, ScrollY:${coords.configuredPosition.scrollY}\n` : ''}🎯 Active: ${coords.activeElement}\n📝 Selected: ${coords.selectedText || 'none'}`;
                navigator.clipboard.writeText(coordsText).then(() => {
                  const btn = document.querySelector('.tourTooltipCopyCoords:last-of-type') as HTMLElement;
                  if (btn) { btn.textContent = '✅'; setTimeout(() => { btn.textContent = '📍'; }, 2000); }
                }).catch(err => console.error('Failed to copy:', err));
              }}
              title="Copy coordinates for debugging"
              style={{
                background: 'rgba(114, 255, 191, 0.2)',
                border: '1px solid rgba(114, 255, 191, 0.4)',
                borderRadius: '6px', padding: '4px 8px',
                cursor: 'pointer', fontSize: '12px', marginRight: '8px'
              }}
            >
              📍
            </button>
            )}
            {isAdmin && (
            <button 
              className="tourTooltipScreenshot" 
              onClick={() => {
                try {
                  const element = document.querySelector('#root') as HTMLElement || document.body;
                  html2canvas(element, {
                    width: window.innerWidth, height: window.innerHeight,
                    useCORS: true, allowTaint: true, backgroundColor: '#ffffff',
                    scale: 1, logging: false, removeContainer: true
                  }).then((canvas: HTMLCanvasElement) => {
                    const link = document.createElement('a');
                    link.download = `tour-step-${currentStep + 1}-${step?.title?.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${Date.now()}.png`;
                    link.href = canvas.toDataURL('image/png', 0.9);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    const btn = document.querySelector('.tourTooltipScreenshot') as HTMLElement;
                    if (btn) { const orig = btn.textContent; btn.textContent = '✅'; setTimeout(() => { btn.textContent = orig; }, 1500); }
                  }).catch((error: any) => {
                    console.error('Screenshot error:', error);
                  });
                } catch (error) {
                  console.error('Screenshot failed:', error);
                }
              }}
              title="Take Instant Screenshot"
            >
              📸
            </button>
            )}
            <button className="tourTooltipClose" onClick={onClose}>
              ×
            </button>
          </div>
        </div>
        
        <div className="tourTooltipContent">
          {step?.content}
        </div>

        {isAdmin && (
        <div className="tourTooltipCoordinates">
          <div className="coordInfo">
            <span className="coordLabel">Position:</span>
            <span className="coordValue">
              {customPosition ? 
                `X: ${Math.round(customPosition.x)}, Y: ${Math.round(customPosition.y)}` : 
                `Auto (${step?.position || 'default'})`
              }
            </span>
          </div>
          <div className="coordInfo">
            <span className="coordLabel">Step:</span>
            <span className="coordValue">{currentStep + 1}/{steps.length}</span>
          </div>
        </div>
        )}

        <div className="tourTooltipActions">
          <div className="tourTooltipProgress">
            {currentStep + 1} / {steps.length}
          </div>
          
          <div className="tourTooltipButtons">
            {currentStep > 0 && (
              <button className="tourTooltipBtn tourTooltipBtnSecondary" onClick={handlePrevious}>
                ← {t("tour.btn.previous") || "Previous"}
              </button>
            )}
            
            <button className="tourTooltipBtn tourTooltipBtnSkip" onClick={handleSkip}>
              {t("tour.btn.skip") || "Skip Tour"}
            </button>
            
            <button 
              className="tourTooltipBtn tourTooltipBtnPrimary" 
              onClick={handleNext}
            >
              {currentStep === steps.length - 1 ? (t("tour.btn.finish") || 'Finish') : (t("tour.btn.next") || 'Next')} →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function useTour(steps: TourStep[], storageKey?: string) {
  const [isOpen, setIsOpen] = useState(false);
  const stepsRef = useRef<TourStep[]>(steps);
  const isOpenRef = useRef(isOpen);
  const storageKeyRef = useRef(storageKey);

  stepsRef.current = steps;
  isOpenRef.current = isOpen;
  storageKeyRef.current = storageKey;

  const startTour = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeTour = useCallback(() => {
    setIsOpen(false);
  }, []);

  const closeTourRef = useRef(closeTour);
  closeTourRef.current = closeTour;

  const TourComponent = useMemo(() => {
    return function StableTourComponent() {
      return (
        <UniversalTourGuide
          isOpen={isOpenRef.current}
          onClose={closeTourRef.current}
          steps={stepsRef.current}
          storageKey={storageKeyRef.current}
        />
      );
    };
  }, []);

  return {
    isOpen,
    startTour,
    closeTour,
    TourComponent
  };
}

// Universal Tour Configuration Helper
export function createUniversalTour(config: UniversalTourConfig) {
  return {
    ...config,
    steps: config.steps.map((step, index) => ({
      ...step,
      id: step.id || `step-${index}`,
      autoScroll: step.autoScroll !== false,
      smartPositioning: step.smartPositioning !== false,
      delay: step.delay || 300
    }))
  };
}

// Coordinate-based Tour Helper
export function createCoordinateTour(page: string, coordinates: TourCoordinates[], content: string[]) {
  return createUniversalTour({
    page,
    autoScroll: true,
    smartPositioning: true,
    responsive: true,
    accessibility: true,
    animations: true,
    steps: coordinates.map((coord, index) => ({
      id: `coord-step-${index}`,
      title: `Step ${index + 1}`,
      content: content[index] || `Tour step ${index + 1}`,
      coordinates: coord,
      scrollPosition: coord.scrollY,
      autoScroll: true,
      smartPositioning: true,
      highlight: false,
      delay: 300
    }))
  });
}
