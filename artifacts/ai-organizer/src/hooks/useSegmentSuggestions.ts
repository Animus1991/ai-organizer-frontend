/**
 * Smart Segment Suggestions
 * 
 * Provides AI-powered suggestions for:
 * - Auto-detect segment type from content
 * - Suggest evidence links for claims
 * - Suggest counterarguments
 * - Complete falsifiability criteria templates
 */

import { useMemo } from 'react';
import { SegmentDTO } from '../lib/api';

export interface SegmentSuggestion {
  type: 'segment-type' | 'evidence-link' | 'counterargument' | 'falsifiability' | 'improvement';
  message: string;
  confidence: number;
  action?: string;
  data?: Record<string, unknown>;
}

export interface UseSegmentSuggestionsOptions {
  content: string;
  title: string;
  currentType?: string | null;
  documentSegments?: SegmentDTO[];
}

export function useSegmentSuggestions({
  content,
  title,
  currentType,
  documentSegments = [],
}: UseSegmentSuggestionsOptions): SegmentSuggestion[] {
  return useMemo(() => {
    const suggestions: SegmentSuggestion[] = [];
    const lowerContent = content.toLowerCase();
    const lowerTitle = title.toLowerCase();

    // 1. Auto-detect segment type
    if (!currentType || currentType === 'general') {
      // Claim detection
      if (
        lowerContent.includes('we claim') ||
        lowerContent.includes('we argue') ||
        lowerContent.includes('we assert') ||
        lowerContent.includes('it follows that') ||
        lowerContent.includes('therefore') ||
        lowerContent.includes('thus') ||
        lowerContent.includes('conclude that') ||
        lowerTitle.includes('claim') ||
        lowerTitle.includes('argument')
      ) {
        suggestions.push({
          type: 'segment-type',
          message: 'This appears to be a Claim. Would you like to set the type to "claim"?',
          confidence: 0.85,
          action: 'set-type-claim',
          data: { suggestedType: 'claim' },
        });
      }

      // Evidence detection
      if (
        lowerContent.includes('study found') ||
        lowerContent.includes('research shows') ||
        lowerContent.includes('data indicates') ||
        lowerContent.includes('according to') ||
        lowerContent.includes('et al.') ||
        lowerContent.includes('survey') ||
        lowerContent.includes('experiment') ||
        lowerTitle.includes('evidence') ||
        lowerTitle.includes('study')
      ) {
        suggestions.push({
          type: 'segment-type',
          message: 'This appears to be Evidence. Would you like to set the type to "evidence"?',
          confidence: 0.8,
          action: 'set-type-evidence',
          data: { suggestedType: 'evidence' },
        });
      }

      // Prediction detection
      if (
        lowerContent.includes('we predict') ||
        lowerContent.includes('we hypothesize') ||
        lowerContent.includes('we expect') ||
        lowerContent.includes('will result in') ||
        lowerContent.includes('should lead to') ||
        lowerContent.includes('if...then') ||
        lowerTitle.includes('prediction') ||
        lowerTitle.includes('hypothesis')
      ) {
        suggestions.push({
          type: 'segment-type',
          message: 'This appears to be a Prediction. Would you like to set the type to "prediction"?',
          confidence: 0.82,
          action: 'set-type-prediction',
          data: { suggestedType: 'prediction' },
        });
      }

      // Definition detection
      if (
        lowerContent.includes('is defined as') ||
        lowerContent.includes('refers to') ||
        lowerContent.includes('means') ||
        lowerContent.includes('concept of') ||
        lowerTitle.includes('definition') ||
        lowerTitle.includes('what is')
      ) {
        suggestions.push({
          type: 'segment-type',
          message: 'This appears to be a Definition. Would you like to set the type to "definition"?',
          confidence: 0.78,
          action: 'set-type-definition',
          data: { suggestedType: 'definition' },
        });
      }
    }

    // 2. Suggest evidence links for claims
    if (currentType === 'claim') {
      const evidenceSegments = documentSegments.filter(
        s => s.segmentType === 'evidence' && s.id
      );

      if (evidenceSegments.length > 0) {
        // Find evidence that might be related (simple keyword matching)
        const relatedEvidence = evidenceSegments.filter(evidence => {
          const evidenceText = (evidence.title + ' ' + evidence.content).toLowerCase();
          const contentWords = lowerContent.split(/\s+/).filter(w => w.length > 4);
          return contentWords.some(word => evidenceText.includes(word));
        });

        if (relatedEvidence.length > 0) {
          suggestions.push({
            type: 'evidence-link',
            message: `Found ${relatedEvidence.length} evidence segment(s) that might support this claim. Link them?`,
            confidence: 0.7,
            action: 'suggest-evidence-links',
            data: { evidenceIds: relatedEvidence.map(e => e.id) },
          });
        } else if (evidenceSegments.length > 0) {
          suggestions.push({
            type: 'evidence-link',
            message: 'This claim has no linked evidence. Consider adding evidence support.',
            confidence: 0.9,
            action: 'missing-evidence',
          });
        }
      }
    }

    // 3. Suggest falsifiability criteria for predictions
    if (currentType === 'prediction' && content.length > 20) {
      const hasFalsifiability =
        lowerContent.includes('falsified if') ||
        lowerContent.includes('testable by') ||
        lowerContent.includes('measurable') ||
        lowerContent.includes('operationalized');

      if (!hasFalsifiability) {
        suggestions.push({
          type: 'falsifiability',
          message: 'This prediction lacks falsifiability criteria. Add test conditions?',
          confidence: 0.88,
          action: 'add-falsifiability',
          data: {
            templates: [
              'This prediction is falsified if: [specific condition]',
              'Testable by: [method/measurement]',
              'Success criteria: [quantifiable outcome]',
            ],
          },
        });
      }
    }

    // 4. Suggest improvements
    if (content.length < 50) {
      suggestions.push({
        type: 'improvement',
        message: 'This segment is quite short. Consider expanding with more detail.',
        confidence: 0.6,
        action: 'expand-content',
      });
    }

    if (content.length > 1000 && !content.includes('\n')) {
      suggestions.push({
        type: 'improvement',
        message: 'Long paragraph detected. Consider breaking into smaller segments for better organization.',
        confidence: 0.65,
        action: 'split-segment',
      });
    }

    // Sort by confidence
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }, [content, title, currentType, documentSegments]);
}

/**
 * Get color for suggestion type
 */
export function getSuggestionTypeColor(type: SegmentSuggestion['type']): string {
  switch (type) {
    case 'segment-type':
      return '#6366f1'; // Indigo
    case 'evidence-link':
      return '#10b981'; // Green
    case 'counterargument':
      return '#f59e0b'; // Amber
    case 'falsifiability':
      return '#8b5cf6'; // Purple
    case 'improvement':
      return '#6b7280'; // Gray
    default:
      return '#6b7280';
  }
}

/**
 * Get icon for suggestion type
 */
export function getSuggestionTypeIcon(type: SegmentSuggestion['type']): string {
  switch (type) {
    case 'segment-type':
      return '🏷️';
    case 'evidence-link':
      return '🔗';
    case 'counterargument':
      return '⚔️';
    case 'falsifiability':
      return '🔬';
    case 'improvement':
      return '💡';
    default:
      return '💡';
  }
}

export default useSegmentSuggestions;
