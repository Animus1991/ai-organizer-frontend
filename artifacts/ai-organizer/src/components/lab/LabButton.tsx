/**
 * LabButton Component
 * CoFounderBay-inspired button component for Research Lab
 * Supports multiple variants, sizes, and states
 */

import React from 'react';
import { designTokens } from '../../styles/DesignTokens';

export type LabButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'success' | 'warning' | 'error';
export type LabButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface LabButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: LabButtonVariant;
  size?: LabButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

export const LabButton: React.FC<LabButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  style,
  className,
  ...props
}) => {
  const sizeConfig = designTokens.components.button.size[size];
  
  const variantStyles: Record<LabButtonVariant, React.CSSProperties> = {
    primary: {
      background: designTokens.components.button.variant.primary.background,
      color: designTokens.components.button.variant.primary.color,
      border: designTokens.components.button.variant.primary.border,
      boxShadow: designTokens.components.button.variant.primary.shadow,
    },
    secondary: {
      background: designTokens.colors.semantic.secondary,
      color: '#ffffff',
      border: 'none',
      boxShadow: '0 2px 8px rgba(107, 114, 128, 0.3)',
    },
    outline: {
      background: designTokens.components.button.variant.outline.background,
      color: designTokens.components.button.variant.outline.color,
      border: designTokens.components.button.variant.outline.border,
      boxShadow: designTokens.components.button.variant.outline.shadow,
    },
    ghost: {
      background: designTokens.components.button.variant.ghost.background,
      color: designTokens.components.button.variant.ghost.color,
      border: designTokens.components.button.variant.ghost.border,
      boxShadow: designTokens.components.button.variant.ghost.shadow,
    },
    link: {
      background: designTokens.components.button.variant.link.background,
      color: designTokens.components.button.variant.link.color,
      border: designTokens.components.button.variant.link.border,
      boxShadow: designTokens.components.button.variant.link.shadow,
      textDecoration: 'underline',
    },
    success: {
      background: `linear-gradient(135deg, ${designTokens.colors.semantic.success} 0%, ${designTokens.colors.semantic.successHover} 100%)`,
      color: '#ffffff',
      border: 'none',
      boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
    },
    warning: {
      background: `linear-gradient(135deg, ${designTokens.colors.semantic.warning} 0%, ${designTokens.colors.semantic.warningHover} 100%)`,
      color: '#ffffff',
      border: 'none',
      boxShadow: '0 4px 16px rgba(245, 158, 11, 0.4)',
    },
    error: {
      background: `linear-gradient(135deg, ${designTokens.colors.semantic.error} 0%, ${designTokens.colors.semantic.errorHover} 100%)`,
      color: '#ffffff',
      border: 'none',
      boxShadow: '0 4px 16px rgba(239, 68, 68, 0.4)',
    },
  };

  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: designTokens.spacing.sm,
    height: sizeConfig.height,
    padding: sizeConfig.padding,
    fontSize: sizeConfig.fontSize,
    borderRadius: sizeConfig.borderRadius,
    fontWeight: designTokens.typography.fontWeight.medium,
    fontFamily: designTokens.typography.fontFamily.sans.join(', '),
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: `all ${designTokens.animation.duration['200']} ${designTokens.animation.easing.easeInOut}`,
    opacity: disabled || loading ? 0.6 : 1,
    width: fullWidth ? '100%' : 'auto',
    outline: 'none',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    ...variantStyles[variant],
    ...style,
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    
    if (variant === 'primary') {
      e.currentTarget.style.transform = 'translateY(-1px)';
      e.currentTarget.style.boxShadow = '0 6px 20px rgba(79, 70, 229, 0.5)';
    } else if (variant === 'outline' || variant === 'ghost') {
      e.currentTarget.style.background = designTokens.colors.neutral[50];
    } else if (variant === 'success') {
      e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.5)';
    } else if (variant === 'warning') {
      e.currentTarget.style.boxShadow = '0 6px 20px rgba(245, 158, 11, 0.5)';
    } else if (variant === 'error') {
      e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.5)';
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    
    if (variant === 'primary') {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = variantStyles.primary.boxShadow as string;
    } else if (variant === 'outline' || variant === 'ghost') {
      e.currentTarget.style.background = variantStyles[variant].background as string;
    } else if (variant === 'success') {
      e.currentTarget.style.boxShadow = variantStyles.success.boxShadow as string;
    } else if (variant === 'warning') {
      e.currentTarget.style.boxShadow = variantStyles.warning.boxShadow as string;
    } else if (variant === 'error') {
      e.currentTarget.style.boxShadow = variantStyles.error.boxShadow as string;
    }
  };

  return (
    <button
      style={baseStyles}
      className={className}
      disabled={disabled || loading}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {loading && (
        <span
          style={{
            width: '14px',
            height: '14px',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite',
          }}
        />
      )}
      {!loading && leftIcon && <span style={{ display: 'flex', alignItems: 'center' }}>{leftIcon}</span>}
      <span>{children}</span>
      {!loading && rightIcon && <span style={{ display: 'flex', alignItems: 'center' }}>{rightIcon}</span>}
    </button>
  );
};

export default LabButton;
