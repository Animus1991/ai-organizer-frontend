/**
 * Avatar Component - User avatar with fallback
 */

import React from 'react';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  status?: 'online' | 'offline' | 'away' | 'busy';
  className?: string;
}

const SIZE_MAP: Record<AvatarSize, { size: number; fontSize: number; statusSize: number }> = {
  xs: { size: 24, fontSize: 10, statusSize: 6 },
  sm: { size: 32, fontSize: 12, statusSize: 8 },
  md: { size: 40, fontSize: 14, statusSize: 10 },
  lg: { size: 48, fontSize: 16, statusSize: 12 },
  xl: { size: 64, fontSize: 20, statusSize: 14 },
};

const STATUS_COLORS: Record<string, string> = {
  online: '#22c55e',
  offline: '#6b7280',
  away: '#f59e0b',
  busy: '#ef4444',
};

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const getColorFromName = (name: string): string => {
  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
    '#f59e0b', '#22c55e', '#14b8a6', '#3b82f6',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = '',
  name = '',
  size = 'md',
  status,
  className = '',
}) => {
  const sizeConfig = SIZE_MAP[size];
  const [imgError, setImgError] = React.useState(false);
  const showFallback = !src || imgError;

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: sizeConfig.size,
        height: sizeConfig.size,
        borderRadius: '50%',
        overflow: 'hidden',
        background: showFallback ? getColorFromName(name || 'User') : 'transparent',
        flexShrink: 0,
      }}
    >
      {showFallback ? (
        <span
          style={{
            color: 'white',
            fontSize: sizeConfig.fontSize,
            fontWeight: 600,
            letterSpacing: '0.02em',
          }}
        >
          {name ? getInitials(name) : '?'}
        </span>
      ) : (
        <img
          src={src}
          alt={alt || name}
          onError={() => setImgError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      )}

      {status && (
        <span
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: sizeConfig.statusSize,
            height: sizeConfig.statusSize,
            borderRadius: '50%',
            background: STATUS_COLORS[status],
            border: '2px solid #1c1917',
          }}
        />
      )}
    </div>
  );
};

export const AvatarGroup: React.FC<{
  children: React.ReactNode;
  max?: number;
  size?: AvatarSize;
}> = ({ children, max = 4, size = 'md' }) => {
  const childArray = React.Children.toArray(children);
  const visibleCount = Math.min(childArray.length, max);
  const extraCount = childArray.length - max;
  const sizeConfig = SIZE_MAP[size];

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {childArray.slice(0, visibleCount).map((child, index) => (
        <div
          key={index}
          style={{
            marginLeft: index === 0 ? 0 : -sizeConfig.size / 4,
            position: 'relative',
            zIndex: visibleCount - index,
          }}
        >
          {child}
        </div>
      ))}
      {extraCount > 0 && (
        <div
          style={{
            marginLeft: -sizeConfig.size / 4,
            width: sizeConfig.size,
            height: sizeConfig.size,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '2px solid #1c1917',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: sizeConfig.fontSize - 2,
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.7)',
          }}
        >
          +{extraCount}
        </div>
      )}
    </div>
  );
};

export default Avatar;
