/**
 * Checkbox Component - Accessible checkbox input
 */

import React from 'react';

interface CheckboxProps {
  checked?: boolean;
  indeterminate?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  description?: string;
  error?: string;
  className?: string;
}

const SIZE_MAP = {
  sm: { box: 16, icon: 10, fontSize: 13 },
  md: { box: 20, icon: 12, fontSize: 14 },
  lg: { box: 24, icon: 14, fontSize: 15 },
};

export const Checkbox: React.FC<CheckboxProps> = ({
  checked = false,
  indeterminate = false,
  onChange,
  disabled = false,
  size = 'md',
  label,
  description,
  error,
  className = '',
}) => {
  const sizeStyle = SIZE_MAP[size];

  const handleChange = () => {
    if (!disabled) {
      onChange?.(!checked);
    }
  };

  return (
    <label
      className={className}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span
        role="checkbox"
        aria-checked={indeterminate ? 'mixed' : checked}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onClick={handleChange}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleChange();
          }
        }}
        style={{
          width: sizeStyle.box,
          height: sizeStyle.box,
          borderRadius: '4px',
          border: `2px solid ${error ? '#ef4444' : checked || indeterminate ? '#6366f1' : 'rgba(255, 255, 255, 0.3)'}`,
          background: checked || indeterminate 
            ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' 
            : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'all 0.15s ease-out',
          marginTop: '2px',
        }}
      >
        {(checked || indeterminate) && (
          <svg
            width={sizeStyle.icon}
            height={sizeStyle.icon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {indeterminate ? (
              <path d="M5 12h14" />
            ) : (
              <path d="M5 13l4 4L19 7" />
            )}
          </svg>
        )}
      </span>

      {(label || description) && (
        <div style={{ flex: 1 }}>
          {label && (
            <span
              style={{
                fontSize: sizeStyle.fontSize,
                fontWeight: 500,
                color: error ? '#fca5a5' : 'rgba(255, 255, 255, 0.9)',
                display: 'block',
              }}
            >
              {label}
            </span>
          )}
          {description && (
            <span
              style={{
                fontSize: sizeStyle.fontSize - 1,
                color: 'rgba(255, 255, 255, 0.5)',
                display: 'block',
                marginTop: '2px',
              }}
            >
              {description}
            </span>
          )}
          {error && (
            <span
              style={{
                fontSize: '12px',
                color: '#fca5a5',
                display: 'block',
                marginTop: '4px',
              }}
            >
              {error}
            </span>
          )}
        </div>
      )}
    </label>
  );
};

export default Checkbox;
