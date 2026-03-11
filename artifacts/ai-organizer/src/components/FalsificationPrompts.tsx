/**
 * FalsificationPrompts Component
 * Generates critical thinking prompts to challenge arguments
 * Helps researchers identify weaknesses and counterarguments
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';

interface FalsificationPrompt {
  id: string;
  category: 'counterargument' | 'evidence' | 'assumption' | 'methodology' | 'scope';
  prompt: string;
  response?: string;
  isAddressed: boolean;
}

interface FalsificationPromptsProps {
  argumentText?: string;
  onPromptsUpdate?: (prompts: FalsificationPrompt[]) => void;
}

const PROMPT_TEMPLATES = {
  counterargument: [
    "What is the strongest argument against this position?",
    "How would a critic respond to this claim?",
    "What alternative explanation could account for the same evidence?",
    "Which expert in the field would disagree, and why?",
    "What historical examples contradict this argument?",
  ],
  evidence: [
    "What evidence would disprove this claim?",
    "Is the supporting evidence sufficient and reliable?",
    "Are there studies that show contradictory results?",
    "What data would need to exist to falsify this hypothesis?",
    "How robust is the evidence under different conditions?",
  ],
  assumption: [
    "What hidden assumptions does this argument rely on?",
    "Which premises are taken for granted without justification?",
    "What would happen if the underlying assumption is false?",
    "Are there cultural or temporal biases in these assumptions?",
    "What axioms must be true for this conclusion to hold?",
  ],
  methodology: [
    "What methodological flaws could undermine this conclusion?",
    "How might sample selection bias affect the results?",
    "What confounding variables have not been considered?",
    "Is the methodology replicable and transparent?",
    "What alternative methods might yield different results?",
  ],
  scope: [
    "Does this argument overgeneralize from limited evidence?",
    "What boundary conditions limit the applicability?",
    "In what contexts would this claim not hold?",
    "What edge cases might break this theory?",
    "How far can we extend this conclusion?",
  ],
};

const CATEGORY_INFO = {
  counterargument: { icon: '⚔️', label: 'Counterarguments', color: '#ef4444' },
  evidence: { icon: '📊', label: 'Evidence Gaps', color: '#f59e0b' },
  assumption: { icon: '🧠', label: 'Hidden Assumptions', color: '#8b5cf6' },
  methodology: { icon: '🔬', label: 'Methodology', color: '#3b82f6' },
  scope: { icon: '📐', label: 'Scope Limits', color: '#22c55e' },
};

export const FalsificationPrompts: React.FC<FalsificationPromptsProps> = ({
  argumentText = '',
  onPromptsUpdate,
}) => {
  const { isDark, colors } = useTheme();
  const [prompts, setPrompts] = useState<FalsificationPrompt[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof PROMPT_TEMPLATES | 'all'>('all');
  const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null);

  const generateId = () => `fp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const generatePrompts = useCallback(async () => {
    setIsGenerating(true);
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newPrompts: FalsificationPrompt[] = [];
    const categories = Object.keys(PROMPT_TEMPLATES) as (keyof typeof PROMPT_TEMPLATES)[];
    
    categories.forEach(category => {
      // Select 2 random prompts from each category
      const shuffled = [...PROMPT_TEMPLATES[category]].sort(() => Math.random() - 0.5);
      shuffled.slice(0, 2).forEach(prompt => {
        newPrompts.push({
          id: generateId(),
          category,
          prompt,
          isAddressed: false,
        });
      });
    });
    
    setPrompts(newPrompts);
    onPromptsUpdate?.(newPrompts);
    setIsGenerating(false);
  }, [onPromptsUpdate]);

  const addCustomPrompt = useCallback((category: keyof typeof PROMPT_TEMPLATES, promptText: string) => {
    if (!promptText.trim()) return;
    
    const newPrompt: FalsificationPrompt = {
      id: generateId(),
      category,
      prompt: promptText.trim(),
      isAddressed: false,
    };
    
    setPrompts(prev => [...prev, newPrompt]);
    onPromptsUpdate?.([...prompts, newPrompt]);
  }, [prompts, onPromptsUpdate]);

  const updateResponse = useCallback((promptId: string, response: string) => {
    setPrompts(prev => prev.map(p => 
      p.id === promptId ? { ...p, response, isAddressed: response.trim().length > 0 } : p
    ));
  }, []);

  const toggleAddressed = useCallback((promptId: string) => {
    setPrompts(prev => prev.map(p => 
      p.id === promptId ? { ...p, isAddressed: !p.isAddressed } : p
    ));
  }, []);

  const removePrompt = useCallback((promptId: string) => {
    setPrompts(prev => prev.filter(p => p.id !== promptId));
  }, []);

  const filteredPrompts = useMemo(() => {
    if (selectedCategory === 'all') return prompts;
    return prompts.filter(p => p.category === selectedCategory);
  }, [prompts, selectedCategory]);

  const stats = useMemo(() => ({
    total: prompts.length,
    addressed: prompts.filter(p => p.isAddressed).length,
    byCategory: Object.keys(CATEGORY_INFO).reduce((acc, cat) => {
      acc[cat] = prompts.filter(p => p.category === cat).length;
      return acc;
    }, {} as Record<string, number>),
  }), [prompts]);

  return (
    <div style={{
      background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0,0,0,0.02)',
      border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0,0,0,0.08)',
      borderRadius: '12px',
      padding: '20px',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '16px',
          fontWeight: 600,
          color: colors.textPrimary,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          🎯 Falsification Prompts
          {stats.total > 0 && (
            <span style={{
              fontSize: '12px',
              background: stats.addressed === stats.total ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)',
              color: stats.addressed === stats.total ? '#86efac' : '#fcd34d',
              padding: '2px 8px',
              borderRadius: '9999px',
            }}>
              {stats.addressed}/{stats.total} addressed
            </span>
          )}
        </h3>
        
        <button
          onClick={generatePrompts}
          disabled={isGenerating}
          style={{
            padding: '8px 16px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            fontSize: '13px',
            fontWeight: 600,
            cursor: isGenerating ? 'wait' : 'pointer',
            opacity: isGenerating ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {isGenerating ? (
            <>
              <span style={{ animation: 'spin 1s linear infinite' }}>⟳</span>
              Generating...
            </>
          ) : (
            <>🔄 Generate Prompts</>
          )}
        </button>
      </div>

      {/* Category Filter */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '16px',
        flexWrap: 'wrap',
      }}>
        <button
          onClick={() => setSelectedCategory('all')}
          style={{
            padding: '6px 12px',
            background: selectedCategory === 'all' ? 'rgba(99, 102, 241, 0.2)' : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0,0,0,0.04)'),
            border: `1px solid ${selectedCategory === 'all' ? '#6366f1' : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0,0,0,0.1)')}`,
            borderRadius: '6px',
            color: selectedCategory === 'all' ? '#a5b4fc' : colors.textSecondary,
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          All ({stats.total})
        </button>
        {Object.entries(CATEGORY_INFO).map(([cat, info]) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat as keyof typeof PROMPT_TEMPLATES)}
            style={{
              padding: '6px 12px',
              background: selectedCategory === cat ? `${info.color}20` : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0,0,0,0.04)'),
              border: `1px solid ${selectedCategory === cat ? info.color : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0,0,0,0.1)')}`,
              borderRadius: '6px',
              color: selectedCategory === cat ? info.color : colors.textSecondary,
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {info.icon} {info.label} ({stats.byCategory[cat] || 0})
          </button>
        ))}
      </div>

      {/* Prompts List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredPrompts.length === 0 ? (
          <div style={{
            padding: '32px',
            textAlign: 'center',
            color: colors.textMuted,
            fontSize: '14px',
          }}>
            {prompts.length === 0 
              ? 'Click "Generate Prompts" to create critical thinking questions.'
              : 'No prompts in this category.'}
          </div>
        ) : (
          filteredPrompts.map((prompt) => {
            const catInfo = CATEGORY_INFO[prompt.category];
            return (
              <div
                key={prompt.id}
                style={{
                  background: prompt.isAddressed 
                    ? 'rgba(34, 197, 94, 0.05)' 
                    : (isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0,0,0,0.01)'),
                  border: `1px solid ${prompt.isAddressed 
                    ? 'rgba(34, 197, 94, 0.2)' 
                    : (isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0,0,0,0.06)')}`,
                  borderRadius: '10px',
                  padding: '14px',
                  borderLeft: `3px solid ${catInfo.color}`,
                }}
              >
                {/* Prompt Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '6px',
                    }}>
                      <span style={{
                        fontSize: '11px',
                        background: `${catInfo.color}20`,
                        color: catInfo.color,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontWeight: 500,
                      }}>
                        {catInfo.icon} {catInfo.label}
                      </span>
                      {prompt.isAddressed && (
                        <span style={{
                          fontSize: '11px',
                          color: '#22c55e',
                        }}>
                          ✓ Addressed
                        </span>
                      )}
                    </div>
                    <p style={{
                      margin: 0,
                      fontSize: '14px',
                      color: colors.textPrimary,
                      fontWeight: 500,
                      lineHeight: 1.5,
                    }}>
                      {prompt.prompt}
                    </p>
                  </div>
                  
                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => toggleAddressed(prompt.id)}
                      title={prompt.isAddressed ? 'Mark as unaddressed' : 'Mark as addressed'}
                      style={{
                        padding: '6px 10px',
                        background: prompt.isAddressed ? 'rgba(34, 197, 94, 0.2)' : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0,0,0,0.04)'),
                        border: 'none',
                        borderRadius: '6px',
                        color: prompt.isAddressed ? '#22c55e' : colors.textSecondary,
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      {prompt.isAddressed ? '✓' : '○'}
                    </button>
                    <button
                      onClick={() => setExpandedPrompt(expandedPrompt === prompt.id ? null : prompt.id)}
                      style={{
                        padding: '6px 10px',
                        background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0,0,0,0.04)',
                        border: 'none',
                        borderRadius: '6px',
                        color: colors.textSecondary,
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      {expandedPrompt === prompt.id ? '▼' : '▶'}
                    </button>
                    <button
                      onClick={() => removePrompt(prompt.id)}
                      style={{
                        padding: '6px 10px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#fca5a5',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Expanded Response Area */}
                {expandedPrompt === prompt.id && (
                  <div style={{
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0,0,0,0.06)',
                  }}>
                    <label style={{ 
                      fontSize: '12px', 
                      color: colors.textMuted, 
                      display: 'block', 
                      marginBottom: '6px' 
                    }}>
                      Your Response / Notes
                    </label>
                    <textarea
                      value={prompt.response || ''}
                      onChange={(e) => updateResponse(prompt.id, e.target.value)}
                      placeholder="How do you address this challenge to your argument?"
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0,0,0,0.02)',
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0,0,0,0.08)',
                        borderRadius: '8px',
                        color: colors.textPrimary,
                        fontSize: '13px',
                        resize: 'vertical',
                        outline: 'none',
                        fontFamily: 'inherit',
                        lineHeight: 1.5,
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Progress Indicator */}
      {stats.total > 0 && (
        <div style={{
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0,0,0,0.06)',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
          }}>
            <span style={{ fontSize: '12px', color: colors.textMuted }}>
              Critical Review Progress
            </span>
            <span style={{ fontSize: '12px', color: colors.textSecondary }}>
              {Math.round((stats.addressed / stats.total) * 100)}%
            </span>
          </div>
          <div style={{
            height: '8px',
            background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0,0,0,0.08)',
            borderRadius: '4px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${(stats.addressed / stats.total) * 100}%`,
              height: '100%',
              background: stats.addressed === stats.total 
                ? '#22c55e' 
                : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
              borderRadius: '4px',
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default FalsificationPrompts;
