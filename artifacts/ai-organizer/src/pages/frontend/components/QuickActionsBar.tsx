import { useLanguage } from "../../../context/LanguageContext";
import { useTheme } from "../../../context/ThemeContext";
import { useIsMobile } from "../../../hooks/use-mobile";
import { createSharedStyles, createLocalStyles } from "../styles/workspaceStyles";

interface QuickActionsBarProps {
  // Slot actions
  newFloatingNotepad: () => void;
  undoLast: () => void;
  canUndo: boolean;
  toggleStickyNotepad: () => void;
  stickyEnabled: boolean;
  // Compare mode
  compareMode: boolean;
  setCompareMode: (fn: (prev: boolean) => boolean) => void;
  compareSlots: string[];
  onOpenEnhancedCompare: () => void;
  // Shortcuts
  onShowShortcuts?: () => void;
}

export function QuickActionsBar({
  newFloatingNotepad,
  undoLast,
  canUndo,
  toggleStickyNotepad,
  stickyEnabled,
  compareMode,
  setCompareMode,
  compareSlots,
  onOpenEnhancedCompare,
  onShowShortcuts,
}: QuickActionsBarProps) {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const isMobile = useIsMobile();

  const sharedStyles = createSharedStyles(isDark);
  const { gradientPanelStyle } = sharedStyles;

  const localStyles = createLocalStyles(isDark);
  const {
    quickActionsContainerStyle,
    quickActionsButtonsStyle,
    compareHintStyle,
    primaryButtonStyle,
    secondaryButtonStyle,
    disabledSecondaryButtonStyle,
    deepCompareButtonStyle,
  } = localStyles;

  return (
    <div style={gradientPanelStyle}>
      <div style={quickActionsContainerStyle}>
        <div style={quickActionsButtonsStyle}>
          {/* Create */}
          <button
            className="btn-borderless"
            onClick={() => newFloatingNotepad()}
            style={primaryButtonStyle}
            title={t("workspace.newNotepadTitle") || "Create a new floating notepad"}
          >
            <span>📝</span>
            {!isMobile && <span>{t("workspace.newNotepad")}</span>}
          </button>

          {/* Compare toggle */}
          <button
            className="btn-borderless"
            onClick={() => setCompareMode((prev) => !prev)}
            style={
              compareMode
                ? {
                    ...primaryButtonStyle,
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    boxShadow: "0 2px 8px rgba(16, 185, 129, 0.4)",
                  }
                : primaryButtonStyle
            }
            title={t("workspace.compareTitle") || "Compare two slots side by side"}
          >
            <span>⚖️</span>
            {!isMobile && <span>{compareMode ? t("workspace.comparing") : t("workspace.compare")}</span>}
          </button>

          {/* Undo (single instance — was duplicated before) */}
          <button
            className="btn-borderless"
            onClick={undoLast}
            disabled={!canUndo}
            style={!canUndo ? disabledSecondaryButtonStyle : secondaryButtonStyle}
            title={t("workspace.undoTitle") || "Undo last slot action"}
          >
            <span>↩️</span>
            {!isMobile && <span>{t("workspace.undo")}</span>}
          </button>

          {/* Pin/Float toggle (single instance — was duplicated before) */}
          <button
            className="btn-borderless"
            onClick={toggleStickyNotepad}
            style={
              stickyEnabled
                ? {
                    ...secondaryButtonStyle,
                    background: "linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                  }
                : secondaryButtonStyle
            }
            title={t("workspace.pinAllTitle") || "Pin all floating notepads to slots"}
          >
            <span>📌</span>
            {!isMobile && <span>{stickyEnabled ? t("workspace.pinned") : t("workspace.pinAll")}</span>}
          </button>

          {/* Deep compare - only shows when 2 slots selected */}
          {compareMode && compareSlots.length >= 2 && (
            <button
              className="btn-borderless"
              onClick={onOpenEnhancedCompare}
              style={deepCompareButtonStyle}
              title={t("workspace.deepCompareTitle") || "Open detailed side-by-side comparison"}
            >
              <span>🔬</span>
              {!isMobile && <span>{t("workspace.deepCompare")}</span>}
            </button>
          )}

          {/* Keyboard shortcuts help */}
          {onShowShortcuts && (
            <button
              className="btn-borderless"
              onClick={onShowShortcuts}
              style={secondaryButtonStyle}
              title={t("workspace.keyboardShortcuts") || "Keyboard Shortcuts (Ctrl+/)"}
            >
              <span>⌨️</span>
              {!isMobile && <span>{t("workspace.shortcuts") || "Shortcuts"}</span>}
            </button>
          )}
        </div>

        {/* Compare mode hint */}
        {compareMode && compareSlots.length < 2 && (
          <span
            style={{
              ...compareHintStyle,
              animation: "pulse 2s infinite",
            }}
          >
            💡 {t("workspace.compareHint") || `Select ${2 - compareSlots.length} slot(s) to compare`}
          </span>
        )}
      </div>
    </div>
  );
}
