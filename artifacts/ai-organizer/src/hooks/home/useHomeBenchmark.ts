// src/hooks/home/useHomeBenchmark.ts
// Extracted benchmark state and handlers from Home.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

export interface HomeBenchmarkState {
  benchmarkHistory: any[];
  benchmarkLatest: any | null;
  benchmarkAllowed: boolean;
  benchmarkChecked: boolean;
  benchmarkAction: null | "run" | "download_json" | "download_zip" | "email_json" | "email_zip" | "history" | "audit";
  benchmarkEmailModal: null | "json" | "zip";
  benchmarkEmailTo: string;
  benchmarkEmailError: string | null;
  enableBenchmarkUi: boolean;
  handleRunBenchmark: () => Promise<void>;
  handleDownloadBenchmark: () => Promise<void>;
  handleBenchmarkHistory: () => Promise<void>;
  handleDownloadBenchmarkZip: () => Promise<void>;
  handleGoToBenchmarkAudit: () => void;
  openBenchmarkEmailModal: (kind: "json" | "zip") => void;
  closeBenchmarkEmailModal: () => void;
  submitBenchmarkEmail: () => Promise<void>;
  setBenchmarkEmailTo: (to: string) => void;
  setBenchmarkEmailError: (error: string | null) => void;
}

export function useHomeBenchmark(
  setStatus: (s: string) => void,
  t: (key: string) => string,
): HomeBenchmarkState {
  const nav = useNavigate();
  const enableBenchmarkUi = import.meta.env.VITE_ENABLE_BENCHMARK_UI !== "false";

  const [benchmarkHistory, setBenchmarkHistory] = useState<any[]>([]);
  const [benchmarkLatest, setBenchmarkLatest] = useState<any | null>(null);
  const [benchmarkAllowed, setBenchmarkAllowed] = useState(false);
  const [benchmarkChecked, setBenchmarkChecked] = useState(false);
  const [benchmarkAction, setBenchmarkAction] = useState<HomeBenchmarkState["benchmarkAction"]>(null);
  const [benchmarkEmailModal, setBenchmarkEmailModal] = useState<null | "json" | "zip">(null);
  const [benchmarkEmailTo, setBenchmarkEmailTo] = useState("");
  const [benchmarkEmailError, setBenchmarkEmailError] = useState<string | null>(null);

  const handleRunBenchmark = async () => {
    if (!enableBenchmarkUi) return;
    try {
      setBenchmarkAction("run");
      setStatus("Running benchmark...");
      const { runBenchmark } = await import("../../lib/api");
      const result = await runBenchmark();
      const summary = result?.report?.summary;
      const modes = summary ? Object.keys(summary).length : "unknown";
      setStatus(`Benchmark complete. Modes evaluated: ${modes}`);
      setBenchmarkLatest(result?.report ?? null);
    } catch (e: any) {
      setStatus(e?.message || "Benchmark failed");
    } finally {
      setBenchmarkAction(null);
    }
  };

  const handleDownloadBenchmark = async () => {
    if (!enableBenchmarkUi) return;
    try {
      setBenchmarkAction("download_json");
      setStatus("Downloading report...");
      const { downloadBenchmarkReport } = await import("../../lib/api");
      const blob = await downloadBenchmarkReport();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "segmentation_benchmark_report.json";
      link.click();
      URL.revokeObjectURL(url);
      setStatus("Report downloaded");
    } catch (e: any) {
      setStatus(e?.message || "Download failed");
    } finally {
      setBenchmarkAction(null);
    }
  };

  const handleBenchmarkHistory = async () => {
    if (!enableBenchmarkUi) return;
    try {
      setBenchmarkAction("history");
      const { getBenchmarkHistory } = await import("../../lib/api");
      const history = await getBenchmarkHistory();
      setBenchmarkHistory(history);
    } catch (e: any) {
      setStatus(e?.message || "History load failed");
    } finally {
      setBenchmarkAction(null);
    }
  };

  const handleBenchmarkEmail = async (to: string): Promise<boolean> => {
    if (!enableBenchmarkUi) return false;
    try {
      setBenchmarkAction("email_json");
      setStatus("Sending report email...");
      const { emailBenchmarkReport } = await import("../../lib/api");
      await emailBenchmarkReport(to);
      setStatus(`Report emailed to ${to}`);
      return true;
    } catch (e: any) {
      setStatus(e?.message || "Email failed");
      setBenchmarkEmailError(e?.message || t("doc.benchmarkSendFailed"));
      return false;
    } finally {
      setBenchmarkAction(null);
    }
  };

  const handleDownloadBenchmarkZip = async () => {
    if (!enableBenchmarkUi) return;
    try {
      setBenchmarkAction("download_zip");
      setStatus("Downloading ZIP report...");
      const { downloadBenchmarkReportZip } = await import("../../lib/api");
      const blob = await downloadBenchmarkReportZip();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "segmentation_benchmark_report.zip";
      link.click();
      URL.revokeObjectURL(url);
      setStatus("ZIP report downloaded");
    } catch (e: any) {
      setStatus(e?.message || "ZIP download failed");
    } finally {
      setBenchmarkAction(null);
    }
  };

  const handleBenchmarkEmailZip = async (to: string): Promise<boolean> => {
    if (!enableBenchmarkUi) return false;
    try {
      setBenchmarkAction("email_zip");
      setStatus("Sending ZIP report email...");
      const { emailBenchmarkReportZip } = await import("../../lib/api");
      await emailBenchmarkReportZip(to);
      setStatus(`ZIP report emailed to ${to}`);
      return true;
    } catch (e: any) {
      setStatus(e?.message || "ZIP email failed");
      setBenchmarkEmailError(e?.message || t("doc.benchmarkSendFailed"));
      return false;
    } finally {
      setBenchmarkAction(null);
    }
  };

  const handleGoToBenchmarkAudit = () => {
    setBenchmarkAction("audit");
    nav("/admin/benchmark");
  };

  const openBenchmarkEmailModal = useCallback((kind: "json" | "zip") => {
    setBenchmarkEmailError(null);
    setBenchmarkEmailTo("");
    setBenchmarkEmailModal(kind);
  }, []);

  const closeBenchmarkEmailModal = useCallback(() => {
    setBenchmarkEmailModal(null);
    setBenchmarkEmailError(null);
    setBenchmarkEmailTo("");
  }, []);

  const submitBenchmarkEmail = async () => {
    if (!benchmarkEmailModal) return;
    const to = benchmarkEmailTo.trim();
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to);
    if (!isValid) {
      setBenchmarkEmailError(t("doc.benchmarkInvalidEmail"));
      return;
    }
    setBenchmarkEmailError(null);
    const ok = benchmarkEmailModal === "json" ? await handleBenchmarkEmail(to) : await handleBenchmarkEmailZip(to);
    if (ok) closeBenchmarkEmailModal();
  };

  // Escape key to close email modal
  useEffect(() => {
    if (!benchmarkEmailModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeBenchmarkEmailModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [benchmarkEmailModal, closeBenchmarkEmailModal]);

  // Initial benchmark data fetch
  useEffect(() => {
    (async () => {
      try {
        const { getBenchmarkLatest, getBenchmarkHistory, getBenchmarkAccess } = await import("../../lib/api");
        const access = await getBenchmarkAccess();
        setBenchmarkAllowed(access);
        if (access) {
          const latest = await getBenchmarkLatest();
          setBenchmarkLatest(latest?.report ?? null);
          const history = await getBenchmarkHistory();
          setBenchmarkHistory(history);
        }
      } catch {
        // Silent: benchmark endpoints may be disabled on server
      } finally {
        setBenchmarkChecked(true);
      }
    })();
  }, []);

  return {
    benchmarkHistory,
    benchmarkLatest,
    benchmarkAllowed,
    benchmarkChecked,
    benchmarkAction,
    benchmarkEmailModal,
    benchmarkEmailTo,
    benchmarkEmailError,
    enableBenchmarkUi,
    handleRunBenchmark,
    handleDownloadBenchmark,
    handleBenchmarkHistory,
    handleDownloadBenchmarkZip,
    handleGoToBenchmarkAudit,
    openBenchmarkEmailModal,
    closeBenchmarkEmailModal,
    submitBenchmarkEmail,
    setBenchmarkEmailTo,
    setBenchmarkEmailError,
  };
}
