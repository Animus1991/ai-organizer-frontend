/**
 * DiscussionForumsContext — GitHub Discussions equivalent for academic projects
 * Features: categories, threads, replies, reactions, pinning, locking, marking answers
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";

// ─── Types ───────────────────────────────────────────────────
export type DiscussionCategory = "general" | "ideas" | "q-and-a" | "show-and-tell" | "methodology" | "literature" | "announcements";
export type DiscussionStatus = "open" | "answered" | "closed";
export type ReactionType = "👍" | "👎" | "😄" | "🎉" | "❤️" | "🚀" | "👀" | "🤔";

export interface DiscussionReaction {
  type: ReactionType;
  users: string[];
}

export interface DiscussionReply {
  id: string;
  threadId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  reactions: DiscussionReaction[];
  isAnswer: boolean;
  parentReplyId: string | null;
}

export interface DiscussionThread {
  id: string;
  projectId: string;
  title: string;
  content: string;
  category: DiscussionCategory;
  status: DiscussionStatus;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  createdAt: number;
  updatedAt: number;
  reactions: DiscussionReaction[];
  replyCount: number;
  isPinned: boolean;
  isLocked: boolean;
  tags: string[];
  viewCount: number;
  lastActivityAt: number;
}

export interface DiscussionProject {
  id: string;
  name: string;
  icon: string;
  threadCount: number;
}

export const CATEGORY_CONFIG: Record<DiscussionCategory, { icon: string; label: string; color: string; description: string }> = {
  general:        { icon: "💬", label: "General",       color: "#6366f1", description: "General discussion and conversation" },
  ideas:          { icon: "💡", label: "Ideas",         color: "#f59e0b", description: "Share and discuss new ideas" },
  "q-and-a":      { icon: "❓", label: "Q&A",           color: "#22c55e", description: "Ask questions and get answers" },
  "show-and-tell": { icon: "🎪", label: "Show & Tell",  color: "#ec4899", description: "Share your work and get feedback" },
  methodology:    { icon: "🔬", label: "Methodology",   color: "#3b82f6", description: "Discuss research methods and approaches" },
  literature:     { icon: "📚", label: "Literature",     color: "#a855f7", description: "Discuss papers and publications" },
  announcements:  { icon: "📢", label: "Announcements",  color: "#ef4444", description: "Important project announcements" },
};

// ─── Context Type ────────────────────────────────────────────
interface DiscussionForumsContextType {
  threads: DiscussionThread[];
  replies: DiscussionReply[];
  projects: DiscussionProject[];
  createThread: (thread: Omit<DiscussionThread, "id" | "createdAt" | "updatedAt" | "reactions" | "replyCount" | "viewCount" | "lastActivityAt">) => DiscussionThread;
  updateThread: (id: string, updates: Partial<Pick<DiscussionThread, "title" | "content" | "category" | "tags">>) => void;
  deleteThread: (id: string) => void;
  pinThread: (id: string) => void;
  unpinThread: (id: string) => void;
  lockThread: (id: string) => void;
  unlockThread: (id: string) => void;
  closeThread: (id: string) => void;
  reopenThread: (id: string) => void;
  addReply: (reply: Omit<DiscussionReply, "id" | "createdAt" | "updatedAt" | "reactions" | "isAnswer">) => DiscussionReply;
  updateReply: (id: string, content: string) => void;
  deleteReply: (id: string) => void;
  markAsAnswer: (replyId: string) => void;
  unmarkAsAnswer: (replyId: string) => void;
  addReaction: (targetType: "thread" | "reply", targetId: string, reaction: ReactionType, userId: string) => void;
  removeReaction: (targetType: "thread" | "reply", targetId: string, reaction: ReactionType, userId: string) => void;
  getThreadsByProject: (projectId: string) => DiscussionThread[];
  getRepliesByThread: (threadId: string) => DiscussionReply[];
  incrementViewCount: (threadId: string) => void;
}

const DiscussionForumsContext = createContext<DiscussionForumsContextType | null>(null);

// ─── Storage ─────────────────────────────────────────────────
const STORAGE_KEY = "thinkspace-discussion-forums";

function generateId(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

interface StoredData {
  threads: DiscussionThread[];
  replies: DiscussionReply[];
  projects: DiscussionProject[];
}

function createSampleData(): StoredData {
  const projectA = generateId();
  const projectB = generateId();

  const projects: DiscussionProject[] = [
    { id: projectA, name: "Quantum Biology Research", icon: "🧬", threadCount: 4 },
    { id: projectB, name: "AI for Scientific Discovery", icon: "🤖", threadCount: 3 },
  ];

  const now = Date.now();
  const thread1 = generateId();
  const thread2 = generateId();
  const thread3 = generateId();
  const thread4 = generateId();
  const thread5 = generateId();

  const threads: DiscussionThread[] = [
    {
      id: thread1, projectId: projectA, title: "Welcome to the Quantum Biology Research Forum",
      content: "This is the official discussion space for our quantum biology research project. Feel free to ask questions, share ideas, and discuss methodology.",
      category: "announcements", status: "open", authorId: "user-1", authorName: "Dr. Elena Vasquez", authorAvatar: "🧬",
      createdAt: now - 86400000 * 30, updatedAt: now - 86400000 * 30, reactions: [{ type: "🎉", users: ["user-2", "user-3", "user-4"] }, { type: "❤️", users: ["user-2"] }],
      replyCount: 2, isPinned: true, isLocked: false, tags: ["welcome", "guidelines"], viewCount: 156, lastActivityAt: now - 86400000 * 2,
    },
    {
      id: thread2, projectId: projectA, title: "How to measure quantum coherence in chloroplasts?",
      content: "I'm trying to replicate the 2D electronic spectroscopy experiments from Fleming et al. (2007). Has anyone had success with the setup? What temperature range works best?",
      category: "q-and-a", status: "answered", authorId: "user-3", authorName: "Dr. Marco Rossi", authorAvatar: "🔬",
      createdAt: now - 86400000 * 14, updatedAt: now - 86400000 * 10, reactions: [{ type: "👍", users: ["user-1", "user-4"] }],
      replyCount: 5, isPinned: false, isLocked: false, tags: ["spectroscopy", "chloroplasts", "methodology"], viewCount: 89, lastActivityAt: now - 86400000 * 3,
    },
    {
      id: thread3, projectId: projectA, title: "Proposal: New approach to modeling decoherence in warm biological systems",
      content: "I've been working on a modified Lindblad master equation that accounts for the structured noise environment in proteins. The key insight is that the protein scaffold creates a non-Markovian bath that can actually protect coherence rather than destroy it.",
      category: "ideas", status: "open", authorId: "user-1", authorName: "Dr. Elena Vasquez", authorAvatar: "🧬",
      createdAt: now - 86400000 * 7, updatedAt: now - 86400000 * 5, reactions: [{ type: "🚀", users: ["user-2", "user-3"] }, { type: "🤔", users: ["user-4"] }],
      replyCount: 3, isPinned: false, isLocked: false, tags: ["decoherence", "modeling", "non-Markovian"], viewCount: 67, lastActivityAt: now - 86400000,
    },
    {
      id: thread4, projectId: projectA, title: "Literature review: Quantum effects in enzyme catalysis",
      content: "Sharing my annotated bibliography of key papers on quantum tunneling in enzyme reactions. Covers 2010-2025 literature with focus on kinetic isotope effects.",
      category: "literature", status: "open", authorId: "user-2", authorName: "Prof. James Chen", authorAvatar: "📚",
      createdAt: now - 86400000 * 3, updatedAt: now - 86400000 * 3, reactions: [{ type: "👍", users: ["user-1", "user-3", "user-4"] }],
      replyCount: 1, isPinned: false, isLocked: false, tags: ["enzymes", "tunneling", "review"], viewCount: 45, lastActivityAt: now - 86400000 * 2,
    },
    {
      id: thread5, projectId: projectB, title: "Best practices for training scientific foundation models",
      content: "Let's discuss strategies for pre-training large language models on scientific corpora. What data curation approaches have worked for you?",
      category: "methodology", status: "open", authorId: "user-2", authorName: "Prof. James Chen", authorAvatar: "🤖",
      createdAt: now - 86400000 * 5, updatedAt: now - 86400000 * 2, reactions: [{ type: "🚀", users: ["user-1"] }],
      replyCount: 4, isPinned: true, isLocked: false, tags: ["foundation-models", "training", "data-curation"], viewCount: 234, lastActivityAt: now - 3600000,
    },
  ];

  const reply1 = generateId();
  const replies: DiscussionReply[] = [
    {
      id: generateId(), threadId: thread1, authorId: "user-2", authorName: "Prof. James Chen", authorAvatar: "🤖",
      content: "Excited to be part of this project! Looking forward to the cross-disciplinary collaboration.", createdAt: now - 86400000 * 29, updatedAt: now - 86400000 * 29,
      reactions: [{ type: "❤️", users: ["user-1"] }], isAnswer: false, parentReplyId: null,
    },
    {
      id: reply1, threadId: thread2, authorId: "user-1", authorName: "Dr. Elena Vasquez", authorAvatar: "🧬",
      content: "We've had good results at 77K using a Ti:Sapphire laser system. The key is to use a very short pulse duration (<20 fs) to capture the coherent dynamics before decoherence sets in. I can share our detailed protocol.",
      createdAt: now - 86400000 * 12, updatedAt: now - 86400000 * 12, reactions: [{ type: "👍", users: ["user-3", "user-4"] }], isAnswer: true, parentReplyId: null,
    },
    {
      id: generateId(), threadId: thread2, authorId: "user-3", authorName: "Dr. Marco Rossi", authorAvatar: "🔬",
      content: "Thank you! That's exactly what I needed. Would you also recommend any specific detector for the 2D spectra?",
      createdAt: now - 86400000 * 11, updatedAt: now - 86400000 * 11, reactions: [], isAnswer: false, parentReplyId: reply1,
    },
    {
      id: generateId(), threadId: thread3, authorId: "user-4", authorName: "Dr. Sarah Kim", authorAvatar: "🧪",
      content: "Interesting approach! Have you considered how this model handles the transition from quantum to classical behavior at different length scales?",
      createdAt: now - 86400000 * 5, updatedAt: now - 86400000 * 5, reactions: [{ type: "🤔", users: ["user-1"] }], isAnswer: false, parentReplyId: null,
    },
    {
      id: generateId(), threadId: thread5, authorId: "user-1", authorName: "Dr. Elena Vasquez", authorAvatar: "🧬",
      content: "For domain-specific pre-training, we found that mixing general scientific text with structured data (equations, tables, chemical formulas) in a 70/30 ratio gives the best downstream performance.",
      createdAt: now - 86400000 * 4, updatedAt: now - 86400000 * 4, reactions: [{ type: "🚀", users: ["user-2"] }], isAnswer: false, parentReplyId: null,
    },
  ];

  return { threads, replies, projects };
}

function loadData(): StoredData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return createSampleData();
}

function saveData(data: StoredData) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

// ─── Provider ────────────────────────────────────────────────
export const DiscussionForumsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<StoredData>(loadData);

  useEffect(() => { saveData(data); }, [data]);

  const createThread = useCallback((input: Omit<DiscussionThread, "id" | "createdAt" | "updatedAt" | "reactions" | "replyCount" | "viewCount" | "lastActivityAt">): DiscussionThread => {
    const now = Date.now();
    const thread: DiscussionThread = {
      ...input, id: generateId(), createdAt: now, updatedAt: now, reactions: [], replyCount: 0, viewCount: 0, lastActivityAt: now,
    };
    setData((prev) => ({
      ...prev,
      threads: [thread, ...prev.threads],
      projects: prev.projects.map((p) => p.id === input.projectId ? { ...p, threadCount: p.threadCount + 1 } : p),
    }));
    return thread;
  }, []);

  const updateThread = useCallback((id: string, updates: Partial<Pick<DiscussionThread, "title" | "content" | "category" | "tags">>) => {
    setData((prev) => ({
      ...prev,
      threads: prev.threads.map((t) => t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t),
    }));
  }, []);

  const deleteThread = useCallback((id: string) => {
    setData((prev) => {
      const thread = prev.threads.find((t) => t.id === id);
      return {
        ...prev,
        threads: prev.threads.filter((t) => t.id !== id),
        replies: prev.replies.filter((r) => r.threadId !== id),
        projects: thread ? prev.projects.map((p) => p.id === thread.projectId ? { ...p, threadCount: Math.max(0, p.threadCount - 1) } : p) : prev.projects,
      };
    });
  }, []);

  const pinThread = useCallback((id: string) => {
    setData((prev) => ({ ...prev, threads: prev.threads.map((t) => t.id === id ? { ...t, isPinned: true } : t) }));
  }, []);

  const unpinThread = useCallback((id: string) => {
    setData((prev) => ({ ...prev, threads: prev.threads.map((t) => t.id === id ? { ...t, isPinned: false } : t) }));
  }, []);

  const lockThread = useCallback((id: string) => {
    setData((prev) => ({ ...prev, threads: prev.threads.map((t) => t.id === id ? { ...t, isLocked: true } : t) }));
  }, []);

  const unlockThread = useCallback((id: string) => {
    setData((prev) => ({ ...prev, threads: prev.threads.map((t) => t.id === id ? { ...t, isLocked: false } : t) }));
  }, []);

  const closeThread = useCallback((id: string) => {
    setData((prev) => ({ ...prev, threads: prev.threads.map((t) => t.id === id ? { ...t, status: "closed" as DiscussionStatus } : t) }));
  }, []);

  const reopenThread = useCallback((id: string) => {
    setData((prev) => ({ ...prev, threads: prev.threads.map((t) => t.id === id ? { ...t, status: "open" as DiscussionStatus } : t) }));
  }, []);

  const addReply = useCallback((input: Omit<DiscussionReply, "id" | "createdAt" | "updatedAt" | "reactions" | "isAnswer">): DiscussionReply => {
    const now = Date.now();
    const reply: DiscussionReply = { ...input, id: generateId(), createdAt: now, updatedAt: now, reactions: [], isAnswer: false };
    setData((prev) => ({
      ...prev,
      replies: [...prev.replies, reply],
      threads: prev.threads.map((t) => t.id === input.threadId ? { ...t, replyCount: t.replyCount + 1, lastActivityAt: now } : t),
    }));
    return reply;
  }, []);

  const updateReply = useCallback((id: string, content: string) => {
    setData((prev) => ({
      ...prev,
      replies: prev.replies.map((r) => r.id === id ? { ...r, content, updatedAt: Date.now() } : r),
    }));
  }, []);

  const deleteReply = useCallback((id: string) => {
    setData((prev) => {
      const reply = prev.replies.find((r) => r.id === id);
      return {
        ...prev,
        replies: prev.replies.filter((r) => r.id !== id),
        threads: reply ? prev.threads.map((t) => t.id === reply.threadId ? { ...t, replyCount: Math.max(0, t.replyCount - 1) } : t) : prev.threads,
      };
    });
  }, []);

  const markAsAnswer = useCallback((replyId: string) => {
    setData((prev) => {
      const reply = prev.replies.find((r) => r.id === replyId);
      if (!reply) return prev;
      return {
        ...prev,
        replies: prev.replies.map((r) => {
          if (r.threadId === reply.threadId) return { ...r, isAnswer: r.id === replyId };
          return r;
        }),
        threads: prev.threads.map((t) => t.id === reply.threadId ? { ...t, status: "answered" as DiscussionStatus } : t),
      };
    });
  }, []);

  const unmarkAsAnswer = useCallback((replyId: string) => {
    setData((prev) => {
      const reply = prev.replies.find((r) => r.id === replyId);
      if (!reply) return prev;
      const otherAnswers = prev.replies.filter((r) => r.threadId === reply.threadId && r.id !== replyId && r.isAnswer);
      return {
        ...prev,
        replies: prev.replies.map((r) => r.id === replyId ? { ...r, isAnswer: false } : r),
        threads: otherAnswers.length === 0
          ? prev.threads.map((t) => t.id === reply.threadId ? { ...t, status: "open" as DiscussionStatus } : t)
          : prev.threads,
      };
    });
  }, []);

  const addReaction = useCallback((targetType: "thread" | "reply", targetId: string, reaction: ReactionType, userId: string) => {
    setData((prev) => {
      const key = targetType === "thread" ? "threads" : "replies";
      const items = prev[key] as (DiscussionThread | DiscussionReply)[];
      const updated = items.map((item) => {
        if (item.id !== targetId) return item;
        const existing = item.reactions.find((r) => r.type === reaction);
        if (existing) {
          if (existing.users.includes(userId)) return item;
          return { ...item, reactions: item.reactions.map((r) => r.type === reaction ? { ...r, users: [...r.users, userId] } : r) };
        }
        return { ...item, reactions: [...item.reactions, { type: reaction, users: [userId] }] };
      });
      return { ...prev, [key]: updated };
    });
  }, []);

  const removeReaction = useCallback((targetType: "thread" | "reply", targetId: string, reaction: ReactionType, userId: string) => {
    setData((prev) => {
      const key = targetType === "thread" ? "threads" : "replies";
      const items = prev[key] as (DiscussionThread | DiscussionReply)[];
      const updated = items.map((item) => {
        if (item.id !== targetId) return item;
        return {
          ...item,
          reactions: item.reactions
            .map((r) => r.type === reaction ? { ...r, users: r.users.filter((u) => u !== userId) } : r)
            .filter((r) => r.users.length > 0),
        };
      });
      return { ...prev, [key]: updated };
    });
  }, []);

  const getThreadsByProject = useCallback((projectId: string) => {
    return data.threads.filter((t) => t.projectId === projectId);
  }, [data.threads]);

  const getRepliesByThread = useCallback((threadId: string) => {
    return data.replies.filter((r) => r.threadId === threadId);
  }, [data.replies]);

  const incrementViewCount = useCallback((threadId: string) => {
    setData((prev) => ({
      ...prev,
      threads: prev.threads.map((t) => t.id === threadId ? { ...t, viewCount: t.viewCount + 1 } : t),
    }));
  }, []);

  const value = useMemo<DiscussionForumsContextType>(() => ({
    threads: data.threads, replies: data.replies, projects: data.projects,
    createThread, updateThread, deleteThread, pinThread, unpinThread, lockThread, unlockThread,
    closeThread, reopenThread, addReply, updateReply, deleteReply, markAsAnswer, unmarkAsAnswer,
    addReaction, removeReaction, getThreadsByProject, getRepliesByThread, incrementViewCount,
  }), [data, createThread, updateThread, deleteThread, pinThread, unpinThread, lockThread, unlockThread,
    closeThread, reopenThread, addReply, updateReply, deleteReply, markAsAnswer, unmarkAsAnswer,
    addReaction, removeReaction, getThreadsByProject, getRepliesByThread, incrementViewCount]);

  return <DiscussionForumsContext.Provider value={value}>{children}</DiscussionForumsContext.Provider>;
};

// ─── Hook ────────────────────────────────────────────────────
export function useDiscussionForums(): DiscussionForumsContextType {
  const ctx = useContext(DiscussionForumsContext);
  if (!ctx) throw new Error("useDiscussionForums must be used within DiscussionForumsProvider");
  return ctx;
}
