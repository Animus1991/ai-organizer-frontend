/**
 * EmptyState - Reusable component for empty list/search states
 * Provides consistent UX across the application
 */

import { useTheme } from '../../context/ThemeContext';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'search' | 'error' | 'success';
}

const variantStyles = {
  default: {
    iconBg: 'rgba(99, 102, 241, 0.1)',
    iconColor: '#6366f1',
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  search: {
    iconBg: 'rgba(245, 158, 11, 0.1)',
    iconColor: '#f59e0b',
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  error: {
    iconBg: 'rgba(239, 68, 68, 0.1)',
    iconColor: '#ef4444',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  success: {
    iconBg: 'rgba(34, 197, 94, 0.1)',
    iconColor: '#22c55e',
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
};

const defaultIcons = {
  default: '📋',
  search: '🔍',
  error: '⚠️',
  success: '✅',
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = 'default',
}: EmptyStateProps) {
  const { isDark } = useTheme();
  const styles = variantStyles[variant];
  const displayIcon = icon || defaultIcons[variant];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
        background: isDark ? 'rgba(255, 255, 255, 0.02)' : '#ffffff',
        border: `1px dashed ${styles.borderColor}`,
        borderRadius: '16px',
        margin: '16px 0',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: styles.iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
          marginBottom: '16px',
        }}
      >
        {displayIcon}
      </div>
      
      <h3
        style={{
          fontSize: '18px',
          fontWeight: 600,
          color: isDark ? '#eaeaea' : '#2f2941',
          marginBottom: description ? '8px' : '0',
        }}
      >
        {title}
      </h3>
      
      {description && (
        <p
          style={{
            fontSize: '14px',
            color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(47, 41, 65, 0.7)',
            maxWidth: '320px',
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      )}
      
      {action && (
        <button
          onClick={action.onClick}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            background: `linear-gradient(135deg, ${styles.iconColor} 0%, ${styles.iconColor}dd 100%)`,
            border: 'none',
            borderRadius: '10px',
            color: 'white',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = `0 4px 12px ${styles.iconColor}40`;
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
