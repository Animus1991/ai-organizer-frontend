/**
 * ProjectBoardPage - GitHub Projects-style Kanban board for research tasks
 * Features: draggable columns, issue cards, create/move issues, column management
 * Uses semantic design tokens for full theme compatibility
 */

import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useResearchIssues, PRIORITY_CONFIG } from "../context/ResearchIssuesContext";
import type { ResearchIssue, IssuePriority, IssueState } from "../context/ResearchIssuesContext";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { PageShell } from "../components/layout/PageShell";
import { useMediaQuery } from "../hooks/useMediaQuery";

// ─── Column definition ──────────────────────────────────────
interface BoardColumn {
  id: string;
  title: string;
  state: IssueState;
  icon: string;
}

const DEFAULT_COLUMNS: BoardColumn[] = [
  { id: "col-todo", title: "To Do", state: "open", icon: "📋" },
  { id: "col-inprogress", title: "In Progress", state: "in-progress", icon: "🔄" },
  { id: "col-review", title: "In Review", state: "review", icon: "👁️" },
  { id: "col-done", title: "Done", state: "closed", icon: "✅" },
];

// ─── Issue Card ──────────────────────────────────────────────
interface IssueCardProps {
  issue: ResearchIssue;
  labels: { id: string; name: string; color: string }[];
  onDragStart: (issueId: string) => void;
  onClick: (issueId: string) => void;
}

const IssueCard: React.FC<IssueCardProps> = ({ issue, labels, onDragStart, onClick }) => {
  const priorityConf = PRIORITY_CONFIG[issue.priority];
  const issueLabels = labels.filter((l) => issue.labels.includes(l.id));

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", issue.id);
        onDragStart(issue.id);
      }}
      onClick={() => onClick(issue.id)}
      className="mb-2 cursor-grab active:cursor-grabbing transition-all duration-150"
      style={{
        padding: "12px",
        background: "hsl(var(--card))",
        border: "1px solid hsl(var(--border))",
        borderRadius: "10px",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "hsl(var(--primary) / 0.4)";
        e.currentTarget.style.boxShadow = "0 2px 8px hsl(var(--primary) / 0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "hsl(var(--border))";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Labels */}
      {issueLabels.length > 0 && (
        <div className="flex gap-1 flex-wrap mb-2">
          {issueLabels.slice(0, 3).map((lbl) => (
            <span
              key={lbl.id}
              style={{
                padding: "1px 8px",
                borderRadius: "10px",
                fontSize: "10px",
                fontWeight: 500,
                color: "#fff",
                background: lbl.color,
              }}
            >
              {lbl.name}
            </span>
          ))}
        </div>
      )}

      {/* Title */}
      <div style={{ fontSize: "13px", fontWeight: 600, color: "hsl(var(--foreground))", lineHeight: 1.4, marginBottom: "8px" }}>
        {issue.title}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center">
        <span style={{ fontSize: "11px", color: "hsl(var(--muted-foreground))" }}>#{issue.number}</span>
        <div className="flex items-center gap-2">
          {issue.comments.length > 0 && (
            <span style={{ fontSize: "11px", color: "hsl(var(--muted-foreground))" }}>💬 {issue.comments.length}</span>
          )}
          <span
            style={{
              padding: "1px 6px",
              borderRadius: "4px",
              fontSize: "10px",
              color: priorityConf.color,
              background: priorityConf.bg,
            }}
          >
            {priorityConf.icon}
          </span>
          {issue.assignees.length > 0 && (
            <div className="flex">
              {issue.assignees.slice(0, 2).map((_, idx) => (
                <div
                  key={idx}
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    background: `hsl(${idx * 120 + 200}, 60%, 50%)`,
                    border: "2px solid hsl(var(--background))",
                    marginLeft: idx > 0 ? "-6px" : 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "9px",
                    color: "#fff",
                  }}
                >
                  {idx + 1}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Quick Add Issue ─────────────────────────────────────────
interface QuickAddProps {
  columnId: string;
  columnState: IssueState;
  onAdd: (title: string, columnId: string, state: IssueState) => void;
}

const QuickAddIssue: React.FC<QuickAddProps> = ({ columnId, columnState, onAdd }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title.trim(), columnId, columnState);
    setTitle("");
    setIsAdding(false);
  };

  if (!isAdding) {
    return (
      <button
        onClick={() => setIsAdding(true)}
        style={{
          width: "100%",
          padding: "8px",
          background: "transparent",
          border: "1px dashed hsl(var(--border))",
          borderRadius: "10px",
          color: "hsl(var(--muted-foreground))",
          fontSize: "12px",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        + Add item
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Issue title..."
        autoFocus
        onBlur={() => { if (!title.trim()) setIsAdding(false); }}
        onKeyDown={(e) => { if (e.key === "Escape") setIsAdding(false); }}
        style={{
          width: "100%",
          padding: "8px 10px",
          background: "hsl(var(--muted) / 0.3)",
          border: "1px solid hsl(var(--primary) / 0.4)",
          borderRadius: "10px",
          color: "hsl(var(--foreground))",
          fontSize: "12px",
          outline: "none",
          boxSizing: "border-box",
        }}
      />
    </form>
  );
};

// ─── Board Column ────────────────────────────────────────────
interface BoardColumnViewProps {
  column: BoardColumn;
  issues: ResearchIssue[];
  labels: { id: string; name: string; color: string }[];
  onDragStart: (issueId: string) => void;
  onDrop: (columnId: string) => void;
  onIssueClick: (issueId: string) => void;
  onQuickAdd: (title: string, columnId: string, state: IssueState) => void;
  isMobile: boolean;
}

const BoardColumnView: React.FC<BoardColumnViewProps> = ({
  column,
  issues,
  labels,
  onDragStart,
  onDrop,
  onIssueClick,
  onQuickAdd,
  isMobile,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        onDrop(column.id);
      }}
      style={{
        flex: isMobile ? "1 1 100%" : "1 1 260px",
        minWidth: isMobile ? "100%" : "260px",
        maxWidth: isMobile ? "100%" : "340px",
        background: isDragOver ? "hsl(var(--primary) / 0.08)" : "hsl(var(--muted) / 0.2)",
        border: isDragOver ? "1px solid hsl(var(--primary) / 0.3)" : "1px solid hsl(var(--border))",
        borderRadius: "10px",
        padding: "12px",
        transition: "all 0.2s ease",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 mb-3 py-1">
        <span style={{ fontSize: "14px" }}>{column.icon}</span>
        <span style={{ fontWeight: 600, color: "hsl(var(--foreground))", fontSize: "13px" }}>{column.title}</span>
        <span
          className="ml-auto"
          style={{
            padding: "2px 8px",
            borderRadius: "10px",
            fontSize: "11px",
            background: "hsl(var(--muted) / 0.5)",
            color: "hsl(var(--muted-foreground))",
          }}
        >
          {issues.length}
        </span>
      </div>

      {/* Issue cards */}
      <div style={{ flex: 1, minHeight: "60px" }}>
        {issues.map((issue) => (
          <IssueCard
            key={issue.id}
            issue={issue}
            labels={labels}
            onDragStart={onDragStart}
            onClick={onIssueClick}
          />
        ))}
      </div>

      {/* Quick add */}
      <div className="mt-2">
        <QuickAddIssue columnId={column.id} columnState={column.state} onAdd={onQuickAdd} />
      </div>
    </div>
  );
};

// ─── Main Page ───────────────────────────────────────────────
export default function ProjectBoardPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const {
    issues,
    labels,
    createIssue,
    moveIssueToColumn,
    getIssuesByColumn,
    updateIssue,
    issueStats,
  } = useResearchIssues();

  const [draggedIssueId, setDraggedIssueId] = useState<string | null>(null);
  const [columns] = useState<BoardColumn[]>(DEFAULT_COLUMNS);

  const columnIssues = useMemo(() => {
    const map: Record<string, ResearchIssue[]> = {};
    columns.forEach((col) => {
      map[col.id] = getIssuesByColumn(col.id);
    });
    return map;
  }, [columns, getIssuesByColumn, issues]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDrop = useCallback(
    (columnId: string) => {
      if (!draggedIssueId) return;
      const column = columns.find((c) => c.id === columnId);
      if (!column) return;
      const existingInColumn = getIssuesByColumn(columnId);
      moveIssueToColumn(draggedIssueId, columnId, existingInColumn.length);
      updateIssue(draggedIssueId, { state: column.state });
      setDraggedIssueId(null);
    },
    [draggedIssueId, columns, getIssuesByColumn, moveIssueToColumn, updateIssue]
  );

  const handleQuickAdd = useCallback(
    (title: string, columnId: string, state: IssueState) => {
      const existingInColumn = getIssuesByColumn(columnId);
      createIssue({
        title,
        description: "",
        state,
        priority: "medium" as IssuePriority,
        labels: [],
        assignees: [],
        createdBy: "user-1",
        linkedDocumentIds: [],
        columnId,
        columnOrder: existingInColumn.length,
      });
    },
    [createIssue, getIssuesByColumn]
  );

  const handleIssueClick = useCallback(
    (issueId: string) => {
      navigate(`/issues?selected=${issueId}`);
    },
    [navigate]
  );

  const statItems = [
    { label: "Open", count: issueStats.open, color: "hsl(var(--success))" },
    { label: "In Progress", count: issueStats.inProgress, color: "hsl(var(--info))" },
    { label: "Review", count: issueStats.review, color: "hsl(var(--primary))" },
    { label: "Closed", count: issueStats.closed, color: "hsl(var(--muted-foreground))" },
  ];

  return (
    <PageShell>
      <div className={`max-w-[1400px] mx-auto ${isMobile ? "px-3 py-4" : "px-6 py-8"}`}>
        {/* Header */}
        <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
          <div>
            <h1 className="m-0 text-lg sm:text-xl font-bold text-foreground">
              {t("board.title") || "Project Board"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("board.subtitle") || "Organize research tasks with a Kanban board"}
            </p>
          </div>
          <button
            onClick={() => navigate("/issues")}
            style={{
              padding: "8px 14px",
              background: "hsl(var(--muted) / 0.4)",
              border: "1px solid hsl(var(--border))",
              borderRadius: "10px",
              color: "hsl(var(--muted-foreground))",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            📋 {t("board.listView") || "List View"}
          </button>
        </div>

        {/* Stats summary */}
        <div className={`flex gap-2 sm:gap-3 mb-5 flex-wrap`}>
          {statItems.map((stat) => (
            <div
              key={stat.label}
              style={{
                padding: isMobile ? "6px 10px" : "8px 16px",
                background: "hsl(var(--muted) / 0.2)",
                border: "1px solid hsl(var(--border))",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: stat.color }} />
              <span style={{ fontSize: "12px", color: "hsl(var(--muted-foreground))" }}>{stat.label}</span>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "hsl(var(--foreground))" }}>{stat.count}</span>
            </div>
          ))}
        </div>

        {/* Board columns */}
        <div
          className={isMobile ? "flex flex-col gap-3" : "flex gap-4 overflow-x-auto pb-4"}
          style={{ alignItems: "flex-start" }}
        >
          {columns.map((column) => (
            <BoardColumnView
              key={column.id}
              column={column}
              issues={columnIssues[column.id] || []}
              labels={labels}
              onDragStart={setDraggedIssueId}
              onDrop={handleDrop}
              onIssueClick={handleIssueClick}
              onQuickAdd={handleQuickAdd}
              isMobile={isMobile}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="mt-4 text-xs text-center text-muted-foreground">
          {issueStats.total} total issues across {columns.length} columns
        </div>
      </div>
    </PageShell>
  );
}
