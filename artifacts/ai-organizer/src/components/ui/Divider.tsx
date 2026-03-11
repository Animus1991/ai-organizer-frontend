/**
 * Divider Component - Visual separator
 */

import React from 'react';

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  variant?: 'solid' | 'dashed' | 'dotted';
  thickness?: number;
  color?: string;
  spacing?: 'sm' | 'md' | 'lg' | 'none';
  label?: string;
  className?: string;
}

const SPACING_MAP = {
  none: 0,
  sm: 8,
  md: 16,
  lg: 24,
};

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  variant = 'solid',
  thickness = 1,
  color = 'rgba(255, 255, 255, 0.1)',
  spacing = 'md',
  label,
  className = '',
}) => {
  const space = SPACING_MAP[spacing];
  const isHorizontal = orientation === 'horizontal';

  if (label && isHorizontal) {
    return (
      <div
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          margin: `${space}px 0`,
        }}
      >
        <div
          style={{
            flex: 1,
            height: thickness,
            background: color,
            borderStyle: variant,
          }}
        />
        <span
          style={{
            fontSize: '12px',
            fontWeight: 500,
            color: 'rgba(255, 255, 255, 0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
        <div
          style={{
            flex: 1,
            height: thickness,
            background: color,
            borderStyle: variant,
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={className}
      role="separator"
      aria-orientation={orientation}
      style={{
        ...(isHorizontal
          ? {
              width: '100%',
              height: thickness,
              margin: `${space}px 0`,
            }
          : {
              width: thickness,
              height: '100%',
              margin: `0 ${space}px`,
            }),
        background: variant === 'solid' ? color : 'transparent',
        borderTop: variant !== 'solid' && isHorizontal ? `${thickness}px ${variant} ${color}` : undefined,
        borderLeft: variant !== 'solid' && !isHorizontal ? `${thickness}px ${variant} ${color}` : undefined,
      }}
    />
  );
};

export default Divider;
