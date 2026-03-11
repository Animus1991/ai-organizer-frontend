/**
 * ResearchMilestones — Full milestone tracking UI.
 * Converted from inline styles → Tailwind + semantic design tokens.
 * All emoji icons replaced with lucide-react.
 */
import React, { useState, useCallback, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useResearchIssues, Milestone as ContextMilestone, ResearchIssue } from '../context/ResearchIssuesContext';
import {
  Target, RefreshCw, CheckCircle2, AlertTriangle, Plus, X,
  Calendar, Trash2, User, ArrowUpDown, Check, Milestone as MilestoneIcon
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────
export type MilestoneStatus = 'open' | 'in-progress' | 'completed' | 'overdue';

export interface MilestoneIssue {
  id: string;
  title: string;
  status: 'open' | 'closed';
  assignee?: string;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: MilestoneStatus;
  progress: number;
  issues: MilestoneIssue[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// ─── Status config ─────────────────────────────────────────────────────
const STATUS_CONFIG: Record<MilestoneStatus, {
  icon: React.ReactNode;
  label: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  barClass: string;
}> = {
  'open': {
    icon: <Target className="w-4 h-4" />,
    label: 'Open',
    colorClass: 'text-info',
    bgClass: 'bg-info/10',
    borderClass: 'border-info/30',
    barClass: 'bg-info',
  },
  'in-progress': {
    icon: <RefreshCw className="w-4 h-4" />,
    label: 'In Progress',
    colorClass: 'text-warning',
    bgClass: 'bg-warning/10',
    borderClass: 'border-warning/30',
    barClass: 'bg-warning',
  },
  'completed': {
    icon: <CheckCircle2 className="w-4 h-4" />,
    label: 'Completed',
    colorClass: 'text-success',
    bgClass: 'bg-success/10',
    borderClass: 'border-success/30',
    barClass: 'bg-success',
  },
  'overdue': {
    icon: <AlertTriangle className="w-4 h-4" />,
    label: 'Overdue',
    colorClass: 'text-destructive',
    bgClass: 'bg-destructive/10',
    borderClass: 'border-destructive/30',
    barClass: 'bg-destructive',
  },
};

// ─── Helpers ───────────────────────────────────────────────────────────
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getDaysUntil(dateStr: string) {
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  if (diff < 0) return `${Math.abs(diff)} days overdue`;
  if (diff === 0) return 'Due today';
  if (diff === 1) return 'Due tomorrow';
  return `${diff} days left`;
}

// ─── Main component ──────────────────────────────────────────────────
interface ResearchMilestonesProps {
  onClose?: () => void;
}

export const ResearchMilestones: React.FC<ResearchMilestonesProps> = ({ onClose }) => {
  const { t } = useLanguage();
  const {
    milestones: contextMilestones, issues,
    createMilestone: contextCreateMilestone,
    updateMilestone: contextUpdateMilestone,
    deleteMilestone: contextDeleteMilestone,
    getMilestoneProgress,
  } = useResearchIssues();

  const [activeFilter, setActiveFilter] = useState<'all' | MilestoneStatus>('all');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sortBy, setSortBy] = useState<'dueDate' | 'progress' | 'title'>('dueDate');

  // Transform context milestones
  const milestones: Milestone[] = useMemo(() => {
    const now = new Date();
    return contextMilestones.map((cm: ContextMilestone) => {
      const milestoneIssues = issues.filter((i: ResearchIssue) => i.milestoneId === cm.id);
      const progress = getMilestoneProgress(cm.id);
      const dueDate = cm.dueDate ? new Date(cm.dueDate) : null;

      let status: MilestoneStatus = cm.state === 'closed' ? 'completed' : 'open';
      if (status !== 'completed' && dueDate && dueDate < now) status = 'overdue';
      else if (status !== 'completed' && progress > 0 && progress < 100) status = 'in-progress';

      return {
        id: cm.id,
        title: cm.title,
        description: cm.description,
        dueDate: cm.dueDate ? cm.dueDate.toISOString() : new Date(Date.now() + 30 * 86400000).toISOString(),
        status,
        progress,
        issues: milestoneIssues.map((i: ResearchIssue) => ({
          id: i.id, title: i.title,
          status: i.state === 'closed' ? 'closed' as const : 'open' as const,
          assignee: i.assignees[0],
        })),
        createdAt: cm.createdAt.toISOString(),
        updatedAt: cm.createdAt.toISOString(),
        createdBy: 'User',
      };
    });
  }, [contextMilestones, issues, getMilestoneProgress]);

  const selectedMilestone = useMemo(
    () => selectedMilestoneId ? milestones.find(m => m.id === selectedMilestoneId) || null : null,
    [selectedMilestoneId, milestones]
  );

  const filteredMilestones = useMemo(() => {
    let filtered = activeFilter === 'all' ? milestones : milestones.filter(m => m.status === activeFilter);
    return filtered.sort((a, b) => {
      if (sortBy === 'dueDate') return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (sortBy === 'progress') return b.progress - a.progress;
      return a.title.localeCompare(b.title);
    });
  }, [milestones, activeFilter, sortBy]);

  const stats = useMemo(() => ({
    total: milestones.length,
    open: milestones.filter(m => m.status === 'open').length,
    inProgress: milestones.filter(m => m.status === 'in-progress').length,
    completed: milestones.filter(m => m.status === 'completed').length,
    overdue: milestones.filter(m => m.status === 'overdue').length,
    avgProgress: milestones.length > 0
      ? Math.round(milestones.reduce((sum, m) => sum + m.progress, 0) / milestones.length)
      : 0,
  }), [milestones]);

  const createMilestone = useCallback((data: Omit<Milestone, 'id' | 'createdAt' | 'updatedAt' | 'progress'>) => {
    contextCreateMilestone({
      title: data.title, description: data.description,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      state: data.status === 'completed' ? 'closed' : 'open',
    });
    setShowCreateModal(false);
  }, [contextCreateMilestone]);

  const updateMilestone = useCallback((id: string, updates: Partial<Milestone>) => {
    contextUpdateMilestone(id, {
      title: updates.title, description: updates.description,
      state: updates.status === 'completed' ? 'closed' : 'open',
    });
  }, [contextUpdateMilestone]);

  const deleteMilestone = useCallback((id: string) => {
    contextDeleteMilestone(id);
    if (selectedMilestone?.id === id) setSelectedMilestoneId(null);
  }, [selectedMilestone, contextDeleteMilestone]);

  const toggleIssue = useCallback((_milestoneId: string, _issueId: string) => {
    console.log('Issue toggle handled by ResearchIssuesContext');
  }, []);

  // ─── Filter bar items ───────────────────────────────────────────────
  const filterItems: { key: 'all' | MilestoneStatus; label: string; count: number; icon: React.ReactNode; colorClass: string; bgClass: string; borderClass: string }[] = [
    { key: 'all', label: 'All', count: stats.total, icon: <MilestoneIcon className="w-3.5 h-3.5" />, colorClass: 'text-muted-foreground', bgClass: 'bg-muted/30', borderClass: 'border-border' },
    { key: 'open', label: 'Open', count: stats.open, ...STATUS_CONFIG['open'] },
    { key: 'in-progress', label: 'In Progress', count: stats.inProgress, ...STATUS_CONFIG['in-progress'] },
    { key: 'completed', label: 'Completed', count: stats.completed, ...STATUS_CONFIG['completed'] },
    { key: 'overdue', label: 'Overdue', count: stats.overdue, ...STATUS_CONFIG['overdue'] },
  ];

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 bg-muted/30 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Target className="w-6 h-6 text-primary" />
          <div>
            <h2 className="m-0 text-base font-semibold text-foreground">
              {t('milestones.title') || 'Research Milestones'}
            </h2>
            <p className="m-0 text-xs text-muted-foreground">
              {stats.total} milestones · {stats.avgProgress}% average progress
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-success border-none rounded-lg text-success-foreground text-[13px] font-medium cursor-pointer flex items-center gap-1.5 hover:opacity-90 transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" />
            New Milestone
          </button>
          {onClose && (
            <button onClick={onClose} className="px-3 py-2 bg-transparent border border-border rounded-lg text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 px-5 py-3 bg-muted/20 border-b border-border flex-wrap">
        {filterItems.map(item => (
          <button
            key={item.key}
            onClick={() => setActiveFilter(item.key)}
            className={`px-3.5 py-1.5 rounded-lg text-[13px] cursor-pointer flex items-center gap-2 border transition-colors
              ${activeFilter === item.key
                ? `${item.bgClass} ${item.borderClass} ${item.colorClass} font-medium`
                : 'bg-transparent border-transparent text-muted-foreground hover:bg-muted/30'
              }`}
          >
            {item.icon}
            {item.label}
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold
              ${activeFilter === item.key ? `${item.bgClass}` : 'bg-muted/50'}`}>
              {item.count}
            </span>
          </button>
        ))}

        <div className="ml-auto">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-1.5 bg-card border border-border rounded-lg text-foreground text-xs cursor-pointer outline-none"
          >
            <option value="dueDate">Sort by Due Date</option>
            <option value="progress">Sort by Progress</option>
            <option value="title">Sort by Title</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto flex">
        {/* Milestones list */}
        <div className={`overflow-auto p-4 flex flex-col gap-3 ${selectedMilestone ? 'w-[400px] flex-shrink-0 border-r border-border' : 'flex-1'}`}>
          {filteredMilestones.map(milestone => {
            const cfg = STATUS_CONFIG[milestone.status];
            const closedIssues = milestone.issues.filter(i => i.status === 'closed').length;
            const isSelected = selectedMilestone?.id === milestone.id;

            return (
              <button
                key={milestone.id}
                onClick={() => setSelectedMilestoneId(milestone.id)}
                className={`w-full text-left p-4 rounded-xl border cursor-pointer transition-all
                  ${isSelected
                    ? 'bg-muted/40 border-primary/40 shadow-sm'
                    : 'bg-card border-border hover:bg-muted/20 hover:border-border'
                  }`}
              >
                {/* Title row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cfg.colorClass}>{cfg.icon}</span>
                      <h3 className="m-0 text-[15px] font-semibold text-foreground truncate">{milestone.title}</h3>
                    </div>
                    {milestone.description && (
                      <p className="m-0 text-[13px] text-muted-foreground leading-relaxed line-clamp-2">{milestone.description}</p>
                    )}
                  </div>
                  <span className={`ml-3 flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold ${cfg.bgClass} ${cfg.colorClass} ${cfg.borderClass} border`}>
                    {cfg.label}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-muted-foreground">
                      {closedIssues}/{milestone.issues.length} issues
                    </span>
                    <span className={`text-xs font-semibold ${cfg.colorClass}`}>{milestone.progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ease-out ${cfg.barClass}`}
                      style={{ width: `${milestone.progress}%` }} />
                  </div>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {formatDate(milestone.dueDate)}
                  </span>
                  <span className={milestone.status === 'overdue' ? 'text-destructive font-medium' : ''}>
                    {getDaysUntil(milestone.dueDate)}
                  </span>
                </div>
              </button>
            );
          })}

          {filteredMilestones.length === 0 && (
            <div className="py-12 text-center">
              <Target className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <div className="text-base font-medium text-foreground mb-1">No milestones found</div>
              <div className="text-sm text-muted-foreground">
                {activeFilter !== 'all' ? 'Try a different filter' : 'Create your first milestone'}
              </div>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selectedMilestone && (
          <div className="flex-1 p-5 overflow-auto">
            <MilestoneDetail
              milestone={selectedMilestone}
              onUpdate={updates => updateMilestone(selectedMilestone.id, updates)}
              onDelete={() => deleteMilestone(selectedMilestone.id)}
              onToggleIssue={issueId => toggleIssue(selectedMilestone.id, issueId)}
              onClose={() => setSelectedMilestoneId(null)}
            />
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreateModal && (
        <CreateMilestoneModal
          onClose={() => setShowCreateModal(false)}
          onCreate={createMilestone}
        />
      )}
    </div>
  );
};

// ─── Milestone Detail ──────────────────────────────────────────────────
interface MilestoneDetailProps {
  milestone: Milestone;
  onUpdate: (updates: Partial<Milestone>) => void;
  onDelete: () => void;
  onToggleIssue: (issueId: string) => void;
  onClose: () => void;
}

const MilestoneDetail: React.FC<MilestoneDetailProps> = ({
  milestone, onUpdate, onDelete, onToggleIssue, onClose,
}) => {
  const [newIssueTitle, setNewIssueTitle] = useState('');
  const cfg = STATUS_CONFIG[milestone.status];
  const closedCount = milestone.issues.filter(i => i.status === 'closed').length;

  const addIssue = () => {
    if (!newIssueTitle.trim()) return;
    onUpdate({ issues: [...milestone.issues, { id: `issue-${Date.now()}`, title: newIssueTitle.trim(), status: 'open' }] });
    setNewIssueTitle('');
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className={cfg.colorClass}>{React.cloneElement(cfg.icon as React.ReactElement, { className: 'w-6 h-6' })}</span>
            <h2 className="m-0 text-xl font-semibold text-foreground">{milestone.title}</h2>
          </div>
          {milestone.description && (
            <p className="m-0 text-sm text-muted-foreground max-w-lg leading-relaxed">{milestone.description}</p>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0 ml-4">
          <button onClick={onDelete}
            className="px-3 py-2 bg-transparent border border-destructive/30 rounded-lg text-destructive text-xs cursor-pointer flex items-center gap-1.5 hover:bg-destructive/10 transition-colors">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
          <button onClick={onClose}
            className="px-3 py-2 bg-transparent border border-border rounded-lg text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Status & Due Date */}
      <div className="flex gap-8 mb-6">
        <div>
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Status</div>
          <select
            value={milestone.status}
            onChange={e => onUpdate({ status: e.target.value as MilestoneStatus })}
            className={`px-3 py-2 rounded-lg text-[13px] font-semibold cursor-pointer outline-none border ${cfg.bgClass} ${cfg.borderClass} ${cfg.colorClass}`}
          >
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div>
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Due Date</div>
          <div className="text-sm text-foreground flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            {formatDate(milestone.dueDate)}
            <span className={milestone.status === 'overdue' ? 'text-destructive font-medium' : 'text-muted-foreground'}>
              ({getDaysUntil(milestone.dueDate)})
            </span>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-foreground">Progress</span>
          <span className={`text-sm font-semibold ${cfg.colorClass}`}>{milestone.progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ease-out ${cfg.barClass}`}
            style={{ width: `${milestone.progress}%` }} />
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground m-0">
          {closedCount} of {milestone.issues.length} issues completed
        </p>
      </div>

      {/* Issues */}
      <div>
        <h3 className="m-0 text-sm font-semibold text-foreground mb-3">
          Issues ({milestone.issues.length})
        </h3>

        {/* Add issue */}
        <div className="flex gap-2 mb-4">
          <input
            value={newIssueTitle}
            onChange={e => setNewIssueTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addIssue()}
            placeholder="Add new issue..."
            className="flex-1 px-3.5 py-2.5 bg-muted/30 border border-border rounded-lg text-foreground text-[13px] outline-none focus:ring-2 focus:ring-ring/30 transition-shadow"
          />
          <button
            onClick={addIssue}
            disabled={!newIssueTitle.trim()}
            className={`px-4 py-2.5 border-none rounded-lg text-[13px] font-medium transition-colors
              ${newIssueTitle.trim()
                ? 'bg-primary text-primary-foreground cursor-pointer hover:opacity-90'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
          >
            Add
          </button>
        </div>

        {/* Issue list */}
        <div className="flex flex-col gap-2">
          {milestone.issues.map(issue => (
            <div key={issue.id}
              className="p-3 bg-muted/20 rounded-lg border border-border flex items-center gap-3">
              <button
                onClick={() => onToggleIssue(issue.id)}
                className={`w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center cursor-pointer p-0 transition-colors
                  ${issue.status === 'closed'
                    ? 'border-success bg-success'
                    : 'border-border bg-transparent hover:border-muted-foreground'
                  }`}
              >
                {issue.status === 'closed' && <Check className="w-3 h-3 text-success-foreground" />}
              </button>
              <span className={`flex-1 text-sm ${issue.status === 'closed' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                {issue.title}
              </span>
              {issue.assignee && (
                <span className="px-2 py-0.5 bg-muted/50 rounded-full text-[11px] text-muted-foreground flex items-center gap-1">
                  <User className="w-3 h-3" /> {issue.assignee}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Create Milestone Modal ────────────────────────────────────────────
interface CreateMilestoneModalProps {
  onClose: () => void;
  onCreate: (data: any) => void;
}

const CreateMilestoneModal: React.FC<CreateMilestoneModalProps> = ({ onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  const canCreate = title.trim() && dueDate;

  const handleCreate = () => {
    if (!canCreate) return;
    onCreate({
      title: title.trim(), description: description.trim(),
      dueDate: new Date(dueDate).toISOString(),
      status: 'open', issues: [], createdBy: 'User',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] backdrop-blur-sm"
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className="w-[450px] bg-card rounded-xl border border-border shadow-2xl overflow-hidden">
        {/* Modal header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="m-0 text-base font-semibold text-foreground flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            New Milestone
          </h3>
          <button onClick={onClose} className="bg-transparent border-none text-muted-foreground cursor-pointer hover:text-foreground transition-colors p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal body */}
        <div className="p-5">
          <div className="mb-4">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Title *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Phase 1: Literature Review"
              className="w-full px-3.5 py-2.5 bg-muted/30 border border-border rounded-lg text-foreground text-sm outline-none focus:ring-2 focus:ring-ring/30 transition-shadow"
            />
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the milestone..."
              rows={3}
              className="w-full px-3.5 py-2.5 bg-muted/30 border border-border rounded-lg text-foreground text-sm resize-y outline-none focus:ring-2 focus:ring-ring/30 transition-shadow"
            />
          </div>

          <div className="mb-5">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Due Date *</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-muted/30 border border-border rounded-lg text-foreground text-sm outline-none focus:ring-2 focus:ring-ring/30 transition-shadow"
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button onClick={onClose}
              className="px-4 py-2.5 bg-transparent border border-border rounded-lg text-muted-foreground text-sm cursor-pointer hover:bg-muted/50 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!canCreate}
              className={`px-5 py-2.5 border-none rounded-lg text-sm font-medium transition-colors
                ${canCreate
                  ? 'bg-success text-success-foreground cursor-pointer hover:opacity-90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
            >
              Create Milestone
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResearchMilestones;
