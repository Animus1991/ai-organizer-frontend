import { useState, useMemo } from "react";
import { useLanguage } from "../context/LanguageContext";
import { CarouselView } from "./CarouselView";
import type { CarouselItem } from "./CarouselView";

export type ViewMode = "list" | "tiles" | "compact" | "cards" | "grid" | "carousel";

export type SegmentItem = {
  id: number | string;
  title?: string;
  content?: string;
  mode?: string;
  orderIndex?: number;
  createdAt?: string | null;
};

type SegmentViewModesProps = {
  segments: SegmentItem[];
  query: string;
  setQuery: (v: string) => void;
  onPick: (segment: SegmentItem) => void;
  onExport?: (segment: SegmentItem) => void;
  onBatchOpen?: (segments: SegmentItem[]) => void;
  onPin?: (segment: SegmentItem) => void;
  title?: string;
  showSearch?: boolean;
  showBatchControls?: boolean;
  defaultViewMode?: ViewMode;
  storageKey?: string;
};

const VIEW_MODE_ICONS: Record<ViewMode, { icon: string; key: string }> = {
  list: { icon: "☰", key: "viewMode.list" },
  tiles: { icon: "▦", key: "viewMode.tiles" },
  compact: { icon: "≡", key: "viewMode.compact" },
  cards: { icon: "▢", key: "viewMode.cards" },
  grid: { icon: "⊞", key: "viewMode.grid" },
  carousel: { icon: "⟷", key: "viewMode.carousel" },
};

export function SegmentViewModes({
  segments,
  query,
  setQuery,
  onPick,
  onExport,
  onBatchOpen,
  onPin,
  title,
  showSearch = true,
  showBatchControls = true,
  defaultViewMode = "list",
  storageKey = "segmentViewMode",
}: SegmentViewModesProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(storageKey);
      if (saved && Object.keys(VIEW_MODE_ICONS).includes(saved)) {
        return saved as ViewMode;
      }
    }
    return defaultViewMode;
  });

  const { t } = useLanguage();
  const resolvedTitle = title || t("workspace.segments");
  const [selectedSegments, setSelectedSegments] = useState<Set<string>>(new Set());

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, mode);
    }
  };

  const trimmed = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!trimmed) return segments;
    return segments.filter((seg) => {
      const hay = `${seg.title ?? ""} ${seg.content ?? ""}`.toLowerCase();
      return hay.includes(trimmed);
    });
  }, [segments, trimmed]);

  const toggleSelection = (segmentId: string) => {
    setSelectedSegments((prev) => {
      const next = new Set(prev);
      if (next.has(segmentId)) {
        next.delete(segmentId);
      } else {
        next.add(segmentId);
      }
      return next;
    });
  };

  const handleBatchOpen = () => {
    const selected = filtered.filter((seg) => selectedSegments.has(String(seg.id)));
    if (selected.length > 0 && onBatchOpen) {
      onBatchOpen(selected);
      setSelectedSegments(new Set());
    }
  };

  const selectedCount = selectedSegments.size;

  const renderSegmentItem = (seg: SegmentItem) => {
    const isSelected = selectedSegments.has(String(seg.id));
    const segTitle = seg.title || `Segment ${seg.id}`;
    const snippet = seg.content?.slice(0, viewMode === "compact" ? 80 : viewMode === "list" ? 160 : 240) || t("workspace.noPreview");

    return (
      <div
        key={seg.id}
        className={`svm-item svm-item--${viewMode}${isSelected ? " svm-item--selected" : ""}`}
        draggable
        onDragStart={(event) => {
          event.dataTransfer.effectAllowed = "copy";
          event.dataTransfer.setData(
            "application/x-ai-organizer-segment",
            JSON.stringify({
              id: String(seg.id),
              title: segTitle,
              text: seg.content || "",
            })
          );
        }}
      >
        {showBatchControls && (
          <div className="svm-checkbox">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleSelection(String(seg.id))}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
        <button className="svm-content" onClick={() => onPick(seg)} type="button">
          <div className="svm-title">{segTitle}</div>
          {viewMode !== "compact" && <div className="svm-snippet">{snippet}</div>}
          {viewMode === "cards" && seg.mode && (
            <div className="svm-meta">
              <span className="svm-mode-badge">{seg.mode}</span>
              {seg.orderIndex !== undefined && <span className="svm-order">#{seg.orderIndex + 1}</span>}
            </div>
          )}
        </button>
        <div className="svm-actions">
          {onPin && (
            <button className="svm-action-btn" onClick={() => onPin(seg)} type="button" title={t("action.pin")}>
              📌
            </button>
          )}
          {onExport && (
            <button className="svm-action-btn" onClick={() => onExport(seg)} type="button" title={t("action.export")}>
              ⬇
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="svm-container">
      <div className="svm-header">
        <div className="svm-header-left">
          <span className="svm-title-text">{resolvedTitle}</span>
          <span className="svm-count">{filtered.length}</span>
        </div>
        <div className="svm-header-right">
          <div className="svm-view-modes">
            {(Object.keys(VIEW_MODE_ICONS) as ViewMode[]).map((mode) => (
              <button
                key={mode}
                className={`svm-view-btn${viewMode === mode ? " svm-view-btn--active" : ""}`}
                onClick={() => handleViewModeChange(mode)}
                title={t(VIEW_MODE_ICONS[mode].key)}
                type="button"
              >
                {VIEW_MODE_ICONS[mode].icon}
              </button>
            ))}
          </div>
        </div>
      </div>

      {showBatchControls && selectedCount > 0 && (
        <div className="svm-batch-controls">
          <span className="svm-batch-info">{t("workspace.nSelected", { count: String(selectedCount) })}</span>
          <div className="svm-batch-actions">
            <button className="svm-batch-btn" onClick={handleBatchOpen} type="button">
              {t("workspace.openAll", { count: String(selectedCount) })}
            </button>
            <button className="svm-batch-btn svm-batch-btn--secondary" onClick={() => setSelectedSegments(new Set())} type="button">
              {t("action.clear")}
            </button>
          </div>
        </div>
      )}

      {showSearch && (
        <input
          className="svm-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("workspace.searchSegments")}
        />
      )}

      {viewMode === "carousel" ? (
        <CarouselView
          items={filtered.map((seg): CarouselItem => ({
            id: seg.id,
            title: seg.title || `Segment ${seg.id}`,
            content: seg.content || "",
            icon: "🧩",
            subtitle: seg.mode ? `${seg.mode}${seg.orderIndex !== undefined ? ` • #${seg.orderIndex + 1}` : ""}` : undefined,
          }))}
          onPick={(item) => {
            const seg = filtered.find((s) => String(s.id) === String(item.id));
            if (seg) onPick(seg);
          }}
          onAction={(item, action) => {
            const seg = filtered.find((s) => String(s.id) === String(item.id));
            if (!seg) return;
            if (action === "pin" && onPin) onPin(seg);
            if (action === "export" && onExport) onExport(seg);
          }}
          actions={[
            ...(onPin ? [{ label: t("action.pin"), icon: "📌", key: "pin" }] : []),
            ...(onExport ? [{ label: t("action.export"), icon: "⬇", key: "export" }] : []),
          ]}
          cardMinWidth={240}
          cardMaxHeight="785px"
          emptyMessage={t("workspace.noSegments")}
        />
      ) : (
        <div className={`svm-items svm-items--${viewMode}`}>
          {filtered.length > 0 ? (
            filtered.map((seg) => renderSegmentItem(seg))
          ) : (
            <div className="svm-empty">{t("workspace.noSegments")}</div>
          )}
        </div>
      )}

      <style>{`
        .svm-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 16px;
          background: linear-gradient(145deg, rgba(20, 24, 36, 0.9) 0%, rgba(12, 16, 24, 0.95) 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          backdrop-filter: blur(16px);
        }

        .svm-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .svm-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .svm-title-text {
          font-size: 14px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.95);
        }

        .svm-count {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.25) 100%);
          color: rgba(255, 255, 255, 0.95);
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .svm-header-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .svm-view-modes {
          display: flex;
          gap: 2px;
          background: rgba(255, 255, 255, 0.05);
          padding: 3px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .svm-view-btn {
          width: 32px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          border-radius: 7px;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .svm-view-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.9);
        }

        .svm-view-btn--active {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.4) 0%, rgba(139, 92, 246, 0.35) 100%);
          color: rgba(255, 255, 255, 1);
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
        }

        .svm-batch-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%);
          border: 1px solid rgba(99, 102, 241, 0.3);
          border-radius: 10px;
        }

        .svm-batch-info {
          font-size: 13px;
          color: rgba(139, 92, 246, 0.95);
          font-weight: 500;
        }

        .svm-batch-actions {
          display: flex;
          gap: 8px;
        }

        .svm-batch-btn {
          padding: 6px 14px;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.25) 100%);
          border: 1px solid rgba(99, 102, 241, 0.4);
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.95);
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .svm-batch-btn:hover {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.4) 0%, rgba(139, 92, 246, 0.35) 100%);
          transform: translateY(-1px);
        }

        .svm-batch-btn--secondary {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .svm-search {
          width: 100%;
          padding: 10px 14px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          color: rgba(255, 255, 255, 0.95);
          font-size: 13px;
          transition: all 0.2s ease;
        }

        .svm-search:focus {
          outline: none;
          border-color: rgba(99, 102, 241, 0.5);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
        }

        .svm-search::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        /* Items Container Layouts */
        .svm-items {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          max-height: none;
          overflow-y: auto;
          padding-right: 4px;
          align-items: start;
        }

        .svm-items::-webkit-scrollbar {
          width: 6px;
        }

        .svm-items::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }

        .svm-items::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.4);
          border-radius: 3px;
        }

        .svm-items--list {
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .svm-items--tiles {
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }

        .svm-items--grid {
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .svm-items--cards {
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }

        .svm-items--compact {
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        /* Item Styles */
        .svm-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 14px;
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: grab;
        }

        .svm-item:hover {
          background: linear-gradient(145deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%);
          border-color: rgba(99, 102, 241, 0.35);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        }

        .svm-item--selected {
          background: linear-gradient(145deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.15) 100%);
          border-color: rgba(99, 102, 241, 0.5);
        }

        .svm-item--compact {
          padding: 8px 12px;
          border-radius: 8px;
        }

        .svm-item--tiles {
          flex-direction: column;
          padding: 14px;
        }

        .svm-item--cards {
          flex-direction: column;
          padding: 16px;
          border-radius: 14px;
        }

        .svm-item--grid {
          flex-direction: column;
          padding: 10px;
          border-radius: 10px;
        }

        .svm-checkbox {
          flex-shrink: 0;
        }

        .svm-checkbox input {
          width: 16px;
          height: 16px;
          accent-color: rgba(99, 102, 241, 0.8);
          cursor: pointer;
        }

        .svm-content {
          flex: 1;
          min-width: 0;
          background: none;
          border: none;
          padding: 0;
          text-align: left;
          cursor: pointer;
          color: inherit;
        }

        .svm-title {
          font-size: 13px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.95);
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .svm-item--cards .svm-title,
        .svm-item--tiles .svm-title {
          white-space: normal;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .svm-snippet {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.4;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .svm-item--cards .svm-snippet {
          -webkit-line-clamp: 4;
        }

        .svm-item--compact .svm-title {
          margin-bottom: 0;
        }

        .svm-meta {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }

        .svm-mode-badge {
          padding: 3px 8px;
          background: rgba(16, 185, 129, 0.2);
          border: 1px solid rgba(16, 185, 129, 0.4);
          border-radius: 6px;
          font-size: 10px;
          font-weight: 500;
          color: rgba(16, 185, 129, 0.95);
          text-transform: uppercase;
        }

        .svm-order {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
        }

        .svm-actions {
          display: flex;
          gap: 4px;
          flex-shrink: 0;
        }

        .svm-item--tiles .svm-actions,
        .svm-item--cards .svm-actions,
        .svm-item--grid .svm-actions {
          margin-top: 8px;
          width: 100%;
          justify-content: flex-end;
        }

        .svm-action-btn {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s ease;
        }

        .svm-action-btn:hover {
          background: rgba(99, 102, 241, 0.2);
          border-color: rgba(99, 102, 241, 0.4);
          color: rgba(255, 255, 255, 0.95);
          transform: scale(1.1);
        }

        .svm-empty {
          text-align: center;
          padding: 32px 16px;
          color: rgba(255, 255, 255, 0.5);
          font-size: 13px;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .svm-items--tiles,
          .svm-items--cards {
            grid-template-columns: 1fr;
          }
          
          .svm-items--grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        /* =========================================================
           LIGHT MODE OVERRIDES
           ========================================================= */
        html[data-theme="light"] .svm-container {
          background: #ffffff !important;
          border-color: rgba(47, 41, 65, 0.12) !important;
        }

        html[data-theme="light"] .svm-title-text {
          color: #2f2941 !important;
        }

        html[data-theme="light"] .svm-count {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.12) 100%) !important;
          color: #2f2941 !important;
        }

        html[data-theme="light"] .svm-view-modes {
          background: rgba(47, 41, 65, 0.05) !important;
          border-color: rgba(47, 41, 65, 0.1) !important;
        }

        html[data-theme="light"] .svm-view-btn {
          color: rgba(47, 41, 65, 0.6) !important;
        }

        html[data-theme="light"] .svm-view-btn:hover {
          background: rgba(47, 41, 65, 0.1) !important;
          color: #2f2941 !important;
        }

        html[data-theme="light"] .svm-view-btn--active {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.15) 100%) !important;
          color: #6366f1 !important;
        }

        html[data-theme="light"] .svm-batch-controls {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%) !important;
          border-color: rgba(99, 102, 241, 0.2) !important;
        }

        html[data-theme="light"] .svm-batch-info {
          color: #6366f1 !important;
        }

        html[data-theme="light"] .svm-batch-btn {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%) !important;
          border-color: rgba(99, 102, 241, 0.25) !important;
          color: #2f2941 !important;
        }

        html[data-theme="light"] .svm-batch-btn--secondary {
          background: rgba(47, 41, 65, 0.05) !important;
          border-color: rgba(47, 41, 65, 0.15) !important;
        }

        html[data-theme="light"] .svm-search {
          background: #ffffff !important;
          border-color: rgba(47, 41, 65, 0.15) !important;
          color: #2f2941 !important;
        }

        html[data-theme="light"] .svm-search::placeholder {
          color: rgba(47, 41, 65, 0.4) !important;
        }

        html[data-theme="light"] .svm-search:focus {
          border-color: rgba(99, 102, 241, 0.5) !important;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1) !important;
        }

        html[data-theme="light"] .svm-items::-webkit-scrollbar-track {
          background: rgba(47, 41, 65, 0.05) !important;
        }

        html[data-theme="light"] .svm-item {
          background: #ffffff !important;
          border-color: rgba(47, 41, 65, 0.1) !important;
        }

        html[data-theme="light"] .svm-item:hover {
          background: linear-gradient(145deg, rgba(99, 102, 241, 0.06) 0%, rgba(139, 92, 246, 0.04) 100%) !important;
          border-color: rgba(99, 102, 241, 0.25) !important;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08) !important;
        }

        html[data-theme="light"] .svm-item--selected {
          background: linear-gradient(145deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.06) 100%) !important;
          border-color: rgba(99, 102, 241, 0.35) !important;
        }

        html[data-theme="light"] .svm-title {
          color: #2f2941 !important;
        }

        html[data-theme="light"] .svm-snippet {
          color: rgba(47, 41, 65, 0.65) !important;
        }

        html[data-theme="light"] .svm-order {
          color: rgba(47, 41, 65, 0.5) !important;
        }

        html[data-theme="light"] .svm-action-btn {
          background: rgba(47, 41, 65, 0.05) !important;
          border-color: rgba(47, 41, 65, 0.1) !important;
          color: rgba(47, 41, 65, 0.7) !important;
        }

        html[data-theme="light"] .svm-action-btn:hover {
          background: rgba(99, 102, 241, 0.1) !important;
          border-color: rgba(99, 102, 241, 0.3) !important;
          color: #6366f1 !important;
        }

        html[data-theme="light"] .svm-empty {
          color: rgba(47, 41, 65, 0.5) !important;
        }
      `}</style>
    </div>
  );
}

export default SegmentViewModes;
