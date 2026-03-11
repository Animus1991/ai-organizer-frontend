// src/hooks/useTheoryWorkflow.ts
// Theory workflow state management for scientific theory development
import { useState, useEffect, useCallback } from 'react';

export type TheoryPhase = 'discovery' | 'formulation' | 'validation' | 'refinement' | 'publication';
export type TheoryStatus = 'inactive' | 'active' | 'completed' | 'archived';

export interface TheoryWorkflowState {
  currentPhase: TheoryPhase;
  status: TheoryStatus;
  progress: {
    discovery: number;    // 0-100
    formulation: number;  // 0-100
    validation: number;  // 0-100
    refinement: number;   // 0-100
    publication: number; // 0-100
  };
  metrics: {
    claimsCount: number;
    evidenceCount: number;
    contradictionsCount: number;
    conceptsCount: number;
    peerReviewsCount: number;
    lastUpdated: string;
  };
  sessionHistory: {
    phase: TheoryPhase;
    timestamp: string;
    duration: number; // minutes
    activities: string[];
  }[];
}

const WORKFLOW_STORAGE_KEY = 'thinkspace-theory-workflow';

// Phase transition rules
const phaseTransitions: Record<TheoryPhase, TheoryPhase[]> = {
  discovery: ['formulation'],
  formulation: ['validation', 'discovery'],
  validation: ['refinement', 'formulation'],
  refinement: ['publication', 'validation'],
  publication: ['refinement'], // Can go back for improvements
};

// Phase requirements
const phaseRequirements: Record<TheoryPhase, () => boolean> = {
  discovery: () => true, // Always available
  formulation: () => {
    const claims = JSON.parse(localStorage.getItem("thinkspace-claim-builder") || "[]");
    return claims.length >= 2; // Need at least 2 claims
  },
  validation: () => {
    const claims = JSON.parse(localStorage.getItem("thinkspace-claim-builder") || "[]");
    const contradictions = JSON.parse(localStorage.getItem("thinkspace-contradictions") || "{}");
    return claims.length >= 3 && contradictions.contradictions?.length >= 1;
  },
  refinement: () => {
    const evidence = JSON.parse(localStorage.getItem("thinkspace-evidence-requirements") || "[]");
    const contradictions = JSON.parse(localStorage.getItem("thinkspace-contradictions") || "{}");
    return evidence.length >= 3 && contradictions.contradictions?.some((c: any) => c.status === "resolved");
  },
  publication: () => {
    const readiness = JSON.parse(localStorage.getItem("thinkspace-publication-readiness") || "[]");
    const evidence = JSON.parse(localStorage.getItem("thinkspace-evidence-requirements") || "[]");
    const contradictions = JSON.parse(localStorage.getItem("thinkspace-contradictions") || "{}");
    return readiness.length >= 5 && 
           evidence.filter((r: any) => r.status === "found").length >= evidence.length * 0.8 &&
           contradictions.contradictions?.every((c: any) => c.status === "resolved");
  },
};

export function useTheoryWorkflow() {
  const [workflow, setWorkflow] = useState<TheoryWorkflowState>(() => {
    // Load from localStorage or initialize
    const stored = localStorage.getItem(WORKFLOW_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // Fall through to default
      }
    }
    
    return {
      currentPhase: 'discovery',
      status: 'inactive',
      progress: {
        discovery: 0,
        formulation: 0,
        validation: 0,
        refinement: 0,
        publication: 0,
      },
      metrics: {
        claimsCount: 0,
        evidenceCount: 0,
        contradictionsCount: 0,
        conceptsCount: 0,
        peerReviewsCount: 0,
        lastUpdated: new Date().toISOString(),
      },
      sessionHistory: [],
    };
  });

  // Auto-update metrics and progress
  const updateMetrics = useCallback(() => {
    const claims = JSON.parse(localStorage.getItem("thinkspace-claim-builder") || "[]");
    const evidence = JSON.parse(localStorage.getItem("thinkspace-evidence-requirements") || "[]");
    const contradictions = JSON.parse(localStorage.getItem("thinkspace-contradictions") || "{}");
    const concepts = JSON.parse(localStorage.getItem("thinkspace-ontology") || "[]");
    const reviews = JSON.parse(localStorage.getItem("thinkspace-peer-review") || "[]");
    
    const newMetrics = {
      claimsCount: claims.length,
      evidenceCount: evidence.length,
      contradictionsCount: contradictions.contradictions?.length || 0,
      conceptsCount: concepts.length,
      peerReviewsCount: reviews.length,
      lastUpdated: new Date().toISOString(),
    };
    
    // Calculate progress for each phase
    const newProgress = {
      discovery: Math.min(100, claims.length * 20), // 5 claims = 100%
      formulation: Math.min(100, concepts.length * 10 + (claims.filter((c: any) => c.type).length * 15)), // 10 concepts + categorized claims
      validation: Math.min(100, (evidence.filter((e: any) => e.status === "found").length / Math.max(evidence.length, 1)) * 50 + reviews.length * 10),
      refinement: Math.min(100, (contradictions.contradictions?.filter((c: any) => c.status === "resolved").length || 0) * 25),
      publication: Math.min(100, (evidence.filter((e: any) => e.status === "found").length / Math.max(evidence.length, 1)) * 60 + reviews.length * 8),
    };
    
    setWorkflow(prev => ({
      ...prev,
      metrics: newMetrics,
      progress: newProgress,
    }));
  }, []);

  // Auto-detect current phase based on progress
  const detectCurrentPhase = useCallback((): TheoryPhase => {
    const { progress } = workflow;
    
    // Check if publication is ready
    if (phaseRequirements.publication() && progress.publication >= 80) {
      return 'publication';
    }
    
    // Check if refinement is needed
    if (phaseRequirements.refinement() && progress.refinement >= 60) {
      return 'refinement';
    }
    
    // Check if validation is in progress
    if (phaseRequirements.validation() && progress.validation >= 40) {
      return 'validation';
    }
    
    // Check if formulation is in progress
    if (phaseRequirements.formulation() && progress.formulation >= 30) {
      return 'formulation';
    }
    
    return 'discovery';
  }, [workflow.progress]);

  // Transition to a new phase
  const transitionToPhase = useCallback((newPhase: TheoryPhase) => {
    const currentPhase = workflow.currentPhase;
    
    // Check if transition is allowed
    const allowedTransitions = phaseTransitions[currentPhase];
    if (!allowedTransitions.includes(newPhase)) {
      console.warn(`Cannot transition from ${currentPhase} to ${newPhase}`);
      return false;
    }
    
    // Check if phase requirements are met
    if (!phaseRequirements[newPhase]()) {
      console.warn(`Requirements for ${newPhase} phase not met`);
      return false;
    }
    
    // Record session history
    const sessionEntry = {
      phase: currentPhase,
      timestamp: new Date().toISOString(),
      duration: 0, // Will be calculated when transitioning out
      activities: [], // Could be populated with actual activities
    };
    
    setWorkflow(prev => ({
      ...prev,
      currentPhase: newPhase,
      status: 'active',
      sessionHistory: [...prev.sessionHistory.slice(-9), sessionEntry], // Keep last 10 sessions
    }));
    
    return true;
  }, [workflow.currentPhase]);

  // Get phase recommendations
  const getPhaseRecommendations = useCallback((phase: TheoryPhase): string[] => {
    const recommendations: Record<TheoryPhase, string[]> = {
      discovery: [
        'Upload and analyze source documents',
        'Extract initial claims and observations',
        'Identify key concepts and relationships',
        'Look for patterns and anomalies'
      ],
      formulation: [
        'Structure claims into logical arguments',
        'Define clear boundaries and scope',
        'Create concept ontology',
        'Establish proposition types'
      ],
      validation: [
        'Test claims against evidence',
        'Identify potential contradictions',
        'Run peer review simulations',
        'Check internal consistency'
      ],
      refinement: [
        'Resolve identified contradictions',
        'Strengthen weak arguments',
        'Fill evidence gaps',
        'Improve conceptual clarity'
      ],
      publication: [
        'Ensure all claims are properly evidenced',
        'Verify logical consistency',
        'Prepare academic citations',
        'Review publication readiness checklist'
      ]
    };
    
    return recommendations[phase] || [];
  }, []);

  // Get next recommended phase
  const getNextRecommendedPhase = useCallback((): TheoryPhase | null => {
    const currentPhase = workflow.currentPhase;
    const { progress } = workflow;
    
    // If current phase is complete (>80%), recommend next
    if (progress[currentPhase] >= 80) {
      const transitions = phaseTransitions[currentPhase];
      for (const nextPhase of transitions) {
        if (phaseRequirements[nextPhase]()) {
          return nextPhase;
        }
      }
    }
    
    return null;
  }, [workflow.currentPhase, workflow.progress]);

  // Save workflow state to localStorage
  const saveWorkflow = useCallback(() => {
    localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(workflow));
  }, [workflow]);

  // Reset workflow
  const resetWorkflow = useCallback(() => {
    const newWorkflow: TheoryWorkflowState = {
      currentPhase: 'discovery',
      status: 'inactive',
      progress: {
        discovery: 0,
        formulation: 0,
        validation: 0,
        refinement: 0,
        publication: 0,
      },
      metrics: {
        claimsCount: 0,
        evidenceCount: 0,
        contradictionsCount: 0,
        conceptsCount: 0,
        peerReviewsCount: 0,
        lastUpdated: new Date().toISOString(),
      },
      sessionHistory: [],
    };
    
    setWorkflow(newWorkflow);
    localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(newWorkflow));
  }, []);

  // Auto-update metrics and detect phase changes
  useEffect(() => {
    updateMetrics();
    
    const interval = setInterval(updateMetrics, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, [updateMetrics]);

  // Auto-detect phase changes
  useEffect(() => {
    const detectedPhase = detectCurrentPhase();
    if (detectedPhase !== workflow.currentPhase && phaseRequirements[detectedPhase]()) {
      transitionToPhase(detectedPhase);
    }
  }, [workflow.progress, detectCurrentPhase, transitionToPhase]);

  // Save to localStorage on changes
  useEffect(() => {
    saveWorkflow();
  }, [workflow, saveWorkflow]);

  return {
    workflow,
    currentPhase: workflow.currentPhase,
    status: workflow.status,
    progress: workflow.progress,
    metrics: workflow.metrics,
    sessionHistory: workflow.sessionHistory,
    
    // Actions
    transitionToPhase,
    updateMetrics,
    resetWorkflow,
    
    // Helpers
    getPhaseRecommendations,
    getNextRecommendedPhase,
    canTransitionTo: (phase: TheoryPhase) => phaseTransitions[workflow.currentPhase].includes(phase) && phaseRequirements[phase](),
    isPhaseComplete: (phase: TheoryPhase) => workflow.progress[phase] >= 80,
    getPhaseProgress: (phase: TheoryPhase) => workflow.progress[phase],
  };
}
