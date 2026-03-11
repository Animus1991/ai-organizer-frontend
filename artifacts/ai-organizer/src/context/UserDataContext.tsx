// src/context/UserDataContext.tsx
// Shared cross-page data layer: profile, stats, following, activity, teams, collections
// All social pages read from and write to this single source of truth (localStorage-backed)
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  displayName: string;
  bio: string;
  institution: string;
  expertise: string[];
  avatarInitial: string;
  isPublic: boolean;
  joinedAt: string;
}

export interface ActivityEvent {
  id: string;
  type: "upload" | "segment" | "comment" | "follow" | "collection" | "team" | "review" | "star";
  title: string;
  description: string;
  timestamp: number;
  meta?: Record<string, string | number>;
}

export interface TeamMembership {
  teamId: string;
  teamName: string;
  role: "owner" | "admin" | "member" | "viewer";
  joinedAt: number;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  visibility: "public" | "private" | "team";
  documentIds: number[];
  createdAt: number;
  updatedAt: number;
  tags: string[];
}

export interface PinnedItem {
  id: string;
  type: "document" | "collection" | "researcher" | "team";
  title: string;
  resourceId: string;
  pinnedAt: number;
}

export interface FollowedResearcher {
  id: string;
  name: string;
  institution: string;
  expertise: string[];
  followedAt: number;
}

export interface PlatformStats {
  documentsUploaded: number;
  segmentsCreated: number;
  commentsPosted: number;
  collectionsCreated: number;
  teamsJoined: number;
  followersCount: number;
  followingCount: number;
  starsReceived: number;
  reviewsCompleted: number;
  lastActiveAt: number;
}

// ─── Storage keys ─────────────────────────────────────────────────────────────

const KEYS = {
  profile: "userdata-profile",
  activity: "userdata-activity",
  teams: "userdata-teams",
  collections: "userdata-collections",
  following: "userdata-following",
  stats: "userdata-stats",
  unreadActivity: "userdata-unread-activity",
  unreadTeamInvites: "userdata-unread-team-invites",
  pinnedItems: "userdata-pinned-items",
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Default values ───────────────────────────────────────────────────────────

const DEFAULT_PROFILE: UserProfile = {
  displayName: "",
  bio: "",
  institution: "",
  expertise: [],
  avatarInitial: "U",
  isPublic: true,
  joinedAt: new Date().toISOString(),
};

const DEFAULT_STATS: PlatformStats = {
  documentsUploaded: 0,
  segmentsCreated: 0,
  commentsPosted: 0,
  collectionsCreated: 0,
  teamsJoined: 0,
  followersCount: 0,
  followingCount: 0,
  starsReceived: 0,
  reviewsCompleted: 0,
  lastActiveAt: Date.now(),
};

// ─── Context ──────────────────────────────────────────────────────────────────

interface UserDataContextValue {
  // Profile
  profile: UserProfile;
  updateProfile: (patch: Partial<UserProfile>) => void;

  // Stats (derived + manual)
  stats: PlatformStats;
  refreshStats: () => void;

  // Activity feed
  activity: ActivityEvent[];
  addActivity: (event: Omit<ActivityEvent, "id" | "timestamp">) => void;
  clearActivity: () => void;

  // Following
  following: FollowedResearcher[];
  followResearcher: (researcher: Omit<FollowedResearcher, "followedAt">) => void;
  unfollowResearcher: (id: string) => void;
  isFollowing: (id: string) => boolean;

  // Teams
  teams: TeamMembership[];
  joinTeam: (team: Omit<TeamMembership, "joinedAt">) => void;
  leaveTeam: (teamId: string) => void;

  // Collections
  collections: Collection[];
  createCollection: (col: Omit<Collection, "id" | "createdAt" | "updatedAt">) => Collection;
  updateCollection: (id: string, patch: Partial<Collection>) => void;
  deleteCollection: (id: string) => void;
  addDocToCollection: (collectionId: string, docId: number) => void;
  removeDocFromCollection: (collectionId: string, docId: number) => void;

  // Pinned items
  pinnedItems: PinnedItem[];
  pinItem: (item: Omit<PinnedItem, "id" | "pinnedAt">) => void;
  unpinItem: (id: string) => void;
  isPinned: (resourceId: string) => boolean;

  // Online presence (simulated)
  onlineCount: number;

  // Unread badges
  unreadActivity: number;
  unreadTeamInvites: number;
  markActivityRead: () => void;
  markTeamInvitesRead: () => void;
}

const UserDataContext = createContext<UserDataContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function UserDataProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(() => load(KEYS.profile, DEFAULT_PROFILE));
  const [activity, setActivity] = useState<ActivityEvent[]>(() => load(KEYS.activity, []));
  const [following, setFollowing] = useState<FollowedResearcher[]>(() => load(KEYS.following, []));
  const [teams, setTeams] = useState<TeamMembership[]>(() => load(KEYS.teams, []));
  const [collections, setCollections] = useState<Collection[]>(() => load(KEYS.collections, []));
  const [unreadActivity, setUnreadActivity] = useState<number>(() => load(KEYS.unreadActivity, 0));
  const [unreadTeamInvites, setUnreadTeamInvites] = useState<number>(() => load(KEYS.unreadTeamInvites, 0));
  const [pinnedItems, setPinnedItems] = useState<PinnedItem[]>(() => load(KEYS.pinnedItems, []));
  const [onlineCount, setOnlineCount] = useState<number>(() => Math.floor(Math.random() * 40) + 12);

  // Persist on change
  useEffect(() => { save(KEYS.profile, profile); }, [profile]);
  useEffect(() => { save(KEYS.activity, activity.slice(0, 200)); }, [activity]);
  useEffect(() => { save(KEYS.following, following); }, [following]);
  useEffect(() => { save(KEYS.teams, teams); }, [teams]);
  useEffect(() => { save(KEYS.collections, collections); }, [collections]);
  useEffect(() => { save(KEYS.unreadActivity, unreadActivity); }, [unreadActivity]);
  useEffect(() => { save(KEYS.unreadTeamInvites, unreadTeamInvites); }, [unreadTeamInvites]);
  useEffect(() => { save(KEYS.pinnedItems, pinnedItems); }, [pinnedItems]);

  // Simulate online count drifting every 45s
  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineCount(prev => Math.max(5, prev + Math.floor(Math.random() * 7) - 3));
    }, 45000);
    return () => clearInterval(interval);
  }, []);

  // Derive real stats from localStorage + context state
  const refreshStats = useCallback(() => {
    try {
      const uploads = JSON.parse(localStorage.getItem("uploads") || "[]");
      const segments = JSON.parse(localStorage.getItem("segments") || "[]");
      const comments: Record<string, unknown[]> = JSON.parse(localStorage.getItem("segment-comments") || "{}");
      const totalComments = Object.values(comments).reduce((s, arr) => s + arr.length, 0);

      const derived: PlatformStats = {
        documentsUploaded: Array.isArray(uploads) ? uploads.length : 0,
        segmentsCreated: Array.isArray(segments) ? segments.length : 0,
        commentsPosted: totalComments,
        collectionsCreated: collections.length,
        teamsJoined: teams.length,
        followersCount: load<number>("userdata-followers-count", 0),
        followingCount: following.length,
        starsReceived: load<number>("userdata-stars-received", 0),
        reviewsCompleted: load<number>("userdata-reviews-completed", 0),
        lastActiveAt: Date.now(),
      };
      save(KEYS.stats, derived);
      return derived;
    } catch {
      return DEFAULT_STATS;
    }
  }, [collections.length, teams.length, following.length]);

  const stats = useMemo(() => refreshStats(), [refreshStats]);

  // Profile
  const updateProfile = useCallback((patch: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...patch }));
  }, []);

  // Activity
  const addActivity = useCallback((event: Omit<ActivityEvent, "id" | "timestamp">) => {
    const full: ActivityEvent = { ...event, id: uid(), timestamp: Date.now() };
    setActivity(prev => [full, ...prev].slice(0, 200));
    setUnreadActivity(prev => prev + 1);
  }, []);

  const clearActivity = useCallback(() => {
    setActivity([]);
    setUnreadActivity(0);
  }, []);

  // Following
  const followResearcher = useCallback((researcher: Omit<FollowedResearcher, "followedAt">) => {
    setFollowing(prev => {
      if (prev.some(r => r.id === researcher.id)) return prev;
      return [...prev, { ...researcher, followedAt: Date.now() }];
    });
    addActivity({ type: "follow", title: `Followed ${researcher.name}`, description: researcher.institution });
  }, [addActivity]);

  const unfollowResearcher = useCallback((id: string) => {
    setFollowing(prev => prev.filter(r => r.id !== id));
  }, []);

  const isFollowing = useCallback((id: string) => following.some(r => r.id === id), [following]);

  // Teams
  const joinTeam = useCallback((team: Omit<TeamMembership, "joinedAt">) => {
    setTeams(prev => {
      if (prev.some(t => t.teamId === team.teamId)) return prev;
      return [...prev, { ...team, joinedAt: Date.now() }];
    });
    addActivity({ type: "team", title: `Joined team: ${team.teamName}`, description: `Role: ${team.role}` });
  }, [addActivity]);

  const leaveTeam = useCallback((teamId: string) => {
    setTeams(prev => prev.filter(t => t.teamId !== teamId));
  }, []);

  // Collections
  const createCollection = useCallback((col: Omit<Collection, "id" | "createdAt" | "updatedAt">): Collection => {
    const now = Date.now();
    const full: Collection = { ...col, id: uid(), createdAt: now, updatedAt: now };
    setCollections(prev => [...prev, full]);
    addActivity({ type: "collection", title: `Created collection: ${col.name}`, description: col.description });
    return full;
  }, [addActivity]);

  const updateCollection = useCallback((id: string, patch: Partial<Collection>) => {
    setCollections(prev => prev.map(c => c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c));
  }, []);

  const deleteCollection = useCallback((id: string) => {
    setCollections(prev => prev.filter(c => c.id !== id));
  }, []);

  const addDocToCollection = useCallback((collectionId: string, docId: number) => {
    setCollections(prev => prev.map(c =>
      c.id === collectionId && !c.documentIds.includes(docId)
        ? { ...c, documentIds: [...c.documentIds, docId], updatedAt: Date.now() }
        : c
    ));
  }, []);

  const removeDocFromCollection = useCallback((collectionId: string, docId: number) => {
    setCollections(prev => prev.map(c =>
      c.id === collectionId
        ? { ...c, documentIds: c.documentIds.filter(d => d !== docId), updatedAt: Date.now() }
        : c
    ));
  }, []);

  // Pinned items
  const pinItem = useCallback((item: Omit<PinnedItem, "id" | "pinnedAt">) => {
    setPinnedItems(prev => {
      if (prev.some(p => p.resourceId === item.resourceId)) return prev;
      return [{ ...item, id: uid(), pinnedAt: Date.now() }, ...prev].slice(0, 20);
    });
  }, []);

  const unpinItem = useCallback((id: string) => {
    setPinnedItems(prev => prev.filter(p => p.id !== id));
  }, []);

  const isPinned = useCallback((resourceId: string) => pinnedItems.some(p => p.resourceId === resourceId), [pinnedItems]);

  // Badges
  const markActivityRead = useCallback(() => setUnreadActivity(0), []);
  const markTeamInvitesRead = useCallback(() => setUnreadTeamInvites(0), []);

  const value: UserDataContextValue = {
    profile, updateProfile,
    stats, refreshStats,
    activity, addActivity, clearActivity,
    following, followResearcher, unfollowResearcher, isFollowing,
    teams, joinTeam, leaveTeam,
    collections, createCollection, updateCollection, deleteCollection, addDocToCollection, removeDocFromCollection,
    pinnedItems, pinItem, unpinItem, isPinned,
    onlineCount,
    unreadActivity, unreadTeamInvites, markActivityRead, markTeamInvitesRead,
  };

  return <UserDataContext.Provider value={value}>{children}</UserDataContext.Provider>;
}

export function useUserData(): UserDataContextValue {
  const ctx = useContext(UserDataContext);
  if (!ctx) throw new Error("useUserData must be used within UserDataProvider");
  return ctx;
}
