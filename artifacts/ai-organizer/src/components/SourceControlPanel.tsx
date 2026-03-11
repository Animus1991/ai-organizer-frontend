/**
 * SourceControlPanel — GitHub-style Source Control for document changes
 * Shows staged/unstaged changes, commit messages, version history, revert
 * Integrates with TheoryBranchingContext for branch-aware commits
 * Uses localStorage for persistence of document change tracking
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { useTheoryBranching } from "../context/TheoryBranchingContext";

// ─── Types ───────────────────────────────────────────────────
export type ChangeStatus = "modified" | "added" | "deleted" | "renamed" | "untracked";

export interface DocumentChange {
  id: string;
  documentId: string;
  documentName: string;
  field: string;
  changeType: ChangeStatus;
  staged: boolean;
  timestamp: number;
  preview?: string;
}

export interface DocumentCommit {
  id: string;
  message: string;
  description: string;
  author: string;
  timestamp: number;
  changes: DocumentChange[];
  branch: string;
  hash: string;
}

interface SourceControlPanelProps {
  open: boolean;
  onClose: () => void;
  userName?: string;
}

const STORAGE_KEYS = {
  changes: "sc-pending-changes",
  commits: "sc-commit-history",
  templates: "sc-commit-templates",
};

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

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

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

const CHANGE_TYPE_CONFIG: Record<ChangeStatus, { letter: string; color: string; label: string }> = {
  modified: { letter: "M", color: "#f59e0b", label: "Modified" },
  added: { letter: "A", color: "#10b981", label: "Added" },
  deleted: { letter: "D", color: "#ef4444", label: "Deleted" },
  renamed: { letter: "R", color: "#6366f1", label: "Renamed" },
  untracked: { letter: "U", color: "#8b5cf6", label: "Untracked" },
};

const DEFAULT_TEMPLATES = [
  { label: "Update content", message: "docs: Update document content", icon: "📝" },
  { label: "Fix errors", message: "fix: Correct errors in document", icon: "🐛" },
  { label: "Add section", message: "feat: Add new section", icon: "✨" },
  { label: "Revise methodology", message: "refactor: Revise methodology section", icon: "🔬" },
  { label: "Update references", message: "docs: Update references and citations", icon: "📚" },
  { label: "Address review", message: "fix: Address peer review feedback", icon: "👥" },
  { label: "Restructure", message: "refactor: Restructure document organization", icon: "🏗️" },
  { label: "Initial draft", message: "feat: Initial draft", icon: "🚀" },
];

function generateSampleChanges(): DocumentChange[] {
  const docs = [
    { id: "1", name: "Cognitive Load Theory.docx" },
    { id: "2", name: "Research Methodology.docx" },
    { id: "3", name: "Literature Review.docx" },
    { id: "4", name: "Statistical Analysis.docx" },
  ];
  const fields = ["Abstract", "Introduction", "Methodology", "Results", "Discussion", "References", "Appendix"];
  const types: ChangeStatus[] = ["modified", "added", "deleted", "modified", "modified", "added"];
  const changes: DocumentChange[] = [];
  const count = 4 + Math.floor(Math.random() * 6);
  for (let i = 0; i < count; i++) {
    const doc = docs[Math.floor(Math.random() * docs.length)];
    const field = fields[Math.floor(Math.random() * fields.length)];
    const changeType = types[Math.floor(Math.random() * types.length)];
    changes.push({
      id: generateId(), documentId: doc.id, documentName: doc.name, field, changeType,
      staged: Math.random() > 0.6, timestamp: Date.now() - Math.floor(Math.random() * 3600000),
      preview: changeType === "modified" ? `Updated ${field.toLowerCase()} section with revised content`
        : changeType === "added" ? `Added new ${field.toLowerCase()} content`
        : `Removed ${field.toLowerCase()} section`,
    });
  }
  return changes;
}

// ─── Component ───────────────────────────────────────────────
export default function SourceControlPanel({ open, onClose, userName: _userName = "You" }: SourceControlPanelProps) {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { commits: contextCommits, branches, getActiveBranch, createCommit } = useTheoryBranching();

  const [activeTab, setActiveTab] = useState<"changes" | "history" | "stash">("changes");
  const [commitMessage, setCommitMessage] = useState("");
  const [commitDescription, setCommitDescription] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [changes, setChanges] = useState<DocumentChange[]>(() => {
    const stored = loadFromStorage<DocumentChange[]>(STORAGE_KEYS.changes, []);
    return stored.length > 0 ? stored : generateSampleChanges();
  });

  const commits: DocumentCommit[] = useMemo(() => {
    return contextCommits.map(cc => ({
      id: cc.id, message: cc.message, description: cc.description, author: cc.author,
      timestamp: cc.timestamp,
      changes: cc.changedFields.map((field, idx) => ({
        id: `${cc.id}-${idx}`, documentId: cc.branchId, documentName: cc.snapshot.title || 'Theory Document',
        field, changeType: 'modified' as ChangeStatus, staged: true, timestamp: cc.timestamp,
      })),
      branch: branches.find(b => b.id === cc.branchId)?.name || 'main',
      hash: cc.id.slice(0, 8),
    }));
  }, [contextCommits, branches]);

  useEffect(() => { saveToStorage(STORAGE_KEYS.changes, changes); }, [changes]);

  const stagedChanges = useMemo(() => changes.filter((c) => c.staged), [changes]);
  const unstagedChanges = useMemo(() => changes.filter((c) => !c.staged), [changes]);

  const filteredCommits = useMemo(() => {
    if (!searchQuery) return commits;
    const q = searchQuery.toLowerCase();
    return commits.filter((c) => c.message.toLowerCase().includes(q) || c.author.toLowerCase().includes(q) || c.hash.includes(q));
  }, [commits, searchQuery]);

  const stageChange = useCallback((id: string) => { setChanges((prev) => prev.map((c) => (c.id === id ? { ...c, staged: true } : c))); }, []);
  const unstageChange = useCallback((id: string) => { setChanges((prev) => prev.map((c) => (c.id === id ? { ...c, staged: false } : c))); }, []);
  const stageAll = useCallback(() => { setChanges((prev) => prev.map((c) => ({ ...c, staged: true }))); }, []);
  const unstageAll = useCallback(() => { setChanges((prev) => prev.map((c) => ({ ...c, staged: false }))); }, []);
  const discardChange = useCallback((id: string) => { setChanges((prev) => prev.filter((c) => c.id !== id)); }, []);
  const discardAll = useCallback(() => { if (window.confirm("Discard all changes? This cannot be undone.")) setChanges([]); }, []);

  const doCommit = useCallback(() => {
    if (!commitMessage.trim() || stagedChanges.length === 0) return;
    const activeBranch = getActiveBranch();
    if (!activeBranch) return;
    const snapshot = {
      title: stagedChanges[0]?.documentName || 'Document',
      content: commitDescription.trim(), claims: [], assumptions: [], evidence: [],
    };
    createCommit(activeBranch.id, commitMessage.trim(), commitDescription.trim(), snapshot);
    setChanges((prev) => prev.filter((c) => !c.staged));
    setCommitMessage("");
    setCommitDescription("");
  }, [commitMessage, commitDescription, stagedChanges, getActiveBranch, createCommit]);

  const revertCommit = useCallback((commitId: string) => {
    if (!window.confirm("Revert this commit? Changes will be re-added as unstaged.")) return;
    const commit = commits.find((c) => c.id === commitId);
    if (!commit) return;
    const revertedChanges: DocumentChange[] = commit.changes.map((c) => ({ ...c, id: generateId(), staged: false, timestamp: Date.now() }));
    setChanges((prev) => [...prev, ...revertedChanges]);
  }, [commits]);

  const applyTemplate = useCallback((message: string) => { setCommitMessage(message); setShowTemplates(false); }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && commitMessage.trim() && stagedChanges.length > 0) { e.preventDefault(); doCommit(); }
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, commitMessage, stagedChanges.length, doCommit, onClose]);

  if (!open) return null;

  const cardBg = "hsl(var(--muted) / 0.2)";
  const borderColor = "hsl(var(--border))";
  const inputBg = "hsl(var(--muted) / 0.3)";

  const renderChangeItem = (change: DocumentChange, showStageAction: boolean) => {
    const config = CHANGE_TYPE_CONFIG[change.changeType];
    return (
      <div
        key={change.id}
        className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors hover:bg-muted/30 cursor-default"
      >
        <span style={{ width: "18px", height: "18px", borderRadius: "3px", background: `${config.color}22`, color: config.color, fontSize: "10px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {config.letter}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-foreground truncate">{change.documentName}</div>
          <div className="text-[11px] text-muted-foreground">{change.field} · {timeAgo(change.timestamp)}</div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {showStageAction ? (
            <button onClick={() => stageChange(change.id)} title="Stage change" className="w-[22px] h-[22px] rounded border border-border bg-transparent text-emerald-500 text-xs cursor-pointer flex items-center justify-center hover:bg-emerald-500/10">+</button>
          ) : (
            <button onClick={() => unstageChange(change.id)} title="Unstage change" className="w-[22px] h-[22px] rounded border border-border bg-transparent text-amber-500 text-xs cursor-pointer flex items-center justify-center hover:bg-amber-500/10">−</button>
          )}
          <button onClick={() => discardChange(change.id)} title="Discard change" className="w-[22px] h-[22px] rounded border border-border bg-transparent text-destructive text-xs cursor-pointer flex items-center justify-center hover:bg-destructive/10">✕</button>
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-[99998] flex justify-end bg-background/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-[420px] max-w-[90vw] h-screen bg-background border-l border-border flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">🔀</span>
            <div>
              <div className="text-[15px] font-bold text-foreground">{t("sourceControl.title") || "Source Control"}</div>
              <div className="text-[11px] text-muted-foreground">{changes.length} {t("sourceControl.pendingChanges") || "pending changes"} · {stagedChanges.length} staged</div>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-md border border-border bg-transparent text-muted-foreground text-sm cursor-pointer flex items-center justify-center hover:bg-muted">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {([
            { key: "changes" as const, label: t("sourceControl.changes") || "Changes", icon: "📝", count: changes.length },
            { key: "history" as const, label: t("sourceControl.history") || "History", icon: "📜", count: commits.length },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer bg-transparent border-x-0 border-t-0 ${
                activeTab === tab.key ? "font-semibold text-foreground border-primary" : "font-normal text-muted-foreground border-transparent"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
              <span className="px-1.5 py-0.5 rounded-lg text-[10px] bg-muted">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "changes" && (
            <div>
              {/* Commit message input */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-1.5 mb-2">
                  <input
                    type="text"
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    placeholder={t("sourceControl.commitMessage") || "Commit message (Ctrl+Enter to commit)"}
                    className="flex-1 px-2.5 py-2 rounded-md border border-border bg-muted/30 text-foreground text-xs outline-none focus:border-primary transition-colors"
                  />
                  <button onClick={() => setShowTemplates(!showTemplates)} title="Commit templates" className="w-7 h-7 rounded-md border border-border bg-transparent text-muted-foreground text-xs cursor-pointer flex items-center justify-center hover:bg-muted">📋</button>
                </div>

                {showTemplates && (
                  <div className="mb-2 border border-border rounded-md overflow-hidden">
                    {DEFAULT_TEMPLATES.map((tmpl, i) => (
                      <button
                        key={i}
                        onClick={() => applyTemplate(tmpl.message)}
                        className="w-full px-2.5 py-1.5 text-[11px] text-foreground bg-transparent border-0 border-b border-border last:border-b-0 cursor-pointer text-left flex items-center gap-1.5 hover:bg-muted/50"
                      >
                        <span>{tmpl.icon}</span> {tmpl.message}
                      </button>
                    ))}
                  </div>
                )}

                <textarea
                  value={commitDescription}
                  onChange={(e) => setCommitDescription(e.target.value)}
                  placeholder={t("sourceControl.commitDescription") || "Description (optional)"}
                  rows={2}
                  className="w-full px-2.5 py-2 rounded-md border border-border bg-muted/30 text-foreground text-[11px] outline-none resize-y font-inherit mb-2 focus:border-primary"
                />

                <button
                  onClick={doCommit}
                  disabled={!commitMessage.trim() || stagedChanges.length === 0}
                  className={`w-full py-2 rounded-md border-0 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    commitMessage.trim() && stagedChanges.length > 0
                      ? "bg-primary text-primary-foreground cursor-pointer hover:opacity-90"
                      : "bg-muted text-muted-foreground/40 cursor-not-allowed"
                  }`}
                >
                  ✓ {t("sourceControl.commit") || "Commit"} ({stagedChanges.length} file{stagedChanges.length !== 1 ? "s" : ""})
                </button>
              </div>

              {/* Staged Changes */}
              <div className="px-4 py-2">
                <div className="flex items-center justify-between py-1.5 mb-1">
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Staged Changes ({stagedChanges.length})</div>
                  {stagedChanges.length > 0 && (
                    <button onClick={unstageAll} className="text-[10px] text-muted-foreground bg-transparent border-0 cursor-pointer px-1.5 hover:text-foreground">− Unstage All</button>
                  )}
                </div>
                {stagedChanges.length === 0 ? (
                  <div className="text-[11px] text-muted-foreground/60 px-3 py-2 italic">No staged changes</div>
                ) : (
                  stagedChanges.map((c) => renderChangeItem(c, false))
                )}
              </div>

              {/* Unstaged Changes */}
              <div className="px-4 py-2">
                <div className="flex items-center justify-between py-1.5 mb-1">
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Changes ({unstagedChanges.length})</div>
                  <div className="flex gap-2">
                    {unstagedChanges.length > 0 && (
                      <>
                        <button onClick={stageAll} className="text-[10px] text-emerald-500 bg-transparent border-0 cursor-pointer px-1.5 hover:text-emerald-400">+ Stage All</button>
                        <button onClick={discardAll} className="text-[10px] text-destructive bg-transparent border-0 cursor-pointer px-1.5 hover:text-destructive/80">✕ Discard All</button>
                      </>
                    )}
                  </div>
                </div>
                {unstagedChanges.length === 0 ? (
                  <div className="text-[11px] text-muted-foreground/60 px-3 py-2 italic">No unstaged changes</div>
                ) : (
                  unstagedChanges.map((c) => renderChangeItem(c, true))
                )}
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div>
              <div className="p-4 border-b border-border">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("sourceControl.searchCommits") || "Search commits..."}
                  className="w-full px-2.5 py-2 rounded-md border border-border bg-muted/30 text-foreground text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="px-4 py-2">
                {filteredCommits.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <div className="text-2xl mb-2">📜</div>
                    <div className="text-sm">No commits found</div>
                  </div>
                ) : (
                  filteredCommits.map((commit, idx) => (
                    <div key={commit.id} className="p-3 rounded-lg mb-2 border border-border bg-muted/20">
                      <div className="flex items-start gap-2.5">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${idx === 0 ? "bg-emerald-500" : "bg-indigo-500"}`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-semibold text-foreground mb-0.5">{commit.message}</div>
                          {commit.description && <div className="text-[11px] text-muted-foreground mb-1">{commit.description}</div>}
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground/70">
                            <span>{commit.author}</span><span>·</span>
                            <span>{timeAgo(commit.timestamp)}</span><span>·</span>
                            <span className="font-mono text-[10px]">{commit.hash}</span>
                          </div>
                        </div>
                        <button onClick={() => revertCommit(commit.id)} title="Revert this commit" className="px-2 py-1 rounded border border-border bg-transparent text-muted-foreground text-[10px] cursor-pointer flex-shrink-0 hover:bg-muted hover:text-foreground">↩ Revert</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-border text-[11px] text-muted-foreground flex justify-between items-center">
          <span>🌿 main</span>
          <span>{commits.length} commits · {changes.length} pending</span>
        </div>
      </div>
    </div>
  );
}
