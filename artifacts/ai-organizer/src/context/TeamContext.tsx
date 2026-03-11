/**
 * TeamContext - Team management with roles for collaborative research
 * Supports teams, members with roles, invitations, and team activity
 * Follows GitHub's organization model adapted for academic collaboration
 */

import React, { useState, useCallback, useEffect, createContext, useContext } from "react";

// Role hierarchy: Owner > Admin > Write > Read
export type TeamRole = "owner" | "admin" | "write" | "read";

export interface TeamMember {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  role: TeamRole;
  joinedAt: Date;
  lastActiveAt?: Date;
  status: "active" | "inactive" | "pending";
}

export interface TeamInvitation {
  id: string;
  teamId: string;
  email: string;
  role: TeamRole;
  invitedBy: string;
  invitedAt: Date;
  expiresAt: Date;
  status: "pending" | "accepted" | "declined" | "expired";
}

export interface Team {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  members: TeamMember[];
  invitations: TeamInvitation[];
  settings: {
    defaultRole: TeamRole;
    allowMemberInvite: boolean;
    requireApproval: boolean;
  };
  projectIds: string[];
}

// Context type
interface TeamContextType {
  // Teams
  teams: Team[];
  createTeam: (name: string, description: string) => Team;
  updateTeam: (teamId: string, updates: Partial<Pick<Team, "name" | "description" | "avatar" | "settings">>) => void;
  deleteTeam: (teamId: string) => void;
  getTeam: (teamId: string) => Team | undefined;

  // Members
  addMember: (teamId: string, member: Omit<TeamMember, "id" | "joinedAt" | "status">) => string;
  removeMember: (teamId: string, memberId: string) => void;
  updateMemberRole: (teamId: string, memberId: string, role: TeamRole) => void;
  getTeamMembers: (teamId: string) => TeamMember[];
  getMemberRole: (teamId: string, userId: string) => TeamRole | null;

  // Invitations
  inviteMember: (teamId: string, email: string, role: TeamRole) => TeamInvitation;
  cancelInvitation: (teamId: string, invitationId: string) => void;
  acceptInvitation: (invitationId: string, userId: string, userName: string) => void;
  declineInvitation: (invitationId: string) => void;
  getPendingInvitations: (teamId: string) => TeamInvitation[];

  // Projects
  addProjectToTeam: (teamId: string, projectId: string) => void;
  removeProjectFromTeam: (teamId: string, projectId: string) => void;
  getTeamProjects: (teamId: string) => string[];
  getTeamsForProject: (projectId: string) => Team[];

  // Permissions
  canManageTeam: (teamId: string, userId: string) => boolean;
  canInviteMembers: (teamId: string, userId: string) => boolean;
  canEditProject: (teamId: string, userId: string) => boolean;

  // Current user
  currentUserId: string;
}

const TeamContext = createContext<TeamContextType | null>(null);

// Local storage key
const STORAGE_KEY = "collab_teams";

// Generate unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Role hierarchy for permission checks
const ROLE_HIERARCHY: Record<TeamRole, number> = {
  owner: 4,
  admin: 3,
  write: 2,
  read: 1,
};

// Provider props
interface TeamProviderProps {
  children: React.ReactNode;
  currentUserId?: string;
}

// Sample team data for demo
function generateSampleTeams(userId: string): Team[] {
  const now = new Date();
  const monthAgo = new Date(now.getTime() - 30 * 86400000);
  const weekAgo = new Date(now.getTime() - 7 * 86400000);

  return [
    {
      id: "team-1",
      name: "Cognitive Science Lab",
      description: "Research team focused on cognitive science and neural networks",
      createdAt: monthAgo,
      updatedAt: weekAgo,
      createdBy: userId,
      members: [
        {
          id: "member-1",
          userId: userId,
          userName: "You",
          userEmail: "you@university.edu",
          role: "owner",
          joinedAt: monthAgo,
          lastActiveAt: now,
          status: "active",
        },
        {
          id: "member-2",
          userId: "user-2",
          userName: "Dr. Elena Vasquez",
          userEmail: "elena.v@university.edu",
          role: "admin",
          joinedAt: monthAgo,
          lastActiveAt: weekAgo,
          status: "active",
        },
        {
          id: "member-3",
          userId: "user-3",
          userName: "Marcus Chen",
          userEmail: "m.chen@university.edu",
          role: "write",
          joinedAt: weekAgo,
          lastActiveAt: new Date(now.getTime() - 2 * 86400000),
          status: "active",
        },
        {
          id: "member-4",
          userId: "user-4",
          userName: "Sofia Andersson",
          userEmail: "s.andersson@university.edu",
          role: "read",
          joinedAt: weekAgo,
          status: "active",
        },
      ],
      invitations: [
        {
          id: "inv-1",
          teamId: "team-1",
          email: "new.researcher@university.edu",
          role: "write",
          invitedBy: userId,
          invitedAt: new Date(now.getTime() - 2 * 86400000),
          expiresAt: new Date(now.getTime() + 5 * 86400000),
          status: "pending",
        },
      ],
      settings: {
        defaultRole: "read",
        allowMemberInvite: true,
        requireApproval: false,
      },
      projectIds: ["proj-1", "proj-2"],
    },
    {
      id: "team-2",
      name: "NLP Research Group",
      description: "Natural Language Processing and computational linguistics",
      createdAt: new Date(now.getTime() - 60 * 86400000),
      updatedAt: new Date(now.getTime() - 3 * 86400000),
      createdBy: "user-2",
      members: [
        {
          id: "member-5",
          userId: "user-2",
          userName: "Dr. Elena Vasquez",
          userEmail: "elena.v@university.edu",
          role: "owner",
          joinedAt: new Date(now.getTime() - 60 * 86400000),
          lastActiveAt: new Date(now.getTime() - 3 * 86400000),
          status: "active",
        },
        {
          id: "member-6",
          userId: userId,
          userName: "You",
          userEmail: "you@university.edu",
          role: "write",
          joinedAt: new Date(now.getTime() - 45 * 86400000),
          lastActiveAt: now,
          status: "active",
        },
      ],
      invitations: [],
      settings: {
        defaultRole: "read",
        allowMemberInvite: false,
        requireApproval: true,
      },
      projectIds: ["proj-3"],
    },
  ];
}

export const TeamProvider: React.FC<TeamProviderProps> = ({
  children,
  currentUserId = "user-1",
}) => {
  const [teams, setTeams] = useState<Team[]>([]);

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const hydrated = parsed.map((t: Team) => ({
          ...t,
          createdAt: new Date(t.createdAt),
          updatedAt: new Date(t.updatedAt),
          members: t.members.map((m: TeamMember) => ({
            ...m,
            joinedAt: new Date(m.joinedAt),
            lastActiveAt: m.lastActiveAt ? new Date(m.lastActiveAt) : undefined,
          })),
          invitations: t.invitations.map((i: TeamInvitation) => ({
            ...i,
            invitedAt: new Date(i.invitedAt),
            expiresAt: new Date(i.expiresAt),
          })),
        }));
        setTeams(hydrated);
      } else {
        // Generate sample data on first load
        const samples = generateSampleTeams(currentUserId);
        setTeams(samples);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(samples));
      }
    } catch (error) {
      console.error("Failed to load teams:", error);
      const samples = generateSampleTeams(currentUserId);
      setTeams(samples);
    }
  }, [currentUserId]);

  // Save to localStorage
  useEffect(() => {
    if (teams.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(teams));
    }
  }, [teams]);

  // --- Team CRUD ---
  const createTeam = useCallback(
    (name: string, description: string): Team => {
      const now = new Date();
      const team: Team = {
        id: `team-${generateId()}`,
        name,
        description,
        createdAt: now,
        updatedAt: now,
        createdBy: currentUserId,
        members: [
          {
            id: `member-${generateId()}`,
            userId: currentUserId,
            userName: "You",
            userEmail: "",
            role: "owner",
            joinedAt: now,
            lastActiveAt: now,
            status: "active",
          },
        ],
        invitations: [],
        settings: {
          defaultRole: "read",
          allowMemberInvite: true,
          requireApproval: false,
        },
        projectIds: [],
      };
      setTeams((prev) => [...prev, team]);
      return team;
    },
    [currentUserId]
  );

  const updateTeam = useCallback(
    (teamId: string, updates: Partial<Pick<Team, "name" | "description" | "avatar" | "settings">>) => {
      setTeams((prev) =>
        prev.map((t) =>
          t.id === teamId ? { ...t, ...updates, updatedAt: new Date() } : t
        )
      );
    },
    []
  );

  const deleteTeam = useCallback((teamId: string) => {
    setTeams((prev) => prev.filter((t) => t.id !== teamId));
  }, []);

  const getTeam = useCallback(
    (teamId: string): Team | undefined => {
      return teams.find((t) => t.id === teamId);
    },
    [teams]
  );

  // --- Members ---
  const addMember = useCallback(
    (teamId: string, member: Omit<TeamMember, "id" | "joinedAt" | "status">): string => {
      const id = `member-${generateId()}`;
      setTeams((prev) =>
        prev.map((t) => {
          if (t.id === teamId) {
            const exists = t.members.some((m) => m.userId === member.userId);
            if (exists) return t;
            return {
              ...t,
              updatedAt: new Date(),
              members: [
                ...t.members,
                { ...member, id, joinedAt: new Date(), status: "active" as const },
              ],
            };
          }
          return t;
        })
      );
      return id;
    },
    []
  );

  const removeMember = useCallback((teamId: string, memberId: string) => {
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id === teamId) {
          return {
            ...t,
            updatedAt: new Date(),
            members: t.members.filter((m) => m.id !== memberId),
          };
        }
        return t;
      })
    );
  }, []);

  const updateMemberRole = useCallback(
    (teamId: string, memberId: string, role: TeamRole) => {
      setTeams((prev) =>
        prev.map((t) => {
          if (t.id === teamId) {
            return {
              ...t,
              updatedAt: new Date(),
              members: t.members.map((m) =>
                m.id === memberId ? { ...m, role } : m
              ),
            };
          }
          return t;
        })
      );
    },
    []
  );

  const getTeamMembers = useCallback(
    (teamId: string): TeamMember[] => {
      const team = teams.find((t) => t.id === teamId);
      return team?.members || [];
    },
    [teams]
  );

  const getMemberRole = useCallback(
    (teamId: string, userId: string): TeamRole | null => {
      const team = teams.find((t) => t.id === teamId);
      const member = team?.members.find((m) => m.userId === userId);
      return member?.role || null;
    },
    [teams]
  );

  // --- Invitations ---
  const inviteMember = useCallback(
    (teamId: string, email: string, role: TeamRole): TeamInvitation => {
      const invitation: TeamInvitation = {
        id: `inv-${generateId()}`,
        teamId,
        email,
        role,
        invitedBy: currentUserId,
        invitedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 86400000), // 7 days
        status: "pending",
      };
      setTeams((prev) =>
        prev.map((t) => {
          if (t.id === teamId) {
            return {
              ...t,
              updatedAt: new Date(),
              invitations: [...t.invitations, invitation],
            };
          }
          return t;
        })
      );
      return invitation;
    },
    [currentUserId]
  );

  const cancelInvitation = useCallback((teamId: string, invitationId: string) => {
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id === teamId) {
          return {
            ...t,
            invitations: t.invitations.filter((i) => i.id !== invitationId),
          };
        }
        return t;
      })
    );
  }, []);

  const acceptInvitation = useCallback(
    (invitationId: string, userId: string, userName: string) => {
      setTeams((prev) =>
        prev.map((t) => {
          const inv = t.invitations.find((i) => i.id === invitationId);
          if (!inv || inv.status !== "pending") return t;
          return {
            ...t,
            updatedAt: new Date(),
            members: [
              ...t.members,
              {
                id: `member-${generateId()}`,
                userId,
                userName,
                userEmail: inv.email,
                role: inv.role,
                joinedAt: new Date(),
                status: "active" as const,
              },
            ],
            invitations: t.invitations.map((i) =>
              i.id === invitationId ? { ...i, status: "accepted" as const } : i
            ),
          };
        })
      );
    },
    []
  );

  const declineInvitation = useCallback((invitationId: string) => {
    setTeams((prev) =>
      prev.map((t) => ({
        ...t,
        invitations: t.invitations.map((i) =>
          i.id === invitationId ? { ...i, status: "declined" as const } : i
        ),
      }))
    );
  }, []);

  const getPendingInvitations = useCallback(
    (teamId: string): TeamInvitation[] => {
      const team = teams.find((t) => t.id === teamId);
      return team?.invitations.filter((i) => i.status === "pending") || [];
    },
    [teams]
  );

  // --- Projects ---
  const addProjectToTeam = useCallback((teamId: string, projectId: string) => {
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id === teamId && !t.projectIds.includes(projectId)) {
          return { ...t, updatedAt: new Date(), projectIds: [...t.projectIds, projectId] };
        }
        return t;
      })
    );
  }, []);

  const removeProjectFromTeam = useCallback((teamId: string, projectId: string) => {
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id === teamId) {
          return { ...t, updatedAt: new Date(), projectIds: t.projectIds.filter((p) => p !== projectId) };
        }
        return t;
      })
    );
  }, []);

  const getTeamProjects = useCallback(
    (teamId: string): string[] => {
      const team = teams.find((t) => t.id === teamId);
      return team?.projectIds || [];
    },
    [teams]
  );

  const getTeamsForProject = useCallback(
    (projectId: string): Team[] => {
      return teams.filter((t) => t.projectIds.includes(projectId));
    },
    [teams]
  );

  // --- Permissions ---
  const canManageTeam = useCallback(
    (teamId: string, userId: string): boolean => {
      const role = getMemberRole(teamId, userId);
      return role !== null && ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.admin;
    },
    [getMemberRole]
  );

  const canInviteMembers = useCallback(
    (teamId: string, userId: string): boolean => {
      const team = teams.find((t) => t.id === teamId);
      if (!team) return false;
      const role = getMemberRole(teamId, userId);
      if (!role) return false;
      if (team.settings.allowMemberInvite) {
        return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.write;
      }
      return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.admin;
    },
    [teams, getMemberRole]
  );

  const canEditProject = useCallback(
    (teamId: string, userId: string): boolean => {
      const role = getMemberRole(teamId, userId);
      return role !== null && ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.write;
    },
    [getMemberRole]
  );

  return (
    <TeamContext.Provider
      value={{
        teams,
        createTeam,
        updateTeam,
        deleteTeam,
        getTeam,
        addMember,
        removeMember,
        updateMemberRole,
        getTeamMembers,
        getMemberRole,
        inviteMember,
        cancelInvitation,
        acceptInvitation,
        declineInvitation,
        getPendingInvitations,
        addProjectToTeam,
        removeProjectFromTeam,
        getTeamProjects,
        getTeamsForProject,
        canManageTeam,
        canInviteMembers,
        canEditProject,
        currentUserId,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
};

// Hook
export const useTeams = () => {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error("useTeams must be used within TeamProvider");
  }
  return context;
};

// Role display config
export const ROLE_CONFIG: Record<TeamRole, { label: string; labelKey: string; color: string; bg: string; icon: string; description: string }> = {
  owner: {
    label: "Owner",
    labelKey: "team.role.owner",
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.15)",
    icon: "👑",
    description: "Full control over team and all projects",
  },
  admin: {
    label: "Admin",
    labelKey: "team.role.admin",
    color: "#8b5cf6",
    bg: "rgba(139, 92, 246, 0.15)",
    icon: "🛡️",
    description: "Manage members and team settings",
  },
  write: {
    label: "Write",
    labelKey: "team.role.write",
    color: "#10b981",
    bg: "rgba(16, 185, 129, 0.15)",
    icon: "✏️",
    description: "Create and edit documents and issues",
  },
  read: {
    label: "Read",
    labelKey: "team.role.read",
    color: "#6b7280",
    bg: "rgba(107, 114, 128, 0.15)",
    icon: "👁️",
    description: "View documents and comment",
  },
};

export default TeamProvider;
