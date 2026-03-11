import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import { useLayoutTheme } from "../../context/LayoutThemeContext";
import { useNotifications } from "../../context/NotificationContext";
import {
  Sun, Moon, Monitor, Square, Zap, BarChart3, Github,
  Bell, Settings, LogOut, User, Activity, Compass,
  Search, Upload, BookOpen, ChevronDown, Check
} from "lucide-react";

export interface HomeHeaderProps {
  user: { email: string } | null;
  onLogout: () => void;
  onSearchClick?: () => void;
  onUploadClick?: () => void;
  onNavigate?: (path: string) => void;
  homeWidgetViewMode?: "grid" | "carousel3d" | "carousel";
  onViewModeChange?: (mode: "grid" | "carousel3d" | "carousel") => void;
  benchmarkUiEnabled?: boolean;
  benchmarkAdmin?: boolean;
}

function useLiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

const APPEARANCE_OPTIONS: Array<{ key: string; Icon: React.FC<{ className?: string; style?: React.CSSProperties }>; label: string; desc: string }> = [
  { key: "light",       Icon: Sun,       label: "Light",       desc: "Clean white theme" },
  { key: "dark",        Icon: Moon,      label: "Dark",        desc: "Dark professional" },
  { key: "system",      Icon: Monitor,   label: "System",      desc: "Follow OS setting" },
  { key: "minimal",     Icon: Square,    label: "Minimal",     desc: "Distraction-free" },
  { key: "futuristic",  Icon: Zap,       label: "Futuristic",  desc: "Neon sci-fi" },
  { key: "dashboard",   Icon: BarChart3, label: "Dashboard",   desc: "Analytics panel" },
  { key: "github",      Icon: Github,    label: "GitHub",      desc: "Code-native contrast" },
];

export function HomeHeader({ user, onLogout, onSearchClick, onUploadClick, onNavigate, homeWidgetViewMode, onViewModeChange, benchmarkUiEnabled, benchmarkAdmin }: HomeHeaderProps) {
  const nav = useNavigate();
  const { t } = useLanguage();
  const { isDark, mode: themeMode, setMode } = useTheme();
  const { setLayoutTheme } = useLayoutTheme();
  const { notifications } = useNotifications();
  const now = useLiveClock();
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const [avatarMenuPos, setAvatarMenuPos] = useState<{ top: number; right: number } | null>(null);
  const [themePickerPos, setThemePickerPos] = useState<{ top: number; left: number; width?: number } | null>(null);
  const avatarMenuRef = useRef<HTMLDivElement>(null);
  const themePickerRef = useRef<HTMLDivElement>(null);
  const avatarBtnRef = useRef<HTMLButtonElement>(null);
  const themePickerBtnRef = useRef<HTMLButtonElement>(null);

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  // Active appearance derived from localStorage
  const activeAppearance = (() => {
    try {
      const stored = localStorage.getItem("app-appearance");
      if (stored && APPEARANCE_OPTIONS.some(o => o.key === stored)) return stored;
    } catch { /**/ }
    if (themeMode === "dashboard") return "dashboard";
    if (themeMode === "github") return "github";
    if (themeMode === "system") return "system";
    if (themeMode === "light") return "light";
    return "dark";
  })();

  const themeInfo = APPEARANCE_OPTIONS.find(o => o.key === activeAppearance) ?? APPEARANCE_OPTIONS[1];

  // Unified appearance handler
  const handleAppearanceChange = useCallback((choice: string) => {
    try { localStorage.setItem("app-appearance", choice); } catch { /**/ }
    switch (choice) {
      case "dark":       setMode("dark");      setLayoutTheme("futuristic"); break;
      case "light":      setMode("light");     setLayoutTheme("futuristic"); break;
      case "system":     setMode("system");    setLayoutTheme("futuristic"); break;
      case "minimal":    setMode("dark");      setLayoutTheme("minimal");    break;
      case "futuristic": setMode("dark");      setLayoutTheme("futuristic"); break;
      case "dashboard":  setMode("dashboard"); setLayoutTheme("minimal");    break;
      case "github":     setMode("github");    setLayoutTheme("minimal");    break;
      default:            setMode("dark");      setLayoutTheme("futuristic");
    }
    setThemePickerOpen(false);
  }, [setMode, setLayoutTheme]);

  // ⌘S / Ctrl+S global shortcut → search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        onSearchClick?.();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onSearchClick]);

  const initials = useCallback(() => {
    const email = user?.email || "";
    const parts = email.split("@")[0].split(/[._-]/);
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : email.slice(0, 2).toUpperCase() || "U";
  }, [user?.email]);

  const openAvatarMenu = useCallback(() => {
    if (avatarBtnRef.current) {
      const r = avatarBtnRef.current.getBoundingClientRect();
      setAvatarMenuPos({ top: r.bottom + 8, right: window.innerWidth - r.right });
    }
    setAvatarMenuOpen(o => !o);
  }, []);

  const openThemePicker = useCallback(() => {
    if (themePickerBtnRef.current) {
      const r = themePickerBtnRef.current.getBoundingClientRect();
      setThemePickerPos({ top: r.bottom + 6, left: r.left, width: r.width });
    }
    setThemePickerOpen(o => !o);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!avatarBtnRef.current?.contains(target) && !avatarMenuRef.current?.contains(target)) setAvatarMenuOpen(false);
    };
    if (avatarMenuOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [avatarMenuOpen]);

  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!themePickerBtnRef.current?.contains(target) && !themePickerRef.current?.contains(target)) setThemePickerOpen(false);
    };
    if (themePickerOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [themePickerOpen]);

  const iconBtnBase: React.CSSProperties = {
    width: "34px", height: "34px", borderRadius: "var(--radius)",
    background: "transparent", border: "none", outline: "none", boxShadow: "none",
    color: "hsl(var(--muted-foreground))", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "all 0.15s ease", flexShrink: 0, position: "relative",
  };

  const pillBtn = (opts: { key?: string | number; onClick?: () => void; title?: string; children: React.ReactNode; active?: boolean; variant?: "primary" | "default" }) => {
    const { key, onClick, title, children, active, variant = "default" } = opts;
    const base: React.CSSProperties = { display: "flex", alignItems: "center", gap: "4px", padding: "3px 9px", borderRadius: "var(--radius)", fontSize: "11px", fontWeight: 600, border: "none", outline: "none", boxShadow: "none", cursor: "pointer", transition: "all 0.12s" };
    const bg = variant === "primary" ? `hsl(var(--primary) / ${isDark ? 0.2 : 0.12})` : active ? `hsl(var(--primary) / ${isDark ? 0.2 : 0.12})` : `hsl(var(--muted) / ${isDark ? 0.4 : 0.7})`;
    const bgHover = variant === "primary" ? `hsl(var(--primary) / ${isDark ? 0.3 : 0.18})` : active ? `hsl(var(--primary) / ${isDark ? 0.2 : 0.12})` : `hsl(var(--muted))`;
    const color = variant === "primary" || active ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))";
    return (
      <button key={key} onClick={onClick} title={title} style={{ ...base, background: bg, color }} onMouseEnter={e => { e.currentTarget.style.background = bgHover; if (!active && variant === "default") e.currentTarget.style.color = "hsl(var(--foreground))"; }} onMouseLeave={e => { e.currentTarget.style.background = bg; e.currentTarget.style.color = color; }}>
        {children}
      </button>
    );
  };

  const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const shortcutDisplay = (win: string, mac: string) => isMac ? mac : win;
  const shortcutTooltip = (win: string, mac: string) => `${win} · ${mac}`;

  // Avatar menu items with Lucide icons
  const avatarMenuItems = [
    { Icon: User,     label: t("nav.profile") || "My Profile", action: () => { setAvatarMenuOpen(false); nav("/profile"); } },
    { Icon: Settings, label: t("nav.settings") || "Settings",  action: () => { setAvatarMenuOpen(false); nav("/settings"); } },
    { Icon: Activity, label: t("nav.activity") || "Activity",  action: () => { setAvatarMenuOpen(false); nav("/activity"); } },
    { Icon: Compass,  label: t("nav.discover") || "Discover",  action: () => { setAvatarMenuOpen(false); nav("/discover"); } },
  ];

  const isMobileView = typeof window !== "undefined" && window.innerWidth < 768;

  // ── MOBILE HEADER ──
  if (isMobileView) {
    return (
      <div
        className="home-header"
        style={{
          padding: "10px 12px",
          border: `1px solid hsl(var(--border))`,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          borderRadius: "var(--radius)",
          background: `hsl(var(--card))`,
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          boxShadow: isDark ? "0 1px 0 hsl(var(--border) / 0.2) inset, 0 4px 24px hsl(var(--background) / 0.5)" : "0 1px 4px hsl(var(--foreground) / 0.04)",
        }}
      >
        {/* Logo + Title */}
        <div onClick={() => nav("/")} style={{ width: "36px", height: "36px", background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)", borderRadius: "var(--radius)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px hsl(var(--primary) / 0.3)", cursor: "pointer", flexShrink: 0 }}>
          <svg fill="none" stroke="white" viewBox="0 0 24 24" style={{ width: "18px", height: "18px" }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: "16px", lineHeight: 1.2, fontWeight: 800, background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 45%, hsl(var(--destructive)) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t("app.title") || "Think!Hub"}</h1>
        </div>

        {/* Compact action buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
          {onSearchClick && (
            <button onClick={onSearchClick} title="Search" style={iconBtnBase}>
              <Search style={{ width: 16, height: 16 }} />
            </button>
          )}
          {/* Upload button removed from mobile header — available in workflow section */}
          <button onClick={() => nav("/activity")} title="Activity" style={iconBtnBase}>
            <Bell style={{ width: 16, height: 16 }} />
            {unreadCount > 0 && <span style={{ position: "absolute", top: "2px", right: "2px", width: "14px", height: "14px", borderRadius: "50%", background: "hsl(var(--destructive))", color: "hsl(var(--destructive-foreground))", fontSize: "8px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid hsl(var(--card))` }}>{unreadCount > 9 ? "9+" : unreadCount}</span>}
          </button>
          {/* Avatar — compact */}
          <button ref={avatarBtnRef} onClick={openAvatarMenu} title={user?.email || "Account"} style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))", display: "flex", alignItems: "center", justifyContent: "center", color: "hsl(var(--primary-foreground))", fontSize: "11px", fontWeight: 700, border: "none", cursor: "pointer", flexShrink: 0, boxShadow: `0 0 0 2px hsl(var(--primary) / 0.2)` }}>
            {initials()}
          </button>
        </div>

        {/* Avatar dropdown portal — reuse existing */}
        {avatarMenuOpen && avatarMenuPos && createPortal(
          <><div onClick={() => setAvatarMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 99998 }} /><div ref={avatarMenuRef} style={{ position: "fixed", top: avatarMenuPos.top, right: avatarMenuPos.right, minWidth: "200px", background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)", boxShadow: isDark ? "0 16px 40px hsl(var(--background) / 0.7)" : "0 8px 32px hsl(var(--foreground) / 0.1)", zIndex: 99999, overflow: "visible", animation: "dropdownFadeIn 0.18s cubic-bezier(0.4,0,0.2,1)" }}>
            <div style={{ padding: "12px 14px", borderBottom: "1px solid hsl(var(--border))" }}>
              <p style={{ margin: 0, fontSize: "12px", fontWeight: 700, color: "hsl(var(--foreground))" }}>{user?.email?.split("@")[0] || "User"}</p>
              <p style={{ margin: 0, marginTop: "2px", fontSize: "10.5px", color: "hsl(var(--muted-foreground))" }}>{user?.email}</p>
            </div>
            {avatarMenuItems.map((item) => (
              <button key={item.label} onClick={item.action} style={{ width: "100%", display: "flex", alignItems: "center", gap: "9px", padding: "9px 14px", background: "transparent", border: "none", color: "hsl(var(--muted-foreground))", fontSize: "12.5px", fontWeight: 500, cursor: "pointer", textAlign: "left", transition: "all 0.12s ease" }} onMouseEnter={e => { e.currentTarget.style.background = `hsl(var(--primary) / 0.08)`; e.currentTarget.style.color = "hsl(var(--foreground))"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "hsl(var(--muted-foreground))"; }}>
                <item.Icon style={{ width: 14, height: 14, flexShrink: 0 }} />{item.label}
              </button>
            ))}
            <div style={{ height: "1px", background: "hsl(var(--border))", margin: "2px 0" }} />
            <button onClick={() => { setAvatarMenuOpen(false); onLogout(); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: "9px", padding: "9px 14px", background: "transparent", border: "none", color: `hsl(var(--destructive) / 0.75)`, fontSize: "12.5px", fontWeight: 500, cursor: "pointer", textAlign: "left" }} onMouseEnter={e => { e.currentTarget.style.background = `hsl(var(--destructive) / 0.08)`; e.currentTarget.style.color = "hsl(var(--destructive))"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = `hsl(var(--destructive) / 0.75)`; }}>
              <LogOut style={{ width: 14, height: 14, flexShrink: 0 }} />{t("nav.logout") || "Sign out"}
            </button>
          </div></>,
          document.body
        )}
        <style>{`@keyframes dropdownFadeIn { from { opacity: 0; transform: translateY(-6px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }`}</style>
      </div>
    );
  }

  // ── DESKTOP HEADER (unchanged) ──
  return (
    <div
      className="home-header"
      style={{
        padding: "14px 20px",
        border: `1px solid hsl(var(--border))`,
        display: "grid",
        gridTemplateColumns: "minmax(0, 1.2fr) auto minmax(0, 1fr)",
        alignItems: "flex-start",
        gap: "10px 12px",
        borderRadius: "var(--radius)",
        background: `hsl(var(--card))`,
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        boxShadow: isDark ? "0 1px 0 hsl(var(--border) / 0.2) inset, 0 4px 24px hsl(var(--background) / 0.5)" : "0 1px 4px hsl(var(--foreground) / 0.04), 0 4px 20px hsl(var(--foreground) / 0.03)",
        position: "relative",
      }}
    >
      {/* ── LEFT: Brand icon + text ─────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: 0, alignSelf: "flex-start" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
          <div onClick={() => nav("/")} title="Think!Hub Home" style={{ width: "44px", height: "44px", background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)", borderRadius: "var(--radius)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px hsl(var(--primary) / 0.3)", cursor: "pointer", flexShrink: 0, transition: "all 0.2s", border: "none", outline: "none" }} onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.05)"; }} onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}>
            <svg fill="none" stroke="white" viewBox="0 0 24 24" style={{ width: "22px", height: "22px" }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1px", minWidth: 0 }}>
            <h1 style={{ fontSize: "22px", lineHeight: 1.2, fontWeight: 800, background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 45%, hsl(var(--destructive)) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", margin: 0 }}>{t("app.title") || "Think!Hub"}</h1>
            <p style={{ margin: 0, fontSize: "12px", color: "hsl(var(--muted-foreground))", fontWeight: 400 }}>{t("app.subtitle") || "AI Research · Document Intelligence · Analysis Platform"}</p>
          </div>
        </div>
        {/* Benchmark + Upload + Library */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap", marginLeft: "56px", marginTop: "1px" }}>
          {benchmarkUiEnabled !== undefined && (
            <div title="Benchmark UI" style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 8px", borderRadius: "20px", fontSize: "10px", fontWeight: 600, background: benchmarkUiEnabled ? `hsl(var(--success) / ${isDark ? 0.1 : 0.07})` : `hsl(var(--destructive) / ${isDark ? 0.1 : 0.07})`, border: "none", outline: "none", color: benchmarkUiEnabled ? "hsl(var(--success))" : "hsl(var(--destructive))", cursor: "help" }}>
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", flexShrink: 0, background: benchmarkUiEnabled ? "hsl(var(--success))" : "hsl(var(--destructive))", display: "inline-block" }} />Benchmark{benchmarkAdmin ? " · Admin" : ""}
            </div>
          )}
          {onUploadClick && pillBtn({ onClick: onUploadClick, title: `Upload`, variant: "primary", children: <><Upload style={{ width: 11, height: 11 }} />{t("action.upload") || "Upload"}</> })}
          <button onClick={() => nav("/library")} title="Library" style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "var(--radius)", fontSize: "11px", fontWeight: 600, background: `hsl(var(--muted) / ${isDark ? 0.4 : 0.7})`, border: "none", outline: "none", boxShadow: "none", color: "hsl(var(--muted-foreground))", cursor: "pointer", transition: "all 0.12s" }} onMouseEnter={e => { e.currentTarget.style.background = "hsl(var(--muted))"; e.currentTarget.style.color = "hsl(var(--foreground))"; }} onMouseLeave={e => { e.currentTarget.style.background = `hsl(var(--muted) / ${isDark ? 0.4 : 0.7})`; e.currentTarget.style.color = "hsl(var(--muted-foreground))"; }}><BookOpen style={{ width: 11, height: 11 }} />{t("nav.library") || "Library"}</button>
        </div>
      </div>

      {/* ── CENTER: Theme + Time + Avatar ───────────────── */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", alignSelf: "flex-start" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "14px", flexWrap: "wrap" }}>
          {/* Theme picker */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <button ref={themePickerBtnRef} onClick={openThemePicker} title="Change appearance theme" style={{ display: "flex", alignItems: "center", gap: "4px", padding: "5px 10px", borderRadius: "20px", fontSize: "11.5px", fontWeight: 600, background: themePickerOpen ? `hsl(var(--primary) / ${isDark ? 0.22 : 0.13})` : `hsl(var(--primary) / ${isDark ? 0.12 : 0.07})`, border: "none", outline: "none", boxShadow: "none", color: "hsl(var(--primary))", cursor: "pointer", transition: "all 0.15s" }} onMouseEnter={e => { e.currentTarget.style.background = `hsl(var(--primary) / ${isDark ? 0.2 : 0.13})`; }} onMouseLeave={e => { if (!themePickerOpen) e.currentTarget.style.background = `hsl(var(--primary) / ${isDark ? 0.12 : 0.07})`; }}>
              <themeInfo.Icon style={{ width: 13, height: 13 }} />{themeInfo.label}
              <ChevronDown style={{ width: 9, height: 9, opacity: 0.6, transform: themePickerOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s" }} />
            </button>
            {themePickerOpen && themePickerPos && createPortal(
              <><div onClick={() => setThemePickerOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 99998 }} /><div ref={themePickerRef} style={{ position: "fixed", top: themePickerPos.top, left: themePickerPos.left, minWidth: "200px", background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)", boxShadow: isDark ? "0 12px 32px hsl(var(--background) / 0.7)" : "0 8px 28px hsl(var(--foreground) / 0.1)", zIndex: 99999, padding: "6px", animation: "dropdownFadeIn 0.15s ease" }}>
                <p style={{ margin: "0 0 4px 8px", fontSize: "9.5px", fontWeight: 600, color: "hsl(var(--muted-foreground))", textTransform: "uppercase", letterSpacing: "0.06em" }}>Appearance</p>
                {APPEARANCE_OPTIONS.map(opt => (<button key={opt.key} onClick={() => handleAppearanceChange(opt.key)} style={{ width: "100%", display: "flex", alignItems: "center", gap: "8px", padding: "7px 8px", borderRadius: "var(--radius)", background: activeAppearance === opt.key ? `hsl(var(--primary) / ${isDark ? 0.15 : 0.08})` : "transparent", border: "none", outline: "none", cursor: "pointer", textAlign: "left", transition: "background 0.12s" }} onMouseEnter={e => { if (activeAppearance !== opt.key) e.currentTarget.style.background = `hsl(var(--muted) / ${isDark ? 0.4 : 0.6})`; }} onMouseLeave={e => { if (activeAppearance !== opt.key) e.currentTarget.style.background = "transparent"; }}>
                  <opt.Icon style={{ width: 14, height: 14, flexShrink: 0, color: activeAppearance === opt.key ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }} />
                  <div style={{ flex: 1, minWidth: 0 }}><p style={{ margin: 0, fontSize: "11.5px", fontWeight: activeAppearance === opt.key ? 700 : 500, color: activeAppearance === opt.key ? "hsl(var(--primary))" : "hsl(var(--foreground))" }}>{opt.label}</p><p style={{ margin: 0, fontSize: "9.5px", color: "hsl(var(--muted-foreground))" }}>{opt.desc}</p></div>
                  {activeAppearance === opt.key && <Check style={{ width: 12, height: 12, color: "hsl(var(--primary))", flexShrink: 0 }} />}
                </button>))}
              </div></>,
              document.body
            )}
          </div>
          {/* Time */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "4px 12px", borderRadius: "var(--radius)", background: `hsl(var(--muted) / ${isDark ? 0.2 : 0.4})`, border: "none", outline: "none" }}>
            <span style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.5px", color: "hsl(var(--foreground))", lineHeight: 1.2, fontVariantNumeric: "tabular-nums" }}>{timeStr}</span>
            <span style={{ fontSize: "11px", color: "hsl(var(--muted-foreground))", marginTop: "1px" }}>{dateStr}</span>
          </div>
          {/* Avatar */}
          <div style={{ position: "relative" }}>
            <button ref={avatarBtnRef} onClick={openAvatarMenu} title={user?.email || "Account"} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 10px 4px 4px", borderRadius: "var(--radius)", background: avatarMenuOpen ? `hsl(var(--muted) / ${isDark ? 0.5 : 0.7})` : "transparent", border: "none", outline: "none", boxShadow: "none", cursor: "pointer", transition: "background 0.15s ease" }} onMouseEnter={e => { if (!avatarMenuOpen) e.currentTarget.style.background = `hsl(var(--muted) / ${isDark ? 0.3 : 0.5})`; }} onMouseLeave={e => { if (!avatarMenuOpen) e.currentTarget.style.background = "transparent"; }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))", display: "flex", alignItems: "center", justifyContent: "center", color: "hsl(var(--primary-foreground))", fontSize: "12px", fontWeight: 700, boxShadow: `0 0 0 2px hsl(var(--primary) / ${isDark ? 0.35 : 0.2})`, flexShrink: 0 }}>{initials()}</div>
              <div style={{ textAlign: "left", minWidth: 0 }}>
                <p style={{ fontSize: "12px", fontWeight: 600, margin: 0, lineHeight: 1.3, color: "hsl(var(--foreground))", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email?.split("@")[0] || "User"}</p>
                <p style={{ fontSize: "11px", margin: 0, lineHeight: 1.3, color: "hsl(var(--muted-foreground))" }}>{t("header.loggedInAs") || "Researcher"}</p>
              </div>
              <ChevronDown style={{ width: 12, height: 12, color: "hsl(var(--muted-foreground))", transform: avatarMenuOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease", flexShrink: 0 }} />
            </button>
            {avatarMenuOpen && avatarMenuPos && createPortal(
              <><div onClick={() => setAvatarMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 99998 }} /><div ref={avatarMenuRef} style={{ position: "fixed", top: avatarMenuPos.top, right: avatarMenuPos.right, minWidth: "220px", background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)", boxShadow: isDark ? "0 16px 40px hsl(var(--background) / 0.7)" : "0 8px 32px hsl(var(--foreground) / 0.1)", zIndex: 99999, overflow: "visible", animation: "dropdownFadeIn 0.18s cubic-bezier(0.4,0,0.2,1)" }}>
                <div style={{ padding: "12px 14px", borderBottom: "1px solid hsl(var(--border))", background: `hsl(var(--primary) / ${isDark ? 0.04 : 0.03})` }}>
                  <p style={{ margin: 0, fontSize: "12px", fontWeight: 700, color: "hsl(var(--foreground))" }}>{user?.email?.split("@")[0] || "User"}</p>
                  <p style={{ margin: 0, marginTop: "2px", fontSize: "10.5px", color: "hsl(var(--muted-foreground))" }}>{user?.email}</p>
                </div>
                {avatarMenuItems.map((item) => (
                  <button key={item.label} onClick={item.action} style={{ width: "100%", display: "flex", alignItems: "center", gap: "9px", padding: "9px 14px", background: "transparent", border: "none", outline: "none", color: "hsl(var(--muted-foreground))", fontSize: "12.5px", fontWeight: 500, cursor: "pointer", textAlign: "left", transition: "all 0.12s ease" }} onMouseEnter={e => { e.currentTarget.style.background = `hsl(var(--primary) / ${isDark ? 0.08 : 0.05})`; e.currentTarget.style.color = "hsl(var(--foreground))"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "hsl(var(--muted-foreground))"; }}>
                    <item.Icon style={{ width: 14, height: 14, flexShrink: 0 }} />{item.label}
                  </button>
                ))}
                <div style={{ height: "1px", background: "hsl(var(--border))", margin: "2px 0" }} />
                <button onClick={() => { setAvatarMenuOpen(false); onLogout(); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: "9px", padding: "9px 14px", background: "transparent", border: "none", outline: "none", color: `hsl(var(--destructive) / 0.75)`, fontSize: "12.5px", fontWeight: 500, cursor: "pointer", textAlign: "left", transition: "all 0.12s ease" }} onMouseEnter={e => { e.currentTarget.style.background = `hsl(var(--destructive) / ${isDark ? 0.1 : 0.06})`; e.currentTarget.style.color = "hsl(var(--destructive))"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = `hsl(var(--destructive) / 0.75)`; }}>
                  <LogOut style={{ width: 14, height: 14, flexShrink: 0 }} />{t("nav.logout") || "Sign out"}
                </button>
              </div></>,
              document.body
            )}
          </div>
        </div>
        {/* Bottom row: Notifications */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center", marginTop: "1px" }}>
          <button onClick={() => nav("/activity")} title={t("notifications.title") || "Activity"} style={iconBtnBase} onMouseEnter={e => { e.currentTarget.style.background = `hsl(var(--muted) / ${isDark ? 0.4 : 0.6})`; e.currentTarget.style.color = "hsl(var(--foreground))"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "hsl(var(--muted-foreground))"; }}>
            <Bell style={{ width: 16, height: 16 }} />
            {unreadCount > 0 && <span style={{ position: "absolute", top: "4px", right: "4px", width: "14px", height: "14px", borderRadius: "50%", background: "hsl(var(--destructive))", color: "hsl(var(--destructive-foreground))", fontSize: "8px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid hsl(var(--card))` }}>{unreadCount > 9 ? "9+" : unreadCount}</span>}
          </button>
        </div>
      </div>

      {/* ── RIGHT: View modes + Search + Navigation ───────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px", alignSelf: "flex-start" }}>
        {/* Top row: Search + Grid/3D/Carousel */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap", marginTop: "5px" }}>
          {onSearchClick && pillBtn({ onClick: onSearchClick, title: `Search — ${shortcutTooltip("Ctrl+S", "⌘S")}`, children: <><Search style={{ width: 10, height: 10 }} />{t("action.search") || "Search"} <span style={{ fontSize: "8px", opacity: 0.75, letterSpacing: "0.14em", marginLeft: "4px", fontVariantNumeric: "tabular-nums" }}>{shortcutDisplay("Ctrl+S", "⌘S")}</span></> })}
          {onViewModeChange && homeWidgetViewMode && (["grid", "carousel3d", "carousel"] as const).map((mode) => {
            const labels = { grid: t("home.viewMode.grid") || "Grid", carousel3d: t("home.viewMode.carousel3d") || "3D", carousel: t("home.viewMode.carousel") || "Carousel" };
            const shortcuts = { grid: "G", carousel3d: "3", carousel: "C" };
            return pillBtn({ key: mode, onClick: () => onViewModeChange(mode), title: `${labels[mode]} (${shortcuts[mode]})`, active: homeWidgetViewMode === mode, children: <>{labels[mode]} <span style={{ fontSize: "8px", opacity: 0.75, letterSpacing: "0.14em", marginLeft: "4px", fontVariantNumeric: "tabular-nums" }}>{shortcuts[mode]}</span></> });
          })}
        </div>
      </div>

      {/* Dropdown animation keyframes */}
      <style>{`
        @keyframes dropdownFadeIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>
    </div>
  );
}

export default HomeHeader;
