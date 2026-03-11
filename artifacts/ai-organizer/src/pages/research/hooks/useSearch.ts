/**
 * useSearch — unified literature search across OpenAlex, Semantic Scholar, arXiv
 */
import { useEffect, useMemo, useState } from "react";
import {
  searchOpenAlex, searchSemanticScholar, searchArxiv,
  searchOpenAlexAuthors, searchOpenAlexInstitutions,
} from "../../../lib/api";
import type { ResultItem } from "../types";
import { dedupeResults } from "../utils/doi";

interface Deps {
  setStatus: (s: string) => void;
  logApiFailure: (endpoint: string, error: unknown) => void;
}

export function useSearch({ setStatus, logApiFailure }: Deps) {
  const [query, setQuery] = useState("");
  const [openalexResults, setOpenalexResults] = useState<ResultItem[]>([]);
  const [semanticResults, setSemanticResults] = useState<ResultItem[]>([]);
  const [arxivResults, setArxivResults] = useState<ResultItem[]>([]);
  const [dedupeOpenalex, setDedupeOpenalex] = useState(true);
  const [openalexYearFrom, setOpenalexYearFrom] = useState("");
  const [openalexYearTo, setOpenalexYearTo] = useState("");
  const [openalexVenue, setOpenalexVenue] = useState("");

  // Author / institution analytics
  const [authorQuery, setAuthorQuery] = useState("");
  const [institutionQuery, setInstitutionQuery] = useState("");
  const [authorQueryDebounced, setAuthorQueryDebounced] = useState("");
  const [institutionQueryDebounced, setInstitutionQueryDebounced] = useState("");
  const [authorResults, setAuthorResults] = useState<ResultItem[]>([]);
  const [institutionResults, setInstitutionResults] = useState<ResultItem[]>([]);

  const runSearch = async () => {
    if (!query.trim()) return;
    setStatus("Searching literature...");
    try {
      const [openalex, semantic, arxiv] = await Promise.all([
        searchOpenAlex(query, 1, 10),
        searchSemanticScholar(query, 10),
        searchArxiv(query, 10),
      ]);
      setOpenalexResults(openalex.results || []);
      setSemanticResults(semantic.results || []);
      setArxivResults(arxiv.results || []);
      setStatus("Results updated");
    } catch (e: any) {
      logApiFailure("openalex/semantic/arxiv search", e);
      setStatus(e?.message || "Search failed");
    }
  };

  const runAuthorSearch = async () => {
    if (!authorQuery.trim()) return;
    setStatus("Searching authors...");
    try {
      const data = await searchOpenAlexAuthors(authorQuery, 1, 10);
      setAuthorResults(data.results || []);
      setStatus("Author results updated");
    } catch (e: any) {
      logApiFailure("openalex authors", e);
      setStatus(e?.message || "Author search failed");
    }
  };

  const runInstitutionSearch = async () => {
    if (!institutionQuery.trim()) return;
    setStatus("Searching institutions...");
    try {
      const data = await searchOpenAlexInstitutions(institutionQuery, 1, 10);
      setInstitutionResults(data.results || []);
      setStatus("Institution results updated");
    } catch (e: any) {
      logApiFailure("openalex institutions", e);
      setStatus(e?.message || "Institution search failed");
    }
  };

  // Debounce author/institution queries
  useEffect(() => {
    const id = window.setTimeout(() => setAuthorQueryDebounced(authorQuery), 450);
    return () => window.clearTimeout(id);
  }, [authorQuery]);

  useEffect(() => {
    const id = window.setTimeout(() => setInstitutionQueryDebounced(institutionQuery), 450);
    return () => window.clearTimeout(id);
  }, [institutionQuery]);

  useEffect(() => {
    if (authorQueryDebounced.trim().length >= 3) runAuthorSearch();
  }, [authorQueryDebounced]);

  useEffect(() => {
    if (institutionQueryDebounced.trim().length >= 3) runInstitutionSearch();
  }, [institutionQueryDebounced]);

  // Derived data
  const openalexInsights = useMemo(() => {
    const source = dedupeOpenalex ? dedupeResults(openalexResults) : openalexResults;
    if (!source.length) return null;
    const years = source.map((i) => i.year).filter((y): y is number => typeof y === "number");
    const yearMin = years.length ? Math.min(...years) : null;
    const yearMax = years.length ? Math.max(...years) : null;
    const sortedYears = [...years].sort((a, b) => a - b);
    const medianYear = sortedYears.length ? sortedYears[Math.floor(sortedYears.length / 2)] : null;
    const venueCounts = source.reduce<Record<string, number>>((acc, item) => {
      const venue = (item.venue || "").trim();
      if (venue) acc[venue] = (acc[venue] || 0) + 1;
      return acc;
    }, {});
    const topVenue = Object.entries(venueCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
    const authorCounts = source.reduce<Record<string, number>>((acc, item) => {
      (item.authors || []).forEach((author) => {
        const name = author.trim();
        if (name) acc[name] = (acc[name] || 0) + 1;
      });
      return acc;
    }, {});
    const topAuthors = Object.entries(authorCounts).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([name]) => name);
    return { count: source.length, yearRange: yearMin && yearMax ? `${yearMin}–${yearMax}` : "n/a", topVenue, medianYear, topAuthors };
  }, [dedupeOpenalex, openalexResults]);

  const openalexDisplayResults = useMemo(
    () => (dedupeOpenalex ? dedupeResults(openalexResults) : openalexResults),
    [dedupeOpenalex, openalexResults]
  );

  const authorSummary = {
    count: authorResults.length,
    totalWorks: authorResults.reduce((sum: number, a: any) => sum + (a.worksCount || 0), 0),
    totalCited: authorResults.reduce((sum: number, a: any) => sum + (a.citedByCount || 0), 0),
  };

  const institutionSummary = {
    count: institutionResults.length,
    totalWorks: institutionResults.reduce((sum: number, a: any) => sum + (a.worksCount || 0), 0),
    totalCited: institutionResults.reduce((sum: number, a: any) => sum + (a.citedByCount || 0), 0),
  };

  return {
    query, setQuery,
    openalexResults, setOpenalexResults,
    semanticResults, setSemanticResults,
    arxivResults, setArxivResults,
    dedupeOpenalex, setDedupeOpenalex,
    openalexYearFrom, setOpenalexYearFrom,
    openalexYearTo, setOpenalexYearTo,
    openalexVenue, setOpenalexVenue,
    authorQuery, setAuthorQuery,
    institutionQuery, setInstitutionQuery,
    authorQueryDebounced, institutionQueryDebounced,
    authorResults, setAuthorResults,
    institutionResults, setInstitutionResults,
    runSearch, runAuthorSearch, runInstitutionSearch,
    openalexInsights, openalexDisplayResults,
    authorSummary, institutionSummary,
  };
}
