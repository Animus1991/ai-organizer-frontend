/**
 * Tooltip Component - Accessible tooltip with positioning
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  disabled?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  delay = 300,
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showTooltip = () => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;

        let x = rect.left + scrollX + rect.width / 2;
        let y = rect.top + scrollY;

        switch (position) {
          case 'bottom':
            y = rect.bottom + scrollY + 8;
            break;
          case 'left':
            x = rect.left + scrollX - 8;
            y = rect.top + scrollY + rect.height / 2;
            break;
          case 'right':
            x = rect.right + scrollX + 8;
            y = rect.top + scrollY + rect.height / 2;
            break;
          default: // top
            y = rect.top + scrollY - 8;
        }

        setCoords({ x, y });
        setIsVisible(true);
      }
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getTransformOrigin = () => {
    switch (position) {
      case 'bottom': return 'top center';
      case 'left': return 'right center';
      case 'right': return 'left center';
      default: return 'bottom center';
    }
  };

  const getTransform = () => {
    switch (position) {
      case 'bottom': return 'translateX(-50%)';
      case 'left': return 'translateX(-100%) translateY(-50%)';
      case 'right': return 'translateY(-50%)';
      default: return 'translateX(-50%) translateY(-100%)';
    }
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        style={{ display: 'inline-block' }}
      >
        {children}
      </div>
      {isVisible && createPortal(
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            left: coords.x,
            top: coords.y,
            transform: getTransform(),
            transformOrigin: getTransformOrigin(),
            padding: '8px 12px',
            background: 'rgba(24, 24, 32, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: '#fafafa',
            fontSize: '13px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            zIndex: 99999,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(8px)',
            animation: 'tooltipFadeIn 0.15s ease-out',
            pointerEvents: 'none',
          }}
        >
          {content}
          <style>{`
            @keyframes tooltipFadeIn {
              from { opacity: 0; transform: ${getTransform()} scale(0.95); }
              to { opacity: 1; transform: ${getTransform()} scale(1); }
            }
          `}</style>
        </div>,
        document.body
      )}
    </>
  );
};

export default Tooltip;
