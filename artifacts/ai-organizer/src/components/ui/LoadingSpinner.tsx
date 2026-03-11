import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  color = 'currentColor',
  className = '' 
}) => {
  const sizeMap = {
    small: 16,
    medium: 24,
    large: 32
  };

  const strokeWidth = size === 'small' ? 2 : size === 'medium' ? 2.5 : 3;

  return (
    <div 
      className={`loading-spinner ${className}`}
      style={{ 
        display: 'inline-block',
        width: `${sizeMap[size]}px`,
        height: `${sizeMap[size]}px`
      }}
      role="status"
      aria-label="Loading"
    >
      <svg
        width={sizeMap[size]}
        height={sizeMap[size]}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ animation: 'spin 1s linear infinite' }}
      >
        <circle
          cx="12"
          cy="12"
          r={sizeMap[size] / 2 - 2}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray="50 50"
          style={{ opacity: 0.3 }}
        />
        <circle
          cx="12"
          cy="12"
          r={sizeMap[size] / 2 - 2}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray="50 50"
          style={{ 
            transform: 'rotate(-90deg)',
            transformOrigin: 'center',
            opacity: 1
          }}
        />
      </svg>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;
