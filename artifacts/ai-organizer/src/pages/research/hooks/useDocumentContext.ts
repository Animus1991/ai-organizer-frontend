/**
 * useDocumentContext — document selection, metrics, graph, segments
 */
import { useEffect, useMemo, useState } from "react";
import { listUploads, getResearchMetrics, getDocumentGraph, listSegments } from "../../../lib/api";

interface Deps {
  setStatus: (s: string) => void;
}

export function useDocumentContext({ setStatus }: Deps) {
  const [uploads, setUploads] = useState<{ documentId: number; filename: string }[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);
  const [metrics, setMetrics] = useState<any | null>(null);
  const [graph, setGraph] = useState<any | null>(null);
  const [segmentRows, setSegmentRows] = useState<any[]>([]);

  // Load uploads on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await listUploads(1, 100);
        setUploads((res.items || []).map((u: any) => ({ documentId: u.documentId, filename: u.filename })));
      } catch { /* ignore */ }
    })();
  }, []);

  // Load context on document selection
  useEffect(() => {
    if (!selectedDocumentId) {
      setMetrics(null);
      setGraph(null);
      setSegmentRows([]);
      return;
    }
    (async () => {
      try {
        setStatus("Loading research metrics...");
        const [m, g, s] = await Promise.all([
          getResearchMetrics(selectedDocumentId),
          getDocumentGraph(selectedDocumentId),
          listSegments(selectedDocumentId),
        ]);
        setMetrics(m);
        setGraph(g);
        setSegmentRows(s.items || []);
        setStatus("Research metrics loaded");
      } catch (e: any) {
        setStatus(e?.message || "Failed to load research metrics");
      }
    })();
  }, [selectedDocumentId]);

  const topLinked = useMemo(() => {
    if (!graph?.nodes?.length) return [];
    const counts: Record<number, number> = {};
    for (const edge of graph.edges || []) {
      counts[edge.from] = (counts[edge.from] || 0) + 1;
      counts[edge.to] = (counts[edge.to] || 0) + 1;
    }
    return [...graph.nodes]
      .map((n: any) => ({ ...n, linkCount: counts[n.id] || 0 }))
      .sort((a: any, b: any) => b.linkCount - a.linkCount)
      .slice(0, 5);
  }, [graph]);

  return {
    uploads, setUploads,
    selectedDocumentId, setSelectedDocumentId,
    metrics, setMetrics,
    graph, setGraph,
    segmentRows, setSegmentRows,
    topLinked,
  };
}
