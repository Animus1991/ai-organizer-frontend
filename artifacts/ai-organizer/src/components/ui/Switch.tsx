/**
 * Switch/Toggle Component - Accessible toggle switch
 */

import React from 'react';

interface SwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  labelPosition?: 'left' | 'right';
  className?: string;
}

const SIZE_MAP = {
  sm: { width: 36, height: 20, thumb: 16, translate: 16 },
  md: { width: 44, height: 24, thumb: 20, translate: 20 },
  lg: { width: 52, height: 28, thumb: 24, translate: 24 },
};

export const Switch: React.FC<SwitchProps> = ({
  checked = false,
  onChange,
  disabled = false,
  size = 'md',
  label,
  labelPosition = 'right',
  className = '',
}) => {
  const sizeStyle = SIZE_MAP[size];

  const handleClick = () => {
    if (!disabled) {
      onChange?.(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const switchElement = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label || 'Toggle'}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={className}
      style={{
        width: sizeStyle.width,
        height: sizeStyle.height,
        borderRadius: sizeStyle.height / 2,
        background: checked 
          ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' 
          : 'rgba(255, 255, 255, 0.15)',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        position: 'relative',
        transition: 'background 0.2s ease-out',
        padding: 0,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: (sizeStyle.height - sizeStyle.thumb) / 2,
          left: checked 
            ? sizeStyle.width - sizeStyle.thumb - (sizeStyle.height - sizeStyle.thumb) / 2
            : (sizeStyle.height - sizeStyle.thumb) / 2,
          width: sizeStyle.thumb,
          height: sizeStyle.thumb,
          borderRadius: '50%',
          background: 'white',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          transition: 'left 0.2s ease-out',
        }}
      />
    </button>
  );

  if (!label) return switchElement;

  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        flexDirection: labelPosition === 'left' ? 'row-reverse' : 'row',
      }}
    >
      {switchElement}
      <span
        style={{
          fontSize: size === 'sm' ? '13px' : '14px',
          color: disabled ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.9)',
          fontWeight: 500,
        }}
      >
        {label}
      </span>
    </label>
  );
};

export default Switch;
