import { memo, useMemo } from "react";
import { useIsMobile } from "../../hooks/use-mobile";
import { AcademicHeroCard } from "./AcademicHeroCard";
import { HeroCardSkeleton, SectionErrorFallback } from "./HomeSkeletons";
import { EnhancedErrorBoundary } from "../ui/EnhancedErrorBoundary";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import { CONNECTOR_META, type IdentitySyncState } from "../../hooks/home/useIdentitySyncStatus";
import { useUiTokens } from "../../styles/uiTokens";

const HERO_TOKENS = {
  sectionGap: 18,
  cardRadius: 16,
  sectionPadding: 18,
  toolbarShadowLight: "0 8px 24px hsl(var(--foreground) / 0.08)",
  toolbarShadowDark: "0 14px 36px hsl(var(--background) / 0.58)",
};

interface HomeHeroSectionProps {
  user: { email: string } | null;
  onLogout: () => void;
  onSearchClick: () => void;
  onUploadClick: () => void;
  onNavigate: (path: string) => void;
  homeWidgetViewMode: "grid" | "carousel3d" | "carousel";
  onViewModeChange: (mode: "grid" | "carousel3d" | "carousel") => void;
  benchmarkUiEnabled?: boolean;
  benchmarkAdmin?: boolean;
  uploadsList: any[];
  parsedCount: number;
  totalSegments: number;
  uploadsLoading: boolean;
  isCompactHome: boolean;
  identitySync: IdentitySyncState;
  identitySyncing: boolean;
  onIdentityAutoSync: () => void;
  identityLastSyncedAt: number | null;
  identitySummaryLine: string | null;
}

interface MetricConfig {
  key: string;
  label: string;
  value: string;
  hint: string;
  trend?: "up" | "down" | "flat";
  badge?: string;
}

function readStreak(): number {
  try {
    const stored = localStorage.getItem("research-streak");
    if (!stored) return 0;
    const { count, lastDate } = JSON.parse(stored);
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    return lastDate === today || lastDate === yesterday ? (count ?? 0) : 0;
  } catch {
    return 0;
  }
}

const HeroMetricCard = memo(({ item, isDark }: { item: MetricConfig; isDark: boolean }) => {
  const badgeColors = {
    up: isDark ? "hsl(var(--success) / 0.18)" : "hsl(var(--success) / 0.15)",
    down: isDark ? "hsl(var(--destructive) / 0.18)" : "hsl(var(--destructive) / 0.15)",
    flat: isDark ? "hsl(var(--muted-foreground) / 0.22)" : "hsl(var(--muted-foreground) / 0.12)",
  } as const;

  return (
    <div
      style={{
        padding: "10px 12px",
        borderRadius: "calc(var(--radius) + 4px)",
        border: `1px solid hsl(var(--border))`,
        background: `hsl(var(--card))`,
        boxShadow: isDark ? "0 8px 20px hsl(var(--background) / 0.45)" : "0 6px 16px hsl(var(--foreground) / 0.06)",
        display: "flex",
        flexDirection: "column",
        gap: 3,
        minHeight: 78,
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "hsl(var(--muted-foreground))" }}>
        {item.label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "hsl(var(--foreground))", lineHeight: 1 }}>{item.value}</div>
      <div style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", minHeight: 14 }}>{item.hint}</div>
      {item.badge && (
        <span
          style={{
            marginTop: "auto",
            alignSelf: "flex-start",
            padding: "3px 8px",
            borderRadius: 999,
            fontSize: 10,
            fontWeight: 600,
            background: badgeColors[item.trend || "flat"],
            color:
              item.trend === "up"
                ? "hsl(var(--success))"
                : item.trend === "down"
                ? "hsl(var(--destructive))"
                : "hsl(var(--muted-foreground))",
          }}
        >
          {item.badge}
        </span>
      )}
    </div>
  );
});
HeroMetricCard.displayName = "HeroMetricCard";

const HeroMetricsGrid = memo(({ metrics, isDark, isMobile }: { metrics: MetricConfig[]; isDark: boolean; isMobile?: boolean }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr 1fr" : `repeat(${metrics.length}, 1fr)`,
      gap: isMobile ? 8 : 10,
      marginTop: isMobile ? 8 : 10,
    }}
  >
    {metrics.map((metric) => (
      <HeroMetricCard key={metric.key} item={metric} isDark={isDark} />
    ))}
  </div>
));
HeroMetricsGrid.displayName = "HeroMetricsGrid";

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
}

export function HomeHeroSection({
  user,
  onLogout,
  onSearchClick,
  onUploadClick,
  onNavigate,
  homeWidgetViewMode,
  onViewModeChange,
  benchmarkUiEnabled,
  benchmarkAdmin,
  uploadsList,
  parsedCount,
  totalSegments,
  uploadsLoading,
  isCompactHome,
  identitySync,
  identitySyncing,
  onIdentityAutoSync,
  identityLastSyncedAt,
  identitySummaryLine,
}: HomeHeroSectionProps) {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const tokens = useUiTokens();
  const isMobile = useIsMobile();

  const metrics = useMemo<MetricConfig[]>(() => {
    const docCount = uploadsList.length;
    const parseRate = docCount > 0 ? Math.round((parsedCount / Math.max(docCount, 1)) * 100) : 0;
    const avgSegments = docCount > 0 ? Math.round(totalSegments / docCount) : 0;
    const streakDays = readStreak();
    const density = docCount > 0 ? (totalSegments / docCount).toFixed(1) : "0.0";

    return [
      {
        key: "documents",
        label: t("home.metrics.documents") || "Documents",
        value: formatNumber(docCount),
        hint: `${parsedCount} ${t("home.metrics.parsed") || "parsed"}`,
        badge: `${parseRate}% ${t("home.metrics.successRate") || "success"}`,
        trend: docCount === 0 ? "flat" : parseRate >= 75 ? "up" : parseRate <= 35 ? "down" : "flat",
      },
      {
        key: "segments",
        label: t("home.metrics.segments") || "Segments",
        value: formatNumber(totalSegments),
        hint: `${density} ${t("home.metrics.avgPerDoc") || "per document"}`,
        badge: docCount > 0 ? `${avgSegments} ${t("home.metrics.perDoc") || "avg"}` : undefined,
        trend: avgSegments >= 10 ? "up" : totalSegments === 0 ? "flat" : "down",
      },
      {
        key: "streak",
        label: t("home.metrics.streak") || "Research streak",
        value: `${streakDays}d`,
        hint: t("home.metrics.streakHint") || "consecutive days active",
        badge: streakDays >= 5 ? t("home.metrics.onFire") || "On fire" : undefined,
        trend: streakDays >= 5 ? "up" : "flat",
      },
    ];
  }, [uploadsList.length, parsedCount, totalSegments, t]);

  const connectorEntries = useMemo(() => Object.entries(identitySync.connectors) as [keyof IdentitySyncState["connectors"], IdentitySyncState["connectors"][keyof IdentitySyncState["connectors"]]][], [identitySync.connectors]);

  const formattedLastSynced = identityLastSyncedAt
    ? new Date(identityLastSyncedAt).toLocaleString()
    : null;

  // Micro-commands removed — redundant with Header and Quick Actions

  return (
    <section
      style={{
        marginBottom: isCompactHome ? tokens.spacing.md : tokens.spacing.lg,
        padding: `0 ${isMobile ? 0 : HERO_TOKENS.sectionGap}px`,
      }}
    >

      {!isCompactHome && (
        <>
        {/* Row 1: Hero card + Community & Identity — stack on mobile, hide identity on mobile */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.4fr) minmax(0, 1.6fr)",
            gap: HERO_TOKENS.sectionGap,
            alignItems: "stretch",
          }}
        >
          {/* Hero Card */}
          <div style={{ minWidth: 0, fontSize: isMobile ? "0.88em" : "0.92em" }}>
            <EnhancedErrorBoundary componentName="HomeHeroCard" fallback={<SectionErrorFallback section="hero card" />}>
              {uploadsLoading && uploadsList.length === 0 ? (
                <HeroCardSkeleton />
              ) : (
                <AcademicHeroCard
                  uploadsList={uploadsList}
                  parsedCount={parsedCount}
                  totalSegments={totalSegments}
                  onUploadClick={onUploadClick}
                  onSearchClick={onSearchClick}
                />
              )}
            </EnhancedErrorBoundary>
          </div>

          {/* Community & Identity — HIDE on mobile (too heavy, accessible via bottom nav) */}
          {!isMobile && (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              <div
                style={{
                  borderRadius: 16,
                  border: `1px solid hsl(var(--border))`,
                  background: `hsl(var(--card))`,
                  padding: 18,
                  boxShadow: isDark ? "0 16px 40px hsl(var(--background) / 0.6)" : "0 10px 30px hsl(var(--foreground) / 0.06)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  flex: 1,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "hsl(var(--foreground))" }}>{t("home.communitySection") || "Community & Identity"}</div>
                    <div style={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}>{identitySummaryLine || t("home.identitySummary.empty")}</div>
                  </div>
                  <button
                    onClick={onIdentityAutoSync}
                    disabled={identitySyncing}
                    style={{
                      borderRadius: 999,
                      border: `1px solid ${identitySyncing ? "hsl(var(--muted-foreground) / 0.5)" : "hsl(var(--primary) / 0.4)"}`,
                      background: identitySyncing ? "hsl(var(--muted-foreground) / 0.15)" : "hsl(var(--primary) / 0.12)",
                      color: identitySyncing ? "hsl(var(--muted-foreground))" : "hsl(var(--primary))",
                      fontSize: 11, fontWeight: 700, padding: "6px 12px",
                      cursor: identitySyncing ? "not-allowed" : "pointer",
                      transition: "all 0.2s ease", flexShrink: 0,
                    }}
                  >
                    {identitySyncing ? `${t("home.identity.badge.connecting")}` : (t("home.identity.autoSync") || "Auto-sync profile")}
                  </button>
                </div>

                {/* Connector cards */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {connectorEntries.map(([key, connector]) => {
                    const meta = CONNECTOR_META[key as keyof typeof CONNECTOR_META];
                    const status = connector.status;
                    const badgeLabel = t(`home.identity.badge.${status}` as const) || status;
                    const statusColors: Record<string, { bg: string; border: string; color: string }> = {
                      connected: { bg: "hsl(var(--success) / 0.15)", border: "hsl(var(--success) / 0.3)", color: "hsl(var(--success))" },
                      connecting: { bg: "hsl(var(--warning) / 0.12)", border: "hsl(var(--warning) / 0.35)", color: "hsl(var(--warning))" },
                      disconnected: { bg: "hsl(var(--muted-foreground) / 0.12)", border: "hsl(var(--muted-foreground) / 0.3)", color: "hsl(var(--muted-foreground))" },
                    };
                    const palette = statusColors[status];
                    return (
                      <div key={key} style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 10px", borderRadius: 10, background: "hsl(var(--muted) / 0.5)", border: `1px solid hsl(var(--border))`, minWidth: 0, flex: "1 1 160px" }}>
                        <span style={{ fontSize: 15 }}>{meta.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "hsl(var(--foreground))" }}>{meta.label}</div>
                          <div style={{ fontSize: 10, color: "hsl(var(--muted-foreground))", lineHeight: 1.3 }}>{meta.description}</div>
                        </div>
                        <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 7px", borderRadius: 999, background: palette.bg, border: `1px solid ${palette.border}`, color: palette.color, whiteSpace: "nowrap" }}>
                          {badgeLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div style={{ fontSize: 10, color: "hsl(var(--muted-foreground))", marginTop: "auto" }}>
                  {t("home.identity.lastSynced") || "Last synced"}:
                  <strong style={{ marginLeft: 6, color: "hsl(var(--foreground) / 0.7)" }}>
                    {formattedLastSynced || (t("home.identity.neverSynced") || "Never synced")}
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Row 2: Metric cards — show only 2 on mobile for space */}
        <HeroMetricsGrid metrics={isMobile ? metrics.slice(0, 2) : metrics} isDark={isDark} isMobile={isMobile} />
        </>
      )}
    </section>
  );
}
