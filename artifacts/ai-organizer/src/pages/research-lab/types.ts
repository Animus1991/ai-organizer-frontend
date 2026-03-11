/**
 * Research Lab Types
 */

export type LabPanel = "documents" | "claims" | "evidence" | "analytics";
export type TheoryPhase = "discovery" | "formulation" | "validation" | "refinement";
export type LabLayoutMode = "horizontal" | "vertical" | "tabs";

export interface PhaseConfig {
  icon: string;
  titleKey: string;
  descKey: string;
  primaryPanel: LabPanel;
  tools: string[];
  colorVar: string;
}

export interface ToolMeta {
  icon: string;
  labelKey: string;
  descKey: string;
  phaseColor: string;
}

export interface ChunkTab {
  key: string;
  segmentId: number;
  title: string;
  html: string;
  lastSavedHtml?: string;
}

export interface CollapsedPanels {
  documents: boolean;
  claims: boolean;
  evidence: boolean;
  analytics: boolean;
}

/** Active tool state per panel — null means show tool list */
export type ActiveTools = Record<LabPanel, string | null>;
