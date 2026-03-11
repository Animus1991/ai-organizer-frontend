import { useCallback, useState } from "react";
import { search } from "../../../lib/api";
import type { SearchHit } from "../types";
import { extractTitleFromText, stripIdsFromText, truncateText } from "../utils/text";

export function useSearch() {
  const [q, setQ] = useState("");
  const [k, setK] = useState(20);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);

  const run = useCallback(async () => {
    const trimmed = q.trim();
    if (!trimmed) {
      setErr("Please enter a query.");
      return;
    }
    if (!Number.isFinite(k) || k <= 0) {
      setErr("Top-K must be a positive number.");
      return;
    }
    setLoading(true);
    setErr("");
    try {
      const response = await search(trimmed, { limit: k });
      const mapped = response.results.map((item) => {
        const rawTitle = item.title || extractTitleFromText(item.content || "");
        const title = stripIdsFromText(rawTitle) || "Untitled";
        const snippetSource = item.content || "";
        const snippet = stripIdsFromText(truncateText(snippetSource, 220)) || "No preview available.";
        return {
          id: String(item.id),
          docId: Number(item.documentId ?? item.id),
          title,
          snippet,
          score: item.score ?? null,
          createdAt: null,
        } satisfies SearchHit;
      });
      setHits(mapped);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Search failed.";
      setErr(message);
    } finally {
      setLoading(false);
    }
  }, [k, q]);

  // Saved searches — persisted in localStorage
  const SAVED_SEARCHES_KEY = "frontendWorkspaceSavedSearches";
  const [savedSearches, setSavedSearches] = useState<{ query: string; k: number; ts: number }[]>(() => {
    try { return JSON.parse(localStorage.getItem(SAVED_SEARCHES_KEY) || "[]"); } catch { return []; }
  });

  const saveCurrentSearch = useCallback(() => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setSavedSearches(prev => {
      const updated = [{ query: trimmed, k, ts: Date.now() }, ...prev.filter(s => s.query !== trimmed)].slice(0, 20);
      try { localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
      return updated;
    });
  }, [q, k]);

  const loadSavedSearch = useCallback((query: string, topK: number) => {
    setQ(query);
    setK(topK);
  }, []);

  const deleteSavedSearch = useCallback((query: string) => {
    setSavedSearches(prev => {
      const updated = prev.filter(s => s.query !== query);
      try { localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
      return updated;
    });
  }, []);

  return {
    q,
    setQ,
    k,
    setK,
    loading,
    err,
    hits,
    setHits,
    run,
    savedSearches,
    saveCurrentSearch,
    loadSavedSearch,
    deleteSavedSearch,
  };
}
