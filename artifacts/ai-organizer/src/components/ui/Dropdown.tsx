/**
 * Dropdown Component - Accessible dropdown menu
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';

interface DropdownItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
  onClick?: () => void;
}

interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  width?: string | number;
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  align = 'left',
  width = 200,
}) => {
  const { isDark, colors } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const menuBg = isDark ? 'rgba(20, 20, 35, 0.98)' : '#ffffff';
  const menuBorder = isDark ? `1px solid ${colors.borderPrimary}` : '1px solid rgba(0, 0, 0, 0.12)';
  const menuShadow = isDark ? '0 12px 34px rgba(0, 0, 0, 0.5)' : '0 8px 24px rgba(0, 0, 0, 0.12)';
  const dividerBg = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
  const itemHoverBg = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)';

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, handleClickOutside, handleKeyDown]);

  const handleItemClick = (item: DropdownItem) => {
    if (item.disabled) return;
    item.onClick?.();
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <div onClick={() => setIsOpen(!isOpen)} style={{ cursor: 'pointer' }}>
        {trigger}
      </div>

      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          style={{
            position: 'absolute',
            top: '100%',
            [align]: 0,
            marginTop: '8px',
            width,
            background: menuBg,
            border: menuBorder,
            borderRadius: '12px',
            boxShadow: menuShadow,
            backdropFilter: 'blur(12px)',
            padding: '6px',
            zIndex: 1000,
            animation: 'dropdownFadeIn 0.15s ease-out',
          }}
        >
          {items.map((item) => {
            if (item.divider) {
              return (
                <div
                  key={item.id}
                  style={{
                    height: '1px',
                    background: dividerBg,
                    margin: '6px 0',
                  }}
                />
              );
            }

            return (
              <button
                key={item.id}
                role="menuitem"
                disabled={item.disabled}
                onClick={() => handleItemClick(item)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: item.danger
                    ? (isDark ? '#f87171' : '#dc2626')
                    : item.disabled
                      ? (isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)')
                      : (isDark ? 'rgba(255, 255, 255, 0.92)' : 'rgba(0, 0, 0, 0.92)'),
                  fontSize: '14px',
                  fontWeight: 500,
                  textAlign: 'left',
                  cursor: item.disabled ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (!item.disabled) {
                    e.currentTarget.style.background = item.danger 
                      ? (isDark ? 'rgba(239, 68, 68, 0.18)' : 'rgba(239, 68, 68, 0.1)')
                      : itemHoverBg;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {item.icon && <span style={{ fontSize: '16px' }}>{item.icon}</span>}
                {item.label}
              </button>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes dropdownFadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Dropdown;
