import React, { useMemo } from "react";
import type { Slot } from "../types";
import { useLanguage } from "../../../context/LanguageContext";

type ComparePanelProps = {
  left: Slot | null;
  right: Slot | null;
  onClear: () => void;
  onSwap: () => void;
};

const getSlotText = (slot: Slot | null) => {
  if (!slot) return "";
  if (slot.kind === "doc" || slot.kind === "notepad") return slot.text || "";
  return "";
};

const splitLines = (text: string) => text.split(/\r?\n/);

export function ComparePanel({ left, right, onClear, onSwap }: ComparePanelProps) {
  const { t } = useLanguage();
  const leftText = getSlotText(left);
  const rightText = getSlotText(right);
  const [leftLines, rightLines] = useMemo(() => {
    return [splitLines(leftText), splitLines(rightText)];
  }, [leftText, rightText]);

  const maxLines = Math.max(leftLines.length, rightLines.length);

  return (
    <div className="comparePanel">
      <div className="compareHeader">
        <div className="compareTitle">{t("workspace.compareView")}</div>
        <div className="compareActions">
          <button className="chipBtn" onClick={onSwap} type="button">
            {t("action.swap")}
          </button>
          <button className="chipBtn chipBtnDanger" onClick={onClear} type="button">
            {t("action.clear")}
          </button>
        </div>
      </div>
      <div className="compareColumns">
        <div className="compareColumn">
          <div className="compareColumnTitle">{left?.title || t("workspace.leftSlot")}</div>
          <div className="compareBody">
            {Array.from({ length: maxLines }).map((_, idx) => {
              const line = leftLines[idx] ?? "";
              const other = rightLines[idx] ?? "";
              const changed = line !== other;
              return (
                <div key={idx} className={`compareLine${changed ? " changed" : ""}`}>
                  {line || " "}
                </div>
              );
            })}
          </div>
        </div>
        <div className="compareColumn">
          <div className="compareColumnTitle">{right?.title || t("workspace.rightSlot")}</div>
          <div className="compareBody">
            {Array.from({ length: maxLines }).map((_, idx) => {
              const line = rightLines[idx] ?? "";
              const other = leftLines[idx] ?? "";
              const changed = line !== other;
              return (
                <div key={idx} className={`compareLine${changed ? " changed" : ""}`}>
                  {line || " "}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="compareHint">{t("workspace.compareHint")}</div>
    </div>
  );
}
