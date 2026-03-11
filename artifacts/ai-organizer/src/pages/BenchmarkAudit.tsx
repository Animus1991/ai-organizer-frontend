import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  runBenchmark,
  getBenchmarkLatest,
  getBenchmarkHistory,
  downloadBenchmarkReport,
  downloadBenchmarkReportZip,
  emailBenchmarkReport,
  emailBenchmarkReportZip,
  getBenchmarkAccess,
} from "../lib/api";
import { useTour } from "../components/tour/useTour";
import { TourPanel } from "../components/tour/TourPanel";
import GlobalBurgerMenu from "../components/GlobalBurgerMenu";
import { ScreenshotMode } from "../components/ScreenshotMode";

export default function BenchmarkAudit() {
  const nav = useNavigate();
  const enableBenchmarkUi = import.meta.env.VITE_ENABLE_BENCHMARK_UI !== "false";
  const [latest, setLatest] = useState<any | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [status, setStatus] = useState<string>("");
  const [allowed, setAllowed] = useState<boolean>(false);
  const pageContainerRef = useRef<HTMLDivElement | null>(null);
  const [screenshotModeActive, setScreenshotModeActive] = useState(false);
  const tourRefs = {
    header: useRef<HTMLDivElement | null>(null),
    actions: useRef<HTMLDivElement | null>(null),
    latest: useRef<HTMLDivElement | null>(null),
    history: useRef<HTMLDivElement | null>(null),
  };

  const refresh = async () => {
    try {
      const latestData = await getBenchmarkLatest();
      setLatest(latestData?.report ?? null);
      const historyData = await getBenchmarkHistory();
      setHistory(historyData);
    } catch (e: any) {
      setStatus(e?.message || "Failed to load benchmark data");
    }
  };

  useEffect(() => {
    if (!enableBenchmarkUi) return;
    refresh();
  }, [enableBenchmarkUi]);

  useEffect(() => {
    if (!enableBenchmarkUi) return;
    (async () => {
      try {
        const access = await getBenchmarkAccess();
        setAllowed(access);
      } catch {
        setAllowed(false);
      }
    })();
  }, [enableBenchmarkUi]);

  const handleRun = async () => {
    try {
      setStatus("Running benchmark...");
      const result = await runBenchmark();
      setLatest(result?.report ?? null);
      await refresh();
      setStatus("Benchmark completed");
    } catch (e: any) {
      setStatus(e?.message || "Benchmark failed");
    }
  };

  const handleDownload = async () => {
    try {
      const blob = await downloadBenchmarkReport();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "segmentation_benchmark_report.json";
      link.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setStatus(e?.message || "Download failed");
    }
  };

  const handleDownloadZip = async () => {
    try {
      const blob = await downloadBenchmarkReportZip();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "segmentation_benchmark_report.zip";
      link.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setStatus(e?.message || "ZIP download failed");
    }
  };

  const handleEmail = async () => {
    const to = window.prompt("Send benchmark report to email:");
    if (!to) return;
    try {
      await emailBenchmarkReport(to);
      setStatus(`Report emailed to ${to}`);
    } catch (e: any) {
      setStatus(e?.message || "Email failed");
    }
  };

  const handleEmailZip = async () => {
    const to = window.prompt("Send ZIP report to email:");
    if (!to) return;
    try {
      await emailBenchmarkReportZip(to);
      setStatus(`ZIP report emailed to ${to}`);
    } catch (e: any) {
      setStatus(e?.message || "ZIP email failed");
    }
  };

  const tourSteps = [
    {
      key: "welcome",
      title: "Benchmark Audit",
      body: "Validate segmentation quality by running automated benchmarks against your document corpus. Results feed back into the Thinking Workspace to ensure parsing accuracy before analysis.",
      ref: null as React.RefObject<HTMLDivElement | null> | null,
    },
    {
      key: "header",
      title: "Navigation & Access",
      body: "Return to the Home dashboard or Thinking Workspace when done. Admin-only access ensures benchmark integrity.",
      ref: tourRefs.header,
    },
    {
      key: "actions",
      title: "Run & Export",
      body: "Trigger a new benchmark run, then export results as JSON, ZIP, or email them to stakeholders. Use exports alongside the Evidence Dashboard for comprehensive quality assurance.",
      ref: tourRefs.actions,
    },
    {
      key: "latest",
      title: "Latest Report",
      body: "Review the most recent benchmark scores, return codes, and git commit references. Compare against previous runs to catch regressions before they affect your research pipeline.",
      ref: tourRefs.latest,
    },
    {
      key: "history",
      title: "Run History & Trends",
      body: "Track benchmark performance over time. Spot drift in segmentation accuracy and correlate changes with specific code commits or document updates.",
      ref: tourRefs.history,
    },
  ];

  const {
    tourOpen,
    tourStepIndex,
    tourPopoverPos,
    startTour,
    closeTour,
    nextTourStep,
    prevTourStep,
    getTourHighlightStyle,
  } = useTour({
    storageKey: "benchmarkAuditTourSeen",
    steps: tourSteps,
    containerRef: pageContainerRef,
  });

  if (!enableBenchmarkUi) {
    return (
      <div style={{ padding: "40px", color: "#eaeaea" }}>
        Benchmark UI is disabled. Set `VITE_ENABLE_BENCHMARK_UI=true`.
      </div>
    );
  }

  if (!allowed) {
    return (
      <div style={{ padding: "40px", color: "#eaeaea" }}>
        Admin access required. Add your email to `AIORG_ADMIN_EMAILS` and restart the server.
      </div>
    );
  }

  return (
    <div
      ref={pageContainerRef}
      style={{
        color: "#eaeaea",
        paddingTop: tourPopoverPos?.pushDownPadding
          ? `calc(32px + ${Math.round(tourPopoverPos.pushDownPadding)}px)`
          : undefined,
      }}
    >
      <GlobalBurgerMenu />
      <div className="page-shell">
      <div
        ref={tourRefs.header}
        className="page-header"
        style={{ ...(getTourHighlightStyle(tourRefs.header) || {}) }}
      >
        <h2 className="page-title" style={{ margin: 0 }}>Benchmark Audit</h2>
        <div className="page-actions">
          <button
            onClick={startTour}
            className="btn btn-sm btn-secondary"
          >
            Start tour
          </button>
          <button
            onClick={() => nav("/")}
            className="btn btn-sm btn-tertiary"
          >
            Back to Home
          </button>
        </div>
      </div>

      <div
        ref={tourRefs.actions}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "16px",
          ...(getTourHighlightStyle(tourRefs.actions) || {}),
        }}
      >
        <button onClick={handleRun} style={{ padding: "8px 12px", borderRadius: "8px", background: "rgba(16,185,129,0.2)", color: "#6ee7b7", border: "1px solid rgba(16,185,129,0.4)", cursor: "pointer" }}>
          🧪 Benchmark
        </button>
        <button onClick={handleDownload} style={{ padding: "8px 12px", borderRadius: "8px", background: "rgba(59,130,246,0.2)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.4)", cursor: "pointer" }}>
          ⬇️ JSON
        </button>
        <button onClick={handleDownloadZip} style={{ padding: "8px 12px", borderRadius: "8px", background: "rgba(14,165,233,0.2)", color: "#7dd3fc", border: "1px solid rgba(14,165,233,0.4)", cursor: "pointer" }}>
          ⬇️ ZIP
        </button>
        <button onClick={handleEmail} style={{ padding: "8px 12px", borderRadius: "8px", background: "rgba(245,158,11,0.2)", color: "#fde68a", border: "1px solid rgba(245,158,11,0.4)", cursor: "pointer" }}>
          ✉️ Email
        </button>
        <button onClick={handleEmailZip} style={{ padding: "8px 12px", borderRadius: "8px", background: "rgba(251,146,60,0.2)", color: "#fdba74", border: "1px solid rgba(251,146,60,0.4)", cursor: "pointer" }}>
          ✉️ ZIP
        </button>
        <button onClick={refresh} style={{ padding: "8px 12px", borderRadius: "8px", background: "rgba(168,85,247,0.2)", color: "#c4b5fd", border: "1px solid rgba(168,85,247,0.4)", cursor: "pointer" }}>
          🔄 Refresh
        </button>
      </div>

      {status && <div style={{ marginBottom: "12px", opacity: 0.8 }}>{status}</div>}

      <div
        ref={tourRefs.latest}
        style={{
          marginBottom: "20px",
          padding: "16px",
          borderRadius: "12px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          ...(getTourHighlightStyle(tourRefs.latest) || {}),
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: "8px" }}>Latest Report</div>
        {latest ? (
          <div style={{ fontSize: "13px", opacity: 0.8 }}>
            Run ID: {latest.audit?.run_id || "n/a"} • Modes: {latest.summary ? Object.keys(latest.summary).length : "n/a"}
          </div>
        ) : (
          <div style={{ fontSize: "13px", opacity: 0.6 }}>No report available.</div>
        )}
      </div>

      <div
        ref={tourRefs.history}
        style={{
          padding: "16px",
          borderRadius: "12px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          ...(getTourHighlightStyle(tourRefs.history) || {}),
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: "8px" }}>History</div>
        {history.length === 0 ? (
          <div style={{ fontSize: "13px", opacity: 0.6 }}>No runs recorded.</div>
        ) : (
          <div style={{ display: "grid", gap: "8px" }}>
            {history.map((entry, idx) => (
              <div key={`${entry.run_id}-${idx}`} style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)" }}>
                <div style={{ fontSize: "13px" }}>{entry.run_id || "Unknown run"} • Return: {entry.returnCode ?? "n/a"}</div>
                <div style={{ fontSize: "11px", opacity: 0.6 }}>Commit: {entry.git_commit || "n/a"}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>

      <TourPanel
        open={tourOpen}
        popoverPos={tourPopoverPos}
        stepIndex={tourStepIndex}
        steps={tourSteps}
        onClose={closeTour}
        onNext={nextTourStep}
        onPrev={prevTourStep}
      />
      <ScreenshotMode isActive={screenshotModeActive} onToggle={() => setScreenshotModeActive(!screenshotModeActive)} />
    </div>
  );
}
