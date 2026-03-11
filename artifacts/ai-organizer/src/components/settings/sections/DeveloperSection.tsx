import React from "react";
import { SettingGroup, SettingCard } from "../primitives";

const API_KEYS = [
  { name: "Production API Key", key: "thk_live_••••••••••••••••••••rX9k", created: "30 days ago", lastUsed: "2 hours ago" },
  { name: "Dev API Key", key: "thk_dev_••••••••••••••••••••kQ7m", created: "10 days ago", lastUsed: "Yesterday" },
];

const API_DOCS = [
  { label: "REST API Docs", icon: "📖" },
  { label: "GraphQL Schema", icon: "🔷" },
  { label: "SDK Downloads", icon: "📦" },
  { label: "Postman Collection", icon: "🟠" },
];

export default function DeveloperSection() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <SettingGroup title="API Keys">
        <p style={{ color: "hsl(var(--muted-foreground))", fontSize: "12px", marginTop: 0, marginBottom: "8px" }}>
          Use these keys to authenticate API requests. Never share them publicly.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {API_KEYS.map((k, i) => (
            <SettingCard key={i}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ color: "hsl(var(--foreground))", fontSize: "13px", fontWeight: 600 }}>{k.name}</div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button style={{ padding: "4px 10px", borderRadius: "6px", border: "1px solid hsl(var(--border))", background: "transparent", color: "hsl(var(--muted-foreground))", cursor: "pointer", fontSize: "11px" }}>Copy</button>
                  <button style={{ padding: "4px 10px", borderRadius: "6px", border: "1px solid hsl(var(--destructive) / 0.3)", background: "hsl(var(--destructive) / 0.07)", color: "hsl(var(--destructive))", cursor: "pointer", fontSize: "11px" }}>Revoke</button>
                </div>
              </div>
              <div style={{ fontFamily: "monospace", fontSize: "12px", color: "hsl(var(--muted-foreground))", marginTop: "6px" }}>{k.key}</div>
              <div style={{ fontSize: "10px", color: "hsl(var(--muted-foreground) / 0.7)", marginTop: "4px" }}>Created {k.created} · Last used {k.lastUsed}</div>
            </SettingCard>
          ))}
          <button style={{ padding: "10px", borderRadius: "8px", border: "1px dashed hsl(var(--primary) / 0.4)", background: "hsl(var(--primary) / 0.05)", color: "hsl(var(--primary))", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>
            + Generate New API Key
          </button>
        </div>
      </SettingGroup>

      <SettingGroup title="Webhooks">
        <SettingCard>
          <div style={{ color: "hsl(var(--muted-foreground))", fontSize: "12px", marginBottom: "10px" }}>
            Receive HTTP POST payloads when events occur in Think!Hub
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              placeholder="https://your-server.com/webhook"
              style={{ flex: 1, padding: "8px 12px", borderRadius: "8px", border: "1px solid hsl(var(--border))", background: "hsl(var(--input))", color: "hsl(var(--foreground))", fontSize: "12px", outline: "none" }}
            />
            <button style={{ padding: "8px 14px", borderRadius: "8px", border: "none", background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>Add</button>
          </div>
        </SettingCard>
      </SettingGroup>

      <SettingGroup title="API Documentation">
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {API_DOCS.map(d => (
            <button key={d.label} style={{ padding: "10px 16px", borderRadius: "8px", border: "1px solid hsl(var(--border))", background: "hsl(var(--muted) / 0.3)", color: "hsl(var(--foreground) / 0.7)", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
              {d.icon} {d.label}
            </button>
          ))}
        </div>
      </SettingGroup>
    </div>
  );
}
