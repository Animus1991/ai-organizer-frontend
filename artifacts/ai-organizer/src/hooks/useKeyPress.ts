/**
 * useKeyPress Hook - Detect key presses
 */

import { useState, useEffect, useCallback } from 'react';

export function useKeyPress(targetKey: string): boolean {
  const [isPressed, setIsPressed] = useState(false);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === targetKey) {
        setIsPressed(true);
      }
    },
    [targetKey]
  );

  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === targetKey) {
        setIsPressed(false);
      }
    },
    [targetKey]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return isPressed;
}

// Multiple keys version
export function useKeyCombo(keys: string[]): boolean {
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      setPressedKeys((prev) => new Set(prev).add(event.key.toLowerCase()));
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      setPressedKeys((prev) => {
        const next = new Set(prev);
        next.delete(event.key.toLowerCase());
        return next;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return keys.every((key) => pressedKeys.has(key.toLowerCase()));
}

export default useKeyPress;
