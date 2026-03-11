/**
 * GraphVisualization Component - Interactive segment relationship graph
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';

interface Node {
  id: string;
  label: string;
  type: 'segment' | 'document' | 'claim';
  x?: number;
  y?: number;
  color?: string;
  size?: number;
}

interface Edge {
  source: string;
  target: string;
  type: 'reference' | 'claim' | 'semantic';
  weight?: number;
  label?: string;
}

interface GraphVisualizationProps {
  nodes: Node[];
  edges: Edge[];
  width?: number;
  height?: number;
  onNodeClick?: (node: Node) => void;
  onEdgeClick?: (edge: Edge) => void;
  interactive?: boolean;
  showLabels?: boolean;
}

export const GraphVisualization: React.FC<GraphVisualizationProps> = ({
  nodes,
  edges,
  width = 800,
  height = 600,
  onNodeClick,
  onEdgeClick,
  interactive = true,
  showLabels = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Initialize node positions if not provided
  const initializePositions = useCallback(() => {
    const nodeMap = new Map<string, Node>();
    
    nodes.forEach((node, index) => {
      if (!node.x || !node.y) {
        const angle = (index / nodes.length) * 2 * Math.PI;
        const radius = Math.min(width, height) * 0.3;
        nodeMap.set(node.id, {
          ...node,
          x: width / 2 + Math.cos(angle) * radius,
          y: height / 2 + Math.sin(angle) * radius,
        });
      } else {
        nodeMap.set(node.id, node);
      }
    });

    return Array.from(nodeMap.values());
  }, [nodes, width, height]);

  const [positionedNodes, setPositionedNodes] = useState<Node[]>(initializePositions);

  // Force-directed layout simulation
  const applyForces = useCallback(() => {
    const newNodes = [...positionedNodes];
    const forces = new Map<string, { x: number; y: number }>();

    // Initialize forces
    newNodes.forEach(node => {
      forces.set(node.id, { x: 0, y: 0 });
    });

    // Repulsion between nodes
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

    // Attraction along edges
    edges.forEach(edge => {
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

    // Apply forces
    newNodes.forEach(node => {
      const force = forces.get(node.id)!;
      const currentX = node.x || 0;
      const currentY = node.y || 0;
      
      node.x = Math.max(20, Math.min(width - 20, currentX + force.x * 0.1));
      node.y = Math.max(20, Math.min(height - 20, currentY + force.y * 0.1));
    });

    setPositionedNodes(newNodes);
  }, [positionedNodes, edges, width, height]);

  // Animation loop
  useEffect(() => {
    if (!interactive) return;

    const interval = setInterval(() => {
      applyForces();
    }, 50);

    return () => clearInterval(interval);
  }, [interactive, applyForces]);

  // Drawing function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw edges
    edges.forEach(edge => {
      const sourceNode = positionedNodes.find(n => n.id === edge.source);
      const targetNode = positionedNodes.find(n => n.id === edge.target);

      if (sourceNode && targetNode) {
        ctx.beginPath();
        ctx.moveTo(sourceNode.x || 0, sourceNode.y || 0);
        ctx.lineTo(targetNode.x || 0, targetNode.y || 0);
        
        // Edge styling based on type
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

        // Draw edge labels
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

    // Draw nodes
    positionedNodes.forEach(node => {
      const x = node.x || 0;
      const y = node.y || 0;
      const radius = node.size || 15;
      const isHovered = node.id === hoveredNode;
      const isSelected = node.id === selectedNode;

      // Node styling based on type
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

      // Draw node
      ctx.beginPath();
      ctx.arc(x, y, radius * (isHovered ? 1.2 : 1), 0, 2 * Math.PI);
      ctx.fill();

      // Draw selection ring
      if (isSelected) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Draw labels
      if (showLabels) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, x, y - radius - 5);
      }
    });
  }, [positionedNodes, edges, width, height, showLabels, hoveredNode, selectedNode]);

  // Redraw when data changes
  useEffect(() => {
    draw();
  }, [draw]);

  // Mouse handlers
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    // Check for node hover
    const hoveredNodeFound = positionedNodes.find(node => {
      const dx = x - (node.x || 0);
      const dy = y - (node.y || 0);
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= (node.size || 15);
    });

    setHoveredNode(hoveredNodeFound?.id || null);

    // Handle dragging
    if (draggedNode) {
      const nodeIndex = positionedNodes.findIndex(n => n.id === draggedNode);
      if (nodeIndex !== -1) {
        const newNodes = [...positionedNodes];
        newNodes[nodeIndex] = { ...newNodes[nodeIndex], x, y };
        setPositionedNodes(newNodes);
      }
    }
  }, [interactive, positionedNodes, draggedNode]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check for node click
    const clickedNode = positionedNodes.find(node => {
      const dx = x - (node.x || 0);
      const dy = y - (node.y || 0);
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= (node.size || 15);
    });

    if (clickedNode) {
      setSelectedNode(clickedNode.id);
      setDraggedNode(clickedNode.id);
      onNodeClick?.(clickedNode);
    } else {
      setSelectedNode(null);
    }
  }, [interactive, positionedNodes, onNodeClick]);

  const handleMouseUp = useCallback(() => {
    setDraggedNode(null);
  }, []);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          background: 'rgba(0, 0, 0, 0.3)',
          cursor: interactive ? 'grab' : 'default',
        }}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      
      {interactive && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'rgba(0, 0, 0, 0.8)',
          padding: '8px 12px',
          borderRadius: '8px',
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.8)',
        }}>
          Nodes: {nodes.length} | Edges: {edges.length}
        </div>
      )}
    </div>
  );
};

export default GraphVisualization;
