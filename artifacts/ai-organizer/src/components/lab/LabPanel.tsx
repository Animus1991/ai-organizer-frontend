/**
 * LabPanel Component
 * CoFounderBay-inspired panel component for Research Lab
 * Enhanced panel with header, actions, loading states, and error handling
 */

import React from 'react';
import { designTokens } from '../../styles/DesignTokens';
import { LabCard } from './LabCard';
import { LabButton } from './LabButton';

export interface LabPanelProps {
  title: string;
  icon?: React.ReactNode;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  variant?: 'default' | 'compact' | 'expanded';
  loading?: boolean;
  error?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  onRefresh?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const LabPanel: React.FC<LabPanelProps> = ({
  title,
  icon,
  description,
  actions,
  children,
  variant = 'default',
  loading = false,
  error,
  collapsible = false,
  defaultCollapsed = false,
  onRefresh,
  className,
  style,
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: designTokens.spacing.md,
    padding: variant === 'compact' ? designTokens.spacing.sm : designTokens.spacing.md,
    borderBottom: !isCollapsed ? `1px solid ${designTokens.colors.neutral[200]}` : 'none',
  };

  const titleContainerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: designTokens.spacing.sm,
    flex: 1,
  };

  const titleStyles: React.CSSProperties = {
    fontSize: variant === 'compact' ? designTokens.typography.fontSize.base : designTokens.typography.fontSize.lg,
    fontWeight: designTokens.typography.fontWeight.semibold,
    color: designTokens.colors.neutral[900],
    margin: 0,
  };

  const descriptionStyles: React.CSSProperties = {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.neutral[600],
    marginTop: designTokens.spacing.xs,
  };

  const actionsContainerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: designTokens.spacing.sm,
  };

  const contentStyles: React.CSSProperties = {
    padding: variant === 'compact' ? designTokens.spacing.sm : designTokens.spacing.md,
  };

  const loadingOverlayStyles: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(4px)',
    zIndex: 10,
  };

  const errorStyles: React.CSSProperties = {
    padding: designTokens.spacing.md,
    background: designTokens.colors.semantic.errorLight,
    border: `1px solid ${designTokens.colors.semantic.error}`,
    borderRadius: designTokens.borderRadius.md,
    color: designTokens.colors.semantic.error,
    fontSize: designTokens.typography.fontSize.sm,
    display: 'flex',
    alignItems: 'center',
    gap: designTokens.spacing.sm,
  };

  const spinnerStyles: React.CSSProperties = {
    width: '32px',
    height: '32px',
    border: `3px solid ${designTokens.colors.neutral[200]}`,
    borderTopColor: designTokens.colors.semantic.primary,
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  };

  return (
    <LabCard
      variant="elevated"
      padding="none"
      className={className}
      style={{ position: 'relative', ...style }}
    >
      {/* Header */}
      <div style={headerStyles}>
        <div style={titleContainerStyles}>
          {icon && <span style={{ fontSize: '20px', display: 'flex', alignItems: 'center' }}>{icon}</span>}
          <div>
            <h3 style={titleStyles}>{title}</h3>
            {description && <p style={descriptionStyles}>{description}</p>}
          </div>
        </div>

        <div style={actionsContainerStyles}>
          {onRefresh && (
            <LabButton
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
              title="Refresh"
            >
              🔄
            </LabButton>
          )}
          {actions}
          {collapsible && (
            <LabButton
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? 'Expand' : 'Collapse'}
            >
              {isCollapsed ? '▼' : '▲'}
            </LabButton>
          )}
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div style={contentStyles}>
          {error ? (
            <div style={errorStyles}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          ) : (
            children
          )}
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div style={loadingOverlayStyles}>
          <div style={spinnerStyles} />
        </div>
      )}
    </LabCard>
  );
};

export default LabPanel;
