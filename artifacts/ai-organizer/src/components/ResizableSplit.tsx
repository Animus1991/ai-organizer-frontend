/**
 * ResizableSplit Component
 * 
 * A resizable split pane component that allows users to adjust the division
 * between two panels (e.g., controls and content).
 * 
 * @module components/ResizableSplit
 */

import React, { useState, useRef, useEffect, useCallback } from "react";

export interface ResizableSplitProps {
  /** Left/top panel content */
  left: React.ReactNode;
  /** Right/bottom panel content */
  right: React.ReactNode;
  /** Initial split ratio (0-1), default 0.5 (50/50) */
  initialRatio?: number;
  /** Minimum size for left panel (in ratio, 0-1) */
  minLeft?: number;
  /** Minimum size for right panel (in ratio, 0-1) */
  minRight?: number;
  /** Split direction: 'horizontal' (left/right) or 'vertical' (top/bottom) */
  direction?: "horizontal" | "vertical";
  /** Resize handle size in pixels */
  handleSize?: number;
  /** Callback when split ratio changes */
  onRatioChange?: (ratio: number) => void;
}

/**
 * ResizableSplit - Resizable split pane component
 */
export default function ResizableSplit({
  left,
  right,
  initialRatio = 0.5,
  minLeft = 0.2,
  minRight = 0.2,
  direction = "vertical",
  handleSize = 4,
  onRatioChange,
}: ResizableSplitProps) {
  const [ratio, setRatio] = useState(initialRatio);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef<number>(0);
  const startRatioRef = useRef<number>(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startPosRef.current = direction === "vertical" ? e.clientY : e.clientX;
    startRatioRef.current = ratio;
  }, [direction, ratio]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const containerSize = direction === "vertical" ? containerRect.height : containerRect.width;
      const currentPos = direction === "vertical" ? e.clientY : e.clientX;
      const startPos = startPosRef.current;
      const delta = currentPos - startPos;
      const deltaRatio = delta / containerSize;
      
      let newRatio = startRatioRef.current + deltaRatio;
      
      // Clamp to min/max bounds
      newRatio = Math.max(minLeft, Math.min(1 - minRight, newRatio));
      
      setRatio(newRatio);
      if (onRatioChange) {
        onRatioChange(newRatio);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, direction, minLeft, minRight, onRatioChange]);

  const leftSize = ratio * 100;
  const rightSize = (1 - ratio) * 100;

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        flexDirection: direction === "vertical" ? "column" : "row",
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Left/Top Panel */}
      <div
        style={{
          [direction === "vertical" ? "height" : "width"]: `${leftSize}%`,
          [direction === "vertical" ? "width" : "height"]: "100%",
          overflow: "hidden",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {left}
      </div>

      {/* Resize Handle */}
      {handleSize > 0 && (
        <div
          onMouseDown={handleMouseDown}
          style={{
            [direction === "vertical" ? "height" : "width"]: `${handleSize}px`,
            [direction === "vertical" ? "width" : "height"]: "100%",
            cursor: direction === "vertical" ? "row-resize" : "col-resize",
            background: isDragging
              ? "rgba(99, 102, 241, 0.4)"
              : "rgba(255, 255, 255, 0.05)",
            borderTop: direction === "vertical" ? "1px solid rgba(255, 255, 255, 0.1)" : "none",
            borderBottom: direction === "vertical" ? "1px solid rgba(255, 255, 255, 0.1)" : "none",
            borderLeft: direction === "horizontal" ? "1px solid rgba(255, 255, 255, 0.1)" : "none",
            borderRight: direction === "horizontal" ? "1px solid rgba(255, 255, 255, 0.1)" : "none",
            flexShrink: 0,
            position: "relative",
            transition: isDragging ? "none" : "background 0.2s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseEnter={(e) => {
            if (!isDragging) {
              e.currentTarget.style.background = "rgba(99, 102, 241, 0.2)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isDragging) {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
            }
          }}
        >
          <div
            style={{
              width: direction === "vertical" ? "40px" : "4px",
              height: direction === "vertical" ? "4px" : "40px",
              background: "rgba(255, 255, 255, 0.2)",
              borderRadius: "2px",
              opacity: isDragging ? 1 : 0.5,
              transition: "opacity 0.2s ease",
            }}
          />
        </div>
      )}

      {/* Right/Bottom Panel */}
      <div
        style={{
          [direction === "vertical" ? "height" : "width"]: `${rightSize}%`,
          [direction === "vertical" ? "width" : "height"]: "100%",
          overflow: "hidden",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {right}
      </div>
    </div>
  );
}
