/**
 * LabToolCardV2 - Reusable tool card with HSL tokens
 */

import { useLanguage } from "../../../context/LanguageContext";
import { toolMetaConfig } from "../config/phases";

interface Props {
  toolId: string;
  onOpen: (id: string, title: string, icon: string) => void;
}

export function LabToolCardV2({ toolId, onOpen }: Props) {
  const { t } = useLanguage();
  const meta = toolMetaConfig[toolId];
  if (!meta) return null;

  const label = t(meta.labelKey) || toolId;
  const desc = t(meta.descKey) || "";

  return (
    <button
      className="lab-tool-card"
      onClick={() => onOpen(toolId, label, meta.icon)}
      aria-label={`Open ${label} tool`}
    >
      <span className="lab-tool-card-icon">{meta.icon}</span>
      <div className="min-w-0 flex-1">
        <div className="lab-tool-card-title">{label}</div>
        <div className="lab-tool-card-desc">{desc}</div>
      </div>
      <span className="text-sm text-muted-foreground opacity-70 flex-shrink-0">→</span>
    </button>
  );
}
