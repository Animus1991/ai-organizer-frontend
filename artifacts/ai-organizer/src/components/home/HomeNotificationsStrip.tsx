// src/components/home/HomeNotificationsStrip.tsx
// Awareness panels — each standalone, placed at their architecturally correct positions in Home.tsx.
// HomeNotificationsPanel  → below HeroCard (inbox, action-required, high urgency)
// HomeDashboardFeedPanel  → below Insights/Enhancements section (platform feed, discovery)
// HomeNotificationsStrip  → legacy compat wrapper (no longer used in Home.tsx directly)
import React, { useState, useCallback, useMemo } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import { useIsMobile } from "../../hooks/use-mobile";
import { EnhancedNotifications } from "./EnhancedNotifications";
import { DashboardFeed } from "./DashboardFeed";
import { Bell, CheckCheck, FolderOpen, Settings, ChevronDown } from "lucide-react";

interface AwarenessPanelProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  accentColor?: string;
  unreadCount?: number;
  defaultOpen?: boolean;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}

const AwarenessPanel: React.FC<AwarenessPanelProps> = ({
  title, subtitle, icon, accentColor = "#6366f1", unreadCount, defaultOpen = false, headerActions, children,
}) => {
  const { isDark } = useTheme();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(defaultOpen);

  const hasUnread = typeof unreadCount === "number" && unreadCount > 0;

  return (
    <div style={{
      borderRadius: isMobile ? "12px" : "14px",
      border: `1px solid hsl(var(--border) / ${hasUnread ? 0.8 : 0.5})`,
      background: "hsl(var(--card))",
      boxShadow: hasUnread
        ? `0 0 0 1px ${accentColor}15, 0 2px 8px ${accentColor}08`
        : (isDark ? "none" : "0 1px 4px hsl(var(--foreground) / 0.04)"),
      overflow: "hidden",
      transition: "border-color 0.2s, box-shadow 0.2s",
    }}>
      {/* ══ PANEL HEADER ══ */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: isMobile ? "8px" : "10px",
          padding: isMobile ? "10px 12px" : "12px 16px",
          background: "hsl(var(--muted) / 0.15)",
          borderBottom: open ? "1px solid hsl(var(--border))" : "none",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        {/* Icon with badge */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div style={{
            width: isMobile ? 28 : 32, height: isMobile ? 28 : 32, borderRadius: 8,
            background: `${accentColor}14`,
            border: `1px solid ${accentColor}25`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: accentColor,
          }}>
            {icon}
          </div>
          {hasUnread && (
            <span style={{
              position: "absolute", top: -4, right: -5,
              minWidth: 16, height: 16, borderRadius: 8,
              background: accentColor, color: "#fff",
              fontSize: "9px", fontWeight: 800,
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "0 3px", lineHeight: 1,
              border: `1.5px solid hsl(var(--card))`,
            }}>
              {unreadCount! > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>

        {/* Title — single line, truncated */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{
            fontSize: isMobile ? "12px" : "13px", fontWeight: 650,
            color: "hsl(var(--foreground))",
            lineHeight: 1.3,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            display: "block",
          }}>
            {title}
          </span>
          {subtitle && !isMobile && (
            <span style={{
              fontSize: "11px",
              color: "hsl(var(--muted-foreground))",
              lineHeight: 1.3,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              display: "block", marginTop: 1,
            }}>
              {subtitle}
            </span>
          )}
        </div>

        {/* Action buttons — icon-only on mobile */}
        {headerActions && (
          <div
            onClick={e => e.stopPropagation()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: isMobile ? "4px" : "6px",
              flexShrink: 0,
            }}
          >
            {headerActions}
          </div>
        )}

        {/* Chevron */}
        <button
          onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
          title={open ? "Collapse" : "Expand"}
          style={{
            background: "none", border: "none", outline: "none",
            cursor: "pointer", padding: 4, borderRadius: 6,
            color: "hsl(var(--muted-foreground))", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.15s",
          }}
        >
          <ChevronDown
            style={{
              width: 14, height: 14,
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.22s ease",
            }}
          />
        </button>
      </div>

      {/* ══ COLLAPSIBLE BODY ══ */}
      {open && (
        <div style={{ overflow: "hidden" }}>
          {children}
        </div>
      )}
    </div>
  );
};

// ─── Hook: compute live unread count from localStorage ────────────────────────
function useNotifUnreadCount(): number {
  const [count, setCount] = useState<number>(() => {
    try {
      const stored = localStorage.getItem("thinkspace-enhanced-notifs");
      if (stored) {
        const arr = JSON.parse(stored) as { read: boolean }[];
        return arr.filter(n => !n.read).length;
      }
    } catch { /* ignore */ }
    return 5;
  });

  React.useEffect(() => {
    const handler = () => {
      try {
        const stored = localStorage.getItem("thinkspace-enhanced-notifs");
        if (stored) {
          const arr = JSON.parse(stored) as { read: boolean }[];
          setCount(arr.filter(n => !n.read).length);
        }
      } catch { /* ignore */ }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return count;
}

// ─── HomeNotificationsPanel — inbox strip, placed below HeroCard ──────────────
export interface HomeNotificationsPanelProps {
  defaultOpen?: boolean;
}

export const HomeNotificationsPanel: React.FC<HomeNotificationsPanelProps> = ({
  defaultOpen = false,
}) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const unreadCount = useNotifUnreadCount();

  const [groupByProject, setGroupByProject] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [notifKey, setNotifKey] = useState(0);

  const handleMarkAllRead = useCallback(() => {
    setNotifKey(k => k + 1);
  }, []);
  const handleToggleGroup = useCallback(() => setGroupByProject(g => !g), []);
  const handleToggleSettings = useCallback(() => setShowSettings(s => !s), []);

  const iconSize = isMobile ? 13 : 12;
  const btnStyle = (active: boolean): React.CSSProperties => ({
    width: isMobile ? 28 : "auto",
    height: isMobile ? 28 : "auto",
    padding: isMobile ? 0 : "4px 8px",
    fontSize: "10.5px", fontWeight: 500,
    borderRadius: 6,
    border: `1px solid ${active ? "hsl(var(--primary) / 0.4)" : "hsl(var(--border))"}`,
    background: active ? "hsl(var(--primary) / 0.08)" : "transparent",
    color: active ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
    cursor: "pointer", whiteSpace: "nowrap",
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "4px",
  });

  const headerActions = useMemo(() => (
    <>
      {unreadCount > 0 && (
        <button onClick={handleMarkAllRead} title={t("enhNotif.markAllRead") || "Σήμανση όλων"} style={btnStyle(false)}>
          <CheckCheck style={{ width: iconSize, height: iconSize }} />
          {!isMobile && (t("enhNotif.markAllRead") || "Σήμανση όλων")}
        </button>
      )}
      <button onClick={handleToggleGroup} title={t("enhNotif.groupByProject") || "Ομαδοποίηση"} style={btnStyle(groupByProject)}>
        <FolderOpen style={{ width: iconSize, height: iconSize }} />
        {!isMobile && (t("enhNotif.groupByProject") || "Ομαδοποίηση")}
      </button>
      <button onClick={handleToggleSettings} title={t("enhNotif.settings") || "Ρυθμίσεις"} style={btnStyle(showSettings)}>
        <Settings style={{ width: iconSize, height: iconSize }} />
      </button>
    </>
  ), [unreadCount, groupByProject, showSettings, isMobile, handleMarkAllRead, handleToggleGroup, handleToggleSettings, t]);

  return (
    <AwarenessPanel
      title={t("notifications.title") || "Ειδοποιήσεις"}
      subtitle={t("notifications.subtitle") || "Αναφορές, αξιολογήσεις, CI/Build, δραστηριότητα ομάδας"}
      icon={<Bell style={{ width: 16, height: 16 }} />}
      accentColor="#6366f1"
      unreadCount={unreadCount}
      defaultOpen={defaultOpen}
      headerActions={headerActions}
    >
      <EnhancedNotifications
        key={notifKey}
        groupByProject={groupByProject}
        showSettings={showSettings}
        onToggleGroup={handleToggleGroup}
        onToggleSettings={handleToggleSettings}
        onMarkAllRead={handleMarkAllRead}
      />
    </AwarenessPanel>
  );
};

// ─── HomeDashboardFeedPanel — platform feed, placed below Insights section ────
export interface HomeDashboardFeedPanelProps {
  defaultOpen?: boolean;
}

export const HomeDashboardFeedPanel: React.FC<HomeDashboardFeedPanelProps> = ({
  defaultOpen = false,
}) => {
  const { t } = useLanguage();

  return (
    <AwarenessPanel
      title={t("home.dashboardFeed") || "Dashboard Feed"}
      subtitle={t("home.dashboardFeedSubtitle") || "Platform updates, trending topics, top projects"}
      icon={<Bell style={{ width: 16, height: 16 }} />}
      accentColor="#10b981"
      defaultOpen={defaultOpen}
    >
      <DashboardFeed />
    </AwarenessPanel>
  );
};

// ─── HomeNotificationsStrip — legacy compat ──────────────────────────────────
interface HomeNotificationsStripProps {
  isCompact?: boolean;
}

export const HomeNotificationsStrip: React.FC<HomeNotificationsStripProps> = () => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <HomeNotificationsPanel defaultOpen={true} />
      <HomeDashboardFeedPanel defaultOpen={false} />
    </div>
  );
};