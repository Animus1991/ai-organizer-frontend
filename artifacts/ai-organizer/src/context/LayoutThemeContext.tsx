import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

export type LayoutThemeMode = "minimal" | "futuristic";

interface LayoutThemeContextType {
  layoutTheme: LayoutThemeMode;
  setLayoutTheme: (mode: LayoutThemeMode) => void;
  toggleLayoutTheme: () => void;
}

const LayoutThemeContext = createContext<LayoutThemeContextType | null>(null);

interface LayoutThemeProviderProps {
  children: ReactNode;
  defaultMode?: LayoutThemeMode;
  storageKey?: string;
}

export const LayoutThemeProvider: React.FC<LayoutThemeProviderProps> = ({
  children,
  defaultMode = "minimal",
  storageKey = "app-layout-theme",
}) => {
  const [layoutTheme, setLayoutThemeState] = useState<LayoutThemeMode>(() => {
    if (typeof window === "undefined") return defaultMode;
    const stored = window.localStorage.getItem(storageKey);
    return stored === "minimal" || stored === "futuristic" ? stored : defaultMode;
  });

  const setLayoutTheme = useCallback(
    (mode: LayoutThemeMode) => {
      setLayoutThemeState(mode);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(storageKey, mode);
      }
    },
    [storageKey]
  );

  const toggleLayoutTheme = useCallback(() => {
    setLayoutThemeState((prev) => (prev === "minimal" ? "futuristic" : "minimal"));
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-layout-theme", layoutTheme);
    }
  }, [layoutTheme]);

  return (
    <LayoutThemeContext.Provider value={{ layoutTheme, setLayoutTheme, toggleLayoutTheme }}>
      {children}
    </LayoutThemeContext.Provider>
  );
};

export const useLayoutTheme = (): LayoutThemeContextType => {
  const ctx = useContext(LayoutThemeContext);
  if (!ctx) {
    throw new Error("useLayoutTheme must be used within LayoutThemeProvider");
  }
  return ctx;
};
