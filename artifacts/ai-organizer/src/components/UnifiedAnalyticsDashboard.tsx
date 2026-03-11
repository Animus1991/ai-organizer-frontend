// src/components/UnifiedAnalyticsDashboard.tsx
// Unified analytics dashboard combining all theory development metrics
import { useState, useEffect, useMemo } from 'react';
import { useTheme, DASHBOARD_CARD, DASHBOARD_BTN } from '../context/ThemeContext';
import { useTheoryWorkflow } from '../hooks/useTheoryWorkflow';

interface UnifiedAnalyticsDashboardProps {
  compact?: boolean;
  showRecommendations?: boolean;
  refreshInterval?: number;
}

export function UnifiedAnalyticsDashboard({ 
  compact = false, 
  showRecommendations = true,
  refreshInterval = 30000 
}: UnifiedAnalyticsDashboardProps) {
  const { colors } = useTheme();
  const { workflow, updateMetrics } = useTheoryWorkflow();
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Auto-refresh metrics
  useEffect(() => {
    const interval = setInterval(() => {
      updateMetrics();
      setLastRefresh(new Date());
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [updateMetrics, refreshInterval]);

  // Calculate comprehensive metrics from all Think!Hub components
  const comprehensiveMetrics = useMemo(() => {
    try {
      // Collect data from all Think!Hub components
      const claims = JSON.parse(localStorage.getItem("thinkspace-claim-builder") || "[]");
      const props = JSON.parse(localStorage.getItem("thinkspace-proposition-types") || "[]");
      const evReqs = JSON.parse(localStorage.getItem("thinkspace-evidence-requirements") || "[]");
      const contradictions = JSON.parse(localStorage.getItem("thinkspace-contradictions") || "{}");
      const boundaries = JSON.parse(localStorage.getItem("thinkspace-boundary-conditions") || "{}");
      const ontology = JSON.parse(localStorage.getItem("thinkspace-ontology") || "[]");
      const versions = JSON.parse(localStorage.getItem("thinkspace-theory-versions") || "{}");
      const reviews = JSON.parse(localStorage.getItem("thinkspace-peer-review") || "[]");
      const readiness = JSON.parse(localStorage.getItem("thinkspace-publication-readiness") || "[]");
      const evidenceChains = JSON.parse(localStorage.getItem("thinkspace-evidence-chains") || "[]");
      const counterTheories = JSON.parse(localStorage.getItem("thinkspace-counter-theories") || "[]");

      // Calculate advanced metrics
      const metrics = {
        // Core Theory Metrics
        totalClaims: claims.length,
        categorizedClaims: props.filter((p: any) => p.manualType || p.autoType !== "uncategorized").length,
        claimTypes: {
          factual: claims.filter((c: any) => c.type === "factual").length,
          hypothesis: claims.filter((c: any) => c.type === "hypothesis").length,
          methodological: claims.filter((c: any) => c.type === "methodological").length,
          opinion: claims.filter((c: any) => c.type === "opinion").length,
        },
        
        // Evidence Metrics
        totalEvidence: evReqs.length,
        foundEvidence: evReqs.filter((r: any) => r.status === "found").length,
        evidenceCoverage: evReqs.length > 0 ? evReqs.filter((r: any) => r.status === "found").length / evReqs.length : 0,
        evidenceChains: evidenceChains.length,
        
        // Consistency Metrics
        totalContradictions: contradictions.contradictions?.length || 0,
        resolvedContradictions: contradictions.contradictions?.filter((c: any) => c.status === "resolved").length || 0,
        activeContradictions: contradictions.contradictions?.filter((c: any) => c.status === "active").length || 0,
        consistencyScore: contradictions.contradictions?.length > 0 ? 
          (contradictions.contradictions?.filter((c: any) => c.status === "resolved").length || 0) / contradictions.contradictions.length : 1,
        
        // Structure Metrics
        totalConcepts: ontology.length,
        definedBoundaries: boundaries.conditions?.length || 0,
        theoryVersions: versions.versions?.length || 0,
        
        // Validation Metrics
        peerReviews: reviews.length,
        averageReviewScore: reviews.length > 0 ? reviews.reduce((sum: number, r: any) => sum + (r.score || 0), 0) / reviews.length : 0,
        publicationReadiness: readiness.length > 0 ? readiness.filter((r: any) => r.status === "pass").length / readiness.length : 0,
        
        // Comparative Analysis
        counterTheories: counterTheories.length,
        theoryStrength: calculateTheoryStrength(claims, evReqs, contradictions, reviews),
        
        // Progress Metrics
        overallProgress: calculateOverallProgress(workflow.progress),
        phaseProgress: workflow.progress,
        
        // Quality Metrics
        claimQuality: calculateClaimQuality(claims, evReqs),
        evidenceQuality: calculateEvidenceQuality(evReqs),
        logicalCoherence: calculateLogicalCoherence(contradictions, claims),
      };

      return metrics;
    } catch (error) {
      console.error('Error calculating comprehensive metrics:', error);
      return {
        totalClaims: 0, categorizedClaims: 0, claimTypes: { factual: 0, hypothesis: 0, methodological: 0, opinion: 0 },
        totalEvidence: 0, foundEvidence: 0, evidenceCoverage: 0, evidenceChains: 0,
        totalContradictions: 0, resolvedContradictions: 0, activeContradictions: 0, consistencyScore: 1,
        totalConcepts: 0, definedBoundaries: 0, theoryVersions: 0,
        peerReviews: 0, averageReviewScore: 0, publicationReadiness: 0,
        counterTheories: 0, theoryStrength: 0,
        overallProgress: 0, phaseProgress: workflow.progress,
        claimQuality: 0, evidenceQuality: 0, logicalCoherence: 0,
      };
    }
  }, [workflow.progress]);

  // Calculate theory strength score
  const calculateTheoryStrength = (claims: any[], evidence: any[], contradictions: any, reviews: any[]) => {
    let score = 0;
    
    // Claims contribution (30%)
    if (claims.length >= 5) score += 30;
    else if (claims.length >= 3) score += 20;
    else if (claims.length >= 1) score += 10;
    
    // Evidence contribution (25%)
    const evidenceCoverage = evidence.length > 0 ? evidence.filter((e: any) => e.status === "found").length / evidence.length : 0;
    score += evidenceCoverage * 25;
    
    // Consistency contribution (20%)
    const consistencyScore = contradictions.contradictions?.length > 0 ? 
      (contradictions.contradictions?.filter((c: any) => c.status === "resolved").length || 0) / contradictions.contradictions.length : 1;
    score += consistencyScore * 20;
    
    // Peer review contribution (15%)
    if (reviews.length >= 3) score += 15;
    else if (reviews.length >= 1) score += 8;
    
    // Structure contribution (10%)
    const ontology = JSON.parse(localStorage.getItem("thinkspace-ontology") || "[]");
    if (ontology.length >= 10) score += 10;
    else if (ontology.length >= 5) score += 6;
    else if (ontology.length >= 2) score += 3;
    
    return Math.round(score);
  };

  // Calculate overall progress
  const calculateOverallProgress = (phaseProgress: any) => {
    const values = Object.values(phaseProgress) as number[];
    return Math.round(values.reduce((sum, val) => sum + val, 0) / values.length);
  };

  // Calculate claim quality
  const calculateClaimQuality = (claims: any[], evidence: any[]) => {
    if (claims.length === 0) return 0;
    
    const categorizedClaims = claims.filter((c: any) => c.type && c.type !== "uncategorized").length;
    const evidencedClaims = claims.filter((c: any) => evidence.some((e: any) => e.claimId === c.id && e.status === "found")).length;
    
    return Math.round(((categorizedClaims / claims.length) * 0.6 + (evidencedClaims / claims.length) * 0.4) * 100);
  };

  // Calculate evidence quality
  const calculateEvidenceQuality = (evidence: any[]) => {
    if (evidence.length === 0) return 0;
    
    const foundEvidence = evidence.filter((e: any) => e.status === "found").length;
    const strongEvidence = evidence.filter((e: any) => e.status === "found" && e.strength === "strong").length;
    
    return Math.round(((foundEvidence / evidence.length) * 0.7 + (strongEvidence / evidence.length) * 0.3) * 100);
  };

  // Calculate logical coherence
  const calculateLogicalCoherence = (contradictions: any, _claims: any[]) => {
    const totalContradictions = contradictions.contradictions?.length || 0;
    const resolvedContradictions = contradictions.contradictions?.filter((c: any) => c.status === "resolved").length || 0;
    
    if (totalContradictions === 0) return 100;
    return Math.round((resolvedContradictions / totalContradictions) * 100);
  };

  // Get quality color
  const getQualityColor = (score: number) => {
    if (score >= 80) return '#10b981'; // green
    if (score >= 60) return '#f59e0b'; // amber
    if (score >= 40) return '#ef4444'; // red
    return '#6b7280'; // gray
  };

  // Get quality grade
  const getQualityGrade = (score: number) => {
    if (score >= 90) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 80) return 'A-';
    if (score >= 75) return 'B+';
    if (score >= 70) return 'B';
    if (score >= 65) return 'B-';
    if (score >= 60) return 'C+';
    if (score >= 55) return 'C';
    if (score >= 50) return 'C-';
    return 'D';
  };

  if (compact) {
    return (
      <div style={{
        ...DASHBOARD_CARD,
        padding: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', color: colors.textSecondary }}>Theory Analytics</span>
          <span style={{ fontSize: '10px', color: colors.textSecondary }}>
            Last: {lastRefresh.toLocaleTimeString()}
          </span>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: getQualityColor(comprehensiveMetrics.theoryStrength) }}>
              {comprehensiveMetrics.theoryStrength}
            </div>
            <div style={{ fontSize: '9px', color: colors.textSecondary }}>Strength</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: getQualityColor(comprehensiveMetrics.overallProgress) }}>
              {comprehensiveMetrics.overallProgress}%
            </div>
            <div style={{ fontSize: '9px', color: colors.textSecondary }}>Progress</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: getQualityColor(comprehensiveMetrics.consistencyScore * 100) }}>
              {Math.round(comprehensiveMetrics.consistencyScore * 100)}%
            </div>
            <div style={{ fontSize: '9px', color: colors.textSecondary }}>Consistency</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
      }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: colors.textPrimary }}>
          📊 Unified Theory Analytics
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={updateMetrics}
            style={{
              ...DASHBOARD_BTN,
              padding: '6px 12px',
              fontSize: '11px',
            }}
          >
            🔄 Refresh
          </button>
          <span style={{ fontSize: '11px', color: colors.textSecondary }}>
            Last: {lastRefresh.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Overall Score Card */}
      <div style={{
        ...DASHBOARD_CARD,
        padding: '20px',
        marginBottom: '16px',
        background: `linear-gradient(135deg, ${getQualityColor(comprehensiveMetrics.theoryStrength)}15 0%, transparent 100%)`,
        border: `1px solid ${getQualityColor(comprehensiveMetrics.theoryStrength)}30`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: `conic-gradient(from 0deg, ${getQualityColor(comprehensiveMetrics.theoryStrength)} 0%, ${getQualityColor(comprehensiveMetrics.theoryStrength)} ${comprehensiveMetrics.theoryStrength * 3.6}deg, rgba(255,255,255,0.1) ${comprehensiveMetrics.theoryStrength * 3.6}deg)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}>
            <div style={{
              width: '70px',
              height: '70px',
              borderRadius: '50%',
              background: colors.bgPrimary,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: getQualityColor(comprehensiveMetrics.theoryStrength) }}>
                {getQualityGrade(comprehensiveMetrics.theoryStrength)}
              </span>
              <span style={{ fontSize: '10px', color: colors.textSecondary }}>
                {comprehensiveMetrics.theoryStrength}/100
              </span>
            </div>
          </div>
          
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: '600', color: colors.textPrimary }}>
              Think!Hub Ecosystem Performance Score
            </h4>
            <p style={{ margin: "0 0 24px", fontSize: "14px", color: colors.textSecondary }}>
        Comprehensive analytics for Think!Hub ecosystem performance and user engagement.
      </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: '#6366f1' }}>📝</span>
                <span style={{ fontSize: '11px', color: colors.textSecondary }}>
                  {comprehensiveMetrics.totalClaims} claims
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: '#10b981' }}>🔍</span>
                <span style={{ fontSize: '11px', color: colors.textSecondary }}>
                  {Math.round(comprehensiveMetrics.evidenceCoverage * 100)}% evidence
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: '#f59e0b' }}>⚖️</span>
                <span style={{ fontSize: '11px', color: colors.textSecondary }}>
                  {Math.round(comprehensiveMetrics.consistencyScore * 100)}% consistent
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: '#8b5cf6' }}>👥</span>
                <span style={{ fontSize: '11px', color: colors.textSecondary }}>
                  {comprehensiveMetrics.peerReviews} reviews
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '12px',
        marginBottom: '16px',
      }}>
        {/* Claims Analysis */}
        <div style={{ ...DASHBOARD_CARD, padding: '16px' }}>
          <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: "600", color: colors.textPrimary }}>
        Think!Hub Analytics Dashboard
      </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: colors.textPrimary }}>
                {comprehensiveMetrics.totalClaims}
              </div>
              <div style={{ fontSize: '11px', color: colors.textSecondary }}>Total Claims</div>
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: getQualityColor(comprehensiveMetrics.claimQuality) }}>
                {comprehensiveMetrics.claimQuality}%
              </div>
              <div style={{ fontSize: '11px', color: colors.textSecondary }}>Quality Score</div>
            </div>
          </div>
          <div style={{ fontSize: '11px', color: colors.textSecondary }}>
            Types: {comprehensiveMetrics.claimTypes.factual} factual, {comprehensiveMetrics.claimTypes.hypothesis} hypothesis, {comprehensiveMetrics.claimTypes.methodological} methodological
          </div>
        </div>

        {/* Evidence Analysis */}
        <div style={{ ...DASHBOARD_CARD, padding: '16px' }}>
          <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: colors.textPrimary }}>
            🔍 Evidence Analysis
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: colors.textPrimary }}>
                {comprehensiveMetrics.foundEvidence}/{comprehensiveMetrics.totalEvidence}
              </div>
              <div style={{ fontSize: '11px', color: colors.textSecondary }}>Found Evidence</div>
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: getQualityColor(comprehensiveMetrics.evidenceQuality) }}>
                {comprehensiveMetrics.evidenceQuality}%
              </div>
              <div style={{ fontSize: '11px', color: colors.textSecondary }}>Quality Score</div>
            </div>
          </div>
          <div style={{ fontSize: '11px', color: colors.textSecondary }}>
            Coverage: {Math.round(comprehensiveMetrics.evidenceCoverage * 100)}% • Chains: {comprehensiveMetrics.evidenceChains}
          </div>
        </div>

        {/* Consistency Analysis */}
        <div style={{ ...DASHBOARD_CARD, padding: '16px' }}>
          <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: colors.textPrimary }}>
            ⚖️ Consistency Analysis
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: colors.textPrimary }}>
                {comprehensiveMetrics.resolvedContradictions}/{comprehensiveMetrics.totalContradictions}
              </div>
              <div style={{ fontSize: '11px', color: colors.textSecondary }}>Resolved</div>
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: getQualityColor(comprehensiveMetrics.logicalCoherence) }}>
                {comprehensiveMetrics.logicalCoherence}%
              </div>
              <div style={{ fontSize: '11px', color: colors.textSecondary }}>Coherence</div>
            </div>
          </div>
          <div style={{ fontSize: '11px', color: colors.textSecondary }}>
            Active: {comprehensiveMetrics.activeContradictions} contradictions
          </div>
        </div>

        {/* Validation Analysis */}
        <div style={{ ...DASHBOARD_CARD, padding: '16px' }}>
          <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: colors.textPrimary }}>
            👥 Validation Analysis
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: colors.textPrimary }}>
                {comprehensiveMetrics.peerReviews}
              </div>
              <div style={{ fontSize: '11px', color: colors.textSecondary }}>Peer Reviews</div>
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: getQualityColor(comprehensiveMetrics.publicationReadiness * 100) }}>
                {Math.round(comprehensiveMetrics.publicationReadiness * 100)}%
              </div>
              <div style={{ fontSize: '11px', color: colors.textSecondary }}>Ready</div>
            </div>
          </div>
          <div style={{ fontSize: '11px', color: colors.textSecondary }}>
            Avg Score: {comprehensiveMetrics.averageReviewScore.toFixed(1)}/5
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div style={{ ...DASHBOARD_CARD, padding: '16px' }}>
        <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: colors.textPrimary }}>
          📈 Phase Progress
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {Object.entries(comprehensiveMetrics.phaseProgress).map(([phase, progress]) => (
            <div key={phase} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', width: '80px', color: colors.textSecondary }}>
                {phase.charAt(0).toUpperCase() + phase.slice(1)}
              </span>
              <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${progress}%`,
                    background: getQualityColor(progress as number),
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
              <span style={{ fontSize: '11px', width: '35px', textAlign: 'right', color: colors.textSecondary }}>
                {progress}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {showRecommendations && comprehensiveMetrics.theoryStrength < 80 && (
        <div style={{
          ...DASHBOARD_CARD,
          padding: '16px',
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
        }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: '600', color: '#f59e0b' }}>
            💡 Recommendations for Improvement
          </h4>
          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: colors.textSecondary }}>
            {comprehensiveMetrics.claimQuality < 70 && (
              <li>Categorize more claims and ensure each has supporting evidence</li>
            )}
            {comprehensiveMetrics.evidenceCoverage < 0.8 && (
              <li>Find evidence for unsupported claims to strengthen your theory</li>
            )}
            {comprehensiveMetrics.consistencyScore < 0.8 && (
              <li>Resolve active contradictions to improve logical coherence</li>
            )}
            {comprehensiveMetrics.peerReviews < 3 && (
              <li>Conduct more peer reviews to validate your claims</li>
            )}
            {comprehensiveMetrics.totalConcepts < 10 && (
              <li>Expand your concept ontology for better theoretical foundation</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
