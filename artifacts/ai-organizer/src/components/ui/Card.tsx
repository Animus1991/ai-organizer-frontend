import React, { ReactNode } from 'react';
import { tokens } from '../../tokens/designTokens';

interface CardProps {
  children: ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled' | 'academic';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  shadow?: 'none' | 'sm' | 'base' | 'md' | 'lg' | 'xl' | 'academic' | 'academic-lg';
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  tabIndex?: number;
  'data-testid'?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  rounded = 'md',
  shadow = 'base',
  className = '',
  style = {},
  onClick,
  tabIndex,
  'data-testid': testId
}) => {
  // SciConnect-inspired hover states
  const [isHovered, setIsHovered] = React.useState(false);
  const getVariantStyles = () => {
    switch (variant) {
      case 'default':
        return {
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        };
      case 'elevated':
        return {
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        };
      case 'outlined':
        return {
          background: 'transparent',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        };
      case 'filled':
        return {
          background: 'rgba(255, 255, 255, 0.12)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
        };
      case 'academic':
        return {
          background: 'rgba(254, 251, 235, 0.8)',
          border: '1px solid rgba(234, 179, 8, 0.3)',
          boxShadow: '0 4px 6px -1px rgba(234, 179, 8, 0.3), 0 2px 4px -1px rgba(234, 179, 8, 0.2)',
        };
      default:
        return {
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        };
    }
  };

  const getPaddingStyles = () => {
    switch (padding) {
      case 'none': return { padding: '0' };
      case 'sm': return { padding: tokens.spacing.sm };
      case 'md': return { padding: tokens.spacing.md };
      case 'lg': return { padding: tokens.spacing.lg };
      default: return { padding: tokens.spacing.md };
    }
  };

  // Academic shadow definitions
  const academicShadows = {
    academic: '0 4px 6px -1px rgba(234, 179, 8, 0.3), 0 2px 4px -1px rgba(234, 179, 8, 0.2)',
    'academic-lg': '0 10px 15px -3px rgba(234, 179, 8, 0.3), 0 4px 6px -2px rgba(234, 179, 8, 0.2)',
  };

  const styles: React.CSSProperties = {
    borderRadius: tokens.borderRadius[rounded],
    boxShadow: shadow === 'none' ? 'none' : shadow === 'academic' ? academicShadows.academic : shadow === 'academic-lg' ? academicShadows['academic-lg'] : tokens.shadows[shadow],
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: onClick ? 'pointer' : 'default',
    borderLeftWidth: isHovered && onClick ? '4px' : '1px',
    borderLeftColor: isHovered && onClick ? 'rgba(234, 179, 8, 0.5)' : 'transparent',
    ...getVariantStyles(),
    ...getPaddingStyles(),
    ...style,
  };

  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      className={`card ${className} ${isHovered && onClick ? 'card-hovered' : ''}`}
      style={styles}
      onClick={onClick}
      tabIndex={tabIndex}
      data-testid={testId}
      type={onClick ? 'button' : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </Component>
  );
};

export default Card;
