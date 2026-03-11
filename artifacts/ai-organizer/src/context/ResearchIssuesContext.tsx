/**
 * ResearchIssuesContext - GitHub Issues-style research task management
 * Supports issues with labels, milestones, assignees, and filtering
 * Adapted for academic research: "Open Questions", "Hypotheses to Test", etc.
 */

import React, { useState, useCallback, useEffect, createContext, useContext, useMemo } from "react";

// Issue priority
export type IssuePriority = "critical" | "high" | "medium" | "low";

// Issue state
export type IssueState = "open" | "in-progress" | "review" | "closed";

// Label for categorizing issues
export interface IssueLabel {
  id: string;
  name: string;
  color: string;
  description?: string;
}

// Milestone for grouping issues into phases
export interface Milestone {
  id: string;
  title: string;
  description: string;
  dueDate?: Date;
  createdAt: Date;
  state: "open" | "closed";
  progress: number; // 0-100
}

// Comment on an issue
export interface IssueComment {
  id: string;
  issueId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
}

// Research Issue
export interface ResearchIssue {
  id: string;
  number: number;
  title: string;
  description: string;
  state: IssueState;
  priority: IssuePriority;
  labels: string[]; // label IDs
  milestoneId?: string;
  assignees: string[]; // user IDs
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
  comments: IssueComment[];
  projectId?: string;
  teamId?: string;
  linkedDocumentIds: string[];
  // Kanban column (for project boards)
  columnId?: string;
  columnOrder?: number;
}

// Filter options
export interface IssueFilters {
  state?: IssueState | "all";
  priority?: IssuePriority | "all";
  labelIds?: string[];
  milestoneId?: string;
  assigneeId?: string;
  searchQuery?: string;
  teamId?: string;
  projectId?: string;
}

// Sort options
export type IssueSortField = "created" | "updated" | "priority" | "title";
export type IssueSortDirection = "asc" | "desc";

// Context type
interface ResearchIssuesContextType {
  // Issues
  issues: ResearchIssue[];
  createIssue: (issue: Omit<ResearchIssue, "id" | "number" | "createdAt" | "updatedAt" | "comments">) => ResearchIssue;
  updateIssue: (issueId: string, updates: Partial<ResearchIssue>) => void;
  deleteIssue: (issueId: string) => void;
  getIssue: (issueId: string) => ResearchIssue | undefined;
  closeIssue: (issueId: string) => void;
  reopenIssue: (issueId: string) => void;

  // Comments
  addIssueComment: (issueId: string, userId: string, userName: string, content: string) => void;
  updateIssueComment: (issueId: string, commentId: string, content: string) => void;
  deleteIssueComment: (issueId: string, commentId: string) => void;

  // Labels
  labels: IssueLabel[];
  createLabel: (label: Omit<IssueLabel, "id">) => IssueLabel;
  updateLabel: (labelId: string, updates: Partial<IssueLabel>) => void;
  deleteLabel: (labelId: string) => void;

  // Milestones
  milestones: Milestone[];
  createMilestone: (milestone: Omit<Milestone, "id" | "createdAt" | "progress">) => Milestone;
  updateMilestone: (milestoneId: string, updates: Partial<Milestone>) => void;
  deleteMilestone: (milestoneId: string) => void;
  getMilestoneProgress: (milestoneId: string) => number;

  // Filtering & sorting
  filterIssues: (filters: IssueFilters) => ResearchIssue[];
  sortIssues: (issues: ResearchIssue[], field: IssueSortField, direction: IssueSortDirection) => ResearchIssue[];

  // Stats
  issueStats: {
    total: number;
    open: number;
    inProgress: number;
    review: number;
    closed: number;
  };

  // Kanban helpers
  moveIssueToColumn: (issueId: string, columnId: string, order: number) => void;
  getIssuesByColumn: (columnId: string) => ResearchIssue[];
}

const ResearchIssuesContext = createContext<ResearchIssuesContextType | null>(null);

// Storage keys
const STORAGE_KEYS = {
  issues: "research_issues",
  labels: "research_labels",
  milestones: "research_milestones",
};

// Generate unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Priority order for sorting
const PRIORITY_ORDER: Record<IssuePriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

// Default labels (academic research oriented)
const DEFAULT_LABELS: IssueLabel[] = [
  { id: "lbl-methodology", name: "methodology", color: "#0075ca", description: "Research methodology questions" },
  { id: "lbl-evidence", name: "evidence-needed", color: "#e4e669", description: "Requires additional evidence" },
  { id: "lbl-counter", name: "counter-argument", color: "#d73a4a", description: "Counter-arguments to address" },
  { id: "lbl-replication", name: "replication", color: "#0e8a16", description: "Replication studies needed" },
  { id: "lbl-hypothesis", name: "hypothesis", color: "#5319e7", description: "New hypothesis to test" },
  { id: "lbl-review", name: "peer-review", color: "#fbca04", description: "Needs peer review" },
  { id: "lbl-data", name: "data-collection", color: "#1d76db", description: "Data collection tasks" },
  { id: "lbl-writing", name: "writing", color: "#c5def5", description: "Writing and documentation" },
  { id: "lbl-bug", name: "analysis-error", color: "#d73a4a", description: "Error in analysis" },
  { id: "lbl-enhancement", name: "enhancement", color: "#a2eeef", description: "Improvement suggestion" },
];

// Default milestones
function generateDefaultMilestones(): Milestone[] {
  const now = new Date();
  return [
    {
      id: "ms-discovery",
      title: "Discovery Phase",
      description: "Literature review and initial research questions",
      dueDate: new Date(now.getTime() + 30 * 86400000),
      createdAt: new Date(now.getTime() - 30 * 86400000),
      state: "open",
      progress: 0,
    },
    {
      id: "ms-hypothesis",
      title: "Hypothesis Formation",
      description: "Formulate and refine research hypotheses",
      dueDate: new Date(now.getTime() + 60 * 86400000),
      createdAt: new Date(now.getTime() - 20 * 86400000),
      state: "open",
      progress: 0,
    },
    {
      id: "ms-analysis",
      title: "Data Analysis",
      description: "Analyze collected data and validate hypotheses",
      dueDate: new Date(now.getTime() + 90 * 86400000),
      createdAt: new Date(now.getTime() - 10 * 86400000),
      state: "open",
      progress: 0,
    },
    {
      id: "ms-publication",
      title: "Publication",
      description: "Prepare manuscript for submission",
      dueDate: new Date(now.getTime() + 120 * 86400000),
      createdAt: now,
      state: "open",
      progress: 0,
    },
  ];
}

// Sample issues for demo
function generateSampleIssues(userId: string): ResearchIssue[] {
  const now = new Date();
  let issueNum = 1;

  return [
    {
      id: "issue-1",
      number: issueNum++,
      title: "Review literature on cognitive load theory",
      description: "Conduct a comprehensive review of recent papers (2020-2026) on cognitive load theory and its applications in educational technology.",
      state: "open",
      priority: "high",
      labels: ["lbl-methodology", "lbl-review"],
      milestoneId: "ms-discovery",
      assignees: [userId],
      createdBy: userId,
      createdAt: new Date(now.getTime() - 14 * 86400000),
      updatedAt: new Date(now.getTime() - 2 * 86400000),
      comments: [
        {
          id: "cmt-1",
          issueId: "issue-1",
          userId: "user-2",
          userName: "Dr. Elena Vasquez",
          content: "Focus on papers that discuss dual-channel processing. I recommend starting with Sweller (2020).",
          createdAt: new Date(now.getTime() - 10 * 86400000),
        },
      ],
      linkedDocumentIds: [],
      columnId: "col-todo",
      columnOrder: 0,
    },
    {
      id: "issue-2",
      number: issueNum++,
      title: "Design experiment protocol for memory retention study",
      description: "Create a detailed experimental protocol including participant selection criteria, control variables, and measurement instruments.",
      state: "in-progress",
      priority: "critical",
      labels: ["lbl-methodology", "lbl-data"],
      milestoneId: "ms-hypothesis",
      assignees: [userId, "user-3"],
      createdBy: userId,
      createdAt: new Date(now.getTime() - 10 * 86400000),
      updatedAt: new Date(now.getTime() - 1 * 86400000),
      comments: [],
      linkedDocumentIds: [],
      columnId: "col-inprogress",
      columnOrder: 0,
    },
    {
      id: "issue-3",
      number: issueNum++,
      title: "Address counter-argument: sample size limitations",
      description: "Reviewer #2 raised concerns about our sample size (n=45). Need to either justify the sample size with power analysis or plan additional data collection.",
      state: "open",
      priority: "high",
      labels: ["lbl-counter", "lbl-evidence"],
      milestoneId: "ms-analysis",
      assignees: ["user-2"],
      createdBy: "user-2",
      createdAt: new Date(now.getTime() - 7 * 86400000),
      updatedAt: new Date(now.getTime() - 5 * 86400000),
      comments: [
        {
          id: "cmt-2",
          issueId: "issue-3",
          userId: userId,
          userName: "You",
          content: "I ran a post-hoc power analysis. With our effect size (d=0.6), n=45 gives us 72% power. We should aim for n=60.",
          createdAt: new Date(now.getTime() - 4 * 86400000),
        },
      ],
      linkedDocumentIds: [],
      columnId: "col-todo",
      columnOrder: 1,
    },
    {
      id: "issue-4",
      number: issueNum++,
      title: "Replicate findings from Zhang et al. (2024)",
      description: "Attempt to replicate the key findings from Zhang et al. regarding attention span measurements using our dataset.",
      state: "open",
      priority: "medium",
      labels: ["lbl-replication", "lbl-hypothesis"],
      milestoneId: "ms-analysis",
      assignees: ["user-3"],
      createdBy: "user-3",
      createdAt: new Date(now.getTime() - 5 * 86400000),
      updatedAt: new Date(now.getTime() - 5 * 86400000),
      comments: [],
      linkedDocumentIds: [],
      columnId: "col-todo",
      columnOrder: 2,
    },
    {
      id: "issue-5",
      number: issueNum++,
      title: "Write methodology section for manuscript",
      description: "Draft the methodology section including participants, materials, procedure, and data analysis plan.",
      state: "review",
      priority: "medium",
      labels: ["lbl-writing", "lbl-review"],
      milestoneId: "ms-publication",
      assignees: [userId],
      createdBy: userId,
      createdAt: new Date(now.getTime() - 20 * 86400000),
      updatedAt: new Date(now.getTime() - 1 * 86400000),
      comments: [],
      linkedDocumentIds: [],
      columnId: "col-review",
      columnOrder: 0,
    },
    {
      id: "issue-6",
      number: issueNum++,
      title: "Fix statistical error in Table 3",
      description: "The p-values in Table 3 appear to be calculated incorrectly. Need to re-run the ANOVA with corrected degrees of freedom.",
      state: "closed",
      priority: "critical",
      labels: ["lbl-bug"],
      assignees: [userId],
      createdBy: "user-2",
      createdAt: new Date(now.getTime() - 25 * 86400000),
      updatedAt: new Date(now.getTime() - 15 * 86400000),
      closedAt: new Date(now.getTime() - 15 * 86400000),
      comments: [
        {
          id: "cmt-3",
          issueId: "issue-6",
          userId: userId,
          userName: "You",
          content: "Fixed. The error was in the between-groups df calculation. Updated Table 3 and re-ran all analyses.",
          createdAt: new Date(now.getTime() - 15 * 86400000),
        },
      ],
      linkedDocumentIds: [],
      columnId: "col-done",
      columnOrder: 0,
    },
  ];
}

// Provider props
interface ResearchIssuesProviderProps {
  children: React.ReactNode;
  currentUserId?: string;
}

export const ResearchIssuesProvider: React.FC<ResearchIssuesProviderProps> = ({
  children,
  currentUserId = "user-1",
}) => {
  const [issues, setIssues] = useState<ResearchIssue[]>([]);
  const [labels, setLabels] = useState<IssueLabel[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [nextNumber, setNextNumber] = useState(1);

  // Load from localStorage
  useEffect(() => {
    try {
      const storedIssues = localStorage.getItem(STORAGE_KEYS.issues);
      if (storedIssues) {
        const parsed = JSON.parse(storedIssues);
        const hydrated = parsed.map((i: ResearchIssue) => ({
          ...i,
          createdAt: new Date(i.createdAt),
          updatedAt: new Date(i.updatedAt),
          closedAt: i.closedAt ? new Date(i.closedAt) : undefined,
          comments: i.comments.map((c: IssueComment) => ({
            ...c,
            createdAt: new Date(c.createdAt),
            updatedAt: c.updatedAt ? new Date(c.updatedAt) : undefined,
          })),
        }));
        setIssues(hydrated);
        setNextNumber(Math.max(...hydrated.map((i: ResearchIssue) => i.number), 0) + 1);
      } else {
        const samples = generateSampleIssues(currentUserId);
        setIssues(samples);
        setNextNumber(samples.length + 1);
      }

      const storedLabels = localStorage.getItem(STORAGE_KEYS.labels);
      if (storedLabels) {
        setLabels(JSON.parse(storedLabels));
      } else {
        setLabels(DEFAULT_LABELS);
      }

      const storedMilestones = localStorage.getItem(STORAGE_KEYS.milestones);
      if (storedMilestones) {
        const parsed = JSON.parse(storedMilestones);
        setMilestones(
          parsed.map((m: Milestone) => ({
            ...m,
            dueDate: m.dueDate ? new Date(m.dueDate) : undefined,
            createdAt: new Date(m.createdAt),
          }))
        );
      } else {
        setMilestones(generateDefaultMilestones());
      }
    } catch (error) {
      console.error("Failed to load research issues:", error);
      setIssues(generateSampleIssues(currentUserId));
      setLabels(DEFAULT_LABELS);
      setMilestones(generateDefaultMilestones());
    }
  }, [currentUserId]);

  // Save to localStorage
  useEffect(() => {
    if (issues.length > 0) {
      localStorage.setItem(STORAGE_KEYS.issues, JSON.stringify(issues));
    }
  }, [issues]);

  useEffect(() => {
    if (labels.length > 0) {
      localStorage.setItem(STORAGE_KEYS.labels, JSON.stringify(labels));
    }
  }, [labels]);

  useEffect(() => {
    if (milestones.length > 0) {
      localStorage.setItem(STORAGE_KEYS.milestones, JSON.stringify(milestones));
    }
  }, [milestones]);

  // --- Issues CRUD ---
  const createIssue = useCallback(
    (issue: Omit<ResearchIssue, "id" | "number" | "createdAt" | "updatedAt" | "comments">): ResearchIssue => {
      const now = new Date();
      const newIssue: ResearchIssue = {
        ...issue,
        id: `issue-${generateId()}`,
        number: nextNumber,
        createdAt: now,
        updatedAt: now,
        comments: [],
      };
      setIssues((prev) => [newIssue, ...prev]);
      setNextNumber((n) => n + 1);
      return newIssue;
    },
    [nextNumber]
  );

  const updateIssue = useCallback((issueId: string, updates: Partial<ResearchIssue>) => {
    setIssues((prev) =>
      prev.map((i) =>
        i.id === issueId ? { ...i, ...updates, updatedAt: new Date() } : i
      )
    );
  }, []);

  const deleteIssue = useCallback((issueId: string) => {
    setIssues((prev) => prev.filter((i) => i.id !== issueId));
  }, []);

  const getIssue = useCallback(
    (issueId: string): ResearchIssue | undefined => {
      return issues.find((i) => i.id === issueId);
    },
    [issues]
  );

  const closeIssue = useCallback((issueId: string) => {
    setIssues((prev) =>
      prev.map((i) =>
        i.id === issueId
          ? { ...i, state: "closed" as IssueState, closedAt: new Date(), updatedAt: new Date() }
          : i
      )
    );
  }, []);

  const reopenIssue = useCallback((issueId: string) => {
    setIssues((prev) =>
      prev.map((i) =>
        i.id === issueId
          ? { ...i, state: "open" as IssueState, closedAt: undefined, updatedAt: new Date() }
          : i
      )
    );
  }, []);

  // --- Comments ---
  const addIssueComment = useCallback(
    (issueId: string, userId: string, userName: string, content: string) => {
      const comment: IssueComment = {
        id: `cmt-${generateId()}`,
        issueId,
        userId,
        userName,
        content,
        createdAt: new Date(),
      };
      setIssues((prev) =>
        prev.map((i) =>
          i.id === issueId
            ? { ...i, comments: [...i.comments, comment], updatedAt: new Date() }
            : i
        )
      );
    },
    []
  );

  const updateIssueComment = useCallback(
    (issueId: string, commentId: string, content: string) => {
      setIssues((prev) =>
        prev.map((i) =>
          i.id === issueId
            ? {
                ...i,
                comments: i.comments.map((c) =>
                  c.id === commentId ? { ...c, content, updatedAt: new Date() } : c
                ),
                updatedAt: new Date(),
              }
            : i
        )
      );
    },
    []
  );

  const deleteIssueComment = useCallback((issueId: string, commentId: string) => {
    setIssues((prev) =>
      prev.map((i) =>
        i.id === issueId
          ? { ...i, comments: i.comments.filter((c) => c.id !== commentId), updatedAt: new Date() }
          : i
      )
    );
  }, []);

  // --- Labels ---
  const createLabel = useCallback(
    (label: Omit<IssueLabel, "id">): IssueLabel => {
      const newLabel: IssueLabel = { ...label, id: `lbl-${generateId()}` };
      setLabels((prev) => [...prev, newLabel]);
      return newLabel;
    },
    []
  );

  const updateLabel = useCallback((labelId: string, updates: Partial<IssueLabel>) => {
    setLabels((prev) =>
      prev.map((l) => (l.id === labelId ? { ...l, ...updates } : l))
    );
  }, []);

  const deleteLabel = useCallback((labelId: string) => {
    setLabels((prev) => prev.filter((l) => l.id !== labelId));
    // Remove label from all issues
    setIssues((prev) =>
      prev.map((i) => ({
        ...i,
        labels: i.labels.filter((l) => l !== labelId),
      }))
    );
  }, []);

  // --- Milestones ---
  const createMilestone = useCallback(
    (milestone: Omit<Milestone, "id" | "createdAt" | "progress">): Milestone => {
      const newMilestone: Milestone = {
        ...milestone,
        id: `ms-${generateId()}`,
        createdAt: new Date(),
        progress: 0,
      };
      setMilestones((prev) => [...prev, newMilestone]);
      return newMilestone;
    },
    []
  );

  const updateMilestone = useCallback((milestoneId: string, updates: Partial<Milestone>) => {
    setMilestones((prev) =>
      prev.map((m) => (m.id === milestoneId ? { ...m, ...updates } : m))
    );
  }, []);

  const deleteMilestone = useCallback((milestoneId: string) => {
    setMilestones((prev) => prev.filter((m) => m.id !== milestoneId));
    // Remove milestone from all issues
    setIssues((prev) =>
      prev.map((i) =>
        i.milestoneId === milestoneId ? { ...i, milestoneId: undefined } : i
      )
    );
  }, []);

  const getMilestoneProgress = useCallback(
    (milestoneId: string): number => {
      const msIssues = issues.filter((i) => i.milestoneId === milestoneId);
      if (msIssues.length === 0) return 0;
      const closed = msIssues.filter((i) => i.state === "closed").length;
      return Math.round((closed / msIssues.length) * 100);
    },
    [issues]
  );

  // --- Filtering & Sorting ---
  const filterIssues = useCallback(
    (filters: IssueFilters): ResearchIssue[] => {
      return issues.filter((issue) => {
        if (filters.state && filters.state !== "all" && issue.state !== filters.state) return false;
        if (filters.priority && filters.priority !== "all" && issue.priority !== filters.priority) return false;
        if (filters.labelIds && filters.labelIds.length > 0) {
          if (!filters.labelIds.some((l) => issue.labels.includes(l))) return false;
        }
        if (filters.milestoneId && issue.milestoneId !== filters.milestoneId) return false;
        if (filters.assigneeId && !issue.assignees.includes(filters.assigneeId)) return false;
        if (filters.teamId && issue.teamId !== filters.teamId) return false;
        if (filters.projectId && issue.projectId !== filters.projectId) return false;
        if (filters.searchQuery) {
          const q = filters.searchQuery.toLowerCase();
          if (
            !issue.title.toLowerCase().includes(q) &&
            !issue.description.toLowerCase().includes(q) &&
            !`#${issue.number}`.includes(q)
          ) {
            return false;
          }
        }
        return true;
      });
    },
    [issues]
  );

  const sortIssues = useCallback(
    (issuesToSort: ResearchIssue[], field: IssueSortField, direction: IssueSortDirection): ResearchIssue[] => {
      const sorted = [...issuesToSort].sort((a, b) => {
        let cmp = 0;
        switch (field) {
          case "created":
            cmp = a.createdAt.getTime() - b.createdAt.getTime();
            break;
          case "updated":
            cmp = a.updatedAt.getTime() - b.updatedAt.getTime();
            break;
          case "priority":
            cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
            break;
          case "title":
            cmp = a.title.localeCompare(b.title);
            break;
        }
        return direction === "desc" ? -cmp : cmp;
      });
      return sorted;
    },
    []
  );

  // --- Stats ---
  const issueStats = useMemo(() => {
    return {
      total: issues.length,
      open: issues.filter((i) => i.state === "open").length,
      inProgress: issues.filter((i) => i.state === "in-progress").length,
      review: issues.filter((i) => i.state === "review").length,
      closed: issues.filter((i) => i.state === "closed").length,
    };
  }, [issues]);

  // --- Kanban helpers ---
  const moveIssueToColumn = useCallback((issueId: string, columnId: string, order: number) => {
    setIssues((prev) =>
      prev.map((i) =>
        i.id === issueId
          ? { ...i, columnId, columnOrder: order, updatedAt: new Date() }
          : i
      )
    );
  }, []);

  const getIssuesByColumn = useCallback(
    (columnId: string): ResearchIssue[] => {
      return issues
        .filter((i) => i.columnId === columnId)
        .sort((a, b) => (a.columnOrder || 0) - (b.columnOrder || 0));
    },
    [issues]
  );

  return (
    <ResearchIssuesContext.Provider
      value={{
        issues,
        createIssue,
        updateIssue,
        deleteIssue,
        getIssue,
        closeIssue,
        reopenIssue,
        addIssueComment,
        updateIssueComment,
        deleteIssueComment,
        labels,
        createLabel,
        updateLabel,
        deleteLabel,
        milestones,
        createMilestone,
        updateMilestone,
        deleteMilestone,
        getMilestoneProgress,
        filterIssues,
        sortIssues,
        issueStats,
        moveIssueToColumn,
        getIssuesByColumn,
      }}
    >
      {children}
    </ResearchIssuesContext.Provider>
  );
};

// Hook
export const useResearchIssues = () => {
  const context = useContext(ResearchIssuesContext);
  if (!context) {
    throw new Error("useResearchIssues must be used within ResearchIssuesProvider");
  }
  return context;
};

// Priority display config
export const PRIORITY_CONFIG: Record<IssuePriority, { label: string; labelKey: string; color: string; bg: string; icon: string }> = {
  critical: {
    label: "Critical",
    labelKey: "issue.priority.critical",
    color: "#ef4444",
    bg: "rgba(239, 68, 68, 0.15)",
    icon: "🔴",
  },
  high: {
    label: "High",
    labelKey: "issue.priority.high",
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.15)",
    icon: "🟠",
  },
  medium: {
    label: "Medium",
    labelKey: "issue.priority.medium",
    color: "#3b82f6",
    bg: "rgba(59, 130, 246, 0.15)",
    icon: "🔵",
  },
  low: {
    label: "Low",
    labelKey: "issue.priority.low",
    color: "#6b7280",
    bg: "rgba(107, 114, 128, 0.15)",
    icon: "⚪",
  },
};

// State display config
export const STATE_CONFIG: Record<IssueState, { label: string; labelKey: string; color: string; bg: string; icon: string }> = {
  open: {
    label: "Open",
    labelKey: "issue.state.open",
    color: "#10b981",
    bg: "rgba(16, 185, 129, 0.15)",
    icon: "🟢",
  },
  "in-progress": {
    label: "In Progress",
    labelKey: "issue.state.inProgress",
    color: "#3b82f6",
    bg: "rgba(59, 130, 246, 0.15)",
    icon: "🔄",
  },
  review: {
    label: "In Review",
    labelKey: "issue.state.review",
    color: "#8b5cf6",
    bg: "rgba(139, 92, 246, 0.15)",
    icon: "👁️",
  },
  closed: {
    label: "Closed",
    labelKey: "issue.state.closed",
    color: "#6b7280",
    bg: "rgba(107, 114, 128, 0.15)",
    icon: "✅",
  },
};

export default ResearchIssuesProvider;
