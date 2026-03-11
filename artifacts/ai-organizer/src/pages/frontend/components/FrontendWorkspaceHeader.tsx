import React from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';

interface FrontendWorkspaceHeaderProps {
  title: string;
  subtitle?: string;
  stats?: {
    uploads?: number;
    segments?: number;
    slots?: number;
  };
  actions?: React.ReactNode;
}

export const FrontendWorkspaceHeader: React.FC<FrontendWorkspaceHeaderProps> = ({
  title,
  subtitle,
  stats,
  actions
}) => {
  const { isDark } = useTheme();
  const { t } = useLanguage();

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    padding: '20px 24px',
    background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(47,41,65,0.03)',
    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(47,41,65,0.08)',
    borderRadius: '16px',
    backdropFilter: 'blur(20px)'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: '700',
    color: isDark ? 'rgba(255,255,255,0.9)' : '#2f2941',
    margin: 0
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '14px',
    color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(47,41,65,0.6)',
    margin: '4px 0 0 0'
  };

  const statsContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '16px'
  };

  const statItemStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  };

  const statValueStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: '700',
    color: isDark ? 'rgba(99,102,241,0.9)' : '#6366f1'
  };

  const statLabelStyle: React.CSSProperties = {
    fontSize: '11px',
    color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(47,41,65,0.5)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginTop: '2px'
  };

  return (
    <header style={headerStyle}>
      <div>
        <h1 style={titleStyle}>{title}</h1>
        {subtitle && <p style={subtitleStyle}>{subtitle}</p>}
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        {stats && (
          <div style={statsContainerStyle}>
            {stats.uploads !== undefined && (
              <div style={statItemStyle}>
                <div style={statValueStyle}>{stats.uploads}</div>
                <div style={statLabelStyle}>{t('workspace.documents')}</div>
              </div>
            )}
            {stats.segments !== undefined && (
              <div style={statItemStyle}>
                <div style={statValueStyle}>{stats.segments}</div>
                <div style={statLabelStyle}>{t('workspace.segments')}</div>
              </div>
            )}
            {stats.slots !== undefined && (
              <div style={statItemStyle}>
                <div style={statValueStyle}>{stats.slots}</div>
                <div style={statLabelStyle}>{t('workspace.slots')}</div>
              </div>
            )}
          </div>
        )}
        
        {actions && (
          <div style={{ display: 'flex', gap: '8px' }}>
            {actions}
          </div>
        )}
      </div>
    </header>
  );
};

export default FrontendWorkspaceHeader;
