/**
 * Research Lab Phase & Tool Configuration
 * Colors use CSS custom properties defined in research-lab.css
 */

import type { PhaseConfig, ToolMeta, TheoryPhase } from "../types";

export const phaseConfig: Record<TheoryPhase, PhaseConfig> = {
  discovery: {
    icon: "🔍",
    titleKey: "researchLab.phase.discovery",
    descKey: "researchLab.phase.discovery.desc",
    primaryPanel: "documents",
    tools: ["DocumentPickerPanel", "SearchPanel", "SegmentsList"],
    colorVar: "var(--phase-discovery)",
  },
  formulation: {
    icon: "🏗️",
    titleKey: "researchLab.phase.formulation",
    descKey: "researchLab.phase.formulation.desc",
    primaryPanel: "claims",
    tools: ["ClaimVerification", "PropositionTypeCategorizer", "ConceptMapper", "BoundaryConditionsPanel"],
    colorVar: "var(--phase-formulation)",
  },
  validation: {
    icon: "🧪",
    titleKey: "researchLab.phase.validation",
    descKey: "researchLab.phase.validation.desc",
    primaryPanel: "evidence",
    tools: ["FalsificationPrompts", "PeerReviewSimulator", "ContradictionFinder", "ConsistencyChecker"],
    colorVar: "var(--phase-validation)",
  },
  refinement: {
    icon: "⚡",
    titleKey: "researchLab.phase.refinement",
    descKey: "researchLab.phase.refinement.desc",
    primaryPanel: "analytics",
    tools: ["EvidenceRequirementsGenerator", "EvidenceChainBuilder"],
    colorVar: "var(--phase-refinement)",
  },
};

export const toolMetaConfig: Record<string, ToolMeta> = {
  ClaimVerification: { icon: "✅", labelKey: "theory.tool.claimVerification.title", descKey: "theory.tool.claimVerification.beginner", phaseColor: "var(--phase-formulation)" },
  PropositionTypeCategorizer: { icon: "🏷️", labelKey: "theory.tool.propositionTypeCategorizer.title", descKey: "theory.tool.propositionTypeCategorizer.beginner", phaseColor: "var(--phase-formulation)" },
  ConceptMapper: { icon: "🗺️", labelKey: "theory.tool.conceptMapper.title", descKey: "theory.tool.conceptMapper.beginner", phaseColor: "var(--phase-formulation)" },
  BoundaryConditionsPanel: { icon: "🎯", labelKey: "theory.tool.boundaryConditions.title", descKey: "theory.tool.boundaryConditions.beginner", phaseColor: "var(--phase-formulation)" },
  FalsificationPrompts: { icon: "❌", labelKey: "theory.tool.falsificationPrompts.title", descKey: "theory.tool.falsificationPrompts.beginner", phaseColor: "var(--phase-validation)" },
  PeerReviewSimulator: { icon: "👥", labelKey: "theory.tool.peerReviewSimulator.title", descKey: "theory.tool.peerReviewSimulator.beginner", phaseColor: "var(--phase-validation)" },
  ContradictionFinder: { icon: "🔍", labelKey: "theory.tool.contradictionFinder.title", descKey: "theory.tool.contradictionFinder.beginner", phaseColor: "var(--phase-validation)" },
  ConsistencyChecker: { icon: "✓", labelKey: "theory.tool.consistencyChecker.title", descKey: "theory.tool.consistencyChecker.beginner", phaseColor: "var(--phase-validation)" },
  EvidenceRequirementsGenerator: { icon: "📝", labelKey: "theory.tool.evidenceRequirements.title", descKey: "theory.tool.evidenceRequirements.beginner", phaseColor: "var(--phase-refinement)" },
  EvidenceChainBuilder: { icon: "⛓️", labelKey: "theory.tool.evidenceChainBuilder.title", descKey: "theory.tool.evidenceChainBuilder.beginner", phaseColor: "var(--phase-refinement)" },
};

export const panelConfig: Record<string, { icon: string; titleKey: string; fallback: string }> = {
  documents: { icon: "📚", titleKey: "researchLab.documents", fallback: "Documents & Sources" },
  claims: { icon: "🏗️", titleKey: "researchLab.claims", fallback: "Claims Workspace" },
  evidence: { icon: "🧪", titleKey: "researchLab.evidence", fallback: "Evidence & Validation" },
  analytics: { icon: "📊", titleKey: "researchLab.analytics", fallback: "Analytics & Insights" },
};
