// src/components/TheoryTourGuide.tsx
// Comprehensive tour guide for Theory Development Hub and Research Laboratory
import { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

interface TourStep {
  id: string;
  target: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: () => void;
}

interface TheoryTourGuideProps {
  tourType: 'theoryHub' | 'researchLab';
  onStart?: () => void;
  onComplete?: () => void;
  onSkip?: () => void;
  autoStart?: boolean;
  onRegisterStart?: (startFn: () => void) => void;
}

export function TheoryTourGuide({ 
  tourType, 
  onStart, 
  onComplete, 
  onSkip, 
  autoStart = false,
  onRegisterStart,
}: TheoryTourGuideProps) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);
  const [highlightRect, setHighlightRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hasAutoStarted = useRef(false);
  const [tooltipRect, setTooltipRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // Theory Hub Tour Steps
  const theoryHubSteps: TourStep[] = [
    {
      id: 'theory-welcome',
      target: 'body',
      title: t('tour.theoryHub.welcome.title'),
      content: t('tour.theoryHub.welcome.content'),
      position: 'center',
    },
    {
      id: 'theory-health-score',
      target: '[data-tour="theory-health-score"]',
      title: t('tour.theoryHub.healthScore.title'),
      content: t('tour.theoryHub.healthScore.content'),
      position: 'center',
    },
    {
      id: 'theory-tabs',
      target: '[data-tour="theory-tabs"]',
      title: t('tour.theoryHub.overview.title'),
      content: t('tour.theoryHub.overview.content'),
      position: 'center',
    },
    {
      id: 'theory-tools',
      target: '[data-tour="theory-tools"]',
      title: t('tour.theoryHub.tools.title'),
      content: t('tour.theoryHub.tools.content'),
      position: 'center',
    },
    {
      id: 'theory-widget-area',
      target: '[data-tour="theory-widget-area"]',
      title: t('tour.theoryHub.construction.title'),
      content: t('tour.theoryHub.construction.content'),
      position: 'center',
    },
    {
      id: 'theory-doc-stats',
      target: '[data-tour="theory-doc-stats"]',
      title: t('tour.theoryHub.validation.title'),
      content: t('tour.theoryHub.validation.content'),
      position: 'center',
    },
    {
      id: 'theory-analytics',
      target: '[data-tour="theory-analytics"]',
      title: t('tour.theoryHub.analytics.title'),
      content: t('tour.theoryHub.analytics.content'),
      position: 'center',
    },
    {
      id: 'theory-complete',
      target: 'body',
      title: t('tour.theoryHub.publication.title'),
      content: t('tour.theoryHub.publication.content'),
      position: 'center',
    },
  ];

  // Research Lab Tour Steps
  const researchLabSteps: TourStep[] = [
    {
      id: 'lab-welcome',
      target: 'body',
      title: t('tour.researchLab.welcome.title'),
      content: t('tour.researchLab.welcome.content'),
      position: 'center',
    },
    {
      id: 'lab-phase-selector',
      target: '[data-tour="lab-phase-selector"]',
      title: t('tour.researchLab.phase.title'),
      content: t('tour.researchLab.phase.content'),
      position: 'center',
    },
    {
      id: 'lab-documents-panel',
      target: '[data-tour="lab-documents"]',
      title: t('tour.researchLab.documents.title'),
      content: t('tour.researchLab.documents.content'),
      position: 'center',
    },
    {
      id: 'lab-claims-panel',
      target: '[data-tour="lab-claims"]',
      title: t('tour.researchLab.claims.title'),
      content: t('tour.researchLab.claims.content'),
      position: 'center',
    },
    {
      id: 'lab-evidence-panel',
      target: '[data-tour="lab-evidence"]',
      title: t('tour.researchLab.evidence.title'),
      content: t('tour.researchLab.evidence.content'),
      position: 'center',
    },
    {
      id: 'lab-analytics-panel',
      target: '[data-tour="lab-analytics"]',
      title: t('tour.researchLab.analytics.title'),
      content: t('tour.researchLab.analytics.content'),
      position: 'center',
    },
    {
      id: 'lab-complete',
      target: 'body',
      title: t('tour.researchLab.contextSwitcher.title'),
      content: t('tour.researchLab.contextSwitcher.content'),
      position: 'center',
    },
  ];

  const steps = tourType === 'theoryHub' ? theoryHubSteps : researchLabSteps;
  const currentStepData = steps[currentStep];

  // Calculate tooltip position relative to target
  const calculatePosition = useCallback(() => {
    if (!currentStepData || !isActive) return;

    // Always compute highlight region for non-body targets,
    // even when the tooltip itself stays centered.
    let targetRect: DOMRect | null = null;

    if (currentStepData.target !== 'body') {
      const target = document.querySelector(currentStepData.target);
      if (target) {
        targetRect = target.getBoundingClientRect();
        setHighlightRect({ x: targetRect.x, y: targetRect.y, w: targetRect.width, h: targetRect.height });
      } else {
        setHighlightRect(null);
      }
    } else {
      setHighlightRect(null);
    }

    // Centered steps: keep the tooltip card fixed in the middle,
    // only the spotlight (highlightRect) moves.
    if (currentStepData.position === 'center' || currentStepData.target === 'body') {
      setTooltipPos(null);
      return;
    }

    if (!targetRect) {
      setTooltipPos(null);
      return;
    }

    const rect = targetRect;
    const tooltipW = 380;
    const tooltipH = 280;
    const gap = 16;

    let top = 0;
    let left = 0;

    switch (currentStepData.position) {
      case 'bottom':
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2 - tooltipW / 2;
        break;
      case 'top':
        top = rect.top - tooltipH - gap;
        left = rect.left + rect.width / 2 - tooltipW / 2;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipH / 2;
        left = rect.right + gap;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipH / 2;
        left = rect.left - tooltipW - gap;
        break;
    }

    // Clamp to viewport
    top = Math.max(16, Math.min(window.innerHeight - tooltipH - 16, top));
    left = Math.max(16, Math.min(window.innerWidth - tooltipW - 16, left));

    setTooltipPos({ top, left });
  }, [currentStepData, isActive]);

  // Position and highlight on step change
  useEffect(() => {
    if (!isActive || !currentStepData) return;

    const target = document.querySelector(currentStepData.target);
    if (target && currentStepData.target !== 'body') {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Recalculate after scroll
      const timer = setTimeout(calculatePosition, 400);
      return () => clearTimeout(timer);
    } else {
      calculatePosition();
    }

    if (currentStepData.action) currentStepData.action();
  }, [currentStep, isActive, currentStepData, calculatePosition]);

  // Track tooltip rectangle so we can include it in the spotlight region
  useEffect(() => {
    if (!isActive) {
      setTooltipRect(null);
      return;
    }
    if (!tooltipRef.current) return;
    const rect = tooltipRef.current.getBoundingClientRect();
    setTooltipRect({ x: rect.x, y: rect.y, w: rect.width, h: rect.height });
  }, [isActive, currentStep, tooltipPos]);

  // Recalculate on resize
  useEffect(() => {
    if (!isActive) return;
    const handleResize = () => calculatePosition();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isActive, calculatePosition]);

  // Auto-start once
  useEffect(() => {
    if (autoStart && !hasAutoStarted.current) {
      hasAutoStarted.current = true;
      const timer = setTimeout(() => {
        setCurrentStep(0);
        setIsActive(true);
        onStart?.();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [autoStart, onStart]);

  // Highlight management
  useEffect(() => {
    if (!isActive || !currentStepData) return;

    // Clear all previous highlights
    document.querySelectorAll('.tour-highlighted').forEach(el => el.classList.remove('tour-highlighted'));

    if (currentStepData.target !== 'body') {
      const target = document.querySelector(currentStepData.target);
      if (target) {
        target.classList.add('tour-highlighted');
      }
    }

    return () => {
      document.querySelectorAll('.tour-highlighted').forEach(el => el.classList.remove('tour-highlighted'));
    };
  }, [currentStep, isActive, currentStepData]);

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') skipTour();
      else if (e.key === 'ArrowRight' || e.key === 'Enter') nextStep();
      else if (e.key === 'ArrowLeft') prevStep();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isActive, currentStep]);

  const startTour = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
    onStart?.();
  }, [onStart]);

  // Store startTour in a ref so we can pass a stable reference to parent
  const startTourRef = useRef(startTour);
  startTourRef.current = startTour;

  // Register start function with parent - only once on mount
  const onRegisterStartRef = useRef(onRegisterStart);
  onRegisterStartRef.current = onRegisterStart;
  
  useEffect(() => {
    // Create a stable wrapper that always calls the current startTour
    const stableStartTour = () => startTourRef.current();
    onRegisterStartRef.current?.(stableStartTour);
  }, []); // Empty deps - only run once on mount

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const completeTour = () => {
    setIsActive(false);
    setTooltipPos(null);
    onComplete?.();
  };

  const skipTour = () => {
    setIsActive(false);
    setTooltipPos(null);
    onSkip?.();
    onComplete?.();
  };

  const goToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStep(stepIndex);
    }
  };

  // Inactive state: render nothing (trigger button is provided externally via useTourTrigger)
  if (!isActive) {
    return null;
  }

  if (!currentStepData) return null;

  const isCenter = currentStepData.position === 'center' || currentStepData.target === 'body';
  const progressText = `${currentStep + 1} / ${steps.length}`;

  return (
    <>
      {/* Tour Overlay with SVG spotlight cutout */}
      <svg
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 9998,
          pointerEvents: 'auto',
        }}
        onClick={skipTour}
      >
        <defs>
          <mask id="tour-spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {highlightRect && (
              <rect
                x={highlightRect.x - 10}
                y={highlightRect.y - 10}
                width={highlightRect.w + 20}
                height={highlightRect.h + 20}
                rx={14}
                fill="black"
              />
            )}
            {tooltipRect && (
              <rect
                x={tooltipRect.x - 10}
                y={tooltipRect.y - 10}
                width={tooltipRect.w + 20}
                height={tooltipRect.h + 20}
                rx={14}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.7)"
          mask="url(#tour-spotlight-mask)"
        />
        {highlightRect && (
          <rect
            x={highlightRect.x - 10}
            y={highlightRect.y - 10}
            width={highlightRect.w + 20}
            height={highlightRect.h + 20}
            rx={14}
            fill="none"
            stroke="rgba(99, 102, 241, 0.6)"
            strokeWidth={3}
          />
        )}
        {tooltipRect && !isCenter && (
          <rect
            x={tooltipRect.x - 10}
            y={tooltipRect.y - 10}
            width={tooltipRect.w + 20}
            height={tooltipRect.h + 20}
            rx={14}
            fill="none"
            stroke="rgba(129, 140, 248, 0.6)"
            strokeWidth={2}
          />
        )}
      </svg>

      {/* Tour Tooltip */}
      <div
        ref={tooltipRef}
        className="tour-tooltip-animated"
        style={{
          position: 'fixed',
          zIndex: 10000,
          background: colors.bgPrimary || '#1a1a2e',
          border: `1px solid ${colors.borderPrimary || '#333'}`,
          borderRadius: '16px',
          padding: '24px',
          width: '380px',
          maxWidth: 'calc(100vw - 32px)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05)',
          transition: 'top 0.25s ease, left 0.25s ease, transform 0.25s ease',
          ...(isCenter
            ? { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
            : tooltipPos
              ? { top: `${tooltipPos.top}px`, left: `${tooltipPos.left}px` }
              : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
          ),
        }}
      >
        {/* Gradient accent bar */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '24px',
          right: '24px',
          height: '3px',
          borderRadius: '0 0 3px 3px',
          background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa)',
        }} />

        {/* Step counter badge */}
        <div style={{
          position: 'absolute',
          top: '-12px',
          right: '20px',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          color: '#fff',
          fontSize: '11px',
          fontWeight: '700',
          padding: '4px 12px',
          borderRadius: '20px',
          boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)',
        }}>
          {progressText}
        </div>

        {/* Header */}
        <div style={{ marginBottom: '12px', marginTop: '4px' }}>
          <h3 style={{
            margin: '0 0 4px',
            fontSize: '17px',
            fontWeight: '700',
            color: colors.textPrimary || '#fff',
            letterSpacing: '-0.01em',
          }}>
            {currentStepData.title}
          </h3>
        </div>

        {/* Content */}
        <div style={{
          fontSize: '13.5px',
          color: colors.textSecondary || '#aaa',
          lineHeight: '1.65',
          marginBottom: '20px',
        }}>
          {currentStepData.content}
        </div>

        {/* Progress dots */}
        <div style={{
          display: 'flex',
          gap: '6px',
          marginBottom: '16px',
          justifyContent: 'center',
        }}>
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => goToStep(index)}
              style={{
                width: index === currentStep ? '24px' : '8px',
                height: '8px',
                background: index <= currentStep
                  ? 'linear-gradient(90deg, #6366f1, #8b5cf6)'
                  : 'rgba(255,255,255,0.15)',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                padding: 0,
              }}
            />
          ))}
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <button
            onClick={skipTour}
            style={{
              padding: '8px 14px',
              background: 'transparent',
              border: `1px solid ${colors.borderPrimary || '#444'}`,
              borderRadius: '8px',
              color: colors.textSecondary || '#888',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {t('tour.skip')}
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            {currentStep > 0 && (
              <button
                onClick={prevStep}
                style={{
                  padding: '8px 14px',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${colors.borderPrimary || '#444'}`,
                  borderRadius: '8px',
                  color: colors.textPrimary || '#fff',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                ← {t('tour.previous')}
              </button>
            )}
            
            <button
              onClick={nextStep}
              style={{
                padding: '8px 20px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
                transition: 'all 0.2s',
              }}
            >
              {currentStep === steps.length - 1 ? t('tour.finish') + ' ✓' : t('tour.next') + ' →'}
            </button>
          </div>
        </div>

        {/* Keyboard hint */}
        <div style={{
          marginTop: '12px',
          textAlign: 'center',
          fontSize: '10px',
          color: 'rgba(255,255,255,0.25)',
        }}>
          ← → arrows • Enter next • Esc skip
        </div>
      </div>

      {/* Tour Styles */}
      <style>{`
        .tour-highlighted {
          position: relative;
          transition: box-shadow 0.3s ease !important;
        }
        
        .tour-tooltip-animated {
          animation: tourFadeIn 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        @keyframes tourFadeIn {
          from { opacity: 0; transform: translateY(8px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        
        .tour-start-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.5) !important;
        }
      `}</style>
    </>
  );
}

// Hook for managing tour state
export function useTheoryTour(tourType: 'theoryHub' | 'researchLab') {
  const [tourSeen, setTourSeen] = useState(() => {
    const key = `${tourType}TourSeen`;
    return localStorage.getItem(key) === 'true';
  });

  const markTourAsSeen = () => {
    const key = `${tourType}TourSeen`;
    localStorage.setItem(key, 'true');
    setTourSeen(true);
  };

  const resetTour = () => {
    const key = `${tourType}TourSeen`;
    localStorage.removeItem(key);
    setTourSeen(false);
  };

  return {
    tourSeen,
    markTourAsSeen,
    resetTour,
  };
}
