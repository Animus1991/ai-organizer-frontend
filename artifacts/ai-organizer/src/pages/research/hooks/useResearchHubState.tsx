/**
 * useResearchHubState — compositor hook
 * Composes all domain hooks into a single unified API for backward compatibility.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../../auth/useAuth";
import { useTour } from "../../../components/tour/useTour";
import { normalizeDoi } from "../utils/doi";

import { useResearchInfra } from "./useResearchInfra";
import { useSearch } from "./useSearch";
import { useDoiResolver } from "./useDoiResolver";
import { useDocumentContext } from "./useDocumentContext";
import { useZotero } from "./useZotero";
import { useMendeley } from "./useMendeley";
import { useResultsPagination } from "./useResultsPagination";
import { useTagPresets } from "./useTagPresets";
import { useLibraryManager } from "./useLibraryManager";
import { usePrismaWorkflow } from "./usePrismaWorkflow";

export function useResearchHubState() {
  const { isAuthed, loading: authLoading } = useAuth();

  // ── Infrastructure (status, toast, telemetry, auth) ──
  const infra = useResearchInfra();
  const { setStatus, logApiFailure, showInlineToast, hasRole } = infra;

  // ── Role checks ──
  const canUseResearchTools = isAuthed && hasRole(["researcher", "admin"]);
  const canUseLibrary = isAuthed && hasRole(["researcher", "admin"]);
  const isAdmin = isAuthed && hasRole(["admin"]);

  // ── Dense mode ──
  const [denseMode, setDenseMode] = useState(false);
  useEffect(() => {
    const raw = localStorage.getItem("researchHubDenseMode");
    if (raw) setDenseMode(raw === "true");
  }, []);
  useEffect(() => {
    localStorage.setItem("researchHubDenseMode", String(denseMode));
  }, [denseMode]);

  // ── Domain hooks ──
  const search = useSearch({ setStatus, logApiFailure });
  const doi = useDoiResolver({ setStatus, logApiFailure });
  const docCtx = useDocumentContext({ setStatus });
  const presets = useTagPresets({ showInlineToast, setStatus });

  const library = useLibraryManager({
    setStatus,
    logApiFailure,
    showInlineToast,
    normalizeTagsInput: presets.normalizeTagsInput,
  });

  const zotero = useZotero({
    setStatus,
    logApiFailure,
    loadLibrary: library.loadLibrary,
  });

  const mendeley = useMendeley({ setStatus, logApiFailure });

  const results = useResultsPagination({
    openalexResults: search.openalexDisplayResults,
    semanticResults: search.semanticResults,
    arxivResults: search.arxivResults,
  });

  const prismaWf = usePrismaWorkflow({
    selectedDocumentId: docCtx.selectedDocumentId,
    setStatus,
    logApiFailure,
  });

  // ── Exports (cross-cutting) ──
  const [exportStatus, setExportStatus] = useState("");

  const escapeLatex = (input: string) =>
    input.replace(/\\/g, "\\textbackslash{}").replace(/%/g, "\\%").replace(/&/g, "\\&").replace(/_/g, "\\_").replace(/#/g, "\\#").replace(/\$/g, "\\$").replace(/\{/g, "\\{").replace(/\}/g, "\\}").replace(/\^/g, "\\^{}").replace(/~/g, "\\~{}");

  const exportMarkdown = () => {
    if (!docCtx.segmentRows.length) return;
    const lines: string[] = [`# Research Export\n`];
    docCtx.segmentRows.forEach((seg: any, idx: number) => {
      lines.push(`## ${seg.title || `Segment ${idx + 1}`}\n`);
      lines.push((seg.content || "").trim());
      lines.push("\n");
    });
    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = "research_export.md"; link.click();
    URL.revokeObjectURL(url);
    setExportStatus("Markdown exported");
  };

  const exportLatex = () => {
    if (!docCtx.segmentRows.length) return;
    const lines = ["\\documentclass{article}", "\\usepackage[utf8]{inputenc}", "\\begin{document}", "\\section*{Research Export}"];
    docCtx.segmentRows.forEach((seg: any, idx: number) => {
      lines.push(`\\subsection*{${escapeLatex(seg.title || `Segment ${idx + 1}`)}}`);
      lines.push(escapeLatex((seg.content || "").trim()));
    });
    lines.push("\\end{document}");
    const blob = new Blob([lines.join("\n")], { type: "text/x-tex" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = "research_export.tex"; link.click();
    URL.revokeObjectURL(url);
    setExportStatus("LaTeX exported");
  };

  const formatCitationLine = (item: any) => {
    const authors = (item.authors || []).join(", ");
    const year = item.year ? `(${item.year})` : "";
    const venue = item.venue ? ` ${item.venue}` : "";
    const doiStr = item.doi ? ` DOI: ${item.doi}` : "";
    return `${authors} ${year} ${item.title || ""}${venue}.${doiStr}`.trim();
  };

  const exportOpenAlexWorksCsv = (mode: "full" | "doi-only" | "citation-only" = "full") => {
    const { dedupeOpenalex, openalexResults, openalexYearFrom, openalexYearTo, openalexVenue, openalexDisplayResults } = search;
    const fromYear = openalexYearFrom ? Number(openalexYearFrom) : null;
    const toYear = openalexYearTo ? Number(openalexYearTo) : null;
    const source = openalexDisplayResults;
    const filtered = source.filter((item: any) => {
      if (!item.year) return false;
      if (fromYear && item.year < fromYear) return false;
      if (toYear && item.year > toYear) return false;
      if (openalexVenue && item.venue && !String(item.venue).toLowerCase().includes(openalexVenue.toLowerCase())) return false;
      return true;
    });
    if (!filtered.length) { setStatus("No OpenAlex results in the selected year range"); return; }
    let rows: string[][];
    if (mode === "doi-only") rows = [["doi"], ...filtered.filter((i: any) => i.doi).map((i: any) => [i.doi])];
    else if (mode === "citation-only") rows = [["citation"], ...filtered.map((i: any) => [formatCitationLine(i)])];
    else rows = [["title", "year", "venue", "doi", "url"], ...filtered.map((i: any) => [i.title || "", i.year || "", i.venue || "", i.doi || "", i.url || ""])];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = `openalex_works_${mode}_${fromYear || "all"}_${toYear || "all"}.csv`; link.click();
    URL.revokeObjectURL(url);
  };

  const exportOpenAlexCsv = (kind: "authors" | "institutions") => {
    const items = kind === "authors" ? search.authorResults : search.institutionResults;
    if (!items.length) return;
    const rows = [["name", "worksCount", "citedByCount", "url"], ...items.map((i: any) => [i.name || "", i.worksCount || 0, i.citedByCount || 0, i.url || ""])];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = `openalex_${kind}.csv`; link.click();
    URL.revokeObjectURL(url);
  };

  const exportOpenAlexPng = (kind: "authors" | "institutions") => {
    const items = kind === "authors" ? search.authorResults : search.institutionResults;
    if (!items.length) return;
    const field = kind === "authors" ? "citedByCount" : "worksCount";
    const title = kind === "authors" ? "Top Authors by Citations" : "Top Institutions by Works";
    const data = items.slice(0, 5);
    const canvas = document.createElement("canvas"); canvas.width = 700; canvas.height = 380;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const style = getComputedStyle(document.documentElement);
    const bg = style.getPropertyValue("--background").trim() || "222.2 84% 4.9%";
    const fg = style.getPropertyValue("--foreground").trim() || "210 40% 98%";
    ctx.fillStyle = `hsl(${bg})`; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = `hsl(${fg})`; ctx.font = "bold 18px sans-serif"; ctx.fillText(title, 24, 32);
    const maxVal = Math.max(...data.map((d: any) => d[field] || 0), 1);
    data.forEach((d: any, idx: number) => {
      const y = 70 + idx * 48;
      ctx.fillStyle = `hsl(${fg} / 0.6)`; ctx.font = "12px sans-serif"; ctx.fillText(d.name || "Unknown", 24, y + 22);
      const barWidth = Math.round(((d[field] || 0) / maxVal) * 460);
      ctx.fillStyle = `hsl(var(--primary, 217 91% 60%))`; ctx.fillRect(200, y + 6, barWidth, 18);
      ctx.fillStyle = `hsl(${fg})`; ctx.fillText(String(d[field] || 0), 670, y + 20);
    });
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a"); link.href = url; link.download = `openalex_${kind}.png`; link.click();
  };

  // ── Tour ──
  const pageContainerRef = useRef<HTMLDivElement | null>(null);
  const tourRefs = {
    unifiedSearch: useRef<HTMLDivElement | null>(null),
    doiResolver: useRef<HTMLDivElement | null>(null),
    documentContext: useRef<HTMLDivElement | null>(null),
    knowledgeGraph: useRef<HTMLDivElement | null>(null),
    researchTables: useRef<HTMLDivElement | null>(null),
    writingExport: useRef<HTMLDivElement | null>(null),
    zotero: useRef<HTMLDivElement | null>(null),
    openalexAnalytics: useRef<HTMLDivElement | null>(null),
    prisma: useRef<HTMLDivElement | null>(null),
    libraryDb: useRef<HTMLDivElement | null>(null),
    presets: useRef<HTMLDivElement | null>(null),
    mendeley: useRef<HTMLDivElement | null>(null),
    results: useRef<HTMLDivElement | null>(null),
  };

  const tourSteps = useMemo(() => [
    { key: "welcome", title: "Research Hub", body: "This guided tour introduces every tool on the page.", ref: null as any },
    { key: "unifiedSearch", title: "Unified Literature Search", body: "Search OpenAlex, Semantic Scholar, and arXiv in a single query.", ref: tourRefs.unifiedSearch },
    { key: "doiResolver", title: "DOI Resolver", body: "Validate a DOI and pull canonical metadata from Crossref.", ref: tourRefs.doiResolver },
    { key: "documentContext", title: "Document Research Context", body: "Load metrics, graphs, and segments for a document in one place.", ref: tourRefs.documentContext },
    { key: "knowledgeGraph", title: "Knowledge Graph & Backlinks", body: "Review top-linked concepts and their relationships.", ref: tourRefs.knowledgeGraph },
    { key: "researchTables", title: "Research Tables", body: "OpenAI-powered tables for quick research structuring.", ref: tourRefs.researchTables },
    { key: "writingExport", title: "Writing & Export", body: "Export structured research for writing workflows.", ref: tourRefs.writingExport },
    { key: "zotero", title: "Zotero Integration", body: "Sync and manage your Zotero library and imports.", ref: tourRefs.zotero },
    { key: "openalexAnalytics", title: "OpenAlex Analytics", body: "Explore author and institution analytics from OpenAlex.", ref: tourRefs.openalexAnalytics },
    { key: "prisma", title: "PRISMA Workflow", body: "Track systematic review counts and export PRISMA reports.", ref: tourRefs.prisma },
    { key: "libraryDb", title: "Research Library", body: "Manage your saved items with tags, categories, and bulk edits.", ref: tourRefs.libraryDb },
    { key: "presets", title: "Preset Library", body: "Organize reusable tag presets with history and bulk operations.", ref: tourRefs.presets },
    { key: "mendeley", title: "Mendeley Citation Manager", body: "Connect your Mendeley account and import references.", ref: tourRefs.mendeley },
    { key: "results", title: "Results Panels", body: "Browse results with auto-load as you scroll.", ref: tourRefs.results },
  ], []);

  const { tourOpen, tourStepIndex, tourPopoverPos, startTour, closeTour, nextTourStep, prevTourStep, getTourHighlightStyle } = useTour({
    storageKey: "researchHubTourSeen",
    steps: tourSteps,
    containerRef: pageContainerRef,
  });

  // ── Unified return (backward-compatible API surface) ──
  return {
    // Infrastructure
    ...infra,
    isAuthed, authLoading,
    canUseResearchTools, canUseLibrary, isAdmin,
    denseMode, setDenseMode,
    exportStatus, setExportStatus,

    // Search
    ...search,

    // DOI
    ...doi,

    // Document context
    ...docCtx,

    // Zotero
    ...zotero,

    // Mendeley
    ...mendeley,

    // Results pagination
    ...results,

    // Tag presets
    ...presets,

    // Library
    ...library,

    // PRISMA
    ...prismaWf,

    // Cross-cutting exports
    exportMarkdown, exportLatex,
    formatCitationLine, exportOpenAlexWorksCsv,
    exportOpenAlexCsv, exportOpenAlexPng,

    // Tour
    pageContainerRef, tourRefs, tourSteps,
    tourOpen, tourStepIndex, tourPopoverPos,
    startTour, closeTour, nextTourStep, prevTourStep, getTourHighlightStyle,

    // Utilities (re-export for backward compat)
    normalizeDoi,
  };
}

export type ResearchHubState = ReturnType<typeof useResearchHubState>;
