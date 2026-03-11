/**
 * Badge Component - Reusable status badges
 */

import React from 'react';

type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'academic' | 'academic-primary' | 'academic-secondary';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; color: string; border: string }> = {
  default: {
    bg: 'rgba(255, 255, 255, 0.1)',
    color: 'rgba(255, 255, 255, 0.8)',
    border: 'rgba(255, 255, 255, 0.15)',
  },
  primary: {
    bg: 'rgba(99, 102, 241, 0.2)',
    color: '#a5b4fc',
    border: 'rgba(99, 102, 241, 0.3)',
  },
  secondary: {
    bg: 'rgba(139, 92, 246, 0.2)',
    color: '#c4b5fd',
    border: 'rgba(139, 92, 246, 0.3)',
  },
  success: {
    bg: 'rgba(34, 197, 94, 0.2)',
    color: '#86efac',
    border: 'rgba(34, 197, 94, 0.3)',
  },
  warning: {
    bg: 'rgba(245, 158, 11, 0.2)',
    color: '#fcd34d',
    border: 'rgba(245, 158, 11, 0.3)',
  },
  error: {
    bg: 'rgba(239, 68, 68, 0.2)',
    color: '#fca5a5',
    border: 'rgba(239, 68, 68, 0.3)',
  },
  info: {
    bg: 'rgba(59, 130, 246, 0.2)',
    color: '#93c5fd',
    border: 'rgba(59, 130, 246, 0.3)',
  },
  academic: {
    bg: 'rgba(254, 251, 235, 0.8)',
    color: '#b45309',
    border: 'rgba(234, 179, 8, 0.3)',
  },
  'academic-primary': {
    bg: 'rgba(234, 179, 8, 0.2)',
    color: '#fbbf24',
    border: 'rgba(234, 179, 8, 0.3)',
  },
  'academic-secondary': {
    bg: 'rgba(254, 251, 235, 0.8)',
    color: '#b45309',
    border: 'rgba(234, 179, 8, 0.3)',
  },
};

const SIZE_STYLES: Record<BadgeSize, { padding: string; fontSize: string; height: string }> = {
  sm: { padding: '2px 6px', fontSize: '10px', height: '18px' },
  md: { padding: '3px 8px', fontSize: '11px', height: '22px' },
  lg: { padding: '4px 10px', fontSize: '12px', height: '26px' },
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  icon,
  className = '',
}) => {
  const variantStyle = VARIANT_STYLES[variant];
  const sizeStyle = SIZE_STYLES[size];

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: sizeStyle.padding,
        height: sizeStyle.height,
        background: variantStyle.bg,
        color: variantStyle.color,
        border: `1px solid ${variantStyle.border}`,
        borderRadius: '9999px',
        fontSize: sizeStyle.fontSize,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      {dot && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: variantStyle.color,
          }}
        />
      )}
      {icon && <span style={{ display: 'flex', fontSize: '1em' }}>{icon}</span>}
      {children}
    </span>
  );
};

export default Badge;
