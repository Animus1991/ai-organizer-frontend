/**
 * ResearchIssuesPage - GitHub Issues-style research task management
 * Uses semantic design tokens for full theme compatibility
 */

import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useResearchIssues, PRIORITY_CONFIG, STATE_CONFIG } from "../context/ResearchIssuesContext";
import type { ResearchIssue, IssueState, IssuePriority, IssueFilters, IssueSortField, IssueSortDirection } from "../context/ResearchIssuesContext";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { PageShell } from "../components/layout/PageShell";
import { useMediaQuery } from "../hooks/useMediaQuery";

// ─── Issue Row ───────────────────────────────────────────────
interface IssueRowProps {
  issue: ResearchIssue;
  labels: { id: string; name: string; color: string }[];
  onSelect: (id: string) => void;
  isMobile: boolean;
}

const IssueRow: React.FC<IssueRowProps> = ({ issue, labels, onSelect, isMobile }) => {
  const stateConf = STATE_CONFIG[issue.state];
  const priorityConf = PRIORITY_CONFIG[issue.priority];
  const issueLabels = labels.filter((l) => issue.labels.includes(l.id));

  const formatDate = (d: Date) => {
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "today";
    if (days === 1) return "yesterday";
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return d.toLocaleDateString();
  };

  return (
    <div
      onClick={() => onSelect(issue.id)}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: isMobile ? "8px" : "12px",
        padding: isMobile ? "10px 12px" : "12px 16px",
        borderBottom: "1px solid hsl(var(--border))",
        cursor: "pointer",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "hsl(var(--muted) / 0.3)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <span style={{ fontSize: "16px", marginTop: "2px" }} title={stateConf.label}>
        {stateConf.icon}
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="flex items-center gap-2 flex-wrap">
          <span style={{ fontWeight: 600, color: "hsl(var(--foreground))", fontSize: isMobile ? "13px" : "14px" }}>
            {issue.title}
          </span>
          {!isMobile && issueLabels.map((lbl) => (
            <span
              key={lbl.id}
              style={{
                padding: "1px 8px",
                borderRadius: "10px",
                fontSize: "11px",
                fontWeight: 500,
                color: "#fff",
                background: lbl.color,
                whiteSpace: "nowrap",
              }}
            >
              {lbl.name}
            </span>
          ))}
        </div>
        <div style={{ fontSize: "12px", color: "hsl(var(--muted-foreground))", marginTop: "4px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <span>#{issue.number}</span>
          <span>opened {formatDate(issue.createdAt)}</span>
          {!isMobile && issue.assignees.length > 0 && (
            <span>{issue.assignees.length} assignee{issue.assignees.length > 1 ? "s" : ""}</span>
          )}
          {issue.comments.length > 0 && (
            <span>💬 {issue.comments.length}</span>
          )}
        </div>
      </div>

      {/* Priority badge */}
      <span
        style={{
          padding: "2px 8px",
          borderRadius: "10px",
          fontSize: isMobile ? "10px" : "11px",
          color: priorityConf.color,
          background: priorityConf.bg,
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        {priorityConf.icon} {!isMobile && priorityConf.label}
      </span>
    </div>
  );
};

// ─── Create Issue Modal ──────────────────────────────────────
interface CreateIssueModalProps {
  onClose: () => void;
  onCreate: (data: {
    title: string;
    description: string;
    priority: IssuePriority;
    labels: string[];
    milestoneId?: string;
    state: IssueState;
  }) => void;
  labels: { id: string; name: string; color: string }[];
  milestones: { id: string; title: string }[];
  isMobile: boolean;
}

const CreateIssueModal: React.FC<CreateIssueModalProps> = ({ onClose, onCreate, labels, milestones, isMobile }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<IssuePriority>("medium");
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [milestoneId, setMilestoneId] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onCreate({
      title: title.trim(),
      description: description.trim(),
      priority,
      labels: selectedLabels,
      milestoneId: milestoneId || undefined,
      state: "open",
    });
    onClose();
  };

  const toggleLabel = (id: string) => {
    setSelectedLabels((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    background: "hsl(var(--muted) / 0.3)",
    border: "1px solid hsl(var(--border))",
    borderRadius: "10px",
    color: "hsl(var(--foreground))",
    fontSize: "13px",
    outline: "none",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        padding: isMobile ? "16px" : "24px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
          borderRadius: "16px",
          padding: isMobile ? "16px" : "24px",
          width: "min(560px, 100%)",
          maxHeight: "85vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between mb-5">
          <h3 style={{ margin: 0, color: "hsl(var(--foreground))", fontSize: "18px" }}>New Research Issue</h3>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", color: "hsl(var(--muted-foreground))", fontSize: "18px", cursor: "pointer" }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label style={{ fontSize: "12px", color: "hsl(var(--muted-foreground))", marginBottom: "6px", display: "block" }}>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Issue title..." style={inputStyle} autoFocus />
          </div>

          <div>
            <label style={{ fontSize: "12px", color: "hsl(var(--muted-foreground))", marginBottom: "6px", display: "block" }}>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the issue in detail..." rows={4} style={{ ...inputStyle, resize: "vertical" }} />
          </div>

          <div>
            <label style={{ fontSize: "12px", color: "hsl(var(--muted-foreground))", marginBottom: "6px", display: "block" }}>Priority</label>
            <div className={`grid ${isMobile ? "grid-cols-2" : "grid-cols-4"} gap-1.5`}>
              {(["low", "medium", "high", "critical"] as IssuePriority[]).map((p) => {
                const conf = PRIORITY_CONFIG[p];
                const isActive = priority === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    style={{
                      padding: "8px",
                      background: isActive ? conf.bg : "hsl(var(--muted) / 0.2)",
                      border: isActive ? `1px solid ${conf.color}40` : "1px solid hsl(var(--border))",
                      borderRadius: "10px",
                      color: isActive ? conf.color : "hsl(var(--muted-foreground))",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    {conf.icon} {conf.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={{ fontSize: "12px", color: "hsl(var(--muted-foreground))", marginBottom: "6px", display: "block" }}>Labels</label>
            <div className="flex gap-1.5 flex-wrap">
              {labels.map((lbl) => {
                const isActive = selectedLabels.includes(lbl.id);
                return (
                  <button
                    key={lbl.id}
                    type="button"
                    onClick={() => toggleLabel(lbl.id)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "10px",
                      fontSize: "11px",
                      fontWeight: 500,
                      color: isActive ? "#fff" : "hsl(var(--muted-foreground))",
                      background: isActive ? lbl.color : "hsl(var(--muted) / 0.3)",
                      border: "none",
                      cursor: "pointer",
                      opacity: isActive ? 1 : 0.7,
                    }}
                  >
                    {lbl.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={{ fontSize: "12px", color: "hsl(var(--muted-foreground))", marginBottom: "6px", display: "block" }}>Milestone</label>
            <select value={milestoneId} onChange={(e) => setMilestoneId(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
              <option value="">No milestone</option>
              {milestones.map((ms) => (
                <option key={ms.id} value={ms.id}>{ms.title}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 16px",
                background: "hsl(var(--muted) / 0.3)",
                border: "1px solid hsl(var(--border))",
                borderRadius: "10px",
                color: "hsl(var(--muted-foreground))",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              style={{
                padding: "8px 16px",
                background: title.trim() ? "hsl(var(--primary))" : "hsl(var(--muted) / 0.3)",
                border: "none",
                borderRadius: "10px",
                color: title.trim() ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
                fontSize: "13px",
                fontWeight: 600,
                cursor: title.trim() ? "pointer" : "not-allowed",
              }}
            >
              Create Issue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Issue Detail Panel ──────────────────────────────────────
interface IssueDetailProps {
  issue: ResearchIssue;
  labels: { id: string; name: string; color: string }[];
  milestones: { id: string; title: string }[];
  onClose: () => void;
  onUpdateState: (state: IssueState) => void;
  onAddComment: (content: string) => void;
  isMobile: boolean;
}

const IssueDetail: React.FC<IssueDetailProps> = ({ issue, labels, milestones, onClose, onUpdateState, onAddComment, isMobile }) => {
  const [newComment, setNewComment] = useState("");
  const stateConf = STATE_CONFIG[issue.state];
  const priorityConf = PRIORITY_CONFIG[issue.priority];
  const issueLabels = labels.filter((l) => issue.labels.includes(l.id));
  const milestone = milestones.find((m) => m.id === issue.milestoneId);

  const formatDate = (d: Date) => {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    onAddComment(newComment.trim());
    setNewComment("");
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        justifyContent: "flex-end",
        zIndex: 99999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: isMobile ? "100vw" : "min(640px, 95vw)",
          height: "100vh",
          background: "hsl(var(--card))",
          borderLeft: isMobile ? "none" : "1px solid hsl(var(--border))",
          overflow: "auto",
          padding: isMobile ? "16px" : "24px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-5">
          <div>
            <div style={{ fontSize: "12px", color: "hsl(var(--muted-foreground))", marginBottom: "4px" }}>#{issue.number}</div>
            <h2 style={{ margin: 0, color: "hsl(var(--foreground))", fontSize: isMobile ? "17px" : "20px", lineHeight: 1.3 }}>{issue.title}</h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: "hsl(var(--muted) / 0.3)", border: "1px solid hsl(var(--border))", borderRadius: "10px", color: "hsl(var(--muted-foreground))", fontSize: "18px", cursor: "pointer", width: "34px", height: "34px", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            ×
          </button>
        </div>

        {/* State + Priority bar */}
        <div className="flex gap-2 mb-5 flex-wrap">
          <span style={{ padding: "4px 12px", borderRadius: "10px", fontSize: "12px", fontWeight: 600, color: stateConf.color, background: stateConf.bg }}>
            {stateConf.icon} {stateConf.label}
          </span>
          <span style={{ padding: "4px 12px", borderRadius: "10px", fontSize: "12px", fontWeight: 600, color: priorityConf.color, background: priorityConf.bg }}>
            {priorityConf.icon} {priorityConf.label}
          </span>
          {issueLabels.map((lbl) => (
            <span key={lbl.id} style={{ padding: "4px 10px", borderRadius: "10px", fontSize: "11px", fontWeight: 500, color: "#fff", background: lbl.color }}>
              {lbl.name}
            </span>
          ))}
        </div>

        {/* Description */}
        <div style={{ padding: "16px", background: "hsl(var(--muted) / 0.2)", borderRadius: "10px", marginBottom: "20px", border: "1px solid hsl(var(--border))" }}>
          <div style={{ fontSize: "13px", color: "hsl(var(--foreground))", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
            {issue.description || "No description provided."}
          </div>
        </div>

        {/* Metadata */}
        <div className={`grid ${isMobile ? "grid-cols-2" : "grid-cols-2"} gap-3 mb-5`}>
          {[
            { label: "Milestone", value: milestone?.title || "None" },
            { label: "Created", value: formatDate(issue.createdAt) },
            { label: "Assignees", value: issue.assignees.length || "Unassigned" },
            { label: "Updated", value: formatDate(issue.updatedAt) },
          ].map((item) => (
            <div key={item.label} style={{ padding: "12px", background: "hsl(var(--muted) / 0.15)", borderRadius: "10px" }}>
              <div style={{ fontSize: "11px", color: "hsl(var(--muted-foreground))", marginBottom: "4px" }}>{item.label}</div>
              <div style={{ fontSize: "13px", color: "hsl(var(--foreground))" }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* State actions */}
        <div className={`flex gap-2 mb-6 flex-wrap`}>
          {(["open", "in-progress", "review", "closed"] as IssueState[]).map((s) => {
            const conf = STATE_CONFIG[s];
            const isActive = issue.state === s;
            return (
              <button
                key={s}
                onClick={() => onUpdateState(s)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "10px",
                  fontSize: "12px",
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? conf.color : "hsl(var(--muted-foreground))",
                  background: isActive ? conf.bg : "hsl(var(--muted) / 0.2)",
                  border: isActive ? `1px solid ${conf.color}40` : "1px solid hsl(var(--border))",
                  cursor: "pointer",
                }}
              >
                {conf.icon} {conf.label}
              </button>
            );
          })}
        </div>

        {/* Comments */}
        <div style={{ borderTop: "1px solid hsl(var(--border))", paddingTop: "20px" }}>
          <h4 style={{ margin: "0 0 16px", color: "hsl(var(--foreground))", fontSize: "14px" }}>
            💬 Comments ({issue.comments.length})
          </h4>

          {issue.comments.map((comment) => (
            <div
              key={comment.id}
              style={{
                padding: "12px",
                background: "hsl(var(--muted) / 0.15)",
                borderRadius: "10px",
                marginBottom: "8px",
                borderLeft: "3px solid hsl(var(--primary) / 0.4)",
              }}
            >
              <div className="flex justify-between mb-1.5">
                <span style={{ fontWeight: 500, color: "hsl(var(--foreground))", fontSize: "13px" }}>{comment.userName}</span>
                <span style={{ fontSize: "11px", color: "hsl(var(--muted-foreground))" }}>{formatDate(comment.createdAt)}</span>
              </div>
              <div style={{ fontSize: "13px", color: "hsl(var(--foreground) / 0.85)", lineHeight: 1.5 }}>{comment.content}</div>
            </div>
          ))}

          <form onSubmit={handleSubmitComment} className="mt-3">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Leave a comment..."
              rows={3}
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "hsl(var(--muted) / 0.2)",
                border: "1px solid hsl(var(--border))",
                borderRadius: "10px",
                color: "hsl(var(--foreground))",
                fontSize: "13px",
                outline: "none",
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={!newComment.trim()}
                style={{
                  padding: "6px 14px",
                  background: newComment.trim() ? "hsl(var(--primary))" : "hsl(var(--muted) / 0.3)",
                  border: "none",
                  borderRadius: "10px",
                  color: newComment.trim() ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
                  fontSize: "12px",
                  cursor: newComment.trim() ? "pointer" : "not-allowed",
                }}
              >
                Comment
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ───────────────────────────────────────────────
export default function ResearchIssuesPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const {
    issues,
    labels,
    milestones,
    createIssue,
    updateIssue,
    closeIssue,
    reopenIssue,
    addIssueComment,
    filterIssues,
    sortIssues,
    issueStats,
  } = useResearchIssues();

  const [showCreate, setShowCreate] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [filters, setFilters] = useState<IssueFilters>({ state: "all" });
  const [sortField, setSortField] = useState<IssueSortField>("updated");
  const [sortDir, setSortDir] = useState<IssueSortDirection>("desc");
  const [searchQuery, setSearchQuery] = useState("");

  const displayedIssues = useMemo(() => {
    const filtered = filterIssues({ ...filters, searchQuery: searchQuery || undefined });
    return sortIssues(filtered, sortField, sortDir);
  }, [filterIssues, sortIssues, filters, sortField, sortDir, searchQuery]);

  const selectedIssue = useMemo(() => {
    return selectedIssueId ? issues.find((i) => i.id === selectedIssueId) : undefined;
  }, [issues, selectedIssueId]);

  const handleCreate = useCallback(
    (data: { title: string; description: string; priority: IssuePriority; labels: string[]; milestoneId?: string; state: IssueState }) => {
      createIssue({
        ...data,
        assignees: [],
        createdBy: "user-1",
        linkedDocumentIds: [],
        columnId: "col-todo",
        columnOrder: 0,
      });
    },
    [createIssue]
  );

  const handleUpdateState = useCallback(
    (state: IssueState) => {
      if (!selectedIssueId) return;
      if (state === "closed") {
        closeIssue(selectedIssueId);
      } else {
        const current = issues.find((i) => i.id === selectedIssueId);
        if (current?.state === "closed") {
          reopenIssue(selectedIssueId);
        }
        updateIssue(selectedIssueId, { state });
      }
    },
    [selectedIssueId, issues, closeIssue, reopenIssue, updateIssue]
  );

  const handleAddComment = useCallback(
    (content: string) => {
      if (!selectedIssueId) return;
      addIssueComment(selectedIssueId, "user-1", "You", content);
    },
    [selectedIssueId, addIssueComment]
  );

  const stateTabs: { key: IssueState | "all"; label: string; count: number }[] = [
    { key: "all", label: t("issue.filterAll") || "All", count: issueStats.total },
    { key: "open", label: t("issue.state.open") || "Open", count: issueStats.open },
    { key: "in-progress", label: t("issue.state.inProgress") || "In Progress", count: issueStats.inProgress },
    { key: "review", label: t("issue.state.review") || "In Review", count: issueStats.review },
    { key: "closed", label: t("issue.state.closed") || "Closed", count: issueStats.closed },
  ];

  return (
    <PageShell>
      <div className={`max-w-[1100px] mx-auto ${isMobile ? "px-3 py-4" : "px-6 py-8"}`}>
        {/* Header */}
        <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
          <div>
            <h1 className="m-0 text-lg sm:text-xl font-bold text-foreground">
              {t("issue.title") || "Research Issues"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("issue.subtitle") || "Track research tasks, questions, and hypotheses"}
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              padding: "8px 16px",
              background: "hsl(var(--primary))",
              border: "none",
              borderRadius: "10px",
              color: "hsl(var(--primary-foreground))",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            + {t("issue.new") || "New Issue"}
          </button>
        </div>

        {/* State filter tabs */}
        <div className="flex gap-2 mb-4 flex-wrap overflow-x-auto pb-1">
          {stateTabs.map((tab) => {
            const isActive = (filters.state || "all") === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setFilters((f) => ({ ...f, state: tab.key as IssueState | "all" }))}
                style={{
                  padding: isMobile ? "5px 10px" : "6px 14px",
                  borderRadius: "10px",
                  fontSize: isMobile ? "12px" : "13px",
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                  background: isActive ? "hsl(var(--primary) / 0.12)" : "hsl(var(--muted) / 0.2)",
                  border: isActive ? "1px solid hsl(var(--primary) / 0.3)" : "1px solid hsl(var(--border))",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {tab.label}
                <span style={{
                  padding: "1px 6px",
                  borderRadius: "10px",
                  fontSize: "11px",
                  background: isActive ? "hsl(var(--primary) / 0.2)" : "hsl(var(--muted) / 0.4)",
                }}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search + Sort bar */}
        <div className={`flex gap-2 mb-4 ${isMobile ? "flex-col" : "flex-row flex-wrap"}`}>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("issue.search") || "Search issues..."}
            style={{
              flex: 1,
              minWidth: "200px",
              padding: "8px 12px",
              background: "hsl(var(--muted) / 0.2)",
              border: "1px solid hsl(var(--border))",
              borderRadius: "10px",
              color: "hsl(var(--foreground))",
              fontSize: "13px",
              outline: "none",
            }}
          />
          <div className="flex gap-2">
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as IssueSortField)}
              style={{
                padding: "8px 12px",
                background: "hsl(var(--muted) / 0.2)",
                border: "1px solid hsl(var(--border))",
                borderRadius: "10px",
                color: "hsl(var(--foreground))",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              <option value="updated">Sort: Updated</option>
              <option value="created">Sort: Created</option>
              <option value="priority">Sort: Priority</option>
              <option value="title">Sort: Title</option>
            </select>
            <button
              onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
              style={{
                padding: "8px 12px",
                background: "hsl(var(--muted) / 0.2)",
                border: "1px solid hsl(var(--border))",
                borderRadius: "10px",
                color: "hsl(var(--muted-foreground))",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              {sortDir === "desc" ? "↓ Newest" : "↑ Oldest"}
            </button>
          </div>
        </div>

        {/* Issues list */}
        <div
          style={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          {displayedIssues.length === 0 ? (
            <div className="py-12 text-center">
              <div style={{ fontSize: "32px", marginBottom: "12px" }}>📋</div>
              <div style={{ fontSize: "14px", color: "hsl(var(--foreground))", fontWeight: 600 }}>{t("issue.noIssues") || "No issues found"}</div>
              <div style={{ fontSize: "12px", marginTop: "4px", color: "hsl(var(--muted-foreground))" }}>
                {t("issue.noIssuesHint") || "Create a new issue to get started"}
              </div>
            </div>
          ) : (
            displayedIssues.map((issue) => (
              <IssueRow key={issue.id} issue={issue} labels={labels} onSelect={setSelectedIssueId} isMobile={isMobile} />
            ))
          )}
        </div>

        <div className="mt-4 text-xs text-center text-muted-foreground">
          {displayedIssues.length} of {issueStats.total} issues
        </div>
      </div>

      {showCreate && (
        <CreateIssueModal onClose={() => setShowCreate(false)} onCreate={handleCreate} labels={labels} milestones={milestones} isMobile={isMobile} />
      )}

      {selectedIssue && (
        <IssueDetail
          issue={selectedIssue}
          labels={labels}
          milestones={milestones}
          onClose={() => setSelectedIssueId(null)}
          onUpdateState={handleUpdateState}
          onAddComment={handleAddComment}
          isMobile={isMobile}
        />
      )}
    </PageShell>
  );
}
