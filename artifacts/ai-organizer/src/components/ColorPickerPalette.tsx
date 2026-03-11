import React, { useState, useEffect, useRef } from 'react';

interface ColorElement {
  id: string;
  element: HTMLElement;
  originalColor: string;
  property: string;
  category: string;
}

interface ColorPreset {
  name: string;
  colors: Record<string, string>;
}

export function ColorPickerPalette() {
  const [isActive, setIsActive] = useState(false);
  const [selectedElement, setSelectedElement] = useState<ColorElement | null>(null);
  const [currentColor, setCurrentColor] = useState('#ffffff');
  const [colorHistory, setColorHistory] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isSelecting, setIsSelecting] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  
  // Color presets
  const colorPresets: ColorPreset[] = [
    {
      name: 'Professional Blue',
      colors: {
        '--bg-primary': '#1e3a8a',
        '--bg-secondary': '#1e40af',
        '--text-primary': '#f0f9ff',
        '--accent-primary': '#3b82f6'
      }
    },
    {
      name: 'Dark Mode',
      colors: {
        '--bg-primary': '#0f172a',
        '--bg-secondary': '#1e293b',
        '--text-primary': '#f1f5f9',
        '--accent-primary': '#6366f1'
      }
    },
    {
      name: 'Light Mode',
      colors: {
        '--bg-primary': '#f8fafc',
        '--bg-secondary': '#f1f5f9',
        '--text-primary': '#0f172a',
        '--accent-primary': '#3b82f6'
      }
    },
    {
      name: 'Warm Beige',
      colors: {
        '--bg-primary': '#f5f5dc',
        '--bg-secondary': '#e8e4d9',
        '--text-primary': '#2c2416',
        '--accent-primary': '#d97706'
      }
    }
  ];

  // Common color palette
  const commonColors = [
    '#ffffff', '#f8f9fa', '#e9ecef', '#dee2e6', '#ced4da', '#adb5bd',
    '#6c757d', '#495057', '#343a40', '#212529', '#000000',
    '#dc3545', '#fd7e14', '#ffc107', '#28a745', '#20c997', '#17a2b8',
    '#007bff', '#6610f2', '#e83e8c', '#6f42c1', '#20c997', '#fd7e14'
  ];

  useEffect(() => {
    if (isSelecting) {
      const handleClick = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        const target = e.target as HTMLElement;
        if (target && target !== overlayRef.current) {
          selectElement(target);
          setIsSelecting(false);
        }
      };

      const handleMouseOver = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target && target !== overlayRef.current) {
          highlightElement(target);
        }
      };

      const handleMouseOut = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target && target !== overlayRef.current) {
          unhighlightElement(target);
        }
      };

      document.addEventListener('click', handleClick, true);
      document.addEventListener('mouseover', handleMouseOver, true);
      document.addEventListener('mouseout', handleMouseOut, true);

      return () => {
        document.removeEventListener('click', handleClick, true);
        document.removeEventListener('mouseover', handleMouseOver, true);
        document.removeEventListener('mouseout', handleMouseOut, true);
      };
    }
  }, [isSelecting]);

  const selectElement = (element: HTMLElement) => {
    const computedStyle = window.getComputedStyle(element);
    const properties = ['background-color', 'color', 'border-color', 'background'];
    
    let selectedProperty = '';
    let selectedColor = '';
    
    // Find the most prominent color property
    for (const prop of properties) {
      const value = computedStyle.getPropertyValue(prop);
      if (value && value !== 'rgba(0, 0, 0, 0)' && value !== 'transparent') {
        selectedProperty = prop;
        selectedColor = value;
        break;
      }
    }

    if (selectedColor) {
      const rgbToHex = (rgb: string) => {
        const result = rgb.match(/\d+/g);
        if (!result) return rgb;
        return '#' + result.slice(0, 3).map(x => {
          const hex = parseInt(x).toString(16);
          return hex.length === 1 ? '0' + hex : hex;
        }).join('');
      };

      const hexColor = rgbToHex(selectedColor);
      setCurrentColor(hexColor);
      
      setSelectedElement({
        id: element.id || `element-${Date.now()}`,
        element,
        originalColor: hexColor,
        property: selectedProperty,
        category: getElementCategory(element)
      });
    }
  };

  const getElementCategory = (element: HTMLElement): string => {
    const tagName = element.tagName.toLowerCase();
    const className = element.className.toLowerCase();
    
    if (tagName === 'button') return 'buttons';
    if (tagName === 'input') return 'inputs';
    if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3') return 'headings';
    if (tagName === 'p' || tagName === 'span') return 'text';
    if (className.includes('card')) return 'cards';
    if (className.includes('header')) return 'headers';
    if (className.includes('footer')) return 'footers';
    if (className.includes('sidebar')) return 'sidebars';
    if (className.includes('nav')) return 'navigation';
    
    return 'other';
  };

  const highlightElement = (element: HTMLElement) => {
    element.style.outline = '2px solid #3b82f6';
    element.style.outlineOffset = '2px';
    element.style.cursor = 'crosshair';
  };

  const unhighlightElement = (element: HTMLElement) => {
    element.style.outline = '';
    element.style.outlineOffset = '';
    element.style.cursor = '';
  };

  const applyColor = (color: string) => {
    if (!selectedElement) return;

    const { element, property } = selectedElement;
    
    // Apply color to the selected element
    if (property.includes('background')) {
      element.style.backgroundColor = color;
    } else if (property.includes('color')) {
      element.style.color = color;
    } else if (property.includes('border')) {
      element.style.borderColor = color;
    }

    // Add to color history
    if (!colorHistory.includes(color)) {
      setColorHistory(prev => [color, ...prev.slice(0, 19)]);
    }

    // Apply to similar elements
    applyToSimilarElements(element, property, color);
  };

  const applyToSimilarElements = (sourceElement: HTMLElement, property: string, color: string) => {
    const category = getElementCategory(sourceElement);
    const allElements = document.querySelectorAll('*');
    
    allElements.forEach(element => {
      const htmlElement = element as HTMLElement;
      if (getElementCategory(htmlElement) === category && htmlElement !== sourceElement) {
        if (property.includes('background')) {
          htmlElement.style.backgroundColor = color;
        } else if (property.includes('color')) {
          htmlElement.style.color = color;
        } else if (property.includes('border')) {
          htmlElement.style.borderColor = color;
        }
      }
    });
  };

  const applyPreset = (preset: ColorPreset) => {
    const root = document.documentElement;
    Object.entries(preset.colors).forEach(([property, color]) => {
      root.style.setProperty(property, color);
    });
  };

  const resetColors = () => {
    location.reload();
  };

  if (!isActive) {
    return (
      <button
        onClick={() => setIsActive(true)}
        style={{
          position: 'fixed',
          top: '170px',
          right: '20px',
          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          border: 'none',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '12px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600',
          zIndex: 100001,
          boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(139, 92, 246, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
        }}
      >
        🎨 Color Palette
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
      <div ref={overlayRef} style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '800px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>
            🎨 Advanced Color Picker
          </h2>
          <button
            onClick={() => setIsActive(false)}
            style={{
              background: '#ef4444',
              border: 'none',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            ✕ Close
          </button>
        </div>

        {/* Selection Mode */}
        <div style={{
          background: '#f3f4f6',
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '20px',
        }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#374151' }}>
            Select Element Mode
          </h3>
          <button
            onClick={() => setIsSelecting(!isSelecting)}
            style={{
              background: isSelecting ? '#10b981' : '#3b82f6',
              border: 'none',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              marginRight: '12px',
            }}
          >
            {isSelecting ? '🎯 Click any element to select' : '🖱️ Start Selecting Elements'}
          </button>
          {selectedElement && (
            <div style={{
              display: 'inline-block',
              padding: '8px 16px',
              background: '#e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#374151',
            }}>
              Selected: {selectedElement.category} - {selectedElement.property}
            </div>
          )}
        </div>

        {/* Color Picker */}
        {selectedElement && (
          <div style={{
            background: '#f9fafb',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '20px',
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#374151' }}>
              Color Selection
            </h3>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '16px',
            }}>
              <input
                type="color"
                value={currentColor}
                onChange={(e) => setCurrentColor(e.target.value)}
                style={{
                  width: '60px',
                  height: '60px',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              />
              <div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                  Current Color
                </div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                  {currentColor.toUpperCase()}
                </div>
              </div>
              <button
                onClick={() => applyColor(currentColor)}
                style={{
                  background: '#10b981',
                  border: 'none',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                }}
              >
                ✨ Apply Color
              </button>
            </div>
          </div>
        )}

        {/* Common Colors */}
        <div style={{
          background: '#f9fafb',
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '20px',
        }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#374151' }}>
            Quick Colors
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))',
            gap: '8px',
          }}>
            {commonColors.map((color) => (
              <button
                key={color}
                onClick={() => setCurrentColor(color)}
                style={{
                  width: '40px',
                  height: '40px',
                  border: currentColor === color ? '3px solid #3b82f6' : '2px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: color,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              />
            ))}
          </div>
        </div>

        {/* Color Presets */}
        <div style={{
          background: '#f9fafb',
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '20px',
        }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#374151' }}>
            Color Presets
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
          }}>
            {colorPresets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset)}
                style={{
                  background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  padding: '12px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Color History */}
        {colorHistory.length > 0 && (
          <div style={{
            background: '#f9fafb',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '20px',
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#374151' }}>
              Recent Colors
            </h3>
            <div style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
            }}>
              {colorHistory.map((color) => (
                <button
                  key={color}
                  onClick={() => setCurrentColor(color)}
                  style={{
                    width: '32px',
                    height: '32px',
                    border: currentColor === color ? '2px solid #3b82f6' : '2px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    backgroundColor: color,
                    transition: 'all 0.2s ease',
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={resetColors}
            style={{
              background: '#ef4444',
              border: 'none',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            🔄 Reset All Colors
          </button>
        </div>
      </div>
    </div>
  );
}
