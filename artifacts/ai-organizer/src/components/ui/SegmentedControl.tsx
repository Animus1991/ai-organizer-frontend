import { memo, type ReactNode } from "react";
import { useTheme } from "../../context/ThemeContext";

export interface SegmentedControlOption<T extends string = string> {
  value: T;
  label: ReactNode;
  badge?: string | number;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
  stretch?: boolean;
  wrap?: boolean;
  minItemWidth?: number;
  ariaLabel?: string;
}

export const SegmentedControl = memo(function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  size = "md",
  stretch = false,
  wrap = false,
  minItemWidth = 120,
  ariaLabel,
}: SegmentedControlProps<T>) {
  const { colors, isDark } = useTheme();
  const height = size === "sm" ? 34 : 40;
  const fontSize = size === "sm" ? 12 : 13;

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      style={{
        display: wrap ? "flex" : "inline-flex",
        borderRadius: 999,
        padding: 3,
        gap: wrap ? 6 : 4,
        flexWrap: wrap ? "wrap" : undefined,
        background: isDark ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.05)",
        border: `1px solid ${isDark ? "rgba(148,163,184,0.25)" : "rgba(15,23,42,0.08)"}`,
        width: stretch ? "100%" : undefined,
      }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            disabled={opt.disabled}
            onClick={() => !opt.disabled && onChange(opt.value)}
            style={{
              flex: wrap ? "1 0 auto" : stretch ? 1 : undefined,
              minWidth: wrap ? minItemWidth : stretch ? 0 : 48,
              height,
              borderRadius: 999,
              border: "none",
              padding: "0 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              fontSize,
              fontWeight: 600,
              cursor: opt.disabled ? "not-allowed" : "pointer",
              whiteSpace: wrap ? "normal" : "nowrap",
              textAlign: "center" as const,
              background: active
                ? (isDark ? "rgba(99,102,241,0.22)" : "rgba(99,102,241,0.14)")
                : "transparent",
              color: active
                ? (isDark ? "#c7d2fe" : "#4338ca")
                : colors.textSecondary,
              transition: "all 0.18s ease",
              opacity: opt.disabled ? 0.4 : 1,
            }}
          >
            <span>{opt.label}</span>
            {opt.badge !== undefined && (
              <span
                style={{
                  fontSize: size === "sm" ? 10 : 11,
                  fontWeight: 700,
                  padding: "1px 6px",
                  borderRadius: 999,
                  background: active
                    ? (isDark ? "rgba(15,23,42,0.35)" : "rgba(255,255,255,0.6)")
                    : (isDark ? "rgba(15,23,42,0.4)" : "rgba(15,23,42,0.08)"),
                  color: active
                    ? (isDark ? "#e0e7ff" : "#312e81")
                    : colors.textMuted,
                }}
              >
                {opt.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
});
