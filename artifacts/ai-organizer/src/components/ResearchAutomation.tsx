import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useMediaQuery } from '../hooks/useMediaQuery';

// Types for Research Automation (GitHub Actions equivalent)
export type WorkflowTrigger = 'push' | 'pull_request' | 'schedule' | 'manual' | 'document_upload' | 'review_complete';
export type WorkflowStatus = 'idle' | 'queued' | 'running' | 'success' | 'failure' | 'cancelled';
export type StepStatus = 'pending' | 'running' | 'success' | 'failure' | 'skipped';

export interface WorkflowStep {
  id: string;
  name: string;
  status: StepStatus;
  duration?: number;
  output?: string;
  error?: string;
}

export interface WorkflowRun {
  id: string;
  workflowId: string;
  workflowName: string;
  status: WorkflowStatus;
  trigger: WorkflowTrigger;
  triggeredBy: string;
  branch: string;
  commit?: string;
  steps: WorkflowStep[];
  startedAt: string;
  completedAt?: string;
  duration?: number;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  triggers: WorkflowTrigger[];
  enabled: boolean;
  steps: { id: string; name: string; action: string; config?: Record<string, any> }[];
  schedule?: string;
  lastRun?: WorkflowRun;
  createdAt: string;
  updatedAt: string;
}

const RESEARCH_ACTIONS = {
  'citation-check': { name: 'Citation Validation', icon: '📚', description: 'Verify all citations are properly formatted and exist' },
  'statistical-validation': { name: 'Statistical Validation', icon: '📊', description: 'Validate statistical methods and results' },
  'methodology-review': { name: 'Methodology Review', icon: '🔬', description: 'Check methodology against standards' },
  'ethics-clearance': { name: 'Ethics Clearance', icon: '⚖️', description: 'Verify ethics compliance' },
  'plagiarism-check': { name: 'Plagiarism Check', icon: '🔍', description: 'Scan for potential plagiarism' },
  'grammar-check': { name: 'Grammar & Style', icon: '✏️', description: 'Check grammar and writing style' },
  'format-validation': { name: 'Format Validation', icon: '📝', description: 'Validate document formatting' },
  'reference-sync': { name: 'Reference Sync', icon: '🔗', description: 'Sync with reference managers' },
  'export-pdf': { name: 'Export PDF', icon: '📄', description: 'Generate PDF version' },
  'notify-reviewers': { name: 'Notify Reviewers', icon: '📧', description: 'Send notifications to assigned reviewers' },
  'backup-create': { name: 'Create Backup', icon: '💾', description: 'Create versioned backup' },
  'ai-analysis': { name: 'AI Analysis', icon: '🤖', description: 'Run AI-powered content analysis' },
};

const TRIGGER_CONFIG = {
  'push': { label: 'On Push', icon: '📤', description: 'Run when changes are pushed' },
  'pull_request': { label: 'On Review Request', icon: '🔀', description: 'Run when review is requested' },
  'schedule': { label: 'Scheduled', icon: '⏰', description: 'Run on a schedule' },
  'manual': { label: 'Manual', icon: '▶️', description: 'Run manually' },
  'document_upload': { label: 'On Upload', icon: '📁', description: 'Run when document is uploaded' },
  'review_complete': { label: 'On Review Complete', icon: '✅', description: 'Run when review is completed' },
};

interface ResearchAutomationProps {
  onClose?: () => void;
}

const STORAGE_KEY = 'research-automation-workflows';
const RUNS_KEY = 'research-automation-runs';

// Status colors using semantic tokens
const STATUS_COLORS: Record<string, string> = {
  success: 'hsl(142 71% 45%)',
  failure: 'hsl(var(--destructive))',
  running: 'hsl(var(--primary))',
  pending: 'hsl(var(--muted-foreground))',
  queued: 'hsl(var(--muted-foreground))',
  cancelled: 'hsl(43 96% 56%)',
  skipped: 'hsl(43 96% 56%)',
  warning: 'hsl(43 96% 56%)',
  idle: 'hsl(var(--muted-foreground))',
};

export const ResearchAutomation: React.FC<ResearchAutomationProps> = ({ onClose }) => {
  const { t } = useLanguage();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [activeTab, setActiveTab] = useState<'workflows' | 'runs' | 'create'>('workflows');
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [selectedRun, setSelectedRun] = useState<WorkflowRun | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const storedRuns = localStorage.getItem(RUNS_KEY);
    if (stored) { setWorkflows(JSON.parse(stored)); } else {
      setWorkflows([
        { id: 'wf-1', name: 'Document Quality Check', description: 'Run quality checks on document changes', triggers: ['push', 'pull_request'], enabled: true, steps: [{ id: 's1', name: 'Citation Check', action: 'citation-check' }, { id: 's2', name: 'Grammar Check', action: 'grammar-check' }, { id: 's3', name: 'Format Validation', action: 'format-validation' }], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'wf-2', name: 'Pre-Review Validation', description: 'Validate documents before peer review', triggers: ['pull_request'], enabled: true, steps: [{ id: 's1', name: 'Statistical Validation', action: 'statistical-validation' }, { id: 's2', name: 'Methodology Review', action: 'methodology-review' }, { id: 's3', name: 'Plagiarism Check', action: 'plagiarism-check' }, { id: 's4', name: 'Ethics Clearance', action: 'ethics-clearance' }], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'wf-3', name: 'Weekly Backup', description: 'Create weekly backups of all documents', triggers: ['schedule'], enabled: true, schedule: '0 0 * * 0', steps: [{ id: 's1', name: 'Create Backup', action: 'backup-create' }, { id: 's2', name: 'Export PDF', action: 'export-pdf' }], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ]);
    }
    if (storedRuns) setRuns(JSON.parse(storedRuns));
  }, []);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows)); }, [workflows]);
  useEffect(() => { localStorage.setItem(RUNS_KEY, JSON.stringify(runs)); }, [runs]);

  const runWorkflow = useCallback((workflow: Workflow) => {
    const newRun: WorkflowRun = { id: `run-${Date.now()}`, workflowId: workflow.id, workflowName: workflow.name, status: 'running', trigger: 'manual', triggeredBy: 'Current User', branch: 'main', steps: workflow.steps.map(s => ({ id: s.id, name: s.name, status: 'pending' as StepStatus })), startedAt: new Date().toISOString() };
    setRuns(prev => [newRun, ...prev]);
    setSelectedRun(newRun);
    setActiveTab('runs');
    let stepIndex = 0;
    const runStep = () => {
      if (stepIndex >= workflow.steps.length) {
        setRuns(prev => prev.map(r => r.id === newRun.id ? { ...r, status: 'success', completedAt: new Date().toISOString(), duration: Date.now() - new Date(r.startedAt).getTime() } : r));
        return;
      }
      setRuns(prev => prev.map(r => { if (r.id !== newRun.id) return r; const steps = [...r.steps]; steps[stepIndex] = { ...steps[stepIndex], status: 'running' }; return { ...r, steps }; }));
      setTimeout(() => {
        const success = Math.random() > 0.1;
        setRuns(prev => prev.map(r => {
          if (r.id !== newRun.id) return r;
          const steps = [...r.steps];
          steps[stepIndex] = { ...steps[stepIndex], status: success ? 'success' : 'failure', duration: 1000 + Math.random() * 2000, output: success ? 'Step completed successfully' : undefined, error: success ? undefined : 'Step failed with error' };
          if (!success) { for (let i = stepIndex + 1; i < steps.length; i++) steps[i] = { ...steps[i], status: 'skipped' }; return { ...r, steps, status: 'failure', completedAt: new Date().toISOString(), duration: Date.now() - new Date(r.startedAt).getTime() }; }
          return { ...r, steps };
        }));
        if (success) { stepIndex++; setTimeout(runStep, 500); }
      }, 1500 + Math.random() * 1000);
    };
    setTimeout(runStep, 500);
  }, []);

  const toggleWorkflow = useCallback((id: string) => { setWorkflows(prev => prev.map(w => w.id === id ? { ...w, enabled: !w.enabled, updatedAt: new Date().toISOString() } : w)); }, []);
  const deleteWorkflow = useCallback((id: string) => { setWorkflows(prev => prev.filter(w => w.id !== id)); if (selectedWorkflow?.id === id) setSelectedWorkflow(null); }, [selectedWorkflow]);
  const cancelRun = useCallback((id: string) => { setRuns(prev => prev.map(r => r.id === id && r.status === 'running' ? { ...r, status: 'cancelled', completedAt: new Date().toISOString(), steps: r.steps.map(s => s.status === 'pending' ? { ...s, status: 'skipped' } : s) } : r)); }, []);
  const rerunWorkflow = useCallback((run: WorkflowRun) => { const workflow = workflows.find(w => w.id === run.workflowId); if (workflow) runWorkflow(workflow); }, [workflows, runWorkflow]);

  const formatDuration = (ms: number) => { if (ms < 1000) return `${ms}ms`; if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`; return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`; };
  const getStatusColor = (status: WorkflowStatus | StepStatus) => STATUS_COLORS[status] || 'hsl(var(--muted-foreground))';
  const getStatusIcon = (status: WorkflowStatus | StepStatus) => {
    switch (status) { case 'success': return '✓'; case 'failure': return '✕'; case 'running': return '◌'; case 'queued': case 'pending': return '○'; case 'cancelled': case 'skipped': return '⊘'; default: return '○'; }
  };

  return (
    <div style={{ background: 'hsl(var(--background))', borderRadius: '10px', border: '1px solid hsl(var(--border))', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: isMobile ? '12px 14px' : '16px 20px', background: 'hsl(var(--muted) / 0.5)', borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px' }}>⚡</span>
          <div>
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>{t('automation.title') || 'Research Automation'}</h2>
            <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}>{t('automation.subtitle') || 'Automated workflows for research validation'}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid hsl(var(--border))', background: 'hsl(var(--muted) / 0.3)' }}>
        {(['workflows', 'runs', 'create'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: isMobile ? '10px 14px' : '11px 18px', background: activeTab === tab ? 'hsl(var(--background))' : 'transparent', border: 'none', borderBottom: activeTab === tab ? '2px solid hsl(var(--primary))' : '2px solid transparent', color: activeTab === tab ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))', fontSize: '12px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {tab === 'workflows' && '📋'}{tab === 'runs' && '▶️'}{tab === 'create' && '➕'}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'runs' && runs.filter(r => r.status === 'running').length > 0 && <span style={{ width: '7px', height: '7px', background: 'hsl(var(--primary))', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: isMobile ? 'column' : 'row' }}>
        {/* Workflows Tab */}
        {activeTab === 'workflows' && (
          <div style={{ flex: 1, padding: isMobile ? '12px' : '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {workflows.map(workflow => (
                <div key={workflow.id} style={{ padding: isMobile ? '12px' : '14px 16px', background: 'hsl(var(--card))', borderRadius: '10px', border: '1px solid hsl(var(--border))' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                        <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: workflow.enabled ? 'hsl(142 71% 45%)' : 'hsl(var(--muted-foreground))' }} />
                        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>{workflow.name}</h3>
                      </div>
                      <p style={{ margin: 0, fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>{workflow.description}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button onClick={() => runWorkflow(workflow)} disabled={!workflow.enabled} style={{ padding: '5px 10px', background: workflow.enabled ? 'hsl(142 71% 45%)' : 'hsl(var(--muted))', border: 'none', borderRadius: '10px', color: workflow.enabled ? '#ffffff' : 'hsl(var(--muted-foreground))', fontSize: '11px', fontWeight: 500, cursor: workflow.enabled ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '4px' }}>▶️ Run</button>
                      <button onClick={() => toggleWorkflow(workflow.id)} style={{ padding: '5px 10px', background: 'transparent', border: '1px solid hsl(var(--border))', borderRadius: '10px', color: 'hsl(var(--muted-foreground))', fontSize: '11px', cursor: 'pointer' }}>{workflow.enabled ? '⏸️ Disable' : '▶️ Enable'}</button>
                      <button onClick={() => deleteWorkflow(workflow.id)} style={{ padding: '5px 10px', background: 'transparent', border: '1px solid hsl(var(--destructive) / 0.4)', borderRadius: '10px', color: 'hsl(var(--destructive))', fontSize: '11px', cursor: 'pointer' }}>🗑️</button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                    {workflow.triggers.map(trigger => (
                      <span key={trigger} style={{ padding: '3px 8px', background: 'hsl(var(--primary) / 0.15)', borderRadius: '10px', fontSize: '10px', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', gap: '3px' }}>{TRIGGER_CONFIG[trigger].icon} {TRIGGER_CONFIG[trigger].label}</span>
                    ))}
                    {workflow.schedule && <span style={{ padding: '3px 8px', background: 'hsl(43 96% 56% / 0.15)', borderRadius: '10px', fontSize: '10px', color: 'hsl(43 96% 56%)' }}>⏰ {workflow.schedule}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '4px', padding: '10px', background: 'hsl(var(--muted) / 0.4)', borderRadius: '10px', flexWrap: 'wrap' }}>
                    {workflow.steps.map((step, i) => {
                      const action = RESEARCH_ACTIONS[step.action as keyof typeof RESEARCH_ACTIONS];
                      return (
                        <React.Fragment key={step.id}>
                          <div style={{ padding: '6px 10px', background: 'hsl(var(--background))', borderRadius: '10px', border: '1px solid hsl(var(--border))', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span>{action?.icon || '⚙️'}</span>
                            <span style={{ color: 'hsl(var(--foreground))' }}>{step.name}</span>
                          </div>
                          {i < workflow.steps.length - 1 && <span style={{ color: 'hsl(var(--muted-foreground))', alignSelf: 'center', fontSize: '11px' }}>→</span>}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              ))}
              {workflows.length === 0 && (
                <div style={{ padding: '40px', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚡</div>
                  <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px', color: 'hsl(var(--foreground))' }}>No workflows yet</div>
                  <div style={{ fontSize: '13px', marginBottom: '14px' }}>Create your first automated workflow</div>
                  <button onClick={() => setActiveTab('create')} style={{ padding: '8px 18px', background: 'hsl(var(--primary))', border: 'none', borderRadius: '10px', color: 'hsl(var(--primary-foreground))', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>➕ Create Workflow</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Runs Tab */}
        {activeTab === 'runs' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row' }}>
            <div style={{ width: isMobile ? '100%' : '300px', borderRight: isMobile ? 'none' : '1px solid hsl(var(--border))', borderBottom: isMobile ? '1px solid hsl(var(--border))' : 'none', overflow: 'auto', maxHeight: isMobile ? '200px' : 'none' }}>
              {runs.map(run => (
                <button key={run.id} onClick={() => setSelectedRun(run)} style={{ width: '100%', padding: '12px 14px', background: selectedRun?.id === run.id ? 'hsl(var(--accent))' : 'transparent', border: 'none', borderBottom: '1px solid hsl(var(--border))', borderLeft: selectedRun?.id === run.id ? '3px solid hsl(var(--primary))' : '3px solid transparent', textAlign: 'left', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: `${getStatusColor(run.status)}20`, color: getStatusColor(run.status), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 600, animation: run.status === 'running' ? 'spin 1s linear infinite' : undefined }}>{getStatusIcon(run.status)}</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>{run.workflowName}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'hsl(var(--muted-foreground))' }}>
                    <span>{TRIGGER_CONFIG[run.trigger].icon}</span>
                    <span>{run.branch}</span>
                    <span>•</span>
                    <span>{new Date(run.startedAt).toLocaleTimeString()}</span>
                  </div>
                </button>
              ))}
              {runs.length === 0 && <div style={{ padding: '28px', textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontSize: '12px' }}>No workflow runs yet</div>}
            </div>
            <div style={{ flex: 1, padding: isMobile ? '12px' : '18px', overflow: 'auto' }}>
              {selectedRun ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>{selectedRun.workflowName}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: 'hsl(var(--muted-foreground))', flexWrap: 'wrap' }}>
                        <span style={{ color: getStatusColor(selectedRun.status), display: 'flex', alignItems: 'center', gap: '4px' }}>{getStatusIcon(selectedRun.status)} {selectedRun.status}</span>
                        <span>•</span><span>{TRIGGER_CONFIG[selectedRun.trigger].label}</span>
                        <span>•</span><span>Branch: {selectedRun.branch}</span>
                        {selectedRun.duration && <><span>•</span><span>{formatDuration(selectedRun.duration)}</span></>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {selectedRun.status === 'running' && <button onClick={() => cancelRun(selectedRun.id)} style={{ padding: '6px 14px', background: 'hsl(var(--destructive))', border: 'none', borderRadius: '10px', color: '#ffffff', fontSize: '11px', cursor: 'pointer' }}>⏹️ Cancel</button>}
                      {(selectedRun.status === 'success' || selectedRun.status === 'failure') && <button onClick={() => rerunWorkflow(selectedRun)} style={{ padding: '6px 14px', background: 'hsl(var(--primary))', border: 'none', borderRadius: '10px', color: 'hsl(var(--primary-foreground))', fontSize: '11px', cursor: 'pointer' }}>🔄 Re-run</button>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedRun.steps.map(step => (
                      <div key={step.id} style={{ padding: '12px 14px', background: 'hsl(var(--card))', borderRadius: '10px', border: '1px solid hsl(var(--border))', borderLeft: `3px solid ${getStatusColor(step.status)}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: `${getStatusColor(step.status)}20`, color: getStatusColor(step.status), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600, animation: step.status === 'running' ? 'spin 1s linear infinite' : undefined }}>{getStatusIcon(step.status)}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: 500, color: 'hsl(var(--foreground))' }}>{step.name}</div>
                            {step.duration && <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}>{formatDuration(step.duration)}</div>}
                          </div>
                          <span style={{ padding: '3px 8px', background: `${getStatusColor(step.status)}20`, borderRadius: '10px', fontSize: '10px', color: getStatusColor(step.status), textTransform: 'capitalize' }}>{step.status}</span>
                        </div>
                        {(step.output || step.error) && (
                          <div style={{ marginTop: '10px', padding: '8px 10px', background: 'hsl(var(--muted) / 0.4)', borderRadius: '10px', fontFamily: 'monospace', fontSize: '11px', color: step.error ? 'hsl(var(--destructive))' : 'hsl(var(--muted-foreground))' }}>{step.error || step.output}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'hsl(var(--muted-foreground))', fontSize: '13px' }}>Select a run to view details</div>
              )}
            </div>
          </div>
        )}

        {/* Create Tab */}
        {activeTab === 'create' && (
          <WorkflowEditor isMobile={isMobile} onSave={(workflow) => { setWorkflows(prev => [...prev, workflow]); setActiveTab('workflows'); }} />
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

// Workflow Editor Component
interface WorkflowEditorProps {
  onSave: (workflow: Workflow) => void;
  initialWorkflow?: Workflow;
  isMobile: boolean;
}

const WorkflowEditor: React.FC<WorkflowEditorProps> = ({ onSave, initialWorkflow, isMobile }) => {
  const [name, setName] = useState(initialWorkflow?.name || '');
  const [description, setDescription] = useState(initialWorkflow?.description || '');
  const [triggers, setTriggers] = useState<WorkflowTrigger[]>(initialWorkflow?.triggers || ['manual']);
  const [steps, setSteps] = useState(initialWorkflow?.steps || []);
  const [schedule, setSchedule] = useState(initialWorkflow?.schedule || '');

  const toggleTrigger = (trigger: WorkflowTrigger) => { setTriggers(prev => prev.includes(trigger) ? prev.filter(t => t !== trigger) : [...prev, trigger]); };
  const addStep = (action: string) => { const ac = RESEARCH_ACTIONS[action as keyof typeof RESEARCH_ACTIONS]; setSteps(prev => [...prev, { id: `step-${Date.now()}`, name: ac?.name || action, action }]); };
  const removeStep = (id: string) => { setSteps(prev => prev.filter(s => s.id !== id)); };

  const handleSave = () => {
    if (!name.trim() || steps.length === 0) return;
    onSave({ id: initialWorkflow?.id || `wf-${Date.now()}`, name: name.trim(), description: description.trim(), triggers, enabled: true, steps, schedule: triggers.includes('schedule') ? schedule : undefined, createdAt: initialWorkflow?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() });
  };

  const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', background: 'hsl(var(--muted) / 0.4)', border: '1px solid hsl(var(--border))', borderRadius: '10px', color: 'hsl(var(--foreground))', fontSize: '13px', outline: 'none' };

  return (
    <div style={{ flex: 1, padding: isMobile ? '14px' : '18px', overflow: 'auto' }}>
      <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>{initialWorkflow ? 'Edit Workflow' : 'Create New Workflow'}</h3>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'hsl(var(--muted-foreground))', marginBottom: '5px' }}>Workflow Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Pre-Publication Check" style={inputStyle} />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'hsl(var(--muted-foreground))', marginBottom: '5px' }}>Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what this workflow does..." rows={2} style={{ ...inputStyle, resize: 'none' }} />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'hsl(var(--muted-foreground))', marginBottom: '8px' }}>Triggers</label>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {(Object.entries(TRIGGER_CONFIG) as [WorkflowTrigger, typeof TRIGGER_CONFIG[WorkflowTrigger]][]).map(([key, config]) => (
            <button key={key} onClick={() => toggleTrigger(key)} style={{ padding: '6px 12px', background: triggers.includes(key) ? 'hsl(var(--primary) / 0.15)' : 'transparent', border: `1px solid ${triggers.includes(key) ? 'hsl(var(--primary) / 0.4)' : 'hsl(var(--border))'}`, borderRadius: '10px', color: triggers.includes(key) ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
              {config.icon} {config.label}
            </button>
          ))}
        </div>
      </div>

      {triggers.includes('schedule') && (
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'hsl(var(--muted-foreground))', marginBottom: '5px' }}>Cron Schedule</label>
          <input type="text" value={schedule} onChange={(e) => setSchedule(e.target.value)} placeholder="e.g., 0 0 * * 0 (every Sunday)" style={{ ...inputStyle, fontFamily: 'monospace' }} />
        </div>
      )}

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'hsl(var(--muted-foreground))', marginBottom: '8px' }}>Steps ({steps.length})</label>
        {steps.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
            {steps.map((step, i) => {
              const action = RESEARCH_ACTIONS[step.action as keyof typeof RESEARCH_ACTIONS];
              return (
                <div key={step.id} style={{ padding: '10px 12px', background: 'hsl(var(--card))', borderRadius: '10px', border: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: 'hsl(var(--muted-foreground))', fontSize: '11px', fontWeight: 600 }}>{i + 1}</span>
                  <span style={{ fontSize: '16px' }}>{action?.icon || '⚙️'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: 500, color: 'hsl(var(--foreground))' }}>{step.name}</div>
                    <div style={{ fontSize: '10px', color: 'hsl(var(--muted-foreground))' }}>{action?.description}</div>
                  </div>
                  <button onClick={() => removeStep(step.id)} style={{ padding: '3px 6px', background: 'transparent', border: 'none', color: 'hsl(var(--destructive))', cursor: 'pointer', fontSize: '13px' }}>✕</button>
                </div>
              );
            })}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(auto-fill, minmax(150px, 1fr))' : 'repeat(auto-fill, minmax(180px, 1fr))', gap: '6px' }}>
          {Object.entries(RESEARCH_ACTIONS).map(([key, action]) => (
            <button key={key} onClick={() => addStep(key)} style={{ padding: '10px', background: 'transparent', border: '1px dashed hsl(var(--border))', borderRadius: '10px', color: 'hsl(var(--muted-foreground))', fontSize: '11px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s ease' }}>
              <span style={{ fontSize: '14px' }}>{action.icon}</span>
              <span>{action.name}</span>
            </button>
          ))}
        </div>
      </div>

      <button onClick={handleSave} disabled={!name.trim() || steps.length === 0} style={{ padding: '10px 20px', background: name.trim() && steps.length > 0 ? 'hsl(var(--primary))' : 'hsl(var(--muted))', border: 'none', borderRadius: '10px', color: name.trim() && steps.length > 0 ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))', fontSize: '13px', fontWeight: 600, cursor: name.trim() && steps.length > 0 ? 'pointer' : 'not-allowed' }}>💾 Save Workflow</button>
    </div>
  );
};

export default ResearchAutomation;
