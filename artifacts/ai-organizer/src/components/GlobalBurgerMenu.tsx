// src/components/GlobalBurgerMenu.tsx
// Global Burger Menu - Top-left corner menu with Settings and essential platform features

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useSwipeGesture } from "../hooks/useSwipeGesture";
import { useAuth } from "../auth/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useLanguage, SUPPORTED_LANGUAGES, Language } from "../context/LanguageContext";
import { useNotifications } from "../context/NotificationContext";
import { useUserData } from "../context/UserDataContext";
import { HelpModal, AboutModal } from "./HelpAboutModals";
import { useLayoutTheme } from "../context/LayoutThemeContext";
import SourceControlPanel from "./SourceControlPanel";
import IssueTemplates from "./IssueTemplates";
import ResearchConsole from "./ResearchConsole";
import BranchProtectionRules from "./BranchProtectionRules";
import {
  Home, Upload, BookOpen, Microscope, Brain, Search, MessageSquare, FolderOpen,
  Trash2, GitBranch, ClipboardList, Terminal, Shield, Camera, Circle, Star,
  Moon, Sun, Monitor, Sparkles, Orbit, LayoutDashboard, Github, Settings,
  Globe, Keyboard, Package, HelpCircle, Info, User, Activity, LogOut,
  Bell, BellOff, Pin, Scissors, Users, Eye, BookMarked, MessageCircle,
  Zap, GitMerge, Database, Link, TicketCheck, KanbanSquare, Target,
  X, ChevronLeft, Menu
} from "lucide-react";

interface MenuSection {
  title: string;
  items: MenuItem[];
}

interface MenuItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
  badge?: string;
  danger?: boolean;
  active?: boolean;
  description?: string;
}

export const GlobalBurgerMenu: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, setMode, isDark } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { addNotification } = useNotifications();
  const { layoutTheme, setLayoutTheme } = useLayoutTheme();
  const { unreadActivity, stats: userStats, activity, markActivityRead, onlineCount } = useUserData();
  const { user, logout } = useAuth();
  const _activityBadge = unreadActivity > 0 ? String(unreadActivity > 99 ? "99+" : unreadActivity) : undefined;
  const _collectionsBadge = userStats.collectionsCreated > 0 ? String(userStats.collectionsCreated) : undefined;
  void _activityBadge; void _collectionsBadge;
  
  const [isOpen, setIsOpen] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showSourceControl, setShowSourceControl] = useState(false);
  const [showIssueTemplates, setShowIssueTemplates] = useState(false);
  const [showResearchConsole, setShowResearchConsole] = useState(false);
  const [showBranchProtection, setShowBranchProtection] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Mobile detection — reactive to viewport changes
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth <= 768);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    setIsMobile(mq.matches);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Lock body scroll when mobile overlay is open
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isMobile, isOpen]);

  // Listen for swipe-open event from Home (or any page)
  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener('openBurgerMenu', handler);
    return () => window.removeEventListener('openBurgerMenu', handler);
  }, []);

  // Swipe left to close burger menu
  useSwipeGesture({
    direction: 'left',
    threshold: 60,
    enabled: isMobile && isOpen,
    onSwipe: useCallback(() => setIsOpen(false), []),
  });

  // User status indicator (online / busy / away)
  type UserStatus = 'online' | 'busy' | 'away';
  const STATUS_CONFIG: Record<UserStatus, { label: string; color: string; icon: React.ReactNode }> = {
    online: { label: t("status.online") || 'Online', color: 'hsl(var(--success))', icon: <Circle className="w-3 h-3 fill-green-500 text-green-500" /> },
    busy:   { label: t("status.busy") || 'Busy',    color: 'hsl(var(--destructive))', icon: <Circle className="w-3 h-3 fill-destructive text-destructive" /> },
    away:   { label: t("status.away") || 'Away',    color: 'hsl(var(--warning))', icon: <Circle className="w-3 h-3 fill-yellow-500 text-yellow-500" /> },
  };
  const [userStatus, setUserStatus] = useState<UserStatus>(() => {
    const s = localStorage.getItem('user_status_v1');
    return (s as UserStatus) || 'online';
  });
  const handleSetStatus = (s: UserStatus) => {
    setUserStatus(s);
    localStorage.setItem('user_status_v1', s);
    addNotification({ type: 'success', title: 'Status updated', message: STATUS_CONFIG[s].label, duration: 2000 });
    setIsOpen(false);
  };

  // Starred items badge from localStorage
  const starredBadge = (() => {
    try {
      const r = localStorage.getItem('favorites_v1') || localStorage.getItem('collab_favorites');
      if (!r) return undefined;
      const arr = JSON.parse(r);
      return Array.isArray(arr) && arr.length > 0 ? String(arr.length) : undefined;
    } catch { return undefined; }
  })();

  // Recent pages tracking
  const [recentPages, setRecentPages] = useState<{ path: string; label: string; icon: string; ts: number }[]>(() => {
    try { return JSON.parse(localStorage.getItem("recentPages") || "[]"); } catch { return []; }
  });

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowLanguageSelector(false);
        setShowAvatarMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
    setShowLanguageSelector(false);
  }, [location.pathname]);

  // Global ? key to open shortcuts modal
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setShowShortcutsModal(true);
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  // Navigation handler with feedback + recent pages tracking
  const handleNavigate = useCallback((path: string, label: string, icon?: string) => {
    // Track recent page
    setRecentPages(prev => {
      const updated = [{ path, label, icon: icon || "📄", ts: Date.now() }, ...prev.filter(p => p.path !== path)].slice(0, 5);
      localStorage.setItem("recentPages", JSON.stringify(updated));
      return updated;
    });
    setIsOpen(false);
    if (location.pathname !== path) {
      navigate(path);
    }
  }, [navigate, location.pathname]);

  // Unified appearance handler — sets BOTH theme + layout, only ONE active
  const handleAppearanceChange = useCallback((choice: string) => {
    // Store the explicit user choice
    localStorage.setItem("app-appearance", choice);

    switch (choice) {
      case "dark":
        setMode("dark");
        setLayoutTheme("futuristic");
        break;
      case "light":
        setMode("light");
        setLayoutTheme("futuristic");
        break;
      case "system":
        setMode("system");
        setLayoutTheme("futuristic");
        break;
      case "minimal":
        setMode("dark");
        setLayoutTheme("minimal");
        break;
      case "futuristic":
        setMode("dark");
        setLayoutTheme("futuristic");
        break;
      case "dashboard":
        setMode("dashboard");
        setLayoutTheme("minimal");
        break;
      case "github":
        setMode("github");
        setLayoutTheme("minimal");
        break;
    }

    const names: Record<string, string> = {
      dark: t("settings.darkMode"),
      light: t("settings.lightMode"),
      system: t("settings.systemTheme"),
      minimal: "Minimal Style",
      futuristic: "Futuristic Style",
      dashboard: t("settings.dashboardTheme"),
      github: t("settings.githubTheme") || "GitHub Style",
    };
    addNotification({
      type: "success",
      title: t("menu.appearance"),
      message: names[choice] || choice,
      duration: 2000,
    });
    setIsOpen(false);
  }, [setMode, setLayoutTheme, addNotification, t]);

  // Derive which appearance option is active
  const activeAppearance: string = (() => {
    const stored = localStorage.getItem("app-appearance");
    if (stored && ["dark","light","system","minimal","futuristic","dashboard","github"].includes(stored)) return stored;
    if (mode === "dashboard") return "dashboard";
    if (mode === "light") return "light";
    if (mode === "system") return "system";
    if (layoutTheme === "minimal") return "minimal";
    return "dark";
  })();

  // Language change handler
  const handleLanguageChange = useCallback((lang: Language) => {
    setLanguage(lang);
    const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === lang);
    addNotification({
      type: "success",
      title: t("settings.language"),
      message: `${langInfo?.nativeName || lang}`,
      duration: 2000,
    });
    setShowLanguageSelector(false);
    setIsOpen(false);
  }, [setLanguage, addNotification, t]);

  // Upload handler — navigate to home if needed, pass state so Home triggers upload on mount
  const handleUpload = useCallback(() => {
    setIsOpen(false);
    if (location.pathname !== "/" && location.pathname !== "/home-compact") {
      navigate("/", { state: { triggerUpload: true } });
    } else {
      window.dispatchEvent(new CustomEvent("triggerUpload"));
    }
  }, [location.pathname, navigate]);

  // Search handler - opens global search
  const handleSearch = useCallback(() => {
    setIsOpen(false);
    // Dispatch custom event for global search
    window.dispatchEvent(new CustomEvent("openGlobalSearch"));
    // Fallback: try Ctrl+S event
    const event = new KeyboardEvent("keydown", {
      key: "s",
      code: "KeyS",
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(event);
  }, []);

  // Export handler
  const handleExport = useCallback(() => {
    setIsOpen(false);
    navigate("/settings");
    addNotification({
      type: "info",
      title: t("menu.exportData"),
      message: "Navigate to Settings for export options",
      duration: 3000,
    });
  }, [navigate, addNotification, t]);

  // Help handler - opens Help modal
  const handleHelp = useCallback(() => {
    setIsOpen(false);
    setShowHelpModal(true);
  }, []);

  // About handler - opens About modal
  const handleAbout = useCallback(() => {
    setIsOpen(false);
    setShowAboutModal(true);
  }, []);

  // Keyboard shortcuts handler — opens modal
  const handleShortcuts = useCallback(() => {
    setIsOpen(false);
    setShowShortcutsModal(true);
  }, []);

  const iconClass = "w-4 h-4";

  const menuSections: MenuSection[] = [
    {
      title: t("menu.quickActions"),
      items: [
        { id: "home", icon: <Home className={iconClass} />, label: t("nav.home") || "Αρχική", active: location.pathname === "/", onClick: () => handleNavigate("/", t("nav.home") || "Αρχική") },
        { id: "upload", icon: <Upload className={iconClass} />, label: t("action.upload") || "Upload Document", description: "Ctrl+U", onClick: handleUpload },
        { id: "library", icon: <BookOpen className={iconClass} />, label: t("nav.library"), active: location.pathname === "/library", onClick: () => handleNavigate("/library", t("nav.library")) },
        { id: "research", icon: <Microscope className={iconClass} />, label: t("nav.research"), active: location.pathname === "/research", onClick: () => handleNavigate("/research", t("nav.research")) },
        { id: "workspace", icon: <Brain className={iconClass} />, label: t("nav.workspace"), active: location.pathname === "/frontend", onClick: () => handleNavigate("/frontend", t("nav.workspace")) },
        { id: "activity", icon: <Activity className={iconClass} />, label: t("nav.activity") || "Ροή Εργασιών", active: location.pathname === "/activity", onClick: () => handleNavigate("/activity", t("nav.activity") || "Ροή Εργασιών") },
      ],
    },
    {
      title: t("menu.tools"),
      items: [
        { id: "search", icon: <Search className={iconClass} />, label: t("action.search"), description: "Ctrl+S", onClick: handleSearch },
        { id: "chat-import", icon: <MessageSquare className={iconClass} />, label: t("menu.importChats"), onClick: () => handleNavigate("/?import=chats", t("menu.importChats")) },
        { id: "conversations", icon: <FolderOpen className={iconClass} />, label: t("menu.browseConversations"), onClick: () => handleNavigate("/?view=conversations", t("menu.browseConversations")) },
        { id: "recycle", icon: <Trash2 className={iconClass} />, label: t("nav.recycleBin"), active: location.pathname === "/recycle-bin", onClick: () => handleNavigate("/recycle-bin", t("nav.recycleBin")) },
        { id: "source-control", icon: <GitBranch className={iconClass} />, label: t("sourceControl.title") || "Source Control", onClick: () => { setIsOpen(false); setShowSourceControl(true); } },
        { id: "issue-templates", icon: <ClipboardList className={iconClass} />, label: t("issueTemplates.title") || "Issue Templates", onClick: () => { setIsOpen(false); setShowIssueTemplates(true); } },
        { id: "research-console", icon: <Terminal className={iconClass} />, label: t("researchConsole.title") || "Research Console", onClick: () => { setIsOpen(false); setShowResearchConsole(true); } },
        { id: "branch-protection", icon: <Shield className={iconClass} />, label: t("branchProtection.title") || "Branch Protection", onClick: () => { setIsOpen(false); setShowBranchProtection(true); } },
        { id: "screenshot", icon: <Camera className={iconClass} />, label: t("menu.screenshotMode") || "Screenshot Mode", onClick: () => { setIsOpen(false); window.dispatchEvent(new CustomEvent("toggleScreenshotMode")); } },
      ],
    },
    {
      title: t("menu.explore") || "Εξερεύνηση",
      items: [
        { id: "explore", icon: <Eye className={iconClass} />, label: t("nav.explore") || "Εξερεύνηση", active: location.pathname === "/explore", onClick: () => handleNavigate("/explore", t("nav.explore") || "Explore") },
        { id: "discover", icon: <Search className={iconClass} />, label: t("nav.discover") || "Ανακάλυψε", active: location.pathname === "/discover", onClick: () => handleNavigate("/discover", t("nav.discover") || "Discover") },
        { id: "community", icon: <Users className={iconClass} />, label: t("nav.community") || "Κοινότητα", active: location.pathname === "/community", onClick: () => handleNavigate("/community", t("nav.community") || "Community") },
        { id: "collections", icon: <FolderOpen className={iconClass} />, label: t("nav.collections") || "Συλλογές", active: location.pathname === "/collections", onClick: () => handleNavigate("/collections", t("nav.collections") || "Collections") },
        { id: "teams", icon: <Users className={iconClass} />, label: t("nav.teams") || "Ομάδες", active: location.pathname === "/teams", onClick: () => handleNavigate("/teams", t("nav.teams") || "Teams") },
        { id: "forums", icon: <MessageCircle className={iconClass} />, label: t("nav.forums") || "Φόρουμ", active: location.pathname === "/discussions", onClick: () => handleNavigate("/discussions", t("nav.forums") || "Forums") },
        { id: "cross-search", icon: <Search className={iconClass} />, label: t("nav.crossSearch") || "Αναζήτηση Έργων", active: location.pathname === "/search", onClick: () => handleNavigate("/search", t("nav.crossSearch") || "Cross-Project Search") },
        { id: "benchmark", icon: <Target className={iconClass} />, label: t("benchmark.title") || "Benchmark", active: location.pathname === "/benchmark", onClick: () => handleNavigate("/benchmark", t("benchmark.title") || "Benchmark") },
      ],
    },
    {
      title: t("menu.statusPresence") || "Κατάσταση & Παρουσία",
      items: [
        { id: "status-online", icon: <Circle className="w-3 h-3 fill-green-500 text-green-500" />, label: t("status.online") || "Ενεργός", active: userStatus === "online", onClick: () => handleSetStatus("online"),
          description: userStatus === "online" ? (t("status.current") || "Τρέχουσα") : undefined },
        { id: "status-busy", icon: <Circle className="w-3 h-3 fill-destructive text-destructive" />, label: t("status.busy") || "Απασχολημένος", active: userStatus === "busy", onClick: () => handleSetStatus("busy"),
          description: userStatus === "busy" ? (t("status.current") || "Τρέχουσα") : undefined },
        { id: "status-away", icon: <Circle className="w-3 h-3 fill-yellow-500 text-yellow-500" />, label: t("status.away") || "Απών", active: userStatus === "away", onClick: () => handleSetStatus("away"),
          description: userStatus === "away" ? (t("status.current") || "Τρέχουσα") : undefined },
        { id: "stars", icon: <Star className={iconClass} />, label: t("nav.starred") || "Αγαπημένα", badge: starredBadge, active: location.pathname === "/library", onClick: () => handleNavigate("/library", t("nav.starred") || "Αγαπημένα") },
      ],
    },
    {
      title: t("menu.research") || "Έρευνα",
      items: [
        { id: "theory-repo", icon: <Database className={iconClass} />, label: t("nav.theoryRepo") || "Αποθετήριο Θεωρίας", active: location.pathname === "/theory-repo", onClick: () => handleNavigate("/theory-repo", "Αποθετήριο Θεωρίας") },
        { id: "references", icon: <BookOpen className={iconClass} />, label: t("nav.references") || "Βιβλιογραφία", active: location.pathname === "/references", onClick: () => handleNavigate("/references", "Βιβλιογραφία") },
        { id: "releases", icon: <Package className={iconClass} />, label: t("nav.releases") || "Εκδόσεις", active: location.pathname === "/releases", onClick: () => handleNavigate("/releases", "Εκδόσεις") },
        { id: "claim-checks", icon: <Shield className={iconClass} />, label: t("nav.claimChecks") || "Έλεγχοι Κατάστασης", active: location.pathname === "/claim-checks", onClick: () => handleNavigate("/claim-checks", "Έλεγχοι Κατάστασης") },
        { id: "evidence-graph", icon: <Zap className={iconClass} />, label: t("nav.evidenceGraph") || "Γράφημα Τεκμηρίωσης", active: location.pathname === "/evidence-graph", onClick: () => handleNavigate("/evidence-graph", "Γράφημα Τεκμηρίωσης") },
        { id: "wiki", icon: <BookMarked className={iconClass} />, label: t("nav.wiki") || "Wiki", active: location.pathname === "/wiki", onClick: () => handleNavigate("/wiki", "Wiki") },
        { id: "discussions", icon: <MessageCircle className={iconClass} />, label: t("nav.discussions") || "Συζητήσεις Έρευνας", active: location.pathname === "/research-discussions", onClick: () => handleNavigate("/research-discussions", "Συζητήσεις Έρευνας") },
        { id: "automation", icon: <Zap className={iconClass} />, label: t("nav.automation") || "Αυτοματισμοί", active: location.pathname === "/automation", onClick: () => handleNavigate("/automation", "Αυτοματισμοί") },
      ],
    },
    {
      title: t("menu.collaboration") || "Συνεργασία",
      items: [
        { id: "issues", icon: <TicketCheck className={iconClass} />, label: t("nav.issues") || "Ζητήματα", active: location.pathname === "/issues", onClick: () => handleNavigate("/issues", "Ζητήματα") },
        { id: "kanban", icon: <KanbanSquare className={iconClass} />, label: t("nav.kanban") || "Πίνακας Έργων", active: location.pathname === "/kanban", onClick: () => handleNavigate("/kanban", "Πίνακας Έργων") },
        { id: "milestones", icon: <Target className={iconClass} />, label: t("nav.milestones") || "Ορόσημα", active: location.pathname === "/milestones", onClick: () => handleNavigate("/milestones", "Ορόσημα") },
        { id: "reviews", icon: <Eye className={iconClass} />, label: t("nav.reviews") || "Αξιολογήσεις", active: location.pathname === "/reviews", onClick: () => handleNavigate("/reviews", "Αξιολογήσεις") },
        { id: "merge-conflicts", icon: <GitMerge className={iconClass} />, label: t("nav.mergeConflicts") || "Συγχωνεύσεις", active: location.pathname === "/merge-conflicts", onClick: () => handleNavigate("/merge-conflicts", "Συγχωνεύσεις") },
        { id: "blockchain", icon: <Link className={iconClass} />, label: t("nav.blockchain") || "Blockchain", active: location.pathname === "/blockchain", onClick: () => handleNavigate("/blockchain", "Blockchain") },
        { id: "investor", icon: <Target className={iconClass} />, label: t("nav.investor") || "Ταμπλό Επενδυτή", active: location.pathname === "/investor", onClick: () => handleNavigate("/investor", "Ταμπλό Επενδυτή") },
      ],
    },
    {
      title: t("menu.appearance"),
      items: [
        { id: "theme-dark", icon: <Moon className={iconClass} />, label: t("settings.darkMode"), active: activeAppearance === "dark", onClick: () => handleAppearanceChange("dark") },
        { id: "theme-light", icon: <Sun className={iconClass} />, label: t("settings.lightMode"), active: activeAppearance === "light", onClick: () => handleAppearanceChange("light") },
        { id: "theme-system", icon: <Monitor className={iconClass} />, label: t("settings.systemTheme"), active: activeAppearance === "system", onClick: () => handleAppearanceChange("system") },
        { id: "style-minimal", icon: <Sparkles className={iconClass} />, label: t("settings.minimalStyle"), active: activeAppearance === "minimal", onClick: () => handleAppearanceChange("minimal") },
        { id: "style-futuristic", icon: <Orbit className={iconClass} />, label: t("settings.futuristicStyle"), active: activeAppearance === "futuristic", onClick: () => handleAppearanceChange("futuristic") },
        { id: "style-dashboard", icon: <LayoutDashboard className={iconClass} />, label: t("settings.dashboardTheme"), active: activeAppearance === "dashboard", onClick: () => handleAppearanceChange("dashboard") },
        { id: "style-github", icon: <Github className={iconClass} />, label: t("settings.githubTheme") || "GitHub Style", active: activeAppearance === "github", onClick: () => handleAppearanceChange("github") },
      ],
    },
    {
      title: t("menu.account"),
      items: [
        { id: "settings", icon: <Settings className={iconClass} />, label: t("settings.title"), active: location.pathname === "/settings", onClick: () => handleNavigate("/settings", t("settings.title")) },
        { id: "language", icon: <Globe className={iconClass} />, label: t("settings.language"), description: SUPPORTED_LANGUAGES.find(l => l.code === language)?.nativeName, onClick: () => setShowLanguageSelector(true) },
        { id: "shortcuts", icon: <Keyboard className={iconClass} />, label: t("settings.shortcuts"), onClick: handleShortcuts },
        { id: "export", icon: <Package className={iconClass} />, label: t("menu.exportData"), onClick: handleExport },
      ],
    },
    {
      title: t("menu.support"),
      items: [
        { id: "help", icon: <HelpCircle className={iconClass} />, label: t("menu.help"), onClick: handleHelp },
        { id: "about", icon: <Info className={iconClass} />, label: t("menu.about"), onClick: handleAbout },
      ],
    },
  ];

  const ACTIVITY_ICON_MAP: Record<string, React.ReactNode> = {
    upload: <Upload className="w-4 h-4" />, segment: <Scissors className="w-4 h-4" />,
    comment: <MessageSquare className="w-4 h-4" />, follow: <User className="w-4 h-4" />,
    collection: <FolderOpen className="w-4 h-4" />, team: <Users className="w-4 h-4" />,
    review: <Eye className="w-4 h-4" />, star: <Star className="w-4 h-4" />,
  };

  return (
    <>
    <div ref={menuRef} style={{ position: "fixed", top: "16px", left: "16px", zIndex: 10003, display: isMobile ? "none" : "flex", gap: "8px", alignItems: "center" }}>
      {/* Burger Button — hidden on mobile (swipe-only access) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: isMobile ? "36px" : "44px",
          height: isMobile ? "36px" : "44px",
          background: isOpen 
            ? "hsl(var(--primary))" 
            : isDark
              ? `hsl(var(--muted) / ${isMobile ? 0.7 : 1})`
              : `hsl(var(--card) / ${isMobile ? 0.85 : 1})`,
          border: `1px solid hsl(var(--border) / ${isMobile ? 0.5 : 1})`,
          borderRadius: isMobile ? "10px" : "12px",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: isMobile ? "4px" : "5px",
          padding: isMobile ? "8px" : "10px",
          transition: "all 0.3s ease",
          backdropFilter: isMobile ? "blur(12px)" : undefined,
          WebkitBackdropFilter: isMobile ? "blur(12px)" : undefined,
          boxShadow: isOpen 
            ? "0 4px 20px hsl(var(--primary) / 0.4)" 
            : isDark
              ? "0 2px 8px hsl(var(--background) / 0.3)"
              : "0 2px 8px hsl(var(--foreground) / 0.08)",
        }}
        onMouseEnter={(e) => {
          if (!isOpen) e.currentTarget.style.background = isDark ? "hsl(var(--accent))" : "hsl(var(--muted))";
        }}
        onMouseLeave={(e) => {
          if (!isOpen) e.currentTarget.style.background = isDark ? `hsl(var(--muted) / ${isMobile ? 0.7 : 1})` : `hsl(var(--card) / ${isMobile ? 0.85 : 1})`;
        }}
        title={t("menu.openMenu")}
      >
        <span style={{
          width: isMobile ? "14px" : "18px",
          height: "2px",
          background: isOpen ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
          borderRadius: "1px",
          transition: "all 0.3s ease",
          transform: isOpen ? "rotate(45deg) translate(5px, 5px)" : "none",
        }} />
        <span style={{
          width: isMobile ? "14px" : "18px",
          height: "2px",
          background: isOpen ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
          borderRadius: "1px",
          transition: "all 0.3s ease",
          opacity: isOpen ? 0 : 1,
        }} />
        <span style={{
          width: isMobile ? "14px" : "18px",
          height: "2px",
          background: isOpen ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
          borderRadius: "1px",
          transition: "all 0.3s ease",
          transform: isOpen ? "rotate(-45deg) translate(5px, -5px)" : "none",
        }} />
      </button>

      {/* Notification Bell Button — HIDE on mobile (accessible via header/menu) */}
      {!isMobile && (
      <button
        onClick={() => { setShowNotifications(!showNotifications); setIsOpen(false); if (!showNotifications) markActivityRead(); }}
        style={{
          position: "relative", width: "44px", height: "44px",
          background: showNotifications ? "hsl(var(--primary))" : isDark ? "hsl(var(--muted))" : "hsl(var(--card))",
          border: `1px solid hsl(var(--border))`,
          borderRadius: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "18px", transition: "all 0.3s ease",
          boxShadow: showNotifications ? "0 4px 20px hsl(var(--primary) / 0.4)" : "0 2px 8px hsl(var(--foreground) / 0.08)",
        }}
        title="Notifications"
        onMouseEnter={e => { if (!showNotifications) e.currentTarget.style.background = isDark ? "hsl(var(--accent))" : "hsl(var(--muted))"; }}
        onMouseLeave={e => { if (!showNotifications) e.currentTarget.style.background = isDark ? "hsl(var(--muted))" : "hsl(var(--card))"; }}
      >
        <Bell className="w-[18px] h-[18px]" />
        {unreadActivity > 0 && (
          <span style={{ position: "absolute", top: "6px", right: "6px", width: "16px", height: "16px", borderRadius: "50%", background: "hsl(var(--destructive))", color: "hsl(var(--destructive-foreground))", fontSize: "9px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid hsl(var(--background))` }}>
            {unreadActivity > 9 ? "9+" : unreadActivity}
          </span>
        )}
      </button>
      )}

      {/* Avatar Dropdown Button — HIDE on mobile */}
      {!isMobile && (
      <div style={{ position: "relative" }}>
        <button
          onClick={() => { setShowAvatarMenu(!showAvatarMenu); setIsOpen(false); setShowNotifications(false); }}
          style={{
            width: "44px", height: "44px",
            background: showAvatarMenu
              ? "hsl(var(--primary))"
              : isDark ? "hsl(var(--muted))" : "hsl(var(--card))",
            border: `1px solid hsl(var(--border))`,
            borderRadius: "50%",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "14px", fontWeight: 800,
            color: showAvatarMenu ? "hsl(var(--primary-foreground))" : "hsl(var(--primary))",
            transition: "all 0.3s ease",
            boxShadow: showAvatarMenu ? "0 4px 20px hsl(var(--primary) / 0.4)" : "0 2px 8px hsl(var(--foreground) / 0.08)",
            padding: 0, overflow: "hidden",
          }}
          onMouseEnter={e => { if (!showAvatarMenu) e.currentTarget.style.background = isDark ? "hsl(var(--accent))" : "hsl(var(--muted))"; }}
          onMouseLeave={e => { if (!showAvatarMenu) e.currentTarget.style.background = isDark ? "hsl(var(--muted))" : "hsl(var(--card))"; }}
          title={user?.email || "Profile"}
        >
          {(user?.email || "U").charAt(0).toUpperCase()}
        </button>

        {/* Avatar Dropdown Panel */}
        {showAvatarMenu && (
          <div style={{
            position: "absolute", top: "52px", left: 0, width: "220px", zIndex: 10003,
            background: "hsl(var(--card))",
            backdropFilter: "blur(20px)",
            border: `1px solid hsl(var(--border))`,
            borderRadius: "14px",
            boxShadow: "0 8px 32px hsl(var(--foreground) / 0.12)",
            animation: "slideIn 0.2s ease",
            overflow: "hidden",
          }}>
            {/* User info */}
            <div style={{ padding: "14px 16px", borderBottom: `1px solid hsl(var(--border))` }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "hsl(var(--foreground))", marginBottom: "2px" }}>
                {user?.email?.split("@")[0] || "User"}
              </div>
              <div style={{ fontSize: "11px", color: "hsl(var(--muted-foreground))" }}>
                {user?.email || ""}
              </div>
            </div>

            {/* Menu items */}
            {[
              { icon: <User className="w-4 h-4" />, label: t("nav.profile") || "My Profile", onClick: () => { setShowAvatarMenu(false); navigate("/profile"); } },
              { icon: <Settings className="w-4 h-4" />, label: t("settings.title") || "Settings", onClick: () => { setShowAvatarMenu(false); navigate("/settings"); } },
              { icon: <Activity className="w-4 h-4" />, label: t("nav.activity") || "Activity", onClick: () => { setShowAvatarMenu(false); navigate("/activity"); } },
            ].map(item => (
              <button
                key={item.label}
                onClick={item.onClick}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: "10px",
                  padding: "10px 16px", background: "transparent", border: "none",
                  cursor: "pointer", color: "hsl(var(--foreground))",
                  fontSize: "13px", fontWeight: 500, textAlign: "left",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "hsl(var(--muted) / 0.5)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ color: "currentColor" }}>{item.icon}</span>
                {item.label}
              </button>
            ))}

            {/* Divider + Sign Out */}
            <div style={{ borderTop: `1px solid hsl(var(--border))`, padding: "4px 0" }}>
              <button
                onClick={() => { setShowAvatarMenu(false); logout(); navigate("/login"); }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: "10px",
                  padding: "10px 16px", background: "transparent", border: "none",
                  cursor: "pointer", color: "hsl(var(--destructive))",
                  fontSize: "13px", fontWeight: 600, textAlign: "left",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "hsl(var(--destructive) / 0.08)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              >
                <LogOut className="w-4 h-4" />
                {t("action.signOut") || "Sign Out"}
              </button>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Notifications Panel */}
      {showNotifications && (
        <div style={{ position: "absolute", top: "56px", left: "0px", width: "340px", zIndex: 10003, background: "hsl(var(--card))", backdropFilter: "blur(20px)", border: `1px solid hsl(var(--border))`, borderRadius: "16px", boxShadow: "0 8px 32px hsl(var(--foreground) / 0.12)", animation: "slideIn 0.2s ease", maxHeight: "calc(100vh - 100px)", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid hsl(var(--border))`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Bell className="w-4 h-4" />
              <span style={{ fontWeight: 700, fontSize: "14px", color: "hsl(var(--foreground))" }}>Notifications</span>
              {activity.length > 0 && <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "8px", background: "hsl(var(--primary) / 0.15)", color: "hsl(var(--primary))", fontWeight: 700 }}>{activity.length}</span>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "hsl(var(--success))", display: "inline-block", boxShadow: "0 0 6px hsl(var(--success) / 0.5)" }} />
              <span style={{ fontSize: "11px", color: "hsl(var(--muted-foreground))" }}>{onlineCount} online</span>
            </div>
            <button onClick={() => setShowNotifications(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "hsl(var(--muted-foreground))", fontSize: "18px", lineHeight: 1 }}>×</button>
          </div>
          <div style={{ overflowY: "auto", flex: 1, maxHeight: "420px" }}>
            {activity.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "hsl(var(--muted-foreground))", fontSize: "13px" }}>
                <div style={{ marginBottom: "8px", color: "hsl(var(--muted-foreground))" }}><BellOff className="w-8 h-8" /></div>
                No activity yet
              </div>
            ) : (
              activity.slice(0, 25).map((evt, i) => (
                <div key={evt.id} style={{ padding: "10px 18px", borderBottom: i < Math.min(activity.length, 25) - 1 ? `1px solid hsl(var(--border))` : "none", display: "flex", gap: "10px", alignItems: "flex-start" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "hsl(var(--muted) / 0.5)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{ flexShrink: 0, marginTop: "1px", color: "hsl(var(--muted-foreground))" }}>{ACTIVITY_ICON_MAP[evt.type] || <Pin className="w-4 h-4" />}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "hsl(var(--foreground))", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{evt.title}</div>
                    {evt.description && <div style={{ fontSize: "11px", color: "hsl(var(--muted-foreground))", marginTop: "1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{evt.description}</div>}
                  </div>
                  <span style={{ fontSize: "10px", color: "hsl(var(--muted-foreground))", flexShrink: 0, marginTop: "2px" }}>
                    {(() => { const d = Date.now() - evt.timestamp; const m = Math.floor(d/60000); if (m < 60) return `${m}m`; const h = Math.floor(m/60); if (h < 24) return `${h}h`; return `${Math.floor(h/24)}d`; })()}
                  </span>
                </div>
              ))
            )}
          </div>
          {activity.length > 0 && (
            <div style={{ padding: "10px 18px", borderTop: `1px solid hsl(var(--border))`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button onClick={() => { setShowNotifications(false); navigate("/activity"); }} style={{ fontSize: "12px", color: "hsl(var(--primary))", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>View all activity →</button>
            </div>
          )}
        </div>
      )}

      {/* Mobile backdrop — no longer needed here (rendered outside the hidden container) */}

      {/* Dropdown Menu — desktop only (mobile uses separate overlay outside) */}
      {isOpen && !isMobile && !showLanguageSelector && (
        <div style={{
          position: "absolute",
          top: "56px",
          left: "0px",
          width: "289px",
          zIndex: 10003,
          boxShadow: "0 8px 32px hsl(var(--foreground) / 0.12)",
          animation: "slideIn 0.2s ease",
          background: "hsl(var(--card))",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: `1px solid hsl(var(--border))`,
          borderRadius: "16px",
          maxHeight: "calc(100vh - 100px)",
          overflowY: "auto",
        }}>
          <style>{`
            @keyframes slideIn {
              from { opacity: 0; transform: translateY(-10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes burgerSlideInLeft {
              from { opacity: 0; transform: translateX(-100%); }
              to   { opacity: 1; transform: translateX(0); }
            }
            @keyframes burgerBackdropIn {
              from { opacity: 0; }
              to   { opacity: 1; }
            }
          `}</style>
          {/* Desktop menu content */}
          
          {/* Header */}
          <div style={{
            padding: "16px 20px",
            borderBottom: `1px solid hsl(var(--border))`,
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}>
            <div style={{
              width: "40px",
              height: "40px",
              background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
            }}><Microscope className="w-5 h-5 text-primary-foreground" /></div>
            <div>
              <div style={{ color: "hsl(var(--foreground))", fontWeight: 700, fontSize: "14px" }}>Think!Hub</div>
              <div style={{ color: "hsl(var(--muted-foreground))", fontSize: "11px" }}>v1.0.0</div>
            </div>
          </div>

          {/* Current Language Indicator */}
          <div style={{
            padding: "12px 20px",
            borderBottom: `1px solid hsl(var(--border))`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <span style={{ color: "hsl(var(--muted-foreground))", fontSize: "12px" }}>{t("settings.currentLanguage")}:</span>
            <button
              onClick={() => setShowLanguageSelector(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 10px",
                background: "hsl(var(--primary) / 0.12)",
                border: `1px solid hsl(var(--primary) / 0.3)`,
                borderRadius: "6px",
                color: "hsl(var(--primary))",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              {SUPPORTED_LANGUAGES.find(l => l.code === language)?.flag} {SUPPORTED_LANGUAGES.find(l => l.code === language)?.name}
            </button>
          </div>

          {/* Recent Pages */}
          {recentPages.length > 0 && (
            <div style={{ padding: "8px 0", borderBottom: `1px solid hsl(var(--border))` }}>
              <div style={{ padding: "8px 20px 4px", color: "hsl(var(--muted-foreground))", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {t("menu.recent") || "Recent"}
              </div>
              {recentPages.slice(0, 3).map((page) => (
                <button
                  key={page.path + page.ts}
                  onClick={() => handleNavigate(page.path, page.label, page.icon)}
                  style={{
                    width: "100%", padding: "8px 20px", background: location.pathname === page.path ? "hsl(var(--primary) / 0.1)" : "transparent",
                    border: "none", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer",
                    color: location.pathname === page.path ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))", fontSize: "12px", textAlign: "left", transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "hsl(var(--muted) / 0.5)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = location.pathname === page.path ? "hsl(var(--primary) / 0.1)" : "transparent"; }}
                >
                  <span style={{ fontSize: "14px", width: "24px", textAlign: "center" }}>{page.icon}</span>
                  <span style={{ flex: 1 }}>{page.label}</span>
                  <span style={{ fontSize: "9px", color: "hsl(var(--muted-foreground) / 0.7)" }}>
                    {new Date(page.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Menu Sections */}
          {menuSections.map((section, sectionIndex) => (
            <div key={section.title} style={{
              padding: "8px 0",
              borderBottom: sectionIndex < menuSections.length - 1 ? `1px solid hsl(var(--border))` : "none",
            }}>
              <div style={{
                padding: "8px 20px 4px",
                color: "hsl(var(--muted-foreground))",
                fontSize: "10px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}>{section.title}</div>
              {section.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => item.onClick?.()}
                  style={{
                    width: "100%",
                    padding: "10px 20px",
                    background: item.active ? "hsl(var(--primary) / 0.12)" : "transparent",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    cursor: "pointer",
                    color: item.danger ? "hsl(var(--destructive))" : item.active ? "hsl(var(--primary))" : "hsl(var(--foreground))",
                    fontSize: "13px",
                    textAlign: "left",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "hsl(var(--muted) / 0.5)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = item.active ? "hsl(var(--primary) / 0.12)" : "transparent";
                  }}
                >
                  <span style={{ width: "24px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.description && (
                    <span style={{
                      padding: "2px 6px",
                      background: "hsl(var(--muted))",
                      borderRadius: "4px",
                      fontSize: "10px",
                      color: "hsl(var(--muted-foreground))",
                    }}>{item.description}</span>
                  )}
                  {item.active && (
                    <span style={{ color: "hsl(var(--primary))", fontSize: "12px" }}>✓</span>
                  )}
                  {item.badge && (
                    <span style={{
                      padding: "2px 6px",
                      background: "hsl(var(--primary) / 0.2)",
                      borderRadius: "4px",
                      fontSize: "10px",
                      color: "hsl(var(--primary))",
                    }}>{item.badge}</span>
                  )}
                </button>
              ))}
            </div>
          ))}

          {/* Footer */}
          <div style={{
            padding: "12px 20px",
            borderTop: `1px solid hsl(var(--border))`,
            display: "flex",
            justifyContent: "center",
            gap: "8px",
          }}>
            <kbd style={{
              padding: "3px 8px",
              background: "hsl(var(--muted))",
              border: `1px solid hsl(var(--border))`,
              borderRadius: "4px",
              fontSize: "10px",
              color: "hsl(var(--muted-foreground))",
            }}>Ctrl+K</kbd>
            <span style={{ color: "hsl(var(--muted-foreground))", fontSize: "10px" }}>{t("menu.quickAccess")}</span>
          </div>
        </div>
      )}

      {/* Language Selector Dropdown */}
      {isOpen && showLanguageSelector && (
        <div style={{
          position: "absolute",
          top: "54px",
          left: "0",
          width: "320px",
          maxHeight: "calc(100vh - 100px)",
          overflowY: "auto",
          background: "hsl(var(--card))",
          backdropFilter: "blur(20px)",
          border: `1px solid hsl(var(--border))`,
          borderRadius: "16px",
          boxShadow: isDark ? "0 8px 32px hsl(var(--background) / 0.6)" : "0 12px 36px hsl(var(--foreground) / 0.12)",
          animation: "slideIn 0.2s ease",
        }}>
          {/* Back Button */}
          <div style={{
            padding: "12px 16px",
            borderBottom: `1px solid hsl(var(--border))`,
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}>
            <button
              onClick={() => setShowLanguageSelector(false)}
              style={{
                padding: "6px 10px",
                background: "hsl(var(--muted))",
                border: `1px solid hsl(var(--border))`,
                borderRadius: "6px",
                color: "hsl(var(--muted-foreground))",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >← {t("action.back")}</button>
            <span style={{ color: "hsl(var(--foreground))", fontWeight: 600, fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}><Globe className="w-4 h-4" /> {t("settings.selectLanguage")}</span>
          </div>

          {/* Language Grid */}
          <div style={{ padding: "12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                style={{
                  padding: "12px",
                  background: language === lang.code ? "hsl(var(--primary) / 0.15)" : "hsl(var(--muted) / 0.5)",
                  border: language === lang.code ? `2px solid hsl(var(--primary))` : `1px solid hsl(var(--border))`,
                  borderRadius: "10px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (language !== lang.code) e.currentTarget.style.background = "hsl(var(--muted))";
                }}
                onMouseLeave={(e) => {
                  if (language !== lang.code) e.currentTarget.style.background = "hsl(var(--muted) / 0.5)";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "20px" }}>{lang.flag}</span>
                  <div>
                    <div style={{ color: "hsl(var(--foreground))", fontWeight: 600, fontSize: "12px" }}>{lang.name}</div>
                    <div style={{ color: "hsl(var(--muted-foreground))", fontSize: "10px" }}>{lang.nativeName}</div>
                  </div>
                  {language === lang.code && (
                    <span style={{ marginLeft: "auto", color: "hsl(var(--primary))", fontSize: "14px" }}>✓</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Source Control Panel */}
      <SourceControlPanel open={showSourceControl} onClose={() => setShowSourceControl(false)} />

      {/* Issue Templates */}
      <IssueTemplates open={showIssueTemplates} onClose={() => setShowIssueTemplates(false)} />

      {/* Research Console */}
      <ResearchConsole open={showResearchConsole} onClose={() => setShowResearchConsole(false)} />

      {/* Branch Protection Rules */}
      <BranchProtectionRules open={showBranchProtection} onClose={() => setShowBranchProtection(false)} />

      {/* Help Modal */}
      <HelpModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />
      
      {/* About Modal */}
      <AboutModal isOpen={showAboutModal} onClose={() => setShowAboutModal(false)} />

      {/* Keyboard Shortcuts Modal */}
      {showShortcutsModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "hsl(var(--background) / 0.65)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10010 }}
          onClick={() => setShowShortcutsModal(false)}
        >
          <div
            style={{ width: "90%", maxWidth: "560px", maxHeight: "80vh", background: "hsl(var(--card))", borderRadius: "20px", border: `1px solid hsl(var(--border))`, boxShadow: isDark ? "0 20px 60px hsl(var(--background) / 0.6)" : "0 20px 60px hsl(var(--foreground) / 0.12)", overflow: "hidden", display: "flex", flexDirection: "column" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: "20px 24px", borderBottom: `1px solid hsl(var(--border))`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Keyboard className="w-6 h-6" />
                <h2 style={{ margin: 0, color: "hsl(var(--foreground))", fontSize: "18px", fontWeight: 700 }}>{t("settings.shortcuts") || "Keyboard Shortcuts"}</h2>
              </div>
              <button onClick={() => setShowShortcutsModal(false)} style={{ background: "hsl(var(--muted))", border: `1px solid hsl(var(--border))`, borderRadius: "8px", color: "hsl(var(--muted-foreground))", fontSize: "16px", cursor: "pointer", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
              {[
                { section: "Global", shortcuts: [
                  { keys: "Ctrl+K", desc: t("help.shortcutSearch") || "Open search / command palette" },
                  { keys: "Ctrl+S", desc: t("help.shortcutSave") || "Save current work" },
                  { keys: "Escape", desc: t("help.shortcutClose") || "Close modal / panel" },
                  { keys: "?", desc: "Open this shortcuts guide" },
                ]},
                { section: "Home", shortcuts: [
                  { keys: "G", desc: "Switch to Grid view" },
                  { keys: "3", desc: "Switch to 3D Carousel view" },
                  { keys: "C", desc: "Switch to Carousel view" },
                ]},
                { section: "Thinking Workspace", shortcuts: [
                  { keys: "Ctrl+M", desc: "Toggle compare mode" },
                  { keys: "Alt+1-9", desc: "Select slots for compare" },
                ]},
                { section: "Research Lab", shortcuts: [
                  { keys: "Click panel header", desc: "Collapse / expand panel" },
                ]},
              ].map(group => (
                <div key={group.section} style={{ marginBottom: "20px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "hsl(var(--muted-foreground))", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>{group.section}</div>
                  {group.shortcuts.map(s => (
                    <div key={s.keys} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid hsl(var(--border) / 0.5)` }}>
                      <span style={{ color: "hsl(var(--foreground))", fontSize: "13px" }}>{s.desc}</span>
                      <kbd style={{ padding: "3px 8px", background: "hsl(var(--muted))", border: `1px solid hsl(var(--border))`, borderRadius: "6px", fontSize: "11px", color: "hsl(var(--primary))", fontFamily: "monospace", whiteSpace: "nowrap" }}>{s.keys}</kbd>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Mobile overlay — rendered outside the hidden desktop container */}
    {isMobile && isOpen && (
      <div
        ref={menuRef}
        onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}
        style={{
          position: "fixed", inset: 0,
          background: "hsl(var(--background) / 0.55)",
          zIndex: 10001,
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
          animation: "burgerBackdropIn 0.2s ease",
        }}
      >
        <div style={{
          position: "fixed",
          top: 0, left: 0, bottom: 0,
          width: "min(320px, 88vw)",
          zIndex: 10002,
          background: "hsl(var(--card))",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRight: `1px solid hsl(var(--border))`,
          boxShadow: "4px 0 32px hsl(var(--foreground) / 0.15)",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          animation: "burgerSlideInLeft 0.24s cubic-bezier(0.4,0,0.2,1)",
        }}>
          <style>{`
            @keyframes burgerSlideInLeft {
              from { opacity: 0; transform: translateX(-100%); }
              to   { opacity: 1; transform: translateX(0); }
            }
            @keyframes burgerBackdropIn {
              from { opacity: 0; }
              to   { opacity: 1; }
            }
          `}</style>
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
            style={{
              position: "absolute", top: "12px", right: "12px",
              width: "32px", height: "32px", borderRadius: "8px",
              background: "hsl(var(--muted))",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "18px", color: "hsl(var(--muted-foreground))",
              zIndex: 1,
            }}
          >×</button>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid hsl(var(--border))`, display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "40px", height: "40px", background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Microscope className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <div style={{ color: "hsl(var(--foreground))", fontWeight: 700, fontSize: "14px" }}>Think!Hub</div>
              <div style={{ color: "hsl(var(--muted-foreground))", fontSize: "11px" }}>v1.0.0</div>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
            {menuSections.map(section => (
              <div key={section.title} style={{ padding: "4px 0" }}>
                <div style={{ padding: "8px 20px", fontSize: "10px", fontWeight: 700, color: "hsl(var(--muted-foreground))", textTransform: "uppercase", letterSpacing: "0.06em" }}>{section.title}</div>
                {section.items.map(item => (
                  <button
                    key={item.id}
                    onClick={item.onClick}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: "10px",
                      padding: "10px 20px", background: item.active ? "hsl(var(--primary) / 0.1)" : "transparent",
                      border: "none", cursor: "pointer", color: item.danger ? "hsl(var(--destructive))" : item.active ? "hsl(var(--primary))" : "hsl(var(--foreground))",
                      fontSize: "13px", fontWeight: item.active ? 600 : 400, textAlign: "left",
                      transition: "background 0.12s",
                    }}
                  >
                    <span style={{ color: "currentColor", flexShrink: 0 }}>{item.icon}</span>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.badge && <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "8px", background: "hsl(var(--primary) / 0.15)", color: "hsl(var(--primary))", fontWeight: 700 }}>{item.badge}</span>}
                    {item.description && <span style={{ fontSize: "10px", color: "hsl(var(--muted-foreground))" }}>{item.description}</span>}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default GlobalBurgerMenu;
