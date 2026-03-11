import { useLanguage } from "../../../context/LanguageContext";

type StatsPayload = {
  docs?: number;
  segments?: number;
  vectors?: number;
};

type TopbarProps = {
  title: string;
  subtitle: string;
  stats: StatsPayload | null;
  hasPending: boolean;
  onClearPending: () => void;
};

export function Topbar({
  title,
  subtitle,
  stats,
  hasPending,
  onClearPending,
}: TopbarProps) {
  const { t } = useLanguage();
  const statsText = stats
    ? t("workspace.statsText", { docs: String(stats.docs ?? "-"), segments: String(stats.segments ?? stats.vectors ?? "-") })
    : t("workspace.statsUnavailable");

  return (
    <header className="topbar page-header">
      <div className="topbarLeft">
        <div className="appTitle">{title}</div>
        <div className="appSub">
          {subtitle} • {statsText}
        </div>
      </div>
      <div className="topbarRight">
        {hasPending && (
          <button className="chipBtn chipBtnDanger" onClick={onClearPending}>
            {t("action.cancel")}
          </button>
        )}
      </div>
    </header>
  );
}
