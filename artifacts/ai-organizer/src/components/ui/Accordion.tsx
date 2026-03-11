/**
 * Accordion Component - Expandable content sections
 */

import React, { useState, useCallback } from 'react';

interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  defaultExpanded?: string[];
  variant?: 'default' | 'bordered' | 'separated';
  className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({
  items,
  allowMultiple = false,
  defaultExpanded = [],
  variant = 'default',
  className = '',
}) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(defaultExpanded));

  const toggleItem = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (!allowMultiple) {
          next.clear();
        }
        next.add(id);
      }
      return next;
    });
  }, [allowMultiple]);

  const getItemStyle = (): React.CSSProperties => {
    switch (variant) {
      case 'bordered':
        return {
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '10px',
          marginBottom: '8px',
          overflow: 'hidden',
        };
      case 'separated':
        return {
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '10px',
          marginBottom: '8px',
          overflow: 'hidden',
        };
      default:
        return {
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        };
    }
  };

  return (
    <div className={className}>
      {items.map((item) => {
        const isExpanded = expanded.has(item.id);
        
        return (
          <div key={item.id} style={getItemStyle()}>
            <button
              onClick={() => !item.disabled && toggleItem(item.id)}
              disabled={item.disabled}
              aria-expanded={isExpanded}
              aria-controls={`accordion-content-${item.id}`}
              style={{
                width: '100%',
                padding: '14px 16px',
                background: 'transparent',
                border: 'none',
                color: item.disabled ? 'rgba(255, 255, 255, 0.4)' : '#fafafa',
                fontSize: '14px',
                fontWeight: 500,
                textAlign: 'left',
                cursor: item.disabled ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!item.disabled) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {item.icon && <span style={{ fontSize: '18px' }}>{item.icon}</span>}
              <span style={{ flex: 1 }}>{item.title}</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                  transition: 'transform 0.2s ease-out',
                  color: 'rgba(255, 255, 255, 0.5)',
                }}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            
            <div
              id={`accordion-content-${item.id}`}
              role="region"
              aria-labelledby={item.id}
              style={{
                maxHeight: isExpanded ? '500px' : '0',
                overflow: 'hidden',
                transition: 'max-height 0.3s ease-out',
              }}
            >
              <div style={{
                padding: '0 16px 16px',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '14px',
                lineHeight: 1.6,
              }}>
                {item.content}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Accordion;
