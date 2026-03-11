/**
 * useAIClaimDetection - AI-assisted claim detection from text
 * 
 * Auto-detects claims from document text using pattern matching
 * and heuristics. Can be enhanced with actual AI API calls.
 */

import { useState, useCallback, useRef } from 'react';

export type ClaimType = 'factual' | 'opinion' | 'hypothesis' | 'methodological' | 'definition' | 'axiom' | 'derivation' | 'prediction' | 'open_question' | 'counterargument' | 'evidence';

export interface DetectedClaim {
  id: string;
  text: string;
  type: 'factual' | 'opinion' | 'hypothesis' | 'methodological';
  confidence: number; // 0-1
  position: {
    start: number;
    end: number;
  };
  context: string; // surrounding text
  suggestedLabel?: string;
}

export interface ClaimDetectionOptions {
  minConfidence?: number;
  maxClaims?: number;
  includeContext?: boolean;
  contextWindow?: number; // characters before/after
}

const DEFAULT_OPTIONS: Required<ClaimDetectionOptions> = {
  minConfidence: 0.6,
  maxClaims: 50,
  includeContext: true,
  contextWindow: 100,
};

// Patterns that indicate claims
const CLAIM_PATTERNS = [
  // Factual claims
  { pattern: /\b(stud(y|ies)|research|data|evidence|finding(s)?)\s+(suggest|show|indicate|demonstrate|reveal|confirm|support|prove)\s+that\b/gi, type: 'factual' as const, confidence: 0.9 },
  { pattern: /\b(it\s+is\s+(known|established|documented|proven|shown))\b/gi, type: 'factual' as const, confidence: 0.85 },
  { pattern: /\b(results?\s+(demonstrate|indicate|show|suggest|confirm))\b/gi, type: 'factual' as const, confidence: 0.88 },
  { pattern: /\b(the\s+data\s+(shows?|indicates?|reveals?|demonstrates?))\b/gi, type: 'factual' as const, confidence: 0.87 },
  { pattern: /\b(analysis\s+(reveals?|shows?|demonstrates?|confirms?))\b/gi, type: 'factual' as const, confidence: 0.86 },
  
  // Hypotheses
  { pattern: /\b(we\s+hypothesize|it\s+is\s+hypothesized|our\s+hypothesis|we\s+predict)\b/gi, type: 'hypothesis' as const, confidence: 0.92 },
  { pattern: /\b(it\s+is\s+possible\s+that|may\s+(suggest|indicate)|might\s+be)\b/gi, type: 'hypothesis' as const, confidence: 0.75 },
  { pattern: /\b(we\s+expect|it\s+is\s+expected|anticipated)\b/gi, type: 'hypothesis' as const, confidence: 0.78 },
  
  // Methodological claims
  { pattern: /\b(we\s+(used|employed|adopted|implemented|developed)|the\s+method|our\s+approach)\b/gi, type: 'methodological' as const, confidence: 0.8 },
  { pattern: /\b(participants\s+were|subjects\s+were|sample\s+(was|were)|methodology)\b/gi, type: 'methodological' as const, confidence: 0.82 },
  { pattern: /\b(statistical\s+analysis|measured|assessed|evaluated)\s+using\b/gi, type: 'methodological' as const, confidence: 0.84 },
  
  // Opinion/Argument claims
  { pattern: /\b(we\s+argue|we\s+contend|we\s+maintain|our\s+position)\b/gi, type: 'opinion' as const, confidence: 0.85 },
  { pattern: /\b(it\s+is\s+(important|crucial|essential|necessary)\s+to)\b/gi, type: 'opinion' as const, confidence: 0.7 },
  { pattern: /\b(should|must|ought\s+to)\s+be\b/gi, type: 'opinion' as const, confidence: 0.65 },
];

function extractSentence(text: string, position: number): string {
  const before = text.slice(0, position);
  const after = text.slice(position);
  
  // Find start of sentence
  let start = before.lastIndexOf('. ');
  if (start === -1) start = before.lastIndexOf('! ');
  if (start === -1) start = before.lastIndexOf('? ');
  start = start === -1 ? 0 : start + 2;
  
  // Find end of sentence
  const endMatch = after.match(/[.!?]+/);
  const end = endMatch ? position + endMatch.index! + endMatch[0].length : text.length;
  
  return text.slice(start, end).trim();
}

function getContext(text: string, position: number, windowSize: number): string {
  const start = Math.max(0, position - windowSize);
  const end = Math.min(text.length, position + windowSize);
  return text.slice(start, end).trim();
}

function generateId(): string {
  return `claim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function useAIClaimDetection() {
  const [isDetecting, setIsDetecting] = useState(false);
  const [progress, setProgress] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const detectClaims = useCallback(async (
    text: string,
    options: ClaimDetectionOptions = {}
  ): Promise<DetectedClaim[]> => {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    
    setIsDetecting(true);
    setProgress(0);
    
    // Create new abort controller for this detection
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;
    
    try {
      const claims: DetectedClaim[] = [];
      const foundPositions = new Set<number>(); // Avoid duplicates
      
      // Process each pattern
      const totalPatterns = CLAIM_PATTERNS.length;
      
      for (let i = 0; i < CLAIM_PATTERNS.length; i++) {
        if (signal.aborted) {
          throw new Error('Detection aborted');
        }
        
        const { pattern, type, confidence: baseConfidence } = CLAIM_PATTERNS[i];
        
        // Reset lastIndex for global regex
        pattern.lastIndex = 0;
        
        let match;
        while ((match = pattern.exec(text)) !== null) {
          if (signal.aborted) break;
          
          const position = match.index;
          
          // Skip if too close to existing claim (within 50 chars)
          const isDuplicate = Array.from(foundPositions).some(
            pos => Math.abs(pos - position) < 50
          );
          
          if (isDuplicate) continue;
          
          foundPositions.add(position);
          
          // Extract the full sentence containing this claim
          const sentence = extractSentence(text, position);
          
          // Calculate adjusted confidence based on sentence structure
          let adjustedConfidence = baseConfidence;
          
          // Boost confidence for sentences with citations
          if (/\(\d{4}\)|et\s+al\.?|\[\d+\]/.test(sentence)) {
            adjustedConfidence = Math.min(1, adjustedConfidence + 0.1);
          }
          
          // Reduce confidence for very short sentences
          if (sentence.length < 30) {
            adjustedConfidence *= 0.9;
          }
          
          // Skip if below minimum confidence
          if (adjustedConfidence < opts.minConfidence) continue;
          
          const claim: DetectedClaim = {
            id: generateId(),
            text: sentence,
            type,
            confidence: Math.round(adjustedConfidence * 100) / 100,
            position: {
              start: position,
              end: position + match[0].length,
            },
            context: opts.includeContext 
              ? getContext(text, position, opts.contextWindow)
              : '',
            suggestedLabel: generateSuggestedLabel(sentence, type),
          };
          
          claims.push(claim);
          
          // Respect max claims limit
          if (claims.length >= opts.maxClaims) break;
        }
        
        // Update progress
        setProgress(Math.round(((i + 1) / totalPatterns) * 100));
      }
      
      // Sort by confidence (highest first)
      claims.sort((a, b) => b.confidence - a.confidence);
      
      setProgress(100);
      return claims;
      
    } finally {
      setIsDetecting(false);
    }
  }, []);

  const abortDetection = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const detectClaimsFromSelection = useCallback(async (
    selectedText: string,
    _fullText: string,
    selectionStart: number,
    options?: ClaimDetectionOptions
  ): Promise<DetectedClaim[]> => {
    // First detect in selection
    const selectionClaims = await detectClaims(selectedText, options);
    
    // Adjust positions to be relative to full text
    return selectionClaims.map(claim => ({
      ...claim,
      position: {
        start: claim.position.start + selectionStart,
        end: claim.position.end + selectionStart,
      },
    }));
  }, [detectClaims]);

  return {
    detectClaims,
    detectClaimsFromSelection,
    abortDetection,
    isDetecting,
    progress,
  };
}

function generateSuggestedLabel(sentence: string, type: DetectedClaim['type']): string {
  // Extract key terms for suggested label
  const words = sentence
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3 && !STOP_WORDS.has(w));
  
  const keyTerms = words.slice(0, 3).join(' ');
  
  const typePrefix = {
    factual: 'Evidence',
    hypothesis: 'Hypothesis',
    methodological: 'Method',
    opinion: 'Argument',
  };
  
  return keyTerms ? `${typePrefix[type]}: ${keyTerms}` : typePrefix[type];
}

// Common stop words to exclude from labels
const STOP_WORDS = new Set([
  'about', 'above', 'across', 'after', 'against', 'along', 'among', 'around',
  'because', 'before', 'behind', 'below', 'beneath', 'beside', 'between',
  'during', 'except', 'inside', 'instead', 'into', 'near', 'off', 'onto',
  'outside', 'over', 'through', 'throughout', 'toward', 'under', 'until',
  'upon', 'within', 'without', 'according', 'although', 'though', 'unless',
  'whether', 'while', 'this', 'that', 'these', 'those', 'they', 'them',
  'their', 'there', 'then', 'than', 'when', 'where', 'which', 'while',
  'who', 'whom', 'whose', 'why', 'how', 'what', 'with', 'have', 'been',
  'being', 'have', 'has', 'had', 'does', 'did', 'doing', 'would', 'could',
  'should', 'may', 'might', 'must', 'shall', 'will', 'study', 'research',
  'paper', 'article', 'analysis', 'results', 'findings', 'data', 'method',
  'approach', 'using', 'used', 'based', 'shown', 'found', 'suggested',
]);

// Helper functions for claim type styling
export function getClaimTypeColor(type: ClaimType | string): string {
  const colors: Record<string, string> = {
    factual: '#10b981', opinion: '#3b82f6', hypothesis: '#f59e0b',
    methodological: '#8b5cf6', definition: '#06b6d4', axiom: '#14b8a6',
    derivation: '#a855f7', prediction: '#f97316', open_question: '#eab308',
    counterargument: '#ef4444', evidence: '#22c55e',
  };
  return colors[type] || '#6b7280';
}

export function getClaimTypeLabel(type: ClaimType | string): string {
  const labels: Record<string, string> = {
    factual: 'Factual Claim', opinion: 'Opinion', hypothesis: 'Hypothesis',
    methodological: 'Methodological', definition: 'Definition', axiom: 'Axiom',
    derivation: 'Derivation', prediction: 'Prediction', open_question: 'Open Question',
    counterargument: 'Counterargument', evidence: 'Evidence',
  };
  return labels[type] || type.charAt(0).toUpperCase() + type.slice(1);
}

export type PropositionLevel = 'strong' | 'moderate' | 'weak' | 'unsupported' | 'philosophical' | 'physical' | 'psychological' | 'economic' | 'methodological_level' | 'informational' | 'unclassified';

export function getPropositionLevelLabel(level: PropositionLevel): string {
  const labels: Record<string, string> = {
    strong: 'Strong',
    moderate: 'Moderate', 
    weak: 'Weak',
    unsupported: 'Unsupported',
    philosophical: 'Philosophical',
    physical: 'Physical',
    psychological: 'Psychological',
    economic: 'Economic',
    methodological_level: 'Methodological',
    informational: 'Informational',
    unclassified: 'Unclassified',
  };
  return labels[level] || 'Unknown';
}

export function getPropositionLevelColor(level: PropositionLevel): string {
  const colors: Record<string, string> = {
    strong: '#10b981',      // green
    moderate: '#f59e0b',     // amber
    weak: '#ef4444',         // red
    unsupported: '#6b7280',  // gray
    philosophical: '#8b5cf6', // violet
    physical: '#06b6d4',     // cyan
    psychological: '#ec4899', // pink
    economic: '#f59e0b',     // amber
    methodological_level: '#6366f1', // indigo
    informational: '#14b8a6', // teal
    unclassified: '#6b7280', // gray
  };
  return colors[level] || '#6b7280';
}

export default useAIClaimDetection;
