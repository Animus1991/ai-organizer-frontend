import React from "react";

interface StatusBadgeProps {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  active,
  activeLabel = "Enabled",
  inactiveLabel = "Disabled",
}) => (
  <span style={{
    padding: "4px 10px",
    borderRadius: "20px",
    background: active ? "hsl(var(--success) / 0.12)" : "hsl(var(--destructive) / 0.12)",
    color: active ? "hsl(var(--success))" : "hsl(var(--destructive))",
    fontSize: "11px",
    fontWeight: 600,
  }}>
    {active ? activeLabel : inactiveLabel}
  </span>
);
