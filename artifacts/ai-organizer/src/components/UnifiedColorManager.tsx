import { useState, useEffect } from 'react';
import { useAuth } from '../auth/useAuth';
import { useTheme } from '../context/ThemeContext';

interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
}

interface ColorTheme {
  id: string;
  name: string;
  colors: ColorPalette;
  created: Date;
  isDefault?: boolean;
}

type UnifiedColorManagerProps = {
  forceActive?: boolean;
  hideLauncher?: boolean;
  onRequestClose?: () => void;
};

const presetThemes: ColorTheme[] = [
  {
    id: 'balanced-beige',
    name: 'Balanced Beige',
    colors: {
      primary: '#9B8B7A',
      secondary: '#B8A898',
      accent: '#D2C4B5',
      background: '#F8F6F3',
      surface: '#FFFFFF',
      text: '#3A3328',
      textSecondary: '#6B5D4D',
      border: '#D6D2CA',
      success: '#7A9A7A',
      warning: '#C4A57B',
      error: '#C47A7A'
    },
    created: new Date(),
    isDefault: true
  },
  {
    id: 'balanced-blue',
    name: 'Balanced Blue',
    colors: {
      primary: '#5B8FDB',
      secondary: '#7BA7E7',
      accent: '#13C2C2',
      background: '#F0F2F5',
      surface: '#FFFFFF',
      text: '#262626',
      textSecondary: '#8C8C8C',
      border: '#D9D9D9',
      success: '#52C41A',
      warning: '#FAAD14',
      error: '#FF4D4F'
    },
    created: new Date(),
    isDefault: true
  }
];

export function UnifiedColorManager(props: UnifiedColorManagerProps = {}) {
  const { user } = useAuth();
  const { mode: themeMode } = useTheme();
  
  // 1. All hooks at the very top (never skipped)
  const [isActive, setIsActive] = useState(false);
  const [activeTab, setActiveTab] = useState<'presets' | 'customize'>('presets');
  const [isApplying, setIsApplying] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ColorTheme>(presetThemes[0]);

  useEffect(() => {
    if (props.forceActive) {
      setIsActive(true);
    }
  }, [props.forceActive]);

  // 2. Logic & Constants
  const isAdmin = !!(user?.email === import.meta.env.VITE_ADMIN_EMAIL || user?.email?.includes('admin') || (user as any)?.role === 'admin' || (user as any)?.is_admin);
  const effectiveActive = props.forceActive ?? isActive;

  const getContrastColor = (hexColor: string) => {
    const color = hexColor.replace('#', '');
    if (color.length !== 6) return '#000000';
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  };

  const applyOptimizedTheme = () => {
    if (themeMode === "dashboard") return; // Don't override dashboard theme
    setIsApplying(true);
    try {
      const existingStyles = document.querySelectorAll('style[data-unified-theme]');
      existingStyles.forEach(style => style.remove());
      
      const { colors } = currentTheme;
      const primaryContrast = getContrastColor(colors.primary);
      const css = `:root {
        --color-primary: ${colors.primary};
        --color-secondary: ${colors.secondary};
        --color-background: ${colors.background};
        --color-surface: ${colors.surface};
        --color-text: ${colors.text};
        --color-text-secondary: ${colors.textSecondary};
        --text-on-primary: ${primaryContrast};
      }
      [data-theme="light"] { background-color: ${colors.background} !important; color: ${colors.text} !important; }
      * { transition: background-color 0.3s ease, color 0.3s ease !important; }`;

      const styleElement = document.createElement('style');
      styleElement.setAttribute('data-unified-theme', 'true');
      styleElement.textContent = css;
      document.head.appendChild(styleElement);
      document.documentElement.setAttribute('data-theme', 'light');
    } catch (error) {
      console.error('❌ FAILED:', error);
    } finally {
      setIsApplying(false);
    }
  };

  const loadPreset = (theme: ColorTheme) => {
    setCurrentTheme(theme);
    setTimeout(applyOptimizedTheme, 100);
  };

  // 3. Conditional returns only AFTER all hooks
  if (!effectiveActive) {
    if (props.hideLauncher || !isAdmin) return null;
    return (
      <button
        onClick={() => setIsActive(true)}
        style={{
          position: 'fixed', bottom: '190px', right: '20px',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #7c3aed 100%)',
          border: 'none', color: 'white', padding: '12px', borderRadius: '12px',
          cursor: 'pointer', zIndex: 100001, width: '48px', height: '48px',
          boxShadow: '0 6px 20px rgba(99, 102, 241, 0.3)',
        }}
      >
        🎨
      </button>
    );
  }

  if (!isAdmin) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.8)', zIndex: 100002, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
      <div style={{ background: 'white', borderRadius: '24px', padding: '40px', maxWidth: '1200px', width: '95%', maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
          <h2 style={{ color: '#1f2937' }}>🎨 Unified Color Manager</h2>
          <button 
            onClick={() => props.forceActive !== undefined ? props.onRequestClose?.() : setIsActive(false)} 
            style={{ background: '#EF4444', color: 'white', padding: '12px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer' }}
          >
            ✕ Close
          </button>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
          {['presets', 'customize'].map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab as any)} 
              style={{ background: activeTab === tab ? '#6366f1' : 'transparent', color: activeTab === tab ? 'white' : '#6B7280', padding: '16px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>
        {activeTab === 'presets' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {presetThemes.map(theme => (
              <div key={theme.id} onClick={() => loadPreset(theme)} style={{ background: 'white', border: '2px solid #E5E7EB', borderRadius: '16px', padding: '24px', cursor: 'pointer' }}>
                <h3 style={{color: '#1f2937'}}>{theme.name}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', margin: '16px 0' }}>
                  {Object.values(theme.colors).slice(0, 6).map((c, i) => <div key={i} style={{ height: '40px', background: c as string, borderRadius: '8px', border: '1px solid #eee' }} />)}
                </div>
                <button style={{ width: '100%', background: '#6366f1', color: 'white', padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Apply</button>
              </div>
            ))}
          </div>
        )}
        {activeTab === 'customize' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '32px' }}>
              {Object.entries(currentTheme.colors).map(([k, v]) => (
                <div key={k} style={{ padding: '24px', border: '2px solid #E5E7EB', borderRadius: '16px' }}>
                  <label style={{display: 'block', marginBottom: '8px', color: '#374151', fontSize: '14px', fontWeight: 'bold'}}>{k}</label>
                  <input 
                    type="color" 
                    value={v as string} 
                    onChange={e => setCurrentTheme({...currentTheme, colors: {...currentTheme.colors, [k]: e.target.value}})} 
                    style={{ width: '100%', height: '40px', cursor: 'pointer', border: 'none', borderRadius: '4px' }} 
                  />
                </div>
              ))}
            </div>
            <button 
              onClick={applyOptimizedTheme} 
              disabled={isApplying}
              style={{ background: isApplying ? '#9ca3af' : '#10B981', color: 'white', padding: '16px 32px', borderRadius: '16px', border: 'none', cursor: isApplying ? 'default' : 'pointer', fontWeight: 'bold' }}
            >
              {isApplying ? 'Applying...' : 'Apply Custom Theme'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
