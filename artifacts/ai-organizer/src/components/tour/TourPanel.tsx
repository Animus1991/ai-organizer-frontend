import "../UniversalTourGuide.css";
import { useLanguage } from "../../context/LanguageContext";
import type { TourPopoverPos, TourStep } from "./useTour";

type TourPanelProps = {
  open: boolean;
  popoverPos: TourPopoverPos | null;
  stepIndex: number;
  steps: TourStep[];
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
};

export function TourPanel({
  open,
  popoverPos,
  stepIndex,
  steps,
  onClose,
  onNext,
  onPrev,
}: TourPanelProps) {
  if (!open) return null;
  const { t } = useLanguage();
  const step = steps[stepIndex] || steps[0];

  // Calculate position for the tooltip
  const getPosition = () => {
    if (!popoverPos) {
      // Center on screen
      return {
        top: Math.max(60, (window.innerHeight - 260) / 2),
        left: Math.max(20, (window.innerWidth - 450) / 2),
      };
    }
    return {
      top: Math.max(60, Math.min(popoverPos.top + 20, window.innerHeight - 300)),
      left: Math.max(20, Math.min(popoverPos.left, window.innerWidth - 470)),
    };
  };

  const pos = getPosition();

  return (
    <div className="tourOverlay">
      <div
        className="tourTooltip"
        style={{
          top: pos.top,
          left: pos.left,
          zIndex: 1000001,
          position: "fixed",
        }}
      >
        <div className="tourTooltipHeader">
          <div className="tourTooltipTitle">{step?.title}</div>
          <div className="tourTooltipHeaderControls">
            <button className="tourTooltipClose" onClick={onClose}>
              ×
            </button>
          </div>
        </div>

        <div className="tourTooltipContent">
          {step?.body}
        </div>

        <div className="tourTooltipActions">
          <div className="tourTooltipProgress">
            {stepIndex + 1} / {steps.length}
          </div>

          <div className="tourTooltipButtons">
            {stepIndex > 0 && (
              <button
                className="tourTooltipBtn tourTooltipBtnSecondary"
                onClick={onPrev}
              >
                ← {t("tour.btn.previous") || "Previous"}
              </button>
            )}

            <button
              className="tourTooltipBtn tourTooltipBtnSkip"
              onClick={onClose}
            >
              {t("tour.btn.skip") || "Skip Tour"}
            </button>

            <button
              className="tourTooltipBtn tourTooltipBtnPrimary"
              onClick={onNext}
            >
              {stepIndex >= steps.length - 1
                ? (t("tour.btn.finish") || "Finish")
                : (t("tour.btn.next") || "Next")} →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
