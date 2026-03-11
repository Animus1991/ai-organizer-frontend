import { useEffect, useRef, useState } from "react";
import { useTheme } from "../../context/ThemeContext";

export type TourStep = {
  key: string;
  title: string;
  body: string;
  ref: React.RefObject<HTMLDivElement | null> | null;
};

export type TourPopoverPos = {
  top: number;
  left: number;
  width: number;
  height: number;
  placement: "center" | "right" | "left" | "bottom" | "top";
  pushDownPadding?: number;
};

type UseTourOptions = {
  storageKey: string;
  steps: TourStep[];
  containerRef?: React.RefObject<HTMLDivElement | null>;
  autoStart?: boolean;
  minGutterWidth?: number;
};

export function useTour({
  storageKey,
  steps,
  containerRef,
  autoStart = true,
  minGutterWidth = 360,
}: UseTourOptions) {
  const { colors } = useTheme();
  const [tourOpen, setTourOpen] = useState(false);
  const [tourStepIndex, setTourStepIndex] = useState(0);
  const [tourPopoverPos, setTourPopoverPos] = useState<TourPopoverPos | null>(null);
  const [scrollLock, setScrollLock] = useState(false);
  const stepsRef = useRef(steps);
  stepsRef.current = steps;

  useEffect(() => {
    if (!autoStart) return;
    const seen = localStorage.getItem(storageKey);
    if (!seen) {
      setTourOpen(true);
      setTourStepIndex(0);
      localStorage.setItem(storageKey, "true");
    }
  }, [autoStart, storageKey]);

  useEffect(() => {
    if (!tourOpen) return;
    const current = stepsRef.current[tourStepIndex];
    if (!current?.ref?.current || scrollLock) return;
    setScrollLock(true);
    current.ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
    const id = window.setTimeout(() => setScrollLock(false), 500);
    return () => window.clearTimeout(id);
  }, [scrollLock, tourOpen, tourStepIndex]);

  useEffect(() => {
    if (!tourOpen) {
      setTourPopoverPos(null);
      return;
    }
    const current = stepsRef.current[tourStepIndex];
    const rect = current?.ref?.current?.getBoundingClientRect() ?? null;
    const baseWidth = 520;
    const baseHeight = 220;
    const margin = 24;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const containerRect = containerRef?.current?.getBoundingClientRect() ?? null;
    if (containerRect) {
      const rightGutter = viewportWidth - containerRect.right - margin;
      if (rightGutter >= minGutterWidth) {
        const width = Math.min(baseWidth, rightGutter);
        const height = Math.min(baseHeight, viewportHeight - margin * 2);
        const top = Math.max(margin, Math.min(rect?.top ?? margin, viewportHeight - height - margin));
        setTourPopoverPos({
          top,
          left: containerRect.right + margin,
          width,
          height,
          placement: "right",
        });
        return;
      }

      const leftGutter = containerRect.left - margin;
      if (leftGutter >= minGutterWidth) {
        const width = Math.min(baseWidth, leftGutter);
        const height = Math.min(baseHeight, viewportHeight - margin * 2);
        const top = Math.max(margin, Math.min(rect?.top ?? margin, viewportHeight - height - margin));
        setTourPopoverPos({
          top,
          left: margin,
          width,
          height,
          placement: "left",
        });
        return;
      }
    }

    const width = Math.min(baseWidth, viewportWidth - margin * 2);
    const height = Math.min(baseHeight, viewportHeight - margin * 2);
    const left = Math.max(margin, (viewportWidth - width) / 2);
    setTourPopoverPos({
      top: margin,
      left,
      width,
      height,
      placement: "top",
      pushDownPadding: height + margin,
    });
  }, [containerRef, minGutterWidth, tourOpen, tourStepIndex]);

  useEffect(() => {
    if (!tourOpen) return;
    const handler = () => setTourPopoverPos(null);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [tourOpen]);

  const stepsList = stepsRef.current;
  const tourStep = stepsList[tourStepIndex] || stepsList[0];
  const activeTourRef = tourStep?.ref || null;
  const isTourActive = (ref: React.RefObject<HTMLDivElement | null>) =>
    tourOpen && activeTourRef === ref;
  const getTourHighlightStyle = (
    ref: React.RefObject<HTMLDivElement | null>
  ): React.CSSProperties | undefined =>
    isTourActive(ref)
      ? {
          position: "relative" as const,
          zIndex: 1001,
          borderRadius: "16px",
          boxShadow: `0 0 0 2px ${hexToRgba(colors.accentInfo, 0.75)}, 0 0 0 6px ${hexToRgba(colors.accentInfo, 0.12)}`,
        }
      : undefined;

  const startTour = () => {
    setTourOpen(true);
    setTourStepIndex(0);
  };
  const closeTour = () => {
    setTourOpen(false);
    localStorage.setItem(storageKey, "true");
  };
  const nextTourStep = () => {
    const maxIndex = Math.max(stepsList.length - 1, 0);
    if (tourStepIndex >= maxIndex) {
      closeTour();
      return;
    }
    setTourStepIndex((prev) => Math.min(prev + 1, maxIndex));
  };
  const prevTourStep = () => setTourStepIndex((prev) => Math.max(prev - 1, 0));

  return {
    tourOpen,
    tourStepIndex,
    tourPopoverPos,
    tourStep,
    tourSteps: stepsList,
    startTour,
    closeTour,
    nextTourStep,
    prevTourStep,
    getTourHighlightStyle,
  };
}

function hexToRgba(hex: string, alpha: number) {
  const safe = hex.trim();
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(safe);
  if (!m) return `rgba(20,184,166,${alpha})`;
  const r = parseInt(m[1], 16);
  const g = parseInt(m[2], 16);
  const b = parseInt(m[3], 16);
  return `rgba(${r},${g},${b},${alpha})`;
 }
