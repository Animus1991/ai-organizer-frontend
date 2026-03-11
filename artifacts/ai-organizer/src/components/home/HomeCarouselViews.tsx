// src/components/home/HomeCarouselViews.tsx
// Carousel views + Grid-mode tabbed view for widget items
import React, { useState } from "react";
import { Carousel3DView } from "../Carousel3DView";
import { CarouselView } from "../CarouselView";
import { getCarouselWidgetItems, getWorkspaceOverviewCard } from "../../config/homeWidgetItems";
import { useLanguage } from "../../context/LanguageContext";

export interface HomeCarouselViewsProps {
  isCompactHome: boolean;
  homeWidgetViewMode: "grid" | "carousel3d" | "carousel";
  uploads: any[];
  uploadsList: any[];
  documentId: number | null;
  recentlyViewedDocs: number[];
  userEmail: string | null;
  parsedCount: number;
  pendingCount: number;
  failedCount: number;
  totalSegments: number;
  totalStorageBytes: number;
  onUploadClick: () => void;
  onSearchClick: () => void;
  onLibraryClick: () => void;
  onResearchClick: () => void;
  onCarouselWidgetClick: (item: { id: string | number; title?: string; icon?: string }) => void;
}

export const HomeCarouselViews: React.FC<HomeCarouselViewsProps> = ({
  isCompactHome,
  homeWidgetViewMode,
  uploads,
  uploadsList,
  documentId,
  recentlyViewedDocs,
  userEmail,
  parsedCount,
  pendingCount,
  failedCount,
  totalSegments,
  totalStorageBytes,
  onUploadClick,
  onSearchClick,
  onLibraryClick,
  onResearchClick,
  onCarouselWidgetClick,
}) => {
  const { t } = useLanguage();
  const [activeGridTab, setActiveGridTab] = useState(0);

  const overviewCard = getWorkspaceOverviewCard({
    t, uploadsList, parsedCount, pendingCount, failedCount, totalSegments, totalStorageBytes,
    onUploadClick, onSearchClick, onLibraryClick, onResearchClick,
  });

  const expandedItems = [
    overviewCard,
    ...getCarouselWidgetItems({ t, uploads, documentId, recentlyViewedDocs, userEmail, compact: false }),
  ];

  const compactItems = getCarouselWidgetItems({ t, uploads, documentId, recentlyViewedDocs, userEmail, compact: true });

  const gridItems = isCompactHome ? compactItems : expandedItems;

  // Grid mode → tabbed widget view
  if (homeWidgetViewMode === "grid") {
    if (gridItems.length === 0) return null;

    return (
      <div style={{ marginBottom: '24px' }}>
        {/* Tab bar */}
        <div
          className="flex gap-0 overflow-x-auto scrollbar-hide"
          style={{
            borderBottom: "1px solid hsl(var(--border))",
            marginBottom: "16px",
          }}
        >
          {gridItems.map((item, i) => (
            <button
              key={item.id}
              onClick={() => setActiveGridTab(i)}
              style={{
                padding: "8px 14px",
                fontSize: "12px",
                fontWeight: activeGridTab === i ? 600 : 500,
                color: activeGridTab === i ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                background: "transparent",
                border: "none",
                borderBottom: activeGridTab === i ? "2px solid hsl(var(--primary))" : "2px solid transparent",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {item.icon && <span style={{ fontSize: "13px" }}>{item.icon}</span>}
              <span>{item.title || `Widget ${i + 1}`}</span>
            </button>
          ))}
        </div>
        {/* Active tab content */}
        <div
          style={{
            minHeight: "200px",
            borderRadius: "var(--radius)",
            background: "hsl(var(--card) / 0.5)",
            border: "1px solid hsl(var(--border))",
            padding: "16px",
            transition: "opacity 0.2s ease",
          }}
        >
          {gridItems[activeGridTab]?.renderCard?.() || (
            <div style={{ color: "hsl(var(--muted-foreground))", textAlign: "center", padding: "32px" }}>
              {gridItems[activeGridTab]?.title || "No content"}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 3D Carousel View - expanded */}
      {!isCompactHome && homeWidgetViewMode === "carousel3d" && (
        <div style={{ marginBottom: '32px' }}>
          <Carousel3DView
            items={expandedItems}
            onPick={onCarouselWidgetClick}
            cardHeight="calc(89vh - 80px)"
            showDots={true}
            showArrows={true}
            showNavigation={true}
            sideScale={0.75}
            sideRotation={30}
          />
        </div>
      )}

      {/* Regular Carousel View - expanded */}
      {!isCompactHome && homeWidgetViewMode === "carousel" && (
        <div style={{ marginBottom: '32px' }}>
          <CarouselView
            items={expandedItems}
            onPick={onCarouselWidgetClick}
            cardMinWidth={500}
            cardMaxHeight="calc(80vh - 80px)"
            showNavigation={true}
            showDots={true}
            showArrows={true}
            visibleCount={1}
          />
        </div>
      )}

      {/* 3D Carousel View - compact */}
      {isCompactHome && homeWidgetViewMode === "carousel3d" && (
        <div style={{ marginBottom: '32px' }}>
          <Carousel3DView
            items={compactItems}
            onPick={onCarouselWidgetClick}
            cardHeight="calc(82vh - 60px)"
            showDots={true}
            showArrows={true}
            showNavigation={true}
            sideScale={0.75}
            sideRotation={30}
          />
        </div>
      )}

      {/* Regular Carousel View - compact */}
      {isCompactHome && homeWidgetViewMode === "carousel" && (
        <div style={{ marginBottom: '32px' }}>
          <CarouselView
            items={compactItems}
            onPick={onCarouselWidgetClick}
            cardMinWidth={400}
            cardMaxHeight="calc(70vh - 60px)"
            showNavigation={true}
            showDots={true}
            showArrows={true}
            visibleCount={1}
          />
        </div>
      )}
    </>
  );
};
