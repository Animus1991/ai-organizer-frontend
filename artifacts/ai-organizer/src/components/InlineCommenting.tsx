/**
 * InlineCommenting - GitHub-style inline commenting for documents and claims
 * Features: line-level comments, threaded replies, resolve/unresolve, reactions
 * Uses CollaborationContext for persistence
 */

import React, { useState, useMemo, useCallback } from "react";
import { useCollaboration } from "../context/CollaborationContext";
import type { Comment } from "../context/CollaborationContext";
import { useLanguage } from "../context/LanguageContext";

// ─── Types ───────────────────────────────────────────────────
interface InlineCommentThread {
  root: Comment;
  replies: Comment[];
}

// ─── Single Comment ──────────────────────────────────────────
interface CommentItemProps {
  comment: Comment;
  currentUserId: string;
  onReply: (parentId: string) => void;
  onResolve: (id: string, resolved: boolean) => void;
  onDelete: (id: string) => void;
  onReact: (commentId: string, emoji: string) => void;
  isReply?: boolean;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUserId,
  onReply,
  onResolve,
  onDelete,
  onReact,
  isReply = false,
}) => {
  const [showReactions, setShowReactions] = useState(false);
  const commonReactions = ["👍", "❤️", "🎉", "🤔", "👀", "🔬"];

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      style={{
        padding: isReply ? "8px 10px" : "10px 12px",
        background: comment.resolved
          ? "rgba(34,197,94,0.04)"
          : isReply
          ? "rgba(255,255,255,0.01)"
          : "rgba(255,255,255,0.03)",
        borderRadius: "6px",
        borderLeft: comment.resolved
          ? "3px solid rgba(34,197,94,0.5)"
          : isReply
          ? "2px solid rgba(99,102,241,0.2)"
          : "3px solid rgba(99,102,241,0.4)",
        marginLeft: isReply ? "20px" : 0,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
        <div
          style={{
            width: isReply ? "22px" : "26px",
            height: isReply ? "22px" : "26px",
            borderRadius: "50%",
            background: `hsl(${comment.userName.charCodeAt(0) * 7}, 50%, 45%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: isReply ? "10px" : "11px",
            flexShrink: 0,
          }}
        >
          {comment.userName[0].toUpperCase()}
        </div>
        <span style={{ fontWeight: 500, color: "#eaeaea", fontSize: isReply ? "12px" : "13px" }}>
          {comment.userName}
        </span>
        <span style={{ fontSize: "11px", color: "#71717a" }}>{formatTime(comment.createdAt)}</span>
        {comment.resolved && (
          <span style={{ fontSize: "10px", color: "#22c55e", fontWeight: 500 }}>✓ Resolved</span>
        )}
        {comment.updatedAt && (
          <span style={{ fontSize: "10px", color: "#52525b" }}>(edited)</span>
        )}
      </div>

      {/* Content */}
      <div style={{ fontSize: "13px", color: "#d4d4d4", lineHeight: 1.5, marginBottom: "6px", paddingLeft: isReply ? "30px" : "34px" }}>
        {comment.content}
      </div>

      {/* Reactions display */}
      {comment.reactions.length > 0 && (
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "4px", paddingLeft: isReply ? "30px" : "34px" }}>
          {Array.from(new Set(comment.reactions.map((r) => r.emoji))).map((emoji) => {
            const count = comment.reactions.filter((r) => r.emoji === emoji).length;
            const hasReacted = comment.reactions.some((r) => r.emoji === emoji && r.userId === currentUserId);
            return (
              <button
                key={emoji}
                onClick={() => onReact(comment.id, emoji)}
                style={{
                  padding: "1px 6px",
                  background: hasReacted ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.05)",
                  border: hasReacted ? "1px solid rgba(99,102,241,0.3)" : "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "3px",
                  color: "#a1a1aa",
                }}
              >
                {emoji} <span style={{ fontSize: "10px" }}>{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: "8px", paddingLeft: isReply ? "30px" : "34px", alignItems: "center" }}>
        {!isReply && (
          <button
            onClick={() => onReply(comment.id)}
            style={{ background: "transparent", border: "none", color: "#71717a", fontSize: "11px", cursor: "pointer", padding: "2px 4px" }}
          >
            Reply
          </button>
        )}
        <button
          onClick={() => onResolve(comment.id, !comment.resolved)}
          style={{ background: "transparent", border: "none", color: comment.resolved ? "#22c55e" : "#71717a", fontSize: "11px", cursor: "pointer", padding: "2px 4px" }}
        >
          {comment.resolved ? "Unresolve" : "Resolve"}
        </button>
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowReactions(!showReactions)}
            style={{ background: "transparent", border: "none", color: "#71717a", fontSize: "11px", cursor: "pointer", padding: "2px 4px" }}
          >
            😀
          </button>
          {showReactions && (
            <div
              style={{
                position: "absolute",
                bottom: "100%",
                left: 0,
                background: "#2a2a3e",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "8px",
                padding: "4px",
                display: "flex",
                gap: "2px",
                zIndex: 10,
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              }}
            >
              {commonReactions.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onReact(comment.id, emoji);
                    setShowReactions(false);
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "16px",
                    padding: "4px",
                    borderRadius: "4px",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
        {comment.userId === currentUserId && (
          <button
            onClick={() => onDelete(comment.id)}
            style={{ background: "transparent", border: "none", color: "#ef4444", fontSize: "11px", cursor: "pointer", padding: "2px 4px", marginLeft: "auto" }}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Reply Form ──────────────────────────────────────────────
interface ReplyFormProps {
  onSubmit: (content: string) => void;
  onCancel: () => void;
  placeholder?: string;
}

const ReplyForm: React.FC<ReplyFormProps> = ({ onSubmit, onCancel, placeholder }) => {
  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onSubmit(content.trim());
    setContent("");
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginLeft: "20px", marginTop: "4px" }}>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder || "Write a reply..."}
        rows={2}
        autoFocus
        style={{
          width: "100%",
          padding: "8px 10px",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(99,102,241,0.3)",
          borderRadius: "6px",
          color: "#eaeaea",
          fontSize: "12px",
          outline: "none",
          resize: "vertical",
          boxSizing: "border-box",
        }}
      />
      <div style={{ display: "flex", gap: "6px", marginTop: "4px", justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={onCancel}
          style={{ padding: "4px 10px", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "4px", color: "#71717a", fontSize: "11px", cursor: "pointer" }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!content.trim()}
          style={{
            padding: "4px 10px",
            background: content.trim() ? "#6366f1" : "rgba(255,255,255,0.1)",
            border: "none",
            borderRadius: "4px",
            color: content.trim() ? "#fff" : "#71717a",
            fontSize: "11px",
            cursor: content.trim() ? "pointer" : "not-allowed",
          }}
        >
          Reply
        </button>
      </div>
    </form>
  );
};

// ─── Thread View ─────────────────────────────────────────────
interface ThreadViewProps {
  thread: InlineCommentThread;
  currentUserId: string;
  onReply: (parentId: string, content: string) => void;
  onResolve: (id: string, resolved: boolean) => void;
  onDelete: (id: string) => void;
  onReact: (commentId: string, emoji: string) => void;
}

const ThreadView: React.FC<ThreadViewProps> = ({ thread, currentUserId, onReply, onResolve, onDelete, onReact }) => {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <CommentItem
        comment={thread.root}
        currentUserId={currentUserId}
        onReply={(id) => setReplyingTo(id)}
        onResolve={onResolve}
        onDelete={onDelete}
        onReact={onReact}
      />
      {thread.replies.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          currentUserId={currentUserId}
          onReply={() => setReplyingTo(thread.root.id)}
          onResolve={onResolve}
          onDelete={onDelete}
          onReact={onReact}
          isReply
        />
      ))}
      {replyingTo && (
        <ReplyForm
          onSubmit={(content) => {
            onReply(thread.root.id, content);
            setReplyingTo(null);
          }}
          onCancel={() => setReplyingTo(null)}
        />
      )}
    </div>
  );
};

// ─── Main InlineCommenting Component ─────────────────────────
interface InlineCommentingProps {
  resourceId: string;
  resourceType: "document" | "segment";
  style?: React.CSSProperties;
  compact?: boolean;
}

export const InlineCommenting: React.FC<InlineCommentingProps> = ({
  resourceId,
  resourceType,
  style,
  compact = false,
}) => {
  const { t } = useLanguage();
  const {
    getComments,
    addComment,
    deleteComment,
    addReaction,
    resolveComment,
    currentUser,
  } = useCollaboration();

  const [newComment, setNewComment] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "open" | "resolved">("all");

  const allComments = getComments(resourceId);

  // Build threads
  const threads = useMemo((): InlineCommentThread[] => {
    const roots = allComments.filter((c) => !c.parentId);
    return roots.map((root) => ({
      root,
      replies: allComments.filter((c) => c.parentId === root.id).sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      ),
    }));
  }, [allComments]);

  // Filter threads
  const filteredThreads = useMemo(() => {
    if (filterMode === "all") return threads;
    if (filterMode === "open") return threads.filter((t) => !t.root.resolved);
    return threads.filter((t) => t.root.resolved);
  }, [threads, filterMode]);

  const openCount = threads.filter((t) => !t.root.resolved).length;
  const resolvedCount = threads.filter((t) => t.root.resolved).length;

  // Handlers
  const handleAddComment = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!newComment.trim()) return;
      addComment({
        resourceId,
        resourceType,
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        content: newComment.trim(),
      });
      setNewComment("");
    },
    [newComment, resourceId, resourceType, currentUser, addComment]
  );

  const handleReply = useCallback(
    (parentId: string, content: string) => {
      addComment({
        resourceId,
        resourceType,
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        content,
        parentId,
      });
    },
    [resourceId, resourceType, currentUser, addComment]
  );

  const handleReact = useCallback(
    (commentId: string, emoji: string) => {
      addReaction(commentId, emoji, currentUser.id);
    },
    [addReaction, currentUser.id]
  );

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "10px",
        overflow: "hidden",
        ...style,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: compact ? "10px 12px" : "12px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span style={{ fontSize: "15px" }}>💬</span>
        <span style={{ fontWeight: 600, color: "#eaeaea", fontSize: "14px" }}>
          {t("inline.comments") || "Comments"}
        </span>
        <span
          style={{
            padding: "2px 8px",
            borderRadius: "10px",
            fontSize: "11px",
            background: "rgba(255,255,255,0.08)",
            color: "#a1a1aa",
          }}
        >
          {allComments.length}
        </span>

        {/* Filter tabs */}
        <div style={{ marginLeft: "auto", display: "flex", gap: "4px" }}>
          {[
            { key: "all" as const, label: t("inline.all") || "All", count: threads.length },
            { key: "open" as const, label: t("inline.open") || "Open", count: openCount },
            { key: "resolved" as const, label: t("inline.resolved") || "Resolved", count: resolvedCount },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterMode(tab.key)}
              style={{
                padding: "3px 8px",
                borderRadius: "4px",
                fontSize: "11px",
                color: filterMode === tab.key ? "#a5b4fc" : "#71717a",
                background: filterMode === tab.key ? "rgba(99,102,241,0.15)" : "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* New comment form */}
      <div style={{ padding: compact ? "8px 12px" : "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <form onSubmit={handleAddComment} style={{ display: "flex", gap: "8px" }}>
          <div
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: "12px",
              flexShrink: 0,
            }}
          >
            {currentUser.name[0].toUpperCase()}
          </div>
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t("inline.addComment") || "Add a comment..."}
            style={{
              flex: 1,
              padding: "7px 12px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "6px",
              color: "#eaeaea",
              fontSize: "13px",
              outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={!newComment.trim()}
            style={{
              padding: "7px 14px",
              background: newComment.trim() ? "#6366f1" : "rgba(255,255,255,0.08)",
              border: "none",
              borderRadius: "6px",
              color: newComment.trim() ? "#fff" : "#71717a",
              fontSize: "12px",
              cursor: newComment.trim() ? "pointer" : "not-allowed",
              fontWeight: 500,
            }}
          >
            {t("inline.post") || "Post"}
          </button>
        </form>
      </div>

      {/* Threads list */}
      <div style={{ padding: compact ? "8px" : "12px", display: "flex", flexDirection: "column", gap: "10px", maxHeight: compact ? "300px" : "500px", overflowY: "auto" }}>
        {filteredThreads.length === 0 ? (
          <div style={{ padding: "24px", textAlign: "center", color: "#52525b", fontSize: "13px" }}>
            {filterMode === "all"
              ? (t("inline.noComments") || "No comments yet. Start the conversation!")
              : filterMode === "open"
              ? (t("inline.noOpen") || "No open comment threads.")
              : (t("inline.noResolved") || "No resolved comment threads.")}
          </div>
        ) : (
          filteredThreads.map((thread) => (
            <ThreadView
              key={thread.root.id}
              thread={thread}
              currentUserId={currentUser.id}
              onReply={handleReply}
              onResolve={resolveComment}
              onDelete={deleteComment}
              onReact={handleReact}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default InlineCommenting;
