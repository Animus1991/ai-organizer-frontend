import React from "react";
import { KEYBOARD_SHORTCUTS } from "../../../types/settings";

export default function ShortcutsSection() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <p style={{ color: "hsl(var(--muted-foreground))", fontSize: "14px", marginBottom: "8px" }}>
        Keyboard shortcuts to speed up your workflow
      </p>
      {KEYBOARD_SHORTCUTS.map((s, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 16px",
            background: "hsl(var(--muted) / 0.3)",
            borderRadius: "8px",
            border: "1px solid hsl(var(--border))",
          }}
        >
          <span style={{ color: "hsl(var(--foreground) / 0.8)", fontSize: "14px" }}>{s.description}</span>
          <kbd style={{
            padding: "4px 10px",
            background: "hsl(var(--primary) / 0.15)",
            border: "1px solid hsl(var(--primary) / 0.3)",
            borderRadius: "6px",
            color: "hsl(var(--primary))",
            fontSize: "12px",
            fontFamily: "monospace",
          }}>{s.keys}</kbd>
        </div>
      ))}
    </div>
  );
}
