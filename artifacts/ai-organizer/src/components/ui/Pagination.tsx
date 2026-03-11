/**
 * Pagination Component - Page navigation
 */

import React, { useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  showFirstLast?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_STYLES = {
  sm: { button: '28px', fontSize: '12px', gap: '4px' },
  md: { button: '36px', fontSize: '14px', gap: '6px' },
  lg: { button: '44px', fontSize: '15px', gap: '8px' },
};

const range = (start: number, end: number): number[] => {
  const length = end - start + 1;
  return Array.from({ length }, (_, i) => start + i);
};

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  showFirstLast = true,
  size = 'md',
  className = '',
}) => {
  const sizeStyle = SIZE_STYLES[size];

  const { isDark, colors } = useTheme();

  const paginationRange = useMemo(() => {
    const totalPageNumbers = siblingCount * 2 + 5;

    if (totalPageNumbers >= totalPages) {
      return range(1, totalPages);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const showLeftDots = leftSiblingIndex > 2;
    const showRightDots = rightSiblingIndex < totalPages - 1;

    if (!showLeftDots && showRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      const leftRange = range(1, leftItemCount);
      return [...leftRange, 'dots', totalPages];
    }

    if (showLeftDots && !showRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      const rightRange = range(totalPages - rightItemCount + 1, totalPages);
      return [1, 'dots', ...rightRange];
    }

    if (showLeftDots && showRightDots) {
      const middleRange = range(leftSiblingIndex, rightSiblingIndex);
      return [1, 'dots', ...middleRange, 'dots', totalPages];
    }

    return range(1, totalPages);
  }, [currentPage, totalPages, siblingCount]);

  const buttonStyle = (isActive: boolean, isDisabled: boolean): React.CSSProperties => ({
    width: sizeStyle.button,
    height: sizeStyle.button,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    fontSize: sizeStyle.fontSize,
    fontWeight: 500,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? 0.4 : 1,
    background: isActive 
      ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' 
      : isDark
        ? 'rgba(255, 255, 255, 0.05)'
        : '#ffffff',
    color: isActive 
      ? 'white' 
      : isDark 
        ? 'rgba(255, 255, 255, 0.8)'
        : colors.textPrimary,
    border: isDark ? 'none' : `1px solid ${colors.borderPrimary}`,
    transition: 'all 0.2s',
  });

  return (
    <nav aria-label="Pagination" className={className}>
      <ul
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: sizeStyle.gap,
          listStyle: 'none',
          margin: 0,
          padding: 0,
        }}
      >
        {/* First Page */}
        {showFirstLast && (
          <li>
            <button
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              aria-label="Go to first page"
              style={buttonStyle(false, currentPage === 1)}
              onMouseEnter={(e) => {
                if (currentPage !== 1) {
                  e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.1)' : colors.bgHover;
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== 1) {
                  e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.05)' : '#ffffff';
                }
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
              </svg>
            </button>
          </li>
        )}

        {/* Previous */}
        <li>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Go to previous page"
            style={buttonStyle(false, currentPage === 1)}
            onMouseEnter={(e) => {
              if (currentPage !== 1) {
                e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.1)' : colors.bgHover;
              }
            }}
            onMouseLeave={(e) => {
              if (currentPage !== 1) {
                e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.05)' : '#ffffff';
              }
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        </li>

        {/* Page Numbers */}
        {paginationRange.map((page, index) => {
          if (page === 'dots') {
            return (
              <li key={`dots-${index}`}>
                <span style={{ color: isDark ? 'rgba(255, 255, 255, 0.5)' : colors.textMuted, padding: '0 4px' }}>...</span>
              </li>
            );
          }

          const pageNum = page as number;
          const isActive = pageNum === currentPage;

          return (
            <li key={pageNum}>
              <button
                onClick={() => onPageChange(pageNum)}
                aria-label={`Go to page ${pageNum}`}
                aria-current={isActive ? 'page' : undefined}
                style={buttonStyle(isActive, false)}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.1)' : colors.bgHover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.05)' : '#ffffff';
                  }
                }}
              >
                {pageNum}
              </button>
            </li>
          );
        })}

        {/* Next */}
        <li>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Go to next page"
            style={buttonStyle(false, currentPage === totalPages)}
            onMouseEnter={(e) => {
              if (currentPage !== totalPages) {
                e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.1)' : colors.bgHover;
              }
            }}
            onMouseLeave={(e) => {
              if (currentPage !== totalPages) {
                e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.05)' : '#ffffff';
              }
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </li>

        {/* Last Page */}
        {showFirstLast && (
          <li>
            <button
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
              aria-label="Go to last page"
              style={buttonStyle(false, currentPage === totalPages)}
              onMouseEnter={(e) => {
                if (currentPage !== totalPages) {
                  e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.1)' : colors.bgHover;
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== totalPages) {
                  e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.05)' : '#ffffff';
                }
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 17l5-5-5-5M6 17l5-5-5-5" />
              </svg>
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default Pagination;
