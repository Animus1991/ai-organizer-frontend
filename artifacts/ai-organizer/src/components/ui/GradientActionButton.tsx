// src/components/ui/GradientActionButton.tsx
// Reusable gradient action button — eliminates massive duplication across Home components
// Used in: HomeDocumentPicker, HomeUploadFlow, HomeTodaysProgress, HomeActionBar
import React, { useCallback } from "react";
import { useTheme, type ThemeColors } from "../../context/ThemeContext";

export type GradientPreset = "primary" | "danger" | "success" | "info" | "neutral";

const getGradientPreset = (
  gradient: GradientPreset,
  isDark: boolean,
  _colors: ThemeColors
): { bg: string; shadow: string; hoverShadow: string } => {
  const warmShadow = (intensity: number) => `0 10px 24px rgba(73, 54, 40, ${intensity})`;

  if (isDark) {
    switch (gradient) {
      case "danger":
        return {
          bg: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
          shadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
          hoverShadow: "0 6px 16px rgba(239, 68, 68, 0.4)",
        };
      case "success":
        return {
          bg: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          shadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
          hoverShadow: "0 6px 16px rgba(16, 185, 129, 0.4)",
        };
      case "info":
        return {
          bg: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
          shadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
          hoverShadow: "0 6px 16px rgba(59, 130, 246, 0.4)",
        };
      case "neutral":
        return {
          bg: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)",
          shadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
          hoverShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
        };
      default:
        return {
          bg: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          shadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
          hoverShadow: "0 6px 16px rgba(99, 102, 241, 0.4)",
        };
    }
  }

  switch (gradient) {
    case "danger":
      return {
        bg: "linear-gradient(135deg, #f06c6c 0%, #d93a3a 100%)",
        shadow: warmShadow(0.18),
        hoverShadow: warmShadow(0.24),
      };
    case "success":
      return {
        bg: "linear-gradient(135deg, #20c08c 0%, #0c8d62 100%)",
        shadow: warmShadow(0.16),
        hoverShadow: warmShadow(0.22),
      };
    case "info":
      return {
        bg: "linear-gradient(135deg, #5ca8ff 0%, #2f7bda 100%)",
        shadow: warmShadow(0.16),
        hoverShadow: warmShadow(0.22),
      };
    case "neutral":
      return {
        bg: "linear-gradient(135deg, #ffffff 0%, rgba(245,245,250,0.97) 100%)",
        shadow: "0 1px 4px rgba(0,0,0,0.08)",
        hoverShadow: "0 3px 10px rgba(0,0,0,0.12)",
      };
    default:
      return {
        bg: "linear-gradient(135deg, #5b5bd6 0%, #6f6ee8 100%)",
        shadow: warmShadow(0.17),
        hoverShadow: warmShadow(0.24),
      };
  }
};

export interface GradientActionButtonProps {
  onClick: () => void;
  disabled?: boolean;
  gradient?: GradientPreset;
  icon?: React.ReactNode;
  children: React.ReactNode;
  title?: string;
  size?: "sm" | "md";
  style?: React.CSSProperties;
  iconOnly?: boolean;
}

export const GradientActionButton: React.FC<GradientActionButtonProps> = ({
  onClick,
  disabled = false,
  gradient = "primary",
  icon,
  children,
  title,
  size = "md",
  style,
  iconOnly = false,
}) => {
  const { colors, isDark } = useTheme();
  const preset = getGradientPreset(gradient, isDark, colors);
  const padding = iconOnly ? (size === "sm" ? "7px" : "10px") : (size === "sm" ? "7px 14px" : "12px 20px");
  const fontSize = size === "sm" ? "13px" : "var(--font-size-base)";

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      e.currentTarget.style.transform = "translateY(-2px)";
      e.currentTarget.style.boxShadow = preset.hoverShadow;
    }
  }, [disabled, preset.hoverShadow]);

  const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow = preset.shadow;
  }, [preset.shadow]);

  // Derive tooltip text from children when iconOnly
  const tooltipText = title || (iconOnly && typeof children === "string" ? children : undefined);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={tooltipText}
      aria-label={tooltipText}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        padding,
        background: preset.bg,
        border: "none",
        borderRadius: iconOnly ? "10px" : "12px",
        color: isDark ? (gradient === "neutral" ? "rgba(255,255,255,0.85)" : "white") : (gradient === "neutral" ? "#374151" : "#ffffff"),
        fontWeight: 600,
        fontSize,
        lineHeight: "var(--line-height-normal)",
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: iconOnly ? "0" : "8px",
        transition: "all 0.2s ease",
        boxShadow: preset.shadow,
        opacity: disabled ? 0.6 : 1,
        whiteSpace: "nowrap",
        minWidth: iconOnly ? (size === "sm" ? "32px" : "36px") : undefined,
        minHeight: iconOnly ? (size === "sm" ? "32px" : "36px") : undefined,
        ...style,
      }}
    >
      {icon}
      {!iconOnly && children}
    </button>
  );
};
