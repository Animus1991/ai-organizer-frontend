/**
 * LabCard Component
 * CoFounderBay-inspired card component for Research Lab
 * Supports multiple variants, padding sizes, and interactive states
 */

import React from 'react';
import { designTokens } from '../../styles/DesignTokens';

export type LabCardVariant = 'default' | 'elevated' | 'outlined' | 'filled' | 'glass';
export type LabCardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

export interface LabCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: LabCardVariant;
  padding?: LabCardPadding;
  hoverable?: boolean;
  clickable?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export const LabCard: React.FC<LabCardProps> = ({
  variant = 'default',
  padding = 'md',
  hoverable = false,
  clickable = false,
  header,
  footer,
  children,
  style,
  className,
  ...props
}) => {
  const paddingValue = padding === 'none' ? '0' : designTokens.components.card.padding[padding];

  const variantStyles: Record<LabCardVariant, React.CSSProperties> = {
    default: {
      background: '#ffffff',
      border: `1px solid ${designTokens.colors.neutral[200]}`,
      boxShadow: designTokens.components.card.shadow.sm,
    },
    elevated: {
      background: '#ffffff',
      border: 'none',
      boxShadow: designTokens.components.card.shadow.lg,
    },
    outlined: {
      background: 'transparent',
      border: `2px solid ${designTokens.colors.neutral[300]}`,
      boxShadow: 'none',
    },
    filled: {
      background: designTokens.colors.neutral[50],
      border: 'none',
      boxShadow: 'none',
    },
    glass: {
      background: 'rgba(255, 255, 255, 0.7)',
      border: `1px solid ${designTokens.colors.neutral[200]}`,
      boxShadow: designTokens.components.card.shadow.md,
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
    },
  };

  const baseStyles: React.CSSProperties = {
    borderRadius: designTokens.components.card.borderRadius.lg,
    transition: `all ${designTokens.animation.duration['200']} ${designTokens.animation.easing.easeInOut}`,
    cursor: clickable ? 'pointer' : 'default',
    overflow: 'hidden',
    ...variantStyles[variant],
    ...style,
  };

  const contentStyles: React.CSSProperties = {
    padding: paddingValue,
  };

  const headerStyles: React.CSSProperties = {
    padding: paddingValue,
    borderBottom: `1px solid ${designTokens.colors.neutral[200]}`,
    fontWeight: designTokens.typography.fontWeight.semibold,
    fontSize: designTokens.typography.fontSize.lg,
  };

  const footerStyles: React.CSSProperties = {
    padding: paddingValue,
    borderTop: `1px solid ${designTokens.colors.neutral[200]}`,
    background: designTokens.colors.neutral[50],
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (hoverable || clickable) {
      if (variant === 'elevated') {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = designTokens.components.card.shadow.xl;
      } else if (variant === 'default') {
        e.currentTarget.style.boxShadow = designTokens.components.card.shadow.md;
      } else if (variant === 'outlined') {
        e.currentTarget.style.borderColor = designTokens.colors.semantic.primary;
      }
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (hoverable || clickable) {
      if (variant === 'elevated') {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = variantStyles.elevated.boxShadow as string;
      } else if (variant === 'default') {
        e.currentTarget.style.boxShadow = variantStyles.default.boxShadow as string;
      } else if (variant === 'outlined') {
        e.currentTarget.style.borderColor = designTokens.colors.neutral[300];
      }
    }
  };

  return (
    <div
      style={baseStyles}
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {header && <div style={headerStyles}>{header}</div>}
      <div style={contentStyles}>{children}</div>
      {footer && <div style={footerStyles}>{footer}</div>}
    </div>
  );
};

export default LabCard;
