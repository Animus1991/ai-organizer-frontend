/**
 * MultiAgentWorkflow - Chain multiple AI providers in configurable pipelines
 * Supports sequential, parallel, and review workflows
 */
import React, { useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Plus, X, ArrowRight, GitBranch, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { chatCompletion, type ChatCompletionRequest } from '../../lib/api/aiChat';

// Types
export type WorkflowStepType = 'generate' | 'review' | 'summarize' | 'translate' | 'custom';

export interface WorkflowStep {
  id: string;
  name: string;
  type: WorkflowStepType;
  providerType: string;
  model?: string;
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number;
  // Input: 'initial' means use user input, otherwise use output of referenced step
  inputFrom: 'initial' | string;
  status: 'pending' | 'running' | 'completed' | 'error';
  output?: string;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  status: 'idle' | 'running' | 'completed' | 'error';
  createdAt: Date;
}

// Preset workflows
export const PRESET_WORKFLOWS: Omit<Workflow, 'id' | 'status' | 'createdAt'>[] = [
  {
    name: 'Generate → Review → Refine',
    description: 'Generate content, review it, then refine based on feedback',
    steps: [
      {
        id: 'step-1',
        name: 'Generate',
        type: 'generate',
        providerType: 'openai',
        systemPrompt: 'You are a helpful research assistant. Generate comprehensive, well-structured content.',
        inputFrom: 'initial',
        status: 'pending',
      },
      {
        id: 'step-2',
        name: 'Critical Review',
        type: 'review',
        providerType: 'anthropic',
        systemPrompt: 'You are a critical reviewer. Analyze the following text for accuracy, completeness, logical consistency, and clarity. Provide specific, actionable feedback with suggestions for improvement.',
        inputFrom: 'step-1',
        status: 'pending',
      },
      {
        id: 'step-3',
        name: 'Refine',
        type: 'custom',
        providerType: 'openai',
        systemPrompt: 'You are a content editor. Incorporate the review feedback to improve the original text. Maintain the original structure but address all concerns raised.',
        inputFrom: 'step-2',
        status: 'pending',
      },
    ],
  },
  {
    name: 'Multi-Perspective Analysis',
    description: 'Get analysis from multiple AI providers, then synthesize',
    steps: [
      {
        id: 'step-1',
        name: 'Analysis A (OpenAI)',
        type: 'generate',
        providerType: 'openai',
        systemPrompt: 'Analyze the following from a technical/quantitative perspective. Focus on data, metrics, and measurable outcomes.',
        inputFrom: 'initial',
        status: 'pending',
      },
      {
        id: 'step-2',
        name: 'Analysis B (Anthropic)',
        type: 'generate',
        providerType: 'anthropic',
        systemPrompt: 'Analyze the following from a qualitative/ethical perspective. Focus on implications, risks, and human factors.',
        inputFrom: 'initial',
        status: 'pending',
      },
      {
        id: 'step-3',
        name: 'Synthesis',
        type: 'summarize',
        providerType: 'gemini',
        systemPrompt: 'Synthesize the two analyses below into a balanced, comprehensive summary. Highlight agreements, disagreements, and key insights from both perspectives.',
        inputFrom: 'step-1',
        status: 'pending',
      },
    ],
  },
  {
    name: 'Research Paper Helper',
    description: 'Generate, fact-check, and format research content',
    steps: [
      {
        id: 'step-1',
        name: 'Draft Content',
        type: 'generate',
        providerType: 'openai',
        systemPrompt: 'You are an academic writing assistant. Generate well-structured, scholarly content with proper citations format.',
        inputFrom: 'initial',
        status: 'pending',
      },
      {
        id: 'step-2',
        name: 'Fact Check',
        type: 'review',
        providerType: 'anthropic',
        systemPrompt: 'Fact-check the following academic content. Flag any unsupported claims, missing citations, or potential inaccuracies. Rate confidence level for each claim.',
        inputFrom: 'step-1',
        status: 'pending',
      },
      {
        id: 'step-3',
        name: 'Final Format',
        type: 'custom',
        providerType: 'gemini',
        systemPrompt: 'Format the following content into proper academic style with LaTeX formulas where appropriate, structured sections, and formatted references.',
        inputFrom: 'step-1',
        status: 'pending',
      },
    ],
  },
];

// Workflow execution engine
export async function executeWorkflow(
  workflow: Workflow,
  initialInput: string,
  onStepUpdate: (stepId: string, updates: Partial<WorkflowStep>) => void,
  onWorkflowUpdate: (updates: Partial<Workflow>) => void,
): Promise<void> {
  onWorkflowUpdate({ status: 'running' });
  const outputs: Record<string, string> = { initial: initialInput };

  for (const step of workflow.steps) {
    onStepUpdate(step.id, { status: 'running', startedAt: new Date() });

    try {
      // Build input from referenced step output
      let input = outputs[step.inputFrom] || initialInput;
      
      // For synthesis steps, combine multiple outputs
      if (step.type === 'summarize' || step.name.includes('Synthe')) {
        const allOutputs = Object.entries(outputs)
          .filter(([k]) => k !== 'initial')
          .map(([k, v]) => `=== ${k} ===\n${v}`)
          .join('\n\n');
        input = allOutputs || input;
      }

      const messages = [
        { role: 'system' as const, content: step.systemPrompt },
        { role: 'user' as const, content: input },
      ];

      const response = await chatCompletion({
        providerType: step.providerType,
        messages,
        model: step.model,
        temperature: step.temperature ?? 0.7,
        maxTokens: step.maxTokens,
      });

      outputs[step.id] = response.content;
      onStepUpdate(step.id, {
        status: 'completed',
        output: response.content,
        completedAt: new Date(),
      });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      onStepUpdate(step.id, {
        status: 'error',
        error: errMsg,
        completedAt: new Date(),
      });
      onWorkflowUpdate({ status: 'error' });
      return;
    }
  }

  onWorkflowUpdate({ status: 'completed' });
}

// UI Components

interface WorkflowPanelProps {
  onClose: () => void;
  isConnected: boolean;
}

export function WorkflowPanel({ onClose, isConnected }: WorkflowPanelProps) {
  const [activeWorkflow, setActiveWorkflow] = useState<Workflow | null>(null);
  const [userInput, setUserInput] = useState('');
  const [showPresets, setShowPresets] = useState(true);

  const handleStartWorkflow = useCallback(async (preset: typeof PRESET_WORKFLOWS[0]) => {
    const workflow: Workflow = {
      id: `wf-${Date.now()}`,
      ...preset,
      steps: preset.steps.map(s => ({ ...s, status: 'pending' as const, output: undefined, error: undefined })),
      status: 'idle',
      createdAt: new Date(),
    };
    setActiveWorkflow(workflow);
    setShowPresets(false);
  }, []);

  const handleRun = useCallback(async () => {
    if (!activeWorkflow || !userInput.trim()) return;

    setActiveWorkflow(prev => prev ? { ...prev, status: 'running' } : null);

    await executeWorkflow(
      activeWorkflow,
      userInput,
      (stepId, updates) => {
        setActiveWorkflow(prev => {
          if (!prev) return null;
          return {
            ...prev,
            steps: prev.steps.map(s => s.id === stepId ? { ...s, ...updates } : s),
          };
        });
      },
      (updates) => {
        setActiveWorkflow(prev => prev ? { ...prev, ...updates } : null);
      },
    );
  }, [activeWorkflow, userInput]);

  const handleReset = useCallback(() => {
    setActiveWorkflow(prev => {
      if (!prev) return null;
      return {
        ...prev,
        status: 'idle',
        steps: prev.steps.map(s => ({ ...s, status: 'pending' as const, output: undefined, error: undefined })),
      };
    });
    setUserInput('');
  }, []);

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'hsl(var(--card))',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 25,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 12px',
        borderBottom: '1px solid hsl(var(--border))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <GitBranch size={14} style={{ color: 'hsl(var(--primary))' }} />
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'hsl(var(--foreground))' }}>
            Multi-Agent Workflow
          </span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {activeWorkflow && (
            <button onClick={() => { setActiveWorkflow(null); setShowPresets(true); }} style={smallBtnStyle}>
              ← Back
            </button>
          )}
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'hsl(var(--muted-foreground))', padding: '4px',
          }}>
            <X size={13} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
        {showPresets && !activeWorkflow ? (
          // Preset selection
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }}>
              Select a workflow template:
            </div>
            {PRESET_WORKFLOWS.map((preset, i) => (
              <button
                key={i}
                onClick={() => handleStartWorkflow(preset)}
                disabled={!isConnected}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--background) / 0.5)',
                  cursor: isConnected ? 'pointer' : 'not-allowed',
                  textAlign: 'left',
                  opacity: isConnected ? 1 : 0.5,
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'hsl(var(--foreground))', marginBottom: '2px' }}>
                  {preset.name}
                </div>
                <div style={{ fontSize: '10px', color: 'hsl(var(--muted-foreground))' }}>
                  {preset.description}
                </div>
                <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                  {preset.steps.map((step, j) => (
                    <React.Fragment key={j}>
                      <span style={{
                        fontSize: '9px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: 'hsl(var(--primary) / 0.1)',
                        color: 'hsl(var(--primary))',
                        fontWeight: 600,
                      }}>
                        {step.name}
                      </span>
                      {j < preset.steps.length - 1 && (
                        <ArrowRight size={10} style={{ color: 'hsl(var(--muted-foreground))', alignSelf: 'center' }} />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </button>
            ))}
          </div>
        ) : activeWorkflow ? (
          // Workflow execution view
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'hsl(var(--foreground))', marginBottom: '8px' }}>
              {activeWorkflow.name}
            </div>

            {/* Input */}
            {activeWorkflow.status === 'idle' && (
              <div style={{ marginBottom: '10px' }}>
                <textarea
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  placeholder="Enter your input for the workflow..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))',
                    fontSize: '12px',
                    resize: 'vertical',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
                <button
                  onClick={handleRun}
                  disabled={!userInput.trim()}
                  style={{
                    width: '100%',
                    marginTop: '6px',
                    padding: '8px',
                    borderRadius: '8px',
                    border: 'none',
                    background: userInput.trim() ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
                    color: userInput.trim() ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: userInput.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <Play size={12} /> Run Workflow
                </button>
              </div>
            )}

            {/* Steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {activeWorkflow.steps.map((step, i) => (
                <div key={step.id} style={{
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: `1px solid ${
                    step.status === 'completed' ? 'hsl(142 71% 45% / 0.3)' :
                    step.status === 'error' ? 'hsl(var(--destructive) / 0.3)' :
                    step.status === 'running' ? 'hsl(var(--primary) / 0.3)' :
                    'hsl(var(--border))'
                  }`,
                  background: step.status === 'running' ? 'hsl(var(--primary) / 0.05)' : 'transparent',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    {step.status === 'completed' ? <CheckCircle2 size={12} style={{ color: 'hsl(142 71% 45%)' }} /> :
                     step.status === 'error' ? <AlertCircle size={12} style={{ color: 'hsl(var(--destructive))' }} /> :
                     step.status === 'running' ? <Loader2 size={12} style={{ color: 'hsl(var(--primary))', animation: 'spin 1s linear infinite' }} /> :
                     <span style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid hsl(var(--muted-foreground) / 0.3)', display: 'inline-block' }} />}
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--foreground))' }}>
                      Step {i + 1}: {step.name}
                    </span>
                    <span style={{
                      fontSize: '9px',
                      padding: '1px 4px',
                      borderRadius: '3px',
                      background: 'hsl(var(--muted) / 0.3)',
                      color: 'hsl(var(--muted-foreground))',
                    }}>
                      {step.providerType}
                    </span>
                  </div>

                  {step.output && (
                    <div style={{
                      fontSize: '11px',
                      color: 'hsl(var(--foreground) / 0.8)',
                      maxHeight: '80px',
                      overflowY: 'auto',
                      padding: '4px 6px',
                      borderRadius: '4px',
                      background: 'hsl(var(--muted) / 0.15)',
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.4,
                    }}>
                      {step.output.substring(0, 300)}{step.output.length > 300 ? '...' : ''}
                    </div>
                  )}

                  {step.error && (
                    <div style={{
                      fontSize: '11px',
                      color: 'hsl(var(--destructive))',
                      padding: '4px 6px',
                    }}>
                      ❌ {step.error}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Reset button */}
            {(activeWorkflow.status === 'completed' || activeWorkflow.status === 'error') && (
              <button onClick={handleReset} style={{
                width: '100%',
                marginTop: '8px',
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid hsl(var(--border))',
                background: 'transparent',
                color: 'hsl(var(--foreground))',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}>
                <RotateCcw size={12} /> Reset & Run Again
              </button>
            )}
          </div>
        ) : null}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const smallBtnStyle: React.CSSProperties = {
  padding: '3px 8px',
  borderRadius: '4px',
  border: 'none',
  background: 'hsl(var(--muted) / 0.3)',
  color: 'hsl(var(--foreground))',
  fontSize: '10px',
  cursor: 'pointer',
};
