import React from "react";
import { SettingGroup, SettingCard, StatusBadge } from "../primitives";

const INTEGRATIONS = [
  { name: "GitHub", icon: "🐙", desc: "Sync repositories and theory branches", connected: true },
  { name: "Zotero", icon: "📚", desc: "Import references and bibliography", connected: false },
  { name: "Notion", icon: "📝", desc: "Export notes and documents", connected: false },
  { name: "Slack", icon: "💬", desc: "Receive collaboration notifications", connected: true },
  { name: "Google Scholar", icon: "🎓", desc: "Fetch citation metadata", connected: false },
  { name: "ORCID", icon: "🆔", desc: "Link your researcher profile", connected: false },
  { name: "arXiv", icon: "🔬", desc: "Auto-import preprints by DOI", connected: false },
  { name: "Figma", icon: "🎨", desc: "Embed design assets in documents", connected: false },
];

export default function IntegrationsSection() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <p style={{ color: "hsl(var(--muted-foreground))", fontSize: "13px", marginBottom: "4px" }}>
        Connect third-party services to extend Think!Hub's functionality.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "10px" }}>
        {INTEGRATIONS.map(int => (
          <div key={int.name} style={{ padding: "16px", background: "hsl(var(--muted) / 0.3)", borderRadius: "12px", border: `1px solid ${int.connected ? "hsl(var(--success) / 0.25)" : "hsl(var(--border))"}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <span style={{ fontSize: "24px" }}>{int.icon}</span>
                <div>
                  <div style={{ color: "hsl(var(--foreground))", fontWeight: 600, fontSize: "14px" }}>{int.name}</div>
                  <div style={{ color: "hsl(var(--muted-foreground))", fontSize: "11px", marginTop: "2px" }}>{int.desc}</div>
                </div>
              </div>
              <button style={{
                padding: "6px 12px", borderRadius: "7px",
                border: int.connected ? "1px solid hsl(var(--destructive) / 0.3)" : "1px solid hsl(var(--primary) / 0.4)",
                background: int.connected ? "hsl(var(--destructive) / 0.08)" : "hsl(var(--primary) / 0.1)",
                color: int.connected ? "hsl(var(--destructive))" : "hsl(var(--primary))",
                cursor: "pointer", fontSize: "11px", fontWeight: 600, whiteSpace: "nowrap",
              }}>
                {int.connected ? "Disconnect" : "Connect"}
              </button>
            </div>
            {int.connected && <div style={{ marginTop: "8px", fontSize: "10px", color: "hsl(var(--success))" }}>✓ Connected</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
