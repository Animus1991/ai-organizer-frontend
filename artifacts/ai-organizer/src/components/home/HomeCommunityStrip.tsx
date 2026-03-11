/**
 * HomeCommunityStrip — Unified "Community & Progress" widget for the Home page bottom section.
 * Merges HomeXPBar (gamification: level ring, XP bar, streak, next achievement) with
 * HomeSocialStrip (social nav pills, following avatar stack, recent activity events).
 *
 * All styling uses semantic CSS variables (hsl(var(--...))) for full theme compatibility.
 */
import { useMemo, useState, useEffect, useRef, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import { useUserData, type ActivityEvent } from "../../context/UserDataContext";
import { useNotifications } from "../../context/NotificationContext";
import { SegmentedControl } from "../ui/SegmentedControl";
import {
  Upload, Scissors, MessageSquare, Users, FolderOpen, UserPlus,
  Eye, Star, Sparkles, Tag, Search,
  User, Globe, Activity, Compass, Zap, CheckCircle,
} from "lucide-react";

// ─── XP Config ────────────────────────────────────────────────────────────────
const XP_PER_UPLOAD = 20;
const XP_PER_SEGMENT = 5;
const XP_PER_COMMENT = 8;
const XP_PER_REVIEW = 25;
const XP_PER_COLLECTION = 15;
const XP_PER_TEAM = 30;
const XP_PER_FOLLOW = 10;

const LEVELS = [
  { level: 1,  title: "Curious Mind",       titleGr: "Περίεργο Μυαλό",      xpRequired: 0,    tokenColor: "var(--muted-foreground)" },
  { level: 2,  title: "Note Taker",          titleGr: "Σημειωτής",           xpRequired: 100,  tokenColor: "var(--success)" },
  { level: 3,  title: "Researcher",          titleGr: "Ερευνητής",           xpRequired: 250,  tokenColor: "var(--primary)" },
  { level: 4,  title: "Analyst",             titleGr: "Αναλυτής",            xpRequired: 500,  tokenColor: "var(--accent)" },
  { level: 5,  title: "Scholar",             titleGr: "Μελετητής",           xpRequired: 900,  tokenColor: "var(--destructive)" },
  { level: 6,  title: "Theory Builder",      titleGr: "Θεωρητικός",          xpRequired: 1400, tokenColor: "var(--warning)" },
  { level: 7,  title: "Senior Researcher",   titleGr: "Ανώτερος Ερευνητής",  xpRequired: 2000, tokenColor: "var(--warning)" },
  { level: 8,  title: "Expert",              titleGr: "Ειδικός",             xpRequired: 2800, tokenColor: "var(--destructive)" },
  { level: 9,  title: "Principal Scientist", titleGr: "Κύριος Επιστήμονας",  xpRequired: 3800, tokenColor: "var(--success)" },
  { level: 10, title: "Thought Leader",      titleGr: "Πρωτοπόρος",          xpRequired: 5000, tokenColor: "var(--warning)" },
];

const ACHIEVEMENTS = [
  { id: "first_upload",    Icon: Upload,          label: "First Upload",    labelGr: "Πρώτο Upload",    xpThreshold: 20  },
  { id: "segmenter",       Icon: Scissors,        label: "Segmenter",       labelGr: "Τμηματοποιητής",  xpThreshold: 50  },
  { id: "collaborator",    Icon: Users,           label: "Collaborator",    labelGr: "Συνεργάτης",      xpThreshold: 100 },
  { id: "theory_builder",  Icon: Sparkles,        label: "Theory Builder",  labelGr: "Θεωρητικός",      xpThreshold: 250 },
  { id: "peer_reviewer",   Icon: Search,          label: "Peer Reviewer",   labelGr: "Αξιολογητής",     xpThreshold: 500 },
  { id: "prolific_writer", Icon: MessageSquare,   label: "Prolific Writer", labelGr: "Παραγωγικός",     xpThreshold: 900 },
];

const XP_MILESTONES = [100, 250, 500, 900, 1400, 2000, 2800, 3800, 5000];

const EVENT_ICON_MAP: Record<string, React.FC<{ className?: string; style?: React.CSSProperties }>> = {
  upload: Upload, segment: Scissors, comment: MessageSquare, follow: UserPlus,
  collection: FolderOpen, team: Tag, review: Eye, star: Star,
};

const EVENT_COLORS: Record<string, string> = {
  upload: "var(--primary)", segment: "var(--accent)", comment: "var(--info)",
  follow: "var(--success)", collection: "var(--warning)", team: "var(--destructive)",
  review: "var(--warning)", star: "var(--warning)",
};

type ActivityFilter = "all" | ActivityEvent["type"];

const ACTIVITY_FILTER_ORDER: ActivityFilter[] = [
  "all", "upload", "segment", "comment", "collection", "team", "follow", "review", "star",
];

const ACTIVITY_FILTER_META: Record<ActivityFilter, { Icon: React.FC<{ className?: string; style?: React.CSSProperties }>; labelKey: string }> = {
  all:       { Icon: Sparkles,       labelKey: "activity.filter.all" },
  upload:    { Icon: Upload,         labelKey: "activity.filter.upload" },
  segment:   { Icon: Scissors,       labelKey: "activity.filter.segment" },
  comment:   { Icon: MessageSquare,  labelKey: "activity.filter.comment" },
  collection:{ Icon: FolderOpen,     labelKey: "activity.filter.collection" },
  team:      { Icon: Tag,            labelKey: "activity.filter.team" },
  follow:    { Icon: UserPlus,       labelKey: "activity.filter.follow" },
  review:    { Icon: Eye,            labelKey: "activity.filter.review" },
  star:      { Icon: Star,           labelKey: "activity.filter.star" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getLevelInfo(totalXP: number) {
  let current = LEVELS[0];
  let next = LEVELS[1];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVELS[i].xpRequired) {
      current = LEVELS[i];
      next = LEVELS[i + 1] || null!;
      break;
    }
  }
  const xpIntoLevel = next ? totalXP - current.xpRequired : 0;
  const xpNeeded    = next ? next.xpRequired - current.xpRequired : 1;
  const pct         = next ? Math.min(100, Math.round((xpIntoLevel / xpNeeded) * 100)) : 100;
  return { current, next, xpIntoLevel, xpNeeded, pct };
}

function getStreak(): { count: number; lastDate: string } {
  try {
    const stored = localStorage.getItem("research-streak");
    if (!stored) return { count: 0, lastDate: "" };
    const { count, lastDate } = JSON.parse(stored);
    return { count: count ?? 0, lastDate: lastDate ?? "" };
  } catch { return { count: 0, lastDate: "" }; }
}
function saveStreak(count: number, lastDate: string) {
  try { localStorage.setItem("research-streak", JSON.stringify({ count, lastDate })); } catch {}
}
function isStreakAlive(lastDate: string): boolean {
  const today     = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  return lastDate === today || lastDate === yesterday;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000)   return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

// ─── Props ────────────────────────────────────────────────────────────────────
export interface HomeCommunityStripProps {
  isCompact?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────
function HomeCommunityStripBase({ isCompact = false }: HomeCommunityStripProps) {
  const nav = useNavigate();
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { stats, activity, unreadActivity, following, markActivityRead } = useUserData();
  const { addNotification } = useNotifications();

  const isGr = t("app.title") !== "Think!Hub";

  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all");

  // ── XP calculation ──────────────────────────────────────────────────────────
  const totalXP = useMemo(() => (
    stats.documentsUploaded  * XP_PER_UPLOAD     +
    stats.segmentsCreated    * XP_PER_SEGMENT    +
    stats.commentsPosted     * XP_PER_COMMENT    +
    stats.reviewsCompleted   * XP_PER_REVIEW     +
    stats.collectionsCreated * XP_PER_COLLECTION +
    stats.teamsJoined        * XP_PER_TEAM       +
    stats.followingCount     * XP_PER_FOLLOW     +
    activity.length          * 2
  ), [stats, activity]);

  const { current, next, xpIntoLevel, xpNeeded, pct } = useMemo(
    () => getLevelInfo(totalXP), [totalXP]
  );

  const levelTitle = isGr ? current.titleGr : current.title;
  const nextTitle  = next ? (isGr ? next.titleGr : next.title) : null;

  const nextAchievement = useMemo(
    () => ACHIEVEMENTS.find(a => totalXP < a.xpThreshold) || null,
    [totalXP]
  );

  const xpBreakdown = useMemo(() => ([
    { id: "documents", IconEl: Upload,         label: t("xp.breakdown.documents") || "Documents", count: stats.documentsUploaded, xp: stats.documentsUploaded * XP_PER_UPLOAD },
    { id: "segments", IconEl: Scissors,        label: t("xp.breakdown.segments") || "Segments", count: stats.segmentsCreated, xp: stats.segmentsCreated * XP_PER_SEGMENT },
    { id: "collections", IconEl: FolderOpen,   label: t("xp.breakdown.collections") || "Collections", count: stats.collectionsCreated, xp: stats.collectionsCreated * XP_PER_COLLECTION },
    { id: "teams", IconEl: Users,              label: t("xp.breakdown.teams") || "Teams", count: stats.teamsJoined, xp: stats.teamsJoined * XP_PER_TEAM },
    { id: "follows", IconEl: UserPlus,         label: t("xp.breakdown.following") || "Following", count: stats.followingCount, xp: stats.followingCount * XP_PER_FOLLOW },
    { id: "reviews", IconEl: Eye,              label: t("xp.breakdown.reviews") || "Reviews", count: stats.reviewsCompleted, xp: stats.reviewsCompleted * XP_PER_REVIEW },
    { id: "comments", IconEl: MessageSquare,   label: t("xp.breakdown.comments") || "Comments", count: stats.commentsPosted, xp: stats.commentsPosted * XP_PER_COMMENT },
  ]), [stats, t]);

  // ── Streak management ───────────────────────────────────────────────────────
  const [_streakCount, setStreakCount] = useState(() => {
    const { count, lastDate } = getStreak();
    return isStreakAlive(lastDate) ? count : 0;
  });

  useEffect(() => {
    const { count, lastDate } = getStreak();
    const today = new Date().toDateString();
    if (!isStreakAlive(lastDate)) {
      if (count > 0) { saveStreak(0, lastDate); setStreakCount(0); }
    } else if (lastDate !== today) {
      const next = count + 1;
      saveStreak(next, today); setStreakCount(next);
      addNotification({ type: "success", title: `🔥 ${next}-day streak!`, message: "Keep it up — visit every day to maintain your streak.", duration: 3500 });
    } else {
      setStreakCount(count);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const msToMidnight = () => {
      const now = new Date(), midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      return midnight.getTime() - now.getTime();
    };
    let tid: ReturnType<typeof setTimeout>;
    const schedule = () => {
      tid = setTimeout(() => {
        const { lastDate } = getStreak();
        if (!isStreakAlive(lastDate)) { saveStreak(0, lastDate); setStreakCount(0); }
        schedule();
      }, msToMidnight() + 1000);
    };
    schedule();
    return () => clearTimeout(tid);
  }, []);

  const prevXPRef = useRef<number | null>(null);
  useEffect(() => {
    if (prevXPRef.current === null) { prevXPRef.current = totalXP; return; }
    const prev = prevXPRef.current; prevXPRef.current = totalXP;
    for (const milestone of XP_MILESTONES) {
      if (prev < milestone && totalXP >= milestone) {
        const info = getLevelInfo(totalXP);
        addNotification({ type: "success", title: `🏆 ${milestone} XP reached!`, message: `You leveled up to ${info.current.title} (Lv.${info.current.level})!`, duration: 5000 });
        break;
      }
    }
  }, [totalXP, addNotification]);

  // ── Social nav items ─────────────────────────────────────────────────────────
  const navItems = useMemo(() => [
    { IconEl: User,         label: t("nav.profile")     || "Profile",     path: "/profile",     badge: undefined as string | undefined, highlight: false },
    { IconEl: Users,        label: t("nav.teams")       || "Teams",       path: "/teams",       badge: stats.teamsJoined > 0        ? String(stats.teamsJoined)        : undefined, highlight: false },
    { IconEl: FolderOpen,   label: t("nav.collections") || "Collections", path: "/collections", badge: stats.collectionsCreated > 0 ? String(stats.collectionsCreated) : undefined, highlight: false },
    { IconEl: Compass,      label: t("nav.discover")    || "Discover",    path: "/discover",    badge: stats.followingCount > 0     ? String(stats.followingCount)     : undefined, highlight: false },
    { IconEl: Activity,     label: t("nav.activity")    || "Activity",    path: "/activity",    badge: unreadActivity > 0 ? (unreadActivity > 99 ? "99+" : String(unreadActivity)) : undefined, highlight: unreadActivity > 0 },
    { IconEl: Globe,        label: t("nav.community")   || "Community",   path: "/community",   badge: undefined, highlight: false },
  ], [stats, unreadActivity, t]);

  const activityCounts = useMemo(() => {
    const counts: Record<ActivityFilter, number> = {
      all: activity.length,
      upload: 0, segment: 0, comment: 0, collection: 0,
      team: 0, follow: 0, review: 0, star: 0,
    };
    activity.forEach(ev => {
      counts[ev.type] = (counts[ev.type] ?? 0) + 1;
    });
    return counts;
  }, [activity]);

  const activityFilterOptions = useMemo(() => (
    ACTIVITY_FILTER_ORDER.map(filter => {
      const meta = ACTIVITY_FILTER_META[filter];
      const count = activityCounts[filter] ?? 0;
      return {
        value: filter,
        label: (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <meta.Icon style={{ width: 12, height: 12 }} />
            {t(meta.labelKey) || meta.labelKey}
          </span>
        ),
        badge: count || undefined,
        disabled: filter !== "all" && count === 0,
      };
    })
  ), [activityCounts, t]);

  const filteredEvents = useMemo(() => {
    const source = activityFilter === "all" ? activity : activity.filter(ev => ev.type === activityFilter);
    return source.slice(0, isCompact ? 2 : 4);
  }, [activity, activityFilter, isCompact]);

  const handleViewAll = useCallback(() => {
    markActivityRead();
    nav("/activity");
  }, [markActivityRead, nav]);

  // ── Pill nav hover handler ─────────────
  const onPillEnter = useCallback((e: React.MouseEvent<HTMLButtonElement>, highlight: boolean) => {
    if (!highlight) {
      e.currentTarget.style.background    = `hsl(var(--primary) / ${isDark ? 0.13 : 0.08})`;
      e.currentTarget.style.borderColor   = "hsl(var(--primary) / 0.3)";
      e.currentTarget.style.color         = "hsl(var(--primary))";
      e.currentTarget.style.transform     = "translateY(-1px)";
    }
  }, [isDark]);

  const onPillLeave = useCallback((e: React.MouseEvent<HTMLButtonElement>, highlight: boolean) => {
    if (!highlight) {
      e.currentTarget.style.background  = `hsl(var(--muted) / ${isDark ? 0.3 : 0.5})`;
      e.currentTarget.style.borderColor = "hsl(var(--border))";
      e.currentTarget.style.color       = "hsl(var(--muted-foreground))";
      e.currentTarget.style.transform   = "translateY(0)";
    }
  }, [isDark]);

  // ── Styles — all using semantic CSS variables ───────────────────────────────
  const pillBase: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: "5px",
    padding: "5px 12px", borderRadius: "var(--radius)", fontSize: "12px", fontWeight: 600,
    cursor: "pointer", transition: "all 0.18s ease",
    border: `1px solid hsl(var(--border))`,
    background: `hsl(var(--muted) / ${isDark ? 0.3 : 0.5})`,
    color: "hsl(var(--muted-foreground))",
    position: "relative" as const, whiteSpace: "nowrap" as const,
  };

  const pillHighlight: React.CSSProperties = {
    ...pillBase,
    background: "hsl(var(--primary) / 0.16)",
    border: "1px solid hsl(var(--primary) / 0.4)",
    color: "hsl(var(--primary))",
  };

  // ── Circular level ring ──────────────────────────────────────────────────────
  const RING_SIZE   = 56;
  const RING_STROKE = 4.5;
  const ringR       = (RING_SIZE - RING_STROKE) / 2;
  const ringCirc    = 2 * Math.PI * ringR;
  const ringOffset  = ringCirc - (pct / 100) * ringCirc;

  const xpCard = (
    <div style={{
      borderRadius: "var(--radius)",
      background: "hsl(var(--card))",
      border: `1px solid hsl(var(--border))`,
      boxShadow: isDark ? `0 16px 40px hsl(var(--background) / 0.6)` : "0 12px 30px hsl(var(--foreground) / 0.06)",
      padding: isCompact ? "18px" : "22px",
      display: "flex",
      gap: "16px",
      flexWrap: "wrap",
    }}>
      <div style={{ flex: "0 0 auto", position: "relative", width: RING_SIZE, height: RING_SIZE }}>
        <svg width={RING_SIZE} height={RING_SIZE} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={ringR} fill="none"
            stroke="hsl(var(--muted))" strokeWidth={RING_STROKE}
          />
          <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={ringR} fill="none"
            stroke={`hsl(${current.tokenColor})`} strokeWidth={RING_STROKE}
            strokeDasharray={ringCirc} strokeDashoffset={ringOffset} strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)", filter: `drop-shadow(0 0 4px hsl(${current.tokenColor} / 0.4))` }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "18px", fontWeight: 800, color: `hsl(${current.tokenColor})` }}>{current.level}</span>
          <span style={{ fontSize: "9px", color: "hsl(var(--muted-foreground))" }}>LV</span>
        </div>
      </div>
      <div style={{ flex: 1, minWidth: "200px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "hsl(var(--foreground))" }}>{levelTitle}</div>
            <div style={{ fontSize: "11px", color: "hsl(var(--muted-foreground))" }}>{t("home.communitySectionDesc") || "Role · XP · Achievements"}</div>
          </div>
          <div style={{
            padding: "4px 10px", borderRadius: "999px",
            border: `1px solid hsl(var(--border))`,
            background: `hsl(var(--muted) / ${isDark ? 0.3 : 0.5})`,
            fontSize: "11px", fontWeight: 700, color: `hsl(${current.tokenColor})`,
            display: "flex", alignItems: "center", gap: "6px",
          }}>
            <Zap style={{ width: 12, height: 12 }} /> {totalXP.toLocaleString()} XP
          </div>
        </div>
        <div style={{ marginTop: "10px" }}>
          <div style={{ height: "8px", borderRadius: "6px", background: "hsl(var(--muted))", overflow: "hidden", marginBottom: "6px" }}>
            <div style={{
              width: `${pct}%`, height: "100%",
              background: `linear-gradient(90deg, hsl(${current.tokenColor}), hsl(${next?.tokenColor || current.tokenColor}))`,
              borderRadius: "6px", transition: "width 1s cubic-bezier(0.4,0,0.2,1)",
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "hsl(var(--muted-foreground))", flexWrap: "wrap" }}>
            <span>{xpIntoLevel.toLocaleString()} / {xpNeeded.toLocaleString()} XP {t("xp.toNextLevel") || "to next level"}</span>
            {nextTitle && (
              <span>
                {t("xp.nextLevel") || "Next"}: <strong style={{ color: `hsl(${next?.tokenColor})` }}>{nextTitle}</strong>
              </span>
            )}
          </div>
        </div>
        {nextAchievement && (
          <div style={{
            marginTop: "10px",
            padding: "8px 12px",
            borderRadius: "var(--radius)",
            background: `hsl(var(--muted) / ${isDark ? 0.3 : 0.5})`,
            border: `1px dashed hsl(var(--border))`,
            fontSize: "11px",
            color: "hsl(var(--muted-foreground))",
            display: "flex", alignItems: "center", gap: "8px",
          }}>
            <span style={{ display: "inline-flex", alignItems: "center" }}><nextAchievement.Icon style={{ width: 14, height: 14 }} /></span>
            <span>
              <strong>{(nextAchievement.xpThreshold - totalXP).toLocaleString()} XP</strong> → {isGr ? nextAchievement.labelGr : nextAchievement.label}
            </span>
          </div>
        )}
        <div style={{
          marginTop: "12px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: "8px",
        }}>
          {xpBreakdown.map(item => (
            <div key={item.id} style={{
              padding: "8px 10px",
              borderRadius: "var(--radius)",
              border: `1px solid hsl(var(--border))`,
              background: `hsl(var(--card))`,
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              minHeight: "70px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <item.IconEl style={{ width: 13, height: 13 }} />
                <span style={{ fontSize: "11px", fontWeight: 600, color: "hsl(var(--muted-foreground))" }}>{item.label}</span>
              </div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "hsl(var(--foreground))" }}>
                {item.count.toLocaleString()}
              </div>
              <div style={{ fontSize: "11px", color: "hsl(var(--muted-foreground))" }}>+{item.xp.toLocaleString()} XP</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const socialCard = (
    <div style={{
      borderRadius: "var(--radius)",
      border: `1px solid hsl(var(--border))`,
      padding: isCompact ? "16px" : "18px",
      background: "hsl(var(--card))",
      boxShadow: isDark ? "0 16px 40px hsl(var(--background) / 0.6)" : "0 12px 30px hsl(var(--foreground) / 0.06)",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <span style={{
          width: "8px", height: "8px", borderRadius: "50%",
          background: "hsl(var(--success))", boxShadow: "0 0 8px hsl(var(--success) / 0.5)",
          animation: "communityPulse 2s ease-in-out infinite",
        }} />
        <div style={{ fontSize: "12px", fontWeight: 700, color: "hsl(var(--foreground))" }}>{t("home.community.socialTitle") || "Community Navigation"}</div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {navItems.map(item => (
          <button
            key={item.path}
            onClick={() => nav(item.path)}
            style={item.highlight ? pillHighlight : pillBase}
            onMouseEnter={e => onPillEnter(e, item.highlight)}
            onMouseLeave={e => onPillLeave(e, item.highlight)}
          >
            <item.IconEl style={{ width: 14, height: 14 }} />
            <span>{item.label}</span>
            {item.badge && (
              <span style={{
                background: item.highlight ? "hsl(var(--primary))" : `hsl(var(--primary) / ${isDark ? 0.2 : 0.12})`,
                color: item.highlight ? "hsl(var(--primary-foreground))" : "hsl(var(--primary))",
                borderRadius: "10px", fontSize: "10px", fontWeight: 700,
                padding: "1px 6px",
              }}>{item.badge}</span>
            )}
          </button>
        ))}
      </div>
      {following.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            {following.slice(0, 4).map((f: { id: string; name: string }, i: number) => {
              const isOnline = i < 2;
              const initials = f.name.split(" ").map((p: string) => p[0]).join("").slice(0, 2).toUpperCase();
              // Use semantic avatar colors from CSS variables
              const avatarTokens = ["var(--primary)", "var(--success)", "var(--warning)", "var(--destructive)"];
              const avatarBg = avatarTokens[i % 4];
              return (
                <div key={f.id} style={{ position: "relative", marginLeft: i > 0 ? "-6px" : "0" }}>
                  <div style={{
                    width: "28px", height: "28px", borderRadius: "50%",
                    background: `hsl(${avatarBg})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "10px", fontWeight: 700, color: "hsl(var(--primary-foreground))",
                    border: `2px solid hsl(var(--card))`,
                  }}>{initials}</div>
                  {isOnline && (
                    <span style={{
                      position: "absolute", bottom: "-2px", right: "-1px",
                      width: "9px", height: "9px", borderRadius: "50%",
                      background: "hsl(var(--success))", border: `1.5px solid hsl(var(--card))`,
                    }} />
                  )}
                </div>
              );
            })}
            {following.length > 4 && (
              <div style={{
                width: "28px", height: "28px", borderRadius: "50%",
                background: `hsl(var(--muted))`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "10px", fontWeight: 700, color: "hsl(var(--muted-foreground))",
                marginLeft: "-6px",
              }}>+{following.length - 4}</div>
            )}
          </div>
          <button
            onClick={() => nav("/discover")}
            style={{
              fontSize: "11px", color: "hsl(var(--primary))",
              background: "none", border: "none", cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {t("social.following") || "Following"}
          </button>
        </div>
      )}
    </div>
  );

  const activityCard = (
    <div style={{
      borderRadius: "var(--radius)",
      border: `1px solid hsl(var(--border))`,
      background: "hsl(var(--card))",
      boxShadow: isDark ? "0 16px 40px hsl(var(--background) / 0.6)" : "0 12px 30px hsl(var(--foreground) / 0.06)",
      padding: isCompact ? "14px" : "18px",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      minHeight: "180px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "hsl(var(--foreground))" }}>{t("activity.latest") || "Latest activity"}</div>
          <div style={{ fontSize: "11px", color: "hsl(var(--muted-foreground))" }}>{t("activity.subtitle") || "Uploads · Segments · Collaborations"}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {unreadActivity > 0 && (
            <button
              onClick={markActivityRead}
              style={{
                fontSize: "10px",
                color: "hsl(var(--success))",
                border: `1px solid hsl(var(--success) / 0.3)`,
                background: `hsl(var(--success) / ${isDark ? 0.1 : 0.08})`,
                borderRadius: "999px",
                padding: "4px 10px",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: "4px",
              }}
            >
              <CheckCircle style={{ width: 10, height: 10 }} /> {t("activity.markRead") || "Mark read"}
            </button>
          )}
          <button
            onClick={handleViewAll}
            style={{
              fontSize: "11px", color: "hsl(var(--primary))",
              border: "none", background: "none", cursor: "pointer", fontWeight: 700,
            }}
          >
            {t("activity.viewAll") || "View all"} →
          </button>
        </div>
      </div>
      {activity.length > 0 && (
        <div style={{ marginTop: "4px" }}>
          <SegmentedControl
            options={activityFilterOptions}
            value={activityFilter}
            onChange={val => setActivityFilter(val as ActivityFilter)}
            size="sm"
            stretch
            wrap
            minItemWidth={110}
            ariaLabel={t("activity.filter.aria") || "Filter activity types"}
          />
        </div>
      )}
      {filteredEvents.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filteredEvents.map((ev) => {
            const evColor = EVENT_COLORS[ev.type] || "var(--primary)";
            return (
              <div key={ev.id} style={{
                display: "flex", alignItems: "flex-start", gap: "10px",
                padding: "10px",
                borderRadius: "var(--radius)",
                background: `hsl(var(--muted) / ${isDark ? 0.2 : 0.4})`,
                border: `1px solid hsl(var(--border))`,
              }}>
                <span style={{
                  width: "28px", height: "28px", borderRadius: "var(--radius)",
                  background: `hsl(${evColor} / 0.1)`, color: `hsl(${evColor})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>{(() => { const IconComp = EVENT_ICON_MAP[ev.type]; return IconComp ? <IconComp style={{ width: 14, height: 14 }} /> : <Activity style={{ width: 14, height: 14 }} />; })()}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "hsl(var(--foreground))", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.title}</div>
                  <div style={{ fontSize: "11px", color: "hsl(var(--muted-foreground))" }}>{timeAgo(ev.timestamp)}</div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{
          borderRadius: "var(--radius)",
          border: `1px dashed hsl(var(--border))`,
          padding: "24px",
          textAlign: "center",
          fontSize: "12px",
          color: "hsl(var(--muted-foreground))",
        }}>
          <Sparkles style={{ width: 16, height: 16, marginBottom: 4, display: "inline-block" }} /> {activityFilter === "all"
            ? (t("activity.empty") || "No activity yet — upload a document or follow a researcher to get started.")
            : (t("activity.emptyFiltered") || "No activity in this filter yet — try another type or create activity.")}
        </div>
      )}
    </div>
  );

  return (
    <section style={{ marginTop: isCompact ? 18 : 28 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 800, color: "hsl(var(--foreground))" }}>{t("home.communitySection") || "Community & Identity"}</div>
          <div style={{ fontSize: "11px", color: "hsl(var(--muted-foreground))" }}>{t("home.communitySectionDesc") || "Your progress, roles and collaborative network"}</div>
        </div>
        <button
          onClick={() => nav("/profile")}
          style={{
            padding: "6px 12px", borderRadius: "var(--radius)", border: `1px solid hsl(var(--border))`,
            background: `hsl(var(--muted) / ${isDark ? 0.3 : 0.5})`,
            fontSize: "11px", fontWeight: 600, color: "hsl(var(--muted-foreground))",
            cursor: "pointer",
          }}
        >
          {t("nav.profile") || "Profile"}
        </button>
      </div>
      <div style={{
        display: "grid",
        gridTemplateColumns: isCompact ? "1fr" : "minmax(0,1.1fr) minmax(0,0.9fr)",
        gap: isCompact ? 14 : 18,
      }}>
        <div>{xpCard}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: isCompact ? 12 : 16 }}>
          {socialCard}
          {activityCard}
        </div>
      </div>
      <style>{`@keyframes communityPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.65;transform:scale(0.85)} }`}</style>
    </section>
  );
}

export const HomeCommunityStrip = memo(HomeCommunityStripBase);
