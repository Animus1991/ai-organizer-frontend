import { useMemo } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import { useDocumentStatus, STATUS_CONFIG, DocumentStatus } from "../../hooks/useDocumentStatus";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { FileText, Eye, CheckCircle, Archive } from "lucide-react";

const STATUS_ICONS: Record<DocumentStatus, React.ReactNode> = {
  "draft": <FileText className="w-5 h-5" />,
  "in-review": <Eye className="w-5 h-5" />,
  "published": <CheckCircle className="w-5 h-5" />,
  "archived": <Archive className="w-5 h-5" />,
};

export function DocumentStatusGrid() {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const { statuses } = useDocumentStatus();

  const statusCounts = useMemo(() => {
    const counts: Record<DocumentStatus, number> = { "draft": 0, "in-review": 0, "published": 0, "archived": 0 };
    Object.values(statuses).forEach(s => { counts[s] = (counts[s] || 0) + 1; });
    return counts;
  }, [statuses]);

  return (
    <div className={`grid gap-4 mb-8 ${isMobile ? "grid-cols-2" : "grid-cols-4"}`}>
      {(Object.entries(STATUS_CONFIG) as [DocumentStatus, typeof STATUS_CONFIG[DocumentStatus]][]).map(([status, config], i) => (
        <div
          key={status}
          className="p-4 bg-card rounded-xl border border-border text-center shadow-sm
            transition-all duration-300 ease-out
            hover:shadow-md hover:-translate-y-1 hover:border-primary/30
            group cursor-default"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className="flex justify-center mb-1 text-muted-foreground transition-transform duration-300 group-hover:scale-110">
            {STATUS_ICONS[status]}
          </div>
          <div className="text-2xl font-bold transition-colors duration-300" style={{ color: config.color }}>{statusCounts[status]}</div>
          <div className="text-xs text-muted-foreground mt-0.5 transition-colors duration-300 group-hover:text-foreground">
            {t(config.labelKey) || config.label}
          </div>
        </div>
      ))}
    </div>
  );
}
