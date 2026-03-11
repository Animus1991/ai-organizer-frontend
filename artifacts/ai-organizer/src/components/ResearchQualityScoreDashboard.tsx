/**
 * ResearchQualityScoreDashboard - Comprehensive research quality metrics dashboard
 * 
 * Provides visualizations and metrics for:
 * - Evidence Coverage (% claims with evidence)
 * - Falsifiability Coverage (% predictions with falsifiability criteria)
 * - Link Density (average links per segment)
 * - Type Distribution (pie chart of segment types)
 * - Evidence Quality Trend (timeline)
 * - Research Debt (claims needing evidence)
 */

import React, { useMemo } from 'react';
import { SegmentDTO } from '../lib/api';

interface SegmentLinkDTO {
  id: number;
  fromSegmentId: number;
  toSegmentId: number;
  linkType?: string;
}

interface ResearchMetrics {
  totalSegments: number;
  claims: number;
  evidence: number;
  predictions: number;
  definitions: number;
  others: number;
  evidenceCoverage: number; // % claims with evidence
  falsifiabilityCoverage: number; // % predictions with falsifiability
  avgLinksPerSegment: number;
  e4Evidence: number;
  e3Evidence: number;
  e2Evidence: number;
  e1Evidence: number;
  e0Evidence: number;
  claimsWithoutEvidence: number;
  predictionsWithoutFalsifiability: number;
}

interface ResearchQualityScoreDashboardProps {
  segments: SegmentDTO[];
  links: SegmentLinkDTO[];
  documentTitle?: string;
}

export function ResearchQualityScoreDashboard({
  segments,
  links,
  documentTitle = 'Document'
}: ResearchQualityScoreDashboardProps) {
  const metrics = useMemo<ResearchMetrics>(() => {
    const totalSegments = segments.length;
    
    // Count by type
    const claims = segments.filter(s => s.segmentType === 'claim').length;
    const evidence = segments.filter(s => s.segmentType === 'evidence').length;
    const predictions = segments.filter(s => s.segmentType === 'prediction').length;
    const definitions = segments.filter(s => s.segmentType === 'definition').length;
    const others = totalSegments - claims - evidence - predictions - definitions;
    
    // Evidence coverage: % of claims that have evidence links
    const claimsWithEvidence = segments.filter(s => 
      s.segmentType === 'claim' && 
      links.some(l => l.toSegmentId === s.id || l.fromSegmentId === s.id)
    ).length;
    const evidenceCoverage = claims > 0 ? (claimsWithEvidence / claims) * 100 : 0;
    
    // Falsifiability coverage: % of predictions with falsifiability criteria
    // (Checking if prediction has links to test/criteria segments)
    const predictionsWithFalsifiability = segments.filter(s =>
      s.segmentType === 'prediction' &&
      links.some(l => l.toSegmentId === s.id || l.fromSegmentId === s.id)
    ).length;
    const falsifiabilityCoverage = predictions > 0 
      ? (predictionsWithFalsifiability / predictions) * 100 
      : 0;
    
    // Average links per segment
    const avgLinksPerSegment = totalSegments > 0 
      ? links.length / totalSegments 
      : 0;
    
    // Evidence grade distribution
    const e4Evidence = segments.filter(s => s.evidenceGrade === 'E4').length;
    const e3Evidence = segments.filter(s => s.evidenceGrade === 'E3').length;
    const e2Evidence = segments.filter(s => s.evidenceGrade === 'E2').length;
    const e1Evidence = segments.filter(s => s.evidenceGrade === 'E1').length;
    const e0Evidence = segments.filter(s => 
      s.segmentType === 'claim' && (!s.evidenceGrade || s.evidenceGrade === 'E0')
    ).length;
    
    // Research debt
    const claimsWithoutEvidence = claims - claimsWithEvidence;
    const predictionsWithoutFalsifiability = predictions - predictionsWithFalsifiability;
    
    return {
      totalSegments,
      claims,
      evidence,
      predictions,
      definitions,
      others,
      evidenceCoverage,
      falsifiabilityCoverage,
      avgLinksPerSegment,
      e4Evidence,
      e3Evidence,
      e2Evidence,
      e1Evidence,
      e0Evidence,
      claimsWithoutEvidence,
      predictionsWithoutFalsifiability,
    };
  }, [segments, links]);

  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#10b981'; // Green
    if (score >= 60) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Work';
  };

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(20, 20, 30, 0.95) 0%, rgba(15, 15, 25, 0.95) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '20px',
        padding: '28px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        color: 'rgba(255, 255, 255, 0.9)',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ 
          fontSize: '22px', 
          fontWeight: 600, 
          marginBottom: '4px',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Research Quality Score
        </h2>
        <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.5)' }}>
          {documentTitle} • {metrics.totalSegments} segments
        </p>
      </div>

      {/* Overall Score */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          padding: '20px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: `conic-gradient(${getScoreColor(
              (metrics.evidenceCoverage + metrics.falsifiabilityCoverage) / 2
            )} ${(metrics.evidenceCoverage + metrics.falsifiabilityCoverage) / 2 * 3.6}deg, rgba(255,255,255,0.1) 0deg)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: 700,
          }}
        >
          <span style={{ color: getScoreColor((metrics.evidenceCoverage + metrics.falsifiabilityCoverage) / 2) }}>
            {Math.round((metrics.evidenceCoverage + metrics.falsifiabilityCoverage) / 2)}
          </span>
        </div>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 600 }}>
            {getScoreLabel((metrics.evidenceCoverage + metrics.falsifiabilityCoverage) / 2)}
          </div>
          <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)' }}>
            Overall Research Quality
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {/* Evidence Coverage */}
        <MetricCard
          title="Evidence Coverage"
          value={`${Math.round(metrics.evidenceCoverage)}%`}
          subtitle={`${metrics.claims - metrics.claimsWithoutEvidence}/${metrics.claims} claims`}
          color={getScoreColor(metrics.evidenceCoverage)}
        />

        {/* Falsifiability Coverage */}
        <MetricCard
          title="Falsifiability"
          value={`${Math.round(metrics.falsifiabilityCoverage)}%`}
          subtitle={`${metrics.predictions - metrics.predictionsWithoutFalsifiability}/${metrics.predictions} predictions`}
          color={getScoreColor(metrics.falsifiabilityCoverage)}
        />

        {/* Link Density */}
        <MetricCard
          title="Link Density"
          value={metrics.avgLinksPerSegment.toFixed(1)}
          subtitle={`${links.length} total links`}
          color={metrics.avgLinksPerSegment >= 1 ? '#10b981' : '#f59e0b'}
        />

        {/* Evidence Quality */}
        <MetricCard
          title="High-Grade Evidence"
          value={`${metrics.e4Evidence + metrics.e3Evidence}`}
          subtitle={`E4: ${metrics.e4Evidence}, E3: ${metrics.e3Evidence}`}
          color={metrics.e4Evidence > 0 ? '#10b981' : '#f59e0b'}
        />
      </div>

      {/* Type Distribution */}
      <div style={{ marginBottom: '24px' }}>
        <h3
          style={{
            fontSize: '14px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: 'rgba(255, 255, 255, 0.6)',
            marginBottom: '12px',
          }}
        >
          Segment Type Distribution
        </h3>
        <div
          style={{
            display: 'flex',
            height: '32px',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          {metrics.claims > 0 && (
            <DistributionBar
              value={metrics.claims}
              total={metrics.totalSegments}
              color="#6366f1"
              label="Claims"
            />
          )}
          {metrics.evidence > 0 && (
            <DistributionBar
              value={metrics.evidence}
              total={metrics.totalSegments}
              color="#10b981"
              label="Evidence"
            />
          )}
          {metrics.predictions > 0 && (
            <DistributionBar
              value={metrics.predictions}
              total={metrics.totalSegments}
              color="#f59e0b"
              label="Predictions"
            />
          )}
          {metrics.definitions > 0 && (
            <DistributionBar
              value={metrics.definitions}
              total={metrics.totalSegments}
              color="#8b5cf6"
              label="Definitions"
            />
          )}
          {metrics.others > 0 && (
            <DistributionBar
              value={metrics.others}
              total={metrics.totalSegments}
              color="#6b7280"
              label="Others"
            />
          )}
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            marginTop: '12px',
            fontSize: '12px',
          }}
        >
          <LegendItem color="#6366f1" label={`Claims (${metrics.claims})`} />
          <LegendItem color="#10b981" label={`Evidence (${metrics.evidence})`} />
          <LegendItem color="#f59e0b" label={`Predictions (${metrics.predictions})`} />
          <LegendItem color="#8b5cf6" label={`Definitions (${metrics.definitions})`} />
          <LegendItem color="#6b7280" label={`Others (${metrics.others})`} />
        </div>
      </div>

      {/* Research Debt */}
      {(metrics.claimsWithoutEvidence > 0 || metrics.predictionsWithoutFalsifiability > 0) && (
        <div
          style={{
            padding: '16px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
          }}
        >
          <h3
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#ef4444',
              marginBottom: '8px',
            }}
          >
            ⚠️ Research Debt
          </h3>
          <ul
            style={{
              margin: 0,
              paddingLeft: '20px',
              fontSize: '13px',
              color: 'rgba(255, 255, 255, 0.7)',
            }}
          >
            {metrics.claimsWithoutEvidence > 0 && (
              <li>
                {metrics.claimsWithoutEvidence} claim{metrics.claimsWithoutEvidence > 1 ? 's' : ''} without evidence
              </li>
            )}
            {metrics.predictionsWithoutFalsifiability > 0 && (
              <li>
                {metrics.predictionsWithoutFalsifiability} prediction{metrics.predictionsWithoutFalsifiability > 1 ? 's' : ''} without falsifiability criteria
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Evidence Grade Distribution */}
      <div style={{ marginTop: '24px' }}>
        <h3
          style={{
            fontSize: '14px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: 'rgba(255, 255, 255, 0.6)',
            marginBottom: '12px',
          }}
        >
          Evidence Grade Distribution
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <GradeBar grade="E4" count={metrics.e4Evidence} total={metrics.evidence} color="#10b981" />
          <GradeBar grade="E3" count={metrics.e3Evidence} total={metrics.evidence} color="#34d399" />
          <GradeBar grade="E2" count={metrics.e2Evidence} total={metrics.evidence} color="#f59e0b" />
          <GradeBar grade="E1" count={metrics.e1Evidence} total={metrics.evidence} color="#f97316" />
          <GradeBar grade="E0" count={metrics.e0Evidence} total={metrics.evidence} color="#ef4444" />
        </div>
      </div>
    </div>
  );
}

// Sub-components
function MetricCard({
  title,
  value,
  subtitle,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  color: string;
}) {
  return (
    <div
      style={{
        padding: '16px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
      }}
    >
      <div
        style={{
          fontSize: '12px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          color: 'rgba(255, 255, 255, 0.5)',
          marginBottom: '8px',
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: '28px',
          fontWeight: 700,
          color,
          marginBottom: '4px',
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)' }}>
        {subtitle}
      </div>
    </div>
  );
}

function DistributionBar({
  value,
  total,
  color,
  label,
}: {
  value: number;
  total: number;
  color: string;
  label: string;
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return (
    <div
      style={{
        width: `${percentage}%`,
        background: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '10px',
        fontWeight: 600,
        color: '#fff',
        minWidth: percentage > 10 ? 'auto' : '0',
      }}
      title={`${label}: ${value} (${percentage.toFixed(1)}%)`}
    >
      {percentage > 15 && value}
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div
        style={{
          width: '12px',
          height: '12px',
          borderRadius: '3px',
          background: color,
        }}
      />
      <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>{label}</span>
    </div>
  );
}

function GradeBar({
  grade,
  count,
  total,
  color,
}: {
  grade: string;
  count: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div
        style={{
          width: '28px',
          fontSize: '12px',
          fontWeight: 600,
          color: 'rgba(255, 255, 255, 0.6)',
        }}
      >
        {grade}
      </div>
      <div
        style={{
          flex: 1,
          height: '20px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            background: color,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      <div
        style={{
          width: '40px',
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.5)',
          textAlign: 'right',
        }}
      >
        {count}
      </div>
    </div>
  );
}

export default ResearchQualityScoreDashboard;
