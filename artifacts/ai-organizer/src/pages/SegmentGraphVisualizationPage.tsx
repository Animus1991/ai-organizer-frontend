/**
 * Segment Graph Visualization Page
 * 
 * Full-page wrapper for the graph visualization component.
 */

import React, { useState, useEffect, useRef, Suspense, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { useTour } from "../components/tour/useTour";
import { TourPanel } from "../components/tour/TourPanel";
import { PageShell } from "../components/layout/PageShell";
import { ScreenshotMode } from "../components/ScreenshotMode";
import { AdvancedGraphVisualization, type LayoutMode } from "../components/ui/AdvancedGraphVisualization";
import { getDocument, listSegmentsWithMeta } from "../lib/api";
import { useLanguage } from "../context/LanguageContext";

export default function SegmentGraphVisualizationPage() {
  const { documentId } = useParams();
  const nav = useNavigate();
  const { t } = useLanguage();
  const docId = Number(documentId);
  const pageContainerRef = useRef<HTMLDivElement | null>(null);
  const [screenshotModeActive, setScreenshotModeActive] = useState(false);
  const tourRefs = {
    header: useRef<HTMLDivElement | null>(null),
    graph: useRef<HTMLDivElement | null>(null),
  };

  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('force');
  const [visualizationMode, setVisualizationMode] = useState<
    "network" | "matrix" | "timeline" | "table" | "stats" | "distributions" | "components" | "ranking"
  >("network");

  // Layout mode configurations with scientific descriptions
  const layoutModes: { mode: LayoutMode; label: string; icon: string; description: string }[] = [
    { mode: 'force', label: t('graph.layout.force'), icon: '🌐', description: t('graph.layout.forceDesc') },
    { mode: 'hierarchical', label: t('graph.layout.hierarchical'), icon: '🌳', description: t('graph.layout.hierarchicalDesc') },
    { mode: 'radial', label: t('graph.layout.radial'), icon: '🎯', description: t('graph.layout.radialDesc') },
    { mode: 'timeline', label: t('graph.layout.timeline'), icon: '📊', description: t('graph.layout.timelineDesc') },
    { mode: 'cluster', label: t('graph.layout.cluster'), icon: '🔬', description: t('graph.layout.clusterDesc') },
  ];

  const viewModes: {
    mode: "network" | "matrix" | "timeline" | "table" | "stats" | "distributions" | "components" | "ranking";
    label: string;
    description: string;
  }[] = [
    { mode: "network", label: t("graph.view.network"), description: t("graph.view.networkDesc") },
    { mode: "matrix", label: t("graph.view.matrix"), description: t("graph.view.matrixDesc") },
    { mode: "timeline", label: t("graph.view.timeline"), description: t("graph.view.timelineDesc") },
    { mode: "table", label: t("graph.view.table"), description: t("graph.view.tableDesc") },
    { mode: "stats", label: t("graph.view.stats"), description: t("graph.view.statsDesc") },
    { mode: "distributions", label: t("graph.view.distributions"), description: t("graph.view.distributionsDesc") },
    { mode: "components", label: t("graph.view.components"), description: t("graph.view.componentsDesc") },
    { mode: "ranking", label: t("graph.view.ranking"), description: t("graph.view.rankingDesc") },
  ];

  useEffect(() => {
    let cancelled = false;

    async function loadGraph() {
      if (!docId || Number.isNaN(docId)) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const [doc, qa, paragraphs] = await Promise.all([
          getDocument(docId).catch(() => null),
          listSegmentsWithMeta(docId, "qa").catch(() => null),
          listSegmentsWithMeta(docId, "paragraphs").catch(() => null),
        ]);

        if (cancelled) return;

        const allSegments: any[] = [];
        if (qa?.items) {
          allSegments.push(
            ...qa.items.map((s: any) => ({
              ...s,
              __mode: "qa" as const,
            }))
          );
        }
        if (paragraphs?.items) {
          allSegments.push(
            ...paragraphs.items.map((s: any) => ({
              ...s,
              __mode: "paragraphs" as const,
            }))
          );
        }

        const graphNodes: any[] = [];
        const graphEdges: any[] = [];

        // Root document node
        graphNodes.push({
          id: `doc:${docId}`,
          label: doc?.title || `Document #${docId}`,
          type: "document",
          color: "#10b981",
          size: 24,
        });

        // Segment nodes and edges from document to segments
        allSegments.forEach((seg: any) => {
          const mode = seg.__mode as "qa" | "paragraphs";
          const baseLabel = seg.title || seg.shortTitle || seg.mode || `Segment ${seg.id}`;
          const label =
            typeof baseLabel === "string" && baseLabel.length > 80
              ? `${baseLabel.slice(0, 77)}…`
              : baseLabel;
          const length =
            typeof seg.content === "string"
              ? seg.content.length
              : typeof seg.end === "number" && typeof seg.start === "number"
                ? seg.end - seg.start
                : 0;

          graphNodes.push({
            id: String(seg.id),
            label,
            type: "segment",
            mode,
            color: mode === "qa" ? "#6366f1" : "#8b5cf6",
            size: 16,
            data: {
              start: seg.start ?? null,
              end: seg.end ?? null,
              length,
              orderIndex: seg.orderIndex ?? null,
              isManual: !!seg.isManual,
              title: seg.title ?? null,
            },
          });

          graphEdges.push({
            source: `doc:${docId}`,
            target: String(seg.id),
            type: "reference",
          });
        });

        // Sequential edges per mode (visualize reading flow)
        const byMode: Record<"qa" | "paragraphs", any[]> = { qa: [], paragraphs: [] };
        allSegments.forEach((seg: any) => {
          if (seg.__mode === "qa") byMode.qa.push(seg);
          if (seg.__mode === "paragraphs") byMode.paragraphs.push(seg);
        });

        (Object.keys(byMode) as Array<"qa" | "paragraphs">).forEach((m) => {
          const group = byMode[m];
          if (group.length <= 1) return;

          group.sort((a: any, b: any) => {
            if (typeof a.start === "number" && typeof b.start === "number") {
              return a.start - b.start;
            }
            return Number(a.id) - Number(b.id);
          });

          for (let i = 0; i < group.length - 1; i++) {
            const cur = group[i];
            const next = group[i + 1];
            if (!cur || !next) continue;
            graphEdges.push({
              source: String(cur.id),
              target: String(next.id),
              type: "semantic",
            });
          }
        });

        setNodes(graphNodes);
        setEdges(graphEdges);
      } catch (e: any) {
        console.error("Failed to load graph data", e);
        setError(e?.message || "Failed to load graph data.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadGraph();
    return () => {
      cancelled = true;
    };
  }, [docId, reloadToken]);

  const segmentNodes = useMemo(() => nodes.filter((n) => n.type === "segment"), [nodes]);
  const segmentEdges = useMemo(
    () => edges.filter((e) => !String(e.source).startsWith("doc:") && !String(e.target).startsWith("doc:")),
    [edges]
  );
  const degreeMap = useMemo(() => {
    const map = new Map<string, number>();
    segmentEdges.forEach((e) => {
      map.set(String(e.source), (map.get(String(e.source)) || 0) + 1);
      map.set(String(e.target), (map.get(String(e.target)) || 0) + 1);
    });
    return map;
  }, [segmentEdges]);

  const degreeStats = useMemo(() => {
    const degrees = segmentNodes
      .map((n: any) => degreeMap.get(String(n.id)) || 0)
      .filter((n: number) => !Number.isNaN(n));
    const total = degrees.reduce((acc: number, n: number) => acc + n, 0);
    const max = degrees.length ? Math.max(...degrees) : 0;
    const avg = degrees.length ? Math.round(total / degrees.length) : 0;
    return { degrees, total, max, avg };
  }, [segmentNodes, degreeMap]);

  const connectedComponents = useMemo(() => {
    const nodesSet = new Set(segmentNodes.map((n: any) => String(n.id)));
    const adj = new Map<string, Set<string>>();
    nodesSet.forEach((id) => adj.set(id, new Set()));

    segmentEdges.forEach((e: any) => {
      const a = String(e.source);
      const b = String(e.target);
      if (!nodesSet.has(a) || !nodesSet.has(b)) return;
      adj.get(a)?.add(b);
      adj.get(b)?.add(a);
    });

    const seen = new Set<string>();
    const comps: string[][] = [];
    nodesSet.forEach((start) => {
      if (seen.has(start)) return;
      const stack = [start];
      const comp: string[] = [];
      seen.add(start);
      while (stack.length) {
        const cur = stack.pop();
        if (!cur) continue;
        comp.push(cur);
        adj.get(cur)?.forEach((nxt) => {
          if (!seen.has(nxt)) {
            seen.add(nxt);
            stack.push(nxt);
          }
        });
      }
      comps.push(comp);
    });

    comps.sort((a, b) => b.length - a.length);
    return comps;
  }, [segmentNodes, segmentEdges]);

  const topByDegree = useMemo(() => {
    return [...segmentNodes]
      .map((n: any) => ({ n, degree: degreeMap.get(String(n.id)) || 0 }))
      .sort((a, b) => b.degree - a.degree)
      .slice(0, 20);
  }, [segmentNodes, degreeMap]);
  const modeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    segmentNodes.forEach((n: any) => {
      const mode = n.mode || "unknown";
      counts[mode] = (counts[mode] || 0) + 1;
    });
    return counts;
  }, [segmentNodes]);
  const maxMatrixNodes = 24;
  const matrixNodes = useMemo(() => segmentNodes.slice(0, maxMatrixNodes), [segmentNodes]);
  const matrixEdgeSet = useMemo(() => {
    const set = new Set<string>();
    const allowed = new Set(matrixNodes.map((n) => String(n.id)));
    segmentEdges.forEach((e) => {
      const src = String(e.source);
      const tgt = String(e.target);
      if (allowed.has(src) && allowed.has(tgt)) {
        set.add(`${src}|${tgt}`);
        set.add(`${tgt}|${src}`);
      }
    });
    return set;
  }, [segmentEdges, matrixNodes]);
  const sortedSegments = useMemo(() => {
    return [...segmentNodes].sort((a: any, b: any) => {
      const aStart = a?.data?.start ?? null;
      const bStart = b?.data?.start ?? null;
      if (typeof aStart === "number" && typeof bStart === "number") return aStart - bStart;
      const aOrder = a?.data?.orderIndex ?? null;
      const bOrder = b?.data?.orderIndex ?? null;
      if (typeof aOrder === "number" && typeof bOrder === "number") return aOrder - bOrder;
      return String(a.id).localeCompare(String(b.id));
    });
  }, [segmentNodes]);
  const lengthStats = useMemo(() => {
    const lengths = segmentNodes.map((n: any) => Number(n?.data?.length ?? 0)).filter((n) => !Number.isNaN(n));
    const total = lengths.reduce((acc, n) => acc + n, 0);
    const max = lengths.length ? Math.max(...lengths) : 0;
    const avg = lengths.length ? Math.round(total / lengths.length) : 0;
    return { total, max, avg };
  }, [segmentNodes]);

  const handleNodeClick = (node: any) => {
    if (!docId || Number.isNaN(docId)) return;
    // Navigate to document workspace and optionally highlight the segment
    if (node?.type === "segment") {
      nav(`/documents/${docId}?highlight=${node.id}`);
    } else {
      nav(`/documents/${docId}`);
    }
  };

  const tourSteps = [
    {
      key: "welcome",
      title: "Segment Graph Visualization",
      body: "Visualize how segments in your document relate to each other. The graph reveals structural patterns, clusters, and connections that inform your research workflow — from discovery through validation.",
      ref: null as React.RefObject<HTMLDivElement | null> | null,
    },
    {
      key: "header",
      title: "Navigation & Layout Controls",
      body: "Switch between layout algorithms (force, radial, hierarchical) and visualization modes (network, matrix, timeline, stats). Return to the document workspace to continue editing or segmenting.",
      ref: tourRefs.header,
    },
    {
      key: "graph",
      title: "Interactive Graph Canvas",
      body: "Click nodes to inspect segments, drag to rearrange, and zoom to explore clusters. Edges represent semantic or structural links — use these insights to refine your theory construction in the Thinking Workspace.",
      ref: tourRefs.graph,
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
    storageKey: "segmentGraphTourSeen",
    steps: tourSteps,
    containerRef: pageContainerRef,
  });

  return (
    <PageShell>
    <div
      ref={pageContainerRef}
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "hsl(var(--background))",
        paddingTop: tourPopoverPos?.pushDownPadding
          ? Math.round(tourPopoverPos.pushDownPadding)
          : undefined,
      }}
    >
      {/* Header */}
      <div
        ref={tourRefs.header}
        style={{
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          background: "linear-gradient(135deg, rgba(20, 20, 30, 0.95) 0%, rgba(15, 15, 25, 0.95) 100%)",
          ...(getTourHighlightStyle(tourRefs.header) || {}),
        }}
      >
        <div
          className="page-shell"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            padding: "14px 22px",
            gap: 16,
          }}
        >
          <div>
            <h1 className="page-title" style={{ margin: 0, marginBottom: "4px" }}>
              {t("graph.title")}
            </h1>
            <p className="page-subtitle" style={{ margin: 0 }}>
              {t("graph.subtitle", { docId })}
            </p>
          </div>
          <div
            className="page-actions"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 10,
              paddingLeft: 12,
              paddingRight: 4,
              transform: "translateX(80px)",
            }}
          >
            {/* View Mode Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '8px', padding: '4px' }}>
              {viewModes.map(({ mode, label, description }) => (
                <button
                  key={mode}
                  onClick={() => setVisualizationMode(mode)}
                  title={description}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    background: visualizationMode === mode
                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.35), rgba(99, 102, 241, 0.25))'
                      : 'transparent',
                    color: visualizationMode === mode ? '#a7f3d0' : 'rgba(255, 255, 255, 0.6)',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: visualizationMode === mode ? 600 : 400,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            {visualizationMode === "network" && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '8px', padding: '4px' }}>
                {layoutModes.map(({ mode, label, icon, description }) => (
                  <button
                    key={mode}
                    onClick={() => setLayoutMode(mode)}
                    title={description}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      background: layoutMode === mode 
                        ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.4), rgba(139, 92, 246, 0.3))' 
                        : 'transparent',
                      color: layoutMode === mode ? '#c7d2fe' : 'rgba(255, 255, 255, 0.6)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: layoutMode === mode ? 600 : 400,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span>{icon}</span>
                    <span style={{ display: 'none' }} className="layout-label">{label}</span>
                  </button>
                ))}
              </div>
            )}
            {error && (
              <span
                className="chip"
                style={{
                  background: "rgba(239, 68, 68, 0.14)",
                  border: "1px solid rgba(239, 68, 68, 0.35)",
                  color: "rgba(252, 165, 165, 0.95)",
                }}
                title={error}
              >
                {t("status.error")}
              </span>
            )}
            <span
              className="chip"
              style={{
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.10)",
                color: "rgba(255, 255, 255, 0.75)",
              }}
              title={t("graph.nodes")}
            >
              {t("graph.nodesCount", { count: nodes.length })}
            </span>
            <span
              className="chip"
              style={{
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.10)",
                color: "rgba(255, 255, 255, 0.75)",
              }}
              title={t("graph.edges")}
            >
              {t("graph.edgesCount", { count: edges.length })}
            </span>
            <button
              onClick={() => setReloadToken((v) => v + 1)}
              className="btn btn-sm btn-secondary"
              disabled={loading}
              title={t("graph.refreshTitle")}
            >
              {loading ? t("status.loading") : t("action.refresh")}
            </button>
            <button onClick={() => nav(`/documents/${docId}`)} className="btn btn-sm btn-secondary">
              {t("graph.backToDocument")}
            </button>
            <button onClick={startTour} className="btn btn-sm btn-tertiary">
              {t("btn.startTour")}
            </button>
          </div>
        </div>
      </div>

      {/* Graph Visualization */}
      <div
        ref={tourRefs.graph}
        style={{ flex: 1, minHeight: 0, ...(getTourHighlightStyle(tourRefs.graph) || {}) }}
      >
        {visualizationMode === "network" ? (
          <ErrorBoundary
            fallback={
              <div style={{ 
                flex: 1, 
                display: "flex", 
                flexDirection: "column", 
                alignItems: "center", 
                justifyContent: "center", 
                padding: "24px",
                background: "rgba(0, 0, 0, 0.3)",
                borderRadius: "12px",
                margin: "12px"
              }}>
                <div style={{ 
                  width: "48px", 
                  height: "48px", 
                  background: "rgba(239, 68, 68, 0.2)", 
                  borderRadius: "12px", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  marginBottom: "16px" 
                }}>
                  <svg style={{ width: "24px", height: "24px", color: "#ef4444" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#eaeaea", marginBottom: "8px" }}>
                  {t("graph.errorTitle")}
                </h3>
                <p style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.6)", textAlign: "center", marginBottom: "16px" }}>
                  {t("graph.errorDesc")}
                </p>
                <button
                  onClick={() => nav(`/documents/${docId}`)}
                  style={{
                    padding: "8px 16px",
                    background: "rgba(99, 102, 241, 0.2)",
                    border: "1px solid rgba(99, 102, 241, 0.4)",
                    borderRadius: "8px",
                    color: "#6366f1",
                    fontSize: "14px",
                    fontWeight: 500,
                    cursor: "pointer",
                    marginRight: "8px",
                  }}
                >
                  {t("graph.backToDocument")}
                </button>
                <button
                  onClick={() => window.location.reload()}
                  style={{
                    padding: "8px 16px",
                    background: "rgba(99, 102, 241, 0.2)",
                    border: "1px solid rgba(99, 102, 241, 0.4)",
                    borderRadius: "8px",
                    color: "#6366f1",
                    fontSize: "14px",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  {t("action.refreshPage")}
                </button>
              </div>
            }
          >
            <Suspense
              fallback={
                <div style={{ 
                  flex: 1, 
                  display: "flex", 
                  flexDirection: "column", 
                  alignItems: "center", 
                  justifyContent: "center",
                  padding: "24px"
                }}>
                  <div style={{ 
                    width: "48px", 
                    height: "48px", 
                    border: "4px solid rgba(99, 102, 241, 0.2)", 
                    borderTopColor: "#6366f1",
                    borderRadius: "50%", 
                    animation: "spin 1s linear infinite",
                    marginBottom: "16px"
                  }} />
                  <p style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.6)" }}>{t("graph.loadingVisualization")}</p>
                  <style>{`
                    @keyframes spin {
                      to { transform: rotate(360deg); }
                    }
                  `}</style>
                </div>
              }
            >
              <AdvancedGraphVisualization
                nodes={nodes}
                edges={edges}
                onNodeClick={handleNodeClick}
                layoutMode={layoutMode}
              />
            </Suspense>
          </ErrorBoundary>
        ) : visualizationMode === "matrix" ? (
          <div style={{ padding: 16, overflow: "auto", height: "100%" }}>
            {segmentNodes.length > maxMatrixNodes && (
              <div style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.6)", marginBottom: 10 }}>
                {t("graph.matrix.truncated", { shown: maxMatrixNodes, total: segmentNodes.length })}
              </div>
            )}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `160px repeat(${matrixNodes.length}, 18px)`,
                gap: 4,
                alignItems: "center",
              }}
            >
              <div />
              {matrixNodes.map((n: any) => (
                <div
                  key={`col-${n.id}`}
                  style={{
                    writingMode: "vertical-rl",
                    transform: "rotate(180deg)",
                    fontSize: 10,
                    color: "rgba(255, 255, 255, 0.6)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {String(n.label).slice(0, 18)}
                </div>
              ))}
              {matrixNodes.map((row: any) => (
                <React.Fragment key={`row-${row.id}`}>
                  <div style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.8)" }}>
                    {String(row.label).slice(0, 26)}
                  </div>
                  {matrixNodes.map((col: any) => {
                    const active = matrixEdgeSet.has(`${row.id}|${col.id}`);
                    const isSelf = row.id === col.id;
                    return (
                      <div
                        key={`${row.id}-${col.id}`}
                        title={active ? t("graph.matrix.link") : t("graph.matrix.none")}
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 4,
                          background: isSelf
                            ? "rgba(16, 185, 129, 0.35)"
                            : active
                              ? "rgba(99, 102, 241, 0.6)"
                              : "rgba(255, 255, 255, 0.06)",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                        }}
                      />
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        ) : visualizationMode === "timeline" ? (
          <div style={{ padding: 16, overflow: "auto", height: "100%" }}>
            {sortedSegments.map((n: any, idx: number) => {
              const length = Number(n?.data?.length ?? 0);
              const barWidth = lengthStats.max ? Math.max(2, (length / lengthStats.max) * 100) : 0;
              return (
                <div key={n.id} style={{ display: "grid", gridTemplateColumns: "220px 1fr 140px", gap: 12, alignItems: "center", padding: "6px 0" }}>
                  <div style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.75)" }}>
                    {idx + 1}. {String(n.label).slice(0, 40)}
                  </div>
                  <div style={{ height: 10, background: "rgba(255,255,255,0.08)", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ width: `${barWidth}%`, height: "100%", background: "linear-gradient(90deg, rgba(99,102,241,0.6), rgba(16,185,129,0.6))" }} />
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.6)", textAlign: "right" }}>
                    {length} {t("unit.chars")}
                  </div>
                </div>
              );
            })}
          </div>
        ) : visualizationMode === "table" ? (
          <div style={{ padding: 16, overflow: "auto", height: "100%" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ textAlign: "left", color: "rgba(255,255,255,0.7)" }}>
                  <th style={{ padding: "8px 6px" }}>{t("graph.table.index")}</th>
                  <th style={{ padding: "8px 6px" }}>{t("graph.table.title")}</th>
                  <th style={{ padding: "8px 6px" }}>{t("graph.table.mode")}</th>
                  <th style={{ padding: "8px 6px" }}>{t("graph.table.length")}</th>
                  <th style={{ padding: "8px 6px" }}>{t("graph.table.degree")}</th>
                  <th style={{ padding: "8px 6px" }}>{t("graph.table.source")}</th>
                </tr>
              </thead>
              <tbody>
                {segmentNodes.map((n: any, idx: number) => (
                  <tr key={n.id} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <td style={{ padding: "8px 6px" }}>{idx + 1}</td>
                    <td style={{ padding: "8px 6px", color: "rgba(255,255,255,0.85)" }}>{String(n.label).slice(0, 60)}</td>
                    <td style={{ padding: "8px 6px" }}>{n.mode || "-"}</td>
                    <td style={{ padding: "8px 6px" }}>{Number(n?.data?.length ?? 0)} {t("unit.chars")}</td>
                    <td style={{ padding: "8px 6px" }}>{degreeMap.get(String(n.id)) || 0}</td>
                    <td style={{ padding: "8px 6px" }}>{n?.data?.isManual ? t("common.manual") : t("common.auto")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : visualizationMode === "distributions" ? (
          <div style={{ padding: 16, overflow: "auto", height: "100%" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
              <div style={{ padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.8)", marginBottom: 10 }}>
                  {t("graph.dist.length")}
                </div>
                {(() => {
                  const max = Math.max(1, lengthStats.max || 1);
                  const bins = 10;
                  const hist = Array.from({ length: bins }, () => 0);
                  segmentNodes.forEach((n: any) => {
                    const v = Math.max(0, Math.min(max, Number(n?.data?.length ?? 0)));
                    const idx = Math.min(bins - 1, Math.floor((v / max) * bins));
                    hist[idx] += 1;
                  });
                  const peak = Math.max(1, ...hist);
                  return (
                    <div style={{ display: "grid", gap: 8 }}>
                      {hist.map((c, i) => (
                        <div key={i} style={{ display: "grid", gridTemplateColumns: "70px 1fr 50px", gap: 10, alignItems: "center" }}>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>{i + 1}</div>
                          <div style={{ height: 10, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                            <div style={{ width: `${(c / peak) * 100}%`, height: "100%", background: "linear-gradient(90deg, rgba(99,102,241,0.6), rgba(16,185,129,0.6))" }} />
                          </div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", textAlign: "right" }}>{c}</div>
                        </div>
                      ))}
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 6 }}>
                        {t("graph.stats.avgLength")}: {lengthStats.avg} {t("unit.chars")} • {t("graph.stats.maxLength")}: {lengthStats.max} {t("unit.chars")}
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div style={{ padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.8)", marginBottom: 10 }}>
                  {t("graph.dist.degree")}
                </div>
                {(() => {
                  const max = Math.max(1, degreeStats.max || 1);
                  const bins = 10;
                  const hist = Array.from({ length: bins }, () => 0);
                  degreeStats.degrees.forEach((d: number) => {
                    const v = Math.max(0, Math.min(max, d));
                    const idx = Math.min(bins - 1, Math.floor((v / max) * bins));
                    hist[idx] += 1;
                  });
                  const peak = Math.max(1, ...hist);
                  return (
                    <div style={{ display: "grid", gap: 8 }}>
                      {hist.map((c, i) => (
                        <div key={i} style={{ display: "grid", gridTemplateColumns: "70px 1fr 50px", gap: 10, alignItems: "center" }}>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>{i + 1}</div>
                          <div style={{ height: 10, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                            <div style={{ width: `${(c / peak) * 100}%`, height: "100%", background: "linear-gradient(90deg, rgba(16,185,129,0.55), rgba(99,102,241,0.55))" }} />
                          </div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", textAlign: "right" }}>{c}</div>
                        </div>
                      ))}
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 6 }}>
                        {t("graph.ranking.degree")}: {degreeStats.avg} (avg) • max {degreeStats.max}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        ) : visualizationMode === "components" ? (
          <div style={{ padding: 16, overflow: "auto", height: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>{t("graph.components.title")}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>
                  {connectedComponents.length} component(s) • {t("graph.components.largest")}: {connectedComponents[0]?.length || 0}
                </div>
              </div>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {connectedComponents.slice(0, 50).map((comp, idx) => {
                const pct = segmentNodes.length ? Math.round((comp.length / segmentNodes.length) * 100) : 0;
                return (
                  <div key={idx} style={{ padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>#{idx + 1}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)" }}>{comp.length} nodes</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{pct}%</div>
                    </div>
                    <div style={{ height: 10, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden", marginTop: 8 }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, rgba(99,102,241,0.55), rgba(16,185,129,0.55))" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : visualizationMode === "ranking" ? (
          <div style={{ padding: 16, overflow: "auto", height: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>{t("graph.ranking.title")}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{t("graph.ranking.degree")} • top {topByDegree.length}</div>
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {topByDegree.map(({ n, degree }, idx) => (
                <button
                  key={String(n.id)}
                  onClick={() => handleNodeClick(n)}
                  style={{
                    textAlign: "left",
                    padding: 12,
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    cursor: "pointer",
                    color: "inherit",
                  }}
                  title={t("graph.ranking.open")}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {idx + 1}. {String(n.label)}
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", whiteSpace: "nowrap" }}>{degree}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ padding: 16, overflow: "auto", height: "100%" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 16 }}>
              <div style={{ padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>{t("graph.stats.totalSegments")}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#eaeaea" }}>{segmentNodes.length}</div>
              </div>
              <div style={{ padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>{t("graph.stats.totalEdges")}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#eaeaea" }}>{segmentEdges.length}</div>
              </div>
              <div style={{ padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>{t("graph.stats.avgLength")}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#eaeaea" }}>{lengthStats.avg} {t("unit.chars")}</div>
              </div>
              <div style={{ padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>{t("graph.stats.maxLength")}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#eaeaea" }}>{lengthStats.max} {t("unit.chars")}</div>
              </div>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {Object.entries(modeCounts).map(([mode, count]) => {
                const width = segmentNodes.length ? (count / segmentNodes.length) * 100 : 0;
                return (
                  <div key={mode}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
                      <span>{mode}</span>
                      <span>{count}</span>
                    </div>
                    <div style={{ height: 10, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden", marginTop: 4 }}>
                      <div style={{ width: `${width}%`, height: "100%", background: "linear-gradient(90deg, rgba(16,185,129,0.55), rgba(99,102,241,0.55))" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
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
    </PageShell>
  );
}
