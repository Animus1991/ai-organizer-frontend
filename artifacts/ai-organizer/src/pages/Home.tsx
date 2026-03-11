// src/pages/Home.tsx - Central Hub & Control Center
// Refactored: removed ScreenshotMode, SearchModal (unified to GlobalSearchModal),
// moved Benchmark to /benchmark, extracted useHomeModals + useHomeKeyboard
import { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from "react";
import { useAuth } from "../auth/useAuth";
import { useIsMobile } from "../hooks/use-mobile";
import { useNavigate, useLocation } from "react-router-dom";
import { useLoading } from "../hooks/useLoading";
import { useFileUpload } from "../hooks/useFileUpload";
import { validateFile } from "../lib/validation";
import GlobalSearchModal from "../components/search/GlobalSearchModal";
import { AIChatManager } from "../components/ai-chat/AIChatManager";
import { ResearchTimelineSection } from "../components/home";
import { AcademicQuickActions } from "../components/home/AcademicQuickActions";
import { apiCache } from "../lib/cache";
import { useHomeState } from "../hooks/home/useHomeState";
import { useHomeOperations } from "../hooks/home/useHomeOperations";
import { useHomeModals } from "../hooks/home/useHomeModals";
import { useHomeKeyboard } from "../hooks/home/useHomeKeyboard";
import { useTour } from '../components/UniversalTourGuide';
import { getHomeTourSteps } from '../config/homeTourSteps';
import { WidgetPopupModal, ConversationBrowserModal, ConversationAnalyticsModal, ConversationViewerModal } from '../components/home/HomeModals';
import { SegmentSidePanel } from '../components/home/SegmentSidePanel';
import { getHomeStyles } from '../styles/HomeStyles';
import { renderWidgetById } from '../config/homeWidgetRenderers';
import { HomeSegmentViewer } from '../components/home/HomeSegmentViewer';
import { HomeSegmentationControls } from '../components/home/HomeSegmentationControls';
import { HomeUploadFlow } from '../components/home/HomeUploadFlow';
import { HomeDocumentPicker } from '../components/home/HomeDocumentPicker';
import { HomeCarouselViews } from "../components/home/HomeCarouselViews";
import { HomeHeroSection } from "../components/home/HomeHeroSection";
import { HomeHeader } from "../components/home/HomeHeader";
import { Upload, Sparkles, Terminal } from 'lucide-react';
import "../styles/AcademicThemeStyles.css";
const HomeCommunityStrip = lazy(() => import('../components/home/HomeCommunityStrip').then(m => ({ default: m.HomeCommunityStrip })));
const HomeDashboardFeedPanel = lazy(() => import('../components/home/HomeNotificationsStrip').then(m => ({ default: m.HomeDashboardFeedPanel })));
import { HomeStoriesStrip } from '../components/home/HomeStoriesStrip';
import { BackToTopButton } from '../components/home/BackToTopButton';
import { MobileBottomNav } from '../components/home/MobileBottomNav';
import { HomeNotificationsPanel } from '../components/home/HomeNotificationsStrip';
import { usePullToRefresh, useSwipeGesture } from '../hooks/useSwipeGesture';
import { HomeSideNav, SIDEBAR_WIDTH_FULL, SIDEBAR_WIDTH_MINI } from '../components/nav/HomeSideNav';
import { SectionErrorFallback, SkeletonBlock } from '../components/home/HomeSkeletons';
import { SectionShell } from "../components/ui/SectionShell";
import { useUiTokens } from "../styles/uiTokens";
import { useScrollSpy } from "../hooks/useScrollSpy";
import { EnhancedErrorBoundary } from '../components/ui/EnhancedErrorBoundary';

const HomeEnhancementsSection = lazy(() => import('../components/home/HomeEnhancementsSection').then(m => ({ default: m.HomeEnhancementsSection })));
import GlobalBurgerMenu from "../components/GlobalBurgerMenu";
import { CompactExpandedToggle } from "../components/ui/CompactExpandedToggle";
import { SectionHeader } from "../components/ui/SectionHeader";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { useUserData } from "../context/UserDataContext";
import { trackDocument } from "../lib/analytics";
import { useDocumentStatus } from "../hooks/useDocumentStatus";
import { useIdentitySyncStatus } from "../hooks/home/useIdentitySyncStatus";
import { ChatImportModal } from "../features/chat-import";

export default function Home() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const { colors, isDark } = useTheme();
  const isMobile = useIsMobile();
  const { t } = useLanguage();
  const { getStatus: getDocStatus, cycleStatus: cycleDocStatus } = useDocumentStatus();
  const isCompactHome = location.pathname === "/home-compact";
  const {
    syncStatus: identitySync,
    syncing: identitySyncing,
    autoSync: handleIdentityAutoSync,
    lastSyncedAt: identityLastSyncedAt,
  } = useIdentitySyncStatus();

  const { loading: uploadsLoading } = useLoading();
  const { loading: deleteLoading } = useLoading();
  const { uploading, progress, upload: uploadWithProgress, reset: resetUpload, error: uploadError } = useFileUpload();

  const { execute: executeFetch } = useLoading();
  const tourSteps = getHomeTourSteps(t, isMobile);
  const { startTour: startHomeTour, TourComponent: HomeTourComponent } = useTour(tourSteps, "homeTourSeen");

  // Sidebar
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem("sidenav-collapsed") === "true"; } catch { return false; }
  });
  const currentSidebarWidth = (!isCompactHome && !isMobile) ? (sidebarCollapsed ? SIDEBAR_WIDTH_MINI : SIDEBAR_WIDTH_FULL) : 0;

  // Listen for triggerUpload event
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    const handler = () => fileInputRef.current?.click();
    window.addEventListener("triggerUpload", handler);
    return () => window.removeEventListener("triggerUpload", handler);
  }, []);

  // BurgerMenu Upload from other pages
  useEffect(() => {
    const state = location.state as { triggerUpload?: boolean } | null;
    if (state?.triggerUpload) {
      nav(".", { replace: true, state: undefined });
      setTimeout(() => fileInputRef.current?.click(), 50);
    }
  }, [location.state, nav]);

  // Widget view mode
  const [homeWidgetViewMode, setHomeWidgetViewMode] = useState<"grid" | "carousel3d" | "carousel">(() => {
    const saved = localStorage.getItem("homeWidgetViewMode");
    return (saved === "carousel3d" || saved === "carousel") ? saved : "grid";
  });
  const updateViewMode = useCallback((mode: "grid" | "carousel3d" | "carousel") => {
    setHomeWidgetViewMode(mode);
    localStorage.setItem("homeWidgetViewMode", mode);
  }, []);

  // Drag-drop
  const [isDragOver, setIsDragOver] = useState(false);

  // Recently viewed docs
  const [recentlyViewedDocs, setRecentlyViewedDocs] = useState<number[]>(() => {
    const stored = localStorage.getItem('recentlyViewedDocuments');
    return stored ? JSON.parse(stored) : [];
  });

  const setLoading = (_key: string, _loading: boolean) => {};

  // State + Operations
  const state = useHomeState();
  const {
    hasFetchedRef, setSegSummary,
    file, setFile, fileError, setFileError,
    documentId, setDocumentId,
    mode, setMode,
    concepts, setConcepts, conceptInput, setConceptInput,
    segments, setSegments,
    status, setStatus,
    uploads,
    openSeg, setOpenSeg, copied,
    query, setQuery, modeFilter, setModeFilter,
    selectedUpload, localDuplicateHint, canSegment,
    filteredSegments, segSummaryByMode, isSegmenting,
  } = state;

  // Modals (extracted hook)
  const modals = useHomeModals(setStatus);

  // Keyboard shortcuts (extracted hook)
  useHomeKeyboard({
    setGlobalSearchOpen: modals.setGlobalSearchOpen,
    homeWidgetViewMode,
    updateViewMode,
    fileInputRef,
  });

  // Segment view mode
  const [segmentViewMode, setSegmentViewMode] = useState<"table" | "cards">(() => {
    const saved = localStorage.getItem("homeSegmentViewMode");
    return saved === "cards" ? "cards" : "table";
  });
  const handleSegmentViewModeChange = useCallback((mode: "table" | "cards") => {
    setSegmentViewMode(mode);
    localStorage.setItem("homeSegmentViewMode", mode);
  }, []);

  // Track document views
  useEffect(() => {
    if (documentId) {
      trackDocument("view", documentId);
      setRecentlyViewedDocs(prev => {
        const filtered = prev.filter(id => id !== documentId);
        const updated = [documentId, ...filtered].slice(0, 10);
        localStorage.setItem('recentlyViewedDocuments', JSON.stringify(updated));
        return updated;
      });
    }
  }, [documentId]);

  // Sync uploads to localStorage
  useEffect(() => {
    if (uploads && Array.isArray(uploads)) {
      try { localStorage.setItem("uploads", JSON.stringify(uploads)); } catch {}
    }
  }, [uploads]);

  const ops = useHomeOperations(state, setLoading, uploadWithProgress, resetUpload, uploadError, executeFetch);
  const { fetchUploads, loadSegmentationSummary, doUpload, segmentDoc, loadSegments, deleteSelectedUpload, copyOpenSegment, exportOpenSegmentTxt } = ops;

  const uploadsList = useMemo(() => Array.isArray(uploads) ? uploads : [], [uploads]);
  const parsedCount = useMemo(() => uploadsList.filter((u: any) => u.parseStatus === "ok").length, [uploadsList]);
  const pendingCount = useMemo(() => uploadsList.filter((u: any) => u.parseStatus === "pending").length, [uploadsList]);
  const failedCount = useMemo(() => uploadsList.filter((u: any) => u.parseStatus === "failed" || u.parseStatus === "error").length, [uploadsList]);
  const totalStorageBytes = useMemo(() => uploadsList.reduce((sum: number, u: any) => sum + (u.sizeBytes || 0), 0), [uploadsList]);
  const totalSegments = useMemo(() => Object.values(segSummaryByMode || {}).reduce((sum, row: any) => sum + (row?.count || 0), 0), [segSummaryByMode]);
  const connectedIdentitySources = useMemo(
    () => Object.values(identitySync.connectors).filter(conn => conn.status === "connected").length,
    [identitySync.connectors]
  );
  const identitySummaryLine = useMemo(() => {
    if (uploadsList.length === 0 && connectedIdentitySources === 0) return t("home.identitySummary.empty");
    return t("home.identitySummary.rich", {
      docs: uploadsList.length.toLocaleString(),
      segments: totalSegments.toLocaleString(),
      sources: connectedIdentitySources,
    }) || null;
  }, [uploadsList.length, totalSegments, connectedIdentitySources, t]);

  // Social activity tracking
  const { addActivity: addSocialActivity, refreshStats: refreshSocialStats, stats, activity } = useUserData();
  const prevUploadCountRef = useRef<number | null>(null);
  useEffect(() => {
    if (prevUploadCountRef.current === null) { prevUploadCountRef.current = uploadsList.length; return; }
    if (uploadsList.length > prevUploadCountRef.current) {
      const newest: any = uploadsList[0];
      if (newest) {
        addSocialActivity({ type: "upload", title: `Uploaded: ${newest.filename || "document"}`, description: newest.parseStatus || "" });
        refreshSocialStats();
      }
    }
    prevUploadCountRef.current = uploadsList.length;
  }, [uploadsList.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (user) {
      fetchUploads();
      hasFetchedRef.current = true;
      const savedDocId = localStorage.getItem('selectedDocumentId');
      if (savedDocId && !documentId) setDocumentId(Number(savedDocId));
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (user && location.pathname === '/' && hasFetchedRef.current) {
      const baseCacheKey = `cache:${window.location.protocol}//${window.location.hostname}:8000/api/uploads`;
      apiCache.deleteByPrefix(baseCacheKey);
      fetchUploads().then(() => {
        if (documentId) {
          const upload = uploads.find((u) => u.documentId === documentId);
          if (!upload) setDocumentId(null);
          else if (upload.parseStatus === "ok" && !canSegment) setDocumentId(documentId);
        }
      });
    }
  }, [location.pathname, user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (documentId) loadSegmentationSummary(documentId);
    else setSegSummary([]);
  }, [documentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const widgetRendererParams = {
    t, uploads, uploadsList, documentId, recentlyViewedDocs,
    userEmail: user?.email ?? null,
    parsedCount, pendingCount, failedCount, totalSegments, totalStorageBytes,
  };

  const tokens = useUiTokens();
  const sectionNavItems = useMemo(() => [
    { id: "identity-stack", label: t("home.section.identity") || "Identity" },
    { id: "insights-zone", label: t("home.section.insights") || "Insights" },
    { id: "workflow-orchestration", label: t("home.section.workflow") || "Workflow" },
    { id: "community-hub", label: t("home.section.community") || "Community" },
  ], [t]);
  const activeSectionId = useScrollSpy(sectionNavItems.map((item) => item.id));
  const activeSectionIndex = Math.max(0, sectionNavItems.findIndex((item) => item.id === activeSectionId));
  const scrollToSection = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // Pull-to-refresh: refresh uploads and segments on mobile
  const handlePullRefresh = useCallback(async () => {
    await fetchUploads();
    if (documentId) await loadSegmentationSummary(documentId);
  }, [fetchUploads, documentId, loadSegmentationSummary]);

  usePullToRefresh({
    onRefresh: handlePullRefresh,
    enabled: isMobile,
    threshold: 80,
  });

  // Swipe right from left edge → open burger menu
  useSwipeGesture({
    direction: 'right',
    edgeZone: 30,
    threshold: 60,
    enabled: isMobile,
    onSwipe: useCallback(() => {
      // Dispatch custom event that GlobalBurgerMenu listens for
      window.dispatchEvent(new CustomEvent('openBurgerMenu'));
    }, []),
  });

  const recentUploads = useMemo(() => uploadsList.slice(0, 5), [uploadsList]);

  return (
    <div
      className="min-h-screen homeShell home-container home-shell-content"
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true); }}
      onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); if (e.currentTarget === e.target) setIsDragOver(false); }}
      onDrop={(e) => {
        e.preventDefault(); e.stopPropagation(); setIsDragOver(false);
        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile) {
          const error = validateFile(droppedFile, { maxSizeMB: 50, allowedTypes: ['.docx', '.doc', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'] });
          if (error) { setFileError(error); } else { setFile(droppedFile); setFileError(null); }
        }
      }}
      style={{
        position: "relative",
        background: `hsl(var(--background))`,
        maxWidth: 1600,
        margin: "0 auto",
        color: "hsl(var(--foreground))",
        paddingLeft: isMobile ? "8px" : `${currentSidebarWidth - 8}px`,
        paddingRight: isMobile ? "8px" : "32px",
        paddingBottom: isMobile ? "64px" : "32px",
        paddingTop: isMobile ? "52px" : "82px",
        transition: "padding-left 0.22s cubic-bezier(0.4,0,0.2,1)",
        fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        minHeight: "100vh",
        overflowX: "hidden",
      }}
    >
      {/* Skip to main content */}
      <a
        href="#main-content"
        style={{
          position: "absolute", left: "-9999px", top: "8px", zIndex: 9999,
          padding: "8px 16px", background: "hsl(var(--primary))", color: "white",
          borderRadius: "4px", textDecoration: "none", fontWeight: 600, fontSize: "14px",
        }}
        onFocus={(e) => { e.currentTarget.style.left = "8px"; }}
        onBlur={(e) => { e.currentTarget.style.left = "-9999px"; }}
      >
        Skip to main content
      </a>

      <GlobalBurgerMenu />

      {!isCompactHome && !isMobile && (
        <HomeSideNav onCollapsedChange={(collapsed) => setSidebarCollapsed(collapsed)} />
      )}

      {/* Drag-drop overlay */}
      {isDragOver && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: isDark ? "hsl(var(--info) / 0.12)" : "hsl(var(--info) / 0.08)",
          backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          border: `3px dashed hsl(var(--info) / 0.5)`, borderRadius: "16px",
          pointerEvents: "none",
        }}>
          <div style={{
            padding: "32px", borderRadius: "20px",
            background: isDark ? "hsl(var(--background) / 0.95)" : "hsl(var(--card) / 0.97)",
            border: `1px solid hsl(var(--info) / 0.4)`,
            textAlign: "center",
            boxShadow: isDark ? "0 24px 48px hsl(var(--background) / 0.6)" : "0 24px 48px hsl(var(--foreground) / 0.1)",
          }}>
            <Upload style={{ width: "48px", height: "48px", marginBottom: "12px", color: "hsl(var(--info))" }} />
            <div style={{ fontSize: "18px", fontWeight: 700, color: "hsl(var(--primary))" }}>
              {t("action.upload") || "Drop file to upload"}
            </div>
            <div style={{ fontSize: "13px", color: "hsl(var(--muted-foreground))", marginTop: "8px" }}>.docx, .doc — max 50MB</div>
          </div>
        </div>
      )}

      {!isMobile && (
        <CompactExpandedToggle
          mode={isCompactHome ? "compact" : "expanded"}
          onModeChange={(mode) => nav(mode === "compact" ? "/home-compact" : "/")}
        />
      )}

      <style>{getHomeStyles(colors)}</style>

      <main id="main-content" style={{ outline: "none" }} tabIndex={-1}>
        <div style={{ display: "flex", flexDirection: "column", gap: `${tokens.spacing.md}px` }}>
          {/* Section navigation bar (when sidebar collapsed) */}
          {!isCompactHome && sidebarCollapsed && !isMobile && (
            <nav
              aria-label="Section navigation"
              style={{
                display: "flex", alignItems: "center", gap: tokens.spacing.sm,
                padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
                borderRadius: "var(--radius)",
                border: `1px solid hsl(var(--border))`,
                background: `hsl(var(--card) / 0.85)`,
                backdropFilter: "blur(10px)",
              }}
            >
              <div style={{ height: 3, flex: "0 0 40px", borderRadius: 999, background: "hsl(var(--muted))", overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 999, background: "hsl(var(--primary))",
                  width: `${Math.max(10, ((activeSectionIndex + 1) / sectionNavItems.length) * 100)}%`,
                  transition: "width 0.35s cubic-bezier(0.4,0,0.2,1)",
                }} />
              </div>
              {sectionNavItems.map((item) => {
                const isActive = activeSectionId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    style={{
                      padding: "4px 10px", borderRadius: "var(--radius)", border: "none",
                      background: isActive ? "hsl(var(--primary) / 0.12)" : "transparent",
                      color: isActive ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                      fontSize: "12px", fontWeight: isActive ? 700 : 500,
                      cursor: "pointer", transition: "all 0.15s ease", whiteSpace: "nowrap",
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: `${tokens.spacing.lg}px` }}>
            {/* ── 1. Header ── */}
            <div style={{
              borderRadius: isMobile ? 10 : 16,
              background: `hsl(var(--card))`,
              boxShadow: isDark ? "0 14px 36px hsl(var(--background) / 0.58)" : "0 8px 24px hsl(var(--foreground) / 0.08)",
              padding: isMobile ? "8px 10px" : "14px 16px",
              margin: isMobile ? "0" : "0 18px",
            }}>
              <HomeHeader
                user={user}
                onLogout={logout}
                onSearchClick={() => modals.setGlobalSearchOpen(true)}
                onUploadClick={() => fileInputRef.current?.click()}
                onNavigate={nav}
                homeWidgetViewMode={homeWidgetViewMode}
                onViewModeChange={updateViewMode}
              />
            </div>

            {/* ── 2. Stories Strip — hide on mobile */}
            {!isCompactHome && !isMobile && (
              <div style={{ marginBottom: `-${tokens.spacing.sm}px` }}>
                <HomeStoriesStrip />
              </div>
            )}

            {/* ── 3. Workflow Orchestration (primary user task) ── */}
            <SectionShell
              id="workflow-orchestration"
              title={t("home.section.workflow") || "Workflow orchestration"}
              description={t("home.section.workflowDesc") || "Upload, segment, and review documents."}
              variant="glass"
              padding="lg"
              gap={tokens.spacing.lg}
            >
              <EnhancedErrorBoundary componentName="HomeQuickActions" fallback={<SectionErrorFallback section="quick actions" />}>
                <AcademicQuickActions
                  canSegment={canSegment}
                  onSegment={segmentDoc}
                  onImportChats={() => modals.setChatImportModalOpen(true)}
                  onBrowseConversations={() => modals.setConversationBrowserOpen(true)}
                  onUpload={() => fileInputRef.current?.click()}
                  onSearch={() => modals.setGlobalSearchOpen(true)}
                  onAI={() => window.dispatchEvent(new CustomEvent('toggleAIChat'))}
                  onAnalytics={() => nav('/research/analytics')}
                  onSubmit={() => nav('/releases')}
                  onCollaborate={() => nav('/teams')}
                  isCompact={isCompactHome}
                />
              </EnhancedErrorBoundary>

              <HomeDocumentPicker
                uploads={uploads}
                documentId={documentId}
                setDocumentId={setDocumentId}
                setSegments={setSegments}
                setOpenSeg={setOpenSeg}
                setQuery={setQuery}
                setModeFilter={setModeFilter}
                selectedUpload={selectedUpload}
                uploadsLoading={uploadsLoading}
                deleteLoading={deleteLoading}
                fetchUploads={fetchUploads}
                deleteSelectedUpload={deleteSelectedUpload}
                loadSegmentationSummary={loadSegmentationSummary}
                segSummaryByMode={segSummaryByMode}
                canSegment={canSegment}
                getDocStatus={getDocStatus}
                cycleDocStatus={cycleDocStatus}
                onImportChats={() => modals.setChatImportModalOpen(true)}
                onBrowseConversations={() => modals.setConversationBrowserOpen(true)}
                onNavigate={nav}
              />

              <HomeUploadFlow
                fileInputRef={fileInputRef}
                file={file}
                setFile={setFile}
                fileError={fileError}
                setFileError={setFileError}
                validateFile={validateFile}
                uploading={uploading}
                progress={progress}
                uploadError={uploadError}
                doUpload={doUpload}
                localDuplicateHint={localDuplicateHint}
              />

              <HomeSegmentationControls
                mode={mode}
                setMode={setMode}
                documentId={documentId}
                canSegment={canSegment}
                isSegmenting={isSegmenting}
                selectedUpload={selectedUpload}
                keywordInput={state.keywordInput}
                setKeywordInput={state.setKeywordInput}
                keywords={state.keywords}
                setKeywords={state.setKeywords}
                conceptInput={conceptInput}
                setConceptInput={setConceptInput}
                concepts={concepts}
                setConcepts={setConcepts}
                onSegment={segmentDoc}
                onListSegments={loadSegments}
                setStatus={setStatus}
              />

              {status && (
                <div
                  aria-live="polite"
                  style={{
                    padding: "14px",
                    background: isDark ? "hsl(var(--info) / 0.12)" : "hsl(var(--info) / 0.08)",
                    border: `1px solid ${isDark ? "hsl(var(--info) / 0.25)" : "hsl(var(--info) / 0.18)"}`,
                    borderRadius: tokens.radii.md,
                    color: "hsl(var(--info))",
                    fontSize: tokens.typography.bodyMD.fontSize,
                    fontWeight: 500,
                  }}
                >
                  {status}
                </div>
              )}

              <HomeSegmentViewer
                segments={segments}
                filteredSegments={filteredSegments}
                query={query}
                setQuery={setQuery}
                modeFilter={modeFilter}
                setModeFilter={setModeFilter}
                segmentViewMode={segmentViewMode}
                onViewModeChange={handleSegmentViewModeChange}
                openSeg={openSeg}
                onPickSegment={(seg) => setOpenSeg(seg as any)}
              />
            </SectionShell>

            {/* ── 4. Insights & Activity ── */}
            <SectionShell
              id="insights-zone"
              title={t("home.section.insights") || "Insights & activity"}
              description={t("home.section.insightsDesc") || "Monitor notifications, timeline, and progress narratives."}
              variant="subtle"
            >
              <div id="notification-panel" style={{ marginBottom: tokens.spacing.md }}>
                <HomeNotificationsPanel defaultOpen={false} />
              </div>
              <EnhancedErrorBoundary componentName="ResearchTimeline" fallback={<SectionErrorFallback section="research timeline" onRetry={fetchUploads} />}>
                <ResearchTimelineSection
                  parsedCount={parsedCount}
                  totalSegments={totalSegments}
                  recentUploads={recentUploads}
                  activity={activity}
                  stats={stats}
                  getDocStatus={getDocStatus}
                  cycleDocStatus={cycleDocStatus}
                  isLoading={uploadsLoading && uploadsList.length === 0}
                />
              </EnhancedErrorBoundary>
            </SectionShell>

            {/* ── 5. Identity + Community (merged) ── */}
            <SectionShell
              id="identity-community"
              title={t("home.section.identityTitle") || "Research identity stack"}
              description={t("home.section.identitySubtitle") || "Sync connectors, monitor metrics, and jump into core actions."}
              variant="elevated"
              style={{ paddingBottom: "0.5em" }}
              gap={tokens.spacing.lg}
            >
              <HomeHeroSection
                user={user}
                onLogout={logout}
                onSearchClick={() => modals.setGlobalSearchOpen(true)}
                onUploadClick={() => fileInputRef.current?.click()}
                onNavigate={nav}
                homeWidgetViewMode={homeWidgetViewMode}
                onViewModeChange={updateViewMode}
                uploadsList={uploadsList}
                parsedCount={parsedCount}
                totalSegments={totalSegments}
                uploadsLoading={uploadsLoading}
                isCompactHome={isCompactHome}
                identitySync={identitySync}
                identitySyncing={identitySyncing}
                onIdentityAutoSync={handleIdentityAutoSync}
                identityLastSyncedAt={identityLastSyncedAt ?? null}
                identitySummaryLine={identitySummaryLine}
              />

              <HomeCarouselViews
                isCompactHome={isCompactHome}
                homeWidgetViewMode={homeWidgetViewMode}
                uploads={uploads}
                uploadsList={uploadsList}
                documentId={documentId}
                recentlyViewedDocs={recentlyViewedDocs}
                userEmail={user?.email ?? null}
                parsedCount={parsedCount}
                pendingCount={pendingCount}
                failedCount={failedCount}
                totalSegments={totalSegments}
                totalStorageBytes={totalStorageBytes}
                onUploadClick={() => fileInputRef.current?.click()}
                onSearchClick={() => modals.setGlobalSearchOpen(true)}
                onLibraryClick={() => nav("/library")}
                onResearchClick={() => nav("/research")}
                onCarouselWidgetClick={modals.handleCarouselWidgetClick}
              />

              {!isMobile && (
                <div>
                  <SectionHeader
                    icon={<Sparkles style={{ width: 18, height: 18 }} />}
                    title={t("home.enhancementsHub") || "Insights hub"}
                    subtitle={t("home.enhancementsDesc") || "Activity, documents, community & analytics — grouped by category"}
                    size="sm"
                  />
                  <Suspense
                    fallback={
                      <div style={{ display: "flex", flexDirection: "column", gap: tokens.spacing.sm, marginTop: tokens.spacing.md }}>
                        <SkeletonBlock height="120px" />
                        <SkeletonBlock height="120px" />
                      </div>
                    }
                  >
                    <HomeEnhancementsSection
                      uploads={uploads}
                      documentId={documentId}
                      recentlyViewedDocs={recentlyViewedDocs}
                      userEmail={user?.email ?? null}
                      isCompactHome={isCompactHome}
                      homeWidgetViewMode={homeWidgetViewMode}
                    />
                  </Suspense>
                </div>
              )}

              {!isMobile && (
                <Suspense fallback={null}>
                  <HomeDashboardFeedPanel defaultOpen={false} />
                </Suspense>
              )}
              {/* Community strip — hide on mobile (accessible via bottom nav "Community" tab) */}
              {!isMobile && (
                <Suspense fallback={null}>
                  <HomeCommunityStrip isCompact={isCompactHome} />
                </Suspense>
              )}
            </SectionShell>
          </div>
        </div>
      </main>

      {/* Side panels & modals */}
      <SegmentSidePanel
        openSeg={openSeg}
        onClose={() => setOpenSeg(null)}
        copied={copied}
        onCopy={copyOpenSegment}
        onExportTxt={exportOpenSegmentTxt}
      />

      <HomeTourComponent />

      {/* Tour button — hide on mobile */}
      {!isMobile && (
        <button
          className="tour-launch-btn"
          onClick={startHomeTour}
          title={t("home.startTourTitle") || "Start guided workspace tour"}
          style={{
            position: "fixed", top: "16px", right: "24px",
            width: "48px", height: "48px", borderRadius: "12px",
            background: isDark
              ? `linear-gradient(135deg, hsl(var(--success) / 0.75), hsl(var(--success) / 0.6))`
              : `linear-gradient(135deg, hsl(var(--success)), hsl(var(--success) / 0.85))`,
            border: "none", color: "white", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 4px 16px hsl(var(--success) / 0.32)`,
            transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
            zIndex: 99999,
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px) scale(1.05)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0) scale(1)"; }}
        >
          <Sparkles style={{ width: 20, height: 20 }} />
        </button>
      )}

      {/* Global Search */}
      <GlobalSearchModal
        isOpen={modals.globalSearchOpen}
        onClose={() => modals.setGlobalSearchOpen(false)}
      />

      <BackToTopButton />

      {/* FAB — AI Chat — desktop: wrapped in cluster. Mobile: AIChatManager self-positions as edge tab */}
      {isMobile ? (
        <AIChatManager />
      ) : (
        <div
          className="fab-cluster"
          style={{
            position: "fixed", bottom: "102px", right: "24px", zIndex: 50,
            display: "flex", flexDirection: "column-reverse", alignItems: "center", gap: "8px",
          }}
        >
          <AIChatManager />
        </div>
      )}

      {/* Chat Import */}
      <ChatImportModal
        isOpen={modals.chatImportModalOpen}
        onClose={() => modals.setChatImportModalOpen(false)}
        onImportComplete={modals.handleChatImportComplete}
      />

      <ConversationBrowserModal
        open={modals.conversationBrowserOpen}
        onClose={() => modals.setConversationBrowserOpen(false)}
        onSelectConversation={(conv) => {
          modals.setSelectedConversation(conv);
          modals.setConversationBrowserOpen(false);
        }}
        onViewAnalytics={() => {
          modals.setConversationBrowserOpen(false);
          modals.setConversationAnalyticsOpen(true);
        }}
        onImportClick={() => {
          modals.setConversationBrowserOpen(false);
          modals.setChatImportModalOpen(true);
        }}
      />

      <ConversationAnalyticsModal
        open={modals.conversationAnalyticsOpen}
        onClose={() => modals.setConversationAnalyticsOpen(false)}
      />

      <WidgetPopupModal
        widgetPopup={modals.widgetPopup}
        onClose={() => modals.setWidgetPopup(null)}
        renderWidgetById={(id) => renderWidgetById(id, widgetRendererParams)}
      />

      <ConversationViewerModal
        conversation={modals.selectedConversation}
        onClose={() => modals.setSelectedConversation(null)}
      />

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <MobileBottomNav
          activeSection={activeSectionId}
          onNavigate={scrollToSection}
        />
      )}
    </div>
  );
}
