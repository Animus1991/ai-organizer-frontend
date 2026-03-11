/**
 * Radio Component - Accessible radio button group
 */

import React, { createContext, useContext } from 'react';

interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  direction?: 'horizontal' | 'vertical';
  error?: string;
  className?: string;
}

interface RadioContextValue {
  name: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  size: 'sm' | 'md' | 'lg';
}

const RadioContext = createContext<RadioContextValue | null>(null);

const SIZE_MAP = {
  sm: { circle: 16, dot: 6, fontSize: 13 },
  md: { circle: 20, dot: 8, fontSize: 14 },
  lg: { circle: 24, dot: 10, fontSize: 15 },
};

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  options,
  value,
  onChange,
  disabled = false,
  size = 'md',
  direction = 'vertical',
  error,
  className = '',
}) => {
  return (
    <RadioContext.Provider value={{ name, value, onChange, disabled, size }}>
      <div
        role="radiogroup"
        aria-label={name}
        className={className}
        style={{
          display: 'flex',
          flexDirection: direction === 'horizontal' ? 'row' : 'column',
          gap: direction === 'horizontal' ? '20px' : '12px',
        }}
      >
        {options.map((option) => (
          <RadioItem key={option.value} option={option} />
        ))}
        {error && (
          <span style={{ fontSize: '12px', color: '#fca5a5', marginTop: '4px' }}>
            {error}
          </span>
        )}
      </div>
    </RadioContext.Provider>
  );
};

const RadioItem: React.FC<{ option: RadioOption }> = ({ option }) => {
  const context = useContext(RadioContext);
  if (!context) return null;

  const { name, value, onChange, disabled: groupDisabled, size } = context;
  const isChecked = value === option.value;
  const isDisabled = groupDisabled || option.disabled;
  const sizeStyle = SIZE_MAP[size];

  const handleChange = () => {
    if (!isDisabled) {
      onChange?.(option.value);
    }
  };

  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.5 : 1,
      }}
    >
      <span
        role="radio"
        aria-checked={isChecked}
        aria-disabled={isDisabled}
        tabIndex={isDisabled ? -1 : 0}
        onClick={handleChange}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleChange();
          }
        }}
        style={{
          width: sizeStyle.circle,
          height: sizeStyle.circle,
          borderRadius: '50%',
          border: `2px solid ${isChecked ? '#6366f1' : 'rgba(255, 255, 255, 0.3)'}`,
          background: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'all 0.15s ease-out',
          marginTop: '2px',
        }}
      >
        {isChecked && (
          <span
            style={{
              width: sizeStyle.dot,
              height: sizeStyle.dot,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            }}
          />
        )}
      </span>

      <input
        type="radio"
        name={name}
        value={option.value}
        checked={isChecked}
        disabled={isDisabled}
        onChange={handleChange}
        style={{ display: 'none' }}
      />

      <div style={{ flex: 1 }}>
        <span
          style={{
            fontSize: sizeStyle.fontSize,
            fontWeight: 500,
            color: 'rgba(255, 255, 255, 0.9)',
            display: 'block',
          }}
        >
          {option.label}
        </span>
        {option.description && (
          <span
            style={{
              fontSize: sizeStyle.fontSize - 1,
              color: 'rgba(255, 255, 255, 0.5)',
              display: 'block',
              marginTop: '2px',
            }}
          >
            {option.description}
          </span>
        )}
      </div>
    </label>
  );
};

export default RadioGroup;
