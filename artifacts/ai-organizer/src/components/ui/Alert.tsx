/**
 * Alert/Banner Component - Status messages and notifications
 */

import React, { useState } from 'react';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const VARIANT_STYLES: Record<AlertVariant, { bg: string; border: string; icon: string; iconColor: string }> = {
  info: {
    bg: 'rgba(59, 130, 246, 0.1)',
    border: 'rgba(59, 130, 246, 0.3)',
    icon: 'ℹ',
    iconColor: '#3b82f6',
  },
  success: {
    bg: 'rgba(34, 197, 94, 0.1)',
    border: 'rgba(34, 197, 94, 0.3)',
    icon: '✓',
    iconColor: '#22c55e',
  },
  warning: {
    bg: 'rgba(245, 158, 11, 0.1)',
    border: 'rgba(245, 158, 11, 0.3)',
    icon: '⚠',
    iconColor: '#f59e0b',
  },
  error: {
    bg: 'rgba(239, 68, 68, 0.1)',
    border: 'rgba(239, 68, 68, 0.3)',
    icon: '✕',
    iconColor: '#ef4444',
  },
};

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  icon,
  dismissible = false,
  onDismiss,
  action,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const style = VARIANT_STYLES[variant];

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  return (
    <div
      role="alert"
      className={className}
      style={{
        display: 'flex',
        gap: '12px',
        padding: '14px 16px',
        background: style.bg,
        border: `1px solid ${style.border}`,
        borderRadius: '10px',
        animation: 'alertSlideIn 0.2s ease-out',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: `${style.iconColor}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: style.iconColor,
          fontSize: '12px',
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {icon || style.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && (
          <div
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#fafafa',
              marginBottom: children ? '4px' : 0,
            }}
          >
            {title}
          </div>
        )}
        <div
          style={{
            fontSize: '13px',
            color: 'rgba(255, 255, 255, 0.8)',
            lineHeight: 1.5,
          }}
        >
          {children}
        </div>
        {action && (
          <button
            onClick={action.onClick}
            style={{
              marginTop: '10px',
              padding: '6px 12px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '6px',
              color: '#fafafa',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            {action.label}
          </button>
        )}
      </div>

      {/* Dismiss Button */}
      {dismissible && (
        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          style={{
            padding: '4px',
            background: 'transparent',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.5)',
            cursor: 'pointer',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.2s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#fafafa')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}

      <style>{`
        @keyframes alertSlideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Alert;
