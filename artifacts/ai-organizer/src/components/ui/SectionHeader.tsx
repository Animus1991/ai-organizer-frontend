// src/components/ui/SectionHeader.tsx
// Reusable section header with icon, title, and subtitle
// Mobile-responsive: auto-downsizes on small screens
import React from "react";
import { useTheme } from "../../context/ThemeContext";
import { useIsMobile } from "../../hooks/use-mobile";

export interface SectionHeaderProps {
  icon: React.ReactNode;
  iconGradient?: string;
  title: string;
  subtitle?: string;
  size?: "sm" | "md" | "lg";
  borderBottom?: boolean;
  style?: React.CSSProperties;
}

const SIZE_MAP = {
  sm: { icon: 28, iconRadius: 8, iconFont: 13, titleFont: "13px", subtitleFont: "11px", gap: 8 },
  md: { icon: 36, iconRadius: 10, iconFont: 15, titleFont: "16px", subtitleFont: "12px", gap: 10 },
  lg: { icon: 44, iconRadius: 12, iconFont: 18, titleFont: "18px", subtitleFont: "13px", gap: 14 },
};

// Mobile: downsize one step
const MOBILE_SIZE: Record<string, "sm" | "md" | "lg"> = { lg: "md", md: "sm", sm: "sm" };

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  icon,
  iconGradient = "linear-gradient(135deg, hsl(var(--primary) / 0.2) 0%, hsl(var(--accent) / 0.2) 100%)",
  title,
  subtitle,
  size = "md",
  borderBottom = false,
  style,
}) => {
  const { isDark } = useTheme();
  const isMobile = useIsMobile();
  const effectiveSize = isMobile ? MOBILE_SIZE[size] : size;
  const s = SIZE_MAP[effectiveSize];

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: `${s.gap}px`,
      ...(borderBottom ? { paddingBottom: "12px", borderBottom: "1px solid hsl(var(--border))" } : {}),
      ...style,
    }}>
      <div style={{
        width: `${s.icon}px`,
        height: `${s.icon}px`,
        background: iconGradient,
        borderRadius: `${s.iconRadius}px`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: isDark ? "1px solid hsl(var(--primary) / 0.25)" : "1px solid hsl(var(--border) / 0.5)",
        fontSize: `${s.iconFont}px`,
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <h2 style={{
          fontSize: isMobile ? "12px" : s.titleFont,
          fontWeight: 600,
          color: "hsl(var(--foreground))",
          margin: 0,
          lineHeight: 1.35,
          wordBreak: "break-word",
        }}>
          {title}
        </h2>
        {subtitle && !isMobile && (
          <p style={{
            fontSize: s.subtitleFont,
            color: "hsl(var(--muted-foreground))",
            margin: "2px 0 0 0",
            lineHeight: 1.4,
          }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};
