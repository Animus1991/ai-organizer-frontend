/**
 * Segment Graph Visualization Component
 * 
 * Interactive network diagram showing segment relationships.
 * Uses react-force-graph-2d for visualization.
 */

import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { getDocumentGraph } from "../lib/api";
import type { GraphDataDTO, GraphNodeDTO } from "../lib/api";
import { useLoading } from "../hooks/useLoading";

function formatSegmentType(type: string): string {
  if (!type || type === "untyped") return "Untyped";
  return type
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

interface GraphVisualizationProps {
  documentId: number;
  onNodeClick?: (node: GraphNodeDTO) => void;
  onNodeHover?: (node: GraphNodeDTO | null) => void;
}

interface ForceGraphLink {
  id: number;
  source: number;
  target: number;
  type: string;
  color: string;
  notes: string | null;
}

export default function SegmentGraphVisualization({ documentId, onNodeClick, onNodeHover }: GraphVisualizationProps) {
  const { loading, execute } = useLoading();
  const [graphData, setGraphData] = useState<GraphDataDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNodeDTO | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterGrade, setFilterGrade] = useState<string>("all");
  const graphRef = useRef<any>(null);

  useEffect(() => {
    if (!Number.isFinite(documentId)) {
      setError("Invalid document ID");
      return;
    }

    execute(async () => {
      try {
        const data = await getDocumentGraph(documentId);
        setGraphData(data);
        setError(null);
      } catch (e: any) {
        setError(e?.message || "Failed to load graph data");
      }
    });
  }, [documentId, execute]);

  const filteredData = useMemo(() => {
    if (!graphData) return null;

    let filteredNodes = Array.isArray(graphData.nodes) ? [...graphData.nodes] : [];
    let filteredEdges = Array.isArray(graphData.edges) ? [...graphData.edges] : [];

    if (filterType !== "all") {
      filteredNodes = filteredNodes.filter(n => n.type === filterType);
      const nodeIds = new Set(filteredNodes.map(n => n.id));
      filteredEdges = filteredEdges.filter(e => nodeIds.has(e.from) && nodeIds.has(e.to));
    }

    if (filterGrade !== "all") {
      filteredNodes = filteredNodes.filter(n => n.evidenceGrade === filterGrade);
      const nodeIds = new Set(filteredNodes.map(n => n.id));
      filteredEdges = filteredEdges.filter(e => nodeIds.has(e.from) && nodeIds.has(e.to));
    }

    const links: ForceGraphLink[] = filteredEdges.map(edge => ({
      id: edge.id,
      source: edge.from,
      target: edge.to,
      type: edge.type,
      color: edge.color,
      notes: edge.notes,
    }));

    return { nodes: filteredNodes, links };
  }, [graphData, filterType, filterGrade]);

  const handleNodeClick = useCallback((node: any) => {
    const nodeData = graphData?.nodes.find(n => n.id === node.id);
    if (nodeData) {
      setSelectedNode(nodeData);
      onNodeClick?.(nodeData);
    }
  }, [graphData, onNodeClick]);

  const handleNodeHover = useCallback((node: any) => {
    if (node) {
      const nodeData = graphData?.nodes.find(n => n.id === node.id);
      if (nodeData) onNodeHover?.(nodeData);
    } else {
      onNodeHover?.(null);
    }
  }, [graphData, onNodeHover]);

  if (loading) {
    return (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, rgba(20, 20, 30, 0.8) 0%, rgba(15, 15, 25, 0.8) 100%)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "48px", height: "48px", border: "4px solid rgba(255, 255, 255, 0.1)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.6)" }}>Loading graph...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, rgba(20, 20, 30, 0.8) 0%, rgba(15, 15, 25, 0.8) 100%)" }}>
        <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "12px", padding: "24px", textAlign: "center" }}>
          <div style={{ fontSize: "24px", marginBottom: "8px" }}>⚠️</div>
          <p style={{ fontSize: "14px", color: "#ef4444" }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!graphData || !filteredData) return null;

  const uniqueTypes = Array.from(new Set(graphData.nodes.map(n => n.type))).sort();
  const uniqueGrades = Array.from(new Set(graphData.nodes.map(n => n.evidenceGrade).filter(Boolean))).sort();

  const selectStyle: React.CSSProperties = {
    padding: "6px 12px",
    background: "rgba(255, 255, 255, 0.1)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    borderRadius: "8px",
    color: "#eaeaea",
    fontSize: "14px",
    cursor: "pointer",
  };

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "linear-gradient(135deg, rgba(20, 20, 30, 0.8) 0%, rgba(15, 15, 25, 0.8) 100%)" }}>
      {/* Controls */}
      <div style={{ padding: "16px", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.7)" }}>Type:</label>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={selectStyle}>
            <option value="all">All Types</option>
            {uniqueTypes.map(type => (
              <option key={type} value={type}>{formatSegmentType(type)}</option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.7)" }}>Evidence:</label>
          <select value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)} style={selectStyle}>
            <option value="all">All Grades</option>
            {uniqueGrades.map(grade => (
              <option key={grade} value={grade!}>{grade}</option>
            ))}
          </select>
        </div>

        <div style={{ marginLeft: "auto", fontSize: "12px", color: "rgba(255, 255, 255, 0.6)" }}>
          {filteredData.nodes.length} nodes, {filteredData.links.length} links
        </div>

        <button
          onClick={() => graphRef.current?.zoomToFit(400, 20)}
          style={{ padding: "6px 12px", background: "rgba(99, 102, 241, 0.2)", border: "1px solid rgba(99, 102, 241, 0.4)", borderRadius: "8px", color: "#6366f1", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
        >
          Fit to Screen
        </button>
      </div>

      {/* Graph */}
      <div style={{ flex: 1, position: "relative" }}>
        <ForceGraph2D
          ref={graphRef}
          graphData={{
            nodes: filteredData.nodes,
            links: filteredData.links,
          }}
          nodeLabel={(node: any) => {
            const nd = graphData.nodes.find(n => n.id === node.id);
            if (!nd) return "";
            return `${nd.label}\nType: ${formatSegmentType(nd.type)}${nd.evidenceGrade ? `\nGrade: ${nd.evidenceGrade}` : ""}`;
          }}
          nodeColor={(node: any) => graphData.nodes.find(n => n.id === node.id)?.color || "#6b7280"}
          nodeVal={(node: any) => graphData.nodes.find(n => n.id === node.id)?.size || 20}
          linkLabel={(link: any) => `${link.type || ""}${link.notes ? `: ${link.notes}` : ""}`}
          linkColor={(link: any) => link.color || "#6b7280"}
          linkWidth={2}
          onNodeClick={handleNodeClick}
          onNodeHover={handleNodeHover}
          nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D) => {
            const nd = graphData.nodes.find(n => n.id === node.id);
            if (!nd) return;
            ctx.font = "12px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#eaeaea";
            ctx.fillText(nd.label, node.x || 0, (node.y || 0) + (nd.size || 20) + 10);
          }}
          cooldownTicks={100}
          onEngineStop={() => graphRef.current?.zoomToFit(400, 20)}
        />
      </div>

      {/* Selected Node Info */}
      {selectedNode && (
        <div style={{ padding: "16px", borderTop: "1px solid rgba(255, 255, 255, 0.1)", background: "rgba(20, 20, 30, 0.9)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#eaeaea", margin: 0 }}>{selectedNode.label}</h3>
            <button onClick={() => setSelectedNode(null)} style={{ padding: "4px 8px", background: "transparent", border: "none", color: "rgba(255, 255, 255, 0.6)", cursor: "pointer", fontSize: "20px" }}>×</button>
          </div>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "12px", color: "rgba(255, 255, 255, 0.6)" }}>
            <div><strong>Type:</strong> {formatSegmentType(selectedNode.type)}</div>
            {selectedNode.evidenceGrade && <div><strong>Evidence Grade:</strong> {selectedNode.evidenceGrade}</div>}
            <div><strong>Order:</strong> #{selectedNode.orderIndex + 1}</div>
            <div><strong>Manual:</strong> {selectedNode.isManual ? "Yes" : "No"}</div>
          </div>
        </div>
      )}
    </div>
  );
}
