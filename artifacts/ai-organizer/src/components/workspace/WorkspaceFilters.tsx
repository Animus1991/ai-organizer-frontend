/**
 * WorkspaceFilters Component
 * 
 * Provides filtering and search functionality for workspace segments including:
 * - Source filter (all/auto/manual)
 * - Folder filter
 * - Search input
 * - Filter presets
 * - Advanced filters (min/max length, date, segment type, evidence grade)
 * 
 * @module components/workspace/WorkspaceFilters
 */

import { useCallback, useEffect, useState } from "react";
import { FILTER_PRESETS } from "../../lib/searchUtils";
import { FolderDTO } from "../../lib/segmentFolders";
import { SegmentType, EvidenceGrade } from "../../lib/api";
import { useLanguage } from "../../context/LanguageContext";

// Import FILTER_PRESETS for use in DocumentWorkspaceLayout
export { FILTER_PRESETS };

export type SourceFilter = "all" | "auto" | "manual";

export type SegmentSort =
  | "doc_order"
  | "newest"
  | "oldest"
  | "longest"
  | "shortest"
  | "title_az";

export interface WorkspaceFiltersProps {
  docId?: number;

  // Filters
  sourceFilter: SourceFilter;
  onSourceFilterChange: (filter: SourceFilter) => void;
  
  folderFilter: string;
  onFolderFilterChange: (filter: string) => void;
  
  // Search
  query: string;
  onQueryChange: (query: string) => void;
  
  // Advanced Filters
  advancedFiltersOpen: boolean;
  onToggleAdvancedFilters: () => void;

  // Sorting (does not change filter count)
  sortBy: SegmentSort;
  onSortByChange: (sort: SegmentSort) => void;

  // Saved views (optional)
  savedViews?: Array<{ id: string; name: string }>;
  activeSavedViewId?: string | null;
  onApplySavedView?: (id: string) => void;
  onClearSavedView?: () => void;
  onSaveCurrentView?: (name: string, overwriteId?: string | null) => void;
  onRenameSavedView?: (id: string, name: string) => void;
  onDeleteSavedView?: (id: string) => void;
  
  minLength?: number;
  maxLength?: number;
  onMinLengthChange: (length?: number) => void;
  onMaxLengthChange: (length?: number) => void;
  
  activePreset: string;
  onPresetChange: (preset: string) => void;
  
  // Actions
  onFoldersOpen: () => void;
  onWizardOpen: () => void;
  onStructureTreeOpen: () => void;
  onSearchModalOpen?: () => void;
  
  // Data
  folders: FolderDTO[];
  filteredSegmentsCount: number;
  totalSegmentsCount: number;
  
  // Semantic Search Options (optional)
  semanticSearch?: boolean;
  onSemanticSearchChange?: (enabled: boolean) => void;
  searchLanguage?: "auto" | "el" | "en";
  onSearchLanguageChange?: (lang: "auto" | "el" | "en") => void;
  expandVariations?: boolean;
  onExpandVariationsChange?: (enabled: boolean) => void;
  onSynonymsManagerOpen?: () => void;
  
  // Date filters (optional)
  dateFrom?: Date | null;
  onDateFromChange?: (date: Date | null) => void;
  dateTo?: Date | null;
  onDateToChange?: (date: Date | null) => void;
  
  // P2 Research-Grade Filters (optional)
  segmentTypeFilter?: SegmentType | "all" | null;
  onSegmentTypeFilterChange?: (type: SegmentType | "all" | null) => void;
  evidenceGradeFilter?: EvidenceGrade | "all" | null;
  onEvidenceGradeFilterChange?: (grade: EvidenceGrade | "all" | null) => void;
  
  // Help/info panel (optional)
  showFilterHelp?: boolean;
  onToggleFilterHelp?: () => void;
  helpDisplay?: "inline" | "overlay";
}

// Helper to get filter count
function getActiveFilterCount(
  query: string,
  sourceFilter: SourceFilter,
  folderFilter: string,
  minLength?: number,
  maxLength?: number,
  dateFrom?: Date | null,
  dateTo?: Date | null,
  segmentTypeFilter?: SegmentType | "all" | null,
  evidenceGradeFilter?: EvidenceGrade | "all" | null
): number {
  let count = 0;
  if (query.trim()) count++;
  if (sourceFilter !== "all") count++;
  if (folderFilter !== "all") count++;
  if (minLength !== undefined) count++;
  if (maxLength !== undefined) count++;
  if (dateFrom) count++;
  if (dateTo) count++;
  if (segmentTypeFilter && segmentTypeFilter !== "all") count++;
  if (evidenceGradeFilter && evidenceGradeFilter !== "all") count++;
  return count;
}

/**
 * WorkspaceFilters - Filtering and search controls for workspace
 */
export default function WorkspaceFilters({
  docId,
  sourceFilter,
  onSourceFilterChange,
  folderFilter,
  onFolderFilterChange,
  query,
  onQueryChange,
  advancedFiltersOpen,
  onToggleAdvancedFilters,
  sortBy,
  onSortByChange,
  savedViews,
  activeSavedViewId,
  onApplySavedView,
  onClearSavedView,
  onSaveCurrentView,
  onRenameSavedView,
  onDeleteSavedView,
  minLength,
  maxLength,
  onMinLengthChange,
  onMaxLengthChange,
  activePreset,
  onPresetChange,
  onFoldersOpen,
  onWizardOpen,
  onStructureTreeOpen, // Document Structure Tree handler
  onSearchModalOpen,
  folders,
  filteredSegmentsCount,
  totalSegmentsCount,
  onSemanticSearchChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  segmentTypeFilter,
  onSegmentTypeFilterChange,
  evidenceGradeFilter,
  onEvidenceGradeFilterChange,
  showFilterHelp = false,
  onToggleFilterHelp,
  helpDisplay = "inline",
}: WorkspaceFiltersProps) {

  const { t } = useLanguage();

  const pinKey = `ws_filter_pins_${docId ?? "global"}`;
  const readPins = useCallback(() => {
    try {
      const raw = window.localStorage.getItem(pinKey);
      if (!raw) return { segmentType: false, evidenceGrade: false };
      const parsed = JSON.parse(raw) as { segmentType?: boolean; evidenceGrade?: boolean };
      return {
        segmentType: !!parsed.segmentType,
        evidenceGrade: !!parsed.evidenceGrade,
      };
    } catch {
      return { segmentType: false, evidenceGrade: false };
    }
  }, [pinKey]);

  const [pins, setPins] = useState(() => readPins());

  useEffect(() => {
    setPins(readPins());
  }, [readPins]);

  const persistPins = (next: { segmentType: boolean; evidenceGrade: boolean }) => {
    setPins(next);
    try {
      window.localStorage.setItem(pinKey, JSON.stringify(next));
    } catch {
      // ignore
    }
  };
  
  const handleClear = () => {
    onQueryChange("");
    onMinLengthChange(undefined);
    onMaxLengthChange(undefined);
    onPresetChange("all");
    onSourceFilterChange("all");
    onFolderFilterChange("all");
    if (onDateFromChange) onDateFromChange(null);
    if (onDateToChange) onDateToChange(null);
    if (onSegmentTypeFilterChange) onSegmentTypeFilterChange("all");
    if (onEvidenceGradeFilterChange) onEvidenceGradeFilterChange("all");
    if (onSemanticSearchChange) onSemanticSearchChange(false);
  };

  const handleSaveView = () => {
    if (!onSaveCurrentView) return;
    const defaultName = activeSavedViewId
      ? (savedViews || []).find((v) => v.id === activeSavedViewId)?.name || ""
      : "";
    const name = window.prompt(
      t("workspace.savedViews.savePrompt"),
      defaultName || t("workspace.savedViews.defaultName")
    );
    if (!name) return;
    onSaveCurrentView(name.trim(), activeSavedViewId ?? null);
  };

  const handleRenameView = () => {
    if (!onRenameSavedView || !activeSavedViewId) return;
    const currentName = (savedViews || []).find((v) => v.id === activeSavedViewId)?.name || "";
    const name = window.prompt(t("workspace.savedViews.renamePrompt"), currentName);
    if (!name) return;
    onRenameSavedView(activeSavedViewId, name.trim());
  };

  const handleDeleteView = () => {
    if (!onDeleteSavedView || !activeSavedViewId) return;
    const ok = window.confirm(t("workspace.savedViews.deleteConfirm"));
    if (!ok) return;
    onDeleteSavedView(activeSavedViewId);
  };
  
  const activeFilterCount = getActiveFilterCount(
    query,
    sourceFilter,
    folderFilter,
    minLength,
    maxLength,
    dateFrom,
    dateTo,
    segmentTypeFilter,
    evidenceGradeFilter
  );
  const hasActiveFilters = activeFilterCount > 0;

  const handlePresetChange = (preset: string) => {
    onPresetChange(preset);
    
    if (preset === "all") {
      onMinLengthChange(undefined);
      onMaxLengthChange(undefined);
      onSourceFilterChange("all");
      if (onDateFromChange) onDateFromChange(null);
      if (onDateToChange) onDateToChange(null);
      if (onSegmentTypeFilterChange) onSegmentTypeFilterChange("all");
      if (onEvidenceGradeFilterChange) onEvidenceGradeFilterChange("all");
    } else if (preset === "long") {
      onMinLengthChange(500);
      onMaxLengthChange(undefined);
      onSourceFilterChange("all");
      if (onDateFromChange) onDateFromChange(null);
      if (onDateToChange) onDateToChange(null);
      if (onSegmentTypeFilterChange) onSegmentTypeFilterChange("all");
      if (onEvidenceGradeFilterChange) onEvidenceGradeFilterChange("all");
    } else if (preset === "short") {
      onMinLengthChange(undefined);
      onMaxLengthChange(200);
      onSourceFilterChange("all");
      if (onDateFromChange) onDateFromChange(null);
      if (onDateToChange) onDateToChange(null);
      if (onSegmentTypeFilterChange) onSegmentTypeFilterChange("all");
      if (onEvidenceGradeFilterChange) onEvidenceGradeFilterChange("all");
    } else if (preset === "manual") {
      onSourceFilterChange("manual");
      onMinLengthChange(undefined);
      onMaxLengthChange(undefined);
      if (onDateFromChange) onDateFromChange(null);
      if (onDateToChange) onDateToChange(null);
      if (onSegmentTypeFilterChange) onSegmentTypeFilterChange("all");
      if (onEvidenceGradeFilterChange) onEvidenceGradeFilterChange("all");
    } else if (preset === "auto") {
      onSourceFilterChange("auto");
      onMinLengthChange(undefined);
      onMaxLengthChange(undefined);
      if (onDateFromChange) onDateFromChange(null);
      if (onDateToChange) onDateToChange(null);
      if (onSegmentTypeFilterChange) onSegmentTypeFilterChange("all");
      if (onEvidenceGradeFilterChange) onEvidenceGradeFilterChange("all");
    } else if (preset === "recent" && onDateFromChange) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      onDateFromChange(sevenDaysAgo);
      if (onDateToChange) onDateToChange(null);
      onMinLengthChange(undefined);
      onMaxLengthChange(undefined);
      onSourceFilterChange("all");
      if (onSegmentTypeFilterChange) onSegmentTypeFilterChange("all");
      if (onEvidenceGradeFilterChange) onEvidenceGradeFilterChange("all");
    }
  };

  const activeChips: Array<{
    key: string;
    label: string;
    onClear: () => void;
  }> = [];

  if (query.trim()) {
    activeChips.push({
      key: "query",
      label: t("workspace.chip.search", { value: query.trim() }),
      onClear: () => onQueryChange(""),
    });
  }

  if (sourceFilter !== "all") {
    activeChips.push({
      key: "source",
      label: t("workspace.chip.source", {
        value:
          sourceFilter === "manual"
            ? t("common.manual")
            : sourceFilter === "auto"
              ? t("common.auto")
              : sourceFilter,
      }),
      onClear: () => onSourceFilterChange("all"),
    });
  }

  if (folderFilter !== "all") {
    const folderName =
      folderFilter === "none"
        ? t("common.noFolder")
        : folders.find((f) => String(f.id) === String(folderFilter))?.name ?? folderFilter;
    activeChips.push({
      key: "folder",
      label: t("workspace.chip.folder", { value: folderName }),
      onClear: () => onFolderFilterChange("all"),
    });
  }

  if (activePreset && activePreset !== "all") {
    const presetName = FILTER_PRESETS[activePreset as keyof typeof FILTER_PRESETS]?.name ?? activePreset;
    activeChips.push({
      key: "preset",
      label: t("workspace.chip.preset", { value: presetName }),
      onClear: () => handlePresetChange("all"),
    });
  }

  if (minLength !== undefined) {
    activeChips.push({
      key: "minLength",
      label: t("workspace.chip.minLength", { value: minLength }),
      onClear: () => onMinLengthChange(undefined),
    });
  }

  if (maxLength !== undefined) {
    activeChips.push({
      key: "maxLength",
      label: t("workspace.chip.maxLength", { value: maxLength }),
      onClear: () => onMaxLengthChange(undefined),
    });
  }

  if (dateFrom && onDateFromChange) {
    const v = new Date(dateFrom).toISOString().split("T")[0];
    activeChips.push({
      key: "dateFrom",
      label: t("workspace.chip.dateFrom", { value: v }),
      onClear: () => onDateFromChange(null),
    });
  }

  if (dateTo && onDateToChange) {
    const v = new Date(dateTo).toISOString().split("T")[0];
    activeChips.push({
      key: "dateTo",
      label: t("workspace.chip.dateTo", { value: v }),
      onClear: () => onDateToChange(null),
    });
  }

  if (segmentTypeFilter && segmentTypeFilter !== "all" && onSegmentTypeFilterChange) {
    activeChips.push({
      key: "segmentType",
      label: t("workspace.chip.segmentType", { value: segmentTypeFilter }),
      onClear: () => onSegmentTypeFilterChange("all"),
    });
  }

  if (evidenceGradeFilter && evidenceGradeFilter !== "all" && onEvidenceGradeFilterChange) {
    activeChips.push({
      key: "evidenceGrade",
      label: t("workspace.chip.evidenceGrade", { value: evidenceGradeFilter }),
      onClear: () => onEvidenceGradeFilterChange("all"),
    });
  }

  return (
    <div data-workspace-filters-root="true">
      {/* Compact Main Filters Row */}
      <div style={{ 
        marginTop: 8, 
        display: "flex", 
        gap: 8, 
        alignItems: "center", 
        flexWrap: "wrap",
        padding: "8px 0"
      }}>
        {/* Search Input - Takes priority space */}
        <div
          style={{
            flex: "1 1 300px",
            minWidth: "200px",
            maxWidth: "calc(100% - 600px)",
            position: "relative",
            display: "flex",
            alignItems: "center",
            overflow: "hidden",
          }}
        >
          <svg
            style={{
              position: "absolute",
              left: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "16px",
              height: "16px",
              color: "rgba(255, 255, 255, 0.5)",
              pointerEvents: "none",
              flexShrink: 0,
              zIndex: 10,
            }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={(el) => {
              if (el) {
                el.style.setProperty("padding-left", "36px", "important");
                el.style.setProperty("padding-right", query.trim() ? "32px" : "10px", "important");
                el.style.setProperty("padding-top", "6px", "important");
                el.style.setProperty("padding-bottom", "6px", "important");
              }
            }}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={t("docPage.searchChunks") || "Search chunks..."}
            style={{
              width: "100%",
              borderRadius: 8,
              border: query.trim() ? "1px solid rgba(99, 102, 241, 0.4)" : "1px solid rgba(255,255,255,0.1)",
              background: "rgba(0, 0, 0, 0.3)",
              color: "#eaeaea",
              fontSize: 13,
              lineHeight: 1.4,
              position: "relative",
              zIndex: 1,
            }}
            title={t("docPage.searchChunks") || "Search chunks..."}
          />
          {query.trim() && (
            <button
              onClick={() => onQueryChange("")}
              style={{
                position: "absolute",
                right: "6px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "rgba(255, 255, 255, 0.5)",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "rgba(255, 255, 255, 0.8)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "rgba(255, 255, 255, 0.5)";
              }}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Compact Filter Buttons */}
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => onSourceFilterChange(e.target.value as SourceFilter)}
            style={{ 
              padding: "6px 10px", 
              fontSize: 13, 
              lineHeight: 1.4,
              borderColor: sourceFilter !== "all" ? "rgba(99, 102, 241, 0.4)" : "rgba(255,255,255,0.1)",
              background: "rgba(0, 0, 0, 0.3)",
              border: "1px solid",
              borderRadius: 6,
              color: "#eaeaea",
              cursor: "pointer",
              minWidth: 100
            }}
            title={
              sourceFilter === "all" 
                ? t("action.filter") 
                : sourceFilter === "auto"
                ? t("action.filter")
                : t("workspace.sourceFilter.manualDesc")
            }
          >
            <option value="all">{t("common.all")}</option>
            <option value="auto">{t("common.auto")}</option>
            <option value="manual">{t("common.manual")}</option>
          </select>

          {(onSaveCurrentView || (savedViews && savedViews.length > 0)) && (onApplySavedView || onClearSavedView) && (
            <select
              value={activeSavedViewId || ""}
              disabled={!savedViews || savedViews.length === 0}
              onChange={(e) => {
                const v = e.target.value;
                if (!v) {
                  onClearSavedView?.();
                  return;
                }
                onApplySavedView?.(v);
              }}
              style={{
                padding: "6px 10px",
                fontSize: 13,
                lineHeight: 1.4,
                borderColor: activeSavedViewId ? "rgba(99, 102, 241, 0.4)" : "rgba(255,255,255,0.1)",
                background: "rgba(0, 0, 0, 0.3)",
                border: "1px solid",
                borderRadius: 6,
                color: "#eaeaea",
                cursor: "pointer",
                minWidth: 150,
              }}
              title={t("workspace.savedViews")}
            >
              <option value="">{t("workspace.savedViews")}</option>
              {(savedViews || []).map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          )}

          {/* Folder Filter */}
          <select
            key={`folder-filter-${folders.map(f => f.id).sort().join(',')}`}
            value={folderFilter}
            onChange={(e) => onFolderFilterChange(e.target.value)}
            style={{ 
              padding: "6px 10px", 
              fontSize: 13, 
              lineHeight: 1.4,
              borderColor: folderFilter !== "all" ? "rgba(99, 102, 241, 0.4)" : "rgba(255,255,255,0.1)",
              background: "rgba(0, 0, 0, 0.3)",
              border: "1px solid",
              borderRadius: 6,
              color: "#eaeaea",
              cursor: "pointer",
              minWidth: 120
            }}
            title={
              folderFilter === "all"
                ? t("action.filter") 
                : folderFilter === "none"
                ? t("action.filter")
                : t("workspace.folderFilterTitle", {
                    folder: folders.find((f) => String(f.id) === folderFilter)?.name || folderFilter,
                  })
            }
          >
            <option value="all">{t("common.all")}</option>
            <option value="none">{t("common.none")}</option>
            {folders.map((f) => (
              <option key={f.id} value={String(f.id)}>
                {f.name}
              </option>
            ))}
          </select>

          {/* Presets */}
          <select
            value={activePreset || "all"}
            onChange={(e) => handlePresetChange(e.target.value)}
            style={{ 
              padding: "6px 10px", 
              fontSize: 13, 
              lineHeight: 1.4,
              borderColor: activePreset !== "all" ? "rgba(99, 102, 241, 0.4)" : "rgba(255,255,255,0.1)",
              background: "rgba(0, 0, 0, 0.3)",
              border: "1px solid",
              borderRadius: 6,
              color: "#eaeaea",
              cursor: "pointer",
              minWidth: 120
            }}
            title={t("workspace.quickViews")}
          >
            {Object.entries(FILTER_PRESETS).map(([key, preset]) => (
              <option key={key} value={key} title={preset.description}>
                {preset.name}
              </option>
            ))}
          </select>

          {/* Advanced Filters Toggle */}
          <button
            onClick={onToggleAdvancedFilters}
            style={{ 
              padding: "6px 10px",
              fontSize: 13,
              lineHeight: 1.4,
              background: advancedFiltersOpen ? "rgba(99, 102, 241, 0.2)" : "rgba(255, 255, 255, 0.05)",
              border: advancedFiltersOpen ? "1px solid rgba(99, 102, 241, 0.4)" : "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: 6,
              color: "#eaeaea",
              cursor: "pointer",
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontWeight: advancedFiltersOpen ? 500 : 400
            }}
            title={t("action.filter")}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "14px", height: "14px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {t("action.filter")}
            {activeFilterCount > 0 && (
              <span
                style={{
                  padding: "1px 5px",
                  borderRadius: 10,
                  background: "rgba(99, 102, 241, 0.8)",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 600,
                  minWidth: 16,
                  textAlign: "center",
                  lineHeight: 1.2
                }}
              >
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Quick Action Buttons */}
          <div style={{ order: 1, flexBasis: "100%", height: 0 }} />
          <button 
            onClick={onFoldersOpen} 
            className="btn btn-secondary btn-sm"
            style={{ order: 2 }}
            aria-label={t("action.openDetails")}
            title={t("action.openDetails")}
          >
            {t("workspace.folders")}
          </button>

          <button 
            onClick={onWizardOpen} 
            className="btn btn-secondary btn-sm"
            style={{ order: 2 }}
            aria-label={t("action.openDetails")}
            title={t("action.openDetails")}
          >
            {t("workspace.structure")}
          </button>

          <button 
            onClick={onStructureTreeOpen} 
            className="btn btn-secondary btn-sm"
            style={{ order: 2 }}
            aria-label={t("action.openDetails")}
            title={t("action.openDetails")}
          >
            {t("workspace.outline")}
          </button>

          {/* Global Search Button */}
          {onSearchModalOpen && (
            <button
              onClick={onSearchModalOpen}
              className="btn btn-secondary btn-sm"
              style={{ order: 2 }}
              aria-label={t("action.search")}
              title={t("workspace.globalSearchTitle")}
            >
              {t("workspace.globalSearch")}
            </button>
          )}

          {/* Quick Reset Filters */}
          <button 
            onClick={handleClear} 
            disabled={!hasActiveFilters}
            className="btn btn-danger btn-sm"
            aria-label={t("action.clear")}
            title={t("action.clear")}
          >
            {t("action.clear")}
          </button>

          {onSaveCurrentView && (
            <button
              onClick={handleSaveView}
              className="btn btn-secondary btn-sm"
              title={t("workspace.savedViews.saveTitle")}
            >
              {t("workspace.savedViews.saveButton")}
            </button>
          )}

          {activeSavedViewId && onRenameSavedView && (
            <button
              onClick={handleRenameView}
              className="btn btn-secondary btn-sm"
              title={t("workspace.savedViews.renameTitle")}
            >
              {t("action.rename")}
            </button>
          )}

          {activeSavedViewId && onDeleteSavedView && (
            <button
              onClick={handleDeleteView}
              className="btn btn-danger btn-sm"
              title={t("workspace.savedViews.deleteTitle")}
            >
              {t("action.delete")}
            </button>
          )}

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as SegmentSort)}
            style={{
              padding: "6px 10px",
              fontSize: 13,
              lineHeight: 1.4,
              borderColor: sortBy !== "doc_order" ? "rgba(99, 102, 241, 0.4)" : "rgba(255,255,255,0.1)",
              background: "rgba(0, 0, 0, 0.3)",
              border: "1px solid",
              borderRadius: 6,
              color: "#eaeaea",
              cursor: "pointer",
              minWidth: 140,
            }}
            title={t("action.sort")}
          >
            <option value="doc_order">{t("workspace.sort.doc_order")}</option>
            <option value="newest">{t("workspace.sort.newest")}</option>
            <option value="oldest">{t("workspace.sort.oldest")}</option>
            <option value="longest">{t("workspace.sort.longest")}</option>
            <option value="shortest">{t("workspace.sort.shortest")}</option>
            <option value="title_az">{t("workspace.sort.title_az")}</option>
          </select>

          {/* Help Toggle */}
          {onToggleFilterHelp && (
            <button
              onClick={onToggleFilterHelp}
              style={{ 
                padding: "6px 10px",
                fontSize: 13,
                lineHeight: 1.4,
                background: showFilterHelp ? "rgba(99, 102, 241, 0.2)" : "rgba(255, 255, 255, 0.05)",
                border: showFilterHelp ? "1px solid rgba(99, 102, 241, 0.4)" : "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: 6,
                color: "#eaeaea",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4
              }}
              title={t("help.title")}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "14px", height: "14px" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t("help.title")}
            </button>
          )}

          {pins.segmentType && onSegmentTypeFilterChange && (
            <select
              value={segmentTypeFilter || "all"}
              onChange={(e) =>
                onSegmentTypeFilterChange(
                  e.target.value === "all" ? "all" : (e.target.value as SegmentType)
                )
              }
              style={{
                padding: "6px 10px",
                fontSize: 13,
                lineHeight: 1.4,
                borderColor:
                  segmentTypeFilter && segmentTypeFilter !== "all"
                    ? "rgba(99, 102, 241, 0.4)"
                    : "rgba(255,255,255,0.1)",
                background: "rgba(0, 0, 0, 0.3)",
                border: "1px solid",
                borderRadius: 6,
                color: "#eaeaea",
                cursor: "pointer",
                minWidth: 150,
              }}
              title={t("workspace.segmentTypeLabel")}
            >
              <option value="all">{t("common.all")}</option>
              <option value="definition">{t("segmentType.definition")}</option>
              <option value="assumption">{t("segmentType.assumption")}</option>
              <option value="claim">{t("segmentType.claim")}</option>
              <option value="mechanism">{t("segmentType.mechanism")}</option>
              <option value="prediction">{t("segmentType.prediction")}</option>
              <option value="counterargument">{t("segmentType.counterargument")}</option>
              <option value="evidence">{t("segmentType.evidence")}</option>
              <option value="open_question">{t("segmentType.open_question")}</option>
              <option value="experiment">{t("segmentType.experiment")}</option>
              <option value="meta">{t("segmentType.meta")}</option>
              <option value="untyped">{t("segmentType.untyped")}</option>
            </select>
          )}

          {pins.evidenceGrade && onEvidenceGradeFilterChange && (
            <select
              value={evidenceGradeFilter || "all"}
              onChange={(e) =>
                onEvidenceGradeFilterChange(
                  e.target.value === "all" ? "all" : (e.target.value as EvidenceGrade)
                )
              }
              style={{
                padding: "6px 10px",
                fontSize: 13,
                lineHeight: 1.4,
                borderColor:
                  evidenceGradeFilter && evidenceGradeFilter !== "all"
                    ? "rgba(99, 102, 241, 0.4)"
                    : "rgba(255,255,255,0.1)",
                background: "rgba(0, 0, 0, 0.3)",
                border: "1px solid",
                borderRadius: 6,
                color: "#eaeaea",
                cursor: "pointer",
                minWidth: 150,
              }}
              title={t("workspace.evidenceGradeLabel")}
            >
              <option value="all">{t("common.all")}</option>
              <option value="E0">{t("evidenceGrade.E0")}</option>
              <option value="E1">{t("evidenceGrade.E1")}</option>
              <option value="E2">{t("evidenceGrade.E2")}</option>
              <option value="E3">{t("evidenceGrade.E3")}</option>
              <option value="E4">{t("evidenceGrade.E4")}</option>
            </select>
          )}

          {/* Results Count */}
          <div style={{ 
            fontSize: 11, 
            color: "rgba(255, 255, 255, 0.6)", 
            padding: "6px 10px",
            whiteSpace: "nowrap"
          }}>
            {t("workspace.showing")}{" "}
            <span style={{ fontWeight: filteredSegmentsCount !== totalSegmentsCount ? 600 : 400 }}>
              {filteredSegmentsCount}
            </span>
            <span style={{ opacity: 0.5 }}> / {totalSegmentsCount}</span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        {([
          "all",
          "recent",
          "long",
          "short",
          "manual",
          "auto",
        ] as const).map((key) => {
          const p = FILTER_PRESETS[key];
          const active = (activePreset || "all") === key;
          return (
            <button
              key={key}
              onClick={() => handlePresetChange(key)}
              style={{
                padding: "4px 8px",
                borderRadius: 999,
                fontSize: 12,
                lineHeight: 1.2,
                background: active ? "rgba(99, 102, 241, 0.22)" : "rgba(255, 255, 255, 0.04)",
                border: active ? "1px solid rgba(99, 102, 241, 0.42)" : "1px solid rgba(255, 255, 255, 0.10)",
                color: "rgba(255, 255, 255, 0.82)",
                cursor: "pointer",
              }}
              title={p.description}
            >
              {p.name}
            </button>
          );
        })}
      </div>

      {activeChips.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          {activeChips.map((chip) => (
            <span
              key={chip.key}
              className="chip"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 8px",
                background: "rgba(99, 102, 241, 0.14)",
                border: "1px solid rgba(99, 102, 241, 0.28)",
                color: "rgba(255, 255, 255, 0.82)",
                borderRadius: 999,
                fontSize: 12,
                lineHeight: 1.2,
                maxWidth: "100%",
              }}
              title={chip.label}
            >
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {chip.label}
              </span>
              <button
                onClick={chip.onClear}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  color: "rgba(255, 255, 255, 0.7)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                aria-label={t("action.remove")}
                title={t("action.remove")}
              >
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Advanced Filters Panel - Compact & Organized */}
      {advancedFiltersOpen && (
        <div
          data-workspace-advanced-filters-panel="true"
          style={{
            marginTop: 8,
            padding: 12,
            background: "rgba(0, 0, 0, 0.2)",
            borderRadius: 8,
            border: "1px solid rgba(255, 255, 255, 0.05)",
          }}
        >
          <div style={{ 
            fontSize: 13, 
            fontWeight: 600, 
            color: "rgba(255, 255, 255, 0.9)",
            marginBottom: 4,
            display: "flex",
            alignItems: "center",
            gap: 8
          }}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "14px", height: "14px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            {t("action.filter") || "Filters"}
          </div>

          {(pins.segmentType || pins.evidenceGrade) && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255, 255, 255, 0.72)" }}>{t("workspace.pinned")}</span>
              {pins.segmentType && (
                <button
                  type="button"
                  onClick={() => persistPins({ ...pins, segmentType: false })}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: "2px 8px", fontSize: 11 }}
                  title={t("workspace.unpinSegmentTypeTitle")}
                >
                  {t("workspace.unpinType")}
                </button>
              )}
              {pins.evidenceGrade && (
                <button
                  type="button"
                  onClick={() => persistPins({ ...pins, evidenceGrade: false })}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: "2px 8px", fontSize: 11 }}
                  title={t("workspace.unpinEvidenceGradeTitle")}
                >
                  {t("workspace.unpinGrade")}
                </button>
              )}
            </div>
          )}
          
          {/* Filters Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
            {/* Length Filters */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ 
                fontSize: 11, 
                fontWeight: 500,
                color: "rgba(255, 255, 255, 0.7)",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                {t("workspace.contentLength")}
              </label>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input
                  type="number"
                  value={minLength ?? ""}
                  onChange={(e) => onMinLengthChange(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder={t("common.min")}
                  min="0"
                  style={{
                    flex: 1,
                    padding: "6px 8px",
                    borderRadius: 6,
                    border: minLength !== undefined ? "1px solid rgba(99, 102, 241, 0.4)" : "1px solid rgba(255, 255, 255, 0.1)",
                    background: "rgba(0, 0, 0, 0.3)",
                    color: "#eaeaea",
                    fontSize: 13,
                  }}
                  title={t("workspace.minCharsTitle")}
                />
                <span style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: 13 }}>—</span>
                <input
                  type="number"
                  value={maxLength ?? ""}
                  onChange={(e) => onMaxLengthChange(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder={t("common.max")}
                  min="0"
                  style={{
                    flex: 1,
                    padding: "6px 8px",
                    borderRadius: 6,
                    border: maxLength !== undefined ? "1px solid rgba(99, 102, 241, 0.4)" : "1px solid rgba(255, 255, 255, 0.1)",
                    background: "rgba(0, 0, 0, 0.3)",
                    color: "#eaeaea",
                    fontSize: 13,
                  }}
                  title={t("workspace.maxCharsTitle")}
                />
              </div>
            </div>

            {/* Date Filters */}
            {onDateFromChange && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ 
                  fontSize: 11, 
                  fontWeight: 500,
                  color: "rgba(255, 255, 255, 0.7)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>
                  {t("workspace.creationDate")}
                </label>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input
                    type="date"
                    value={dateFrom ? new Date(dateFrom).toISOString().split('T')[0] : ""}
                    onChange={(e) => onDateFromChange(e.target.value ? new Date(e.target.value) : null)}
                    style={{
                      flex: 1,
                      padding: "6px 8px",
                      borderRadius: 6,
                      border: dateFrom ? "1px solid rgba(99, 102, 241, 0.4)" : "1px solid rgba(255, 255, 255, 0.1)",
                      background: "rgba(0, 0, 0, 0.3)",
                      color: "#eaeaea",
                      fontSize: 13,
                    }}
                    title={t("workspace.fromDateTitle")}
                  />
                  {onDateToChange && (
                    <>
                      <span style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: 13 }}>—</span>
                      <input
                        type="date"
                        value={dateTo ? new Date(dateTo).toISOString().split('T')[0] : ""}
                        onChange={(e) => onDateToChange(e.target.value ? new Date(e.target.value) : null)}
                        style={{
                          flex: 1,
                          padding: "6px 8px",
                          borderRadius: 6,
                          border: dateTo ? "1px solid rgba(99, 102, 241, 0.4)" : "1px solid rgba(255, 255, 255, 0.1)",
                          background: "rgba(0, 0, 0, 0.3)",
                          color: "#eaeaea",
                          fontSize: 13,
                        }}
                        title={t("workspace.toDateTitle")}
                      />
                    </>
                  )}
                </div>
              </div>
            )}

            {/* P2: Segment Type Filter */}
            {onSegmentTypeFilterChange && !pins.segmentType && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ 
                  fontSize: 11, 
                  fontWeight: 600,
                  color: "rgba(255, 255, 255, 0.7)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                  {t("workspace.segmentTypeLabel")}
                  <button
                    type="button"
                    onClick={() => persistPins({ ...pins, segmentType: true })}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: "2px 8px", fontSize: 11 }}
                    title={t("workspace.pinControlTitle")}
                  >
                    {t("action.pin")}
                  </button>
                </label>
                <select
                  value={segmentTypeFilter || "all"}
                  onChange={(e) => onSegmentTypeFilterChange(e.target.value === "all" ? "all" : e.target.value as SegmentType)}
                  style={{
                    padding: "6px 8px",
                    borderRadius: 6,
                    border: segmentTypeFilter && segmentTypeFilter !== "all" ? "1px solid rgba(99, 102, 241, 0.4)" : "1px solid rgba(255, 255, 255, 0.1)",
                    background: "rgba(0, 0, 0, 0.3)",
                    color: "#eaeaea",
                    fontSize: 13,
                    cursor: "pointer"
                  }}
                  title={t("action.filter") || "Filter"}
                >
                  <option value="all">{t("common.all") || "All"}</option>
                  <option value="definition">{t("segmentType.definition")}</option>
                  <option value="assumption">{t("segmentType.assumption")}</option>
                  <option value="claim">{t("segmentType.claim")}</option>
                  <option value="mechanism">{t("segmentType.mechanism")}</option>
                  <option value="prediction">{t("segmentType.prediction")}</option>
                  <option value="counterargument">{t("segmentType.counterargument")}</option>
                  <option value="evidence">{t("segmentType.evidence")}</option>
                  <option value="open_question">{t("segmentType.open_question")}</option>
                  <option value="experiment">{t("segmentType.experiment")}</option>
                  <option value="meta">{t("segmentType.meta")}</option>
                  <option value="untyped">{t("segmentType.untyped")}</option>
                </select>
              </div>
            )}

            {/* P2: Evidence Grade Filter */}
            {onEvidenceGradeFilterChange && !pins.evidenceGrade && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ 
                  fontSize: 11, 
                  fontWeight: 600,
                  color: "rgba(255, 255, 255, 0.7)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                  {t("workspace.evidenceGradeLabel")}
                  <button
                    type="button"
                    onClick={() => persistPins({ ...pins, evidenceGrade: true })}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: "2px 8px", fontSize: 11 }}
                    title={t("workspace.pinControlTitle")}
                  >
                    {t("action.pin")}
                  </button>
                </label>
                <select
                  value={evidenceGradeFilter || "all"}
                  onChange={(e) => onEvidenceGradeFilterChange(e.target.value === "all" ? "all" : e.target.value as EvidenceGrade)}
                  style={{
                    padding: "6px 8px",
                    borderRadius: 6,
                    border: evidenceGradeFilter && evidenceGradeFilter !== "all" ? "1px solid rgba(99, 102, 241, 0.4)" : "1px solid rgba(255, 255, 255, 0.1)",
                    background: "rgba(0, 0, 0, 0.3)",
                    color: "#eaeaea",
                    fontSize: 13,
                    cursor: "pointer"
                  }}
                  title={t("action.filter") || "Filter"}
                >
                  <option value="all">{t("common.all") || "All"}</option>
                  <option value="E0">{t("evidenceGrade.E0")}</option>
                  <option value="E1">{t("evidenceGrade.E1")}</option>
                  <option value="E2">{t("evidenceGrade.E2")}</option>
                  <option value="E3">{t("evidenceGrade.E3")}</option>
                  <option value="E4">{t("evidenceGrade.E4")}</option>
                </select>
              </div>
            )}
          </div>
          
          {/* Active Filters Summary - Compact */}
          {activeFilterCount > 0 && (
            <div style={{
              padding: "8px 12px",
              background: "rgba(99, 102, 241, 0.1)",
              border: "1px solid rgba(99, 102, 241, 0.2)",
              borderRadius: 6,
              fontSize: 11,
              color: "rgba(255, 255, 255, 0.8)",
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              alignItems: "center"
            }}>
              <span style={{ fontWeight: 600, color: "#a5b4fc" }}>{t("workspace.activeFilters")}</span>
              {query.trim() && (
                <span style={{ padding: "2px 6px", background: "rgba(99, 102, 241, 0.2)", borderRadius: 4 }}>
                  {t("workspace.summary.search", { value: query })}
                </span>
              )}
              {sourceFilter !== "all" && (
                <span style={{ padding: "2px 6px", background: "rgba(99, 102, 241, 0.2)", borderRadius: 4 }}>
                  {t("workspace.summary.source", { value: sourceFilter })}
                </span>
              )}
              {folderFilter !== "all" && (
                <span style={{ padding: "2px 6px", background: "rgba(99, 102, 241, 0.2)", borderRadius: 4 }}>
                  {t("workspace.summary.folder", {
                    value:
                      folderFilter === "none"
                        ? t("workspace.unfoldered")
                        : folders.find((f) => String(f.id) === folderFilter)?.name || folderFilter,
                  })}
                </span>
              )}
              {minLength !== undefined && (
                <span style={{ padding: "2px 6px", background: "rgba(99, 102, 241, 0.2)", borderRadius: 4 }}>
                  {t("workspace.summary.min", { value: minLength })}
                </span>
              )}
              {maxLength !== undefined && (
                <span style={{ padding: "2px 6px", background: "rgba(99, 102, 241, 0.2)", borderRadius: 4 }}>
                  {t("workspace.summary.max", { value: maxLength })}
                </span>
              )}
              {dateFrom && (
                <span style={{ padding: "2px 6px", background: "rgba(99, 102, 241, 0.2)", borderRadius: 4 }}>
                  {t("workspace.summary.from", { value: new Date(dateFrom).toLocaleDateString() })}
                </span>
              )}
              {dateTo && (
                <span style={{ padding: "2px 6px", background: "rgba(99, 102, 241, 0.2)", borderRadius: 4 }}>
                  {t("workspace.summary.to", { value: new Date(dateTo).toLocaleDateString() })}
                </span>
              )}
              {segmentTypeFilter && segmentTypeFilter !== "all" && (
                <span style={{ padding: "2px 6px", background: "rgba(99, 102, 241, 0.2)", borderRadius: 4 }}>
                  {t("workspace.summary.type", { value: segmentTypeFilter })}
                </span>
              )}
              {evidenceGradeFilter && evidenceGradeFilter !== "all" && (
                <span style={{ padding: "2px 6px", background: "rgba(99, 102, 241, 0.2)", borderRadius: 4 }}>
                  {t("workspace.summary.grade", { value: evidenceGradeFilter })}
                </span>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Compact Filter Help Panel */}
      {helpDisplay !== "overlay" && showFilterHelp && onToggleFilterHelp && (
        <div
          data-workspace-filter-help-panel="true"
          style={{
            marginTop: 8,
            padding: 12,
            background: "rgba(0, 0, 0, 0.3)",
            border: "1px solid rgba(99, 102, 241, 0.2)",
            borderRadius: 10,
            position: "relative"
          }}
        >
          <div style={{ 
            fontSize: 13, 
            fontWeight: 600, 
            color: "rgba(255, 255, 255, 0.9)",
            marginBottom: 10,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "14px", height: "14px" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t("workspace.filterHelp.title")}
            </span>
            <button
              onClick={onToggleFilterHelp}
              style={{
                padding: "4px 8px",
                background: "rgba(255, 255, 255, 0.1)",
                border: "none",
                borderRadius: 4,
                color: "rgba(255, 255, 255, 0.8)",
                cursor: "pointer",
                fontSize: 11,
              }}
            >
              ✕
            </button>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13, color: "rgba(255, 255, 255, 0.8)", lineHeight: 1.6 }}>
            {/* How Filters Work */}
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4, color: "#a5b4fc" }}>
                {t("wsHelp.filters.andLogicLabel")}
              </div>
              <div style={{ paddingLeft: 8 }}>
                {t("wsHelp.filters.andLogic")}
                <br />
                <span style={{ fontSize: 11, opacity: 0.7, fontStyle: "italic" }}>
                  {t("workspace.filterHelp.example")}
                </span>
              </div>
            </div>
            
            {/* Filter Types */}
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4, color: "#a5b4fc" }}>
                {t("workspace.filterHelp.available")}
              </div>
              <div style={{ paddingLeft: 8, display: "flex", flexDirection: "column", gap: 4, fontSize: 11 }}>
                <div><strong>{t("wsHelp.filters.sourceLabel")}:</strong> {t("wsHelp.filters.source")}</div>
                <div><strong>{t("wsHelp.filters.folderLabel")}:</strong> {t("wsHelp.filters.folder")}</div>
                <div><strong>{t("action.search")}:</strong> {t("wsHelp.filters.search")}</div>
                <div><strong>{t("workspace.contentLength")}:</strong> {t("workspace.filterHelp.length")}</div>
                {onDateFromChange && <div><strong>{t("common.date")}:</strong> {t("workspace.filterHelp.date")}</div>}
                {onSegmentTypeFilterChange && <div><strong>{t("wsHelp.filters.segmentTypeLabel")}:</strong> {t("wsHelp.filters.segmentType")}</div>}
                {onEvidenceGradeFilterChange && <div><strong>{t("wsHelp.filters.evidenceGradeLabel")}:</strong> {t("wsHelp.filters.evidenceGrade")}</div>}
              </div>
            </div>
            
            {/* Quick Tips */}
            <div style={{ 
              padding: "8px 10px", 
              background: "rgba(255, 255, 255, 0.05)", 
              borderRadius: 6,
              fontSize: 11,
            }}>
              <div style={{ fontWeight: 600, marginBottom: 4, color: "#fbbf24" }}>{t("workspace.filterHelp.quickTipsLabel")}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <div>• {t("workspace.filterHelp.tipPresets")}</div>
                <div>• {t("workspace.filterHelp.tipCombine")}</div>
                <div>• {t("workspace.filterHelp.tipGlobalSearch")}</div>
                <div>• {t("workspace.filterHelp.tipClear")}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
