import React, { ReactNode, CSSProperties, useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { SectionVariant, useUiTokens } from "../../styles/uiTokens";

export interface SectionShellProps {
  id?: string;
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  variant?: SectionVariant;
  padding?: "none" | "sm" | "md" | "lg";
  gap?: number;
  style?: CSSProperties;
  headerStyle?: CSSProperties;
  footer?: ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export const SectionShell: React.FC<SectionShellProps> = ({
  id,
  title,
  description,
  actions,
  children,
  variant = "glass",
  padding = "md",
  gap,
  style,
  headerStyle,
  footer,
  collapsible = false,
  defaultCollapsed = false,
}) => {
  const tokens = useUiTokens();
  const base = tokens.surfaces.getSectionStyles(variant);

  const storageKey = id ? `sectionCollapse_${id}` : null;
  const [collapsed, setCollapsed] = useState(() => {
    if (storageKey) {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) return stored === "true";
    }
    return defaultCollapsed;
  });

  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, String(collapsed));
    }
  }, [collapsed, storageKey]);

  const paddingMap: Record<NonNullable<typeof padding>, string> = {
    none: "0",
    sm: `${tokens.spacing.sm}px`,
    md: `${tokens.spacing.md}px ${tokens.spacing.lg}px`,
    lg: `${tokens.spacing.lg}px ${tokens.spacing.xl}px`,
  };

  const hasHeader = Boolean(title || description || actions || collapsible);

  return (
    <section
      id={id}
      aria-labelledby={id ? `${id}-title` : undefined}
      style={{
        borderRadius: tokens.radii.xl,
        padding: paddingMap[padding],
        display: "flex",
        flexDirection: "column",
        gap: gap ?? tokens.spacing.md,
        ...base,
        ...style,
      }}
    >
      {hasHeader && (
        <header
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: tokens.spacing.sm,
            justifyContent: "space-between",
            alignItems: "flex-start",
            ...headerStyle,
          }}
        >
          <div style={{ flex: "1 1 auto", minWidth: 0 }}>
            {title && (
              <div
                id={id ? `${id}-title` : undefined}
                style={{
                  fontSize: tokens.typography.headingSM.fontSize,
                  lineHeight: tokens.typography.headingSM.lineHeight,
                  fontWeight: tokens.typography.headingSM.fontWeight,
                }}
              >
                {title}
              </div>
            )}
            {description && (
              <div
                style={{
                  fontSize: tokens.typography.bodySM.fontSize,
                  lineHeight: tokens.typography.bodySM.lineHeight,
                  marginTop: "2px",
                  opacity: 0.8,
                }}
              >
                {description}
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: tokens.spacing.sm, alignItems: "center" }}>
            {actions}
            {collapsible && (
              <button
                type="button"
                aria-label={collapsed ? "Expand section" : "Collapse section"}
                aria-expanded={!collapsed}
                onClick={() => setCollapsed((c) => !c)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "28px",
                  height: "28px",
                  borderRadius: "6px",
                  border: "1px solid hsl(var(--border))",
                  background: "transparent",
                  color: "hsl(var(--muted-foreground))",
                  cursor: "pointer",
                  flexShrink: 0,
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "hsl(var(--accent))";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                }}
                onFocus={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.outline = "2px solid hsl(var(--primary))";
                  (e.currentTarget as HTMLButtonElement).style.outlineOffset = "2px";
                }}
                onBlur={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.outline = "none";
                }}
              >
                {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </button>
            )}
          </div>
        </header>
      )}

      {!collapsed && (
        <div
          style={{
            animation: "sectionExpand 0.18s ease",
            overflow: "hidden",
          }}
        >
          <style>{`@keyframes sectionExpand { from { opacity:0; transform:translateY(-4px) } to { opacity:1; transform:translateY(0) } }`}</style>
          {children}
        </div>
      )}

      {!collapsed && footer && <footer>{footer}</footer>}
    </section>
  );
};
