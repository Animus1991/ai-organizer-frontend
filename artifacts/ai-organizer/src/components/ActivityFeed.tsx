/**
 * ActivityFeed — GitHub-style activity timeline
 * Fully themed with Tailwind semantic tokens + lucide-react icons.
 */
import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useTheoryBranching } from "../context/TheoryBranchingContext";
import { useResearchIssues } from "../context/ResearchIssuesContext";
import type { LucideIcon } from "lucide-react";
import {
  Eye, Pencil, MessageSquare, Share2, Upload, Star, Search,
  GitCommit, Trash2, FolderOpen, Pin, PinOff, SmilePlus,
  ChevronDown, ChevronRight, Loader2,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface ActivityEntry {
  id: string;
  type: "view" | "edit" | "comment" | "share" | "export" | "favorite" | "upload" | "search" | "version" | "delete";
  resourceTitle: string;
  resourceType?: string;
  userName?: string;
  timestamp: Date | string | number;
  metadata?: Record<string, unknown>;
}

const REACTIONS = ["👍", "🎯", "💡", "🔬"] as const;
type Reaction = (typeof REACTIONS)[number];

// ─── Activity type config (lucide icons + semantic colors) ──────────────────

interface ActivityTypeConfig {
  icon: LucideIcon;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  verb: string;
}

const ACTIVITY_CONFIG: Record<string, ActivityTypeConfig> = {
  view:     { icon: Eye,           colorClass: "text-primary",       bgClass: "bg-primary/10",      borderClass: "border-primary/30",     verb: "Viewed" },
  edit:     { icon: Pencil,        colorClass: "text-warning",       bgClass: "bg-warning/10",      borderClass: "border-warning/30",     verb: "Edited" },
  comment:  { icon: MessageSquare, colorClass: "text-purple-500",    bgClass: "bg-purple-500/10",   borderClass: "border-purple-500/30",  verb: "Commented on" },
  share:    { icon: Share2,        colorClass: "text-success",       bgClass: "bg-success/10",      borderClass: "border-success/30",     verb: "Shared" },
  export:   { icon: Upload,        colorClass: "text-info",          bgClass: "bg-info/10",         borderClass: "border-info/30",        verb: "Exported" },
  favorite: { icon: Star,          colorClass: "text-yellow-500",    bgClass: "bg-yellow-500/10",   borderClass: "border-yellow-500/30",  verb: "Starred" },
  upload:   { icon: FolderOpen,    colorClass: "text-emerald-500",   bgClass: "bg-emerald-500/10",  borderClass: "border-emerald-500/30", verb: "Uploaded" },
  search:   { icon: Search,        colorClass: "text-muted-foreground", bgClass: "bg-muted/50",    borderClass: "border-border",         verb: "Searched for" },
  version:  { icon: GitCommit,     colorClass: "text-violet-400",    bgClass: "bg-violet-400/10",   borderClass: "border-violet-400/30",  verb: "Saved version of" },
  delete:   { icon: Trash2,        colorClass: "text-destructive",   bgClass: "bg-destructive/10",  borderClass: "border-destructive/30", verb: "Deleted" },
};

// ─── Helpers ────────────────────────────────────────────────────────────────────

function loadReactions(storageKey: string): Record<string, Reaction[]> {
  try { return JSON.parse(localStorage.getItem(`${storageKey}_reactions`) || "{}"); } catch { return {}; }
}
function saveReactions(storageKey: string, reactions: Record<string, Reaction[]>) {
  try { localStorage.setItem(`${storageKey}_reactions`, JSON.stringify(reactions)); } catch {}
}
function loadPins(storageKey: string): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(`${storageKey}_pins`) || "[]")); } catch { return new Set(); }
}
function savePins(storageKey: string, pins: Set<string>) {
  try { localStorage.setItem(`${storageKey}_pins`, JSON.stringify([...pins])); } catch {}
}

function loadActivitiesFromStorage(storageKey: string): ActivityEntry[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    return JSON.parse(raw).map((item: Record<string, unknown>) => ({
      id: (item.id as string) || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: (item.type as string) || "view",
      resourceTitle: (item.resourceTitle as string) || (item.title as string) || "Unknown",
      resourceType: (item.resourceType as string) || "",
      userName: (item.userName as string) || (item.user as string) || "You",
      timestamp: item.timestamp ? new Date(item.timestamp as string | number) : new Date(),
      metadata: item.metadata as Record<string, unknown> | undefined,
    }));
  } catch { return []; }
}

function generateSampleActivities(): ActivityEntry[] {
  const types: ActivityEntry["type"][] = ["view", "edit", "comment", "share", "export", "favorite", "upload", "search", "version"];
  const titles = [
    "Neural Network Architecture Review", "Quantum Computing Fundamentals",
    "Machine Learning Pipeline Design", "Research Methodology Notes",
    "Statistical Analysis Report", "Literature Review Draft",
    "Experiment Results v3", "Conference Paper Outline",
    "Data Preprocessing Script", "Hypothesis Validation Framework",
  ];
  const now = Date.now();
  return Array.from({ length: 40 }, (_, i) => ({
    id: `sample-${i}`,
    type: types[Math.floor(Math.random() * types.length)],
    resourceTitle: titles[Math.floor(Math.random() * titles.length)],
    resourceType: Math.random() > 0.5 ? "document" : "segment",
    userName: "You",
    timestamp: new Date(now - Math.floor(Math.random() * 4320) * 3600000),
  })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function formatRelativeTime(timestamp: Date | string | number, t?: (key: string, params?: Record<string, string | number>) => string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return t?.("time.justNow") ?? "just now";
  if (minutes < 60) return t?.("time.mAgo", { count: minutes }) ?? `${minutes}m ago`;
  if (hours < 24) return t?.("time.hAgo", { count: hours }) ?? `${hours}h ago`;
  if (days < 7) return t?.("time.dAgo", { count: days }) ?? `${days}d ago`;
  if (days < 30) return t?.("time.wAgo", { count: Math.floor(days / 7) }) ?? `${Math.floor(days / 7)}w ago`;
  return new Date(timestamp).toLocaleDateString();
}

function groupByDate(activities: ActivityEntry[]): Map<string, ActivityEntry[]> {
  const groups = new Map<string, ActivityEntry[]>();
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  activities.forEach(a => {
    const dateStr = new Date(a.timestamp).toISOString().split("T")[0];
    const label = dateStr === todayStr ? "Today" : dateStr === yesterdayStr ? "Yesterday" : new Date(a.timestamp).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(a);
  });
  return groups;
}

function groupByMonth(activities: ActivityEntry[]): Map<string, ActivityEntry[]> {
  const groups = new Map<string, ActivityEntry[]>();
  const currentMonth = `${new Date().getFullYear()}-${new Date().getMonth()}`;

  activities.forEach(a => {
    const d = new Date(a.timestamp);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const label = key === currentMonth ? "This Month" : d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(a);
  });
  return groups;
}

// ─── Component ──────────────────────────────────────────────────────────────────

interface ActivityFeedProps {
  activities?: ActivityEntry[];
  storageKey?: string;
  title?: string;
  maxItems?: number;
  compact?: boolean;
  style?: React.CSSProperties;
  onActivityClick?: (activity: ActivityEntry) => void;
  /** When true, hides internal search/filter/group controls (used when embedded in ActivityPage) */
  hideControls?: boolean;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities: propActivities,
  storageKey = "collab_activities",
  title = "Recent Activity",
  maxItems = 30,
  compact = false,
  style,
  onActivityClick,
  hideControls = false,
}) => {
  const { t } = useLanguage();
  const { commits, mergeRequests } = useTheoryBranching();
  const { issues } = useResearchIssues();
  const displayTitle = title || t("home.recentActivity") || "Recent Activity";

  // Derive activities from contexts
  const contextActivities = useMemo((): ActivityEntry[] => {
    const acts: ActivityEntry[] = [];
    commits.slice(0, 20).forEach(c => acts.push({ id: `commit-${c.id}`, type: "version", resourceTitle: c.message, resourceType: "commit", userName: c.author, timestamp: new Date(c.timestamp) }));
    issues.slice(0, 20).forEach(i => acts.push({ id: `issue-${i.id}`, type: i.comments.length > 0 ? "comment" : "edit", resourceTitle: i.title, resourceType: "issue", userName: i.createdBy, timestamp: i.updatedAt || i.createdAt }));
    mergeRequests.slice(0, 10).forEach(mr => acts.push({ id: `mr-${mr.id}`, type: "share", resourceTitle: mr.title, resourceType: "merge-request", userName: mr.author, timestamp: new Date(mr.updatedAt) }));
    return acts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [commits, issues, mergeRequests]);

  const [filter, setFilter] = useState<string>("all");
  const [groupMode, setGroupMode] = useState<"daily" | "monthly">("daily");
  const [searchQuery, setSearchQuery] = useState("");
  const [pageSize, setPageSize] = useState(20);
  const [reactions, setReactions] = useState<Record<string, Reaction[]>>(() => loadReactions(storageKey));
  const [pins, setPins] = useState<Set<string>>(() => loadPins(storageKey));
  const [reactionPopup, setReactionPopup] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const toggleReaction = useCallback((activityId: string, reaction: Reaction) => {
    setReactions(prev => {
      const current = prev[activityId] || [];
      const next = current.includes(reaction) ? current.filter(r => r !== reaction) : [...current, reaction];
      const updated = { ...prev, [activityId]: next };
      saveReactions(storageKey, updated);
      return updated;
    });
    setReactionPopup(null);
  }, [storageKey]);

  const togglePin = useCallback((activityId: string) => {
    setPins(prev => {
      const next = new Set(prev);
      if (next.has(activityId)) next.delete(activityId); else next.add(activityId);
      savePins(storageKey, next);
      return next;
    });
  }, [storageKey]);

  const allActivities = useMemo(() => {
    if (propActivities && propActivities.length > 0) return propActivities;
    if (contextActivities.length > 0) return contextActivities;
    const stored = loadActivitiesFromStorage(storageKey);
    if (stored.length > 0) return stored;
    return generateSampleActivities();
  }, [propActivities, contextActivities, storageKey]);

  const filteredActivities = useMemo(() => {
    let items = allActivities;
    if (filter !== "all") items = items.filter(a => a.type === filter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(a => a.resourceTitle.toLowerCase().includes(q) || (a.userName || "").toLowerCase().includes(q) || (a.resourceType || "").toLowerCase().includes(q));
    }
    const pinned = items.filter(a => pins.has(a.id));
    const unpinned = items.filter(a => !pins.has(a.id));
    return [...pinned, ...unpinned].slice(0, maxItems);
  }, [allActivities, filter, searchQuery, maxItems, pins]);

  const pagedActivities = useMemo(() => filteredActivities.slice(0, pageSize), [filteredActivities, pageSize]);
  const hasMore = filteredActivities.length > pageSize;

  const grouped = useMemo(() => groupMode === "monthly" ? groupByMonth(pagedActivities) : groupByDate(pagedActivities), [pagedActivities, groupMode]);

  useEffect(() => {
    setCollapsedGroups(groupMode === "monthly" ? new Set(Array.from(grouped.keys())) : new Set());
  }, [groupMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleGroup = useCallback((label: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label); else next.add(label);
      return next;
    });
  }, []);

  const activityTypes = useMemo(() => Array.from(new Set(allActivities.map(a => a.type))), [allActivities]);

  // ── Compact mode ──────────────────────────────────────────────────────────────
  if (compact) {
    return (
      <div className="rounded-xl border border-border bg-card p-4" style={style}>
        <h3 className="text-sm font-semibold text-foreground mb-3">{displayTitle}</h3>
        <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto">
          {filteredActivities.slice(0, 10).map(activity => {
            const cfg = ACTIVITY_CONFIG[activity.type] || ACTIVITY_CONFIG.view;
            const Icon = cfg.icon;
            return (
              <div
                key={activity.id}
                onClick={() => onActivityClick?.(activity)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors hover:bg-accent/40 ${onActivityClick ? "cursor-pointer" : ""}`}
              >
                <Icon size={14} className={`shrink-0 ${cfg.colorClass}`} />
                <span className="text-xs text-muted-foreground flex-1 truncate">
                  <span className={`font-medium ${cfg.colorClass}`}>{t(`activity.verb.${activity.type}`) || cfg.verb}</span>{" "}
                  {activity.resourceTitle}
                </span>
                <span className="text-[11px] text-muted-foreground/50 shrink-0">
                  {formatRelativeTime(activity.timestamp, t)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Full mode ─────────────────────────────────────────────────────────────────
  return (
    <div className={hideControls ? "px-3 py-1" : "rounded-xl border border-border bg-card px-5 py-5"} style={style}>
      {/* Header */}
      {!hideControls && (
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[15px] font-semibold text-foreground">{displayTitle}</h3>
          <span className="text-xs text-muted-foreground">
            {filteredActivities.length} {t("activity.activities") || "activities"}
          </span>
        </div>
      )}

      {/* Search */}
      {!hideControls && (
        <div className="mb-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setPageSize(20); }}
              placeholder={t("activity.search") || "Search activities…"}
              className="w-full py-2 pl-8 pr-3 rounded-lg border border-border bg-muted/30 text-foreground text-sm outline-none focus:border-primary/50 transition-colors"
            />
          </div>
        </div>
      )}

      {/* Group toggle + filters */}
      {!hideControls && (
        <div className="flex gap-1.5 mb-4 flex-wrap items-center">
          <div className="inline-flex rounded-lg border border-border overflow-hidden mr-2">
            {(["daily", "monthly"] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setGroupMode(mode)}
                className={`px-2.5 py-1 text-[11px] font-medium capitalize transition-colors ${
                  groupMode === mode
                    ? "bg-primary/15 text-primary"
                    : "bg-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {mode === "daily" ? t("activity.daily") || "Daily" : t("activity.monthly") || "Monthly"}
              </button>
            ))}
          </div>

          <button
            onClick={() => setFilter("all")}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
              filter === "all" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("activity.all") || "All"}
          </button>

          {activityTypes.map(type => {
            const cfg = ACTIVITY_CONFIG[type] || ACTIVITY_CONFIG.view;
            const Icon = cfg.icon;
            return (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                  filter === type ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon size={12} />
                <span className="capitalize">{t(`activity.type.${type}`) || type}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Timeline */}
      <div className="flex flex-col">
        {Array.from(grouped.entries()).map(([dateLabel, items]) => {
          const isCollapsed = collapsedGroups.has(dateLabel);
          const isMonthly = groupMode === "monthly";
          const displayLabel =
            dateLabel === "Today" ? (t("notif.today") || dateLabel) :
            dateLabel === "Yesterday" ? (t("backup.yesterday") || dateLabel) :
            dateLabel === "This Month" ? (t("crossSearch.thisMonth") || dateLabel) :
            dateLabel;

          return (
            <div key={dateLabel}>
              {/* Date header */}
              <div
                onClick={isMonthly ? () => toggleGroup(dateLabel) : undefined}
                className={`flex items-center justify-between py-2 text-xs font-semibold text-muted-foreground border-b border-border select-none ${
                  isMonthly ? "cursor-pointer hover:text-foreground" : ""
                } ${isCollapsed ? "mb-0" : "mb-1"}`}
              >
                <span>{displayLabel}</span>
                {isMonthly && (
                  <span className="flex items-center gap-1 text-[11px] opacity-70">
                    <span>{items.length}</span>
                    {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                  </span>
                )}
              </div>

              {/* Activity items */}
              {!isCollapsed && items.map((activity, idx) => {
                const cfg = ACTIVITY_CONFIG[activity.type] || ACTIVITY_CONFIG.view;
                const Icon = cfg.icon;
                const isLast = idx === items.length - 1;

                return (
                  <div
                    key={activity.id}
                    onClick={() => onActivityClick?.(activity)}
                    className={`flex gap-3 px-1 py-2.5 rounded-lg transition-colors hover:bg-accent/30 ${onActivityClick ? "cursor-pointer" : ""}`}
                  >
                    {/* Timeline node */}
                    <div className="flex flex-col items-center w-7 shrink-0">
                      <div className={`w-7 h-7 rounded-full ${cfg.bgClass} border-2 ${cfg.borderClass} flex items-center justify-center shrink-0`}>
                        <Icon size={13} className={cfg.colorClass} />
                      </div>
                      {!isLast && (
                        <div className="w-0.5 flex-1 min-h-[8px] bg-border mt-1" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="text-[13px] text-foreground leading-snug">
                        {pins.has(activity.id) && (
                          <Pin size={11} className="inline text-yellow-500 mr-1" />
                        )}
                        <span className={`font-medium ${cfg.colorClass}`}>
                          {t(`activity.verb.${activity.type}`) || cfg.verb}
                        </span>{" "}
                        <span className="font-semibold">{activity.resourceTitle}</span>
                      </div>

                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground/60">
                        <span>{formatRelativeTime(activity.timestamp, t)}</span>
                        {activity.resourceType && (
                          <>
                            <span>·</span>
                            <span className="capitalize">{activity.resourceType}</span>
                          </>
                        )}
                        <span>·</span>

                        {/* Existing reactions */}
                        {(reactions[activity.id] || []).map(r => (
                          <span key={r} className="text-xs cursor-pointer" onClick={e => { e.stopPropagation(); toggleReaction(activity.id, r); }}>{r}</span>
                        ))}

                        {/* Reaction picker */}
                        <span className="relative">
                          <button
                            className="opacity-40 hover:opacity-100 transition-opacity"
                            onClick={e => { e.stopPropagation(); setReactionPopup(reactionPopup === activity.id ? null : activity.id); }}
                          >
                            <SmilePlus size={13} />
                          </button>
                          {reactionPopup === activity.id && (
                            <div className="absolute bottom-5 left-0 flex gap-1 bg-popover border border-border rounded-lg px-1.5 py-1 z-50 shadow-lg">
                              {REACTIONS.map(r => (
                                <span
                                  key={r}
                                  onClick={e => { e.stopPropagation(); toggleReaction(activity.id, r); }}
                                  className={`cursor-pointer text-sm p-0.5 rounded hover:bg-accent/50 ${(reactions[activity.id] || []).includes(r) ? "bg-primary/15" : ""}`}
                                >{r}</span>
                              ))}
                            </div>
                          )}
                        </span>

                        {/* Pin toggle */}
                        <button
                          className={`transition-opacity ${pins.has(activity.id) ? "opacity-100 text-yellow-500" : "opacity-40 hover:opacity-100"}`}
                          onClick={e => { e.stopPropagation(); togglePin(activity.id); }}
                          title={pins.has(activity.id) ? (t("activity.unpin") || "Unpin") : (t("activity.pinToTop") || "Pin to top")}
                        >
                          {pins.has(activity.id) ? <PinOff size={12} /> : <Pin size={12} />}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {filteredActivities.length === 0 && (
          <div className="py-8 text-center text-muted-foreground text-sm">
            {searchQuery ? (t("activity.noResults") || "No results for your search") : (t("activity.noActivity") || "No activity to show")}
          </div>
        )}

        {hasMore && (
          <div className="text-center pt-4">
            <button
              onClick={() => setPageSize(p => p + 20)}
              className="px-6 py-2 rounded-lg text-sm font-semibold border border-border text-muted-foreground hover:bg-accent/30 hover:border-primary/30 transition-colors"
            >
              <Loader2 size={13} className="inline mr-1.5 animate-none" />
              {t("activity.showMore") || `Show more (${filteredActivities.length - pageSize} remaining)`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
