/**
 * LabToolCard Component
 * CoFounderBay-inspired interactive tool card for Research Lab
 * Supports drag & drop, categories, and quick actions
 */

import React from 'react';
import { designTokens } from '../../styles/DesignTokens';
import { LabCard } from './LabCard';
import { LabButton } from './LabButton';

export interface LabToolCardProps {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category?: string;
  status?: 'idle' | 'active' | 'completed' | 'error';
  progress?: number;
  onClick?: () => void;
  onActivate?: () => void;
  onRemove?: () => void;
  draggable?: boolean;
  actions?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const LabToolCard: React.FC<LabToolCardProps> = ({
  id,
  title,
  description,
  icon,
  category,
  status = 'idle',
  progress,
  onClick,
  onActivate,
  onRemove,
  draggable = false,
  actions,
  className,
  style,
}) => {
  const [isDragging, setIsDragging] = React.useState(false);

  const statusColors = {
    idle: designTokens.colors.neutral[400],
    active: designTokens.colors.semantic.primary,
    completed: designTokens.colors.semantic.success,
    error: designTokens.colors.semantic.error,
  };

  const statusLabels = {
    idle: 'Ready',
    active: 'Active',
    completed: 'Completed',
    error: 'Error',
  };

  const cardStyles: React.CSSProperties = {
    cursor: onClick ? 'pointer' : draggable ? 'move' : 'default',
    opacity: isDragging ? 0.5 : 1,
    transition: `all ${designTokens.animation.duration['200']} ${designTokens.animation.easing.easeInOut}`,
    ...style,
  };

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: designTokens.spacing.md,
    marginBottom: designTokens.spacing.sm,
  };

  const iconContainerStyles: React.CSSProperties = {
    width: '48px',
    height: '48px',
    borderRadius: designTokens.borderRadius.lg,
    background: `linear-gradient(135deg, ${designTokens.colors.semantic.primary}15, ${designTokens.colors.semantic.accent}15)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    flexShrink: 0,
  };

  const contentStyles: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
  };

  const titleStyles: React.CSSProperties = {
    fontSize: designTokens.typography.fontSize.base,
    fontWeight: designTokens.typography.fontWeight.semibold,
    color: designTokens.colors.neutral[900],
    margin: 0,
    marginBottom: designTokens.spacing.xs,
  };

  const descriptionStyles: React.CSSProperties = {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.neutral[600],
    lineHeight: designTokens.typography.lineHeight.relaxed,
    margin: 0,
  };

  const footerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: designTokens.spacing.md,
    paddingTop: designTokens.spacing.md,
    borderTop: `1px solid ${designTokens.colors.neutral[200]}`,
  };

  const statusBadgeStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: designTokens.spacing.xs,
    padding: `${designTokens.spacing.xs} ${designTokens.spacing.sm}`,
    borderRadius: designTokens.borderRadius.full,
    background: `${statusColors[status]}15`,
    color: statusColors[status],
    fontSize: designTokens.typography.fontSize.xs,
    fontWeight: designTokens.typography.fontWeight.medium,
  };

  const categoryBadgeStyles: React.CSSProperties = {
    display: 'inline-block',
    padding: `${designTokens.spacing.xs} ${designTokens.spacing.sm}`,
    borderRadius: designTokens.borderRadius.sm,
    background: designTokens.colors.neutral[100],
    color: designTokens.colors.neutral[700],
    fontSize: designTokens.typography.fontSize.xs,
    fontWeight: designTokens.typography.fontWeight.medium,
    marginBottom: designTokens.spacing.sm,
  };

  const progressBarStyles: React.CSSProperties = {
    width: '100%',
    height: '4px',
    borderRadius: designTokens.borderRadius.full,
    background: designTokens.colors.neutral[200],
    overflow: 'hidden',
    marginTop: designTokens.spacing.sm,
  };

  const progressFillStyles: React.CSSProperties = {
    height: '100%',
    width: `${progress || 0}%`,
    background: designTokens.colors.brand.gradient.primary,
    transition: `width ${designTokens.animation.duration['300']} ${designTokens.animation.easing.easeOut}`,
  };

  const actionsContainerStyles: React.CSSProperties = {
    display: 'flex',
    gap: designTokens.spacing.xs,
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (!draggable) return;
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <LabCard
      variant="default"
      padding="md"
      hoverable
      clickable={!!onClick}
      onClick={onClick}
      className={className}
      style={cardStyles}
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {category && <div style={categoryBadgeStyles}>{category}</div>}
      
      <div style={headerStyles}>
        <div style={iconContainerStyles}>{icon}</div>
        <div style={contentStyles}>
          <h4 style={titleStyles}>{title}</h4>
          <p style={descriptionStyles}>{description}</p>
        </div>
      </div>

      {typeof progress === 'number' && (
        <div style={progressBarStyles}>
          <div style={progressFillStyles} />
        </div>
      )}

      <div style={footerStyles}>
        <div style={statusBadgeStyles}>
          <span style={{ 
            width: '6px', 
            height: '6px', 
            borderRadius: '50%', 
            background: statusColors[status] 
          }} />
          {statusLabels[status]}
        </div>

        <div style={actionsContainerStyles}>
          {actions}
          {onActivate && status === 'idle' && (
            <LabButton
              variant="primary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onActivate();
              }}
            >
              Activate
            </LabButton>
          )}
          {onRemove && (
            <LabButton
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              title="Remove"
            >
              ✕
            </LabButton>
          )}
        </div>
      </div>
    </LabCard>
  );
};

export default LabToolCard;
