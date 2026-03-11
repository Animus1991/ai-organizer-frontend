/**
 * useResponsive - Responsive design utilities and breakpoint hooks
 * Provides consistent responsive behavior across the application
 */

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from "react";

// Breakpoint definitions (matching Tailwind CSS)
export const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export type BreakpointKey = keyof typeof breakpoints;

// Current breakpoint state
interface ResponsiveState {
  width: number;
  height: number;
  breakpoint: BreakpointKey;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  orientation: "portrait" | "landscape";
}

// Hook to get current responsive state
export const useResponsive = (): ResponsiveState => {
  const [state, setState] = useState<ResponsiveState>(() => getResponsiveState());

  useEffect(() => {
    const handleResize = () => {
      setState(getResponsiveState());
    };

    // Debounced resize handler
    let timeoutId: number;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(handleResize, 100);
    };

    window.addEventListener("resize", debouncedResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      window.removeEventListener("resize", debouncedResize);
      window.removeEventListener("orientationchange", handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return state;
};

// Helper to get responsive state
const getResponsiveState = (): ResponsiveState => {
  if (typeof window === "undefined") {
    return {
      width: 1920,
      height: 1080,
      breakpoint: "xl",
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isLargeDesktop: true,
      orientation: "landscape",
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;

  const breakpoint = getBreakpoint(width);
  const isMobile = width < breakpoints.md;
  const isTablet = width >= breakpoints.md && width < breakpoints.lg;
  const isDesktop = width >= breakpoints.lg;
  const isLargeDesktop = width >= breakpoints.xl;
  const orientation = height > width ? "portrait" : "landscape";

  return {
    width,
    height,
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    orientation,
  };
};

// Get current breakpoint from width
const getBreakpoint = (width: number): BreakpointKey => {
  if (width >= breakpoints["2xl"]) return "2xl";
  if (width >= breakpoints.xl) return "xl";
  if (width >= breakpoints.lg) return "lg";
  if (width >= breakpoints.md) return "md";
  if (width >= breakpoints.sm) return "sm";
  return "xs";
};

// Hook for media query matching
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [query]);

  return matches;
};

// Hook for specific breakpoint checks
export const useBreakpoint = (breakpoint: BreakpointKey, direction: "up" | "down" = "up"): boolean => {
  const { width } = useResponsive();
  const bp = breakpoints[breakpoint];

  if (direction === "up") {
    return width >= bp;
  }
  return width < bp;
};

// Responsive value selector - pick value based on breakpoint
type ResponsiveValue<T> = {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  "2xl"?: T;
};

export const useResponsiveValue = <T,>(values: ResponsiveValue<T>, defaultValue: T): T => {
  const { breakpoint } = useResponsive();

  // Find the best matching value
  const breakpointOrder: BreakpointKey[] = ["2xl", "xl", "lg", "md", "sm", "xs"];
  const currentIndex = breakpointOrder.indexOf(breakpoint);

  for (let i = currentIndex; i < breakpointOrder.length; i++) {
    const bp = breakpointOrder[i];
    if (values[bp] !== undefined) {
      return values[bp] as T;
    }
  }

  return defaultValue;
};

// Responsive container context
interface ResponsiveContextType extends ResponsiveState {
  containerWidth: number;
}

const ResponsiveContext = createContext<ResponsiveContextType | null>(null);

// Provider for responsive context
interface ResponsiveProviderProps {
  children: ReactNode;
}

export const ResponsiveProvider: React.FC<ResponsiveProviderProps> = ({ children }) => {
  const state = useResponsive();

  return (
    <ResponsiveContext.Provider value={{ ...state, containerWidth: state.width }}>
      {children}
    </ResponsiveContext.Provider>
  );
};

export const useResponsiveContext = () => {
  const context = useContext(ResponsiveContext);
  if (!context) {
    throw new Error("useResponsiveContext must be used within ResponsiveProvider");
  }
  return context;
};

// Responsive grid helper
interface GridConfig {
  columns: number;
  gap: string;
}

export const useResponsiveGrid = (config: ResponsiveValue<GridConfig>): GridConfig => {
  return useResponsiveValue(config, { columns: 1, gap: "16px" });
};

// CSS-in-JS responsive styles helper
export const createResponsiveStyles = (
  styles: ResponsiveValue<React.CSSProperties>
): React.CSSProperties => {
  const { breakpoint } = useResponsive();
  const breakpointOrder: BreakpointKey[] = ["2xl", "xl", "lg", "md", "sm", "xs"];
  const currentIndex = breakpointOrder.indexOf(breakpoint);

  let result: React.CSSProperties = {};

  // Merge styles from smallest to current breakpoint
  for (let i = breakpointOrder.length - 1; i >= currentIndex; i--) {
    const bp = breakpointOrder[i];
    if (styles[bp]) {
      result = { ...result, ...styles[bp] };
    }
  }

  return result;
};

// Mobile navigation drawer state
export const useMobileDrawer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isMobile } = useResponsive();

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  // Auto-close on breakpoint change to desktop
  useEffect(() => {
    if (!isMobile && isOpen) {
      setIsOpen(false);
    }
  }, [isMobile, isOpen]);

  return { isOpen, open, close, toggle, isMobile };
};

// Responsive component visibility
interface ShowProps {
  children: ReactNode;
  above?: BreakpointKey;
  below?: BreakpointKey;
  only?: BreakpointKey[];
}

export const Show: React.FC<ShowProps> = ({ children, above, below, only }) => {
  const { width, breakpoint } = useResponsive();

  if (above && width < breakpoints[above]) return null;
  if (below && width >= breakpoints[below]) return null;
  if (only && !only.includes(breakpoint)) return null;

  return <>{children}</>;
};

// Hide component
export const Hide: React.FC<ShowProps> = ({ children, above, below, only }) => {
  const { width, breakpoint } = useResponsive();

  if (above && width >= breakpoints[above]) return null;
  if (below && width < breakpoints[below]) return null;
  if (only && only.includes(breakpoint)) return null;

  return <>{children}</>;
};

// Global responsive CSS styles
export const ResponsiveStyles: React.FC = () => (
  <style>{`
    /* Responsive container utilities */
    .container-responsive {
      width: 100%;
      margin-left: auto;
      margin-right: auto;
      padding-left: 16px;
      padding-right: 16px;
    }
    
    @media (min-width: 640px) {
      .container-responsive { max-width: 640px; }
    }
    @media (min-width: 768px) {
      .container-responsive { max-width: 768px; }
    }
    @media (min-width: 1024px) {
      .container-responsive { max-width: 1024px; }
    }
    @media (min-width: 1280px) {
      .container-responsive { max-width: 1280px; }
    }
    @media (min-width: 1536px) {
      .container-responsive { max-width: 1536px; }
    }
    
    /* Mobile-first responsive utilities */
    .hide-mobile { display: none !important; }
    .show-mobile { display: block !important; }
    
    @media (min-width: 768px) {
      .hide-mobile { display: block !important; }
      .show-mobile { display: none !important; }
      .hide-tablet { display: none !important; }
      .show-tablet { display: block !important; }
    }
    
    @media (min-width: 1024px) {
      .hide-tablet { display: block !important; }
      .show-tablet { display: none !important; }
      .hide-desktop { display: none !important; }
      .show-desktop { display: block !important; }
    }
    
    /* Responsive typography */
    .text-responsive-sm {
      font-size: 12px;
    }
    .text-responsive-md {
      font-size: 13px;
    }
    .text-responsive-lg {
      font-size: 14px;
    }
    
    @media (min-width: 768px) {
      .text-responsive-sm { font-size: 13px; }
      .text-responsive-md { font-size: 14px; }
      .text-responsive-lg { font-size: 15px; }
    }
    
    /* Responsive spacing */
    .gap-responsive {
      gap: 12px;
    }
    @media (min-width: 768px) {
      .gap-responsive { gap: 16px; }
    }
    @media (min-width: 1024px) {
      .gap-responsive { gap: 20px; }
    }
    
    /* Touch-friendly targets for mobile */
    @media (max-width: 767px) {
      button, .btn, [role="button"] {
        min-height: 44px;
        min-width: 44px;
      }
    }
    
    /* Responsive card grid */
    .grid-responsive {
      display: grid;
      gap: 16px;
      grid-template-columns: 1fr;
    }
    @media (min-width: 640px) {
      .grid-responsive { grid-template-columns: repeat(2, 1fr); }
    }
    @media (min-width: 1024px) {
      .grid-responsive { grid-template-columns: repeat(3, 1fr); }
    }
    @media (min-width: 1280px) {
      .grid-responsive { grid-template-columns: repeat(4, 1fr); }
    }
  `}</style>
);

export default useResponsive;
