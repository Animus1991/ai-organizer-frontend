/**
 * DiscussionForumsPage — GitHub Discussions equivalent for academic projects
 * Features: project forums, threaded discussions, categories, reactions, Q&A with answers
 */

import { useState, useMemo, useCallback } from "react";
import { useDiscussionForums, CATEGORY_CONFIG } from "../context/DiscussionForumsContext";
import type { DiscussionCategory, DiscussionStatus, ReactionType } from "../context/DiscussionForumsContext";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";

// ─── Sub-types ───────────────────────────────────────────────
type ForumView = "list" | "thread";
type SortMode = "latest" | "top" | "oldest" | "unanswered";

const ALL_REACTIONS: ReactionType[] = ["👍", "👎", "😄", "🎉", "❤️", "🚀", "👀", "🤔"];
const CURRENT_USER = { id: "user-1", name: "Dr. Elena Vasquez", avatar: "🧬" };

// ─── Component ───────────────────────────────────────────────
export default function DiscussionForumsPage() {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const accent = "hsl(var(--primary))";
  const textColor = "hsl(var(--foreground))";
  const bgColor = "hsl(var(--background))";
  const {
    threads, projects, replies,
    createThread, deleteThread, pinThread, unpinThread, lockThread, unlockThread, closeThread, reopenThread,
    addReply, deleteReply, markAsAnswer, unmarkAsAnswer,
    addReaction, removeReaction, getRepliesByThread, incrementViewCount,
  } = useDiscussionForums();

  const [view, setView] = useState<ForumView>("list");
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || "");
  const [selectedThreadId, setSelectedThreadId] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<DiscussionCategory | "all">("all");
  const [filterStatus, setFilterStatus] = useState<DiscussionStatus | "all">("all");
  const [sortMode, setSortMode] = useState<SortMode>("latest");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewThread, setShowNewThread] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<DiscussionCategory>("general");
  const [newTags, setNewTags] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [showReactions, setShowReactions] = useState<string | null>(null);

  // ─── Filtered & Sorted Threads ─────────────────────────
  const projectThreads = useMemo(() => {
    let result = threads.filter((t) => t.projectId === selectedProjectId);
    if (filterCategory !== "all") result = result.filter((t) => t.category === filterCategory);
    if (filterStatus !== "all") result = result.filter((t) => t.status === filterStatus);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t) => t.title.toLowerCase().includes(q) || t.content.toLowerCase().includes(q) || t.tags.some((tag) => tag.toLowerCase().includes(q)));
    }
    // Pinned first, then sort
    const pinned = result.filter((t) => t.isPinned);
    const unpinned = result.filter((t) => !t.isPinned);
    switch (sortMode) {
      case "latest": unpinned.sort((a, b) => b.lastActivityAt - a.lastActivityAt); break;
      case "top": unpinned.sort((a, b) => b.replyCount - a.replyCount); break;
      case "oldest": unpinned.sort((a, b) => a.createdAt - b.createdAt); break;
      case "unanswered": unpinned.sort((a, b) => a.replyCount - b.replyCount); break;
    }
    return [...pinned, ...unpinned];
  }, [threads, selectedProjectId, filterCategory, filterStatus, searchQuery, sortMode]);

  const selectedThread = useMemo(() => threads.find((t) => t.id === selectedThreadId), [threads, selectedThreadId]);
  const threadReplies = useMemo(() => {
    if (!selectedThreadId) return [];
    return getRepliesByThread(selectedThreadId).sort((a, b) => a.createdAt - b.createdAt);
  }, [selectedThreadId, getRepliesByThread, replies]);

  // ─── Handlers ──────────────────────────────────────────
  const handleOpenThread = useCallback((threadId: string) => {
    setSelectedThreadId(threadId);
    setView("thread");
    incrementViewCount(threadId);
  }, [incrementViewCount]);

  const handleBackToList = useCallback(() => {
    setView("list");
    setSelectedThreadId("");
    setReplyContent("");
  }, []);

  const handleCreateThread = useCallback(() => {
    if (!newTitle.trim() || !newContent.trim()) return;
    createThread({
      projectId: selectedProjectId, title: newTitle.trim(), content: newContent.trim(),
      category: newCategory, status: "open", authorId: CURRENT_USER.id, authorName: CURRENT_USER.name,
      authorAvatar: CURRENT_USER.avatar, isPinned: false, isLocked: false,
      tags: newTags.split(",").map((t) => t.trim()).filter(Boolean),
    });
    setNewTitle(""); setNewContent(""); setNewTags(""); setShowNewThread(false);
  }, [newTitle, newContent, newCategory, newTags, selectedProjectId, createThread]);

  const handleAddReply = useCallback(() => {
    if (!replyContent.trim() || !selectedThreadId) return;
    addReply({
      threadId: selectedThreadId, authorId: CURRENT_USER.id, authorName: CURRENT_USER.name,
      authorAvatar: CURRENT_USER.avatar, content: replyContent.trim(), parentReplyId: null,
    });
    setReplyContent("");
  }, [replyContent, selectedThreadId, addReply]);

  const handleReaction = useCallback((targetType: "thread" | "reply", targetId: string, reaction: ReactionType) => {
    const target = targetType === "thread"
      ? threads.find((t) => t.id === targetId)
      : replies.find((r) => r.id === targetId);
    if (!target) return;
    const existing = target.reactions.find((r) => r.type === reaction);
    if (existing?.users.includes(CURRENT_USER.id)) {
      removeReaction(targetType, targetId, reaction, CURRENT_USER.id);
    } else {
      addReaction(targetType, targetId, reaction, CURRENT_USER.id);
    }
    setShowReactions(null);
  }, [threads, replies, addReaction, removeReaction]);

  const formatDate = (ts: number): string => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(ts).toLocaleDateString();
  };

  // ─── Styles ────────────────────────────────────────────
  const cardStyle: React.CSSProperties = {
    background: "hsl(var(--card))", border: "1px solid hsl(var(--border))",
    borderRadius: "12px", padding: "16px", transition: "all 0.2s",
  };

  const btnStyle = (primary = false): React.CSSProperties => ({
    padding: "8px 16px", borderRadius: "8px", border: primary ? "none" : "1px solid hsl(var(--border))",
    background: primary ? "hsl(var(--primary))" : "hsl(var(--muted))", color: primary ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
    cursor: "pointer", fontSize: "13px", fontWeight: 600,
  });

  const pillStyle = (active: boolean): React.CSSProperties => ({
    padding: "5px 12px", borderRadius: "20px",
    border: `1px solid ${active ? "hsl(var(--primary))" : "hsl(var(--border))"}`,
    background: active ? "hsl(var(--primary) / 0.12)" : "transparent",
    color: active ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
    cursor: "pointer", fontSize: "12px", fontWeight: 500,
  });

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: "8px",
    border: "1px solid hsl(var(--border))", background: "hsl(var(--muted) / 0.3)",
    color: "hsl(var(--foreground))", fontSize: "14px", outline: "none", boxSizing: "border-box",
  };

  const statusBadge = (status: DiscussionStatus): React.CSSProperties => ({
    padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 600,
    background: status === "open" ? "hsl(var(--success) / 0.12)" : status === "answered" ? "hsl(var(--primary) / 0.12)" : "hsl(var(--destructive) / 0.12)",
    color: status === "open" ? "hsl(var(--success))" : status === "answered" ? "hsl(var(--primary))" : "hsl(var(--destructive))",
    border: `1px solid ${status === "open" ? "hsl(var(--success) / 0.25)" : status === "answered" ? "hsl(var(--primary) / 0.25)" : "hsl(var(--destructive) / 0.25)"}`,
  });

  // ─── Render Reactions ──────────────────────────────────
  const renderReactions = (targetType: "thread" | "reply", targetId: string, reactions: { type: ReactionType; users: string[] }[]) => (
    <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
      {reactions.filter((r) => r.users.length > 0).map((r) => (
        <button
          key={r.type}
          onClick={() => handleReaction(targetType, targetId, r.type)}
          className={`px-2 py-0.5 rounded-xl text-xs cursor-pointer border transition-colors ${
            r.users.includes(CURRENT_USER.id) ? 'border-primary/40 bg-primary/10' : 'border-border bg-muted/30'
          } text-muted-foreground`}
        >
          {r.type} {r.users.length}
        </button>
      ))}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setShowReactions(showReactions === targetId ? null : targetId)}
          className="px-2 py-0.5 rounded-xl text-xs cursor-pointer border border-border bg-transparent text-muted-foreground"
        >
          😀+
        </button>
        {showReactions === targetId && (
          <div className="absolute bottom-full left-0 bg-popover border border-border rounded-xl p-1.5 flex gap-1 z-[100] mb-1 shadow-lg">
            {ALL_REACTIONS.map((r) => (
              <button key={r} onClick={() => handleReaction(targetType, targetId, r)} className="p-1 px-1.5 rounded-md border-none bg-transparent cursor-pointer text-base hover:bg-accent">
                {r}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ─── Thread Detail View ────────────────────────────────
  if (view === "thread" && selectedThread) {
    const catConf = CATEGORY_CONFIG[selectedThread.category];
    return (
      <div className="min-h-screen bg-background text-foreground" style={{ padding: "32px 24px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          {/* Back */}
          <button onClick={handleBackToList} style={{ ...btnStyle(), marginBottom: "20px" }}>
            ← {t("common.back") || "Back"}
          </button>

          {/* Thread Header */}
          <div style={{ ...cardStyle, marginBottom: "20px" }}>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "12px", flexWrap: "wrap" }}>
              {selectedThread.isPinned && <span style={{ fontSize: "12px", color: "#f59e0b" }}>📌 {t("discussion.pinned")}</span>}
              {selectedThread.isLocked && <span style={{ fontSize: "12px", color: "#ef4444" }}>🔒 {t("discussion.locked")}</span>}
              <span style={{ ...statusBadge(selectedThread.status) }}>{selectedThread.status}</span>
              <span style={{ fontSize: "12px", color: catConf.color, background: `${catConf.color}15`, padding: "2px 8px", borderRadius: "10px", border: `1px solid ${catConf.color}30` }}>
                {catConf.icon} {catConf.label}
              </span>
            </div>
            <h2 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 12px" }}>{selectedThread.title}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <span style={{ fontSize: "20px" }}>{selectedThread.authorAvatar}</span>
              <span style={{ fontWeight: 600, fontSize: "14px" }}>{selectedThread.authorName}</span>
              <span style={{ color: "hsl(var(--muted-foreground))", fontSize: "12px" }}>{formatDate(selectedThread.createdAt)}</span>
              <span style={{ color: "hsl(var(--muted-foreground))", fontSize: "12px", opacity: 0.7 }}>· 👁 {selectedThread.viewCount}</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4 whitespace-pre-wrap">
              {selectedThread.content}
            </p>
            {selectedThread.tags.length > 0 && (
              <div style={{ display: "flex", gap: "6px", marginBottom: "12px", flexWrap: "wrap" }}>
                {selectedThread.tags.map((tag) => (
                  <span key={tag} style={{ fontSize: "11px", color: accent, background: `${accent}15`, padding: "2px 8px", borderRadius: "10px" }}>#{tag}</span>
                ))}
              </div>
            )}
            {renderReactions("thread", selectedThread.id, selectedThread.reactions)}

            {/* Thread Actions */}
            <div style={{ display: "flex", gap: "8px", marginTop: "16px", borderTop: "1px solid hsl(var(--border))", paddingTop: "12px", flexWrap: "wrap" }}>
              <button onClick={() => selectedThread.isPinned ? unpinThread(selectedThread.id) : pinThread(selectedThread.id)} style={btnStyle()}>
                {selectedThread.isPinned ? "📌 Unpin" : "📌 Pin"}
              </button>
              <button onClick={() => selectedThread.isLocked ? unlockThread(selectedThread.id) : lockThread(selectedThread.id)} style={btnStyle()}>
                {selectedThread.isLocked ? "🔓 Unlock" : "🔒 Lock"}
              </button>
              <button onClick={() => selectedThread.status === "closed" ? reopenThread(selectedThread.id) : closeThread(selectedThread.id)} style={btnStyle()}>
                {selectedThread.status === "closed" ? "🔄 Reopen" : "✖ Close"}
              </button>
              <button onClick={() => { deleteThread(selectedThread.id); handleBackToList(); }} style={{ ...btnStyle(), color: "hsl(var(--destructive))", borderColor: "hsl(var(--destructive) / 0.25)" }}>
                🗑 {t("common.delete") || "Delete"}
              </button>
            </div>
          </div>

          {/* Replies */}
          <div style={{ marginBottom: "20px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px" }}>
              💬 {threadReplies.length} {threadReplies.length === 1 ? "Reply" : "Replies"}
            </h3>
            {threadReplies.map((reply) => (
              <div key={reply.id} style={{ ...cardStyle, marginBottom: "12px", borderLeft: reply.isAnswer ? "3px solid hsl(var(--success))" : undefined }}>
                {reply.isAnswer && (
                  <div className="text-xs text-[hsl(var(--success))] font-semibold mb-2">✅ {t("discussion.markedAnswer")}</div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "18px" }}>{reply.authorAvatar}</span>
                  <span className="font-semibold text-sm text-foreground">{reply.authorName}</span>
                  <span className="text-muted-foreground text-xs">{formatDate(reply.createdAt)}</span>
                  {reply.updatedAt > reply.createdAt + 60000 && (
                    <span className="text-muted-foreground/60 text-[11px]">(edited)</span>
                  )}
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed mb-3 whitespace-pre-wrap">
                  {reply.content}
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                  {renderReactions("reply", reply.id, reply.reactions)}
                  <div style={{ display: "flex", gap: "6px" }}>
                    {selectedThread.category === "q-and-a" && (
                      <button
                        onClick={() => reply.isAnswer ? unmarkAsAnswer(reply.id) : markAsAnswer(reply.id)}
                        style={{ ...btnStyle(), fontSize: "11px", padding: "4px 10px", color: reply.isAnswer ? "hsl(var(--success))" : "hsl(var(--muted-foreground))" }}
                      >
                        {reply.isAnswer ? "✅ Unmark Answer" : "✅ Mark as Answer"}
                      </button>
                    )}
                    <button onClick={() => deleteReply(reply.id)} style={{ ...btnStyle(), fontSize: "11px", padding: "4px 10px", color: "hsl(var(--destructive))" }}>
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Reply Form */}
          {!selectedThread.isLocked ? (
            <div style={cardStyle}>
              <h4 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "10px" }}>{t("discussion.addReply")}</h4>
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={t("discussion.replyPlaceholder")}
                rows={4}
                style={{ ...inputStyle, resize: "vertical", minHeight: "100px", marginBottom: "10px" }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button onClick={handleAddReply} disabled={!replyContent.trim()} style={{ ...btnStyle(true), opacity: replyContent.trim() ? 1 : 0.5 }}>
                  💬 {t("discussion.reply")}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ ...cardStyle, textAlign: "center" }} className="text-muted-foreground">
              🔒 {t("discussion.threadLocked")}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── List View ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background text-foreground" style={{ padding: "32px 24px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 700, margin: 0 }}>💬 {t("discussion.title")}</h1>
            <p className="text-muted-foreground mt-2 text-sm">{t("discussion.subtitle")}</p>
          </div>
          <button onClick={() => setShowNewThread(true)} style={btnStyle(true)}>
            ➕ {t("discussion.newThread")}
          </button>
        </div>

        {/* Project Selector */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => setSelectedProjectId(project.id)}
              style={{
                ...pillStyle(selectedProjectId === project.id),
                padding: "8px 16px", fontSize: "13px",
              }}
            >
              {project.icon} {project.name} ({project.threadCount})
            </button>
          ))}
        </div>

        {/* Search + Filters */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("discussion.searchPlaceholder")}
            style={{ ...inputStyle, maxWidth: "300px" }}
          />
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {(["all", ...Object.keys(CATEGORY_CONFIG)] as (DiscussionCategory | "all")[]).map((cat) => (
              <button key={cat} onClick={() => setFilterCategory(cat)} style={pillStyle(filterCategory === cat)}>
                {cat === "all" ? t("common.all") : `${CATEGORY_CONFIG[cat as DiscussionCategory].icon} ${CATEGORY_CONFIG[cat as DiscussionCategory].label}`}
              </button>
            ))}
          </div>
        </div>

        {/* Sort + Status */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "6px" }}>
            {(["all", "open", "answered", "closed"] as (DiscussionStatus | "all")[]).map((s) => (
              <button key={s} onClick={() => setFilterStatus(s)} style={pillStyle(filterStatus === s)}>
                {s === "all" ? t("common.all") : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <div className="w-px h-5 bg-border" />
          <select
            value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)}
            style={{ ...inputStyle, maxWidth: "160px", padding: "6px 10px" }}
          >
            <option value="latest">{t("discussion.sortLatest")}</option>
            <option value="top">{t("discussion.sortTop")}</option>
            <option value="oldest">{t("discussion.sortOldest")}</option>
            <option value="unanswered">{t("discussion.sortUnanswered")}</option>
          </select>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "24px" }}>
          {[
            { label: t("discussion.totalThreads"), value: projectThreads.length, icon: "💬" },
            { label: t("discussion.openThreads"), value: projectThreads.filter((t) => t.status === "open").length, icon: "🟢" },
            { label: t("discussion.answered"), value: projectThreads.filter((t) => t.status === "answered").length, icon: "✅" },
            { label: t("discussion.participants"), value: new Set(projectThreads.map((t) => t.authorId)).size, icon: "👥" },
          ].map((stat) => (
            <div key={stat.label} style={{ ...cardStyle, textAlign: "center" }}>
              <div style={{ fontSize: "20px", marginBottom: "4px" }}>{stat.icon}</div>
              <div style={{ fontSize: "20px", fontWeight: 700 }}>{stat.value}</div>
              <div className="text-[11px] text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Thread List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {projectThreads.map((thread) => {
            const catConf = CATEGORY_CONFIG[thread.category];
            return (
              <div
                key={thread.id}
                onClick={() => handleOpenThread(thread.id)}
                style={{ ...cardStyle, cursor: "pointer", display: "flex", gap: "14px", alignItems: "flex-start" }}
              >
                <div style={{ fontSize: "24px", flexShrink: 0, marginTop: "2px" }}>{catConf.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                    {thread.isPinned && <span style={{ fontSize: "11px" }} className="text-[hsl(var(--warning))]">📌</span>}
                    {thread.isLocked && <span style={{ fontSize: "11px" }} className="text-[hsl(var(--destructive))]">🔒</span>}
                    <span style={{ fontWeight: 600, fontSize: "15px" }}>{thread.title}</span>
                    <span style={statusBadge(thread.status)}>{thread.status}</span>
                  </div>
                  <p className="text-muted-foreground text-sm mb-2 overflow-hidden text-ellipsis whitespace-nowrap">
                    {thread.content}
                  </p>
                  <div className="flex gap-3 items-center flex-wrap text-xs text-muted-foreground">
                    <span>{thread.authorAvatar} {thread.authorName}</span>
                    <span>💬 {thread.replyCount}</span>
                    <span>👁 {thread.viewCount}</span>
                    <span>{formatDate(thread.lastActivityAt)}</span>
                    {thread.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="bg-muted px-1.5 py-0.5 rounded-lg text-[11px] text-muted-foreground">#{tag}</span>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flexShrink: 0 }}>
                  <span style={{ fontSize: "12px", color: catConf.color, background: `${catConf.color}15`, padding: "2px 8px", borderRadius: "10px", border: `1px solid ${catConf.color}30` }}>
                    {catConf.label}
                  </span>
                  {thread.reactions.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {thread.reactions.map((r) => r.type).join("")}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {projectThreads.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <div className="text-5xl mb-4">💬</div>
              <p className="font-semibold">{t("discussion.noThreads")}</p>
              <p className="text-sm">{t("discussion.noThreadsHint")}</p>
            </div>
          )}
        </div>

        {/* New Thread Modal */}
        {showNewThread && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-5"
            onClick={(e) => { if (e.target === e.currentTarget) setShowNewThread(false); }}
          >
            <div className="bg-popover border border-border rounded-2xl p-7 max-w-[600px] w-full shadow-xl">
              <h3 className="text-lg font-bold text-foreground mb-5">➕ {t("discussion.newThread")}</h3>

              <div className="mb-3.5">
                <label className="text-xs text-muted-foreground mb-1.5 block">{t("common.title")}</label>
                <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder={t("discussion.titlePlaceholder")} style={inputStyle} />
              </div>

              <div className="mb-3.5">
                <label className="text-xs text-muted-foreground mb-1.5 block">{t("discussion.category")}</label>
                <div className="flex gap-1.5 flex-wrap">
                  {(Object.keys(CATEGORY_CONFIG) as DiscussionCategory[]).map((cat) => (
                    <button key={cat} onClick={() => setNewCategory(cat)} style={pillStyle(newCategory === cat)}>
                      {CATEGORY_CONFIG[cat].icon} {CATEGORY_CONFIG[cat].label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-3.5">
                <label className="text-xs text-muted-foreground mb-1.5 block">{t("common.description")}</label>
                <textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder={t("discussion.contentPlaceholder")} rows={5} style={{ ...inputStyle, resize: "vertical" as const }} />
              </div>

              <div className="mb-5">
                <label className="text-xs text-muted-foreground mb-1.5 block">{t("discussion.tags")}</label>
                <input value={newTags} onChange={(e) => setNewTags(e.target.value)} placeholder="tag1, tag2, tag3" style={inputStyle} />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button onClick={() => setShowNewThread(false)} style={btnStyle()}>
                  {t("common.cancel") || "Cancel"}
                </button>
                <button onClick={handleCreateThread} disabled={!newTitle.trim() || !newContent.trim()} style={{ ...btnStyle(true), opacity: newTitle.trim() && newContent.trim() ? 1 : 0.5 }}>
                  ➕ {t("discussion.create")}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
