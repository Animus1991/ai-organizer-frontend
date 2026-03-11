/**
 * KeyboardShortcutsHelp - Displays available keyboard shortcuts
 * Triggered by pressing '?' key
 */

import { useState, useEffect } from 'react';

interface ShortcutGroup {
  title: string;
  shortcuts: { keys: string; description: string }[];
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: 'Ctrl + /', description: 'Open AI Chat' },
      { keys: 'Ctrl + Alt + C', description: 'Toggle Compact Mode' },
      { keys: 'Ctrl + Alt + E', description: 'Toggle Expanded Mode' },
      { keys: 'Escape', description: 'Close modal / Cancel' },
    ],
  },
  {
    title: 'Workspace',
    shortcuts: [
      { keys: 'Ctrl + M', description: 'Toggle Compare Mode' },
      { keys: 'Alt + 1-9', description: 'Select slot for compare' },
      { keys: 'Ctrl + S', description: 'Save current work' },
    ],
  },
  {
    title: 'Search',
    shortcuts: [
      { keys: 'Ctrl + K', description: 'Focus search' },
      { keys: 'Enter', description: 'Execute search' },
      { keys: 'Arrow Up/Down', description: 'Navigate results' },
    ],
  },
  {
    title: 'Editor',
    shortcuts: [
      { keys: 'Ctrl + B', description: 'Bold text' },
      { keys: 'Ctrl + I', description: 'Italic text' },
      { keys: 'Ctrl + Z', description: 'Undo' },
      { keys: 'Ctrl + Shift + Z', description: 'Redo' },
    ],
  },
];

export function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setIsOpen(prev => !prev);
        }
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={() => setIsOpen(false)}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(30, 30, 40, 0.98) 0%, rgba(20, 20, 30, 0.98) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '32px',
          maxWidth: '800px',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#eaeaea', margin: 0 }}>
            ⌨️ Keyboard Shortcuts
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              color: '#eaeaea',
              cursor: 'pointer',
            }}
          >
            Press Escape or ? to close
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {shortcutGroups.map((group) => (
            <div key={group.title}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#6366f1', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {group.title}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {group.shortcuts.map((shortcut, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '8px',
                    }}
                  >
                    <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)' }}>
                      {shortcut.description}
                    </span>
                    <kbd
                      style={{
                        background: 'rgba(99, 102, 241, 0.2)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        color: '#a5b4fc',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {shortcut.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p style={{ marginTop: '24px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)', textAlign: 'center' }}>
          Press <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>?</kbd> anywhere to toggle this help
        </p>
      </div>
    </div>
  );
}

export default KeyboardShortcutsHelp;
