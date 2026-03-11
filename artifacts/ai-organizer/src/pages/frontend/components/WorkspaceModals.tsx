import { useLanguage } from "../../../context/LanguageContext";
import { useTheme } from "../../../context/ThemeContext";
import { CarouselView } from "../../../components/CarouselView";
import { createSharedStyles } from "../styles/workspaceStyles";
import type { SegmentRow } from "../../../hooks/home/useHomeState";

interface SlotItem {
  slotId: string;
  kind: string;
  title: string;
  text?: string;
}

interface WorkspaceModalsProps {
  segSlotDialog: SegmentRow | null;
  setSegSlotDialog: (val: SegmentRow | null) => void;
  segPreviewModal: SegmentRow | null;
  setSegPreviewModal: (val: SegmentRow | null) => void;
  slotsCarouselFloated: boolean;
  setSlotsCarouselFloated: (val: boolean) => void;
  segCarouselFloated: boolean;
  setSegCarouselFloated: (val: boolean) => void;
  slots: SlotItem[];
  lockedSlots: Set<string>;
  segments: SegmentRow[];
  placeTextIntoSlot: (slotId: string, title: string, content: string) => void;
  smartOpenText: (title: string, content: string) => void;
}

export function WorkspaceModals({
  segSlotDialog,
  setSegSlotDialog,
  segPreviewModal,
  setSegPreviewModal,
  slotsCarouselFloated,
  setSlotsCarouselFloated,
  segCarouselFloated,
  setSegCarouselFloated,
  slots,
  lockedSlots,
  segments,
  placeTextIntoSlot,
  smartOpenText,
}: WorkspaceModalsProps) {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const sharedStyles = createSharedStyles(isDark);
  const { modalOverlayStyle, modalContentStyle, modalHeaderStyle, modalBackdropMedium, modalFooterStyle, floatedOverlayStyle, floatedPanelStyle, floatedHeadingStyle } = sharedStyles;

  return (
    <>
      {/* Segment Slot Placement Dialog */}
      {segSlotDialog && (
        <div style={modalOverlayStyle} onClick={() => setSegSlotDialog(null)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 24 }}>🧩</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "hsl(var(--foreground))", marginBottom: 2 }}>
                  {segSlotDialog.title || `Segment ${segSlotDialog.id}`}
                </div>
                <div style={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }}>
                  {segSlotDialog.mode} · {(segSlotDialog.content || "").length} {t("workspace.characters")}
                </div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: "hsl(var(--muted-foreground))", lineHeight: 1.6, maxHeight: 100, overflow: "hidden", marginBottom: 20, display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical" as const }}>
              {(segSlotDialog.content || "").slice(0, 250)}{(segSlotDialog.content || "").length > 250 ? "…" : ""}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "hsl(var(--foreground))", marginBottom: 12 }}>
              {t("workspace.openInSlotQuestion")}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {slots.filter(s => s.kind === "empty" && !lockedSlots.has(s.slotId)).map((slot) => (
                <button
                  key={slot.slotId}
                  type="button"
                  className="chipBtn"
                  onClick={() => { placeTextIntoSlot(slot.slotId, segSlotDialog.title || `Segment ${segSlotDialog.id}`, segSlotDialog.content || ""); setSegSlotDialog(null); }}
                >
                  {slot.slotId.replace("slot", "Slot ")}
                </button>
              ))}
              {slots.filter(s => s.kind === "empty" && !lockedSlots.has(s.slotId)).length === 0 && (
                <div style={{ color: "hsl(var(--muted-foreground))", fontSize: 13, fontStyle: "italic" }}>
                  {t("workspace.noAvailableSlots")}
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                type="button"
                className="chipBtn"
                onClick={() => { smartOpenText(segSlotDialog.title || `Segment ${segSlotDialog.id}`, segSlotDialog.content || ""); setSegSlotDialog(null); }}
                style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", border: "none" }}
              >
                {t("workspace.autoPlace")}
              </button>
              <button type="button" className="chipBtn" onClick={() => setSegSlotDialog(null)}>
                {t("action.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Segment Full Content Preview */}
      {segPreviewModal && (
        <div style={{ ...modalOverlayStyle, ...modalBackdropMedium }} onClick={() => setSegPreviewModal(null)}>
          <div
            style={{
              background: "hsl(var(--card))",
              border: "2px solid hsl(var(--border))",
              borderRadius: 24,
              maxWidth: 720,
              width: "92vw",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 32px 100px hsl(var(--foreground) / 0.1)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={modalHeaderStyle}>
              <span style={{ fontSize: 28 }}>🧩</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "hsl(var(--foreground))" }}>
                  {segPreviewModal.title || `Segment ${segPreviewModal.id}`}
                </div>
                <div style={{ fontSize: 12, color: "hsl(var(--muted-foreground))", marginTop: 2 }}>
                  {segPreviewModal.mode} · {(segPreviewModal.content || "").length} {t("workspace.characters")}
                </div>
              </div>
              <button type="button" className="chipBtn" onClick={() => setSegPreviewModal(null)}>×</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 16, fontSize: 14, color: "hsl(var(--foreground))", lineHeight: 1.75, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {segPreviewModal.content || ""}
            </div>
            <div style={modalFooterStyle}>
              <div style={{ fontSize: 12, color: "hsl(var(--muted-foreground))", fontStyle: "italic" }}>
                {t("workspace.pressEscToClose")}
              </div>
              <button
                type="button"
                className="chipBtn"
                onClick={() => { const current = segPreviewModal; setSegPreviewModal(null); setSegSlotDialog(current); }}
              >
                📥 {t("workspace.openInSlot") || "Open in Slot"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floated Slots Carousel */}
      {slotsCarouselFloated && slots.filter(s => s.kind !== "empty").length > 0 && (
        <div style={floatedOverlayStyle} onClick={() => setSlotsCarouselFloated(false)}>
          <div style={floatedPanelStyle()} onClick={(e) => e.stopPropagation()}>
            <h3 style={floatedHeadingStyle}>{t("workspace.floatedSlotsCarousel")}</h3>
            <CarouselView
              items={slots.filter(s => s.kind !== "empty").map((slot) => ({
                id: `slot-${slot.slotId}`,
                title: `${t("workspace.slot")} ${slot.slotId}`,
                subtitle: (slot.text || "").substring(0, 100) + "...",
                content: slot.text || "",
                icon: "📋",
              }))}
              onPick={() => {}}
            />
          </div>
        </div>
      )}

      {/* Floated Segments Carousel */}
      {segCarouselFloated && segments.length > 0 && (
        <div style={floatedOverlayStyle} onClick={() => setSegCarouselFloated(false)}>
          <div style={floatedPanelStyle()} onClick={(e) => e.stopPropagation()}>
            <h3 style={floatedHeadingStyle}>{t("workspace.floatedSegmentsCarousel")}</h3>
            <CarouselView
              items={segments.map((segment) => ({
                id: `segment-${segment.id}`,
                title: segment.title || t("workspace.untitledSegment"),
                subtitle: segment.content.substring(0, 100) + "...",
                content: segment.content,
                icon: "🧩",
              }))}
              onPick={() => {}}
            />
          </div>
        </div>
      )}
    </>
  );
}
