/**
 * Enhanced Panel Component
 * CoFounderBay-inspired advanced panel with resize, drag, and detach capabilities
 * Optimized for Research Lab with enterprise-grade features
 */

import React, { forwardRef, useState, useRef, useCallback, useMemo } from 'react';

export interface EnhancedPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  id: string;
  title: string;
  type: 'documents' | 'claims' | 'evidence' | 'analytics' | 'editor';
  collapsed?: boolean;
  resizable?: boolean;
  draggable?: boolean;
  detachable?: boolean;
  variant?: 'default' | 'elevated' | 'glass' | 'neon';
  panelSize?: 'compact' | 'normal' | 'spacious';
  theme?: 'dark' | 'light' | 'auto';
  onResize?: (width: number, height: number) => void;
  onMove?: (x: number, y: number) => void;
  onClose?: () => void;
  onCollapse?: (collapsed: boolean) => void;
  onDetach?: () => void;
  onThemeChange?: (theme: 'dark' | 'light' | 'auto') => void;
  children: React.ReactNode;
}

const EnhancedPanel = forwardRef<HTMLDivElement, EnhancedPanelProps>(
  (
    {
      id,
      title,
      type,
      collapsed = false,
      resizable = true,
      draggable = true,
      detachable = false,
      variant = 'default',
      panelSize = 'normal',
      theme = 'auto',
      onResize,
      onMove,
      onClose,
      onCollapse,
      onDetach,
      onThemeChange,
      children,
      className = '',
      style = {},
      ...props
    },
    ref
  ) => {
    const [isResizing, setIsResizing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(collapsed);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [dimensions, setDimensions] = useState({ width: 400, height: 300 });
    
    const panelRef = useRef<HTMLDivElement>(null);
    const resizeRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef<HTMLDivElement>(null);
    const startPos = useRef({ x: 0, y: 0 });
    const startSize = useRef({ width: 0, height: 0 });
    
    // Get design tokens based on variant and theme
    const tokens = useMemo(() => {
      const baseColors = {
        dark: {
          background: '#1e293b',
          border: '#334155',
          text: '#f8fafc',
          shadow: 'rgba(0, 0, 0, 0.5)',
        },
        light: {
          background: '#ffffff',
          border: '#e2e8f0',
          text: '#1e293b',
          shadow: 'rgba(0, 0, 0, 0.1)',
        },
      };
      
      const currentColors = baseColors[theme === 'auto' ? 'dark' : theme];
      
      return {
        ...currentColors,
        background: variant === 'glass' 
          ? 'rgba(255, 255, 255, 0.1)' 
          : variant === 'neon'
          ? 'rgba(99, 102, 241, 0.1)'
          : currentColors.background,
        border: variant === 'neon'
          ? '2px solid rgba(99, 102, 241, 0.5)'
          : `1px solid ${currentColors.border}`,
        boxShadow: variant === 'elevated'
          ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          : variant === 'glass'
          ? '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
          : `0 4px 6px -1px ${currentColors.shadow}`,
      };
    }, [variant, theme]);
    
    // Handle resize
    const handleResizeStart = useCallback((e: React.MouseEvent) => {
      if (!resizable) return;
      
      e.preventDefault();
      setIsResizing(true);
      startPos.current = { x: e.clientX, y: e.clientY };
      startSize.current = { width: dimensions.width, height: dimensions.height };
      
      const handleMouseMove = (e: MouseEvent) => {
        const deltaX = e.clientX - startPos.current.x;
        const deltaY = e.clientY - startPos.current.y;
        
        const newWidth = Math.max(200, startSize.current.width + deltaX);
        const newHeight = Math.max(150, startSize.current.height + deltaY);
        
        setDimensions({ width: newWidth, height: newHeight });
        onResize?.(newWidth, newHeight);
      };
      
      const handleMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }, [resizable, dimensions, onResize]);
    
    // Handle drag
    const handleDragStart = useCallback((e: React.MouseEvent) => {
      if (!draggable) return;
      
      e.preventDefault();
      setIsDragging(true);
      startPos.current = { x: e.clientX - position.x, y: e.clientY - position.y };
      
      const handleMouseMove = (e: MouseEvent) => {
        const newX = e.clientX - startPos.current.x;
        const newY = e.clientY - startPos.current.y;
        
        setPosition({ x: newX, y: newY });
        onMove?.(newX, newY);
      };
      
      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }, [draggable, position, onMove]);
    
    // Handle collapse toggle
    const handleCollapseToggle = useCallback(() => {
      const newCollapsed = !isCollapsed;
      setIsCollapsed(newCollapsed);
      onCollapse?.(newCollapsed);
    }, [isCollapsed, onCollapse]);
    
    // Panel styles
    const panelStyles: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: tokens.background,
      border: tokens.border,
      borderRadius: '12px',
      boxShadow: tokens.boxShadow,
      transition: isResizing || isDragging ? 'none' : 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      overflow: 'hidden',
      position: draggable ? 'absolute' : 'relative',
      left: draggable ? position.x : 'auto',
      top: draggable ? position.y : 'auto',
      width: draggable ? dimensions.width : '100%',
      height: draggable ? dimensions.height : 'auto',
      minHeight: isCollapsed ? 'auto' : '150px',
      minWidth: '200px',
      cursor: isDragging ? 'grabbing' : 'default',
      opacity: isDragging ? 0.8 : 1,
      zIndex: isDragging ? 1000 : 1,
      ...style,
    };
    
    return (
      <>
        <style>
          {`
            .enhanced-panel {
              position: relative;
              overflow: hidden;
            }
            
            .enhanced-panel.collapsed {
              min-height: auto;
            }
            
            .enhanced-panel.dragging {
              cursor: grabbing;
              opacity: 0.8;
              z-index: 1000;
            }
            
            .enhanced-panel.resizing {
              transition: none;
              user-select: none;
            }
            
            .panel-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 12px 16px;
              background: var(--bg-header);
              border-bottom: 1px solid var(--border-primary);
              cursor: ${draggable ? 'grab' : 'default'};
              user-select: none;
            }
            
            .panel-header:hover {
              background: var(--bg-header-hover);
            }
            
            .panel-title {
              font-weight: 600;
              font-size: 14px;
              color: var(--text-primary);
              margin: 0;
            }
            
            .panel-controls {
              display: flex;
              align-items: center;
              gap: 8px;
            }
            
            .panel-control {
              width: 20px;
              height: 20px;
              border: none;
              background: transparent;
              cursor: pointer;
              border-radius: 4px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: var(--text-secondary);
              transition: all 0.2s ease;
            }
            
            .panel-control:hover {
              background: var(--bg-hover);
              color: var(--text-primary);
            }
            
            .panel-content {
              flex: 1;
              padding: 16px;
              overflow: auto;
              display: ${isCollapsed ? 'none' : 'block'};
            }
            
            .panel-resize-handle {
              position: absolute;
              bottom: 0;
              right: 0;
              width: 20px;
              height: 20px;
              cursor: nwse-resize;
              background: linear-gradient(135deg, transparent 50%, var(--border-primary) 50%);
              border-radius: 0 0 12px 0;
            }
            
            .panel-resize-handle:hover {
              background: linear-gradient(135deg, transparent 50%, var(--text-primary) 50%);
            }
          `}
        </style>
        
        <div
          ref={(node) => {
            panelRef.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
          }}
          className={`enhanced-panel ${isCollapsed ? 'collapsed' : ''} ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''} ${className}`}
          style={panelStyles}
          {...props}
        >
          {/* Panel Header */}
          <div
            ref={dragRef}
            className="panel-header"
            onMouseDown={handleDragStart}
          >
            <h3 className="panel-title">{title}</h3>
            
            <div className="panel-controls">
              {/* Collapse Toggle */}
              <button
                className="panel-control"
                onClick={handleCollapseToggle}
                title={isCollapsed ? 'Expand' : 'Collapse'}
              >
                {isCollapsed ? '▼' : '▲'}
              </button>
              
              {/* Detach Button */}
              {detachable && (
                <button
                  className="panel-control"
                  onClick={() => {
                    // Handle detach logic
                    console.log('Detach panel:', id);
                  }}
                  title="Detach panel"
                >
                  ⬡
                </button>
              )}
              
              {/* Close Button */}
              {onClose && (
                <button
                  className="panel-control"
                  onClick={onClose}
                  title="Close panel"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          
          {/* Panel Content */}
          <div className="panel-content">
            {children}
          </div>
          
          {/* Resize Handle */}
          {resizable && !isCollapsed && (
            <div
              ref={resizeRef}
              className="panel-resize-handle"
              onMouseDown={handleResizeStart}
            />
          )}
        </div>
      </>
    );
  }
);

EnhancedPanel.displayName = 'EnhancedPanel';

export default EnhancedPanel;
