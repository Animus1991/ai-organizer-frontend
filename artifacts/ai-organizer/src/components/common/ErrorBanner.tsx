import React from "react";

interface ErrorBannerProps {
  message?: React.ReactNode;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export function ErrorBanner({ message, children, style, className }: ErrorBannerProps) {
  return (
    <div
      className={className}
      style={{
        background: "rgba(239, 68, 68, 0.1)",
        border: "1px solid rgba(239, 68, 68, 0.3)",
        borderRadius: "12px",
        padding: "16px",
        marginBottom: "24px",
        color: "#ef4444",
        ...style,
      }}
    >
      {children ?? message}
    </div>
  );
}
