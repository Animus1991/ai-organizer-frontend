// src/hooks/useButtonHover.ts
// Reusable hook for button hover effects - eliminates duplicated onMouseEnter/onMouseLeave handlers
import { useCallback } from "react";
import { useTheme } from "../context/ThemeContext";

export const useButtonHover = (disabled = false) => {
  const { isDark, mode } = useTheme();
  const isDash = mode === "dashboard";

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;
      
      const hoverBg = isDash 
        ? "rgba(99, 102, 241, 0.22)" 
        : isDark 
          ? "rgba(16, 185, 129, 0.15)" 
          : "rgba(16, 185, 129, 0.2)";
      
      e.currentTarget.style.background = hoverBg;
    },
    [disabled, isDash, isDark]
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const defaultBg = isDash 
        ? "rgba(99, 102, 241, 0.14)" 
        : isDark 
          ? "rgba(255, 255, 255, 0.05)" 
          : "rgba(0, 0, 0, 0.03)";
      
      e.currentTarget.style.background = defaultBg;
    },
    [isDash, isDark]
  );

  return { handleMouseEnter, handleMouseLeave };
};
