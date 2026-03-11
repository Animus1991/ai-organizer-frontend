import React from "react";
import type { Pending } from "../types";
import { formatScore } from "../utils/text";
import { useLanguage } from "../../../context/LanguageContext";

type PendingBarProps = {
  pendingHit: Pending | null;
  pendingSegment?: { id: string; title: string } | null;
  manualConfirm?: boolean;
};

export function PendingBar({ pendingHit, pendingSegment, manualConfirm }: PendingBarProps) {
  const { t } = useLanguage();
  if (!pendingHit && !pendingSegment) return null;
  const title = pendingHit ? pendingHit.hit.title : pendingSegment?.title;
  const score = pendingHit ? pendingHit.hit.score : null;
  return (
    <div className="pendingBar">
      <div className="pendingDot" />
      <div className="pendingText">
        {t("workspace.pendingLabel", { title: title || "" })}
        {pendingHit && <span className="scorePill">{formatScore(score)}</span>}
      </div>
      <div className="pendingHint">
        {t("workspace.pendingHint")}
        {manualConfirm ? " " + t("workspace.manualConfirmActive") : ""}
      </div>
    </div>
  );
}
