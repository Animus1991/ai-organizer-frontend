import { useState, useCallback } from "react";
import type { Pending, Slot } from "../types";
import { SlotCard } from "./SlotCard";
import { useTheme } from "../../../context/ThemeContext";
import { useLanguage } from "../../../context/LanguageContext";

type SlotsGridProps = {
  slots: Slot[];
  pending: Pending | null;
  onClickSlot: (slotId: string) => void;
  onCloseSlot: (slotId: string) => void;
  onNotepadChange: (slotId: string, v: string) => void;
  onEditToNotepad: (title: string, text: string) => void;
  onDragStart: (slotId: string) => void;
  onDragEnd: () => void;
  onDropToSlot: (slotId: string) => void;
  onDropSegment: (slotId: string, payload: { id: string; title: string; text: string }) => void;
  onToggleLock: (slotId: string, password?: string) => void;
  onRenameSlot?: (slotId: string, newTitle: string) => void;
  onAddSlot?: () => void;
  compareMode?: boolean;
  compareSelectedIds?: string[];
};

export function SlotsGrid({
  slots,
  pending,
  onClickSlot,
  onCloseSlot,
  onNotepadChange,
  onEditToNotepad,
  onDragStart,
  onDragEnd,
  onDropToSlot,
  onDropSegment,
  onToggleLock,
  onRenameSlot,
  onAddSlot,
  compareMode,
  compareSelectedIds,
}: SlotsGridProps) {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  
  // Track collapsed state for each slot
  const [collapsedSlots, setCollapsedSlots] = useState<Set<string>>(new Set());
  
  const toggleCollapse = useCallback((slotId: string) => {
    setCollapsedSlots((prev) => {
      const next = new Set(prev);
      if (next.has(slotId)) {
        next.delete(slotId);
      } else {
        next.add(slotId);
      }
      return next;
    });
  }, []);

  return (
    <div className="slotsGrid">
      {slots.map((slot) => (
        <SlotCard
          key={slot.slotId}
          slot={slot}
          pending={pending}
          onClickSlot={() => onClickSlot(slot.slotId)}
          onClose={() => onCloseSlot(slot.slotId)}
          onNotepadChange={(v) => onNotepadChange(slot.slotId, v)}
          onEditToNotepad={onEditToNotepad}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDropToSlot={onDropToSlot}
          onDropSegment={onDropSegment}
          onToggleLock={(password) => onToggleLock(slot.slotId, password)}
          onRenameSlot={onRenameSlot}
          compareMode={compareMode}
          compareSelected={compareSelectedIds?.includes(slot.slotId)}
          isCollapsed={collapsedSlots.has(slot.slotId)}
          onToggleCollapse={() => toggleCollapse(slot.slotId)}
        />
      ))}
      {/* Add Slot Button - appears as the last "slot" with + icon */}
      {onAddSlot && (
        <div
          className="slotCard slotAddNew"
          onClick={onAddSlot}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onAddSlot()}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            border: isDark 
              ? "2px dashed rgba(255,255,255,0.2)" 
              : "2px dashed rgba(99,102,241,0.3)",
            background: isDark 
              ? "rgba(255,255,255,0.02)" 
              : "rgba(99,102,241,0.03)",
            minHeight: "120px",
            borderRadius: "12px",
            transition: "all 0.2s ease",
          }}
          title={t("workspace.addSlot") || "Add new slot"}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              color: isDark ? "rgba(255,255,255,0.4)" : "rgba(99,102,241,0.5)",
            }}
          >
            <span
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                border: isDark 
                  ? "2px solid rgba(255,255,255,0.2)" 
                  : "2px solid rgba(99,102,241,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                fontWeight: "300",
              }}
            >
              +
            </span>
            <span style={{ fontSize: "12px", fontWeight: "500" }}>
              {t("workspace.addSlot") || "Add Slot"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
