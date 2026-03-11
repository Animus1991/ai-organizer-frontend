/**
 * ManualChunkModal Component
 * 
 * Modal for creating manual chunks by selecting text from the document.
 * Enhanced with modern UI/UX, notifications, favorites integration, and search.
 * 
 * @module components/workspace/ManualChunkModal
 */

import React, { useRef, useState, useMemo } from "react";
import { SegmentDTO, type SegmentationMode } from "../../lib/api";
import { SelInfo, computeSelectionFromPre } from "../../lib/documentWorkspace/selection";
import { preview120 } from "../../lib/documentWorkspace/utils";
import { plainTextToHtml } from "../../editor/utils/text";
import { FolderDTO } from "../../lib/segmentFolders";
import { useTour } from "../tour/useTour";
import { TourPanel } from "../tour/TourPanel";
import { useNotifications } from "../../context/NotificationContext";
import { useFavorites } from "../../context/FavoritesContext";
import { useLanguage } from "../../context/LanguageContext";

export interface ManualChunkModalProps {
  // Modal state
  open: boolean;
  onClose: () => void;
  
  // Document content
  docText: string;
  mode: SegmentationMode;
  
  // Manual chunk state
  title: string;
  onTitleChange: (title: string) => void;
  selection: SelInfo | null;
  onSelectionChange: (selection: SelInfo | null) => void;
  status: string;
  onStatusChange: (status: string) => void;
  
  // Save functionality
  onSave: () => Promise<void>;
  
  // Manual segments list
  manualSegments: SegmentDTO[];
  openSegment: SegmentDTO | null;
  onOpenSegmentChange: (seg: SegmentDTO | null) => void;
  
  // Folder management
  folderMap: Record<string, string>;
  folders: FolderDTO[];
  onFolderChange: (segmentId: number, folderId: string | null) => void;
  
  // Actions
  onSegmentSelect: (seg: SegmentDTO) => void;
  onSegmentOpen: (seg: SegmentDTO) => void;
  onSegmentEdit: (seg: SegmentDTO) => void;
  onSegmentDelete: (seg: SegmentDTO) => void;
  deletingSegId: number | null;
  onConfirmDelete: (seg: SegmentDTO) => void;
  onCancelDelete: () => void;
  
  // Utilities
  segHtmlKey: (segId: number) => string;
}

/**
 * ManualChunkModal - Modal for creating manual chunks
 */
export default function ManualChunkModal({
  open,
  onClose,
  docText,
  mode,
  title,
  onTitleChange,
  selection,
  onSelectionChange,
  status,
  onStatusChange,
  onSave,
  manualSegments,
  openSegment,
  onOpenSegmentChange,
  folderMap,
  folders,
  onFolderChange,
  onSegmentSelect,
  onSegmentOpen,
  onSegmentEdit,
  onSegmentDelete,
  deletingSegId,
  onConfirmDelete,
  onCancelDelete,
  segHtmlKey,
}: ManualChunkModalProps) {
  const { t } = useLanguage();
  const preRef = useRef<HTMLPreElement | null>(null);
  const listScrollRef = useRef<HTMLDivElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const tourRefs = {
    header: useRef<HTMLDivElement | null>(null),
    selection: useRef<HTMLDivElement | null>(null),
    inputs: useRef<HTMLDivElement | null>(null),
    list: useRef<HTMLDivElement | null>(null),
  };

  // New features integration
  const { addNotification } = useNotifications();
  const { isFavorite, toggleFavorite } = useFavorites();
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "alphabetical">("newest");
  const hasSelection = Boolean(selection);
  const modeLabel = useMemo(() => {
    const key = `segmentation.mode.${mode}`;
    const translated = t(key);
    return translated === key ? mode : translated;
  }, [mode, t]);
  
  // Filtered and sorted segments
  const filteredSegments = useMemo(() => {
    let filtered = [...manualSegments];
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.title?.toLowerCase().includes(query) ||
        s.content?.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    switch (sortBy) {
      case "newest":
        filtered.sort((a, b) => (b.id || 0) - (a.id || 0));
        break;
      case "oldest":
        filtered.sort((a, b) => (a.id || 0) - (b.id || 0));
        break;
      case "alphabetical":
        filtered.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
        break;
    }
    
    return filtered;
  }, [manualSegments, searchQuery, sortBy]);

  // Word count helper
  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
  };

  const handleCaptureSelection = () => {
    const pre = preRef.current;
    if (!pre) return;
    const info = computeSelectionFromPre(pre, docText);
    onSelectionChange(info);
    onStatusChange(
      info
        ? t("manualChunk.status.selected", {
            chars: info.end - info.start,
            words: getWordCount(info.text),
          })
        : t("manualChunk.status.none")
    );
  };

  const handleSave = async () => {
    if (!selection) {
      onStatusChange(t("manualChunk.status.pickText"));
      addNotification({
        type: "warning",
        title: t("manualChunk.notification.noSelection.title"),
        message: t("manualChunk.notification.noSelection.message"),
        duration: 3000,
      });
      return;
    }
    try {
      await onSave();
      addNotification({
        type: "success",
        title: t("manualChunk.notification.saved.title"),
        message: title
          ? t("manualChunk.notification.saved.messageWithTitle", { title })
          : t("manualChunk.notification.saved.message"),
        duration: 3000,
      });
    } catch (error) {
      addNotification({
        type: "error",
        title: t("manualChunk.notification.saveFailed.title"),
        message: error instanceof Error ? error.message : t("manualChunk.notification.saveFailed.message"),
        duration: 5000,
      });
    }
  };

  // Toggle favorite for a segment
  const handleToggleFavorite = (seg: SegmentDTO) => {
    const originalId = `segment-${seg.id}`;
    const nowFav = toggleFavorite({
      type: "segment",
      title: seg.title || t("manualChunk.untitled"),
      description: preview120(seg.content || ""),
      url: `/segments/${seg.id}`,
      metadata: { originalId, segmentId: seg.id, content: seg.content },
    });

    if (!nowFav) {
      addNotification({
        type: "info",
        title: t("manualChunk.notification.favoriteRemoved.title"),
        message: t("manualChunk.notification.favoriteRemoved.message", {
          title: seg.title || t("manualChunk.untitled"),
        }),
        duration: 2000,
      });
    } else {
      addNotification({
        type: "success",
        title: t("manualChunk.notification.favoriteAdded.title"),
        message: t("manualChunk.notification.favoriteAdded.message", {
          title: seg.title || t("manualChunk.untitled"),
        }),
        duration: 2000,
      });
    }
  };

  const tourSteps = [
    {
      key: "welcome",
      title: t("manualChunk.tour.title"),
      body: t("manualChunk.tour.body"),
      ref: null as React.RefObject<HTMLDivElement | null> | null,
    },
    {
      key: "header",
      title: t("manualChunk.tour.header.title"),
      body: t("manualChunk.tour.header.body"),
      ref: tourRefs.header,
    },
    {
      key: "selection",
      title: t("manualChunk.tour.selection.title"),
      body: t("manualChunk.tour.selection.body"),
      ref: tourRefs.selection,
    },
    {
      key: "inputs",
      title: t("manualChunk.tour.inputs.title"),
      body: t("manualChunk.tour.inputs.body"),
      ref: tourRefs.inputs,
    },
    {
      key: "list",
      title: t("manualChunk.tour.list.title"),
      body: t("manualChunk.tour.list.body"),
      ref: tourRefs.list,
    },
  ];

  const {
    tourOpen,
    tourStepIndex,
    tourPopoverPos,
    startTour,
    closeTour,
    nextTourStep,
    prevTourStep,
    getTourHighlightStyle,
  } = useTour({
    storageKey: "manualChunkTourSeen",
    steps: tourSteps,
    containerRef: modalRef,
    autoStart: open,
  });

  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", padding: 20, zIndex: 50, backdropFilter: "blur(4px)" }}>
      <div
        ref={modalRef}
        style={{
          flex: 1,
          background: "linear-gradient(135deg, #0d1117 0%, #0b0e14 100%)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 16,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          paddingTop: tourPopoverPos?.pushDownPadding
            ? Math.round(tourPopoverPos.pushDownPadding)
            : undefined,
        }}
      >
        {/* Header */}
        <div
          ref={tourRefs.header}
          style={{
            padding: "16px 20px",
            paddingTop: "96px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            flex: "0 0 auto",
            background: "rgba(255,255,255,0.02)",
            ...(getTourHighlightStyle(tourRefs.header) || {}),
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
            <span style={{ fontSize: "20px" }}>✂️</span>
            <div>
              <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "#eaeaea" }}>{t("manualChunk.header.title")}</h2>
              <p style={{ margin: 0, fontSize: "12px", color: "#71717a" }}>{t("manualChunk.header.subtitle")}</p>
            </div>
          </div>
          
          {/* Status badge */}
          {status && (
            <span style={{
              padding: "6px 12px",
              fontSize: "12px",
              background: hasSelection ? "rgba(34, 197, 94, 0.15)" : "rgba(255, 255, 255, 0.05)",
              border: hasSelection ? "1px solid rgba(34, 197, 94, 0.3)" : "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: 6,
              color: hasSelection ? "#22c55e" : "#a1a1aa",
            }}>
              {status}
            </span>
          )}
          
          <button
            onClick={startTour}
            style={{
              padding: "6px 12px",
              background: "linear-gradient(135deg, rgba(114, 255, 191, 0.2), rgba(99, 102, 241, 0.15))",
              border: "1px solid rgba(114, 255, 191, 0.6)",
              borderRadius: 999,
              color: "rgba(114, 255, 191, 0.95)",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.2s ease",
            }}
          >
            🎯 {t("btn.startTour")}
          </button>
          <button 
            onClick={onClose} 
            style={{ 
              padding: "6px 12px",
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: 999,
              color: "rgba(255, 255, 255, 0.88)",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 500,
              transition: "all 0.2s ease",
            }}
          >
            {t("btn.close")}
          </button>
        </div>

        {/* Main Content */}
        <div style={{ display: "flex", flex: "1 1 auto", minHeight: 0 }}>
          {/* Left: Document text for selection */}
          <div
            ref={tourRefs.selection}
            style={{
              flex: "1 1 60%",
              minWidth: 0,
              minHeight: 0,
              borderRight: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              flexDirection: "column",
              ...(getTourHighlightStyle(tourRefs.selection) || {}),
            }}
          >
            <div style={{ 
              padding: "12px 16px", 
              borderBottom: "1px solid rgba(255,255,255,0.06)", 
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "rgba(255,255,255,0.01)",
              flex: "0 0 auto" 
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "14px" }}>📄</span>
                <span style={{ fontWeight: 600, fontSize: "13px", color: "#eaeaea" }}>{t("manualChunk.documentText")}</span>
              </div>
              <span style={{ fontSize: "11px", color: "#52525b" }}>
                {docText.length.toLocaleString()} {t("unit.chars")} • {getWordCount(docText).toLocaleString()} {t("unit.words")}
              </span>
            </div>

            <div style={{ padding: 16, overflow: "auto", flex: "1 1 auto", minHeight: 0, background: "rgba(0,0,0,0.2)" }}>
              <pre
                ref={preRef}
                onMouseUp={handleCaptureSelection}
                onKeyUp={handleCaptureSelection}
                style={{ 
                  whiteSpace: "pre-wrap", 
                  margin: 0, 
                  lineHeight: 1.7, 
                  userSelect: "text", 
                  cursor: "text",
                  fontSize: "14px",
                  color: "#d4d4d8",
                  fontFamily: "'SF Mono', Monaco, 'Cascadia Code', monospace",
                }}
              >
                {docText}
              </pre>
            </div>
          </div>

          {/* Right: Fields + Manual segments list */}
          <div style={{ flex: "1 1 40%", minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column" }}>
            {/* Title input and save */}
            <div
              ref={tourRefs.inputs}
              style={{
                padding: "16px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                flex: "0 0 auto",
                background: "rgba(255,255,255,0.01)",
                ...(getTourHighlightStyle(tourRefs.inputs) || {}),
              }}
            >
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input
                  value={title}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSave();
                    }
                  }}
                  onChange={(e) => onTitleChange(e.target.value)}
                  placeholder={t("docPage.titleOptional")}
                  style={{
                    flex: 1,
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(0,0,0,0.3)",
                    color: "#eaeaea",
                    fontSize: "14px",
                    outline: "none",
                    transition: "border-color 0.2s ease",
                  }}
                />
                <button 
                  onClick={handleSave} 
                  disabled={!selection}
                  style={{ 
                    padding: "12px 20px",
                    background: selection 
                      ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" 
                      : "rgba(255,255,255,0.05)",
                    border: "none",
                    borderRadius: 10,
                    color: selection ? "white" : "#52525b",
                    fontWeight: 600,
                    cursor: selection ? "pointer" : "not-allowed",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    boxShadow: selection ? "0 4px 12px rgba(99, 102, 241, 0.3)" : "none",
                    transition: "all 0.2s ease",
                  }}
                >
                  💾 {t("docPage.saveChunk")}
                </button>
              </div>

              {/* Preview */}
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: "11px", color: "#71717a", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <span>📋</span> {t("docPage.preview")}
                </div>
                <div
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    border: selection 
                      ? "1px solid rgba(34, 197, 94, 0.2)" 
                      : "1px solid rgba(255,255,255,0.06)",
                    background: selection 
                      ? "rgba(34, 197, 94, 0.05)" 
                      : "rgba(0,0,0,0.2)",
                    maxHeight: 120,
                    overflow: "auto",
                  }}
                >
                  {selection ? (
                    <>
                      <div style={{ 
                        display: "flex", 
                        gap: 12, 
                        fontSize: "11px", 
                        color: "#71717a", 
                        marginBottom: 8,
                        flexWrap: "wrap"
                      }}>
                        <span>📍 {selection.start}–{selection.end}</span>
                        <span>{selection.end - selection.start} {t("unit.chars")}</span>
                        <span>{getWordCount(selection.text)} {t("unit.words")}</span>
                      </div>
                      <pre style={{ 
                        whiteSpace: "pre-wrap", 
                        margin: 0, 
                        lineHeight: 1.5, 
                        fontSize: "13px",
                        color: "#d4d4d8",
                      }}>{selection.text}</pre>
                    </>
                  ) : (
                    <div style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      padding: "16px",
                      color: "#52525b",
                      fontSize: "13px",
                    }}>
                      {t("docPage.selectFromDoc")}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Manual segments list or viewer */}
            <div
              ref={tourRefs.list}
              style={{
                display: "flex",
                flexDirection: "column",
                flex: "1 1 auto",
                minHeight: 0,
                ...(getTourHighlightStyle(tourRefs.list) || {}),
              }}
            >
              {!openSegment ? (
                <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column" }}>
                  {/* List header with search and filters */}
                  <div style={{ 
                    padding: "12px 16px", 
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: "12px", fontWeight: 600 }}>{t("manualChunk.list.label")}</span>
                        <span style={{ fontWeight: 600, fontSize: "13px", color: "#eaeaea" }}>
                          {t("manualChunk.savedChunks", { mode: modeLabel })}
                        </span>
                      </div>
                      <span style={{ 
                        padding: "4px 10px", 
                        background: "rgba(99, 102, 241, 0.15)",
                        borderRadius: 6,
                        fontSize: "12px",
                        color: "#a5b4fc",
                        fontWeight: 500,
                      }}>{filteredSegments.length}</span>
                    </div>
                    
                    {/* Search and sort */}
                    <div style={{ display: "flex", gap: 8 }}>
                      <div style={{ flex: 1, position: "relative" }}>
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder={t("docPage.searchChunks")}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            borderRadius: 8,
                            border: "1px solid rgba(255,255,255,0.08)",
                            background: "rgba(0,0,0,0.3)",
                            color: "#eaeaea",
                            fontSize: "12px",
                            outline: "none",
                          }}
                        />
                      </div>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 8,
                          border: "1px solid rgba(255,255,255,0.08)",
                          background: "rgba(0,0,0,0.3)",
                          color: "#eaeaea",
                          fontSize: "12px",
                          cursor: "pointer",
                        }}
                      >
                        <option value="newest">{t("manualChunk.sort.newest")}</option>
                        <option value="oldest">{t("manualChunk.sort.oldest")}</option>
                        <option value="alphabetical">{t("manualChunk.sort.az")}</option>
                      </select>
                    </div>
                  </div>

                  {/* List content */}
                  <div ref={listScrollRef} style={{ flex: 1, minWidth: 0, minHeight: 0, overflow: "auto", padding: "12px" }}>
                    {!filteredSegments.length ? (
                      <div style={{ 
                        padding: 32, 
                        textAlign: "center",
                        color: "#52525b",
                      }}>
                        <span style={{ fontSize: "20px", display: "block", marginBottom: 12 }}>{t("manualChunk.empty.label")}</span>
                        {searchQuery ? (
                          <span>{t("manualChunk.empty.search", { query: searchQuery })}</span>
                        ) : (
                          <span>{t("manualChunk.empty.mode", { mode: modeLabel })}</span>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: "grid", gap: 10 }}>
                        {filteredSegments.map((s: SegmentDTO) => {
                          const isFav = isFavorite(`segment-${s.id}`, "segment");
                          return (
                            <div
                              key={s.id}
                              onClick={() => onSegmentSelect(s)}
                              onDoubleClick={() => onSegmentOpen(s)}
                              title={t("manualChunk.cardHint")}
                              style={{
                                cursor: "pointer",
                                padding: 14,
                                borderRadius: 12,
                                border: isFav 
                                  ? "1px solid rgba(251, 191, 36, 0.3)" 
                                  : "1px solid rgba(255,255,255,0.08)",
                                background: isFav 
                                  ? "rgba(251, 191, 36, 0.05)" 
                                  : "rgba(255,255,255,0.02)",
                                userSelect: "none",
                                transition: "all 0.2s ease",
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                    <b style={{ fontSize: "13px", color: "#eaeaea" }}>
                                      {s.title || t("manualChunk.untitled")}
                                    </b>
                                    {isFav && <span title={t("manualChunk.favorite.label")}>*</span>}
                                    {folderMap[String(s.id)] && (
                                      <span style={{ 
                                        fontSize: "10px", 
                                        padding: "2px 6px",
                                        background: "rgba(114, 255, 191, 0.1)",
                                        borderRadius: 4,
                                        color: "#72ffbf" 
                                      }}>
                                        {t("workspace.chip.folder", { value: folders.find((f) => f.id === Number(folderMap[String(s.id)]))?.name ?? "?" })}
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ fontSize: "12px", color: "#71717a", lineHeight: 1.5 }}>
                                    {preview120(s.content)}
                                  </div>
                                </div>

                                <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                                  {/* Favorite button */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleFavorite(s);
                                    }}
                                    style={{
                                      padding: "6px",
                                      background: isFav ? "rgba(251, 191, 36, 0.15)" : "rgba(255, 255, 255, 0.05)",
                                      border: isFav ? "1px solid rgba(251, 191, 36, 0.3)" : "1px solid rgba(255, 255, 255, 0.1)",
                                      borderRadius: 6,
                                      color: isFav ? "#fbbf24" : "#71717a",
                                      cursor: "pointer",
                                      fontSize: "12px",
                                    }}
                                    title={isFav ? t("manualChunk.favorite.removeTitle") : t("manualChunk.favorite.addTitle")}
                                  >
                                    {isFav ? "*" : "o"}
                                  </button>

                                  <select
                                    key={`folder-select-${s.id}-${folders.map((f) => f.id).sort().join(",")}`}
                                    value={folderMap[String(s.id)] ?? "none"}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      const folderId = e.target.value === "none" ? null : e.target.value;
                                      onFolderChange(s.id, folderId);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                      padding: "6px 8px",
                                      borderRadius: 6,
                                      border: "1px solid rgba(255,255,255,0.12)",
                                      background: "rgba(0,0,0,0.3)",
                                      color: "#eaeaea",
                                      fontSize: "12px",
                                      lineHeight: "1.2",
                                    }}
                                  >
                                    <option value="none">{t("common.noFolder")}</option>
                                    {folders.map((f) => (
                                      <option key={f.id} value={f.id}>
                                        {f.name}
                                      </option>
                                    ))}
                                  </select>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onSegmentEdit(s);
                                    }}
                                    style={{
                                      padding: "6px 10px",
                                      fontSize: "11px",
                                      background: "rgba(99, 102, 241, 0.1)",
                                      border: "1px solid rgba(99, 102, 241, 0.2)",
                                      borderRadius: 6,
                                      color: "#a5b4fc",
                                      cursor: "pointer",
                                    }}
                                  >
                                    {t("action.edit")}
                                  </button>

                                  {deletingSegId === s.id ? (
                                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                                      <span style={{ fontSize: "10px", color: "#fca5a5" }}>{t("manualChunk.deleteConfirm")}</span>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onConfirmDelete(s);
                                        }}
                                        style={{
                                          padding: "4px 8px",
                                          fontSize: "11px",
                                          background: "rgba(239, 68, 68, 0.2)",
                                          border: "1px solid rgba(239, 68, 68, 0.4)",
                                          color: "#ef4444",
                                          borderRadius: 4,
                                          cursor: "pointer",
                                        }}
                                      >
                                        {t("action.confirm")}
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onCancelDelete();
                                        }}
                                        style={{
                                          padding: "4px 8px",
                                          fontSize: "11px",
                                          background: "rgba(255, 255, 255, 0.1)",
                                          border: "1px solid rgba(255, 255, 255, 0.15)",
                                          color: "#a1a1aa",
                                          borderRadius: 4,
                                          cursor: "pointer",
                                        }}
                                      >
                                        {t("action.cancel")}
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onSegmentDelete(s);
                                      }}
                                      style={{
                                        padding: "6px 10px",
                                        fontSize: "11px",
                                        background: "rgba(239, 68, 68, 0.1)",
                                        border: "1px solid rgba(239, 68, 68, 0.2)",
                                        color: "#fca5a5",
                                        borderRadius: 6,
                                        cursor: "pointer",
                                      }}
                                      title={t("manualChunk.deleteTitle")}
                                    >
                                      {t("action.delete")}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", flex: "1 1 auto", minHeight: 0 }}>
                  <div
                    style={{
                      padding: "14px 16px",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      flex: "0 0 auto",
                      background: "rgba(255,255,255,0.02)",
                    }}
                  >
                    <span style={{ fontSize: "12px", fontWeight: 600 }}>{t("manualChunk.viewer.label")}</span>
                    <b style={{ flex: 1, fontSize: "14px", color: "#eaeaea" }}>
                      {openSegment.title || t("manualChunk.untitled")}
                    </b>
                    <button
                      onClick={() => handleToggleFavorite(openSegment)}
                      style={{
                        padding: "8px 12px",
                        background: isFavorite(`segment-${openSegment.id}`, "segment")
                          ? "rgba(251, 191, 36, 0.15)"
                          : "rgba(255, 255, 255, 0.05)",
                        border: isFavorite(`segment-${openSegment.id}`, "segment")
                          ? "1px solid rgba(251, 191, 36, 0.3)"
                          : "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: 8,
                        color: isFavorite(`segment-${openSegment.id}`, "segment") ? "#fbbf24" : "#a1a1aa",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      {isFavorite(`segment-${openSegment.id}`, "segment")
                        ? `* ${t("manualChunk.favorite.active")}`
                        : `o ${t("manualChunk.favorite.label")}`}
                    </button>
                    <button
                      onClick={() => onSegmentEdit(openSegment)}
                      style={{
                        padding: "8px 12px",
                        background: "rgba(99, 102, 241, 0.1)",
                        border: "1px solid rgba(99, 102, 241, 0.2)",
                        borderRadius: 8,
                        color: "#a5b4fc",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      {t("action.edit")}
                    </button>
                    <button
                      onClick={() => onOpenSegmentChange(null)}
                      style={{
                        padding: "8px 12px",
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: 8,
                        color: "#a1a1aa",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      ← {t("action.back")}
                    </button>
                  </div>

                  <div style={{ padding: 16, overflow: "auto", flex: "1 1 auto", minHeight: 0 }}>
                    <div
                      style={{ lineHeight: 1.7, fontSize: "14px", color: "#d4d4d8" }}
                      dangerouslySetInnerHTML={{
                        __html:
                          localStorage.getItem(segHtmlKey(openSegment.id)) || plainTextToHtml(openSegment.content || ""),
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer tip */}
            <div style={{ 
              padding: "12px 16px", 
              borderTop: "1px solid rgba(255,255,255,0.06)", 
              fontSize: "12px", 
              color: "#52525b",
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(255,255,255,0.01)",
            }}>
              <span>💡</span>
              <span>{t("docPage.tipMode")}</span>
            </div>
          </div>
        </div>
      </div>

      <TourPanel
        open={tourOpen}
        popoverPos={tourPopoverPos}
        stepIndex={tourStepIndex}
        steps={tourSteps}
        onClose={closeTour}
        onNext={nextTourStep}
        onPrev={prevTourStep}
      />
    </div>
  );
}



