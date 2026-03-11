/**
 * Enhanced Button Component
 * CoFounderBay-inspired design with comprehensive theming and interactions
 */

import React, { forwardRef } from 'react';
import { getComponentToken } from '../../styles/DesignTokens';

export interface EnhancedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  ripple?: boolean;
  children: React.ReactNode;
}

const EnhancedButton = forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      ripple = true,
      children,
      className = '',
      style = {},
      ...props
    },
    ref
  ) => {
    // Get design tokens with fallbacks
    const variantTokens = getComponentToken('button', variant) || {};
    const sizeTokens = getComponentToken('button', size) || {};
    
    // Base styles
    const baseStyles: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      fontFamily: 'inherit',
      fontWeight: '500',
      lineHeight: '1',
      textDecoration: 'none',
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      border: 'none',
      outline: 'none',
      position: 'relative',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      ...variantTokens,
      ...sizeTokens,
      ...(fullWidth && { width: '100%' }),
      ...style,
    };

    // Ripple effect
    const createRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (!ripple || disabled || loading) return;
      
      const button = event.currentTarget;
      const rect = button.getBoundingClientRect();
      const rippleElement = document.createElement('span');
      
      const size = Math.max(rect.width, rect.height);
      const x = event.clientX - rect.left - size / 2;
      const y = event.clientY - rect.top - size / 2;
      
      rippleElement.style.width = rippleElement.style.height = size + 'px';
      rippleElement.style.left = x + 'px';
      rippleElement.style.top = y + 'px';
      rippleElement.classList.add('ripple');
      
      button.appendChild(rippleElement);
      
      setTimeout(() => {
        rippleElement.remove();
      }, 600);
    };

    return (
      <>
        <style>
          {`
            .enhanced-button {
              position: relative;
              overflow: hidden;
            }
            
            .enhanced-button:hover {
              transform: translateY(-1px);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }
            
            .enhanced-button:active {
              transform: translateY(0);
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            
            .enhanced-button:focus-visible {
              outline: 2px solid rgba(99, 102, 241, 0.5);
              outline-offset: 2px;
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
            
            .loading-spinner {
              animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}
        </style>
        
        <button
          ref={ref}
          className={`enhanced-button ${className}`}
          style={baseStyles}
          disabled={disabled || loading}
          onMouseDown={createRipple}
          {...props}
        >
          {loading && (
            <svg
              className="loading-spinner"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
          )}
          
          {!loading && leftIcon && leftIcon}
          
          <span>{children}</span>
          
          {!loading && rightIcon && rightIcon}
        </button>
      </>
    );
  }
);

EnhancedButton.displayName = 'EnhancedButton';

export default EnhancedButton;
