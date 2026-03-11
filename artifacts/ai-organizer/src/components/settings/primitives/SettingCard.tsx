import React from "react";

interface SettingCardProps {
  children: React.ReactNode;
  highlight?: boolean;
}

export const SettingCard: React.FC<SettingCardProps> = ({ children, highlight }) => (
  <div style={{
    padding: "16px",
    background: "hsl(var(--muted) / 0.3)",
    borderRadius: "12px",
    border: `1px solid ${highlight ? "hsl(var(--primary) / 0.3)" : "hsl(var(--border))"}`,
  }}>
    {children}
  </div>
);
