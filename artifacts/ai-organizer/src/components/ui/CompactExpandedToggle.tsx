import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { useTheme } from "../../context/ThemeContext";

export type CompactExpandedMode = "compact" | "expanded";

interface CompactExpandedToggleProps {
  mode?: CompactExpandedMode;
  defaultMode?: CompactExpandedMode;
  onModeChange?: (mode: CompactExpandedMode) => void;
  storageKey?: string;
}

export function CompactExpandedToggle({
  mode,
  defaultMode = "compact",
  onModeChange,
  storageKey,
}: CompactExpandedToggleProps) {
  const isControlled = mode !== undefined;
  const { isDark } = useTheme();

  const [uncontrolledMode, setUncontrolledMode] = useState<CompactExpandedMode>(() => {
    if (typeof window === "undefined") return defaultMode;
    if (!storageKey) return defaultMode;
    const stored = window.localStorage.getItem(storageKey);
    return stored === "compact" || stored === "expanded" ? stored : defaultMode;
  });

  const uiMode = isControlled ? mode : uncontrolledMode;

  const setMode = (next: CompactExpandedMode) => {
    if (uiMode === next) return;
    if (!isControlled) {
      setUncontrolledMode(next);
    }
    onModeChange?.(next);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isControlled) return;
    if (!storageKey) return;
    window.localStorage.setItem(storageKey, uiMode);
  }, [isControlled, storageKey, uiMode]);

  const baseChipStyle: CSSProperties = {
    border: `1px solid hsl(var(--border))`,
    background: isDark ? "hsl(var(--muted) / 0.5)" : "hsl(var(--card))",
    color: "hsl(var(--foreground))",
    borderRadius: "999px",
    padding: "6px 12px",
    fontSize: "12px",
    cursor: "pointer",
    textDecoration: "none",
    transition: "all 0.15s ease",
  };

  const activeChipStyle: CSSProperties = {
    borderColor: "hsl(var(--primary) / 0.6)",
    color: "hsl(var(--primary))",
    background: "hsl(var(--primary) / 0.12)",
  };

  const compactStyle = useMemo(() => ({
    ...baseChipStyle,
    ...(uiMode === "compact" ? activeChipStyle : {}),
  }), [uiMode, isDark]);

  const expandedStyle = useMemo(() => ({
    ...baseChipStyle,
    ...(uiMode === "expanded" ? activeChipStyle : {}),
  }), [uiMode, isDark]);

  return (
    <div
      className="compact-expanded-toggle"
      style={{
        position: "fixed",
        top: 16,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 10002,
        display: "flex",
        gap: 8,
        padding: 8,
        borderRadius: "var(--radius)",
        backdropFilter: "blur(12px)",
        background: isDark ? "hsl(var(--card) / 0.9)" : "hsl(var(--card))",
        border: `1px solid hsl(var(--border))`,
        boxShadow: isDark
          ? "0 4px 20px hsl(var(--background) / 0.5)"
          : "0 4px 16px hsl(var(--foreground) / 0.08)",
      }}
    >
      <button
        type="button"
        onClick={() => setMode("compact")}
        aria-pressed={uiMode === "compact"}
        style={compactStyle}
        onFocus={(e) => {
          e.currentTarget.style.outline = '2px solid hsl(var(--primary) / 0.6)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.outline = 'none';
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setMode("compact");
          }
        }}
        tabIndex={0}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M4 6h16M4 12h10M4 18h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Compact
        </span>
      </button>
      <button
        type="button"
        onClick={() => setMode("expanded")}
        aria-pressed={uiMode === "expanded"}
        style={expandedStyle}
        onFocus={(e) => {
          e.currentTarget.style.outline = '2px solid hsl(var(--primary) / 0.6)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.outline = 'none';
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setMode("expanded");
          }
        }}
        tabIndex={0}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Expanded
        </span>
      </button>
    </div>
  );
}