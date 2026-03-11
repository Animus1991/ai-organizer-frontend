/**
 * HomeXPBar — Gamification XP / Level / Streak widget
 * Calculates XP from real user activity (uploads, segments, comments, reviews, collections, teams)
 * Displays: current level, XP progress bar, streak, next achievement
 */
import { useMemo, useState, useEffect, useRef } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import { useUserData } from "../../context/UserDataContext";
import { useNotifications } from "../../context/NotificationContext";

// ─── XP Config ───────────────────────────────────────────────
const XP_PER_UPLOAD = 20;
const XP_PER_SEGMENT = 5;
const XP_PER_COMMENT = 8;
const XP_PER_REVIEW = 25;
const XP_PER_COLLECTION = 15;
const XP_PER_TEAM = 30;
const XP_PER_FOLLOW = 10;

const LEVELS = [
  { level: 1,  title: "Curious Mind",      titleGr: "Περίεργο Μυαλό",     xpRequired: 0,    color: "#94a3b8" },
  { level: 2,  title: "Note Taker",         titleGr: "Σημειωτής",          xpRequired: 100,  color: "#6ee7b7" },
  { level: 3,  title: "Researcher",         titleGr: "Ερευνητής",          xpRequired: 250,  color: "#6366f1" },
  { level: 4,  title: "Analyst",            titleGr: "Αναλυτής",           xpRequired: 500,  color: "#8b5cf6" },
  { level: 5,  title: "Scholar",            titleGr: "Μελετητής",          xpRequired: 900,  color: "#ec4899" },
  { level: 6,  title: "Theory Builder",     titleGr: "Θεωρητικός",         xpRequired: 1400, color: "#f59e0b" },
  { level: 7,  title: "Senior Researcher",  titleGr: "Ανώτερος Ερευνητής", xpRequired: 2000, color: "#f97316" },
  { level: 8,  title: "Expert",             titleGr: "Ειδικός",            xpRequired: 2800, color: "#ef4444" },
  { level: 9,  title: "Principal Scientist",titleGr: "Κύριος Επιστήμονας", xpRequired: 3800, color: "#10b981" },
  { level: 10, title: "Thought Leader",     titleGr: "Πρωτοπόρος",         xpRequired: 5000, color: "#fbbf24" },
];

const ACHIEVEMENTS = [
  { id: "first_upload",    icon: "📤", label: "First Upload",    labelGr: "Πρώτο Upload",    xpThreshold: 20  },
  { id: "segmenter",       icon: "✂️", label: "Segmenter",       labelGr: "Τμηματοποιητής",  xpThreshold: 50  },
  { id: "collaborator",    icon: "👥", label: "Collaborator",    labelGr: "Συνεργάτης",      xpThreshold: 100 },
  { id: "theory_builder",  icon: "🧠", label: "Theory Builder",  labelGr: "Θεωρητικός",      xpThreshold: 250 },
  { id: "peer_reviewer",   icon: "🔍", label: "Peer Reviewer",   labelGr: "Αξιολογητής",     xpThreshold: 500 },
  { id: "prolific_writer", icon: "✍️", label: "Prolific Writer", labelGr: "Παραγωγικός",     xpThreshold: 900 },
];

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
  const xpNeeded = next ? next.xpRequired - current.xpRequired : 1;
  const pct = next ? Math.min(100, Math.round((xpIntoLevel / xpNeeded) * 100)) : 100;
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
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  return lastDate === today || lastDate === yesterday;
}

const XP_MILESTONES = [100, 250, 500, 900, 1400, 2000, 2800, 3800, 5000];

interface HomeXPBarProps {
  isCompact?: boolean;
}

export function HomeXPBar({ isCompact = false }: HomeXPBarProps) {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { stats, activity } = useUserData();
  const { addNotification } = useNotifications();

  const totalXP = useMemo(() => {
    return (
      stats.documentsUploaded * XP_PER_UPLOAD +
      stats.segmentsCreated * XP_PER_SEGMENT +
      stats.commentsPosted * XP_PER_COMMENT +
      stats.reviewsCompleted * XP_PER_REVIEW +
      stats.collectionsCreated * XP_PER_COLLECTION +
      stats.teamsJoined * XP_PER_TEAM +
      stats.followingCount * XP_PER_FOLLOW +
      activity.length * 2
    );
  }, [stats, activity]);

  const { current, next, xpIntoLevel, xpNeeded, pct } = useMemo(() => getLevelInfo(totalXP), [totalXP]);

  // ── Streak with midnight reset ───────────────────────────────────────────
  const [streakCount, setStreakCount] = useState(() => {
    const { count, lastDate } = getStreak();
    return isStreakAlive(lastDate) ? count : 0;
  });

  useEffect(() => {
    // Check streak validity immediately on mount
    const { count, lastDate } = getStreak();
    const today = new Date().toDateString();
    if (!isStreakAlive(lastDate)) {
      // Streak broken — reset
      if (count > 0) {
        saveStreak(0, lastDate);
        setStreakCount(0);
      }
    } else if (lastDate !== today) {
      // First visit today — extend streak
      const next = count + 1;
      saveStreak(next, today);
      setStreakCount(next);
      addNotification({ type: 'success', title: `🔥 ${next}-day streak!`, message: 'Keep it up — visit every day to maintain your streak.', duration: 3500 });
    } else {
      setStreakCount(count);
    }
  // Run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Midnight auto-reset using a timed interval
  useEffect(() => {
    const msToMidnight = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      return midnight.getTime() - now.getTime();
    };
    let timeoutId: ReturnType<typeof setTimeout>;
    const scheduleCheck = () => {
      timeoutId = setTimeout(() => {
        const { lastDate } = getStreak();
        if (!isStreakAlive(lastDate)) {
          saveStreak(0, lastDate);
          setStreakCount(0);
        }
        scheduleCheck();
      }, msToMidnight() + 1000);
    };
    scheduleCheck();
    return () => clearTimeout(timeoutId);
  }, []);

  // ── XP Milestone toasts ──────────────────────────────────────────────────
  const prevXPRef = useRef<number | null>(null);
  useEffect(() => {
    if (prevXPRef.current === null) {
      prevXPRef.current = totalXP;
      return;
    }
    const prev = prevXPRef.current;
    prevXPRef.current = totalXP;
    // Check if we crossed any milestone
    for (const milestone of XP_MILESTONES) {
      if (prev < milestone && totalXP >= milestone) {
        const lvlInfo = getLevelInfo(totalXP);
        addNotification({
          type: 'success',
          title: `🏆 ${milestone} XP reached!`,
          message: `You leveled up to ${lvlInfo.current.title} (Lv.${lvlInfo.current.level})!`,
          duration: 5000,
        });
        break;
      }
    }
  }, [totalXP, addNotification]);

  const streak = streakCount;

  const nextAchievement = useMemo(() => {
    return ACHIEVEMENTS.find(a => totalXP < a.xpThreshold) || null;
  }, [totalXP]);

  const isGr = t("app.title") === "Think!Hub" ? false : true;

  const levelTitle = isGr ? current.titleGr : current.title;
  const nextTitle = next ? (isGr ? next.titleGr : next.title) : null;

  const bg = isDark
    ? "linear-gradient(135deg, rgba(99,102,241,0.09) 0%, rgba(139,92,246,0.06) 100%)"
    : "linear-gradient(135deg, rgba(99,102,241,0.05) 0%, rgba(139,92,246,0.03) 100%)";

  // ── Circular SVG ring ───────────────────────────────────────────────────
  const RING_SIZE = isCompact ? 40 : 56;
  const RING_STROKE = isCompact ? 3.5 : 4.5;
  const ringR = (RING_SIZE - RING_STROKE) / 2;
  const ringCirc = 2 * Math.PI * ringR;
  const ringOffset = ringCirc - (pct / 100) * ringCirc;

  const LevelRing = () => (
    <div style={{ position: "relative", width: RING_SIZE, height: RING_SIZE, flexShrink: 0 }}>
      <svg width={RING_SIZE} height={RING_SIZE} style={{ transform: "rotate(-90deg)" }}>
        {/* Track */}
        <circle
          cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={ringR}
          fill="none"
          stroke={isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}
          strokeWidth={RING_STROKE}
        />
        {/* Fill */}
        <circle
          cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={ringR}
          fill="none"
          stroke={current.color}
          strokeWidth={RING_STROKE}
          strokeDasharray={ringCirc}
          strokeDashoffset={ringOffset}
          strokeLinecap="round"
          style={{
            transition: "stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)",
            filter: `drop-shadow(0 0 4px ${current.color}88)`,
          }}
        />
      </svg>
      {/* Center label */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: "0px",
      }}>
        <span style={{
          fontSize: isCompact ? "12px" : "15px",
          fontWeight: 800,
          color: current.color,
          lineHeight: 1,
        }}>
          {current.level}
        </span>
        <span style={{
          fontSize: isCompact ? "7px" : "8px",
          color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)",
          lineHeight: 1,
          marginTop: "1px",
        }}>
          LV
        </span>
      </div>
    </div>
  );

  if (isCompact) {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: "10px",
        padding: "8px 14px", borderRadius: "12px",
        background: bg,
        border: `1px solid ${isDark ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.12)"}`,
        flexWrap: "wrap",
      }}>
        <LevelRing />
        {/* XP bar */}
        <div style={{ flex: 1, minWidth: "80px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: current.color }}>{levelTitle}</span>
            <span style={{ fontSize: "10px", color: colors.textMuted }}>{totalXP.toLocaleString()} XP</span>
          </div>
          <div style={{ height: "5px", borderRadius: "3px", background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)", overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${pct}%`, borderRadius: "3px",
              background: `linear-gradient(90deg, ${current.color}, ${next?.color || current.color})`,
              transition: "width 0.9s cubic-bezier(0.4,0,0.2,1)",
              boxShadow: `0 0 6px ${current.color}55`,
            }} />
          </div>
        </div>
        {/* Streak */}
        {streak > 0 && (
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#f97316", flexShrink: 0, display: "flex", alignItems: "center", gap: "3px" }}>
            🔥 {streak}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{
      padding: "16px 20px", borderRadius: "16px",
      background: bg,
      border: `1px solid ${isDark ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.12)"}`,
      boxShadow: isDark
        ? `0 4px 20px ${current.color}18`
        : `0 2px 12px rgba(99,102,241,0.07)`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>

        {/* Circular level ring */}
        <LevelRing />

        {/* XP info */}
        <div style={{ flex: 1, minWidth: "160px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "15px", fontWeight: 800, color: current.color }}>{levelTitle}</span>
            <span style={{
              fontSize: "10.5px", padding: "2px 8px", borderRadius: "10px",
              background: `${current.color}20`, color: current.color,
              border: `1px solid ${current.color}40`, fontWeight: 700,
            }}>
              Lv.{current.level}
            </span>
            {streak > 0 && (
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#f97316", display: "flex", alignItems: "center", gap: "3px" }}>
                🔥 {streak} {t("xp.dayStreak") || "day streak"}
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: "5px" }}>
            <div style={{ height: "7px", borderRadius: "4px", background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)", overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${pct}%`, borderRadius: "4px",
                background: `linear-gradient(90deg, ${current.color}, ${next?.color || current.color})`,
                transition: "width 1s cubic-bezier(0.4,0,0.2,1)",
                boxShadow: `0 0 10px ${current.color}60`,
              }} />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: colors.textMuted }}>
            <span>{xpIntoLevel.toLocaleString()} / {xpNeeded.toLocaleString()} XP {t("xp.toNextLevel") || "to next level"}</span>
            {nextTitle && (
              <span style={{ color: colors.textSecondary }}>
                {t("xp.nextLevel") || "Next"}: <strong style={{ color: next?.color }}>{nextTitle}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Stats pills */}
        <div style={{ display: "flex", flexDirection: "column", gap: "5px", flexShrink: 0, alignItems: "flex-end" }}>
          <div style={{
            fontSize: "11px", color: colors.textMuted,
            display: "flex", alignItems: "baseline", gap: "3px",
          }}>
            <strong style={{ color: current.color, fontSize: "18px", fontWeight: 800, letterSpacing: "-0.5px" }}>
              {totalXP.toLocaleString()}
            </strong>
            <span>XP {t("xp.total") || "total"}</span>
          </div>
          {nextAchievement && (
            <div style={{
              fontSize: "10.5px", color: colors.textMuted,
              display: "flex", alignItems: "center", gap: "4px",
              padding: "3px 8px", borderRadius: "8px",
              background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
              border: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.06)",
            }}>
              <span>{nextAchievement.icon}</span>
              <span>
                <strong style={{ color: isDark ? "#a5b4fc" : "#6366f1" }}>
                  {(nextAchievement.xpThreshold - totalXP).toLocaleString()} XP
                </strong>
                {" → "}{isGr ? nextAchievement.labelGr : nextAchievement.label}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
