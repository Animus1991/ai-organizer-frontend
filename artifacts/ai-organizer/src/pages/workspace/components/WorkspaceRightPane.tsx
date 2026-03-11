import React from "react";
import SegmentationSummaryBar from "../../../components/SegmentationSummaryBar";
import FolderDropZone from "../../../components/FolderDropZone";
import { WorkspaceToolbar, WorkspaceFilters, SegmentList } from "../../../components/workspace";
import { ErrorBoundary } from "../../../components/ErrorBoundary";
import type { SegmentSort } from "../../../components/workspace/WorkspaceFilters";
import { useLanguage } from "../../../context/LanguageContext";

type WorkspaceRightPaneProps = {
  tourRefs: {
    controls: React.RefObject<HTMLDivElement | null>;
    segments: React.RefObject<HTMLDivElement | null>;
  };
  getTourHighlightStyle: (ref: React.RefObject<HTMLDivElement | null>) => React.CSSProperties | undefined;
  status: string;
  mode: any;
  setMode: (mode: any) => void;
  loadSegs: () => void;
  runSegmentation: () => void;
  deleteModeSegments: () => void;
  onOpenManual: () => void;
  filteredSegments: any[];
  docId: number;
  notesOpen: boolean;
  onToggleNotes: () => void;
  smartNotesOpen: boolean;
  onToggleSmartNotes: () => void;
  smartNotes: any[];
  onLoadSmartNotes: () => Promise<void>;
  onCreateNewSmartNote: () => void;
  canSegment: boolean;
  parseStatus: string;
  summaryByMode: any;
  segmentsMeta: any;
  onLoadSummary: () => void;
  sourceFilter: any;
  setSourceFilter: (value: any) => void;
  folderFilter: any;
  setFolderFilter: (value: any) => void;
  query: string;
  setQuery: (value: string) => void;
  advancedFiltersOpen: boolean;
  setAdvancedFiltersOpen: (value: boolean) => void;
  sortBy: SegmentSort;
  setSortBy: (value: SegmentSort) => void;
  savedViews?: Array<{ id: string; name: string }>;
  activeSavedViewId?: string | null;
  onApplySavedView?: (id: string) => void;
  onClearSavedView?: () => void;
  onSaveCurrentView?: (name: string, overwriteId?: string | null) => void;
  onRenameSavedView?: (id: string, name: string) => void;
  onDeleteSavedView?: (id: string) => void;
  minLength?: number;
  setMinLength: (value?: number) => void;
  maxLength?: number;
  setMaxLength: (value?: number) => void;
  activePreset: any;
  setActivePreset: (value: any) => void;
  onFoldersOpen: () => void;
  onWizardOpen: () => void;
  onStructureTreeOpen: () => void;
  onSearchModalOpen: () => void;
  folders: any[];
  semanticSearch: boolean;
  setSemanticSearch: (enabled: boolean) => void;
  searchLanguage: "auto" | "el" | "en";
  setSearchLanguage: (lang: "auto" | "el" | "en") => void;
  expandVariations: boolean;
  setExpandVariations: (value: boolean) => void;
  onSynonymsManagerOpen: () => void;
  dateFrom: Date | null;
  setDateFrom: (date: Date | null) => void;
  dateTo: Date | null;
  setDateTo: (date: Date | null) => void;
  segmentTypeFilter: any;
  setSegmentTypeFilter: (value: any) => void;
  evidenceGradeFilter: any;
  setEvidenceGradeFilter: (value: any) => void;
  showFilterHelp: boolean;
  setShowFilterHelp: (value: boolean) => void;
  draggedSegment: any | null;
  dragOverFolder: string | null;
  setDragOverFolder: (value: string | null) => void;
  handleDropOnNoFolder: (e: React.DragEvent) => void;
  handleDropOnFolder: (e: React.DragEvent, folderId: string) => void;
  folderMap: Record<string, string>;
  selectedSegId: number | null;
  openSeg: any | null;
  deletingSegId: number | null;
  listScrollRef: React.RefObject<HTMLDivElement | null>;
  segHtmlKey: (segId: number) => string;
  segments: any[];
  onSelect: (seg: any) => void;
  onOpen: (seg: any) => void;
  onDragStart: (e: React.DragEvent, seg: any) => void;
  onDragEnd: () => void;
  onFolderChange: (segment: any, folderId: string | null) => void;
  onEdit: (seg: any) => void;
  onDelete: (seg: any) => void;
  onConfirmDelete: (seg: any) => void;
  onCancelDelete: () => void;
  onBackToList: () => void;
  onBackFromFolder: () => void;
  onChunkUpdated: () => void;
};

export function WorkspaceRightPane({
  tourRefs,
  getTourHighlightStyle,
  mode,
  setMode,
  loadSegs,
  runSegmentation,
  deleteModeSegments,
  onOpenManual,
  filteredSegments,
  docId,
  notesOpen,
  onToggleNotes,
  smartNotesOpen,
  onToggleSmartNotes,
  smartNotes,
  onLoadSmartNotes,
  onCreateNewSmartNote,
  canSegment,
  parseStatus,
  summaryByMode,
  segmentsMeta,
  onLoadSummary,
  sourceFilter,
  setSourceFilter,
  folderFilter,
  setFolderFilter,
  query,
  setQuery,
  advancedFiltersOpen,
  setAdvancedFiltersOpen,
  sortBy,
  setSortBy,
  savedViews,
  activeSavedViewId,
  onApplySavedView,
  onClearSavedView,
  onSaveCurrentView,
  onRenameSavedView,
  onDeleteSavedView,
  minLength,
  setMinLength,
  maxLength,
  setMaxLength,
  activePreset,
  setActivePreset,
  onFoldersOpen,
  onWizardOpen,
  onStructureTreeOpen,
  onSearchModalOpen,
  folders,
  semanticSearch,
  setSemanticSearch,
  searchLanguage,
  setSearchLanguage,
  expandVariations,
  setExpandVariations,
  onSynonymsManagerOpen,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  segmentTypeFilter,
  setSegmentTypeFilter,
  evidenceGradeFilter,
  setEvidenceGradeFilter,
  showFilterHelp,
  setShowFilterHelp,
  draggedSegment,
  dragOverFolder,
  setDragOverFolder,
  handleDropOnNoFolder,
  handleDropOnFolder,
  folderMap,
  selectedSegId,
  openSeg,
  deletingSegId,
  listScrollRef,
  segHtmlKey,
  segments,
  onSelect,
  onOpen,
  onDragStart,
  onDragEnd,
  onFolderChange,
  onEdit,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
  onBackToList,
  onBackFromFolder,
  onChunkUpdated,
}: WorkspaceRightPaneProps) {
  const isListMode = false;
  const { t } = useLanguage();

  const helpSections: Array<{ title: string; items: Array<{ label: string; desc: string }> }> = [
    {
      title: t("wsHelp.section.header"),
      items: [
        { label: t("btn.editDocument"), desc: t("wsHelp.header.editDocument") },
        { label: t("btn.viewDocument"), desc: t("wsHelp.header.viewDocument") },
        { label: t("btn.home"), desc: t("wsHelp.header.home") },
        { label: t("action.startTour"), desc: t("wsHelp.header.startTour") },
        { label: t("workspace.readableWidth"), desc: t("wsHelp.header.readableWidth") },
      ],
    },
    {
      title: t("wsHelp.section.toolbar"),
      items: [
        { label: t("docPage.mode"), desc: t("wsHelp.toolbar.mode") },
        { label: t("docPage.list"), desc: t("wsHelp.toolbar.list") },
        { label: t("docPage.segment"), desc: t("wsHelp.toolbar.segment") },
        { label: t("action.delete"), desc: t("wsHelp.toolbar.deleteMode") },
        { label: t("docPage.addChunk"), desc: t("wsHelp.toolbar.manualChunk") },
        { label: t("action.export"), desc: t("wsHelp.toolbar.export") },
        { label: t("workspace.importSegments"), desc: t("wsHelp.toolbar.importSegments") },
        { label: t("workspace.stats"), desc: t("wsHelp.toolbar.stats") },
        { label: t("workspace.graph"), desc: t("wsHelp.toolbar.graph") },
        { label: t("workspace.notes"), desc: t("wsHelp.toolbar.notes") },
        { label: t("workspace.smartNotes"), desc: t("wsHelp.toolbar.smartNotes") },
      ],
    },
    {
      title: t("wsHelp.section.filters"),
      items: [
        { label: t("wsHelp.filters.andLogicLabel"), desc: t("wsHelp.filters.andLogic") },
        { label: t("docPage.searchChunks"), desc: t("wsHelp.filters.search") },
        { label: t("wsHelp.filters.sourceLabel"), desc: t("wsHelp.filters.source") },
        { label: t("wsHelp.filters.folderLabel"), desc: t("wsHelp.filters.folder") },
        { label: t("workspace.quickViews"), desc: t("wsHelp.filters.quickViews") },
        { label: t("workspace.savedViews"), desc: t("wsHelp.filters.savedViews") },
        { label: t("action.filter"), desc: t("wsHelp.filters.advancedFilters") },
        { label: t("wsHelp.filters.segmentTypeLabel"), desc: t("wsHelp.filters.segmentType") },
        { label: t("wsHelp.filters.evidenceGradeLabel"), desc: t("wsHelp.filters.evidenceGrade") },
        { label: t("wsHelp.filters.pinLabel"), desc: t("wsHelp.filters.pin") },
        { label: t("workspace.folders"), desc: t("wsHelp.filters.folders") },
        { label: t("workspace.structure"), desc: t("wsHelp.filters.structure") },
        { label: t("workspace.outline"), desc: t("wsHelp.filters.outline") },
        { label: t("workspace.globalSearch"), desc: t("wsHelp.filters.globalSearch") },
        { label: t("action.clear"), desc: t("wsHelp.filters.clear") },
        { label: t("help.title"), desc: t("wsHelp.filters.help") },
      ],
    },
    {
      title: t("wsHelp.section.chunks"),
      items: [
        { label: t("wsHelp.chunks.clickLabel"), desc: t("wsHelp.chunks.click") },
        { label: t("wsHelp.chunks.doubleClickLabel"), desc: t("wsHelp.chunks.doubleClick") },
        { label: t("wsHelp.chunks.dragDropLabel"), desc: t("wsHelp.chunks.dragDrop") },
        { label: t("wsHelp.chunks.editDeleteLabel"), desc: t("wsHelp.chunks.editDelete") },
        { label: t("wsHelp.chunks.emptyStateLabel"), desc: t("wsHelp.chunks.emptyState") },
      ],
    },
  ];

  return (
    <div
      className="ws-right"
      style={{
        flex: "1 1 35%",
        minWidth: 0,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >

      <div
        ref={tourRefs.controls}
        style={{
          padding: isListMode ? 0 : "14px 18px",
          background: isListMode
            ? "transparent"
            : "linear-gradient(135deg, rgba(24, 26, 40, 0.6) 0%, rgba(12, 12, 20, 0.65) 100%)",
          overflowY: isListMode ? "hidden" : "auto",
          flex: "0 0 auto",
          minHeight: 0,
          maxHeight: isListMode ? undefined : "clamp(220px, 26vh, 360px)",
          display: "flex",
          flexDirection: "column",
          borderBottom: isListMode ? "none" : "1px solid rgba(255,255,255,0.06)",
          ...(getTourHighlightStyle(tourRefs.controls) || {}),
        }}
      >
        <WorkspaceToolbar
          mode={mode}
          onModeChange={setMode}
          onListSegments={() => loadSegs()}
          onSegmentNow={runSegmentation}
          onDeleteModeSegments={deleteModeSegments}
          onManualChunk={onOpenManual}
          filteredSegments={filteredSegments}
          docId={docId}
          onImportComplete={() => loadSegs()}
          notesOpen={notesOpen}
          onToggleNotes={onToggleNotes}
          smartNotesOpen={smartNotesOpen}
          onToggleSmartNotes={onToggleSmartNotes}
          smartNotesCount={smartNotes.length}
          onLoadSmartNotes={onLoadSmartNotes}
          onCreateNewSmartNote={onCreateNewSmartNote}
          canSegment={canSegment}
          parseStatus={parseStatus}
        />

        {!isListMode && (
        <SegmentationSummaryBar
          qa={{ count: summaryByMode.qa?.count ?? 0, last: summaryByMode.qa?.lastSegmentedAt ?? null }}
          paragraphs={{ count: summaryByMode.paragraphs?.count ?? 0, last: summaryByMode.paragraphs?.lastSegmentedAt ?? null }}
          metaLine={
            segmentsMeta
              ? `list: count=${segmentsMeta.count} mode=${segmentsMeta.mode} lastRun=${segmentsMeta.lastRun ?? "—"}`
              : undefined
          }
          onRefresh={onLoadSummary}
          drawerTitle={`Document #${docId} • Segmentation`}
        />
        )}

        {!isListMode && (
        <WorkspaceFilters
          docId={docId}
          sourceFilter={sourceFilter}
          onSourceFilterChange={setSourceFilter}
          folderFilter={folderFilter}
          onFolderFilterChange={setFolderFilter}
          query={query}
          onQueryChange={setQuery}
          advancedFiltersOpen={advancedFiltersOpen}
          onToggleAdvancedFilters={() => setAdvancedFiltersOpen(!advancedFiltersOpen)}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          savedViews={savedViews}
          activeSavedViewId={activeSavedViewId}
          onApplySavedView={onApplySavedView}
          onClearSavedView={onClearSavedView}
          onSaveCurrentView={onSaveCurrentView}
          onRenameSavedView={onRenameSavedView}
          onDeleteSavedView={onDeleteSavedView}
          minLength={minLength}
          maxLength={maxLength}
          onMinLengthChange={setMinLength}
          onMaxLengthChange={setMaxLength}
          activePreset={activePreset}
          onPresetChange={setActivePreset}
          onFoldersOpen={onFoldersOpen}
          onWizardOpen={onWizardOpen}
          onStructureTreeOpen={onStructureTreeOpen}
          onSearchModalOpen={onSearchModalOpen}
          folders={folders}
          filteredSegmentsCount={filteredSegments.length}
          totalSegmentsCount={segments.length}
          semanticSearch={semanticSearch}
          onSemanticSearchChange={setSemanticSearch}
          searchLanguage={searchLanguage}
          onSearchLanguageChange={setSearchLanguage}
          expandVariations={expandVariations}
          onExpandVariationsChange={setExpandVariations}
          onSynonymsManagerOpen={onSynonymsManagerOpen}
          dateFrom={dateFrom}
          onDateFromChange={setDateFrom}
          dateTo={dateTo}
          onDateToChange={setDateTo}
          segmentTypeFilter={segmentTypeFilter}
          onSegmentTypeFilterChange={setSegmentTypeFilter}
          evidenceGradeFilter={evidenceGradeFilter}
          onEvidenceGradeFilterChange={setEvidenceGradeFilter}
          showFilterHelp={showFilterHelp}
          onToggleFilterHelp={() => setShowFilterHelp(!showFilterHelp)}
          helpDisplay="overlay"
        />)}
      </div>

      <div
        ref={tourRefs.segments}
        style={{
          display: "flex",
          flexDirection: "column",
          flex: "1 1 auto",
          minHeight: 0,
          overflow: "hidden",
          ...(getTourHighlightStyle(tourRefs.segments) || {}),
        }}
      >
        {draggedSegment && (
          <div className="mt-4 p-4 bg-surface-elevated border border-border rounded-lg">
            <h3 className="text-sm font-semibold text-primary mb-3">
              {t("workspace.moveToFolderTitle", { title: draggedSegment.title || t("workspace.segment") })}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <FolderDropZone
                folder={null}
                onDrop={() => handleDropOnNoFolder({ preventDefault: () => {} } as React.DragEvent)}
                onDragOver={(folderId) => setDragOverFolder(folderId)}
                isDragOver={dragOverFolder === null}
                draggedSegment={draggedSegment}
              />
              {folders.map((folder) => (
                <FolderDropZone
                  key={folder.id}
                  folder={folder}
                  onDrop={(folderId) => handleDropOnFolder({ preventDefault: () => {} } as React.DragEvent, folderId!)}
                  onDragOver={(folderId) => setDragOverFolder(folderId)}
                  isDragOver={dragOverFolder !== null && dragOverFolder === String(folder.id)}
                  draggedSegment={draggedSegment}
                />
              ))}
            </div>
          </div>
        )}

        <div style={{ flex: "1 1 auto", minHeight: 0, display: "flex", flexDirection: "column" }}>
          <div style={{ flex: "1 1 auto", minHeight: 0, display: "flex", overflow: "hidden", position: "relative" }}>
            {showFilterHelp && (
              <div
                style={{
                  position: "absolute",
                  inset: 12,
                  zIndex: 50,
                  background: "rgba(0, 0, 0, 0.74)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(99, 102, 241, 0.25)",
                  borderRadius: 12,
                  padding: 14,
                  overflow: "auto",
                  boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    marginBottom: 10,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.92)" }}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 16, height: 16 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {t("help.title")}
                  </div>
                  <button
                    onClick={() => setShowFilterHelp(false)}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: "4px 10px", fontSize: 12 }}
                    aria-label={t("btn.close") || "Close"}
                    title={t("btn.close") || "Close"}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 14, fontSize: 13, color: "rgba(255, 255, 255, 0.88)", lineHeight: 1.65 }}>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.78)" }}>{t("wsHelp.intro")}</div>

                  {helpSections.map((section) => (
                    <div key={section.title}>
                      <div style={{ fontWeight: 800, marginBottom: 6, color: "#a5b4fc" }}>{section.title}</div>
                      <div style={{ paddingInlineStart: 10, display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
                        {section.items.map((item) => (
                          <div key={item.label}>
                            <strong>{item.label}:</strong> {item.desc}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div style={{ padding: "10px 12px", background: "rgba(255, 255, 255, 0.06)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div style={{ fontWeight: 800, marginBottom: 6, color: "rgba(251, 191, 36, 0.95)" }}>{t("wsHelp.shortcuts.title")}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 12, opacity: 0.95 }}>
                      <div>{t("wsHelp.shortcuts.ctrlK")}</div>
                      <div>{t("wsHelp.shortcuts.savedViews")}</div>
                      <div>{t("wsHelp.shortcuts.pins")}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <ErrorBoundary
              fallback={
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "24px",
                    background: "rgba(0, 0, 0, 0.3)",
                    borderRadius: "12px",
                    margin: "12px",
                  }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      background: "rgba(239, 68, 68, 0.2)",
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "16px",
                    }}
                  >
                    <svg style={{ width: "24px", height: "24px", color: "#ef4444" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#eaeaea", marginBottom: "8px" }}>
                    {t("workspace.segments.errorTitle")}
                  </h3>
                  <p style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.6)", textAlign: "center", marginBottom: "16px" }}>
                    {t("workspace.segments.errorDesc")}
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    style={{
                      padding: "8px 16px",
                      background: "rgba(99, 102, 241, 0.2)",
                      border: "1px solid rgba(99, 102, 241, 0.4)",
                      borderRadius: "8px",
                      color: "#6366f1",
                      fontSize: "14px",
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    {t("workspace.refreshPage")}
                  </button>
                </div>
              }
            >
              <SegmentList
                segments={segments}
                filteredSegments={filteredSegments}
                selectedSegId={selectedSegId}
                openSeg={openSeg}
                compactHeader={isListMode}
                folderFilter={folderFilter}
                folders={folders}
                folderMap={folderMap}
                query={query}
                draggedSegment={draggedSegment}
                dragOverFolder={dragOverFolder}
                deletingSegId={deletingSegId}
                listScrollRef={listScrollRef}
                segHtmlKey={segHtmlKey}
                docId={docId}
                onSelect={onSelect}
                onOpen={onOpen}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onFolderChange={onFolderChange}
                onEdit={onEdit}
                onDelete={onDelete}
                onConfirmDelete={onConfirmDelete}
                onCancelDelete={onCancelDelete}
                onBackToList={onBackToList}
                onChunkUpdated={onChunkUpdated}
                onBackFromFolder={onBackFromFolder}
              />
            </ErrorBoundary>
          </div>

          {!isListMode && (
          <div style={{ padding: 8, borderTop: "1px solid rgba(255,255,255,0.08)", fontSize: 10, lineHeight: 1.4, opacity: 0.6, background: "rgba(0, 0, 0, 0.2)" }}>
            {t("wsHelp.footerTip")}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
