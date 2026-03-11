import { useLanguage } from "../../../context/LanguageContext";
import type { Slot } from "../types";

interface WorkspaceStatsBarProps {
  slots: Slot[];
  totalSlots: number;
  segmentsCount: number;
  pinnedCount: number;
  floatingPadsCount: number;
}

export function WorkspaceStatsBar({
  slots,
  totalSlots,
  segmentsCount,
  pinnedCount,
  floatingPadsCount,
}: WorkspaceStatsBarProps) {
  const { t } = useLanguage();

  const filledSlots = slots.filter((s) => s.kind !== "empty").length;
  const docSlots = slots.filter((s) => s.kind === "doc").length;
  const notepadSlots = slots.filter((s) => s.kind === "notepad").length;
  const totalWords = slots
    .filter((s) => s.kind !== "empty")
    .reduce((sum, s) => sum + ((s as any).text || "").split(/\s+/).filter(Boolean).length, 0);

  const stats = [
    { icon: "📊", label: t("workspace.stats.filledSlots") || "Active", value: `${filledSlots}/${totalSlots}` },
    { icon: "📄", label: t("workspace.stats.documents") || "Docs", value: docSlots },
    { icon: "📝", label: t("workspace.stats.notepads") || "Pads", value: notepadSlots + floatingPadsCount },
    { icon: "📖", label: t("workspace.stats.totalWords") || "Words", value: totalWords.toLocaleString() },
  ];

  return (
    <div
      className="workspaceStatsBar"
      style={{
        display: "flex",
        gap: 12,
        padding: "10px 16px",
        background: "hsl(var(--card) / 0.8)",
        borderRadius: 14,
        border: "1px solid hsl(var(--border) / 0.5)",
        marginBottom: 16,
        flexWrap: "wrap",
        justifyContent: "space-between",
      }}
    >
      {stats.map((stat, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 12px",
            background: "hsl(var(--muted) / 0.3)",
            borderRadius: 10,
            border: "1px solid hsl(var(--border) / 0.3)",
            minWidth: 90,
            flex: "1 1 auto",
          }}
        >
          <span style={{ fontSize: 16 }}>{stat.icon}</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "hsl(var(--primary))", lineHeight: 1 }}>
              {stat.value}
            </span>
            <span style={{ fontSize: 10, fontWeight: 500, color: "hsl(var(--muted-foreground))", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {stat.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
