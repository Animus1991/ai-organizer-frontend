/**
 * ProvenanceGraph — Interactive Force-Directed Visualization
 * Shows how ideas evolve: who proposed what, who extended it, who replicated it.
 * Uses react-force-graph-2d with zoom, pan, node highlighting.
 */
import React, { useCallback, useRef, useState, useMemo, useEffect } from 'react';
import ForceGraph2D, { type ForceGraphMethods } from 'react-force-graph-2d';
import { ZoomIn, ZoomOut, Maximize2, Info } from 'lucide-react';

interface GraphNode {
  id: string;
  label: string;
  type: 'ideation' | 'review' | 'data' | 'mentorship' | 'replication' | 'feedback' | 'curation';
  author: string;
  date: string;
  impactScore: number;
  x?: number;
  y?: number;
}

interface GraphLink {
  source: string;
  target: string;
  type: 'extends' | 'reviews' | 'replicates' | 'data-for' | 'mentors';
}

const TYPE_COLORS: Record<string, string> = {
  ideation: '#f59e0b',
  review: '#8b5cf6',
  data: '#3b82f6',
  mentorship: '#22c55e',
  replication: '#ef4444',
  feedback: '#06b6d4',
  curation: '#f97316',
};

const LINK_COLORS: Record<string, string> = {
  extends: '#8b5cf6',
  reviews: '#f59e0b',
  replicates: '#ef4444',
  'data-for': '#3b82f6',
  mentors: '#22c55e',
};

// Mock graph data
const MOCK_NODES: GraphNode[] = [
  { id: 'n1', label: 'CRISPR delivery hypothesis', type: 'ideation', author: 'Dr. Papadimitriou', date: '2026-01-15', impactScore: 92 },
  { id: 'n2', label: 'Methodology review', type: 'review', author: 'Prof. Georgiou', date: '2026-01-20', impactScore: 78 },
  { id: 'n3', label: 'Brain tissue dataset', type: 'data', author: 'Dr. Konstantinou', date: '2026-02-03', impactScore: 85 },
  { id: 'n4', label: 'PhD guidance: Bayesian methods', type: 'mentorship', author: 'Prof. Georgiou', date: '2026-02-10', impactScore: 70 },
  { id: 'n5', label: 'LNP experiment replication', type: 'replication', author: 'Dr. Dimitriou', date: '2026-02-28', impactScore: 88 },
  { id: 'n6', label: 'Statistical suggestion', type: 'feedback', author: 'Dr. Alexiou', date: '2026-03-01', impactScore: 55 },
  { id: 'n7', label: 'Systematic LNP review', type: 'curation', author: 'Dr. Papadimitriou', date: '2026-03-05', impactScore: 80 },
  { id: 'n8', label: 'Extended CRISPR model', type: 'ideation', author: 'Dr. Tsiakkas', date: '2026-03-06', impactScore: 75 },
  { id: 'n9', label: 'Cross-tissue comparison', type: 'data', author: 'Dr. Konstantinou', date: '2026-03-07', impactScore: 68 },
];

const MOCK_LINKS: GraphLink[] = [
  { source: 'n1', target: 'n2', type: 'reviews' },
  { source: 'n1', target: 'n3', type: 'data-for' },
  { source: 'n2', target: 'n4', type: 'mentors' },
  { source: 'n3', target: 'n5', type: 'replicates' },
  { source: 'n2', target: 'n6', type: 'extends' },
  { source: 'n1', target: 'n7', type: 'extends' },
  { source: 'n1', target: 'n8', type: 'extends' },
  { source: 'n3', target: 'n9', type: 'data-for' },
  { source: 'n7', target: 'n8', type: 'extends' },
];

export const ProvenanceGraph: React.FC = () => {
  const graphRef = useRef<ForceGraphMethods | undefined>();
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setDimensions({ width: entry.contentRect.width, height: Math.max(400, entry.contentRect.height) });
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const graphData = useMemo(() => ({
    nodes: MOCK_NODES.map(n => ({ ...n })),
    links: MOCK_LINKS.map(l => ({ ...l })),
  }), []);

  const connectedNodes = useMemo(() => {
    if (!hoveredNode) return new Set<string>();
    const connected = new Set<string>([hoveredNode]);
    MOCK_LINKS.forEach(l => {
      if (l.source === hoveredNode) connected.add(l.target);
      if (l.target === hoveredNode) connected.add(l.source);
    });
    return connected;
  }, [hoveredNode]);

  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const n = node as GraphNode;
    const size = 6 + (n.impactScore / 20);
    const isHovered = hoveredNode === n.id;
    const isConnected = connectedNodes.has(n.id);
    const dimmed = hoveredNode && !isConnected;
    const color = TYPE_COLORS[n.type] || '#888';

    ctx.beginPath();
    ctx.arc(node.x!, node.y!, size, 0, 2 * Math.PI);
    ctx.fillStyle = dimmed ? `${color}33` : color;
    ctx.fill();

    if (isHovered) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Glow
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, size + 2, 0, 2 * Math.PI);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Label
    if (globalScale > 1.2 || isHovered || isConnected) {
      const label = n.label.length > 25 ? n.label.slice(0, 25) + '…' : n.label;
      const fontSize = isHovered ? 12 / globalScale : 10 / globalScale;
      ctx.font = `${isHovered ? 'bold ' : ''}${fontSize}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = dimmed ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.9)';
      ctx.fillText(label, node.x!, node.y! + size + 4);
    }
  }, [hoveredNode, connectedNodes]);

  const linkCanvasObject = useCallback((link: any, ctx: CanvasRenderingContext2D) => {
    const src = link.source as any;
    const tgt = link.target as any;
    if (!src.x || !tgt.x) return;
    const linkType = (link as GraphLink).type;
    const color = LINK_COLORS[linkType] || '#555';
    const isHighlighted = hoveredNode && (connectedNodes.has(src.id) && connectedNodes.has(tgt.id));
    const dimmed = hoveredNode && !isHighlighted;

    ctx.beginPath();
    ctx.moveTo(src.x, src.y);
    ctx.lineTo(tgt.x, tgt.y);
    ctx.strokeStyle = dimmed ? `${color}15` : `${color}88`;
    ctx.lineWidth = isHighlighted ? 2 : 1;
    if (linkType === 'replicates') ctx.setLineDash([4, 4]);
    else ctx.setLineDash([]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Arrow
    const angle = Math.atan2(tgt.y - src.y, tgt.x - src.x);
    const arrowLen = 6;
    const mx = (src.x + tgt.x) / 2;
    const my = (src.y + tgt.y) / 2;
    ctx.beginPath();
    ctx.moveTo(mx, my);
    ctx.lineTo(mx - arrowLen * Math.cos(angle - Math.PI / 6), my - arrowLen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(mx, my);
    ctx.lineTo(mx - arrowLen * Math.cos(angle + Math.PI / 6), my - arrowLen * Math.sin(angle + Math.PI / 6));
    ctx.strokeStyle = dimmed ? `${color}15` : `${color}88`;
    ctx.stroke();
  }, [hoveredNode, connectedNodes]);

  const handleZoom = (delta: number) => {
    const fg = graphRef.current;
    if (!fg) return;
    const currentZoom = (fg as any).zoom?.() || 1;
    (fg as any).zoom?.(currentZoom * (1 + delta));
  };

  return (
    <div className="border border-border rounded-xl bg-card overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Idea Provenance Graph</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Interactive visualization of how ideas evolve and connect</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => handleZoom(0.3)} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground"><ZoomIn className="w-4 h-4" /></button>
          <button onClick={() => handleZoom(-0.3)} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground"><ZoomOut className="w-4 h-4" /></button>
          <button onClick={() => graphRef.current?.zoomToFit?.(400)} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground"><Maximize2 className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 border-b border-border flex flex-wrap gap-3">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <span key={type} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </span>
        ))}
      </div>

      <div ref={containerRef} className="relative" style={{ height: 500 }}>
        <ForceGraph2D
          ref={graphRef as any}
          graphData={graphData}
          width={dimensions.width}
          height={dimensions.height}
          nodeCanvasObject={nodeCanvasObject}
          linkCanvasObject={linkCanvasObject}
          onNodeHover={(node: any) => setHoveredNode(node?.id || null)}
          onNodeClick={(node: any) => setSelectedNode(node as GraphNode)}
          backgroundColor="transparent"
          nodeRelSize={6}
          linkDirectionalParticles={1}
          linkDirectionalParticleWidth={2}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
          cooldownTicks={100}
          enableZoomInteraction={true}
          enablePanInteraction={true}
        />
      </div>

      {/* Selected node detail */}
      {selectedNode && (
        <div className="p-4 border-t border-border bg-muted/30">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: TYPE_COLORS[selectedNode.type] }} />
                <span className="text-xs font-semibold uppercase text-muted-foreground">{selectedNode.type}</span>
              </div>
              <h4 className="text-sm font-semibold text-foreground mt-1">{selectedNode.label}</h4>
              <p className="text-xs text-muted-foreground mt-1">{selectedNode.author} · {selectedNode.date}</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-foreground">{selectedNode.impactScore}</div>
              <div className="text-[10px] text-muted-foreground">Impact Score</div>
            </div>
          </div>
          <button onClick={() => setSelectedNode(null)} className="mt-2 text-xs text-primary hover:underline">Close</button>
        </div>
      )}
    </div>
  );
};

export default ProvenanceGraph;
