/**
 * Progress Component - Progress bars and loaders
 */

import React from 'react';

interface ProgressProps {
  value?: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error' | 'gradient' | 'academic' | 'academic-primary' | 'academic-secondary';
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
  indeterminate?: boolean;
  className?: string;
  indicatorClassName?: string;
}

const SIZE_MAP = {
  sm: { height: 4, fontSize: 10 },
  md: { height: 8, fontSize: 12 },
  lg: { height: 12, fontSize: 14 },
};

const COLORS = {
  default: '#6366f1',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  gradient: 'linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899)',
  academic: '#eab308',
  'academic-primary': '#eab308',
  'academic-secondary': '#f59e0b',
};

export const Progress: React.FC<ProgressProps> = ({
  value = 0,
  max = 100,
  size = 'md',
  variant = 'default',
  showLabel = false,
  label,
  animated = false,
  indeterminate = false,
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const sizeStyle = SIZE_MAP[size];
  const color = COLORS[variant];

  return (
    <div className={className} style={{ width: '100%' }}>
      {(showLabel || label) && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '6px',
          fontSize: sizeStyle.fontSize,
          color: 'rgba(255, 255, 255, 0.7)',
        }}>
          <span>{label || 'Progress'}</span>
          {showLabel && <span>{Math.round(percentage)}%</span>}
        </div>
      )}
      
      <div
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : value}
        aria-valuemin={0}
        aria-valuemax={max}
        style={{
          width: '100%',
          height: sizeStyle.height,
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: sizeStyle.height / 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: indeterminate ? '30%' : `${percentage}%`,
            height: '100%',
            background: typeof color === 'string' && color.startsWith('linear') ? undefined : color,
            backgroundImage: typeof color === 'string' && color.startsWith('linear') ? color : undefined,
            transition: indeterminate ? 'none' : 'width 0.3s ease-out',
            animation: indeterminate 
              ? 'progressIndeterminate 1.5s ease-in-out infinite'
              : animated 
                ? 'progressPulse 2s ease-in-out infinite' 
                : 'none',
          }}
        />
      </div>

      <style>{`
        @keyframes progressIndeterminate {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        @keyframes progressPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

// Spinner Component
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  className?: string;
}

const SPINNER_SIZES = {
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
};

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = '#6366f1',
  className = '',
}) => {
  const dimension = SPINNER_SIZES[size];
  const strokeWidth = size === 'sm' ? 2 : size === 'xl' ? 4 : 3;

  return (
    <svg
      className={className}
      width={dimension}
      height={dimension}
      viewBox="0 0 24 24"
      fill="none"
      style={{ animation: 'spin 1s linear infinite' }}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="rgba(255, 255, 255, 0.1)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray="31.4 31.4"
        strokeDashoffset="10"
      />
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </svg>
  );
};

// Dots Loader
interface DotsLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export const DotsLoader: React.FC<DotsLoaderProps> = ({
  size = 'md',
  color = '#6366f1',
}) => {
  const dotSize = size === 'sm' ? 6 : size === 'lg' ? 12 : 8;
  const gap = size === 'sm' ? 4 : size === 'lg' ? 8 : 6;

  return (
    <div style={{ display: 'flex', gap, alignItems: 'center' }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: dotSize,
            height: dotSize,
            borderRadius: '50%',
            background: color,
            animation: `dotBounce 1.4s ease-in-out ${i * 0.16}s infinite both`,
          }}
        />
      ))}
      <style>{`
        @keyframes dotBounce {
          0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Progress;
