/**
 * LabPanelCard - Collapsible panel wrapper with phase-colored active indicator
 */

import type { LabPanel } from "../types";
import { panelConfig } from "../config/phases";
import { useLanguage } from "../../../context/LanguageContext";

interface Props {
  panel: LabPanel;
  isActive: boolean;
  isCollapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const panelAccentColors: Record<LabPanel, string> = {
  documents: "border-l-indigo-500",
  claims: "border-l-emerald-500",
  evidence: "border-l-amber-500",
  analytics: "border-l-red-500",
};

export function LabPanelCard({ panel, isActive, isCollapsed, onToggle, children }: Props) {
  const { t } = useLanguage();
  const config = panelConfig[panel];
  const title = t(config.titleKey) || config.fallback;

  return (
    <div
      data-tour={`lab-${panel}`}
      className={`lab-panel-card transition-all duration-300 ${
        isActive ? `border-l-2 ${panelAccentColors[panel]}` : "border-l-2 border-l-transparent"
      }`}
      data-collapsed={isCollapsed}
    >
      <div
        className="lab-panel-header"
        data-active={isActive}
        data-collapsed={isCollapsed}
        onClick={onToggle}
        title={isCollapsed ? `Expand ${title}` : `Collapse ${title}`}
      >
        <div className={`text-sm flex items-center gap-2 ${isActive ? "font-semibold text-foreground" : "font-medium text-muted-foreground"}`}>
          {config.icon} {title}
        </div>
        <div className="flex items-center gap-2">
          <span className={`lab-collapse-chevron transition-transform duration-300 ${isCollapsed ? "" : "rotate-180"}`}>▾</span>
          {isActive && (
            <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 animate-pulse" />
          )}
        </div>
      </div>

      {!isCollapsed && (
        <div className="flex-1 overflow-auto min-h-0">
          {children}
        </div>
      )}
    </div>
  );
}
