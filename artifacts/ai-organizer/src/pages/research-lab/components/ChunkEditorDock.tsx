/**
 * ChunkEditorDock - Professional tab bar + editor + controls
 */

import { useLanguage } from "../../../context/LanguageContext";
import { RichTextEditor } from "../../../editor/RichTextEditor";
import { Save, SaveAll, Download, GitCompare, ChevronDown, ChevronUp, FileEdit } from "lucide-react";
import type { ChunkTab } from "../types";
import { DiffView } from "./DiffView";

interface Props {
  chunkTabs: ChunkTab[];
  activeChunkTabKey: string | null;
  activeChunkTab: ChunkTab | null;
  activeTabWordCount: number;
  editorCollapsed: boolean;
  showDiffView: boolean;
  autoSaveStatus: "saving" | "saved" | null;
  onSelectTab: (key: string) => void;
  onCloseTab: (key: string) => void;
  onHtmlChange: (key: string, html: string) => void;
  onSave: () => void;
  onSaveAll: () => void;
  onLoad: () => void;
  onToggleDiff: () => void;
  onToggleCollapse: () => void;
}

export function ChunkEditorDock({
  chunkTabs, activeChunkTabKey, activeChunkTab, activeTabWordCount,
  editorCollapsed, showDiffView, autoSaveStatus,
  onSelectTab, onCloseTab, onHtmlChange,
  onSave, onSaveAll, onLoad, onToggleDiff, onToggleCollapse,
}: Props) {
  const { t } = useLanguage();

  return (
    <>
      {/* Tab bar */}
      <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-border flex-shrink-0 bg-card/50">
        <div className="flex items-center gap-2 flex-1 min-w-0 overflow-x-auto scrollbar-none">
          {chunkTabs.length === 0 && (
            <span className="flex items-center gap-2 text-xs text-muted-foreground opacity-60 whitespace-nowrap">
              <FileEdit className="w-3.5 h-3.5" />
              {t("researchLab.chunkDockHint") || "Select a segment from Documents to start editing"}
            </span>
          )}
          {chunkTabs.map(tab => {
            const active = tab.key === activeChunkTabKey;
            const dirty = tab.lastSavedHtml !== undefined && tab.html !== tab.lastSavedHtml;
            return (
              <button
                key={tab.key}
                onClick={() => onSelectTab(tab.key)}
                onAuxClick={(e) => { if (e.button === 1) { e.preventDefault(); onCloseTab(tab.key); } }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs whitespace-nowrap max-w-[260px] transition-all ${
                  active
                    ? "border-primary/40 bg-primary/10 text-foreground font-medium shadow-sm"
                    : "border-border bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
                title={tab.title}
              >
                {dirty && <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" title="Unsaved changes" />}
                <span className="overflow-hidden text-ellipsis">{tab.title}</span>
                <span
                  onClick={(e) => { e.stopPropagation(); onCloseTab(tab.key); }}
                  className="inline-flex w-4 h-4 items-center justify-center rounded text-[10px] hover:bg-destructive/20 hover:text-destructive transition-colors flex-shrink-0"
                >×</span>
              </button>
            );
          })}
        </div>

        {chunkTabs.length > 0 && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {!editorCollapsed && (
              <span className="text-[11px] text-muted-foreground mr-1 flex items-center gap-1.5">
                {activeTabWordCount > 0 && <span>{activeTabWordCount} {activeTabWordCount === 1 ? t("editor.word") || "word" : t("editor.words") || "words"}</span>}
                {autoSaveStatus === "saving" && <span className="text-amber-500 animate-pulse">⏳</span>}
                {autoSaveStatus === "saved" && <span className="text-primary">✓</span>}
              </span>
            )}
            <button className="lab-editor-btn" onClick={onSave} title={t("action.save") || "Save"}>
              <Save className="w-3 h-3" />
            </button>
            {chunkTabs.length > 1 && (
              <button className="lab-editor-btn" data-variant="save-all" onClick={onSaveAll} title={t("action.saveAll") || "Save All"}>
                <SaveAll className="w-3 h-3" />
              </button>
            )}
            <button className="lab-editor-btn" onClick={onLoad} title={t("action.load") || "Load"}>
              <Download className="w-3 h-3" />
            </button>
            <button className="lab-editor-btn" data-variant={showDiffView ? "diff-active" : undefined} onClick={onToggleDiff} title={showDiffView ? "Hide diff view" : "Show changes since last save"}>
              <GitCompare className="w-3 h-3" />
            </button>
            <button className="lab-editor-btn" onClick={onToggleCollapse} title={editorCollapsed ? "Expand editor" : "Collapse editor"}>
              {editorCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
            </button>
          </div>
        )}
      </div>

      {/* Editor + Diff */}
      {!editorCollapsed && chunkTabs.length > 0 && (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className={`flex-1 min-h-0 overflow-y-scroll overflow-x-hidden p-2.5 ${showDiffView ? "max-h-[50%]" : ""}`}>
            {activeChunkTab ? (
              <RichTextEditor
                valueHtml={activeChunkTab.html}
                onChange={({ html }) => onHtmlChange(activeChunkTab.key, html)}
                placeholder="Edit chunk…"
                onSaveLocal={onSave}
                onLoadLocal={onLoad}
              />
            ) : (
              <div className="p-3.5 text-muted-foreground text-xs">
                {t("researchLab.noChunkSelected") || "No chunk selected"}
              </div>
            )}
          </div>
          {showDiffView && activeChunkTab && (
            <DiffView currentHtml={activeChunkTab.html} savedHtml={activeChunkTab.lastSavedHtml || ""} />
          )}
        </div>
      )}
    </>
  );
}
