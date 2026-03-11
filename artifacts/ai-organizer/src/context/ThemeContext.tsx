/**
 * ThemeContext - Dark/Light mode theme management
 * Provides consistent theming across the entire application
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

// Theme types
export type ThemeMode = "dark" | "light" | "system" | "dashboard" | "github";

// Theme color palette
export interface ThemeColors {
  // Backgrounds
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgHover: string;
  bgActive: string;
  bgCard: string;
  bgInput: string;
  bgOverlay: string;
  
  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textDisabled: string;
  
  // Borders
  borderPrimary: string;
  borderSecondary: string;
  borderFocus: string;
  
  // Accents
  accentPrimary: string;
  accentSecondary: string;
  accentSuccess: string;
  accentWarning: string;
  accentError: string;
  accentInfo: string;
  
  // Shadows
  shadowSm: string;
  shadowMd: string;
  shadowLg: string;
}

// Dark theme colors
const darkColors: ThemeColors = {
  bgPrimary: "#1a1a22",
  bgSecondary: "#1f1f28",
  bgTertiary: "#26262f",
  bgHover: "rgba(255, 255, 255, 0.06)",
  bgActive: "rgba(255, 255, 255, 0.1)",
  bgCard: "rgba(255, 255, 255, 0.03)",
  bgInput: "rgba(255, 255, 255, 0.05)",
  bgOverlay: "rgba(0, 0, 0, 0.7)",
  
  textPrimary: "#eaeaea",
  textSecondary: "#a1a1aa",
  textMuted: "#71717a",
  textDisabled: "#52525b",
  
  borderPrimary: "rgba(255, 255, 255, 0.12)",
  borderSecondary: "rgba(255, 255, 255, 0.06)",
  borderFocus: "rgba(99, 102, 241, 0.5)",
  
  accentPrimary: "#6366f1",
  accentSecondary: "#8b5cf6",
  accentSuccess: "#10b981",
  accentWarning: "#f59e0b",
  accentError: "#ef4444",
  accentInfo: "#06b6d4",
  
  shadowSm: "0 1px 2px rgba(0, 0, 0, 0.3)",
  shadowMd: "0 4px 6px rgba(0, 0, 0, 0.4)",
  shadowLg: "0 10px 25px rgba(0, 0, 0, 0.5)",
};

// Light theme colors - Warm professional palette (rich beige backgrounds + deep-blue text)
// Provides bright surfaces with subtle warmth and dark-blue default typography
const lightColors: ThemeColors = {
  // Backgrounds - Warm, high-contrast neutrals
  bgPrimary: "#f8f1e7",      // Warm ivory base
  bgSecondary: "#f1e4d6",    // Soft sand for panels
  bgTertiary: "#e5d2bf",     // Muted biscotti for raised elements
  // Cocoa-toned interactive states (20% lighter than pure black)
  bgHover: "rgba(96, 75, 58, 0.08)",   // Warm hover tint
  bgActive: "rgba(96, 75, 58, 0.16)",  // Noticeable active state
  bgCard: "#fffdf9",         // Off-white cards prevent glare
  bgInput: "#fffaf2",        // Slightly tinted inputs for depth
  bgOverlay: "rgba(73, 54, 40, 0.32)", // Soft espresso overlay for dialogs
  
  // Text - Deep blue for readability in light mode
  textPrimary: "#2f2941",    // Rich dark-blue per user preference
  textSecondary: "#4a3223",  // Dark mocha
  textMuted: "#715740",      // Muted caramel
  textDisabled: "#a3866c",   // Soft almond
  
  // Borders - Clean neutral separators (SaaS standard, no warm tinting)
  borderPrimary: "rgba(0, 0, 0, 0.09)",
  borderSecondary: "rgba(0, 0, 0, 0.05)",
  borderFocus: "rgba(99, 102, 241, 0.45)",  // Indigo focus ring
  
  // Accents - Keep existing vibrant system colors for familiarity
  accentPrimary: "#5b5bd6",
  accentSecondary: "#7c3aed",
  accentSuccess: "#059669",
  accentWarning: "#d97706",
  accentError: "#dc2626",
  accentInfo: "#0891b2",
  
  // Shadows - Cocoa-tinted, 20% lighter than previous blacks
  shadowSm: "0 1px 2px rgba(73, 54, 40, 0.08)",
  shadowMd: "0 4px 6px rgba(73, 54, 40, 0.12)",
  shadowLg: "0 10px 25px rgba(73, 54, 40, 0.16)",
};

// Twilight theme colors - Elegant intermediate between dark and light
const twilightColors: ThemeColors = {
  bgPrimary: "#1e2330",      // Deep blue-gray
  bgSecondary: "#252b3b",    // Slightly lighter blue-gray
  bgTertiary: "#2d3548",     // Medium blue-gray
  bgHover: "rgba(148, 163, 194, 0.1)",
  bgActive: "rgba(148, 163, 194, 0.15)",
  bgCard: "rgba(148, 163, 194, 0.05)",
  bgInput: "rgba(148, 163, 194, 0.08)",
  bgOverlay: "rgba(15, 18, 25, 0.75)",
  
  textPrimary: "#e2e8f0",    // Soft white-blue
  textSecondary: "#94a3b8",  // Muted blue-gray
  textMuted: "#64748b",      // Darker muted
  textDisabled: "#475569",   // Disabled gray
  
  borderPrimary: "rgba(148, 163, 194, 0.15)",
  borderSecondary: "rgba(148, 163, 194, 0.08)",
  borderFocus: "rgba(129, 140, 248, 0.5)",
  
  accentPrimary: "#818cf8",  // Soft indigo
  accentSecondary: "#a78bfa", // Soft violet
  accentSuccess: "#34d399",
  accentWarning: "#fbbf24",
  accentError: "#f87171",
  accentInfo: "#22d3ee",
  
  shadowSm: "0 1px 2px rgba(0, 0, 0, 0.25)",
  shadowMd: "0 4px 6px rgba(0, 0, 0, 0.35)",
  shadowLg: "0 10px 25px rgba(0, 0, 0, 0.45)",
};

// GitHub theme colors - matches GitHub's dark UI (softened ~20% lighter for less harsh contrast)
const githubColors: ThemeColors = {
  bgPrimary: "#1a1e26",
  bgSecondary: "#22282f",
  bgTertiary: "#2d3238",
  bgHover: "rgba(177, 186, 196, 0.12)",
  bgActive: "rgba(177, 186, 196, 0.2)",
  bgCard: "rgba(26, 30, 38, 0.95)",
  bgInput: "#1a1e26",
  bgOverlay: "rgba(1, 4, 9, 0.8)",

  textPrimary: "#e6edf3",
  textSecondary: "#8b949e",
  textMuted: "#6e7681",
  textDisabled: "#484f58",

  borderPrimary: "#30363d",
  borderSecondary: "#21262d",
  borderFocus: "#1f6feb",

  accentPrimary: "#58a6ff",
  accentSecondary: "#bc8cff",
  accentSuccess: "#3fb950",
  accentWarning: "#d29922",
  accentError: "#f85149",
  accentInfo: "#58a6ff",

  shadowSm: "0 1px 0 rgba(27, 31, 36, 0.04)",
  shadowMd: "0 3px 6px rgba(1, 4, 9, 0.3)",
  shadowLg: "0 8px 24px rgba(1, 4, 9, 0.4)",
};

// GitHub style constants — React CSSProperties for per-component use (softened to match githubColors)
export const GITHUB_CARD: React.CSSProperties = {
  background: "#22282f",
  border: "1px solid #30363d",
  borderRadius: "6px",
  boxShadow: "0 1px 0 rgba(27, 31, 36, 0.04)",
  color: "#e6edf3",
};

export const GITHUB_BTN: React.CSSProperties = {
  background: "#2d3238",
  border: "1px solid #30363d",
  color: "#c9d1d9",
  borderRadius: "6px",
};

export const GITHUB_BTN_PRIMARY: React.CSSProperties = {
  background: "#238636",
  border: "1px solid rgba(240, 246, 252, 0.1)",
  color: "#ffffff",
  borderRadius: "6px",
};

export const GITHUB_PAGE_BG = "#1a1e26";

// Dashboard theme colors - matches EvidenceDebtDashboard styling (softened ~20%)
const dashboardColors: ThemeColors = {
  bgPrimary: "#161618",
  bgSecondary: "#1a1a26",
  bgTertiary: "#1f1f2a",
  bgHover: "rgba(255, 255, 255, 0.06)",
  bgActive: "rgba(255, 255, 255, 0.1)",
  bgCard: "rgba(20, 20, 30, 0.8)",
  bgInput: "rgba(255, 255, 255, 0.05)",
  bgOverlay: "rgba(0, 0, 0, 0.7)",
  
  textPrimary: "#eaeaea",
  textSecondary: "rgba(255, 255, 255, 0.6)",
  textMuted: "rgba(255, 255, 255, 0.5)",
  textDisabled: "rgba(255, 255, 255, 0.3)",
  
  borderPrimary: "rgba(255, 255, 255, 0.08)",
  borderSecondary: "rgba(255, 255, 255, 0.05)",
  borderFocus: "rgba(99, 102, 241, 0.5)",
  
  accentPrimary: "#6366f1",
  accentSecondary: "#8b5cf6",
  accentSuccess: "#10b981",
  accentWarning: "#f59e0b",
  accentError: "#ef4444",
  accentInfo: "#06b6d4",
  
  shadowSm: "0 1px 2px rgba(0, 0, 0, 0.3)",
  shadowMd: "0 4px 24px rgba(0, 0, 0, 0.3)",
  shadowLg: "0 10px 25px rgba(0, 0, 0, 0.5)",
};

// Dashboard style constants — React CSSProperties for per-component use
export const DASHBOARD_CARD: React.CSSProperties = {
  background: "linear-gradient(135deg, rgba(20, 20, 30, 0.8) 0%, rgba(15, 15, 25, 0.8) 100%)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  borderRadius: "16px",
  boxShadow: "0 4px 24px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05) inset",
  color: "#eaeaea",
};

// Light mode version of DASHBOARD_CARD (subtle border, no black)
export const DASHBOARD_CARD_LIGHT: React.CSSProperties = {
  background: "#ffffff",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(47, 41, 65, 0.06)",
  borderRadius: "16px",
  boxShadow: "0 4px 24px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(47, 41, 65, 0.03) inset",
  color: "#2f2941",
};

export const DASHBOARD_BTN: React.CSSProperties = {
  background: "transparent",
  border: "1px solid rgba(255, 255, 255, 0.12)",
  color: "#eaeaea",
  borderRadius: "8px",
};

// Light mode version of DASHBOARD_BTN
export const DASHBOARD_BTN_LIGHT: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid rgba(47, 41, 65, 0.15)",
  color: "#2f2941",
  borderRadius: "8px",
};

export const DASHBOARD_PAGE_BG = "linear-gradient(135deg, #161618 0%, #1a1a26 50%, #161618 100%)";

// Context type
interface ThemeContextType {
  mode: ThemeMode;
  resolvedMode: "dark" | "light";
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  isDark: boolean;
}

const twilightLightColors: ThemeColors = {
  ...lightColors,
  bgPrimary: "#b8bcc8",      // 25% darker blue-gray
  bgSecondary: "#b2b6c2",    // 25% darker
  bgTertiary: "#aaaebc",     // 25% darker
  bgHover: "rgba(99, 102, 241, 0.10)",
  bgActive: "rgba(99, 102, 241, 0.16)",
  bgCard: "rgba(99, 102, 241, 0.06)",
  borderPrimary: "rgba(99, 102, 241, 0.22)",
  borderSecondary: "rgba(99, 102, 241, 0.12)",
};

const defaultThemeContext: ThemeContextType = {
  mode: "dark",
  resolvedMode: "dark",
  colors: darkColors,
  setMode: () => {},
  toggleMode: () => {},
  isDark: true,
};

const ThemeContext = createContext<ThemeContextType>(defaultThemeContext);

// Provider props
interface ThemeProviderProps {
  children: ReactNode;
  defaultMode?: ThemeMode;
  storageKey?: string;
}

// Dashboard override CSS — only for class-based UI adjustments (scrollbar, font-size, glass effects)
// Color tokens are handled by [data-theme="dashboard"] in index.css
function getDashboardOverrideCSS(): string {
  return `
    /* ============ DASHBOARD THEME — UI ADJUSTMENTS ============ */
    html.dashboard-active { font-size: 15px !important; }

    /* Glass card panels — backdrop-filter enhancement */
    .dashboard-active .card,
    .dashboard-active .card-compact,
    .dashboard-active .card-spacious,
    .dashboard-active .card-panel,
    .dashboard-active .panel {
      backdrop-filter: blur(20px) !important;
      border-radius: 16px !important;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05) inset !important;
    }

    /* Scrollbar */
    .dashboard-active ::-webkit-scrollbar-track { background: hsl(240 20% 6%); }
    .dashboard-active ::-webkit-scrollbar-thumb { background: hsl(240 10% 22%); }
    .dashboard-active ::-webkit-scrollbar-thumb:hover { background: hsl(240 10% 30%); }
  `;
}

// GitHub override CSS — only for class-based UI adjustments (scrollbar, border-radius, tabs)
// Color tokens are handled by [data-theme="github"] in index.css
function getGithubOverrideCSS(): string {
  return `
    /* ============ GITHUB THEME — UI ADJUSTMENTS ============ */
    html.github-active { font-size: 14px !important; }

    /* Card panels — GitHub flat style, no blur/glass */
    .github-active .card,
    .github-active .card-compact,
    .github-active .card-spacious,
    .github-active .card-panel,
    .github-active .panel {
      backdrop-filter: none !important;
      border-radius: 6px !important;
      box-shadow: 0 1px 0 rgba(27, 31, 36, 0.04) !important;
    }

    /* Tab-like navigation — GitHub underline tabs */
    .github-active [role="tablist"] button,
    .github-active [role="tablist"] a {
      border-bottom: 2px solid transparent !important;
      border-radius: 0 !important;
      background: transparent !important;
      font-weight: 500 !important;
    }
    .github-active [role="tablist"] button[aria-selected="true"],
    .github-active [role="tablist"] button.active,
    .github-active [role="tablist"] a.active {
      border-bottom-color: #f78166 !important;
    }

    /* Scrollbar — GitHub style */
    .github-active ::-webkit-scrollbar { width: 8px; height: 8px; }
    .github-active ::-webkit-scrollbar-track { background: hsl(215 21% 11%); }
    .github-active ::-webkit-scrollbar-thumb { background: hsl(215 14% 20%); border-radius: 4px; }
    .github-active ::-webkit-scrollbar-thumb:hover { background: hsl(215 10% 30%); }
  `;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultMode = "dark",
  storageKey = "app-theme-mode",
}) => {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return defaultMode;
    const stored = localStorage.getItem(storageKey);
    if (stored === "dark" || stored === "light" || stored === "system" || stored === "dashboard" || stored === "github") {
      return stored as ThemeMode;
    }
    return defaultMode;
  });

  const [systemPreference, setSystemPreference] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      setSystemPreference(e.matches ? "dark" : "light");
    };
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Resolve actual theme mode
  const resolvedMode: "dark" | "light" = mode === "system" ? systemPreference : (mode === "dashboard" || mode === "github" ? "dark" : mode);
  const colors =
    mode === "github" ? githubColors
    : mode === "dashboard" ? dashboardColors
    : mode === "system"
      ? (systemPreference === "dark" ? twilightColors : twilightLightColors)
      : (mode === "dark" ? darkColors : lightColors);
  const isDark = resolvedMode === "dark";

  // Set mode with persistence
  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem(storageKey, newMode);
  }, [storageKey]);

  // Toggle between dark and light
  const toggleMode = useCallback(() => {
    const newMode = resolvedMode === "dark" ? "light" : "dark";
    setMode(newMode);
  }, [resolvedMode, setMode]);

  // Apply theme to document
  useEffect(() => {
    const isDashboardMode = mode === "dashboard";
    const isGithubMode = mode === "github";

    // 1. Set data-theme attribute + .dark class (required by index.css CSS variables)
    // Determine the data-theme value based on mode + layout theme
    const layoutThemeStored = localStorage.getItem("app-layout-theme") || "futuristic";
    const appearanceStored = localStorage.getItem("app-appearance");
    let dataTheme: string;
    if (isGithubMode) {
      dataTheme = "github";
    } else if (isDashboardMode) {
      dataTheme = "dashboard";
    } else if (appearanceStored === "minimal" || (mode === "dark" && layoutThemeStored === "minimal" && appearanceStored !== "dark" && appearanceStored !== "futuristic")) {
      dataTheme = "minimal";
    } else if (appearanceStored === "futuristic" || (mode === "dark" && layoutThemeStored === "futuristic" && appearanceStored !== "dark")) {
      dataTheme = "futuristic";
    } else if (mode === "system") {
      dataTheme = "system";
    } else {
      dataTheme = resolvedMode;
    }
    document.documentElement.setAttribute("data-theme", dataTheme);
    document.documentElement.style.colorScheme = resolvedMode;
    // CRITICAL: Toggle .dark class so Tailwind/index.css :root/.dark CSS variables apply
    document.documentElement.classList.toggle("dark", isDark);

    // 2. Toggle theme classes on html and body for CSS targeting
    document.documentElement.classList.toggle("dashboard-active", isDashboardMode);
    document.body.classList.toggle("dashboard-active", isDashboardMode);
    document.documentElement.classList.toggle("github-active", isGithubMode);
    document.body.classList.toggle("github-active", isGithubMode);

    // 3. Apply CSS variables for theme colors
    const root = document.documentElement;
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${camelToKebab(key)}`, value);
    });

    const legacyVarMap: Record<string, keyof ThemeColors> = {
      "--bg-primary": "bgPrimary",
      "--bg-secondary": "bgSecondary",
      "--bg-tertiary": "bgTertiary",
      "--bg-hover": "bgHover",
      "--bg-active": "bgActive",
      "--bg-card": "bgCard",
      "--bg-input": "bgInput",
      "--bg-overlay": "bgOverlay",
      "--text-primary": "textPrimary",
      "--text-secondary": "textSecondary",
      "--text-muted": "textMuted",
      "--text-disabled": "textDisabled",
      "--border-primary": "borderPrimary",
      "--border-secondary": "borderSecondary",
      "--border-focus": "borderFocus",
      "--accent-primary": "accentPrimary",
      "--accent-secondary": "accentSecondary",
      "--accent-success": "accentSuccess",
      "--accent-warning": "accentWarning",
      "--accent-error": "accentError",
      "--accent-info": "accentInfo",
      "--shadow-sm": "shadowSm",
      "--shadow-md": "shadowMd",
      "--shadow-lg": "shadowLg",
    };

    Object.entries(legacyVarMap).forEach(([cssVar, colorKey]) => {
      root.style.setProperty(cssVar, colors[colorKey]);
    });

    // 4. Remove conflicting color-manager injections when dashboard/github is active
    if (isDashboardMode || isGithubMode) {
      document.querySelectorAll(
        'style[data-modern-color-manager], style[data-unified-theme], #ultimate-color-override'
      ).forEach((el) => el.remove());
    }

    // 5. Inject / remove dashboard override <style> tag (DOM-level, highest cascade)
    const DASH_ID = "dashboard-theme-override";
    const existingDash = document.getElementById(DASH_ID);
    if (isDashboardMode) {
      const style = existingDash || document.createElement("style");
      style.id = DASH_ID;
      style.textContent = getDashboardOverrideCSS();
      if (!existingDash) document.head.appendChild(style);
    } else {
      existingDash?.remove();
    }

    // 6. Inject / remove github override <style> tag
    const GH_ID = "github-theme-override";
    const existingGh = document.getElementById(GH_ID);
    if (isGithubMode) {
      const style = existingGh || document.createElement("style");
      style.id = GH_ID;
      style.textContent = getGithubOverrideCSS();
      if (!existingGh) document.head.appendChild(style);
    } else {
      existingGh?.remove();
    }
  }, [mode, resolvedMode, colors]);

  return (
    <ThemeContext.Provider
      value={{
        mode,
        resolvedMode,
        colors,
        setMode,
        toggleMode,
        isDark,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to use theme
export const useTheme = (): ThemeContextType => useContext(ThemeContext);

// Helper to convert camelCase to kebab-case
const camelToKebab = (str: string): string => {
  return str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
};

// Theme toggle button component
interface ThemeToggleProps {
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  size = "md",
  showLabel = false,
  className = "",
  style = {},
}) => {
  const { mode, resolvedMode, setMode, toggleMode, colors } = useTheme();

  const sizes = {
    sm: { padding: "6px 10px", fontSize: "12px", iconSize: "14px" },
    md: { padding: "8px 14px", fontSize: "13px", iconSize: "16px" },
    lg: { padding: "10px 18px", fontSize: "14px", iconSize: "18px" },
  };

  const currentSize = sizes[size];

  return (
    <div className={className} style={{ display: "flex", alignItems: "center", gap: "8px", ...style }}>
      <button
        onClick={toggleMode}
        title={`Current: ${resolvedMode} mode. Click to switch.`}
        style={{
          padding: currentSize.padding,
          background: colors.bgHover,
          border: `1px solid ${colors.borderPrimary}`,
          borderRadius: "10px",
          color: colors.textPrimary,
          fontSize: currentSize.fontSize,
          fontWeight: 500,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          transition: "all 0.2s ease",
        }}
      >
        <span style={{ fontSize: currentSize.iconSize }}>
          {resolvedMode === "dark" ? "🌙" : "☀️"}
        </span>
        {showLabel && <span>{resolvedMode === "dark" ? "Dark" : "Light"}</span>}
      </button>

      {/* Mode selector dropdown */}
      <select
        value={mode}
        onChange={(e) => setMode(e.target.value as ThemeMode)}
        style={{
          padding: "6px 10px",
          background: colors.bgInput,
          border: `1px solid ${colors.borderPrimary}`,
          borderRadius: "6px",
          color: colors.textSecondary,
          fontSize: "11px",
          cursor: "pointer",
        }}
      >
        <option value="dark">Dark</option>
        <option value="light">Light</option>
        <option value="system">System</option>
        <option value="dashboard">Dashboard</option>
        <option value="github">GitHub</option>
      </select>
    </div>
  );
};

// Compact toggle for headers
export const ThemeToggleCompact: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
  const { resolvedMode, toggleMode, colors } = useTheme();

  return (
    <button
      onClick={toggleMode}
      title={`Switch to ${resolvedMode === "dark" ? "light" : "dark"} mode`}
      style={{
        padding: "8px",
        background: "transparent",
        border: "none",
        borderRadius: "8px",
        color: colors.textSecondary,
        fontSize: "18px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s ease",
        ...style,
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.background = colors.bgHover;
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      {resolvedMode === "dark" ? "🌙" : "☀️"}
    </button>
  );
};

// CSS styles for theme support - GLOBAL APPLICATION
// Minimal version: components use hsl(var(--*)) tokens from index.css.
// Only global resets and essential overrides remain here.
export const ThemeStyles: React.FC = () => {
  const { isDark, colors } = useTheme();

  return (
    <style>{`
      :root {
        color-scheme: ${isDark ? "dark" : "light"};
        
        /* Legacy CSS Variables for backward compat */
        --bg-primary: ${colors.bgPrimary};
        --bg-secondary: ${colors.bgSecondary};
        --bg-tertiary: ${colors.bgTertiary};
        --bg-hover: ${colors.bgHover};
        --bg-input: ${colors.bgInput};
        --text-primary: ${colors.textPrimary};
        --text-secondary: ${colors.textSecondary};
        --text-muted: ${colors.textMuted};
        --border-primary: ${colors.borderPrimary};
        --border-secondary: ${colors.borderSecondary};
        --accent-primary: ${colors.accentPrimary};
        --accent-secondary: ${colors.accentSecondary};
        --shadow-color: ${isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.1)'};
      }
      
      /* ===== GLOBAL BACKGROUND ===== */
      html, body, #root {
        background: hsl(var(--background)) !important;
        color: hsl(var(--foreground)) !important;
      }
      
      /* Card panels */
      .card-panel {
        background: hsl(var(--card));
        border-color: hsl(var(--border));
        color: hsl(var(--foreground));
      }
      
      /* Headings */
      h1, h2, h3, h4, h5, h6 {
        color: hsl(var(--foreground));
      }
      
      /* Inputs */
      input, textarea, select {
        background: hsl(var(--card));
        color: hsl(var(--foreground));
        border-color: hsl(var(--border));
      }
      
      input::placeholder, textarea::placeholder {
        color: hsl(var(--muted-foreground));
      }
      
      /* Links */
      a {
        color: hsl(var(--primary));
      }
      
      /* Tables */
      table, th, td {
        border-color: hsl(var(--border));
      }
      th {
        background: hsl(var(--muted));
        color: hsl(var(--foreground));
      }
      
      /* Scrollbar */
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      ::-webkit-scrollbar-track {
        background: ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'};
      }
      ::-webkit-scrollbar-thumb {
        background: ${isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.14)'};
        border-radius: 4px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: ${isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.22)'};
      }

      /* Dialogs and dropdowns */
      [role="dialog"], .modal, .dialog {
        background: hsl(var(--card));
        color: hsl(var(--foreground));
        border: 1px solid hsl(var(--border));
      }
      [role="menu"], .dropdown, .menu {
        background: hsl(var(--card));
        color: hsl(var(--foreground));
        border: 1px solid hsl(var(--border));
      }
      
      /* Transition for theme changes */
      body, .card-panel, .theme-transition {
        transition: background-color 0.3s ease, background 0.3s ease, border-color 0.3s ease, color 0.2s ease;
      }
    `}</style>
  );
};

export default ThemeContext;
