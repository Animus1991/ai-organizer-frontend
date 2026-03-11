/**
 * ChunkEditModal Component
 * 
 * Modal for editing chunk content, title, position, and folder assignment.
 * 
 * @module components/workspace/ChunkEditModal
 */

import { useRef, useState, useEffect, Suspense, lazy } from "react";
import { SegmentDTO, SegmentType, EvidenceGrade, SegmentLinkDTO, LinkType, createSegmentLink, getSegmentLinks, deleteSegmentLink, createLibraryItem } from "../../lib/api";
import { computeSelectionFromPre, splitDocByRange } from "../../lib/documentWorkspace/selection";
import { FolderDTO } from "../../lib/segmentFolders";
import { useLanguage } from "../../context/LanguageContext";

// Lazy load the heavy TipTap editor (only load when modal is opened)
const RichTextEditor = lazy(() => import("../../editor/RichTextEditor").then(module => ({ default: module.RichTextEditor })));

export interface ChunkEditModalProps {
  // Modal state
  open: boolean;
  segment: SegmentDTO | null;
  onClose: () => void;
  
  // Document content
  docText: string;
  
  // Chunk editing state
  title: string;
  onTitleChange: (title: string) => void;
  html: string;
  content: string;
  onHtmlChange: (html: string) => void;
  onContentChange: (content: string) => void;
  start: number;
  end: number;
  onStartChange: (start: number) => void;
  onEndChange: (end: number) => void;
  
  // Folder
  folderId: string | null;
  onFolderChange: (folderId: string | null) => void;
  folders: FolderDTO[];
  
  // Status
  dirty: boolean;
  status: string;
  onStatusChange: (status: string) => void;
  
  // P2: Research-Grade Fields
  segmentType: SegmentType | null;
  onSegmentTypeChange: (type: SegmentType | null) => void;
  evidenceGrade: EvidenceGrade | null;
  onEvidenceGradeChange: (grade: EvidenceGrade | null) => void;
  falsifiabilityCriteria: string;
  onFalsifiabilityCriteriaChange: (criteria: string) => void;
  
  // Save functionality
  onSave: () => Promise<void>;
  
  // Fullscreen
  fullscreen: boolean;
  onFullscreenChange: (fullscreen: boolean) => void;
  
  // Chunk list
  showChunkList: boolean;
  onShowChunkListChange: (show: boolean) => void;
  showAllChunks: boolean;
  onShowAllChunksChange: (show: boolean) => void;
  segments: SegmentDTO[];
  onChunkSelect: (seg: SegmentDTO) => void;
  
  // Selection sync
  syncFromDoc: boolean;
  onSyncFromDocChange: (sync: boolean) => void;
}

/**
 * ChunkEditModal - Modal for editing chunks
 */
export default function ChunkEditModal({
  open,
  segment,
  onClose,
  docText,
  title,
  onTitleChange,
  html,
  content: _content,
  onHtmlChange,
  onContentChange,
  start,
  end,
  onStartChange,
  onEndChange,
  folderId,
  onFolderChange,
  folders,
  dirty,
  status,
  onStatusChange,
  segmentType,
  onSegmentTypeChange,
  evidenceGrade,
  onEvidenceGradeChange,
  falsifiabilityCriteria,
  onFalsifiabilityCriteriaChange,
  onSave,
  fullscreen,
  onFullscreenChange,
  showChunkList,
  onShowChunkListChange,
  showAllChunks,
  onShowAllChunksChange,
  segments,
  onChunkSelect,
  syncFromDoc,
  onSyncFromDocChange: _onSyncFromDocChange,
}: ChunkEditModalProps) {
  const { t } = useLanguage();
  
  const preRef = useRef<HTMLPreElement | null>(null);
  
  // P2: Segment Linking State
  const [segmentLinks, setSegmentLinks] = useState<SegmentLinkDTO[]>([]);
  const [linksLoading, setLinksLoading] = useState(false);
  const [linksError, setLinksError] = useState<string | null>(null);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [newLinkTargetId, setNewLinkTargetId] = useState<number | null>(null);
  const [newLinkType, setNewLinkType] = useState<LinkType>("related");
  const [newLinkNotes, setNewLinkNotes] = useState<string>("");
  // P3: Cross-Document Library state
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [inLibrary, setInLibrary] = useState(false);
  
  // Load segment links when segment changes
  useEffect(() => {
    if (!segment?.id) {
      setSegmentLinks([]);
      setShowLinkForm(false);
      setLinksError(null);
      return;
    }
    
    const loadLinks = async () => {
      setLinksLoading(true);
      setLinksError(null);
      try {
        const response = await getSegmentLinks(segment.id, "both");
        setSegmentLinks(response.links || []);
      } catch (error: any) {
        console.error("Failed to load segment links:", error);
        setLinksError(error?.message || t("chunkEdit.links.loadFailed"));
        setSegmentLinks([]);
      } finally {
        setLinksLoading(false);
      }
    };
    
    loadLinks();
  }, [segment?.id]);
  
  // Handle create link
  const handleCreateLink = async () => {
    if (!segment?.id || !newLinkTargetId) {
      setLinksError(t("chunkEdit.links.selectTarget"));
      return;
    }
    
    setLinksLoading(true);
    setLinksError(null);
    try {
      const newLink = await createSegmentLink(segment.id, {
        toSegmentId: newLinkTargetId,
        linkType: newLinkType,
        notes: newLinkNotes.trim() || null,
      });
      setSegmentLinks(prev => [...prev, { ...newLink, direction: "from" }]);
      setNewLinkTargetId(null);
      setNewLinkType("related");
      setNewLinkNotes("");
      setShowLinkForm(false);
    } catch (error: any) {
      console.error("Failed to create link:", error);
      setLinksError(error?.message || t("chunkEdit.links.createFailed"));
    } finally {
      setLinksLoading(false);
    }
  };
  
  // Handle delete link
  const handleDeleteLink = async (linkId: number) => {
    if (!window.confirm(t("chunkEdit.links.confirmDelete"))) return;
    
    setLinksLoading(true);
    setLinksError(null);
    try {
      await deleteSegmentLink(linkId);
      setSegmentLinks(prev => prev.filter(link => link.id !== linkId));
    } catch (error: any) {
      console.error("Failed to delete link:", error);
      setLinksError(error?.message || t("chunkEdit.links.deleteFailed"));
    } finally {
      setLinksLoading(false);
    }
  };
  
  // P3: Handle add to library
  const handleAddToLibrary = async () => {
    if (!segment?.id) return;
    
    setLibraryLoading(true);
    setLibraryError(null);
    try {
      await createLibraryItem({
        segmentId: segment.id,
      });
      setInLibrary(true);
      setLibraryError(null);
    } catch (error: any) {
      console.error("Failed to add to library:", error);
      setLibraryError(error?.message || t("chunkEdit.library.addFailed"));
      // Check if already in library (409 conflict)
      if (error?.message?.includes("already in library") || error?.message?.includes("409")) {
        setInLibrary(true);
      }
    } finally {
      setLibraryLoading(false);
    }
  };

  const handleCaptureSelection = () => {
    const pre = preRef.current;
    if (!pre) return;

    const info = computeSelectionFromPre(pre, docText);
    if (!info) {
      onStatusChange(t("chunkEdit.status.noSelection"));
      return;
    }

    onStartChange(info.start);
    onEndChange(info.end);

    if (syncFromDoc) {
      onContentChange(info.text);
      onHtmlChange(plainTextToHtml(info.text));
    }

    onStatusChange(t("chunkEdit.status.selectedFromDoc", { count: info.end - info.start }));
  };

  const handleSave = async () => {
    await onSave();
  };

  if (!open || !segment) return null;

  const parts = splitDocByRange(docText, start, end);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(8px)",
        display: "flex",
        padding: "20px",
        zIndex: 60,
        transition: "all 0.2s ease",
      }}
    >
      <div
        style={{
          flex: 1,
          background: "linear-gradient(135deg, rgba(11, 14, 20, 0.98) 0%, rgba(8, 10, 16, 0.98) 100%)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "20px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          maxWidth: fullscreen ? "100%" : "1600px",
          margin: fullscreen ? "0" : "0 auto",
          width: fullscreen ? "100%" : "auto",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05) inset",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            gap: "16px",
            flex: "0 0 auto",
            background: "linear-gradient(135deg, rgba(30, 30, 40, 0.5) 0%, rgba(20, 20, 30, 0.3) 100%)",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              fontWeight: 700,
              fontSize: "var(--font-size-base)",
              lineHeight: "var(--line-height-normal)",
              color: "#c7d2fe",
            }}
          >
            #{(segment as any).orderIndex + 1}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: "var(--font-size-lg)",
                lineHeight: "var(--line-height-snug)",
                letterSpacing: "var(--letter-spacing-tight)",
                fontWeight: 700,
                color: "#eaeaea",
                marginBottom: "4px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {t("chunkEdit.header", { title: segment.title || t("manualChunk.untitled") })}
            </div>
            {status && (
              <div
                style={{
                  fontSize: "var(--font-size-base)",
                  lineHeight: "var(--line-height-normal)",
                  color: "rgba(255, 255, 255, 0.6)",
                  padding: "4px 10px",
                  background: "rgba(99, 102, 241, 0.1)",
                  borderRadius: "6px",
                  display: "inline-block",
                  border: "1px solid rgba(99, 102, 241, 0.2)",
                }}
              >
                {status}
              </div>
            )}
          </div>
          <button
            onClick={() => onFullscreenChange(!fullscreen)}
            style={{
              padding: "10px 16px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "10px",
              color: "#eaeaea",
              fontWeight: 500,
              fontSize: "var(--font-size-base)",
              lineHeight: "var(--line-height-normal)",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            title={fullscreen ? t("chunkEdit.fullscreen.exitTitle") : t("chunkEdit.fullscreen.enterTitle")}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
            }}
          >
            {fullscreen ? t("chunkEdit.fullscreen.exit") : t("chunkEdit.fullscreen.enter")}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "10px 18px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "10px",
              color: "#eaeaea",
              fontWeight: 600,
              fontSize: "var(--font-size-base)",
              lineHeight: "var(--line-height-normal)",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)";
              e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.3)";
              e.currentTarget.style.color = "#fca5a5";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
              e.currentTarget.style.color = "#eaeaea";
            }}
          >
            <svg style={{ width: "14px", height: "14px", display: "inline", marginRight: "6px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            {t("action.close")}
          </button>
        </div>

        {/* Editor Toolbar */}
        <div
          style={{
            flex: "0 0 auto",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            background: "linear-gradient(135deg, rgba(20, 20, 30, 0.8) 0%, rgba(15, 15, 25, 0.8) 100%)",
            padding: "20px 24px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "var(--font-size-base)",
                  lineHeight: "var(--line-height-normal)",
                  fontWeight: 600,
                  color: "rgba(255, 255, 255, 0.7)",
                  marginBottom: "8px",
                }}
              >
                {t("common.title")}
              </label>
              <input
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(0, 0, 0, 0.3)",
                  color: "#eaeaea",
                  fontSize: "var(--font-size-base)",
                  lineHeight: "var(--line-height-normal)",
                  transition: "all 0.2s ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.5)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "var(--font-size-base)",
                  lineHeight: "var(--line-height-normal)",
                  fontWeight: 600,
                  color: "rgba(255, 255, 255, 0.7)",
                  marginBottom: "8px",
                }}
              >
                {t("chunkEdit.contentLabel")}
              </label>
              <div
                style={{
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "12px",
                  overflow: "hidden",
                  background: "rgba(0, 0, 0, 0.2)",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2) inset",
                }}
              >
                <Suspense
                  fallback={
                    <div style={{ 
                      minHeight: "200px", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      background: "rgba(0, 0, 0, 0.2)",
                      borderRadius: "8px",
                      border: "1px solid rgba(255, 255, 255, 0.1)"
                    }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ 
                          width: "32px", 
                          height: "32px", 
                          border: "3px solid rgba(99, 102, 241, 0.2)", 
                          borderTopColor: "#6366f1",
                          borderRadius: "50%", 
                          animation: "spin 1s linear infinite",
                          margin: "0 auto 12px"
                        }} />
                        <p style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.6)" }}>{t("chunkEdit.loadingEditor")}</p>
                        <style>{`
                          @keyframes spin {
                            to { transform: rotate(360deg); }
                          }
                        `}</style>
                      </div>
                    </div>
                  }
                >
                  <RichTextEditor
                    valueHtml={html}
                    onChange={({ html, text }) => {
                      onHtmlChange(html);
                      onContentChange(text);
                    }}
                    placeholder={t("chunkEdit.contentPlaceholder")}
                  />
                </Suspense>
              </div>
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", paddingTop: "8px" }}>
              <button
                onClick={onClose}
                style={{
                  padding: "12px 24px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  color: "#eaeaea",
                  fontWeight: 600,
                  fontSize: "var(--font-size-base)",
                  lineHeight: "var(--line-height-normal)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {t("action.cancel")}
              </button>
              <button
                onClick={handleSave}
                style={{
                  padding: "12px 24px",
                  background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                  border: "none",
                  borderRadius: "12px",
                  color: "white",
                  fontWeight: 600,
                  fontSize: "var(--font-size-base)",
                  lineHeight: "var(--line-height-normal)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(99, 102, 241, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.3)";
                }}
              >
                <svg style={{ width: "16px", height: "16px", display: "inline", marginRight: "6px", verticalAlign: "middle" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {t("chunkEdit.saveChanges")}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div style={{ display: "flex", flex: "1 1 auto", minHeight: 0 }}>
          {/* Left: Chunk Details + Optional List */}
          <div
            style={{
              flex: showChunkList ? "1 1 16.5%" : "1 1 16.5%",
              minWidth: 0,
              minHeight: 0,
              borderRight: "1px solid rgba(255,255,255,0.10)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Chunk Details */}
            <div
              style={{
                padding: "16px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                flex: "0 0 auto",
                background: "linear-gradient(135deg, rgba(20, 20, 30, 0.5) 0%, rgba(15, 15, 25, 0.3) 100%)",
              }}
            >
              <h4
                style={{
                  margin: "0 0 16px 0",
                  fontSize: "var(--font-size-base)",
                  lineHeight: "var(--line-height-normal)",
                  fontWeight: 700,
                  color: "#eaeaea",
                }}
              >
                {t("chunkEdit.details.title")}
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  <span
                    style={{
                      padding: "6px 12px",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "8px",
                      fontSize: "var(--font-size-base)",
                      lineHeight: "var(--line-height-normal)",
                      fontWeight: 600,
                      color: "rgba(255, 255, 255, 0.8)",
                    }}
                  >
                    {t("chunkEdit.details.index")}: {(segment as any).orderIndex + 1}
                  </span>
                  <span
                    style={{
                      padding: "6px 12px",
                      background: (segment as any).isManual ? "rgba(59, 130, 246, 0.2)" : "rgba(107, 114, 128, 0.2)",
                      border: (segment as any).isManual ? "1px solid rgba(59, 130, 246, 0.3)" : "1px solid rgba(107, 114, 128, 0.3)",
                      borderRadius: "8px",
                      fontSize: "var(--font-size-base)",
                      lineHeight: "var(--line-height-normal)",
                      fontWeight: 600,
                      color: (segment as any).isManual ? "#93c5fd" : "#9ca3af",
                    }}
                  >
                    {(segment as any).isManual ? t("common.manual") : t("common.auto")}
                  </span>
                  <span
                    style={{
                      padding: "6px 12px",
                      background: (segment as any).mode === "qa" ? "rgba(59, 130, 246, 0.2)" : "rgba(16, 185, 129, 0.2)",
                      border: (segment as any).mode === "qa" ? "1px solid rgba(59, 130, 246, 0.3)" : "1px solid rgba(16, 185, 129, 0.3)",
                      borderRadius: "8px",
                      fontSize: "var(--font-size-base)",
                      lineHeight: "var(--line-height-normal)",
                      fontWeight: 600,
                      color: (segment as any).mode === "qa" ? "#93c5fd" : "#6ee7b7",
                    }}
                  >
                    {t("chunkEdit.details.mode")}: {(segment as any).mode}
                  </span>
                </div>
                <div
                  style={{
                    padding: "10px 12px",
                    background: "rgba(0, 0, 0, 0.2)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "8px",
                    fontSize: "var(--font-size-base)",
                    lineHeight: "var(--line-height-normal)",
                    color: "rgba(255, 255, 255, 0.7)",
                  }}
                >
                  <div style={{ marginBottom: "4px" }}>
                    <strong style={{ color: "#eaeaea" }}>{t("chunkEdit.details.position")}:</strong> {start} - {end}
                  </div>
                  <div>
                    <strong style={{ color: "#eaeaea" }}>{t("chunkEdit.details.length")}:</strong> {end - start} {t("unit.chars")}
                  </div>
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "var(--font-size-xs)",
                      lineHeight: "var(--line-height-normal)",
                      fontWeight: 600,
                      color: "rgba(255, 255, 255, 0.7)",
                      marginBottom: "6px",
                    }}
                  >
                    {t("chunkEdit.details.folder")}
                  </label>
                  <select
                    value={folderId ?? "none"}
                    onChange={(e) => onFolderChange(e.target.value === "none" ? null : e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(0, 0, 0, 0.3)",
                      color: "#eaeaea",
                      fontSize: "var(--font-size-base)",
                      lineHeight: "var(--line-height-normal)",
                    }}
                  >
                    <option value="none">{t("common.noFolder")}</option>
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
                {/* P2: Research-Grade Fields */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "var(--font-size-xs)",
                      lineHeight: "var(--line-height-normal)",
                      fontWeight: 600,
                      color: "rgba(255, 255, 255, 0.7)",
                      marginBottom: "6px",
                    }}
                  >
                    {t("workspace.segmentTypeLabel")}:
                  </label>
                  <select
                    value={segmentType ?? "untyped"}
                    onChange={(e) => onSegmentTypeChange(e.target.value === "untyped" ? null : (e.target.value as SegmentType))}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(0, 0, 0, 0.3)",
                      color: "#eaeaea",
                      fontSize: "var(--font-size-base)",
                      lineHeight: "var(--line-height-normal)",
                    }}
                  >
                    <option value="untyped">{t("segmentType.untyped")}</option>
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
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "var(--font-size-xs)",
                      lineHeight: "var(--line-height-normal)",
                      fontWeight: 600,
                      color: "rgba(255, 255, 255, 0.7)",
                      marginBottom: "6px",
                    }}
                  >
                    {t("chunkEdit.evidenceGradeLabel")}
                  </label>
                  <select
                    value={evidenceGrade ?? ""}
                    onChange={(e) => onEvidenceGradeChange(e.target.value === "" ? null : (e.target.value as EvidenceGrade))}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(0, 0, 0, 0.3)",
                      color: "#eaeaea",
                      fontSize: "var(--font-size-base)",
                      lineHeight: "var(--line-height-normal)",
                    }}
                  >
                    <option value="">{t("common.none")}</option>
                    <option value="E0">{t("evidenceGrade.E0")}</option>
                    <option value="E1">{t("evidenceGrade.E1")}</option>
                    <option value="E2">{t("evidenceGrade.E2")}</option>
                    <option value="E3">{t("evidenceGrade.E3")}</option>
                    <option value="E4">{t("evidenceGrade.E4")}</option>
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "var(--font-size-xs)",
                      lineHeight: "var(--line-height-normal)",
                      fontWeight: 600,
                      color: "rgba(255, 255, 255, 0.7)",
                      marginBottom: "6px",
                    }}
                  >
                    {t("chunkEdit.falsifiability.label")}
                  </label>
                  <textarea
                    value={falsifiabilityCriteria}
                    onChange={(e) => onFalsifiabilityCriteriaChange(e.target.value)}
                    placeholder={t("chunkEdit.falsifiability.placeholder")}
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(0, 0, 0, 0.3)",
                      color: "#eaeaea",
                      fontSize: "var(--font-size-base)",
                      lineHeight: "var(--line-height-normal)",
                      resize: "vertical",
                      fontFamily: "inherit",
                    }}
                  />
                </div>
                {/* P3: Cross-Document Library Section */}
                <div style={{ marginTop: 16, padding: 12, background: "rgba(0, 0, 0, 0.2)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <label
                      style={{
                        fontSize: "var(--font-size-xs)",
                        lineHeight: "var(--line-height-normal)",
                        fontWeight: 600,
                        color: "rgba(255, 255, 255, 0.7)",
                      }}
                    >
                      {t("chunkEdit.library.title")}
                    </label>
                    {!inLibrary && (
                      <button
                        onClick={handleAddToLibrary}
                        disabled={libraryLoading}
                        style={{
                          padding: "6px 12px",
                          fontSize: "var(--font-size-xs)",
                          lineHeight: "var(--line-height-normal)",
                          background: libraryLoading ? "rgba(107, 114, 128, 0.3)" : "rgba(16, 185, 129, 0.2)",
                          border: `1px solid ${libraryLoading ? "rgba(107, 114, 128, 0.4)" : "rgba(16, 185, 129, 0.4)"}`,
                          color: libraryLoading ? "#9ca3af" : "#10b981",
                          borderRadius: 6,
                          cursor: libraryLoading ? "not-allowed" : "pointer",
                          opacity: libraryLoading ? 0.5 : 1,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                        title={t("chunkEdit.library.addTitle")}
                      >
                        {libraryLoading ? (
                          <>{t("chunkEdit.library.adding")}</>
                        ) : (
                          <>{t("chunkEdit.library.add")}</>
                        )}
                      </button>
                    )}
                    {inLibrary && (
                      <span
                        style={{
                          padding: "6px 12px",
                          fontSize: "var(--font-size-xs)",
                          lineHeight: "var(--line-height-normal)",
                          background: "rgba(16, 185, 129, 0.2)",
                          border: "1px solid rgba(16, 185, 129, 0.4)",
                          color: "#10b981",
                          borderRadius: 6,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        {t("chunkEdit.library.inLibrary")}
                      </span>
                    )}
                  </div>
                  {libraryError && (
                    <div style={{ fontSize: "var(--font-size-xs)", color: "#ef4444", marginTop: 8, padding: 6, background: "rgba(239, 68, 68, 0.1)", borderRadius: 4 }}>
                      {libraryError}
                    </div>
                  )}
                  {!libraryError && !inLibrary && (
                    <p style={{ fontSize: "var(--font-size-xs)", color: "rgba(255, 255, 255, 0.5)", margin: 0, marginTop: 4 }}>
                      {t("chunkEdit.library.helper")}
                    </p>
                  )}
                </div>
                
                {/* P2: Segment Links Section */}
                <div style={{ marginTop: 16, padding: 12, background: "rgba(0, 0, 0, 0.2)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <label
                      style={{
                        fontSize: "var(--font-size-xs)",
                        lineHeight: "var(--line-height-normal)",
                        fontWeight: 600,
                        color: "rgba(255, 255, 255, 0.7)",
                      }}
                    >
                      {t("chunkEdit.links.title", { count: segmentLinks.length })}
                    </label>
                    {!showLinkForm && (
                      <button
                        onClick={() => setShowLinkForm(true)}
                        style={{
                          padding: "4px 8px",
                          fontSize: "var(--font-size-xs)",
                          lineHeight: "var(--line-height-normal)",
                          background: "rgba(99, 102, 241, 0.2)",
                          border: "1px solid rgba(99, 102, 241, 0.4)",
                          color: "#a5b4fc",
                          borderRadius: 4,
                          cursor: "pointer",
                        }}
                      >
                        {t("chunkEdit.links.add")}
                      </button>
                    )}
                  </div>
                  
                  {linksError && (
                    <div style={{ fontSize: "var(--font-size-xs)", color: "#ef4444", marginBottom: 8, padding: 6, background: "rgba(239, 68, 68, 0.1)", borderRadius: 4 }}>
                      {linksError}
                    </div>
                  )}
                  
                  {showLinkForm && (
                    <div style={{ marginBottom: 12, padding: 12, background: "rgba(0, 0, 0, 0.3)", borderRadius: 6, border: "1px solid rgba(99, 102, 241, 0.3)" }}>
                      <div style={{ marginBottom: 8 }}>
                        <label style={{ display: "block", fontSize: "var(--font-size-xs)", color: "rgba(255, 255, 255, 0.7)", marginBottom: 4 }}>
                          {t("chunkEdit.links.toSegment")}
                        </label>
                        <select
                          value={newLinkTargetId ?? ""}
                          onChange={(e) => setNewLinkTargetId(e.target.value ? Number(e.target.value) : null)}
                          style={{
                            width: "100%",
                            padding: "6px 8px",
                            borderRadius: 6,
                            border: "1px solid rgba(255,255,255,0.1)",
                            background: "rgba(0, 0, 0, 0.4)",
                            color: "#eaeaea",
                            fontSize: "var(--font-size-xs)",
                          }}
                        >
                          <option value="">{t("chunkEdit.links.selectSegment")}</option>
                          {segments
                            .filter(s => s.id !== segment?.id)
                            .map(s => (
                              <option key={s.id} value={s.id}>
                              {(s.orderIndex ?? 0) + 1}. {s.title || t("structure.segmentLabel", { index: (s.orderIndex ?? 0) + 1 })}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <label style={{ display: "block", fontSize: "var(--font-size-xs)", color: "rgba(255, 255, 255, 0.7)", marginBottom: 4 }}>
                          {t("chunkEdit.links.typeLabel")}
                        </label>
                        <select
                          value={newLinkType}
                          onChange={(e) => setNewLinkType(e.target.value as LinkType)}
                          style={{
                            width: "100%",
                            padding: "6px 8px",
                            borderRadius: 6,
                            border: "1px solid rgba(255,255,255,0.1)",
                            background: "rgba(0, 0, 0, 0.4)",
                            color: "#eaeaea",
                            fontSize: "var(--font-size-xs)",
                          }}
                        >
                          <option value="supports">{t("linkType.supports")}</option>
                          <option value="contradicts">{t("linkType.contradicts")}</option>
                          <option value="depends_on">{t("linkType.depends_on")}</option>
                          <option value="counterargument">{t("linkType.counterargument")}</option>
                          <option value="evidence">{t("linkType.evidence")}</option>
                          <option value="related">{t("linkType.related")}</option>
                        </select>
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <label style={{ display: "block", fontSize: "var(--font-size-xs)", color: "rgba(255, 255, 255, 0.7)", marginBottom: 4 }}>
                          {t("chunkEdit.links.notesLabel")}
                        </label>
                        <textarea
                          value={newLinkNotes}
                          onChange={(e) => setNewLinkNotes(e.target.value)}
                          placeholder={t("chunkEdit.links.notesPlaceholder")}
                          rows={2}
                          style={{
                            width: "100%",
                            padding: "6px 8px",
                            borderRadius: 6,
                            border: "1px solid rgba(255,255,255,0.1)",
                            background: "rgba(0, 0, 0, 0.4)",
                            color: "#eaeaea",
                            fontSize: "var(--font-size-xs)",
                            resize: "vertical",
                            fontFamily: "inherit",
                          }}
                        />
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={handleCreateLink}
                          disabled={linksLoading || !newLinkTargetId}
                          style={{
                            padding: "6px 12px",
                            fontSize: "var(--font-size-xs)",
                            background: "rgba(99, 102, 241, 0.3)",
                            border: "1px solid rgba(99, 102, 241, 0.5)",
                            color: "#a5b4fc",
                            borderRadius: 6,
                            cursor: linksLoading || !newLinkTargetId ? "not-allowed" : "pointer",
                            opacity: linksLoading || !newLinkTargetId ? 0.5 : 1,
                          }}
                        >
                          {linksLoading ? t("chunkEdit.links.creating") : t("chunkEdit.links.create")}
                        </button>
                        <button
                          onClick={() => {
                            setShowLinkForm(false);
                            setNewLinkTargetId(null);
                            setNewLinkType("related");
                            setNewLinkNotes("");
                            setLinksError(null);
                          }}
                          style={{
                            padding: "6px 12px",
                            fontSize: "var(--font-size-xs)",
                            background: "rgba(255, 255, 255, 0.1)",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                            color: "#eaeaea",
                            borderRadius: 6,
                            cursor: "pointer",
                          }}
                        >
                          {t("action.cancel")}
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {linksLoading && !showLinkForm ? (
                    <div style={{ fontSize: "var(--font-size-xs)", color: "rgba(255, 255, 255, 0.6)", padding: 8, textAlign: "center" }}>
                      {t("chunkEdit.links.loading")}
                    </div>
                  ) : segmentLinks.length === 0 ? (
                    <div style={{ fontSize: "var(--font-size-xs)", color: "rgba(255, 255, 255, 0.5)", padding: 8, textAlign: "center" }}>
                      {t("chunkEdit.links.empty")}
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {segmentLinks.map((link) => {
                        const targetSegment = segments.find(s => s.id === (link.direction === "from" ? link.toSegmentId : link.fromSegmentId));
                        const isOutgoing = link.direction === "from";
                        const linkTypeKey = `linkType.${link.linkType}`;
                        const linkTypeLabel = t(linkTypeKey) !== linkTypeKey
                          ? t(linkTypeKey)
                          : link.linkType.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
                        return (
                          <div
                            key={link.id}
                            style={{
                              padding: 8,
                              background: "rgba(0, 0, 0, 0.3)",
                              borderRadius: 6,
                              border: "1px solid rgba(255,255,255,0.1)",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <div style={{ flex: 1, fontSize: "var(--font-size-xs)" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                                <span style={{ color: isOutgoing ? "#06b6d4" : "#ec4899" }}>
                                  {isOutgoing ? "->" : "<-"}
                                </span>
                                <span style={{ color: "rgba(255, 255, 255, 0.8)", fontWeight: 500 }}>
                                  {linkTypeLabel}
                                </span>
                                {targetSegment ? (
                                  <span style={{ color: "rgba(255, 255, 255, 0.6)" }}>
                                    {(targetSegment.orderIndex ?? 0) + 1}. {targetSegment.title || t("structure.segmentLabel", { index: (link.direction === "from" ? link.toSegmentId : link.fromSegmentId) })}
                                  </span>
                                ) : (
                                  <span style={{ color: "rgba(255, 255, 255, 0.5)", fontStyle: "italic" }}>
                                    {t("chunkEdit.links.notInList", { id: link.direction === "from" ? link.toSegmentId : link.fromSegmentId })}
                                  </span>
                                )}
                              </div>
                              {link.notes && (
                                <div style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "var(--font-size-xs)", marginTop: 4, fontStyle: "italic" }}>
                                  {link.notes}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => handleDeleteLink(link.id)}
                              disabled={linksLoading}
                              style={{
                                padding: "4px 8px",
                                fontSize: "var(--font-size-xs)",
                                background: "rgba(239, 68, 68, 0.2)",
                                border: "1px solid rgba(239, 68, 68, 0.3)",
                                color: "#ef4444",
                                borderRadius: 4,
                                cursor: linksLoading ? "not-allowed" : "pointer",
                                opacity: linksLoading ? 0.5 : 1,
                              }}
                              title={t("chunkEdit.links.deleteTitle")}
                            >
                              🗑️
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                {dirty && (
                  <div
                    style={{
                      fontSize: "var(--font-size-base)",
                      lineHeight: "var(--line-height-normal)",
                      color: "#fcd34d",
                      padding: "10px 12px",
                      background: "rgba(251, 191, 36, 0.15)",
                      border: "1px solid rgba(251, 191, 36, 0.3)",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <svg style={{ width: "16px", height: "16px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {t("chunkEdit.unsaved")}
                  </div>
                )}
              </div>
            </div>

            {/* Chunk List (toggleable) */}
            {showChunkList && (
              <>
                <div style={{ padding: 8, borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 8, flex: "0 0 auto" }}>
                  <span style={{ fontSize: "var(--font-size-xs)", lineHeight: "var(--line-height-normal)", fontWeight: 600 }}>{t("chunkEdit.allChunks")}</span>
                  <button
                    onClick={() => onShowChunkListChange(false)}
                    style={{ padding: "2px 6px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 4, fontSize: 10, cursor: "pointer" }}
                  >
                    ✕
                  </button>
                </div>
                <div style={{ padding: 8, overflow: "auto", flex: "1 1 auto", minHeight: 0 }}>
                  <div style={{ display: "grid", gap: 6 }}>
                    {(showAllChunks ? segments : segments.slice(0, 10)).map((s: any) => (
                      <div
                        key={s.id}
                        onClick={() => {
                          if (s.id !== segment?.id) {
                            onChunkSelect(s);
                          }
                        }}
                        style={{
                          padding: 6,
                          borderRadius: 6,
                          border: s.id === segment?.id ? "1px solid #72ffbf" : "1px solid rgba(255,255,255,0.10)",
                          background: s.id === segment?.id ? "rgba(114,255,191,0.1)" : "rgba(255,255,255,0.03)",
                          cursor: "pointer",
                          fontSize: 11,
                        }}
                      >
                        <div style={{ fontWeight: 600, marginBottom: 2 }}>
                          {(s.orderIndex ?? 0) + 1}. {s.title || t("manualChunk.untitled")}
                        </div>
                        <div style={{ opacity: 0.7 }}>
                          {s.isManual ? t("common.manual") : t("common.auto")} • {s.mode} • {s.end - s.start} {t("unit.chars")}
                        </div>
                      </div>
                    ))}
                    {segments.length > 10 && !showAllChunks && (
                      <div 
                        style={{ fontSize: 10, opacity: 0.6, textAlign: "center", paddingTop: 4, cursor: "pointer", textDecoration: "underline" }}
                        onClick={() => onShowAllChunksChange(true)}
                      >
                        {t("chunkEdit.moreChunks", { count: segments.length - 10 })}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Show chunk list button when hidden */}
            {!showChunkList && (
              <div style={{ padding: 8, flex: "1 1 auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <button
                  onClick={() => onShowChunkListChange(true)}
                  style={{ padding: "8px 12px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 6, fontSize: "var(--font-size-xs)", lineHeight: "var(--line-height-normal)", cursor: "pointer" }}
                >
                  {t("chunkEdit.showChunkList")}
                </button>
              </div>
            )}
          </div>

          {/* Right: Document Text Selection */}
          <div style={{ flex: "1 1 83.5%", minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <div style={{ padding: 10, borderBottom: "1px solid rgba(255,255,255,0.08)", fontWeight: 600, fontSize: "var(--font-size-xs)", lineHeight: "var(--line-height-normal)", flex: "0 0 auto" }}>
              {t("chunkEdit.selectTextHint")}
            </div>
            <div style={{ padding: 12, overflow: "auto", flex: "1 1 auto", minHeight: 0, maxHeight: "40%" }}>
              <pre
                ref={preRef}
                onMouseUp={handleCaptureSelection}
                onKeyUp={handleCaptureSelection}
                style={{ whiteSpace: "pre-wrap", margin: 0, lineHeight: "var(--line-height-relaxed)", userSelect: "text", cursor: "text", fontSize: "var(--font-size-xs)" }}
              >
                {parts.before}
                {parts.mid ? (
                  <span
                    style={{
                      background: "rgba(114,255,191,0.18)",
                      outline: "1px solid rgba(114,255,191,0.45)",
                      borderRadius: 6,
                      padding: "1px 2px",
                    }}
                  >
                    {parts.mid}
                  </span>
                ) : null}
                {parts.after}
              </pre>
            </div>

            {/* Chunk List - Right side when shown */}
            {showChunkList && (
              <>
                <div style={{ padding: 8, borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 8, flex: "0 0 auto" }}>
                  <span style={{ fontSize: "var(--font-size-xs)", lineHeight: "var(--line-height-normal)", fontWeight: 600 }}>{t("chunkEdit.allChunks")}</span>
                  <button
                    onClick={() => onShowChunkListChange(false)}
                    style={{ padding: "2px 6px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 4, fontSize: 10, cursor: "pointer" }}
                  >
                    ✕
                  </button>
                </div>
                <div style={{ padding: 8, overflow: "auto", flex: "1 1 auto", minHeight: 0, maxHeight: "30%" }}>
                  <div style={{ display: "grid", gap: 6 }}>
                    {(showAllChunks ? segments : segments.slice(0, 10)).map((s: any) => (
                      <div
                        key={s.id}
                        onClick={() => {
                          if (s.id !== segment?.id) {
                            onChunkSelect(s);
                          }
                        }}
                        style={{
                          padding: 6,
                          borderRadius: 6,
                          border: s.id === segment?.id ? "1px solid #72ffbf" : "1px solid rgba(255,255,255,0.10)",
                          background: s.id === segment?.id ? "rgba(114,255,191,0.1)" : "rgba(255,255,255,0.03)",
                          cursor: "pointer",
                          fontSize: 11,
                        }}
                      >
                        <div style={{ fontWeight: 600, marginBottom: 2 }}>
                          {(s.orderIndex ?? 0) + 1}. {s.title || t("manualChunk.untitled")}
                        </div>
                        <div style={{ opacity: 0.7 }}>
                          {s.isManual ? t("common.manual") : t("common.auto")} • {s.mode} • {s.end - s.start} {t("unit.chars")}
                        </div>
                      </div>
                    ))}
                    {segments.length > 10 && !showAllChunks && (
                      <div 
                        style={{ fontSize: 10, opacity: 0.6, textAlign: "center", paddingTop: 4, cursor: "pointer", textDecoration: "underline" }}
                        onClick={() => onShowAllChunksChange(true)}
                      >
                        {t("chunkEdit.moreChunks", { count: segments.length - 10 })}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Show chunk list button when hidden */}
            {!showChunkList && (
              <div style={{ padding: 8, flex: "1 1 auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <button
                  onClick={() => onShowChunkListChange(true)}
                  style={{ padding: "8px 12px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 6, fontSize: "var(--font-size-xs)", lineHeight: "var(--line-height-normal)", cursor: "pointer" }}
                >
                  {t("chunkEdit.showChunkList")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { plainTextToHtml } from "../../editor/utils/text";

