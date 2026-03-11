/**
 * AutoSummarizer - Automatic text summarization component
 * 
 * Provides AI-powered summarization of documents, segments, or selected text.
 * Features multiple summary modes and customizable length.
 */

import React, { useState, useCallback } from 'react';
import { useAIContext } from '../../context/AIContext';

type SummaryMode = 'concise' | 'detailed' | 'bullet-points' | 'key-points';

interface SummaryResult {
  text: string;
  originalLength: number;
  summaryLength: number;
  compressionRatio: number;
}

interface AutoSummarizerProps {
  content?: string;
  onSummaryGenerated?: (summary: SummaryResult) => void;
  className?: string;
}

export function AutoSummarizer({ 
  content: propContent, 
  onSummaryGenerated,
  className = '' 
}: AutoSummarizerProps) {
  const { currentDocument, currentSegment, selectedText, getContextSummary } = useAIContext();
  
  const [mode, setMode] = useState<SummaryMode>('concise');
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<SummaryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get content to summarize
  const getSourceContent = useCallback(() => {
    if (propContent) return propContent;
    if (selectedText) return selectedText;
    if (currentSegment?.content) return currentSegment.content;
    if (currentDocument?.title) return `Document: ${currentDocument.title}`;
    return '';
  }, [propContent, selectedText, currentSegment, currentDocument]);

  const generateSummary = useCallback(async () => {
    const sourceContent = getSourceContent();
    
    if (!sourceContent || sourceContent.length < 50) {
      setError('Please provide at least 50 characters of text to summarize.');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const originalLength = sourceContent.length;
      let summaryText = '';
      
      // Generate summary based on mode
      switch (mode) {
        case 'concise':
          summaryText = generateConciseSummary(sourceContent);
          break;
        case 'detailed':
          summaryText = generateDetailedSummary(sourceContent);
          break;
        case 'bullet-points':
          summaryText = generateBulletPoints(sourceContent);
          break;
        case 'key-points':
          summaryText = generateKeyPoints(sourceContent);
          break;
      }
      
      const result: SummaryResult = {
        text: summaryText,
        originalLength,
        summaryLength: summaryText.length,
        compressionRatio: Math.round((summaryText.length / originalLength) * 100),
      };
      
      setSummary(result);
      onSummaryGenerated?.(result);
    } catch (err) {
      setError('Failed to generate summary. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [getSourceContent, mode, onSummaryGenerated]);

  // Simple summary generation algorithms (placeholder for actual AI)
  const generateConciseSummary = (text: string): string => {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const firstFew = sentences.slice(0, Math.min(3, sentences.length));
    return firstFew.join('. ') + '.';
  };

  const generateDetailedSummary = (text: string): string => {
    const paragraphs = text.split('\n').filter(p => p.trim().length > 0);
    const summary = paragraphs.slice(0, Math.min(2, paragraphs.length)).join('\n\n');
    return summary;
  };

  const generateBulletPoints = (text: string): string => {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const keySentences = sentences.filter(s => 
      s.includes('important') || 
      s.includes('key') || 
      s.includes('main') ||
      s.includes('significant') ||
      s.includes('conclusion') ||
      sentences.indexOf(s) === 0
    ).slice(0, 5);
    
    return keySentences.map(s => `• ${s.trim()}`).join('\n');
  };

  const generateKeyPoints = (text: string): string => {
    const words = text.split(/\s+/);
    const wordFreq: Record<string, number> = {};
    
    words.forEach(word => {
      const clean = word.toLowerCase().replace(/[^a-z]/g, '');
      if (clean.length > 4) {
        wordFreq[clean] = (wordFreq[clean] || 0) + 1;
      }
    });
    
    const topWords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
    
    return `Key themes: ${topWords.join(', ')}\n\nMain content overview with focus on: ${topWords[0] || 'general topics'}`;
  };

  const copyToClipboard = useCallback(() => {
    if (summary) {
      navigator.clipboard.writeText(summary.text);
    }
  }, [summary]);

  const sourceContent = getSourceContent();
  const hasContent = sourceContent && sourceContent.length >= 50;

  return (
    <div
      className={className}
      style={{
        background: 'linear-gradient(135deg, rgba(20, 20, 30, 0.95) 0%, rgba(15, 15, 25, 0.95) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      }}
    >
      <h3 style={{ 
        fontSize: '18px', 
        fontWeight: 600, 
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: '16px'
      }}>
        AI Summarization
      </h3>
      
      {/* Source info */}
      <div style={{ 
        marginBottom: '16px',
        padding: '12px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '8px',
        fontSize: '13px',
        color: 'rgba(255, 255, 255, 0.6)'
      }}>
        {selectedText ? (
          <span>Source: Selected text ({sourceContent.length} chars)</span>
        ) : currentSegment ? (
          <span>Source: {currentSegment.title || 'Current Segment'} ({sourceContent.length} chars)</span>
        ) : currentDocument ? (
          <span>Source: {currentDocument.title || 'Current Document'}</span>
        ) : propContent ? (
          <span>Source: Provided content ({sourceContent.length} chars)</span>
        ) : (
          <span style={{ color: 'rgba(239, 68, 68, 0.8)' }}>
            No content available. Please select text or open a document.
          </span>
        )}
      </div>

      {/* Mode selector */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ 
          display: 'block', 
          fontSize: '12px', 
          fontWeight: 600,
          color: 'rgba(255, 255, 255, 0.7)',
          marginBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Summary Mode
        </label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {(['concise', 'detailed', 'bullet-points', 'key-points'] as SummaryMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: mode === m ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                color: mode === m ? '#fff' : 'rgba(255, 255, 255, 0.7)',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {m.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={generateSummary}
        disabled={!hasContent || isLoading}
        style={{
          width: '100%',
          padding: '12px 24px',
          borderRadius: '8px',
          border: 'none',
          background: hasContent ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : 'rgba(255, 255, 255, 0.1)',
          color: '#fff',
          fontSize: '14px',
          fontWeight: 600,
          cursor: hasContent ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s ease',
          marginBottom: '16px',
        }}
      >
        {isLoading ? (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span style={{ 
              width: '16px', 
              height: '16px', 
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderTopColor: '#fff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            Generating Summary...
          </span>
        ) : (
          'Generate Summary'
        )}
      </button>

      {/* Error message */}
      {error && (
        <div style={{
          padding: '12px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          color: 'rgba(239, 68, 68, 0.9)',
          fontSize: '13px',
          marginBottom: '16px',
        }}>
          {error}
        </div>
      )}

      {/* Summary result */}
      {summary && (
        <div style={{
          padding: '16px',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '8px',
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <span style={{ 
              fontSize: '12px', 
              fontWeight: 600,
              color: 'rgba(16, 185, 129, 0.9)',
              textTransform: 'uppercase'
            }}>
              Summary ({summary.compressionRatio}% of original)
            </span>
            <button
              onClick={copyToClipboard}
              style={{
                padding: '6px 12px',
                background: 'rgba(16, 185, 129, 0.2)',
                border: 'none',
                borderRadius: '6px',
                color: 'rgba(16, 185, 129, 0.9)',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Copy
            </button>
          </div>
          
          <div style={{
            fontSize: '14px',
            lineHeight: '1.6',
            color: 'rgba(255, 255, 255, 0.9)',
            whiteSpace: 'pre-wrap',
          }}>
            {summary.text}
          </div>
          
          <div style={{
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid rgba(16, 185, 129, 0.2)',
            fontSize: '11px',
            color: 'rgba(255, 255, 255, 0.5)',
            display: 'flex',
            gap: '16px'
          }}>
            <span>Original: {summary.originalLength.toLocaleString()} chars</span>
            <span>Summary: {summary.summaryLength.toLocaleString()} chars</span>
            <span>Compressed: {100 - summary.compressionRatio}%</span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default AutoSummarizer;
