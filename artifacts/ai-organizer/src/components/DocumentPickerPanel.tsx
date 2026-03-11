import { useEffect } from "react";
import { useFileUpload } from "../hooks/useFileUpload";
import { useIsMobile } from "../hooks/use-mobile";
import { useLoading } from "../hooks/useLoading";
import { useHomeState } from "../hooks/home";
import { useHomeOperations } from "../hooks/home/useHomeOperations";
import { validateFile } from "../lib/validation";
import { formatBytes } from "../lib/utils";
import { useLanguage } from "../context/LanguageContext";
import { Upload, RefreshCw, Trash2, FileText, Plus, X } from "lucide-react";
import type { SegmentRow } from "../hooks/home/useHomeState";

const ALLOWED_TYPES = [
  ".docx",
  ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
];

const SEGMENT_MODES = [
  "qa", "paragraphs", "keywords", "sections", "semantic", "topics",
  "questions", "arguments", "concepts", "hybrid", "temporal", "sentiment",
  "dialogue", "texttiling", "c99", "changepoint", "graph", "layout",
] as const;

type DocumentPickerPanelProps = {
  onSegmentsChange?: (segments: SegmentRow[]) => void;
  onUploadsChange?: (count: number) => void;
};

const selectClass = "w-full px-3 py-2 text-sm rounded-lg border border-border bg-muted/30 text-foreground outline-none transition-all focus:ring-2 focus:ring-primary/30 focus:border-primary appearance-none cursor-pointer";
const btnClass = "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-muted/50 text-foreground hover:bg-accent transition-colors disabled:opacity-40 disabled:pointer-events-none";
const btnDangerClass = "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40 disabled:pointer-events-none";
const labelClass = "block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2";
const textareaClass = "w-full px-3 py-2 text-sm rounded-lg border border-border bg-muted/30 text-foreground outline-none resize-y transition-all focus:ring-2 focus:ring-primary/30 focus:border-primary font-inherit";

export function DocumentPickerPanel({ onSegmentsChange, onUploadsChange }: DocumentPickerPanelProps) {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const { uploading, progress, upload, reset, error: uploadError } = useFileUpload();
  const { execute: executeFetch } = useLoading();
  const { loading: uploadsLoading } = useLoading();
  const { loading: deleteLoading } = useLoading();
  const state = useHomeState();

  const setLoading = (_key: string, _loading: boolean) => {};

  const ops = useHomeOperations(state, setLoading, upload, reset, uploadError, executeFetch);

  useEffect(() => {
    ops.fetchUploads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (state.documentId) {
      ops.loadSegmentationSummary(state.documentId);
    }
  }, [ops, state.documentId]);

  useEffect(() => {
    onSegmentsChange?.(state.segments);
  }, [onSegmentsChange, state.segments]);

  useEffect(() => {
    onUploadsChange?.(state.uploads.length);
  }, [onUploadsChange, state.uploads.length]);

  return (
    <div className="space-y-5 p-1">
      {/* ── Document Selection ── */}
      <div>
        <label className={labelClass}>{t("docPicker.pickExisting")}</label>
        <select
          className={selectClass}
          value={state.documentId ?? ""}
          onChange={(e) => {
            const value = e.target.value;
            const newDocId = value ? Number(value) : null;
            state.setDocumentId(newDocId);
            state.setSegments([]);
            state.setOpenSeg(null);
            state.setQuery("");
            state.setModeFilter("all");
          }}
        >
          <option value="">{t("docPicker.selectPlaceholder")}</option>
          {state.uploads.map((u) => (
            <option key={u.documentId} value={u.documentId}>
              {u.filename} (docId: {u.documentId})
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2 mt-2">
          <button className={btnClass} onClick={ops.fetchUploads} disabled={uploadsLoading} title={t("docPicker.refreshList")}>
            <RefreshCw className="w-3 h-3" /> {!isMobile && t("docPicker.refreshList")}
          </button>
          <button className={btnDangerClass} onClick={ops.deleteSelectedUpload} disabled={!state.documentId || deleteLoading} title={t("docPicker.deleteSelected")}>
            <Trash2 className="w-3 h-3" /> {!isMobile && t("docPicker.deleteSelected")}
          </button>
        </div>
      </div>

      {/* Document meta */}
      {state.selectedUpload && (
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/30 border border-border text-xs text-muted-foreground">
          <FileText className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{t("docPicker.parseStatus", { status: state.selectedUpload.parseStatus })}</span>
          <span className="text-border">·</span>
          <span>{t("docPicker.fileSize", { size: formatBytes(state.selectedUpload.sizeBytes) })}</span>
        </div>
      )}
      {state.status && (
        <div className="px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 text-xs text-primary font-medium">
          {state.status}
        </div>
      )}

      {/* ── Upload ── */}
      <div>
        <label className={labelClass}>{t("upload.title")}</label>
        <label className="flex flex-col items-center gap-2 px-4 py-5 rounded-xl border-2 border-dashed border-border hover:border-primary/40 bg-muted/20 hover:bg-primary/5 transition-all cursor-pointer group">
          <Upload className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
            {state.file ? state.file.name : t("docPicker.dropOrClick") || "Click to select .docx file"}
          </span>
          <input
            type="file"
            accept=".docx,.doc"
            className="hidden"
            onChange={(e) => {
              const selectedFile = e.target.files?.[0] ?? null;
              state.setFile(selectedFile);
              state.setFileError(null);
              if (selectedFile) {
                const error = validateFile(selectedFile, { maxSizeMB: 50, allowedTypes: ALLOWED_TYPES });
                if (error) state.setFileError(error);
              }
            }}
          />
        </label>
        {state.fileError && (
          <div className="mt-2 px-3 py-1.5 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
            {state.fileError}
          </div>
        )}
        {state.file && !state.fileError && (
          <div className="mt-2 text-xs text-muted-foreground">
            {t("docPicker.selectedFile", { name: state.file.name, size: (state.file.size / 1024 / 1024).toFixed(2) })}
          </div>
        )}
        {uploading && progress && (
          <div className="mt-2">
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress.percentage}%` }} />
            </div>
            <span className="text-xs text-muted-foreground mt-1">{t("docPicker.uploading", { pct: String(progress.percentage) })}</span>
          </div>
        )}
        {uploadError && (
          <div className="mt-2 px-3 py-1.5 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
            {uploadError}
          </div>
        )}
        <div className="mt-2">
          <button className={btnClass} onClick={ops.doUpload} disabled={!state.file || !!state.fileError || uploading}>
            <Upload className="w-3 h-3" /> {t("docPicker.uploadBtn")}
          </button>
        </div>
      </div>

      {/* ── Segmentation Mode ── */}
      <div>
        <label className={labelClass}>{t("docPicker.segmentationMode")}</label>
        <select
          className={selectClass}
          value={state.mode}
          onChange={(e) => state.setMode(e.target.value as (typeof SEGMENT_MODES)[number])}
        >
          {SEGMENT_MODES.map((mode) => (
            <option key={mode} value={mode}>{mode}</option>
          ))}
        </select>
      </div>

      {/* ── Keywords Input ── */}
      {state.mode === "keywords" && (
        <div className="space-y-2">
          <label className={labelClass}>{t("docPicker.keywordsLabel")}</label>
          <textarea
            className={textareaClass}
            value={state.keywordInput}
            onChange={(e) => state.setKeywordInput(e.target.value)}
            placeholder={t("docPicker.keywordsPlaceholder")}
            rows={2}
          />
          <div className="flex gap-2">
            <button className={btnClass} onClick={() => {
              const input = state.keywordInput.trim();
              if (!input) return;
              const newKeywords = input.split(/[,\n]/).map((k) => k.trim()).filter((k) => k.length > 0);
              state.setKeywords([...state.keywords, ...newKeywords]);
              state.setKeywordInput("");
            }}>
              <Plus className="w-3 h-3" /> {t("docPicker.addBtn")}
            </button>
            <button className={btnDangerClass} onClick={() => state.setKeywords([])}>
              <X className="w-3 h-3" /> {t("docPicker.clearBtn")}
            </button>
          </div>
          {state.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {state.keywords.map((kw, idx) => (
                <span key={`${kw}-${idx}`} className="inline-flex px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary border border-primary/20">
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Concepts Input ── */}
      {state.mode === "concepts" && (
        <div className="space-y-2">
          <label className={labelClass}>{t("docPicker.conceptsLabel")}</label>
          <textarea
            className={textareaClass}
            value={state.conceptInput}
            onChange={(e) => state.setConceptInput(e.target.value)}
            placeholder={t("docPicker.conceptsPlaceholder")}
            rows={2}
          />
          <div className="flex gap-2">
            <button className={btnClass} onClick={() => {
              const input = state.conceptInput.trim();
              if (!input) return;
              const newConcepts = input.split(/[,\n]/).map((k) => k.trim()).filter((k) => k.length > 0);
              state.setConcepts([...state.concepts, ...newConcepts]);
              state.setConceptInput("");
            }}>
              <Plus className="w-3 h-3" /> {t("docPicker.addBtn")}
            </button>
            <button className={btnDangerClass} onClick={() => state.setConcepts([])}>
              <X className="w-3 h-3" /> {t("docPicker.clearBtn")}
            </button>
          </div>
          {state.concepts.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {state.concepts.map((kw, idx) => (
                <span key={`${kw}-${idx}`} className="inline-flex px-2 py-0.5 text-xs rounded-full bg-accent/40 text-accent-foreground border border-accent/30">
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Segment & Load Actions ── */}
      <div className="flex items-center gap-2">
        <button className={btnClass} onClick={ops.segmentDoc} disabled={!state.documentId || !state.canSegment || state.isSegmenting}>
          {t("docPicker.segmentBtn")}
        </button>
        <button className={btnClass} onClick={ops.loadSegments} disabled={!state.documentId || !state.canSegment}>
          {t("docPicker.listSegments")}
        </button>
      </div>
      <div className="text-xs text-muted-foreground">
        {state.segments.length
          ? t("docPicker.segmentsLoaded", { count: String(state.segments.length) })
          : t("docPicker.noSegmentsYet")}
      </div>
    </div>
  );
}
