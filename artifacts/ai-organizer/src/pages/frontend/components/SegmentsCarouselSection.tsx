import { useLanguage } from "../../../context/LanguageContext";
import { useTheme } from "../../../context/ThemeContext";
import { CarouselView } from "../../../components/CarouselView";
import { Carousel3DView } from "../../../components/Carousel3DView";
import { createSharedStyles, createLocalStyles } from "../styles/workspaceStyles";

const flexCenterGap8 = { display: 'flex' as const, alignItems: 'center' as const, gap: '8px' };
const flexCenterJustifyBetween = { display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const };
import type { SegmentRow } from "../../../hooks/home/useHomeState";

type SegViewMode = "carousel3d" | "carousel" | "grid";

interface SegmentsCarouselSectionProps {
  segments: SegmentRow[];
  segViewMode: SegViewMode;
  setSegViewMode: (mode: SegViewMode) => void;
  setSegCarouselFloated: (floated: boolean) => void;
  setSegSlotDialog: (segment: SegmentRow | null) => void;
  setSegPreviewModal: (segment: SegmentRow | null) => void;
}

export function SegmentsCarouselSection({
  segments,
  segViewMode,
  setSegViewMode,
  setSegCarouselFloated,
  setSegSlotDialog,
  setSegPreviewModal,
}: SegmentsCarouselSectionProps) {
  const { t } = useLanguage();
  const { isDark } = useTheme();

  const sharedStyles = createSharedStyles(isDark);
  const {
    segmentsCarouselContainerStyle,
    segViewModeButtonStyle,
    segmentCardStyle,
    segmentCardHeaderStyle,
    segmentCardTitleStyle,
    segmentCardCategoryBadgeStyle,
    segmentCardSummaryStyle,
    segmentCardFooterStyle,
    segmentCardDateStyle,
    segmentCardActionButtonStyle,
  } = sharedStyles;

  const localStyles = createLocalStyles(isDark);
  const { floatingCarouselButtonBaseStyle } = localStyles;

  if (segments.length === 0) return null;

  return (
    <div style={segmentsCarouselContainerStyle}>
      <div
        style={{
          ...flexCenterJustifyBetween,
          marginBottom: "12px",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <span
          style={{
            fontSize: "13px",
            fontWeight: 600,
            letterSpacing: "-0.01em",
            color: isDark ? "rgba(255,255,255,0.85)" : "#2f2941",
          }}
        >
          {t("workspace.segmentsCarousel")}
        </span>
        <span
          style={{
            fontSize: "11px",
            color: isDark ? "rgba(255,255,255,0.45)" : "rgba(99,102,241,0.45)",
            background: isDark ? "rgba(255,255,255,0.06)" : "rgba(99,102,241,0.06)",
            padding: "2px 8px",
            borderRadius: "999px",
            fontWeight: 600,
          }}
        >
          {segments.length} {t("workspace.segments")}
        </span>
      </div>
      <div style={flexCenterGap8}>
        <div
          style={{
            display: "flex",
            gap: "4px",
            background: isDark ? "rgba(255,255,255,0.05)" : "rgba(99,102,241,0.04)",
            padding: "3px",
            borderRadius: "10px",
            border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(99,102,241,0.08)",
          }}
        >
          <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
            <button
              onClick={() => setSegViewMode("carousel3d")}
              className={`viewModeBtn ${segViewMode === "carousel3d" ? "active" : ""}`}
              title="3D Carousel"
              style={segViewModeButtonStyle(segViewMode === "carousel3d")}
            >
              3D
            </button>
            <button
              onClick={() => setSegViewMode("carousel")}
              className={`viewModeBtn ${segViewMode === "carousel" ? "active" : ""}`}
              title="2D Carousel"
              style={segViewModeButtonStyle(segViewMode === "carousel")}
            >
              2D
            </button>
            <button
              onClick={() => setSegViewMode("grid")}
              className={`viewModeBtn ${segViewMode === "grid" ? "active" : ""}`}
              title="Grid View"
              style={segViewModeButtonStyle(segViewMode === "grid")}
            >
              Grid
            </button>
          </div>
        </div>
        <button
          onClick={() => setSegCarouselFloated(true)}
          style={{
            ...floatingCarouselButtonBaseStyle,
            padding: "4px 10px",
          }}
          title={t("workspace.openFloatedCarousel")}
        >
          ⛶
        </button>
      </div>
      {segViewMode === "grid" ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "12px",
            marginTop: "12px",
          }}
        >
          {segments.map((segment) => (
            <div
              key={segment.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", JSON.stringify({ type: "segment", data: segment }));
                e.dataTransfer.effectAllowed = "copy";
              }}
              onClick={() => setSegPreviewModal(segment)}
              className="segment-card"
              style={segmentCardStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = isDark
                  ? "0 8px 24px rgba(0,0,0,0.4)"
                  : "0 8px 24px rgba(99,102,241,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={segmentCardHeaderStyle}>
                <h4 style={segmentCardTitleStyle}>{segment.title}</h4>
                <span style={segmentCardCategoryBadgeStyle}>{segment.mode}</span>
              </div>
              <p style={segmentCardSummaryStyle}>
                {segment.content.substring(0, 150) + (segment.content.length > 150 ? "..." : "")}
              </p>
              <div style={segmentCardFooterStyle}>
                <span style={segmentCardDateStyle}>
                  {segment.createdAt ? new Date(segment.createdAt).toLocaleDateString() : "No date"}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSegSlotDialog(segment);
                  }}
                  style={segmentCardActionButtonStyle}
                >
                  Place in Slot
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : segViewMode === "carousel3d" ? (
        <Carousel3DView
          items={segments.map((seg) => ({
            id: seg.id,
            title: seg.title || `Segment ${seg.id}`,
            subtitle: seg.mode || undefined,
            content: seg.content || "",
            icon: "🧩",
          }))}
          onPick={(item) => {
            const seg = segments.find((s) => s.id === item.id);
            if (seg) setSegSlotDialog(seg);
          }}
          onDoubleClick={(item) => {
            const seg = segments.find((s) => s.id === item.id);
            if (seg) setSegPreviewModal(seg);
          }}
          onTripleClick={() => setSegCarouselFloated(true)}
          cardHeight="872px"
          showDots={true}
          showArrows={true}
          showNavigation={true}
          sideScale={0.72}
          sideRotation={35}
        />
      ) : (
        <CarouselView
          items={segments.map((seg) => ({
            id: seg.id,
            title: seg.title || `Segment ${seg.id}`,
            subtitle: seg.mode || undefined,
            content: seg.content || "",
            icon: "🧩",
          }))}
          onPick={(item) => {
            const seg = segments.find((s) => s.id === item.id);
            if (seg) setSegSlotDialog(seg);
          }}
          cardMinWidth={360}
          cardMaxHeight="872px"
          containerMinHeight="872px"
          showNavigation={true}
          showDots={true}
          showArrows={true}
          visibleCount={2}
        />
      )}
    </div>
  );
}
