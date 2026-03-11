import React, { useState } from "react";
import { AspectRatio } from "../../components/ui/AspectRatio";
import { TourStep, useTour } from "../../components/UniversalTourGuide";
import { Card } from "./components/Card";
import { useResearchHubState } from "./hooks/useResearchHubState";
import { ScreenshotMode } from "../../components/ScreenshotMode";
import { CompactExpandedToggle } from "../../components/ui/CompactExpandedToggle";
import { DraggableComponent } from "../../components/DraggableComponent";
import { PluginSlot } from "../../utils/PluginSystem";
import { PageShell } from "../../components/layout/PageShell";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import { useIsMobile } from "../../hooks/use-mobile";

export default function ResearchHubLayout() {
  const hub = useResearchHubState();
  const {
    // Extract all needed variables from hub to fix runtime errors
    pageContainerRef,
    denseMode,
    setDenseMode,
    nav,
    isAuthed,
    authLoading,
    query,
    setQuery,
    doi,
    setDoi,
    doiValidation,
    openalexResults,
    semanticResults,
    arxivResults,
    crossrefResult,
    status,
    uploads,
    selectedDocumentId,
    setSelectedDocumentId,
    metrics,
    segmentRows,
    exportStatus,
    authorQuery,
    setAuthorQuery,
    institutionQuery,
    setInstitutionQuery,
    authorResults,
    institutionResults,
    openalexYearFrom,
    setOpenalexYearFrom,
    openalexYearTo,
    setOpenalexYearTo,
    openalexVenue,
    setOpenalexVenue,
    dedupeOpenalex,
    setDedupeOpenalex,
    zoteroKey,
    setZoteroKey,
    zoteroLibraryType,
    setZoteroLibraryType,
    zoteroLibraryId,
    setZoteroLibraryId,
    zoteroCollectionsState,
    zoteroItemsState,
    zoteroSyncState,
    zoteroAuthEncrypted,
    zoteroAutoSyncEnabled,
    newCollectionName,
    setNewCollectionName,
    newItemTitle,
    setNewItemTitle,
    newItemType,
    setNewItemType,
    newItemUrl,
    setNewItemUrl,
    newItemDate,
    setNewItemDate,
    mendeleyToken,
    setMendeleyToken,
    mendeleyResults,
    libraryFilters,
    setLibraryFilters,
    libraryItems,
    selectedLibraryIds,
    bulkTags,
    setBulkTags,
    bulkCategory,
    setBulkCategory,
    bulkNotes,
    setBulkNotes,
    bulkTitle,
    setBulkTitle,
    bulkNotesMode,
    setBulkNotesMode,
    bulkTagsMode,
    setBulkTagsMode,
    citationStyle,
    setCitationStyle,
    bulkTagsPreview,
    bulkTagsInvalid,
    bibtexKeyFormat,
    setBibtexKeyFormat,
    bibtexKeyTemplate,
    setBibtexKeyTemplate,
    autoPreviewTags,
    setAutoPreviewTags,
    showBibTexPreview,
    setShowBibTexPreview,
    openalexVisibleCount,
    semanticVisibleCount,
    arxivVisibleCount,
    openalexIsLoadingMore,
    semanticIsLoadingMore,
    arxivIsLoadingMore,
    openalexLoadRef,
    semanticLoadRef,
    arxivLoadRef,
    mendeleyConnected,
    mendeleyExpiresAt,
    mendeleyHasRefresh,
    viewMode,
    setViewMode,
    editingItemId,
    setEditingItemId,
    editDraft,
    setEditDraft,
    inlineToast,
    apiErrors,
    jwtPayloadRaw,
    userRoles,
    canUseResearchTools,
    canUseLibrary,
    isAdmin,
    topLinked,
    authorSummary,
    institutionSummary,
    openalexInsights,
    openalexDisplayResults,
    runSearch,
    runDoiLookup,
    runAuthorSearch,
    runInstitutionSearch,
    loadZotero,
    runZoteroSync,
    loadZoteroSynced,
    importZoteroToLibrary,
    createZoteroCollection,
    createZoteroItem,
    loadLibrary,
    applyBulkEdit,
    saveInlineEdit,
    connectMendeley,
    loadMendeley,
    updatePrisma,
    exportMarkdown,
    exportLatex,
    formatCitation,
    copyCitation,
    buildBibTexKey,
    buildBibTexEntry,
    exportBibTex,
    copyBibTexEntry,
    exportPrismaCsv,
    exportPrismaExcel,
    exportOpenAlexCsv,
    exportOpenAlexWorksCsv,
    showInlineToast,
    copyJwtPayload,
    clearApiErrors,
    exportApiErrorsJson,
    renderList,
    tourRefs,
    getTourHighlightStyle,
    tagPresets,
    newPresetName,
    setNewPresetName,
    newPresetValue,
    setNewPresetValue,
    newPresetCategory,
    setNewPresetCategory,
    presetCategoryFilter,
    setPresetCategoryFilter,
    dragPresetName,
    setDragPresetName,
    dragOverPresetName,
    setDragOverPresetName,
    lastPresetOrder,
    presetNameConflict,
    setPresetNameConflict,
    presetNameSuggestion,
    setPresetNameSuggestion,
    presetNameDrafts,
    setPresetNameDrafts,
    presetCategoryDrafts,
    setPresetCategoryDrafts,
    pendingPresetAutosave,
    presetJsonInput,
    setPresetJsonInput,
    prisma,
    categoryChips,
    mergePreviewCount,
    mergePreviewItems,
    mergeFromCategory,
    setMergeFromCategory,
    mergeToCategory,
    setMergeToCategory,
    mergePreviewExpanded,
    setMergePreviewExpanded,
    hoverPresetName,
    setHoverPresetName,
    // Apply suggested preset name
    applySuggestedPresetName,
    reorderTagPresets,
    movePreset,
    applyTagPreset,
    clearPresetNameAutosave,
    schedulePresetNameAutosave,
    updatePresetName,
    clearPresetCategoryAutosave,
    schedulePresetCategoryAutosave,
    updatePresetCategory,
    removeTagPreset,
    restorePresetSnapshot,
    toggleSelectLibrary,
    startInlineEdit,
    VirtualList,
    savedViews,
    newViewName,
    setNewViewName,
    saveView,
    applyView,
    exportPresetsJson,
    copyPresetsJson,
    importPresetsJson,
    savePresetSnapshot,
    presetHistory,
    undoPresetReorder,
    mergePresetCategories,
    addTagPreset,
  } = hub;

  // Add language hook
  const { t } = useLanguage();
  
  // Theme hook for light mode support
  const { mode, resolvedMode } = useTheme();
  const isLight = mode === "light" || resolvedMode === "light";
  const isMobile = useIsMobile();
  
  // Theme-aware colors using semantic tokens
  const textSecondary = "hsl(var(--muted-foreground))";

  // Screenshot Mode state
  const [screenshotModeActive, setScreenshotModeActive] = useState(false);

  const tourSteps: TourStep[] = [
    // Step 1: Y:0
    {
      id: 'step-1',
      title: t('tour.researchHub.welcome.title'),
      content: t('tour.researchHub.welcome.content'),
      coordinates: { x: 960, y: 100, scrollY: 0 },
      autoScroll: true,
      smartPositioning: true,
      delay: 500
    },
    // Steps 2-6: Y:1014 (5 times)
    {
      id: 'step-2',
      title: t('tour.researchHub.openalex.title'),
      content: t('tour.researchHub.openalex.content'),
      coordinates: { x: 960, y: 100, scrollY: 1014 },
      autoScroll: true,
      smartPositioning: true,
      delay: 300
    },
    {
      id: 'step-3',
      title: t('tour.researchHub.semantic.title'),
      content: t('tour.researchHub.semantic.content'),
      coordinates: { x: 960, y: 100, scrollY: 1014 },
      autoScroll: true,
      smartPositioning: true,
      delay: 300
    },
    {
      id: 'step-4',
      title: t('tour.researchHub.arxiv.title'),
      content: t('tour.researchHub.arxiv.content'),
      coordinates: { x: 960, y: 100, scrollY: 1014 },
      autoScroll: true,
      smartPositioning: true,
      delay: 300
    },
    {
      id: 'step-5',
      title: t('tour.researchHub.crossref.title'),
      content: t('tour.researchHub.crossref.content'),
      coordinates: { x: 960, y: 100, scrollY: 1014 },
      autoScroll: true,
      smartPositioning: true,
      delay: 300
    },
    {
      id: 'step-6',
      title: t('tour.researchHub.filters.title'),
      content: t('tour.researchHub.filters.content'),
      coordinates: { x: 960, y: 100, scrollY: 1014 },
      autoScroll: true,
      smartPositioning: true,
      delay: 300
    },
    // Steps 7-10: Y:1679 (4 times)
    {
      id: 'step-7',
      title: t('tour.researchHub.doiInput.title'),
      content: t('tour.researchHub.doiInput.content'),
      coordinates: { x: 960, y: 100, scrollY: 1679 },
      autoScroll: true,
      smartPositioning: true,
      delay: 300
    },
    {
      id: 'step-8',
      title: t('tour.researchHub.doiResults.title'),
      content: t('tour.researchHub.doiResults.content'),
      coordinates: { x: 960, y: 100, scrollY: 1679 },
      autoScroll: true,
      smartPositioning: true,
      delay: 300
    },
    {
      id: 'step-9',
      title: t('tour.researchHub.citationFormats.title'),
      content: t('tour.researchHub.citationFormats.content'),
      coordinates: { x: 960, y: 100, scrollY: 1679 },
      autoScroll: true,
      smartPositioning: true,
      delay: 300
    },
    {
      id: 'step-10',
      title: t('tour.researchHub.citationExport.title'),
      content: t('tour.researchHub.citationExport.content'),
      coordinates: { x: 960, y: 100, scrollY: 1679 },
      autoScroll: true,
      smartPositioning: true,
      delay: 300
    },
    // Steps 11-13: Y:2270 (3 times)
    {
      id: 'step-11',
      title: t('tour.researchHub.knowledgeGraph.title'),
      content: t('tour.researchHub.knowledgeGraph.content'),
      coordinates: { x: 960, y: 100, scrollY: 2270 },
      autoScroll: true,
      smartPositioning: true,
      delay: 300
    },
    {
      id: 'step-12',
      title: t('tour.researchHub.dataExtraction.title'),
      content: t('tour.researchHub.dataExtraction.content'),
      coordinates: { x: 960, y: 100, scrollY: 2270 },
      autoScroll: true,
      smartPositioning: true,
      delay: 300
    },
    {
      id: 'step-13',
      title: t('tour.researchHub.exportOptions.title'),
      content: t('tour.researchHub.exportOptions.content'),
      coordinates: { x: 960, y: 100, scrollY: 2270 },
      autoScroll: true,
      smartPositioning: true,
      delay: 300
    },
    // Step 14: Y:3515
    {
      id: 'step-14',
      title: t('tour.researchHub.analytics.title'),
      content: t('tour.researchHub.analytics.content'),
      coordinates: { x: 960, y: 100, scrollY: 3515 },
      autoScroll: true,
      smartPositioning: true,
      delay: 300
    }
  ];

  const { startTour: startResearchTour, TourComponent: ResearchTourComponent } = useTour(tourSteps, "researchHubTourSeen");

  const renderBars = (items: any[], field: "worksCount" | "citedByCount") => {
    if (!items.length) return null;
    const maxVal = Math.max(...items.map((i) => i[field] || 0), 1);
    return (
      <AspectRatio
        ratio={16 / 9}
        style={{
          marginTop: "8px",
          borderRadius: "10px",
          background: "rgba(15,15,25,0.55)",
          border: "1px solid rgba(255,255,255,0.06)",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "10px 12px", height: "100%", overflowY: "auto" }}>
          <div style={{ display: "grid", gap: "6px" }}>
            {items.slice(0, 5).map((item) => (
              <div key={`${item.id}-${field}`} style={{ fontSize: "12px", color: textSecondary }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>{item.name}</span>
                  <span>{item[field] || 0}</span>
                </div>
                <div
                  style={{
                    height: "6px",
                    borderRadius: "999px",
                    background: "rgba(255,255,255,0.08)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.round(((item[field] || 0) / maxVal) * 100)}%`,
                      height: "100%",
                      background: "linear-gradient(90deg, rgba(20,184,166,0.7), rgba(16,185,129,0.6))",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </AspectRatio>
    );
  };

  const [showSecondaryPanels, setShowSecondaryPanels] = React.useState(!denseMode);

  React.useEffect(() => {
    setShowSecondaryPanels(!denseMode);
  }, [denseMode]);

  const shouldShowSecondaryPanels = !denseMode || showSecondaryPanels;

  return (
    <PageShell
      containerRef={pageContainerRef}
      title={t('nav.research')}
      subtitle={t('researchHub.subtitle')}
      icon="🔬"
      actions={
        !isMobile ? (
          <>
            <button
              onClick={() => nav("/research-lab")}
              title={t('nav.researchLab')}
              style={{
                padding: "8px 14px",
                background: "hsl(var(--success) / 0.12)",
                border: "1px solid hsl(var(--success) / 0.25)",
                borderRadius: "10px",
                color: "hsl(var(--foreground))",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s ease",
              }}
            >
              🔬 {t('nav.researchLab')}
            </button>
            <button
              onClick={startResearchTour}
              title={t('action.tour')}
              style={{
                padding: "8px 14px",
                background: "hsl(var(--info) / 0.12)",
                border: "1px solid hsl(var(--info) / 0.25)",
                borderRadius: "10px",
                color: "hsl(var(--foreground))",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s ease",
              }}
            >
              🎯 {t('action.tour')}
            </button>
          </>
        ) : undefined
      }
    >
      {/* Compact/Expanded Toggle — hidden on mobile to avoid overlap with Back/Home */}
      {!isMobile && (
        <CompactExpandedToggle
          mode={denseMode ? "compact" : "expanded"}
          onModeChange={(mode) => setDenseMode(mode === "compact")}
        />
      )}
      
      <div
        className="page-shell"
        style={{
          ["--card-padding" as any]: denseMode ? "16px" : "20px",
          ["--card-title-size" as any]: denseMode ? "16px" : "18px",
          ["--card-subtitle-size" as any]: denseMode ? "12px" : "13px",
          ["--card-subtitle-display" as any]: denseMode ? "none" : "block",
          ["--card-subtitle-opacity" as any]: denseMode ? "0.35" : "0.6",
          ["--card-header-gap" as any]: denseMode ? "8px" : "12px",
          ["--card-gap" as any]: "52px",
          ["--section-gap" as any]: denseMode ? "12px" : "20px",
          color: "hsl(var(--foreground))",
          fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        }}
      >
      
      {/* Enhanced CSS with industry-standard animations - EXACTLY from Home.tsx */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .homeShell {
          animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .enhanced-button {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          transform-origin: center;
          position: relative;
          overflow: hidden;
        }
        
        .enhanced-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          transition: left 0.5s;
        }
        
        .enhanced-button:hover::before {
          left: 100%;
        }
        
        .enhanced-button:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.3);
        }
        
        .enhanced-button:active {
          transform: translateY(0) scale(0.98);
        }
        
        .card-panel {
          background: rgba(20, 25, 35, 0.6);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .card-panel:hover {
          background: rgba(20, 25, 35, 0.8);
          border-color: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
        }
        
        .suggestion-item {
          padding: 12px 16px;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          border-left: 3px solid transparent;
        }
        
        .suggestion-item:hover,
        .suggestion-item.highlighted {
          background-color: rgba(99, 102, 241, 0.1);
          border-left-color: #6366f1;
          transform: translateX(4px);
        }
        
        .status-indicator {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          backdrop-filter: blur(8px);
        }
        
        .status-indicator.success {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
        
        .status-indicator.pending {
          background: rgba(245, 158, 11, 0.15);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }
        
        .status-indicator.error {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }
        
        .floating-action {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 100;
          animation: slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        
        .section-title {
          font-size: 18px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.9);
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .section-subtitle {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
          margin-top: 4px;
        }

        /* Light mode overrides */
        html[data-theme="light"] .section-title {
          color: #2f2941 !important;
        }
        html[data-theme="light"] .section-subtitle {
          color: rgba(47, 41, 65, 0.65) !important;
        }
        html[data-theme="light"] .card-panel {
          background: #ffffff !important;
          border-color: rgba(47, 41, 65, 0.12) !important;
        }
        html[data-theme="light"] .card-panel:hover {
          background: #fafafa !important;
          border-color: rgba(47, 41, 65, 0.18) !important;
        }
        html[data-theme="light"] .section-header {
          border-bottom-color: rgba(47, 41, 65, 0.1) !important;
        }
      `}</style>
      
      {/* Status chips below header */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
        {zoteroAuthEncrypted && (
          <span className="status-indicator success">
            {t('status.zoteroConnected')}
          </span>
        )}
        {zoteroAutoSyncEnabled && (
          <span className="status-indicator pending">
            {t('status.autoSyncActive')}
          </span>
        )}
      </div>

      {/* Quick Stats Bar */}
      <div style={{
            marginTop: "20px",
            padding: "16px 20px",
            background: "var(--bg-card)",
            border: "1px solid var(--border-secondary)",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 16px",
                background: "var(--bg-hover)",
                borderRadius: "10px",
                border: "1px solid var(--border-primary)",
              }}>
                <div style={{
                  width: "28px",
                  height: "28px",
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-button)",
                  fontSize: "12px",
                }}>📄</div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--accent-primary)" }}>
                    {openalexResults.length}
                  </div>
                  <div style={{ fontSize: "9px", color: isLight ? "rgba(47, 41, 65, 0.6)" : "var(--text-muted)", textTransform: "uppercase" }}>
                    {t('stats.openalex')}
                  </div>
                </div>
              </div>
              
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 16px",
                background: "rgba(16, 185, 129, 0.08)",
                borderRadius: "10px",
                border: "1px solid rgba(16, 185, 129, 0.15)",
              }}>
                <div style={{
                  width: "28px",
                  height: "28px",
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-button)",
                  fontSize: "12px",
                }}>🧠</div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#10b981" }}>
                    {semanticResults.length}
                  </div>
                  <div style={{ fontSize: "9px", color: isLight ? "rgba(47, 41, 65, 0.6)" : "rgba(255, 255, 255, 0.5)", textTransform: "uppercase" }}>
                    {t('stats.semantic')}
                  </div>
                </div>
              </div>
              
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 16px",
                background: "rgba(245, 158, 11, 0.08)",
                borderRadius: "10px",
                border: "1px solid rgba(245, 158, 11, 0.15)",
              }}>
                <div style={{
                  width: "28px",
                  height: "28px",
                  background: "linear-gradient(135deg, #f59e0b, #d97706)",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  fontSize: "12px",
                }}>📚</div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#f59e0b" }}>
                    {arxivResults.length}
                  </div>
                  <div style={{ fontSize: "9px", color: isLight ? "rgba(47, 41, 65, 0.6)" : "rgba(255, 255, 255, 0.5)", textTransform: "uppercase" }}>
                    {t('stats.arxiv')}
                  </div>
                </div>
              </div>
              
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 16px",
                background: "rgba(236, 72, 153, 0.08)",
                borderRadius: "10px",
                border: "1px solid rgba(236, 72, 153, 0.15)",
              }}>
                <div style={{
                  width: "28px",
                  height: "28px",
                  background: "linear-gradient(135deg, #ec4899, #db2777)",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  fontSize: "12px",
                }}>📖</div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#ec4899" }}>
                    {libraryItems.length}
                  </div>
                  <div style={{ fontSize: "9px", color: isLight ? "rgba(47, 41, 65, 0.6)" : "rgba(255, 255, 255, 0.5)", textTransform: "uppercase" }}>
                    {t('stats.library')}
                  </div>
                </div>
              </div>
            </div>
          </div>
      </div>

      {/* Enhanced Navigation Tabs - EXACTLY from Home.tsx pattern */}
      <div className="section-header">
        <div className="section-title">
          <span>🔍</span>
          <span>{t('researchHub.tools')}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => nav("/frontend")}
            style={{
              padding: "8px 16px",
              background: "rgba(114, 255, 191, 0.1)",
              border: "1px solid rgba(114, 255, 191, 0.3)",
              borderRadius: "8px",
              color: "#bfffe0",
              fontSize: "14px",
              fontWeight: "500"
            }}
          >
            🧠 {t('nav.thinkingWorkspace')}
          </button>
        </div>
      </div>
      {/* Research Dashboard - Following Home.tsx Pattern */}
      <DraggableComponent componentId="research-dashboard" initialPosition={{ x: 0, y: 0 }} enabled={screenshotModeActive}>
      <div 
        className="card-panel"
        style={{ 
          marginBottom: "32px",
          padding: "24px",
          animation: "fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.1s both"
        }}
      >
        <div className="section-header">
          <div>
            <div className="section-title">
              📊 {t('researchHub.dashboard.title')}
            </div>
            <div className="section-subtitle">
              {t('researchHub.dashboard.subtitle')}
            </div>
          </div>
        </div>
      </div>
      </DraggableComponent>
      
      {/* Advanced Search - Following Home.tsx Pattern */}
      <DraggableComponent componentId="research-advanced-search" initialPosition={{ x: 0, y: 0 }} enabled={screenshotModeActive}>
      <div 
        className="card-panel"
        style={{ 
          marginBottom: "32px",
          padding: "24px",
          animation: "fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.2s both"
        }}
      >
        <div className="section-header">
          <div>
            <div className="section-title">
              🔍 {t('researchHub.advancedSearch.title')}
            </div>
            <div className="section-subtitle">
              {t('researchHub.advancedSearch.subtitle')}
            </div>
          </div>
        </div>
      </div>
      </DraggableComponent>
      
      {/* Quick Actions Panel - Enhanced with Home.tsx Pattern */}
      <div 
        className="card-panel"
        style={{ 
          marginBottom: "32px",
          padding: "24px",
          animation: "fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.3s both"
        }}
      >
        <div className="section-header">
          <div>
            <div className="section-title">
              ⚡ {t('researchHub.quickActions.title')}
            </div>
            <div className="section-subtitle">
              Common research tasks and workflows
            </div>
          </div>
        </div>
        
        {/* Enhanced Quick Actions Grid */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
          gap: "12px", 
          marginTop: "16px" 
        }}>
          <button
            onClick={runSearch}
            style={{
              padding: "12px 16px",
              background: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: "12px",
              color: "var(--accent-success)",
              fontSize: "14px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            }}
          >
            🔍 {t('action.runSearch')}
          </button>
          
          <button
            onClick={runDoiLookup}
            style={{
              padding: "12px 16px",
              background: "rgba(20, 184, 166, 0.1)",
              border: "1px solid rgba(20, 184, 166, 0.3)",
              borderRadius: "12px",
              color: "#14b8a6",
              fontSize: "14px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            }}
          >
            📋 DOI Lookup
          </button>
          
          <button
            onClick={runZoteroSync}
            style={{
              padding: "12px 16px",
              background: "rgba(99, 102, 241, 0.1)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              borderRadius: "12px",
              color: "#6366f1",
              fontSize: "14px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            }}
          >
            📚 Zotero Sync
          </button>
          
          <button
            onClick={exportBibTex}
            style={{
              padding: "12px 16px",
              background: "rgba(245, 158, 11, 0.1)",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              borderRadius: "12px",
              color: "var(--accent-warning)",
              fontSize: "14px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            }}
          >
            📄 Export BibTeX
          </button>
          
          <button
            onClick={loadLibrary}
            style={{
              padding: "12px 16px",
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "12px",
              color: "#ef4444",
              fontSize: "14px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            }}
          >
            📖 Load Library
          </button>
          
          <button
            onClick={connectMendeley}
            style={{
              padding: "12px 16px",
              background: "rgba(168, 85, 247, 0.1)",
              border: "1px solid rgba(168, 85, 247, 0.3)",
              borderRadius: "12px",
              color: "#a855f7",
              fontSize: "14px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            }}
          >
            🔗 Mendeley Connect
          </button>
        </div>
      </div>

      {/* Research Analytics Dashboard - Following Home.tsx Pattern */}
      <DraggableComponent componentId="research-analytics" initialPosition={{ x: 0, y: 0 }} enabled={screenshotModeActive}>
      <div 
        className="card-panel"
        style={{ 
          marginBottom: "32px",
          padding: "24px",
          animation: "fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.4s both"
        }}
      >
        <div className="section-header">
          <div>
            <div className="section-title">
              📈 {t('researchHub.analytics.title')}
            </div>
            <div className="section-subtitle">
              {t('researchHub.analytics.subtitle')}
            </div>
          </div>
        </div>
        
        {/* Analytics Stats Grid */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", 
          gap: "16px", 
          marginTop: "16px" 
        }}>
          <div className="status-indicator success">
            <span>📊</span>
            <span>{openalexResults.length} {t('research.papers')}</span>
          </div>
          <div className="status-indicator pending">
            <span>📚</span>
            <span>{semanticResults.length} {t('researchHub.semanticResults')}</span>
          </div>
          <div className="status-indicator error">
            <span>🔗</span>
            <span>{arxivResults.length} arXiv</span>
          </div>
          <div className="status-indicator success">
            <span>⚡</span>
            <span>{t('researchHub.realtimeSync')}</span>
          </div>
        </div>
      </div>
      </DraggableComponent>
      
      {/* Collaboration Hub - Following Home.tsx Pattern */}
      <DraggableComponent componentId="research-collaboration" initialPosition={{ x: 0, y: 0 }} enabled={screenshotModeActive}>
      <div 
        className="card-panel"
        style={{ 
          marginBottom: "32px",
          padding: "24px",
          animation: "fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.5s both"
        }}
      >
        <div className="section-header">
          <div>
            <div className="section-title">
              👥 {t('researchHub.collaboration.title')}
            </div>
            <div className="section-subtitle">
              {t('researchHub.collaboration.subtitle')}
            </div>
          </div>
        </div>
        
        {/* Collaboration Features */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
          gap: "12px", 
          marginTop: "16px" 
        }}>
          <button
            style={{
              padding: "12px 16px",
              background: "rgba(34, 197, 94, 0.1)",
              border: "1px solid rgba(34, 197, 94, 0.3)",
              borderRadius: "12px",
              color: "#22c55e",
              fontSize: "14px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            }}
          >
            📤 {t('researchHub.shareLibrary')}
          </button>
          
          <button
            style={{
              padding: "12px 16px",
              background: "rgba(59, 130, 246, 0.1)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              borderRadius: "12px",
              color: "#3b82f6",
              fontSize: "14px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            }}
          >
            💬 {t('researchHub.comments')}
          </button>
          
          <button
            style={{
              padding: "12px 16px",
              background: "rgba(251, 146, 60, 0.1)",
              border: "1px solid rgba(251, 146, 60, 0.3)",
              borderRadius: "12px",
              color: "#fb923c",
              fontSize: "14px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            }}
          >
            📝 {t('researchHub.annotations')}
          </button>
        </div>
      </div>
      </DraggableComponent>

      {inlineToast && (
        <div
          title={`Saved at ${inlineToast.timestamp}`}
          style={{
            fontSize: "12px",
            color: "#6ee7b7",
            background: "rgba(16,185,129,0.12)",
            border: "1px solid rgba(16,185,129,0.3)",
            padding: "4px 8px",
            borderRadius: "999px",
            width: "fit-content",
            marginBottom: "var(--section-gap)",
          }}
        >
          {inlineToast.message}
        </div>
      )}

      <div
        style={{
          position: "static",
          marginTop: "8px",
          marginBottom: "16px",
          padding: "6px 10px",
          borderRadius: "999px",
          background: isLight ? "rgba(47, 41, 65, 0.08)" : "rgba(0,0,0,0.55)",
          border: isLight ? "1px solid rgba(47, 41, 65, 0.12)" : "1px solid rgba(255,255,255,0.08)",
          color: isLight ? "#2f2941" : "rgba(255,255,255,0.7)",
          fontSize: "12px",
          width: "fit-content",
          backdropFilter: "blur(6px)",
        }}
      >
        Research Tools
      </div>

      <div
        style={{
          display: "grid",
          gap: "var(--card-gap)",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          alignItems: "stretch",
          justifyItems: "stretch",
          gridAutoRows: "minmax(0, auto)",
          width: "100%",
        }}
      >
        {/* Enhanced Search Results Display - Following Home.tsx Pattern */}
        <Card
          containerRef={tourRefs.unifiedSearch}
          containerStyle={getTourHighlightStyle(tourRefs.unifiedSearch)}
          title={t('researchHub.unifiedSearch.title')}
          subtitle={t('researchHub.unifiedSearch.subtitle')}
        >
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., retrieval augmented generation"
              style={{
                flex: "1 1 220px",
                padding: "12px 16px",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(0,0,0,0.4)",
                color: "#eaeaea",
                fontSize: "14px",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
              }}
            />
          <button
            onClick={runSearch}
            style={{
              padding: "12px 20px",
              borderRadius: "12px",
              border: "1px solid rgba(16,185,129,0.4)",
              background: "rgba(16,185,129,0.2)",
              color: "#6ee7b7",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            🔍 {t('action.search')}
          </button>
          </div>
          <div style={{ marginTop: "10px", fontSize: "12px", color: textSecondary }}>
            {t('researchHub.unifiedSearch.tip')}
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "8px", flexWrap: "wrap" }}>
            <label style={{ display: "flex", gap: "6px", alignItems: "center", fontSize: "12px", color: textSecondary }}>
              <input
                type="checkbox"
                checked={dedupeOpenalex}
                onChange={(e) => setDedupeOpenalex(e.target.checked)}
              />
              {t('researchHub.deduplicateDoi')}
            </label>
            {openalexInsights && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {[
                  `${openalexInsights.count} results`,
                  `Years ${openalexInsights.yearRange}`,
                  openalexInsights.medianYear ? `Median ${openalexInsights.medianYear}` : "",
                  openalexInsights.topVenue ? `Top venue: ${openalexInsights.topVenue}` : "",
                  openalexInsights.topAuthors?.length ? `Top authors: ${openalexInsights.topAuthors.join(", ")}` : "",
                ]
                  .filter(Boolean)
                  .map((text) => (
                    <span
                      key={text}
                      style={{
                        fontSize: "11px",
                        color: textSecondary,
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        padding: "2px 6px",
                        borderRadius: "999px",
                      }}
                    >
                      {text}
                    </span>
                  ))}
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
            <input
              value={openalexYearFrom}
              onChange={(e) => setOpenalexYearFrom(e.target.value)}
              placeholder={t('researchHub.yearFrom')}
              style={{
                width: "120px",
                padding: "8px 10px",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(0,0,0,0.3)",
                color: "#eaeaea",
              }}
            />
            <input
              value={openalexYearTo}
              onChange={(e) => setOpenalexYearTo(e.target.value)}
              placeholder={t('researchHub.yearTo')}
              style={{
                width: "120px",
                padding: "8px 10px",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(0,0,0,0.3)",
                color: "#eaeaea",
              }}
            />
            <input
              value={openalexVenue}
              onChange={(e) => setOpenalexVenue(e.target.value)}
              placeholder={t('researchHub.venueContains')}
              style={{
                flex: "1 1 180px",
                padding: "8px 10px",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(0,0,0,0.3)",
                color: "#eaeaea",
              }}
            />
            <button
              onClick={() => exportOpenAlexWorksCsv("full")}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid rgba(20,184,166,0.4)",
                background: "rgba(20,184,166,0.15)",
                color: "#5eead4",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              {t('researchHub.exportOpenAlexCsv')}
            </button>
            <button
              onClick={() => exportOpenAlexWorksCsv("doi-only")}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid rgba(16,185,129,0.4)",
                background: "rgba(16,185,129,0.15)",
                color: "#6ee7b7",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              {t('researchHub.exportDoiOnly')}
            </button>
            <button
              onClick={() => exportOpenAlexWorksCsv("citation-only")}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid rgba(245,158,11,0.4)",
                background: "rgba(245,158,11,0.15)",
                color: "#fde68a",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              {t('researchHub.exportCitations')}
            </button>
          </div>
          {status && <div style={{ marginTop: "8px", fontSize: "12px", color: textSecondary }}>{status}</div>}
        </Card>

        <Card
          containerRef={tourRefs.doiResolver}
          containerStyle={getTourHighlightStyle(tourRefs.doiResolver)}
          title={t('researchHub.doiResolver.title')}
          subtitle={t('researchHub.doiResolver.subtitle')}
        >
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <input
              value={doi}
              onChange={(e) => setDoi(e.target.value)}
              placeholder="10.1145/xxxxxx"
              style={{
                flex: "1 1 220px",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(0,0,0,0.3)",
                color: "#eaeaea",
              }}
            />
            <button
              onClick={() => setDoi((prev) => prev.trim())}
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.06)",
                color: "#e5e7eb",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              {t('researchHub.normalizeDoi')}
            </button>
            <button
              onClick={runDoiLookup}
              style={{
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid rgba(20,184,166,0.4)",
                background: "rgba(20,184,166,0.15)",
                color: "#5eead4",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              {t('researchHub.resolve')}
            </button>
          </div>
          {doiValidation !== "empty" && (
            <div
              style={{
                marginTop: "6px",
                fontSize: "12px",
                color: doiValidation === "valid" ? "#6ee7b7" : "#fde68a",
              }}
            >
              {doiValidation === "valid" ? t('researchHub.doiValid') : t('researchHub.doiInvalid')}
            </div>
          )}
          {crossrefResult && (
            <div style={{ marginTop: "10px", fontSize: "12px", color: textSecondary }}>
              <div style={{ fontWeight: 600 }}>{crossrefResult.title}</div>
              <div>
                {crossrefResult.publisher} • {crossrefResult.year} • {crossrefResult.doi}
              </div>
            </div>
          )}
          {crossrefResult && (
            <div style={{ marginTop: "10px", fontSize: "12px", color: textSecondary }}>
              <div style={{ fontWeight: 600, marginBottom: "6px" }}>{t("research.citationFormats")}</div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "6px" }}>
                <select
                  value={citationStyle}
                  onChange={(e) => setCitationStyle(e.target.value as typeof citationStyle)}
                  style={{
                    padding: "6px 8px",
                    borderRadius: "6px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(0,0,0,0.3)",
                    color: "#eaeaea",
                  }}
                >
                  <option value="APA">{t("research.citation.apa")}</option>
                  <option value="MLA">{t("research.citation.mla")}</option>
                  <option value="IEEE">{t("research.citation.ieee")}</option>
                  <option value="Chicago">{t("research.citation.chicago")}</option>
                  <option value="Harvard">{t("research.citation.harvard")}</option>
                </select>
                <select
                  value={bibtexKeyFormat}
                  onChange={(e) => setBibtexKeyFormat(e.target.value as typeof bibtexKeyFormat)}
                  style={{
                    padding: "6px 8px",
                    borderRadius: "6px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(0,0,0,0.3)",
                    color: "#eaeaea",
                  }}
                >
                  <option value="author-year-title">{t('researchHub.bibtexKey.authorYearTitle')}</option>
                  <option value="title-year">{t('researchHub.bibtexKey.titleYear')}</option>
                  <option value="doi">{t('researchHub.bibtexKey.doi')}</option>
                  <option value="template">{t('researchHub.bibtexKey.customTemplate')}</option>
                </select>
                {bibtexKeyFormat === "template" && (
                  <input
                    value={bibtexKeyTemplate}
                    onChange={(e) => setBibtexKeyTemplate(e.target.value)}
                    placeholder="{author}{year}{shorttitle}"
                    style={{
                      padding: "6px 8px",
                      borderRadius: "6px",
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(0,0,0,0.3)",
                      color: "#eaeaea",
                      minWidth: "220px",
                    }}
                  />
                )}
                <button
                  onClick={copyCitation}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "6px",
                    border: "1px solid rgba(20,184,166,0.4)",
                    background: "rgba(20,184,166,0.15)",
                    color: "#5eead4",
                    cursor: "pointer",
                  }}
                >
                  {t('researchHub.copy')}
                </button>
                <button
                  onClick={exportBibTex}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "6px",
                    border: "1px solid rgba(16,185,129,0.4)",
                    background: "rgba(16,185,129,0.15)",
                    color: "#6ee7b7",
                    cursor: "pointer",
                  }}
                >
                  {t('researchHub.exportBib')}
                </button>
                <button
                  onClick={copyBibTexEntry}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "6px",
                    border: "1px solid rgba(255,255,255,0.15)",
                    background: "rgba(255,255,255,0.06)",
                    color: "#e5e7eb",
                    cursor: "pointer",
                  }}
                >
                  {t('researchHub.copyBib')}
                </button>
              </div>
              <div>{citationStyle}: {formatCitation(citationStyle)}</div>
              <div style={{ marginTop: "4px", color: textSecondary, display: "flex", gap: "8px", alignItems: "center" }}>
                <span>
                  {t('researchHub.liveKey')}: <span style={{ color: "#5eead4" }}>{buildBibTexKey()}</span>
                </span>
                <button
                  onClick={() => setShowBibTexPreview((prev) => !prev)}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "6px",
                    border: "1px solid rgba(255,255,255,0.15)",
                    background: "rgba(255,255,255,0.06)",
                    color: "#e5e7eb",
                    cursor: "pointer",
                    fontSize: "11px",
                  }}
                >
                  {showBibTexPreview ? t('researchHub.hidePreview') : t('researchHub.showPreview')}
                </button>
                <button
                  onClick={copyBibTexEntry}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "6px",
                    border: "1px solid rgba(255,255,255,0.15)",
                    background: "rgba(255,255,255,0.06)",
                    color: "#e5e7eb",
                    cursor: "pointer",
                    fontSize: "11px",
                  }}
                >
                  {t('researchHub.copyPreview')}
                </button>
              </div>
              {showBibTexPreview && buildBibTexEntry() && (
                <pre
                  style={{
                    marginTop: "8px",
                    padding: "8px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(0,0,0,0.3)",
                    color: "#eaeaea",
                    fontSize: "11px",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {buildBibTexEntry()}
                </pre>
              )}
              <div style={{ marginTop: "4px", color: textSecondary }}>
                Quick preview uses the DOI metadata. Template supports {"{author}"}, {"{year}"}, {"{shorttitle}"},{" "}
                {"{doi}"}.
              </div>
            </div>
          )}
        </Card>

        {shouldShowSecondaryPanels && (
          <>
            <Card
              containerRef={tourRefs.documentContext}
              containerStyle={getTourHighlightStyle(tourRefs.documentContext)}
              title={t('researchHub.documentContext.title')}
              subtitle={t('researchHub.documentContext.subtitle')}
            >
              <select
                value={selectedDocumentId ?? ""}
                onChange={(e) => setSelectedDocumentId(e.target.value ? Number(e.target.value) : null)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(0,0,0,0.3)",
                  color: "#eaeaea",
                }}
              >
                <option value="">{t('researchHub.selectDocument')}</option>
                {uploads.map((u) => (
                  <option key={u.documentId} value={u.documentId}>
                    {u.filename} (docId={u.documentId})
                  </option>
                ))}
              </select>
              {metrics && (
                <div style={{ marginTop: "10px", fontSize: "12px", color: textSecondary }}>
                  Segments: {metrics.totalSegments} • Links: {metrics.linkMetrics?.totalLinks ?? 0}
                </div>
              )}
            </Card>

        <Card
          containerRef={tourRefs.knowledgeGraph}
          containerStyle={getTourHighlightStyle(tourRefs.knowledgeGraph)}
          title={t('researchHub.knowledgeGraph.title')}
          subtitle={t('researchHub.knowledgeGraph.subtitle')}
        >
          {topLinked.length ? (
            <div style={{ display: "grid", gap: "6px", fontSize: "12px" }}>
              {topLinked.map((n: any) => (
                <div key={n.id} style={{ color: "rgba(255,255,255,0.75)" }}>
                  {n.label} • links: {n.linkCount}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: "13px", color: textSecondary }}>
              {t('researchHub.selectDocForGraph')}
            </div>
          )}
          {selectedDocumentId && (
            <button
              onClick={() => nav(`/documents/${selectedDocumentId}/graph`)}
              style={{
                marginTop: "8px",
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid rgba(13,148,136,0.4)",
                background: "rgba(13,148,136,0.15)",
                color: "#5eead4",
                cursor: "pointer",
              }}
            >
              {t('researchHub.openGraphView')}
            </button>
          )}
        </Card>

        <Card
          containerRef={tourRefs.researchTables}
          containerStyle={getTourHighlightStyle(tourRefs.researchTables)}
          title={t('researchHub.researchTables.title')}
          subtitle={t('researchHub.researchTables.subtitle')}
        >
          {segmentRows.length ? (
            <div style={{ display: "grid", gap: "6px", fontSize: "12px" }}>
              {segmentRows.slice(0, 8).map((s: any) => (
                <div key={s.id} style={{ color: "rgba(255,255,255,0.75)" }}>
                  {s.title || t('researchHub.untitled')} • {s.segmentType || "untyped"} • {s.evidenceGrade || "E0"}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: "13px", color: textSecondary }}>
              {t('researchHub.selectDocForTables')}
            </div>
          )}
          {selectedDocumentId && (
            <button
              onClick={() => nav(`/documents/${selectedDocumentId}/dashboard`)}
              style={{
                marginTop: "8px",
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid rgba(16,185,129,0.4)",
                background: "rgba(16,185,129,0.15)",
                color: "#6ee7b7",
                cursor: "pointer",
              }}
            >
              {t('researchHub.openEvidenceDashboard')}
            </button>
          )}
        </Card>

        <Card
          containerRef={tourRefs.writingExport}
          containerStyle={getTourHighlightStyle(tourRefs.writingExport)}
          title={t('researchHub.writingExport.title')}
          subtitle={t('researchHub.writingExport.subtitle')}
        >
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              onClick={exportMarkdown}
              disabled={!segmentRows.length}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid rgba(20,184,166,0.4)",
                background: "rgba(20,184,166,0.15)",
                color: "#5eead4",
                cursor: segmentRows.length ? "pointer" : "not-allowed",
                opacity: segmentRows.length ? 1 : 0.5,
              }}
            >
              {t('researchHub.exportMarkdown')}
            </button>
            <button
              onClick={exportLatex}
              disabled={!segmentRows.length}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid rgba(245,158,11,0.4)",
                background: "rgba(245,158,11,0.15)",
                color: "#fde68a",
                cursor: segmentRows.length ? "pointer" : "not-allowed",
                opacity: segmentRows.length ? 1 : 0.5,
              }}
            >
              {t('researchHub.exportLatex')}
            </button>
          </div>
          {exportStatus && (
            <div style={{ marginTop: "8px", fontSize: "12px", color: textSecondary }}>
              {exportStatus}
            </div>
          )}
        </Card>

        <Card
          containerRef={tourRefs.zotero}
          containerStyle={getTourHighlightStyle(tourRefs.zotero)}
          title={t('researchHub.zotero.title')}
          subtitle={t('researchHub.zotero.subtitle')}
        >
          {!authLoading && !isAuthed && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "12px",
                color: textSecondary,
                background: "rgba(20,184,166,0.12)",
                border: "1px solid rgba(20,184,166,0.25)",
                padding: "6px 10px",
                borderRadius: "8px",
                width: "fit-content",
                marginBottom: "8px",
              }}
            >
              {t('researchHub.loginToLoad')}
              <button
                onClick={() => nav("/login")}
                style={{
                  padding: "4px 8px",
                  borderRadius: "6px",
                  border: "1px solid rgba(20,184,166,0.4)",
                  background: "rgba(20,184,166,0.15)",
                  color: "#5eead4",
                  cursor: "pointer",
                  fontSize: "11px",
                }}
              >
                {t('researchHub.login')}
              </button>
            </div>
          )}
          <div style={{ fontSize: "12px", color: textSecondary, marginBottom: "6px" }}>
            {t('researchHub.zotero.apiKeyInfo')}
          </div>
          {isAuthed && !canUseResearchTools && (
            <div
              style={{
                fontSize: "12px",
                color: "hsl(var(--warning))",
                background: "hsl(var(--warning) / 0.12)",
                border: "1px solid hsl(var(--warning) / 0.25)",
                padding: "6px 10px",
                borderRadius: "8px",
                width: "fit-content",
                marginBottom: "8px",
              }}
            >
              {t('researchHub.roleRequired')}
            </div>
          )}
          {zoteroAuthEncrypted !== null && (
            <div
              title="Encrypted means your Zotero API key is stored securely for auto‑sync."
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 8px",
                borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.15)",
                background: zoteroAuthEncrypted ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
                color: zoteroAuthEncrypted ? "#6ee7b7" : "#fde68a",
                fontSize: "11px",
                marginBottom: "6px",
              }}
            >
              {zoteroAuthEncrypted ? t('researchHub.credentialsEncrypted') : t('researchHub.credentialsNotStored')}
            </div>
          )}
          <div style={{ display: "grid", gap: "8px" }}>
            <input
              value={zoteroKey}
              onChange={(e) => setZoteroKey(e.target.value)}
              placeholder="Zotero API Key"
              disabled={!canUseResearchTools}
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(0,0,0,0.3)",
                color: "#eaeaea",
                opacity: canUseResearchTools ? 1 : 0.5,
              }}
            />
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <select
                value={zoteroLibraryType}
                onChange={(e) => setZoteroLibraryType(e.target.value as "user" | "group")}
                disabled={!canUseResearchTools}
                style={{
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(0,0,0,0.3)",
                  color: "#eaeaea",
                  opacity: canUseResearchTools ? 1 : 0.5,
                }}
              >
                <option value="user">{t("research.zotero.userLibrary")}</option>
                <option value="group">{t("research.zotero.groupLibrary")}</option>
              </select>
              <input
                value={zoteroLibraryId}
                onChange={(e) => setZoteroLibraryId(e.target.value)}
                placeholder={t("research.zotero.libraryIdPlaceholder")}
                disabled={!canUseResearchTools}
                style={{
                  flex: "1 1 200px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(0,0,0,0.3)",
                  color: "#eaeaea",
                  opacity: canUseResearchTools ? 1 : 0.5,
                }}
              />
              <button
                onClick={loadZotero}
                disabled={!canUseResearchTools}
                style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid rgba(16,185,129,0.4)",
                  background: "rgba(16,185,129,0.15)",
                  color: "#6ee7b7",
                  cursor: "pointer",
                  fontWeight: 600,
                  opacity: canUseResearchTools ? 1 : 0.5,
                }}
              >
                {t("action.load")}
              </button>
              <button
                onClick={runZoteroSync}
                disabled={!canUseResearchTools}
                style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid rgba(20,184,166,0.4)",
                  background: "rgba(20,184,166,0.15)",
                  color: "#5eead4",
                  cursor: "pointer",
                  fontWeight: 600,
                  opacity: canUseResearchTools ? 1 : 0.5,
                }}
              >
                {t("research.zotero.sync")}
              </button>
              <button
                onClick={loadZoteroSynced}
                disabled={!canUseResearchTools}
                style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid rgba(156,163,175,0.4)",
                  background: "rgba(156,163,175,0.1)",
                  color: "#e5e7eb",
                  cursor: "pointer",
                  fontWeight: 600,
                  opacity: canUseResearchTools ? 1 : 0.5,
                }}
              >
                {t("research.zotero.loadSynced")}
              </button>
              <button
                onClick={importZoteroToLibrary}
                disabled={!canUseResearchTools}
                style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid rgba(245,158,11,0.4)",
                  background: "rgba(245,158,11,0.15)",
                  color: "#fde68a",
                  cursor: "pointer",
                  fontWeight: 600,
                  opacity: canUseResearchTools ? 1 : 0.5,
                }}
              >
                Import → Library
              </button>
            </div>
            <div style={{ display: "grid", gap: "8px", marginTop: "10px" }}>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <input
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="New collection name"
                  disabled={!canUseResearchTools}
                  style={{
                    flex: "1 1 220px",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(0,0,0,0.3)",
                    color: "#eaeaea",
                    opacity: canUseResearchTools ? 1 : 0.5,
                  }}
                />
                <button
                  onClick={createZoteroCollection}
                  disabled={!canUseResearchTools}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid rgba(16,185,129,0.4)",
                    background: "rgba(16,185,129,0.15)",
                    color: "#6ee7b7",
                    cursor: "pointer",
                    fontWeight: 600,
                    opacity: canUseResearchTools ? 1 : 0.5,
                  }}
                >
                  {t('researchHub.createCollection')}
                </button>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <select
                  value={newItemType}
                  onChange={(e) => setNewItemType(e.target.value)}
                  disabled={!canUseResearchTools}
                  style={{
                    padding: "8px 10px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(0,0,0,0.3)",
                    color: "#eaeaea",
                    opacity: canUseResearchTools ? 1 : 0.5,
                  }}
                >
                  <option value="journalArticle">{t("research.itemType.journalArticle")}</option>
                  <option value="book">{t("research.itemType.book")}</option>
                  <option value="conferencePaper">{t("research.itemType.conferencePaper")}</option>
                  <option value="report">{t("research.itemType.report")}</option>
                </select>
                <input
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  placeholder={t("research.zotero.newItemTitlePlaceholder")}
                  disabled={!canUseResearchTools}
                  style={{
                    flex: "1 1 220px",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(0,0,0,0.3)",
                    color: "#eaeaea",
                    opacity: canUseResearchTools ? 1 : 0.5,
                  }}
                />
                <input
                  value={newItemUrl}
                  onChange={(e) => setNewItemUrl(e.target.value)}
                  placeholder={t("research.zotero.urlPlaceholder")}
                  disabled={!canUseResearchTools}
                  style={{
                    flex: "1 1 180px",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(0,0,0,0.3)",
                    color: "#eaeaea",
                    opacity: canUseResearchTools ? 1 : 0.5,
                  }}
                />
                <input
                  value={newItemDate}
                  onChange={(e) => setNewItemDate(e.target.value)}
                  placeholder={t("research.zotero.yearPlaceholder")}
                  disabled={!canUseResearchTools}
                  style={{
                    flex: "0 1 120px",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(0,0,0,0.3)",
                    color: "#eaeaea",
                    opacity: canUseResearchTools ? 1 : 0.5,
                  }}
                />
                <button
                  onClick={createZoteroItem}
                  disabled={!canUseResearchTools}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid rgba(245,158,11,0.4)",
                    background: "rgba(245,158,11,0.15)",
                    color: "#fde68a",
                    cursor: "pointer",
                    fontWeight: 600,
                    opacity: canUseResearchTools ? 1 : 0.5,
                  }}
                >
                  {t('researchHub.createItem')}
                </button>
              </div>
            </div>
            <div style={{ display: "grid", gap: "8px" }}>
              <div style={{ fontSize: "12px", color: textSecondary }}>
                {t('researchHub.zotero.apiKeyInfo')}
              </div>
              {zoteroCollectionsState.length > 0 && (
                <div style={{ marginTop: "10px", fontSize: "12px", color: textSecondary }}>
                  Collections: {zoteroCollectionsState.length}
                </div>
              )}
              {zoteroItemsState.length > 0 && (
                <div style={{ marginTop: "6px", fontSize: "12px", color: textSecondary }}>
                  Items: {zoteroItemsState.length}
                </div>
              )}
              {zoteroSyncState && (
                <div style={{ marginTop: "6px", fontSize: "12px", color: textSecondary }}>
                  Synced: {zoteroSyncState.collections?.length || 0} collections • {zoteroSyncState.items?.length || 0} items
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card
          containerRef={tourRefs.openalexAnalytics}
          containerStyle={getTourHighlightStyle(tourRefs.openalexAnalytics)}
          title="OpenAlex Analytics"
          subtitle="Author and institution discovery."
        >
          <div style={{ display: "grid", gap: "8px" }}>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <input
                value={authorQuery}
                onChange={(e) => setAuthorQuery(e.target.value)}
                placeholder="Search authors"
                style={{
                  flex: "1 1 200px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(0,0,0,0.3)",
                  color: "#eaeaea",
                }}
              />
              <button
                onClick={runAuthorSearch}
                style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid rgba(20,184,166,0.4)",
                  background: "rgba(20,184,166,0.15)",
                  color: "#5eead4",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Authors
              </button>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <input
                value={institutionQuery}
                onChange={(e) => setInstitutionQuery(e.target.value)}
                placeholder="Search institutions"
                style={{
                  flex: "1 1 200px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(0,0,0,0.3)",
                  color: "#eaeaea",
                }}
              />
              <button
                onClick={runInstitutionSearch}
                style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid rgba(16,185,129,0.4)",
                  background: "rgba(16,185,129,0.15)",
                  color: "#6ee7b7",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Institutions
              </button>
            </div>
            <div style={{ fontSize: "12px", color: textSecondary }}>
              Auto-search triggers after you pause typing (3+ characters).
            </div>
          </div>
          {authorResults.length > 0 && (
            <div style={{ marginTop: "10px", fontSize: "12px", color: textSecondary }}>
              Top authors: {authorResults.slice(0, 3).map((a: any) => a.name).join(", ")}
            </div>
          )}
          {authorResults.length > 0 && (
            <div style={{ marginTop: "6px", fontSize: "12px", color: textSecondary }}>
              Dashboard: {authorSummary.count} authors • {authorSummary.totalWorks} works • {authorSummary.totalCited} citations
            </div>
          )}
          {authorResults.length > 0 && (
            <div style={{ marginTop: "10px", fontSize: "12px", color: textSecondary }}>
              Top authors by citations
              {renderBars(authorResults, "citedByCount")}
            </div>
          )}
          {institutionResults.length > 0 && (
            <div style={{ marginTop: "6px", fontSize: "12px", color: textSecondary }}>
              Top institutions: {institutionResults.slice(0, 3).map((i: any) => i.name).join(", ")}
            </div>
          )}
          {institutionResults.length > 0 && (
            <div style={{ marginTop: "6px", fontSize: "12px", color: textSecondary }}>
              Dashboard: {institutionSummary.count} institutions • {institutionSummary.totalWorks} works • {institutionSummary.totalCited} citations
            </div>
          )}
          {institutionResults.length > 0 && (
            <div style={{ marginTop: "10px", fontSize: "12px", color: textSecondary }}>
              Top institutions by works
              {renderBars(institutionResults, "worksCount")}
            </div>
          )}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "10px" }}>
            <button
              onClick={() => exportOpenAlexCsv("authors")}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid rgba(20,184,166,0.4)",
                background: "rgba(20,184,166,0.15)",
                color: "#5eead4",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              Export Authors CSV
            </button>
            <button
              onClick={() => exportOpenAlexCsv("institutions")}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid rgba(16,185,129,0.4)",
                background: "rgba(16,185,129,0.15)",
                color: "#6ee7b7",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              Export Institutions CSV
            </button>
            <button
              onClick={() => exportOpenAlexCsv("authors")}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid rgba(245,158,11,0.4)",
                background: "rgba(245,158,11,0.15)",
                color: "#fde68a",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              Export Authors CSV
            </button>
            <button
              onClick={() => exportOpenAlexCsv("institutions")}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid rgba(244,114,182,0.4)",
                background: "rgba(244,114,182,0.15)",
                color: "#f9a8d4",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              Export Institutions CSV
            </button>
          </div>
        </Card>

        <Card
          containerRef={tourRefs.prisma}
          containerStyle={getTourHighlightStyle(tourRefs.prisma)}
          title="PRISMA Workflow"
          subtitle="Systematic review tracking with audit‑ready counts."
        >
          {selectedDocumentId ? (
            <div style={{ display: "grid", gap: "8px", fontSize: "12px" }}>
              {[
                ["Identified", "identified"],
                ["Screened", "screened"],
                ["Excluded", "excluded"],
                ["Full‑text assessed", "fullTextAssessed"],
                ["Included", "included"],
              ].map(([label, key]) => (
                <label key={key as string} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span style={{ minWidth: "140px", color: "rgba(255,255,255,0.75)" }}>{label}</span>
                  <input
                    type="number"
                    value={prisma[key as keyof typeof prisma] || 0}
                    onChange={(e) => updatePrisma({ ...prisma, [key]: Number(e.target.value) })}
                    style={{
                      flex: "1 1 120px",
                      padding: "8px 10px",
                      borderRadius: "6px",
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(0,0,0,0.3)",
                      color: "#eaeaea",
                    }}
                  />
                </label>
              ))}
              <textarea
                value={prisma.notes || ""}
                onChange={(e) => updatePrisma({ ...prisma, notes: e.target.value })}
                placeholder="Notes / inclusion criteria"
                style={{
                  minHeight: "70px",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(0,0,0,0.3)",
                  color: "#eaeaea",
                }}
              />
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button
                  onClick={exportPrismaCsv}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid rgba(20,184,166,0.4)",
                    background: "rgba(20,184,166,0.15)",
                    color: "#5eead4",
                    cursor: "pointer",
                  }}
                >
                  Export CSV
                </button>
                <button
                  onClick={exportPrismaExcel}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid rgba(245,158,11,0.4)",
                    background: "rgba(245,158,11,0.15)",
                    color: "#fde68a",
                    cursor: "pointer",
                  }}
                >
                  Export Excel
                </button>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: "13px", color: textSecondary }}>
              Select a document to manage PRISMA counts.
            </div>
          )}
        </Card>

        <Card
          containerRef={tourRefs.libraryDb}
          containerStyle={getTourHighlightStyle(tourRefs.libraryDb)}
          title={t('researchHub.notionDb.title')}
          subtitle={t('researchHub.notionDb.subtitle')}
        >
          <div style={{ display: "grid", gap: "8px" }}>
            {!authLoading && !isAuthed && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "12px",
                  color: textSecondary,
                  background: "rgba(20,184,166,0.12)",
                  border: "1px solid rgba(20,184,166,0.25)",
                  padding: "6px 10px",
                  borderRadius: "8px",
                  width: "fit-content",
                }}
              >
                {t('researchHub.loginToLoad')}
                <button
                  onClick={() => nav("/login")}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "6px",
                    border: "1px solid rgba(20,184,166,0.4)",
                    background: "rgba(20,184,166,0.15)",
                    color: "#5eead4",
                    cursor: "pointer",
                    fontSize: "11px",
                  }}
                >
                  {t('researchHub.login')}
                </button>
              </div>
            )}
            {isAuthed && !canUseLibrary && (
              <div
                style={{
                  fontSize: "12px",
                   color: "hsl(var(--warning))",
                   background: "hsl(var(--warning) / 0.12)",
                   border: "1px solid hsl(var(--warning) / 0.25)",
                  padding: "6px 10px",
                  borderRadius: "8px",
                  width: "fit-content",
                }}
              >
                {t('researchHub.roleRequired')}
              </div>
            )}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <input
                value={newViewName}
                onChange={(e) => setNewViewName(e.target.value)}
                placeholder={t('researchHub.saveViewName')}
                style={{
                  flex: "1 1 160px",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(0,0,0,0.3)",
                  color: "#eaeaea",
                }}
              />
              <button
                onClick={saveView}
                disabled={!canUseLibrary}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid rgba(20,184,166,0.4)",
                  background: "rgba(20,184,166,0.15)",
                  color: "#5eead4",
                  cursor: "pointer",
                  opacity: canUseLibrary ? 1 : 0.5,
                }}
              >
                {t('researchHub.saveView')}
              </button>
              {savedViews.map((view) => (
                <button
                  key={view.name}
                  onClick={() => applyView(view)}
                  style={{
                    padding: "8px 10px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.15)",
                    background: "rgba(255,255,255,0.06)",
                    color: "#e5e7eb",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  {view.name}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <input
                value={libraryFilters.search}
                onChange={(e) => setLibraryFilters({ ...libraryFilters, search: e.target.value })}
                placeholder="Search"
                style={{
                  flex: "1 1 180px",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(0,0,0,0.3)",
                  color: "#eaeaea",
                }}
              />
              <input
                value={libraryFilters.category}
                onChange={(e) => setLibraryFilters({ ...libraryFilters, category: e.target.value })}
                placeholder="Category"
                style={{
                  flex: "1 1 140px",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(0,0,0,0.3)",
                  color: "#eaeaea",
                }}
              />
              <input
                value={libraryFilters.tag}
                onChange={(e) => setLibraryFilters({ ...libraryFilters, tag: e.target.value })}
                placeholder="Tag"
                style={{
                  flex: "1 1 120px",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(0,0,0,0.3)",
                  color: "#eaeaea",
                }}
              />
              <select
                value={libraryFilters.sort}
                onChange={(e) => setLibraryFilters({ ...libraryFilters, sort: e.target.value })}
                style={{
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(0,0,0,0.3)",
                  color: "#eaeaea",
                }}
              >
                <option value="createdAt">{t("research.sort.newest")}</option>
                <option value="title">{t("research.sort.title")}</option>
              </select>
              <button
                onClick={loadLibrary}
                disabled={!canUseLibrary}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid rgba(16,185,129,0.4)",
                  background: "rgba(16,185,129,0.15)",
                  color: "#6ee7b7",
                  cursor: "pointer",
                  opacity: canUseLibrary ? 1 : 0.5,
                }}
              >
                {t("action.load")}
              </button>
              <button
                onClick={() => setViewMode(viewMode === "list" ? "table" : "list")}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "rgba(255,255,255,0.06)",
                  color: "#e5e7eb",
                  cursor: "pointer",
                }}
              >
                {viewMode === "list" ? t("research.viewMode.table") : t("research.viewMode.list")}
              </button>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <div style={{ width: "100%", fontSize: "12px", color: textSecondary }}>
                Bulk edit applies to the selected rows below. Leave fields empty to keep existing values.
              </div>
              <div
                title="Allowed: letters, numbers, colon, hyphen, comma. Others will be removed."
                style={{ fontSize: "12px", color: textSecondary }}
              >
                Tag rules
              </div>
              <div
                style={{
                  width: "100%",
                  fontSize: "12px",
                  color: textSecondary,
                  border: "1px dashed rgba(255,255,255,0.15)",
                  borderRadius: "8px",
                  padding: "8px",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                Examples: "RAG, literature-review, EVIDENCE:strong" → "rag,literature-review,evidence:strong"
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "12px", color: textSecondary }}>{t("research.category")}</span>
                {categoryChips.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setPresetCategoryFilter(cat)}
                    style={{
                      padding: "4px 8px",
                      borderRadius: "999px",
                      border: "1px solid rgba(255,255,255,0.15)",
                      background: presetCategoryFilter === cat ? "rgba(20,184,166,0.2)" : "rgba(255,255,255,0.04)",
                      color: presetCategoryFilter === cat ? "#5eead4" : "#e5e7eb",
                      cursor: "pointer",
                      fontSize: "11px",
                    }}
                  >
                    {cat}
                  </button>
                ))}
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>{t("research.dragToReorder")}</span>
                <button
                  onClick={undoPresetReorder}
                  disabled={!lastPresetOrder}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "6px",
                    border: "1px solid rgba(255,255,255,0.15)",
                    background: lastPresetOrder ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)",
                    color: lastPresetOrder ? "#e5e7eb" : "rgba(255,255,255,0.4)",
                    cursor: lastPresetOrder ? "pointer" : "not-allowed",
                    fontSize: "11px",
                  }}
                  title={lastPresetOrder ? "Undo last reorder" : "No reorder to undo"}
                >
                  Undo reorder
                </button>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: textSecondary }}>{t("research.quickMerge")}</span>
                <select
                  value={mergeFromCategory}
                  onChange={(event) => setMergeFromCategory(event.target.value)}
                  style={{
                    padding: "6px 8px",
                    borderRadius: "6px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(0,0,0,0.3)",
                    color: "#eaeaea",
                    fontSize: "12px",
                  }}
                >
                  <option value="">{t("research.fromCategory")}</option>
                  {categoryChips.filter((cat) => cat !== "All").map((cat) => (
                    <option key={`from-${cat}`} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <select
                  value={mergeToCategory}
                  onChange={(event) => setMergeToCategory(event.target.value)}
                  style={{
                    padding: "6px 8px",
                    borderRadius: "6px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(0,0,0,0.3)",
                    color: "#eaeaea",
                    fontSize: "12px",
                  }}
                >
                  <option value="">{t("research.toCategory")}</option>
                  {categoryChips.filter((cat) => cat !== "All").map((cat) => (
                    <option key={`to-${cat}`} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <button
                  onClick={mergePresetCategories}
                  disabled={!mergeFromCategory || !mergeToCategory || mergeFromCategory === mergeToCategory}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "6px",
                    border: "1px solid rgba(16,185,129,0.4)",
                    background:
                      !mergeFromCategory || !mergeToCategory || mergeFromCategory === mergeToCategory
                        ? "rgba(16,185,129,0.05)"
                        : "rgba(16,185,129,0.15)",
                    color:
                      !mergeFromCategory || !mergeToCategory || mergeFromCategory === mergeToCategory
                        ? "rgba(110,231,183,0.4)"
                        : "#6ee7b7",
                    cursor:
                      !mergeFromCategory || !mergeToCategory || mergeFromCategory === mergeToCategory
                        ? "not-allowed"
                        : "pointer",
                    fontSize: "12px",
                  }}
                >
                  Merge
                </button>
                {mergeFromCategory && (
                  <span style={{ fontSize: "12px", color: textSecondary }}>
                    {mergePreviewCount} preset{mergePreviewCount === 1 ? "" : "s"} will move
                    {mergePreviewItems.length > 0 && (
                      <>
                        {" "}
                        • {mergePreviewItems.slice(0, 4).join(", ")}
                        {mergePreviewItems.length > 4 ? ` +${mergePreviewItems.length - 4} more` : ""}
                      </>
                    )}
                  </span>
                )}
                {mergeFromCategory && mergePreviewItems.length > 0 && (
                  <button
                    onClick={() => setMergePreviewExpanded((prev) => !prev)}
                    style={{
                      padding: "4px 8px",
                      borderRadius: "6px",
                      border: "1px solid rgba(255,255,255,0.15)",
                      background: "rgba(255,255,255,0.06)",
                      color: "#e5e7eb",
                      cursor: "pointer",
                      fontSize: "11px",
                    }}
                  >
                    {mergePreviewExpanded ? "Hide list" : "Show list"}
                  </button>
                )}
              </div>
              {mergePreviewExpanded && mergePreviewItems.length > 0 && (
                <div
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(0,0,0,0.25)",
                    color: textSecondary,
                    fontSize: "12px",
                    maxHeight: "120px",
                    overflowY: "auto",
                  }}
                >
                  <ul style={{ margin: 0, paddingLeft: "16px", display: "grid", gap: "4px" }}>
                    {mergePreviewItems.map((name) => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                </div>
              )}
              {presetNameConflict && (
                <div style={{ fontSize: "12px", color: "#fde68a", display: "flex", gap: "8px", alignItems: "center" }}>
                  <span>{presetNameConflict}</span>
                  {presetNameSuggestion && (
                    <button
                      onClick={applySuggestedPresetName}
                      style={{
                        padding: "4px 8px",
                        borderRadius: "6px",
                        border: "1px solid rgba(20,184,166,0.4)",
                        background: "rgba(20,184,166,0.15)",
                        color: "#5eead4",
                        cursor: "pointer",
                        fontSize: "11px",
                      }}
                    >
                      Use “{presetNameSuggestion.suggested}”
                    </button>
                  )}
                </div>
              )}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {tagPresets
                  .filter((preset) => presetCategoryFilter === "All" || preset.category === presetCategoryFilter)
                  .map((preset, idx) => {
                  const styles = [
                    { border: "1px solid rgba(20,184,166,0.4)", background: "rgba(20,184,166,0.15)", color: "#5eead4" },
                    { border: "1px solid rgba(16,185,129,0.4)", background: "rgba(16,185,129,0.15)", color: "#6ee7b7" },
                    { border: "1px solid rgba(245,158,11,0.4)", background: "rgba(245,158,11,0.15)", color: "#fde68a" },
                    { border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)", color: "#e5e7eb" },
                  ];
                  const style = styles[idx % styles.length];
                  return (
                    <div
                      key={preset.name}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setDragOverPresetName(preset.name);
                      }}
                      onDragLeave={() => setDragOverPresetName(null)}
                      onMouseEnter={() => setHoverPresetName(preset.name)}
                      onMouseLeave={() => setHoverPresetName(null)}
                      onDrop={() => {
                        if (dragPresetName) {
                          reorderTagPresets(dragPresetName, preset.name);
                        }
                        setDragPresetName(null);
                        setDragOverPresetName(null);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        flexWrap: "wrap",
                        maxWidth: "100%",
                        opacity: dragPresetName === preset.name ? 0.6 : 1,
                        padding: dragOverPresetName === preset.name ? "2px 4px" : undefined,
                        borderRadius: dragOverPresetName === preset.name ? "8px" : undefined,
                        border: dragOverPresetName === preset.name ? "1px dashed rgba(94,234,212,0.6)" : undefined,
                        background: dragOverPresetName === preset.name ? "rgba(20,184,166,0.12)" : undefined,
                      }}
                      title="Drag to reorder"
                    >
                      <span
                        draggable
                        onDragStart={() => setDragPresetName(preset.name)}
                        onDragEnd={() => setDragPresetName(null)}
                        onKeyDown={(event) => {
                          if (!event.altKey) return;
                          if (event.key === "ArrowUp") {
                            event.preventDefault();
                            movePreset(preset.name, -1);
                          }
                          if (event.key === "ArrowDown") {
                            event.preventDefault();
                            movePreset(preset.name, 1);
                          }
                        }}
                        tabIndex={0}
                        style={{
                          width: "18px",
                          textAlign: "center",
                          fontSize: "14px",
                          color: "var(--text-muted)",
                          cursor: "grab",
                        }}
                        title="Drag to reorder presets (Alt+↑/↓)"
                      >
                        ⋮⋮
                      </span>
                      {hoverPresetName === preset.name && (
                        <span
                          title="Shortcut: Alt+Up/Down to reorder"
                          style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)" }}
                        >
                          [i]
                        </span>
                      )}
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <button
                          onClick={() => movePreset(preset.name, -1)}
                          title="Move up"
                          style={{
                            width: "20px",
                            height: "16px",
                            borderRadius: "6px",
                            border: "1px solid rgba(255,255,255,0.15)",
                            background: "rgba(255,255,255,0.06)",
                            color: "#e5e7eb",
                            cursor: "pointer",
                            fontSize: "10px",
                            lineHeight: 1,
                          }}
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => movePreset(preset.name, 1)}
                          title="Move down"
                          style={{
                            width: "20px",
                            height: "16px",
                            borderRadius: "6px",
                            border: "1px solid rgba(255,255,255,0.15)",
                            background: "rgba(255,255,255,0.06)",
                            color: "#e5e7eb",
                            cursor: "pointer",
                            fontSize: "10px",
                            lineHeight: 1,
                          }}
                        >
                          ↓
                        </button>
                      </div>
                      <button
                        onClick={() => applyTagPreset(preset.value)}
                        style={{
                          padding: "6px 10px",
                          borderRadius: "6px",
                          border: style.border,
                          background: style.background,
                          color: style.color,
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                      >
                        Preset: {preset.name}
                      </button>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <input
                          value={presetNameDrafts[preset.name] ?? preset.name}
                          onChange={(event) => {
                            if (presetNameSuggestion?.original === preset.name) {
                              setPresetNameConflict(null);
                              setPresetNameSuggestion(null);
                            }
                            clearPresetNameAutosave(preset.name);
                            setPresetNameDrafts((prev) => ({ ...prev, [preset.name]: event.target.value }));
                          }}
                          onFocus={() => clearPresetNameAutosave(preset.name)}
                          onBlur={(event) => schedulePresetNameAutosave(preset.name, event.currentTarget.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              const draft = presetNameDrafts[preset.name] ?? preset.name;
                              clearPresetNameAutosave(preset.name);
                              const trimmedDraft = draft.trim();
                              if (trimmedDraft && trimmedDraft !== preset.name) {
                                updatePresetName(preset.name, trimmedDraft);
                              }
                              setPresetNameDrafts((prev) => {
                                const next = { ...prev };
                                delete next[preset.name];
                                return next;
                              });
                            }
                            if (event.key === "Escape") {
                              event.preventDefault();
                              clearPresetNameAutosave(preset.name);
                              setPresetNameDrafts((prev) => {
                                const next = { ...prev };
                                delete next[preset.name];
                                return next;
                              });
                              if (presetNameSuggestion?.original === preset.name) {
                                setPresetNameConflict(null);
                                setPresetNameSuggestion(null);
                              }
                            }
                            if (event.altKey && event.key === "ArrowUp") {
                              event.preventDefault();
                              movePreset(preset.name, -1);
                            }
                            if (event.altKey && event.key === "ArrowDown") {
                              event.preventDefault();
                              movePreset(preset.name, 1);
                            }
                          }}
                          title="Rename preset"
                          style={{
                            padding: "4px 6px",
                            borderRadius: "6px",
                            border:
                              presetNameSuggestion?.original === preset.name
                                ? "1px solid rgba(245,158,11,0.6)"
                                : "1px solid rgba(255,255,255,0.1)",
                            background:
                              presetNameSuggestion?.original === preset.name
                                ? "rgba(245,158,11,0.12)"
                                : "rgba(0,0,0,0.25)",
                            color: textSecondary,
                            fontSize: "11px",
                            minWidth: "110px",
                          }}
                        />
                        {pendingPresetAutosave[preset.name] === "name" && (
                          <span
                            title="Auto-save in 2s"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              fontSize: "11px",
                              color: textSecondary,
                              background: "rgba(255,255,255,0.06)",
                              border: "1px solid rgba(255,255,255,0.12)",
                              padding: "2px 6px",
                              borderRadius: "999px",
                            }}
                          >
                            <span
                              style={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "999px",
                                background: "#6ee7b7",
                              }}
                            />
                            Auto-save in 2s
                          </span>
                        )}
                        {presetNameDrafts[preset.name] && (
                          <div style={{ display: "inline-flex", gap: "4px", alignItems: "center" }}>
                            <button
                              onClick={() => {
                                const draft = presetNameDrafts[preset.name] ?? preset.name;
                                clearPresetNameAutosave(preset.name);
                                const trimmedDraft = draft.trim();
                                if (trimmedDraft && trimmedDraft !== preset.name) {
                                  updatePresetName(preset.name, trimmedDraft);
                                }
                                showInlineToast("Saved");
                                setPresetNameDrafts((prev) => {
                                  const next = { ...prev };
                                  delete next[preset.name];
                                  return next;
                                });
                              }}
                              title="Apply name"
                              disabled={(presetNameDrafts[preset.name] ?? "").trim() === preset.name}
                              style={{
                                padding: "4px 8px",
                                borderRadius: "6px",
                                border:
                                  (presetNameDrafts[preset.name] ?? "").trim() === preset.name
                                    ? "1px solid rgba(255,255,255,0.12)"
                                    : "1px solid rgba(20,184,166,0.4)",
                                background:
                                  (presetNameDrafts[preset.name] ?? "").trim() === preset.name
                                    ? "rgba(255,255,255,0.04)"
                                    : "rgba(20,184,166,0.15)",
                                color:
                                  (presetNameDrafts[preset.name] ?? "").trim() === preset.name
                                    ? "rgba(255,255,255,0.4)"
                                    : "#5eead4",
                                cursor:
                                  (presetNameDrafts[preset.name] ?? "").trim() === preset.name
                                    ? "not-allowed"
                                    : "pointer",
                                fontSize: "11px",
                              }}
                            >
                              Apply
                            </button>
                            <button
                              onClick={() => {
                                clearPresetNameAutosave(preset.name);
                                setPresetNameDrafts((prev) => {
                                  const next = { ...prev };
                                  delete next[preset.name];
                                  return next;
                                });
                                if (presetNameSuggestion?.original === preset.name) {
                                  setPresetNameConflict(null);
                                  setPresetNameSuggestion(null);
                                }
                              }}
                              title="Cancel rename"
                              style={{
                                width: "22px",
                                height: "22px",
                                borderRadius: "6px",
                                border: "1px solid rgba(255,255,255,0.15)",
                                background: "rgba(255,255,255,0.06)",
                                color: "#e5e7eb",
                                cursor: "pointer",
                                fontSize: "12px",
                                lineHeight: 1,
                              }}
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <input
                          value={presetCategoryDrafts[preset.name] ?? preset.category}
                          onChange={(event) => {
                            clearPresetCategoryAutosave(preset.name);
                            setPresetCategoryDrafts((prev) => ({ ...prev, [preset.name]: event.target.value }));
                          }}
                          onFocus={() => clearPresetCategoryAutosave(preset.name)}
                          onBlur={(event) =>
                            schedulePresetCategoryAutosave(preset.name, event.currentTarget.value, preset.category)
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              const draft = presetCategoryDrafts[preset.name] ?? preset.category;
                              clearPresetCategoryAutosave(preset.name);
                              const trimmedDraft = draft.trim();
                              if (trimmedDraft && trimmedDraft !== preset.category.trim()) {
                                updatePresetCategory(preset.name, trimmedDraft);
                              }
                              setPresetCategoryDrafts((prev) => {
                                const next = { ...prev };
                                delete next[preset.name];
                                return next;
                              });
                            }
                            if (event.key === "Escape") {
                              event.preventDefault();
                              clearPresetCategoryAutosave(preset.name);
                              setPresetCategoryDrafts((prev) => {
                                const next = { ...prev };
                                delete next[preset.name];
                                return next;
                              });
                            }
                          }}
                          title="Edit category"
                          style={{
                            padding: "4px 6px",
                            borderRadius: "6px",
                            border: "1px solid rgba(255,255,255,0.1)",
                            background: "rgba(0,0,0,0.25)",
                            color: textSecondary,
                            fontSize: "11px",
                            minWidth: "90px",
                          }}
                        />
                        {pendingPresetAutosave[preset.name] === "category" && (
                          <span
                            title="Auto-save in 2s"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              fontSize: "11px",
                              color: textSecondary,
                              background: "rgba(255,255,255,0.06)",
                              border: "1px solid rgba(255,255,255,0.12)",
                              padding: "2px 6px",
                              borderRadius: "999px",
                            }}
                          >
                            <span
                              style={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "999px",
                                background: "#6ee7b7",
                              }}
                            />
                            Auto-save in 2s
                          </span>
                        )}
                        {presetCategoryDrafts[preset.name] && (
                          <div style={{ display: "inline-flex", gap: "4px", alignItems: "center" }}>
                            <button
                              onClick={() => {
                                const draft = presetCategoryDrafts[preset.name] ?? preset.category;
                                clearPresetCategoryAutosave(preset.name);
                                const trimmedDraft = draft.trim();
                                if (trimmedDraft && trimmedDraft !== preset.category.trim()) {
                                  updatePresetCategory(preset.name, trimmedDraft);
                                }
                                showInlineToast("Saved");
                                setPresetCategoryDrafts((prev) => {
                                  const next = { ...prev };
                                  delete next[preset.name];
                                  return next;
                                });
                              }}
                              title="Apply category"
                              disabled={(presetCategoryDrafts[preset.name] ?? "").trim() === preset.category.trim()}
                              style={{
                                padding: "4px 8px",
                                borderRadius: "6px",
                                border:
                                  (presetCategoryDrafts[preset.name] ?? "").trim() === preset.category.trim()
                                    ? "1px solid rgba(255,255,255,0.12)"
                                    : "1px solid rgba(20,184,166,0.4)",
                                background:
                                  (presetCategoryDrafts[preset.name] ?? "").trim() === preset.category.trim()
                                    ? "rgba(255,255,255,0.04)"
                                    : "rgba(20,184,166,0.15)",
                                color:
                                  (presetCategoryDrafts[preset.name] ?? "").trim() === preset.category.trim()
                                    ? "rgba(255,255,255,0.4)"
                                    : "#5eead4",
                                cursor:
                                  (presetCategoryDrafts[preset.name] ?? "").trim() === preset.category.trim()
                                    ? "not-allowed"
                                    : "pointer",
                                fontSize: "11px",
                              }}
                            >
                              Apply
                            </button>
                            <button
                              onClick={() => {
                                clearPresetCategoryAutosave(preset.name);
                                setPresetCategoryDrafts((prev) => {
                                  const next = { ...prev };
                                  delete next[preset.name];
                                  return next;
                                });
                              }}
                              title="Cancel category edit"
                              style={{
                                width: "22px",
                                height: "22px",
                                borderRadius: "6px",
                                border: "1px solid rgba(255,255,255,0.15)",
                                background: "rgba(255,255,255,0.06)",
                                color: "#e5e7eb",
                                cursor: "pointer",
                                fontSize: "12px",
                                lineHeight: 1,
                              }}
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => removeTagPreset(preset.name)}
                        title="Remove preset"
                        style={{
                          width: "22px",
                          height: "22px",
                          borderRadius: "999px",
                          border: "1px solid rgba(255,255,255,0.15)",
                          background: "rgba(255,255,255,0.06)",
                          color: "#e5e7eb",
                          cursor: "pointer",
                          fontSize: "12px",
                          lineHeight: 1,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                <input
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="Preset name"
                  style={{
                    padding: "6px 8px",
                    borderRadius: "6px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(0,0,0,0.3)",
                    color: "#eaeaea",
                    minWidth: "140px",
                  }}
                />
                <input
                  value={newPresetCategory}
                  onChange={(e) => setNewPresetCategory(e.target.value)}
                  placeholder="Category"
                  style={{
                    padding: "6px 8px",
                    borderRadius: "6px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(0,0,0,0.3)",
                    color: "#eaeaea",
                    minWidth: "120px",
                  }}
                />
                <input
                  value={newPresetValue}
                  onChange={(e) => setNewPresetValue(e.target.value)}
                  placeholder="Tags (comma‑separated)"
                  style={{
                    flex: "1 1 220px",
                    padding: "6px 8px",
                    borderRadius: "6px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(0,0,0,0.3)",
                    color: "#eaeaea",
                  }}
                />
                <button
                  onClick={addTagPreset}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "6px",
                    border: "1px solid rgba(16,185,129,0.4)",
                    background: "rgba(16,185,129,0.15)",
                    color: "#6ee7b7",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  Save preset
                </button>
              </div>
              <div style={{ width: "100%", display: "grid", gap: "6px" }}>
                <div style={{ fontSize: "12px", color: textSecondary }}>
                  Presets JSON (backup or share)
                </div>
                <textarea
                  value={presetJsonInput}
                  onChange={(e) => setPresetJsonInput(e.target.value)}
                  placeholder='[{"name":"Notes","value":"summary,insight"}]'
                  rows={4}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(0,0,0,0.3)",
                    color: "#eaeaea",
                    fontSize: "12px",
                  }}
                />
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    onClick={exportPresetsJson}
                    style={{
                      padding: "6px 10px",
                      borderRadius: "6px",
                      border: "1px solid rgba(20,184,166,0.4)",
                      background: "rgba(20,184,166,0.15)",
                      color: "#5eead4",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    Export JSON
                  </button>
                  <button
                    onClick={copyPresetsJson}
                    style={{
                      padding: "6px 10px",
                      borderRadius: "6px",
                      border: "1px solid rgba(16,185,129,0.4)",
                      background: "rgba(16,185,129,0.15)",
                      color: "#6ee7b7",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    Copy JSON
                  </button>
                  <button
                    onClick={importPresetsJson}
                    style={{
                      padding: "6px 10px",
                      borderRadius: "6px",
                      border: "1px solid rgba(245,158,11,0.4)",
                      background: "rgba(245,158,11,0.15)",
                      color: "#fde68a",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    Import JSON
                  </button>
                  <button
                    onClick={savePresetSnapshot}
                    style={{
                      padding: "6px 10px",
                      borderRadius: "6px",
                      border: "1px solid rgba(255,255,255,0.15)",
                      background: "rgba(255,255,255,0.06)",
                      color: "#e5e7eb",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    Save snapshot
                  </button>
                </div>
                {presetHistory.length > 0 && (
                  <div style={{ display: "grid", gap: "6px" }}>
                    <div style={{ fontSize: "12px", color: textSecondary }}>{t("research.presetHistory")}</div>
                    {presetHistory.slice(0, 5).map((entry) => (
                      <div
                        key={entry.id}
                        style={{
                          display: "flex",
                          gap: "8px",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "6px 8px",
                          borderRadius: "8px",
                          border: "1px solid rgba(255,255,255,0.08)",
                          background: "rgba(255,255,255,0.04)",
                          fontSize: "11px",
                          color: textSecondary,
                        }}
                      >
                        <span>
                          {entry.label} • {new Date(entry.savedAt).toLocaleString()}
                        </span>
                        <button
                          onClick={() => restorePresetSnapshot(entry)}
                          style={{
                            padding: "4px 8px",
                            borderRadius: "6px",
                            border: "1px solid rgba(20,184,166,0.4)",
                            background: "rgba(20,184,166,0.15)",
                            color: "#5eead4",
                            cursor: "pointer",
                            fontSize: "11px",
                          }}
                        >
                          Restore
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <input
                value={bulkTags}
                onChange={(e) => setBulkTags(e.target.value)}
                placeholder="Bulk tags (comma‑separated)"
                style={{
                  flex: "1 1 200px",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(0,0,0,0.3)",
                  color: "#eaeaea",
                }}
              />
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: textSecondary }}>
                <input
                  type="checkbox"
                  checked={autoPreviewTags}
                  onChange={(e) => setAutoPreviewTags(e.target.checked)}
                />
                Auto‑preview
              </label>
              <button
                onClick={() => {
                  const normalized = bulkTags
                    .split(/[,\s]+/)
                    .map(tag => tag.trim())
                    .filter(tag => tag.length > 0)
                    .map(tag => tag.toLowerCase().replace(/[^a-z0-9\-:,]/g, ''))
                    .filter((tag, index, arr) => arr.indexOf(tag) === index)
                    .join(', ');
                  setBulkTags(normalized);
                }}
                style={{
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "rgba(255,255,255,0.06)",
                  color: "#e5e7eb",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                {t('researchHub.normalizeTags')}
              </button>
              <select
                value={bulkTagsMode}
                onChange={(e) => setBulkTagsMode(e.target.value as "overwrite" | "prepend" | "append")}
                style={{
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(0,0,0,0.3)",
                  color: "#eaeaea",
                }}
              >
                <option value="overwrite">Tags: overwrite</option>
                <option value="prepend">Tags: prepend</option>
                <option value="append">Tags: append</option>
              </select>
              {(bulkTagsPreview || bulkTagsInvalid) && (
                <div style={{ width: "100%", fontSize: "12px", color: textSecondary }}>
                  {bulkTagsPreview && (
                    <div title="Normalized, deduplicated tags preview." style={{ color: "rgba(16,185,129,0.9)" }}>
                      Preview: {bulkTagsPreview}
                    </div>
                  )}
                  {bulkTagsInvalid && (
                    <div
                      title="Removed invalid characters. Allowed: letters, numbers, hyphen, colon, comma."
                      style={{ color: "rgba(239,68,68,0.9)" }}
                    >
                      Removed: {bulkTagsInvalid}
                    </div>
                  )}
                </div>
              )}
              <input
                value={bulkCategory}
                onChange={(e) => setBulkCategory(e.target.value)}
                placeholder="Bulk category"
                style={{
                  flex: "1 1 160px",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(0,0,0,0.3)",
                  color: "#eaeaea",
                }}
              />
              <input
                value={bulkTitle}
                onChange={(e) => setBulkTitle(e.target.value)}
                placeholder="Bulk title (overwrites)"
                style={{
                  flex: "1 1 180px",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(0,0,0,0.3)",
                  color: "#eaeaea",
                }}
              />
              <input
                value={bulkNotes}
                onChange={(e) => setBulkNotes(e.target.value)}
                placeholder="Bulk notes"
                style={{
                  flex: "1 1 220px",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(0,0,0,0.3)",
                  color: "#eaeaea",
                }}
              />
              <select
                value={bulkNotesMode}
                onChange={(e) => setBulkNotesMode(e.target.value as "overwrite" | "prepend" | "append")}
                style={{
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(0,0,0,0.3)",
                  color: "#eaeaea",
                }}
              >
                <option value="overwrite">Notes: overwrite</option>
                <option value="prepend">Notes: prepend</option>
                <option value="append">Notes: append</option>
              </select>
              <button
                onClick={applyBulkEdit}
                disabled={!canUseLibrary}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid rgba(16,185,129,0.4)",
                  background: "rgba(16,185,129,0.15)",
                  color: "#6ee7b7",
                  cursor: "pointer",
                  opacity: canUseLibrary ? 1 : 0.5,
                }}
              >
                Apply Bulk
              </button>
            </div>
            {libraryItems.length ? (
              viewMode === "table" ? (
                <div style={{ display: "grid", gap: "6px", fontSize: "12px" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "32px 1fr 120px 1fr 64px",
                      color: textSecondary,
                      padding: "6px 0",
                    }}
                  >
                    <div />
                    <div>{t("research.table.title")}</div>
                    <div>{t("research.table.category")}</div>
                    <div>{t("research.table.tags")}</div>
                    <div />
                  </div>
                  <VirtualList
                    items={libraryItems}
                    height={libraryItems.length > 8 ? 320 : libraryItems.length * 36}
                    itemHeight={36}
                    renderItem={(item: any) => (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "32px 1fr 120px 1fr 64px",
                          alignItems: "center",
                          padding: "6px 0",
                          borderTop: "1px solid rgba(255,255,255,0.06)",
                          color: "rgba(255,255,255,0.8)",
                        }}
                      >
                        <div>
                          <input
                            type="checkbox"
                            checked={selectedLibraryIds.includes(item.id)}
                            onChange={() => toggleSelectLibrary(item.id)}
                          />
                        </div>
                        <div>{item.title || item.segmentTitle || "Untitled"}</div>
                        <div>{item.category || "General"}</div>
                        <div>{item.tags || "-"}</div>
                        <div>
                          <button
                            onClick={() => startInlineEdit(item)}
                            style={{
                              padding: "4px 8px",
                              borderRadius: "6px",
                              border: "1px solid rgba(20,184,166,0.4)",
                              background: "rgba(20,184,166,0.15)",
                              color: "#5eead4",
                              cursor: "pointer",
                              fontSize: "11px",
                            }}
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    )}
                  />
                </div>
              ) : (
                <VirtualList
                  items={libraryItems}
                  height={libraryItems.length > 6 ? 360 : libraryItems.length * 120}
                  itemHeight={120}
                  renderItem={(item: any) => (
                    <div style={{ color: "rgba(255,255,255,0.75)", fontSize: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <input
                          type="checkbox"
                          checked={selectedLibraryIds.includes(item.id)}
                          onChange={() => toggleSelectLibrary(item.id)}
                        />
                        {editingItemId === item.id ? (
                          <div style={{ display: "grid", gap: "6px", flex: 1 }}>
                            <input
                              value={editDraft.title}
                              onChange={(e) => setEditDraft({ ...editDraft, title: e.target.value })}
                              placeholder="Title"
                              style={{
                                padding: "6px 8px",
                                borderRadius: "6px",
                                border: "1px solid rgba(255,255,255,0.1)",
                                background: "rgba(0,0,0,0.3)",
                                color: "#eaeaea",
                              }}
                            />
                            <input
                              value={editDraft.category}
                              onChange={(e) => setEditDraft({ ...editDraft, category: e.target.value })}
                              placeholder="Category"
                              style={{
                                padding: "6px 8px",
                                borderRadius: "6px",
                                border: "1px solid rgba(255,255,255,0.1)",
                                background: "rgba(0,0,0,0.3)",
                                color: "#eaeaea",
                              }}
                            />
                            <input
                              value={editDraft.tags}
                              onChange={(e) => setEditDraft({ ...editDraft, tags: e.target.value })}
                              placeholder="Tags"
                              style={{
                                padding: "6px 8px",
                                borderRadius: "6px",
                                border: "1px solid rgba(255,255,255,0.1)",
                                background: "rgba(0,0,0,0.3)",
                                color: "#eaeaea",
                              }}
                            />
                            <textarea
                              value={editDraft.notes}
                              onChange={(e) => setEditDraft({ ...editDraft, notes: e.target.value })}
                              placeholder="Notes"
                              style={{
                                padding: "6px 8px",
                                borderRadius: "6px",
                                border: "1px solid rgba(255,255,255,0.1)",
                                background: "rgba(0,0,0,0.3)",
                                color: "#eaeaea",
                                minHeight: "56px",
                              }}
                            />
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button
                                onClick={() => saveInlineEdit(item.id)}
                                style={{
                                  padding: "6px 10px",
                                  borderRadius: "6px",
                                  border: "1px solid rgba(16,185,129,0.4)",
                                  background: "rgba(16,185,129,0.15)",
                                  color: "#6ee7b7",
                                  cursor: "pointer",
                                }}
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingItemId(null)}
                                style={{
                                  padding: "6px 10px",
                                  borderRadius: "6px",
                                  border: "1px solid rgba(255,255,255,0.15)",
                                  background: "rgba(255,255,255,0.06)",
                                  color: "#e5e7eb",
                                  cursor: "pointer",
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", flex: 1 }}>
                            <div>
                              {item.title || item.segmentTitle || "Untitled"} • {item.category || "General"} •{" "}
                              {item.tags || "-"}
                            </div>
                            <button
                              onClick={() => startInlineEdit(item)}
                              style={{
                                padding: "4px 8px",
                                borderRadius: "6px",
                                border: "1px solid rgba(20,184,166,0.4)",
                                background: "rgba(20,184,166,0.15)",
                                color: "#5eead4",
                                cursor: "pointer",
                                fontSize: "11px",
                              }}
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                />
              )
            ) : (
              <div style={{ fontSize: "12px", color: textSecondary }}>
                No library items loaded yet.
              </div>
            )}
          </div>
        </Card>

        {isAdmin && (
          <Card
            title="Role Mapping (Debug)"
            subtitle="JWT-derived roles and feature access."
          >
            <div style={{ display: "grid", gap: "8px", fontSize: "12px", color: textSecondary }}>
              <div>Roles: {userRoles.length ? userRoles.join(", ") : "none"}</div>
              <div>Research tools access: {canUseResearchTools ? "enabled" : "disabled"}</div>
              <div>Library access: {canUseLibrary ? "enabled" : "disabled"}</div>
              <div style={{ color: "rgba(255,255,255,0.5)" }}>
                Token-based roles derived from JWT (role/roles/is_admin).
              </div>
              {jwtPayloadRaw && (
                <pre
                  style={{
                    margin: 0,
                    padding: "8px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(0,0,0,0.3)",
                    color: "rgba(255,255,255,0.75)",
                    fontSize: "11px",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {jwtPayloadRaw}
                </pre>
              )}
              {jwtPayloadRaw && (
                <button
                  onClick={copyJwtPayload}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "6px",
                    border: "1px solid rgba(20,184,166,0.4)",
                    background: "rgba(20,184,166,0.15)",
                    color: "#5eead4",
                    cursor: "pointer",
                    fontSize: "12px",
                    width: "fit-content",
                  }}
                >
                  Copy payload
                </button>
              )}
            </div>
          </Card>
        )}

        <Card
          title="Telemetry (API Errors)"
          subtitle="Recent API failures recorded locally."
        >
          <div style={{ display: "grid", gap: "8px" }}>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
              <button
                onClick={clearApiErrors}
                style={{
                  padding: "6px 10px",
                  borderRadius: "6px",
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "rgba(255,255,255,0.06)",
                  color: "#e5e7eb",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                Clear
              </button>
              <button
                onClick={exportApiErrorsJson}
                style={{
                  padding: "6px 10px",
                  borderRadius: "6px",
                  border: "1px solid rgba(20,184,166,0.4)",
                  background: "rgba(20,184,166,0.15)",
                  color: "#5eead4",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                Export JSON
              </button>
              <span style={{ fontSize: "12px", color: textSecondary }}>
                Stored locally in this browser
              </span>
            </div>
            {apiErrors.length ? (
              <div style={{ display: "grid", gap: "6px", fontSize: "12px" }}>
                {apiErrors.slice(0, 8).map((entry, idx) => (
                  <div
                    key={`${entry.endpoint}-${entry.ts}-${idx}`}
                    style={{
                      padding: "6px 8px",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(255,255,255,0.04)",
                      color: "rgba(255,255,255,0.75)",
                    }}
                  >
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>
                      {new Date(entry.ts).toLocaleString()}
                    </div>
                    <div>{entry.endpoint}</div>
                    <div style={{ color: "#fca5a5" }}>{entry.message}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: "12px", color: textSecondary }}>
                No API errors recorded.
              </div>
            )}
          </div>
        </Card>

        <Card
          containerRef={tourRefs.mendeley}
          containerStyle={getTourHighlightStyle(tourRefs.mendeley)}
          title="Mendeley Citation Manager"
          subtitle="OAuth connect + fetch your library."
        >
          {!authLoading && !isAuthed && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "12px",
                color: textSecondary,
                background: "rgba(20,184,166,0.12)",
                border: "1px solid rgba(20,184,166,0.25)",
                padding: "6px 10px",
                borderRadius: "8px",
                width: "fit-content",
                marginBottom: "8px",
              }}
            >
              {t('researchHub.loginToLoad')}
              <button
                onClick={() => nav("/login")}
                style={{
                  padding: "4px 8px",
                  borderRadius: "6px",
                  border: "1px solid rgba(20,184,166,0.4)",
                  background: "rgba(20,184,166,0.15)",
                  color: "#5eead4",
                  cursor: "pointer",
                  fontSize: "11px",
                }}
              >
                {t('researchHub.login')}
              </button>
            </div>
          )}
          {isAuthed && !canUseResearchTools && (
            <div
              style={{
                fontSize: "12px",
                color: "hsl(var(--warning))",
                background: "hsl(var(--warning) / 0.12)",
                border: "1px solid hsl(var(--warning) / 0.25)",
                padding: "6px 10px",
                borderRadius: "8px",
                width: "fit-content",
                marginBottom: "8px",
              }}
            >
              {t('researchHub.roleRequired')}
            </div>
          )}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              onClick={connectMendeley}
              disabled={!canUseResearchTools}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid rgba(16,185,129,0.4)",
                background: "rgba(16,185,129,0.15)",
                color: "#6ee7b7",
                cursor: "pointer",
                opacity: canUseResearchTools ? 1 : 0.5,
              }}
            >
              Connect Mendeley
            </button>
            <button
              onClick={loadMendeley}
              disabled={!canUseResearchTools}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid rgba(20,184,166,0.4)",
                background: "rgba(20,184,166,0.15)",
                color: "#5eead4",
                cursor: "pointer",
                opacity: canUseResearchTools ? 1 : 0.5,
              }}
            >
              Fetch Library
            </button>
            <input
              value={mendeleyToken}
              onChange={(e) => setMendeleyToken(e.target.value)}
              placeholder="Optional access token (fallback)"
              disabled={!canUseResearchTools}
              style={{
                flex: "1 1 220px",
                padding: "8px 10px",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(0,0,0,0.3)",
                color: "#eaeaea",
                opacity: canUseResearchTools ? 1 : 0.5,
              }}
            />
          </div>
          {mendeleyConnected && (
            <div style={{ marginTop: "8px", fontSize: "12px", color: textSecondary }}>
              Connected via OAuth{mendeleyExpiresAt ? ` • Expires ${new Date(mendeleyExpiresAt).toLocaleString()}` : ""}.
              {mendeleyHasRefresh ? " Auto‑refresh enabled." : " Auto‑refresh unavailable."}
            </div>
          )}
          {mendeleyResults.length > 0 && (
            <div style={{ marginTop: "8px", fontSize: "12px", color: textSecondary }}>
              Loaded {mendeleyResults.length} documents.
            </div>
          )}
        </Card>
          </>
        )}
      </div>

      <div ref={tourRefs.results} style={getTourHighlightStyle(tourRefs.results)}>
        <div
          style={{
            position: "static",
            marginTop: "24px",
            marginBottom: "16px",
            padding: "6px 10px",
            borderRadius: "999px",
            background: isLight ? "rgba(47, 41, 65, 0.08)" : "rgba(0,0,0,0.55)",
            border: isLight ? "1px solid rgba(47, 41, 65, 0.12)" : "1px solid rgba(255,255,255,0.08)",
            color: isLight ? "#2f2941" : "rgba(255,255,255,0.7)",
            fontSize: "12px",
            width: "fit-content",
            backdropFilter: "blur(6px)",
          }}
        >
          Search Results
        </div>
      </div>

      <div style={{ marginTop: "var(--section-gap)", display: "grid", gap: "20px" }}>
        <Card title="OpenAlex Results" subtitle="High-coverage academic works.">
          {openalexDisplayResults.length ? (
            renderList(openalexDisplayResults, openalexVisibleCount, openalexLoadRef, openalexIsLoadingMore)
          ) : (
            <div style={{ opacity: 0.6 }}>No results yet.</div>
          )}
        </Card>
        <Card title="Semantic Scholar Results" subtitle="AI‑curated citations and authors.">
          {semanticResults.length ? (
            renderList(semanticResults, semanticVisibleCount, semanticLoadRef, semanticIsLoadingMore)
          ) : (
            <div style={{ opacity: 0.6 }}>No results yet.</div>
          )}
        </Card>
        <Card title="arXiv Results" subtitle="Preprints for fast‑moving fields.">
          {arxivResults.length ? (
            renderList(arxivResults, arxivVisibleCount, arxivLoadRef, arxivIsLoadingMore)
          ) : (
            <div style={{ opacity: 0.6 }}>No results yet.</div>
          )}
        </Card>
      </div>
      <ResearchTourComponent />

      {/* Plugin Slot for Custom Research Tools */}
      <div style={{ marginTop: "var(--section-gap)" }}>
        <div
          style={{
            padding: "6px 10px",
            borderRadius: "999px",
            background: isLight ? "rgba(139, 92, 246, 0.1)" : "rgba(139, 92, 246, 0.15)",
            border: "1px solid rgba(139, 92, 246, 0.25)",
            color: isLight ? "#2f2941" : "rgba(255,255,255,0.8)",
            fontSize: "12px",
            width: "fit-content",
            marginTop: "8px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          🔌 Plugin Extensions
        </div>
        <PluginSlot slot="panel" context={{ location: "research-hub" }} />
        {/* Default placeholder when no plugins are registered */}
        <div
          style={{
            background: isLight ? "#ffffff" : "linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(99, 102, 241, 0.05) 100%)",
            border: isLight ? "1px dashed rgba(139, 92, 246, 0.4)" : "1px dashed rgba(139, 92, 246, 0.3)",
            borderRadius: "16px",
            padding: "32px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>🧩</div>
          <h3 style={{ fontSize: "16px", fontWeight: 600, color: isLight ? "#2f2941" : "#eaeaea", margin: "0 0 8px 0" }}>
            Plugin Slot Available
          </h3>
          <p style={{ fontSize: "13px", color: isLight ? "rgba(47, 41, 65, 0.65)" : "rgba(255, 255, 255, 0.5)", margin: 0 }}>
            Custom research tools and extensions can be loaded here.
            Register plugins via the Plugin System to add functionality.
          </p>
        </div>
      </div>


      {/* Ultimate Unified Color Manager */}
      {/* ModernColorManager is now global in App.tsx */}
      
      {/* Screenshot Mode */}
      <ScreenshotMode
        isActive={screenshotModeActive}
        onToggle={() => setScreenshotModeActive(!screenshotModeActive)}
      />
    </PageShell>
  );
}





