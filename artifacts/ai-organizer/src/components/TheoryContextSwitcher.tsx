// src/components/TheoryContextSwitcher.tsx
// Smart context switching between theory phases with intelligent recommendations
import { useState, useEffect, useCallback } from 'react';
import { useTheme, DASHBOARD_CARD, DASHBOARD_BTN } from '../context/ThemeContext';
import { useTheoryWorkflow, TheoryPhase } from '../hooks/useTheoryWorkflow';

interface TheoryContextSwitcherProps {
  currentPhase: TheoryPhase;
  onPhaseChange: (newPhase: TheoryPhase) => void;
  compact?: boolean;
  showRecommendations?: boolean;
}

export function TheoryContextSwitcher({ 
  currentPhase, 
  onPhaseChange, 
  compact = false,
  showRecommendations = true 
}: TheoryContextSwitcherProps) {
  const { colors } = useTheme();
  const { 
    workflow, 
    getNextRecommendedPhase, 
    canTransitionTo, 
    isPhaseComplete,
    getPhaseRecommendations,
    getPhaseProgress 
  } = useTheoryWorkflow();

  const [showPhaseDetails, setShowPhaseDetails] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<TheoryPhase | null>(null);

  // Phase configuration with colors and icons
  const phaseConfig = {
    discovery: {
      icon: '🔍',
      title: 'Discovery',
      color: '#6366f1',
      description: 'Explore documents & identify claims',
      tools: ['Document Upload', 'Search', 'Segmentation'],
    },
    formulation: {
      icon: '🏗️',
      title: 'Formulation',
      color: '#10b981',
      description: 'Structure claims & define boundaries',
      tools: ['Claim Builder', 'Concept Mapper', 'Boundaries'],
    },
    validation: {
      icon: '🧪',
      title: 'Validation',
      color: '#f59e0b',
      description: 'Test logic & gather evidence',
      tools: ['Falsification', 'Peer Review', 'Consistency'],
    },
    refinement: {
      icon: '⚡',
      title: 'Refinement',
      color: '#ef4444',
      description: 'Resolve contradictions & improve',
      tools: ['Evidence Chains', 'Gap Analysis'],
    },
    publication: {
      icon: '📑',
      title: 'Publication',
      color: '#8b5cf6',
      description: 'Prepare for academic review',
      tools: ['Readiness Check', 'Citations', 'Export'],
    },
  };

  // Auto-detect when to show recommendations
  const nextRecommended = getNextRecommendedPhase();
  const shouldShowRecommendation = showRecommendations && nextRecommended && isPhaseComplete(currentPhase);

  // Handle phase selection with validation
  const handlePhaseSelect = useCallback((phase: TheoryPhase) => {
    if (canTransitionTo(phase)) {
      onPhaseChange(phase);
      setSelectedPhase(null);
    } else {
      // Show why transition is not allowed
      setSelectedPhase(phase);
      setShowPhaseDetails(true);
    }
  }, [canTransitionTo, onPhaseChange]);

  // Get phase status indicator
  const getPhaseStatus = (phase: TheoryPhase) => {
    const progress = getPhaseProgress(phase);
    if (progress >= 80) return { status: 'complete', color: '#10b981', label: 'Complete' };
    if (progress >= 40) return { status: 'in-progress', color: '#f59e0b', label: 'In Progress' };
    if (progress > 0) return { status: 'started', color: '#6366f1', label: 'Started' };
    return { status: 'locked', color: '#6b7280', label: 'Not Started' };
  };

  if (compact) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        <span style={{ fontSize: '12px', color: colors.textSecondary }}>
          Current:
        </span>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 8px',
          background: `${phaseConfig[currentPhase].color}20`,
          borderRadius: '6px',
        }}>
          <span>{phaseConfig[currentPhase].icon}</span>
          <span style={{ fontSize: '13px', color: phaseConfig[currentPhase].color, fontWeight: '600' }}>
            {phaseConfig[currentPhase].title}
          </span>
        </div>
        
        {shouldShowRecommendation && nextRecommended && (
          <button
            onClick={() => handlePhaseSelect(nextRecommended)}
            style={{
              ...DASHBOARD_BTN,
              padding: '4px 8px',
              fontSize: '11px',
              background: `${phaseConfig[nextRecommended].color}20`,
              borderColor: phaseConfig[nextRecommended].color,
            }}
          >
            → {phaseConfig[nextRecommended].title}
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: '16px' }}>
      {/* Current Phase Header */}
      <div style={{
        ...DASHBOARD_CARD,
        padding: '16px',
        marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '600', color: colors.textPrimary }}>
              Theory Development Phase
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '24px' }}>{phaseConfig[currentPhase].icon}</span>
              <div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: phaseConfig[currentPhase].color }}>
                  {phaseConfig[currentPhase].title}
                </div>
                <div style={{ fontSize: '12px', color: colors.textSecondary }}>
                  {phaseConfig[currentPhase].description}
                </div>
              </div>
            </div>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: phaseConfig[currentPhase].color }}>
              {getPhaseProgress(currentPhase)}%
            </div>
            <div style={{ fontSize: '11px', color: colors.textSecondary }}>
              {getPhaseStatus(currentPhase).label}
            </div>
          </div>
        </div>
      </div>

      {/* Phase Navigation Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
        marginBottom: '16px',
      }}>
        {Object.entries(phaseConfig).map(([phase, config]) => {
          const phaseStatus = getPhaseStatus(phase as TheoryPhase);
          const canTransition = canTransitionTo(phase as TheoryPhase);
          const isCurrent = phase === currentPhase;
          
          return (
            <button
              key={phase}
              onClick={() => handlePhaseSelect(phase as TheoryPhase)}
              disabled={!canTransition && !isCurrent}
              style={{
                ...DASHBOARD_CARD,
                padding: '16px',
                border: `2px solid ${isCurrent ? config.color : canTransition ? `${config.color}40` : 'rgba(255,255,255,0.1)'}`,
                background: isCurrent ? `${config.color}15` : canTransition ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                cursor: canTransition || isCurrent ? 'pointer' : 'not-allowed',
                opacity: canTransition || isCurrent ? 1 : 0.5,
                transition: 'all 0.2s ease',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                if (canTransition || isCurrent) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 8px 24px ${config.color}30`;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '20px' }}>{config.icon}</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: config.color }}>
                  {config.title}
                </span>
              </div>
              
              <div style={{ fontSize: '11px', color: colors.textSecondary, marginBottom: '8px' }}>
                {config.description}
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{
                  fontSize: '10px',
                  padding: '2px 6px',
                  background: `${phaseStatus.color}20`,
                  color: phaseStatus.color,
                  borderRadius: '4px',
                  fontWeight: '500',
                }}>
                  {phaseStatus.label}
                </div>
                <div style={{ fontSize: '12px', fontWeight: '600', color: colors.textPrimary }}>
                  {getPhaseProgress(phase as TheoryPhase)}%
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Smart Recommendation */}
      {shouldShowRecommendation && nextRecommended && (
        <div style={{
          ...DASHBOARD_CARD,
          padding: '16px',
          background: `linear-gradient(135deg, ${phaseConfig[nextRecommended].color}15 0%, transparent 100%)`,
          border: `1px solid ${phaseConfig[nextRecommended].color}40`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: `${phaseConfig[nextRecommended].color}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
            }}>
              {phaseConfig[nextRecommended].icon}
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '4px' }}>
                Ready for {phaseConfig[nextRecommended].title} Phase
              </div>
              <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '8px' }}>
                {phaseConfig[nextRecommended].description}
              </div>
              
              <button
                onClick={() => handlePhaseSelect(nextRecommended)}
                style={{
                  ...DASHBOARD_BTN,
                  background: phaseConfig[nextRecommended].color,
                  borderColor: phaseConfig[nextRecommended].color,
                  color: 'white',
                  padding: '6px 12px',
                  fontSize: '12px',
                }}
              >
                Continue to {phaseConfig[nextRecommended].title}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Phase Details Modal */}
      {showPhaseDetails && selectedPhase && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
        }}>
          <div style={{
            ...DASHBOARD_CARD,
            width: '90%',
            maxWidth: '500px',
            padding: '20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: colors.textPrimary }}>
                {phaseConfig[selectedPhase].title} Phase
              </h3>
              <button
                onClick={() => {
                  setShowPhaseDetails(false);
                  setSelectedPhase(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: colors.textSecondary,
                  cursor: 'pointer',
                  fontSize: '20px',
                }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '24px' }}>{phaseConfig[selectedPhase].icon}</span>
                <span style={{ fontSize: '14px', color: colors.textSecondary }}>
                  {phaseConfig[selectedPhase].description}
                </span>
              </div>
              
              <div style={{ fontSize: '13px', color: colors.textPrimary, marginBottom: '12px' }}>
                Progress: {getPhaseProgress(selectedPhase)}% - {getPhaseStatus(selectedPhase).label}
              </div>
              
              {!canTransitionTo(selectedPhase) && (
                <div style={{
                  padding: '8px 12px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#ef4444',
                }}>
                  This phase is not yet available. Complete the requirements for the current phase first.
                </div>
              )}
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: '600', color: colors.textPrimary }}>
                Recommended Tools:
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {phaseConfig[selectedPhase].tools.map(tool => (
                  <span
                    key={tool}
                    style={{
                      padding: '4px 8px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '4px',
                      fontSize: '11px',
                      color: colors.textSecondary,
                    }}
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: '600', color: colors.textPrimary }}>
                Next Steps:
              </h4>
              <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: colors.textSecondary }}>
                {getPhaseRecommendations(selectedPhase).map((rec, index) => (
                  <li key={index} style={{ marginBottom: '4px' }}>{rec}</li>
                ))}
              </ul>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowPhaseDetails(false);
                  setSelectedPhase(null);
                }}
                style={{
                  ...DASHBOARD_BTN,
                  background: 'transparent',
                  borderColor: colors.borderPrimary,
                  color: colors.textSecondary,
                }}
              >
                Close
              </button>
              {canTransitionTo(selectedPhase) && (
                <button
                  onClick={() => {
                    handlePhaseSelect(selectedPhase);
                    setShowPhaseDetails(false);
                    setSelectedPhase(null);
                  }}
                  style={{
                    ...DASHBOARD_BTN,
                    background: phaseConfig[selectedPhase].color,
                    borderColor: phaseConfig[selectedPhase].color,
                    color: 'white',
                  }}
                >
                  Switch to {phaseConfig[selectedPhase].title}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
