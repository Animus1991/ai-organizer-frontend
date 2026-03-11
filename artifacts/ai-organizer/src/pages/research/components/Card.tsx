import React from "react";
import { useTheme } from "../../../context/ThemeContext";

type CardProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  containerRef?: React.Ref<HTMLDivElement>;
  containerStyle?: React.CSSProperties;
};

export function Card({ title, subtitle, children, containerRef, containerStyle }: CardProps) {
  const { mode, resolvedMode } = useTheme();
  const isLight = mode === "light" || resolvedMode === "light";

  return (
    <div
      ref={containerRef}
      className="card-panel"
      style={{
        minWidth: 0,
        width: "100%",
        maxWidth: "100%",
        overflowWrap: "anywhere",
        padding: "var(--card-padding, 20px)",
        borderRadius: "16px",
        border: isLight ? "1px solid rgba(47, 41, 65, 0.12)" : "1px solid rgba(255,255,255,0.08)",
        background: isLight ? "#ffffff" : "rgba(15,15,25,0.6)",
        boxShadow: isLight ? "0 4px 18px rgba(0,0,0,0.08)" : "0 4px 18px rgba(0,0,0,0.25)",
        ...containerStyle,
      }}
    >
      <div style={{ marginBottom: "var(--card-header-gap, 12px)" }}>
        <div style={{ fontWeight: 700, fontSize: "var(--card-title-size, 18px)", color: isLight ? "#2f2941" : "#eaeaea" }}>{title}</div>
        <div
          style={{
            fontSize: "var(--card-subtitle-size, 13px)",
            color: isLight ? "rgba(47, 41, 65, 0.65)" : "rgba(255,255,255,var(--card-subtitle-opacity, 0.6))",
            display: "var(--card-subtitle-display, block)" as React.CSSProperties["display"],
          }}
        >
          {subtitle}
        </div>
      </div>
      {children}
    </div>
  );
}
