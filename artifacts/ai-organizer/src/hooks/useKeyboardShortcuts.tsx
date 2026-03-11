/**
 * useKeyboardShortcuts - Global keyboard shortcuts system
 * Provides consistent keyboard navigation across the application
 */

import { useEffect, useCallback, useState, createContext, useContext, ReactNode } from "react";

// Shortcut definition type
export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  action: () => void;
  category?: string;
  enabled?: boolean;
}

// Context for managing shortcuts globally
interface ShortcutsContextType {
  shortcuts: KeyboardShortcut[];
  registerShortcut: (shortcut: KeyboardShortcut) => void;
  unregisterShortcut: (key: string, modifiers?: { ctrl?: boolean; shift?: boolean; alt?: boolean }) => void;
  showHelp: boolean;
  setShowHelp: (show: boolean) => void;
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

const ShortcutsContext = createContext<ShortcutsContextType | null>(null);

// Provider component
interface ShortcutsProviderProps {
  children: ReactNode;
}

export const ShortcutsProvider: React.FC<ShortcutsProviderProps> = ({ children }) => {
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [enabled, setEnabled] = useState(true);

  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    setShortcuts((prev) => {
      // Remove existing shortcut with same key combo
      const filtered = prev.filter(
        (s) => !(s.key === shortcut.key && s.ctrl === shortcut.ctrl && s.shift === shortcut.shift && s.alt === shortcut.alt)
      );
      return [...filtered, shortcut];
    });
  }, []);

  const unregisterShortcut = useCallback(
    (key: string, modifiers?: { ctrl?: boolean; shift?: boolean; alt?: boolean }) => {
      setShortcuts((prev) =>
        prev.filter(
          (s) =>
            !(s.key === key && s.ctrl === modifiers?.ctrl && s.shift === modifiers?.shift && s.alt === modifiers?.alt)
        )
      );
    },
    []
  );

  // Global keyboard event listener
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        // Allow Escape key even in inputs
        if (e.key !== "Escape") return;
      }

      // Toggle help modal with ?
      if (e.key === "?" && e.shiftKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setShowHelp((prev) => !prev);
        return;
      }

      // Find matching shortcut
      const matchingShortcut = shortcuts.find(
        (s) =>
          s.key.toLowerCase() === e.key.toLowerCase() &&
          !!s.ctrl === e.ctrlKey &&
          !!s.shift === e.shiftKey &&
          !!s.alt === e.altKey &&
          s.enabled !== false
      );

      if (matchingShortcut) {
        e.preventDefault();
        matchingShortcut.action();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts, enabled]);

  return (
    <ShortcutsContext.Provider
      value={{
        shortcuts,
        registerShortcut,
        unregisterShortcut,
        showHelp,
        setShowHelp,
        enabled,
        setEnabled,
      }}
    >
      {children}
      {showHelp && <KeyboardShortcutsHelp onClose={() => setShowHelp(false)} />}
    </ShortcutsContext.Provider>
  );
};

// Hook to access shortcuts context
export const useShortcutsContext = () => {
  const context = useContext(ShortcutsContext);
  if (!context) {
    throw new Error("useShortcutsContext must be used within ShortcutsProvider");
  }
  return context;
};

// Hook to register shortcuts in components
export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[], deps: any[] = []) => {
  const context = useContext(ShortcutsContext);

  useEffect(() => {
    if (!context) return;

    shortcuts.forEach((shortcut) => {
      context.registerShortcut(shortcut);
    });

    return () => {
      shortcuts.forEach((shortcut) => {
        context.unregisterShortcut(shortcut.key, {
          ctrl: shortcut.ctrl,
          shift: shortcut.shift,
          alt: shortcut.alt,
        });
      });
    };
  }, [context, ...deps]);
};

// Simple hook for standalone usage without context
export const useKeyboardShortcut = (
  key: string,
  callback: () => void,
  options?: {
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    enabled?: boolean;
  }
) => {
  useEffect(() => {
    if (options?.enabled === false) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        if (e.key !== "Escape") return;
      }

      if (
        e.key.toLowerCase() === key.toLowerCase() &&
        !!options?.ctrl === e.ctrlKey &&
        !!options?.shift === e.shiftKey &&
        !!options?.alt === e.altKey
      ) {
        e.preventDefault();
        callback();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [key, callback, options?.ctrl, options?.shift, options?.alt, options?.enabled]);
};

// Help modal component
const KeyboardShortcutsHelp: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const context = useContext(ShortcutsContext);
  const shortcuts = context?.shortcuts || [];

  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce<Record<string, KeyboardShortcut[]>>((acc, shortcut) => {
    const category = shortcut.category || "General";
    if (!acc[category]) acc[category] = [];
    acc[category].push(shortcut);
    return acc;
  }, {});

  const formatKey = (shortcut: KeyboardShortcut): string => {
    const parts: string[] = [];
    if (shortcut.ctrl) parts.push("Ctrl");
    if (shortcut.alt) parts.push("Alt");
    if (shortcut.shift) parts.push("Shift");
    if (shortcut.meta) parts.push("⌘");
    parts.push(shortcut.key.toUpperCase());
    return parts.join(" + ");
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #1e1e2e 0%, #181825 100%)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "16px",
          padding: "24px",
          maxWidth: "600px",
          width: "90%",
          maxHeight: "80vh",
          overflow: "auto",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 600, color: "#eaeaea" }}>
            ⌨️ Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: "6px 12px",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "6px",
              color: "#94a3b8",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            ESC to close
          </button>
        </div>

        <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "16px" }}>
          Press <kbd style={{ ...kbdStyle }}>Shift</kbd> + <kbd style={{ ...kbdStyle }}>?</kbd> to toggle this help
        </div>

        {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
          <div key={category} style={{ marginBottom: "20px" }}>
            <h3
              style={{
                margin: "0 0 10px",
                fontSize: "13px",
                fontWeight: 600,
                color: "#a5b4fc",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {category}
            </h3>
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.06)",
                overflow: "hidden",
              }}
            >
              {categoryShortcuts.map((shortcut, idx) => (
                <div
                  key={`${shortcut.key}-${idx}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 14px",
                    borderBottom: idx < categoryShortcuts.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  }}
                >
                  <span style={{ fontSize: "13px", color: "#d4d4d8" }}>{shortcut.description}</span>
                  <kbd style={{ ...kbdStyle }}>{formatKey(shortcut)}</kbd>
                </div>
              ))}
            </div>
          </div>
        ))}

        {shortcuts.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
            No shortcuts registered on this page
          </div>
        )}
      </div>
    </div>
  );
};

const kbdStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "4px 8px",
  background: "rgba(255,255,255,0.1)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: "4px",
  fontSize: "11px",
  fontFamily: "monospace",
  color: "#e2e8f0",
  boxShadow: "0 2px 0 rgba(0,0,0,0.3)",
};

// Shortcut hint badge component
interface ShortcutHintProps {
  shortcut: string;
  style?: React.CSSProperties;
}

export const ShortcutHint: React.FC<ShortcutHintProps> = ({ shortcut, style }) => (
  <kbd
    style={{
      ...kbdStyle,
      fontSize: "10px",
      padding: "2px 6px",
      marginLeft: "6px",
      ...style,
    }}
  >
    {shortcut}
  </kbd>
);

export default useKeyboardShortcuts;
