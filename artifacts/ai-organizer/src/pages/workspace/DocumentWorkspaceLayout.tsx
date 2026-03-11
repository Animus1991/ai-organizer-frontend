// src/pages/workspace/DocumentWorkspaceLayout.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  SegmentDTO,
  SegmentationSummary,
  SegmentType,
  EvidenceGrade,
} from "../../lib/api";
import { loadFolders, loadFolderMap, setSegmentFolder, addChunkToFolder, removeChunkFromFolder, filterFoldersWithItems } from "../../lib/segmentFolders";
import { duplicateSegment, loadDuplicatedChunks } from "../../lib/chunkDuplication";
import { useMultiLoading } from "../../hooks/useLoading";
import { useWorkspaceState, useDocumentOperations, useSegmentOperations, useSmartNotesOperations } from "../../hooks/workspace";
import { loadSmartNotes } from "../../lib/documentWorkspace/smartNotes";
import { useTour } from "../../components/UniversalTourGuide";
import type { TourStep } from "../../components/UniversalTourGuide";
import { badge } from "../../lib/documentWorkspace/utils";
import { WorkspaceParseErrorBanner } from "./components/WorkspaceParseErrorBanner";
import { WorkspaceSplitArea } from "./components/WorkspaceSplitArea";
import { WorkspaceModals } from "./components/WorkspaceModals";
import type { SegmentSort } from "../../components/workspace/WorkspaceFilters";
import { ScreenshotMode } from "../../components/ScreenshotMode";
import { DraggableComponent } from "../../components/DraggableComponent";
import { WritingToolbar } from "../../components/AIWritingAssistant";
import { PageShell } from "../../components/layout/PageShell";
import { useLanguage } from "../../context/LanguageContext";

// Utility functions have been extracted to:
// - src/lib/documentWorkspace/utils.ts (fmt, preview120, badge, htmlToPlainText)
// - src/lib/documentWorkspace/selection.ts (computeSelectionFromPre, splitDocByRange, SelInfo)
// - src/lib/documentWorkspace/smartNotes.ts (SmartNote interface and all functions)

export default function DocumentWorkspaceLayout() {
  const nav = useNavigate();
  const { t } = useLanguage();
  const { documentId } = useParams();
  const docId = Number(documentId);
  const location = useLocation() as any;

  // Loading states
  const { setLoading, isLoading, getError } = useMultiLoading();

  // Workspace state (all useState declarations)
  const state = useWorkspaceState(docId, location?.state?.filename ?? null);
  const pageContainerRef = useRef<HTMLDivElement | null>(null);
  
  // Tour popover position state for compatibility
  const [tourPopoverPos, setTourPopoverPos] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
    placement: "center" | "right" | "left" | "bottom" | "top";
    pushDownPadding?: number;
  } | null>(null);
  
  // Tour refs for compatibility
  const tourRefs = {
    topBar: useRef<HTMLDivElement | null>(null),
    controls: useRef<HTMLDivElement | null>(null),
    segments: useRef<HTMLDivElement | null>(null),
  };

  // Dummy tour highlight function for compatibility
  const getTourHighlightStyle = () => ({});

  // Screenshot Mode state
  const [screenshotModeActive, setScreenshotModeActive] = useState(false);
  
  // AI Writing Assistant state
  const [selectedTextForAI, setSelectedTextForAI] = useState("");
  const [showWritingToolbar, setShowWritingToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
  // Readable width toggle (default: full width)
  const [readableWidth, setReadableWidth] = useState(false);

  // Document operations
  const segmentOps = useSegmentOperations(docId, state, setLoading);
  const docOps = useDocumentOperations(docId, state, setLoading, segmentOps.loadSummary);
  const smartNotesOps = useSmartNotesOperations(docId, state);

  // Destructure state for easier access (keeping compatibility with existing code)
  const {
    status,
    setStatus,
    docText,
    setDocText,
    filename,
    setFilename,
    parseStatus,
    setParseStatus,
    parseError,
    setParseError,
    sourceType,
    setSourceType,
    summary,
    setSummary,
    mode,
    setMode,
    segments,
    setSegments,
    segmentsMeta,
    setSegmentsMeta,
    query,
    setQuery,
    sourceFilter,
    setSourceFilter,
    advancedFiltersOpen,
    setAdvancedFiltersOpen,
    minLength,
    setMinLength,
    maxLength,
    setMaxLength,
    activePreset,
    setActivePreset,
    selectedSegId,
    setSelectedSegId,
    openSeg,
    setOpenSeg,
    highlightRef,
    listScrollRef,
    lastScrollTopRef,
    clickTimerRef,
    manualOpen,
    setManualOpen,
    manualTitle,
    setManualTitle,
    manualPreRef,
    manualSel,
    setManualSel,
    manualStatus,
    setManualStatus,
    manualOpenSeg,
    setManualOpenSeg,
    manualListScrollRef,
    manualLastScrollTopRef,
    manualClickTimerRef,
    chunkEditOpen,
    setChunkEditOpen,
    chunkEditSeg,
    setChunkEditSeg,
    chunkEditTitle,
    setChunkEditTitle,
    chunkEditStart,
    setChunkEditStart,
    chunkEditEnd,
    setChunkEditEnd,
    chunkEditContent,
    setChunkEditContent,
    chunkEditHtml,
    setChunkEditHtml,
    chunkEditDirty,
    setChunkEditDirty,
    chunkEditStatus,
    setChunkEditStatus,
    chunkEditFolderId,
    setChunkEditFolderId,
    chunkEditPreRef,
    chunkEditSyncFromDoc,
    setChunkEditSyncFromDoc,
    // P2: Research-Grade Fields
    chunkEditSegmentType,
    setChunkEditSegmentType,
    chunkEditEvidenceGrade,
    setChunkEditEvidenceGrade,
    chunkEditFalsifiabilityCriteria,
    setChunkEditFalsifiabilityCriteria,
    docEditOpen,
    setDocEditOpen,
    docEditText,
    setDocEditText,
    docEditHtml,
    setDocEditHtml,
    docEditStatus,
    setDocEditStatus,
    docEditSaving,
    setDocEditSaving,
    chunkEditFullscreen,
    setChunkEditFullscreen,
    showChunkListInEdit,
    setShowChunkListInEdit,
    showAllChunksInEdit,
    setShowAllChunksInEdit,
    notesOpen,
    setNotesOpen,
    noteHtml,
    setNoteHtml,
    noteText,
    setNoteText,
    noteStatus,
    setNoteStatus,
    noteDirty,
    setNoteDirty,
    smartNotesOpen,
    setSmartNotesOpen,
    smartNotes,
    setSmartNotes,
    currentSmartNote,
    setCurrentSmartNote,
    smartNoteHtml,
    setSmartNoteHtml,
    smartNoteText,
    setSmartNoteText,
    smartNoteTags,
    setSmartNoteTags,
    smartNoteCategory,
    setSmartNoteCategory,
    smartNotePriority,
    setSmartNotePriority,
    smartNoteChunkId,
    setSmartNoteChunkId,
    smartNoteDirty,
    setSmartNoteDirty,
    smartNoteStatus,
    setSmartNoteStatus,
    smartNoteSearchQuery,
    setSmartNoteSearchQuery,
    smartNoteSelectedCategory,
    setSmartNoteSelectedCategory,
    smartNoteSelectedTag,
    setSmartNoteSelectedTag,
    smartNoteSelectedPriority,
    setSmartNoteSelectedPriority,
    smartNoteSortBy,
    setSmartNoteSortBy,
    newTagInput,
    setNewTagInput,
    foldersOpen,
    setFoldersOpen,
    folders,
    setFolders,
    folderFilter,
    setFolderFilter,
    folderMap,
    setFolderMap,
    draggedSegment,
    setDraggedSegment,
    dragOverFolder,
    setDragOverFolder,
    deletingSegId,
    setDeletingSegId,
    deletingManualSegId,
    setDeletingManualSegId,
    wizardOpen,
    setWizardOpen,
    structureTreeOpen,
    setStructureTreeOpen,
    recycleBinOpen,
    setRecycleBinOpen,
    duplicatedChunks,
    setDuplicatedChunks,
    currentFolder,
    setCurrentFolder,
    canSegment,
    segHtmlKey,
    
    // Semantic Search Options
    semanticSearch,
    setSemanticSearch,
    searchLanguage,
    setSearchLanguage,
    expandVariations,
    setExpandVariations,
    synonymsManagerOpen,
    setSynonymsManagerOpen,
    searchModalOpen,
    setSearchModalOpen,
  } = state;

  // Keyboard shortcuts: Ctrl+K to open SearchModal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [setSearchModalOpen]);

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, segment: any) => {
    setDraggedSegment(segment);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify(segment));
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedSegment(null);
    setDragOverFolder(null);
  };

  // Handle drag over folder
  const handleDragOverFolder = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverFolder(folderId);
  };

  // Handle drop on folder
  const handleDropOnFolder = async (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    if (draggedSegment) {
      // Create duplicate and add to folder
      const duplicated = duplicateSegment(draggedSegment, docId);
      if (duplicated) {
        try {
          await setSegmentFolder(docId, draggedSegment.id, folderId);
          await addChunkToFolder(docId, folderId, duplicated.id, {
            title: duplicated.title,
            content: duplicated.content,
            mode: duplicated.mode,
            isManual: duplicated.isManual,
            orderIndex: duplicated.orderIndex,
          });
          // Small delay to ensure backend has processed the operation
          await new Promise(resolve => setTimeout(resolve, 100));
          const [folders, folderMap] = await Promise.all([
            loadFolders(docId, true), // skipCache to ensure fresh data after mutation
            loadFolderMap(docId, true), // Use skipCache=true for consistency
          ]);
          // Filter folders: keep only folders that have at least one item
          const foldersWithItems = filterFoldersWithItems(folders, folderMap);
          setFolders([...foldersWithItems]);
          setFolderMap({ ...folderMap });
          setDuplicatedChunks(loadDuplicatedChunks(docId));
          // NOTE: Do NOT dispatch folder-chunk-updated here - it causes infinite loops
        } catch (error) {
          console.error("Failed to handle drop on folder:", error);
        }
      }
    }
    setDragOverFolder(null);
  };

  // Handle drop on "No folder"
  const handleDropOnNoFolder = async (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedSegment) {
      await setSegmentFolder(docId, draggedSegment.id, null);
      // Small delay to ensure backend has processed the operation
      await new Promise(resolve => setTimeout(resolve, 100));
      // Reload both folder map and folders to ensure UI is in sync
      const [folders, folderMap] = await Promise.all([
        loadFolders(docId, true), // skipCache to ensure fresh data after mutation
        loadFolderMap(docId, true), // Use skipCache=true for consistency
      ]);
      // Filter folders: keep only folders that have at least one item
      const foldersWithItems = filterFoldersWithItems(folders, folderMap);
      setFolders([...foldersWithItems]);
      setFolderMap({ ...folderMap });
      setDuplicatedChunks(loadDuplicatedChunks(docId));
      // NOTE: Do NOT dispatch folder-chunk-updated here - it causes infinite loops
      // FolderView will refresh via its own useEffect dependencies
    }
    setDragOverFolder(null);
  };

  // Use operations from hooks
  const { loadDocument, openDocEditor, saveDocEdit, saveNoteLocal, resetNoteFromDocument } = docOps;
  const {
    loadSummary,
    loadSegs,
    runSegmentation,
    deleteModeSegments,
    handleDeleteSingle,
    confirmDeleteSingle,
    cancelDelete,
    captureManualSelection,
    saveManualChunk,
    openChunkEditor,
    captureChunkSelection,
    saveChunkEdit,
  } = segmentOps;


  // Smart Notes operations (extracted to hook)
  const {
    createNewSmartNote,
    loadSmartNoteForEdit,
    saveSmartNoteLocal,
    deleteSmartNoteLocal,
    addTagToSmartNote,
    removeTagFromSmartNote,
    filteredSmartNotes,
    allCategories,
    allTags,
  } = smartNotesOps;

  const refreshSmartNotes = async () => {
    const notes = await loadSmartNotes(docId);
    setSmartNotes(notes);
  };

  useEffect(() => {
    if (!Number.isFinite(docId)) return;

    docOps.loadDocument();
    segmentOps.loadSummary();

    // Load folders, folder map, duplicated chunks, and smart notes (now async API calls)
    (async () => {
      try {
        const [folders, folderMap, duplicatedChunks, smartNotes] = await Promise.all([
          loadFolders(docId, true), // Use skipCache=true for fresh data
          loadFolderMap(docId, true), // Use skipCache=true for fresh data
          Promise.resolve(loadDuplicatedChunks(docId)), // Still localStorage for now
          loadSmartNotes(docId),
        ]);
        setFolders(folders);
        setFolderMap(folderMap);
        setDuplicatedChunks(duplicatedChunks);
        setSmartNotes(smartNotes);
      } catch (error) {
        console.error("Failed to load workspace data:", error);
        setFolders([]);
        setFolderMap({});
        setDuplicatedChunks([]);
        setSmartNotes([]);
      }
    })();

    return () => {
      if (clickTimerRef.current) window.clearTimeout(clickTimerRef.current);
      if (manualClickTimerRef.current) window.clearTimeout(manualClickTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId]);

  const summaryByMode = useMemo(() => {
    const map: Record<string, SegmentationSummary> = {};
    for (const r of summary) map[r.mode] = r;
    return map;
  }, [summary]);

  const visibleBySource = useMemo(() => {
    if (sourceFilter === "all") return segments;
    if (sourceFilter === "manual") return segments.filter((s) => !!(s as any).isManual);
    return segments.filter((s) => !(s as any).isManual);
  }, [segments, sourceFilter]);

  // Reset folderFilter if the selected folder no longer exists
  useEffect(() => {
    if (folderFilter !== "all" && folderFilter !== "none") {
      const folderExists = folders.some(f => String(f.id) === folderFilter);
      if (!folderExists) {
        setFolderFilter("all");
      }
    }
  }, [folders, folderFilter, setFolderFilter]);

  // Date filters state
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [showFilterHelp, setShowFilterHelp] = useState(false);
  const [sortBy, setSortBy] = useState<SegmentSort>("doc_order");

  // P2 Research-Grade filters state
  const [segmentTypeFilter, setSegmentTypeFilter] = useState<SegmentType | "all" | null>("all");
  const [evidenceGradeFilter, setEvidenceGradeFilter] = useState<EvidenceGrade | "all" | null>("all");

  type SavedWorkspaceViewState = {
    sourceFilter: any;
    folderFilter: any;
    query: string;
    minLength?: number;
    maxLength?: number;
    activePreset: any;
    semanticSearch: boolean;
    searchLanguage: "auto" | "el" | "en";
    expandVariations: boolean;
    dateFrom: string | null;
    dateTo: string | null;
    segmentTypeFilter: any;
    evidenceGradeFilter: any;
    sortBy: SegmentSort;
  };

  type SavedWorkspaceView = { id: string; name: string; state: SavedWorkspaceViewState };

  const viewsKey = `ws_saved_views_doc_${docId}`;
  const [savedViews, setSavedViews] = useState<SavedWorkspaceView[]>([]);
  const [activeSavedViewId, setActiveSavedViewId] = useState<string | null>(null);

  const currentViewState = useMemo<SavedWorkspaceViewState>(() => {
    return {
      sourceFilter,
      folderFilter,
      query,
      minLength,
      maxLength,
      activePreset,
      semanticSearch: !!semanticSearch,
      searchLanguage: (searchLanguage || "auto") as any,
      expandVariations: !!expandVariations,
      dateFrom: dateFrom ? new Date(dateFrom).toISOString() : null,
      dateTo: dateTo ? new Date(dateTo).toISOString() : null,
      segmentTypeFilter,
      evidenceGradeFilter,
      sortBy,
    };
  }, [
    sourceFilter,
    folderFilter,
    query,
    minLength,
    maxLength,
    activePreset,
    semanticSearch,
    searchLanguage,
    expandVariations,
    dateFrom,
    dateTo,
    segmentTypeFilter,
    evidenceGradeFilter,
    sortBy,
  ]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(viewsKey);
      if (!raw) {
        setSavedViews([]);
        setActiveSavedViewId(null);
        return;
      }
      const parsed = JSON.parse(raw) as SavedWorkspaceView[];
      if (Array.isArray(parsed)) {
        setSavedViews(parsed);
      } else {
        setSavedViews([]);
      }
      setActiveSavedViewId(null);
    } catch {
      setSavedViews([]);
      setActiveSavedViewId(null);
    }
  }, [viewsKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(viewsKey, JSON.stringify(savedViews));
    } catch {
      // ignore
    }
  }, [viewsKey, savedViews]);

  useEffect(() => {
    if (!activeSavedViewId) return;
    const v = savedViews.find((x) => x.id === activeSavedViewId);
    if (!v) return;
    try {
      const a = JSON.stringify(v.state);
      const b = JSON.stringify(currentViewState);
      if (a !== b) {
        setActiveSavedViewId(null);
      }
    } catch {
      setActiveSavedViewId(null);
    }
  }, [activeSavedViewId, savedViews, currentViewState]);

  const applyViewState = (state: SavedWorkspaceViewState) => {
    setSourceFilter(state.sourceFilter);
    setFolderFilter(state.folderFilter);
    setQuery(state.query || "");
    setMinLength(state.minLength);
    setMaxLength(state.maxLength);
    setActivePreset(state.activePreset || "all");
    setSemanticSearch(!!state.semanticSearch);
    setSearchLanguage(state.searchLanguage || "auto");
    setExpandVariations(!!state.expandVariations);
    setDateFrom(state.dateFrom ? new Date(state.dateFrom) : null);
    setDateTo(state.dateTo ? new Date(state.dateTo) : null);
    setSegmentTypeFilter(state.segmentTypeFilter ?? "all");
    setEvidenceGradeFilter(state.evidenceGradeFilter ?? "all");
    setSortBy(state.sortBy || "doc_order");
  };

  const ensureViewId = () => {
    try {
      if (
        typeof crypto !== "undefined" &&
        "randomUUID" in crypto &&
        typeof (crypto as any).randomUUID === "function"
      ) {
        return (crypto as any).randomUUID() as string;
      }
    } catch {
    }
    return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  };

  const handleSaveCurrentView = (name: string, overwriteId?: string | null) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = overwriteId || savedViews.find((v) => v.name === trimmed)?.id || ensureViewId();
    setSavedViews((prev) => {
      const next = [...prev];
      const idx = next.findIndex((v) => v.id === id);
      const view: SavedWorkspaceView = { id, name: trimmed, state: currentViewState };
      if (idx >= 0) {
        next[idx] = view;
      } else {
        next.unshift(view);
      }
      return next;
    });
    setActiveSavedViewId(id);
  };

  const handleApplySavedView = (id: string) => {
    const v = savedViews.find((x) => x.id === id);
    if (!v) return;
    applyViewState(v.state);
    setActiveSavedViewId(v.id);
  };

  const handleRenameSavedView = (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSavedViews((prev) => prev.map((v) => (v.id === id ? { ...v, name: trimmed } : v)));
  };

  const handleDeleteSavedView = (id: string) => {
    setSavedViews((prev) => prev.filter((v) => v.id !== id));
    setActiveSavedViewId((cur) => (cur === id ? null : cur));
  };
  
  const filteredSegments = useMemo(() => {
    const folderOk = (segId: number) => {
    const fId = folderMap[String(segId)] ?? null;
    if (folderFilter === "all") return true;
    if (folderFilter === "none") return !fId;
    return fId !== null && String(fId) === folderFilter;
  };

    // Apply folder filter first
    let filtered = visibleBySource.filter((s) => folderOk(s.id));

    // Apply query search
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      filtered = filtered.filter((s) => {
    const hay = `${s.title ?? ""} ${s.content ?? ""}`.toLowerCase();
    return hay.includes(q);
  });
    }

    // Apply length filters
    if (minLength !== undefined) {
      filtered = filtered.filter((s) => {
        const length = (s.content ?? "").length;
        return length >= minLength;
      });
    }

    if (maxLength !== undefined) {
      filtered = filtered.filter((s) => {
        const length = (s.content ?? "").length;
        return length <= maxLength;
      });
    }

    // Apply date filters
    if (dateFrom) {
      filtered = filtered.filter((s) => {
        if (!s.createdAt) return false;
        const date = typeof s.createdAt === "string" ? new Date(s.createdAt) : s.createdAt;
        return date >= dateFrom;
      });
    }

    if (dateTo) {
      filtered = filtered.filter((s) => {
        if (!s.createdAt) return false;
        const date = typeof s.createdAt === "string" ? new Date(s.createdAt) : s.createdAt;
        return date <= dateTo;
      });
    }

    // Apply P2 Research-Grade filters
    if (segmentTypeFilter && segmentTypeFilter !== "all") {
      filtered = filtered.filter((s) => {
        return s.segmentType === segmentTypeFilter;
      });
    }

    if (evidenceGradeFilter && evidenceGradeFilter !== "all") {
      filtered = filtered.filter((s) => {
        return s.evidenceGrade === evidenceGradeFilter;
      });
    }

    const sorted = [...filtered];
    switch (sortBy) {
      case "newest":
        sorted.sort((a: any, b: any) => {
          const ad = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bd = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bd - ad;
        });
        break;
      case "oldest":
        sorted.sort((a: any, b: any) => {
          const ad = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bd = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return ad - bd;
        });
        break;
      case "longest":
        sorted.sort((a: any, b: any) => (b.content?.length ?? 0) - (a.content?.length ?? 0));
        break;
      case "shortest":
        sorted.sort((a: any, b: any) => (a.content?.length ?? 0) - (b.content?.length ?? 0));
        break;
      case "title_az":
        sorted.sort((a: any, b: any) => String(a.title ?? "").localeCompare(String(b.title ?? "")));
        break;
      case "doc_order":
      default:
        sorted.sort((a: any, b: any) => {
          const ao = (a.orderIndex ?? 0) as number;
          const bo = (b.orderIndex ?? 0) as number;
          if (ao !== bo) return ao - bo;
          return (a.id ?? 0) - (b.id ?? 0);
        });
        break;
    }

    return sorted;
  }, [visibleBySource, query, folderFilter, folderMap, minLength, maxLength, dateFrom, dateTo, segmentTypeFilter, evidenceGradeFilter, sortBy]);

  const selectedSeg = useMemo(() => {
    if (!selectedSegId) return null;
    return segments.find((s) => s.id === selectedSegId) ?? null;
  }, [selectedSegId, segments]);

  const highlightedDoc = useMemo(() => {
    if (!docText) return { before: "", mid: "", after: "" };

    const s = selectedSeg;
    const start = typeof (s as any)?.start === "number" ? (s as any).start : null;
    const end = typeof (s as any)?.end === "number" ? (s as any).end : null;

    if (start === null || end === null || start < 0 || end <= start || end > docText.length) {
      return { before: docText, mid: "", after: "" };
    }

    return {
      before: docText.slice(0, start),
      mid: docText.slice(start, end),
      after: docText.slice(end),
    };
  }, [docText, selectedSeg]);

  useEffect(() => {
    if (!highlightRef.current) return;
    highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [selectedSegId]);

  useEffect(() => {
    if (openSeg) return;
    if (listScrollRef.current) listScrollRef.current.scrollTop = lastScrollTopRef.current;
  }, [openSeg]);

  useEffect(() => {
    if (manualOpenSeg) return;
    if (manualListScrollRef.current) manualListScrollRef.current.scrollTop = manualLastScrollTopRef.current;
  }, [manualOpenSeg]);

  function handleSelect(seg: SegmentDTO) {
    if (clickTimerRef.current) window.clearTimeout(clickTimerRef.current);
    clickTimerRef.current = window.setTimeout(() => setSelectedSegId(seg.id), 170);
  }

  function handleOpen(seg: SegmentDTO) {
    if (clickTimerRef.current) window.clearTimeout(clickTimerRef.current);
    setSelectedSegId(seg.id);

    if (listScrollRef.current) lastScrollTopRef.current = listScrollRef.current.scrollTop;
    setOpenSeg(seg);
  }

  async function handleFolderChange(segment: SegmentDTO, folderId: string | null) {
    if (folderId) {
      // Create duplicate and add to folder
      const duplicated = duplicateSegment(segment, docId);
      if (duplicated) {
        await setSegmentFolder(docId, segment.id, folderId);
        await addChunkToFolder(docId, folderId, duplicated.id, {
          title: duplicated.title,
          content: duplicated.content,
          mode: duplicated.mode,
          isManual: duplicated.isManual,
          orderIndex: duplicated.orderIndex,
        });
        // Small delay to ensure backend has processed the operation
        await new Promise(resolve => setTimeout(resolve, 100));
        // Explicitly clear cache before reloading
        const { apiCache } = await import("../../lib/cache");
        const API_BASE = import.meta.env.VITE_API_BASE_URL?.toString() || "http://127.0.0.1:8000";
        apiCache.deleteByPrefix(`cache:${API_BASE}/api/workspace/documents/${docId}/folders`);
        apiCache.deleteByPrefix(`cache:${API_BASE}/api/workspace/folders`);
        // Load folders first
        const allFolders = await loadFolders(docId, true); // skipCache to ensure fresh data after mutation
        // Load folderMap to identify which folders have items (segments or chunks)
        // Use skipCache=true to ensure fresh data after mutation
        const folderMap = await loadFolderMap(docId, true);
        // Filter folders: keep only folders that have at least one item (segment or chunk)
        // This ensures empty folders (where all chunks were deleted) don't appear in the dropdown
        const foldersWithItems = filterFoldersWithItems(allFolders, folderMap);
        setFolders([...foldersWithItems]);
        setFolderMap({ ...folderMap });
        setDuplicatedChunks(loadDuplicatedChunks(docId));
        // NOTE: Do NOT dispatch folder-chunk-updated here - it causes infinite loops
        // FolderView will refresh via its own useEffect dependencies
      }
    } else {
      // Remove from folder - need to also remove duplicated chunk from folder.contents
      // First, get current folderMap to find which folder the segment is in
      // Use skipCache=true to ensure fresh data when checking folder membership
      const currentFolderMap = await loadFolderMap(docId, true);
      const previousFolderId = currentFolderMap[String(segment.id)];
      if (previousFolderId) {
        // Find the duplicated chunk that corresponds to this segment
        const duplicatedChunks = loadDuplicatedChunks(docId);
        const duplicatedChunk = duplicatedChunks.find((chunk) => chunk.originalId === segment.id);
        
        if (duplicatedChunk) {
          // Remove the duplicated chunk from the folder's contents
          // P1-1: Handle folder auto-deletion response
          const removeResponse = await removeChunkFromFolder(docId, previousFolderId, duplicatedChunk.id);
          // If folder was auto-deleted by backend, we still need to complete the removal
          // The folder deletion is already handled by backend
        }
      }
      
      await setSegmentFolder(docId, segment.id, null);
      // Reduced delay since backend now handles folder deletion atomically
      await new Promise(resolve => setTimeout(resolve, 100));
      // Explicitly clear cache before reloading
      const { apiCache } = await import("../../lib/cache");
      const API_BASE = import.meta.env.VITE_API_BASE_URL?.toString() || "http://127.0.0.1:8000";
      apiCache.deleteByPrefix(`cache:${API_BASE}/api/workspace/documents/${docId}/folders`);
      apiCache.deleteByPrefix(`cache:${API_BASE}/api/workspace/folders`);
      // Reload both folder map and folders to ensure UI is in sync
      // Load folders first (skipCache to ensure fresh data after mutation)
      const allFolders = await loadFolders(docId, true);
      // Load folderMap to identify which folders have items (segments or chunks)
      // Use skipCache=true to ensure fresh data after mutation
      const folderMap = await loadFolderMap(docId, true);
      // Filter folders: keep only folders that have at least one item (segment or chunk)
      // P1-1: This ensures empty folders (where all chunks were deleted) don't appear in the dropdown
      // Backend now auto-deletes empty folders, so this is mainly for race condition protection
      const foldersWithItems = filterFoldersWithItems(allFolders, folderMap);
      setFolders([...foldersWithItems]);
      setFolderMap({ ...folderMap });
      setDuplicatedChunks(loadDuplicatedChunks(docId));
      // NOTE: Do NOT dispatch folder-chunk-updated here - it causes infinite loops
      // FolderView will refresh via its own useEffect dependencies
    }
  }

  const manualSegments = useMemo(() => {
    return segments.filter((s) => !!(s as any).isManual && (s as any).mode === mode);
  }, [segments, mode]);

  function manualHandleSelect(seg: SegmentDTO) {
    if (manualClickTimerRef.current) window.clearTimeout(manualClickTimerRef.current);
    manualClickTimerRef.current = window.setTimeout(() => {
      setSelectedSegId(seg.id);
      setManualStatus(`Selected saved chunk: ${seg.title}`);
    }, 170);
  }

  function manualHandleOpen(seg: SegmentDTO) {
    if (manualClickTimerRef.current) window.clearTimeout(manualClickTimerRef.current);
    setSelectedSegId(seg.id);
    if (manualListScrollRef.current) manualLastScrollTopRef.current = manualListScrollRef.current.scrollTop;
    setManualOpenSeg(seg);
  }

  // Define tour steps for Document Workspace
  // Coordinates captured at viewport 1920x945
  const documentWorkspaceTourSteps: TourStep[] = [
    {
      id: "welcome",
      title: "📄 Document Workspace",
      content: "Αυτό το workspace είναι όπου θα κάνετε segment, filter, και οργάνωση των chunks του εγγράφου σας.",
      target: '.workspaceHeader',
      position: 'custom',
      customPosition: { x: 742, y: 360 },
      highlight: true
    },
    {
      id: "topbar",
      title: "🔧 Workspace Header",
      content: "Χρησιμοποιήστε το header για context του εγγράφου και γρήγορες ενέργειες.",
      target: '.workspaceHeader',
      position: 'custom',
      customPosition: { x: 785, y: 17 },
      highlight: true
    },
    {
      id: "controls",
      title: "⚙️ Controls & Filters",
      content: "Εδώ μπορείτε να κάνετε segment, filter, και να διαχειριστείτε τις ρυθμίσεις του workspace.",
      target: '.workspaceControls',
      position: 'custom',
      customPosition: { x: 794, y: 66 },
      highlight: true
    },
    {
      id: "segments",
      title: "📋 Segments Panel",
      content: "Περιηγηθείτε και ανοίξτε segments από τη λίστα στα δεξιά.",
      target: '.segmentsList',
      position: 'custom',
      customPosition: { x: 1437, y: 637 },
      highlight: true
    }
  ];

  const { startTour, TourComponent: DocumentWorkspaceTour } = useTour(documentWorkspaceTourSteps, "documentWorkspaceTourSeen");

  const pageTopOffset =
    tourPopoverPos?.pushDownPadding ? Math.round(tourPopoverPos.pushDownPadding) : 0;

  return (
    <PageShell
      containerRef={pageContainerRef}
      variant="futuristic"
      fullBleed={!readableWidth}
      topOffset={pageTopOffset}
      headerRef={tourRefs.topBar}
      headerHighlightStyle={{}}
      title={
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{ width: "40px", height: "40px", flexShrink: 0 }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <span>Document #{docId}</span>
            <span
              style={{
                fontSize: 11,
                padding: "3px 8px",
                borderRadius: 999,
                background: "rgba(16, 185, 129, 0.12)",
                border: "1px solid rgba(16, 185, 129, 0.35)",
                color: "#6ee7b7",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
              title={
                parseStatus === "ok"
                  ? "Document parsed successfully. Ready for segmentation."
                  : parseStatus === "failed"
                  ? "Parsing failed. See error details below."
                  : parseStatus === "pending"
                  ? "Document is being parsed."
                  : "Document parse status."
              }
            >
              {badge(parseStatus ?? undefined)}
            </span>
            {sourceType && (
              <span
                style={{
                  fontSize: 10,
                  color: "rgba(255, 255, 255, 0.7)",
                  background: "rgba(255, 255, 255, 0.05)",
                  padding: "3px 6px",
                  borderRadius: 999,
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                }}
              >
                {sourceType}
              </span>
            )}
            {canSegment && (
              <span
                style={{
                  fontSize: 10,
                  color: "#6ee7b7",
                  background: "rgba(16, 185, 129, 0.1)",
                  padding: "3px 8px",
                  borderRadius: 999,
                  border: "1px solid rgba(16, 185, 129, 0.2)",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                }}
                title={t("docPage.readyForSegmentation")}
              >
                ✅ {t("docPage.ready")}
              </span>
            )}
          </span>
        </span>
      }
      subtitle={filename ?? "—"}
      actions={
        <>
          <button
            onClick={openDocEditor}
            aria-label={t("btn.editDocument")}
            title={t("btn.editDocument")}
            className="btn btn-primary btn-md"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ width: "16px", height: "16px" }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            {t("btn.editDocument")}
          </button>
          <button
            onClick={() => nav(`/documents/${docId}/view`)}
            className="btn btn-success btn-md"
            title={t("workspace.viewDocumentTitle")}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ width: "16px", height: "16px" }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            {t("btn.viewDocument")}
          </button>
          <button
            onClick={() => nav("/")}
            aria-label={t("workspace.goToHome")}
            title={t("workspace.goToHome")}
            className="btn btn-secondary btn-sm"
          >
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ width: "14px", height: "14px" }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            {t("btn.home")}
          </button>
          <button
            onClick={startTour}
            aria-label={t("btn.startTour")}
            title={t("home.tooltip.startTour")}
            className="btn btn-tertiary btn-sm"
          >
            🚀 {t("btn.startTour")}
          </button>
          <button
            onClick={() => setReadableWidth((v) => !v)}
            aria-label={
              readableWidth
                ? t("workspace.switchToFullWidth")
                : t("workspace.switchToReadableWidth")
            }
            title={
              readableWidth
                ? t("workspace.switchToFullWidth")
                : t("workspace.switchToReadableWidth")
            }
            className={readableWidth ? "btn btn-primary btn-sm" : "btn btn-secondary btn-sm"}
          >
            ↔️ {readableWidth ? t("workspace.fullWidth") : t("workspace.readableWidth")}
          </button>
          {readableWidth && (
            <span
              style={{
                fontSize: "11px",
                color: "rgba(99, 102, 241, 0.9)",
                background: "rgba(99, 102, 241, 0.1)",
                border: "1px solid rgba(99, 102, 241, 0.2)",
                padding: "3px 8px",
                borderRadius: "12px",
                fontWeight: 500,
                whiteSpace: "nowrap",
              }}
              title={t("workspace.focusedReadingDesc")}
            >
              📖 {t("workspace.focusedReading")}
            </span>
          )}
        </>
      }
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "calc(100vh - 0px)",
          minHeight: 0,
          color: "hsl(var(--foreground))",
          fontFamily: "var(--font-family-sans)",
          letterSpacing: "var(--letter-spacing-normal)",
          overflow: "hidden",
        }}
      >

      <WorkspaceParseErrorBanner parseStatus={parseStatus} parseError={parseError} />

      <WorkspaceSplitArea
        leftPane={{
          docText,
          highlightedDoc,
          highlightRef,
          selectedSeg,
        }}
        rightPane={{
          tourRefs,
          getTourHighlightStyle,
          status,
          mode,
          setMode,
          loadSegs,
          runSegmentation,
          deleteModeSegments,
          onOpenManual: () => {
            setManualOpen(true);
            setManualStatus("Select text (drag) on the left, then Save.");
            setManualSel(null);
            setManualTitle("");
            setManualOpenSeg(null);
          },
          filteredSegments,
          docId,
          notesOpen,
          onToggleNotes: () => state.setNotesOpen(!state.notesOpen),
          smartNotesOpen,
          onToggleSmartNotes: () => state.setSmartNotesOpen(!state.smartNotesOpen),
          smartNotes,
          onLoadSmartNotes: async () => {
            const notes = await loadSmartNotes(docId);
            setSmartNotes(notes);
          },
          onCreateNewSmartNote: createNewSmartNote,
          canSegment,
          parseStatus,
          summaryByMode,
          segmentsMeta,
          onLoadSummary: loadSummary,
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
          onApplySavedView: handleApplySavedView,
          onClearSavedView: () => setActiveSavedViewId(null),
          onSaveCurrentView: handleSaveCurrentView,
          onRenameSavedView: handleRenameSavedView,
          onDeleteSavedView: handleDeleteSavedView,
          minLength,
          setMinLength,
          maxLength,
          setMaxLength,
          activePreset,
          setActivePreset,
          onFoldersOpen: () => setFoldersOpen(true),
          onWizardOpen: () => setWizardOpen(true),
          onStructureTreeOpen: () => setStructureTreeOpen(true),
          onSearchModalOpen: () => setSearchModalOpen(true),
          folders,
          semanticSearch,
          setSemanticSearch,
          searchLanguage,
          setSearchLanguage,
          expandVariations,
          setExpandVariations,
          onSynonymsManagerOpen: () => setSynonymsManagerOpen(true),
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
          onSelect: handleSelect,
          onOpen: handleOpen,
          onDragStart: handleDragStart,
          onDragEnd: handleDragEnd,
          onFolderChange: handleFolderChange,
          onEdit: openChunkEditor,
          onDelete: handleDeleteSingle,
          onConfirmDelete: confirmDeleteSingle,
          onCancelDelete: cancelDelete,
          onBackToList: () => setOpenSeg(null),
          onBackFromFolder: () => setFolderFilter("all"),
          onChunkUpdated: async () => {
            const flagKey = `__reloadingFolders_${docId}`;
            if ((window as any)[flagKey]) {
              return;
            }
            (window as any)[flagKey] = true;
            try {
              const { apiCache } = await import("../../lib/cache");
              const API_BASE = import.meta.env.VITE_API_BASE_URL?.toString() || "http://127.0.0.1:8000";
              apiCache.deleteByPrefix(`cache:${API_BASE}/api/workspace/documents/${docId}/folders`);
              apiCache.deleteByPrefix(`cache:${API_BASE}/api/workspace/folders`);
              apiCache.deleteByPrefix(`cache:${API_BASE}/api/workspace/folders/`);
              await new Promise(resolve => setTimeout(resolve, 250));
              apiCache.deleteByPrefix(`cache:${API_BASE}/api/workspace/documents/${docId}/folders`);
              apiCache.deleteByPrefix(`cache:${API_BASE}/api/workspace/folders`);
              apiCache.deleteByPrefix(`cache:${API_BASE}/api/workspace/folders/`);
              const allFolders = await loadFolders(docId, true);
              const updatedFolderMap = await loadFolderMap(docId, true);
              const foldersWithItems = filterFoldersWithItems(allFolders, updatedFolderMap);
              setFolders([...foldersWithItems]);
              setFolderMap({ ...updatedFolderMap });
              setDuplicatedChunks(loadDuplicatedChunks(docId));
            } catch (error) {
              console.error("Failed to reload folders:", error);
              const { apiCache } = await import("../../lib/cache");
              const API_BASE = import.meta.env.VITE_API_BASE_URL?.toString() || "http://127.0.0.1:8000";
              apiCache.deleteByPrefix(`cache:${API_BASE}/api/workspace/documents/${docId}/folders`);
              apiCache.deleteByPrefix(`cache:${API_BASE}/api/workspace/folders`);
            } finally {
              setTimeout(() => {
                (window as any)[flagKey] = false;
              }, 400);
            }
          },
        }}
      />

      <WorkspaceModals
        docId={docId}
        segments={segments}
        selectedSegId={selectedSegId}
        onStructureTreeSelect={(segment) => {
          setSelectedSegId(segment.id);
          setOpenSeg(segment);
          setStructureTreeOpen(false);
          setTimeout(() => {
            const segmentElement = document.querySelector(`[data-segment-id="${segment.id}"]`);
            if (segmentElement) {
              segmentElement.scrollIntoView({ behavior: "smooth", block: "center" });
              segmentElement.classList.add("highlight-segment");
              setTimeout(() => {
                segmentElement.classList.remove("highlight-segment");
              }, 2000);
            }
          }, 100);
        }}
        structureTreeOpen={structureTreeOpen}
        setStructureTreeOpen={setStructureTreeOpen}
        foldersOpen={foldersOpen}
        setFoldersOpen={setFoldersOpen}
        folders={folders}
        setFolders={setFolders}
        folderMap={folderMap}
        setFolderMap={setFolderMap}
        setDuplicatedChunks={setDuplicatedChunks}
        loadFolderMap={loadFolderMap}
        loadDuplicatedChunks={loadDuplicatedChunks}
        wizardOpen={wizardOpen}
        setWizardOpen={setWizardOpen}
        searchModalOpen={searchModalOpen}
        setSearchModalOpen={setSearchModalOpen}
        synonymsManagerOpen={synonymsManagerOpen}
        setSynonymsManagerOpen={setSynonymsManagerOpen}
        notesOpen={notesOpen}
        setNotesOpen={setNotesOpen}
        noteHtml={noteHtml}
        noteText={noteText}
        setNoteHtml={setNoteHtml}
        setNoteText={setNoteText}
        setNoteDirty={setNoteDirty}
        noteDirty={noteDirty}
        noteStatus={noteStatus}
        saveNoteLocal={saveNoteLocal}
        resetNoteFromDocument={resetNoteFromDocument}
        smartNotesOpen={smartNotesOpen}
        setSmartNotesOpen={setSmartNotesOpen}
        smartNotes={smartNotes}
        currentSmartNote={currentSmartNote}
        smartNoteHtml={smartNoteHtml}
        smartNoteText={smartNoteText}
        smartNoteTags={smartNoteTags}
        smartNoteCategory={smartNoteCategory}
        smartNotePriority={smartNotePriority}
        smartNoteDirty={smartNoteDirty}
        smartNoteStatus={smartNoteStatus}
        smartNoteSearchQuery={smartNoteSearchQuery}
        smartNoteSelectedCategory={smartNoteSelectedCategory}
        smartNoteSelectedTag={smartNoteSelectedTag}
        smartNoteSelectedPriority={smartNoteSelectedPriority}
        smartNoteSortBy={smartNoteSortBy}
        newTagInput={newTagInput}
        setSmartNoteHtml={setSmartNoteHtml}
        setSmartNoteText={setSmartNoteText}
        setSmartNoteTags={setSmartNoteTags}
        setSmartNoteCategory={setSmartNoteCategory}
        setSmartNotePriority={setSmartNotePriority}
        setSmartNoteDirty={setSmartNoteDirty}
        setSmartNoteStatus={setSmartNoteStatus}
        setSmartNoteSearchQuery={setSmartNoteSearchQuery}
        setSmartNoteSelectedCategory={setSmartNoteSelectedCategory}
        setSmartNoteSelectedTag={setSmartNoteSelectedTag}
        setSmartNoteSelectedPriority={setSmartNoteSelectedPriority}
        setSmartNoteSortBy={setSmartNoteSortBy}
        setNewTagInput={setNewTagInput}
        createNewSmartNote={createNewSmartNote}
        refreshSmartNotes={refreshSmartNotes}
        saveSmartNoteLocal={saveSmartNoteLocal}
        deleteSmartNoteLocal={deleteSmartNoteLocal}
        loadSmartNoteForEdit={loadSmartNoteForEdit}
        addTagToSmartNote={addTagToSmartNote}
        removeTagFromSmartNote={removeTagFromSmartNote}
        filteredSmartNotes={filteredSmartNotes}
        allCategories={allCategories}
        allTags={allTags}
        manualOpen={manualOpen}
        setManualOpen={setManualOpen}
        docText={docText}
        mode={mode as any}
        manualTitle={manualTitle}
        setManualTitle={setManualTitle}
        manualSel={manualSel}
        setManualSel={setManualSel}
        manualStatus={manualStatus}
        setManualStatus={setManualStatus}
        saveManualChunk={saveManualChunk}
        manualSegments={manualSegments}
        manualOpenSeg={manualOpenSeg}
        setManualOpenSeg={setManualOpenSeg}
        manualListScrollRef={manualListScrollRef}
        manualLastScrollTopRef={manualLastScrollTopRef}
        handleManualFolderChange={async (segmentId, folderId) => {
          if (!folderId) {
            const currentFolderMap = await loadFolderMap(docId, true);
            const previousFolderId = currentFolderMap[String(segmentId)];
            if (previousFolderId) {
              const duplicatedChunks = loadDuplicatedChunks(docId);
              const duplicatedChunk = duplicatedChunks.find((chunk) => chunk.originalId === segmentId);
              if (duplicatedChunk) {
                await removeChunkFromFolder(docId, previousFolderId, duplicatedChunk.id);
              }
            }
          }
          await setSegmentFolder(docId, segmentId, folderId);
          await new Promise(resolve => setTimeout(resolve, 100));
          const { apiCache } = await import("../../lib/cache");
          const API_BASE = import.meta.env.VITE_API_BASE_URL?.toString() || "http://127.0.0.1:8000";
          apiCache.deleteByPrefix(`cache:${API_BASE}/api/workspace/documents/${docId}/folders`);
          apiCache.deleteByPrefix(`cache:${API_BASE}/api/workspace/folders`);
          const allFolders = await loadFolders(docId, true);
          const updatedFolderMap = await loadFolderMap(docId, true);
          const foldersWithItems = filterFoldersWithItems(allFolders, updatedFolderMap);
          setFolders([...foldersWithItems]);
          setFolderMap({ ...updatedFolderMap });
          setDuplicatedChunks(loadDuplicatedChunks(docId));
        }}
        manualClickTimerRef={manualClickTimerRef}
        setSelectedSegId={setSelectedSegId}
        openChunkEditor={openChunkEditor}
        handleDeleteSingle={handleDeleteSingle}
        deletingSegId={deletingSegId}
        confirmDeleteSingle={confirmDeleteSingle}
        cancelDelete={cancelDelete}
        segHtmlKey={segHtmlKey}
        chunkEditOpen={chunkEditOpen}
        setChunkEditOpen={setChunkEditOpen}
        chunkEditSeg={chunkEditSeg}
        chunkEditTitle={chunkEditTitle}
        setChunkEditTitle={setChunkEditTitle}
        chunkEditHtml={chunkEditHtml}
        setChunkEditHtml={setChunkEditHtml}
        chunkEditDirty={chunkEditDirty}
        setChunkEditDirty={setChunkEditDirty}
        chunkEditContent={chunkEditContent}
        setChunkEditContent={setChunkEditContent}
        chunkEditStart={chunkEditStart}
        setChunkEditStart={setChunkEditStart}
        chunkEditEnd={chunkEditEnd}
        setChunkEditEnd={setChunkEditEnd}
        chunkEditFolderId={chunkEditFolderId}
        setChunkEditFolderId={setChunkEditFolderId}
        chunkEditStatus={chunkEditStatus}
        setChunkEditStatus={setChunkEditStatus}
        chunkEditSegmentType={chunkEditSegmentType}
        setChunkEditSegmentType={setChunkEditSegmentType}
        chunkEditEvidenceGrade={chunkEditEvidenceGrade}
        setChunkEditEvidenceGrade={setChunkEditEvidenceGrade}
        chunkEditFalsifiabilityCriteria={chunkEditFalsifiabilityCriteria}
        setChunkEditFalsifiabilityCriteria={setChunkEditFalsifiabilityCriteria}
        saveChunkEdit={saveChunkEdit}
        chunkEditFullscreen={chunkEditFullscreen}
        setChunkEditFullscreen={setChunkEditFullscreen}
        showChunkListInEdit={showChunkListInEdit}
        setShowChunkListInEdit={setShowChunkListInEdit}
        showAllChunksInEdit={showAllChunksInEdit}
        setShowAllChunksInEdit={setShowAllChunksInEdit}
        chunkEditSyncFromDoc={chunkEditSyncFromDoc}
        setChunkEditSyncFromDoc={setChunkEditSyncFromDoc}
        docEditOpen={docEditOpen}
        setDocEditOpen={setDocEditOpen}
        docEditHtml={docEditHtml}
        setDocEditHtml={setDocEditHtml}
        docEditText={docEditText}
        setDocEditText={setDocEditText}
        saveDocEdit={saveDocEdit}
        docEditStatus={docEditStatus}
        docEditSaving={docEditSaving}
        navToDocument={(documentIdValue, segmentId) => {
          if (segmentId) {
            nav(`/documents/${documentIdValue}/view?segmentId=${segmentId}`);
          } else {
            nav(`/documents/${documentIdValue || docId}`);
          }
        }}
      />

      <DocumentWorkspaceTour />

      {/* AI Writing Assistant Floating Toolbar */}
      {showWritingToolbar && selectedTextForAI && (
        <div
          style={{
            position: "fixed",
            top: toolbarPosition.y,
            left: toolbarPosition.x,
            zIndex: 9999,
            background: "linear-gradient(135deg, rgba(15, 15, 25, 0.98) 0%, rgba(10, 10, 20, 0.98) 100%)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(99, 102, 241, 0.3)",
            borderRadius: "16px",
            padding: "16px",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
            maxWidth: "400px",
          }}
        >
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            marginBottom: "12px",
            paddingBottom: "12px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px" }}>🤖</span>
              <span style={{ fontWeight: 600, color: "#eaeaea", fontSize: "14px" }}>AI Writing Assistant</span>
            </div>
            <button
              onClick={() => setShowWritingToolbar(false)}
              style={{
                padding: "4px 8px",
                background: "rgba(255, 255, 255, 0.1)",
                border: "none",
                borderRadius: "6px",
                color: "#a1a1aa",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              ✕
            </button>
          </div>
          <WritingToolbar
            selectedText={selectedTextForAI}
            onResult={(result) => {
              navigator.clipboard.writeText(result);
              setShowWritingToolbar(false);
            }}
            style={{ background: "transparent" }}
          />
        </div>
      )}

      {/* Screenshot Mode */}
      <ScreenshotMode
        isActive={screenshotModeActive}
        onToggle={() => setScreenshotModeActive(!screenshotModeActive)}
      />
      </div>
    </PageShell>
  );
}
