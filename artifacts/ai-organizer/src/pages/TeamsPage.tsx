/**
 * TeamsPage — Research team management
 * Master-detail layout: sidebar team list + right-side detail panel
 * Full CRUD, role management, member search, keyboard nav, confirmation dialogs
 */
import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useTeams, Team, TeamMember } from "../context/TeamContext";
import { useUserData } from "../context/UserDataContext";
import { PageShell } from "../components/layout/PageShell";
import { useMediaQuery } from "../hooks/useMediaQuery";

const ROLE_COLORS: Record<string, string> = {
  owner: "#f59e0b",
  admin: "#6366f1",
  write: "#10b981",
  read: "#94a3b8",
};
const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  write: "Editor",
  read: "Viewer",
};
const ROLE_DESCRIPTIONS: Record<string, string> = {
  owner: "Full control — can delete team",
  admin: "Manage members & settings",
  write: "Create & edit shared documents",
  read: "View-only access",
};
const TEAM_GRADIENTS = [
  "linear-gradient(135deg,#6366f1,#8b5cf6)",
  "linear-gradient(135deg,#10b981,#059669)",
  "linear-gradient(135deg,#f59e0b,#d97706)",
  "linear-gradient(135deg,#ef4444,#dc2626)",
  "linear-gradient(135deg,#06b6d4,#0891b2)",
  "linear-gradient(135deg,#ec4899,#db2777)",
];
const getGradient = (name: string) =>
  TEAM_GRADIENTS[name.charCodeAt(0) % TEAM_GRADIENTS.length];

export default function TeamsPage() {
  const nav = useNavigate();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const colors = { textPrimary: 'hsl(var(--foreground))', textSecondary: 'hsl(var(--muted-foreground))', textMuted: 'hsl(var(--muted-foreground))', borderPrimary: 'hsl(var(--border))', bgInput: 'hsl(var(--muted) / 0.4)' };
  const isDark = false;
  const { t } = useLanguage();
  const { teams, createTeam, deleteTeam, inviteMember, removeMember, updateMemberRole } = useTeams();
  const { addActivity, refreshStats } = useUserData();

  // Master-detail state
  const [selectedId, setSelectedId] = useState<string | null>(() => teams[0]?.id ?? null);
  const [searchQuery, setSearchQuery] = useState("");

  // Create form state
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  // Invite state
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "write" | "read">("write");
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // Member search + confirm delete
  const [memberSearch, setMemberSearch] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmRemoveMemberId, setConfirmRemoveMemberId] = useState<string | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<"members" | "activity">("members");

  // Refs for focus management
  const nameInputRef = useRef<HTMLInputElement>(null);
  const inviteInputRef = useRef<HTMLInputElement>(null);

  const selectedTeam = useMemo(
    () => teams.find((t: Team) => t.id === selectedId) ?? null,
    [teams, selectedId]
  );

  const filteredTeams = useMemo(() => {
    if (!searchQuery.trim()) return teams;
    const q = searchQuery.toLowerCase();
    return teams.filter((t: Team) =>
      t.name.toLowerCase().includes(q) ||
      (t.description ?? "").toLowerCase().includes(q)
    );
  }, [teams, searchQuery]);

  const filteredMembers = useMemo(() => {
    if (!selectedTeam) return [];
    if (!memberSearch.trim()) return selectedTeam.members;
    const q = memberSearch.toLowerCase();
    return selectedTeam.members.filter((m: TeamMember) =>
      m.userName.toLowerCase().includes(q) || m.userEmail.toLowerCase().includes(q)
    );
  }, [selectedTeam, memberSearch]);

  // Auto-select first team on load / after creation
  useEffect(() => {
    if (!selectedId && teams.length > 0) setSelectedId(teams[0].id);
  }, [teams, selectedId]);

  // Focus management
  useEffect(() => {
    if (showCreate) setTimeout(() => nameInputRef.current?.focus(), 60);
  }, [showCreate]);
  useEffect(() => {
    if (showInvite) setTimeout(() => inviteInputRef.current?.focus(), 60);
  }, [showInvite]);

  const handleCreate = () => {
    if (!newName.trim()) return;
    createTeam(newName.trim(), newDesc.trim());
    addActivity({ type: "team", title: `Created team: ${newName.trim()}`, description: newDesc.trim() });
    refreshStats();
    setNewName(""); setNewDesc(""); setShowCreate(false);
  };

  const handleInvite = () => {
    if (!inviteEmail.trim() || !selectedId) return;
    inviteMember(selectedId, inviteEmail.trim(), inviteRole);
    setInviteEmail(""); setShowInvite(false);
    setInviteSuccess(true);
    setTimeout(() => setInviteSuccess(false), 3000);
  };

  const handleDeleteTeam = (id: string) => {
    const teamName = teams.find((t: Team) => t.id === id)?.name ?? id;
    deleteTeam(id);
    addActivity({ type: "team", title: `Deleted team: ${teamName}`, description: "" });
    refreshStats();
    setConfirmDeleteId(null);
    if (selectedId === id) {
      setSelectedId(teams.find((t: Team) => t.id !== id)?.id ?? null);
    }
  };

  const handleCopyInviteLink = () => {
    if (!selectedId) return;
    const url = `${window.location.origin}/teams?invite=${selectedId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2000);
    }).catch(() => {});
  };

  const handleCycleRole = (memberId: string, currentRole: string) => {
    if (!selectedId || currentRole === "owner") return;
    const order: Array<"admin" | "write" | "read"> = ["admin", "write", "read"];
    const next = order[(order.indexOf(currentRole as "admin" | "write" | "read") + 1) % order.length];
    updateMemberRole(selectedId, memberId, next);
  };

  const handleRemoveMember = (memberId: string) => {
    if (!selectedId) return;
    removeMember(selectedId, memberId);
    setConfirmRemoveMemberId(null);
  };

  // Team-specific activity from UserDataContext
  const { activity } = useUserData();

  // Shared style helpers
  const card = (extra?: React.CSSProperties): React.CSSProperties => ({
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "10px",
    ...extra,
  });

  const inputStyle: React.CSSProperties = {
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1px solid hsl(var(--border))",
    background: "hsl(var(--muted) / 0.4)",
    color: "hsl(var(--foreground))",
    fontSize: "14px",
    width: "100%",
    boxSizing: "border-box",
    outline: "none",
  };

  const btnPrimary: React.CSSProperties = {
    padding: "9px 20px",
    background: "hsl(var(--primary))",
    border: "none",
    borderRadius: "10px",
    color: "hsl(var(--primary-foreground))",
    fontWeight: 700,
    fontSize: "13px",
    cursor: "pointer",
  };

  const btnSecondary: React.CSSProperties = {
    padding: "9px 18px",
    background: "transparent",
    border: "1px solid hsl(var(--border))",
    borderRadius: "10px",
    color: "hsl(var(--muted-foreground))",
    fontSize: "13px",
    cursor: "pointer",
  };

  return (
    <PageShell>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: isMobile ? "16px 12px" : "32px 24px" }}>

        {/* ── Page Header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 800, color: colors.textPrimary }}>👥 {t("nav.teams") || "Teams"}</h1>
            <p style={{ margin: "6px 0 0", fontSize: "14px", color: colors.textSecondary }}>
              {t("teams.subtitle") || "Collaborate with colleagues on shared research projects"}
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => { setShowCreate(true); }} style={btnPrimary}>+ {t("teams.create") || "New Team"}</button>
          </div>
        </div>

        {/* ── Create Form ── */}
        {showCreate && (
          <div style={{ ...card({ padding: "22px", marginBottom: "24px", border: "1px solid rgba(99,102,241,0.35)", background: isDark ? "rgba(99,102,241,0.07)" : "rgba(99,102,241,0.04)" }) }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: colors.textPrimary }}>🆕 {t("teams.createNew") || "Create New Team"}</h3>
              <button onClick={() => setShowCreate(false)} style={{ background: "none", border: "none", cursor: "pointer", color: colors.textMuted, fontSize: "20px", lineHeight: 1 }}>×</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
              <input ref={nameInputRef} value={newName} onChange={e => setNewName(e.target.value)} placeholder="Team name (e.g. Cognitive Science Lab)" style={inputStyle} onKeyDown={e => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") setShowCreate(false); }} />
              <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Brief research focus description..." style={inputStyle} onKeyDown={e => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") setShowCreate(false); }} />
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={handleCreate} disabled={!newName.trim()} style={{ ...btnPrimary, opacity: newName.trim() ? 1 : 0.45, cursor: newName.trim() ? "pointer" : "not-allowed" }}>{t("action.create") || "Create Team"}</button>
              <button onClick={() => setShowCreate(false)} style={btnSecondary}>{t("action.cancel") || "Cancel"}</button>
            </div>
          </div>
        )}

        {/* ── Empty State ── */}
        {teams.length === 0 && !showCreate ? (
          <div style={{ ...card({ padding: "72px 24px", textAlign: "center" }) }}>
            <div style={{ fontSize: "52px", marginBottom: "16px" }}>👥</div>
            <h3 style={{ fontSize: "20px", fontWeight: 700, color: colors.textPrimary, marginBottom: "10px" }}>{t("teams.empty.title") || "No teams yet"}</h3>
            <p style={{ fontSize: "14px", color: colors.textSecondary, maxWidth: "400px", margin: "0 auto 24px", lineHeight: 1.6 }}>
              {t("teams.empty.description") || "Create a team to start collaborating with colleagues on shared research projects."}
            </p>
            <button onClick={() => setShowCreate(true)} style={{ ...btnPrimary, padding: "12px 28px", fontSize: "14px" }}>{t("teams.create") || "Create Your First Team"}</button>
          </div>
        ) : (
          /* ── Master-Detail Layout ── */
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "260px 1fr", gap: "16px", alignItems: "start" }}>

            {/* LEFT: Team List Sidebar */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ position: "relative", marginBottom: "8px" }}>
                <svg style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", width: "14px", height: "14px", color: colors.textMuted, pointerEvents: "none" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search teams..." style={{ ...inputStyle, paddingLeft: "34px", fontSize: "13px", padding: "9px 12px 9px 34px" }} />
              </div>
              {filteredTeams.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: colors.textMuted, fontSize: "13px" }}>No teams match</div>
              ) : filteredTeams.map((team: Team) => {
                const isSel = selectedId === team.id;
                return (
                  <button key={team.id} onClick={() => { setSelectedId(team.id); setShowInvite(false); setMemberSearch(""); }}
                    style={{ width: "100%", textAlign: "left", padding: "12px 14px", borderRadius: "12px", border: isSel ? "1px solid rgba(99,102,241,0.5)" : `1px solid ${colors.borderPrimary}`, background: isSel ? (isDark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.07)") : (isDark ? "rgba(255,255,255,0.02)" : "#fff"), cursor: "pointer", transition: "all 0.15s ease", boxShadow: isSel ? "0 0 0 2px rgba(99,102,241,0.15)" : "none" }}
                    onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : "#f8f8ff"; }}
                    onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.02)" : "#fff"; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "34px", height: "34px", borderRadius: "9px", background: getGradient(team.name), display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", color: "#fff", fontWeight: 800, flexShrink: 0 }}>
                        {team.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: colors.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{team.name}</div>
                        <div style={{ fontSize: "11px", color: colors.textMuted }}>{team.members.length} member{team.members.length !== 1 ? "s" : ""}</div>
                      </div>
                      {isSel && <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#6366f1", flexShrink: 0 }} />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* RIGHT: Detail Panel */}
            {selectedTeam ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                {/* Team header */}
                <div style={{ ...card({ padding: "24px" }) }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: getGradient(selectedTeam.name), display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", color: "#fff", fontWeight: 800, boxShadow: "0 4px 14px rgba(99,102,241,0.25)" }}>
                        {selectedTeam.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: colors.textPrimary }}>{selectedTeam.name}</h2>
                        {selectedTeam.description && <p style={{ margin: "4px 0 0", fontSize: "13px", color: colors.textSecondary, lineHeight: 1.5 }}>{selectedTeam.description}</p>}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                      <button onClick={handleCopyInviteLink} title="Copy invite link" style={{ padding: "9px 14px", background: copiedInvite ? "rgba(16,185,129,0.15)" : "transparent", border: copiedInvite ? "1px solid rgba(16,185,129,0.4)" : `1px solid ${colors.borderPrimary}`, borderRadius: "9px", color: copiedInvite ? "#10b981" : colors.textSecondary, fontSize: "13px", cursor: "pointer", fontWeight: 600, transition: "all 0.2s" }}>
                        {copiedInvite ? `✓ ${t("teams.linkCopied") || "Copied!"}` : `🔗 ${t("teams.copyLink") || "Link"}`}
                      </button>
                      <button onClick={() => { setShowInvite(true); setInviteEmail(""); }} style={btnPrimary}>✉ {t("teams.invite") || "Invite"}</button>
                      <button onClick={() => setConfirmDeleteId(selectedTeam.id)} title="Delete team" style={{ padding: "9px 12px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "9px", color: "#ef4444", fontSize: "13px", cursor: "pointer" }}>🗑</button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    {[
                      { label: t("common.total") || "Total", value: selectedTeam.members.length, icon: "👥", color: "#6366f1" },
                      { label: t("teams.role.admin") || "Admins", value: selectedTeam.members.filter((m: TeamMember) => m.role === "admin" || m.role === "owner").length, icon: "🔑", color: "#f59e0b" },
                      { label: t("teams.role.write") || "Editors", value: selectedTeam.members.filter((m: TeamMember) => m.role === "write").length, icon: "✏️", color: "#10b981" },
                      { label: t("teams.role.read") || "Viewers", value: selectedTeam.members.filter((m: TeamMember) => m.role === "read").length, icon: "👁", color: "#94a3b8" },
                    ].map(s => (
                      <div key={s.label} style={{ padding: "10px 16px", borderRadius: "10px", background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", border: `1px solid ${colors.borderPrimary}`, textAlign: "center", minWidth: "72px" }}>
                        <div style={{ fontSize: "16px" }}>{s.icon}</div>
                        <div style={{ fontSize: "20px", fontWeight: 800, color: s.color, lineHeight: 1.2 }}>{s.value}</div>
                        <div style={{ fontSize: "11px", color: colors.textMuted, marginTop: "2px" }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Invite form */}
                {showInvite && (
                  <div style={{ ...card({ padding: "20px", border: "1px solid rgba(99,102,241,0.3)", background: isDark ? "rgba(99,102,241,0.06)" : "rgba(99,102,241,0.03)" }) }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                      <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: colors.textPrimary }}>✉ {t("teams.inviteColleague") || "Invite a Colleague"}</h4>
                      <button onClick={() => setShowInvite(false)} style={{ background: "none", border: "none", cursor: "pointer", color: colors.textMuted, fontSize: "18px" }}>×</button>
                    </div>
                    {inviteSuccess && (
                      <div style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981", fontSize: "13px", marginBottom: "12px" }}>
                        ✅ {t("teams.inviteSent") || "Invitation sent successfully!"}
                      </div>
                    )}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "10px", alignItems: "center" }}>
                      <input ref={inviteInputRef} value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="colleague@university.edu" style={{ ...inputStyle, fontSize: "13px" }} onKeyDown={e => { if (e.key === "Enter") handleInvite(); if (e.key === "Escape") setShowInvite(false); }} />
                      <select value={inviteRole} onChange={e => setInviteRole(e.target.value as "admin" | "write" | "read")} style={{ padding: "10px 12px", borderRadius: "10px", border: `1px solid ${colors.borderPrimary}`, background: isDark ? "rgba(30,30,40,0.6)" : colors.bgInput, color: colors.textPrimary, fontSize: "13px", cursor: "pointer" }}>
                        <option value="read">👁 Viewer — {ROLE_DESCRIPTIONS.read}</option>
                        <option value="write">✏️ Editor — {ROLE_DESCRIPTIONS.write}</option>
                        <option value="admin">🔑 Admin — {ROLE_DESCRIPTIONS.admin}</option>
                      </select>
                      <button onClick={handleInvite} disabled={!inviteEmail.trim()} style={{ ...btnPrimary, opacity: inviteEmail.trim() ? 1 : 0.45, cursor: inviteEmail.trim() ? "pointer" : "not-allowed", whiteSpace: "nowrap" }}>{t("teams.invite") || "Send Invite"}</button>
                    </div>
                  </div>
                )}

                {/* Confirm delete */}
                {confirmDeleteId === selectedTeam.id && (
                  <div style={{ ...card({ padding: "20px", border: "1px solid rgba(239,68,68,0.3)", background: isDark ? "rgba(239,68,68,0.06)" : "rgba(239,68,68,0.03)" }) }}>
                    <p style={{ margin: "0 0 14px", fontSize: "14px", color: colors.textPrimary }}>⚠️ {t("action.delete") || "Delete"} <strong>{selectedTeam.name}</strong>? {t("teams.delete.confirm") || "This cannot be undone."}</p>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => handleDeleteTeam(selectedTeam.id)} style={{ padding: "9px 20px", background: "linear-gradient(135deg,#ef4444,#dc2626)", border: "none", borderRadius: "9px", color: "#fff", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>{t("teams.delete.button") || "Delete Team"}</button>
                      <button onClick={() => setConfirmDeleteId(null)} style={btnSecondary}>{t("action.cancel") || "Cancel"}</button>
                    </div>
                  </div>
                )}

                {/* Members / Activity tabs */}
                <div style={{ ...card({ padding: "20px" }) }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <div style={{ display: "flex", gap: "4px", background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", padding: "3px", borderRadius: "10px" }}>
                      {(["members", "activity"] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveDetailTab(tab)} style={{ padding: "6px 14px", borderRadius: "7px", border: "none", background: activeDetailTab === tab ? (isDark ? "rgba(99,102,241,0.3)" : "#fff") : "transparent", color: activeDetailTab === tab ? (isDark ? "#a5b4fc" : "#6366f1") : colors.textSecondary, fontWeight: activeDetailTab === tab ? 700 : 500, fontSize: "13px", cursor: "pointer", transition: "all 0.15s" }}>
                          {tab === "members" ? `👥 ${t("teams.members") || "Members"} (${selectedTeam.members.length})` : `📋 ${t("teams.activity") || "Activity"}`}
                        </button>
                      ))}
                    </div>
                    {activeDetailTab === "members" && (
                      <div style={{ position: "relative" }}>
                        <svg style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", width: "13px", height: "13px", color: colors.textMuted, pointerEvents: "none" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input value={memberSearch} onChange={e => setMemberSearch(e.target.value)} placeholder="Filter members..." style={{ ...inputStyle, paddingLeft: "30px", fontSize: "12px", padding: "7px 10px 7px 30px", width: "180px" }} />
                      </div>
                    )}
                  </div>

                  {activeDetailTab === "members" && (
                    filteredMembers.length === 0 ? (
                      <div style={{ padding: "24px", textAlign: "center", color: colors.textMuted, fontSize: "13px" }}>{t("common.noResults") || "No members match your search"}</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {filteredMembers.map((m: TeamMember) => (
                          <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", borderRadius: "10px", background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)", border: confirmRemoveMemberId === m.id ? "1px solid rgba(239,68,68,0.4)" : `1px solid ${colors.borderPrimary}`, transition: "all 0.15s" }}
                            onMouseEnter={e => { e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"; }}
                          >
                            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: `linear-gradient(135deg,${ROLE_COLORS[m.role]},${ROLE_COLORS[m.role]}bb)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", color: "#fff", fontWeight: 800, flexShrink: 0, boxShadow: `0 2px 8px ${ROLE_COLORS[m.role]}44` }}>
                              {m.userName.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: "14px", fontWeight: 600, color: colors.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.userName}</div>
                              <div style={{ fontSize: "12px", color: colors.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.userEmail}</div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                              {confirmRemoveMemberId === m.id ? (
                                <>
                                  <span style={{ fontSize: "12px", color: "#ef4444" }}>{t("teams.member.remove") || "Remove?"}</span>
                                  <button onClick={() => handleRemoveMember(m.id)} style={{ padding: "4px 10px", borderRadius: "6px", border: "none", background: "#ef4444", color: "#fff", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>{t("common.yes") || "Yes"}</button>
                                  <button onClick={() => setConfirmRemoveMemberId(null)} style={{ padding: "4px 10px", borderRadius: "6px", border: `1px solid ${colors.borderPrimary}`, background: "transparent", color: colors.textSecondary, fontSize: "11px", cursor: "pointer" }}>{t("common.no") || "No"}</button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => handleCycleRole(m.id, m.role)} title={m.role === "owner" ? "Owner role cannot be changed" : "Click to cycle role"} style={{ fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "12px", background: `${ROLE_COLORS[m.role]}22`, color: ROLE_COLORS[m.role], border: `1px solid ${ROLE_COLORS[m.role]}44`, cursor: m.role === "owner" ? "default" : "pointer" }}>
                                    {ROLE_LABELS[m.role]}
                                  </button>
                                  {m.role !== "owner" && (
                                    <button onClick={() => setConfirmRemoveMemberId(m.id)} title="Remove member" style={{ background: "none", border: "none", cursor: "pointer", color: colors.textMuted, fontSize: "16px", lineHeight: 1, padding: "2px 4px", borderRadius: "4px" }}
                                      onMouseEnter={e => { e.currentTarget.style.color = "#ef4444"; }}
                                      onMouseLeave={e => { e.currentTarget.style.color = colors.textMuted; }}
                                    >×</button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  )}

                  {activeDetailTab === "activity" && (() => {
                    const teamEvents = activity.filter(e => e.type === "team" && e.title.toLowerCase().includes(selectedTeam.name.toLowerCase())).slice(0, 20);
                    return teamEvents.length === 0 ? (
                      <div style={{ padding: "32px 24px", textAlign: "center", color: colors.textMuted, fontSize: "13px", borderRadius: "10px", border: `1px dashed ${colors.borderPrimary}` }}>
                        {t("teams.noActivity") || "No activity recorded for this team yet."}
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {teamEvents.map(e => (
                          <div key={e.id} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "10px 12px", borderRadius: "9px", background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)", border: `1px solid ${colors.borderPrimary}` }}>
                            <span style={{ fontSize: "16px", flexShrink: 0 }}>🏷️</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: "13px", fontWeight: 600, color: colors.textPrimary }}>{e.title}</div>
                              {e.description && <div style={{ fontSize: "11px", color: colors.textSecondary, marginTop: "2px" }}>{e.description}</div>}
                            </div>
                            <span style={{ fontSize: "10px", color: colors.textMuted, flexShrink: 0 }}>{new Date(e.timestamp).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

              </div>
            ) : (
              <div style={{ ...card({ padding: "48px 24px", textAlign: "center" }) }}>
                <div style={{ fontSize: "40px", marginBottom: "12px", opacity: 0.4 }}>👈</div>
                <p style={{ color: colors.textMuted, fontSize: "14px" }}>{t("teams.selectHint") || "Select a team to view details"}</p>
              </div>
            )}
          </div>
        )}

      </div>
    </PageShell>
  );
}
