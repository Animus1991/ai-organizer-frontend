/**
 * CollaborationContext - Collaborative features for sharing and comments
 * Supports document sharing, comments on segments, and activity tracking
 */

import React, { useState, useCallback, useEffect, createContext, useContext } from "react";

// Collaboration types
export interface ShareLink {
  id: string;
  resourceId: string;
  resourceType: "document" | "segment" | "collection";
  permissions: "view" | "comment" | "edit";
  createdAt: Date;
  expiresAt?: Date;
  accessCount: number;
  password?: string;
  url: string;
}

export interface Comment {
  id: string;
  resourceId: string;
  resourceType: "document" | "segment";
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
  parentId?: string;
  reactions: Array<{ emoji: string; userId: string }>;
  resolved?: boolean;
}

export interface ActivityItem {
  id: string;
  type: "view" | "edit" | "comment" | "share" | "export" | "favorite";
  resourceId: string;
  resourceType: string;
  resourceTitle: string;
  userId: string;
  userName: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// Context type
interface CollaborationContextType {
  // Sharing
  shareLinks: ShareLink[];
  createShareLink: (resourceId: string, resourceType: ShareLink["resourceType"], options?: Partial<ShareLink>) => ShareLink;
  revokeShareLink: (id: string) => void;
  getShareLinks: (resourceId: string) => ShareLink[];
  
  // Comments
  comments: Comment[];
  addComment: (comment: Omit<Comment, "id" | "createdAt" | "reactions">) => string;
  updateComment: (id: string, content: string) => void;
  deleteComment: (id: string) => void;
  addReaction: (commentId: string, emoji: string, userId: string) => void;
  removeReaction: (commentId: string, userId: string) => void;
  resolveComment: (id: string, resolved: boolean) => void;
  getComments: (resourceId: string) => Comment[];
  
  // Activity
  activities: ActivityItem[];
  logActivity: (activity: Omit<ActivityItem, "id" | "timestamp">) => void;
  getRecentActivities: (limit?: number) => ActivityItem[];
  getResourceActivities: (resourceId: string) => ActivityItem[];
  
  // Current user
  currentUser: { id: string; name: string; avatar?: string };
  setCurrentUser: (user: { id: string; name: string; avatar?: string }) => void;
}

const CollaborationContext = createContext<CollaborationContextType | null>(null);

// Local storage keys
const STORAGE_KEYS = {
  shareLinks: "collab_share_links",
  comments: "collab_comments",
  activities: "collab_activities",
  user: "collab_user",
};

// Generate unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Provider props
interface CollaborationProviderProps {
  children: React.ReactNode;
  defaultUser?: { id: string; name: string; avatar?: string };
}

export const CollaborationProvider: React.FC<CollaborationProviderProps> = ({
  children,
  defaultUser = { id: "user-1", name: "Current User" },
}) => {
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [currentUser, setCurrentUser] = useState(defaultUser);

  // Load from localStorage
  useEffect(() => {
    try {
      const storedLinks = localStorage.getItem(STORAGE_KEYS.shareLinks);
      if (storedLinks) {
        const parsed = JSON.parse(storedLinks);
        setShareLinks(parsed.map((l: ShareLink) => ({
          ...l,
          createdAt: new Date(l.createdAt),
          expiresAt: l.expiresAt ? new Date(l.expiresAt) : undefined,
        })));
      }

      const storedComments = localStorage.getItem(STORAGE_KEYS.comments);
      if (storedComments) {
        const parsed = JSON.parse(storedComments);
        setComments(parsed.map((c: Comment) => ({
          ...c,
          createdAt: new Date(c.createdAt),
          updatedAt: c.updatedAt ? new Date(c.updatedAt) : undefined,
        })));
      }

      const storedActivities = localStorage.getItem(STORAGE_KEYS.activities);
      if (storedActivities) {
        const parsed = JSON.parse(storedActivities);
        setActivities(parsed.map((a: ActivityItem) => ({
          ...a,
          timestamp: new Date(a.timestamp),
        })));
      }

      const storedUser = localStorage.getItem(STORAGE_KEYS.user);
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to load collaboration data:", error);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.shareLinks, JSON.stringify(shareLinks));
  }, [shareLinks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.comments, JSON.stringify(comments));
  }, [comments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.activities, JSON.stringify(activities.slice(0, 100)));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(currentUser));
  }, [currentUser]);

  // Share link functions
  const createShareLink = useCallback(
    (resourceId: string, resourceType: ShareLink["resourceType"], options?: Partial<ShareLink>): ShareLink => {
      const id = generateId();
      const link: ShareLink = {
        id,
        resourceId,
        resourceType,
        permissions: options?.permissions || "view",
        createdAt: new Date(),
        expiresAt: options?.expiresAt,
        accessCount: 0,
        password: options?.password,
        url: `${window.location.origin}/shared/${id}`,
      };
      setShareLinks((prev) => [...prev, link]);
      return link;
    },
    []
  );

  const revokeShareLink = useCallback((id: string) => {
    setShareLinks((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const getShareLinks = useCallback(
    (resourceId: string): ShareLink[] => {
      return shareLinks.filter((l) => l.resourceId === resourceId);
    },
    [shareLinks]
  );

  // Comment functions
  const addComment = useCallback(
    (comment: Omit<Comment, "id" | "createdAt" | "reactions">): string => {
      const id = generateId();
      const newComment: Comment = {
        ...comment,
        id,
        createdAt: new Date(),
        reactions: [],
      };
      setComments((prev) => [...prev, newComment]);
      return id;
    },
    []
  );

  const updateComment = useCallback((id: string, content: string) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, content, updatedAt: new Date() } : c
      )
    );
  }, []);

  const deleteComment = useCallback((id: string) => {
    setComments((prev) => prev.filter((c) => c.id !== id && c.parentId !== id));
  }, []);

  const addReaction = useCallback((commentId: string, emoji: string, userId: string) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          const hasReaction = c.reactions.some((r) => r.userId === userId && r.emoji === emoji);
          if (!hasReaction) {
            return { ...c, reactions: [...c.reactions, { emoji, userId }] };
          }
        }
        return c;
      })
    );
  }, []);

  const removeReaction = useCallback((commentId: string, userId: string) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          return { ...c, reactions: c.reactions.filter((r) => r.userId !== userId) };
        }
        return c;
      })
    );
  }, []);

  const resolveComment = useCallback((id: string, resolved: boolean) => {
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, resolved } : c))
    );
  }, []);

  const getComments = useCallback(
    (resourceId: string): Comment[] => {
      return comments.filter((c) => c.resourceId === resourceId);
    },
    [comments]
  );

  // Activity functions
  const logActivity = useCallback(
    (activity: Omit<ActivityItem, "id" | "timestamp">) => {
      const newActivity: ActivityItem = {
        ...activity,
        id: generateId(),
        timestamp: new Date(),
      };
      setActivities((prev) => [newActivity, ...prev.slice(0, 99)]);
    },
    []
  );

  const getRecentActivities = useCallback(
    (limit = 20): ActivityItem[] => {
      return activities.slice(0, limit);
    },
    [activities]
  );

  const getResourceActivities = useCallback(
    (resourceId: string): ActivityItem[] => {
      return activities.filter((a) => a.resourceId === resourceId);
    },
    [activities]
  );

  return (
    <CollaborationContext.Provider
      value={{
        shareLinks,
        createShareLink,
        revokeShareLink,
        getShareLinks,
        comments,
        addComment,
        updateComment,
        deleteComment,
        addReaction,
        removeReaction,
        resolveComment,
        getComments,
        activities,
        logActivity,
        getRecentActivities,
        getResourceActivities,
        currentUser,
        setCurrentUser,
      }}
    >
      {children}
    </CollaborationContext.Provider>
  );
};

// Hook
export const useCollaboration = () => {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error("useCollaboration must be used within CollaborationProvider");
  }
  return context;
};

// Share button component
interface ShareButtonProps {
  resourceId: string;
  resourceType: ShareLink["resourceType"];
  resourceTitle?: string;
  style?: React.CSSProperties;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  resourceId,
  resourceType,
  resourceTitle,
  style,
}) => {
  const { createShareLink, getShareLinks, revokeShareLink, logActivity, currentUser } = useCollaboration();
  const [showModal, setShowModal] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const existingLinks = getShareLinks(resourceId);

  const handleCreateLink = (permissions: ShareLink["permissions"]) => {
    const link = createShareLink(resourceId, resourceType, { permissions });
    logActivity({
      type: "share",
      resourceId,
      resourceType,
      resourceTitle: resourceTitle || resourceId,
      userId: currentUser.id,
      userName: currentUser.name,
      metadata: { permissions },
    });
    return link;
  };

  const handleCopyLink = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        style={{
          padding: "8px 14px",
          background: "rgba(34, 197, 94, 0.15)",
          border: "1px solid rgba(34, 197, 94, 0.3)",
          borderRadius: "6px",
          color: "#86efac",
          fontSize: "13px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          ...style,
        }}
      >
        🔗 Share
      </button>

      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #1e1e2e 0%, #181825 100%)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "12px",
              padding: "24px",
              width: "min(450px, 90vw)",
              maxHeight: "80vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, color: "#eaeaea", fontSize: "18px" }}>Share</h3>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#71717a",
                  fontSize: "18px",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            {/* Create new link */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "12px", color: "#71717a", marginBottom: "8px" }}>
                Create new share link
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                {(["view", "comment", "edit"] as const).map((perm) => (
                  <button
                    key={perm}
                    onClick={() => handleCreateLink(perm)}
                    style={{
                      flex: 1,
                      padding: "10px",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "6px",
                      color: "#eaeaea",
                      fontSize: "12px",
                      cursor: "pointer",
                      textTransform: "capitalize",
                    }}
                  >
                    {perm === "view" && "👁️ "}
                    {perm === "comment" && "💬 "}
                    {perm === "edit" && "✏️ "}
                    {perm}
                  </button>
                ))}
              </div>
            </div>

            {/* Existing links */}
            {existingLinks.length > 0 && (
              <div>
                <div style={{ fontSize: "12px", color: "#71717a", marginBottom: "8px" }}>
                  Active links ({existingLinks.length})
                </div>
                {existingLinks.map((link) => (
                  <div
                    key={link.id}
                    style={{
                      padding: "12px",
                      background: "rgba(255, 255, 255, 0.03)",
                      borderRadius: "6px",
                      marginBottom: "8px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <span
                          style={{
                            padding: "2px 6px",
                            background: "rgba(99, 102, 241, 0.2)",
                            borderRadius: "4px",
                            fontSize: "10px",
                            color: "#a5b4fc",
                            textTransform: "uppercase",
                          }}
                        >
                          {link.permissions}
                        </span>
                        <span style={{ fontSize: "11px", color: "#71717a", marginLeft: "8px" }}>
                          {link.accessCount} views
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "4px" }}>
                        <button
                          onClick={() => handleCopyLink(link.url)}
                          style={{
                            padding: "4px 8px",
                            background: copyFeedback ? "rgba(34, 197, 94, 0.2)" : "rgba(255, 255, 255, 0.05)",
                            border: "none",
                            borderRadius: "4px",
                            color: copyFeedback ? "#86efac" : "#a1a1aa",
                            fontSize: "11px",
                            cursor: "pointer",
                          }}
                        >
                          {copyFeedback ? "✓ Copied" : "📋 Copy"}
                        </button>
                        <button
                          onClick={() => revokeShareLink(link.id)}
                          style={{
                            padding: "4px 8px",
                            background: "rgba(239, 68, 68, 0.1)",
                            border: "none",
                            borderRadius: "4px",
                            color: "#fca5a5",
                            fontSize: "11px",
                            cursor: "pointer",
                          }}
                        >
                          Revoke
                        </button>
                      </div>
                    </div>
                    <div
                      style={{
                        marginTop: "8px",
                        padding: "6px 8px",
                        background: "rgba(0, 0, 0, 0.2)",
                        borderRadius: "4px",
                        fontSize: "11px",
                        color: "#71717a",
                        fontFamily: "monospace",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {link.url}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

// Comments section component
interface CommentsSectionProps {
  resourceId: string;
  resourceType: Comment["resourceType"];
  style?: React.CSSProperties;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({
  resourceId,
  resourceType,
  style,
}) => {
  const { getComments, addComment, deleteComment, addReaction, resolveComment, currentUser } = useCollaboration();
  const [newComment, setNewComment] = useState("");
  const comments = getComments(resourceId);
  const rootComments = comments.filter((c) => !c.parentId);

  const handleSubmit = (e: React.FormEvent) => {
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
  };

  const commonReactions = ["👍", "❤️", "🎉", "🤔", "👀"];

  const formatDate = (date: Date) => {
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
        background: "rgba(255, 255, 255, 0.02)",
        borderRadius: "12px",
        padding: "16px",
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
        <span style={{ fontSize: "16px" }}>💬</span>
        <span style={{ fontWeight: 600, color: "#eaeaea" }}>Comments</span>
        <span
          style={{
            background: "rgba(255, 255, 255, 0.08)",
            padding: "2px 8px",
            borderRadius: "10px",
            fontSize: "12px",
            color: "#a1a1aa",
          }}
        >
          {comments.length}
        </span>
      </div>

      {/* New comment form */}
      <form onSubmit={handleSubmit} style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "14px",
              flexShrink: 0,
            }}
          >
            {currentUser.name[0].toUpperCase()}
          </div>
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            style={{
              flex: 1,
              padding: "8px 12px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
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
              padding: "8px 14px",
              background: newComment.trim() ? "#6366f1" : "rgba(255, 255, 255, 0.1)",
              border: "none",
              borderRadius: "6px",
              color: newComment.trim() ? "white" : "#71717a",
              fontSize: "13px",
              cursor: newComment.trim() ? "pointer" : "not-allowed",
            }}
          >
            Post
          </button>
        </div>
      </form>

      {/* Comments list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {rootComments.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px", color: "#52525b", fontSize: "14px" }}>
            No comments yet. Be the first to comment!
          </div>
        ) : (
          rootComments.map((comment) => (
            <div
              key={comment.id}
              style={{
                padding: "12px",
                background: comment.resolved ? "rgba(34, 197, 94, 0.05)" : "rgba(255, 255, 255, 0.03)",
                borderRadius: "8px",
                borderLeft: comment.resolved ? "3px solid #22c55e" : "none",
              }}
            >
              <div style={{ display: "flex", gap: "10px" }}>
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "12px",
                    flexShrink: 0,
                  }}
                >
                  {comment.userName[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontWeight: 500, color: "#eaeaea", fontSize: "13px" }}>
                      {comment.userName}
                    </span>
                    <span style={{ fontSize: "11px", color: "#71717a" }}>
                      {formatDate(comment.createdAt)}
                    </span>
                    {comment.resolved && (
                      <span style={{ fontSize: "10px", color: "#22c55e" }}>✓ Resolved</span>
                    )}
                  </div>
                  <div style={{ color: "#d4d4d4", fontSize: "13px", marginTop: "4px", lineHeight: 1.5 }}>
                    {comment.content}
                  </div>

                  {/* Reactions and actions */}
                  <div style={{ display: "flex", gap: "8px", marginTop: "8px", alignItems: "center" }}>
                    {commonReactions.map((emoji) => {
                      const count = comment.reactions.filter((r) => r.emoji === emoji).length;
                      const hasReacted = comment.reactions.some(
                        (r) => r.emoji === emoji && r.userId === currentUser.id
                      );
                      return (
                        <button
                          key={emoji}
                          onClick={() =>
                            hasReacted
                              ? null
                              : addReaction(comment.id, emoji, currentUser.id)
                          }
                          style={{
                            padding: "2px 6px",
                            background: hasReacted ? "rgba(99, 102, 241, 0.2)" : "rgba(255, 255, 255, 0.05)",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px",
                            display: count > 0 ? "flex" : "none",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          {emoji} {count > 0 && <span style={{ color: "#a1a1aa" }}>{count}</span>}
                        </button>
                      );
                    })}
                    <div style={{ marginLeft: "auto", display: "flex", gap: "4px" }}>
                      <button
                        onClick={() => resolveComment(comment.id, !comment.resolved)}
                        style={{
                          padding: "2px 6px",
                          background: "transparent",
                          border: "none",
                          color: "#71717a",
                          fontSize: "11px",
                          cursor: "pointer",
                        }}
                      >
                        {comment.resolved ? "Unresolve" : "Resolve"}
                      </button>
                      {comment.userId === currentUser.id && (
                        <button
                          onClick={() => deleteComment(comment.id)}
                          style={{
                            padding: "2px 6px",
                            background: "transparent",
                            border: "none",
                            color: "#ef4444",
                            fontSize: "11px",
                            cursor: "pointer",
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Activity feed component
interface ActivityFeedProps {
  resourceId?: string;
  limit?: number;
  style?: React.CSSProperties;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  resourceId,
  limit = 10,
  style,
}) => {
  const { getRecentActivities, getResourceActivities } = useCollaboration();
  const activities = resourceId
    ? getResourceActivities(resourceId).slice(0, limit)
    : getRecentActivities(limit);

  const activityIcons: Record<string, string> = {
    view: "👁️",
    edit: "✏️",
    comment: "💬",
    share: "🔗",
    export: "📤",
    favorite: "⭐",
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      style={{
        background: "rgba(255, 255, 255, 0.02)",
        borderRadius: "12px",
        padding: "16px",
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
        <span style={{ fontSize: "16px" }}>📊</span>
        <span style={{ fontWeight: 600, color: "#eaeaea" }}>Activity</span>
      </div>

      {activities.length === 0 ? (
        <div style={{ textAlign: "center", padding: "24px", color: "#52525b", fontSize: "14px" }}>
          No activity yet
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {activities.map((activity) => (
            <div
              key={activity.id}
              style={{
                display: "flex",
                gap: "10px",
                padding: "8px",
                borderRadius: "6px",
                background: "rgba(255, 255, 255, 0.02)",
              }}
            >
              <span style={{ fontSize: "14px" }}>{activityIcons[activity.type] || "📌"}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13px", color: "#d4d4d4" }}>
                  <span style={{ fontWeight: 500 }}>{activity.userName}</span>
                  {" "}
                  {activity.type === "view" && "viewed"}
                  {activity.type === "edit" && "edited"}
                  {activity.type === "comment" && "commented on"}
                  {activity.type === "share" && "shared"}
                  {activity.type === "export" && "exported"}
                  {activity.type === "favorite" && "favorited"}
                  {" "}
                  <span style={{ color: "#a5b4fc" }}>{activity.resourceTitle}</span>
                </div>
                <div style={{ fontSize: "11px", color: "#71717a", marginTop: "2px" }}>
                  {formatTime(activity.timestamp)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CollaborationProvider;
