import React, { useCallback } from "react";
import { useTheme } from "../../../context/ThemeContext";
import { useLayoutTheme } from "../../../context/LayoutThemeContext";
import { useLanguage } from "../../../context/LanguageContext";
import { useSettings } from "../../../hooks/useSettings";
import { SettingGroup, ToggleSetting, SelectSetting } from "../primitives";

export default function AppearanceSection() {
  const { mode, setMode } = useTheme();
  const { layoutTheme, setLayoutTheme } = useLayoutTheme();
  const { t } = useLanguage();
  const { settings, updateSettings } = useSettings();

  const activeAppearance: string = (() => {
    const stored = localStorage.getItem("app-appearance");
    if (stored && ["dark","light","system","minimal","futuristic","dashboard","github"].includes(stored)) return stored;
    if (mode === "dashboard") return "dashboard";
    if (mode === "light") return "light";
    if (mode === "system") return "system";
    if (layoutTheme === "minimal") return "minimal";
    return "dark";
  })();

  const handleAppearanceChange = useCallback((choice: string) => {
    localStorage.setItem("app-appearance", choice);
    switch (choice) {
      case "dark": setMode("dark"); setLayoutTheme("futuristic"); break;
      case "light": setMode("light"); setLayoutTheme("futuristic"); break;
      case "system": setMode("system"); setLayoutTheme("futuristic"); break;
      case "minimal": setMode("dark"); setLayoutTheme("minimal"); break;
      case "futuristic": setMode("dark"); setLayoutTheme("futuristic"); break;
      case "dashboard": setMode("dashboard"); setLayoutTheme("minimal"); break;
      case "github": setMode("github"); setLayoutTheme("minimal"); break;
    }
  }, [setMode, setLayoutTheme]);

  const appearanceOptions = [
    { id: "dark", icon: "🌙", label: t("settings.darkMode") },
    { id: "light", icon: "☀️", label: t("settings.lightMode") },
    { id: "system", icon: "💻", label: t("settings.systemTheme") },
    { id: "minimal", icon: "📚", label: "Minimal Style" },
    { id: "futuristic", icon: "🌌", label: "Futuristic Style" },
    { id: "dashboard", icon: "📊", label: t("settings.dashboardTheme") },
    { id: "github", icon: "🐙", label: t("settings.githubTheme") || "GitHub Style" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <SettingGroup title={t("settings.theme")}>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {appearanceOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => handleAppearanceChange(opt.id)}
              style={{
                flex: "1 1 120px",
                padding: "16px",
                background: activeAppearance === opt.id ? "hsl(var(--primary) / 0.2)" : "hsl(var(--muted) / 0.4)",
                border: activeAppearance === opt.id ? "2px solid hsl(var(--primary))" : "1px solid hsl(var(--border))",
                borderRadius: "12px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <div style={{ fontSize: "24px", marginBottom: "8px" }}>{opt.icon}</div>
              <div style={{ color: "hsl(var(--foreground))", fontWeight: 600, fontSize: "14px" }}>{opt.label}</div>
            </button>
          ))}
        </div>
      </SettingGroup>
      <SettingGroup title="Display">
        <ToggleSetting
          label="Compact Mode"
          description="Reduce spacing for more content on screen"
          value={settings.compactMode}
          onChange={(v) => updateSettings({ compactMode: v })}
        />
        <ToggleSetting
          label="Animations"
          description="Enable smooth transitions and animations"
          value={settings.animations}
          onChange={(v) => updateSettings({ animations: v })}
        />
        <SelectSetting
          label="Font Size"
          value={settings.fontSize}
          options={[
            { value: "small", label: "Small" },
            { value: "medium", label: "Medium" },
            { value: "large", label: "Large" },
          ]}
          onChange={(v) => updateSettings({ fontSize: v as "small" | "medium" | "large" })}
        />
      </SettingGroup>
    </div>
  );
}
