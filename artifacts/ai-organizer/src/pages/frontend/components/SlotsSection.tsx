import React, { useMemo } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import { useSlots } from '../hooks/useSlots';

interface SlotsSectionProps {
  compareMode: boolean;
  compareSlots: string[];
  viewMode: 'grid' | 'carousel' | '3d';
  onViewModeChange: (mode: 'grid' | 'carousel' | '3d') => void;
  onSlotClick: (slotId: string) => void;
  onSlotRemove: (slotId: string) => void;
  onSlotClear: (slotId: string) => void;
}

export const SlotsSection: React.FC<SlotsSectionProps> = ({
  compareMode,
  compareSlots,
  viewMode,
  onViewModeChange,
  onSlotClick,
  onSlotRemove,
  onSlotClear
}) => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const slots = useSlots();

  const slotsWithCompareState = useMemo(() => {
    return slots.slots.map(slot => ({
      ...slot,
      isComparing: compareSlots.includes(slot.slotId)
    }));
  }, [slots.slots, compareSlots]);

  const containerStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.06) 0%, rgba(22, 163, 74, 0.04) 100%)',
    borderRadius: '16px',
    border: '1px solid rgba(34, 197, 94, 0.12)',
    padding: '16px 20px',
    marginBottom: '16px',
    backdropFilter: 'blur(16px)',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: '600',
    color: isDark ? 'rgba(255,255,255,0.9)' : '#2f2941',
    margin: 0
  };

  const viewModeToggleStyle: React.CSSProperties = {
    display: 'flex',
    gap: '4px',
    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(47,41,65,0.04)',
    padding: '3px',
    borderRadius: '10px',
    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(47,41,65,0.1)',
  };

  const viewModeButtonStyle = (isActive: boolean) => ({
    padding: '6px 12px',
    borderRadius: '8px',
    border: 'none',
    background: isActive ? 'linear-gradient(135deg, rgba(34,197,94,0.4), rgba(22,163,74,0.35))' : 'transparent',
    color: isActive ? '#fff' : (isDark ? 'rgba(255,255,255,0.6)' : 'rgba(47,41,65,0.5)'),
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: isActive ? '0 2px 8px rgba(34,197,94,0.3)' : 'none',
  });

  const slotsGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    minHeight: '200px'
  };

  const slotCardStyle = (isComparing: boolean, isEmpty: boolean): React.CSSProperties => ({
    background: isEmpty 
      ? (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(47,41,65,0.02)')
      : (isComparing 
        ? 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(22,163,74,0.08))'
        : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(47,41,65,0.04)')),
    border: isComparing 
      ? '2px solid rgba(34,197,94,0.4)' 
      : `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(47,41,65,0.08)'}`,
    borderRadius: '12px',
    padding: '16px',
    minHeight: '120px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
  });

  const slotTitleStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: '600',
    color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(47,41,65,0.7)',
    marginBottom: '8px',
    textAlign: 'center'
  };

  const slotContentStyle: React.CSSProperties = {
    fontSize: '11px',
    color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(47,41,65,0.5)',
    textAlign: 'center',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
  };

  const slotActionsStyle: React.CSSProperties = {
    position: 'absolute',
    top: '4px',
    right: '4px',
    display: 'flex',
    gap: '4px',
    opacity: 0,
    transition: 'opacity 0.2s ease'
  };

  const slotActionButtonStyle: React.CSSProperties = {
    width: '20px',
    height: '20px',
    borderRadius: '4px',
    border: 'none',
    background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(47,41,65,0.1)',
    color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(47,41,65,0.7)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    transition: 'all 0.2s ease'
  };

  const compareModeIndicatorStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(22,163,74,0.15))',
    border: '1px solid rgba(34,197,94,0.3)',
    borderRadius: '8px',
    padding: '8px 12px',
    marginBottom: '12px',
    fontSize: '12px',
    color: isDark ? 'rgba(34,197,94,0.9)' : '#16a34a',
    fontWeight: '500',
    textAlign: 'center'
  };

  return (
    <section style={containerStyle}>
      <div style={headerStyle}>
        <h3 style={titleStyle}>
          {t('workspace.slots')} ({slotsWithCompareState.filter(s => s.kind !== 'empty').length})
        </h3>
        <div style={viewModeToggleStyle}>
          <button
            style={viewModeButtonStyle(viewMode === 'grid')}
            onClick={() => onViewModeChange('grid')}
          >
            ⚡ {t('workspace.gridView')}
          </button>
          <button
            style={viewModeButtonStyle(viewMode === 'carousel')}
            onClick={() => onViewModeChange('carousel')}
          >
            🎠 {t('workspace.carouselView')}
          </button>
          <button
            style={viewModeButtonStyle(viewMode === '3d')}
            onClick={() => onViewModeChange('3d')}
          >
            🎯 {t('workspace.3dView')}
          </button>
        </div>
      </div>

      {compareMode && compareSlots.length > 0 && (
        <div style={compareModeIndicatorStyle}>
          🔍 {t('workspace.compareModeActive')} ({compareSlots.length} {t('workspace.itemsSelected')})
        </div>
      )}

      {viewMode === 'grid' && (
        <div style={slotsGridStyle}>
          {slotsWithCompareState.map((slot) => (
            <div
              key={slot.slotId}
              style={slotCardStyle(slot.isComparing, slot.kind === 'empty')}
              onClick={() => onSlotClick(slot.slotId)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = isDark 
                  ? '0 8px 32px rgba(0,0,0,0.4)' 
                  : '0 8px 32px rgba(0,0,0,0.15)';
                const actionsElement = e.currentTarget.querySelector('.slot-actions') as HTMLElement;
                if (actionsElement) actionsElement.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                const actionsElement = e.currentTarget.querySelector('.slot-actions') as HTMLElement;
                if (actionsElement) actionsElement.style.opacity = '0';
              }}
            >
              <div className="slot-actions" style={slotActionsStyle}>
                {slot.kind !== 'empty' && (
                  <>
                    <button
                      style={slotActionButtonStyle}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSlotRemove(slot.slotId);
                      }}
                      title={t('workspace.removeFromSlot')}
                    >
                      ❌
                    </button>
                    <button
                      style={slotActionButtonStyle}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSlotClear(slot.slotId);
                      }}
                      title={t('workspace.clearSlot')}
                    >
                      🗑️
                    </button>
                  </>
                )}
              </div>
              
              <div style={slotTitleStyle}>
                {slot.kind === 'empty' ? t('workspace.emptySlot') : slot.title}
              </div>
              
              {slot.kind !== 'empty' && 'text' in slot && slot.text && (
                <div style={slotContentStyle}>
                  {slot.text}
                </div>
              )}
              
              {slot.isComparing && (
                <div style={{
                  position: 'absolute',
                  top: '4px',
                  left: '4px',
                  background: 'rgba(34,197,94,0.9)',
                  color: 'white',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  fontSize: '9px',
                  fontWeight: '600'
                }}>
                  {compareSlots.indexOf(slot.slotId) + 1}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {viewMode === 'carousel' && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎠</div>
          <div style={{ 
            fontSize: '16px', 
            color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(47,41,65,0.7)' 
          }}>
            {t('workspace.carouselViewComingSoon')}
          </div>
        </div>
      )}

      {viewMode === '3d' && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
          <div style={{ 
            fontSize: '16px', 
            color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(47,41,65,0.7)' 
          }}>
            {t('workspace.3dViewComingSoon')}
          </div>
        </div>
      )}
    </section>
  );
};

export default SlotsSection;
