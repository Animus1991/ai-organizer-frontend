import React, { useState } from "react";
import {
  Search, Filter, Star, StarOff, Download,
  FileJson, FileText, Table2, FileDown,
  Clock, ArrowDownAZ, Tag, BarChart3, BookOpen, FolderOpen,
} from "lucide-react";

type SortMode = "recent" | "alpha" | "type" | "grade";
type ExportFormat = "json" | "markdown" | "csv" | "txt";

interface LibraryFilterBarProps {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  selectedCategory: string;
  onCategoryChange: (v: string) => void;
  selectedTag: string;
  onTagChange: (v: string) => void;
  categories: string[];
  tags: string[];
  showFavoritesOnly: boolean;
  onToggleFavorites: () => void;
  sortMode: SortMode;
  onSortChange: (v: SortMode) => void;
  onExport: (fmt: ExportFormat) => void;
  displayedCount: number;
}

const SORT_OPTIONS: { key: SortMode; label: string; icon: React.ElementType }[] = [
  { key: "recent", label: "Recent", icon: Clock },
  { key: "alpha", label: "A–Z", icon: ArrowDownAZ },
  { key: "type", label: "Type", icon: Tag },
  { key: "grade", label: "Grade", icon: BarChart3 },
];

const EXPORT_OPTIONS: { key: ExportFormat; label: string; icon: React.ElementType }[] = [
  { key: "json", label: "JSON", icon: FileJson },
  { key: "markdown", label: "Markdown", icon: FileText },
  { key: "csv", label: "CSV", icon: Table2 },
  { key: "txt", label: "Plain Text", icon: FileDown },
];

export function LibraryFilterBar({
  searchQuery, onSearchChange,
  selectedCategory, onCategoryChange,
  selectedTag, onTagChange,
  categories, tags,
  showFavoritesOnly, onToggleFavorites,
  sortMode, onSortChange,
  onExport, displayedCount,
}: LibraryFilterBarProps) {
  const [exportOpen, setExportOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Main filter row */}
      <div className="bg-card border border-border rounded-2xl p-5 flex flex-wrap gap-3 items-center backdrop-blur-xl">
        {/* Search */}
        <div className="relative flex-1 min-w-[260px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search library items..."
            className="w-full pl-10 pr-4 py-2.5 bg-input border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
          />
        </div>

        {/* Category select */}
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="pl-8 pr-8 py-2.5 bg-input border border-border rounded-lg text-foreground text-sm cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        {/* Tag select */}
        <div className="relative">
          <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <select
            value={selectedTag}
            onChange={(e) => onTagChange(e.target.value)}
            className="pl-8 pr-8 py-2.5 bg-input border border-border rounded-lg text-foreground text-sm cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="all">All Tags</option>
            {tags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
          </select>
        </div>

        {/* Favorites toggle */}
        <button
          onClick={onToggleFavorites}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            showFavoritesOnly
              ? "bg-amber-500/15 border border-amber-500/40 text-amber-500"
              : "bg-input border border-border text-foreground hover:border-amber-500/30"
          }`}
        >
          {showFavoritesOnly ? <Star size={14} className="fill-current" /> : <StarOff size={14} />}
          Favorites
        </button>

        {/* Export dropdown */}
        <div className="relative">
          <button
            onClick={() => setExportOpen(!exportOpen)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-primary/10 border border-primary/30 rounded-lg text-primary text-sm font-semibold hover:bg-primary/20 transition-colors"
          >
            <Download size={14} />
            Export
          </button>
          {exportOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setExportOpen(false)} />
              <div className="absolute right-0 top-full mt-2 z-50 bg-popover border border-border rounded-xl p-1.5 min-w-[160px] shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
                {EXPORT_OPTIONS.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => { onExport(key); setExportOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-accent transition-colors"
                  >
                    <Icon size={14} className="text-muted-foreground" />
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sort bar + stats */}
      <div className="flex items-center gap-2 flex-wrap border-t border-border/50 pt-3">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mr-1">Sort:</span>
        {SORT_OPTIONS.map(({ key, label, icon: Icon }) => {
          const active = sortMode === key;
          return (
            <button
              key={key}
              onClick={() => onSortChange(key)}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                active
                  ? "bg-primary/15 border border-primary/40 text-primary"
                  : "border border-border/60 text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }`}
            >
              <Icon size={12} />
              {label}
            </button>
          );
        })}
        <span className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><BookOpen size={12} />{displayedCount} items</span>
          {showFavoritesOnly && <span className="flex items-center gap-1"><Star size={12} className="fill-current text-amber-500" />favorites</span>}
          <span className="flex items-center gap-1"><FolderOpen size={12} />{categories.length} categories</span>
        </span>
      </div>
    </div>
  );
}
