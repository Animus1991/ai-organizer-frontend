import React from "react";
import type { SettingsSection, SettingsNavItem } from "../../types/settings";

interface SettingsSidebarProps {
  sections: SettingsNavItem[];
  activeSection: SettingsSection;
  onSectionChange: (id: SettingsSection) => void;
}

const GROUPS = ["Preferences", "Account", "Platform"] as const;

export default function SettingsSidebar({ sections, activeSection, onSectionChange }: SettingsSidebarProps) {
  return (
    <div className="card card-compact" style={{ height: "fit-content" }}>
      {GROUPS.map((group, gi) => {
        const items = sections.filter(s => s.group === group);
        return (
          <div key={group} style={{ marginBottom: gi < GROUPS.length - 1 ? "12px" : 0 }}>
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
              >
                <span style={{ fontSize: "16px" }}>{section.icon}</span>
                {section.label}
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
}
