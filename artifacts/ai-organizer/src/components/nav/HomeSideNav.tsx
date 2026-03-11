/**
 * HomeSideNav — Professional sidebar navigation for Think!Hub.
 * Consolidated groups: MAIN / RESEARCH / COMMUNITY / ACCOUNT
 * Uses Lucide icons instead of emojis for professional appearance.
 */
import { useState, useCallback, useMemo, memo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../auth/useAuth";
import {
  Home, Activity, BarChart3, Trophy,
  Compass, Users, Calendar, MessageSquare,
  GraduationCap, Briefcase, Puzzle, BookOpen,
  User, Settings, ChevronLeft, ChevronRight,
  Search, Library, FlaskConical, FolderKanban, Link,
  Eye, BookMarked, Package, TicketCheck, Target,
  Database, Brain, Telescope,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const SIDEBAR_WIDTH_FULL = 210;
export const SIDEBAR_WIDTH_MINI = 54;

interface NavItem {
  icon: LucideIcon;
  label: string;
  labelEn: string;
  labelKey: string;
  path: string;
  badge?: number | string;
  exact?: boolean;
}

interface NavGroup {
  groupKey: string;
  label: string;
  labelEn: string;
  items: NavItem[];
}

// ─── Consolidated nav config (17→12 visible items) ────────────────────────────
const NAV_GROUPS: NavGroup[] = [
  {
    groupKey: "main",
    label: "ΚΕΝΤΡΙΚΟ",
    labelEn: "MAIN",
    items: [
      { icon: Home, label: "Αρχική", labelEn: "Dashboard", labelKey: "nav.dashboard", path: "/", exact: true },
      { icon: Activity, label: "Δραστηριότητα", labelEn: "Activity", labelKey: "nav.activity", path: "/activity" },
      { icon: Search, label: "Αναζήτηση", labelEn: "Search", labelKey: "nav.search", path: "/search" },
      { icon: Library, label: "Βιβλιοθήκη", labelEn: "Library", labelKey: "nav.library", path: "/library" },
    ],
  },
  {
    groupKey: "research",
    label: "ΕΡΕΥΝΑ",
    labelEn: "RESEARCH",
    items: [
      { icon: FlaskConical, label: "Εργαστήριο", labelEn: "Research Lab", labelKey: "nav.research", path: "/research" },
      { icon: Brain, label: "Χώρος Σκέψης", labelEn: "Thinking Workspace", labelKey: "nav.workspace", path: "/frontend" },
      { icon: Database, label: "Αποθετήριο Θεωρίας", labelEn: "Theory Repo", labelKey: "nav.theoryRepo", path: "/theory-repo" },
      { icon: BookOpen, label: "Βιβλιογραφία", labelEn: "References", labelKey: "nav.references", path: "/references" },
      { icon: BookMarked, label: "Wiki", labelEn: "Wiki", labelKey: "nav.wiki", path: "/wiki" },
      { icon: BarChart3, label: "Ορόσημα", labelEn: "Milestones", labelKey: "nav.milestones", path: "/milestones" },
    ],
  },
  {
    groupKey: "collaboration",
    label: "ΣΥΝΕΡΓΑΣΙΑ",
    labelEn: "COLLABORATION",
    items: [
      { icon: FolderKanban, label: "Πίνακας Έργων", labelEn: "Project Board", labelKey: "nav.projects", path: "/projects" },
      { icon: TicketCheck, label: "Ζητήματα", labelEn: "Issues", labelKey: "nav.issues", path: "/issues" },
      { icon: Eye, label: "Αξιολογήσεις", labelEn: "Reviews", labelKey: "nav.reviews", path: "/reviews" },
      { icon: Package, label: "Εκδόσεις", labelEn: "Releases", labelKey: "nav.releases", path: "/releases" },
      { icon: Link, label: "Blockchain", labelEn: "Blockchain", labelKey: "nav.blockchain", path: "/blockchain" },
    ],
  },
  {
    groupKey: "community",
    label: "ΚΟΙΝΟΤΗΤΑ",
    labelEn: "COMMUNITY",
    items: [
      { icon: Telescope, label: "Εξερεύνηση", labelEn: "Explore", labelKey: "nav.explore", path: "/explore" },
      { icon: Compass, label: "Ανακάλυψη", labelEn: "Discover", labelKey: "nav.discover", path: "/discover" },
      { icon: Users, label: "Κοινότητα", labelEn: "Community", labelKey: "nav.community", path: "/community" },
      { icon: MessageSquare, label: "Φόρουμ", labelEn: "Forums", labelKey: "nav.forums", path: "/discussions" },
      { icon: Target, label: "Benchmark", labelEn: "Benchmark", labelKey: "nav.benchmark", path: "/benchmark" },
    ],
  },
  {
    groupKey: "account",
    label: "ΛΟΓΑΡΙΑΣΜΟΣ",
    labelEn: "ACCOUNT",
    items: [
      { icon: User, label: "Το Προφίλ μου", labelEn: "My Profile", labelKey: "nav.profile", path: "/profile" },
      { icon: Settings, label: "Ρυθμίσεις", labelEn: "Settings", labelKey: "nav.settings", path: "/settings" },
    ],
  },
];

// ─── Persistence ──────────────────────────────────────────────────────────────
function loadCollapsed(): boolean {
  try { return localStorage.getItem("sidenav-collapsed") === "true"; } catch { return false; }
}
function saveCollapsed(v: boolean) {
  try { localStorage.setItem("sidenav-collapsed", String(v)); } catch {}
}

// ─── Component ────────────────────────────────────────────────────────────────
export interface HomeSideNavProps {
  notifUnread?: number;
  activityUnread?: number;
  messagesUnread?: number;
  onCollapsedChange?: (collapsed: boolean, width: number) => void;
}

export function HomeSideNav({
  notifUnread: _notifUnread = 0,
  activityUnread = 0,
  messagesUnread = 0,
  onCollapsedChange,
}: HomeSideNavProps) {
  const nav = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();

  const [collapsed, setCollapsed] = useState<boolean>(loadCollapsed);

  const toggleCollapsed = useCallback(() => {
    setCollapsed(prev => {
      const next = !prev;
      saveCollapsed(next);
      const newWidth = next ? SIDEBAR_WIDTH_MINI : SIDEBAR_WIDTH_FULL;
      onCollapsedChange?.(next, newWidth);
      return next;
    });
  }, [onCollapsedChange]);

  const sidebarWidth = collapsed ? SIDEBAR_WIDTH_MINI : SIDEBAR_WIDTH_FULL;

  const badgeMap: Record<string, number | string> = useMemo(() => ({
    "/activity":    activityUnread  > 0 ? (activityUnread  > 99 ? "99+" : activityUnread)  : 0,
    "/discussions": messagesUnread  > 0 ? (messagesUnread  > 99 ? "99+" : messagesUnread)  : 0,
  }), [activityUnread, messagesUnread]);

  const isGr = t("app.title") !== "Think!Hub";

  const userInitials = useMemo(() => {
    const email = user?.email ?? "U";
    return email[0].toUpperCase();
  }, [user]);

  const userName = user?.email?.split("@")[0] ?? "User";

  const isActive = useCallback((path: string, exact?: boolean): boolean => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path) && path !== "/";
  }, [location.pathname]);

  return (
    <aside
      aria-label="Sidebar navigation"
      className="home-sidenav"
      style={{
        position: "fixed",
        top: 80,
        left: 0,
        bottom: 0,
        width: sidebarWidth,
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        background: isDark
          ? "hsl(var(--sidebar-background))"
          : "hsl(var(--sidebar-background))",
        borderRight: `1px solid hsl(var(--sidebar-border))`,
        borderRadius: "0 12px 12px 0",
        boxShadow: "2px 0 12px hsl(var(--foreground) / 0.06)",
        transition: "width 0.22s cubic-bezier(0.4,0,0.2,1)",
        overflowX: "hidden",
        overflowY: "auto",
        scrollbarWidth: "none",
      }}
    >
      {/* ── Brand ─────────────────────────────────────────────────── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: collapsed ? "16px 0" : "16px 14px",
        justifyContent: collapsed ? "center" : "flex-start",
        borderBottom: `1px solid hsl(var(--sidebar-border))`,
        flexShrink: 0,
      }}>
        <div style={{
          width: "30px", height: "30px", borderRadius: "8px", flexShrink: 0,
          background: "linear-gradient(135deg, hsl(var(--sidebar-primary)) 0%, hsl(var(--sidebar-ring)) 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "15px", color: "hsl(var(--sidebar-primary-foreground))", fontWeight: 800,
          boxShadow: "0 2px 8px hsl(var(--sidebar-primary) / 0.3)",
        }}>T</div>
        {!collapsed && (
          <div>
            <div style={{ fontSize: "13px", fontWeight: 800, color: "hsl(var(--sidebar-foreground))", lineHeight: 1.2 }}>
              Think!Hub
            </div>
            <div style={{ fontSize: "10px", color: "hsl(var(--sidebar-foreground) / 0.5)", lineHeight: 1.2 }}>
              Research Platform
            </div>
          </div>
        )}
      </div>

      {/* ── Nav groups ────────────────────────────────────────────── */}
      <nav style={{ flex: 1, padding: "4px 0", overflowY: "auto", scrollbarWidth: "none" }}>
        {NAV_GROUPS.map(group => (
          <div key={group.groupKey}>
            {!collapsed && (
              <div style={{
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.09em",
                color: "hsl(var(--sidebar-foreground) / 0.35)",
                padding: "0 10px 4px 14px",
                marginTop: "16px",
                marginBottom: "2px",
                textTransform: "uppercase",
                userSelect: "none",
              }}>
                {isGr ? group.label : group.labelEn}
              </div>
            )}
            {collapsed && <div style={{ height: "6px" }} />}
            {group.items.map(item => {
              const liveBadge = badgeMap[item.path] || item.badge;
              const active = isActive(item.path, item.exact);
              const label = isGr ? item.label : item.labelEn;

              return (
                <SideNavLink
                  key={item.path + item.labelKey}
                  Icon={item.icon}
                  label={label}
                  badge={liveBadge || undefined}
                  active={active}
                  collapsed={collapsed}
                  isDark={isDark}
                  onClick={() => nav(item.path)}
                />
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Collapse toggle ───────────────────────────────────────── */}
      <button
        onClick={toggleCollapsed}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="sidebar-collapse-btn"
        style={{
          margin: collapsed ? "8px auto" : "8px 10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: collapsed ? "34px" : "auto",
          padding: collapsed ? "7px" : "7px 12px",
          gap: "8px",
          borderRadius: "8px",
          border: `1px solid hsl(var(--sidebar-border))`,
          background: "transparent",
          cursor: "pointer",
          color: "hsl(var(--sidebar-foreground) / 0.5)",
          fontSize: "11px",
          fontWeight: 600,
          transition: "all 0.15s ease",
          flexShrink: 0,
        }}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        {!collapsed && <span>Collapse</span>}
      </button>

      {/* ── Avatar footer ─────────────────────────────────────────── */}
      <div
        onClick={() => nav("/profile")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: collapsed ? "12px 0" : "12px 14px",
          justifyContent: collapsed ? "center" : "flex-start",
          borderTop: `1px solid hsl(var(--sidebar-border))`,
          cursor: "pointer",
          transition: "background 0.15s",
          flexShrink: 0,
        }}
        title="My Profile"
      >
        <div style={{
          width: "30px", height: "30px", borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, hsl(var(--sidebar-primary)), hsl(var(--sidebar-ring)))",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "12px", fontWeight: 800, color: "hsl(var(--sidebar-primary-foreground))",
        }}>{userInitials}</div>
        {!collapsed && (
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "hsl(var(--sidebar-foreground))", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {userName}
            </div>
            <div style={{ fontSize: "10px", color: "hsl(var(--sidebar-foreground) / 0.45)" }}>
              {isGr ? "Ερευνητής" : "Researcher"}
            </div>
          </div>
        )}
      </div>

      <style>{`
        aside.home-sidenav::-webkit-scrollbar { display: none; }
        aside.home-sidenav nav::-webkit-scrollbar { display: none; }
        .sidebar-collapse-btn:hover {
          background: hsl(var(--sidebar-accent)) !important;
          color: hsl(var(--sidebar-accent-foreground)) !important;
        }
      `}</style>
    </aside>
  );
}

// ─── NavLink sub-component with Lucide icons ──────────────────────────────────
interface SideNavLinkProps {
  Icon: LucideIcon;
  label: string;
  badge?: number | string;
  active: boolean;
  collapsed: boolean;
  isDark: boolean;
  onClick: () => void;
}

const SideNavLink = memo(function SideNavLink({ Icon, label, badge, active, collapsed, isDark, onClick }: SideNavLinkProps) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`sidenav-link ${active ? 'sidenav-link-active' : ''}`}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: collapsed ? "8px 0" : "8px 14px",
        justifyContent: collapsed ? "center" : "flex-start",
        background: active
          ? (isDark ? "hsl(var(--sidebar-primary) / 0.15)" : "hsl(var(--sidebar-primary) / 0.1)")
          : "transparent",
        border: "none",
        borderLeft: active ? "2px solid hsl(var(--sidebar-primary))" : "2px solid transparent",
        cursor: "pointer",
        color: active
          ? "hsl(var(--sidebar-primary))"
          : "hsl(var(--sidebar-foreground) / 0.65)",
        fontSize: "13px",
        fontWeight: active ? 600 : 500,
        textAlign: "left",
        position: "relative",
        transition: "all 0.15s ease",
        boxSizing: "border-box",
      }}
    >
      <Icon size={16} strokeWidth={active ? 2.2 : 1.8} style={{ flexShrink: 0 }} />

      {!collapsed && (
        <span style={{
          flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          fontSize: "13px",
        }}>
          {label}
        </span>
      )}

      {badge !== undefined && Number(badge) > 0 && (
        <span style={{
          position: collapsed ? "absolute" : "static",
          top: collapsed ? "2px" : undefined,
          right: collapsed ? "6px" : undefined,
          minWidth: "17px", height: "17px", borderRadius: "9px",
          background: "hsl(var(--sidebar-primary))", color: "hsl(var(--sidebar-primary-foreground))",
          fontSize: "9.5px", fontWeight: 800,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "0 4px", lineHeight: 1,
          flexShrink: 0,
        }}>
          {badge}
        </span>
      )}
    </button>
  );
});
