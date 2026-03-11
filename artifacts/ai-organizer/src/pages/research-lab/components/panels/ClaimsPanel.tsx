/**
 * ClaimsPanel - Claims Workspace with inline tool rendering
 */

import React from "react";
import { LabToolCardV2 } from "../LabToolCardV2";
import { InlineToolRenderer } from "../InlineToolRenderer";
import type { SegmentRow } from "../../../../hooks/home/useHomeState";

interface Props {
  activeTool: string | null;
  onOpenTool: (toolId: string, title: string, icon: string) => void;
  onCloseTool: () => void;
  segments: SegmentRow[];
}

const TOOLS = ["ClaimVerification", "PropositionTypeCategorizer", "ConceptMapper", "BoundaryConditionsPanel"];

export function ClaimsPanel({ activeTool, onOpenTool, onCloseTool, segments }: Props) {
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
    </div>
  );
}
