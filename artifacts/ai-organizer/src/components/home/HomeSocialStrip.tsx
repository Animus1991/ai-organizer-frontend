/**
 * HomeSocialStrip — Hybrid social hub widget for the Home dashboard
 * Shows: live stats pills, following preview, recent activity events,
 * quick-nav to all social pages, online presence indicator.
 * Inspired by BuddyPress/Alliance theme social widgets + GitHub activity strip.
 */
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import { useUserData } from "../../context/UserDataContext";

interface HomeSocialStripProps {
  isCompact?: boolean;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

const EVENT_ICONS: Record<string, string> = {
  upload: "📤", segment: "✂️", comment: "💬", follow: "👥",
  collection: "📂", team: "🏷️", review: "🔍", star: "⭐",
};

export function HomeSocialStrip({ isCompact = false }: HomeSocialStripProps) {
  const nav = useNavigate();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { stats, unreadActivity, following, activity } = useUserData();

  const recentEvents = useMemo(() => activity.slice(0, isCompact ? 2 : 4), [activity, isCompact]);

  const navItems = useMemo(() => [
    {
      icon: "👤",
      label: t("nav.profile") || "Profile",
      path: "/profile",
      badge: undefined as string | undefined,
      highlight: false,
    },
    {
      icon: "👥",
      label: t("nav.teams") || "Teams",
      path: "/teams",
      badge: stats.teamsJoined > 0 ? String(stats.teamsJoined) : undefined,
      highlight: false,
    },
    {
      icon: "📂",
      label: t("nav.collections") || "Collections",
      path: "/collections",
      badge: stats.collectionsCreated > 0 ? String(stats.collectionsCreated) : undefined,
      highlight: false,
    },
    {
      icon: "🔭",
      label: t("nav.discover") || "Discover",
      path: "/discover",
      badge: stats.followingCount > 0 ? String(stats.followingCount) : undefined,
      highlight: false,
    },
    {
      icon: "📡",
      label: t("nav.activity") || "Activity",
      path: "/activity",
      badge: unreadActivity > 0 ? (unreadActivity > 99 ? "99+" : String(unreadActivity)) : undefined,
      highlight: unreadActivity > 0,
    },
    {
      icon: "🌐",
      label: t("nav.community") || "Community",
      path: "/community",
      badge: undefined,
      highlight: false,
    },
  ], [stats, unreadActivity, t]);

  const stripBg = isDark
    ? "linear-gradient(135deg, rgba(99,102,241,0.07) 0%, rgba(139,92,246,0.05) 100%)"
    : "linear-gradient(135deg, rgba(99,102,241,0.04) 0%, rgba(139,92,246,0.03) 100%)";

  const pillBase: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: "5px",
    padding: "5px 12px", borderRadius: "20px",
    fontSize: "12px", fontWeight: 600,
    cursor: "pointer", transition: "all 0.18s ease",
    border: `1px solid ${colors.borderPrimary}`,
    background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
    color: colors.textSecondary,
    position: "relative" as const,
    whiteSpace: "nowrap" as const,
  };

  const pillHighlight: React.CSSProperties = {
    ...pillBase,
    background: "rgba(99,102,241,0.18)",
    border: "1px solid rgba(99,102,241,0.38)",
    color: isDark ? "#a5b4fc" : "#6366f1",
  };

  return (
    <div
      style={{
        borderRadius: "16px",
        background: stripBg,
        border: `1px solid ${isDark ? "rgba(99,102,241,0.16)" : "rgba(99,102,241,0.10)"}`,
        overflow: "hidden",
      }}
    >
      {/* ── TOP ROW: nav pills + following avatar pills ─────────────── */}
      <div style={{
        display: "flex", alignItems: "center", gap: "7px",
        padding: "11px 14px", flexWrap: "wrap",
        borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}`,
      }}>
        {/* Section label with live indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: "5px", marginRight: "4px", flexShrink: 0 }}>
          <span style={{
            width: "6px", height: "6px", borderRadius: "50%",
            background: "#34d399",
            boxShadow: "0 0 6px #34d39988",
            animation: "socialPulse 2s ease-in-out infinite",
          }} />
          <span style={{ fontSize: "10.5px", fontWeight: 700, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Social
          </span>
        </div>

        {/* Nav pills */}
        {navItems.map(item => (
          <button
            key={item.path}
            onClick={() => nav(item.path)}
            style={item.highlight ? pillHighlight : pillBase}
            onMouseEnter={e => {
              if (!item.highlight) {
                e.currentTarget.style.background = isDark ? "rgba(99,102,241,0.13)" : "rgba(99,102,241,0.08)";
                e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)";
                e.currentTarget.style.color = isDark ? "#c4b5fd" : "#6366f1";
                e.currentTarget.style.transform = "translateY(-1px)";
              }
            }}
            onMouseLeave={e => {
              if (!item.highlight) {
                e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
                e.currentTarget.style.borderColor = colors.borderPrimary;
                e.currentTarget.style.color = colors.textSecondary;
                e.currentTarget.style.transform = "translateY(0)";
              }
            }}
          >
            <span style={{ fontSize: "13px" }}>{item.icon}</span>
            <span>{item.label}</span>
            {item.badge && (
              <span style={{
                background: item.highlight ? "#6366f1" : (isDark ? "rgba(99,102,241,0.3)" : "rgba(99,102,241,0.15)"),
                color: item.highlight ? "#fff" : (isDark ? "#a5b4fc" : "#6366f1"),
                borderRadius: "10px", fontSize: "9.5px", fontWeight: 800,
                padding: "1px 5px", marginLeft: "1px",
                minWidth: "16px", textAlign: "center",
              }}>
                {item.badge}
              </span>
            )}
          </button>
        ))}

        {/* Following avatar pills — right side */}
        {following.length > 0 && (
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
            {/* Overlapping avatar circles */}
            <div style={{ display: "flex", alignItems: "center" }}>
              {following.slice(0, 4).map((f, i) => {
                const isOnline = i < 2; // first 2 shown as "online" for demonstration
                const initials = f.name.split(" ").map((p: string) => p[0]).join("").slice(0, 2).toUpperCase();
                const colors_bg = ["#6366f1", "#10b981", "#f59e0b", "#ec4899"][i % 4];
                return (
                  <div key={f.id} style={{
                    position: "relative",
                    marginLeft: i > 0 ? "-6px" : "0",
                    zIndex: 4 - i,
                  }}>
                    <div style={{
                      width: "24px", height: "24px", borderRadius: "50%",
                      background: `linear-gradient(135deg, ${colors_bg}, ${colors_bg}bb)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "9px", fontWeight: 800, color: "#fff",
                      border: `2px solid ${isDark ? "#16161c" : "#f8f9ff"}`,
                      boxSizing: "border-box",
                    }}>
                      {initials}
                    </div>
                    {/* Presence dot */}
                    {isOnline && (
                      <span style={{
                        position: "absolute", bottom: "-1px", right: "-1px",
                        width: "7px", height: "7px", borderRadius: "50%",
                        background: "#34d399",
                        border: `1.5px solid ${isDark ? "#16161c" : "#f8f9ff"}`,
                      }} />
                    )}
                  </div>
                );
              })}
              {following.length > 4 && (
                <div style={{
                  width: "24px", height: "24px", borderRadius: "50%",
                  background: isDark ? "rgba(255,255,255,0.1)" : "rgba(99,102,241,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "9px", fontWeight: 700, color: colors.textMuted,
                  border: `2px solid ${isDark ? "#16161c" : "#f8f9ff"}`,
                  marginLeft: "-6px", zIndex: 0,
                }}>
                  +{following.length - 4}
                </div>
              )}
            </div>
            <button
              onClick={() => nav("/discover")}
              style={{
                fontSize: "11px", color: isDark ? "#a5b4fc" : "#6366f1",
                background: "none", border: "none", cursor: "pointer",
                fontWeight: 600, marginLeft: "4px",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = "0.7"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
            >
              {t("social.following") || "Following"}
            </button>
          </div>
        )}
      </div>

      {/* ── RECENT ACTIVITY EVENTS ──────────────────────────────────── */}
      {recentEvents.length > 0 && (
        <div style={{
          display: "flex", gap: "0", overflowX: "auto",
          scrollbarWidth: "none",
        }}>
          {recentEvents.map((ev, idx) => {
            const eventColors: Record<string, string> = {
              upload: "#6366f1", segment: "#8b5cf6", comment: "#06b6d4",
              follow: "#10b981", collection: "#f59e0b", team: "#ec4899",
              review: "#f97316", star: "#eab308",
            };
            const evColor = eventColors[ev.type] || "#6366f1";
            return (
              <div
                key={ev.id}
                style={{
                  flex: "1 1 0", minWidth: 0,
                  padding: "9px 13px",
                  borderRight: idx < recentEvents.length - 1
                    ? `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"}`
                    : "none",
                  borderLeft: `2px solid ${evColor}55`,
                  display: "flex", alignItems: "flex-start", gap: "8px",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.03)" : "rgba(99,102,241,0.03)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{
                  width: "22px", height: "22px", borderRadius: "7px", flexShrink: 0,
                  background: `${evColor}18`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "12px", marginTop: "1px",
                }}>
                  {EVENT_ICONS[ev.type] || "📌"}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: "11.5px", fontWeight: 600, color: colors.textPrimary,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {ev.title}
                  </div>
                  <div style={{ fontSize: "10.5px", color: colors.textMuted, marginTop: "1px" }}>
                    {timeAgo(ev.timestamp)}
                  </div>
                </div>
              </div>
            );
          })}

          {/* View all */}
          <button
            onClick={() => nav("/activity")}
            style={{
              flexShrink: 0, padding: "9px 14px",
              background: "none", border: "none", cursor: "pointer",
              fontSize: "11.5px", color: isDark ? "#818cf8" : "#6366f1",
              fontWeight: 600, display: "flex", alignItems: "center", gap: "4px",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = "0.65"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
          >
            All
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "11px", height: "11px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Empty state */}
      {recentEvents.length === 0 && (
        <div style={{
          padding: "10px 14px",
          fontSize: "12px", color: colors.textMuted,
          display: "flex", alignItems: "center", gap: "8px",
        }}>
          <span>✨</span>
          <span>{t("activity.empty") || "No activity yet — upload a document or follow a researcher to get started."}</span>
        </div>
      )}

      {/* Keyframe for pulse dot */}
      <style>{`@keyframes socialPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(0.85)} }`}</style>
    </div>
  );
}
