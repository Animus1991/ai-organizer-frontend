/**
 * ActivityPage — Research Activity Feed
 * Premium-grade UI with glassmorphism sidebar, responsive layout,
 * and GitHub-inspired contribution timeline.
 * Fully themed with Tailwind semantic tokens + lucide-react icons.
 */
import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useUserData, ActivityEvent } from "../context/UserDataContext";
import { useTeams } from "../context/TeamContext";
import { ActivityFeed, ActivityEntry } from "../components/ActivityFeed";
import { PageShell } from "../components/layout/PageShell";
import { ContributionGraph } from "../components/ContributionGraph";
import { useIsMobile } from "../hooks/useMediaQuery";
import type { LucideIcon } from "lucide-react";
import {
  Radio, Upload, Scissors, MessageSquare, Users, FolderOpen,
  Tag, Search, Star, Trash2, ArrowLeft, Calendar, CalendarDays,
  BarChart3, CheckCircle2, Clock, UserPlus, Inbox,
  User, Globe, Telescope, ChevronDown, ChevronRight,
  ArrowRight, Trophy, TrendingUp,
} from "lucide-react";

// ─── Filter config ──────────────────────────────────────────────────────────────

type ActivityFilter = "all" | "upload" | "segment" | "comment" | "follow" | "collection" | "team" | "review" | "star";

interface FilterCfg { icon: LucideIcon; label: string }

function buildFilterConfig(t: (key: string) => string): Record<ActivityFilter, FilterCfg> {
  return {
    all:        { icon: Radio,          label: t("activity.filter.all") || "All Activity" },
    upload:     { icon: Upload,         label: t("activity.filter.upload") || "Uploads" },
    segment:    { icon: Scissors,       label: t("activity.filter.segment") || "Segments" },
    comment:    { icon: MessageSquare,  label: t("activity.filter.comment") || "Comments" },
    follow:     { icon: Users,          label: t("activity.filter.follow") || "Following" },
    collection: { icon: FolderOpen,     label: t("activity.filter.collection") || "Collections" },
    team:       { icon: Tag,            label: t("activity.filter.team") || "Teams" },
    review:     { icon: Search,         label: t("activity.filter.review") || "Reviews" },
    star:       { icon: Star,           label: t("activity.filter.star") || "Stars" },
  };
}

const TYPE_MAP: Record<ActivityEvent["type"], ActivityEntry["type"]> = {
  upload: "upload", segment: "edit", comment: "comment", follow: "share",
  collection: "favorite", team: "version", review: "view", star: "favorite",
};

function toFeedEntries(events: ActivityEvent[]): ActivityEntry[] {
  return events.map(e => ({
    id: e.id, type: TYPE_MAP[e.type] ?? "view",
    resourceTitle: e.title, resourceType: e.type, userName: "You",
    timestamp: new Date(e.timestamp),
    metadata: e.meta as Record<string, unknown> | undefined,
  }));
}

function groupByMonth(entries: ActivityEntry[]): { label: string; key: string; entries: ActivityEntry[] }[] {
  const groups = new Map<string, ActivityEntry[]>();
  const labels = new Map<string, string>();
  entries.forEach(e => {
    const d = new Date(e.timestamp);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(e);
    labels.set(key, label);
  });
  return Array.from(groups.entries())
    .map(([key, entries]) => ({ label: labels.get(key)!, key, entries }))
    .sort((a, b) => b.key.localeCompare(a.key));
}

const PAGE_SIZE = 15;

function readLocalStats() {
  let comments = 0;
  let bookmarks = 0;
  try {
    const c = JSON.parse(localStorage.getItem("segment-comments") || "{}");
    Object.values(c).forEach((arr: unknown) => { if (Array.isArray(arr)) comments += arr.length; });
  } catch {}
  try {
    const r = JSON.parse(localStorage.getItem("segment-reactions") || "{}");
    Object.values(r).forEach((arr: unknown) => {
      if (Array.isArray(arr)) bookmarks += (arr as string[]).filter(e => e === "⭐").length;
    });
  } catch {}
  return { comments, bookmarks };
}

// ─── Sidebar stat/milestone types ───────────────────────────────────────────────

interface StatItem { icon: LucideIcon; label: string; value: number | string; colorClass: string }
interface MilestoneItem { icon: LucideIcon; label: string; done: boolean; when: string | null }
interface QuickLink { icon: LucideIcon; label: string; path: string }

// ─── Sidebar Card wrapper ───────────────────────────────────────────────────────

function SidebarCard({ title, icon: Icon, iconClass, children }: {
  title: string;
  icon: LucideIcon;
  iconClass?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-border/40 flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon size={13} className={iconClass || "text-primary"} />
        </div>
        <h3 className="text-xs font-semibold text-foreground tracking-wide">{title}</h3>
      </div>
      <div className="p-3.5">{children}</div>
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function ActivityPage() {
  const nav = useNavigate();
  const { t } = useLanguage();
  const { stats: userStats, activity, clearActivity, markActivityRead } = useUserData();
  const { teams } = useTeams();
  const isMobile = useIsMobile();
  const teamProjectNames = useMemo(() => teams.map(tm => tm.name), [teams]);

  const [activeFilter, setActiveFilter] = useState<ActivityFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [groupByMonthMode, setGroupByMonthMode] = useState(true);

  const FILTER_CONFIG = useMemo(() => buildFilterConfig(t), [t]);

  useEffect(() => { markActivityRead(); }, [markActivityRead]);

  const localStats = useMemo(() => readLocalStats(), []);

  const feedEntries = useMemo<ActivityEntry[]>(() => {
    let all = toFeedEntries(activity);
    if (activeFilter !== "all") all = all.filter(e => e.resourceType === activeFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      all = all.filter(e => e.resourceTitle.toLowerCase().includes(q) || (e.resourceType ?? "").toLowerCase().includes(q));
    }
    return all;
  }, [activity, activeFilter, searchQuery]);

  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [activeFilter, searchQuery]);

  const monthGroups = useMemo(() => groupByMonth(feedEntries), [feedEntries]);

  const toggleMonth = useCallback((key: string) => {
    setCollapsedMonths(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }, []);

  const typeCounts = useMemo(() => {
    const counts: Partial<Record<ActivityFilter, number>> = {};
    activity.forEach(e => { counts[e.type as ActivityFilter] = (counts[e.type as ActivityFilter] ?? 0) + 1; });
    return counts;
  }, [activity]);

  // Sidebar data
  const sidebarStats: StatItem[] = [
    { icon: Upload,         label: t("activity.stat.uploads") || "Documents",        value: userStats.documentsUploaded, colorClass: "text-primary" },
    { icon: MessageSquare,  label: t("activity.stat.comments") || "Comments",        value: localStats.comments,         colorClass: "text-warning" },
    { icon: Star,           label: t("activity.stat.bookmarks") || "Starred",        value: localStats.bookmarks,        colorClass: "text-destructive" },
    { icon: UserPlus,       label: t("activity.stat.following") || "Following",      value: userStats.followingCount,    colorClass: "text-info" },
    { icon: FolderOpen,     label: t("activity.stat.collections") || "Collections",  value: userStats.collectionsCreated, colorClass: "text-success" },
    { icon: Search,         label: t("activity.stat.reviews") || "Reviews",          value: userStats.reviewsCompleted,  colorClass: "text-info" },
  ];

  const milestones: MilestoneItem[] = [
    { icon: Upload,     label: "First Upload",          done: userStats.documentsUploaded >= 1,   when: "Day 1" },
    { icon: Scissors,   label: "10 Segments Created",   done: userStats.documentsUploaded >= 2,   when: "Week 1" },
    { icon: Users,      label: "First Collaboration",   done: userStats.followingCount >= 1,      when: userStats.followingCount >= 1 ? "Active" : null },
    { icon: FolderOpen, label: "Created a Collection",  done: userStats.collectionsCreated >= 1,  when: userStats.collectionsCreated >= 1 ? "Achieved" : null },
    { icon: Tag,        label: "Joined a Team",         done: teams.length >= 1,                  when: teams.length >= 1 ? "Active" : null },
    { icon: Search,     label: "Completed First Review", done: userStats.reviewsCompleted >= 1,   when: userStats.reviewsCompleted >= 1 ? "Achieved" : null },
  ];

  const quickLinks: QuickLink[] = [
    { icon: User,      label: t("nav.profile") || "My Profile",    path: "/profile" },
    { icon: Users,     label: t("nav.teams") || "Teams",           path: "/teams" },
    { icon: FolderOpen, label: t("nav.collections") || "Collections", path: "/collections" },
    { icon: Telescope, label: t("nav.discover") || "Discover",     path: "/discover" },
    { icon: Globe,     label: t("nav.community") || "Community",   path: "/community" },
  ];

  const completedMilestones = milestones.filter(m => m.done).length;
  const totalMilestones = milestones.length;

  return (
    <PageShell>
      <div className="max-w-[1100px] mx-auto px-3 sm:px-6 py-4 sm:py-8">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-6">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2.5 tracking-tight">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Radio size={16} className="text-primary" />
              </div>
              {t("nav.activity") || "Activity Feed"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 ml-[42px]">
              {t("activity.subtitle") || "Your complete research activity timeline"}
              {activity.length > 0 && (
                <span className="ml-1.5 text-muted-foreground/60">
                  · {activity.length} {activity.length === 1 ? "event" : "events"}
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2 shrink-0 ml-[42px] sm:ml-0">
            {activity.length > 0 && (
              <button
                onClick={() => { if (window.confirm("Clear all activity history?")) clearActivity(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-destructive/25 rounded-lg text-destructive text-xs font-medium hover:bg-destructive/8 transition-colors"
              >
                <Trash2 size={13} />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* ── Contribution Graph ─────────────────────────────────── */}
        <div className="mb-6">
          <ContributionGraph
            title={t("activity.contributions") || "Research Contributions"}
            subtitle={t("activity.contributionsSubtitle") || "Activity heatmap over the past year"}
            colorScheme="purple"
            weeks={52}
            showYearSelector
            showColorToggle
            projects={teamProjectNames.length > 0 ? teamProjectNames : ["My Research", "Reviews", "Collections"]}
          />
        </div>

        {/* ── Search + Group toggle ──────────────────────────────── */}
        <div className="flex gap-2 mb-3 items-center">
          <div className="relative flex-1 min-w-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={`${t("action.search") || "Search"} activity...`}
              className="w-full py-2 pl-9 pr-3 rounded-lg border border-border/60 bg-muted/20 text-foreground text-sm outline-none placeholder:text-muted-foreground/50 focus:border-primary/40 focus:bg-muted/30 transition-all"
            />
          </div>
          <button
            onClick={() => setGroupByMonthMode(p => !p)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border whitespace-nowrap transition-all ${
              groupByMonthMode
                ? "bg-primary/10 border-primary/25 text-primary"
                : "bg-transparent border-border/60 text-muted-foreground hover:border-border"
            }`}
          >
            {groupByMonthMode ? <CalendarDays size={13} /> : <Calendar size={13} />}
            {groupByMonthMode ? "Grouped" : "Flat"}
          </button>
        </div>

        {/* ── Filter Pills — scrollable on mobile ────────────────── */}
        <div className="mb-5 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
            {(Object.entries(FILTER_CONFIG) as [ActivityFilter, FilterCfg][]).map(([key, cfg]) => {
              const isActive = activeFilter === key;
              const count = key === "all" ? activity.length : (typeCounts[key] ?? 0);
              const Icon = cfg.icon;
              return (
                <button
                  key={key}
                  onClick={() => setActiveFilter(key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-all shrink-0 ${
                    isActive
                      ? "bg-primary/12 border-primary/30 text-primary shadow-sm"
                      : "bg-transparent border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
                >
                  <Icon size={13} />
                  <span>{cfg.label}</span>
                  {count > 0 && (
                    <span className={`text-[10px] font-semibold min-w-[16px] h-[16px] rounded-full flex items-center justify-center px-1 leading-none ${
                      isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground/70"
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Two-column layout ──────────────────────────────────── */}
        <div className={`flex ${isMobile ? "flex-col gap-4" : "gap-5"}`}>

          {/* ── Main Activity Feed ───────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {feedEntries.length === 0 ? (
              <div className="border border-border/50 rounded-xl bg-card/60 backdrop-blur-sm p-10 sm:p-14 text-center">
                <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                  <Inbox size={24} className="text-muted-foreground/40" />
                </div>
                <div className="text-sm font-semibold text-foreground mb-1">
                  {searchQuery ? "No matching activity" : "No activity yet"}
                </div>
                <div className="text-xs text-muted-foreground max-w-[280px] mx-auto leading-relaxed">
                  {searchQuery
                    ? `No results for "${searchQuery}"`
                    : "Upload a document or interact with the platform to see your activity timeline here."}
                </div>
              </div>
            ) : groupByMonthMode ? (
              <div className="flex flex-col gap-3">
                {monthGroups.map(group => {
                  const isCollapsed = collapsedMonths.has(group.key);
                  return (
                    <div key={group.key} className="border border-border/50 rounded-xl bg-card/60 backdrop-blur-sm overflow-hidden">
                      <button
                        onClick={() => toggleMonth(group.key)}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 bg-transparent border-b border-border/40 hover:bg-accent/15 transition-colors text-left"
                      >
                        {isCollapsed
                          ? <ChevronRight size={13} className="text-muted-foreground/60" />
                          : <ChevronDown size={13} className="text-muted-foreground/60" />
                        }
                        <span className="text-sm font-semibold text-foreground">{group.label}</span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                          {group.entries.length}
                        </span>
                      </button>
                      {!isCollapsed && (
                        <div className="py-1">
                          <ActivityFeed
                            activities={group.entries}
                            title=""
                            maxItems={group.entries.length}
                            compact={false}
                            storageKey={`activity-month-${group.key}`}
                            hideControls
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div>
                <ActivityFeed
                  activities={feedEntries.slice(0, visibleCount)}
                  title={FILTER_CONFIG[activeFilter].label}
                  maxItems={visibleCount}
                  compact={false}
                  storageKey="activity-page-feed"
                  hideControls
                />
                {feedEntries.length > visibleCount && (
                  <button
                    onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                    className="w-full mt-3 py-2.5 rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm text-muted-foreground text-xs font-medium hover:bg-accent/20 hover:border-primary/25 transition-all"
                  >
                    Show more ({feedEntries.length - visibleCount} remaining)
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── Sidebar ──────────────────────────────────────────── */}
          <div className={`flex flex-col gap-3 ${isMobile ? "w-full" : "w-[260px] shrink-0"}`}>

            {/* Activity Stats */}
            <SidebarCard
              title={t("activity.stats") || "Activity Stats"}
              icon={BarChart3}
            >
              <div className={`${isMobile ? "grid grid-cols-2 gap-x-3 gap-y-0.5" : "flex flex-col gap-0.5"}`}>
                {sidebarStats.map(stat => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="flex items-center gap-2 py-1.5 group">
                      <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 bg-muted/50 group-hover:bg-muted transition-colors">
                        <Icon size={11} className={stat.colorClass} />
                      </div>
                      <span className="flex-1 text-[11px] text-muted-foreground truncate">{stat.label}</span>
                      <span className={`text-[11px] font-bold tabular-nums ${stat.colorClass}`}>
                        {stat.value || "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </SidebarCard>

            {/* Research Milestones */}
            <SidebarCard
              title="Research Milestones"
              icon={Trophy}
              iconClass="text-yellow-500"
            >
              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                  <span>{completedMilestones}/{totalMilestones} completed</span>
                  <span className="font-semibold text-primary">{Math.round((completedMilestones / totalMilestones) * 100)}%</span>
                </div>
                <div className="w-full h-1.5 bg-muted/60 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all duration-500"
                    style={{ width: `${(completedMilestones / totalMilestones) * 100}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-0.5">
                {milestones.map(m => {
                  const Icon = m.icon;
                  return (
                    <div key={m.label} className={`flex items-center gap-2 py-1.5 transition-opacity ${m.done ? "opacity-100" : "opacity-40"}`}>
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                        m.done ? "bg-success/10" : "bg-muted/50"
                      }`}>
                        {m.done
                          ? <CheckCircle2 size={12} className="text-success" />
                          : <Icon size={12} className="text-muted-foreground" />
                        }
                      </div>
                      <span className={`flex-1 text-xs truncate ${m.done ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                        {m.label}
                      </span>
                      {m.done ? (
                        <span className="text-[10px] text-success font-semibold">{m.when}</span>
                      ) : (
                        <Clock size={10} className="text-muted-foreground/50 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </SidebarCard>

            {/* Quick Navigation */}
            <SidebarCard
              title={t("activity.quickLinks") || "Quick Links"}
              icon={ArrowRight}
            >
              <div className="flex flex-col gap-1">
                {quickLinks.map(link => {
                  const Icon = link.icon;
                  return (
                    <button
                      key={link.path}
                      onClick={() => nav(link.path)}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-foreground text-xs font-medium text-left hover:bg-accent/30 transition-colors group"
                    >
                      <Icon size={13} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                      <span className="flex-1">{link.label}</span>
                      <ArrowRight size={11} className="text-muted-foreground/40 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  );
                })}
              </div>
            </SidebarCard>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
