/**
 * Textarea Component - Multi-line text input
 */

import React, { useRef, useEffect } from 'react';

interface TextareaProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  rows?: number;
  maxRows?: number;
  autoResize?: boolean;
  label?: string;
  error?: string;
  helperText?: string;
  maxLength?: number;
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_MAP = {
  sm: { padding: '8px 10px', fontSize: 13, lineHeight: 1.4 },
  md: { padding: '10px 12px', fontSize: 14, lineHeight: 1.5 },
  lg: { padding: '12px 14px', fontSize: 15, lineHeight: 1.6 },
};

export const Textarea: React.FC<TextareaProps> = ({
  value = '',
  onChange,
  placeholder,
  disabled = false,
  readOnly = false,
  rows = 3,
  maxRows = 10,
  autoResize = false,
  label,
  error,
  helperText,
  maxLength,
  showCount = false,
  size = 'md',
  className = '',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sizeStyle = SIZE_MAP[size];

  useEffect(() => {
    if (autoResize && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      const lineHeight = sizeStyle.lineHeight * sizeStyle.fontSize;
      const minHeight = rows * lineHeight + 20;
      const maxHeight = maxRows * lineHeight + 20;
      const scrollHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
      textarea.style.height = `${scrollHeight}px`;
    }
  }, [value, autoResize, rows, maxRows, sizeStyle]);

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: error ? '#fca5a5' : 'rgba(255, 255, 255, 0.8)',
          }}
        >
          {label}
        </label>
      )}

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        rows={autoResize ? 1 : rows}
        maxLength={maxLength}
        style={{
          width: '100%',
          padding: sizeStyle.padding,
          fontSize: sizeStyle.fontSize,
          lineHeight: sizeStyle.lineHeight,
          fontFamily: 'inherit',
          background: 'rgba(255, 255, 255, 0.05)',
          border: `1px solid ${error ? '#ef4444' : 'rgba(255, 255, 255, 0.1)'}`,
          borderRadius: '8px',
          color: '#fafafa',
          resize: autoResize ? 'none' : 'vertical',
          outline: 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'text',
          minHeight: autoResize ? 'auto' : undefined,
        }}
        onFocus={(e) => {
          if (!error) {
            e.currentTarget.style.borderColor = '#6366f1';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.2)';
          }
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? '#ef4444' : 'rgba(255, 255, 255, 0.1)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {(error || helperText) && (
          <span
            style={{
              fontSize: '12px',
              color: error ? '#fca5a5' : 'rgba(255, 255, 255, 0.5)',
            }}
          >
            {error || helperText}
          </span>
        )}
        {showCount && maxLength && (
          <span
            style={{
              fontSize: '12px',
              color: value.length >= maxLength ? '#fca5a5' : 'rgba(255, 255, 255, 0.5)',
              marginLeft: 'auto',
            }}
          >
            {value.length}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
};

export default Textarea;
