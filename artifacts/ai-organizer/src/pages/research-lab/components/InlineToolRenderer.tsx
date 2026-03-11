/**
 * InlineToolRenderer - Renders research tools inline within their panel
 * Replaces the old WidgetModal pattern
 */

import React from "react";
import type { SegmentRow } from "../../../hooks/home/useHomeState";
import {
  ClaimVerification, PropositionTypeCategorizer, ConceptMapper, BoundaryConditionsPanel,
  FalsificationPrompts, PeerReviewSimulator, ContradictionFinder, ConsistencyChecker,
  EvidenceRequirementsGenerator, EvidenceChainBuilder
} from "../../../components/research";

interface Props {
  toolId: string;
  segments: SegmentRow[];
  onClose: () => void;
}

export function InlineToolRenderer({ toolId, segments, onClose }: Props) {
  const renderers: Record<string, () => React.ReactNode> = {
    ClaimVerification: () => <ClaimVerification segmentText={segments[0]?.content || ""} />,
    PropositionTypeCategorizer: () => <PropositionTypeCategorizer open={true} onClose={onClose} />,
    ConceptMapper: () => <ConceptMapper segments={segments} open={true} onClose={onClose} />,
    BoundaryConditionsPanel: () => <BoundaryConditionsPanel open={true} onClose={onClose} />,
    FalsificationPrompts: () => <FalsificationPrompts />,
    PeerReviewSimulator: () => <PeerReviewSimulator />,
    ContradictionFinder: () => <ContradictionFinder open={true} onClose={onClose} />,
    ConsistencyChecker: () => <ConsistencyChecker open={true} onClose={onClose} />,
    EvidenceRequirementsGenerator: () => <EvidenceRequirementsGenerator open={true} onClose={onClose} />,
    EvidenceChainBuilder: () => <EvidenceChainBuilder open={true} onClose={onClose} />,
  };

  const render = renderers[toolId];
  if (!render) return <div className="p-4 text-muted-foreground text-sm">Tool not found</div>;

  return <div className="min-h-0 overflow-auto">{render()}</div>;
}
