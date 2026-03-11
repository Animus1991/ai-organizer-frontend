import React, { lazy, useCallback, useEffect, useRef, useState } from "react";
import type { SmartNote } from "../../lib/documentWorkspace/smartNotes";
import { useLanguage } from "../../context/LanguageContext";

// Lazy load the heavy TipTap editor (only load when modal is opened)
const RichTextEditor = lazy(() => import("../../editor/RichTextEditor").then(module => ({ default: module.RichTextEditor })));

export interface SmartNotesModalProps {
  open: boolean;
  onClose: () => void;
  docId: number;
  onRefresh?: () => Promise<void>;
  smartNotes: SmartNote[];
  currentSmartNote: SmartNote | null;
  smartNoteHtml: string;
  smartNoteText: string;
  smartNoteTags: string[];
  smartNoteCategory: string;
  smartNotePriority: 'low' | 'medium' | 'high';
  smartNoteDirty: boolean;
  smartNoteStatus: string;
  smartNoteSearchQuery: string;
  smartNoteSelectedCategory: string;
  smartNoteSelectedTag: string;
  smartNoteSelectedPriority: string;
  smartNoteSortBy: 'date-desc' | 'date-asc' | 'category' | 'priority' | 'title';
  newTagInput: string;
  onHtmlChange: (html: string) => void;
  onTextChange: (text: string) => void;
  onTagsChange: (tags: string[]) => void;
  onCategoryChange: (category: string) => void;
  onPriorityChange: (priority: 'low' | 'medium' | 'high') => void;
  onDirtyChange: (dirty: boolean) => void;
  onStatusChange: (status: string) => void;
  onSearchQueryChange: (query: string) => void;
  onSelectedCategoryChange: (category: string) => void;
  onSelectedTagChange: (tag: string) => void;
  onSelectedPriorityChange: (priority: string) => void;
  onSortByChange: (sortBy: 'date-desc' | 'date-asc' | 'category' | 'priority' | 'title') => void;
  onNewTagInputChange: (input: string) => void;
  onCreateNew: () => void;
  onSave: () => void;
  onDelete: (noteId: string) => void;
  onLoadNote: (note: SmartNote) => void;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  filteredSmartNotes: SmartNote[];
  allCategories: string[];
  allTags: string[];
}

// Helper to get priority color
function getPriorityColor(priority?: string): string {
  switch (priority) {
    case 'high': return 'rgba(239, 68, 68, 0.2)';
    case 'medium': return 'rgba(234, 179, 8, 0.2)';
    case 'low': return 'rgba(34, 197, 94, 0.2)';
    default: return 'rgba(255, 255, 255, 0.05)';
  }
}

function getPriorityBorder(priority?: string): string {
  switch (priority) {
    case 'high': return 'rgba(239, 68, 68, 0.4)';
    case 'medium': return 'rgba(234, 179, 8, 0.4)';
    case 'low': return 'rgba(34, 197, 94, 0.4)';
    default: return 'rgba(255, 255, 255, 0.1)';
  }
}

function getPriorityIcon(priority?: string): string {
  switch (priority) {
    case 'high': return '🔴';
    case 'medium': return '🟡';
    case 'low': return '🟢';
    default: return '⚪';
  }
}

// Helper to format date
function formatDate(
  dateString: string,
  t: (key: string, params?: Record<string, string | number>) => string,
  language: string
): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return t("smartNotes.time.justNow");
  if (diffMins < 60) return t("smartNotes.time.minutesAgo", { count: diffMins });
  if (diffHours < 24) return t("smartNotes.time.hoursAgo", { count: diffHours });
  if (diffDays < 7) return t("smartNotes.time.daysAgo", { count: diffDays });
  const locale = language === "en" ? "en-US" : language === "el" ? "el-GR" : language;
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  }).format(date);
}

export function SmartNotesModal({
  open,
  onClose,
  onRefresh,
  smartNotes,
  currentSmartNote,
  smartNoteHtml,
  smartNoteText,
  smartNoteTags,
  smartNoteCategory,
  smartNotePriority,
  smartNoteDirty,
  smartNoteStatus,
  smartNoteSearchQuery,
  smartNoteSelectedCategory,
  smartNoteSelectedTag,
  smartNoteSelectedPriority,
  smartNoteSortBy,
  newTagInput,
  onHtmlChange,
  onTextChange,
  onCategoryChange,
  onPriorityChange,
  onDirtyChange,
  onSearchQueryChange,
  onSelectedCategoryChange,
  onSelectedTagChange,
  onSelectedPriorityChange,
  onSortByChange,
  onNewTagInputChange,
  onCreateNew,
  onSave,
  onDelete,
  onLoadNote,
  onAddTag,
  onRemoveTag,
  filteredSmartNotes,
  allCategories,
  allTags,
}: SmartNotesModalProps) {
  const { t, language } = useLanguage();
  const hasUnsavedChanges = smartNoteDirty;

  const [fullscreen, setFullscreen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const didAutoRefreshRef = useRef(false);

  const confirmLoseChanges = useCallback(() => {
    if (!hasUnsavedChanges) return true;
    return window.confirm(t("smartNotes.confirmDiscard"));
  }, [hasUnsavedChanges, t]);

  const handleRequestClose = useCallback(() => {
    if (!confirmLoseChanges()) return;
    onClose();
  }, [confirmLoseChanges, onClose]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        if (smartNoteText.trim() && hasUnsavedChanges) {
          onSave();
        }
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        handleRequestClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleRequestClose, open, onSave, smartNoteText, hasUnsavedChanges]);

  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;
    try {
      setRefreshing(true);
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  useEffect(() => {
    if (!open) {
      didAutoRefreshRef.current = false;
      return;
    }
    if (!onRefresh) return;
    if (didAutoRefreshRef.current) return;
    if (smartNotes.length > 0) {
      didAutoRefreshRef.current = true;
      return;
    }
    didAutoRefreshRef.current = true;
    void handleRefresh();
  }, [open, onRefresh, smartNotes.length, handleRefresh]);

  // Reset fullscreen mode when modal is closed
  useEffect(() => {
    if (!open) {
      setFullscreen(false);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.8)",
        backdropFilter: "blur(12px)",
        display: "flex",
        padding: fullscreen ? 0 : "8px",
        zIndex: 75,
        transition: "all 0.2s ease",
        alignItems: fullscreen ? "stretch" : "center",
        justifyContent: fullscreen ? "stretch" : "center",
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          handleRequestClose();
        }
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: fullscreen ? "100%" : "1600px",
          height: "100%",
          maxHeight: fullscreen ? "100vh" : "99vh",
          background: "linear-gradient(135deg, rgba(11, 14, 20, 0.98) 0%, rgba(8, 10, 16, 0.98) 100%)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "25px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 64px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05) inset",
        }}
      >
        {/* Compact Header */}
        <div
          style={{
            padding: "10px 14px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            background: "rgba(255,255,255,0.03)",
            flex: "0 0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4, paddingLeft: fullscreen ? 80 : 0, transition: "padding-left 0.2s ease" }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#eaeaea" }}>
                🧠 {t("workspace.smartNotes")}
              </h2>
              <span style={{ 
                fontSize: 12, 
                padding: "2px 8px", 
                background: "rgba(99, 102, 241, 0.2)", 
                borderRadius: 12, 
                color: "#a5b4fc",
                fontWeight: 500
              }}>
                {smartNotes.length} {smartNotes.length === 1 ? t("smartNotes.countSingle") : t("smartNotes.countPlural")}
              </span>
              {hasUnsavedChanges && (
                <span style={{ 
                  fontSize: 11, 
                  padding: "2px 8px", 
                  background: "rgba(234, 179, 8, 0.2)", 
                  borderRadius: 12, 
                  color: "#fbbf24",
                  fontWeight: 500
                }}>
                  • {t("docNotes.unsaved")}
                </span>
              )}
            </div>
            <p style={{ 
              margin: 0, 
              fontSize: 12, 
              lineHeight: 1.4, 
              color: "rgba(255, 255, 255, 0.6)",
              paddingLeft: fullscreen ? 80 : 0,
              transition: "padding-left 0.2s ease",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}>
              {smartNoteStatus || t("smartNotes.defaultStatus")}
            </p>
          </div>

          {/* Compact Action Buttons */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
            {onRefresh && (
              <button
                onClick={handleRefresh}
                className="btn btn-secondary btn-sm"
                disabled={refreshing}
                title={t("smartNotes.refreshTitle")}
                style={{ minHeight: 34, padding: "8px 12px", opacity: refreshing ? 0.7 : 1 }}
              >
                ↻ {refreshing ? t("smartNotes.refreshing") : t("smartNotes.refresh")}
              </button>
            )}

            <button
              onClick={() => {
                if (!confirmLoseChanges()) return;
                onCreateNew();
              }}
              className="btn btn-secondary btn-sm"
              style={{ minHeight: 34, padding: "8px 14px" }}
            >
              ➕ {t("smartNotes.new")}
            </button>
            
            <button
              onClick={onSave}
              disabled={!smartNoteText.trim() || !hasUnsavedChanges}
              className={hasUnsavedChanges ? "btn btn-success btn-sm" : "btn btn-secondary btn-sm"}
              style={{ minHeight: 34, padding: "8px 14px", opacity: smartNoteText.trim() && hasUnsavedChanges ? 1 : 0.7 }}
            >
              💾 {hasUnsavedChanges ? t("action.save") : t("status.saved")}
            </button>

            <button
              onClick={() => setFullscreen((v) => !v)}
              className={fullscreen ? "btn btn-primary btn-sm" : "btn btn-secondary btn-sm"}
              style={{ minHeight: 34, padding: "8px 10px" }}
              title={fullscreen ? t("smartNotes.fullscreenExitTitle") : t("smartNotes.fullscreenEnterTitle")}
            >
              {fullscreen ? t("smartNotes.fullscreenExit") : t("smartNotes.fullscreenEnter")}
            </button>

            {currentSmartNote && (
              <button
                onClick={() => onDelete(currentSmartNote.id)}
                className="btn btn-danger btn-sm"
                style={{ minHeight: 34, padding: "8px 14px" }}
              >
                🗑️ {t("action.delete")}
              </button>
            )}

            <button
              onClick={handleRequestClose}
              className="btn btn-secondary btn-sm"
              style={{ minHeight: 34, padding: "8px 12px" }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Main Content Area - Optimized Layout */}
        <div style={{
          flex: "1 1 auto",
          minHeight: 0,
          display: "flex",
          padding: 10,
          gap: 10,
          overflow: "hidden",
        }}>
          {/* Left: Editor */}
          <div style={{
            flex: "1 1 66%",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            minWidth: 0,
          }}>
            {/* Rich Text Editor - Takes remaining space */}
            <div style={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              background: "rgba(0, 0, 0, 0.2)",
              borderRadius: 10,
              border: "1px solid rgba(255, 255, 255, 0.08)",
              overflow: "hidden",
            }}>
              <React.Suspense
                fallback={
                  <div style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "rgba(255, 255, 255, 0.6)",
                    fontSize: 12,
                  }}>
                    {t("editor.loading")}
                  </div>
                }
              >
                <RichTextEditor
                  valueHtml={smartNoteHtml}
                  onChange={({ html, text }) => {
                    onHtmlChange(html);
                    onTextChange(text);
                    onDirtyChange(true);
                  }}
                  placeholder={t("smartNotes.placeholder")}
                />
              </React.Suspense>
            </div>
          </div>

          {/* Right: Notes List (Sidebar) */}
          <div style={{
            flex: "0 0 34%",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            minWidth: 0,
            background: "rgba(255,255,255,0.02)",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.08)",
            padding: 12,
            gap: 12,
          }}>
            {/* Compact Header with Count */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}>
              <div style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#eaeaea",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}>
                <span>📚 {t("workspace.notes")}</span>
                <span style={{
                  fontSize: 11,
                  padding: "2px 6px",
                  background: "rgba(99, 102, 241, 0.2)",
                  borderRadius: 10,
                  color: "#a5b4fc",
                  fontWeight: 500,
                }}>
                  {filteredSmartNotes.length}{filteredSmartNotes.length !== smartNotes.length ? ` / ${smartNotes.length}` : ''}
                </span>
              </div>
            </div>

            {/* Details (Category / Priority / Tags) */}
            <div style={{
              padding: 12,
              background: "rgba(255,255,255,0.03)",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.08)",
              flexShrink: 0
            }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                marginBottom: 10
              }}>
                <div style={{ minWidth: 0 }}>
                  <label style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 500,
                    marginBottom: 6,
                    color: "rgba(255, 255, 255, 0.6)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    {t("smartNotes.category")}
                  </label>
                  <select
                    value={smartNoteCategory}
                    onChange={(e) => {
                      onCategoryChange(e.target.value);
                      onDirtyChange(true);
                    }}
                    style={{
                      width: "100%",
                      padding: "6px 10px",
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: 6,
                      fontSize: 13,
                      color: "#eaeaea",
                      cursor: "pointer"
                    }}
                  >
                    <option value="General">📁 {t("smartNotes.category.general")}</option>
                    <option value="Technical">🔧 {t("smartNotes.category.technical")}</option>
                    <option value="Research">🔬 {t("smartNotes.category.research")}</option>
                    <option value="Ideas">💡 {t("smartNotes.category.ideas")}</option>
                    <option value="Important">⭐ {t("smartNotes.category.important")}</option>
                    <option value="Questions">❓ {t("smartNotes.category.questions")}</option>
                  </select>
                </div>

                <div style={{ minWidth: 0 }}>
                  <label style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 500,
                    marginBottom: 6,
                    color: "rgba(255, 255, 255, 0.6)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    {t("smartNotes.priority")}
                  </label>
                  <select
                    value={smartNotePriority}
                    onChange={(event) => {
                      onPriorityChange(event.target.value as any);
                      onDirtyChange(true);
                    }}
                    style={{
                      width: "100%",
                      padding: "6px 10px",
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: 6,
                      fontSize: 13,
                      color: "#eaeaea",
                      cursor: "pointer"
                    }}
                  >
                    <option value="high">🔴 {t("smartNotes.priority.high")}</option>
                    <option value="medium">🟡 {t("smartNotes.priority.medium")}</option>
                    <option value="low">🟢 {t("smartNotes.priority.low")}</option>
                  </select>
                </div>
              </div>

              <div style={{ minWidth: 0 }}>
                <label style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 500,
                  marginBottom: 6,
                  color: "rgba(255, 255, 255, 0.6)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>
                  {t("smartNotes.tags")}
                </label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                  {smartNoteTags.map(tag => (
                    <span
                      key={tag}
                      style={{
                        padding: "4px 10px",
                        background: "rgba(99, 102, 241, 0.2)",
                        border: "1px solid rgba(99, 102, 241, 0.4)",
                        borderRadius: 14,
                        fontSize: 11,
                        color: "#a5b4fc",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontWeight: 500
                      }}
                    >
                      {tag}
                      <button
                        onClick={() => {
                          onRemoveTag(tag);
                          onDirtyChange(true);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#a5b4fc",
                          cursor: "pointer",
                          padding: 0,
                          margin: 0,
                          fontSize: 14,
                          lineHeight: 1,
                          opacity: 0.7
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = "1";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = "0.7";
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => onNewTagInputChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newTagInput.trim()) {
                        onAddTag(newTagInput);
                        onDirtyChange(true);
                      }
                    }}
                    placeholder={t("smartNotes.addTagPlaceholder")}
                    style={{
                      flex: 1,
                      padding: "6px 10px",
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: 6,
                      fontSize: 12,
                      color: "#eaeaea"
                    }}
                  />
                  <button
                    onClick={() => {
                      if (!newTagInput.trim()) return;
                      onAddTag(newTagInput);
                      onDirtyChange(true);
                    }}
                    disabled={!newTagInput.trim()}
                    style={{
                      padding: "6px 12px",
                      background: newTagInput.trim() ? "rgba(99, 102, 241, 0.3)" : "rgba(255,255,255,0.05)",
                      border: newTagInput.trim() ? "1px solid rgba(99, 102, 241, 0.5)" : "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 6,
                      fontSize: 12,
                      cursor: newTagInput.trim() ? "pointer" : "not-allowed",
                      color: newTagInput.trim() ? "#a5b4fc" : "rgba(255, 255, 255, 0.4)",
                      fontWeight: 500
                    }}
                  >
                    {t("action.add")}
                  </button>
                </div>
              </div>
            </div>

            {/* Compact Search Bar */}
            <div style={{ flexShrink: 0 }}>
              <input
                type="text"
                placeholder={t("smartNotes.searchPlaceholder")}
                value={smartNoteSearchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "#eaeaea"
                }}
              />
            </div>

            {/* Compact Filters Row */}
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "1fr 1fr", 
              gap: 6,
              flexShrink: 0
            }}>
              <select
                value={smartNoteSelectedCategory}
                onChange={(e) => onSelectedCategoryChange(e.target.value)}
                style={{
                  padding: "6px 8px",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 6,
                  fontSize: 11,
                  color: "#eaeaea",
                  cursor: "pointer"
                }}
              >
                <option value="all">📁 {t("common.all")}</option>
                {allCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <select
                value={smartNoteSelectedTag}
                onChange={(e) => onSelectedTagChange(e.target.value)}
                style={{
                  padding: "6px 8px",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 6,
                  fontSize: 11,
                  color: "#eaeaea",
                  cursor: "pointer"
                }}
              >
                <option value="">🏷️ {t("smartNotes.allTags")}</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>

              <select
                value={smartNoteSelectedPriority}
                onChange={(e) => onSelectedPriorityChange(e.target.value)}
                style={{
                  padding: "6px 8px",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 6,
                  fontSize: 11,
                  color: "#eaeaea",
                  cursor: "pointer"
                }}
              >
                <option value="all">⭐ {t("common.all")}</option>
                <option value="high">🔴 {t("smartNotes.priority.high")}</option>
                <option value="medium">🟡 {t("smartNotes.priority.medium")}</option>
                <option value="low">🟢 {t("smartNotes.priority.low")}</option>
              </select>

              <select
                value={smartNoteSortBy}
                onChange={(e) => onSortByChange(e.target.value as any)}
                style={{
                  padding: "6px 8px",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 6,
                  fontSize: 11,
                  color: "#eaeaea",
                  cursor: "pointer"
                }}
              >
                <option value="date-desc">📅 {t("smartNotes.sort.newest")}</option>
                <option value="date-asc">📅 {t("smartNotes.sort.oldest")}</option>
                <option value="category">📁 {t("smartNotes.sort.category")}</option>
                <option value="priority">⭐ {t("smartNotes.sort.priority")}</option>
                <option value="title">🔤 {t("smartNotes.sort.title")}</option>
              </select>
            </div>

            {/* Notes List - Scrollable */}
            <div style={{ 
              flex: 1, 
              overflowY: "auto",
              overflowX: "hidden",
              minHeight: 0
            }}>
              {filteredSmartNotes.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {filteredSmartNotes.map(note => {
                    const isSelected = currentSmartNote?.id === note.id;
                    const priority = note.priority || 'medium';
                    return (
                      <div
                        key={note.id}
                        onClick={() => {
                          if (!confirmLoseChanges()) return;
                          onLoadNote(note);
                        }}
                        style={{
                          padding: 12,
                          background: isSelected 
                            ? "rgba(99, 102, 241, 0.15)" 
                            : getPriorityColor(priority),
                          border: isSelected 
                            ? "1px solid rgba(99, 102, 241, 0.4)" 
                            : `1px solid ${getPriorityBorder(priority)}`,
                          borderRadius: 10,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          position: "relative"
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = getPriorityColor(priority).replace('0.2', '0.25');
                            e.currentTarget.style.transform = "translateY(-1px)";
                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.2)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = getPriorityColor(priority);
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "none";
                          }
                        }}
                      >
                        {/* Priority Indicator */}
                        <div style={{ 
                          position: "absolute", 
                          top: 8, 
                          right: 8,
                          fontSize: 12
                        }}>
                          {getPriorityIcon(priority)}
                        </div>

                        {/* Note Preview */}
                        <div style={{ 
                          fontWeight: 600, 
                          marginBottom: 6, 
                          color: "#eaeaea",
                          fontSize: 13,
                          lineHeight: 1.4,
                          paddingRight: 24
                        }}>
                          {note.content.slice(0, 100)}{note.content.length > 100 ? "…" : ""}
                        </div>

                        {/* Metadata Row */}
                        <div style={{ 
                          display: "flex", 
                          gap: 8, 
                          flexWrap: "wrap", 
                          alignItems: "center",
                          marginBottom: 4
                        }}>
                          <span style={{ 
                            fontSize: 10, 
                            padding: "2px 6px",
                            background: "rgba(255,255,255,0.1)",
                            borderRadius: 4,
                            color: "rgba(255, 255, 255, 0.7)",
                            fontWeight: 500
                          }}>
                            {note.category}
                          </span>
                          {note.tags.slice(0, 2).map(tag => (
                            <span key={tag} style={{ 
                              fontSize: 10, 
                              padding: "2px 6px",
                              background: "rgba(99, 102, 241, 0.2)",
                              borderRadius: 4,
                              color: "#a5b4fc",
                              fontWeight: 500
                            }}>
                              {tag}
                            </span>
                          ))}
                          {note.tags.length > 2 && (
                            <span style={{ 
                              fontSize: 10, 
                              color: "rgba(255, 255, 255, 0.5)"
                            }}>
                              +{note.tags.length - 2}
                            </span>
                          )}
                        </div>

                        {/* Date */}
                        <div style={{ 
                          fontSize: 10, 
                          color: "rgba(255, 255, 255, 0.5)",
                          marginTop: 4
                        }}>
                          {formatDate(note.timestamp, t, language)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ 
                  textAlign: "center", 
                  padding: 40, 
                  color: "rgba(255, 255, 255, 0.5)",
                  fontSize: 13
                }}>
                  {smartNotes.length === 0 ? (
                    <>
                      <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.5 }}>📝</div>
                      <div style={{ fontWeight: 500, marginBottom: 4 }}>{t("smartNotes.empty.noNotes")}</div>
                      <div style={{ fontSize: 11, opacity: 0.7 }}>
                        {t("smartNotes.empty.noNotesHint")}
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.5 }}>🔍</div>
                      <div style={{ fontWeight: 500, marginBottom: 4 }}>{t("smartNotes.empty.noMatches")}</div>
                      <div style={{ fontSize: 11, opacity: 0.7 }}>
                        {t("smartNotes.empty.noMatchesHint")}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
