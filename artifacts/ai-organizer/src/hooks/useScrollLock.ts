/**
 * useScrollLock Hook - Lock body scroll (useful for modals)
 */

import { useEffect, useCallback, useRef } from 'react';

export function useScrollLock(lock: boolean = true): void {
  const originalStyle = useRef<string>('');

  useEffect(() => {
    if (typeof document === 'undefined') return;

    if (lock) {
      originalStyle.current = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = originalStyle.current;
    };
  }, [lock]);
}

// Manual control version
export function useScrollLockControl(): {
  lock: () => void;
  unlock: () => void;
  isLocked: boolean;
} {
  const originalStyle = useRef<string>('');
  const isLockedRef = useRef<boolean>(false);

  const lock = useCallback(() => {
    if (typeof document === 'undefined' || isLockedRef.current) return;
    
    originalStyle.current = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    isLockedRef.current = true;
  }, []);

  const unlock = useCallback(() => {
    if (typeof document === 'undefined' || !isLockedRef.current) return;
    
    document.body.style.overflow = originalStyle.current;
    isLockedRef.current = false;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isLockedRef.current) {
        document.body.style.overflow = originalStyle.current;
      }
    };
  }, []);

  return { lock, unlock, isLocked: isLockedRef.current };
}

export default useScrollLock;
