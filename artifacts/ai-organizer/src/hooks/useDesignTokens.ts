/**
 * useDesignTokens — Phase 5 Design Token Layer
 *
 * Derives a typed, semantic token object from the current ThemeContext colors + isDark flag.
 * Replaces repetitive `isDark ? "..." : "..."` ternaries across components.
 * Compatible with the existing inline-style system — returns plain CSS value strings.
 *
 * Usage:
 *   const tokens = useDesignTokens();
 *   <div style={{ background: tokens.cardBg, border: `1px solid ${tokens.cardBorder}` }} />
 */

import { useMemo } from "react";
import { useTheme } from "../context/ThemeContext";

export interface DesignTokens {
  // Surfaces
  cardBg: string;
  cardBgHover: string;
  cardBorder: string;
  cardBorderHover: string;
  cardShadow: string;
  cardShadowHover: string;
  pageBg: string;
  overlayBg: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textOnAccent: string;

  // Accent palette
  accentPrimary: string;         // indigo #6366f1
  accentPrimaryBg: string;       // indigo translucent bg for pills
  accentPrimaryBorder: string;   // indigo border
  accentSuccess: string;
  accentWarning: string;
  accentError: string;

  // Interactive
  btnGhostBg: string;
  btnGhostBgHover: string;
  btnGhostBorder: string;
  btnGhostColor: string;
  btnAccentBg: string;
  btnAccentColor: string;

  // Form inputs
  inputBg: string;
  inputBorder: string;
  inputBorderFocus: string;
  inputColor: string;

  // Dividers
  divider: string;
  dividerStrong: string;

  // Pills / badges
  pillActiveBg: string;
  pillActiveBorder: string;
  pillActiveColor: string;
  pillInactiveBg: string;
  pillInactiveBorder: string;
  pillInactiveColor: string;

  // Scrollbar (webkit)
  scrollbarTrack: string;
  scrollbarThumb: string;
}

export function useDesignTokens(): DesignTokens {
  const { colors, isDark } = useTheme();

  return useMemo<DesignTokens>(() => ({
    // Surfaces
    cardBg:           isDark ? "rgba(255,255,255,0.03)"  : "#ffffff",
    cardBgHover:      isDark ? "rgba(255,255,255,0.06)"  : "#fafafe",
    cardBorder:       isDark ? colors.borderPrimary       : "rgba(0,0,0,0.07)",
    cardBorderHover:  isDark ? "rgba(99,102,241,0.35)"   : "rgba(99,102,241,0.22)",
    cardShadow:       isDark ? "none"                     : "0 1px 4px rgba(0,0,0,0.06)",
    cardShadowHover:  isDark ? "0 8px 28px rgba(0,0,0,0.4)" : "0 8px 24px rgba(99,102,241,0.12)",
    pageBg:           isDark ? colors.bgPrimary           : "#f5f5fb",
    overlayBg:        isDark ? "rgba(0,0,0,0.75)"         : "rgba(0,0,0,0.45)",

    // Text
    textPrimary:      colors.textPrimary,
    textSecondary:    colors.textSecondary,
    textMuted:        colors.textMuted,
    textOnAccent:     "#ffffff",

    // Accent palette
    accentPrimary:        "#6366f1",
    accentPrimaryBg:      isDark ? "rgba(99,102,241,0.14)" : "rgba(99,102,241,0.08)",
    accentPrimaryBorder:  isDark ? "rgba(99,102,241,0.35)" : "rgba(99,102,241,0.22)",
    accentSuccess:        "#10b981",
    accentWarning:        "#f59e0b",
    accentError:          "#ef4444",

    // Interactive
    btnGhostBg:        "transparent",
    btnGhostBgHover:   isDark ? "rgba(255,255,255,0.07)"  : "rgba(0,0,0,0.045)",
    btnGhostBorder:    isDark ? colors.borderPrimary       : "rgba(0,0,0,0.09)",
    btnGhostColor:     colors.textSecondary,
    btnAccentBg:       "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    btnAccentColor:    "#ffffff",

    // Form inputs
    inputBg:           isDark ? "rgba(255,255,255,0.04)" : "#ffffff",
    inputBorder:       isDark ? colors.borderPrimary      : "rgba(0,0,0,0.10)",
    inputBorderFocus:  "#6366f1",
    inputColor:        colors.textPrimary,

    // Dividers
    divider:       isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
    dividerStrong: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)",

    // Pills
    pillActiveBg:        isDark ? "rgba(99,102,241,0.18)" : "rgba(99,102,241,0.10)",
    pillActiveBorder:    isDark ? "rgba(99,102,241,0.45)" : "rgba(99,102,241,0.35)",
    pillActiveColor:     isDark ? "#a5b4fc" : "#4338ca",
    pillInactiveBg:      "transparent",
    pillInactiveBorder:  isDark ? colors.borderPrimary    : "rgba(0,0,0,0.09)",
    pillInactiveColor:   colors.textSecondary,

    // Scrollbar
    scrollbarTrack: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.04)",
    scrollbarThumb: isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.14)",
  }), [isDark, colors]);
}
