import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../auth/useAuth';

interface ColorTheme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    shadow: string;
    success: string;
    warning: string;
    error: string;
  };
  created: Date;
  isDefault?: boolean;
}

export function PerfectColorManager() {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ColorTheme>({
    id: 'current',
    name: 'Current Theme',
    colors: {
      primary: '#D2C2B2',
      secondary: '#C8B8A8',
      accent: '#8B7355',
      background: '#F5F5F0',
      surface: '#FFFFFF',
      text: '#2C2416',
      textSecondary: '#5A4A3A',
      border: '#E5E0D5',
      shadow: 'rgba(44, 36, 22, 0.1)',
      success: '#5A7C5A',
      warning: '#B8860B',
      error: '#B85454'
    },
    created: new Date(),
    isDefault: true
  });
  const [savedThemes, setSavedThemes] = useState<ColorTheme[]>([]);
  const [activeTab, setActiveTab] = useState<'edit' | 'presets' | 'advanced'>('edit');
  const [isApplying, setIsApplying] = useState(false);
  const styleTagRef = useRef<HTMLStyleElement | null>(null);

  // Check if user is admin
  const isAdmin = !!(user?.email === import.meta.env.VITE_ADMIN_EMAIL || user?.email?.includes('admin') || (user as any)?.role === 'admin' || (user as any)?.is_admin);

  // Perfect preset themes
  const presetThemes: ColorTheme[] = [
    {
      id: 'beige-elegant',
      name: 'Beige Elegant',
      colors: {
        primary: '#D2C2B2',
        secondary: '#C8B8A8',
        accent: '#8B7355',
        background: '#F5F5F0',
        surface: '#FFFFFF',
        text: '#2C2416',
        textSecondary: '#5A4A3A',
        border: '#E5E0D5',
        shadow: 'rgba(44, 36, 22, 0.1)',
        success: '#5A7C5A',
        warning: '#B8860B',
        error: '#B85454'
      },
      created: new Date(),
      isDefault: true
    },
    {
      id: 'modern-blue',
      name: 'Modern Blue',
      colors: {
        primary: '#3B82F6',
        secondary: '#1E40AF',
        accent: '#1D4ED8',
        background: '#F8FAFC',
        surface: '#FFFFFF',
        text: '#1E293B',
        textSecondary: '#475569',
        border: '#E2E8F0',
        shadow: 'rgba(30, 41, 59, 0.1)',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444'
      },
      created: new Date(),
      isDefault: true
    },
    {
      id: 'dark-professional',
      name: 'Dark Professional',
      colors: {
        primary: '#1F2937',
        secondary: '#374151',
        accent: '#4F46E5',
        background: '#111827',
        surface: '#1F2937',
        text: '#F9FAFB',
        textSecondary: '#D1D5DB',
        border: '#374151',
        shadow: 'rgba(0, 0, 0, 0.3)',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444'
      },
      created: new Date(),
      isDefault: true
    },
    {
      id: 'green-nature',
      name: 'Green Nature',
      colors: {
        primary: '#10B981',
        secondary: '#059669',
        accent: '#34D399',
        background: '#F0FDF4',
        surface: '#FFFFFF',
        text: '#064E3B',
        textSecondary: '#047857',
        border: '#D1FAE5',
        shadow: 'rgba(6, 78, 59, 0.1)',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444'
      },
      created: new Date(),
      isDefault: true
    }
  ];

  useEffect(() => {
    setSavedThemes(presetThemes);
  }, []);

  // Generate perfect CSS
  const generatePerfectCSS = (theme: ColorTheme) => {
    const { colors } = theme;
    
    return `
/* PERFECT COLOR THEME - ${theme.name} */
:root {
  --color-primary: ${colors.primary};
  --color-secondary: ${colors.secondary};
  --color-accent: ${colors.accent};
  --color-background: ${colors.background};
  --color-surface: ${colors.surface};
  --color-text: ${colors.text};
  --color-text-secondary: ${colors.textSecondary};
  --color-border: ${colors.border};
  --color-shadow: ${colors.shadow};
  --color-success: ${colors.success};
  --color-warning: ${colors.warning};
  --color-error: ${colors.error};
  
  /* Light theme variables */
  --bg-primary: ${colors.background};
  --bg-secondary: ${colors.surface};
  --bg-tertiary: ${colors.primary};
  --bg-hover: ${colors.primary}20;
  --bg-active: ${colors.primary}40;
  --bg-card: ${colors.surface};
  --bg-input: ${colors.surface};
  --bg-overlay: ${colors.background}CC;
  
  --text-primary: ${colors.text};
  --text-secondary: ${colors.textSecondary};
  --text-muted: ${colors.textSecondary}80;
  --text-disabled: ${colors.textSecondary}60;
  --text-button: ${colors.surface};
  
  --border-primary: ${colors.border};
  --border-secondary: ${colors.primary}30;
  --border-focus: ${colors.accent};
  
  --accent-primary: ${colors.accent};
  --accent-secondary: ${colors.primary};
  --accent-success: ${colors.success};
  --accent-warning: ${colors.warning};
  --accent-error: ${colors.error};
  --accent-info: ${colors.primary};
  
  --shadow-sm: 0 1px 3px ${colors.shadow};
  --shadow-md: 0 4px 8px ${colors.shadow};
  --shadow-lg: 0 10px 25px ${colors.shadow};
  --shadow-xl: 0 20px 40px ${colors.shadow};
}

/* Perfect application */
[data-theme="light"] {
  background-color: ${colors.background} !important;
  color: ${colors.text} !important;
}

[data-theme="light"] .container,
[data-theme="light"] .main,
[data-theme="light"] .app,
[data-theme="light"] #root,
[data-theme="light"] body {
  background-color: ${colors.background} !important;
  color: ${colors.text} !important;
}

[data-theme="light"] .card,
[data-theme="light"] .panel,
[data-theme="light"] .modal,
[data-theme="light"] .surface {
  background-color: ${colors.surface} !important;
  color: ${colors.text} !important;
  border-color: ${colors.border} !important;
  box-shadow: 0 4px 8px ${colors.shadow} !important;
}

[data-theme="light"] button,
[data-theme="light"] .btn,
[data-theme="light"] [role="button"] {
  background-color: ${colors.accent} !important;
  color: ${colors.surface} !important;
  border-color: ${colors.accent} !important;
  box-shadow: 0 2px 4px ${colors.shadow} !important;
}

[data-theme="light"] button:hover,
[data-theme="light"] .btn:hover,
[data-theme="light"] [role="button"]:hover {
  background-color: ${colors.primary} !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 8px ${colors.shadow} !important;
}

[data-theme="light"] input,
[data-theme="light"] textarea,
[data-theme="light"] select {
  background-color: ${colors.surface} !important;
  color: ${colors.text} !important;
  border-color: ${colors.border} !important;
  box-shadow: 0 1px 3px ${colors.shadow} !important;
}

[data-theme="light"] input:focus,
[data-theme="light"] textarea:focus,
[data-theme="light"] select:focus {
  border-color: ${colors.accent} !important;
  box-shadow: 0 0 0 3px ${colors.accent}40 !important;
}

[data-theme="light"] h1, [data-theme="light"] h2, [data-theme="light"] h3, 
[data-theme="light"] h4, [data-theme="light"] h5, [data-theme="light"] h6 {
  color: ${colors.text} !important;
}

[data-theme="light"] p, [data-theme="light"] span, [data-theme="light"] div {
  color: ${colors.text} !important;
}

[data-theme="light"] .success {
  color: ${colors.success} !important;
  background-color: ${colors.success}20 !important;
}

[data-theme="light"] .warning {
  color: ${colors.warning} !important;
  background-color: ${colors.warning}20 !important;
}

[data-theme="light"] .error {
  color: ${colors.error} !important;
  background-color: ${colors.error}20 !important;
}

/* Smooth transitions */
[data-theme="light"] * {
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease !important;
}
    `.trim();
  };

  // Apply perfect theme
  const applyPerfectTheme = () => {
    console.log('🎨 PERFECT COLOR MANAGER STARTED');
    console.log('🎯 Theme:', currentTheme.name);
    
    setIsApplying(true);
    
    try {
      // Method 1: Create and inject style tag
      if (!styleTagRef.current) {
        styleTagRef.current = document.createElement('style');
        styleTagRef.current.id = 'perfect-color-theme';
        styleTagRef.current.type = 'text/css';
        document.head.appendChild(styleTagRef.current);
      }
      
      // Generate and inject CSS
      const css = generatePerfectCSS(currentTheme);
      styleTagRef.current.textContent = css;
      
      console.log('✅ Perfect CSS injected');
      
      // Method 2: Direct application to key elements
      const keyElements = [
        'body', 'html', '#root', '.app', '.main', '.container'
      ];
      
      keyElements.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          const htmlElement = element as HTMLElement;
          htmlElement.style.backgroundColor = currentTheme.colors.background;
          htmlElement.style.color = currentTheme.colors.text;
          htmlElement.style.transition = 'all 0.3s ease';
        });
      });
      
      // Method 3: Apply to all cards and surfaces
      const surfaces = document.querySelectorAll('.card, .panel, .modal, .surface');
      surfaces.forEach(surface => {
        const element = surface as HTMLElement;
        element.style.backgroundColor = currentTheme.colors.surface;
        element.style.color = currentTheme.colors.text;
        element.style.borderColor = currentTheme.colors.border;
        element.style.boxShadow = `0 4px 8px ${currentTheme.colors.shadow}`;
        element.style.transition = 'all 0.3s ease';
      });
      
      // Method 4: Apply to all buttons
      const buttons = document.querySelectorAll('button, .btn, [role="button"]');
      buttons.forEach(button => {
        const element = button as HTMLElement;
        element.style.backgroundColor = currentTheme.colors.accent;
        element.style.color = currentTheme.colors.surface;
        element.style.borderColor = currentTheme.colors.accent;
        element.style.boxShadow = `0 2px 4px ${currentTheme.colors.shadow}`;
        element.style.transition = 'all 0.3s ease';
      });
      
      // Method 5: Force reflow with smooth transition
      document.body.style.opacity = '0.95';
      setTimeout(() => {
        document.body.style.opacity = '1';
      }, 100);
      
      // Method 6: Visual feedback
      const feedback = document.createElement('div');
      feedback.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, ${currentTheme.colors.accent}, ${currentTheme.colors.primary});
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        font-weight: 600;
        z-index: 999999;
        box-shadow: 0 8px 24px ${currentTheme.colors.shadow};
        animation: slideInRight 0.5s ease;
        font-size: 14px;
      `;
      feedback.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 18px;">🎨</span>
          <span>Perfect Theme Applied!</span>
        </div>
        <div style="font-size: 12px; margin-top: 4px; opacity: 0.9;">
          ${currentTheme.name}
        </div>
      `;
      document.body.appendChild(feedback);
      
      // Remove feedback after 3 seconds
      setTimeout(() => {
        if (feedback.parentNode) {
          feedback.style.animation = 'slideOutRight 0.5s ease';
          setTimeout(() => {
            if (feedback.parentNode) {
              feedback.parentNode.removeChild(feedback);
            }
          }, 500);
        }
      }, 3000);
      
      console.log('🎉 PERFECT THEME APPLIED SUCCESSFULLY');
      
      // Show success message
      alert(`🎨 Perfect Theme Applied!\n\nTheme: ${currentTheme.name}\n\nColors Applied:\n• Background: ${currentTheme.colors.background}\n• Surface: ${currentTheme.colors.surface}\n• Primary: ${currentTheme.colors.primary}\n• Accent: ${currentTheme.colors.accent}\n• Text: ${currentTheme.colors.text}\n\n✨ Smooth transitions enabled!`);
      
    } catch (error) {
      console.error('❌ PERFECT THEME FAILED:', error);
      alert(`❌ Theme application failed: ${error}`);
    } finally {
      setIsApplying(false);
    }
  };

  // Update color
  const updateColor = (key: keyof ColorTheme['colors'], color: string) => {
    setCurrentTheme({
      ...currentTheme,
      colors: {
        ...currentTheme.colors,
        [key]: color
      }
    });
  };

  // Load preset
  const loadPreset = (preset: ColorTheme) => {
    setCurrentTheme({
      ...preset,
      id: 'current',
      name: 'Current Theme'
    });
  };

  // Save theme
  const saveTheme = () => {
    const newTheme: ColorTheme = {
      id: Date.now().toString(),
      name: `Custom Theme ${savedThemes.length}`,
      colors: { ...currentTheme.colors },
      created: new Date()
    };
    setSavedThemes([...savedThemes, newTheme]);
  };

  // Reset to default
  const resetToDefault = () => {
    const defaultTheme = presetThemes[0];
    setCurrentTheme({
      ...defaultTheme,
      id: 'current',
      name: 'Current Theme'
    });
  };

  // Only show for admin users
  if (!isAdmin) {
    return null;
  }

  if (!isActive) {
    return (
      <button
        onClick={() => setIsActive(true)}
        style={{
          position: 'fixed',
          top: '270px',
          right: '20px',
          background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 50%, #6D28D9 100%)',
          border: 'none',
          color: 'white',
          padding: '14px 24px',
          borderRadius: '16px',
          cursor: 'pointer',
          fontSize: '15px',
          fontWeight: '700',
          zIndex: 100001,
          boxShadow: '0 8px 24px rgba(139, 92, 246, 0.4)',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
          e.currentTarget.style.boxShadow = '0 12px 32px rgba(139, 92, 246, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.4)';
        }}
      >
        🎨 Perfect Color Manager
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      zIndex: 100002,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        padding: '40px',
        maxWidth: '1200px',
        width: '95%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 32px 64px rgba(0, 0, 0, 0.3)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '40px',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '32px', fontWeight: '800', color: '#1F2937' }}>
              🎨 Perfect Color Manager
            </h2>
            <p style={{ margin: '8px 0 0 0', fontSize: '16px', color: '#6B7280' }}>
              Professional color management with perfect aesthetics
            </p>
          </div>
          <button
            onClick={() => setIsActive(false)}
            style={{
              background: '#EF4444',
              border: 'none',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            ✕ Close
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '32px',
          borderBottom: '2px solid #E5E7EB',
          paddingBottom: '0',
        }}>
          {[
            { id: 'edit', label: '🎨 Edit Colors', icon: '🎨' },
            { id: 'presets', label: '🎭 Presets', icon: '🎭' },
            { id: 'advanced', label: '⚙️ Advanced', icon: '⚙️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                background: activeTab === tab.id ? '#8B5CF6' : 'transparent',
                border: 'none',
                color: activeTab === tab.id ? 'white' : '#6B7280',
                padding: '16px 24px',
                borderRadius: activeTab === tab.id ? '12px 12px 0 0' : '8px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                borderBottom: activeTab === tab.id ? '3px solid #8B5CF6' : 'none',
                marginBottom: activeTab === tab.id ? '-2px' : '0',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'edit' && (
          <div>
            {/* Color Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '24px',
              marginBottom: '32px',
            }}>
              {Object.entries(currentTheme.colors).map(([key, value]) => (
                <div key={key} style={{
                  background: 'white',
                  border: '2px solid #E5E7EB',
                  borderRadius: '16px',
                  padding: '24px',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#8B5CF6';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(139, 92, 246, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                >
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '12px',
                    textTransform: 'capitalize',
                  }}>
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    background: value,
                    borderRadius: '12px',
                    margin: '0 auto 16px',
                    border: '3px solid #F3F4F6',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  }} />
                  <div style={{
                    fontSize: '12px',
                    color: '#6B7280',
                    marginBottom: '12px',
                    fontFamily: 'monospace',
                  }}>
                    {value.toUpperCase()}
                  </div>
                  <input
                    type="color"
                    value={value}
                    onChange={(e) => updateColor(key as keyof ColorTheme['colors'], e.target.value)}
                    style={{
                      width: '100%',
                      height: '40px',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '16px',
              justifyContent: 'center',
              marginBottom: '32px',
            }}>
              <button
                onClick={applyPerfectTheme}
                disabled={isApplying}
                style={{
                  background: isApplying ? '#9CA3AF' : 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                  border: 'none',
                  color: 'white',
                  padding: '16px 32px',
                  borderRadius: '16px',
                  cursor: isApplying ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: '700',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 8px 24px rgba(139, 92, 246, 0.3)',
                }}
                onMouseEnter={(e) => {
                  if (!isApplying) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(139, 92, 246, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isApplying) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.3)';
                  }
                }}
              >
                {isApplying ? '🎨 Applying...' : '🎨 Apply Perfect Theme'}
              </button>
              
              <button
                onClick={saveTheme}
                style={{
                  background: '#10B981',
                  border: 'none',
                  color: 'white',
                  padding: '16px 32px',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '700',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(16, 185, 129, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.3)';
                }}
              >
                💾 Save Theme
              </button>
              
              <button
                onClick={resetToDefault}
                style={{
                  background: '#6B7280',
                  border: 'none',
                  color: 'white',
                  padding: '16px 32px',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '700',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 8px 24px rgba(107, 114, 128, 0.3)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(107, 114, 128, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(107, 114, 128, 0.3)';
                }}
              >
                🔄 Reset to Default
              </button>
            </div>
          </div>
        )}

        {activeTab === 'presets' && (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px',
            }}>
              {savedThemes.map((theme) => (
                <div
                  key={theme.id}
                  style={{
                    background: 'white',
                    border: '2px solid #E5E7EB',
                    borderRadius: '16px',
                    padding: '24px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#8B5CF6';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 24px rgba(139, 92, 246, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#E5E7EB';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onClick={() => loadPreset(theme)}
                >
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '700', color: '#1F2937' }}>
                    {theme.name}
                  </h3>
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '16px',
                  }}>
                    {Object.values(theme.colors).slice(0, 6).map((color, index) => (
                      <div
                        key={index}
                        style={{
                          flex: 1,
                          height: '40px',
                          background: color,
                          borderRadius: '8px',
                          border: '2px solid #F3F4F6',
                        }}
                      />
                    ))}
                  </div>
                  <button
                    style={{
                      background: '#8B5CF6',
                      border: 'none',
                      color: 'white',
                      padding: '12px 24px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      width: '100%',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    Load Theme
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'advanced' && (
          <div>
            <div style={{
              background: '#F9FAFB',
              padding: '32px',
              borderRadius: '16px',
              border: '2px solid #E5E7EB',
            }}>
              <h3 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: '700', color: '#1F2937' }}>
                ⚙️ Advanced Settings
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '24px',
              }}>
                <div>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#374151' }}>
                    🎨 Current Theme Info
                  </h4>
                  <div style={{ fontSize: '14px', color: '#6B7280', lineHeight: '1.6' }}>
                    <div><strong>Name:</strong> {currentTheme.name}</div>
                    <div><strong>ID:</strong> {currentTheme.id}</div>
                    <div><strong>Created:</strong> {currentTheme.created.toLocaleDateString()}</div>
                    <div><strong>Colors:</strong> {Object.keys(currentTheme.colors).length}</div>
                  </div>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#374151' }}>
                    🚀 Application Methods
                  </h4>
                  <div style={{ fontSize: '14px', color: '#6B7280', lineHeight: '1.6' }}>
                    <div>✅ CSS Injection</div>
                    <div>✅ DOM Manipulation</div>
                    <div>✅ Smooth Transitions</div>
                    <div>✅ Visual Feedback</div>
                    <div>✅ Responsive Design</div>
                    <div>✅ Cross-browser Support</div>
                  </div>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#374151' }}>
                    🎯 Features
                  </h4>
                  <div style={{ fontSize: '14px', color: '#6B7280', lineHeight: '1.6' }}>
                    <div>🎨 12 Color Variables</div>
                    <div>🎭 4 Preset Themes</div>
                    <div>💾 Custom Themes</div>
                    <div>⚡ Instant Apply</div>
                    <div>🔄 Reset Function</div>
                    <div>📱 Mobile Friendly</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
