/**
 * LabHeader - Enhanced phase navigation with step indicators + tabs layout
 */

import { useLanguage } from "../../../context/LanguageContext";
import { LayoutGrid, LayoutList, Columns } from "lucide-react";
import type { TheoryPhase, LabPanel, LabLayoutMode } from "../types";

interface Props {
  collapsed: boolean;
  onToggleCollapse: () => void;
  currentPhase: TheoryPhase;
  resolvedPhases: Record<TheoryPhase, { title: string; description: string; primaryPanel: LabPanel; tools: string[]; colorVar: string }>;
  onSelectPhase: (phase: TheoryPhase) => void;
  layoutMode: LabLayoutMode;
  onToggleLayout: () => void;
}

const phases: TheoryPhase[] = ["discovery", "formulation", "validation", "refinement"];

const phaseColors: Record<TheoryPhase, string> = {
  discovery: "bg-indigo-500",
  formulation: "bg-emerald-500",
  validation: "bg-amber-500",
  refinement: "bg-red-500",
};

const layoutIcons: Record<LabLayoutMode, typeof LayoutGrid> = {
  horizontal: LayoutGrid,
  vertical: LayoutList,
  tabs: Columns,
};

const layoutLabels: Record<LabLayoutMode, string> = {
  horizontal: "Grid",
  vertical: "Vertical",
  tabs: "Tabs",
};

export function LabHeader({ collapsed, onToggleCollapse, currentPhase, resolvedPhases, onSelectPhase, layoutMode, onToggleLayout }: Props) {
  const { t } = useLanguage();
  const currentIndex = phases.indexOf(currentPhase);
  const LayoutIcon = layoutIcons[layoutMode];

  return (
    <div className="lab-header-card" data-collapsed={collapsed}>
      {/* Always-visible bar */}
      <div
        onClick={onToggleCollapse}
        className="flex items-center justify-between cursor-pointer select-none flex-wrap gap-2"
        style={{ padding: collapsed ? "10px 16px" : "0 0 8px 0" }}
      >
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <h1 className={`m-0 font-bold text-foreground transition-all whitespace-nowrap ${collapsed ? "text-sm" : "text-base sm:text-lg"}`}>
            {t("researchLab.title") || "Research Laboratory"}
          </h1>

          {/* Phase stepper — scrollable on mobile */}
          <nav className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto scrollbar-hide" aria-label="Research phase">
            {phases.map((phase, i) => {
              const isActive = currentPhase === phase;
              const isPast = i < currentIndex;
              return (
                <button
                  key={phase}
                  onClick={(e) => { e.stopPropagation(); onSelectPhase(phase); }}
                  className={`flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-1 rounded-md text-[10px] sm:text-xs transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-primary/15 text-primary font-semibold shadow-sm"
                      : isPast
                        ? "text-muted-foreground/80 hover:bg-muted/50"
                        : "text-muted-foreground/50 hover:bg-muted/30"
                  }`}
                  title={resolvedPhases[phase].description}
                >
                  <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0 transition-colors ${
                    isActive ? phaseColors[phase] : isPast ? "bg-muted-foreground/40" : "bg-border"
                  }`} />
                  <span className={collapsed ? "hidden" : "hidden sm:inline"}>{resolvedPhases[phase].title}</span>
                </button>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Layout toggle with label */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleLayout(); }}
            className="lab-layout-toggle"
            title={`Switch to ${layoutLabels[layoutMode]} layout`}
          >
            <LayoutIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[10px]">{layoutLabels[layoutMode]}</span>
          </button>
          <span className={`lab-collapse-chevron transition-transform duration-300 ${collapsed ? "" : "rotate-180"}`}>▾</span>
        </div>
      </div>

      {/* Expandable subtitle + phase progress */}
      {!collapsed && (
        <div className="flex items-center justify-between mt-1 flex-wrap gap-1">
          <p className="text-[10px] sm:text-xs text-muted-foreground mb-0">
            {t("researchLab.subtitle") || "Scientific workflow for theory development"}
          </p>
          <div className="flex items-center gap-1 mr-2">
            {phases.map((phase, i) => (
              <div
                key={phase}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i <= currentIndex ? phaseColors[phase] : "bg-border"
                }`}
                style={{ width: i <= currentIndex ? "24px" : "16px" }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
