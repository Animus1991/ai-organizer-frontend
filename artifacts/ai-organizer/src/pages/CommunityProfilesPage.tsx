/**
 * CommunityProfilesPage — Fully refactored
 * Modular architecture, Lucide icons, responsive, accessible
 * v2: search clear, results count, tab-specific empty states, compact
 */
import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowUpDown, Telescope, UserCheck, Users, Lightbulb, ArrowLeft, X } from "lucide-react";
import { PageShell } from "../components/layout/PageShell";
import { useLanguage } from "../context/LanguageContext";
import { useUserData } from "../context/UserDataContext";
import { useIsMobile } from "../hooks/useMediaQuery";

import type { ProfileTab, SortMode, StoredData, CollabProposal } from "./community/types";
import { loadData, saveData, loadProposals, loadMySkillsProfile } from "./community/helpers";
import { CommunityStats } from "./community/components/CommunityStats";
import { ProfileCard } from "./community/components/ProfileCard";
import { ProfileDetail } from "./community/components/ProfileDetail";
import { ActivitySidebar } from "./community/components/ActivitySidebar";
import { CollabProposalModal } from "./community/components/CollabProposalModal";

// ─── Tab config ──────────────────────────────────────────────
const TAB_CONFIG: { key: ProfileTab; icon: typeof Telescope; countKey?: "following" | "followers" }[] = [
  { key: "discover", icon: Telescope },
  { key: "following", icon: UserCheck, countKey: "following" },
  { key: "followers", icon: Users, countKey: "followers" },
  { key: "suggested", icon: Lightbulb },
];

// ─── Component ───────────────────────────────────────────────
export default function CommunityProfilesPage() {
  const nav = useNavigate();
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const { followResearcher, unfollowResearcher, isFollowing: ctxIsFollowing, following: ctxFollowing, addActivity } = useUserData();

  const [data, setData] = useState<StoredData>(loadData);
  const [activeTab, setActiveTab] = useState<ProfileTab>("discover");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("popular");
  const [filterField, setFilterField] = useState("all");
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);

  // Proposals
  const [proposals, setProposals] = useState<CollabProposal[]>(loadProposals);
  const [proposalTarget, setProposalTarget] = useState<{ id: string; name: string } | null>(null);

  const mySkillsProfile = useMemo(() => loadMySkillsProfile(), []);

  useEffect(() => { saveData(data); }, [data]);

  // Keyboard: Escape clears search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && searchQuery) {
        setSearchQuery("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [searchQuery]);

  // ─── Handlers ──────────────────────────────────────────────
  const handleToggleFollow = useCallback((userId: string) => {
    const profile = data.profiles.find((p) => p.id === userId);
    if (!profile) return;
    const currently = ctxIsFollowing(userId);
    if (currently) {
      unfollowResearcher(userId);
    } else {
      followResearcher({ id: userId, name: profile.name, institution: profile.institution, expertise: profile.expertise });
      addActivity({ type: "follow", title: `Followed ${profile.name}`, description: profile.institution });
    }
    setData((prev) => ({
      ...prev,
      profiles: prev.profiles.map((p) =>
        p.id === userId
          ? { ...p, isFollowing: !currently, followers: currently ? p.followers - 1 : p.followers + 1 }
          : p
      ),
    }));
  }, [data.profiles, ctxIsFollowing, followResearcher, unfollowResearcher, addActivity]);

  const openProposal = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    setProposalTarget({ id, name });
  };

  const hasSentProposal = (userId: string) => proposals.some((p) => p.toUserId === userId);

  // ─── Derived data ─────────────────────────────────────────
  const filteredProfiles = useMemo(() => {
    let result = [...data.profiles].map((p) => ({ ...p, isFollowing: ctxIsFollowing(p.id) }));

    switch (activeTab) {
      case "following": result = result.filter((p) => p.isFollowing); break;
      case "followers": result = result.filter((p) => p.isFollowedBy); break;
      case "suggested": result = result.filter((p) => !p.isFollowing && p.openToCollaboration); break;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) =>
        p.name.toLowerCase().includes(q) || p.username.toLowerCase().includes(q) ||
        p.institution.toLowerCase().includes(q) || p.field.toLowerCase().includes(q) ||
        p.expertise.some((e) => e.toLowerCase().includes(q))
      );
    }

    if (filterField !== "all") result = result.filter((p) => p.field === filterField);

    switch (sortMode) {
      case "popular": result.sort((a, b) => b.followers - a.followers); break;
      case "active": result.sort((a, b) => b.lastActiveAt - a.lastActiveAt); break;
      case "newest": result.sort((a, b) => b.joinedAt - a.joinedAt); break;
      case "citations": result.sort((a, b) => b.citations - a.citations); break;
    }

    return result;
  }, [data.profiles, activeTab, searchQuery, sortMode, filterField, ctxIsFollowing]);

  const followingActivities = useMemo(() => {
    const ids = new Set(data.profiles.filter((p) => ctxIsFollowing(p.id)).map((p) => p.id));
    return data.activities.filter((a) => ids.has(a.userId)).sort((a, b) => b.timestamp - a.timestamp);
  }, [data.profiles, data.activities, ctxIsFollowing]);

  const allFields = useMemo(() => {
    const fields = new Set(data.profiles.map((p) => p.field));
    return ["all", ...Array.from(fields).sort()];
  }, [data.profiles]);

  const stats = useMemo(() => ({
    total: data.profiles.length,
    following: ctxFollowing.length,
    followers: data.profiles.filter((p) => p.isFollowedBy).length,
    openCollab: data.profiles.filter((p) => p.openToCollaboration).length,
  }), [data.profiles, ctxFollowing]);

  // ─── Tab-specific empty state messages ─────────────────────
  const emptyStateForTab = useMemo(() => {
    switch (activeTab) {
      case "following":
        return { title: t("community.emptyFollowing") || "Not following anyone yet", hint: t("community.emptyFollowingHint") || "Discover researchers and follow them to see updates" };
      case "followers":
        return { title: t("community.emptyFollowers") || "No followers yet", hint: t("community.emptyFollowersHint") || "Share your profile and engage with the community" };
      case "suggested":
        return { title: t("community.emptySuggested") || "No suggestions available", hint: t("community.emptySuggestedHint") || "Try updating your skills profile for better matches" };
      default:
        return { title: t("community.noProfiles"), hint: t("community.noProfilesHint") };
    }
  }, [activeTab, t]);

  // ─── Profile Detail view ──────────────────────────────────
  const selectedProfileData = useMemo(
    () => data.profiles.find((p) => p.id === selectedProfile),
    [data.profiles, selectedProfile]
  );

  if (selectedProfileData) {
    const synced = { ...selectedProfileData, isFollowing: ctxIsFollowing(selectedProfileData.id) };
    return (
      <PageShell>
        <ProfileDetail
          profile={synced}
          onBack={() => setSelectedProfile(null)}
          onToggleFollow={handleToggleFollow}
        />
      </PageShell>
    );
  }

  // ─── Main view ────────────────────────────────────────────
  return (
    <PageShell
      title={<span className="inline-flex items-center gap-2"><Users size={22} className="text-primary" />{t("community.title")}</span>}
      subtitle={t("community.subtitle")}
    >
      <div className="max-w-[1200px] mx-auto">

          {/* Stats */}
          <CommunityStats
            total={stats.total}
            following={stats.following}
            followers={stats.followers}
            openCollab={stats.openCollab}
          />

          {/* Tabs */}
          <nav className="flex gap-0.5 mb-4 border-b border-border pb-px overflow-x-auto" role="tablist">
            {TAB_CONFIG.map(({ key, icon: Icon, countKey }) => (
              <button
                key={key}
                role="tab"
                aria-selected={activeTab === key}
                onClick={() => setActiveTab(key)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-t-lg border-b-2 text-xs cursor-pointer transition-colors whitespace-nowrap ${
                  activeTab === key
                    ? "border-primary text-primary font-semibold bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/30"
                }`}
              >
                <Icon size={13} />
                {t(`community.tab.${key}`)}
                {countKey && (
                  <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full font-medium">
                    {stats[countKey]}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="flex gap-5 flex-col lg:flex-row">
            {/* Main content */}
            <div className="flex-1 min-w-0">

              {/* Search + Sort + Results count */}
              <div className="flex gap-2 mb-3 flex-wrap items-center">
                <div className="relative flex-1 min-w-[180px] max-w-[300px]">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t("community.searchPlaceholder")}
                    className="w-full pl-8 pr-8 py-2 rounded-lg border border-border bg-muted/30 text-foreground text-xs outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer"
                      aria-label="Clear search"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                <div className="relative">
                  <ArrowUpDown size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <select
                    value={sortMode}
                    onChange={(e) => setSortMode(e.target.value as SortMode)}
                    className="pl-7 pr-3 py-2 rounded-lg border border-border bg-muted/30 text-foreground text-xs outline-none cursor-pointer appearance-none min-w-[130px]"
                  >
                    <option value="popular">{t("community.sortPopular")}</option>
                    <option value="active">{t("community.sortActive")}</option>
                    <option value="newest">{t("community.sortNewest")}</option>
                    <option value="citations">{t("community.sortCitations")}</option>
                  </select>
                </div>
                {/* Results count */}
                <span className="text-[11px] text-muted-foreground ml-auto">
                  {filteredProfiles.length} {t("community.resultsCount") || "results"}
                </span>
              </div>

              {/* Field filters */}
              <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
                {allFields.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilterField(f)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium cursor-pointer border whitespace-nowrap transition-colors ${
                      filterField === f
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-transparent text-muted-foreground hover:bg-accent/30"
                    }`}
                  >
                    {f === "all" ? t("common.all") : f}
                  </button>
                ))}
              </div>

              {/* Profile grid */}
              <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? "280px" : "320px"}, 1fr))` }}>
                {filteredProfiles.map((profile) => (
                  <ProfileCard
                    key={profile.id}
                    profile={profile}
                    mySkillsProfile={mySkillsProfile}
                    onSelect={(id: string) => setSelectedProfile(id)}
                    onToggleFollow={handleToggleFollow}
                    onPropose={openProposal}
                    hasSentProposal={hasSentProposal(profile.id)}
                  />
                ))}
              </div>

              {/* Empty state — tab-specific */}
              {filteredProfiles.length === 0 && (
                <div className="text-center py-14 text-muted-foreground">
                  <Users size={32} className="mx-auto mb-2.5 opacity-25" />
                  <p className="font-semibold text-sm">{emptyStateForTab.title}</p>
                  <p className="text-xs mt-1 opacity-70">{emptyStateForTab.hint}</p>
                </div>
              )}
            </div>

            {/* Activity sidebar */}
            <ActivitySidebar activities={followingActivities} />
          </div>
        </div>

        {/* Collab modal */}
        {proposalTarget && (
          <CollabProposalModal
            targetId={proposalTarget.id}
            targetName={proposalTarget.name}
            proposals={proposals}
            onProposalsChange={setProposals}
            onClose={() => setProposalTarget(null)}
          />
        )}
    </PageShell>
  );
}
