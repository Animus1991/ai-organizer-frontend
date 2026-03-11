import React from "react";

interface SelectSettingProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

export const SelectSetting: React.FC<SelectSettingProps> = ({ label, value, options, onChange }) => (
  <div style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    background: "hsl(var(--muted) / 0.3)",
    borderRadius: "10px",
    border: "1px solid hsl(var(--border))",
  }}>
    <div style={{ color: "hsl(var(--foreground))", fontSize: "14px", fontWeight: 500 }}>{label}</div>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: "8px 12px",
        background: "hsl(var(--muted))",
        border: "1px solid hsl(var(--border))",
        borderRadius: "8px",
        color: "hsl(var(--foreground))",
        fontSize: "13px",
        cursor: "pointer",
      }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} style={{ background: "hsl(var(--card))" }}>{opt.label}</option>
      ))}
    </select>
  </div>
);
