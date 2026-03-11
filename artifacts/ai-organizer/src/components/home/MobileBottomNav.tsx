/**
 * MobileBottomNav - Fixed bottom navigation for mobile Home page
 * Auto-hides after 3s of inactivity, reappears on tap anywhere
 */

import { Briefcase, BarChart3, Fingerprint, Users } from "lucide-react";
import { useCallback, useEffect, useState, useRef } from "react";

interface MobileBottomNavProps {
  activeSection: string;
  onNavigate: (sectionId: string) => void;
}

const NAV_ITEMS = [
  { id: "workflow-orchestration", label: "Ροή", icon: Briefcase },
  { id: "insights-zone", label: "Ανάλυση", icon: BarChart3 },
  { id: "identity-community", label: "Ταυτότητα", icon: Fingerprint },
  { id: "community-hub", label: "Κοινότητα", icon: Users },
] as const;

const HIDE_DELAY = 3000;

export function MobileBottomNav({ activeSection, onNavigate }: MobileBottomNavProps) {
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const resetTimer = useCallback(() => {
    setVisible(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(false), HIDE_DELAY);
  }, []);

  // Listen for taps anywhere on the page
  useEffect(() => {
    const handler = () => resetTimer();
    window.addEventListener("pointerdown", handler, { passive: true });
    // Start the initial hide timer
    timerRef.current = setTimeout(() => setVisible(false), HIDE_DELAY);
    return () => {
      window.removeEventListener("pointerdown", handler);
      clearTimeout(timerRef.current);
    };
  }, [resetTimer]);

  const handleClick = useCallback((id: string) => {
    onNavigate(id);
    resetTimer();
  }, [onNavigate, resetTimer]);

  return (
    <nav
      aria-label="Mobile section navigation"
      className="fixed bottom-0 left-0 right-0 z-[9998] flex items-stretch border-t border-border bg-card/95 backdrop-blur-xl"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        transform: visible ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
        willChange: "transform",
      }}
    >
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
        const isActive = activeSection === id;
        return (
          <button
            key={id}
            onClick={() => handleClick(id)}
            className={`
              flex-1 flex flex-col items-center justify-center gap-0.5 py-2 px-1 relative
              transition-colors duration-150 border-none bg-transparent cursor-pointer
              ${isActive ? "text-primary" : "text-muted-foreground"}
            `}
          >
            <Icon
              className={`w-5 h-5 transition-transform duration-200 ${isActive ? "scale-110" : ""}`}
              strokeWidth={isActive ? 2.5 : 1.8}
            />
            <span className={`text-[10px] leading-tight ${isActive ? "font-semibold" : "font-medium"}`}>
              {label}
            </span>
            {isActive && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
