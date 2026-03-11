import React from "react";

export const SettingGroup: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <h3 style={{ color: "hsl(var(--foreground) / 0.8)", fontSize: "14px", fontWeight: 600, marginBottom: "16px" }}>{title}</h3>
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>{children}</div>
  </div>
);
