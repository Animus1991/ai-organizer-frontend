/**
 * useLabState - Core Research Lab state management
 * v3: Added "tabs" layout mode for browser-like tab navigation
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import type { LabPanel, TheoryPhase, CollapsedPanels, ActiveTools, LabLayoutMode } from "../types";
import { phaseConfig } from "../config/phases";
import { useLanguage } from "../../../context/LanguageContext";

const MOBILE_BREAKPOINT = 768;

export function useLabState() {
  const { t } = useLanguage();

  const [currentPhase, setCurrentPhase] = useState<TheoryPhase>("discovery");
  const [activePanel, setActivePanel] = useState<LabPanel>("documents");
  const [headerCollapsed, setHeaderCollapsed] = useState(false);

  const [layoutMode, setLayoutMode] = useState<LabLayoutMode>(() => {
    if (typeof window !== "undefined" && window.innerWidth <= MOBILE_BREAKPOINT) return "tabs";
    const saved = localStorage.getItem("researchLabLayoutMode");
    return (saved === "vertical" || saved === "tabs") ? saved : "horizontal";
  });

  // Auto-switch to tabs on mobile
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) setLayoutMode("tabs");
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const [collapsedPanels, setCollapsedPanels] = useState<CollapsedPanels>({
    documents: false,
    claims: false,
    evidence: false,
    analytics: false,
  });

  const [activeTools, setActiveTools] = useState<ActiveTools>({
    documents: null,
    claims: null,
    evidence: null,
    analytics: null,
  });

  const cycleLayoutMode = useCallback(() => {
    setLayoutMode(prev => {
      const modes: LabLayoutMode[] = ["horizontal", "vertical", "tabs"];
      const next = modes[(modes.indexOf(prev) + 1) % modes.length];
      localStorage.setItem("researchLabLayoutMode", next);
      return next;
    });
  }, []);

  const setLayoutModeDirect = useCallback((mode: LabLayoutMode) => {
    setLayoutMode(mode);
    localStorage.setItem("researchLabLayoutMode", mode);
  }, []);

  const selectPhase = useCallback((phase: TheoryPhase) => {
    setCurrentPhase(phase);
    setActivePanel(phaseConfig[phase].primaryPanel);
  }, []);

  const togglePanel = useCallback((panel: LabPanel) => {
    setCollapsedPanels(prev => ({ ...prev, [panel]: !prev[panel] }));
    setActivePanel(panel);
  }, []);

  const selectTab = useCallback((panel: LabPanel) => {
    setActivePanel(panel);
  }, []);

  const openToolInline = useCallback((panel: LabPanel, toolId: string) => {
    setActiveTools(prev => ({ ...prev, [panel]: toolId }));
    setCollapsedPanels(prev => ({ ...prev, [panel]: false }));
  }, []);

  const closeToolInline = useCallback((panel: LabPanel) => {
    setActiveTools(prev => ({ ...prev, [panel]: null }));
  }, []);

  const resolvedPhases = useMemo(() => {
    const result: Record<TheoryPhase, { title: string; description: string; primaryPanel: LabPanel; tools: string[]; colorVar: string }> = {} as any;
    for (const [phase, cfg] of Object.entries(phaseConfig)) {
      result[phase as TheoryPhase] = {
        title: `${cfg.icon} ${t(cfg.titleKey)}`,
        description: t(cfg.descKey),
        primaryPanel: cfg.primaryPanel,
        tools: cfg.tools,
        colorVar: cfg.colorVar,
      };
    }
    return result;
  }, [t]);

  const collapsedCount = [collapsedPanels.documents, collapsedPanels.claims, collapsedPanels.evidence, collapsedPanels.analytics].filter(Boolean).length;

  return {
    currentPhase,
    activePanel,
    headerCollapsed,
    setHeaderCollapsed,
    layoutMode,
    collapsedPanels,
    collapsedCount,
    activeTools,
    toggleLayoutMode: cycleLayoutMode,
    setLayoutMode: setLayoutModeDirect,
    selectPhase,
    togglePanel,
    selectTab,
    openToolInline,
    closeToolInline,
    resolvedPhases,
  };
}
