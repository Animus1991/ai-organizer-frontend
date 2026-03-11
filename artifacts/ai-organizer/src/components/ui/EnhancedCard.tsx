/**
 * Enhanced Card Component
 * CoFounderBay-inspired design with comprehensive theming and interactions
 */

import React, { forwardRef } from 'react';
import { getComponentToken } from '../../styles/DesignTokens';

export interface EnhancedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'basic' | 'elevated' | 'outlined' | 'glass';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  interactive?: boolean;
  children: React.ReactNode;
}

const EnhancedCard = forwardRef<HTMLDivElement, EnhancedCardProps>(
  (
    {
      variant = 'basic',
      size = 'md',
      padding = 'md',
      hover = false,
      interactive = false,
      children,
      className = '',
      style = {},
      ...props
    },
    ref
  ) => {
    // Get design tokens with fallbacks
    const variantTokens = getComponentToken('card', variant) || {};
    const sizeTokens = getComponentToken('card', size) || {};
    const paddingTokens = getComponentToken('card', padding) || {};
    
    // Base styles
    const baseStyles: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      borderRadius: '12px',
      backgroundColor: '#ffffff',
      border: '1px solid rgba(0, 0, 0, 0.1)',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      outline: 'none',
      position: 'relative',
      overflow: 'hidden',
      ...variantTokens,
      ...sizeTokens,
      ...paddingTokens,
      ...style,
    };

    // Interactive styles
    const interactiveStyles = interactive ? {
      cursor: 'pointer',
      userSelect: 'none',
    } : {};

    // Hover styles
    const hoverStyles = hover ? {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
    } : {};

    return (
      <>
        <style>
          {`
            .enhanced-card {
              position: relative;
              overflow: hidden;
            }
            
            .enhanced-card:hover {
              transform: translateY(-2px);
              box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
            }
            
            .enhanced-card.interactive {
              cursor: pointer;
              user-select: none;
            }
            
            .enhanced-card.interactive:hover {
              transform: translateY(-2px);
              box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
            }
            
            .enhanced-card.interactive:active {
              transform: translateY(0);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
            
            .enhanced-card:focus-visible {
              outline: 2px solid rgba(99, 102, 241, 0.5);
              outline-offset: 2px;
            }
            
            /* Glass morphism effect */
            .enhanced-card.glass {
              background: rgba(255, 255, 255, 0.7);
              backdrop-filter: blur(10px);
              border: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            /* Elevated effect */
            .enhanced-card.elevated {
              box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            }
            
            .enhanced-card.elevated:hover {
              box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
            }
            
            /* Outlined effect */
            .enhanced-card.outlined {
              background: transparent;
              border: 2px solid rgba(0, 0, 0, 0.1);
              box-shadow: none;
            }
            
            .enhanced-card.outlined:hover {
              border-color: rgba(99, 102, 241, 0.3);
              box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1);
            }
          `}
        </style>
        
        <div
          ref={ref}
          className={`enhanced-card ${variant} ${hover ? 'hover' : ''} ${interactive ? 'interactive' : ''} ${className}`}
          style={baseStyles}
          tabIndex={interactive ? 0 : undefined}
          {...(interactive && {
            onKeyDown: (e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                (e.target as HTMLElement).click();
              }
            }
          })}
          {...props}
        >
          {children}
        </div>
      </>
    );
  }
);

EnhancedCard.displayName = 'EnhancedCard';

export default EnhancedCard;
