/**
 * LabLayout Components
 * CoFounderBay-inspired responsive layout utilities for Research Lab
 * Provides Grid, Flex, Container, and Stack components
 */

import React from 'react';
import { designTokens } from '../../styles/DesignTokens';

// Container Component
export interface LabContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  centerContent?: boolean;
  children: React.ReactNode;
}

export const LabContainer: React.FC<LabContainerProps> = ({
  maxWidth = 'xl',
  centerContent = false,
  children,
  style,
  ...props
}) => {
  const maxWidthValues = {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
    full: '100%',
  };

  const containerStyles: React.CSSProperties = {
    width: '100%',
    maxWidth: maxWidthValues[maxWidth],
    margin: centerContent ? '0 auto' : undefined,
    padding: `0 ${designTokens.spacing.md}`,
    ...style,
  };

  return <div style={containerStyles} {...props}>{children}</div>;
};

// Grid Component
export interface LabGridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: number | { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
  gap?: keyof typeof designTokens.spacing;
  children: React.ReactNode;
}

export const LabGrid: React.FC<LabGridProps> = ({
  columns = 1,
  gap = 'md',
  children,
  style,
  ...props
}) => {
  const gridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: typeof columns === 'number' 
      ? `repeat(${columns}, 1fr)` 
      : `repeat(${columns.md || 1}, 1fr)`,
    gap: designTokens.spacing[gap],
    ...style,
  };

  return <div style={gridStyles} {...props}>{children}</div>;
};

// Flex Component
export interface LabFlexProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  gap?: keyof typeof designTokens.spacing;
  children: React.ReactNode;
}

export const LabFlex: React.FC<LabFlexProps> = ({
  direction = 'row',
  align = 'stretch',
  justify = 'start',
  wrap = 'nowrap',
  gap = 'md',
  children,
  style,
  ...props
}) => {
  const alignMap = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    stretch: 'stretch',
    baseline: 'baseline',
  };

  const justifyMap = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    between: 'space-between',
    around: 'space-around',
    evenly: 'space-evenly',
  };

  const flexStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: direction,
    alignItems: alignMap[align],
    justifyContent: justifyMap[justify],
    flexWrap: wrap,
    gap: designTokens.spacing[gap],
    ...style,
  };

  return <div style={flexStyles} {...props}>{children}</div>;
};

// Stack Component (Vertical Flex)
export interface LabStackProps extends React.HTMLAttributes<HTMLDivElement> {
  spacing?: keyof typeof designTokens.spacing;
  divider?: React.ReactNode;
  children: React.ReactNode;
}

export const LabStack: React.FC<LabStackProps> = ({
  spacing = 'md',
  divider,
  children,
  style,
  ...props
}) => {
  const stackStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: divider ? '0' : designTokens.spacing[spacing],
    ...style,
  };

  const childArray = React.Children.toArray(children);

  return (
    <div style={stackStyles} {...props}>
      {divider
        ? childArray.map((child, index) => (
            <React.Fragment key={index}>
              {child}
              {index < childArray.length - 1 && (
                <div style={{ margin: `${designTokens.spacing[spacing]} 0` }}>
                  {divider}
                </div>
              )}
            </React.Fragment>
          ))
        : children}
    </div>
  );
};

// Spacer Component
export interface LabSpacerProps {
  size?: keyof typeof designTokens.spacing;
}

export const LabSpacer: React.FC<LabSpacerProps> = ({ size = 'md' }) => {
  return <div style={{ height: designTokens.spacing[size], width: designTokens.spacing[size] }} />;
};

// Divider Component
export interface LabDividerProps extends React.HTMLAttributes<HTMLHRElement> {
  orientation?: 'horizontal' | 'vertical';
  variant?: 'solid' | 'dashed' | 'dotted';
}

export const LabDivider: React.FC<LabDividerProps> = ({
  orientation = 'horizontal',
  variant = 'solid',
  style,
  ...props
}) => {
  const dividerStyles: React.CSSProperties = {
    border: 'none',
    borderTop: orientation === 'horizontal' ? `1px ${variant} ${designTokens.colors.neutral[200]}` : 'none',
    borderLeft: orientation === 'vertical' ? `1px ${variant} ${designTokens.colors.neutral[200]}` : 'none',
    margin: orientation === 'horizontal' ? `${designTokens.spacing.md} 0` : `0 ${designTokens.spacing.md}`,
    width: orientation === 'horizontal' ? '100%' : '1px',
    height: orientation === 'vertical' ? '100%' : '1px',
    ...style,
  };

  return <hr style={dividerStyles} {...props} />;
};

export default {
  Container: LabContainer,
  Grid: LabGrid,
  Flex: LabFlex,
  Stack: LabStack,
  Spacer: LabSpacer,
  Divider: LabDivider,
};
