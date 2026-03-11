/**
 * StarButton - GitHub-style star/bookmark button with count
 * Wraps the existing FavoritesContext to provide a compact star UI with simulated counts.
 */
import React, { useMemo } from 'react';
import { useFavorites, FavoriteType } from '../context/FavoritesContext';

interface StarButtonProps {
  documentId: number;
  title: string;
  type?: FavoriteType;
  size?: 'sm' | 'md';
  style?: React.CSSProperties;
}

// Seeded pseudo-random for consistent star counts per document
function seededCount(id: number): number {
  let s = (id * 2654435761) >>> 0;
  s = ((s ^ (s >> 16)) * 0x45d9f3b) >>> 0;
  s = (s ^ (s >> 16)) >>> 0;
  return (s % 42) + 1; // 1–42 simulated stars
}

export const StarButton: React.FC<StarButtonProps> = ({
  documentId,
  title,
  type = 'document',
  size = 'sm',
  style,
}) => {
  const { toggleFavorite, isFavorite } = useFavorites();
  const itemKey = `doc-${documentId}`;
  const isStarred = isFavorite(itemKey, type);

  const baseCount = useMemo(() => seededCount(documentId), [documentId]);
  const displayCount = isStarred ? baseCount + 1 : baseCount;

  const isSm = size === 'sm';

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    toggleFavorite({
      type,
      title,
      metadata: { originalId: itemKey, documentId },
    });
  };

  return (
    <button
      onClick={handleClick}
      title={isStarred ? 'Unstar this document' : 'Star this document'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isSm ? '4px' : '5px',
        padding: isSm ? '2px 8px' : '4px 10px',
        fontSize: isSm ? '11px' : '12px',
        fontWeight: 500,
        borderRadius: '6px',
        border: isStarred
          ? '1px solid rgba(245, 158, 11, 0.4)'
          : '1px solid rgba(255, 255, 255, 0.12)',
        background: isStarred
          ? 'rgba(245, 158, 11, 0.12)'
          : 'rgba(255, 255, 255, 0.04)',
        color: isStarred ? '#fbbf24' : 'rgba(255, 255, 255, 0.55)',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      <span style={{
        fontSize: isSm ? '12px' : '14px',
        transform: isStarred ? 'scale(1.15)' : 'scale(1)',
        transition: 'transform 0.2s ease',
      }}>
        {isStarred ? '★' : '☆'}
      </span>
      <span>{displayCount}</span>
    </button>
  );
};

export default StarButton;
