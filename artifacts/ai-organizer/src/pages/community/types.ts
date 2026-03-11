/**
 * Community module — shared types
 */

export type ProfileTab = "discover" | "following" | "followers" | "suggested";
export type SortMode = "popular" | "active" | "newest" | "citations";

export interface CommunityProfile {
  id: string;
  name: string;
  avatar: string;
  username: string;
  institution: string;
  department: string;
  field: string;
  bio: string;
  location: string;
  website: string;
  orcid: string;
  publications: number;
  citations: number;
  hIndex: number;
  followers: number;
  following: number;
  isFollowing: boolean;
  isFollowedBy: boolean;
  joinedAt: number;
  lastActiveAt: number;
  expertise: string[];
  recentProjects: string[];
  contributionCount: number;
  openToCollaboration: boolean;
  verifiedEmail: boolean;
}

export interface FollowActivity {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  action: "published" | "commented" | "starred" | "forked" | "released" | "followed";
  targetTitle: string;
  targetType: string;
  timestamp: number;
}

export type ProposalRole = "co-author" | "collaborator" | "co-founder" | "advisor" | "peer-reviewer" | "research-partner";
export type ProposalScope = "paper" | "project" | "startup" | "grant" | "mentoring" | "other";

export interface CollabProposal {
  id: string;
  toUserId: string;
  toUserName: string;
  role: ProposalRole;
  scope: ProposalScope;
  timeframe: string;
  compensation: string;
  message: string;
  milestones: string[];
  sentAt: number;
}

export interface StoredData {
  profiles: CommunityProfile[];
  activities: FollowActivity[];
}
