/**
 * usePrismaWorkflow — PRISMA systematic review state + exports
 */
import { useEffect, useState } from "react";
import { getPrismaState, savePrismaState } from "../../../lib/api";

interface Deps {
  selectedDocumentId: number | null;
  setStatus: (s: string) => void;
  logApiFailure: (endpoint: string, error: unknown) => void;
}

export function usePrismaWorkflow({ selectedDocumentId, setStatus, logApiFailure }: Deps) {
  const [prisma, setPrisma] = useState<any>({
    identified: 0, screened: 0, excluded: 0, fullTextAssessed: 0, included: 0, notes: "",
  });

  useEffect(() => {
    if (!selectedDocumentId) return;
    (async () => {
      try {
        const res = await getPrismaState(selectedDocumentId);
        setPrisma(res.state || prisma);
      } catch { /* ignore */ }
    })();
  }, [selectedDocumentId]);

  const updatePrisma = async (next: any) => {
    if (!selectedDocumentId) return;
    setPrisma(next);
    try { await savePrismaState(selectedDocumentId, next); }
    catch (e: any) { logApiFailure("prisma save", e); setStatus(e?.message || "PRISMA save failed"); }
  };

  const exportPrismaCsv = () => {
    const rows = [["Stage", "Count"], ["Identified", prisma.identified], ["Screened", prisma.screened], ["Excluded", prisma.excluded], ["FullTextAssessed", prisma.fullTextAssessed], ["Included", prisma.included]];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = "prisma_report.csv"; link.click();
    URL.revokeObjectURL(url);
  };

  const exportPrismaExcel = () => {
    const html = `<table><tr><th>Stage</th><th>Count</th></tr><tr><td>Identified</td><td>${prisma.identified}</td></tr><tr><td>Screened</td><td>${prisma.screened}</td></tr><tr><td>Excluded</td><td>${prisma.excluded}</td></tr><tr><td>FullTextAssessed</td><td>${prisma.fullTextAssessed}</td></tr><tr><td>Included</td><td>${prisma.included}</td></tr></table>`;
    const blob = new Blob([html], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = "prisma_report.xls"; link.click();
    URL.revokeObjectURL(url);
  };

  return {
    prisma, setPrisma,
    updatePrisma, exportPrismaCsv, exportPrismaExcel,
  };
}
