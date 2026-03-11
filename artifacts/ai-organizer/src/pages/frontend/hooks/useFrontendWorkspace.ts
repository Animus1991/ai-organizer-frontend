/**
 * useFrontendWorkspace — Unified state & handlers for the /frontend workspace.
 * Extracted from the duplicate Compact/Expanded implementations.
 */
import { useState, useCallback, useEffect, useMemo } from "react";
import { getDocument } from "../../../lib/api";
import { useLanguage } from "../../../context/LanguageContext";
import { usePending } from "./usePending";
import { useSearch } from "./useSearch";
import { useSlots } from "./useSlots";
import { downloadTextFile } from "../utils/text";
import type { SearchHit } from "../types";
import type { SegmentRow } from "../../../hooks/home/useHomeState";
import type { SidebarWidth, LeftPanelId, HubSectionId } from "../styles/workspaceConstants";

export function useFrontendWorkspace() {
  const { t } = useLanguage();
  const search = useSearch();
  const pending = usePending();
  const slots = useSlots();

  // ── Core UI state ──
  const [activeId, setActiveId] = useState<string | null>(null);
  const [uploadsCount, setUploadsCount] = useState(0);
  const [segments, setSegments] = useState<SegmentRow[]>([]);
  const [segmentQuery, setSegmentQuery] = useState("");
  const [pendingSegment, setPendingSegment] = useState<SegmentRow | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareSlots, setCompareSlots] = useState<string[]>([]);
  const [previewItem, setPreviewItem] = useState<SearchHit | SegmentRow | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showEnhancedCompare, setShowEnhancedCompare] = useState(false);

  // ── View modes ──
  const [slotsViewMode, setSlotsViewMode] = useState<"grid" | "carousel" | "carousel3d">("grid");
  const [segViewMode, setSegViewMode] = useState<"carousel3d" | "carousel" | "grid">("carousel3d");
  const [segPreviewModal, setSegPreviewModal] = useState<SegmentRow | null>(null);
  const [segSlotDialog, setSegSlotDialog] = useState<SegmentRow | null>(null);
  const [segCarouselFloated, setSegCarouselFloated] = useState(false);
  const [slotsCarouselFloated, setSlotsCarouselFloated] = useState(false);

  // ── Layout state ──
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [leftSidebarWidth, setLeftSidebarWidth] = useState<SidebarWidth>("wide");
  const [rightSidebarWidth, setRightSidebarWidth] = useState<SidebarWidth>("narrow");
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  // ── Panel ordering ──
  const [showDocumentPanel, setShowDocumentPanel] = useState(true);
  const [showSearchPanel, setShowSearchPanel] = useState(true);
  const [showSegmentsPanel, setShowSegmentsPanel] = useState(true);
  const [leftPanelsOrder, setLeftPanelsOrder] = useState<LeftPanelId[]>(["documents", "search", "segments"]);
  const [hubSectionsOrder, setHubSectionsOrder] = useState<HubSectionId[]>(["ai"]);

  const effectiveLeftCollapsed = focusMode || leftCollapsed;
  const effectiveRightCollapsed = focusMode || rightCollapsed;

  // ── Sidebar width cycling ──
  const cycleLeftSidebarWidth = useCallback(() => {
    if (focusMode) setFocusMode(false);
    if (effectiveLeftCollapsed) {
      setLeftCollapsed(false);
      setLeftSidebarWidth("narrow");
      return;
    }
    if (leftSidebarWidth === "narrow") {
      setLeftSidebarWidth("wide");
      return;
    }
    setLeftCollapsed(true);
  }, [focusMode, effectiveLeftCollapsed, leftSidebarWidth]);

  const cycleRightSidebarWidth = useCallback(() => {
    if (focusMode) setFocusMode(false);
    if (effectiveRightCollapsed) {
      setRightCollapsed(false);
      setRightSidebarWidth("narrow");
      return;
    }
    if (rightSidebarWidth === "narrow") {
      setRightSidebarWidth("wide");
      return;
    }
    setRightCollapsed(true);
  }, [focusMode, effectiveRightCollapsed, rightSidebarWidth]);

  // ── Left panel management ──
  const openLeftPanel = useCallback((panelId: LeftPanelId) => {
    setFocusMode(false);
    setLeftCollapsed(false);
    if (panelId === "documents") setShowDocumentPanel(true);
    if (panelId === "search") setShowSearchPanel(true);
    if (panelId === "segments") setShowSegmentsPanel(true);
    setLeftPanelsOrder((prev) => [panelId, ...prev.filter((p) => p !== panelId)]);
  }, []);

  const closeLeftPanel = useCallback((panelId: LeftPanelId) => {
    if (panelId === "documents") setShowDocumentPanel(false);
    if (panelId === "search") setShowSearchPanel(false);
    if (panelId === "segments") setShowSegmentsPanel(false);
    setLeftPanelsOrder((prev) => prev.filter((p) => p !== panelId));
  }, []);

  // ── Right hub sections ──
  const openHubSection = useCallback((sectionId: HubSectionId) => {
    setFocusMode(false);
    setRightCollapsed(false);
    setHubSectionsOrder((prev) => [sectionId, ...prev.filter((p) => p !== sectionId)]);
  }, []);

  const closeHubSection = useCallback((sectionId: HubSectionId) => {
    setHubSectionsOrder((prev) => prev.filter((p) => p !== sectionId));
  }, []);

  const toggleHubSection = useCallback((sectionId: HubSectionId) => {
    setHubSectionsOrder((prev) =>
      prev.includes(sectionId) ? prev.filter((p) => p !== sectionId) : [sectionId, ...prev]
    );
    setFocusMode(false);
    setRightCollapsed(false);
  }, []);

  // ── Stats ──
  const stats = useMemo(() => ({
    docs: uploadsCount,
    segments: segments.length,
  }), [uploadsCount, segments.length]);

  // ── Handlers ──
  const handlePick = useCallback(async (hit: SearchHit) => {
    setActiveId(hit.id);
    if (pending.shouldStage) {
      pending.setPendingFromHit(hit);
      return;
    }
    setPreviewItem(hit);
    setShowPreview(true);
  }, [pending.shouldStage, pending.setPendingFromHit]);

  const handlePickSegment = useCallback((segment: SegmentRow) => {
    if (pending.shouldStage) {
      setPendingSegment(segment);
      return;
    }
    setPreviewItem(segment);
    setShowPreview(true);
  }, [pending.shouldStage]);

  const handleClickSlot = useCallback(async (slotId: string) => {
    if (compareMode && !pending.pending && !pendingSegment) {
      setCompareSlots((prev) => {
        if (prev.includes(slotId)) return prev.filter((id) => id !== slotId);
        if (prev.length >= 2) return [prev[1], slotId];
        return [...prev, slotId];
      });
      return;
    }
    if (pending.pending) {
      const target = slots.slots.find((slot) => slot.slotId === slotId);
      if (target && target.kind !== "empty") {
        const ok = window.confirm(t("workspace.slotReplaceConfirm"));
        if (!ok) return;
      }
      if (slots.lockedSlots.has(slotId)) {
        window.alert(t("workspace.slotLocked"));
        return;
      }
      await slots.placeDocIntoSlot(slotId, pending.pending.hit.docId);
      pending.clearPending();
      return;
    }
    if (pendingSegment) {
      const target = slots.slots.find((slot) => slot.slotId === slotId);
      if (target && target.kind !== "empty") {
        const ok = window.confirm(t("workspace.slotReplaceConfirm"));
        if (!ok) return;
      }
      if (slots.lockedSlots.has(slotId)) {
        window.alert(t("workspace.slotLocked"));
        return;
      }
      slots.placeTextIntoSlot(
        slotId,
        pendingSegment.title || `Segment ${pendingSegment.id}`,
        pendingSegment.content || ""
      );
      setPendingSegment(null);
      return;
    }
    slots.onClickSlot(slotId);
  }, [compareMode, pending.pending, pendingSegment, slots, t, pending.clearPending]);

  const handlePreviewOpen = useCallback((item: SearchHit | SegmentRow) => {
    const available = slots.slots.some((slot) => {
      if (slots.lockedSlots.has(slot.slotId)) return false;
      if (!slots.stickyEnabled) return true;
      return !(slot.slotId === "slot5" && slot.kind === "notepad");
    });
    if (!available) {
      window.alert(t("workspace.noAvailableSlots"));
      return;
    }
    if ('snippet' in item) {
      slots.smartOpen((item as SearchHit).docId);
    } else {
      slots.smartOpenText(item.title || `Segment ${item.id}`, item.content || "");
    }
  }, [slots, t]);

  const handleExportResult = useCallback(async (hit: SearchHit) => {
    try {
      const doc = await getDocument(hit.docId);
      downloadTextFile(`${hit.title || "result"}-${hit.docId}.txt`, doc.text || "");
    } catch {
      downloadTextFile(`${hit.title || "result"}-${hit.docId}.txt`, hit.snippet || "");
    }
  }, []);

  const handleBatchOpenSegments = useCallback((segs: SegmentRow[]) => {
    const availableSlots = slots.slots
      .filter((slot) => {
        if (slots.lockedSlots.has(slot.slotId)) return false;
        if (!slots.stickyEnabled) return true;
        return !(slot.slotId === "slot5" && slot.kind === "notepad");
      })
      .sort((a, b) => parseInt(a.slotId.replace('slot', '')) - parseInt(b.slotId.replace('slot', '')));

    if (availableSlots.length < segs.length) {
      window.alert(t("workspace.notEnoughSlots", { needed: String(segs.length), available: String(availableSlots.length) }));
      return;
    }
    segs.forEach((segment, index) => {
      const slot = availableSlots[index];
      if (slot) {
        slots.placeTextIntoSlot(slot.slotId, segment.title || `Segment ${segment.id}`, segment.content || "");
      }
    });
  }, [slots, t]);

  const handleExportSegment = useCallback((segment: SegmentRow) => {
    downloadTextFile(`${segment.title || `segment-${segment.id}`}.txt`, segment.content || "");
  }, []);

  const handlePinChunk = useCallback((segment: SegmentRow) => {
    slots.pinChunk(String(segment.id), segment.title || `Segment ${segment.id}`, segment.content || "");
  }, [slots]);

  const handleUnpinChunk = useCallback((id: string) => {
    slots.unpinChunk(id);
  }, [slots]);

  const handleOpenPinned = useCallback((chunk: { id: string; title: string; content: string; timestamp: number }) => {
    slots.smartOpenText(chunk.title, chunk.content);
  }, [slots]);

  const handleOpenEnhancedCompare = useCallback(() => {
    if (compareSlots.length >= 2) {
      setShowEnhancedCompare(true);
    }
  }, [compareSlots.length]);

  // Auto-open Enhanced Compare when 2 slots are selected
  useEffect(() => {
    if (compareMode && compareSlots.length >= 2) {
      setShowEnhancedCompare(true);
    }
  }, [compareMode, compareSlots.length]);

  const compareLeft = useMemo(() => slots.slots.find((slot) => slot.slotId === compareSlots[0]) || null, [compareSlots, slots.slots]);
  const compareRight = useMemo(() => slots.slots.find((slot) => slot.slotId === compareSlots[1]) || null, [compareSlots, slots.slots]);

  const getCompareChunks = useCallback(() => {
    return compareSlots.map(slotId => {
      const slot = slots.slots.find(s => s.slotId === slotId);
      return {
        id: slotId,
        title: slot?.title || 'Untitled',
        content: slot?.kind === 'empty' ? '' : (slot as any).text || '',
        slotId
      };
    });
  }, [compareSlots, slots.slots]);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (event.key === "Escape") {
        if (showShortcutsHelp) { setShowShortcutsHelp(false); return; }
        if (showPreview) { setShowPreview(false); return; }
        if (compareMode && compareSlots.length > 0) { setCompareSlots([]); return; }
        if (compareMode) { setCompareMode(false); return; }
        return;
      }
      if (event.ctrlKey && event.key === "n") { event.preventDefault(); slots.newFloatingNotepad(); return; }
      if (event.ctrlKey && event.key === "m") { event.preventDefault(); setCompareMode(prev => !prev); return; }
      if (event.ctrlKey && event.key === "z" && !event.shiftKey && slots.canUndo) { event.preventDefault(); slots.undoLast(); return; }
      if (event.ctrlKey && event.key === "f" && !event.shiftKey) { event.preventDefault(); setFocusMode(prev => !prev); return; }
      if (event.ctrlKey && (event.key === "/" || event.key === "?")) { event.preventDefault(); setShowShortcutsHelp(prev => !prev); return; }
      if (event.ctrlKey && !event.altKey && /^[1-9]$/.test(event.key)) { event.preventDefault(); handleClickSlot(`slot${event.key}`); return; }
      if (event.altKey && compareMode && /^[1-9]$/.test(event.key)) {
        event.preventDefault();
        const slotId = `slot${event.key}`;
        setCompareSlots(prev => {
          if (prev.includes(slotId)) return prev.filter(id => id !== slotId);
          if (prev.length >= 2) return [prev[1], slotId];
          return [...prev, slotId];
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showPreview, compareMode, compareSlots, showShortcutsHelp, slots.canUndo, handleClickSlot]);

  return {
    // Composed hooks
    search,
    pending,
    slots,
    // UI state
    activeId,
    uploadsCount, setUploadsCount,
    segments, setSegments,
    segmentQuery, setSegmentQuery,
    pendingSegment, setPendingSegment,
    compareMode, setCompareMode,
    compareSlots, setCompareSlots,
    previewItem, showPreview, setShowPreview,
    showEnhancedCompare, setShowEnhancedCompare,
    showShortcutsHelp, setShowShortcutsHelp,
    // View modes
    slotsViewMode, setSlotsViewMode,
    segViewMode, setSegViewMode,
    segPreviewModal, setSegPreviewModal,
    segSlotDialog, setSegSlotDialog,
    segCarouselFloated, setSegCarouselFloated,
    slotsCarouselFloated, setSlotsCarouselFloated,
    // Layout
    leftCollapsed, setLeftCollapsed,
    rightCollapsed, setRightCollapsed,
    focusMode, setFocusMode,
    leftSidebarWidth, rightSidebarWidth,
    effectiveLeftCollapsed, effectiveRightCollapsed,
    showDocumentPanel, showSearchPanel, showSegmentsPanel,
    leftPanelsOrder, hubSectionsOrder,
    // Layout actions
    cycleLeftSidebarWidth, cycleRightSidebarWidth,
    openLeftPanel, closeLeftPanel,
    openHubSection, closeHubSection, toggleHubSection,
    // Computed
    stats,
    compareLeft, compareRight, getCompareChunks,
    // Handlers
    handlePick, handlePickSegment, handleClickSlot,
    handlePreviewOpen, handleExportResult,
    handleBatchOpenSegments, handleExportSegment,
    handlePinChunk, handleUnpinChunk, handleOpenPinned,
    handleOpenEnhancedCompare,
  };
}
