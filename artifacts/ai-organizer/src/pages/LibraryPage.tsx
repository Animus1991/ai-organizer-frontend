/**
 * Cross-Document Library Page — refactored with Tailwind, Lucide, modular components.
 */
import React, { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { listLibraryItems, updateLibraryItem, deleteLibraryItem, LibraryItemDTO } from "../lib/api";
import { useLoading } from "../hooks/useLoading";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { useTour } from "../components/tour/useTour";
import { TourPanel } from "../components/tour/TourPanel";
import { ScreenshotMode } from "../components/ScreenshotMode";
import { useNotifications } from "../context/NotificationContext";
import { useFavorites } from "../context/FavoritesContext";
import { PageShell } from "../components/layout/PageShell";
import { ErrorBanner } from "../components/common/ErrorBanner";
import { LibraryFilterBar } from "./library/components/LibraryFilterBar";
import { LibraryItemCard } from "./library/components/LibraryItemCard";
import { LibraryEditModal } from "./library/components/LibraryEditModal";
import { LibraryEmptyState } from "./library/components/LibraryEmptyState";
import { Loader2, BookOpen } from "lucide-react";

type SortMode = "recent" | "alpha" | "type" | "grade";

export default function LibraryPage() {
  const nav = useNavigate();
  const { loading, execute } = useLoading();
  const [items, setItems] = useState<LibraryItemDTO[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTag, setSelectedTag] = useState("all");
  const [editingItem, setEditingItem] = useState<LibraryItemDTO | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [screenshotModeActive, setScreenshotModeActive] = useState(false);
  const pageContainerRef = useRef<HTMLDivElement | null>(null);

  const { addNotification } = useNotifications();
  const { isFavorite, addFavorite, removeFavorite, favorites } = useFavorites();

  const tourRefs = {
    header: useRef<HTMLDivElement | null>(null),
    filters: useRef<HTMLDivElement | null>(null),
    list: useRef<HTMLDivElement | null>(null),
  };

  // ── Data fetching ──
  useEffect(() => {
    execute(async () => {
      try {
        const data = await listLibraryItems({
          category: selectedCategory !== "all" ? selectedCategory : undefined,
          tag: selectedTag !== "all" ? selectedTag : undefined,
          search: searchQuery || undefined,
        });
        setItems(data);
        setError(null);
      } catch (e: any) {
        setError(e?.message || "Failed to load library items");
      }
    });
  }, [execute, selectedCategory, selectedTag, searchQuery]);

  // ── Derived data ──
  const categories = useMemo(() => {
    const cats = new Set<string>();
    items.forEach(i => { if (i.category) cats.add(i.category); });
    return Array.from(cats).sort();
  }, [items]);

  const tags = useMemo(() => {
    const tagSet = new Set<string>();
    items.forEach(i => {
      if (i.tags) i.tags.split(",").forEach(t => { const tr = t.trim(); if (tr) tagSet.add(tr); });
    });
    return Array.from(tagSet).sort();
  }, [items]);

  const displayedItems = useMemo(() => {
    let result = showFavoritesOnly
      ? items.filter(item => isFavorite(`library-${item.id}`, "segment"))
      : [...items];
    switch (sortMode) {
      case "alpha": return result.sort((a, b) => (a.title || a.segmentTitle || "").localeCompare(b.title || b.segmentTitle || ""));
      case "type": return result.sort((a, b) => (a.segmentType || "zzz").localeCompare(b.segmentType || "zzz"));
      case "grade": return result.sort((a, b) => (b.evidenceGrade || "").localeCompare(a.evidenceGrade || ""));
      default: return result;
    }
  }, [items, showFavoritesOnly, isFavorite, sortMode]);

  // ── Handlers ──
  const handleToggleFavorite = (item: LibraryItemDTO) => {
    const favId = `library-${item.id}`;
    if (isFavorite(favId, "segment")) {
      const existing = favorites.find(f => f.id === favId || f.metadata?.originalId === favId);
      if (existing) removeFavorite(existing.id);
      addNotification({ type: "info", title: "Removed from Favorites", message: `"${item.title || item.segmentTitle}" removed`, duration: 2000 });
    } else {
      addFavorite({
        type: "segment",
        title: item.title || item.segmentTitle || "Untitled",
        description: item.content?.slice(0, 120) || "",
        url: `/library#${item.id}`,
        metadata: { originalId: favId, libraryId: item.id, documentId: item.documentId },
      });
      addNotification({ type: "success", title: "Added to Favorites", message: `"${item.title || item.segmentTitle}" added`, duration: 2000 });
    }
  };

  const handleExport = async (format: "json" | "markdown" | "csv" | "txt") => {
    try {
      const data = displayedItems.map(item => ({
        id: item.id, title: item.title || item.segmentTitle, content: item.content,
        category: item.category, tags: item.tags, notes: item.notes,
        documentId: item.documentId, segmentType: item.segmentType, evidenceGrade: item.evidenceGrade,
      }));
      let content = "", filename = `library-export-${new Date().toISOString().split("T")[0]}`;
      switch (format) {
        case "json": content = JSON.stringify(data, null, 2); filename += ".json"; break;
        case "markdown":
          content = displayedItems.map(i =>
            `## ${i.title || i.segmentTitle || "Untitled"}\n\n${i.content || ""}\n\n**Category:** ${i.category || "None"}\n**Tags:** ${i.tags || "None"}\n**Document ID:** ${i.documentId || "Unknown"}\n\n---\n`
          ).join("\n"); filename += ".md"; break;
        case "csv":
          content = "ID,Title,Content,Category,Tags,Document,Type,Grade\n" +
            displayedItems.map(i =>
              `"${i.id}","${(i.title || i.segmentTitle || "").replace(/"/g, '""')}","${(i.content || "").replace(/"/g, '""')}","${i.category || ""}","${i.tags || ""}","${i.documentId || ""}","${i.segmentType || ""}","${i.evidenceGrade || ""}"`
            ).join("\n"); filename += ".csv"; break;
        case "txt":
          content = displayedItems.map(i =>
            `${i.title || i.segmentTitle || "Untitled"}\n${"-".repeat(50)}\n${i.content || ""}\n\n`
          ).join("\n"); filename += ".txt"; break;
      }
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = filename; link.click();
      URL.revokeObjectURL(url);
      addNotification({ type: "success", title: "Export Complete", message: `Exported ${displayedItems.length} items as ${format.toUpperCase()}`, duration: 3000 });
    } catch (err) {
      addNotification({ type: "error", title: "Export Failed", message: err instanceof Error ? err.message : "Failed to export", duration: 5000 });
    }
  };

  const handleDelete = async (itemId: number) => {
    if (!window.confirm("Delete this library item?")) return;
    try {
      await deleteLibraryItem(itemId);
      setItems(prev => prev.filter(i => i.id !== itemId));
      addNotification({ type: "success", title: "Item Deleted", message: "Library item has been deleted", duration: 3000 });
    } catch (e: any) {
      addNotification({ type: "error", title: "Delete Failed", message: e?.message || "Failed to delete item", duration: 5000 });
    }
  };

  const handleEdit = async (updates: { title?: string; notes?: string; tags?: string; category?: string }) => {
    if (!editingItem) return;
    try {
      const updated = await updateLibraryItem(editingItem.id, updates);
      setItems(prev => prev.map(i => i.id === editingItem.id ? updated : i));
      setEditingItem(null);
    } catch (e: any) {
      addNotification({ type: "error", title: "Update Failed", message: e?.message || "Failed to update item", duration: 5000 });
    }
  };

  // ── Tour ──
  const tourSteps = [
    { key: "welcome", title: "Document Library", body: "Your central repository for all uploaded documents and their segments.", ref: null as React.RefObject<HTMLDivElement | null> | null },
    { key: "header", title: "Navigation & Overview", body: "The header shows your library size and parsing status at a glance.", ref: tourRefs.header },
    { key: "filters", title: "Smart Filtering", body: "Narrow results by category, tags, favourites, or free-text search.", ref: tourRefs.filters },
    { key: "list", title: "Document Collection", body: "Browse, edit, or manage segments. Click any item to view its source document.", ref: tourRefs.list },
  ];

  const { tourOpen, tourStepIndex, tourPopoverPos, startTour, closeTour, nextTourStep, prevTourStep, getTourHighlightStyle } = useTour({
    storageKey: "libraryTourSeen", steps: tourSteps, containerRef: pageContainerRef,
  });

  // ── Loading state ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading library...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary fallback={<div className="p-5 text-center text-destructive">An error occurred. Please refresh.</div>}>
      <PageShell
        containerRef={pageContainerRef}
        headerRef={tourRefs.header}
        headerHighlightStyle={getTourHighlightStyle(tourRefs.header) || {}}
        title="Cross-Document Library"
        icon={<BookOpen size={22} />}
        subtitle="Organize and access segments from across all your documents"
        actions={
          <button onClick={startTour} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">
            Start tour
          </button>
        }
      >
        {/* Filters */}
        <div ref={tourRefs.filters} style={getTourHighlightStyle(tourRefs.filters) || {}}>
          <LibraryFilterBar
            searchQuery={searchQuery} onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory}
            selectedTag={selectedTag} onTagChange={setSelectedTag}
            categories={categories} tags={tags}
            showFavoritesOnly={showFavoritesOnly} onToggleFavorites={() => setShowFavoritesOnly(p => !p)}
            sortMode={sortMode} onSortChange={setSortMode}
            onExport={handleExport} displayedCount={displayedItems.length}
          />
        </div>

        {/* Error */}
        {error && <ErrorBanner message={error} />}

        {/* Items */}
        <div ref={tourRefs.list} className="mt-6" style={getTourHighlightStyle(tourRefs.list) || {}}>
          {displayedItems.length === 0 ? (
            <LibraryEmptyState isFavoritesView={showFavoritesOnly} />
          ) : (
            <div className="grid gap-3">
              {displayedItems.map(item => (
                <LibraryItemCard
                  key={item.id}
                  item={item}
                  isFavorite={isFavorite(`library-${item.id}`, "segment")}
                  onToggleFavorite={() => handleToggleFavorite(item)}
                  onEdit={() => setEditingItem(item)}
                  onDelete={() => handleDelete(item.id)}
                />
              ))}
            </div>
          )}
        </div>

        <TourPanel open={tourOpen} popoverPos={tourPopoverPos} stepIndex={tourStepIndex} steps={tourSteps} onClose={closeTour} onNext={nextTourStep} onPrev={prevTourStep} />
        {editingItem && <LibraryEditModal item={editingItem} onSave={handleEdit} onClose={() => setEditingItem(null)} />}
      </PageShell>
      <ScreenshotMode isActive={screenshotModeActive} onToggle={() => setScreenshotModeActive(p => !p)} />
    </ErrorBoundary>
  );
}
