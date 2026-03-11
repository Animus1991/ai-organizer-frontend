/**
 * AnalyticsPanel - Analytics & Insights with inline tool rendering
 */

import React from "react";
import { useLanguage } from "../../../../context/LanguageContext";
import { LabToolCardV2 } from "../LabToolCardV2";
import { InlineToolRenderer } from "../InlineToolRenderer";
import type { TheoryPhase } from "../../types";
import type { SegmentRow } from "../../../../hooks/home/useHomeState";

interface Props {
  activeTool: string | null;
  onOpenTool: (toolId: string, title: string, icon: string) => void;
  onCloseTool: () => void;
  segments: SegmentRow[];
  currentPhase: TheoryPhase;
  phaseTitle: string;
  phaseDescription: string;
}

const TOOLS = ["EvidenceRequirementsGenerator", "EvidenceChainBuilder"];

export function AnalyticsPanel({ activeTool, onOpenTool, onCloseTool, segments, currentPhase, phaseTitle, phaseDescription }: Props) {
  const { t } = useLanguage();

  if (activeTool) {
    return (
      <div className="lab-panel-content">
        <button onClick={onCloseTool} className="lab-editor-btn mb-2 text-xs flex items-center gap-1">
          ← Back to tools
        </button>
        <InlineToolRenderer toolId={activeTool} segments={segments} onClose={onCloseTool} />
      </div>
    );
  }

  return (
    <div className="lab-panel-content">
      <div className="flex flex-col gap-2">
        {TOOLS.map(id => (
          <LabToolCardV2 key={id} toolId={id} onOpen={onOpenTool} />
        ))}
      </div>

      <div className="lab-phase-indicator">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
          {t("researchLab.currentPhase") || "Current Phase"}
        </div>
        <div className="px-2.5 py-1.5 bg-primary/15 border border-primary/30 rounded-md text-primary text-sm font-semibold">
          {phaseTitle}
        </div>
        <p className="mt-1.5 text-[10px] text-muted-foreground leading-relaxed">
          {phaseDescription}
        </p>
      </div>
    </div>
  );
}
