/**
 * Design Tokens System
 * CoFounderBay-inspired design tokens for Think!Hub
 * Comprehensive token system for consistent UI/UX
 */
// @ts-nocheck
// Type definitions for design tokens
interface DesignTokens {
  colors: {
    semantic: {
      primary: string;
      primaryHover: string;
      primaryLight: string;
      secondary: string;
      secondaryHover: string;
      secondaryLight: string;
      accent: string;
      accentHover: string;
      accentLight: string;
      success: string;
      successHover: string;
      successLight: string;
      warning: string;
      warningHover: string;
      warningLight: string;
      error: string;
      errorHover: string;
      errorLight: string;
      info: string;
      infoHover: string;
      infoLight: string;
    };
    neutral: {
      [key: string]: string;
    };
    brand: {
      primary: string;
      secondary: string;
      accent: string;
      gradient: {
        primary: string;
        secondary: string;
        accent: string;
        success: string;
        error: string;
      };
    };
    themes: {
      light: {
        background: string;
        surface: string;
        card: string;
        border: string;
        text: {
          primary: string;
          secondary: string;
          tertiary: string;
          inverse: string;
        };
        shadow: {
          sm: string;
          md: string;
          lg: string;
          xl: string;
        };
      };
      dark: {
        background: string;
        surface: string;
        card: string;
        border: string;
        text: {
          primary: string;
          secondary: string;
          tertiary: string;
          inverse: string;
        };
        shadow: {
          sm: string;
          md: string;
          lg: string;
          xl: string;
        };
      };
      dashboard: {
        background: string;
        surface: string;
        card: string;
        border: string;
        text: {
          primary: string;
          secondary: string;
          tertiary: string;
          inverse: string;
        };
        shadow: {
          sm: string;
          md: string;
          lg: string;
          xl: string;
        };
      };
    };
  };
  spacing: {
    [key: string]: string;
  };
  typography: {
    fontFamily: {
      [key: string]: string[];
    };
    fontSize: {
      [key: string]: string;
    };
    fontWeight: {
      [key: string]: string;
    };
    lineHeight: {
      [key: string]: string;
    };
    letterSpacing: {
      [key: string]: string;
    };
  };
  shadows: {
    [key: string]: string;
  };
  borderRadius: {
    [key: string]: string;
  };
  animation: {
    duration: {
      [key: string]: string;
    };
    easing: {
      [key: string]: string;
    };
  };
  breakpoints: {
    [key: string]: string;
  };
  zIndex: {
    [key: string]: string | number;
  };
  components: {
    button: {
      size: {
        [key: string]: {
          height: string;
          padding: string;
          fontSize: string;
          borderRadius: string;
        };
      };
      variant: {
        [key: string]: {
          background: string;
          color: string;
          border: string;
          shadow: string;
          [key: string]: any;
        };
      };
    };
    card: {
      padding: {
        [key: string]: string;
      };
      borderRadius: {
        [key: string]: string;
      };
      shadow: {
        [key: string]: string;
      };
    };
    input: {
      size: {
        [key: string]: {
          height: string;
          padding: string;
          fontSize: string;
          borderRadius: string;
        };
      };
      variant: {
        [key: string]: {
          border?: string;
          borderBottom?: string;
          background: string;
          borderRadius?: string;
          focus: {
            border?: string;
            borderBottom?: string;
            background?: string;
            ring: string;
          };
        };
      };
    };
    fab: {
      size: {
        [key: string]: {
          width: string;
          height: string;
          iconSize: string;
        };
      };
      shadow: {
        [key: string]: string;
      };
    };
  };
}

export const designTokens: DesignTokens = {
  // Color System
  colors: {
    // Semantic colors
    semantic: {
      primary: '#4f46e5',
      primaryHover: '#4338ca',
      primaryLight: '#e0e7ff',
      secondary: '#6b7280',
      secondaryHover: '#4b5563',
      secondaryLight: '#f3f4f6',
      accent: '#7c3aed',
      accentHover: '#6d28d9',
      accentLight: '#ede9fe',
      success: '#10b981',
      successHover: '#059669',
      successLight: '#d1fae5',
      warning: '#f59e0b',
      warningHover: '#d97706',
      warningLight: '#fef3c7',
      error: '#ef4444',
      errorHover: '#dc2626',
      errorLight: '#fee2e2',
      info: '#3b82f6',
      infoHover: '#2563eb',
      infoLight: '#dbeafe',
    },
    
    // Neutral palette
    neutral: {
      0: '#ffffff',
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
      950: '#030712',
      1000: '#000000',
    },
    
    // Brand colors
    brand: {
      primary: '#4f46e5',
      secondary: '#7c3aed',
      accent: '#06b6d4',
      gradient: {
        primary: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        secondary: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
        accent: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
        success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      },
    },
    
    // Theme-specific colors
    themes: {
      light: {
        background: '#ffffff',
        surface: '#f9fafb',
        card: '#ffffff',
        border: '#e5e7eb',
        text: {
          primary: '#111827',
          secondary: '#6b7280',
          tertiary: '#9ca3af',
          inverse: '#ffffff',
        },
        shadow: {
          sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        },
      },
      dark: {
        background: '#0f172a',
        surface: '#1e293b',
        card: '#1e293b',
        border: '#334155',
        text: {
          primary: '#f8fafc',
          secondary: '#cbd5e1',
          tertiary: '#94a3b8',
          inverse: '#0f172a',
        },
        shadow: {
          sm: '0 1px 2px 0 rgba(0, 0, 0, 0.25)',
          md: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
          lg: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
          xl: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
        },
      },
      dashboard: {
        background: '#0a0a0a',
        surface: '#1a1a1a',
        card: '#1a1a1a',
        border: '#2a2a2a',
        text: {
          primary: '#ffffff',
          secondary: '#a0a0a0',
          tertiary: '#808080',
          inverse: '#0a0a0a',
        },
        shadow: {
          sm: '0 1px 2px 0 rgba(0, 0, 0, 0.5)',
          md: '0 4px 6px -1px rgba(0, 0, 0, 0.6), 0 2px 4px -1px rgba(0, 0, 0, 0.4)',
          lg: '0 10px 15px -3px rgba(0, 0, 0, 0.6), 0 4px 6px -2px rgba(0, 0, 0, 0.4)',
          xl: '0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
        },
      },
    },
  },
  
  // Spacing System
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
    '4xl': '96px',
    '5xl': '128px',
    '6xl': '192px',
    '7xl': '256px',
    '8xl': '384px',
  },
  
  // Typography System
  typography: {
    fontFamily: {
      sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
      serif: ['ui-serif', 'Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
      mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      display: ['Inter', 'system-ui', 'sans-serif'],
    },
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
      '4xl': '36px',
      '5xl': '48px',
      '6xl': '60px',
      '7xl': '72px',
      '8xl': '96px',
      '9xl': '128px',
    },
    fontWeight: {
      thin: '100',
      extralight: '200',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900',
    },
    lineHeight: {
      none: '1',
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2',
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    },
  },
  
  // Shadow System
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    glow: '0 0 20px rgba(79, 70, 229, 0.3)',
    glowLg: '0 0 40px rgba(79, 70, 229, 0.4)',
  },
  
  // Border Radius System
  borderRadius: {
    none: '0',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '24px',
    '3xl': '32px',
    full: '9999px',
  },
  
  // Animation System
  animation: {
    duration: {
      '75': '75ms',
      '100': '100ms',
      '150': '150ms',
      '200': '200ms',
      '300': '300ms',
      '500': '500ms',
      '700': '700ms',
      '1000': '1000ms',
    },
    easing: {
      linear: 'linear',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    },
  },
  
  // Breakpoint System
  breakpoints: {
    xs: '475px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
    '3xl': '1920px',
  },
  
  // Z-Index System
  zIndex: {
    hide: '-1',
    auto: 'auto',
    base: '0',
    docked: '10',
    dropdown: '1000',
    sticky: '1100',
    banner: '1200',
    overlay: '1300',
    modal: '1400',
    popover: '1500',
    skipLink: '1600',
    toast: '1700',
    tooltip: '1800',
    focus: '9999',
  },
  
  // Component-specific tokens
  components: {
    button: {
      size: {
        xs: {
          height: '24px',
          padding: '0 8px',
          fontSize: '12px',
          borderRadius: '4px',
        },
        sm: {
          height: '32px',
          padding: '0 12px',
          fontSize: '14px',
          borderRadius: '6px',
        },
        md: {
          height: '40px',
          padding: '0 16px',
          fontSize: '16px',
          borderRadius: '8px',
        },
        lg: {
          height: '48px',
          padding: '0 24px',
          fontSize: '18px',
          borderRadius: '12px',
        },
        xl: {
          height: '56px',
          padding: '0 32px',
          fontSize: '20px',
          borderRadius: '16px',
        },
      },
      variant: {
        primary: {
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          color: '#ffffff',
          border: 'none',
          shadow: '0 4px 16px rgba(79, 70, 229, 0.4)',
        },
        secondary: {
          background: 'transparent',
          color: '#4f46e5',
          border: '1px solid #4f46e5',
          shadow: 'none',
        },
        outline: {
          background: 'transparent',
          color: '#6b7280',
          border: '1px solid #e5e7eb',
          shadow: 'none',
        },
        ghost: {
          background: 'transparent',
          color: '#6b7280',
          border: 'none',
          shadow: 'none',
        },
        link: {
          background: 'transparent',
          color: '#4f46e5',
          border: 'none',
          shadow: 'none',
          textDecoration: 'underline',
        },
      },
    },
    
    card: {
      padding: {
        sm: '16px',
        md: '24px',
        lg: '32px',
        xl: '48px',
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
      shadow: {
        sm: '0 1px 3px rgba(0, 0, 0, 0.1)',
        md: '0 4px 6px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px rgba(0, 0, 0, 0.1)',
      },
    },
    
    input: {
      size: {
        sm: {
          height: '32px',
          padding: '0 12px',
          fontSize: '14px',
          borderRadius: '6px',
        },
        md: {
          height: '40px',
          padding: '0 16px',
          fontSize: '16px',
          borderRadius: '8px',
        },
        lg: {
          height: '48px',
          padding: '0 20px',
          fontSize: '18px',
          borderRadius: '12px',
        },
      },
      variant: {
        outline: {
          border: '1px solid #e5e7eb',
          background: '#ffffff',
          focus: {
            border: '1px solid #4f46e5',
            ring: '0 0 0 3px rgba(79, 70, 229, 0.1)',
          },
        },
        filled: {
          border: '1px solid transparent',
          background: '#f9fafb',
          focus: {
            border: '1px solid #4f46e5',
            background: '#ffffff',
            ring: '0 0 0 3px rgba(79, 70, 229, 0.1)',
          },
        },
        flushed: {
          border: 'none',
          borderBottom: '1px solid #e5e7eb',
          background: 'transparent',
          borderRadius: '0',
          focus: {
            borderBottom: '1px solid #4f46e5',
            ring: 'none',
          },
        },
      },
    },
    
    fab: {
      size: {
        sm: {
          width: '40px',
          height: '40px',
          iconSize: '16px',
        },
        md: {
          width: '48px',
          height: '48px',
          iconSize: '20px',
        },
        lg: {
          width: '56px',
          height: '56px',
          iconSize: '24px',
        },
        xl: {
          width: '64px',
          height: '64px',
          iconSize: '28px',
        },
      },
      shadow: {
        sm: '0 2px 8px rgba(0, 0, 0, 0.15)',
        md: '0 4px 16px rgba(0, 0, 0, 0.2)',
        lg: '0 8px 24px rgba(0, 0, 0, 0.25)',
        xl: '0 12px 32px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  
  // Spacing System
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
    '4xl': '96px',
    '5xl': '128px',
    '6xl': '192px',
    '7xl': '256px',
    '8xl': '384px',
  },
  
  // Typography System
  typography: {
    fontFamily: {
      sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
      serif: ['ui-serif', 'Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
      mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      display: ['Inter', 'system-ui', 'sans-serif'],
    },
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
      '4xl': '36px',
      '5xl': '48px',
      '6xl': '60px',
      '7xl': '72px',
      '8xl': '96px',
      '9xl': '128px',
    },
    fontWeight: {
      thin: '100',
      extralight: '200',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900',
    },
    lineHeight: {
      none: '1',
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2',
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    },
  },
  
  // Shadow System
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    glow: '0 0 20px rgba(79, 70, 229, 0.3)',
    glowLg: '0 0 40px rgba(79, 70, 229, 0.4)',
  },
  
  // Border Radius System
  borderRadius: {
    none: '0',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '24px',
    '3xl': '32px',
    full: '9999px',
  },
  
  // Animation System
  animation: {
    duration: {
      '75': '75ms',
      '100': '100ms',
      '150': '150ms',
      '200': '200ms',
      '300': '300ms',
      '500': '500ms',
      '700': '700ms',
      '1000': '1000ms',
    },
    easing: {
      linear: 'linear',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    },
  },
  
  // Breakpoint System
  breakpoints: {
    xs: '475px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
    '3xl': '1920px',
  },
  
  // Z-Index System
  zIndex: {
    hide: '-1',
    auto: 'auto',
    base: '0',
    docked: '10',
    dropdown: '1000',
    sticky: '1100',
    banner: '1200',
    overlay: '1300',
    modal: '1400',
    popover: '1500',
    skipLink: '1600',
    toast: '1700',
    tooltip: '1800',
    focus: '9999',
  },
};

// Helper functions for accessing tokens
export const getToken = (path: string) => {
  const keys = path.split('.');
  let value = designTokens;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key as keyof typeof value];
    } else {
      return undefined;
    }
  }
  
  return value;
};

// Theme-aware token getter
export const getThemeToken = (path: string, theme: 'light' | 'dark' | 'dashboard' = 'light') => {
  const themePath = `themes.${theme}.${path}`;
  return getToken(themePath) || getToken(`colors.${path}`);
};

// Component token getter
export const getComponentToken = (component: string, path: string) => {
  return getToken(`components.${component}.${path}`);
};

export default designTokens;
