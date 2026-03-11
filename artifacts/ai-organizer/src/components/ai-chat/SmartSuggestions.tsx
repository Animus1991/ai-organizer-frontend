/**
 * SmartSuggestions - AI-powered writing suggestions
 * 
 * Provides context-aware suggestions during writing based on:
 * - Current document content
 * - User's writing style
 * - Common patterns
 * - Selected text
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useAIContext } from '../../context/AIContext';

interface Suggestion {
  id: string;
  type: 'completion' | 'correction' | 'enhancement' | 'reference';
  text: string;
  confidence: number;
  context?: string;
}

interface SmartSuggestionsProps {
  content: string;
  cursorPosition: number;
  onSuggestionSelect: (suggestion: string) => void;
  className?: string;
}

export function SmartSuggestions({ 
  content, 
  cursorPosition, 
  onSuggestionSelect,
  className = '' 
}: SmartSuggestionsProps) {
  const { currentDocument, currentSegment, selectedText, userIntent } = useAIContext();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Generate suggestions based on context
  const generateSuggestions = useCallback(async () => {
    if (!content || cursorPosition === 0) return;

    setIsLoading(true);
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const newSuggestions: Suggestion[] = [];
    const textBeforeCursor = content.slice(0, cursorPosition);
    const textAfterCursor = content.slice(cursorPosition);
    const lastWord = textBeforeCursor.split(/\s+/).pop() || '';
    
    // Context-aware suggestions based on user intent
    switch (userIntent) {
      case 'question':
        newSuggestions.push(
          {
            id: 'q1',
            type: 'enhancement',
            text: 'Would you like me to rephrase this as a research question?',
            confidence: 0.9,
            context: 'question_rephrase'
          },
          {
            id: 'q2',
            type: 'reference',
            text: 'I can help you find related research on this topic.',
            confidence: 0.85,
            context: 'find_references'
          }
        );
        break;
        
      case 'summarize':
        newSuggestions.push(
          {
            id: 's1',
            type: 'enhancement',
            text: 'Generate a concise summary of this text',
            confidence: 0.95,
            context: 'auto_summarize'
          },
          {
            id: 's2',
            type: 'enhancement',
            text: 'Extract key points from this content',
            confidence: 0.88,
            context: 'extract_key_points'
          }
        );
        break;
        
      default:
        // Default suggestions based on content analysis
        if (lastWord.length > 3) {
          // Word completion suggestions
          const completions = [
            { text: lastWord + ' analysis', confidence: 0.75 },
            { text: lastWord + ' methodology', confidence: 0.70 },
            { text: lastWord + ' results', confidence: 0.65 },
          ];
          
          completions.forEach((comp, index) => {
            newSuggestions.push({
              id: `comp-${index}`,
              type: 'completion',
              text: comp.text,
              confidence: comp.confidence,
              context: 'word_completion'
            });
          });
        }
        
        // Add sentence completions if at end of sentence
        if (textBeforeCursor.trim().endsWith('.')) {
          newSuggestions.push(
            {
              id: 'sent1',
              type: 'completion',
              text: 'This suggests that ',
              confidence: 0.80,
              context: 'sentence_completion'
            },
            {
              id: 'sent2',
              type: 'completion',
              text: 'Furthermore, ',
              confidence: 0.75,
              context: 'sentence_completion'
            },
            {
              id: 'sent3',
              type: 'completion',
              text: 'However, ',
              confidence: 0.70,
              context: 'sentence_completion'
            }
          );
        }
        
        // Check for common corrections
        const commonMistakes = [
          { pattern: /teh\s/gi, correction: 'the' },
          { pattern: /dont\s/gi, correction: "don't" },
          { pattern: /cant\s/gi, correction: "can't" },
          { pattern: /wont\s/gi, correction: "won't" },
        ];
        
        commonMistakes.forEach((mistake, index) => {
          if (mistake.pattern.test(content)) {
            newSuggestions.push({
              id: `corr-${index}`,
              type: 'correction',
              text: `Correct "${mistake.pattern.source.replace('\\s', '')}" to "${mistake.correction}"`,
              confidence: 0.95,
              context: 'spelling_correction'
            });
          }
        });
    }
    
    // Add document-specific suggestions
    if (currentDocument) {
      newSuggestions.push({
        id: 'doc1',
        type: 'reference',
        text: `Reference document: "${currentDocument.title || 'Current Document'}"`,
        confidence: 0.90,
        context: 'document_reference'
      });
    }
    
    if (currentSegment) {
      newSuggestions.push({
        id: 'seg1',
        type: 'reference',
        text: `Link to segment: "${currentSegment.title || 'Current Segment'}"`,
        confidence: 0.85,
        context: 'segment_reference'
      });
    }
    
    // Sort by confidence and take top 5
    const topSuggestions = newSuggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);
    
    setSuggestions(topSuggestions);
    setShowSuggestions(topSuggestions.length > 0);
    setIsLoading(false);
  }, [content, cursorPosition, currentDocument, currentSegment, userIntent]);

  // Generate suggestions when content or cursor changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      generateSuggestions();
    }, 500); // Debounce
    
    return () => clearTimeout(timeoutId);
  }, [content, cursorPosition, generateSuggestions]);

  const handleSuggestionClick = (suggestion: Suggestion) => {
    switch (suggestion.context) {
      case 'word_completion':
        // Replace last word with suggestion
        const words = content.slice(0, cursorPosition).split(/\s+/);
        words.pop();
        const newText = words.join(' ') + ' ' + suggestion.text + content.slice(cursorPosition);
        onSuggestionSelect(newText);
        break;
        
      case 'sentence_completion':
        // Insert at cursor position
        const inserted = content.slice(0, cursorPosition) + suggestion.text + content.slice(cursorPosition);
        onSuggestionSelect(inserted);
        break;
        
      case 'spelling_correction':
        // Apply correction
        const corrected = content.replace(/teh\s/gi, 'the ').replace(/dont\s/gi, "don't ").replace(/cant\s/gi, "can't ").replace(/wont\s/gi, "won't ");
        onSuggestionSelect(corrected);
        break;
        
      default:
        // For other suggestions, just notify
        onSuggestionSelect(suggestion.text);
    }
    
    setShowSuggestions(false);
  };

  if (!showSuggestions || suggestions.length === 0) return null;

  return (
    <div
      className={className}
      style={{
        position: 'absolute',
        background: 'linear-gradient(135deg, rgba(20, 20, 30, 0.98) 0%, rgba(15, 15, 25, 0.98) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        zIndex: 1000,
        minWidth: '280px',
        maxWidth: '400px',
      }}
    >
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <span style={{ 
          fontSize: '12px', 
          fontWeight: 600, 
          color: 'rgba(255, 255, 255, 0.7)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          AI Suggestions
        </span>
        {isLoading && (
          <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
            Thinking...
          </span>
        )}
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.id}
            onClick={() => handleSuggestionClick(suggestion)}
            style={{
              padding: '10px 12px',
              background: suggestion.type === 'correction' 
                ? 'rgba(239, 68, 68, 0.1)' 
                : suggestion.type === 'completion'
                ? 'rgba(99, 102, 241, 0.1)'
                : 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '13px',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = suggestion.type === 'correction' 
                ? 'rgba(239, 68, 68, 0.1)' 
                : suggestion.type === 'completion'
                ? 'rgba(99, 102, 241, 0.1)'
                : 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <span style={{ flex: 1 }}>{suggestion.text}</span>
            <span style={{ 
              fontSize: '10px', 
              color: 'rgba(255, 255, 255, 0.4)',
              marginLeft: '8px'
            }}>
              {Math.round(suggestion.confidence * 100)}%
            </span>
          </button>
        ))}
      </div>
      
      <div style={{ 
        marginTop: '8px',
        paddingTop: '8px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)' }}>
          Press Tab to accept
        </span>
        <button
          onClick={() => setShowSuggestions(false)}
          style={{
            fontSize: '10px',
            color: 'rgba(255, 255, 255, 0.5)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

export default SmartSuggestions;
