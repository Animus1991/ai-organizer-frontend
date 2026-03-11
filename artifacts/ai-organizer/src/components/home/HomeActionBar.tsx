// src/components/home/HomeActionBar.tsx
// Command bar — 2-row layout (CoFounderBay-inspired grouping):
// Row 1: [📤 Upload · 🔍 Search · 📚 Library]    [right: 🔲 Grid · 🎴 3D · 🎠 Carousel]
// Row 2: [🗑 Bin]                              [right: 📚 Research · 🏗 Theory · 🔬 Lab · 🧠 Thinking]
// Tour button lives as a fixed FAB in Home.tsx (not here)
// Benchmark pill lives in HomeHeader under subtitle
import React, { useMemo } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";

export interface HomeActionBarProps {
  onStartTour: () => void;
  onNavigate: (path: string) => void;
  onSearch: () => void;
  onUploadClick: () => void;
  homeWidgetViewMode: "grid" | "carousel3d" | "carousel";
  onViewModeChange: (mode: "grid" | "carousel3d" | "carousel") => void;
}

// Detect OS once at module level for performance
const isMac = typeof navigator !== "undefined" &&
  /Mac|iPhone|iPod|iPad/.test(navigator.platform || navigator.userAgent);

// OS-aware keyboard shortcut badge with tooltip showing both Mac+Win
function ShortcutBadge({
  mac, win, isDark,
}: { mac: string; win: string; isDark: boolean }) {
  const label = isMac ? mac : win;
  const tooltip = isMac ? `Mac: ${mac}  |  Windows: ${win}` : `Windows: ${win}  |  Mac: ${mac}`;
  return (
    <span
      title={tooltip}
      style={{
        fontSize: "8px", fontWeight: 700, letterSpacing: "0.08em",
        padding: "1px 5px", borderRadius: "4px",
        background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)",
        border: isDark ? "1px solid rgba(255,255,255,0.13)" : "1px solid rgba(0,0,0,0.10)",
        color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.42)",
        lineHeight: 1.5, flexShrink: 0, cursor: "help",
        fontFamily: "ui-monospace, 'SF Mono', Consolas, monospace",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

// Upload button uses white text, so always dark badge style
function UploadShortcutBadge({ mac, win }: { mac: string; win: string }) {
  const label = isMac ? mac : win;
  const tooltip = isMac ? `Mac: ${mac}  |  Windows: ${win}` : `Windows: ${win}  |  Mac: ${mac}`;
  return (
    <span
      title={tooltip}
      style={{
        fontSize: "8px", fontWeight: 700, letterSpacing: "0.08em",
        padding: "1px 5px", borderRadius: "4px",
        background: "rgba(255,255,255,0.18)",
        border: "1px solid rgba(255,255,255,0.28)",
        color: "rgba(255,255,255,0.75)",
        lineHeight: 1.5, flexShrink: 0, cursor: "help",
        fontFamily: "ui-monospace, 'SF Mono', Consolas, monospace",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

export const HomeActionBar: React.FC<HomeActionBarProps> = ({
  onStartTour,
  onNavigate,
  onSearch,
  onUploadClick,
  homeWidgetViewMode,
  onViewModeChange,
}) => {
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();

  const btnBase: React.CSSProperties = useMemo(() => ({
    background: "transparent",
    border: "1px solid transparent",
    outline: "none",
    color: colors.textSecondary,
    borderRadius: "7px",
    padding: "4px 9px",
    cursor: "pointer",
    fontSize: "11.5px",
    fontWeight: 500,
    transition: "background 0.14s ease, color 0.14s ease, transform 0.14s ease",
    whiteSpace: "nowrap" as const,
    display: "flex",
    alignItems: "center",
    gap: "5px",
  }), [colors.textSecondary]);

  const sep = (
    <div style={{
      width: "1px", height: "16px",
      background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
      flexShrink: 0, margin: "0 2px",
    }} />
  );

  const hoverOn = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.045)";
    e.currentTarget.style.color = colors.textPrimary;
    e.currentTarget.style.transform = "translateY(-1px)";
  };
  const hoverOff = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = "transparent";
    e.currentTarget.style.color = colors.textSecondary;
    e.currentTarget.style.transform = "translateY(0)";
  };

  const rowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "4px",
    minHeight: "30px",
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "3px",
      marginTop: "8px",
      padding: "6px 10px",
      borderRadius: "11px",
      background: isDark ? "rgba(255,255,255,0.025)" : "#ffffff",
      border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.07)",
      boxShadow: isDark ? "none" : "0 1px 4px rgba(0,0,0,0.05)",
    }}>

      {/* ══ ROW 1: View Mode toggles (right) + Search ════ */}
      <div style={rowStyle}>

        {/* LEFT: empty spacer */}
        <div style={{ flex: 1 }} />

        {/* RIGHT: Grid · 3D · Carousel + Search Ctrl+S */}
        <div style={{ display: "flex", alignItems: "center", gap: "2px", flexShrink: 0 }}>
          {([
            { mode: "grid" as const,       icon: "🔲", label: t("home.viewMode.grid") || "Grid",      mac: "G", win: "G" },
            { mode: "carousel3d" as const, icon: "🎴", label: t("home.viewMode.carousel3d") || "3D",  mac: "3", win: "3" },
            { mode: "carousel" as const,   icon: "🎠", label: t("home.viewMode.carousel") || "Carousel", mac: "C", win: "C" },
          ]).map(({ mode, icon, label, mac, win }) => {
            const isActive = homeWidgetViewMode === mode;
            const modeTitle = mode === "carousel"
              ? `${label} — Ctrl+K (Win) · ⌘K (Mac)`
              : `${label} (${isMac ? mac : win})`;
            return (
              <button
                key={mode}
                onClick={() => onViewModeChange(mode)}
                title={modeTitle}
                style={{
                  ...btnBase,
                  background: isActive
                    ? (isDark ? "rgba(99,102,241,0.20)" : "rgba(99,102,241,0.09)")
                    : "transparent",
                  color: isActive ? (isDark ? "#a5b4fc" : "#4338ca") : colors.textSecondary,
                  fontWeight: isActive ? 700 : 500,
                  border: isActive
                    ? (isDark ? "1px solid rgba(99,102,241,0.32)" : "1px solid rgba(99,102,241,0.18)")
                    : "1px solid transparent",
                  boxShadow: isActive && !isDark ? "0 1px 4px rgba(99,102,241,0.15)" : "none",
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";
                    e.currentTarget.style.color = colors.textPrimary;
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = colors.textSecondary;
                    e.currentTarget.style.transform = "translateY(0)";
                  }
                }}
              >
                {icon} {label}
                <ShortcutBadge mac={mac} win={win} isDark={isDark} />
              </button>
            );
          })}

          {/* Separator */}
          <div style={{
            width: "1px", height: "16px",
            background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
            flexShrink: 0, margin: "0 2px",
          }} />

          {/* Search Ctrl+S */}
          <button
            onClick={onSearch}
            title={isMac ? "Search — ⌘S" : "Search — Ctrl+S"}
            style={btnBase}
            onMouseEnter={hoverOn}
            onMouseLeave={hoverOff}
          >
            � {t("action.search") || "Search"}
            <ShortcutBadge mac="⌘S" win="Ctrl+S" isDark={isDark} />
          </button>
        </div>
      </div>

      {/* ── Row separator ──────────────────────────────────────────── */}
      <div style={{
        height: "1px",
        background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
        margin: "0 -2px",
      }} />

      {/* ══ ROW 2: Recycle Bin (left) + Workspace Navigation (right) ════ */}
      <div style={rowStyle}>

        {/* LEFT: Recycle Bin */}
        <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
          <button onClick={() => onNavigate("/recycle-bin")} title="Recycle Bin"
            style={btnBase} onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "12px", height: "12px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {t("nav.recycleBin") || "Bin"}
          </button>
        </div>

        {/* RIGHT: Workspace Navigation — Research · Theory · Lab · Thinking */}
        <div style={{ display: "flex", alignItems: "center", gap: "2px", flexWrap: "wrap", justifyContent: "flex-end" }}>

          {/* Research Hub — indigo accent */}
          <button
            onClick={() => onNavigate("/research")}
            title={t("nav.research") || "Research Hub"}
            style={{
              ...btnBase,
              background: isDark ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.07)",
              color: isDark ? "#a5b4fc" : "#4338ca",
              fontWeight: 600,
              border: isDark ? "1px solid rgba(99,102,241,0.22)" : "1px solid rgba(99,102,241,0.14)",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = isDark ? "rgba(99,102,241,0.22)" : "rgba(99,102,241,0.13)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = isDark ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.07)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            📚 {t("nav.research") || "Research Center"}
          </button>

          {([
            { icon: "🏗️", label: t("nav.theoryHub") || "Theory",         path: "/theory-hub" },
            { icon: "🔬", label: t("nav.researchLab") || "Research Lab",  path: "/research-lab" },
            { icon: "🧠", label: t("nav.thinkingWorkspace") || "Thinking Space", path: "/frontend" },
          ]).map(btn => (
            <button key={btn.path} onClick={() => onNavigate(btn.path)} title={btn.label}
              style={btnBase} onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
              {btn.icon} {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
