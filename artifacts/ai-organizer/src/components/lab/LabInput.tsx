/**
 * LabInput Component
 * CoFounderBay-inspired input component for Research Lab
 * Supports validation, icons, and multiple variants
 */

import React, { useState } from 'react';
import { designTokens } from '../../styles/DesignTokens';

export type LabInputVariant = 'outline' | 'filled' | 'flushed';
export type LabInputSize = 'sm' | 'md' | 'lg';

export interface LabInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: LabInputVariant;
  size?: LabInputSize;
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const LabInput: React.FC<LabInputProps> = ({
  variant = 'outline',
  size = 'md',
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  style,
  className,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const sizeConfig = designTokens.components.input.size[size];
  const variantConfig = designTokens.components.input.variant[variant];

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: designTokens.spacing.xs,
    width: fullWidth ? '100%' : 'auto',
  };

  const labelStyles: React.CSSProperties = {
    fontSize: designTokens.typography.fontSize.sm,
    fontWeight: designTokens.typography.fontWeight.medium,
    color: error ? designTokens.colors.semantic.error : designTokens.colors.neutral[700],
    marginBottom: designTokens.spacing.xs,
  };

  const inputWrapperStyles: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: fullWidth ? '100%' : 'auto',
  };

  const inputStyles: React.CSSProperties = {
    height: sizeConfig.height,
    padding: leftIcon ? `0 ${sizeConfig.padding.split(' ')[1]} 0 40px` : sizeConfig.padding,
    fontSize: sizeConfig.fontSize,
    borderRadius: variant === 'flushed' ? '0' : sizeConfig.borderRadius,
    fontFamily: designTokens.typography.fontFamily.sans.join(', '),
    fontWeight: designTokens.typography.fontWeight.normal,
    color: designTokens.colors.neutral[900],
    width: '100%',
    outline: 'none',
    transition: `all ${designTokens.animation.duration['200']} ${designTokens.animation.easing.easeInOut}`,
    opacity: disabled ? 0.6 : 1,
    cursor: disabled ? 'not-allowed' : 'text',
    border: error 
      ? `1px solid ${designTokens.colors.semantic.error}`
      : isFocused 
        ? variantConfig.focus.border || variantConfig.focus.borderBottom
        : variantConfig.border || variantConfig.borderBottom,
    borderBottom: variant === 'flushed' 
      ? (error 
          ? `2px solid ${designTokens.colors.semantic.error}`
          : isFocused 
            ? variantConfig.focus.borderBottom
            : variantConfig.borderBottom)
      : undefined,
    background: isFocused ? variantConfig.focus.background || variantConfig.background : variantConfig.background,
    boxShadow: isFocused && variantConfig.focus.ring !== 'none' ? variantConfig.focus.ring : 'none',
    ...style,
  };

  const iconStyles: React.CSSProperties = {
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: error ? designTokens.colors.semantic.error : designTokens.colors.neutral[500],
    pointerEvents: 'none',
  };

  const leftIconStyles: React.CSSProperties = {
    ...iconStyles,
    left: '12px',
  };

  const rightIconStyles: React.CSSProperties = {
    ...iconStyles,
    right: '12px',
  };

  const helperTextStyles: React.CSSProperties = {
    fontSize: designTokens.typography.fontSize.xs,
    color: error ? designTokens.colors.semantic.error : designTokens.colors.neutral[600],
    marginTop: designTokens.spacing.xs,
  };

  return (
    <div style={containerStyles} className={className}>
      {label && <label style={labelStyles}>{label}</label>}
      <div style={inputWrapperStyles}>
        {leftIcon && <span style={leftIconStyles}>{leftIcon}</span>}
        <input
          style={inputStyles}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {rightIcon && <span style={rightIconStyles}>{rightIcon}</span>}
      </div>
      {(error || helperText) && (
        <span style={helperTextStyles}>{error || helperText}</span>
      )}
    </div>
  );
};

export default LabInput;
