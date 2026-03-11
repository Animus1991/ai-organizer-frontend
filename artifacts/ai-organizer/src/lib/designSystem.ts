/**
 * Design System - Material Design 3 Implementation
 * Industry Standards 2024-2025
 */

// === COLOR SYSTEM ===
export const colors = {
  // Primary Palette
  primary: {
    50: '#eff6ff',
    100: '#dbeafe', 
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Primary
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554'
  },
  
  // Secondary Palette
  secondary: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff', 
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7', // Secondary
    600: '#9333ea',
    700: '#7c3aed',
    800: '#6b21a8',
    900: '#581c87',
    950: '#3b0764'
  },

  // Semantic Colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e', // Success
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16'
  },

  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // Warning
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03'
  },

  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444', // Error
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    950: '#450a0a'
  },

  // Neutral Palette (Dark Theme)
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a'
  },

  // Surface Colors (Dark Theme)
  surface: {
    1: '#0c0a09',
    2: '#1c1917',
    3: '#292524',
    4: '#44403c',
    5: '#78716c'
  }
};

// === TYPOGRAPHY SYSTEM ===
export const typography = {
  // Font Families
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
    serif: ['Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
    mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'Courier New', 'monospace']
  },

  // Font Sizes (rem-based, 1rem = 16px)
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
    '6xl': '3.75rem', // 60px
  },

  // Font Weights
  fontWeight: {
    thin: '100',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900'
  },

  // Line Heights
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2'
  },

  // Letter Spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em'
  }
};

// === SPACING SYSTEM ===
export const spacing = {
  // 8px grid system
  0: '0',
  px: '1px',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',    // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',     // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem',    // 12px
  3.5: '0.875rem', // 14px
  4: '1rem',       // 16px
  5: '1.25rem',    // 20px
  6: '1.5rem',     // 24px
  7: '1.75rem',    // 28px
  8: '2rem',       // 32px
  9: '2.25rem',    // 36px
  10: '2.5rem',    // 40px
  11: '2.75rem',   // 44px
  12: '3rem',      // 48px
  14: '3.5rem',    // 56px
  16: '4rem',      // 64px
  20: '5rem',      // 80px
  24: '6rem',      // 96px
  28: '7rem',      // 112px
  32: '8rem',      // 128px
  36: '9rem',      // 144px
  40: '10rem',     // 160px
  44: '11rem',     // 176px
  48: '12rem',     // 192px
  52: '13rem',     // 208px
  56: '14rem',     // 224px
  60: '15rem',     // 240px
  64: '16rem',     // 256px
  72: '18rem',     // 288px
  80: '20rem',     // 320px
  96: '24rem',     // 384px
};

// === BORDER RADIUS ===
export const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  DEFAULT: '0.25rem', // 4px
  md: '0.375rem',  // 6px
  lg: '0.5rem',    // 8px
  xl: '0.75rem',   // 12px
  '2xl': '1rem',   // 16px
  '3xl': '1.5rem', // 24px
  full: '9999px'
};

// === SHADOWS ===
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  
  // Custom shadows for glassmorphism
  glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
  glassSm: '0 4px 16px 0 rgba(31, 38, 135, 0.2)',
  glassLg: '0 16px 64px 0 rgba(31, 38, 135, 0.5)'
};

// === ANIMATION ===
export const animation = {
  // Durations
  duration: {
    75: '75ms',
    100: '100ms',
    150: '150ms',
    200: '200ms',
    300: '300ms',
    500: '500ms',
    700: '700ms',
    1000: '1000ms'
  },

  // Timing functions
  ease: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
    
    // Material Design easing
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
    standardDecelerate: 'cubic-bezier(0, 0, 0, 1)',
    standardAccelerate: 'cubic-bezier(0.3, 0, 1, 1)',
    emphasizedDecelerate: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
    emphasizedAccelerate: 'cubic-bezier(0.3, 0, 0.8, 0.15)',
    emphasized: 'cubic-bezier(0.2, 0, 0, 1)'
  },

  // Keyframes
  keyframes: {
    fadeIn: {
      from: { opacity: '0' },
      to: { opacity: '1' }
    },
    fadeOut: {
      from: { opacity: '1' },
      to: { opacity: '0' }
    },
    slideInUp: {
      from: { transform: 'translateY(100%)' },
      to: { transform: 'translateY(0)' }
    },
    slideInDown: {
      from: { transform: 'translateY(-100%)' },
      to: { transform: 'translateY(0)' }
    },
    slideInLeft: {
      from: { transform: 'translateX(-100%)' },
      to: { transform: 'translateX(0)' }
    },
    slideInRight: {
      from: { transform: 'translateX(100%)' },
      to: { transform: 'translateX(0)' }
    },
    scaleIn: {
      from: { transform: 'scale(0.9)', opacity: '0' },
      to: { transform: 'scale(1)', opacity: '1' }
    },
    scaleOut: {
      from: { transform: 'scale(1)', opacity: '1' },
      to: { transform: 'scale(0.9)', opacity: '0' }
    },
    pulse: {
      '0%, 100%': { opacity: '1' },
      '50%': { opacity: '0.5' }
    },
    spin: {
      from: { transform: 'rotate(0deg)' },
      to: { transform: 'rotate(360deg)' }
    },
    bounce: {
      '0%, 100%': { transform: 'translateY(-25%)', animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)' },
      '50%': { transform: 'translateY(0)', animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)' }
    }
  }
};

// === BREAKPOINTS ===
export const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px' // Extra large desktop
};

// === Z-INDEX ===
export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800
};

// === COMPONENT PROPS ===
export const componentProps = {
  // Button
  button: {
    minHeight: '44px', // WCAG touch target
    paddingX: spacing[4],
    paddingY: spacing[2.5],
    borderRadius: borderRadius.lg,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    transition: `all ${animation.duration[200]} ${animation.ease.standard}`,
    cursor: 'pointer',
    border: 'none',
    outline: 'none',
    
    // Focus styles
    focusVisible: {
      outline: `2px solid ${colors.primary[500]}`,
      outlineOffset: '2px'
    }
  },

  // Input
  input: {
    minHeight: '44px',
    paddingX: spacing[3],
    paddingY: spacing[2.5],
    borderRadius: borderRadius.lg,
    fontSize: typography.fontSize.sm,
    border: `1px solid ${colors.neutral[700]}`,
    backgroundColor: colors.surface[2],
    color: colors.neutral[100],
    transition: `all ${animation.duration[200]} ${animation.ease.standard}`,
    
    // Focus styles
    focusVisible: {
      borderColor: colors.primary[500],
      boxShadow: `0 0 0 3px ${colors.primary[500]}20`
    }
  },

  // Card
  card: {
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surface[2],
    border: `1px solid ${colors.neutral[800]}`,
    boxShadow: shadows.glassSm,
    backdropFilter: 'blur(10px)',
    transition: `all ${animation.duration[200]} ${animation.ease.standard}`,
    
    // Hover
    hover: {
      transform: 'translateY(-2px)',
      boxShadow: shadows.glass
    }
  },

  // Container
  container: {
    maxWidth: {
      sm: '640px',
      md: '768px', 
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px'
    },
    paddingX: spacing[4],
    marginX: 'auto'
  }
};

// === RESPONSIVE HELPERS ===
export const responsive = {
  // Mobile-first approach
  up: (breakpoint: keyof typeof breakpoints) => `@media (min-width: ${breakpoints[breakpoint]})`,
  down: (breakpoint: keyof typeof breakpoints) => {
    const bpValue = parseInt(breakpoints[breakpoint]);
    return `@media (max-width: ${bpValue - 1}px)`;
  },
  between: (start: keyof typeof breakpoints, end: keyof typeof breakpoints) => {
    const startBp = parseInt(breakpoints[start]);
    const endBp = parseInt(breakpoints[end]);
    return `@media (min-width: ${startBp}px) and (max-width: ${endBp - 1}px)`;
  },
  
  // Common responsive patterns
  mobile: '@media (max-width: 767px)',
  tablet: '@media (min-width: 768px) and (max-width: 1023px)',
  desktop: '@media (min-width: 1024px)',
  desktopLarge: '@media (min-width: 1280px)'
};

// === ACCESSIBILITY ===
export const accessibility = {
  // Focus management
  focusRing: {
    width: '2px',
    color: colors.primary[500],
    offset: '2px',
    style: 'solid'
  },

  // Screen reader only
  srOnly: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: '0'
  },

  // Skip links
  skipLink: {
    position: 'absolute',
    top: '-40px',
    left: '6px',
    background: colors.primary[600],
    color: 'white',
    padding: '8px',
    textDecoration: 'none',
    borderRadius: borderRadius.md,
    zIndex: zIndex.skipLink,
    transition: `top ${animation.duration[300]} ${animation.ease.standard}`,
    
    focus: {
      top: '6px'
    }
  }
};

// === EXPORT MAIN DESIGN SYSTEM ===
export const designSystem = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animation,
  breakpoints,
  zIndex,
  componentProps,
  responsive,
  accessibility
};

export default designSystem;
