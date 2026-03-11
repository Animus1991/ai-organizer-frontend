import React from "react";

const FEATURES = [
  { icon: '📄', label: 'Document Management & Segmentation' },
  { icon: '🔬', label: 'Scientific Theory Development' },
  { icon: '🤖', label: 'AI-Powered Writing Assistant' },
  { icon: '🌿', label: 'Theory Branching & Version Control' },
  { icon: '👥', label: 'Real-time Collaboration' },
  { icon: '📊', label: 'Evidence Debt Dashboard' },
  { icon: '🎓', label: 'E-learning & Mentoring' },
  { icon: '🚀', label: 'Startup & Investor Discovery' },
  { icon: '🌐', label: 'Multi-Language (25+ languages)' },
  { icon: '📱', label: 'Offline Mode & PWA' },
  { icon: '🔌', label: 'Plugin Marketplace' },
  { icon: '🔒', label: 'Privacy-first, localStorage' },
];

export default function AboutSection() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ textAlign: "center", padding: "32px" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔬</div>
        <h2 style={{
          color: "hsl(var(--foreground))", fontSize: "24px", fontWeight: 700, marginBottom: "8px",
          background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          Think!Hub
        </h2>
        <p style={{ color: "hsl(var(--muted-foreground))", fontSize: "14px" }}>v2.0.0 — Academic Collaboration Platform</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "10px" }}>
        {FEATURES.map(f => (
          <div key={f.label} style={{ padding: "12px 14px", background: "hsl(var(--muted) / 0.3)", borderRadius: "10px", border: "1px solid hsl(var(--border))", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "18px" }}>{f.icon}</span>
            <span style={{ color: "hsl(var(--foreground) / 0.75)", fontSize: "12px", fontWeight: 500 }}>{f.label}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: "14px 16px", background: "hsl(var(--primary) / 0.06)", borderRadius: "10px", border: "1px solid hsl(var(--primary) / 0.2)", fontSize: "12px", color: "hsl(var(--muted-foreground))" }}>
        Built with ❤️ for researchers, academics, and knowledge workers. Powered by React, TypeScript, and AI.
      </div>
    </div>
  );
}
