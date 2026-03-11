import { useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const matchingShortcut = shortcuts.find(shortcut => {
      const keyMatches = shortcut.key.toLowerCase() === event.key.toLowerCase();
      const ctrlMatches = (shortcut.ctrlKey || false) === event.ctrlKey;
      const shiftMatches = (shortcut.shiftKey || false) === event.shiftKey;
      const altMatches = (shortcut.altKey || false) === event.altKey;
      const metaMatches = (shortcut.metaKey || false) === event.metaKey;

      return keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches;
    });

    if (matchingShortcut) {
      event.preventDefault();
      event.stopPropagation();
      matchingShortcut.action();
    }
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const getShortcutDisplay = (shortcut: KeyboardShortcut): string => {
    const parts: string[] = [];
    
    if (shortcut.ctrlKey) parts.push('Ctrl');
    if (shortcut.metaKey) parts.push('Cmd');
    if (shortcut.altKey) parts.push('Alt');
    if (shortcut.shiftKey) parts.push('Shift');
    
    parts.push(shortcut.key.toUpperCase());
    
    return parts.join(' + ');
  };

  return { getShortcutDisplay };
};

 export function ShortcutsProvider({ children }: { children: ReactNode }) {
   return children;
 }

// Common shortcuts
export const commonShortcuts = {
  toggleCompactMode: {
    key: 'c',
    ctrlKey: true,
    altKey: true,
    description: 'Toggle Compact Mode'
  },
  toggleExpandedMode: {
    key: 'e',
    ctrlKey: true,
    altKey: true,
    description: 'Toggle Expanded Mode'
  },
  openAIChat: {
    key: '/',
    ctrlKey: true,
    description: 'Open AI Chat'
  },
  toggleScreenshotMode: {
    key: 's',
    ctrlKey: true,
    altKey: true,
    description: 'Toggle Screenshot Mode'
  },
  openColorManager: {
    key: 'k',
    ctrlKey: true,
    altKey: true,
    description: 'Open Color Manager'
  },
  focusSearch: {
    key: 'f',
    ctrlKey: true,
    description: 'Focus Search'
  },
  toggleSidebar: {
    key: 'b',
    ctrlKey: true,
    description: 'Toggle Sidebar'
  },
  selectCompareSlot1: {
    key: '1',
    ctrlKey: true,
    description: 'Select first slot for comparison'
  },
  selectCompareSlot2: {
    key: '2',
    ctrlKey: true,
    description: 'Select second slot for comparison'
  },
  toggleCompareMode: {
    key: 'm',
    ctrlKey: true,
    shiftKey: true,
    description: 'Toggle Compare Mode'
  },
  clearCompareSelection: {
    key: 'Escape',
    description: 'Clear comparison selection'
  },
  // Compare mode shortcuts for Thinking Workspace
  selectSlot1: {
    key: '1',
    altKey: true,
    description: 'Select Slot 1 for Compare'
  },
  selectSlot2: {
    key: '2',
    altKey: true,
    description: 'Select Slot 2 for Compare'
  },
  selectSlot3: {
    key: '3',
    altKey: true,
    description: 'Select Slot 3 for Compare'
  },
  clearCompare: {
    key: 'Escape',
    description: 'Clear Compare Selection'
  }
} as const;

export default useKeyboardShortcuts;
