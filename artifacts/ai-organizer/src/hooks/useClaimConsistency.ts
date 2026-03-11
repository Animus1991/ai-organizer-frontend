/**
 * Claim Consistency Checker
 * 
 * Validates claims for:
 * - Evidence support (E1-E4 grades)
 * - Falsifiability criteria
 * - Logical consistency
 * - Link completeness
 */

import { useMemo } from 'react';
import { SegmentDTO, SegmentLinkDTO } from '../lib/api';

export interface ConsistencyIssue {
  type: 'missing-evidence' | 'weak-evidence' | 'no-falsifiability' | 'orphaned-claim' | 'circular-reference';
  severity: 'error' | 'warning' | 'info';
  message: string;
  segmentId: number;
  segmentTitle?: string;
  suggestion?: string;
}

export interface ConsistencyCheckResult {
  issues: ConsistencyIssue[];
  summary: {
    totalIssues: number;
    errors: number;
    warnings: number;
    info: number;
  };
  isValid: boolean;
}

export interface UseClaimConsistencyOptions {
  segments: SegmentDTO[];
  links: SegmentLinkDTO[];
}

export function useClaimConsistency({
  segments,
  links,
}: UseClaimConsistencyOptions): ConsistencyCheckResult {
  return useMemo(() => {
    const issues: ConsistencyIssue[] = [];

    const claims = segments.filter(s => s.segmentType === 'claim');
    const evidence = segments.filter(s => s.segmentType === 'evidence');
    const predictions = segments.filter(s => s.segmentType === 'prediction');

    // Build link map for quick lookup
    const linksByTarget = new Map<number, SegmentLinkDTO[]>();
    const linksBySource = new Map<number, SegmentLinkDTO[]>();

    links.forEach(link => {
      const targets = linksByTarget.get(link.toSegmentId) || [];
      targets.push(link);
      linksByTarget.set(link.toSegmentId, targets);

      const sources = linksBySource.get(link.fromSegmentId) || [];
      sources.push(link);
      linksBySource.set(link.fromSegmentId, sources);
    });

    // 1. Check claims for evidence support
    claims.forEach(claim => {
      const supportingLinks = linksByTarget.get(claim.id) || [];
      const supportingEvidence = supportingLinks.filter(link => {
        const sourceSegment = segments.find(s => s.id === link.fromSegmentId);
        return sourceSegment?.segmentType === 'evidence';
      });

      if (supportingEvidence.length === 0) {
        issues.push({
          type: 'missing-evidence',
          severity: 'error',
          message: `Claim "${claim.title || 'Untitled'}" has no supporting evidence`,
          segmentId: claim.id,
          segmentTitle: claim.title,
          suggestion: 'Add evidence segments and link them to this claim',
        });
      } else {
        // Check evidence grades
        const evidenceGrades = supportingEvidence.map(link => {
          const sourceSegment = segments.find(s => s.id === link.fromSegmentId);
          return sourceSegment?.evidenceGrade;
        }).filter(Boolean);

        const hasWeakEvidence = evidenceGrades.every(grade => grade === 'E0' || grade === 'E1');
        if (hasWeakEvidence && evidenceGrades.length > 0) {
          issues.push({
            type: 'weak-evidence',
            severity: 'warning',
            message: `Claim "${claim.title || 'Untitled'}" only has weak evidence (E0/E1)`,
            segmentId: claim.id,
            segmentTitle: claim.title,
            suggestion: 'Consider finding stronger evidence (E2-E4) to support this claim',
          });
        }
      }
    });

    // 2. Check predictions for falsifiability
    predictions.forEach(prediction => {
      const content = (prediction.content || '').toLowerCase();
      const hasFalsifiability =
        content.includes('falsified if') ||
        content.includes('testable by') ||
        content.includes('measurable') ||
        content.includes('operationalized') ||
        content.includes('success criteria') ||
        content.includes('failure condition');

      if (!hasFalsifiability) {
        issues.push({
          type: 'no-falsifiability',
          severity: 'warning',
          message: `Prediction "${prediction.title || 'Untitled'}" lacks falsifiability criteria`,
          segmentId: prediction.id,
          segmentTitle: prediction.title,
          suggestion: 'Add specific conditions that would falsify this prediction',
        });
      }
    });

    // 3. Check for orphaned evidence (evidence not linked to any claim)
    evidence.forEach(ev => {
      const outgoingLinks = linksBySource.get(ev.id) || [];
      const linkedToClaims = outgoingLinks.filter(link => {
        const targetSegment = segments.find(s => s.id === link.toSegmentId);
        return targetSegment?.segmentType === 'claim';
      });

      if (linkedToClaims.length === 0) {
        issues.push({
          type: 'orphaned-claim',
          severity: 'info',
          message: `Evidence "${ev.title || 'Untitled'}" is not linked to any claim`,
          segmentId: ev.id,
          segmentTitle: ev.title,
          suggestion: 'Link this evidence to relevant claims to strengthen your argument',
        });
      }
    });

    // 4. Check for circular references
    function hasCircularReference(
      segmentId: number,
      visited: Set<number> = new Set()
    ): boolean {
      if (visited.has(segmentId)) {
        return true;
      }
      visited.add(segmentId);

      const outgoingLinks = linksBySource.get(segmentId) || [];
      for (const link of outgoingLinks) {
        if (hasCircularReference(link.toSegmentId, new Set(visited))) {
          return true;
        }
      }
      return false;
    }

    segments.forEach(segment => {
      if (hasCircularReference(segment.id)) {
        // Find which segment is part of the circle
        issues.push({
          type: 'circular-reference',
          severity: 'error',
          message: `Circular reference detected involving "${segment.title || 'Untitled'}"`,
          segmentId: segment.id,
          segmentTitle: segment.title,
          suggestion: 'Remove one of the links to break the circular dependency',
        });
      }
    });

    // Calculate summary
    const errors = issues.filter(i => i.severity === 'error').length;
    const warnings = issues.filter(i => i.severity === 'warning').length;
    const info = issues.filter(i => i.severity === 'info').length;

    return {
      issues,
      summary: {
        totalIssues: issues.length,
        errors,
        warnings,
        info,
      },
      isValid: errors === 0,
    };
  }, [segments, links]);
}

/**
 * Get icon for issue type
 */
export function getIssueTypeIcon(type: ConsistencyIssue['type']): string {
  switch (type) {
    case 'missing-evidence':
      return '❌';
    case 'weak-evidence':
      return '⚠️';
    case 'no-falsifiability':
      return '🔬';
    case 'orphaned-claim':
      return '📎';
    case 'circular-reference':
      return '🔄';
    default:
      return '⚠️';
  }
}

/**
 * Get color for severity
 */
export function getSeverityColor(severity: ConsistencyIssue['severity']): string {
  switch (severity) {
    case 'error':
      return '#ef4444';
    case 'warning':
      return '#f59e0b';
    case 'info':
      return '#3b82f6';
    default:
      return '#6b7280';
  }
}

export default useClaimConsistency;
