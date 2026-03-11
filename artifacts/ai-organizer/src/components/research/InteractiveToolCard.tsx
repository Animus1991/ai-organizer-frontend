/**
 * Interactive Tool Card Component
 * CoFounderBay-inspired advanced tool cards with animations and interactions
 */

import React, { useState, useCallback } from 'react';
import { getComponentToken } from '../../styles/DesignTokens';

export interface Tool {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  preview?: React.ReactNode;
  category: string;
  isActive?: boolean;
  isDisabled?: boolean;
  badge?: string;
  progress?: number;
}

export interface InteractiveToolCardProps {
  tool: Tool;
  isActive?: boolean;
  onClick?: (tool: Tool) => void;
  onHover?: (tool: Tool, isHovered: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'basic' | 'elevated' | 'glass';
  showProgress?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const InteractiveToolCard: React.FC<InteractiveToolCardProps> = ({
  tool,
  isActive = false,
  onClick,
  onHover,
  size = 'md',
  variant = 'basic',
  showProgress = false,
  className = '',
  style = {},
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [ripplePosition, setRipplePosition] = useState({ x: 0, y: 0 });
  const [isPressed, setIsPressed] = useState(false);
  
  // Get design tokens
  const cardTokens = getComponentToken('toolCard', variant) || {};
  const sizeTokens = getComponentToken('toolCard', size) || {};
  
  // Handle click with ripple effect
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (tool.isDisabled) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    setRipplePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 150);
    
    onClick?.(tool);
  }, [tool, onClick]);
  
  // Handle hover
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    onHover?.(tool, true);
  }, [tool, onHover]);
  
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    onHover?.(tool, false);
  }, [tool, onHover]);
  
  // Card styles
  const cardStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-primary)',
    borderRadius: '12px',
    padding: '16px',
    cursor: tool.isDisabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden',
    opacity: tool.isDisabled ? 0.6 : 1,
    transform: isPressed ? 'scale(0.98)' : isHovered ? 'translateY(-2px)' : 'translateY(0)',
    boxShadow: isHovered ? '0 8px 25px rgba(0, 0, 0, 0.15)' : '0 4px 12px rgba(0, 0, 0, 0.1)',
    ...cardTokens,
    ...sizeTokens,
    ...style,
  };
  
  // Active state styles
  if (isActive) {
    cardStyles.borderColor = 'var(--accent-primary)';
    cardStyles.boxShadow = '0 0 0 2px rgba(99, 102, 241, 0.2)';
  }
  
  return (
    <>
      <style>
        {`
          .interactive-tool-card {
            position: relative;
            overflow: hidden;
            user-select: none;
          }
          
          .interactive-tool-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          }
          
          .interactive-tool-card:active {
            transform: scale(0.98);
          }
          
          .interactive-tool-card.active {
            border-color: var(--accent-primary);
            box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
          }
          
          .interactive-tool-card.disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          
          .tool-icon {
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 12px;
            background: var(--bg-icon);
            color: var(--text-primary);
            font-size: 24px;
            margin-bottom: 12px;
            transition: all 0.2s ease;
          }
          
          .interactive-tool-card:hover .tool-icon {
            transform: scale(1.1);
            background: var(--accent-primary);
            color: white;
          }
          
          .tool-title {
            font-weight: 600;
            font-size: 16px;
            color: var(--text-primary);
            margin: 0 0 4px 0;
            line-height: 1.2;
          }
          
          .tool-description {
            font-size: 14px;
            color: var(--text-secondary);
            margin: 0;
            line-height: 1.4;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          
          .tool-badge {
            position: absolute;
            top: 8px;
            right: 8px;
            background: var(--accent-primary);
            color: white;
            font-size: 11px;
            font-weight: 600;
            padding: 2px 6px;
            border-radius: 10px;
            text-transform: uppercase;
          }
          
          .tool-progress {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: var(--bg-progress);
            border-radius: 0 0 12px 12px;
            overflow: hidden;
          }
          
          .tool-progress-bar {
            height: 100%;
            background: var(--accent-primary);
            transition: width 0.3s ease;
          }
          
          .tool-preview {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            visibility: hidden;
            transition: all 0.2s ease;
            border-radius: 12px;
            padding: 16px;
          }
          
          .interactive-tool-card:hover .tool-preview {
            opacity: 1;
            visibility: visible;
          }
          
          .ripple {
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.5);
            transform: scale(0);
            animation: ripple-animation 0.6s ease-out;
            pointer-events: none;
          }
          
          @keyframes ripple-animation {
            to {
              transform: scale(4);
              opacity: 0;
            }
          }
          
          /* Size variants */
          .interactive-tool-card.sm {
            padding: 12px;
          }
          
          .interactive-tool-card.sm .tool-icon {
            width: 36px;
            height: 36px;
            font-size: 18px;
            margin-bottom: 8px;
          }
          
          .interactive-tool-card.sm .tool-title {
            font-size: 14px;
          }
          
          .interactive-tool-card.sm .tool-description {
            font-size: 12px;
          }
          
          .interactive-tool-card.lg {
            padding: 20px;
          }
          
          .interactive-tool-card.lg .tool-icon {
            width: 64px;
            height: 64px;
            font-size: 32px;
            margin-bottom: 16px;
          }
          
          .interactive-tool-card.lg .tool-title {
            font-size: 18px;
          }
          
          .interactive-tool-card.lg .tool-description {
            font-size: 16px;
          }
          
          /* Variant styles */
          .interactive-tool-card.elevated {
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          }
          
          .interactive-tool-card.elevated:hover {
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          }
          
          .interactive-tool-card.glass {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
          }
        `}
      </style>
      
      <div
        className={`interactive-tool-card ${size} ${variant} ${isActive ? 'active' : ''} ${tool.isDisabled ? 'disabled' : ''} ${className}`}
        style={cardStyles}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Ripple Effect */}
        {isPressed && (
          <span
            className="ripple"
            style={{
              left: ripplePosition.x - 10,
              top: ripplePosition.y - 10,
              width: 20,
              height: 20,
            }}
          />
        )}
        
        {/* Tool Icon */}
        <div className="tool-icon">
          {tool.icon}
        </div>
        
        {/* Tool Title */}
        <h3 className="tool-title">{tool.title}</h3>
        
        {/* Tool Description */}
        <p className="tool-description">{tool.description}</p>
        
        {/* Badge */}
        {tool.badge && (
          <span className="tool-badge">{tool.badge}</span>
        )}
        
        {/* Progress Bar */}
        {showProgress && tool.progress !== undefined && (
          <div className="tool-progress">
            <div
              className="tool-progress-bar"
              style={{ width: `${tool.progress}%` }}
            />
          </div>
        )}
        
        {/* Preview Overlay */}
        {tool.preview && (
          <div className="tool-preview">
            {tool.preview}
          </div>
        )}
      </div>
    </>
  );
};

export default InteractiveToolCard;
