// src/pages/BenchmarkPage.tsx
// Standalone benchmark page — mobile-first responsive layout
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { useHomeState } from "../hooks/home/useHomeState";
import { useHomeBenchmark } from "../hooks/home/useHomeBenchmark";
import { HomeBenchmarkPanel } from "../components/home/HomeBenchmarkPanel";
import { BenchmarkEmailModal } from "../components/home/HomeModals";
import { SectionShell } from "../components/ui/SectionShell";
import { PageShell } from "../components/layout/PageShell";

export default function BenchmarkPage() {
  const nav = useNavigate();
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const { status, setStatus } = useHomeState();

  const benchmark = useHomeBenchmark(setStatus, t);

  return (
    <PageShell>
      <div className="max-w-[1200px] mx-auto px-3 py-4 sm:px-6 sm:py-8">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <h1 className="m-0 text-lg sm:text-xl font-bold text-foreground">
            {t("benchmark.title") || "Segmentation Benchmark"}
          </h1>
        </div>

        {status && (
          <div
            aria-live="polite"
            className="px-3 py-2.5 mb-4 rounded-[10px] text-[13px] font-medium border"
            style={{
              background: isDark ? "hsl(var(--info) / 0.12)" : "hsl(var(--info) / 0.08)",
              borderColor: "hsl(var(--info) / 0.2)",
              color: "hsl(var(--info))",
            }}
          >
            {status}
          </div>
        )}

        <SectionShell
          id="benchmark"
          title={t("benchmark.sectionTitle") || "Benchmark Engine"}
          description={t("benchmark.sectionDesc") || "Run, review, and export segmentation benchmark results."}
          variant="glass"
        >
          <HomeBenchmarkPanel
            enableBenchmarkUi={benchmark.enableBenchmarkUi}
            benchmarkAllowed={benchmark.benchmarkAllowed}
            benchmarkAction={benchmark.benchmarkAction}
            benchmarkLatest={benchmark.benchmarkLatest}
            benchmarkHistory={benchmark.benchmarkHistory}
            t={t}
            onRunBenchmark={benchmark.handleRunBenchmark}
            onDownloadBenchmark={benchmark.handleDownloadBenchmark}
            onDownloadBenchmarkZip={benchmark.handleDownloadBenchmarkZip}
            onOpenEmailModal={benchmark.openBenchmarkEmailModal}
            onGoToAudit={benchmark.handleGoToBenchmarkAudit}
            onRefreshHistory={benchmark.handleBenchmarkHistory}
          />
        </SectionShell>

        <BenchmarkEmailModal
          benchmarkEmailModal={benchmark.benchmarkEmailModal}
          benchmarkEmailTo={benchmark.benchmarkEmailTo}
          benchmarkEmailError={benchmark.benchmarkEmailError}
          benchmarkAction={benchmark.benchmarkAction}
          t={t}
          onClose={benchmark.closeBenchmarkEmailModal}
          onSubmit={benchmark.submitBenchmarkEmail}
          onEmailChange={benchmark.setBenchmarkEmailTo}
          onClearError={() => benchmark.setBenchmarkEmailError(null)}
        />
      </div>
    </PageShell>
  );
}
