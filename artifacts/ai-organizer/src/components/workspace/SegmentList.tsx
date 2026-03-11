import React from "react";
import { highlightSearch } from "../../lib/searchUtils";
import { preview120 } from "../../lib/documentWorkspace/utils";
import { plainTextToHtml } from "../../editor/utils/text";
import FolderView from "../FolderView";
import type { SegmentDTO } from "../../lib/api";
import type { FolderDTO } from "../../lib/segmentFolders";
import { useLanguage } from "../../context/LanguageContext";

// Helper function to format segment type for display
function formatSegmentType(type: string | null | undefined): string {
  if (!type || type === "untyped") return "";
  return type
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Helper function to get segment type badge color
function getSegmentTypeColor(type: string | null | undefined): string {
  const colors: Record<string, string> = {
    definition: "#6366f1",      // indigo
    assumption: "#8b5cf6",      // purple
    claim: "#ec4899",           // pink
    mechanism: "#f59e0b",       // amber
    prediction: "#10b981",      // emerald
    counterargument: "#ef4444", // red
    evidence: "#06b6d4",        // cyan
    open_question: "#84cc16",   // lime
    experiment: "#f97316",      // orange
    meta: "#64748b",            // slate
  };
  return colors[type || ""] || "#6b7280"; // default gray for untyped
}

// Helper function to get evidence grade badge color
function getEvidenceGradeColor(grade: string | null | undefined): string {
  const colors: Record<string, string> = {
    E0: "#6b7280",  // gray - no evidence
    E1: "#ef4444",  // red - internal logic only
    E2: "#f59e0b",  // amber - general reference
    E3: "#3b82f6",  // blue - precise excerpt
    E4: "#10b981",  // emerald - reproducible data
  };
  return colors[grade || ""] || "#6b7280";
}

export interface SegmentListProps {
  segments: SegmentDTO[];
  filteredSegments: SegmentDTO[];
  selectedSegId: number | null;
  openSeg: SegmentDTO | null;
  compactHeader?: boolean;
  folderFilter: string;
  folders: FolderDTO[];
  folderMap: Record<string, string>;
  query: string;
  draggedSegment: SegmentDTO | null;
  dragOverFolder: string | null;
  deletingSegId: number | null;
  listScrollRef: React.RefObject<HTMLDivElement | null>;
  segHtmlKey: (segId: number) => string;
  docId: number;
  onSelect: (segment: SegmentDTO) => void;
  onOpen: (segment: SegmentDTO) => void;
  onDragStart: (e: React.DragEvent, segment: SegmentDTO) => void;
  onDragEnd: () => void;
  onFolderChange: (segment: SegmentDTO, folderId: string | null) => void;
  onEdit: (segment: SegmentDTO) => void;
  onDelete: (segment: SegmentDTO) => void;
  onConfirmDelete: (segment: SegmentDTO) => void;
  onCancelDelete: () => void;
  onBackToList: () => void;
  onChunkUpdated: () => void;
  onBackFromFolder: () => void;
}

export function SegmentList({
  segments,
  filteredSegments,
  selectedSegId,
  openSeg,
  compactHeader,
  folderFilter,
  folders,
  folderMap,
  query,
  draggedSegment,
  dragOverFolder,
  deletingSegId,
  listScrollRef,
  segHtmlKey,
  docId,
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
  onChunkUpdated,
  onBackFromFolder,
}: SegmentListProps) {
  const { t } = useLanguage();
  const isCompact = !!compactHeader;

  if (openSeg) {
    // Segment viewer mode
    return (
      <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <div
          style={{
            padding: 12,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            flex: "0 0 auto",
          }}
        >
          <b style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span>
              {(((openSeg as any).orderIndex ?? 0) as number) + 1}. {(openSeg as any).title}{" "}
              <span style={{ fontSize: "var(--font-size-xs)", lineHeight: "var(--line-height-normal)", opacity: 0.7 }}>
                {(openSeg as any).isManual ? "• manual" : "• auto"}
              </span>
            </span>
            {/* P2: Segment Type Badge in open view */}
            {(openSeg as any).segmentType && (openSeg as any).segmentType !== "untyped" && (
              <span
                style={{
                  fontSize: "var(--font-size-xs)",
                  lineHeight: "var(--line-height-normal)",
                  padding: "2px 6px",
                  borderRadius: 4,
                  background: `${getSegmentTypeColor((openSeg as any).segmentType)}20`,
                  border: `1px solid ${getSegmentTypeColor((openSeg as any).segmentType)}60`,
                  color: getSegmentTypeColor((openSeg as any).segmentType),
                  fontWeight: 500,
                }}
                title={`Segment Type: ${formatSegmentType((openSeg as any).segmentType)}`}
              >
                {formatSegmentType((openSeg as any).segmentType)}
              </span>
            )}
            {/* P2: Evidence Grade Badge in open view */}
            {(openSeg as any).evidenceGrade && (
              <span
                style={{
                  fontSize: "var(--font-size-xs)",
                  lineHeight: "var(--line-height-normal)",
                  padding: "2px 6px",
                  borderRadius: 4,
                  background: `${getEvidenceGradeColor((openSeg as any).evidenceGrade)}20`,
                  border: `1px solid ${getEvidenceGradeColor((openSeg as any).evidenceGrade)}60`,
                  color: getEvidenceGradeColor((openSeg as any).evidenceGrade),
                  fontWeight: 600,
                  fontFamily: "monospace",
                }}
                title={`Evidence Grade: ${(openSeg as any).evidenceGrade}`}
              >
                {(openSeg as any).evidenceGrade}
              </span>
            )}
          </b>

          <button onClick={() => onEdit(openSeg)} style={{ padding: "8px 10px" }}>
            Edit
          </button>

          <button onClick={onBackToList} style={{ padding: "8px 10px" }}>
            Back to list
          </button>
        </div>

        <div style={{ padding: 12, overflow: "auto", flex: "1 1 auto", minHeight: 0 }}>
          <div
            style={{ lineHeight: 1.55 }}
            dangerouslySetInnerHTML={{
              __html: localStorage.getItem(segHtmlKey((openSeg as any).id)) || plainTextToHtml((openSeg as any).content || ""),
            }}
          />
        </div>
      </div>
    );
  }

  // Folder view mode
  if (folderFilter !== "all" && folderFilter !== "none") {
    const selectedFolder = folders.find((f) => String(f.id) === String(folderFilter));
    return selectedFolder ? (
      <FolderView
        docId={docId}
        folder={selectedFolder}
        onBack={onBackFromFolder}
        onChunkUpdated={onChunkUpdated}
      />
    ) : (
      <div style={{ padding: 12, opacity: 0.7 }}>{t("workspace.folderNotFound")}</div>
    );
  }

  // Regular segments list
  return (
    <div ref={listScrollRef} style={{ flex: 1, minWidth: 0, minHeight: 0, overflow: "auto" }}>
      {/* Enhanced Chunks Header */}
      <div style={{ 
        padding: isCompact ? "10px 12px" : "12px 16px", 
        display: "flex", 
        justifyContent: "space-between",
        alignItems: "center",
        position: "sticky",
        top: 0,
        zIndex: 5,
        background: "rgba(255, 255, 255, 0.02)",
        backdropFilter: "blur(10px)",
        borderRadius: "10px",
        margin: isCompact ? "0 8px 6px 8px" : "0 8px 8px 8px",
        border: "1px solid rgba(255, 255, 255, 0.05)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: isCompact ? "26px" : "28px",
            height: isCompact ? "26px" : "28px",
            background: "linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(236, 72, 153, 0.3)",
          }}>
            <span style={{ fontSize: isCompact ? "13px" : "14px" }}>📋</span>
          </div>
          <span style={{ 
            fontWeight: 700, 
            fontSize: isCompact ? "13px" : "14px",
            background: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            {t("docPage.chunks")}
          </span>
        </div>
        <span style={{ 
          fontSize: "11px", 
          fontWeight: 600,
          padding: "4px 10px",
          background: segments.length ? "rgba(99, 102, 241, 0.1)" : "rgba(107, 114, 128, 0.1)",
          border: segments.length ? "1px solid rgba(99, 102, 241, 0.2)" : "1px solid rgba(107, 114, 128, 0.2)",
          borderRadius: "6px",
          color: segments.length ? "#a5b4fc" : "rgba(255, 255, 255, 0.5)",
        }}>
          {segments.length ? `${filteredSegments.length}/${segments.length}` : "0"}
        </span>
      </div>

      {!segments.length ? (
        <div style={{ 
          padding: isCompact ? "18px 12px" : "24px 16px", 
          margin: "0 8px",
          background: "rgba(255, 255, 255, 0.02)",
          borderRadius: "12px",
          border: "1px solid rgba(255, 255, 255, 0.05)",
          textAlign: "center",
        }}>
          <div style={{
            width: "56px",
            height: "56px",
            margin: "0 auto 16px",
            background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)",
            borderRadius: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(99, 102, 241, 0.2)",
          }}>
            <span style={{ fontSize: "28px" }}>📄</span>
          </div>
          <p style={{ 
            fontSize: "14px", 
            fontWeight: 600, 
            color: "#eaeaea",
            margin: "0 0 8px 0",
          }}>
            {t("docPage.noChunksYet")}
          </p>
          <p style={{ 
            fontSize: "12px", 
            color: "rgba(255, 255, 255, 0.5)",
            margin: "0 0 16px 0",
            lineHeight: 1.5,
          }}>
            {t("workspace.empty.instructionPrefix")} <strong style={{ color: "#6366f1" }}>{t("action.listSegments")}</strong> {t("workspace.empty.instructionMiddle")}<br/>
            {t("common.or")} <strong style={{ color: "#8b5cf6" }}>{t("docPage.segmentNow")}</strong> {t("workspace.empty.instructionSuffix")}
          </p>
          <div style={{
            display: "flex",
            gap: "8px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}>
            <span style={{
              fontSize: "10px",
              padding: "4px 8px",
              background: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              borderRadius: "6px",
              color: "#6ee7b7",
            }}>
              {t("workspace.empty.tipQa")}
            </span>
            <span style={{
              fontSize: "10px",
              padding: "4px 8px",
              background: "rgba(245, 158, 11, 0.1)",
              border: "1px solid rgba(245, 158, 11, 0.2)",
              borderRadius: "6px",
              color: "#fcd34d",
            }}>
              {t("workspace.empty.tipParagraphs")}
            </span>
          </div>
        </div>
      ) : !filteredSegments.length ? (
        <div style={{ 
          padding: "20px 16px", 
          margin: "0 8px",
          background: "rgba(245, 158, 11, 0.05)",
          borderRadius: "12px",
          border: "1px solid rgba(245, 158, 11, 0.1)",
          textAlign: "center",
        }}>
          <span style={{ fontSize: "24px", marginBottom: "8px", display: "block" }}>🔍</span>
          <p style={{ fontSize: "13px", color: "#fcd34d", margin: 0 }}>
            {t("workspace.noResultsMatchFilters")}
          </p>
        </div>
      ) : (
        <div style={{ padding: "8px 6px", display: "grid", gap: 6 }}>
          {filteredSegments.map((s: any) => {
            const active = selectedSegId === s.id;
            return (
              <div
                key={s.id}
                onClick={() => onSelect(s)}
                onDoubleClick={() => onOpen(s)}
                title="Click to select. Double-click to open."
                draggable
                onDragStart={(e) => onDragStart(e, s)}
                onDragEnd={onDragEnd}
                className={`cursor-move transition-all duration-200 ${
                  draggedSegment?.id === s.id ? "opacity-50" : ""
                } ${dragOverFolder ? "ring-2 ring-primary/50" : ""}`}
                style={{
                  cursor: "pointer",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: active 
                    ? "1px solid rgba(99, 102, 241, 0.4)" 
                    : "1px solid rgba(255,255,255,0.08)",
                  background: active 
                    ? "rgba(99, 102, 241, 0.1)" 
                    : "rgba(255,255,255,0.02)",
                  userSelect: "none",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: active ? "#a5b4fc" : "#eaeaea" }}>
                    {(s.orderIndex ?? 0) + 1}.{" "}
                    {query.trim() ? (
                      highlightSearch(s.title ?? "", query).map((part, idx) => (
                        <span
                          key={idx}
                          style={
                            part.highlighted
                              ? {
                                  background: "rgba(99, 102, 241, 0.3)",
                                  color: "#a5b4fc",
                                  fontWeight: 700,
                                  padding: "2px 4px",
                                  borderRadius: 4,
                                }
                              : {}
                          }
                        >
                          {part.text}
                        </span>
                      ))
                    ) : (
                      s.title
                    )}
                    <span style={{ marginLeft: 8, fontSize: "var(--font-size-xs)", lineHeight: "var(--line-height-normal)", opacity: 0.7 }}>
                      {s.isManual ? "manual" : "auto"}
                    </span>
                    {/* P2: Segment Type Badge */}
                    {(s as any).segmentType && (s as any).segmentType !== "untyped" && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: "var(--font-size-xs)",
                          lineHeight: "var(--line-height-normal)",
                          padding: "2px 6px",
                          borderRadius: 4,
                          background: `${getSegmentTypeColor((s as any).segmentType)}20`,
                          border: `1px solid ${getSegmentTypeColor((s as any).segmentType)}60`,
                          color: getSegmentTypeColor((s as any).segmentType),
                          fontWeight: 500,
                        }}
                        title={`Segment Type: ${formatSegmentType((s as any).segmentType)}`}
                      >
                        {formatSegmentType((s as any).segmentType)}
                      </span>
                    )}
                    {/* P2: Evidence Grade Badge */}
                    {(s as any).evidenceGrade && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: "var(--font-size-xs)",
                          lineHeight: "var(--line-height-normal)",
                          padding: "2px 6px",
                          borderRadius: 4,
                          background: `${getEvidenceGradeColor((s as any).evidenceGrade)}20`,
                          border: `1px solid ${getEvidenceGradeColor((s as any).evidenceGrade)}60`,
                          color: getEvidenceGradeColor((s as any).evidenceGrade),
                          fontWeight: 600,
                          fontFamily: "monospace",
                        }}
                        title={`Evidence Grade: ${(s as any).evidenceGrade}`}
                      >
                        {(s as any).evidenceGrade}
                      </span>
                    )}
                    {folderMap[String(s.id)] ? (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: "var(--font-size-xs)",
                          lineHeight: "var(--line-height-normal)",
                          opacity: 0.7,
                          color: "#72ffbf",
                        }}
                      >
                        📁 {folders.find((f) => String(f.id) === String(folderMap[String(s.id)]))?.name ?? "?"}
                      </span>
                    ) : null}
                  </span>

                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: "var(--font-size-xs)", lineHeight: "var(--line-height-normal)", opacity: 0.7 }}>{s.mode}</span>

                    <select
                      key={`folder-select-${s.id}-${folders.map(f => f.id).sort().join(',')}`}
                      value={folderMap[String(s.id)] ?? "none"}
                      onChange={(e) => {
                        e.stopPropagation();
                        const folderId = e.target.value === "none" ? null : e.target.value;
                        onFolderChange(s, folderId);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      style={{
                        padding: "4px 8px",
                        borderRadius: 6,
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "#0f1420",
                        color: "#eaeaea",
                        fontSize: "var(--font-size-xs)",
                        lineHeight: "var(--line-height-normal)",
                      }}
                    >
                      <option value="none">No folder</option>
                      {folders.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(s);
                      }}
                      style={{ padding: "4px 10px" }}
                    >
                      Edit
                    </button>

                    {deletingSegId === s.id ? (
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <span style={{ fontSize: "var(--font-size-xs)", lineHeight: "var(--line-height-normal)", opacity: 0.7 }}>Delete?</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onConfirmDelete(s);
                          }}
                          style={{
                            padding: "3px 8px",
                            fontSize: "var(--font-size-xs)",
                            lineHeight: "var(--line-height-normal)",
                            background: "rgba(239, 68, 68, 0.2)",
                            border: "1px solid rgba(239, 68, 68, 0.4)",
                            color: "#ef4444",
                            borderRadius: 4,
                            cursor: "pointer",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(239, 68, 68, 0.3)";
                            e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.6)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
                            e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.4)";
                          }}
                        >
                          ✓
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCancelDelete();
                          }}
                          style={{
                            padding: "3px 8px",
                            fontSize: "var(--font-size-xs)",
                            lineHeight: "var(--line-height-normal)",
                            background: "rgba(255, 255, 255, 0.1)",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                            color: "#eaeaea",
                            borderRadius: 4,
                            cursor: "pointer",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
                            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(s);
                        }}
                        style={{
                          padding: "4px 10px",
                          fontSize: "var(--font-size-xs)",
                          lineHeight: "var(--line-height-normal)",
                          background: "rgba(239, 68, 68, 0.1)",
                          border: "1px solid rgba(239, 68, 68, 0.2)",
                          color: "#ef4444",
                          borderRadius: 6,
                          cursor: "pointer",
                          transition: "all 0.2s",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
                          e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.3)";
                          e.currentTarget.style.transform = "scale(1.05)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                          e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.2)";
                          e.currentTarget.style.transform = "scale(1)";
                        }}
                        title="Delete chunk"
                      >
                        🗑️ Delete
                      </button>
                    )}
                  </div>
                </div>
                {/* Chunk Preview - Optimized Typography */}
                <div style={{ 
                  fontSize: "13px", 
                  lineHeight: 1.6, 
                  color: "rgba(255, 255, 255, 0.7)", 
                  marginTop: 8,
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                  letterSpacing: "0.01em",
                }}>
                  {preview120(s.content)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

