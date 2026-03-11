/**
 * AdvancedGraphVisualization - Industry-standard graph view with full features
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';

interface Node {
  id: string;
  label: string;
  type: 'segment' | 'document' | 'claim' | 'folder';
  mode?: 'qa' | 'paragraphs';
  x?: number;
  y?: number;
  color?: string;
  size?: number;
  data?: any;
}

interface Edge {
  source: string;
  target: string;
  type: 'reference' | 'claim' | 'semantic' | 'folder';
  weight?: number;
  label?: string;
}

export type LayoutMode = 'force' | 'hierarchical' | 'radial' | 'timeline' | 'cluster';

interface GraphVisualizationProps {
  nodes: Node[];
  edges: Edge[];
  onNodeClick?: (node: Node) => void;
  onEdgeClick?: (edge: Edge) => void;
  layoutMode?: LayoutMode;
}

export const AdvancedGraphVisualization: React.FC<GraphVisualizationProps> = ({
  nodes,
  edges,
  onNodeClick,
  layoutMode = 'force',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [spacePressed, setSpacePressed] = useState(false);
  const [physicsEnabled, setPhysicsEnabled] = useState(true);
  const panStartRef = useRef<{ x: number; y: number } | null>(null);
  const panOriginRef = useRef<{ x: number; y: number } | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [showQa, setShowQa] = useState(true);
  const [showParagraphs, setShowParagraphs] = useState(true);
  const [selectedNodeData, setSelectedNodeData] = useState<Node | null>(null);

  const filteredNodes = useMemo(() => {
    return nodes.filter(n => {
      if (n.type === 'document') return true;
      if (n.mode === 'qa') return showQa;
      if (n.mode === 'paragraphs') return showParagraphs;
      return true;
    });
  }, [nodes, showQa, showParagraphs]);

  const filteredEdges = useMemo(() => {
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    return edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));
  }, [edges, filteredNodes]);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(false);
        setIsPanning(false);
        panStartRef.current = null;
        panOriginRef.current = null;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const initializePositions = useCallback(() => {
    const nodeMap = new Map<string, Node>();
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    
    // Find document node (root)
    const docNode = filteredNodes.find(n => n.type === 'document');
    const segmentNodes = filteredNodes.filter(n => n.type !== 'document');
    
    // Group segments by mode for cluster layout
    const qaNodes = segmentNodes.filter(n => n.mode === 'qa');
    const paragraphNodes = segmentNodes.filter(n => n.mode === 'paragraphs');
    
    switch (layoutMode) {
      case 'hierarchical': {
        // Tree-like layout: document at top, segments below
        if (docNode) {
          nodeMap.set(docNode.id, { ...docNode, x: centerX, y: 80 });
        }
        const totalSegments = segmentNodes.length;
        const rowHeight = 120;
        const cols = Math.ceil(Math.sqrt(totalSegments * 2));
        segmentNodes.forEach((node, idx) => {
          const row = Math.floor(idx / cols);
          const col = idx % cols;
          const rowNodes = Math.min(cols, totalSegments - row * cols);
          const startX = centerX - (rowNodes - 1) * 80 / 2;
          nodeMap.set(node.id, {
            ...node,
            x: startX + col * 80,
            y: 180 + row * rowHeight,
          });
        });
        break;
      }
      
      case 'radial': {
        // Radial layout: document at center, segments in circles
        if (docNode) {
          nodeMap.set(docNode.id, { ...docNode, x: centerX, y: centerY });
        }
        const radius1 = Math.min(dimensions.width, dimensions.height) * 0.25;
        const radius2 = Math.min(dimensions.width, dimensions.height) * 0.4;
        
        qaNodes.forEach((node, idx) => {
          const angle = (idx / Math.max(qaNodes.length, 1)) * 2 * Math.PI - Math.PI / 2;
          nodeMap.set(node.id, {
            ...node,
            x: centerX + Math.cos(angle) * radius1,
            y: centerY + Math.sin(angle) * radius1,
          });
        });
        
        paragraphNodes.forEach((node, idx) => {
          const angle = (idx / Math.max(paragraphNodes.length, 1)) * 2 * Math.PI - Math.PI / 2;
          nodeMap.set(node.id, {
            ...node,
            x: centerX + Math.cos(angle) * radius2,
            y: centerY + Math.sin(angle) * radius2,
          });
        });
        break;
      }
      
      case 'timeline': {
        // Linear timeline layout: segments arranged horizontally by order
        if (docNode) {
          nodeMap.set(docNode.id, { ...docNode, x: 60, y: centerY });
        }
        const spacing = Math.max(60, (dimensions.width - 150) / Math.max(segmentNodes.length, 1));
        
        // Sort by id (which typically reflects order)
        const sortedSegments = [...segmentNodes].sort((a, b) => {
          const aNum = parseInt(a.id.replace(/\D/g, '')) || 0;
          const bNum = parseInt(b.id.replace(/\D/g, '')) || 0;
          return aNum - bNum;
        });
        
        sortedSegments.forEach((node, idx) => {
          const yOffset = node.mode === 'qa' ? -50 : 50;
          nodeMap.set(node.id, {
            ...node,
            x: 150 + idx * spacing,
            y: centerY + yOffset,
          });
        });
        break;
      }
      
      case 'cluster': {
        // Cluster layout: group by mode
        if (docNode) {
          nodeMap.set(docNode.id, { ...docNode, x: centerX, y: 60 });
        }
        
        // QA cluster on left
        const qaClusterX = dimensions.width * 0.3;
        const qaClusterY = dimensions.height * 0.55;
        const qaRadius = Math.min(150, Math.sqrt(qaNodes.length) * 40);
        qaNodes.forEach((node, idx) => {
          const angle = (idx / Math.max(qaNodes.length, 1)) * 2 * Math.PI;
          nodeMap.set(node.id, {
            ...node,
            x: qaClusterX + Math.cos(angle) * qaRadius * (0.5 + Math.random() * 0.5),
            y: qaClusterY + Math.sin(angle) * qaRadius * (0.5 + Math.random() * 0.5),
          });
        });
        
        // Paragraphs cluster on right
        const paraClusterX = dimensions.width * 0.7;
        const paraClusterY = dimensions.height * 0.55;
        const paraRadius = Math.min(150, Math.sqrt(paragraphNodes.length) * 40);
        paragraphNodes.forEach((node, idx) => {
          const angle = (idx / Math.max(paragraphNodes.length, 1)) * 2 * Math.PI;
          nodeMap.set(node.id, {
            ...node,
            x: paraClusterX + Math.cos(angle) * paraRadius * (0.5 + Math.random() * 0.5),
            y: paraClusterY + Math.sin(angle) * paraRadius * (0.5 + Math.random() * 0.5),
          });
        });
        break;
      }
      
      case 'force':
      default: {
        // Original force-directed initialization (circular)
        filteredNodes.forEach((node, index) => {
          if (!node.x || !node.y) {
            const angle = (index / Math.max(filteredNodes.length, 1)) * 2 * Math.PI;
            const radius = Math.min(dimensions.width, dimensions.height) * 0.3;
            nodeMap.set(node.id, {
              ...node,
              x: centerX + Math.cos(angle) * radius,
              y: centerY + Math.sin(angle) * radius,
            });
          } else {
            nodeMap.set(node.id, node);
          }
        });
        break;
      }
    }
    
    return Array.from(nodeMap.values());
  }, [filteredNodes, dimensions, layoutMode]);

  const [positionedNodes, setPositionedNodes] = useState<Node[]>(initializePositions);

  useEffect(() => {
    setPositionedNodes(initializePositions());
  }, [initializePositions]);

  const applyForces = useCallback(() => {
    const newNodes = [...positionedNodes];
    const forces = new Map<string, { x: number; y: number }>();
    
    newNodes.forEach(node => forces.set(node.id, { x: 0, y: 0 }));

    for (let i = 0; i < newNodes.length; i++) {
      for (let j = i + 1; j < newNodes.length; j++) {
        const node1 = newNodes[i];
        const node2 = newNodes[j];
        const dx = (node2.x || 0) - (node1.x || 0);
        const dy = (node2.y || 0) - (node1.y || 0);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0 && distance < 200) {
          const force = 50 / distance;
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;
          
          const force1 = forces.get(node1.id)!;
          const force2 = forces.get(node2.id)!;
          
          force1.x -= fx;
          force1.y -= fy;
          force2.x += fx;
          force2.y += fy;
        }
      }
    }

    filteredEdges.forEach(edge => {
      const sourceNode = newNodes.find(n => n.id === edge.source);
      const targetNode = newNodes.find(n => n.id === edge.target);
      
      if (sourceNode && targetNode) {
        const dx = (targetNode.x || 0) - (sourceNode.x || 0);
        const dy = (targetNode.y || 0) - (sourceNode.y || 0);
        const distance = Math.sqrt(dx * dx + dy * dy);
        const idealDistance = 150;
        
        if (distance > 0) {
          const force = (distance - idealDistance) * 0.01;
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;
          
          const sourceForce = forces.get(sourceNode.id)!;
          const targetForce = forces.get(targetNode.id)!;
          
          sourceForce.x += fx;
          sourceForce.y += fy;
          targetForce.x -= fx;
          targetForce.y -= fy;
        }
      }
    });

    newNodes.forEach(node => {
      const force = forces.get(node.id)!;
      const currentX = node.x || 0;
      const currentY = node.y || 0;
      
      node.x = Math.max(20, Math.min(dimensions.width - 20, currentX + force.x * 0.1));
      node.y = Math.max(20, Math.min(dimensions.height - 20, currentY + force.y * 0.1));
    });

    setPositionedNodes(newNodes);
  }, [positionedNodes, filteredEdges, dimensions]);

  useEffect(() => {
    if (!physicsEnabled) return;
    if (draggedNode) return;
    if (isPanning) return;
    const interval = setInterval(() => applyForces(), 50);
    return () => clearInterval(interval);
  }, [applyForces, physicsEnabled, draggedNode, isPanning]);

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const fitToView = useCallback(() => {
    if (!positionedNodes.length) return;
    const xs = positionedNodes.map((n) => n.x ?? 0);
    const ys = positionedNodes.map((n) => n.y ?? 0);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const worldW = Math.max(1, maxX - minX);
    const worldH = Math.max(1, maxY - minY);
    const pad = 60;
    const scale = Math.min(
      (dimensions.width - pad * 2) / worldW,
      (dimensions.height - pad * 2) / worldH,
      5
    );
    const nextZoom = Math.max(0.1, Math.min(5, scale));

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    setZoom(nextZoom);
    setPan({
      x: dimensions.width / 2 - cx * nextZoom,
      y: dimensions.height / 2 - cy * nextZoom,
    });
  }, [positionedNodes, dimensions]);

  const screenToWorld = useCallback((x: number, y: number) => ({
    x: (x - pan.x) / zoom,
    y: (y - pan.y) / zoom,
  }), [zoom, pan]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, dimensions.width, dimensions.height);
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    filteredEdges.forEach(edge => {
      const sourceNode = positionedNodes.find(n => n.id === edge.source);
      const targetNode = positionedNodes.find(n => n.id === edge.target);

      if (sourceNode && targetNode) {
        ctx.beginPath();
        ctx.moveTo(sourceNode.x || 0, sourceNode.y || 0);
        ctx.lineTo(targetNode.x || 0, targetNode.y || 0);
        
        switch (edge.type) {
          case 'claim':
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            break;
          case 'semantic':
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 1.5;
            break;
          default:
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
        }
        
        ctx.stroke();

        if (showLabels && edge.label) {
          const midX = ((sourceNode.x || 0) + (targetNode.x || 0)) / 2;
          const midY = ((sourceNode.y || 0) + (targetNode.y || 0)) / 2;
          
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.font = '11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(edge.label, midX, midY);
        }
      }
    });

    positionedNodes.forEach(node => {
      const x = node.x || 0;
      const y = node.y || 0;
      const radius = (node.size || 15) / zoom;
      const isHovered = node.id === hoveredNode;
      const isSelected = node.id === selectedNode;

      switch (node.type) {
        case 'segment':
          ctx.fillStyle = node.color || '#6366f1';
          break;
        case 'document':
          ctx.fillStyle = node.color || '#10b981';
          break;
        case 'claim':
          ctx.fillStyle = node.color || '#f59e0b';
          break;
        default:
          ctx.fillStyle = node.color || '#8b5cf6';
      }

      ctx.beginPath();
      ctx.arc(x, y, radius * (isHovered ? 1.2 : 1), 0, 2 * Math.PI);
      ctx.fill();

      if (isSelected) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3 / zoom;
        ctx.stroke();
      }

      if (showLabels) {
        ctx.fillStyle = '#ffffff';
        ctx.font = `${12 / zoom}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(node.label, x, y - radius - 5 / zoom);
      }
    });

    ctx.restore();
  }, [positionedNodes, filteredEdges, dimensions, zoom, pan, showLabels, hoveredNode, selectedNode]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const worldPos = screenToWorld(screenX, screenY);

    if (isPanning && panStartRef.current && panOriginRef.current) {
      const dx = screenX - panStartRef.current.x;
      const dy = screenY - panStartRef.current.y;
      setPan({ x: panOriginRef.current.x + dx, y: panOriginRef.current.y + dy });
      return;
    }

    if (draggedNode) {
      const nodeIndex = positionedNodes.findIndex(n => n.id === draggedNode);
      if (nodeIndex !== -1) {
        const newNodes = [...positionedNodes];
        newNodes[nodeIndex] = { ...newNodes[nodeIndex], x: worldPos.x, y: worldPos.y };
        setPositionedNodes(newNodes);
      }
    } else {
      const hoveredNodeFound = positionedNodes.find(node => {
        const dx = worldPos.x - (node.x || 0);
        const dy = worldPos.y - (node.y || 0);
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= (node.size || 15) / zoom;
      });
      setHoveredNode(hoveredNodeFound?.id || null);
    }
  }, [positionedNodes, draggedNode, zoom, screenToWorld, isPanning]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const worldPos = screenToWorld(screenX, screenY);

    const clickedNode = positionedNodes.find(node => {
      const dx = worldPos.x - (node.x || 0);
      const dy = worldPos.y - (node.y || 0);
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= (node.size || 15) / zoom;
    });

    // Industry-standard: Space+drag pans regardless of node hit
    if (spacePressed) {
      setIsPanning(true);
      panStartRef.current = { x: screenX, y: screenY };
      panOriginRef.current = { x: pan.x, y: pan.y };
      return;
    }

    if (clickedNode) {
      setSelectedNode(clickedNode.id);
      setSelectedNodeData(clickedNode);
      setDraggedNode(clickedNode.id);
      onNodeClick?.(clickedNode);
    } else {
      setSelectedNode(null);
      setSelectedNodeData(null);
      setIsPanning(true);
      panStartRef.current = { x: screenX, y: screenY };
      panOriginRef.current = { x: pan.x, y: pan.y };
    }
  }, [positionedNodes, zoom, screenToWorld, onNodeClick, pan, spacePressed]);

  const handleMouseUp = useCallback(() => {
    setDraggedNode(null);
    setIsPanning(false);
    panStartRef.current = null;
    panOriginRef.current = null;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    const oldZoom = zoom;
    const nextZoom = Math.max(0.1, Math.min(5, oldZoom * (e.deltaY > 0 ? 0.9 : 1.1)));
    if (nextZoom === oldZoom) return;

    // Zoom-to-cursor: keep the world point under cursor stable
    const worldX = (screenX - pan.x) / oldZoom;
    const worldY = (screenY - pan.y) / oldZoom;
    const nextPanX = screenX - worldX * nextZoom;
    const nextPanY = screenY - worldY * nextZoom;

    setZoom(nextZoom);
    setPan({ x: nextPanX, y: nextPanY });
  }, [zoom, pan]);

  const qaCount = nodes.filter(n => n.mode === 'qa').length;
  const paragraphCount = nodes.filter(n => n.mode === 'paragraphs').length;

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* Controls */}
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        zIndex: 10,
        background: 'rgba(20, 20, 30, 0.95)',
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        minWidth: '180px',
      }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>Legend</div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.8)', cursor: 'pointer' }}>
          <input type="checkbox" checked={showQa} onChange={(e) => setShowQa(e.target.checked)} />
          <span style={{ width: 12, height: 12, background: '#6366f1', borderRadius: '50%' }} />
          QA ({qaCount})
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.8)', cursor: 'pointer' }}>
          <input type="checkbox" checked={showParagraphs} onChange={(e) => setShowParagraphs(e.target.checked)} />
          <span style={{ width: 12, height: 12, background: '#8b5cf6', borderRadius: '50%' }} />
          Paragraphs ({paragraphCount})
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.8)', cursor: 'pointer' }}>
          <input type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} />
          Show Labels
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.8)', cursor: 'pointer' }}>
          <input type="checkbox" checked={physicsEnabled} onChange={(e) => setPhysicsEnabled(e.target.checked)} />
          Physics
        </label>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '8px 0' }} />
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
          Zoom: {Math.round(zoom * 100)}%
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setZoom(z => Math.min(5, z * 1.2))}
            className="btn btn-secondary btn-sm"
            style={{ flex: 1, minHeight: 28, padding: '4px 8px', fontSize: '11px' }}
          >
            +
          </button>
          <button
            onClick={() => setZoom(z => Math.max(0.1, z / 1.2))}
            className="btn btn-secondary btn-sm"
            style={{ flex: 1, minHeight: 28, padding: '4px 8px', fontSize: '11px' }}
          >
            -
          </button>
          <button
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
            className="btn btn-secondary btn-sm"
            style={{ flex: 1, minHeight: 28, padding: '4px 8px', fontSize: '11px' }}
          >
            Reset
          </button>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={fitToView}
            className="btn btn-secondary btn-sm"
            style={{ flex: 1, minHeight: 28, padding: '4px 8px', fontSize: '11px' }}
          >
            Fit
          </button>
          <button
            onClick={resetView}
            className="btn btn-secondary btn-sm"
            style={{ flex: 1, minHeight: 28, padding: '4px 8px', fontSize: '11px' }}
          >
            View
          </button>
        </div>
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.35 }}>
          Tip: wheel = zoom, drag = pan, Space+drag = pan, drag node = move
        </div>
      </div>

      {/* Selected Node Panel */}
      {selectedNodeData && (
        <div style={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 10,
          background: 'rgba(20, 20, 30, 0.95)',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          maxWidth: '280px',
          maxHeight: '400px',
          overflow: 'auto',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>Node Details</div>
            <button onClick={() => { setSelectedNode(null); setSelectedNodeData(null); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '16px' }}>×</button>
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', marginBottom: '8px' }}>
            <strong>ID:</strong> {selectedNodeData.id}
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', marginBottom: '8px' }}>
            <strong>Type:</strong> {selectedNodeData.type}
          </div>
          {selectedNodeData.mode && (
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', marginBottom: '8px' }}>
              <strong>Mode:</strong> {selectedNodeData.mode}
            </div>
          )}
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', marginBottom: '8px' }}>
            <strong>Label:</strong> {selectedNodeData.label}
          </div>
          {selectedNodeData.data && (
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginTop: '8px', padding: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', maxHeight: '150px', overflow: 'auto' }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{JSON.stringify(selectedNodeData.data, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div style={{
        position: 'absolute',
        bottom: 10,
        left: 10,
        zIndex: 10,
        background: 'rgba(20, 20, 30, 0.95)',
        padding: '8px 12px',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        fontSize: '11px',
        color: 'rgba(255, 255, 255, 0.7)',
      }}>
        Nodes: {filteredNodes.length} | Edges: {filteredEdges.length} | Zoom: {Math.round(zoom * 100)}%
      </div>

      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{
          width: '100%',
          height: '100%',
          cursor: draggedNode
            ? 'grabbing'
            : isPanning
            ? 'grabbing'
            : hoveredNode
            ? 'pointer'
            : spacePressed
            ? 'grab'
            : 'grab',
        }}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
    </div>
  );
};

export default AdvancedGraphVisualization;
