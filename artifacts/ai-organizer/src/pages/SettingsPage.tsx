// src/pages/SettingsPage.tsx
// Modular Settings Page — orchestrates sidebar + section routing

import React, { lazy, Suspense } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useIsMobile } from "../hooks/useMediaQuery";
import { useLanguage } from "../context/LanguageContext";
import { ScreenshotMode } from "../components/ScreenshotMode";
import GlobalBurgerMenu from "../components/GlobalBurgerMenu";
import SettingsSidebar from "../components/settings/SettingsSidebar";
import type { SettingsSection, SettingsNavItem } from "../types/settings";
import { useState } from "react";

// Lazy-loaded sections
const GeneralSection = lazy(() => import("../components/settings/sections/GeneralSection"));
const AppearanceSection = lazy(() => import("../components/settings/sections/AppearanceSection"));
const LanguageSection = lazy(() => import("../components/settings/sections/LanguageSection"));
const NotificationsSection = lazy(() => import("../components/settings/sections/NotificationsSection"));
const ShortcutsSection = lazy(() => import("../components/settings/sections/ShortcutsSection"));
const SecuritySection = lazy(() => import("../components/settings/sections/SecuritySection"));
const BillingSection = lazy(() => import("../components/settings/sections/BillingSection"));
const IntegrationsSection = lazy(() => import("../components/settings/sections/IntegrationsSection"));
const DeveloperSection = lazy(() => import("../components/settings/sections/DeveloperSection"));
const PrivacySection = lazy(() => import("../components/settings/sections/PrivacySection"));
const ExportSection = lazy(() => import("../components/settings/sections/ExportSection"));
const AboutSection = lazy(() => import("../components/settings/sections/AboutSection"));

const SECTION_MAP: Record<SettingsSection, React.LazyExoticComponent<React.FC>> = {
  general: GeneralSection as React.LazyExoticComponent<React.FC>,
  appearance: AppearanceSection as React.LazyExoticComponent<React.FC>,
  language: LanguageSection as React.LazyExoticComponent<React.FC>,
  notifications: NotificationsSection as React.LazyExoticComponent<React.FC>,
  shortcuts: ShortcutsSection as React.LazyExoticComponent<React.FC>,
  security: SecuritySection as React.LazyExoticComponent<React.FC>,
  billing: BillingSection as React.LazyExoticComponent<React.FC>,
  integrations: IntegrationsSection as React.LazyExoticComponent<React.FC>,
  developer: DeveloperSection as React.LazyExoticComponent<React.FC>,
  privacy: PrivacySection as React.LazyExoticComponent<React.FC>,
  export: ExportSection as React.LazyExoticComponent<React.FC>,
  about: AboutSection as React.LazyExoticComponent<React.FC>,
};

const VALID_SECTIONS: SettingsSection[] = ["general","appearance","language","notifications","shortcuts","security","billing","integrations","developer","privacy","export","about"];

export default function SettingsPage() {
  const nav = useNavigate();
  const params = useParams<{ section?: string }>();
  const isMobile = useIsMobile();
  const { t } = useLanguage();
  const [screenshotMode, setScreenshotMode] = useState(false);

  // URL-based or fallback to "general"
  const activeSection: SettingsSection =
    params.section && VALID_SECTIONS.includes(params.section as SettingsSection)
      ? (params.section as SettingsSection)
      : "general";

  const handleSectionChange = (id: SettingsSection) => {
    nav(`/settings/${id}`, { replace: true });
  };

  const sections: SettingsNavItem[] = [
    { id: "general", icon: "⚙️", label: t("settings.general"), group: "Preferences" },
    { id: "appearance", icon: "🎨", label: t("settings.appearance"), group: "Preferences" },
    { id: "language", icon: "🌐", label: t("settings.language"), group: "Preferences" },
    { id: "notifications", icon: "🔔", label: t("settings.notifications"), group: "Preferences" },
    { id: "shortcuts", icon: "⌨️", label: t("settings.shortcuts"), group: "Preferences" },
    { id: "security", icon: "🛡️", label: "Security", group: "Account" },
    { id: "billing", icon: "💳", label: "Billing & Plan", group: "Account" },
    { id: "integrations", icon: "🔌", label: "Integrations", group: "Platform" },
    { id: "developer", icon: "🧑‍💻", label: "Developer", group: "Platform" },
    { id: "privacy", icon: "🔒", label: t("settings.privacy"), group: "Platform" },
    { id: "export", icon: "📦", label: "Export & Backup", group: "Platform" },
    { id: "about", icon: "ℹ️", label: "About", group: "Platform" },
  ];

  const currentSection = sections.find(s => s.id === activeSection);
  const SectionComponent = SECTION_MAP[activeSection];

  return (
    <div style={{ minHeight: "100vh", background: "hsl(var(--background))", color: "hsl(var(--foreground))" }}>
      {/* Header */}
      <div className="page-shell">
        <div className="page-header">
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button onClick={() => nav("/")} className="btn btn-sm btn-tertiary" style={{ borderRadius: '10px' }}>
              ← {t("action.close")}
            </button>
            <div>
              <h1 style={{
                fontSize: "var(--font-size-2xl)", fontWeight: 700,
                background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: 0,
              }}>
                ⚙️ {t("settings.title")}
              </h1>
              <p className="page-subtitle" style={{ margin: "4px 0 0" }}>Customize your experience</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="page-shell" style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "280px 1fr",
        gap: isMobile ? "16px" : "32px",
        paddingTop: "0",
      }}>
        <SettingsSidebar
          sections={sections}
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
        />

        <div className="card card-spacious" style={{ borderRadius: '10px' }}>
          <h2 style={{ color: "hsl(var(--foreground))", fontSize: "20px", fontWeight: 600, marginBottom: "24px" }}>
            {currentSection?.icon} {currentSection?.label}
          </h2>
          <Suspense fallback={
            <div style={{ padding: "40px", textAlign: "center", color: "hsl(var(--muted-foreground))" }}>
              Loading...
            </div>
          }>
            <SectionComponent />
          </Suspense>
        </div>
      </div>

      <ScreenshotMode isActive={screenshotMode} onToggle={() => setScreenshotMode(!screenshotMode)} />
      <GlobalBurgerMenu />
    </div>
  );
}
