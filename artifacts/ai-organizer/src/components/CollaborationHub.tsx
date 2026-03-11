import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { DocumentDTO } from '../lib/api';
import { useCollaboration } from '../context/CollaborationContext';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer' | 'contributor';
  avatar?: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastActive: Date;
  expertise: string[];
  currentActivity?: string;
}

interface CollaborationActivity {
  id: string;
  type: 'edit' | 'comment' | 'share' | 'upload' | 'review' | 'mention';
  userId: string;
  userName: string;
  userAvatar?: string;
  action: string;
  target?: string;
  documentId?: number;
  documentTitle?: string;
  timestamp: Date;
}

interface SharedDocument {
  id: number;
  title: string;
  ownerId: string;
  ownerName: string;
  sharedWith: Array<{
    userId: string;
    userName: string;
    permission: 'view' | 'edit' | 'comment' | 'admin';
    sharedAt: Date;
  }>;
  isPublic: boolean;
  permission: 'private' | 'team' | 'public';
  lastModified: Date;
  activityCount: number;
}

interface CollaborationHubProps {
  documentId?: number;
  projectId?: string;
  showActivity?: boolean;
  showTeam?: boolean;
  showShared?: boolean;
  compact?: boolean;
  documents?: DocumentDTO[];
}

export default function CollaborationHub({ 
  documentId,
  projectId,
  showActivity = true,
  showTeam = true,
  showShared = true,
  compact = false,
  documents
}: CollaborationHubProps) {
  const nav = useNavigate();
  const { t } = useLanguage();
  const { activities: collabActivities, shareLinks, currentUser, getRecentActivities } = useCollaboration();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [activities, setActivities] = useState<CollaborationActivity[]>([]);
  const [sharedDocuments, setSharedDocuments] = useState<SharedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'activity' | 'team' | 'shared'>('activity');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamMember['role']>('viewer');
  const [inviteSent, setInviteSent] = useState<string[]>([]);

  // Load collaboration data from context
  useEffect(() => {
    setLoading(true);

    const recent = getRecentActivities(12);
    const mappedActivities: CollaborationActivity[] = recent.map((activity) => ({
      id: activity.id,
      type: activity.type === "comment" ? "comment" : activity.type === "share" ? "share" : "edit",
      userId: activity.userId,
      userName: activity.userName,
      action: activity.type === "comment"
        ? t("collaboration.activity.commentedOn") || "commented on"
        : activity.type === "share"
        ? t("collaboration.activity.shared") || "shared"
        : t("collaboration.activity.edited") || "edited",
      target: activity.resourceTitle,
      documentId: Number(activity.resourceId) || undefined,
      documentTitle: activity.resourceTitle,
      timestamp: activity.timestamp,
    }));

    const userMap = new Map<string, TeamMember>();
    if (currentUser) {
      userMap.set(currentUser.id, {
        id: currentUser.id,
        name: currentUser.name,
        email: `${currentUser.name.replace(/\s+/g, ".").toLowerCase()}@aiorganizer.local`,
        role: "owner",
        status: "online",
        lastActive: new Date(),
        expertise: [],
      });
    }
    mappedActivities.forEach((activity) => {
      if (!userMap.has(activity.userId)) {
        userMap.set(activity.userId, {
          id: activity.userId,
          name: activity.userName,
          email: `${activity.userName.replace(/\s+/g, ".").toLowerCase()}@aiorganizer.local`,
          role: "editor",
          status: "offline",
          lastActive: activity.timestamp,
          expertise: [],
        });
      }
    });

    const mappedShared: SharedDocument[] = shareLinks
      .filter((link) => link.resourceType === "document")
      .map((link) => {
        const docId = Number(link.resourceId);
        const docTitle =
          documents?.find((doc) => doc.id === docId)?.title ||
          documents?.find((doc) => doc.id === docId)?.filename ||
          `Document ${link.resourceId}`;
        return {
          id: docId,
          title: docTitle,
          ownerId: currentUser?.id || "user-1",
          ownerName: currentUser?.name || "Current User",
          sharedWith: [
            {
              userId: "shared",
              userName: link.permissions,
              permission: link.permissions === "edit" ? "edit" : link.permissions === "comment" ? "comment" : "view",
              sharedAt: link.createdAt,
            },
          ],
          isPublic: false,
          permission: link.permissions === "edit" ? "team" : link.permissions === "comment" ? "team" : "private",
          lastModified: link.createdAt,
          activityCount: link.accessCount,
        };
      });

    setTeamMembers(Array.from(userMap.values()));
    setActivities(mappedActivities);
    setSharedDocuments(mappedShared);
    setLoading(false);
  }, [collabActivities, shareLinks, currentUser, documents, getRecentActivities, t]);

  // Filter data based on document context
  const filteredActivities = useMemo(() => {
    let filtered = activities;

    if (documentId) {
      filtered = filtered.filter(activity => 
        activity.documentId === documentId
      );
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [activities, documentId]);

  const filteredShared = useMemo(() => {
    let filtered = sharedDocuments;

    if (documentId) {
      filtered = filtered.filter(doc => doc.id === documentId);
    }

    return filtered.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
  }, [sharedDocuments, documentId]);

  function getStatusColor(status: string): string {
    const colors = {
      online: '#10b981',
      offline: '#6b7280',
      away: '#f59e0b',
      busy: '#ef4444'
    };
    return colors[status as keyof typeof colors] || '#6b7280';
  }

  function getRoleColor(role: string): string {
    const colors = {
      owner: '#ef4444',
      admin: '#f97316',
      editor: '#3b82f6',
      contributor: '#10b981',
      viewer: '#6b7280'
    };
    return colors[role as keyof typeof colors] || '#6b7280';
  }

  function getActivityIcon(type: string): string {
    const icons = {
      edit: '✏️',
      comment: '💬',
      share: '🔗',
      upload: '📤',
      review: '👀',
      mention: '@'
    };
    return icons[type as keyof typeof icons] || '📄';
  }

  function formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }

  if (loading) {
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '40px',
        textAlign: 'center',
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(99, 102, 241, 0.3)',
          borderTop: '3px solid #6366f1',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }}></div>
        <div style={{ color: 'white', fontSize: '16px' }}>{t("collaboration.loading")}</div>
      </div>
    );
  }

  return (
    <div className="collaboration-hub" style={{
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      padding: compact ? '16px' : '20px',
      backdropFilter: 'blur(10px)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
      }}>
        <div>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '700',
            color: 'white',
            margin: '0 0 6px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            👥 {t("collaboration.title")}
          </h3>
          <p style={{
            fontSize: '13px',
            color: 'rgba(255, 255, 255, 0.6)',
            margin: 0,
          }}>
            {t("collaboration.subtitle")}
          </p>
        </div>
        
        <div style={{
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.5)',
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '4px 8px',
          borderRadius: '6px',
        }}>
          {teamMembers.filter(m => m.status === 'online').length} {t("collaboration.online")}
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '20px',
        background: 'rgba(255, 255, 255, 0.05)',
        padding: '4px',
        borderRadius: '8px',
      }}>
        {showActivity && (
          <button
            onClick={() => setSelectedTab('activity')}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              borderRadius: '6px',
              background: selectedTab === 'activity' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              color: selectedTab === 'activity' ? 'white' : 'rgba(255, 255, 255, 0.7)',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            📊 {t("collaboration.tab.activity")}
          </button>
        )}
        
        {showTeam && (
          <button
            onClick={() => setSelectedTab('team')}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              borderRadius: '6px',
              background: selectedTab === 'team' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              color: selectedTab === 'team' ? 'white' : 'rgba(255, 255, 255, 0.7)',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            👥 {t("collaboration.tab.team")}
          </button>
        )}
        
        {showShared && (
          <button
            onClick={() => setSelectedTab('shared')}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              borderRadius: '6px',
              background: selectedTab === 'shared' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              color: selectedTab === 'shared' ? 'white' : 'rgba(255, 255, 255, 0.7)',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            🔗 {t("collaboration.tab.shared")}
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '16px',
        maxHeight: compact ? '300px' : '400px',
        overflowY: 'auto',
      }}>
        {/* Activity Tab */}
        {selectedTab === 'activity' && (
          <div>
            <h4 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'white',
              margin: '0 0 12px 0',
            }}>
              {t("collaboration.recentActivity")} ({filteredActivities.length})
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredActivities.map((activity) => (
                <div
                  key={activity.id}
                  style={{
                    display: 'flex',
                    gap: '10px',
                    padding: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    fontSize: '11px',
                  }}
                >
                  <div style={{ fontSize: '16px' }}>
                    {activity.userAvatar || '👤'}
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: 'white', marginBottom: '2px' }}>
                      <strong>{activity.userName}</strong> {activity.action} {activity.target}
                    </div>
                    
                    <div style={{
                      color: 'rgba(255, 255, 255, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}>
                      <span>{getActivityIcon(activity.type)}</span>
                      <span>{formatTimeAgo(activity.timestamp)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {filteredActivities.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: 'rgba(255, 255, 255, 0.5)',
              }}>
                <div style={{ fontSize: '16px', marginBottom: '8px' }}>
                  📊 {t("collaboration.noActivity")}
                </div>
                <div style={{ fontSize: '13px' }}>
                  {t("collaboration.noActivityHint")}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Team Tab */}
        {selectedTab === 'team' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'white', margin: 0 }}>
                {t("collaboration.teamMembers")} ({teamMembers.length})
              </h4>
              <button
                onClick={() => setShowInviteForm(p => !p)}
                style={{ padding: '5px 12px', borderRadius: '7px', border: 'none', background: showInviteForm ? 'rgba(99,102,241,0.35)' : 'rgba(99,102,241,0.2)', color: '#a5b4fc', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
              >
                + Invite
              </button>
            </div>

            {/* Invite form */}
            {showInviteForm && (
              <div style={{ padding: '12px', borderRadius: '9px', border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.07)', marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '8px' }}>📨 Invite team member</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="colleague@email.com"
                    style={{ flex: '1 1 160px', padding: '7px 10px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: '#eaeaea', fontSize: '12px', outline: 'none', minWidth: '120px' }}
                    onKeyDown={e => { if (e.key === 'Enter' && inviteEmail.trim()) { setInviteSent(p => [...p, inviteEmail.trim()]); setInviteEmail(''); } }}
                  />
                  <select
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value as TeamMember['role'])}
                    style={{ padding: '7px 10px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,20,35,0.9)', color: '#eaeaea', fontSize: '12px', cursor: 'pointer' }}
                  >
                    <option value="viewer">Viewer</option>
                    <option value="contributor">Contributor</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    onClick={() => {
                      if (!inviteEmail.trim()) return;
                      setInviteSent(p => [...p, inviteEmail.trim()]);
                      setInviteEmail('');
                    }}
                    style={{ padding: '7px 16px', borderRadius: '7px', border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Send
                  </button>
                </div>
                {inviteSent.length > 0 && (
                  <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {inviteSent.map(email => (
                      <span key={email} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)' }}>
                        ✉ {email} · pending
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'white', margin: '0 0 12px 0' }} />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <div style={{ fontSize: '20px' }}>
                      {member.avatar || '👤'}
                    </div>
                    <div style={{
                      position: 'absolute',
                      bottom: '-2px',
                      right: '-2px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: getStatusColor(member.status),
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                    }}></div>
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '2px',
                    }}>
                      <span style={{ color: 'white', fontWeight: '600' }}>
                        {member.name}
                      </span>
                      <span style={{
                        fontSize: '9px',
                        background: getRoleColor(member.role),
                        color: 'white',
                        padding: '1px 4px',
                        borderRadius: '3px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                      }}>
                        {member.role}
                      </span>
                    </div>
                    
                    <div style={{
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontSize: '10px',
                      marginBottom: '2px',
                    }}>
                      {member.currentActivity || member.email}
                    </div>
                    
                    <div style={{
                      color: 'rgba(255, 255, 255, 0.5)',
                      fontSize: '9px',
                    }}>
                      {member.expertise.join(' • ')}
                    </div>
                  </div>
                  
                  <div style={{
                    fontSize: '9px',
                    color: 'rgba(255, 255, 255, 0.5)',
                  }}>
                    {formatTimeAgo(member.lastActive)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shared Tab */}
        {selectedTab === 'shared' && (
          <div>
            <h4 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'white',
              margin: '0 0 12px 0',
            }}>
              {t("collaboration.sharedDocuments")} ({filteredShared.length})
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredShared.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => doc.id && nav(`/documents/${doc.id}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                >
                  <div style={{ fontSize: '16px' }}>
                    📄
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '2px',
                    }}>
                      <span style={{ color: 'white', fontWeight: '600' }}>
                        {doc.title}
                      </span>
                      {doc.isPublic && (
                        <span style={{
                          fontSize: '8px',
                          background: '#10b981',
                          color: 'white',
                          padding: '1px 3px',
                          borderRadius: '3px',
                          fontWeight: '600',
                        }}>
                          {t("collaboration.public")}
                        </span>
                      )}
                    </div>
                    
                    <div style={{
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontSize: '10px',
                      marginBottom: '2px',
                    }}>
                      {t("collaboration.sharedBy")} {doc.ownerName} • {doc.sharedWith.length} {t("collaboration.people")}
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '9px',
                      color: 'rgba(255, 255, 255, 0.5)',
                    }}>
                      <span>📊 {doc.activityCount} {t("collaboration.activities")}</span>
                      <span>🕒 {formatTimeAgo(doc.lastModified)}</span>
                    </div>
                  </div>
                  
                  <div style={{
                    fontSize: '9px',
                    color: 'rgba(255, 255, 255, 0.5)',
                  }}>
                    {doc.permission}
                  </div>
                </div>
              ))}
            </div>
            
            {filteredShared.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: 'rgba(255, 255, 255, 0.5)',
              }}>
                <div style={{ fontSize: '16px', marginBottom: '8px' }}>
                  🔗 {t("collaboration.noShared")}
                </div>
                <div style={{ fontSize: '13px' }}>
                  {t("collaboration.noSharedHint")}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        marginTop: '16px',
        padding: '12px',
        background: 'rgba(99, 102, 241, 0.1)',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        borderRadius: '8px',
        fontSize: '11px',
        color: '#a5b4fc',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          👥 {teamMembers.length} {t("collaboration.teamMembersLabel")} • {filteredActivities.length} {t("collaboration.activitiesLabel")}
        </div>
        <div>
          🔗 {filteredShared.length} {t("collaboration.sharedDocumentsLabel")}
        </div>
      </div>
    </div>
  );
}
