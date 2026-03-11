/**
 * useSwipeGesture - Detects swipe gestures on touch devices
 * Supports edge swipes (from screen edges) and general swipes
 */
import { useEffect, useRef, useCallback } from 'react';

interface SwipeConfig {
  /** Direction to detect */
  direction: 'left' | 'right' | 'up' | 'down';
  /** Minimum distance in px to register swipe (default: 50) */
  threshold?: number;
  /** Maximum perpendicular deviation (default: 80) */
  maxDeviation?: number;
  /** Only trigger if swipe starts within this many px of the edge (0 = any position) */
  edgeZone?: number;
  /** Which edge to detect from (default: inferred from direction) */
  edge?: 'left' | 'right' | 'top' | 'bottom';
  /** Callback when swipe is detected */
  onSwipe: () => void;
  /** Whether the gesture is enabled */
  enabled?: boolean;
  /** Target element ref (default: document) */
  targetRef?: React.RefObject<HTMLElement>;
}

export function useSwipeGesture({
  direction,
  threshold = 50,
  maxDeviation = 80,
  edgeZone = 0,
  onSwipe,
  enabled = true,
  targetRef,
}: SwipeConfig) {
  const startX = useRef(0);
  const startY = useRef(0);
  const tracking = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return;
    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;
    const w = window.innerWidth;
    const h = window.innerHeight;

    // Edge zone check
    if (edgeZone > 0) {
      const edge = direction === 'right' ? 'left' : direction === 'left' ? 'right' : direction === 'down' ? 'top' : 'bottom';
      if (edge === 'left' && x > edgeZone) return;
      if (edge === 'right' && x < w - edgeZone) return;
      if (edge === 'top' && y > edgeZone) return;
      if (edge === 'bottom' && y < h - edgeZone) return;
    }

    startX.current = x;
    startY.current = y;
    tracking.current = true;
  }, [enabled, edgeZone, direction]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!tracking.current) return;
    tracking.current = false;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - startX.current;
    const dy = touch.clientY - startY.current;

    const horizontal = direction === 'left' || direction === 'right';
    const primary = horizontal ? dx : dy;
    const secondary = horizontal ? Math.abs(dy) : Math.abs(dx);

    if (secondary > maxDeviation) return;

    if (direction === 'right' && primary >= threshold) onSwipe();
    if (direction === 'left' && primary <= -threshold) onSwipe();
    if (direction === 'down' && primary >= threshold) onSwipe();
    if (direction === 'up' && primary <= -threshold) onSwipe();
  }, [direction, threshold, maxDeviation, onSwipe]);

  // Mouse support for desktop testing of swipe gestures
  const mouseDown = useRef(false);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (!enabled) return;
    const x = e.clientX;
    const y = e.clientY;
    const w = window.innerWidth;
    const h = window.innerHeight;

    if (edgeZone > 0) {
      const edge = direction === 'right' ? 'left' : direction === 'left' ? 'right' : direction === 'down' ? 'top' : 'bottom';
      if (edge === 'left' && x > edgeZone) return;
      if (edge === 'right' && x < w - edgeZone) return;
      if (edge === 'top' && y > edgeZone) return;
      if (edge === 'bottom' && y < h - edgeZone) return;
    }

    startX.current = x;
    startY.current = y;
    mouseDown.current = true;
  }, [enabled, edgeZone, direction]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!mouseDown.current) return;
    mouseDown.current = false;

    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;

    const horizontal = direction === 'left' || direction === 'right';
    const primary = horizontal ? dx : dy;
    const secondary = horizontal ? Math.abs(dy) : Math.abs(dx);

    if (secondary > maxDeviation) return;

    if (direction === 'right' && primary >= threshold) onSwipe();
    if (direction === 'left' && primary <= -threshold) onSwipe();
    if (direction === 'down' && primary >= threshold) onSwipe();
    if (direction === 'up' && primary <= -threshold) onSwipe();
  }, [direction, threshold, maxDeviation, onSwipe]);

  useEffect(() => {
    if (!enabled) return;
    const target = targetRef?.current ?? document;
    target.addEventListener('touchstart', handleTouchStart as EventListener, { passive: true });
    target.addEventListener('touchend', handleTouchEnd as EventListener, { passive: true });
    target.addEventListener('mousedown', handleMouseDown as EventListener);
    target.addEventListener('mouseup', handleMouseUp as EventListener);
    return () => {
      target.removeEventListener('touchstart', handleTouchStart as EventListener);
      target.removeEventListener('touchend', handleTouchEnd as EventListener);
      target.removeEventListener('mousedown', handleMouseDown as EventListener);
      target.removeEventListener('mouseup', handleMouseUp as EventListener);
    };
  }, [enabled, handleTouchStart, handleTouchEnd, handleMouseDown, handleMouseUp, targetRef]);
}

/**
 * usePullToRefresh - Pull down from top to trigger refresh
 */
interface PullToRefreshConfig {
  onRefresh: () => Promise<void> | void;
  enabled?: boolean;
  threshold?: number;
  targetRef?: React.RefObject<HTMLElement>;
}

export function usePullToRefresh({
  onRefresh,
  enabled = true,
  threshold = 80,
  targetRef,
}: PullToRefreshConfig) {
  const startY = useRef(0);
  const pulling = useRef(false);
  const refreshing = useRef(false);
  const indicatorRef = useRef<HTMLDivElement | null>(null);

  // Create/get the indicator element
  useEffect(() => {
    if (!enabled) return;
    let el = document.getElementById('pull-refresh-indicator') as HTMLDivElement | null;
    if (!el) {
      el = document.createElement('div');
      el.id = 'pull-refresh-indicator';
      el.style.cssText = `
        position: fixed; top: -48px; left: 50%; transform: translateX(-50%);
        width: 40px; height: 40px; border-radius: 50%;
        background: hsl(var(--primary)); color: hsl(var(--primary-foreground));
        display: flex; align-items: center; justify-content: center;
        font-size: 18px; z-index: 99999; transition: top 0.2s ease;
        box-shadow: 0 4px 16px hsl(var(--primary) / 0.3);
      `;
      el.innerHTML = '↓';
      document.body.appendChild(el);
    }
    indicatorRef.current = el;
    return () => {
      el?.remove();
      indicatorRef.current = null;
    };
  }, [enabled]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled || refreshing.current) return;
    const target = targetRef?.current ?? document.documentElement;
    const scrollTop = target === document.documentElement ? window.scrollY : target.scrollTop;
    if (scrollTop > 5) return;
    startY.current = e.touches[0].clientY;
    pulling.current = true;
  }, [enabled, targetRef]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!pulling.current || !indicatorRef.current) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0 && dy < 150) {
      const progress = Math.min(dy / threshold, 1);
      indicatorRef.current.style.top = `${Math.min(dy * 0.5, 60)}px`;
      indicatorRef.current.style.opacity = String(progress);
      indicatorRef.current.innerHTML = progress >= 1 ? '↻' : '↓';
    }
  }, [threshold]);

  const handleTouchEnd = useCallback(async (e: TouchEvent) => {
    if (!pulling.current || !indicatorRef.current) return;
    pulling.current = false;
    const dy = e.changedTouches[0].clientY - startY.current;

    if (dy >= threshold && !refreshing.current) {
      refreshing.current = true;
      indicatorRef.current.innerHTML = '⟳';
      indicatorRef.current.style.top = '16px';
      // Spin animation
      indicatorRef.current.style.animation = 'spin 0.6s linear infinite';
      try {
        await onRefresh();
      } finally {
        refreshing.current = false;
        if (indicatorRef.current) {
          indicatorRef.current.style.animation = '';
          indicatorRef.current.style.top = '-48px';
          indicatorRef.current.style.opacity = '0';
        }
      }
    } else {
      indicatorRef.current.style.top = '-48px';
      indicatorRef.current.style.opacity = '0';
    }
  }, [threshold, onRefresh]);

  useEffect(() => {
    if (!enabled) return;
    const target = targetRef?.current ?? document;
    target.addEventListener('touchstart', handleTouchStart as EventListener, { passive: true });
    target.addEventListener('touchmove', handleTouchMove as EventListener, { passive: false });
    target.addEventListener('touchend', handleTouchEnd as EventListener, { passive: true });
    return () => {
      target.removeEventListener('touchstart', handleTouchStart as EventListener);
      target.removeEventListener('touchmove', handleTouchMove as EventListener);
      target.removeEventListener('touchend', handleTouchEnd as EventListener);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd, targetRef]);
}
