// Design Token System for Consistent UI/UX
export const tokens = {
  // Spacing System (8px base unit)
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
    xxxl: '64px'
  },

  // Color System
  colors: {
    // Primary colors
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      900: '#1e3a8a'
    },
    secondary: {
      50: '#f5f3ff',
      100: '#ede9fe',
      500: '#8b5cf6',
      600: '#7c3aed',
      700: '#6d28d9',
      900: '#4c1d95'
    },
    success: {
      50: '#ecfdf5',
      100: '#d1fae5',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
      900: '#064e3b'
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      900: '#78350f'
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      900: '#7f1d1d'
    },
    // Neutral colors
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827'
    }
  },

  // Typography System
  typography: {
    fontFamily: {
      sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
      mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace']
    },
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
      '4xl': '36px'
    },
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800'
    },
    lineHeight: {
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2'
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em'
    }
  },

  // Border Radius
  borderRadius: {
    none: '0',
    sm: '4px',
    base: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '25px', // Updated to 25px for market best practice
    full: '9999px'
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
  },

  // Transitions
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '500ms cubic-bezier(0.4, 0, 0.2, 1)'
  },

  // Z-index scale
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    modal: 1200,
    popover: 1300,
    tooltip: 1400,
    toast: 1500,
    loading: 2000
  }
};

// CSS Custom Properties Generator
export const generateCSSVariables = () => {
  const cssVars: Record<string, string> = {};
  
  // Generate spacing variables
  Object.entries(tokens.spacing).forEach(([key, value]) => {
    cssVars[`--spacing-${key}`] = value;
  });
  
  // Generate color variables
  Object.entries(tokens.colors).forEach(([colorName, colorValues]) => {
    Object.entries(colorValues).forEach(([shade, value]) => {
      cssVars[`--color-${colorName}-${shade}`] = value;
    });
  });
  
  // Generate typography variables
  Object.entries(tokens.typography.fontSize).forEach(([key, value]) => {
    cssVars[`--font-size-${key}`] = value;
  });
  
  Object.entries(tokens.typography.fontWeight).forEach(([key, value]) => {
    cssVars[`--font-weight-${key}`] = value;
  });
  
  // Generate other tokens
  Object.entries(tokens.borderRadius).forEach(([key, value]) => {
    cssVars[`--border-radius-${key}`] = value;
  });
  
  Object.entries(tokens.shadows).forEach(([key, value]) => {
    cssVars[`--shadow-${key}`] = value;
  });
  
  return cssVars;
};

// Theme-specific configurations
export const lightTheme = {
  ...tokens,
  background: {
    primary: '#ffffff',
    secondary: '#f8fafc', // 20% lighter than original #f9fafb
    tertiary: '#f1f5f9' // 15% darker than original #f3f4f6
  },
  text: {
    primary: '#1f2937', // 20% lighter than original #111827
    secondary: '#64748b', // 10% darker than original #6b7280
    tertiary: '#94a3b8' // 15% darker than original #9ca3af
  },
  border: {
    primary: '#e2e8f0', // 20% lighter than original #e5e7eb
    secondary: '#cbd5e1' // 15% darker than original #d1d5db
  }
};

export const darkTheme = {
  ...tokens,
  background: {
    primary: '#0f172a',
    secondary: '#1e293b',
    tertiary: '#334155'
  },
  text: {
    primary: '#f8fafc',
    secondary: '#cbd5e1',
    tertiary: '#94a3b8'
  },
  border: {
    primary: '#334155',
    secondary: '#475569'
  }
};

export type Theme = typeof lightTheme | typeof darkTheme;
