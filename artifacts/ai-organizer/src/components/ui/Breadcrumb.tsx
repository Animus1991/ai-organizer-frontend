/**
 * Breadcrumb Component - Navigation breadcrumbs
 */

import React from 'react';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  maxItems?: number;
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  separator,
  maxItems = 0,
  className = '',
}) => {
  const defaultSeparator = (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      style={{ color: 'rgba(255, 255, 255, 0.3)' }}
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );

  let displayItems = items;
  let showEllipsis = false;

  if (maxItems > 0 && items.length > maxItems) {
    const start = items.slice(0, 1);
    const end = items.slice(-(maxItems - 1));
    displayItems = [...start, { label: '...' }, ...end];
    showEllipsis = true;
  }

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          listStyle: 'none',
          margin: 0,
          padding: 0,
          flexWrap: 'wrap',
        }}
      >
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          const isEllipsis = item.label === '...' && showEllipsis;

          return (
            <li
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {isEllipsis ? (
                <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px' }}>
                  ...
                </span>
              ) : item.href || item.onClick ? (
                <a
                  href={item.href || '#'}
                  onClick={(e) => {
                    if (item.onClick) {
                      e.preventDefault();
                      item.onClick();
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: isLast ? '#fafafa' : 'rgba(255, 255, 255, 0.6)',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: isLast ? 500 : 400,
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isLast) {
                      e.currentTarget.style.color = '#a5b4fc';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLast) {
                      e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
                    }
                  }}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.icon}
                  {item.label}
                </a>
              ) : (
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: isLast ? '#fafafa' : 'rgba(255, 255, 255, 0.6)',
                    fontSize: '14px',
                    fontWeight: isLast ? 500 : 400,
                  }}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.icon}
                  {item.label}
                </span>
              )}

              {!isLast && (
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  {separator || defaultSeparator}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
