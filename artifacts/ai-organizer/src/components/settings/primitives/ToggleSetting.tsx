import React from "react";

interface ToggleSettingProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export const ToggleSetting: React.FC<ToggleSettingProps> = ({ label, description, value, onChange, disabled }) => (
  <div style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    background: "hsl(var(--muted) / 0.3)",
    borderRadius: "10px",
    border: "1px solid hsl(var(--border))",
    opacity: disabled ? 0.6 : 1,
  }}>
    <div>
      <div style={{ color: "hsl(var(--foreground))", fontSize: "14px", fontWeight: 500 }}>{label}</div>
      {description && <div style={{ color: "hsl(var(--muted-foreground))", fontSize: "12px", marginTop: "2px" }}>{description}</div>}
    </div>
    <button
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      style={{
        width: "48px",
        height: "26px",
        borderRadius: "13px",
        border: "none",
        background: value ? "hsl(var(--primary))" : "hsl(var(--muted))",
        cursor: disabled ? "default" : "pointer",
        position: "relative",
        transition: "background 0.2s",
        flexShrink: 0,
      }}
    >
      <div style={{
        width: "20px",
        height: "20px",
        borderRadius: "50%",
        background: "hsl(var(--primary-foreground))",
        position: "absolute",
        top: "3px",
        left: value ? "25px" : "3px",
        transition: "left 0.2s",
        boxShadow: "0 1px 3px hsl(var(--foreground) / 0.15)",
      }} />
    </button>
  </div>
);
