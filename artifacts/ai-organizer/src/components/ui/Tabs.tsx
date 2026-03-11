/**
 * Tabs Component - Accessible tabbed interface
 */

import React, { useState, useRef, useEffect } from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  badge?: string | number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab?: string;
  onChange?: (tabId: string) => void;
  children?: React.ReactNode;
  variant?: 'default' | 'pills' | 'underline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

interface TabPanelProps {
  id: string;
  children: React.ReactNode;
}

const SIZE_STYLES = {
  sm: { padding: '6px 12px', fontSize: '12px', gap: '6px' },
  md: { padding: '8px 16px', fontSize: '13px', gap: '8px' },
  lg: { padding: '10px 20px', fontSize: '14px', gap: '10px' },
};

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  children,
  variant = 'default',
  size = 'md',
  fullWidth = false,
}) => {
  const [active, setActive] = useState(activeTab || tabs[0]?.id);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabsRef = useRef<HTMLDivElement>(null);
  const sizeStyle = SIZE_STYLES[size];

  useEffect(() => {
    if (activeTab) setActive(activeTab);
  }, [activeTab]);

  useEffect(() => {
    const activeElement = tabsRef.current?.querySelector(`[data-tab-id="${active}"]`) as HTMLElement;
    if (activeElement && variant === 'underline') {
      setIndicatorStyle({
        left: activeElement.offsetLeft,
        width: activeElement.offsetWidth,
      });
    }
  }, [active, variant]);

  const handleTabClick = (tabId: string, disabled?: boolean) => {
    if (disabled) return;
    setActive(tabId);
    onChange?.(tabId);
  };

  const getTabStyle = (tab: Tab, isActive: boolean): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      padding: sizeStyle.padding,
      fontSize: sizeStyle.fontSize,
      fontWeight: 500,
      border: 'none',
      cursor: tab.disabled ? 'not-allowed' : 'pointer',
      opacity: tab.disabled ? 0.5 : 1,
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: sizeStyle.gap,
      flex: fullWidth ? 1 : 'none',
      justifyContent: 'center',
      outline: 'none',
    };

    switch (variant) {
      case 'pills':
        return {
          ...baseStyle,
          background: isActive ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
          color: isActive ? 'white' : 'rgba(255, 255, 255, 0.7)',
          borderRadius: '8px',
        };
      case 'underline':
        return {
          ...baseStyle,
          background: 'transparent',
          color: isActive ? '#a5b4fc' : 'rgba(255, 255, 255, 0.7)',
          borderRadius: 0,
        };
      default:
        return {
          ...baseStyle,
          background: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
          color: isActive ? '#fafafa' : 'rgba(255, 255, 255, 0.7)',
          borderRadius: '8px',
        };
    }
  };

  const activePanel = React.Children.toArray(children).find(
    (child) => React.isValidElement(child) && (child.props as { id?: string }).id === active
  );

  return (
    <div>
      {/* Tab List */}
      <div
        ref={tabsRef}
        role="tablist"
        style={{
          display: 'flex',
          gap: variant === 'underline' ? 0 : '4px',
          padding: variant === 'underline' ? 0 : '4px',
          background: variant === 'underline' ? 'transparent' : 'rgba(255, 255, 255, 0.03)',
          borderRadius: variant === 'underline' ? 0 : '10px',
          borderBottom: variant === 'underline' ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
          position: 'relative',
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            data-tab-id={tab.id}
            aria-selected={active === tab.id}
            aria-disabled={tab.disabled}
            onClick={() => handleTabClick(tab.id, tab.disabled)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleTabClick(tab.id, tab.disabled);
              }
            }}
            style={getTabStyle(tab, active === tab.id)}
            onMouseEnter={(e) => {
              if (!tab.disabled && active !== tab.id) {
                e.currentTarget.style.color = '#fafafa';
                if (variant !== 'underline') {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }
              }
            }}
            onMouseLeave={(e) => {
              if (!tab.disabled && active !== tab.id) {
                Object.assign(e.currentTarget.style, getTabStyle(tab, false));
              }
            }}
          >
            {tab.icon}
            {tab.label}
            {tab.badge !== undefined && (
              <span
                style={{
                  padding: '2px 6px',
                  fontSize: '10px',
                  fontWeight: 600,
                  background: 'rgba(99, 102, 241, 0.3)',
                  color: '#a5b4fc',
                  borderRadius: '9999px',
                }}
              >
                {tab.badge}
              </span>
            )}
          </button>
        ))}

        {/* Underline Indicator */}
        {variant === 'underline' && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: indicatorStyle.left,
              width: indicatorStyle.width,
              height: '2px',
              background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
              borderRadius: '1px',
              transition: 'all 0.2s ease-out',
            }}
          />
        )}
      </div>

      {/* Tab Panel */}
      <div role="tabpanel" style={{ marginTop: '16px' }}>
        {activePanel}
      </div>
    </div>
  );
};

export const TabPanel: React.FC<TabPanelProps> = ({ children }) => {
  return <>{children}</>;
};

export default Tabs;
