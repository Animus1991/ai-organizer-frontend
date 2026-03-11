import React, { ReactNode } from 'react';
import { tokens } from '../../tokens/designTokens';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost' | 'academic' | 'academic-primary' | 'academic-secondary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  onClick?: () => void;
  tabIndex?: number;
  className?: string;
  style?: React.CSSProperties;
  'data-testid'?: string;
  'aria-label'?: string;
  title?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  onClick,
  tabIndex = 0,
  className = '',
  style = {},
  'data-testid': testId,
  'aria-label': ariaLabel,
  title
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          border: '1px solid rgba(99, 102, 241, 0.5)',
          color: '#ffffff',
          boxShadow: tokens.shadows.md,
        };
      case 'secondary':
        return {
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: 'rgba(255, 255, 255, 0.9)',
        };
      case 'tertiary':
        return {
          background: 'transparent',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          color: 'rgba(255, 255, 255, 0.8)',
        };
      case 'danger':
        return {
          background: 'rgba(239, 68, 68, 0.2)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#fca5a5',
        };
      case 'ghost':
        return {
          background: 'transparent',
          border: 'none',
          color: 'rgba(255, 255, 255, 0.7)',
        };
      case 'academic':
        return {
          background: 'linear-gradient(135deg, #eab308 0%, #f59e0b 100%)',
          border: '1px solid rgba(234, 179, 8, 0.5)',
          color: '#ffffff',
          boxShadow: '0 4px 6px -1px rgba(234, 179, 8, 0.3), 0 2px 4px -1px rgba(234, 179, 8, 0.2)',
        };
      case 'academic-primary':
        return {
          background: 'linear-gradient(135deg, #eab308 0%, #f59e0b 100%)',
          border: '1px solid rgba(234, 179, 8, 0.5)',
          color: '#ffffff',
          boxShadow: '0 4px 6px -1px rgba(234, 179, 8, 0.3), 0 2px 4px -1px rgba(234, 179, 8, 0.2)',
        };
      case 'academic-secondary':
        return {
          background: 'rgba(254, 251, 235, 0.8)',
          border: '1px solid rgba(234, 179, 8, 0.3)',
          color: '#b45309',
          boxShadow: '0 4px 6px -1px rgba(234, 179, 8, 0.3), 0 2px 4px -1px rgba(234, 179, 8, 0.2)',
        };
      default:
        return {
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: 'rgba(255, 255, 255, 0.9)',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
          fontSize: tokens.typography.fontSize.sm,
          minHeight: '32px',
        };
      case 'lg':
        return {
          padding: `${tokens.spacing.md} ${tokens.spacing.xl}`,
          fontSize: tokens.typography.fontSize.lg,
          minHeight: '48px',
        };
      default:
        return {
          padding: `${tokens.spacing.sm} ${tokens.spacing.lg}`,
          fontSize: tokens.typography.fontSize.base,
          minHeight: '40px',
        };
    }
  };

  const styles: React.CSSProperties = {
    borderRadius: tokens.borderRadius.md,
    fontWeight: tokens.typography.fontWeight.semibold,
    fontFamily: tokens.typography.fontFamily.sans.join(', '),
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: tokens.transitions.base,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing.sm,
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled ? 0.6 : 1,
    position: 'relative',
    overflow: 'hidden',
    ...getVariantStyles(),
    ...getSizeStyles(),
    ...style,
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading) {
      switch (variant) {
        case 'primary':
          e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)';
          e.currentTarget.style.boxShadow = tokens.shadows.lg;
          break;
        case 'secondary':
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
          e.currentTarget.style.transform = 'translateY(-1px)';
          break;
        case 'ghost':
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
          e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
          break;
        default:
          e.currentTarget.style.transform = 'translateY(-1px)';
          break;
      }
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading) {
      e.currentTarget.style.transform = 'translateY(0) scale(1)';
      Object.assign(e.currentTarget.style, getVariantStyles());
    }
  };

  const renderIcon = () => {
    if (!icon) return null;
    
    const iconStyles = {
      display: 'flex',
      alignItems: 'center',
      fontSize: '1em',
    };

    return <span style={iconStyles}>{icon}</span>;
  };

  return (
    <button
      className={`button ${className}`}
      style={styles}
      onClick={disabled || loading ? undefined : onClick}
      disabled={disabled || loading}
      tabIndex={disabled ? -1 : tabIndex}
      data-testid={testId}
      aria-label={ariaLabel}
      title={title}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={(e) => {
        e.currentTarget.style.outline = `2px solid ${tokens.colors.primary[500]}`;
        e.currentTarget.style.outlineOffset = '2px';
      }}
      onBlur={(e) => {
        e.currentTarget.style.outline = 'none';
      }}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !disabled && !loading) {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {loading && (
        <div
          style={{
            width: '16px',
            height: '16px',
            border: '2px solid transparent',
            borderTop: `2px solid currentColor`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
      )}
      {!loading && iconPosition === 'left' && renderIcon()}
      {children}
      {!loading && iconPosition === 'right' && renderIcon()}
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
};

export default Button;
