/**
 * ReviewRequestsPage - GitHub Pull Requests-style review workflow
 * Uses semantic design tokens for full theme compatibility
 */

import { useState, useMemo, useCallback } from "react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { PageShell } from "../components/layout/PageShell";
import { useMediaQuery } from "../hooks/useMediaQuery";

// ─── Types ───────────────────────────────────────────────────
export type ReviewStatus = "open" | "approved" | "changes-requested" | "merged" | "closed";
export type ReviewDecision = "approve" | "request-changes" | "comment";

export interface ReviewComment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
  lineRef?: string;
}

export interface ReviewRequest {
  id: string;
  number: number;
  title: string;
  description: string;
  status: ReviewStatus;
  author: string;
  authorName: string;
  reviewers: string[];
  reviewerNames: string[];
  documentId?: string;
  documentTitle?: string;
  createdAt: Date;
  updatedAt: Date;
  mergedAt?: Date;
  closedAt?: Date;
  comments: ReviewComment[];
  decisions: { userId: string; userName: string; decision: ReviewDecision; createdAt: Date }[];
  changesDescription: string;
  diffStats: { additions: number; deletions: number; filesChanged: number };
}

// ─── Sample data ─────────────────────────────────────────────
function generateSampleReviews(): ReviewRequest[] {
  const now = new Date();
  return [
    {
      id: "pr-1", number: 1,
      title: "Revise methodology section with updated protocol",
      description: "Updated the methodology section to include the revised experimental protocol based on feedback from the ethics committee.",
      status: "open", author: "user-1", authorName: "You",
      reviewers: ["user-2"], reviewerNames: ["Dr. Elena Vasquez"],
      documentId: "doc-1", documentTitle: "Cognitive Load Study",
      createdAt: new Date(now.getTime() - 3 * 86400000),
      updatedAt: new Date(now.getTime() - 1 * 86400000),
      comments: [
        { id: "rc-1", userId: "user-2", userName: "Dr. Elena Vasquez", content: "The updated consent form looks good. However, I think we should also mention the data retention policy in section 2.3.", createdAt: new Date(now.getTime() - 2 * 86400000) },
        { id: "rc-2", userId: "user-1", userName: "You", content: "Good point. I'll add a paragraph about data retention in the next commit.", createdAt: new Date(now.getTime() - 1 * 86400000) },
      ],
      decisions: [],
      changesDescription: "Updated consent procedures, modified timeline, added ethics approval reference",
      diffStats: { additions: 45, deletions: 12, filesChanged: 2 },
    },
    {
      id: "pr-2", number: 2,
      title: "Add results from pilot study (n=15)",
      description: "Adding preliminary results from the pilot study. Includes descriptive statistics, initial correlation analysis, and participant feedback summary.",
      status: "approved", author: "user-3", authorName: "Marcus Chen",
      reviewers: ["user-1", "user-2"], reviewerNames: ["You", "Dr. Elena Vasquez"],
      documentId: "doc-2", documentTitle: "Memory Retention Analysis",
      createdAt: new Date(now.getTime() - 7 * 86400000),
      updatedAt: new Date(now.getTime() - 2 * 86400000),
      comments: [{ id: "rc-3", userId: "user-1", userName: "You", content: "The correlation matrix in Table 2 looks correct. Nice work on the pilot!", createdAt: new Date(now.getTime() - 5 * 86400000) }],
      decisions: [
        { userId: "user-1", userName: "You", decision: "approve", createdAt: new Date(now.getTime() - 4 * 86400000) },
        { userId: "user-2", userName: "Dr. Elena Vasquez", decision: "approve", createdAt: new Date(now.getTime() - 3 * 86400000) },
      ],
      changesDescription: "New results section, 3 tables, 2 figures, updated abstract",
      diffStats: { additions: 120, deletions: 5, filesChanged: 4 },
    },
    {
      id: "pr-3", number: 3,
      title: "Rewrite introduction with updated literature review",
      description: "Complete rewrite of the introduction section incorporating 12 new references from 2024-2025.",
      status: "changes-requested", author: "user-1", authorName: "You",
      reviewers: ["user-2"], reviewerNames: ["Dr. Elena Vasquez"],
      documentId: "doc-1", documentTitle: "Cognitive Load Study",
      createdAt: new Date(now.getTime() - 10 * 86400000),
      updatedAt: new Date(now.getTime() - 4 * 86400000),
      comments: [{ id: "rc-4", userId: "user-2", userName: "Dr. Elena Vasquez", content: "The argument flow is much better, but paragraphs 3-5 need stronger transitions.", createdAt: new Date(now.getTime() - 5 * 86400000) }],
      decisions: [{ userId: "user-2", userName: "Dr. Elena Vasquez", decision: "request-changes", createdAt: new Date(now.getTime() - 5 * 86400000) }],
      changesDescription: "Restructured introduction, 12 new references, updated research questions",
      diffStats: { additions: 85, deletions: 60, filesChanged: 1 },
    },
    {
      id: "pr-4", number: 4,
      title: "Fix statistical analysis in Discussion section",
      description: "Corrected the effect size calculations and updated the discussion to reflect accurate findings.",
      status: "merged", author: "user-2", authorName: "Dr. Elena Vasquez",
      reviewers: ["user-1"], reviewerNames: ["You"],
      documentId: "doc-3", documentTitle: "Attention Span Research",
      createdAt: new Date(now.getTime() - 20 * 86400000),
      updatedAt: new Date(now.getTime() - 15 * 86400000),
      mergedAt: new Date(now.getTime() - 15 * 86400000),
      comments: [],
      decisions: [{ userId: "user-1", userName: "You", decision: "approve", createdAt: new Date(now.getTime() - 16 * 86400000) }],
      changesDescription: "Corrected effect sizes, updated Table 5, revised conclusions",
      diffStats: { additions: 30, deletions: 28, filesChanged: 1 },
    },
  ];
}

// ─── Status config ───────────────────────────────────────────
const STATUS_CONFIG: Record<ReviewStatus, { label: string; color: string; bg: string; icon: string }> = {
  open: { label: "Open", color: "#10b981", bg: "rgba(16,185,129,0.15)", icon: "🟢" },
  approved: { label: "Approved", color: "#22c55e", bg: "rgba(34,197,94,0.15)", icon: "✅" },
  "changes-requested": { label: "Changes Requested", color: "#f59e0b", bg: "rgba(245,158,11,0.15)", icon: "🔄" },
  merged: { label: "Merged", color: "#8b5cf6", bg: "rgba(139,92,246,0.15)", icon: "🔀" },
  closed: { label: "Closed", color: "#6b7280", bg: "rgba(107,114,128,0.15)", icon: "⛔" },
};

const DECISION_CONFIG: Record<ReviewDecision, { label: string; color: string; icon: string }> = {
  approve: { label: "Approved", color: "#22c55e", icon: "✅" },
  "request-changes": { label: "Changes Requested", color: "#f59e0b", icon: "🔄" },
  comment: { label: "Commented", color: "#3b82f6", icon: "💬" },
};

// ─── Review Row ──────────────────────────────────────────────
interface ReviewRowProps {
  review: ReviewRequest;
  onSelect: (id: string) => void;
  isMobile: boolean;
}

const ReviewRow: React.FC<ReviewRowProps> = ({ review, onSelect, isMobile }) => {
  const statusConf = STATUS_CONFIG[review.status];

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
      onClick={() => onSelect(review.id)}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: isMobile ? "8px" : "12px",
        padding: isMobile ? "10px 12px" : "14px 16px",
        borderBottom: "1px solid hsl(var(--border))",
        cursor: "pointer",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "hsl(var(--muted) / 0.3)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <span style={{ fontSize: "16px", marginTop: "2px" }}>{statusConf.icon}</span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="flex items-center gap-2 flex-wrap">
          <span style={{ fontWeight: 600, color: "hsl(var(--foreground))", fontSize: isMobile ? "13px" : "14px" }}>{review.title}</span>
        </div>
        <div style={{ fontSize: "12px", color: "hsl(var(--muted-foreground))", marginTop: "4px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <span>#{review.number}</span>
          {!isMobile && <span>by <strong style={{ color: "hsl(var(--foreground))" }}>{review.authorName}</strong></span>}
          <span>opened {formatDate(review.createdAt)}</span>
          {!isMobile && review.documentTitle && (
            <span style={{ color: "hsl(var(--primary))" }}>📄 {review.documentTitle}</span>
          )}
          {review.comments.length > 0 && <span>💬 {review.comments.length}</span>}
        </div>
      </div>

      {/* Diff stats - hide on mobile */}
      {!isMobile && (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span style={{ fontSize: "11px", fontWeight: 600, color: "#16a34a", background: "rgba(22,163,74,0.1)", padding: "2px 6px", borderRadius: "10px" }}>+{review.diffStats.additions}</span>
          <span style={{ fontSize: "11px", fontWeight: 600, color: "#dc2626", background: "rgba(220,38,38,0.1)", padding: "2px 6px", borderRadius: "10px" }}>-{review.diffStats.deletions}</span>
        </div>
      )}

      <span
        style={{
          padding: "3px 10px",
          borderRadius: "10px",
          fontSize: "11px",
          fontWeight: 600,
          color: statusConf.color,
          background: statusConf.bg,
          whiteSpace: "nowrap",
          flexShrink: 0,
          border: `1px solid ${statusConf.color}30`,
        }}
      >
        {isMobile ? statusConf.icon : statusConf.label}
      </span>
    </div>
  );
};

// ─── Review Detail Panel ─────────────────────────────────────
interface ReviewDetailProps {
  review: ReviewRequest;
  onClose: () => void;
  onAddComment: (content: string) => void;
  onDecide: (decision: ReviewDecision) => void;
  onMerge: () => void;
  isMobile: boolean;
}

const ReviewDetail: React.FC<ReviewDetailProps> = ({ review, onClose, onAddComment, onDecide, onMerge, isMobile }) => {
  const [newComment, setNewComment] = useState("");
  const statusConf = STATUS_CONFIG[review.status];

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    onAddComment(newComment.trim());
    setNewComment("");
  };

  const approvedCount = review.decisions.filter(d => d.decision === "approve").length;
  const totalReviewers = review.reviewerNames.length;
  const xpProgress = totalReviewers > 0 ? Math.round((approvedCount / totalReviewers) * 100) : 0;

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "flex-end", zIndex: 99999 }}
      onClick={onClose}
    >
      <div
        style={{
          width: isMobile ? "100vw" : "min(680px, 95vw)",
          height: "100vh",
          background: "hsl(var(--card))",
          borderLeft: isMobile ? "none" : "1px solid hsl(var(--border))",
          overflow: "auto",
          padding: isMobile ? "16px" : "24px",
          boxShadow: "-8px 0 32px hsl(var(--background) / 0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-5">
          <div style={{ flex: 1, minWidth: 0, paddingRight: "12px" }}>
            <div style={{ fontSize: "12px", color: "hsl(var(--muted-foreground))", marginBottom: "4px", fontFamily: "monospace" }}>#{review.number} · {review.documentTitle}</div>
            <h2 style={{ margin: 0, color: "hsl(var(--foreground))", fontSize: isMobile ? "16px" : "18px", lineHeight: 1.4, fontWeight: 700 }}>{review.title}</h2>
          </div>
          <button onClick={onClose} style={{ background: "hsl(var(--muted) / 0.3)", border: "1px solid hsl(var(--border))", borderRadius: "10px", color: "hsl(var(--muted-foreground))", fontSize: "18px", cursor: "pointer", width: "34px", height: "34px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>×</button>
        </div>

        {/* Status + author */}
        <div className="flex gap-2 mb-4 flex-wrap items-center">
          <span style={{ padding: "4px 12px", borderRadius: "10px", fontSize: "12px", fontWeight: 600, color: statusConf.color, background: statusConf.bg, border: `1px solid ${statusConf.color}30` }}>
            {statusConf.icon} {statusConf.label}
          </span>
          <span style={{ fontSize: "12px", color: "hsl(var(--muted-foreground))" }}>
            <strong style={{ color: "hsl(var(--foreground))" }}>{review.authorName}</strong> wants to merge into <strong style={{ color: "hsl(var(--primary))" }}>{review.documentTitle || "document"}</strong>
          </span>
        </div>

        {/* Reviewer progress */}
        {totalReviewers > 0 && (
          <div style={{ marginBottom: "16px", padding: "12px 14px", background: "hsl(var(--muted) / 0.15)", borderRadius: "10px", border: "1px solid hsl(var(--border))" }}>
            <div className="flex justify-between items-center mb-2">
              <span style={{ fontSize: "12px", fontWeight: 600, color: "hsl(var(--foreground))" }}>Review Progress</span>
              <span style={{ fontSize: "11px", color: "hsl(var(--muted-foreground))" }}>{approvedCount}/{totalReviewers} approved</span>
            </div>
            <div style={{ height: "6px", borderRadius: "3px", background: "hsl(var(--muted) / 0.3)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${xpProgress}%`, background: xpProgress === 100 ? "hsl(var(--success))" : "hsl(var(--primary))", borderRadius: "3px", transition: "width 0.4s ease" }} />
            </div>
            {review.status === "merged" && <div className="mt-2 text-[11px] font-semibold" style={{ color: "hsl(var(--success))" }}>🏆 +50 XP earned — changes merged!</div>}
            {review.status === "approved" && <div className="mt-2 text-[11px] font-semibold" style={{ color: "hsl(var(--primary))" }}>⭐ +25 XP — ready to merge!</div>}
          </div>
        )}

        {/* Description */}
        <div style={{ padding: "14px 16px", background: "hsl(var(--muted) / 0.15)", borderRadius: "10px", marginBottom: "14px", border: "1px solid hsl(var(--border))" }}>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "hsl(var(--muted-foreground))", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Description</div>
          <div style={{ fontSize: "13px", color: "hsl(var(--foreground))", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{review.description}</div>
        </div>

        {/* Diff stats */}
        <div className="flex gap-2.5 mb-3.5" style={{ padding: "12px 14px", background: "hsl(var(--muted) / 0.15)", borderRadius: "10px", border: "1px solid hsl(var(--border))" }}>
          <div className="flex items-center gap-1.5">
            <span style={{ fontSize: "13px", color: "#16a34a", fontWeight: 700, background: "rgba(22,163,74,0.1)", padding: "2px 8px", borderRadius: "10px" }}>+{review.diffStats.additions}</span>
            <span style={{ fontSize: "11px", color: "hsl(var(--muted-foreground))" }}>additions</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span style={{ fontSize: "13px", color: "#dc2626", fontWeight: 700, background: "rgba(220,38,38,0.1)", padding: "2px 8px", borderRadius: "10px" }}>-{review.diffStats.deletions}</span>
            <span style={{ fontSize: "11px", color: "hsl(var(--muted-foreground))" }}>deletions</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span style={{ fontSize: "13px", color: "hsl(var(--foreground))", fontWeight: 700 }}>{review.diffStats.filesChanged}</span>
            <span style={{ fontSize: "11px", color: "hsl(var(--muted-foreground))" }}>sections</span>
          </div>
        </div>

        {/* Changes summary */}
        <div style={{ padding: "12px 14px", background: "hsl(var(--muted) / 0.15)", borderRadius: "10px", marginBottom: "14px", border: "1px solid hsl(var(--border))" }}>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "hsl(var(--muted-foreground))", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Changes</div>
          <div style={{ fontSize: "13px", color: "hsl(var(--foreground))" }}>{review.changesDescription}</div>
        </div>

        {/* Reviewers */}
        <div className="mb-4">
          <h4 style={{ margin: "0 0 10px", color: "hsl(var(--foreground))", fontSize: "13px", fontWeight: 700 }}>Reviewers</h4>
          <div className="flex flex-col gap-1.5">
            {review.reviewerNames.map((name, idx) => {
              const decision = review.decisions.find((d) => d.userName === name);
              const decConf = decision ? DECISION_CONFIG[decision.decision] : null;
              return (
                <div key={idx} className="flex items-center gap-2.5" style={{ padding: "8px 12px", background: "hsl(var(--muted) / 0.15)", borderRadius: "10px", border: "1px solid hsl(var(--border))" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: `hsl(${idx * 120 + 200}, 55%, 50%)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "12px", fontWeight: 700, flexShrink: 0 }}>
                    {name[0]}
                  </div>
                  <span style={{ fontSize: "13px", color: "hsl(var(--foreground))", flex: 1, fontWeight: 500 }}>{name}</span>
                  {decConf ? (
                    <span style={{ fontSize: "11px", color: decConf.color, fontWeight: 600, background: `${decConf.color}15`, padding: "2px 8px", borderRadius: "10px" }}>{decConf.icon} {decConf.label}</span>
                  ) : (
                    <span style={{ fontSize: "11px", color: "hsl(var(--muted-foreground))" }}>⏳ Pending</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action buttons */}
        {(review.status === "open" || review.status === "changes-requested") && (
          <div className={`flex gap-2 mb-4 ${isMobile ? "flex-col" : "flex-row flex-wrap"}`}>
            <button onClick={() => onDecide("approve")} style={{ padding: "9px 18px", background: "rgba(22,163,74,0.12)", border: "1px solid rgba(22,163,74,0.35)", borderRadius: "10px", color: "#16a34a", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
              ✅ Approve
            </button>
            <button onClick={() => onDecide("request-changes")} style={{ padding: "9px 18px", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.35)", borderRadius: "10px", color: "#d97706", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
              🔄 Request Changes
            </button>
            <button onClick={() => onDecide("comment")} style={{ padding: "9px 18px", background: "hsl(var(--primary) / 0.1)", border: "1px solid hsl(var(--primary) / 0.3)", borderRadius: "10px", color: "hsl(var(--primary))", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
              💬 Comment
            </button>
          </div>
        )}

        {/* Merge button */}
        {review.status === "approved" && (
          <div className="mb-4">
            <button
              onClick={onMerge}
              style={{ padding: "11px 20px", background: "hsl(var(--primary))", border: "none", borderRadius: "10px", color: "hsl(var(--primary-foreground))", fontSize: "13px", fontWeight: 700, cursor: "pointer", width: "100%", boxShadow: "0 4px 12px hsl(var(--primary) / 0.35)" }}
            >
              🔀 Merge Changes — earn 50 XP
            </button>
          </div>
        )}

        {/* Comments */}
        <div style={{ borderTop: "1px solid hsl(var(--border))", paddingTop: "18px" }}>
          <h4 style={{ margin: "0 0 14px", color: "hsl(var(--foreground))", fontSize: "13px", fontWeight: 700 }}>
            💬 Conversation ({review.comments.length})
          </h4>

          {review.comments.map((comment) => (
            <div key={comment.id} style={{ padding: "12px 14px", background: "hsl(var(--muted) / 0.15)", borderRadius: "10px", marginBottom: "8px", borderLeft: "3px solid hsl(var(--primary) / 0.5)", border: "1px solid hsl(var(--border))", borderLeftWidth: "3px", borderLeftColor: "hsl(var(--primary) / 0.5)" }}>
              <div className="flex justify-between mb-1.5 items-center">
                <span style={{ fontWeight: 600, color: "hsl(var(--foreground))", fontSize: "13px" }}>{comment.userName}</span>
                <span style={{ fontSize: "11px", color: "hsl(var(--muted-foreground))" }}>{formatDate(comment.createdAt)}</span>
              </div>
              <div style={{ fontSize: "13px", color: "hsl(var(--foreground))", lineHeight: 1.5 }}>{comment.content}</div>
            </div>
          ))}

          <form onSubmit={handleSubmitComment} className="mt-3">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Leave a review comment..."
              rows={3}
              style={{ width: "100%", padding: "10px 12px", background: "hsl(var(--muted) / 0.2)", border: "1px solid hsl(var(--border))", borderRadius: "10px", color: "hsl(var(--foreground))", fontSize: "13px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }}
            />
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={!newComment.trim()}
                style={{ padding: "7px 16px", background: newComment.trim() ? "hsl(var(--primary))" : "hsl(var(--muted) / 0.3)", border: "none", borderRadius: "10px", color: newComment.trim() ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))", fontSize: "12px", fontWeight: 600, cursor: newComment.trim() ? "pointer" : "not-allowed" }}
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
export default function ReviewRequestsPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [reviews, setReviews] = useState<ReviewRequest[]>(() => {
    try {
      const stored = localStorage.getItem("review_requests");
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map((r: ReviewRequest) => ({
          ...r,
          createdAt: new Date(r.createdAt),
          updatedAt: new Date(r.updatedAt),
          mergedAt: r.mergedAt ? new Date(r.mergedAt) : undefined,
          closedAt: r.closedAt ? new Date(r.closedAt) : undefined,
          comments: r.comments.map((c: ReviewComment) => ({ ...c, createdAt: new Date(c.createdAt) })),
          decisions: r.decisions.map((d: ReviewRequest["decisions"][0]) => ({ ...d, createdAt: new Date(d.createdAt) })),
        }));
      }
      return generateSampleReviews();
    } catch {
      return generateSampleReviews();
    }
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | "all">("all");

  const saveReviews = useCallback((updated: ReviewRequest[]) => {
    setReviews(updated);
    localStorage.setItem("review_requests", JSON.stringify(updated));
  }, []);

  const selectedReview = useMemo(() => {
    return selectedId ? reviews.find((r) => r.id === selectedId) : undefined;
  }, [reviews, selectedId]);

  const filteredReviews = useMemo(() => {
    if (statusFilter === "all") return reviews;
    return reviews.filter((r) => r.status === statusFilter);
  }, [reviews, statusFilter]);

  const stats = useMemo(() => ({
    total: reviews.length,
    open: reviews.filter((r) => r.status === "open").length,
    approved: reviews.filter((r) => r.status === "approved").length,
    changesRequested: reviews.filter((r) => r.status === "changes-requested").length,
    merged: reviews.filter((r) => r.status === "merged").length,
  }), [reviews]);

  const handleAddComment = useCallback((content: string) => {
    if (!selectedId) return;
    const updated = reviews.map((r) => {
      if (r.id === selectedId) {
        return { ...r, updatedAt: new Date(), comments: [...r.comments, { id: `rc-${Date.now()}`, userId: "user-1", userName: "You", content, createdAt: new Date() }] };
      }
      return r;
    });
    saveReviews(updated);
  }, [selectedId, reviews, saveReviews]);

  const handleDecide = useCallback((decision: ReviewDecision) => {
    if (!selectedId) return;
    const updated = reviews.map((r) => {
      if (r.id === selectedId) {
        const newDecisions = [...r.decisions, { userId: "user-1", userName: "You", decision, createdAt: new Date() }];
        let newStatus = r.status;
        if (decision === "approve") {
          const allApproved = r.reviewerNames.every((name) => newDecisions.some((d) => d.userName === name && d.decision === "approve"));
          if (allApproved) newStatus = "approved";
        } else if (decision === "request-changes") {
          newStatus = "changes-requested";
        }
        return { ...r, updatedAt: new Date(), decisions: newDecisions, status: newStatus };
      }
      return r;
    });
    saveReviews(updated);
  }, [selectedId, reviews, saveReviews]);

  const handleMerge = useCallback(() => {
    if (!selectedId) return;
    const updated = reviews.map((r) => {
      if (r.id === selectedId) {
        return { ...r, status: "merged" as ReviewStatus, mergedAt: new Date(), updatedAt: new Date() };
      }
      return r;
    });
    saveReviews(updated);
  }, [selectedId, reviews, saveReviews]);

  const statusTabs: { key: ReviewStatus | "all"; label: string; count: number }[] = [
    { key: "all", label: "All", count: stats.total },
    { key: "open", label: "Open", count: stats.open },
    { key: "approved", label: "Approved", count: stats.approved },
    { key: "changes-requested", label: "Changes", count: stats.changesRequested },
    { key: "merged", label: "Merged", count: stats.merged },
  ];

  const totalXP = stats.merged * 50 + stats.approved * 25 + reviews.reduce((acc, r) => acc + r.comments.length * 5, 0);

  return (
    <PageShell>
      <div className={`max-w-[1100px] mx-auto ${isMobile ? "px-3 py-4" : "px-6 py-8"}`}>

        {/* Header */}
        <div className="flex justify-between items-start mb-6 flex-wrap gap-3">
          <div>
            <h1 className="m-0 text-lg sm:text-2xl font-extrabold text-foreground">
              🔍 {t("review.title") || "Review Requests"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("review.subtitle") || "Propose, review, and merge document changes"}
            </p>
          </div>
          <button
            style={{ padding: "10px 18px", background: "hsl(var(--primary))", border: "none", borderRadius: "10px", color: "hsl(var(--primary-foreground))", fontWeight: 700, fontSize: "13px", cursor: "pointer", boxShadow: "0 4px 12px hsl(var(--primary) / 0.3)" }}
          >
            + {t("review.new") || "New Review"}
          </button>
        </div>

        {/* XP / Gamification summary */}
        <div className={`grid ${isMobile ? "grid-cols-2" : "grid-cols-4"} gap-3 mb-6`}>
          {[
            { label: "Total XP", value: `${totalXP} XP`, icon: "🏆", color: "#f59e0b" },
            { label: "Merged", value: stats.merged, icon: "🔀", color: "#8b5cf6" },
            { label: "Approved", value: stats.approved, icon: "✅", color: "#22c55e" },
            { label: "Pending", value: stats.open, icon: "🟢", color: "#10b981" },
          ].map((stat) => (
            <div key={stat.label} style={{ padding: isMobile ? "10px 12px" : "14px 16px", background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: isMobile ? "18px" : "22px" }}>{stat.icon}</span>
              <div>
                <div style={{ fontSize: isMobile ? "15px" : "18px", fontWeight: 800, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: "11px", color: "hsl(var(--muted-foreground))", marginTop: "1px" }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Status tabs */}
        <div className="flex gap-1.5 mb-4 flex-wrap overflow-x-auto pb-2" style={{ borderBottom: "1px solid hsl(var(--border))", paddingBottom: "12px" }}>
          {statusTabs.map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                style={{
                  padding: isMobile ? "5px 10px" : "6px 14px",
                  borderRadius: "10px",
                  fontSize: isMobile ? "12px" : "13px",
                  fontWeight: isActive ? 700 : 400,
                  color: isActive ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                  background: isActive ? "hsl(var(--primary) / 0.12)" : "transparent",
                  border: isActive ? "1px solid hsl(var(--primary) / 0.3)" : "1px solid transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  transition: "all 0.15s",
                }}
              >
                {tab.label}
                <span style={{ padding: "1px 7px", borderRadius: "10px", fontSize: "11px", fontWeight: 600, background: isActive ? "hsl(var(--primary) / 0.2)" : "hsl(var(--muted) / 0.3)" }}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Reviews list */}
        <div style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "10px", overflow: "hidden" }}>
          {filteredReviews.length === 0 ? (
            <div className="py-14 text-center">
              <div style={{ fontSize: "36px", marginBottom: "12px" }}>🔀</div>
              <div style={{ fontSize: "15px", fontWeight: 600, color: "hsl(var(--foreground))", marginBottom: "6px" }}>No review requests</div>
              <div style={{ fontSize: "13px", color: "hsl(var(--muted-foreground))" }}>{t("review.noReviews") || "No review requests match this filter"}</div>
            </div>
          ) : (
            filteredReviews.map((review) => (
              <ReviewRow key={review.id} review={review} onSelect={setSelectedId} isMobile={isMobile} />
            ))
          )}
        </div>

        <div className="mt-3.5 text-xs text-center text-muted-foreground">
          {filteredReviews.length} of {stats.total} review requests
        </div>
      </div>

      {selectedReview && (
        <ReviewDetail
          review={selectedReview}
          onClose={() => setSelectedId(null)}
          onAddComment={handleAddComment}
          onDecide={handleDecide}
          onMerge={handleMerge}
          isMobile={isMobile}
        />
      )}
    </PageShell>
  );
}
