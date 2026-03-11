import { useLanguage } from "../../../context/LanguageContext";
import { useTheme } from "../../../context/ThemeContext";
import { useIsMobile } from "../../../hooks/use-mobile";
import { CarouselView } from "../../../components/CarouselView";
import { Carousel3DView } from "../../../components/Carousel3DView";
import { SlotsGrid } from "./SlotsGrid";
import { ComparePanel } from "./ComparePanel";
import { WorkspaceStatsBar } from "./WorkspaceStatsBar";
import { createSharedStyles } from "../styles/workspaceStyles";
import type { Slot, Pending } from "../types";

type SlotsViewMode = "grid" | "carousel" | "carousel3d";

interface SlotsGridSectionProps {
  slots: Slot[];
  lockedSlots: Set<string>;
  pending: Pending | null;
  slotsViewMode: SlotsViewMode;
  setSlotsViewMode: (mode: SlotsViewMode) => void;
  setSlotsCarouselFloated: (floated: boolean) => void;
  // Pending mode controls
  selectMode: boolean;
  toggleSelectMode: () => void;
  manualConfirm: boolean;
  toggleManualConfirm: () => void;
  // Slot handlers
  handleClickSlot: (slotId: string) => void;
  closeSlot: (slotId: string) => void;
  onNotepadChange: (slotId: string, text: string) => void;
  openNotepadFromDoc: (title: string, text: string) => void;
  onDragStart: (type: "slot" | "floating", id: string, slotId?: string, floatingId?: string) => void;
  onDragEnd: () => void;
  onDropToSlot: (slotId: string) => void;
  placeTextIntoSlot: (slotId: string, title: string, text: string) => void;
  toggleSlotLock: (slotId: string) => void;
  renameSlot?: (slotId: string, newTitle: string) => void;
  addSlot?: () => void;
  // Compare mode
  compareMode: boolean;
  compareSlots: string[];
  setCompareSlots: (fn: (prev: string[]) => string[]) => void;
  compareLeft: Slot | null;
  compareRight: Slot | null;
  // Stats
  totalSlots: number;
  segmentsCount: number;
  pinnedCount: number;
  floatingPadsCount: number;
}

export function SlotsGridSection({
  slots,
  lockedSlots,
  pending,
  slotsViewMode,
  setSlotsViewMode,
  setSlotsCarouselFloated,
  selectMode,
  toggleSelectMode,
  manualConfirm,
  toggleManualConfirm,
  handleClickSlot,
  closeSlot,
  onNotepadChange,
  openNotepadFromDoc,
  onDragStart,
  onDragEnd,
  onDropToSlot,
  placeTextIntoSlot,
  toggleSlotLock,
  renameSlot,
  addSlot,
  compareMode,
  compareSlots,
  setCompareSlots,
  compareLeft,
  compareRight,
  totalSlots,
  segmentsCount,
  pinnedCount,
  floatingPadsCount,
}: SlotsGridSectionProps) {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const isMobile = useIsMobile();

  const sharedStyles = createSharedStyles(isDark);
  const { slotsGridContainerStyle, slotsGridHeaderStyle, viewModeButtonStyle, toggleButtonStyle } = sharedStyles;

  return (
    <div style={slotsGridContainerStyle}>
      {/* Workspace Statistics Bar */}
      <WorkspaceStatsBar
        slots={slots}
        totalSlots={totalSlots}
        segmentsCount={segmentsCount}
        pinnedCount={pinnedCount}
        floatingPadsCount={floatingPadsCount}
      />
      
      <div style={slotsGridHeaderStyle}>
        <h3
          style={{
            color: isDark ? "rgba(255,255,255,0.9)" : "#2f2941",
            fontSize: "14px",
            fontWeight: "500",
            margin: 0,
            textShadow: isDark ? "0 2px 4px rgba(0,0,0,0.3)" : "none",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flex: 1,
          }}
        >
          <span>🎯</span>
          <span>{t("workspace.activeWorkPanels")}</span>
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            className="viewModeToggleGroup"
            style={{
              display: "flex",
              gap: "4px",
              background: isDark ? "rgba(255,255,255,0.05)" : "rgba(99,102,241,0.04)",
              padding: "3px",
              borderRadius: "12px",
              border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(99,102,241,0.08)",
            }}
          >
            {(
              [
                { key: "grid" as const, label: `⊞ ${t("workspace.gridView")}` },
                { key: "carousel" as const, label: `⟷ ${t("workspace.carouselView")}` },
                { key: "carousel3d" as const, label: `◇ ${t("workspace.carousel3DView")}` },
              ] as const
            ).map((mode) => (
              <button
                key={mode.key}
                className="btn-borderless"
                onClick={() => setSlotsViewMode(mode.key)}
                style={viewModeButtonStyle(slotsViewMode === mode.key, mode.key)}
              >
                {mode.label}
              </button>
            ))}
          </div>
          {slotsViewMode !== "grid" && (
            <button
              onClick={() => setSlotsCarouselFloated(true)}
              style={{
                padding: "5px 10px",
                borderRadius: "8px",
                border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(99,102,241,0.12)",
                background: isDark ? "rgba(255,255,255,0.04)" : "rgba(99,102,241,0.04)",
                color: isDark ? "rgba(255,255,255,0.6)" : "rgba(99,102,241,0.5)",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
              title={t("workspace.openFloatedCarousel")}
            >
              ⛶
            </button>
          )}
        </div>
      </div>

      {/* Select Mode & Manual Confirm Controls - Near the 9 slots for context */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "16px",
          flexWrap: "wrap",
        }}
      >
        <button
          className="chipBtn"
          onClick={toggleSelectMode}
          style={{
            ...toggleButtonStyle(selectMode, true),
            ...(isMobile ? { padding: "4px 8px", fontSize: "11px", minWidth: "auto" } : {}),
          }}
          title={t("workspace.selectModeTitle")}
        >
          {isMobile ? (selectMode ? "✓ Sel" : "☐ Sel") : (selectMode ? t("workspace.clickSelectOn") : t("workspace.clickSelectOff"))}
        </button>
        <button
          className="chipBtn"
          onClick={toggleManualConfirm}
          style={{
            ...toggleButtonStyle(manualConfirm, true),
            ...(isMobile ? { padding: "4px 8px", fontSize: "11px", minWidth: "auto" } : {}),
          }}
          title={t("workspace.manualConfirmTitle")}
        >
          {isMobile ? (manualConfirm ? "✓ Conf" : "☐ Conf") : (manualConfirm ? t("workspace.manualConfirmOn") : t("workspace.manualConfirmOff"))}
        </button>
        {(selectMode || manualConfirm) && (
          <span
            style={{
              color: isDark ? "rgba(255,255,255,0.6)" : "rgba(99,102,241,0.5)",
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              fontStyle: "italic",
            }}
          >
            💡 {t("workspace.selectModeHint")}
          </span>
        )}
      </div>

      {slotsViewMode === "carousel" ? (
        <CarouselView
          items={slots.map((slot) => ({
            id: slot.slotId,
            title: slot.kind === "empty" ? `${slot.slotId.replace("slot", "Slot ")} (${t("workspace.empty")})` : slot.title,
            subtitle: slot.kind !== "empty" ? slot.kind : undefined,
            content: slot.kind !== "empty" ? slot.text || "" : "",
            icon: slot.kind === "doc" ? "📄" : slot.kind === "notepad" ? "📝" : "⬜",
          }))}
          onPick={(item) => handleClickSlot(String(item.id))}
          cardMinWidth={360}
          cardMaxHeight="872px"
          containerMinHeight="872px"
          showNavigation={true}
          showDots={true}
          showArrows={true}
          visibleCount={2}
        />
      ) : slotsViewMode === "carousel3d" ? (
        <Carousel3DView
          items={slots.map((slot) => ({
            id: slot.slotId,
            title: slot.kind === "empty" ? `${slot.slotId.replace("slot", "Slot ")} (${t("workspace.empty")})` : slot.title,
            subtitle: slot.kind !== "empty" ? slot.kind : undefined,
            content: slot.kind !== "empty" ? slot.text || "" : "",
            icon: slot.kind === "doc" ? "📄" : slot.kind === "notepad" ? "📝" : "⬜",
          }))}
          onPick={(item) => handleClickSlot(String(item.id))}
          onTripleClick={() => setSlotsCarouselFloated(true)}
          cardHeight="872px"
          showDots={true}
          showArrows={true}
          showNavigation={true}
          sideScale={0.72}
          sideRotation={35}
        />
      ) : (
        <SlotsGrid
          slots={slots}
          pending={pending}
          onClickSlot={handleClickSlot}
          onCloseSlot={closeSlot}
          onNotepadChange={onNotepadChange}
          onEditToNotepad={(title, text) => openNotepadFromDoc(title, text)}
          onDragStart={(slotId) => onDragStart("slot", slotId, slotId)}
          onDragEnd={onDragEnd}
          onDropToSlot={onDropToSlot}
          onDropSegment={(slotId, payload) => {
            if (lockedSlots.has(slotId)) {
              window.alert(t("workspace.slotLocked"));
              return;
            }
            placeTextIntoSlot(slotId, payload.title, payload.text);
          }}
          onToggleLock={toggleSlotLock}
          onRenameSlot={renameSlot}
          onAddSlot={addSlot}
          compareMode={compareMode}
          compareSelectedIds={compareSlots}
        />
      )}
      {compareMode && (
        <ComparePanel
          left={compareLeft}
          right={compareRight}
          onClear={() => setCompareSlots(() => [])}
          onSwap={() => setCompareSlots((prev) => (prev.length === 2 ? [prev[1], prev[0]] : prev))}
        />
      )}
    </div>
  );
}
