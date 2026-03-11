/**
 * Recycle Bin Page
 * 
 * Full-page view for managing soft-deleted items (documents, segments, folders).
 * Supports filtering, bulk restore/delete, and retention policy display.
 */

import React, { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  listAllDeletedItems,
  restoreDocument,
  restoreSegment,
  restoreFolder,
  permanentlyDeleteDocument,
  permanentlyDeleteSegment,
  permanentlyDeleteFolder,
  RecycleBinResponse,
} from "../lib/api";
import { useLoading } from "../hooks/useLoading";
import { useTour } from "../components/tour/useTour";
import { TourPanel } from "../components/tour/TourPanel";
import { PageShell } from "../components/layout/PageShell";
import { ErrorBanner } from "../components/common/ErrorBanner";
import { EmptyState } from "../components/common/EmptyState";
import { ScreenshotMode } from "../components/ScreenshotMode";
import { useMediaQuery } from "../hooks/useMediaQuery";

// Semantic token-based theme colors
const getThemeColors = () => ({
  loadingBg: "hsl(var(--background))",
  loadingText: "hsl(var(--muted-foreground))",
  loadingSpinnerBorder: "hsl(var(--border))",
  cardBg: "hsl(var(--card))",
  cardBorder: "hsl(var(--border))",
  cardBorderHover: "hsl(var(--primary) / 0.3)",
  cardBorderSelected: "hsl(var(--primary) / 0.5)",
  inputBg: "hsl(var(--muted) / 0.4)",
  inputBorder: "hsl(var(--border))",
  inputText: "hsl(var(--foreground))",
  btnBg: "hsl(var(--muted) / 0.5)",
  btnBorder: "hsl(var(--border))",
  btnText: "hsl(var(--foreground))",
  textMuted: "hsl(var(--muted-foreground))",
  textFaint: "hsl(var(--muted-foreground))",
  textContent: "hsl(var(--foreground))",
});

type RecycleBinItem =
  | RecycleBinResponse["documents"][number]
  | RecycleBinResponse["segments"][number]
  | RecycleBinResponse["folders"][number];

export default function RecycleBinPage() {
  const nav = useNavigate();
  const { loading, execute } = useLoading();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const tc = getThemeColors();
  const [data, setData] = useState<RecycleBinResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<"all" | "document" | "segment" | "folder">("all");
  const [filterDocument, setFilterDocument] = useState<string>("all");
  const [screenshotModeActive, setScreenshotModeActive] = useState(false);
  const pageContainerRef = useRef<HTMLDivElement | null>(null);
  const tourRefs = {
    header: useRef<HTMLDivElement | null>(null),
    filters: useRef<HTMLDivElement | null>(null),
    list: useRef<HTMLDivElement | null>(null),
  };

  useEffect(() => {
    execute(async () => {
      try {
        const result = await listAllDeletedItems();
        setData(result);
        setError(null);
      } catch (e: any) {
        setError(e?.message || "Failed to load recycle bin");
      }
    });
  }, [execute]);

  // Combine all items into a single array
  const allItems = useMemo(() => {
    if (!data) return [];
    const items: RecycleBinItem[] = [...data.documents, ...data.segments, ...data.folders];
    return items.sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());
  }, [data]);

  // Filter items
  const filteredItems = useMemo(() => {
    let filtered = allItems;
    
    if (filterType !== "all") {
      filtered = filtered.filter(item => item.type === filterType);
    }
    
    if (filterDocument !== "all") {
      const docId = parseInt(filterDocument, 10);
      filtered = filtered.filter(item => {
        if (item.type === "document") return item.id === docId;
        if (item.type === "segment" || item.type === "folder") return item.documentId === docId;
        return false;
      });
    }
    
    return filtered;
  }, [allItems, filterType, filterDocument]);

  // Get unique document IDs for filter
  const documentIds = useMemo(() => {
    const ids = new Set<number>();
    allItems.forEach(item => {
      if (item.type === "document") {
        ids.add(item.id);
      } else if (item.type === "segment" || item.type === "folder") {
        ids.add(item.documentId);
      }
    });
    return Array.from(ids).sort();
  }, [allItems]);

  // Get document titles map
  const documentTitles = useMemo(() => {
    const map = new Map<number, string>();
    allItems.forEach(item => {
      if (item.type === "document") {
        map.set(item.id, item.title);
      } else if (item.type === "segment" || item.type === "folder") {
        if (item.documentTitle) {
          map.set(item.documentId, item.documentTitle);
        }
      }
    });
    return map;
  }, [allItems]);

  const handleSelectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map(item => `${item.type}-${item.id}`)));
    }
  };

  const handleSelectItem = (item: RecycleBinItem) => {
    const key = `${item.type}-${item.id}`;
    const newSelected = new Set(selectedItems);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedItems(newSelected);
  };

  const handleBulkRestore = async () => {
    if (selectedItems.size === 0) return;
    
    if (!window.confirm(`Restore ${selectedItems.size} item(s)?`)) return;
    
    try {
      const restorePromises = Array.from(selectedItems).map(key => {
        const [type, idStr] = key.split("-");
        const id = parseInt(idStr, 10);
        
        if (type === "document") {
          return restoreDocument(id);
        } else if (type === "segment") {
          return restoreSegment(id);
        } else if (type === "folder") {
          return restoreFolder(id);
        }
        return Promise.resolve({ ok: true });
      });
      
      await Promise.all(restorePromises);
      setSelectedItems(new Set());
      
      // Reload data
      const result = await listAllDeletedItems();
      setData(result);
    } catch (e: any) {
      alert(`Failed to restore items: ${e?.message}`);
    }
  };

  const tourSteps = [
    {
      key: "welcome",
      title: "Recycle Bin",
      body: "Safely manage deleted documents, segments, and folders. Items here are soft-deleted and can be restored to your workspace before the retention period expires.",
      ref: null as React.RefObject<HTMLDivElement | null> | null,
    },
    {
      key: "header",
      title: "Navigation & Retention Policy",
      body: "Return to your workspace from here. The retention policy shows how long deleted items are kept before permanent removal.",
      ref: tourRefs.header,
    },
    {
      key: "filters",
      title: "Find Deleted Items",
      body: "Filter by type (document, segment, folder) or by source document to quickly locate items you need to restore or permanently remove.",
      ref: tourRefs.filters,
    },
    {
      key: "list",
      title: "Restore or Remove",
      body: "Select items to restore them back to your workspace, or permanently delete them. Restored items return to their original location with all metadata intact.",
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
    storageKey: "recycleBinTourSeen",
    steps: tourSteps,
    containerRef: pageContainerRef,
  });

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;
    
    if (!window.confirm(`Permanently delete ${selectedItems.size} item(s)? This cannot be undone.`)) return;
    
    try {
      const deletePromises = Array.from(selectedItems).map(key => {
        const [type, idStr] = key.split("-");
        const id = parseInt(idStr, 10);
        
        if (type === "document") {
          return permanentlyDeleteDocument(id);
        } else if (type === "segment") {
          return permanentlyDeleteSegment(id);
        } else if (type === "folder") {
          return permanentlyDeleteFolder(id);
        }
        return Promise.resolve({ ok: true });
      });
      
      await Promise.all(deletePromises);
      setSelectedItems(new Set());
      
      // Reload data
      const result = await listAllDeletedItems();
      setData(result);
    } catch (e: any) {
      alert(`Failed to delete items: ${e?.message}`);
    }
  };

  const formatTimeRemaining = (deletedAt: string) => {
    const deleted = new Date(deletedAt).getTime();
    const now = Date.now();
    const hoursElapsed = (now - deleted) / (1000 * 60 * 60);
    const retentionDays = 30; // Default retention period
    const hoursRemaining = Math.max(0, retentionDays * 24 - hoursElapsed);
    
    if (hoursRemaining > 24) {
      const days = Math.floor(hoursRemaining / 24);
      return `${days} day${days !== 1 ? 's' : ''}`;
    }
    return `${Math.floor(hoursRemaining)} hour${Math.floor(hoursRemaining) !== 1 ? 's' : ''}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: tc.loadingBg,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              border: `4px solid ${tc.loadingSpinnerBorder}`,
              borderTopColor: "#6366f1",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <p style={{ fontSize: "14px", color: tc.loadingText }}>Loading recycle bin...</p>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <PageShell
      containerRef={pageContainerRef}
      headerRef={tourRefs.header}
      headerHighlightStyle={getTourHighlightStyle(tourRefs.header) || {}}
      title="Recycle Bin"
      subtitle="Manage soft-deleted items. Items are automatically purged after 30 days."
      icon="🗑️"
      actions={
        <>
          <button
            onClick={startTour}
            className="btn btn-sm btn-secondary"
          >
            Start tour
          </button>
        
        </>
      }
      topOffset={tourPopoverPos?.pushDownPadding ? Math.round(tourPopoverPos.pushDownPadding) : undefined}
    >
        {/* Retention policy callout */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 12px",
            background: "rgba(245, 158, 11, 0.1)",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            borderRadius: "8px",
            fontSize: "12px",
            color: "#f59e0b",
            marginBottom: "16px",
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "16px", height: "16px" }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            <strong>Retention Policy:</strong> Items are kept for 30 days, then automatically purged.
          </span>
        </div>

        {/* Filters and Bulk Actions */}
        <div
          ref={tourRefs.filters}
          style={{
            background: tc.cardBg,
            backdropFilter: "blur(20px)",
            border: `1px solid ${tc.cardBorder}`,
            borderRadius: "10px",
            padding: "24px",
            marginBottom: "32px",
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
            alignItems: "center",
            ...(getTourHighlightStyle(tourRefs.filters) || {}),
          }}
        >
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            style={{
              padding: "12px 16px",
              background: tc.inputBg,
              border: `1px solid ${tc.inputBorder}`,
              borderRadius: "10px",
              color: tc.inputText,
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            <option value="all">All Types</option>
            <option value="document">Documents</option>
            <option value="segment">Segments</option>
            <option value="folder">Folders</option>
          </select>
          
          {documentIds.length > 0 && (
            <select
              value={filterDocument}
              onChange={(e) => setFilterDocument(e.target.value)}
              style={{
                padding: "12px 16px",
                background: tc.inputBg,
                border: `1px solid ${tc.inputBorder}`,
              borderRadius: "10px",
                color: tc.inputText,
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              <option value="all">All Documents</option>
              {documentIds.map(id => (
                <option key={id} value={String(id)}>
                  {documentTitles.get(id) || `Document ${id}`}
                </option>
              ))}
            </select>
          )}

          <div style={{ flex: 1 }} />

          <button
            onClick={handleSelectAll}
            style={{
              padding: "12px 16px",
              background: tc.btnBg,
              border: `1px solid ${tc.btnBorder}`,
              borderRadius: "8px",
              color: tc.btnText,
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            {selectedItems.size === filteredItems.length ? "Deselect All" : "Select All"}
          </button>

          <button
            onClick={handleBulkRestore}
            disabled={selectedItems.size === 0}
            style={{
              padding: "12px 16px",
              background: selectedItems.size > 0 ? "rgba(16, 185, 129, 0.2)" : "rgba(107, 114, 128, 0.2)",
              border: `1px solid ${selectedItems.size > 0 ? "rgba(16, 185, 129, 0.4)" : "rgba(107, 114, 128, 0.4)"}`,
              borderRadius: "8px",
              color: selectedItems.size > 0 ? "#10b981" : "#9ca3af",
              fontSize: "14px",
              cursor: selectedItems.size > 0 ? "pointer" : "not-allowed",
              opacity: selectedItems.size > 0 ? 1 : 0.5,
            }}
          >
            Restore ({selectedItems.size})
          </button>

          <button
            onClick={handleBulkDelete}
            disabled={selectedItems.size === 0}
            style={{
              padding: "12px 16px",
              background: selectedItems.size > 0 ? "rgba(239, 68, 68, 0.2)" : "rgba(107, 114, 128, 0.2)",
              border: `1px solid ${selectedItems.size > 0 ? "rgba(239, 68, 68, 0.4)" : "rgba(107, 114, 128, 0.4)"}`,
              borderRadius: "8px",
              color: selectedItems.size > 0 ? "#ef4444" : "#9ca3af",
              fontSize: "14px",
              cursor: selectedItems.size > 0 ? "pointer" : "not-allowed",
              opacity: selectedItems.size > 0 ? 1 : 0.5,
            }}
          >
            Delete Permanently ({selectedItems.size})
          </button>
        </div>

        {/* Error Message */}
        {error && (<ErrorBanner message={error} />)}

        {/* Items List */}
        <div ref={tourRefs.list} style={{ ...(getTourHighlightStyle(tourRefs.list) || {}) }}>
        {filteredItems.length === 0 ? (
          <EmptyState
            icon="🗑️"
            title="Recycle Bin is Empty"
            description="No deleted items found. Items are automatically purged after 30 days."
          />
        ) : (
          <div style={{ display: "grid", gap: "16px" }}>
            {filteredItems.map((item) => {
              const key = `${item.type}-${item.id}`;
              const isSelected = selectedItems.has(key);
              const timeRemaining = formatTimeRemaining(item.deletedAt);
              
              return (
                <div
                  key={key}
                  style={{
                    background: tc.cardBg,
                    backdropFilter: "blur(20px)",
                    border: `1px solid ${isSelected ? tc.cardBorderSelected : tc.cardBorder}`,
                    borderRadius: "10px",
                    padding: "24px",
                    transition: "all 0.2s ease",
                    cursor: "pointer",
                  }}
                  onClick={() => handleSelectItem(item)}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = tc.cardBorderHover;
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = tc.cardBorder;
                      e.currentTarget.style.transform = "translateY(0)";
                    }
                  }}
                >
                  <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectItem(item)}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        width: "20px",
                        height: "20px",
                        cursor: "pointer",
                        marginTop: "4px",
                      }}
                    />
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            padding: "4px 8px",
                            background: item.type === "document" ? "rgba(99, 102, 241, 0.2)" : item.type === "segment" ? "rgba(16, 185, 129, 0.2)" : "rgba(245, 158, 11, 0.2)",
                            border: `1px solid ${item.type === "document" ? "rgba(99, 102, 241, 0.4)" : item.type === "segment" ? "rgba(16, 185, 129, 0.4)" : "rgba(245, 158, 11, 0.4)"}`,
                            borderRadius: "6px",
                            color: item.type === "document" ? "#6366f1" : item.type === "segment" ? "#10b981" : "#f59e0b",
                            textTransform: "uppercase",
                            fontWeight: 600,
                          }}
                        >
                          {item.type}
                        </span>
                        <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>
                          {item.type === "document" ? item.title : item.type === "segment" ? (item.title || "Untitled Segment") : item.name}
                        </h3>
                      </div>
                      
                      {item.type === "document" && (
                        <p style={{ fontSize: "14px", color: tc.textMuted, marginBottom: "8px" }}>
                          {item.filename}
                        </p>
                      )}
                      
                      {item.type === "segment" && item.content && (
                        <p style={{ fontSize: "14px", color: tc.textContent, marginBottom: "8px", lineHeight: 1.6 }}>
                          {item.content.substring(0, 200)}...
                        </p>
                      )}
                      
                      <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: tc.textFaint }}>
                        <span>Deleted: {formatDate(item.deletedAt)}</span>
                        <span>Purges in: {timeRemaining}</span>
                        {(item.type === "segment" || item.type === "folder") && item.documentTitle && (
                          <span>Document: {item.documentTitle}</span>
                        )}
                      </div>
                    </div>
                    
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            if (item.type === "document") {
                              await restoreDocument(item.id);
                            } else if (item.type === "segment") {
                              await restoreSegment(item.id);
                            } else if (item.type === "folder") {
                              await restoreFolder(item.id);
                            }
                            const result = await listAllDeletedItems();
                            setData(result);
                          } catch (err: any) {
                            alert(`Failed to restore: ${err?.message}`);
                          }
                        }}
                        style={{
                          padding: "8px 12px",
                          background: "rgba(16, 185, 129, 0.2)",
                          border: "1px solid rgba(16, 185, 129, 0.4)",
                          borderRadius: "8px",
                          color: "#10b981",
                          fontSize: "12px",
                          cursor: "pointer",
                        }}
                      >
                        Restore
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!window.confirm("Permanently delete this item? This cannot be undone.")) return;
                          try {
                            if (item.type === "document") {
                              await permanentlyDeleteDocument(item.id);
                            } else if (item.type === "segment") {
                              await permanentlyDeleteSegment(item.id);
                            } else if (item.type === "folder") {
                              await permanentlyDeleteFolder(item.id);
                            }
                            const result = await listAllDeletedItems();
                            setData(result);
                          } catch (err: any) {
                            alert(`Failed to delete: ${err?.message}`);
                          }
                        }}
                        style={{
                          padding: "8px 12px",
                          background: "rgba(239, 68, 68, 0.2)",
                          border: "1px solid rgba(239, 68, 68, 0.4)",
                          borderRadius: "8px",
                          color: "#ef4444",
                          fontSize: "12px",
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
        <ScreenshotMode isActive={screenshotModeActive} onToggle={() => setScreenshotModeActive(!screenshotModeActive)} />
    </PageShell>
  );
}
