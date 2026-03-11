/**
 * TheoryBranchingContext — Git-like branching & merging for theories
 * 
 * Provides branches, commits, merge operations, cherry-pick, tags/releases,
 * and conflict detection. Integrates with existing TheoryVersionManager data.
 * Uses localStorage for persistence.
 */

import React, { useState, useCallback, useEffect, createContext, useContext, useMemo } from "react";

// ─── Types ───────────────────────────────────────────────────────────

export type BranchStatus = "active" | "merged" | "abandoned" | "protected";

export interface TheoryCommit {
  id: string;
  branchId: string;
  parentId: string | null;
  message: string;
  description: string;
  author: string;
  timestamp: number;
  /** Snapshot of the theory content at this commit */
  snapshot: {
    title: string;
    content: string;
    claims: string[];
    assumptions: string[];
    evidence: string[];
  };
  /** Changed fields relative to parent */
  changedFields: string[];
  tags: string[];
}

export interface TheoryBranch {
  id: string;
  name: string;
  description: string;
  status: BranchStatus;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  /** The commit this branch was forked from */
  forkPointCommitId: string | null;
  /** The latest commit on this branch */
  headCommitId: string | null;
  /** Color for UI display */
  color: string;
  /** Whether this is the default/main branch */
  isDefault: boolean;
}

export interface MergeConflict {
  field: string;
  sourceValue: string;
  targetValue: string;
  resolution: "source" | "target" | "manual" | null;
  manualValue?: string;
}

export interface MergeRequest {
  id: string;
  sourceBranchId: string;
  targetBranchId: string;
  title: string;
  description: string;
  author: string;
  status: "open" | "merged" | "closed" | "conflict";
  createdAt: number;
  updatedAt: number;
  conflicts: MergeConflict[];
  reviewers: string[];
  comments: MergeComment[];
}

export interface MergeComment {
  id: string;
  author: string;
  content: string;
  timestamp: number;
}

export interface TheoryTag {
  id: string;
  name: string;
  commitId: string;
  branchId: string;
  description: string;
  createdAt: number;
  createdBy: string;
  /** Semantic version e.g. "v1.0.0" */
  version?: string;
  /** Release notes */
  releaseNotes?: string;
}

// ─── Context Type ────────────────────────────────────────────────────

interface TheoryBranchingContextType {
  // Branches
  branches: TheoryBranch[];
  createBranch: (name: string, description: string, forkFromCommitId?: string | null) => TheoryBranch;
  updateBranch: (id: string, updates: Partial<TheoryBranch>) => void;
  deleteBranch: (id: string) => void;
  getActiveBranch: () => TheoryBranch | null;
  setActiveBranch: (id: string) => void;
  activeBranchId: string | null;

  // Commits
  commits: TheoryCommit[];
  createCommit: (branchId: string, message: string, description: string, snapshot: TheoryCommit["snapshot"]) => TheoryCommit;
  getCommitsForBranch: (branchId: string) => TheoryCommit[];
  getCommit: (id: string) => TheoryCommit | null;
  cherryPick: (commitId: string, targetBranchId: string) => TheoryCommit | null;

  // Merge
  mergeRequests: MergeRequest[];
  createMergeRequest: (sourceBranchId: string, targetBranchId: string, title: string, description: string) => MergeRequest;
  updateMergeRequest: (id: string, updates: Partial<MergeRequest>) => void;
  detectConflicts: (sourceBranchId: string, targetBranchId: string) => MergeConflict[];
  executeMerge: (mergeRequestId: string) => boolean;
  closeMergeRequest: (id: string) => void;
  addMergeComment: (mergeRequestId: string, content: string) => void;

  // Tags / Releases
  tags: TheoryTag[];
  createTag: (name: string, commitId: string, branchId: string, description: string, version?: string, releaseNotes?: string) => TheoryTag;
  deleteTag: (id: string) => void;

  // Diff
  diffCommits: (commitId1: string, commitId2: string) => CommitDiff | null;

  // Stats
  stats: {
    totalBranches: number;
    activeBranches: number;
    totalCommits: number;
    totalMerges: number;
    openMergeRequests: number;
    totalTags: number;
  };
}

export interface CommitDiff {
  additions: string[];
  deletions: string[];
  modifications: Array<{ field: string; from: string; to: string }>;
  summary: string;
}

// ─── Constants ───────────────────────────────────────────────────────

const STORAGE_KEYS = {
  branches: "theory_branches",
  commits: "theory_commits",
  mergeRequests: "theory_merge_requests",
  tags: "theory_tags",
  activeBranch: "theory_active_branch",
};

const BRANCH_COLORS = [
  "#6366f1", "#10b981", "#f59e0b", "#ef4444", "#06b6d4",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#84cc16",
];

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ─── Sample Data ─────────────────────────────────────────────────────

function createSampleData(): {
  branches: TheoryBranch[];
  commits: TheoryCommit[];
  mergeRequests: MergeRequest[];
  tags: TheoryTag[];
} {
  const now = Date.now();
  const day = 86400000;

  const mainBranch: TheoryBranch = {
    id: "branch-main",
    name: "main",
    description: "Primary theory formulation — stable, peer-reviewed claims",
    status: "active",
    createdAt: now - 30 * day,
    updatedAt: now - 2 * day,
    createdBy: "user-1",
    forkPointCommitId: null,
    headCommitId: "commit-3",
    color: "#6366f1",
    isDefault: true,
  };

  const hypothesisBranch: TheoryBranch = {
    id: "branch-hypothesis",
    name: "hypothesis/quantum-effects",
    description: "Exploring quantum effects on cognitive processing — experimental",
    status: "active",
    createdAt: now - 10 * day,
    updatedAt: now - 1 * day,
    createdBy: "user-1",
    forkPointCommitId: "commit-2",
    headCommitId: "commit-5",
    color: "#10b981",
    isDefault: false,
  };

  const revisionBranch: TheoryBranch = {
    id: "branch-revision",
    name: "revision/methodology-update",
    description: "Updating methodology section based on reviewer feedback",
    status: "active",
    createdAt: now - 5 * day,
    updatedAt: now - 1 * day,
    createdBy: "user-2",
    forkPointCommitId: "commit-3",
    headCommitId: "commit-7",
    color: "#f59e0b",
    isDefault: false,
  };

  const commits: TheoryCommit[] = [
    {
      id: "commit-1",
      branchId: "branch-main",
      parentId: null,
      message: "Initial theory formulation",
      description: "Established core claims and foundational assumptions",
      author: "Dr. Elena Vasquez",
      timestamp: now - 30 * day,
      snapshot: {
        title: "Cognitive Load Theory — Extended Model",
        content: "This theory proposes that cognitive processing capacity is fundamentally limited by working memory constraints, and that instructional design must account for intrinsic, extraneous, and germane cognitive load.",
        claims: ["Working memory has a finite capacity of 7±2 chunks", "Cognitive load is additive across types"],
        assumptions: ["Information processing follows a dual-channel model", "Long-term memory has effectively unlimited capacity"],
        evidence: ["Miller (1956) — Magic number 7", "Sweller (1988) — Cognitive load theory"],
      },
      changedFields: ["title", "content", "claims", "assumptions", "evidence"],
      tags: ["initial"],
    },
    {
      id: "commit-2",
      branchId: "branch-main",
      parentId: "commit-1",
      message: "Add evidence for dual-process theory integration",
      description: "Incorporated Kahneman's System 1/System 2 framework",
      author: "Dr. Elena Vasquez",
      timestamp: now - 20 * day,
      snapshot: {
        title: "Cognitive Load Theory — Extended Model",
        content: "This theory proposes that cognitive processing capacity is fundamentally limited by working memory constraints. We integrate dual-process theory (Kahneman, 2011) to distinguish between automatic (System 1) and deliberate (System 2) processing pathways.",
        claims: ["Working memory has a finite capacity of 7±2 chunks", "Cognitive load is additive across types", "System 1 processing bypasses working memory constraints"],
        assumptions: ["Information processing follows a dual-channel model", "Long-term memory has effectively unlimited capacity", "Automaticity reduces cognitive load"],
        evidence: ["Miller (1956) — Magic number 7", "Sweller (1988) — Cognitive load theory", "Kahneman (2011) — Thinking, Fast and Slow"],
      },
      changedFields: ["content", "claims", "assumptions", "evidence"],
      tags: [],
    },
    {
      id: "commit-3",
      branchId: "branch-main",
      parentId: "commit-2",
      message: "Refine scope and add boundary conditions",
      description: "Clarified the theory's applicability domain",
      author: "Prof. Marcus Chen",
      timestamp: now - 10 * day,
      snapshot: {
        title: "Cognitive Load Theory — Extended Model v2",
        content: "This theory proposes that cognitive processing capacity is fundamentally limited by working memory constraints. We integrate dual-process theory (Kahneman, 2011) to distinguish between automatic and deliberate processing. Boundary conditions: applies primarily to instructional contexts with novice-to-intermediate learners.",
        claims: ["Working memory has a finite capacity of 7±2 chunks", "Cognitive load is additive across types", "System 1 processing bypasses working memory constraints", "Theory applies primarily to instructional contexts"],
        assumptions: ["Information processing follows a dual-channel model", "Long-term memory has effectively unlimited capacity", "Automaticity reduces cognitive load"],
        evidence: ["Miller (1956) — Magic number 7", "Sweller (1988) — Cognitive load theory", "Kahneman (2011) — Thinking, Fast and Slow", "Paas & van Merriënboer (2020) — Boundary conditions"],
      },
      changedFields: ["title", "content", "claims", "evidence"],
      tags: ["v1.0"],
    },
    {
      id: "commit-4",
      branchId: "branch-hypothesis",
      parentId: "commit-2",
      message: "Propose quantum cognition hypothesis",
      description: "Exploring whether quantum probability models better explain decision-making under uncertainty",
      author: "Dr. Elena Vasquez",
      timestamp: now - 8 * day,
      snapshot: {
        title: "Cognitive Load Theory — Quantum Extension",
        content: "Building on the extended model, we propose that quantum probability theory may better explain certain cognitive phenomena, particularly conjunction fallacy and order effects in judgment.",
        claims: ["Working memory has a finite capacity of 7±2 chunks", "Cognitive load is additive across types", "System 1 processing bypasses working memory constraints", "Quantum probability models explain conjunction fallacy"],
        assumptions: ["Information processing follows a dual-channel model", "Cognitive states can be modeled as quantum superpositions"],
        evidence: ["Miller (1956)", "Busemeyer & Bruza (2012) — Quantum Models of Cognition"],
      },
      changedFields: ["title", "content", "claims", "assumptions", "evidence"],
      tags: [],
    },
    {
      id: "commit-5",
      branchId: "branch-hypothesis",
      parentId: "commit-4",
      message: "Add experimental predictions",
      description: "Defined testable predictions for quantum cognition hypothesis",
      author: "Dr. Elena Vasquez",
      timestamp: now - 3 * day,
      snapshot: {
        title: "Cognitive Load Theory — Quantum Extension",
        content: "Building on the extended model, we propose quantum probability models for cognition. Testable prediction: order effects in sequential judgments should follow quantum interference patterns rather than classical Bayesian updating.",
        claims: ["Working memory has a finite capacity of 7±2 chunks", "Cognitive load is additive across types", "System 1 processing bypasses working memory constraints", "Quantum probability models explain conjunction fallacy", "Order effects follow quantum interference patterns"],
        assumptions: ["Information processing follows a dual-channel model", "Cognitive states can be modeled as quantum superpositions"],
        evidence: ["Miller (1956)", "Busemeyer & Bruza (2012)", "Wang et al. (2014) — Order effects"],
      },
      changedFields: ["content", "claims", "evidence"],
      tags: [],
    },
    {
      id: "commit-6",
      branchId: "branch-revision",
      parentId: "commit-3",
      message: "Update methodology section",
      description: "Revised methodology based on peer review feedback",
      author: "Prof. Marcus Chen",
      timestamp: now - 4 * day,
      snapshot: {
        title: "Cognitive Load Theory — Extended Model v2",
        content: "This theory proposes that cognitive processing capacity is fundamentally limited by working memory constraints. Methodology: We employ a mixed-methods approach combining eye-tracking, fMRI, and think-aloud protocols to measure cognitive load across conditions.",
        claims: ["Working memory has a finite capacity of 7±2 chunks", "Cognitive load is additive across types", "System 1 processing bypasses working memory constraints", "Theory applies primarily to instructional contexts"],
        assumptions: ["Information processing follows a dual-channel model", "Long-term memory has effectively unlimited capacity", "Automaticity reduces cognitive load", "Mixed-methods approach provides convergent validity"],
        evidence: ["Miller (1956)", "Sweller (1988)", "Kahneman (2011)", "Paas & van Merriënboer (2020)", "Reviewer feedback — methodology concerns"],
      },
      changedFields: ["content", "assumptions", "evidence"],
      tags: [],
    },
    {
      id: "commit-7",
      branchId: "branch-revision",
      parentId: "commit-6",
      message: "Add statistical analysis plan",
      description: "Defined pre-registered statistical analysis approach",
      author: "Prof. Marcus Chen",
      timestamp: now - 2 * day,
      snapshot: {
        title: "Cognitive Load Theory — Extended Model v2",
        content: "This theory proposes that cognitive processing capacity is fundamentally limited by working memory constraints. Methodology: Mixed-methods approach. Statistical plan: Bayesian hierarchical models with pre-registered hypotheses and stopping rules.",
        claims: ["Working memory has a finite capacity of 7±2 chunks", "Cognitive load is additive across types", "System 1 processing bypasses working memory constraints", "Theory applies primarily to instructional contexts", "Bayesian analysis preferred over frequentist for theory comparison"],
        assumptions: ["Information processing follows a dual-channel model", "Long-term memory has effectively unlimited capacity", "Automaticity reduces cognitive load", "Mixed-methods approach provides convergent validity"],
        evidence: ["Miller (1956)", "Sweller (1988)", "Kahneman (2011)", "Paas & van Merriënboer (2020)", "Kruschke (2014) — Bayesian analysis"],
      },
      changedFields: ["content", "claims", "evidence"],
      tags: [],
    },
  ];

  const mergeRequests: MergeRequest[] = [
    {
      id: "mr-1",
      sourceBranchId: "branch-revision",
      targetBranchId: "branch-main",
      title: "Merge methodology updates into main",
      description: "Incorporates reviewer feedback on methodology and adds pre-registered statistical analysis plan",
      author: "Prof. Marcus Chen",
      status: "open",
      createdAt: now - 1 * day,
      updatedAt: now - 1 * day,
      conflicts: [],
      reviewers: ["Dr. Elena Vasquez"],
      comments: [
        {
          id: "mc-1",
          author: "Dr. Elena Vasquez",
          content: "The Bayesian analysis approach looks solid. I'd suggest also including sensitivity analyses.",
          timestamp: now - 12 * 3600000,
        },
      ],
    },
  ];

  const tags: TheoryTag[] = [
    {
      id: "tag-1",
      name: "v1.0.0",
      commitId: "commit-3",
      branchId: "branch-main",
      description: "First stable release of the Extended Cognitive Load Theory",
      createdAt: now - 10 * day,
      createdBy: "Dr. Elena Vasquez",
      version: "v1.0.0",
      releaseNotes: "Initial stable formulation with dual-process integration and boundary conditions defined.",
    },
  ];

  return { branches: [mainBranch, hypothesisBranch, revisionBranch], commits, mergeRequests, tags };
}

// ─── Helpers ─────────────────────────────────────────────────────────

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

// ─── Context ─────────────────────────────────────────────────────────

const TheoryBranchingContext = createContext<TheoryBranchingContextType | null>(null);

interface TheoryBranchingProviderProps {
  children: React.ReactNode;
  currentUserId?: string;
  currentUserName?: string;
}

export const TheoryBranchingProvider: React.FC<TheoryBranchingProviderProps> = ({
  children,
  currentUserId = "user-1",
  currentUserName = "Dr. Elena Vasquez",
}) => {
  // Initialize with sample data if empty
  const [branches, setBranches] = useState<TheoryBranch[]>(() => {
    const stored = loadFromStorage<TheoryBranch[]>(STORAGE_KEYS.branches, []);
    if (stored.length === 0) {
      const sample = createSampleData();
      saveToStorage(STORAGE_KEYS.branches, sample.branches);
      saveToStorage(STORAGE_KEYS.commits, sample.commits);
      saveToStorage(STORAGE_KEYS.mergeRequests, sample.mergeRequests);
      saveToStorage(STORAGE_KEYS.tags, sample.tags);
      return sample.branches;
    }
    return stored;
  });

  const [commits, setCommits] = useState<TheoryCommit[]>(() =>
    loadFromStorage<TheoryCommit[]>(STORAGE_KEYS.commits, [])
  );

  const [mergeRequests, setMergeRequests] = useState<MergeRequest[]>(() =>
    loadFromStorage<MergeRequest[]>(STORAGE_KEYS.mergeRequests, [])
  );

  const [tags, setTags] = useState<TheoryTag[]>(() =>
    loadFromStorage<TheoryTag[]>(STORAGE_KEYS.tags, [])
  );

  const [activeBranchId, setActiveBranchIdState] = useState<string | null>(() =>
    loadFromStorage<string | null>(STORAGE_KEYS.activeBranch, "branch-main")
  );

  // Persist on change
  useEffect(() => { saveToStorage(STORAGE_KEYS.branches, branches); }, [branches]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.commits, commits); }, [commits]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.mergeRequests, mergeRequests); }, [mergeRequests]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.tags, tags); }, [tags]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.activeBranch, activeBranchId); }, [activeBranchId]);

  // ─── Branch Operations ───────────────────────────────────────────

  const createBranch = useCallback(
    (name: string, description: string, forkFromCommitId?: string | null): TheoryBranch => {
      const colorIdx = branches.length % BRANCH_COLORS.length;
      const branch: TheoryBranch = {
        id: `branch-${generateId()}`,
        name,
        description,
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: currentUserId,
        forkPointCommitId: forkFromCommitId || null,
        headCommitId: forkFromCommitId || null,
        color: BRANCH_COLORS[colorIdx],
        isDefault: false,
      };
      setBranches((prev) => [...prev, branch]);
      return branch;
    },
    [branches.length, currentUserId]
  );

  const updateBranch = useCallback((id: string, updates: Partial<TheoryBranch>) => {
    setBranches((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates, updatedAt: Date.now() } : b))
    );
  }, []);

  const deleteBranch = useCallback(
    (id: string) => {
      const branch = branches.find((b) => b.id === id);
      if (branch?.isDefault) return; // Cannot delete default branch
      setBranches((prev) => prev.filter((b) => b.id !== id));
      if (activeBranchId === id) {
        const defaultBranch = branches.find((b) => b.isDefault);
        setActiveBranchIdState(defaultBranch?.id || null);
      }
    },
    [branches, activeBranchId]
  );

  const getActiveBranch = useCallback((): TheoryBranch | null => {
    return branches.find((b) => b.id === activeBranchId) || null;
  }, [branches, activeBranchId]);

  const setActiveBranch = useCallback((id: string) => {
    setActiveBranchIdState(id);
  }, []);

  // ─── Commit Operations ───────────────────────────────────────────

  const createCommit = useCallback(
    (branchId: string, message: string, description: string, snapshot: TheoryCommit["snapshot"]): TheoryCommit => {
      const branch = branches.find((b) => b.id === branchId);
      const parentId = branch?.headCommitId || null;

      // Determine changed fields
      const parentCommit = parentId ? commits.find((c) => c.id === parentId) : null;
      const changedFields: string[] = [];
      if (parentCommit) {
        const ps = parentCommit.snapshot;
        if (ps.title !== snapshot.title) changedFields.push("title");
        if (ps.content !== snapshot.content) changedFields.push("content");
        if (JSON.stringify(ps.claims) !== JSON.stringify(snapshot.claims)) changedFields.push("claims");
        if (JSON.stringify(ps.assumptions) !== JSON.stringify(snapshot.assumptions)) changedFields.push("assumptions");
        if (JSON.stringify(ps.evidence) !== JSON.stringify(snapshot.evidence)) changedFields.push("evidence");
      } else {
        changedFields.push("title", "content", "claims", "assumptions", "evidence");
      }

      const commit: TheoryCommit = {
        id: `commit-${generateId()}`,
        branchId,
        parentId,
        message,
        description,
        author: currentUserName,
        timestamp: Date.now(),
        snapshot,
        changedFields,
        tags: [],
      };

      setCommits((prev) => [...prev, commit]);
      updateBranch(branchId, { headCommitId: commit.id });
      return commit;
    },
    [branches, commits, currentUserName, updateBranch]
  );

  const getCommitsForBranch = useCallback(
    (branchId: string): TheoryCommit[] => {
      return commits
        .filter((c) => c.branchId === branchId)
        .sort((a, b) => b.timestamp - a.timestamp);
    },
    [commits]
  );

  const getCommit = useCallback(
    (id: string): TheoryCommit | null => {
      return commits.find((c) => c.id === id) || null;
    },
    [commits]
  );

  const cherryPick = useCallback(
    (commitId: string, targetBranchId: string): TheoryCommit | null => {
      const sourceCommit = commits.find((c) => c.id === commitId);
      if (!sourceCommit) return null;

      const newCommit = createCommit(
        targetBranchId,
        `Cherry-pick: ${sourceCommit.message}`,
        `Cherry-picked from ${sourceCommit.branchId}: ${sourceCommit.description}`,
        { ...sourceCommit.snapshot }
      );
      return newCommit;
    },
    [commits, createCommit]
  );

  // ─── Merge Operations ────────────────────────────────────────────

  const detectConflicts = useCallback(
    (sourceBranchId: string, targetBranchId: string): MergeConflict[] => {
      const sourceBranch = branches.find((b) => b.id === sourceBranchId);
      const targetBranch = branches.find((b) => b.id === targetBranchId);
      if (!sourceBranch?.headCommitId || !targetBranch?.headCommitId) return [];

      const sourceHead = commits.find((c) => c.id === sourceBranch.headCommitId);
      const targetHead = commits.find((c) => c.id === targetBranch.headCommitId);
      if (!sourceHead || !targetHead) return [];

      const conflicts: MergeConflict[] = [];
      const fields: (keyof TheoryCommit["snapshot"])[] = ["title", "content", "claims", "assumptions", "evidence"];

      for (const field of fields) {
        const sv = JSON.stringify(sourceHead.snapshot[field]);
        const tv = JSON.stringify(targetHead.snapshot[field]);
        if (sv !== tv) {
          // Check if source actually changed this field from the fork point
          const forkCommit = sourceBranch.forkPointCommitId
            ? commits.find((c) => c.id === sourceBranch.forkPointCommitId)
            : null;
          const forkValue = forkCommit ? JSON.stringify(forkCommit.snapshot[field]) : null;

          // Conflict only if both branches changed the same field from the fork point
          if (forkValue && sv !== forkValue && tv !== forkValue) {
            conflicts.push({
              field,
              sourceValue: typeof sourceHead.snapshot[field] === "string"
                ? (sourceHead.snapshot[field] as string)
                : JSON.stringify(sourceHead.snapshot[field]),
              targetValue: typeof targetHead.snapshot[field] === "string"
                ? (targetHead.snapshot[field] as string)
                : JSON.stringify(targetHead.snapshot[field]),
              resolution: null,
            });
          }
        }
      }

      return conflicts;
    },
    [branches, commits]
  );

  const createMergeRequest = useCallback(
    (sourceBranchId: string, targetBranchId: string, title: string, description: string): MergeRequest => {
      const conflicts = detectConflicts(sourceBranchId, targetBranchId);
      const mr: MergeRequest = {
        id: `mr-${generateId()}`,
        sourceBranchId,
        targetBranchId,
        title,
        description,
        author: currentUserName,
        status: conflicts.length > 0 ? "conflict" : "open",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        conflicts,
        reviewers: [],
        comments: [],
      };
      setMergeRequests((prev) => [...prev, mr]);
      return mr;
    },
    [currentUserName, detectConflicts]
  );

  const updateMergeRequest = useCallback((id: string, updates: Partial<MergeRequest>) => {
    setMergeRequests((prev) =>
      prev.map((mr) => (mr.id === id ? { ...mr, ...updates, updatedAt: Date.now() } : mr))
    );
  }, []);

  const executeMerge = useCallback(
    (mergeRequestId: string): boolean => {
      const mr = mergeRequests.find((m) => m.id === mergeRequestId);
      if (!mr) return false;

      // Check all conflicts are resolved
      if (mr.conflicts.some((c) => c.resolution === null)) return false;

      const sourceBranch = branches.find((b) => b.id === mr.sourceBranchId);
      const targetBranch = branches.find((b) => b.id === mr.targetBranchId);
      if (!sourceBranch?.headCommitId || !targetBranch?.headCommitId) return false;

      const sourceHead = commits.find((c) => c.id === sourceBranch.headCommitId);
      const targetHead = commits.find((c) => c.id === targetBranch.headCommitId);
      if (!sourceHead || !targetHead) return false;

      // Build merged snapshot
      const mergedSnapshot = { ...targetHead.snapshot };
      for (const conflict of mr.conflicts) {
        const field = conflict.field as keyof TheoryCommit["snapshot"];
        if (conflict.resolution === "source") {
          (mergedSnapshot as Record<string, unknown>)[field] = sourceHead.snapshot[field];
        } else if (conflict.resolution === "manual" && conflict.manualValue) {
          try {
            (mergedSnapshot as Record<string, unknown>)[field] = JSON.parse(conflict.manualValue);
          } catch {
            (mergedSnapshot as Record<string, unknown>)[field] = conflict.manualValue;
          }
        }
        // "target" keeps the existing value
      }

      // For non-conflicting fields that source changed, apply them
      const forkCommit = sourceBranch.forkPointCommitId
        ? commits.find((c) => c.id === sourceBranch.forkPointCommitId)
        : null;
      if (forkCommit) {
        const fields: (keyof TheoryCommit["snapshot"])[] = ["title", "content", "claims", "assumptions", "evidence"];
        for (const field of fields) {
          if (!mr.conflicts.some((c) => c.field === field)) {
            const forkVal = JSON.stringify(forkCommit.snapshot[field]);
            const sourceVal = JSON.stringify(sourceHead.snapshot[field]);
            if (forkVal !== sourceVal) {
              (mergedSnapshot as Record<string, unknown>)[field] = sourceHead.snapshot[field];
            }
          }
        }
      }

      // Create merge commit
      createCommit(
        mr.targetBranchId,
        `Merge '${sourceBranch.name}' into '${targetBranch.name}'`,
        mr.description,
        mergedSnapshot
      );

      // Update merge request status
      updateMergeRequest(mr.id, { status: "merged" });

      // Mark source branch as merged
      updateBranch(mr.sourceBranchId, { status: "merged" });

      return true;
    },
    [mergeRequests, branches, commits, createCommit, updateMergeRequest, updateBranch]
  );

  const closeMergeRequest = useCallback(
    (id: string) => {
      updateMergeRequest(id, { status: "closed" });
    },
    [updateMergeRequest]
  );

  const addMergeComment = useCallback(
    (mergeRequestId: string, content: string) => {
      setMergeRequests((prev) =>
        prev.map((mr) =>
          mr.id === mergeRequestId
            ? {
                ...mr,
                comments: [
                  ...mr.comments,
                  { id: generateId(), author: currentUserName, content, timestamp: Date.now() },
                ],
                updatedAt: Date.now(),
              }
            : mr
        )
      );
    },
    [currentUserName]
  );

  // ─── Tags / Releases ─────────────────────────────────────────────

  const createTag = useCallback(
    (name: string, commitId: string, branchId: string, description: string, version?: string, releaseNotes?: string): TheoryTag => {
      const tag: TheoryTag = {
        id: `tag-${generateId()}`,
        name,
        commitId,
        branchId,
        description,
        createdAt: Date.now(),
        createdBy: currentUserName,
        version,
        releaseNotes,
      };
      setTags((prev) => [...prev, tag]);
      return tag;
    },
    [currentUserName]
  );

  const deleteTag = useCallback((id: string) => {
    setTags((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ─── Diff ─────────────────────────────────────────────────────────

  const diffCommits = useCallback(
    (commitId1: string, commitId2: string): CommitDiff | null => {
      const c1 = commits.find((c) => c.id === commitId1);
      const c2 = commits.find((c) => c.id === commitId2);
      if (!c1 || !c2) return null;

      const additions: string[] = [];
      const deletions: string[] = [];
      const modifications: Array<{ field: string; from: string; to: string }> = [];

      const fields: (keyof TheoryCommit["snapshot"])[] = ["title", "content", "claims", "assumptions", "evidence"];
      for (const field of fields) {
        const v1 = JSON.stringify(c1.snapshot[field]);
        const v2 = JSON.stringify(c2.snapshot[field]);
        if (v1 !== v2) {
          if (Array.isArray(c1.snapshot[field]) && Array.isArray(c2.snapshot[field])) {
            const arr1 = c1.snapshot[field] as string[];
            const arr2 = c2.snapshot[field] as string[];
            const added = arr2.filter((item) => !arr1.includes(item));
            const removed = arr1.filter((item) => !arr2.includes(item));
            added.forEach((a) => additions.push(`${field}: + ${a}`));
            removed.forEach((r) => deletions.push(`${field}: - ${r}`));
          } else {
            modifications.push({
              field,
              from: typeof c1.snapshot[field] === "string" ? (c1.snapshot[field] as string) : v1,
              to: typeof c2.snapshot[field] === "string" ? (c2.snapshot[field] as string) : v2,
            });
          }
        }
      }

      return {
        additions,
        deletions,
        modifications,
        summary: `${additions.length} additions, ${deletions.length} deletions, ${modifications.length} modifications`,
      };
    },
    [commits]
  );

  // ─── Stats ────────────────────────────────────────────────────────

  const stats = useMemo(
    () => ({
      totalBranches: branches.length,
      activeBranches: branches.filter((b) => b.status === "active").length,
      totalCommits: commits.length,
      totalMerges: mergeRequests.filter((mr) => mr.status === "merged").length,
      openMergeRequests: mergeRequests.filter((mr) => mr.status === "open" || mr.status === "conflict").length,
      totalTags: tags.length,
    }),
    [branches, commits, mergeRequests, tags]
  );

  // ─── Context Value ────────────────────────────────────────────────

  const value: TheoryBranchingContextType = useMemo(
    () => ({
      branches,
      createBranch,
      updateBranch,
      deleteBranch,
      getActiveBranch,
      setActiveBranch,
      activeBranchId,
      commits,
      createCommit,
      getCommitsForBranch,
      getCommit,
      cherryPick,
      mergeRequests,
      createMergeRequest,
      updateMergeRequest,
      detectConflicts,
      executeMerge,
      closeMergeRequest,
      addMergeComment,
      tags,
      createTag,
      deleteTag,
      diffCommits,
      stats,
    }),
    [
      branches, createBranch, updateBranch, deleteBranch, getActiveBranch, setActiveBranch, activeBranchId,
      commits, createCommit, getCommitsForBranch, getCommit, cherryPick,
      mergeRequests, createMergeRequest, updateMergeRequest, detectConflicts, executeMerge, closeMergeRequest, addMergeComment,
      tags, createTag, deleteTag,
      diffCommits, stats,
    ]
  );

  return (
    <TheoryBranchingContext.Provider value={value}>
      {children}
    </TheoryBranchingContext.Provider>
  );
};

export const useTheoryBranching = () => {
  const context = useContext(TheoryBranchingContext);
  if (!context) {
    throw new Error("useTheoryBranching must be used within a TheoryBranchingProvider");
  }
  return context;
};

// ─── Config exports for UI ──────────────────────────────────────────

export const BRANCH_STATUS_CONFIG: Record<BranchStatus, { label: string; color: string; icon: string }> = {
  active: { label: "Active", color: "#10b981", icon: "🟢" },
  merged: { label: "Merged", color: "#8b5cf6", icon: "🔀" },
  abandoned: { label: "Abandoned", color: "#6b7280", icon: "🗑" },
  protected: { label: "Protected", color: "#f59e0b", icon: "🔒" },
};

export const MERGE_STATUS_CONFIG: Record<MergeRequest["status"], { label: string; color: string; icon: string }> = {
  open: { label: "Open", color: "#10b981", icon: "🟢" },
  merged: { label: "Merged", color: "#8b5cf6", icon: "🔀" },
  closed: { label: "Closed", color: "#ef4444", icon: "🔴" },
  conflict: { label: "Conflict", color: "#f59e0b", icon: "⚠️" },
};
