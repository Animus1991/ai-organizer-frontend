import React, { useState, useMemo } from "react";
import type { SettingsSection, SettingsNavItem } from "../../types/settings";

interface SettingsSidebarProps {
  sections: SettingsNavItem[];
  activeSection: SettingsSection;
  onSectionChange: (id: SettingsSection) => void;
}

const GROUPS = ["Preferences", "Account", "Platform"] as const;

export default function SettingsSidebar({ sections, activeSection, onSectionChange }: SettingsSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sections;
    return sections.filter(s => s.label.toLowerCase().includes(q));
  }, [sections, searchQuery]);

  const groupsToShow = searchQuery.trim()
    ? (["Preferences", "Account", "Platform"] as const).filter(g =>
        filteredSections.some(s => s.group === g)
      )
    : GROUPS;

  return (
    <div className="card card-compact" style={{ height: "fit-content" }}>
      {/* ── Search ── */}
      <div style={{ padding: "4px 4px 10px" }}>
        <input
          type="text"
          placeholder="Search settings…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "7px 11px",
            borderRadius: "var(--radius)",
            border: "1px solid hsl(var(--border))",
            background: "hsl(var(--muted) / 0.5)",
            color: "hsl(var(--foreground))",
            fontSize: 12,
            outline: "none",
            boxSizing: "border-box",
            transition: "border-color 0.15s",
          }}
          onFocus={e => { e.currentTarget.style.borderColor = "hsl(var(--primary) / 0.5)"; }}
          onBlur={e => { e.currentTarget.style.borderColor = "hsl(var(--border))"; }}
        />
      </div>

      {/* ── Nav groups ── */}
      {groupsToShow.length === 0 ? (
        <div style={{ padding: "12px 8px", fontSize: 12, color: "hsl(var(--muted-foreground))", textAlign: "center" }}>
          No matching settings
        </div>
      ) : (
        groupsToShow.map((group, gi) => {
          const items = filteredSections.filter(s => s.group === group);
          return (
            <div key={group} style={{ marginBottom: gi < groupsToShow.length - 1 ? "12px" : 0 }}>
              <div style={{
                fontSize: "10px", fontWeight: 700,
                color: "hsl(var(--muted-foreground) / 0.5)",
                letterSpacing: "0.08em", textTransform: "uppercase",
                padding: "4px 8px 6px", marginBottom: "2px",
              }}>
                {group}
              </div>
              {items.map(section => (
                <button
                  key={section.id}
                  onClick={() => onSectionChange(section.id)}
                  style={{
                    width: "100%", padding: "10px 12px",
                    background: activeSection === section.id ? "hsl(var(--primary) / 0.15)" : "transparent",
                    border: "none", borderRadius: "9px",
                    color: activeSection === section.id ? "hsl(var(--primary))" : "hsl(var(--foreground) / 0.65)",
                    cursor: "pointer", display: "flex", alignItems: "center", gap: "10px",
                    fontSize: "13px", fontWeight: activeSection === section.id ? 600 : 400,
                    textAlign: "left", marginBottom: "2px", transition: "all 0.15s",
                  }}
                  onMouseEnter={e => {
                    if (activeSection !== section.id) {
                      e.currentTarget.style.background = "hsl(var(--muted) / 0.5)";
                      e.currentTarget.style.color = "hsl(var(--foreground))";
                    }
                  }}
                  onMouseLeave={e => {
                    if (activeSection !== section.id) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "hsl(var(--foreground) / 0.65)";
                    }
                  }}
                >
                  <span style={{ fontSize: "16px" }}>{section.icon}</span>
                  {section.label}
                </button>
              ))}
            </div>
          );
        })
      )}
    </div>
  );
}
