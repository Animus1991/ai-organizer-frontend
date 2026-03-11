/**
 * useOnScreen Hook - Intersection Observer for visibility detection
 */

import { useState, useEffect, useRef, RefObject } from 'react';

interface UseOnScreenOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
  triggerOnce?: boolean;
}

export function useOnScreen<T extends HTMLElement = HTMLElement>(
  options: UseOnScreenOptions = {}
): [RefObject<T | null>, boolean] {
  const { root = null, rootMargin = '0px', threshold = 0, triggerOnce = false } = options;
  const ref = useRef<T | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting;
        setIsIntersecting(isVisible);

        if (isVisible && triggerOnce) {
          observer.unobserve(element);
        }
      },
      { root, rootMargin, threshold }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [root, rootMargin, threshold, triggerOnce]);

  return [ref, isIntersecting];
}

export default useOnScreen;
