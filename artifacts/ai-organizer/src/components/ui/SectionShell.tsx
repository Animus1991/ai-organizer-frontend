import React, { ReactNode, CSSProperties } from "react";
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
}) => {
  const tokens = useUiTokens();
  const base = tokens.surfaces.getSectionStyles(variant);

  const paddingMap: Record<typeof padding, string> = {
    none: "0",
    sm: `${tokens.spacing.sm}px`,
    md: `${tokens.spacing.md}px ${tokens.spacing.lg}px`,
    lg: `${tokens.spacing.lg}px ${tokens.spacing.xl}px`,
  };

  return (
    <section
      id={id}
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
      {(title || description || actions) && (
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
          {actions && (
            <div style={{ display: "flex", gap: tokens.spacing.sm, alignItems: "center" }}>{actions}</div>
          )}
        </header>
      )}

      <div>{children}</div>

      {footer && <footer>{footer}</footer>}
    </section>
  );
};
