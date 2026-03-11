/**
 * useDoiResolver — DOI validation, Crossref lookup, citation formatting, BibTeX
 */
import { useEffect, useState } from "react";
import { lookupCrossrefDoi } from "../../../lib/api";
import type { ResultItem } from "../types";
import { normalizeDoi, validateDoi } from "../utils/doi";

interface Deps {
  setStatus: (s: string) => void;
  logApiFailure: (endpoint: string, error: unknown) => void;
}

export function useDoiResolver({ setStatus, logApiFailure }: Deps) {
  const [doi, setDoi] = useState("");
  const [doiValidation, setDoiValidation] = useState<"empty" | "valid" | "invalid">("empty");
  const [crossrefResult, setCrossrefResult] = useState<ResultItem | null>(null);
  const [citationStyle, setCitationStyle] = useState<"APA" | "MLA" | "IEEE" | "Chicago" | "Harvard">("APA");
  const [bibtexKeyFormat, setBibtexKeyFormat] = useState<"author-year-title" | "title-year" | "doi" | "template">("author-year-title");
  const [bibtexKeyTemplate, setBibtexKeyTemplate] = useState("{author}{year}{shorttitle}");
  const [showBibTexPreview, setShowBibTexPreview] = useState(true);

  useEffect(() => { setDoiValidation(validateDoi(doi)); }, [doi]);

  const runDoiLookup = async () => {
    if (!doi.trim()) return;
    const normalized = normalizeDoi(doi);
    setStatus("Resolving DOI...");
    try {
      const res = await lookupCrossrefDoi(normalized || doi.trim());
      setCrossrefResult(res);
      setStatus("DOI resolved");
    } catch (e: any) {
      logApiFailure("crossref doi", e);
      setStatus(e?.message || "DOI lookup failed");
    }
  };

  const formatCitation = (style: "APA" | "MLA" | "IEEE" | "Chicago" | "Harvard") => {
    if (!crossrefResult?.title) return "";
    const { title, year, publisher, doi: d } = crossrefResult;
    const y = year || "n.d.";
    const p = publisher || "";
    const doiStr = d || "";
    if (style === "APA") return `${title}. (${y}). ${p}. ${doiStr}`.trim();
    if (style === "MLA") return `"${title}." ${p}, ${y}. ${doiStr}`.trim();
    if (style === "Chicago") return `${title}. ${p}, ${y}. ${doiStr}`.trim();
    if (style === "Harvard") return `${title}. ${y}. ${p}. ${doiStr}`.trim();
    return `${title}, ${p}, ${y}, ${doiStr}`.trim();
  };

  const copyCitation = async () => {
    const text = formatCitation(citationStyle);
    if (!text) return;
    try { await navigator.clipboard.writeText(text); setStatus("Citation copied"); }
    catch { setStatus("Failed to copy citation"); }
  };

  const buildBibTexKey = () => {
    if (!crossrefResult?.title) return "ref";
    const title = crossrefResult.title.replace(/[{}]/g, "");
    const year = crossrefResult.year || "";
    const doiVal = crossrefResult.doi || "";
    const firstAuthor = (crossrefResult.authors || [])[0] || "";
    const authorKey = firstAuthor ? firstAuthor.split(" ").slice(-1)[0] : "ref";
    const titleKey = title.split(" ").find((w) => w.length > 3) || title.split(" ")[0] || "ref";
    let rawKey = `${authorKey}${year}${titleKey}`;
    if (bibtexKeyFormat === "title-year") rawKey = `${titleKey}${year}`;
    else if (bibtexKeyFormat === "doi" && doiVal) rawKey = doiVal;
    else if (bibtexKeyFormat === "template") {
      rawKey = bibtexKeyTemplate
        .replace(/\{author\}/g, authorKey || "ref")
        .replace(/\{year\}/g, String(year || "nd"))
        .replace(/\{shorttitle\}/g, titleKey || "ref")
        .replace(/\{doi\}/g, doiVal || "nodoi");
    }
    return rawKey.toLowerCase().replace(/[^a-z0-9]/g, "") || "ref";
  };

  const buildBibTexEntry = () => {
    if (!crossrefResult?.title) return;
    const title = crossrefResult.title.replace(/[{}]/g, "");
    const year = crossrefResult.year || "";
    const doiVal = crossrefResult.doi || "";
    const publisher = crossrefResult.publisher || "";
    const url = crossrefResult.url || "";
    const authors = (crossrefResult.authors || []).map((a: string) => a.trim()).filter(Boolean).join(" and ");
    const key = buildBibTexKey();
    return [
      `@article{${key}${year || ""},`,
      `  title={${title}},`,
      authors ? `  author={${authors}},` : null,
      `  publisher={${publisher}},`,
      `  year={${year}},`,
      `  doi={${doiVal}},`,
      `  url={${url}},`,
      `}`,
    ].filter(Boolean).join("\n");
  };

  const exportBibTex = () => {
    const entry = buildBibTexEntry();
    if (!entry) return;
    const blob = new Blob([entry], { type: "text/x-bibtex" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${buildBibTexKey()}_${crossrefResult?.year || "ref"}.bib`;
    link.click();
    URL.revokeObjectURL(url);
    setStatus("BibTeX exported");
  };

  const copyBibTexEntry = async () => {
    const entry = buildBibTexEntry();
    if (!entry) return;
    try { await navigator.clipboard.writeText(entry); setStatus("BibTeX copied"); }
    catch { setStatus("Failed to copy BibTeX"); }
  };

  return {
    doi, setDoi,
    doiValidation,
    crossrefResult, setCrossrefResult,
    citationStyle, setCitationStyle,
    bibtexKeyFormat, setBibtexKeyFormat,
    bibtexKeyTemplate, setBibtexKeyTemplate,
    showBibTexPreview, setShowBibTexPreview,
    runDoiLookup,
    formatCitation, copyCitation,
    buildBibTexKey, buildBibTexEntry,
    exportBibTex, copyBibTexEntry,
  };
}
