/**
 * TheoryRepoPage — GitHub Repository-style overview for theories
 * Shows branches, commit history, tags/releases, merge requests, and README-like theory content
 * Similar to a GitHub repo landing page but for academic theory development
 */

import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useTheoryBranching } from "../context/TheoryBranchingContext";
import type { TheoryBranch, TheoryCommit, MergeRequest, TheoryTag } from "../context/TheoryBranchingContext";
import { PageShell } from "../components/layout/PageShell";
import { useIsMobile } from "../hooks/useMediaQuery";

// ─── Types ───────────────────────────────────────────────────
type RepoTab = "code" | "issues" | "actions" | "commits" | "branches" | "merges" | "tags" | "discussions";
type DiscussionCategory = "general" | "ideas" | "qa" | "announcements";
type DiscussionStatus = "open" | "answered" | "pinned";
interface DiscussionThread {
  id: string; title: string; body: string;
  category: DiscussionCategory; status: DiscussionStatus;
  author: string; authorColor: string;
  createdAt: number; replies: number; upvotes: number;
  accepted?: boolean; pinned?: boolean;
}

type IssueStatus = "open" | "closed" | "in_progress";
type IssuePriority = "low" | "medium" | "high" | "critical";
type ActionStatus = "success" | "failure" | "running" | "skipped";

interface TheoryIssue {
  id: string; title: string; body: string; status: IssueStatus;
  priority: IssuePriority; labels: string[]; author: string;
  createdAt: number; updatedAt: number; comments: number; assignee?: string;
}
interface ActionRun {
  id: string; name: string; trigger: string; status: ActionStatus;
  duration: string; startedAt: number; steps: { name: string; status: ActionStatus; duration: string }[];
}

const ISSUE_PRIORITY_CFG: Record<IssuePriority, { color: string; label: string }> = {
  low:      { color: '#6b7280', label: 'Low'      },
  medium:   { color: '#f59e0b', label: 'Medium'   },
  high:     { color: '#ef4444', label: 'High'     },
  critical: { color: '#dc2626', label: 'Critical' },
};
const ISSUE_STATUS_CFG: Record<IssueStatus, { color: string; icon: string; label: string }> = {
  open:        { color: '#22c55e', icon: '●', label: 'Open'        },
  in_progress: { color: '#6366f1', icon: '◑', label: 'In Progress' },
  closed:      { color: '#6b7280', icon: '○', label: 'Closed'      },
};
const ACTION_STATUS_CFG: Record<ActionStatus, { color: string; icon: string; bg: string }> = {
  success: { color: '#22c55e', icon: '✓', bg: 'rgba(34,197,94,0.12)'   },
  failure: { color: '#ef4444', icon: '✕', bg: 'rgba(239,68,68,0.12)'   },
  running: { color: '#6366f1', icon: '↻', bg: 'rgba(99,102,241,0.12)'  },
  skipped: { color: '#6b7280', icon: '—', bg: 'rgba(107,114,128,0.12)' },
};

const SAMPLE_ISSUES: TheoryIssue[] = [
  { id: 'i1', title: 'Contradicting evidence in Section 3.2', body: 'The empirical data from Smith et al. (2019) appears to contradict the core assumption about causal mechanisms. Needs review.', status: 'open', priority: 'high', labels: ['evidence', 'contradiction'], author: 'Dr. Okafor', createdAt: Date.now() - 86400000 * 3, updatedAt: Date.now() - 3600000, comments: 4, assignee: 'Prof. Vasquez' },
  { id: 'i2', title: 'Missing citations for Assumption 2', body: 'Assumption 2 lacks supporting references. Need at least 3 peer-reviewed sources.', status: 'in_progress', priority: 'medium', labels: ['citations', 'assumption'], author: 'Dr. Patel', createdAt: Date.now() - 86400000 * 7, updatedAt: Date.now() - 86400000 * 1, comments: 2 },
  { id: 'i3', title: 'Scope creep in latest branch', body: 'The experimental-v2 branch introduces claims outside the original theory scope. Should be split into a separate theory.', status: 'open', priority: 'critical', labels: ['scope', 'architecture'], author: 'Prof. Bell', createdAt: Date.now() - 86400000 * 1, updatedAt: Date.now() - 1800000, comments: 7 },
  { id: 'i4', title: 'Clarify methodology in README', body: 'The methodology section is ambiguous about the measurement instrument used in Phase 2.', status: 'closed', priority: 'low', labels: ['documentation', 'methodology'], author: 'Dr. Kim', createdAt: Date.now() - 86400000 * 14, updatedAt: Date.now() - 86400000 * 5, comments: 1 },
  { id: 'i5', title: 'Statistical power analysis missing', body: 'No power analysis is provided. Required before the theory can be considered empirically validated.', status: 'open', priority: 'high', labels: ['statistics', 'validation'], author: 'Dr. Tanaka', createdAt: Date.now() - 86400000 * 2, updatedAt: Date.now() - 7200000, comments: 3, assignee: 'Dr. Patel' },
];

const SAMPLE_ACTIONS: ActionRun[] = [
  { id: 'a1', name: 'Consistency Check', trigger: 'push to main', status: 'success', duration: '1m 24s', startedAt: Date.now() - 3600000,
    steps: [
      { name: 'Load theory snapshot', status: 'success', duration: '3s'  },
      { name: 'Check claim consistency', status: 'success', duration: '42s' },
      { name: 'Validate evidence links',  status: 'success', duration: '28s' },
      { name: 'Generate report',          status: 'success', duration: '11s' },
    ] },
  { id: 'a2', name: 'Peer Review Readiness', trigger: 'manual trigger', status: 'failure', duration: '3m 12s', startedAt: Date.now() - 86400000,
    steps: [
      { name: 'Check citation coverage',  status: 'success', duration: '55s'  },
      { name: 'Detect open issues',       status: 'failure', duration: '1m 2s' },
      { name: 'Validate methodology',     status: 'skipped', duration: '—'     },
      { name: 'Compile readiness score',  status: 'skipped', duration: '—'     },
    ] },
  { id: 'a3', name: 'Branch Merge Validation', trigger: 'pull request', status: 'running', duration: '…', startedAt: Date.now() - 120000,
    steps: [
      { name: 'Load source branch',       status: 'success', duration: '4s'  },
      { name: 'Detect merge conflicts',   status: 'running', duration: '…'   },
      { name: 'Run conflict resolution',  status: 'skipped', duration: '—'   },
      { name: 'Merge summary report',     status: 'skipped', duration: '—'   },
    ] },
  { id: 'a4', name: 'Evidence Audit', trigger: 'scheduled (weekly)', status: 'success', duration: '2m 45s', startedAt: Date.now() - 86400000 * 7,
    steps: [
      { name: 'Scan evidence database',   status: 'success', duration: '1m 10s' },
      { name: 'Check for retractions',    status: 'success', duration: '48s'    },
      { name: 'Update evidence scores',   status: 'success', duration: '37s'    },
      { name: 'Notify authors',           status: 'success', duration: '10s'    },
    ] },
];

const DISC_CATEGORY_CFG: Record<DiscussionCategory, { icon: string; label: string; color: string }> = {
  general:       { icon: '💬', label: 'General',      color: '#6366f1' },
  ideas:         { icon: '💡', label: 'Ideas',         color: '#f59e0b' },
  qa:            { icon: '❓', label: 'Q&A',           color: '#10b981' },
  announcements: { icon: '📢', label: 'Announcements', color: '#ec4899' },
};

const SAMPLE_DISCUSSIONS: DiscussionThread[] = [
  { id: 'd1', title: 'Should we incorporate Bayesian updating into the main hypothesis?', body: 'The current frequentist framing may be too rigid for the kind of evidence accumulation this theory describes. Bayesian would allow for incremental belief revision.', category: 'ideas', status: 'open', author: 'Dr. Patel', authorColor: '#6366f1', createdAt: Date.now() - 86400000 * 2, replies: 8, upvotes: 14 },
  { id: 'd2', title: 'How do we handle conflicting replications?', body: 'Three replication studies yielded contradictory results. Should we weight by sample size, methodology quality, or recency?', category: 'qa', status: 'answered', author: 'Prof. Vasquez', authorColor: '#10b981', createdAt: Date.now() - 86400000 * 5, replies: 12, upvotes: 21, accepted: true },
  { id: 'd3', title: 'v2.1 milestone: scope and timeline', body: 'Proposing that v2.1 focuses exclusively on the measurement instrument refinement and defers the theoretical extension to v3.0.', category: 'announcements', status: 'pinned', author: 'You', authorColor: '#ec4899', createdAt: Date.now() - 3600000 * 3, replies: 5, upvotes: 9, pinned: true },
  { id: 'd4', title: 'Terminology: should we rename "construct validity" to "evidential validity"?', body: 'The standard term "construct validity" carries baggage from psychometric traditions that may mislead readers from other fields.', category: 'general', status: 'open', author: 'Dr. Kim', authorColor: '#8b5cf6', createdAt: Date.now() - 86400000 * 8, replies: 3, upvotes: 6 },
  { id: 'd5', title: 'Best practice: citing grey literature?', body: 'Several key findings in this theory rely on working papers and technical reports. What citation standard should we adopt?', category: 'qa', status: 'open', author: 'Dr. Tanaka', authorColor: '#f59e0b', createdAt: Date.now() - 86400000 * 11, replies: 7, upvotes: 11 },
];

const STATUS_COLORS: Record<string, string> = {
  active: "#10b981",
  merged: "#8b5cf6",
  abandoned: "#6b7280",
  protected: "#f59e0b",
  open: "#10b981",
  closed: "#ef4444",
  conflict: "#f59e0b",
};

// ─── Component ───────────────────────────────────────────────
export default function TheoryRepoPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const {
    branches, commits, mergeRequests, tags, stats,
    activeBranchId, setActiveBranch, getCommitsForBranch,
  } = useTheoryBranching();

  const [activeTab, setActiveTab] = useState<RepoTab>("code");
  const [selectedBranchId, setSelectedBranchId] = useState<string>(activeBranchId || branches[0]?.id || "");

  const selectedBranch = useMemo(() => branches.find((b) => b.id === selectedBranchId), [branches, selectedBranchId]);
  const branchCommits = useMemo(() => getCommitsForBranch(selectedBranchId), [selectedBranchId, getCommitsForBranch]);
  const headCommit = branchCommits[0] || null;

  const [issues, setIssues]             = useState<TheoryIssue[]>(SAMPLE_ISSUES);
  const [issueFilter, setIssueFilter]   = useState<'all' | IssueStatus>('all');
  const [newIssueOpen, setNewIssueOpen] = useState(false);
  const [newIssueTitle, setNewIssueTitle] = useState('');
  const [newIssueBody, setNewIssueBody]   = useState('');
  const [newIssuePriority, setNewIssuePriority] = useState<IssuePriority>('medium');
  const [expandedAction, setExpandedAction] = useState<string | null>(null);

  const [discussions, setDiscussions]             = useState<DiscussionThread[]>(SAMPLE_DISCUSSIONS);
  const [discFilter, setDiscFilter]               = useState<DiscussionCategory | 'all'>('all');
  const [newDiscOpen, setNewDiscOpen]             = useState(false);
  const [newDiscTitle, setNewDiscTitle]           = useState('');
  const [newDiscBody, setNewDiscBody]             = useState('');
  const [newDiscCat, setNewDiscCat]               = useState<DiscussionCategory>('general');
  const [discUpvoted, setDiscUpvoted]             = useState<Set<string>>(new Set());

  const filteredDiscs = discFilter === 'all'
    ? discussions
    : discussions.filter(d => d.category === discFilter);

  const submitDiscussion = useCallback(() => {
    if (!newDiscTitle.trim()) return;
    const d: DiscussionThread = {
      id: `d${Date.now()}`, title: newDiscTitle.trim(), body: newDiscBody.trim(),
      category: newDiscCat, status: 'open', author: 'You', authorColor: '#6366f1',
      createdAt: Date.now(), replies: 0, upvotes: 0,
    };
    setDiscussions(prev => [d, ...prev]);
    setNewDiscTitle(''); setNewDiscBody(''); setNewDiscOpen(false);
  }, [newDiscTitle, newDiscBody, newDiscCat]);

  const toggleDiscUpvote = useCallback((id: string) => {
    setDiscUpvoted(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const openIssues   = issues.filter(i => i.status !== 'closed').length;
  const closedIssues = issues.filter(i => i.status === 'closed').length;
  const lastRun      = SAMPLE_ACTIONS[0];

  const submitIssue = useCallback(() => {
    if (!newIssueTitle.trim()) return;
    const issue: TheoryIssue = {
      id: `i${Date.now()}`, title: newIssueTitle.trim(), body: newIssueBody.trim(),
      status: 'open', priority: newIssuePriority, labels: [], author: 'You',
      createdAt: Date.now(), updatedAt: Date.now(), comments: 0,
    };
    setIssues(prev => [issue, ...prev]);
    setNewIssueTitle(''); setNewIssueBody(''); setNewIssueOpen(false);
  }, [newIssueTitle, newIssueBody, newIssuePriority]);

  const toggleIssue = useCallback((id: string) => {
    setIssues(prev => prev.map(i => i.id === id
      ? { ...i, status: i.status === 'closed' ? 'open' : 'closed', updatedAt: Date.now() }
      : i
    ));
  }, []);

  const tabDefs: { key: RepoTab; label: string; icon: string; count?: number }[] = [
    { key: "code",     label: t("repo.code")         || "Code",            icon: "📄" },
    { key: "issues",   label: "Issues",                                    icon: "🎫", count: openIssues },
    { key: "actions",  label: "Actions",                                   icon: "⚡" },
    { key: "commits",  label: t("repo.commits")      || "Commits",         icon: "📝", count: stats.totalCommits },
    { key: "branches", label: t("repo.branches")     || "Branches",        icon: "🌿", count: stats.totalBranches },
    { key: "merges",   label: t("repo.mergeRequests") || "Merge Requests", icon: "🔀", count: stats.openMergeRequests },
    { key: "tags",        label: t("repo.tags")          || "Tags",        icon: "🏷️",  count: stats.totalTags },
    { key: "discussions", label: "Discussions",                               icon: "💬", count: discussions.filter(d => d.status === 'open').length },
  ];

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    const now = Date.now();
    const diffDays = Math.floor((now - ts) / 86400000);
    if (diffDays === 0) return "today";
    if (diffDays === 1) return "yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return d.toLocaleDateString();
  };

  const cardBg = "hsl(var(--card) / 0.5)";
  const cardBorder = "hsl(var(--border))";
  const colors = {
    textPrimary: "hsl(var(--foreground))",
    textSecondary: "hsl(var(--muted-foreground))",
    textMuted: "hsl(var(--muted-foreground) / 0.7)",
    borderPrimary: "hsl(var(--border))",
  };
  const isDark = true; // kept for conditional styling in badges

  return (
    <PageShell>
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: isMobile ? "12px" : "24px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: isMobile ? "18px" : "22px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px", color: colors.textPrimary }}>
              📦 {t("repo.title") || "Theory Repository"}
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: colors.textSecondary }}>
              {selectedBranch?.description || t("repo.subtitle") || "Git-like version control for scientific theories"}
            </p>
          </div>
          <button
            onClick={() => navigate("/theory-hub")}
            style={{ padding: "8px 14px", background: "hsl(var(--primary))", border: "none", borderRadius: "10px", color: "hsl(var(--primary-foreground))", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}
          >
            🏗️ {!isMobile && "Theory Hub"}
          </button>
        </div>

        {/* Stats bar */}
        <div style={{ display: "flex", gap: "16px", marginBottom: "16px", fontSize: "13px", color: colors.textSecondary }}>
          <span>🌿 <strong style={{ color: colors.textPrimary }}>{stats.activeBranches}</strong> branches</span>
          <span>📝 <strong style={{ color: colors.textPrimary }}>{stats.totalCommits}</strong> commits</span>
          <span>🏷️ <strong style={{ color: colors.textPrimary }}>{stats.totalTags}</strong> tags</span>
          <span>🔀 <strong style={{ color: colors.textPrimary }}>{stats.openMergeRequests}</strong> open MRs</span>
        </div>

        {/* Tab bar */}
        <div style={{ display: "flex", gap: "4px", borderBottom: `1px solid ${cardBorder}`, marginBottom: "20px" }}>
          {tabDefs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: "10px 16px",
                  fontSize: "13px",
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? colors.textPrimary : colors.textSecondary,
                  background: "transparent",
                  border: "none",
                  borderBottom: isActive ? "2px solid #6366f1" : "2px solid transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>{tab.icon}</span>
                {tab.label}
                {tab.count !== undefined && (
                  <span style={{
                    padding: "1px 6px",
                    borderRadius: "10px",
                    fontSize: "11px",
                    background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Branch selector (for Code and Commits tabs) */}
        {(activeTab === "code" || activeTab === "commits") && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: `1px solid ${cardBorder}`,
                background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                color: colors.textPrimary,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  🌿 {b.name} {b.isDefault ? "(default)" : ""}
                </option>
              ))}
            </select>
            <span style={{ fontSize: "12px", color: colors.textSecondary }}>
              {branchCommits.length} commits on this branch
            </span>
          </div>
        )}

        {/* ─── Code Tab (README-like) ─── */}
        {activeTab === "code" && headCommit && (
          <div>
            {/* Latest commit bar */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px 16px",
              background: cardBg,
              border: `1px solid ${cardBorder}`,
              borderRadius: "8px 8px 0 0",
              fontSize: "13px",
            }}>
              <span style={{ fontWeight: 600, color: colors.textPrimary }}>{headCommit.author}</span>
              <span style={{ color: colors.textSecondary, flex: 1 }}>{headCommit.message}</span>
              <span style={{ fontSize: "11px", color: colors.textSecondary }}>{formatDate(headCommit.timestamp)}</span>
              <span style={{
                padding: "2px 8px",
                borderRadius: "4px",
                fontSize: "10px",
                fontFamily: "monospace",
                background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
                color: colors.textSecondary,
              }}>
                {headCommit.id.slice(0, 8)}
              </span>
            </div>

            {/* Theory content (README-like) */}
            <div style={{
              padding: "24px",
              border: `1px solid ${cardBorder}`,
              borderTop: "none",
              borderRadius: "0 0 8px 8px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", paddingBottom: "12px", borderBottom: `1px solid ${cardBorder}` }}>
                <span style={{ fontSize: "16px" }}>📖</span>
                <span style={{ fontSize: "14px", fontWeight: 600 }}>README.md</span>
              </div>

              <h2 style={{ margin: "0 0 12px", fontSize: "20px", fontWeight: 700 }}>
                {headCommit.snapshot.title}
              </h2>
              <p style={{ fontSize: "14px", lineHeight: 1.7, color: colors.textPrimary, marginBottom: "20px" }}>
                {headCommit.snapshot.content}
              </p>

              {/* Claims */}
              <h3 style={{ fontSize: "15px", fontWeight: 600, margin: "20px 0 10px", display: "flex", alignItems: "center", gap: "6px" }}>
                📋 Claims ({headCommit.snapshot.claims.length})
              </h3>
              <ul style={{ margin: 0, paddingLeft: "20px" }}>
                {headCommit.snapshot.claims.map((claim, i) => (
                  <li key={i} style={{ fontSize: "13px", lineHeight: 1.8, color: colors.textPrimary }}>{claim}</li>
                ))}
              </ul>

              {/* Assumptions */}
              <h3 style={{ fontSize: "15px", fontWeight: 600, margin: "20px 0 10px", display: "flex", alignItems: "center", gap: "6px" }}>
                💡 Assumptions ({headCommit.snapshot.assumptions.length})
              </h3>
              <ul style={{ margin: 0, paddingLeft: "20px" }}>
                {headCommit.snapshot.assumptions.map((a, i) => (
                  <li key={i} style={{ fontSize: "13px", lineHeight: 1.8, color: colors.textSecondary }}>{a}</li>
                ))}
              </ul>

              {/* Evidence */}
              <h3 style={{ fontSize: "15px", fontWeight: 600, margin: "20px 0 10px", display: "flex", alignItems: "center", gap: "6px" }}>
                🔬 Evidence ({headCommit.snapshot.evidence.length})
              </h3>
              <ul style={{ margin: 0, paddingLeft: "20px" }}>
                {headCommit.snapshot.evidence.map((e, i) => (
                  <li key={i} style={{ fontSize: "13px", lineHeight: 1.8, color: colors.textSecondary }}>{e}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === "code" && !headCommit && (
          <div style={{ padding: "48px", textAlign: "center", color: colors.textSecondary, border: `1px solid ${cardBorder}`, borderRadius: "8px" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>📦</div>
            <div style={{ fontSize: "14px" }}>No commits on this branch yet</div>
          </div>
        )}

        {/* ─── Commits Tab ─── */}
        {activeTab === "commits" && (
          <div style={{ border: `1px solid ${cardBorder}`, borderRadius: "8px", overflow: "hidden" }}>
            {branchCommits.length === 0 ? (
              <div style={{ padding: "48px", textAlign: "center", color: colors.textSecondary }}>
                <div style={{ fontSize: "32px", marginBottom: "12px" }}>📝</div>
                <div>No commits on this branch</div>
              </div>
            ) : (
              branchCommits.map((commit: TheoryCommit, idx: number) => (
                <div
                  key={commit.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    padding: "12px 16px",
                    borderBottom: idx < branchCommits.length - 1 ? `1px solid ${cardBorder}` : "none",
                  }}
                >
                  <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: selectedBranch?.color || "#6366f1", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: colors.textPrimary }}>{commit.message}</div>
                    <div style={{ fontSize: "12px", color: colors.textSecondary, marginTop: "2px" }}>
                      {commit.author} committed {formatDate(commit.timestamp)}
                      {commit.changedFields.length > 0 && (
                        <span> · changed: {commit.changedFields.join(", ")}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    {commit.tags.map((tag) => (
                      <span key={tag} style={{
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontSize: "10px",
                        background: "rgba(99,102,241,0.15)",
                        color: "#6366f1",
                        fontWeight: 600,
                      }}>
                        {tag}
                      </span>
                    ))}
                    <span style={{
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontFamily: "monospace",
                      background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
                      color: colors.textSecondary,
                    }}>
                      {commit.id.slice(0, 8)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ─── Branches Tab ─── */}
        {activeTab === "branches" && (
          <div style={{ border: `1px solid ${cardBorder}`, borderRadius: "8px", overflow: "hidden" }}>
            {branches.map((branch: TheoryBranch, idx: number) => {
              const bCommits = getCommitsForBranch(branch.id);
              const isActive = branch.id === activeBranchId;
              return (
                <div
                  key={branch.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    padding: "14px 16px",
                    borderBottom: idx < branches.length - 1 ? `1px solid ${cardBorder}` : "none",
                    background: isActive ? (isDark ? "rgba(99,102,241,0.06)" : "rgba(99,102,241,0.04)") : "transparent",
                  }}
                >
                  <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: branch.color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "14px", fontWeight: 600, color: colors.textPrimary }}>{branch.name}</span>
                      {branch.isDefault && (
                        <span style={{ padding: "1px 6px", borderRadius: "4px", fontSize: "10px", background: "rgba(99,102,241,0.15)", color: "#6366f1", fontWeight: 600 }}>
                          default
                        </span>
                      )}
                      <span style={{
                        padding: "1px 6px",
                        borderRadius: "4px",
                        fontSize: "10px",
                        background: `${STATUS_COLORS[branch.status] || "#6b7280"}22`,
                        color: STATUS_COLORS[branch.status] || "#6b7280",
                        fontWeight: 600,
                      }}>
                        {branch.status}
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: colors.textSecondary, marginTop: "2px" }}>
                      {branch.description} · {bCommits.length} commits · updated {formatDate(branch.updatedAt)}
                    </div>
                  </div>
                  <button
                    onClick={() => { setActiveBranch(branch.id); setSelectedBranchId(branch.id); setActiveTab("code"); }}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      background: isActive ? "rgba(99,102,241,0.2)" : (isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"),
                      border: `1px solid ${cardBorder}`,
                      color: colors.textSecondary,
                      cursor: "pointer",
                    }}
                  >
                    {isActive ? "✓ Active" : "Switch"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── Merge Requests Tab ─── */}
        {activeTab === "merges" && (
          <div style={{ border: `1px solid ${cardBorder}`, borderRadius: "8px", overflow: "hidden" }}>
            {mergeRequests.length === 0 ? (
              <div style={{ padding: "48px", textAlign: "center", color: colors.textSecondary }}>
                <div style={{ fontSize: "32px", marginBottom: "12px" }}>🔀</div>
                <div>No merge requests yet</div>
              </div>
            ) : (
              mergeRequests.map((mr: MergeRequest, idx: number) => {
                const sourceBranch = branches.find((b) => b.id === mr.sourceBranchId);
                const targetBranch = branches.find((b) => b.id === mr.targetBranchId);
                return (
                  <div
                    key={mr.id}
                    style={{
                      padding: "14px 16px",
                      borderBottom: idx < mergeRequests.length - 1 ? `1px solid ${cardBorder}` : "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{
                        width: "8px", height: "8px", borderRadius: "50%",
                        background: STATUS_COLORS[mr.status] || "#6b7280",
                      }} />
                      <span style={{ fontSize: "14px", fontWeight: 600, color: colors.textPrimary }}>{mr.title}</span>
                      <span style={{
                        padding: "1px 6px",
                        borderRadius: "4px",
                        fontSize: "10px",
                        background: `${STATUS_COLORS[mr.status] || "#6b7280"}22`,
                        color: STATUS_COLORS[mr.status] || "#6b7280",
                        fontWeight: 600,
                      }}>
                        {mr.status}
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: colors.textSecondary }}>
                      {mr.author} wants to merge <strong>{sourceBranch?.name || "?"}</strong> into <strong>{targetBranch?.name || "?"}</strong>
                      {" · "}{formatDate(mr.createdAt)}
                      {mr.conflicts.length > 0 && <span style={{ color: "#f59e0b" }}> · {mr.conflicts.length} conflicts</span>}
                      {mr.comments.length > 0 && <span> · {mr.comments.length} comments</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ─── Tags Tab ─── */}
        {activeTab === "tags" && (
          <div style={{ border: `1px solid ${cardBorder}`, borderRadius: "8px", overflow: "hidden" }}>
            {tags.length === 0 ? (
              <div style={{ padding: "48px", textAlign: "center", color: colors.textSecondary }}>
                <div style={{ fontSize: "32px", marginBottom: "12px" }}>🏷️</div>
                <div>No tags/releases yet</div>
              </div>
            ) : (
              tags.map((tag: TheoryTag, idx: number) => {
                const tagCommit = commits.find((c) => c.id === tag.commitId);
                const tagBranch = branches.find((b) => b.id === tag.branchId);
                return (
                  <div
                    key={tag.id}
                    style={{
                      padding: "14px 16px",
                      borderBottom: idx < tags.length - 1 ? `1px solid ${cardBorder}` : "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "16px" }}>🏷️</span>
                      <span style={{ fontSize: "15px", fontWeight: 700, color: "#6366f1" }}>{tag.version || tag.name}</span>
                      <span style={{ fontSize: "12px", color: colors.textSecondary }}>on {tagBranch?.name || "?"}</span>
                    </div>
                    <div style={{ fontSize: "13px", color: colors.textPrimary, marginBottom: "4px" }}>{tag.description}</div>
                    {tag.releaseNotes && (
                      <div style={{
                        fontSize: "12px",
                        color: colors.textSecondary,
                        padding: "8px 12px",
                        background: cardBg,
                        borderRadius: "6px",
                        marginTop: "8px",
                        borderLeft: "3px solid #6366f1",
                      }}>
                        {tag.releaseNotes}
                      </div>
                    )}
                    <div style={{ fontSize: "11px", color: colors.textSecondary, marginTop: "6px" }}>
                      {tag.createdBy} · {formatDate(tag.createdAt)}
                      {tagCommit && <span> · commit {tagCommit.id.slice(0, 8)}</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ─── Issues Tab ─── */}
        {activeTab === "issues" && (
          <div>
            {/* Issues toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', borderRadius: '8px', border: `1px solid ${cardBorder}`, overflow: 'hidden' }}>
                {(['all', 'open', 'in_progress', 'closed'] as const).map(f => (
                  <button key={f} onClick={() => setIssueFilter(f)}
                    style={{ padding: '6px 12px', fontSize: '12px', fontWeight: issueFilter === f ? 700 : 400,
                      background: issueFilter === f ? (isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)') : 'transparent',
                      border: 'none', borderRight: f !== 'closed' ? `1px solid ${cardBorder}` : 'none',
                      color: issueFilter === f ? '#6366f1' : colors.textSecondary, cursor: 'pointer' }}>
                    {f === 'all' ? `All (${issues.length})` : f === 'open' ? `● Open (${openIssues})` : f === 'in_progress' ? '◑ In Progress' : `○ Closed (${closedIssues})`}
                  </button>
                ))}
              </div>
              <button onClick={() => setNewIssueOpen(v => !v)}
                style={{ marginLeft: 'auto', padding: '7px 14px', borderRadius: '8px', border: 'none', background: '#6366f1', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                + New Issue
              </button>
            </div>

            {/* New issue form */}
            {newIssueOpen && (
              <div style={{ marginBottom: '12px', padding: '16px', border: `1px solid ${cardBorder}`, borderRadius: '10px', background: cardBg }}>
                <div style={{ fontWeight: 700, fontSize: '13px', color: colors.textPrimary, marginBottom: '10px' }}>📝 Open New Issue</div>
                <input value={newIssueTitle} onChange={e => setNewIssueTitle(e.target.value)} placeholder="Issue title…"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '7px', border: `1px solid ${cardBorder}`, background: isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb', color: colors.textPrimary, fontSize: '13px', marginBottom: '8px', boxSizing: 'border-box', outline: 'none' }}/>
                <textarea value={newIssueBody} onChange={e => setNewIssueBody(e.target.value)} placeholder="Describe the issue…" rows={3}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '7px', border: `1px solid ${cardBorder}`, background: isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb', color: colors.textPrimary, fontSize: '12px', marginBottom: '8px', resize: 'vertical', boxSizing: 'border-box', outline: 'none' }}/>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <select value={newIssuePriority} onChange={e => setNewIssuePriority(e.target.value as IssuePriority)}
                    style={{ padding: '6px 10px', borderRadius: '6px', border: `1px solid ${cardBorder}`, background: isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb', color: colors.textPrimary, fontSize: '12px' }}>
                    {(['low','medium','high','critical'] as IssuePriority[]).map(p => <option key={p} value={p}>{ISSUE_PRIORITY_CFG[p].label} Priority</option>)}
                  </select>
                  <button onClick={submitIssue}
                    style={{ padding: '6px 16px', borderRadius: '6px', border: 'none', background: '#6366f1', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Submit</button>
                  <button onClick={() => setNewIssueOpen(false)}
                    style={{ padding: '6px 12px', borderRadius: '6px', border: `1px solid ${cardBorder}`, background: 'transparent', color: colors.textSecondary, fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            )}

            {/* Issues list */}
            <div style={{ border: `1px solid ${cardBorder}`, borderRadius: '8px', overflow: 'hidden' }}>
              {issues
                .filter(i => issueFilter === 'all' || i.status === issueFilter)
                .map((issue, idx, arr) => {
                  const sc = ISSUE_STATUS_CFG[issue.status];
                  const pc = ISSUE_PRIORITY_CFG[issue.priority];
                  return (
                    <div key={issue.id} style={{ padding: '14px 16px', borderBottom: idx < arr.length - 1 ? `1px solid ${cardBorder}` : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <span style={{ color: sc.color, fontSize: '16px', lineHeight: 1.4, flexShrink: 0 }}>{sc.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '3px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: colors.textPrimary }}>{issue.title}</span>
                            <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 6px', borderRadius: '6px', background: `${pc.color}18`, color: pc.color, border: `1px solid ${pc.color}30` }}>{pc.label}</span>
                            {issue.labels.map(l => <span key={l} style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '6px', background: isDark ? 'rgba(255,255,255,0.07)' : '#f3f4f6', color: colors.textMuted }}>{l}</span>)}
                          </div>
                          <div style={{ fontSize: '12px', color: colors.textSecondary, lineHeight: 1.4, marginBottom: '5px' }}>{issue.body}</div>
                          <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: colors.textMuted }}>
                            <span>#{issue.id} opened by {issue.author}</span>
                            {issue.assignee && <span>👤 {issue.assignee}</span>}
                            {issue.comments > 0 && <span>💬 {issue.comments}</span>}
                          </div>
                        </div>
                        <button onClick={() => toggleIssue(issue.id)}
                          style={{ padding: '4px 10px', borderRadius: '5px', border: `1px solid ${cardBorder}`, background: 'transparent', color: colors.textSecondary, fontSize: '11px', cursor: 'pointer', flexShrink: 0 }}>
                          {issue.status === 'closed' ? '↩ Reopen' : '✓ Close'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              {issues.filter(i => issueFilter === 'all' || i.status === issueFilter).length === 0 && (
                <div style={{ padding: '48px', textAlign: 'center', color: colors.textSecondary }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎉</div>
                  <div>No issues in this filter</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── Actions Tab ─── */}
        {activeTab === "actions" && (
          <div>
            {/* Actions summary */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {[
                { label: 'Last run',    value: ACTION_STATUS_CFG[lastRun.status].icon + ' ' + lastRun.name, color: ACTION_STATUS_CFG[lastRun.status].color },
                { label: 'Workflows',   value: String(SAMPLE_ACTIONS.length),   color: '#6366f1' },
                { label: 'Passing',     value: String(SAMPLE_ACTIONS.filter(a => a.status === 'success').length), color: '#22c55e' },
                { label: 'Failed',      value: String(SAMPLE_ACTIONS.filter(a => a.status === 'failure').length), color: '#ef4444' },
              ].map(s => (
                <div key={s.label} style={{ padding: '10px 16px', borderRadius: '10px', border: `1px solid ${s.color}25`, background: `${s.color}0d`, minWidth: '100px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '10px', color: colors.textMuted, fontWeight: 600, marginTop: '2px' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Action runs */}
            <div style={{ border: `1px solid ${cardBorder}`, borderRadius: '10px', overflow: 'hidden' }}>
              {SAMPLE_ACTIONS.map((run, idx) => {
                const sc = ACTION_STATUS_CFG[run.status];
                const isExpanded = expandedAction === run.id;
                return (
                  <div key={run.id} style={{ borderBottom: idx < SAMPLE_ACTIONS.length - 1 ? `1px solid ${cardBorder}` : 'none' }}>
                    <div onClick={() => setExpandedAction(isExpanded ? null : run.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', cursor: 'pointer' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: sc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: sc.color, fontWeight: 800, fontSize: '14px', flexShrink: 0 }}>
                        {sc.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: colors.textPrimary }}>{run.name}</div>
                        <div style={{ fontSize: '12px', color: colors.textSecondary }}>Triggered by {run.trigger} · {new Date(run.startedAt).toLocaleString()} · {run.duration}</div>
                      </div>
                      <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: sc.bg, color: sc.color, border: `1px solid ${sc.color}30` }}>
                        {run.status.toUpperCase()}
                      </span>
                      <span style={{ color: colors.textMuted, fontSize: '12px' }}>{isExpanded ? '▲' : '▼'}</span>
                    </div>
                    {isExpanded && (
                      <div style={{ padding: '0 16px 16px 56px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {run.steps.map((step, si) => {
                          const ssc = ACTION_STATUS_CFG[step.status];
                          return (
                            <div key={si} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 12px', borderRadius: '7px', background: ssc.bg }}>
                              <span style={{ color: ssc.color, fontWeight: 800, fontSize: '12px', width: '14px', textAlign: 'center' }}>{ssc.icon}</span>
                              <span style={{ flex: 1, fontSize: '12px', color: colors.textPrimary }}>{step.name}</span>
                              <span style={{ fontSize: '11px', color: colors.textMuted, fontFamily: 'monospace' }}>{step.duration}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── Discussions Tab ─── */}
        {activeTab === "discussions" && (
          <div>
            {/* Stats bar */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {[
                { label: 'Open',      value: discussions.filter(d => d.status === 'open').length,     color: '#22c55e' },
                { label: 'Answered',  value: discussions.filter(d => d.status === 'answered').length, color: '#6366f1' },
                { label: 'Pinned',    value: discussions.filter(d => d.pinned).length,                color: '#ec4899' },
                { label: 'Total',     value: discussions.length,                                      color: '#6b7280' },
              ].map(s => (
                <div key={s.label} style={{ padding: '10px 16px', borderRadius: '10px', border: `1px solid ${s.color}25`, background: `${s.color}0d`, minWidth: '80px' }}>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '10px', color: colors.textMuted, fontWeight: 600, marginTop: '2px' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Category filter + new button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: `1px solid ${cardBorder}` }}>
                {(['all', 'general', 'ideas', 'qa', 'announcements'] as (DiscussionCategory | 'all')[]).map(f => (
                  <button key={f} onClick={() => setDiscFilter(f)} style={{
                    padding: '6px 12px', fontSize: '11px', fontWeight: 600,
                    background: discFilter === f ? (isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)') : 'transparent',
                    border: 'none', borderRight: f !== 'announcements' ? `1px solid ${cardBorder}` : 'none',
                    color: discFilter === f ? '#6366f1' : colors.textSecondary, cursor: 'pointer',
                  }}>
                    {f === 'all' ? `All (${discussions.length})` : `${DISC_CATEGORY_CFG[f as DiscussionCategory].icon} ${DISC_CATEGORY_CFG[f as DiscussionCategory].label}`}
                  </button>
                ))}
              </div>
              <button onClick={() => setNewDiscOpen(v => !v)}
                style={{ marginLeft: 'auto', padding: '7px 14px', borderRadius: '8px', border: 'none', background: '#6366f1', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                + New Discussion
              </button>
            </div>

            {/* New discussion form */}
            {newDiscOpen && (
              <div style={{ marginBottom: '12px', padding: '16px', border: `1px solid ${cardBorder}`, borderRadius: '10px', background: cardBg }}>
                <div style={{ fontWeight: 700, fontSize: '13px', color: colors.textPrimary, marginBottom: '10px' }}>💬 Start a Discussion</div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  {(Object.keys(DISC_CATEGORY_CFG) as DiscussionCategory[]).map(cat => {
                    const cfg = DISC_CATEGORY_CFG[cat];
                    return (
                      <button key={cat} onClick={() => setNewDiscCat(cat)} style={{
                        padding: '4px 10px', borderRadius: '14px', fontSize: '11px', fontWeight: 600,
                        border: `1px solid ${newDiscCat === cat ? cfg.color + '55' : cardBorder}`,
                        background: newDiscCat === cat ? `${cfg.color}18` : 'transparent',
                        color: newDiscCat === cat ? cfg.color : colors.textSecondary, cursor: 'pointer',
                      }}>{cfg.icon} {cfg.label}</button>
                    );
                  })}
                </div>
                <input value={newDiscTitle} onChange={e => setNewDiscTitle(e.target.value)} placeholder="Discussion title…"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '7px', border: `1px solid ${cardBorder}`, background: isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb', color: colors.textPrimary, fontSize: '13px', fontWeight: 600, marginBottom: '8px', boxSizing: 'border-box', outline: 'none' }}/>
                <textarea value={newDiscBody} onChange={e => setNewDiscBody(e.target.value)} placeholder="What would you like to discuss?" rows={3}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '7px', border: `1px solid ${cardBorder}`, background: isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb', color: colors.textPrimary, fontSize: '12px', marginBottom: '8px', resize: 'vertical', boxSizing: 'border-box', outline: 'none' }}/>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={submitDiscussion} disabled={!newDiscTitle.trim()}
                    style={{ padding: '6px 16px', borderRadius: '6px', border: 'none', background: newDiscTitle.trim() ? '#6366f1' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'), color: newDiscTitle.trim() ? '#fff' : colors.textMuted, fontSize: '12px', fontWeight: 600, cursor: newDiscTitle.trim() ? 'pointer' : 'default' }}>Start Discussion</button>
                  <button onClick={() => setNewDiscOpen(false)}
                    style={{ padding: '6px 12px', borderRadius: '6px', border: `1px solid ${cardBorder}`, background: 'transparent', color: colors.textSecondary, fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            )}

            {/* Discussions list */}
            <div style={{ border: `1px solid ${cardBorder}`, borderRadius: '8px', overflow: 'hidden' }}>
              {[...filteredDiscs].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)).map((disc, idx, arr) => {
                const cat = DISC_CATEGORY_CFG[disc.category];
                const isUpvoted = discUpvoted.has(disc.id);
                return (
                  <div key={disc.id} style={{ padding: '14px 16px', borderBottom: idx < arr.length - 1 ? `1px solid ${cardBorder}` : 'none', background: disc.pinned ? (isDark ? 'rgba(236,72,153,0.04)' : 'rgba(236,72,153,0.02)') : 'transparent' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      {/* Author avatar */}
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: disc.authorColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: '#fff', fontWeight: 700, flexShrink: 0 }}>
                        {disc.author.charAt(0)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '3px' }}>
                          {disc.pinned && <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 6px', borderRadius: '6px', background: 'rgba(236,72,153,0.15)', color: '#ec4899', border: '1px solid rgba(236,72,153,0.3)' }}>📌 PINNED</span>}
                          {disc.accepted && <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 6px', borderRadius: '6px', background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>✓ ANSWERED</span>}
                          <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 6px', borderRadius: '6px', background: `${cat.color}18`, color: cat.color, border: `1px solid ${cat.color}30` }}>{cat.icon} {cat.label}</span>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: colors.textPrimary }}>{disc.title}</span>
                        </div>
                        {disc.body && <div style={{ fontSize: '12px', color: colors.textSecondary, lineHeight: 1.45, marginBottom: '6px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{disc.body}</div>}
                        <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: colors.textMuted, alignItems: 'center' }}>
                          <span>{disc.author} · {new Date(disc.createdAt).toLocaleDateString()}</span>
                          <span>💬 {disc.replies} replies</span>
                        </div>
                      </div>
                      {/* Upvote */}
                      <button onClick={() => toggleDiscUpvote(disc.id)} style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px',
                        padding: '5px 8px', borderRadius: '8px',
                        border: `1px solid ${isUpvoted ? 'rgba(99,102,241,0.4)' : cardBorder}`,
                        background: isUpvoted ? 'rgba(99,102,241,0.12)' : 'transparent',
                        color: isUpvoted ? '#6366f1' : colors.textMuted,
                        cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
                      }}>
                        <span style={{ fontSize: '11px' }}>▲</span>
                        <span style={{ fontSize: '11px', fontWeight: 700 }}>{disc.upvotes + (isUpvoted ? 1 : 0)}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
              {filteredDiscs.length === 0 && (
                <div style={{ padding: '48px', textAlign: 'center', color: colors.textSecondary }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>💬</div>
                  <div>No discussions in this category yet</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: "16px", fontSize: "12px", color: colors.textSecondary, textAlign: "center" }}>
          {stats.totalBranches} branches · {stats.totalCommits} commits · {stats.totalTags} releases · {stats.totalMerges} merges completed
        </div>
      </div>
    </PageShell>
  );
}
