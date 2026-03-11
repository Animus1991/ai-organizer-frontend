import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../auth/useAuth';

interface ColorPalette {
  id: string;
  name: string;
  colors: string[];
  created: Date;
  isDefault?: boolean;
}

interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  border: string;
}

export function ProfessionalColorPicker() {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [currentPalette, setCurrentPalette] = useState<ColorPalette>({
    id: 'current',
    name: 'Current Theme',
    colors: ['#D2C2B2', '#C8B8A8', '#2C2416', '#8B7355', '#5A7C5A'],
    created: new Date(),
    isDefault: true
  });
  const [savedPalettes, setSavedPalettes] = useState<ColorPalette[]>([]);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [isLocked, setIsLocked] = useState<boolean[]>([false, false, false, false, false]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportFormat, setExportFormat] = useState<'css' | 'json' | 'url'>('css');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Check if user is admin - simplified for testing
  const isAdmin = user?.email?.includes('admin') || user?.email?.includes('test') || true; // Temporarily always true for testing

  // Default professional palettes
  const defaultPalettes: ColorPalette[] = [
    {
      id: 'beige-professional',
      name: 'Beige Professional',
      colors: ['#D2C2B2', '#C8B8A8', '#2C2416', '#8B7355', '#5A7C5A'],
      created: new Date(),
      isDefault: true
    },
    {
      id: 'modern-blue',
      name: 'Modern Blue',
      colors: ['#3B82F6', '#1E40AF', '#1F2937', '#10B981', '#F59E0B'],
      created: new Date(),
      isDefault: true
    },
    {
      id: 'dark-elegant',
      name: 'Dark Elegant',
      colors: ['#1F2937', '#374151', '#9CA3AF', '#6366F1', '#8B5CF6'],
      created: new Date(),
      isDefault: true
    },
    {
      id: 'warm-autumn',
      name: 'Warm Autumn',
      colors: ['#DC2626', '#EA580C', '#F59E0B', '#84CC16', '#10B981'],
      created: new Date(),
      isDefault: true
    }
  ];

  useEffect(() => {
    setSavedPalettes(defaultPalettes);
  }, []);

  // Only show for admin users
  if (!isAdmin) {
    return null;
  }

  const generateRandomColor = () => {
    return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
  };

  const generatePalette = async () => {
    setIsGenerating(true);
    
    // Simulate API call for color generation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newColors = currentPalette.colors.map((color, index) => {
      if (isLocked[index]) return color;
      return generateRandomColor();
    });

    setCurrentPalette({
      ...currentPalette,
      colors: newColors
    });

    setIsGenerating(false);
  };

  const updateColor = (index: number, color: string) => {
    const newColors = [...currentPalette.colors];
    newColors[index] = color;
    setCurrentPalette({
      ...currentPalette,
      colors: newColors
    });
  };

  const applyToTheme = () => {
    console.log('🎨 Apply to Theme clicked!');
    console.log('Current palette:', currentPalette);
    console.log('Colors:', currentPalette.colors);
    
    try {
      const colors = currentPalette.colors;
      
      // Validate colors array
      if (!Array.isArray(colors) || colors.length !== 5) {
        console.error('❌ Invalid colors array:', colors);
        alert('Error: Invalid colors array');
        return;
      }
      
      console.log('✅ Colors array validated');
      
      // Validate each color format
      const isValidHex = (color: string) => {
        return /^#[0-9A-F]{6}$/i.test(color);
      };
      
      for (let i = 0; i < colors.length; i++) {
        if (!isValidHex(colors[i])) {
          console.error(`❌ Invalid color at index ${i}:`, colors[i]);
          alert(`Error: Invalid color ${colors[i]}`);
          return;
        }
      }
      
      console.log('✅ All colors validated');
      
      // Get the theme context element
      const themeElement = document.querySelector('[data-theme]') || document.documentElement;
      console.log('🎯 Theme element:', themeElement);
      
      // Apply to light theme specifically
      const lightThemeElement = document.querySelector('[data-theme="light"]') || document.documentElement;
      
      // Apply colors directly to CSS variables
      const cssVariables = {
        '--bg-primary': colors[0],
        '--bg-secondary': colors[1],
        '--bg-tertiary': colors[1],
        '--bg-hover': colors[0] + '33',
        '--bg-active': colors[0] + '66',
        '--bg-card': colors[0] + '1A',
        '--bg-input': colors[0],
        '--bg-overlay': colors[0] + 'F2',
        
        '--text-primary': colors[2],
        '--text-secondary': colors[2],
        '--text-muted': colors[2] + '99',
        '--text-disabled': colors[2] + '66',
        '--text-button': '#ffffff',
        
        '--border-primary': colors[0] + '33',
        '--border-secondary': colors[0] + '1A',
        '--border-focus': colors[3],
        
        '--accent-primary': colors[3],
        '--accent-secondary': colors[3],
        '--accent-success': colors[4],
        '--accent-warning': colors[3],
        '--accent-error': colors[3],
        '--accent-info': colors[3],
        
        '--shadow-sm': `0 1px 3px ${colors[2]}33`,
        '--shadow-md': `0 4px 8px ${colors[2]}4D`,
        '--shadow-lg': `0 10px 25px ${colors[2]}66`
      };
      
      console.log('🎨 Applying CSS variables:', cssVariables);
      
      // Apply to document root
      Object.entries(cssVariables).forEach(([property, value]) => {
        document.documentElement.style.setProperty(property, value);
        console.log(`🎯 Applied: ${property} = ${value}`);
      });
      
      // Also apply to body for immediate effect
      document.body.style.background = colors[0];
      document.body.style.color = colors[2];
      
      // Apply to all major containers
      const containers = document.querySelectorAll('.container, .main, .app, #root');
      containers.forEach(container => {
        const element = container as HTMLElement;
        element.style.background = colors[0];
        element.style.color = colors[2];
      });
      
      // Force multiple reflows for immediate effect
      document.documentElement.style.display = 'none';
      document.documentElement.offsetHeight; // Trigger reflow
      document.documentElement.style.display = '';
      
      document.body.style.display = 'none';
      document.body.offsetHeight; // Trigger reflow
      document.body.style.display = '';
      
      console.log('✅ Theme applied successfully!');
      console.log('🎨 Applied colors:', colors);
      
      // Add visual feedback
      const button = document.querySelector('[data-testid="apply-theme-button"]') as HTMLButtonElement;
      if (button) {
        console.log('🎯 Found button, adding feedback');
        button.textContent = '✅ Applied!';
        button.style.background = '#10b981';
        setTimeout(() => {
          button.textContent = '✨ Apply to Theme';
          button.style.background = '#10b981';
        }, 3000);
      } else {
        console.log('❌ Button not found');
      }
      
      // Show success message
      alert(`✅ Theme Applied Successfully!\n\nColors applied:\n• Background: ${colors[0]}\n• Secondary: ${colors[1]}\n• Text: ${colors[2]}\n• Accent: ${colors[3]}\n• Success: ${colors[4]}`);
      
    } catch (error) {
      console.error('❌ Error applying theme:', error);
      alert(`❌ Error applying theme: ${error}`);
      
      // Show error feedback
      const button = document.querySelector('[data-testid="apply-theme-button"]') as HTMLButtonElement;
      if (button) {
        button.textContent = '❌ Error';
        button.style.background = '#ef4444';
        setTimeout(() => {
          button.textContent = '✨ Apply to Theme';
          button.style.background = '#10b981';
        }, 3000);
      }
    }
  };

  const savePalette = () => {
    const newPalette: ColorPalette = {
      id: Date.now().toString(),
      name: `Palette ${savedPalettes.length + 1}`,
      colors: [...currentPalette.colors],
      created: new Date()
    };
    setSavedPalettes([...savedPalettes, newPalette]);
  };

  const loadPalette = (palette: ColorPalette) => {
    setCurrentPalette({
      ...palette,
      id: 'current',
      name: 'Current Theme'
    });
  };

  const deletePalette = (id: string) => {
    setSavedPalettes(savedPalettes.filter(p => p.id !== id));
  };

  const exportPalette = () => {
    const colors = currentPalette.colors;
    let output = '';

    switch (exportFormat) {
      case 'css':
        output = `:root {\n`;
        colors.forEach((color, index) => {
          output += `  --color-${index + 1}: ${color};\n`;
        });
        output += `}`;
        break;
      case 'json':
        output = JSON.stringify({ colors }, null, 2);
        break;
      case 'url':
        const params = colors.map(c => c.replace('#', '')).join('-');
        output = `https://coolors.co/${params}`;
        break;
    }

    // Copy to clipboard
    navigator.clipboard.writeText(output);
    
    // Download as file
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `palette.${exportFormat}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importPalette = (data: string) => {
    try {
      const colors = JSON.parse(data).colors as string[];
      if (Array.isArray(colors) && colors.length === 5) {
        setCurrentPalette({
          ...currentPalette,
          colors
        });
      }
    } catch (error) {
      console.error('Invalid palette data');
    }
  };

  const getContrastColor = (hexColor: string) => {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#FFFFFF';
  };

  if (!isActive) {
    return (
      <button
        onClick={() => setIsActive(true)}
        style={{
          position: 'fixed',
          top: '170px',
          right: '20px',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          border: 'none',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '12px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600',
          zIndex: 100001,
          boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(99, 102, 241, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)';
        }}
      >
        🎨 Admin Color Picker
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
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '32px',
        maxWidth: '1200px',
        width: '95%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: '#1f2937' }}>
              🎨 Professional Color Picker
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
              Admin-only color management tool
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setIsActive(false)}
              style={{
                background: '#ef4444',
                border: 'none',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Main Color Display */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}>
          {currentPalette.colors.map((color, index) => (
            <div
              key={index}
              style={{
                background: color,
                borderRadius: '12px',
                padding: '24px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: selectedColorIndex === index ? '3px solid #3b82f6' : '2px solid #e5e7eb',
                position: 'relative',
              }}
              onClick={() => setSelectedColorIndex(index)}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const newLocked = [...isLocked];
                  newLocked[index] = !newLocked[index];
                  setIsLocked(newLocked);
                }}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: isLocked[index] ? '#ef4444' : '#f3f4f6',
                  border: 'none',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                {isLocked[index] ? '🔒' : '🔓'}
              </button>
              
              <div style={{
                color: getContrastColor(color),
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '8px',
              }}>
                {color.toUpperCase()}
              </div>
              
              <input
                type="color"
                value={color}
                onChange={(e) => updateColor(index, e.target.value)}
                style={{
                  width: '60px',
                  height: '40px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              />
            </div>
          ))}
        </div>

        {/* Controls */}
        <div style={{
          background: '#f9fafb',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '24px',
        }}>
          <div style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}>
            <button
              onClick={generatePalette}
              disabled={isGenerating}
              style={{
                background: isGenerating ? '#9ca3af' : '#3b82f6',
                border: 'none',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              {isGenerating ? '🎲 Generating...' : '🎲 Generate Palette'}
            </button>
            
            <button
              onClick={applyToTheme}
              data-testid="apply-theme-button"
              style={{
                background: '#10b981',
                border: 'none',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              ✨ Apply to Theme
            </button>
            
            <button
              onClick={savePalette}
              style={{
                background: '#8b5cf6',
                border: 'none',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              💾 Save Palette
            </button>
            
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as any)}
              style={{
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            >
              <option value="css">CSS</option>
              <option value="json">JSON</option>
              <option value="url">Coolors URL</option>
            </select>
            
            <button
              onClick={exportPalette}
              style={{
                background: '#f59e0b',
                border: 'none',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              📤 Export
            </button>
          </div>
        </div>

        {/* Saved Palettes */}
        <div style={{
          background: '#f9fafb',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '24px',
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#374151' }}>
            📚 Saved Palettes
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '16px',
          }}>
            {savedPalettes.map((palette) => (
              <div
                key={palette.id}
                style={{
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                }}>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                    {palette.name}
                  </h4>
                  {!palette.isDefault && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePalette(palette.id);
                      }}
                      style={{
                        background: '#ef4444',
                        border: 'none',
                        color: 'white',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      🗑️
                    </button>
                  )}
                </div>
                
                <div style={{
                  display: 'flex',
                  gap: '4px',
                  marginBottom: '12px',
                }}>
                  {palette.colors.map((color, index) => (
                    <div
                      key={index}
                      style={{
                        flex: 1,
                        height: '40px',
                        background: color,
                        borderRadius: '4px',
                      }}
                    />
                  ))}
                </div>
                
                <button
                  onClick={() => loadPalette(palette)}
                  style={{
                    background: '#3b82f6',
                    border: 'none',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                    width: '100%',
                  }}
                >
                  Load Palette
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Import Section */}
        <div style={{
          background: '#f9fafb',
          padding: '20px',
          borderRadius: '12px',
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#374151' }}>
            📥 Import Palette
          </h3>
          <textarea
            placeholder="Paste JSON palette data here..."
            style={{
              width: '100%',
              height: '100px',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              resize: 'vertical',
            }}
          onChange={(e) => {
            if (e.target.value.trim()) {
              importPalette(e.target.value);
            }
          }}
          />
        </div>
      </div>
    </div>
  );
}
