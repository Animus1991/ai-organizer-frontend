/**
 * WorkspaceToolbar Component
 * 
 * Provides the main toolbar for workspace actions including:
 * - Mode selection (qa/paragraphs)
 * - Segment operations (list, segment, delete)
 * - Manual chunk creation
 * - Export functionality
 * - Document Notes and Smart Notes access
 * 
 * @module components/workspace/WorkspaceToolbar
 */

import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SegmentDTO, createManualSegment, type SegmentationMode } from "../../lib/api";
import { useLanguage } from "../../context/LanguageContext";
import { 
  exportSegmentsToJSON, 
  exportSegmentsToCSV, 
  exportSegmentsToTXT, 
  exportSegmentsToMD,
  downloadFile 
} from "../../lib/exportUtils";

// Type for imported segment data
interface ImportedSegment {
  title?: string;
  content: string;
  start?: number;
  end?: number;
  mode?: SegmentationMode;
  segmentType?: string;
  evidenceGrade?: string;
}

export interface WorkspaceToolbarProps {
  // Mode
  mode: SegmentationMode;
  onModeChange: (mode: SegmentationMode) => void;
  
  // Actions
  onListSegments: () => void;
  onSegmentNow: () => void;
  onDeleteModeSegments: () => void;
  onManualChunk: () => void;
  
  // Export/Import
  filteredSegments: SegmentDTO[];
  docId: number;
  onImportComplete?: () => void;
  
  // Notes
  notesOpen: boolean;
  onToggleNotes: () => void;
  smartNotesOpen: boolean;
  onToggleSmartNotes: () => void;
  smartNotesCount: number;
  onLoadSmartNotes: () => void;
  onCreateNewSmartNote: () => void;
  
  // Status
  canSegment: boolean;
  parseStatus?: string;
}

/**
 * WorkspaceToolbar - Main toolbar for workspace actions
 */
export default function WorkspaceToolbar({
  mode,
  onModeChange,
  onListSegments,
  onSegmentNow,
  onDeleteModeSegments,
  onManualChunk,
  filteredSegments,
  docId,
  onImportComplete,
  notesOpen,
  onToggleNotes,
  smartNotesOpen,
  onToggleSmartNotes,
  smartNotesCount,
  onLoadSmartNotes,
  onCreateNewSmartNote,
  canSegment,
  parseStatus,
}: WorkspaceToolbarProps) {
  const nav = useNavigate();
  const { t } = useLanguage();
  const importFileRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  
  const handleExportMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const menu = document.getElementById('export-segments-menu');
    if (menu) {
      menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }
  };

  const handleExport = (format: 'json' | 'csv' | 'txt' | 'md') => {
    const menu = document.getElementById('export-segments-menu');
    if (menu) menu.style.display = 'none';

    let content: string;
    let filename: string;
    let mimeType: string;

    switch (format) {
      case 'json':
        content = exportSegmentsToJSON(filteredSegments, { format: 'json', includeMetadata: true });
        filename = `segments_${docId}_${mode}_${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
        break;
      case 'csv':
        content = exportSegmentsToCSV(filteredSegments);
        filename = `segments_${docId}_${mode}_${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
        break;
      case 'txt':
        content = exportSegmentsToTXT(filteredSegments, { format: 'txt', includeMetadata: true });
        filename = `segments_${docId}_${mode}_${new Date().toISOString().split('T')[0]}.txt`;
        mimeType = 'text/plain';
        break;
      case 'md':
        content = exportSegmentsToMD(filteredSegments, { format: 'md', includeMetadata: true });
        filename = `segments_${docId}_${mode}_${new Date().toISOString().split('T')[0]}.md`;
        mimeType = 'text/markdown';
        break;
    }

    downloadFile(content, filename, mimeType);
  };

  const handleSmartNotesToggle = () => {
    if (!smartNotesOpen) {
      onLoadSmartNotes();
      onCreateNewSmartNote();
    }
    onToggleSmartNotes();
  };

  // Import handler for JSON/CSV files
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError(null);

    try {
      const text = await file.text();
      let segments: ImportedSegment[] = [];

      if (file.name.endsWith('.json')) {
        const data = JSON.parse(text);
        // Handle both array and object with segments array
        segments = Array.isArray(data) ? data : (data.segments || data.data || []);
      } else if (file.name.endsWith('.csv')) {
        // Parse CSV
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',');
          const seg: ImportedSegment = { content: '' };
          
          headers.forEach((header, idx) => {
            const value = values[idx]?.trim()?.replace(/^"|"$/g, '') || '';
            if (header === 'title') seg.title = value;
            else if (header === 'content' || header === 'text') seg.content = value;
            else if (header === 'start') seg.start = parseInt(value) || undefined;
            else if (header === 'end') seg.end = parseInt(value) || undefined;
            else if (header === 'mode') seg.mode = value as SegmentationMode;
            else if (header === 'segmenttype' || header === 'type') seg.segmentType = value;
            else if (header === 'evidencegrade' || header === 'grade') seg.evidenceGrade = value;
          });
          
          if (seg.content) segments.push(seg);
        }
      }

      if (segments.length === 0) {
        throw new Error(t("workspace.import.noValidSegments"));
      }

      // Create manual segments for each imported item
      let successCount = 0;
      for (const seg of segments) {
        if (!seg.content) continue;
        
        try {
          await createManualSegment(docId, {
            title: seg.title || `Imported ${successCount + 1}`,
            content: seg.content,
            start: seg.start ?? 0,
            end: seg.end ?? seg.content.length,
            mode: seg.mode || mode,
            segmentType: seg.segmentType,
            evidenceGrade: seg.evidenceGrade,
          });
          successCount++;
        } catch (err) {
          console.warn(`Failed to import segment: ${seg.title || 'untitled'}`, err);
        }
      }

      if (successCount > 0) {
        onImportComplete?.();
        setImportError(null);
        alert(t("workspace.import.success", { count: successCount }));
      } else {
        throw new Error(t("workspace.import.failedAny"));
      }
    } catch (err: any) {
      setImportError(err.message || t("workspace.import.failed"));
      console.error('Import error:', err);
    } finally {
      setIsImporting(false);
      // Reset file input
      if (importFileRef.current) {
        importFileRef.current.value = '';
      }
    }
  };

  return (
    <div style={{ marginTop: 8, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
      {/* Mode Selector - Compact */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, position: "relative", top: -2 }}>
        <label style={{ 
          fontSize: "13px", 
          color: "rgba(255, 255, 255, 0.6)", 
          fontWeight: 500 
        }}>
          {t("docPage.mode")}:
        </label>
        <select
          value={mode}
          onChange={(e) => onModeChange(e.target.value as SegmentationMode)}
          style={{
            padding: "6px 10px",
            background: "rgba(0, 0, 0, 0.3)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "6px",
            color: "#eaeaea",
            fontSize: "13px",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.5)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
          }}
        >
          <option value="qa">{t("segmentation.mode.qa")}</option>
          <option value="paragraphs">{t("segmentation.mode.paragraphs")}</option>
          <option value="keywords">{t("segmentation.mode.keywords")}</option>
          <option value="sections">{t("segmentation.mode.sections")}</option>
          <option value="semantic">{t("segmentation.mode.semantic")}</option>
          <option value="topics">{t("segmentation.mode.topics")}</option>
          <option value="questions">{t("segmentation.mode.questions")}</option>
          <option value="arguments">{t("segmentation.mode.arguments")}</option>
          <option value="concepts">{t("segmentation.mode.concepts")}</option>
          <option value="hybrid">{t("segmentation.mode.hybrid")}</option>
          <option value="temporal">{t("segmentation.mode.temporal")}</option>
          <option value="sentiment">{t("segmentation.mode.sentiment")}</option>
          <option value="dialogue">{t("segmentation.mode.dialogue")}</option>
          <option value="texttiling">{t("segmentation.mode.texttiling")}</option>
          <option value="c99">{t("segmentation.mode.c99")}</option>
          <option value="changepoint">{t("segmentation.mode.changepoint")}</option>
          <option value="graph">{t("segmentation.mode.graph")}</option>
          <option value="layout">{t("segmentation.mode.layout")}</option>
        </select>
      </div>

      {/* Compact Button Style - 12px font, 6px 10px padding */}
      <button
        onClick={onListSegments}
        disabled={!canSegment}
        style={{
          padding: "6px 10px",
          background: canSegment ? "rgba(255, 255, 255, 0.05)" : "rgba(107, 114, 128, 0.3)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "6px",
          color: "#eaeaea",
          fontWeight: 500,
          fontSize: "13px",
          cursor: canSegment ? "pointer" : "not-allowed",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          transition: "all 0.15s ease",
          opacity: canSegment ? 1 : 0.5,
        }}
        title={
          !canSegment
            ? t("home.segmentation.tooltip.cannotListSegments", {
                parseStatus: parseStatus ?? "unknown",
                pendingHint: "",
              })
            : t("home.segmentation.tooltip.listSegments")
        }
        onMouseEnter={(e) => {
          if (canSegment) {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = canSegment ? "rgba(255, 255, 255, 0.05)" : "rgba(107, 114, 128, 0.3)";
        }}
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "14px", height: "14px" }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        {t("docPage.list")}
      </button>

      {/* Segment Now - Primary Action */}
      <button
        onClick={onSegmentNow}
        disabled={!canSegment}
        style={{
          padding: "6px 10px",
          background: canSegment ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" : "rgba(107, 114, 128, 0.3)",
          border: "none",
          borderRadius: "6px",
          color: "white",
          fontWeight: 500,
          fontSize: "13px",
          cursor: canSegment ? "pointer" : "not-allowed",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          transition: "all 0.15s ease",
          opacity: canSegment ? 1 : 0.5,
        }}
        title={
          !canSegment
            ? t("home.segmentation.tooltip.cannotSegment", {
                parseStatus: parseStatus ?? "unknown",
                pendingHint: "",
              })
            : t("home.segmentation.tooltip.segmentDocument")
        }
        onMouseEnter={(e) => {
          if (canSegment) {
            e.currentTarget.style.opacity = "0.9";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = canSegment ? "1" : "0.5";
        }}
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "14px", height: "14px" }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        {t("action.segment")}
      </button>

      {/* Delete Mode Segments - Compact */}
      <button
        onClick={onDeleteModeSegments}
        style={{
          padding: "6px 10px",
          background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
          border: "none",
          borderRadius: "6px",
          color: "white",
          fontWeight: 500,
          fontSize: "13px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          transition: "all 0.15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = "0.9";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = "1";
        }}
        title={t("workspace.deleteModeTitle")}
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "14px", height: "14px" }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        {t("action.delete")}
      </button>

      {/* Manual Chunk - Compact */}
      <button
        onClick={onManualChunk}
        style={{ 
          padding: "6px 10px",
          background: "rgba(255, 255, 255, 0.05)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "6px",
          color: "#eaeaea",
          fontWeight: 500,
          fontSize: "13px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          transition: "all 0.15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
        }}
        title={t("workspace.manualChunkTitle")}
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "14px", height: "14px" }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        {t("docPage.addChunk")}
      </button>

      {/* Export - Compact */}
      <div style={{ position: "relative" }}>
        <button
          onClick={handleExportMenuToggle}
          disabled={filteredSegments.length === 0}
          style={{ 
            padding: "6px 10px",
            background: filteredSegments.length > 0 
              ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" 
              : "rgba(107, 114, 128, 0.3)",
            border: "none",
            borderRadius: "6px",
            color: "white",
            fontWeight: 500,
            fontSize: "13px",
            cursor: filteredSegments.length === 0 ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            transition: "all 0.15s ease",
            opacity: filteredSegments.length === 0 ? 0.5 : 1,
          }}
          onMouseEnter={(e) => {
            if (filteredSegments.length > 0) {
              e.currentTarget.style.opacity = "0.9";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = filteredSegments.length === 0 ? "0.5" : "1";
          }}
          title={t("workspace.exportWithCount", { count: filteredSegments.length })}
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "14px", height: "14px" }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {t("action.export")}
        </button>
        <div
          id="export-segments-menu"
          style={{
            display: "none",
            position: "absolute",
            top: "100%",
            left: 0,
            marginTop: "8px",
            background: "rgba(20, 20, 30, 0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "12px",
            padding: "8px",
            minWidth: "180px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
            zIndex: 1000,
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.display = "none";
          }}
        >
          <button
            onClick={() => handleExport('json')}
            style={{
              width: "100%",
              padding: "10px 16px",
              background: "transparent",
              border: "none",
              borderRadius: "8px",
              color: "#eaeaea",
              fontSize: "var(--font-size-base)",
              lineHeight: "var(--line-height-normal)",
              textAlign: "left",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            {t("action.exportJson")}
          </button>
          <button
            onClick={() => handleExport('csv')}
            style={{
              width: "100%",
              padding: "10px 16px",
              background: "transparent",
              border: "none",
              borderRadius: "8px",
              color: "#eaeaea",
              fontSize: "var(--font-size-base)",
              lineHeight: "var(--line-height-normal)",
              textAlign: "left",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            {t("action.exportCsv")}
          </button>
          <button
            onClick={() => handleExport('txt')}
            style={{
              width: "100%",
              padding: "10px 16px",
              background: "transparent",
              border: "none",
              borderRadius: "8px",
              color: "#eaeaea",
              fontSize: "var(--font-size-base)",
              lineHeight: "var(--line-height-normal)",
              textAlign: "left",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            {t("action.exportTxt")}
          </button>
          <button
            onClick={() => handleExport('md')}
            style={{
              width: "100%",
              padding: "10px 16px",
              background: "transparent",
              border: "none",
              borderRadius: "8px",
              color: "#eaeaea",
              fontSize: "var(--font-size-base)",
              lineHeight: "var(--line-height-normal)",
              textAlign: "left",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            {t("action.exportMd")}
          </button>
        </div>
      </div>

      {/* Import Button */}
      <div style={{ position: "relative" }}>
        <input
          ref={importFileRef}
          type="file"
          accept=".json,.csv"
          onChange={handleImport}
          data-import-segments="true"
          style={{ display: "none" }}
        />
        <button
          onClick={() => importFileRef.current?.click()}
          disabled={isImporting}
          style={{
            padding: "6px 10px",
            background: isImporting ? "rgba(107, 114, 128, 0.3)" : "rgba(16, 185, 129, 0.15)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            borderRadius: "6px",
            color: isImporting ? "#9ca3af" : "#6ee7b7",
            fontWeight: 500,
            fontSize: "13px",
            cursor: isImporting ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            if (!isImporting) {
              e.currentTarget.style.background = "rgba(16, 185, 129, 0.25)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = isImporting ? "rgba(107, 114, 128, 0.3)" : "rgba(16, 185, 129, 0.15)";
          }}
          title={t("workspace.importSegmentsTitle")}
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "14px", height: "14px" }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          {isImporting ? t("status.importing") : t("workspace.importSegments")}
        </button>
        {importError && (
          <div style={{
            position: "absolute",
            top: "100%",
            left: 0,
            marginTop: "4px",
            padding: "8px 12px",
            background: "rgba(239, 68, 68, 0.2)",
            border: "1px solid rgba(239, 68, 68, 0.4)",
            borderRadius: "8px",
            color: "#ef4444",
            fontSize: "12px",
            whiteSpace: "nowrap",
            zIndex: 1000,
          }}>
            {importError}
          </div>
        )}
      </div>

      {/* Dashboard - Compact */}
      <button
        onClick={() => nav(`/documents/${docId}/dashboard`)}
        style={{
          padding: "6px 10px",
          background: "rgba(16, 185, 129, 0.15)",
          border: "1px solid rgba(16, 185, 129, 0.3)",
          borderRadius: "6px",
          color: "#6ee7b7",
          fontWeight: 500,
          fontSize: "13px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          transition: "all 0.15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(16, 185, 129, 0.25)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(16, 185, 129, 0.15)";
        }}
        title={t("workspace.statsTitle")}
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "14px", height: "14px" }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        {t("workspace.stats")}
      </button>

      {/* Graph - Compact */}
      <button
        onClick={() => nav(`/documents/${docId}/graph`)}
        style={{
          padding: "6px 10px",
          background: "rgba(6, 182, 212, 0.15)",
          border: "1px solid rgba(6, 182, 212, 0.3)",
          borderRadius: "6px",
          color: "#67e8f9",
          fontWeight: 500,
          fontSize: "13px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          transition: "all 0.15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(6, 182, 212, 0.25)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(6, 182, 212, 0.15)";
        }}
        title={t("workspace.graphTitle")}
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "14px", height: "14px" }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        {t("workspace.graph")}
      </button>

      {/* Notes - Compact */}
      <button 
        onClick={onToggleNotes} 
        style={{ 
          padding: "6px 10px",
          background: notesOpen 
            ? "rgba(245, 158, 11, 0.15)" 
            : "rgba(255, 255, 255, 0.05)",
          border: notesOpen 
            ? "1px solid rgba(245, 158, 11, 0.3)" 
            : "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "6px",
          color: notesOpen ? "#fcd34d" : "#eaeaea",
          fontWeight: 500,
          fontSize: "13px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          transition: "all 0.15s ease",
        }}
        onMouseEnter={(e) => {
          if (!notesOpen) {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
          }
          e.currentTarget.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          if (!notesOpen) {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
          }
          e.currentTarget.style.transform = "translateY(0)";
        }}
        title={t("workspace.notesTitle")}
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "16px", height: "16px" }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        {notesOpen ? t("workspace.hideNotes") : t("workspace.notes")}
      </button>
      
      {/* Smart Notes - Compact */}
      <button 
        onClick={handleSmartNotesToggle} 
        style={{ 
          padding: "6px 10px",
          background: smartNotesOpen 
            ? "rgba(139, 92, 246, 0.15)" 
            : "rgba(255, 255, 255, 0.05)",
          border: smartNotesOpen 
            ? "1px solid rgba(139, 92, 246, 0.3)" 
            : "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "6px",
          color: smartNotesOpen ? "#c4b5fd" : "#eaeaea",
          fontWeight: 500,
          fontSize: "13px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          transition: "all 0.15s ease",
        }}
        onMouseEnter={(e) => {
          if (!smartNotesOpen) {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
          }
        }}
        onMouseLeave={(e) => {
          if (!smartNotesOpen) {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
          }
        }}
        title={t("workspace.smartNotesTitle")}
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "14px", height: "14px" }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        {t("workspace.smartNotes")}
        {smartNotesCount > 0 && (
          <span style={{
            fontSize: "9px",
            padding: "1px 4px",
            background: "rgba(139, 92, 246, 0.3)",
            borderRadius: "6px",
            color: "#c4b5fd",
            fontWeight: 600,
          }}>
            {smartNotesCount}
          </span>
        )}
      </button>
    </div>
  );
}

