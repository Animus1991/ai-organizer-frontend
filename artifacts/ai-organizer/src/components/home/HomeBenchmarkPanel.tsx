// src/components/home/HomeBenchmarkPanel.tsx
// Extracted benchmark controls panel from Home.tsx
import React, { useMemo, useState } from "react";
import { useTheme } from "../../context/ThemeContext";

export interface BenchmarkEntry {
  run_id?: string;
  audit?: { run_id?: string };
  returnCode?: number | null;
  summary?: BenchmarkSummary;
}

type BenchmarkSummary = Record<string, BenchmarkSummaryEntry>;

type BenchmarkSummaryEntry = {
  ok?: number;
  failed?: number;
  skipped?: number;
  f1_avg?: number;
  latency_ms?: number;
  latencyMs?: number;
  precision?: number;
  coverage?: number;
};

export interface BenchmarkLatest {
  audit?: { run_id?: string };
  summary?: BenchmarkSummary;
}

export interface HomeBenchmarkPanelProps {
  enableBenchmarkUi: boolean;
  benchmarkAllowed: boolean;
  benchmarkAction: string | null;
  benchmarkLatest: BenchmarkLatest | null;
  benchmarkHistory: BenchmarkEntry[];
  t: (key: string, params?: Record<string, string | number>) => string;
  onRunBenchmark: () => void;
  onDownloadBenchmark: () => void;
  onDownloadBenchmarkZip: () => void;
  onOpenEmailModal: (type: "json" | "zip") => void;
  onGoToAudit: () => void;
  onRefreshHistory: () => void;
}

export const HomeBenchmarkPanel: React.FC<HomeBenchmarkPanelProps> = ({
  enableBenchmarkUi,
  benchmarkAllowed,
  benchmarkAction,
  benchmarkLatest,
  benchmarkHistory,
  t,
  onRunBenchmark,
  onDownloadBenchmark,
  onDownloadBenchmarkZip,
  onOpenEmailModal,
  onGoToAudit,
  onRefreshHistory,
}) => {
  const { isDark } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  const latestAggregate = useMemo(() => aggregateSummary(benchmarkLatest?.summary), [benchmarkLatest]);
  const previousAggregate = useMemo(() => aggregateSummary(benchmarkHistory?.[1]?.summary), [benchmarkHistory]);
  const precisionDelta = latestAggregate.precision != null && previousAggregate.precision != null
    ? latestAggregate.precision - previousAggregate.precision
    : null;

  const kpiItems = useMemo(() => [
    { key: "latency", label: t("home.benchmark.kpi.latency"), value: latestAggregate.latency != null ? t("home.benchmark.kpi.ms", { value: latestAggregate.latency.toFixed(1) }) : "—", accent: `hsl(var(--info) / ${isDark ? 0.2 : 0.1})` },
    { key: "precision", label: t("home.benchmark.kpi.precision"), value: latestAggregate.precision != null ? t("home.benchmark.kpi.percent", { value: latestAggregate.precision.toFixed(1) }) : "—", accent: `hsl(var(--success) / ${isDark ? 0.2 : 0.1})` },
    { key: "coverage", label: t("home.benchmark.kpi.coverage"), value: latestAggregate.coverage != null ? t("home.benchmark.kpi.percent", { value: latestAggregate.coverage.toFixed(1) }) : "—", accent: `hsl(var(--warning) / ${isDark ? 0.2 : 0.1})` },
  ], [isDark, latestAggregate, t]);

  const actionItems = useMemo(() => ([
    { key: "refresh", label: t("home.benchmark.actions.refresh"), hint: t("doc.refreshHistory"), icon: "🔄", onClick: onRefreshHistory, disabled: benchmarkAction !== null },
    { key: "run", label: t("home.benchmark.actions.run"), hint: t("doc.benchmarkRunTitle"), icon: "🧪", onClick: onRunBenchmark, disabled: !benchmarkAllowed || benchmarkAction !== null },
    { key: "json", label: t("home.benchmark.actions.json"), hint: t("doc.benchmarkDownloadJsonTitle"), icon: "⬇️", onClick: onDownloadBenchmark, disabled: !benchmarkLatest || benchmarkAction !== null },
    { key: "zip", label: t("home.benchmark.actions.zip"), hint: t("doc.benchmarkDownloadZipTitle"), icon: "📦", onClick: onDownloadBenchmarkZip, disabled: !benchmarkLatest || benchmarkAction !== null },
    { key: "email-json", label: t("home.benchmark.actions.emailJson"), hint: t("doc.benchmarkEmailJsonTitle"), icon: "✉️", onClick: () => onOpenEmailModal("json"), disabled: !benchmarkLatest || benchmarkAction !== null },
    { key: "email-zip", label: t("home.benchmark.actions.emailZip"), hint: t("doc.benchmarkEmailZipTitle"), icon: "✉️", onClick: () => onOpenEmailModal("zip"), disabled: !benchmarkLatest || benchmarkAction !== null },
    { key: "audit", label: t("home.benchmark.actions.audit"), hint: t("doc.benchmarkAuditTitle"), icon: "📊", onClick: onGoToAudit, disabled: benchmarkAction !== null },
  ]), [benchmarkAction, benchmarkAllowed, benchmarkLatest, onDownloadBenchmark, onDownloadBenchmarkZip, onGoToAudit, onOpenEmailModal, onRefreshHistory, onRunBenchmark, t]);

  const hasSpotlightHighlight = precisionDelta != null && latestAggregate.coverage != null;
  const spotlightDirection = precisionDelta != null ? `${precisionDelta >= 0 ? "+" : ""}${precisionDelta.toFixed(1)}%` : "—";
  const spotlightCoverage = latestAggregate.coverage != null ? latestAggregate.coverage.toFixed(1) : "—";
  const spotlightIcon = precisionDelta == null ? "💡" : precisionDelta >= 0 ? "📈" : "📉";

  if (!enableBenchmarkUi) return null;

  return (
    <div
      style={{
        marginTop: "18px",
        borderRadius: "var(--radius)",
        padding: "18px 22px",
        background: "hsl(var(--card))",
        border: "1px solid hsl(var(--border))",
        boxShadow: isDark ? "0 18px 45px hsl(var(--background) / 0.35)" : "0 24px 60px hsl(var(--foreground) / 0.06)",
        backdropFilter: "blur(18px)",
        display: "flex",
        flexDirection: "column",
        gap: "18px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 260px" }}>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "hsl(var(--foreground))" }}>
            {t("home.benchmark.title")}
          </div>
          <div style={{ fontSize: "13px", color: "hsl(var(--muted-foreground))", marginTop: "4px" }}>
            {t("home.benchmark.subtitle")}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            padding: "8px 14px",
            borderRadius: "999px",
            border: "1px solid hsl(var(--border))",
            fontSize: "12px",
            fontWeight: 600,
            color: "hsl(var(--foreground))",
            background: `hsl(var(--muted) / ${isDark ? 0.5 : 0.7})`,
          }}>
            {benchmarkLatest && latestAggregate.totalModes > 0
              ? t("home.benchmark.latestRun", {
                runId: benchmarkLatest.audit?.run_id || t("home.benchmark.unknownRun"),
                modes: latestAggregate.totalModes,
              })
              : t("home.benchmark.noReport")}
          </div>
          <button
            onClick={() => setCollapsed((prev) => !prev)}
            style={{
              border: "1px solid hsl(var(--border))",
              background: "transparent",
              color: "hsl(var(--muted-foreground))",
              padding: "6px 10px",
              borderRadius: "10px",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {collapsed ? "▼" : "▲"}
          </button>
        </div>
      </div>

      {collapsed ? null : (
        <>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "12px",
          }}>
            {kpiItems.map((item) => (
              <div
                key={item.key}
                style={{
                  borderRadius: "var(--radius)",
                  padding: "14px",
                  background: item.accent,
                  color: "hsl(var(--foreground))",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  border: "1px solid hsl(var(--border))",
                }}
              >
                <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "hsl(var(--muted-foreground))" }}>
                  {item.label}
                </span>
                <span style={{ fontSize: "20px", fontWeight: 700 }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          <div
            style={{
              borderRadius: "var(--radius)",
              padding: "16px 18px",
              background: `hsl(var(--primary) / ${isDark ? 0.12 : 0.06})`,
              border: `1px solid hsl(var(--primary) / ${isDark ? 0.25 : 0.15})`,
              display: "flex",
              flexWrap: "wrap",
              gap: "16px",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: "1 1 260px" }}>
              <div style={{ fontSize: "32px" }}>{spotlightIcon}</div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "hsl(var(--foreground))" }}>
                  {t("home.benchmark.spotlight.title")}
                </div>
                <div style={{ fontSize: "12.5px", color: "hsl(var(--muted-foreground))", marginTop: "4px", maxWidth: "520px" }}>
                  {hasSpotlightHighlight
                    ? t("home.benchmark.spotlight.highlight", { direction: spotlightDirection, coverage: spotlightCoverage })
                    : t("home.benchmark.spotlight.empty")}
                </div>
              </div>
            </div>
            <button
              onClick={() => onOpenEmailModal("json")}
              disabled={!benchmarkLatest || benchmarkAction !== null}
              style={{
                padding: "10px 18px",
                borderRadius: "999px",
                border: "none",
                background: "hsl(var(--primary))",
                color: "hsl(var(--primary-foreground))",
                fontSize: "12.5px",
                fontWeight: 600,
                cursor: !benchmarkLatest || benchmarkAction !== null ? "not-allowed" : "pointer",
                opacity: !benchmarkLatest || benchmarkAction !== null ? 0.5 : 1,
                transition: "all 0.2s ease",
              }}
            >
              {t("home.benchmark.spotlight.cta")}
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
              gap: "10px",
            }}
          >
            {actionItems.map((action) => (
              <button
                key={action.key}
                onClick={action.onClick}
                disabled={action.disabled}
                title={action.hint}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "4px",
                  padding: "14px 16px",
                  borderRadius: "var(--radius)",
                  border: "1px solid hsl(var(--border))",
                  background: `hsl(var(--muted) / ${isDark ? 0.3 : 0.5})`,
                  color: "hsl(var(--foreground))",
                  cursor: action.disabled ? "not-allowed" : "pointer",
                  opacity: action.disabled ? 0.45 : 1,
                }}
              >
                <span style={{ fontSize: "16px" }}>{action.icon}</span>
                <span style={{ fontSize: "13px", fontWeight: 600 }}>{action.label}</span>
                <span style={{ fontSize: "11px", color: "hsl(var(--muted-foreground))" }}>{action.hint}</span>
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "hsl(var(--foreground))" }}>
              {t("home.benchmark.historyTitle")}
            </div>
            {benchmarkHistory.length === 0 ? (
              <div style={{ fontSize: "12.5px", color: "hsl(var(--muted-foreground))" }}>
                {t("doc.benchmarkHistoryEmpty")}
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gap: "8px",
                  maxHeight: "220px",
                  overflowY: "auto",
                  paddingRight: "4px",
                }}
              >
                {benchmarkHistory.slice(0, 6).map((entry, idx) => (
                  <div
                    key={`${entry.run_id || entry.audit?.run_id || "run"}-${idx}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 14px",
                      borderRadius: "var(--radius)",
                      border: "1px solid hsl(var(--border))",
                      background: `hsl(var(--muted) / ${isDark ? 0.3 : 0.5})`,
                      gap: "12px",
                    }}
                  >
                    <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                      <div style={{ fontSize: "12.5px", fontWeight: 600, color: "hsl(var(--foreground))", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {entry.run_id || entry.audit?.run_id || t("home.benchmark.unknownRun")}
                      </div>
                      <div style={{ fontSize: "11px", color: "hsl(var(--muted-foreground))" }}>
                        {t("home.benchmark.historyEntry", {
                          runId: entry.run_id || entry.audit?.run_id || t("home.benchmark.unknownRun"),
                          returnCode: entry.returnCode ?? "n/a",
                        })}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "4px 10px",
                        borderRadius: "999px",
                        border: `1px solid ${entry.returnCode === 0 ? "hsl(var(--success) / 0.4)" : "hsl(var(--destructive) / 0.35)"}`,
                        background: entry.returnCode === 0 ? "hsl(var(--success) / 0.16)" : "hsl(var(--destructive) / 0.12)",
                        color: entry.returnCode === 0 ? `hsl(var(--success))` : `hsl(var(--destructive))`,
                        fontSize: "11px",
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {entry.returnCode ?? "—"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

function aggregateSummary(summary?: BenchmarkSummary) {
  if (!summary) {
    return { precision: null, coverage: null, latency: null, totalModes: 0 };
  }
  const entries = Object.values(summary) as BenchmarkSummaryEntry[];
  let precisionSum = 0;
  let precisionCount = 0;
  let coverageOk = 0;
  let coverageTotal = 0;
  let latencySum = 0;
  let latencyCount = 0;

  entries.forEach((entry) => {
    if (typeof entry.f1_avg === "number") {
      precisionSum += entry.f1_avg * 100;
      precisionCount += 1;
    } else if (typeof entry.precision === "number") {
      precisionSum += entry.precision;
      precisionCount += 1;
    }

    const attempts = (entry.ok ?? 0) + (entry.failed ?? 0) + (entry.skipped ?? 0);
    coverageOk += entry.ok ?? 0;
    coverageTotal += attempts;

    const latency = typeof entry.latency_ms === "number" ? entry.latency_ms : typeof entry.latencyMs === "number" ? entry.latencyMs : undefined;
    if (typeof latency === "number" && !Number.isNaN(latency)) {
      latencySum += latency;
      latencyCount += 1;
    }
  });

  return {
    precision: precisionCount ? precisionSum / precisionCount : null,
    coverage: coverageTotal ? (coverageOk / coverageTotal) * 100 : null,
    latency: latencyCount ? latencySum / latencyCount : null,
    totalModes: entries.length,
  };
}
