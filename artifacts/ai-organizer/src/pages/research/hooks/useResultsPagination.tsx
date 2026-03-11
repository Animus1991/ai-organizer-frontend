/**
 * useResultsPagination — infinite scroll + renderList + VirtualList
 */
import React, { useEffect, useRef, useState } from "react";
import type { ResultItem } from "../types";

interface Deps {
  openalexResults: ResultItem[];
  semanticResults: ResultItem[];
  arxivResults: ResultItem[];
}

export function useResultsPagination({ openalexResults, semanticResults, arxivResults }: Deps) {
  const [openalexVisibleCount, setOpenalexVisibleCount] = useState(20);
  const [semanticVisibleCount, setSemanticVisibleCount] = useState(20);
  const [arxivVisibleCount, setArxivVisibleCount] = useState(20);
  const [openalexIsLoadingMore, setOpenalexIsLoadingMore] = useState(false);
  const [semanticIsLoadingMore, setSemanticIsLoadingMore] = useState(false);
  const [arxivIsLoadingMore, setArxivIsLoadingMore] = useState(false);
  const openalexLoadRef = useRef<HTMLDivElement | null>(null);
  const semanticLoadRef = useRef<HTMLDivElement | null>(null);
  const arxivLoadRef = useRef<HTMLDivElement | null>(null);
  const lastOpenalexLoadRef = useRef(0);
  const lastSemanticLoadRef = useRef(0);
  const lastArxivLoadRef = useRef(0);

  // Reset counts on new results
  useEffect(() => { setOpenalexVisibleCount(20); }, [openalexResults]);
  useEffect(() => { setSemanticVisibleCount(20); }, [semanticResults]);
  useEffect(() => { setArxivVisibleCount(20); }, [arxivResults]);

  // Intersection observers
  useEffect(() => {
    if (!openalexLoadRef.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || openalexVisibleCount >= openalexResults.length) return;
      if (Date.now() - lastOpenalexLoadRef.current < 500) return;
      lastOpenalexLoadRef.current = Date.now();
      setOpenalexIsLoadingMore(true);
      setOpenalexVisibleCount((prev) => Math.min(prev + 20, openalexResults.length || prev + 20));
      window.setTimeout(() => setOpenalexIsLoadingMore(false), 400);
    }, { rootMargin: "200px" });
    observer.observe(openalexLoadRef.current);
    return () => observer.disconnect();
  }, [openalexResults.length, openalexVisibleCount]);

  useEffect(() => {
    if (!semanticLoadRef.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || semanticVisibleCount >= semanticResults.length) return;
      if (Date.now() - lastSemanticLoadRef.current < 500) return;
      lastSemanticLoadRef.current = Date.now();
      setSemanticIsLoadingMore(true);
      setSemanticVisibleCount((prev) => Math.min(prev + 20, semanticResults.length || prev + 20));
      window.setTimeout(() => setSemanticIsLoadingMore(false), 400);
    }, { rootMargin: "200px" });
    observer.observe(semanticLoadRef.current);
    return () => observer.disconnect();
  }, [semanticResults.length, semanticVisibleCount]);

  useEffect(() => {
    if (!arxivLoadRef.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || arxivVisibleCount >= arxivResults.length) return;
      if (Date.now() - lastArxivLoadRef.current < 500) return;
      lastArxivLoadRef.current = Date.now();
      setArxivIsLoadingMore(true);
      setArxivVisibleCount((prev) => Math.min(prev + 20, arxivResults.length || prev + 20));
      window.setTimeout(() => setArxivIsLoadingMore(false), 400);
    }, { rootMargin: "200px" });
    observer.observe(arxivLoadRef.current);
    return () => observer.disconnect();
  }, [arxivResults.length, arxivVisibleCount]);

  // renderList — uses Tailwind tokens instead of hardcoded colors
  const renderList = (
    items: ResultItem[],
    visibleCount: number,
    loadMoreRef: React.RefObject<HTMLDivElement | null>,
    isLoadingMore: boolean
  ) => (
    <div className="grid gap-2">
      {items.slice(0, visibleCount).map((r, idx) => (
        <div
          key={`${r.title}-${idx}`}
          className="rounded-lg border border-border bg-muted/30 px-3 py-2.5"
        >
          <div className="text-sm font-semibold text-foreground">{r.title}</div>
          <div className="text-xs text-muted-foreground">
            {r.authors?.length ? `Authors: ${r.authors.slice(0, 3).join(", ")}` : null}
            {r.year ? ` • ${r.year}` : ""}
            {r.venue ? ` • ${r.venue}` : ""}
          </div>
          {r.url && (
            <a href={r.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
              Open source
            </a>
          )}
        </div>
      ))}
      {items.length > visibleCount && <div ref={loadMoreRef} className="h-px w-full" />}
      {isLoadingMore && <div className="text-xs text-muted-foreground">Loading more…</div>}
      <div className="text-xs text-muted-foreground">
        Showing {Math.min(visibleCount, items.length)} of {items.length}
      </div>
    </div>
  );

  // VirtualList — extracted as proper component
  const VirtualList = <T,>({
    items, height, itemHeight, renderItem,
  }: {
    items: T[];
    height: number;
    itemHeight: number;
    renderItem: (item: T, index: number) => React.ReactNode;
  }) => {
    const [scrollTop, setScrollTop] = useState(0);
    const totalHeight = items.length * itemHeight;
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(items.length - 1, Math.floor((scrollTop + height) / itemHeight));
    const visibleItems = items.slice(startIndex, endIndex + 1);

    return (
      <div
        style={{ height, overflowY: "auto" }}
        className="grid gap-2"
        onScroll={(event) => setScrollTop((event.currentTarget as HTMLDivElement).scrollTop)}
      >
        <div style={{ height: totalHeight, position: "relative" }}>
          {visibleItems.map((item, idx) => (
            <div key={`${startIndex + idx}`} style={{ position: "absolute", top: (startIndex + idx) * itemHeight, left: 0, right: 0 }}>
              {renderItem(item, startIndex + idx)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return {
    openalexVisibleCount, setOpenalexVisibleCount,
    semanticVisibleCount, setSemanticVisibleCount,
    arxivVisibleCount, setArxivVisibleCount,
    openalexIsLoadingMore, setOpenalexIsLoadingMore,
    semanticIsLoadingMore, setSemanticIsLoadingMore,
    arxivIsLoadingMore, setArxivIsLoadingMore,
    openalexLoadRef, semanticLoadRef, arxivLoadRef,
    lastOpenalexLoadRef, lastSemanticLoadRef, lastArxivLoadRef,
    renderList, VirtualList,
  };
}
