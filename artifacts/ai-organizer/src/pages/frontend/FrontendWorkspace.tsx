import { useState, useEffect, useMemo } from "react";
import { useIsMobile } from "../../hooks/use-mobile";
import { PendingBar } from "./components/PendingBar";
import { ResultsList } from "./components/ResultsList";
import { SearchPanel } from "./components/SearchPanel";
import { Topbar } from "./components/Topbar";
import { FloatingNotepads } from "./components/FloatingNotepads";
import { DocumentPickerPanel } from "../../components/DocumentPickerPanel";
import { SegmentsList } from "./components/SegmentsList";
import { EnhancedCompareModal } from "./components/EnhancedCompareModal";
import { PreviewDrawer } from "./components/PreviewDrawer";
import { FooterHelp } from "./components/FooterHelp"; // TODO: consider removing — keyboard shortcuts modal already exists
import { useFrontendWorkspace } from "./hooks/useFrontendWorkspace";
import { ErrorBoundary } from "../../components/ErrorBoundary";
import { useTour } from "../../components/UniversalTourGuide";
import GlobalBurgerMenu from "../../components/GlobalBurgerMenu";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import {
  type WorkspaceUIMode,
  UI_MODE_STORAGE_KEY,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "./styles/workspaceConstants";
import { RightSidebarPanels } from "./components/RightSidebarPanels";
import { WorkspaceModals } from "./components/WorkspaceModals";
import { QuickActionsBar } from "./components/QuickActionsBar";
import { SegmentsCarouselSection } from "./components/SegmentsCarouselSection";
import { SlotsGridSection } from "./components/SlotsGridSection";
import { createWorkspaceTourSteps } from "./config/workspaceTourSteps";
import { FrontendMobileBottomNav } from "./components/FrontendMobileBottomNav";
import "katex/dist/katex.min.css";
import workspaceCss from "./FrontendWorkspace.css?raw";

// Analytics widgets (used in expanded mode)
import AIInsightsAnalytics from "../../components/AIInsightsAnalytics";
import DocumentEngagementMetrics from "../../components/DocumentEngagementMetrics";
import ResearchProgressTracking from "../../components/ResearchProgressTracking";
import PerformanceMonitoring from "../../components/PerformanceMonitoring";
import DataAnalytics from "../../components/DataAnalytics";
import NotificationCenter from "../../components/NotificationCenter";
import AdvancedSearch from "../../components/AdvancedSearchSimple";
import { CarouselView } from "../../components/CarouselView";
import { Carousel3DView } from "../../components/Carousel3DView";

export default function FrontendWorkspace() {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const isMobile = useIsMobile();

  const [uiMode, setUiMode] = useState<WorkspaceUIMode>(() => {
    if (typeof window === "undefined") return "compact";
    return window.localStorage.getItem(UI_MODE_STORAGE_KEY) === "expanded" ? "expanded" : "compact";
  });

  // Force compact mode on mobile
  const effectiveUiMode = isMobile ? "compact" : uiMode;

  useEffect(() => {
    window.localStorage.setItem(UI_MODE_STORAGE_KEY, uiMode);
  }, [uiMode]);

  // Inject CSS
  useEffect(() => {
    const styleId = "thinking-workspace-mode-css";
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = workspaceCss;
  }, []);

  // ── All shared state + handlers from the unified hook ──
  const ws = useFrontendWorkspace();

  // Tour
  const frontendTourSteps = createWorkspaceTourSteps();
  const { startTour, TourComponent: FrontendWorkspaceTour } = useTour(frontendTourSteps, "frontendWorkspaceTourSeen");

  // Expanded mode: analytics view mode
  const [analyticsViewMode, setAnalyticsViewMode] = useState<"grid" | "carousel" | "carousel3d">("grid");
  const [mobileActivePanel, setMobileActivePanel] = useState<string | null>(null);

  const analyticsWidgets = useMemo(() => [
    { id: "engagement", title: t("workspace.hub.engagement"), icon: "📊", renderCard: () => <DocumentEngagementMetrics documentId={1} timeframe="week" /> },
    { id: "research", title: t("workspace.hub.research"), icon: "🎯", renderCard: () => <ResearchProgressTracking documentId={1} /> },
    { id: "ai", title: t("workspace.hub.ai"), icon: "🧠", renderCard: () => <AIInsightsAnalytics documentId={1} /> },
    { id: "performance", title: t("workspace.hub.performance"), icon: "🛰️", renderCard: () => <PerformanceMonitoring /> },
    { id: "data", title: t("workspace.hub.data"), icon: "📈", renderCard: () => <DataAnalytics /> },
    { id: "notifications", title: t("workspace.hub.notifications"), icon: "🔔", renderCard: () => <NotificationCenter /> },
    { id: "search", title: t("workspace.hub.search"), icon: "🔍", renderCard: () => <AdvancedSearch /> },
  ], [t]);

  return (
    <ErrorBoundary>
      <div
        className="frontendShell"
        style={{ fontFamily: "var(--font-family-sans)", letterSpacing: "var(--letter-spacing-normal)" }}
      >
        {/* ── Mode toggle (fixed top-center) — hidden on mobile ── */}
        {!isMobile && (
          <div
            style={{
              position: "fixed",
              top: 16,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 10002,
              display: "flex",
              gap: 8,
              padding: 8,
              borderRadius: 12,
              border: "1px solid hsl(var(--border) / 0.3)",
              background: "transparent",
            }}
          >
            {(["compact", "expanded"] as const).map((mode) => (
              <button
                key={mode}
                className="chipBtn"
                type="button"
                onClick={() => setUiMode(mode)}
                aria-pressed={uiMode === mode}
                style={uiMode === mode ? {
                  borderColor: "hsl(var(--primary))",
                  color: "hsl(var(--primary))",
                  background: "hsl(var(--primary) / 0.1)",
                } : undefined}
              >
                {mode === "compact" ? `⊟ ${t("view.compact")}` : `⊞ ${t("view.expanded")}`}
              </button>
            ))}
          </div>
        )}

        {/* ── Topbar ── */}
        <Topbar
          title={t("app.title")}
          subtitle={t("thinking.title")}
          stats={ws.stats}
          hasPending={!!ws.pending.pending}
          onClearPending={ws.pending.clearPending}
        />

        <PendingBar
          pendingHit={ws.pending.pending}
          pendingSegment={
            ws.pendingSegment
              ? { id: String(ws.pendingSegment.id), title: ws.pendingSegment.title || `Segment ${ws.pendingSegment.id}` }
              : null
          }
          manualConfirm={ws.pending.manualConfirm}
        />

        {/* ── Expanded mode: Analytics dashboard ── */}
        {effectiveUiMode === "expanded" && (
          <div
            className="analytics-section"
            style={{
              padding: "40px",
              background: "hsl(var(--card) / 0.95)",
              borderBottom: "1px solid hsl(var(--border))",
              backdropFilter: "blur(32px)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2
                style={{
                  color: "hsl(var(--foreground))",
                  fontSize: 28,
                  fontWeight: 700,
                  margin: 0,
                  background: "linear-gradient(135deg, hsl(var(--foreground)) 0%, hsl(var(--primary)) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {t("workspace.analyticsHub")}
              </h2>
              <div style={{ display: "flex", gap: 4, background: "hsl(var(--muted) / 0.5)", padding: 3, borderRadius: 10, border: "1px solid hsl(var(--border) / 0.5)" }}>
                {([
                  { key: "grid" as const, label: `⊞ ${t("workspace.gridView")}` },
                  { key: "carousel" as const, label: `⟷ ${t("workspace.carouselView")}` },
                  { key: "carousel3d" as const, label: `◇ ${t("workspace.carousel3DView")}` },
                ] as const).map((mode) => (
                  <button
                    key={mode.key}
                    className="btn-borderless"
                    onClick={() => setAnalyticsViewMode(mode.key)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 7,
                      border: "none",
                      background: analyticsViewMode === mode.key ? "hsl(var(--primary) / 0.3)" : "transparent",
                      color: analyticsViewMode === mode.key ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {analyticsViewMode === "carousel" ? (
              <CarouselView items={analyticsWidgets} cardMinWidth={420} cardMaxHeight="calc(100vh - 180px)" showDots showArrows visibleCount={2} />
            ) : analyticsViewMode === "carousel3d" ? (
              <Carousel3DView items={analyticsWidgets} cardHeight="calc(72vh - 38px)" showDots showArrows showNavigation sideScale={0.75} sideRotation={30} />
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 32, maxWidth: 1800, margin: "0 auto" }}>
                {analyticsWidgets.map((w) => <div key={w.id}>{w.renderCard()}</div>)}
              </div>
            )}
          </div>
        )}

        {/* ── Main layout ── */}
        <main
          className={[
            "layout",
            isMobile && "layout--mobile",
            !isMobile && ws.effectiveLeftCollapsed && "layout--leftCollapsed",
            !isMobile && ws.effectiveRightCollapsed && "layout--rightCollapsed",
            ws.focusMode && "layout--focus",
            !isMobile && !ws.effectiveLeftCollapsed && `layout--left-${ws.leftSidebarWidth}`,
            !isMobile && !ws.effectiveRightCollapsed && `layout--right-${ws.rightSidebarWidth}`,
          ].filter(Boolean).join(" ")}
        >
          {/* ── Left sidebar — hidden on mobile ── */}
          {!isMobile && (
          <aside className={`leftCol${ws.effectiveLeftCollapsed ? " isCollapsed" : ""} leftCol--${ws.leftSidebarWidth}`}>
            <div className="sideRail">
              <button className="railBtn sidebarWidthBtn" type="button" onClick={ws.cycleLeftSidebarWidth} aria-label="Cycle left sidebar width">
                {ws.effectiveLeftCollapsed ? "›" : ws.leftSidebarWidth === "narrow" ? "»" : "«"}
              </button>
              <button className="railBtn" type="button" onClick={() => { if (ws.focusMode) ws.setFocusMode(false); ws.setLeftCollapsed((prev) => !prev); }} aria-label="Toggle left sidebar">
                {ws.effectiveLeftCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
              </button>
              <button className="railBtn" type="button" onClick={() => ws.openLeftPanel("documents")} aria-label={t("nav.documents")}>📚</button>
              <button className="railBtn" type="button" onClick={() => ws.openLeftPanel("search")} aria-label={t("action.search")}>🔍</button>
              <button className="railBtn" type="button" onClick={() => ws.openLeftPanel("segments")} aria-label={t("workspace.segments")}>🧩</button>
            </div>

            <div className="sidePanels">
              {ws.leftPanelsOrder.map((panelId) => {
                if (panelId === "documents" && ws.showDocumentPanel) {
                  return (
                    <div key="documents" className="panelBlock">
                      <div className="rightHeader">
                        <div className="rightTitle">📚 {t("nav.documents")}</div>
                        <div className="rightActions">
                          <button className="chipBtn" onClick={() => ws.closeLeftPanel("documents")}>{t("action.close")}</button>
                        </div>
                      </div>
                      <DocumentPickerPanel onSegmentsChange={ws.setSegments} onUploadsChange={ws.setUploadsCount} />
                    </div>
                  );
                }
                if (panelId === "search" && ws.showSearchPanel) {
                  return (
                    <div key="search" className="panelBlock">
                      <div className="rightHeader">
                        <div className="rightTitle">🔍 {t("action.search")}</div>
                        <div className="rightActions">
                          <button className="chipBtn" onClick={() => ws.closeLeftPanel("search")}>{t("action.close")}</button>
                        </div>
                      </div>
                      <SearchPanel
                        query={ws.search.q} setQuery={ws.search.setQ}
                        k={ws.search.k} setK={ws.search.setK}
                        onSearch={ws.search.run} loading={ws.search.loading}
                        error={ws.search.err} resultsCount={ws.search.hits.length}
                      />
                      <div style={{ marginTop: 10 }}>
                        <ResultsList hits={ws.search.hits} activeId={ws.activeId} onPick={ws.handlePick} onExport={ws.handleExportResult} />
                      </div>
                    </div>
                  );
                }
                if (panelId === "segments" && ws.showSegmentsPanel) {
                  return (
                    <div key="segments" className="panelBlock" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
                      <div className="rightHeader">
                        <div className="rightTitle">🧩 {t("workspace.segments")}</div>
                        <div className="rightActions">
                          <div className="resultsCount">{ws.segments.length}</div>
                          <button className="chipBtn" onClick={() => ws.closeLeftPanel("segments")}>{t("action.close")}</button>
                        </div>
                      </div>
                      <SegmentsList
                        segments={ws.segments} query={ws.segmentQuery} setQuery={ws.setSegmentQuery}
                        onPick={ws.handlePickSegment} onExport={ws.handleExportSegment}
                        onBatchOpen={ws.handleBatchOpenSegments} onPin={ws.handlePinChunk}
                      />
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </aside>
          )}

          {/* ── Center workspace ── */}
          <section className="rightArea workspaceCol">
            <QuickActionsBar
              newFloatingNotepad={ws.slots.newFloatingNotepad}
              undoLast={ws.slots.undoLast}
              canUndo={ws.slots.canUndo}
              toggleStickyNotepad={ws.slots.toggleStickyNotepad}
              stickyEnabled={ws.slots.stickyEnabled}
              compareMode={ws.compareMode}
              setCompareMode={ws.setCompareMode}
              compareSlots={ws.compareSlots}
              onOpenEnhancedCompare={ws.handleOpenEnhancedCompare}
              onShowShortcuts={() => ws.setShowShortcutsHelp(true)}
            />

            <SegmentsCarouselSection
              segments={ws.segments}
              segViewMode={ws.segViewMode}
              setSegViewMode={ws.setSegViewMode}
              setSegCarouselFloated={ws.setSegCarouselFloated}
              setSegSlotDialog={ws.setSegSlotDialog}
              setSegPreviewModal={ws.setSegPreviewModal}
            />

            <SlotsGridSection
              slots={ws.slots.slots}
              lockedSlots={ws.slots.lockedSlots}
              pending={ws.pending.pending}
              slotsViewMode={ws.slotsViewMode}
              setSlotsViewMode={ws.setSlotsViewMode}
              setSlotsCarouselFloated={ws.setSlotsCarouselFloated}
              selectMode={ws.pending.selectMode}
              toggleSelectMode={ws.pending.toggleSelectMode}
              manualConfirm={ws.pending.manualConfirm}
              toggleManualConfirm={ws.pending.toggleManualConfirm}
              handleClickSlot={ws.handleClickSlot}
              closeSlot={ws.slots.closeSlot}
              onNotepadChange={ws.slots.onNotepadChange}
              openNotepadFromDoc={ws.slots.openNotepadFromDoc}
              onDragStart={ws.slots.onDragStart}
              onDragEnd={ws.slots.onDragEnd}
              onDropToSlot={ws.slots.onDropToSlot}
              placeTextIntoSlot={ws.slots.placeTextIntoSlot}
              toggleSlotLock={ws.slots.toggleSlotLock}
              renameSlot={ws.slots.renameSlot}
              addSlot={ws.slots.addSlot}
              compareMode={ws.compareMode}
              compareSlots={ws.compareSlots}
              setCompareSlots={ws.setCompareSlots}
              compareLeft={ws.compareLeft}
              compareRight={ws.compareRight}
              totalSlots={ws.slots.totalSlots}
              segmentsCount={ws.segments.length}
              pinnedCount={ws.slots.pinnedChunks.length}
              floatingPadsCount={ws.slots.floatingPads.length}
            />

            <div style={{ width: "100%", marginTop: 20 }}>
              <FooterHelp />
            </div>
          </section>

          {/* ── Right sidebar — hidden on mobile ── */}
          {!isMobile && (
          <aside className={`rightArea rightCol${ws.effectiveRightCollapsed ? " isCollapsed" : ""} rightCol--${ws.rightSidebarWidth}`}>
            <div className="sideRail">
              <button className="railBtn sidebarWidthBtn" type="button" onClick={ws.cycleRightSidebarWidth} aria-label="Cycle right sidebar width">
                {ws.effectiveRightCollapsed ? "‹" : ws.rightSidebarWidth === "narrow" ? "«" : "»"}
              </button>
              <button className="railBtn" type="button" onClick={() => { if (ws.focusMode) ws.setFocusMode(false); ws.setRightCollapsed((prev) => !prev); }} aria-label="Toggle right sidebar">
                {ws.effectiveRightCollapsed ? <ChevronLeftIcon /> : <ChevronRightIcon />}
              </button>
              {(
                [
                  { id: "ai" as const, icon: "🧠", label: t("workspace.panel.aiInsights") },
                  { id: "engagement" as const, icon: "📊", label: t("workspace.panel.engagementMetrics") },
                  { id: "research" as const, icon: "🎯", label: t("workspace.panel.researchProgress") },
                  { id: "performance" as const, icon: "🛰️", label: t("workspace.panel.performanceMonitoring") },
                  { id: "data" as const, icon: "📈", label: t("workspace.panel.dataAnalytics") },
                  { id: "notifications" as const, icon: "🔔", label: t("workspace.panel.notifications") },
                  { id: "search" as const, icon: "🔍", label: t("workspace.panel.advancedSearch") },
                  { id: "pinned" as const, icon: "📌", label: t("workspace.panel.pinnedChunks") },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  className="railBtn"
                  type="button"
                  onClick={() => ws.toggleHubSection(item.id)}
                  aria-label={item.label}
                  title={`${item.icon} ${item.label}`}
                >
                  {item.icon}
                </button>
              ))}
            </div>

            <div className="sidePanels">
              <RightSidebarPanels
                hubSectionsOrder={ws.hubSectionsOrder}
                screenshotModeActive={false}
                closeHubSection={ws.closeHubSection}
                pinnedChunks={ws.slots.pinnedChunks}
                onUnpin={ws.handleUnpinChunk}
                onOpenPinned={ws.handleOpenPinned}
                onClearPinned={ws.slots.clearPinnedChunks}
              />
            </div>
          </aside>
          )}

          {/* ── Floating elements ── */}
          <FloatingNotepads
            pads={ws.slots.floatingPads}
            onClose={ws.slots.closeFloatingPad}
            onChange={ws.slots.updateFloatingPad}
            onBringToFront={ws.slots.bringToFront}
            onDownload={ws.slots.downloadFloatingPad}
            onDock={(id) => ws.slots.dockFloatingToSlot(id)}
            onAdd={() => ws.slots.newFloatingNotepad()}
          />
          <PreviewDrawer
            isOpen={ws.showPreview}
            onClose={() => ws.setShowPreview(false)}
            item={ws.previewItem}
            onOpen={ws.handlePreviewOpen}
          />
          <EnhancedCompareModal
            chunks={ws.getCompareChunks()}
            isOpen={ws.showEnhancedCompare}
            onClose={() => ws.setShowEnhancedCompare(false)}
          />
          <FrontendWorkspaceTour />

          {/* Keyboard Shortcuts Modal */}
          {ws.showShortcutsHelp && (
            <div className="passwordDialogOverlay" onClick={() => ws.setShowShortcutsHelp(false)}>
              <div className="passwordDialog" onClick={(e) => e.stopPropagation()} style={{ minWidth: 420, maxWidth: 520, padding: "24px 28px" }}>
                <h3 style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  ⌨️ {t("workspace.keyboardShortcuts") || "Keyboard Shortcuts"}
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 20px", fontSize: 13 }}>
                  {[
                    { keys: "Ctrl + N", action: t("workspace.newNotepad") },
                    { keys: "Ctrl + M", action: t("workspace.compare") },
                    { keys: "Ctrl + Z", action: t("workspace.undo") },
                    { keys: "Ctrl + F", action: t("workspace.focusMode") },
                    { keys: "Ctrl + 1-9", action: t("workspace.shortcutSlotFocus") },
                    { keys: "Alt + 1-9", action: t("workspace.shortcutCompareSelect") },
                    { keys: "Ctrl + /", action: t("workspace.shortcutHelp") },
                    { keys: "Escape", action: t("workspace.shortcutEscape") },
                  ].map(({ keys, action }) => (
                    <div key={keys} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid hsl(var(--border) / 0.3)" }}>
                      <kbd style={{ padding: "2px 8px", borderRadius: 4, border: "1px solid hsl(var(--border))", background: "hsl(var(--muted) / 0.5)", fontSize: 11, fontFamily: "monospace", fontWeight: 600, whiteSpace: "nowrap" }}>{keys}</kbd>
                      <span style={{ color: "hsl(var(--muted-foreground))", fontSize: 12 }}>{action}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 16, textAlign: "center" }}>
                  <button onClick={() => ws.setShowShortcutsHelp(false)} style={{ padding: "6px 20px", borderRadius: 8, border: "none", background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                    {t("action.close")}
                  </button>
                </div>
              </div>
            </div>
          )}

          <WorkspaceModals
            segSlotDialog={ws.segSlotDialog}
            setSegSlotDialog={ws.setSegSlotDialog}
            segPreviewModal={ws.segPreviewModal}
            setSegPreviewModal={ws.setSegPreviewModal}
            slotsCarouselFloated={ws.slotsCarouselFloated}
            setSlotsCarouselFloated={ws.setSlotsCarouselFloated}
            segCarouselFloated={ws.segCarouselFloated}
            setSegCarouselFloated={ws.setSegCarouselFloated}
            slots={ws.slots.slots}
            lockedSlots={ws.slots.lockedSlots}
            segments={ws.segments}
            placeTextIntoSlot={ws.slots.placeTextIntoSlot}
            smartOpenText={ws.slots.smartOpenText}
          />
        </main>
        <GlobalBurgerMenu />

        {/* Mobile bottom nav */}
        {isMobile && (
          <FrontendMobileBottomNav
            activePanel={mobileActivePanel ?? undefined}
            onOpenDocuments={() => setMobileActivePanel(mobileActivePanel === "documents" ? null : "documents")}
            onOpenSearch={() => setMobileActivePanel(mobileActivePanel === "search" ? null : "search")}
            onOpenSegments={() => setMobileActivePanel(mobileActivePanel === "segments" ? null : "segments")}
            onOpenAnalytics={() => setMobileActivePanel(mobileActivePanel === "analytics" ? null : "analytics")}
          />
        )}

        {/* Mobile panel drawer */}
        {isMobile && mobileActivePanel && (
          <div
            style={{
              position: "fixed", bottom: 48, left: 0, right: 0,
              maxHeight: "60vh", zIndex: 9997,
              background: "hsl(var(--card))",
              borderTop: "1px solid hsl(var(--border))",
              overflow: "auto",
              animation: "slideUp 0.2s ease-out",
              boxShadow: "0 -8px 32px hsl(var(--background) / 0.5)",
            }}
          >
            <div style={{ padding: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid hsl(var(--border))" }}>
              <span style={{ fontWeight: 600, fontSize: 13, color: "hsl(var(--foreground))" }}>
                {mobileActivePanel === "documents" && `📚 ${t("nav.documents")}`}
                {mobileActivePanel === "search" && `🔍 ${t("action.search")}`}
                {mobileActivePanel === "segments" && `🧩 ${t("workspace.segments")}`}
                {mobileActivePanel === "analytics" && `📊 ${t("workspace.analyticsHub")}`}
              </span>
              <button
                onClick={() => setMobileActivePanel(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "hsl(var(--muted-foreground))", fontSize: 16, padding: "4px 8px" }}
              >✕</button>
            </div>
            <div style={{ padding: "12px" }}>
              {mobileActivePanel === "documents" && (
                <DocumentPickerPanel onSegmentsChange={ws.setSegments} onUploadsChange={ws.setUploadsCount} />
              )}
              {mobileActivePanel === "search" && (
                <>
                  <SearchPanel
                    query={ws.search.q} setQuery={ws.search.setQ}
                    k={ws.search.k} setK={ws.search.setK}
                    onSearch={ws.search.run} loading={ws.search.loading}
                    error={ws.search.err} resultsCount={ws.search.hits.length}
                  />
                  <ResultsList hits={ws.search.hits} activeId={ws.activeId} onPick={ws.handlePick} onExport={ws.handleExportResult} />
                </>
              )}
              {mobileActivePanel === "segments" && (
                <SegmentsList
                  segments={ws.segments} query={ws.segmentQuery} setQuery={ws.setSegmentQuery}
                  onPick={ws.handlePickSegment} onExport={ws.handleExportSegment}
                  onBatchOpen={ws.handleBatchOpenSegments} onPin={ws.handlePinChunk}
                />
              )}
              {mobileActivePanel === "analytics" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {analyticsWidgets.slice(0, 3).map(w => (
                    <div key={w.id}>{w.renderCard()}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <style>{`@keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
      </div>
    </ErrorBoundary>
  );
}
