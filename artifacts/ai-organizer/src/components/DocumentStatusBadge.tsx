/**
 * DocumentStatusBadge - GitHub-style document workflow status badge
 * Shows Draft / In Review / Published / Archived with click-to-cycle
 */
import React from 'react';
import { DocumentStatus, STATUS_CONFIG } from '../hooks/useDocumentStatus';
import { useLanguage } from '../context/LanguageContext';

interface DocumentStatusBadgeProps {
  status: DocumentStatus;
  onCycle?: () => void;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export const DocumentStatusBadge: React.FC<DocumentStatusBadgeProps> = ({
  status,
  onCycle,
  size = 'sm',
  showIcon = true,
}) => {
  const { t } = useLanguage();
  const config = STATUS_CONFIG[status];
  const label = t(config.labelKey) || config.label;

  const isSm = size === 'sm';

  return (
    <span
      onClick={(e) => {
        if (onCycle) {
          e.stopPropagation();
          e.preventDefault();
          onCycle();
        }
      }}
      title={onCycle ? `Click to change status (${label})` : label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isSm ? '3px' : '5px',
        padding: isSm ? '2px 8px' : '4px 10px',
        fontSize: isSm ? '10px' : '11px',
        fontWeight: 600,
        borderRadius: '12px',
        color: config.color,
        background: config.bg,
        border: `1px solid ${config.bg.replace('0.15', '0.35')}`,
        cursor: onCycle ? 'pointer' : 'default',
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        letterSpacing: '0.02em',
      }}
    >
      {showIcon && <span style={{ fontSize: isSm ? '10px' : '12px' }}>{config.icon}</span>}
      {label}
    </span>
  );
};

export default DocumentStatusBadge;
