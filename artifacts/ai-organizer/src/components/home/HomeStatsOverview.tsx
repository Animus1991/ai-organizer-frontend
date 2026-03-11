import { useMemo, memo } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import { useUserData } from "../../context/UserDataContext";
import { formatBytes } from "../../utils/formatters";

interface HomeStatsOverviewProps {
  uploadsList: any[];
  parsedCount: number;
  pendingCount: number;
  failedCount: number;
  totalSegments: number;
  totalStorageBytes: number;
  isCompact?: boolean;
}

// ── Trend arrow icons ────────────────────────────────────────────────────────
function TrendUp() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ width: "11px", height: "11px" }}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
    </svg>
  );
}
function TrendDown() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ width: "11px", height: "11px" }}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
    </svg>
  );
}
function TrendFlat() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ width: "11px", height: "11px" }}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14" />
    </svg>
  );
}

// ── Streak helper ────────────────────────────────────────────────────────────
function readStreak(): number {
  try {
    const stored = localStorage.getItem("research-streak");
    if (!stored) return 0;
    const { count, lastDate } = JSON.parse(stored);
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    return (lastDate === today || lastDate === yesterday) ? (count ?? 0) : 0;
  } catch { return 0; }
}

// ── XP helper ────────────────────────────────────────────────────────────────
const XP_PER_UPLOAD = 20, XP_PER_SEGMENT = 5, XP_PER_COMMENT = 8,
      XP_PER_REVIEW = 25, XP_PER_COLLECTION = 15, XP_PER_TEAM = 30;
const LEVELS = [0, 100, 250, 500, 900, 1400, 2000, 2800, 3800, 5000];
function xpToLevel(xp: number) {
  let lvl = 1;
  for (let i = 0; i < LEVELS.length; i++) { if (xp >= LEVELS[i]) lvl = i + 1; }
  return lvl;
}

function HomeStatsOverviewInner({
  uploadsList,
  parsedCount,
  pendingCount,
  failedCount: _failedCount,
  totalSegments,
  totalStorageBytes,
  isCompact = false,
}: HomeStatsOverviewProps) {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { stats, activity } = useUserData();

  const totalXP = useMemo(() => (
    stats.documentsUploaded * XP_PER_UPLOAD +
    stats.segmentsCreated * XP_PER_SEGMENT +
    stats.commentsPosted * XP_PER_COMMENT +
    stats.reviewsCompleted * XP_PER_REVIEW +
    stats.collectionsCreated * XP_PER_COLLECTION +
    stats.teamsJoined * XP_PER_TEAM +
    activity.length * 2
  ), [stats, activity]);

  const currentLevel = xpToLevel(totalXP);
  const streakDays = readStreak();
  const aiInsightCount = activity.filter((a: any) => a.type === "segment" || a.type === "review").length;

  const cardData = useMemo(() => [
    {
      icon: "📄",
      label: t("home.totalDocuments") || "Documents",
      value: String(uploadsList.length),
      sub: `${parsedCount} parsed · ${pendingCount} pending`,
      color: "#6366f1",
      trend: uploadsList.length > 0 ? "up" : "flat",
      trendLabel: parsedCount > 0 ? `${parsedCount} ready` : "no docs yet",
    },
    {
      icon: "✂️",
      label: t("home.totalSegments") || "Segments",
      value: String(totalSegments),
      sub: totalSegments === 0 ? (t("home.noSegments") || "No segments yet") : `across ${parsedCount} docs`,
      color: "#8b5cf6",
      trend: totalSegments > 0 ? "up" : "flat",
      trendLabel: totalSegments > 10 ? "rich corpus" : "getting started",
    },
    {
      icon: "💾",
      label: t("home.storageUsed") || "Storage",
      value: formatBytes(totalStorageBytes),
      sub: `${uploadsList.length} ${uploadsList.length === 1 ? "file" : "files"} stored`,
      color: "#06b6d4",
      trend: totalStorageBytes > 10_000_000 ? "up" : "flat",
      trendLabel: totalStorageBytes > 0 ? "in use" : "empty",
    },
    {
      icon: "⚡",
      label: t("home.xpLevel") || "Επίπεδο XP",
      value: `Lv ${currentLevel}`,
      sub: `${totalXP.toLocaleString()} XP total`,
      color: "#f59e0b",
      trend: currentLevel > 3 ? "up" : currentLevel > 1 ? "up" : "flat",
      trendLabel: currentLevel >= 5 ? "expert" : currentLevel >= 3 ? "rising" : "newcomer",
    },
    {
      icon: "🔥",
      label: t("home.streak") || "Σερί Ημερών",
      value: `${streakDays}d`,
      sub: streakDays > 0 ? "keep it up!" : "start today",
      color: "#ef4444",
      trend: streakDays >= 7 ? "up" : streakDays > 0 ? "up" : "down",
      trendLabel: streakDays >= 7 ? "on fire 🔥" : streakDays > 0 ? "active" : "inactive",
    },
    {
      icon: "🧠",
      label: t("home.aiInsights") || "AI Αναλύσεις",
      value: String(aiInsightCount),
      sub: `${stats.reviewsCompleted} reviews done`,
      color: "#10b981",
      trend: aiInsightCount > 5 ? "up" : aiInsightCount > 0 ? "up" : "flat",
      trendLabel: aiInsightCount > 5 ? "highly active" : aiInsightCount > 0 ? "in progress" : "not started",
    },
  ], [uploadsList, parsedCount, pendingCount, totalSegments, totalStorageBytes, currentLevel, totalXP, streakDays, aiInsightCount, stats, t]);

  const cardBg = isDark ? "rgba(255,255,255,0.03)" : "#ffffff";
  const cardBdr = isDark ? colors.borderPrimary : "rgba(0,0,0,0.06)";
  const cardShadow = isDark ? "none" : "0 1px 4px rgba(0,0,0,0.05)";

  // ── Compact mode: single-row pills ──────────────────────────────────────
  if (isCompact) {
    return (
      <div style={{
        display: "flex", gap: "10px", flexWrap: "wrap",
        padding: "10px 14px",
        background: cardBg,
        border: `1px solid ${cardBdr}`,
        borderRadius: "12px",
        boxShadow: cardShadow,
      }}>
        {cardData.map((s, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: "7px",
            flex: "1 1 auto", minWidth: "130px",
          }}>
            <span style={{
              width: "28px", height: "28px", borderRadius: "8px", flexShrink: 0,
              background: `${s.color}18`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "14px",
            }}>{s.icon}</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "10.5px", color: colors.textMuted, lineHeight: 1.2 }}>{s.label}</div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: s.color, lineHeight: 1.3, letterSpacing: "-0.3px" }}>{s.value}</div>
            </div>
            {/* Trend badge */}
            <span style={{
              fontSize: "9.5px", fontWeight: 600, marginLeft: "auto",
              color: s.trend === "up" ? "#10b981" : s.trend === "down" ? "#ef4444" : colors.textMuted,
              display: "flex", alignItems: "center", gap: "2px",
            }}>
              {s.trend === "up" ? <TrendUp /> : s.trend === "down" ? <TrendDown /> : <TrendFlat />}
            </span>
          </div>
        ))}
      </div>
    );
  }

  // ── Full 6-card grid ─────────────────────────────────────────────────────
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
      gap: "10px",
    }}>
      {cardData.map((s, i) => (
        <div
          key={i}
          style={{
            padding: "14px 16px",
            background: cardBg,
            border: `1px solid ${cardBdr}`,
            borderRadius: "13px",
            transition: "all 0.22s cubic-bezier(0.4,0,0.2,1)",
            cursor: "default",
            boxShadow: cardShadow,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = "translateY(-3px)";
            e.currentTarget.style.boxShadow = isDark
              ? `0 8px 24px rgba(0,0,0,0.35), 0 0 0 1px ${s.color}40`
              : `0 6px 20px rgba(0,0,0,0.10), 0 0 0 1px ${s.color}30`;
            e.currentTarget.style.borderColor = `${s.color}60`;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = cardShadow;
            e.currentTarget.style.borderColor = cardBdr;
          }}
        >
          {/* Top row: icon badge + trend badge */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "10px" }}>
            <div style={{
              width: "38px", height: "38px", borderRadius: "11px", flexShrink: 0,
              background: `linear-gradient(135deg, ${s.color}22, ${s.color}11)`,
              border: `1px solid ${s.color}28`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "18px",
            }}>
              {s.icon}
            </div>
            {/* Trend pill */}
            <span style={{
              display: "flex", alignItems: "center", gap: "3px",
              padding: "2px 7px", borderRadius: "20px",
              fontSize: "10px", fontWeight: 600,
              background: s.trend === "up"
                ? "rgba(16,185,129,0.12)"
                : s.trend === "down"
                  ? "rgba(239,68,68,0.12)"
                  : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"),
              color: s.trend === "up" ? "#10b981" : s.trend === "down" ? "#ef4444" : colors.textMuted,
            }}>
              {s.trend === "up" ? <TrendUp /> : s.trend === "down" ? <TrendDown /> : <TrendFlat />}
              {s.trendLabel}
            </span>
          </div>

          {/* Value */}
          <div style={{
            fontSize: "26px", fontWeight: 800, color: s.color,
            letterSpacing: "-0.8px", lineHeight: 1.1, marginBottom: "4px",
          }}>
            {s.value}
          </div>

          {/* Label */}
          <div style={{ fontSize: "12px", fontWeight: 600, color: colors.textSecondary, marginBottom: "4px" }}>
            {s.label}
          </div>

          {/* Breakdown */}
          <div style={{
            fontSize: "11px", color: colors.textMuted, lineHeight: 1.4,
            paddingTop: "8px",
            borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}`,
          }}>
            {s.sub}
          </div>
        </div>
      ))}
    </div>
  );
}

export const HomeStatsOverview = memo(HomeStatsOverviewInner);
