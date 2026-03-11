import React, { useState, useRef, useEffect } from 'react';

interface DraggableComponentProps {
  children: React.ReactNode;
  componentId: string;
  initialPosition?: { x: number; y: number };
  onPositionChange?: (componentId: string, position: { x: number; y: number }) => void;
  showCoordinates?: boolean;
  enabled?: boolean; // When false, drag & drop is disabled and component renders normally
}

export function DraggableComponent({ 
  children, 
  componentId, 
  initialPosition = { x: 0, y: 0 },
  onPositionChange,
  showCoordinates = false,
  enabled = false // Disabled by default - only enabled in Screenshot Mode
}: DraggableComponentProps) {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [showCoords, setShowCoords] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (onPositionChange) {
      onPositionChange(componentId, position);
    }
  }, [position, componentId, onPositionChange]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!enabled) return; // Only allow dragging when enabled (Screenshot Mode)
    if (e.target === dragRef.current || dragRef.current?.contains(e.target as Node)) {
      setIsDragging(true);
      dragStartPos.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y
      };
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newPosition = {
        x: e.clientX - dragStartPos.current.x,
        y: e.clientY - dragStartPos.current.y
      };
      setPosition(newPosition);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  const handleCopyCoordinates = () => {
    const coordsText = `${componentId}: { x: ${position.x}, y: ${position.y} }`;
    navigator.clipboard.writeText(coordsText).then(() => {
      // Could add a toast notification here
      console.log('Coordinates copied:', coordsText);
    });
  };

  const handlePasteCoordinates = () => {
    navigator.clipboard.readText().then(text => {
      try {
        // Parse coordinates from clipboard text
        const match = text.match(/\{?\s*x:\s*(\d+),?\s*y:\s*(\d+)\s*\}?/);
        if (match) {
          const x = parseInt(match[1]);
          const y = parseInt(match[2]);
          setPosition({ x, y });
        }
      } catch (error) {
        console.error('Failed to parse coordinates:', error);
      }
    });
  };

  // When disabled, render children without drag functionality
  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <div
      ref={dragRef}
      style={{
        position: 'relative',
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: isDragging ? 1000 : 1,
        userSelect: 'none'
      }}
      onMouseDown={handleMouseDown}
    >
      {children}
      
      {showCoordinates && (
        <div
          style={{
            position: 'absolute',
            top: '-40px',
            left: '0',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            zIndex: 1001
          }}
        >
          <span>{`x: ${position.x}, y: ${position.y}`}</span>
          <button
            onClick={handleCopyCoordinates}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '2px',
              cursor: 'pointer',
              fontSize: '10px'
            }}
          >
            📋
          </button>
          <button
            onClick={handlePasteCoordinates}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '2px',
              cursor: 'pointer',
              fontSize: '10px'
            }}
          >
            📌
          </button>
        </div>
      )}
      
      <button
        onClick={() => setShowCoords(!showCoords)}
        style={{
          position: 'absolute',
          top: '-10px',
          right: '-10px',
          background: 'rgba(99, 102, 241, 0.8)',
          border: 'none',
          color: 'white',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          cursor: 'pointer',
          fontSize: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1002
        }}
      >
        📍
      </button>
    </div>
  );
}
