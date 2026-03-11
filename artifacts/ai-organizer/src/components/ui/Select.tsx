/**
 * Select Component - Accessible select dropdown
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_STYLES = {
  sm: { height: '36px', fontSize: '13px', padding: '8px 12px' },
  md: { height: '40px', fontSize: '14px', padding: '10px 14px' },
  lg: { height: '48px', fontSize: '15px', padding: '12px 16px' },
};

export const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  disabled = false,
  error,
  label,
  size = 'md',
  className = '',
}) => {
  const { isDark, colors } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const sizeStyle = SIZE_STYLES[size];

  const surfaceBg = isDark ? 'rgba(255, 255, 255, 0.05)' : '#ffffff';
  const surfaceBorder = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.12)';
  const textPrimary = isDark ? '#fafafa' : 'rgba(0, 0, 0, 0.92)';
  const textPlaceholder = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';
  const iconMuted = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';
  const listBg = isDark ? 'rgba(24, 24, 32, 0.98)' : '#ffffff';
  const listBorder = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.12)';
  const listShadow = isDark ? '0 8px 24px rgba(0, 0, 0, 0.4)' : '0 8px 24px rgba(0, 0, 0, 0.12)';
  const optionHoverBg = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)';
  const optionDisabled = isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.4)';
  const optionSelected = isDark ? '#a5b4fc' : colors.accentPrimary;

  const selectedOption = options.find(opt => opt.value === value);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, handleClickOutside]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0) {
          const opt = options[highlightedIndex];
          if (!opt.disabled) {
            onChange?.(opt.value);
            setIsOpen(false);
          }
        } else {
          setIsOpen(!isOpen);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex(prev => 
            Math.min(prev + 1, options.length - 1)
          );
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label style={{
          fontSize: '13px',
          fontWeight: 500,
          color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.82)',
        }}>
          {label}
        </label>
      )}
      
      <div ref={containerRef} style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          style={{
            width: '100%',
            height: sizeStyle.height,
            padding: sizeStyle.padding,
            paddingRight: '36px',
            background: surfaceBg,
            border: `1px solid ${error ? (isDark ? '#ef4444' : '#dc2626') : isOpen ? colors.accentPrimary : surfaceBorder}`,
            borderRadius: '8px',
            color: selectedOption ? textPrimary : textPlaceholder,
            fontSize: sizeStyle.fontSize,
            textAlign: 'left',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            transition: 'all 0.2s',
            outline: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {selectedOption?.icon}
          {selectedOption?.label || placeholder}
          
          <svg
            style={{
              position: 'absolute',
              right: '12px',
              width: '16px',
              height: '16px',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
              transition: 'transform 0.2s',
              color: iconMuted,
            }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {isOpen && (
          <ul
            ref={listRef}
            role="listbox"
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '4px',
              padding: '6px',
              background: listBg,
              border: `1px solid ${listBorder}`,
              borderRadius: '10px',
              boxShadow: listShadow,
              backdropFilter: 'blur(12px)',
              zIndex: 1000,
              maxHeight: '240px',
              overflowY: 'auto',
              listStyle: 'none',
              animation: 'selectFadeIn 0.15s ease-out',
            }}
          >
            {options.map((option, index) => (
              <li
                key={option.value}
                role="option"
                aria-selected={option.value === value}
                onClick={() => {
                  if (!option.disabled) {
                    onChange?.(option.value);
                    setIsOpen(false);
                  }
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  cursor: option.disabled ? 'not-allowed' : 'pointer',
                  color: option.disabled 
                    ? optionDisabled 
                    : option.value === value 
                      ? optionSelected 
                      : textPrimary,
                  background: highlightedIndex === index 
                    ? optionHoverBg 
                    : 'transparent',
                  fontSize: sizeStyle.fontSize,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background 0.1s',
                }}
              >
                {option.icon}
                {option.label}
                {option.value === value && (
                  <svg
                    style={{ marginLeft: 'auto', width: '16px', height: '16px' }}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <span style={{ fontSize: '12px', color: isDark ? '#fca5a5' : '#dc2626' }}>{error}</span>
      )}

      <style>{`
        @keyframes selectFadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Select;
