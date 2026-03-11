/**
 * FrontendMobileBottomNav — Fixed bottom nav for /frontend on mobile
 * Provides quick access to Documents, Search, Segments, Analytics panels
 */
import { FileText, Search, Puzzle, BarChart3 } from "lucide-react";
import { useCallback } from "react";

interface FrontendMobileBottomNavProps {
  onOpenDocuments: () => void;
  onOpenSearch: () => void;
  onOpenSegments: () => void;
  onOpenAnalytics?: () => void;
  activePanel?: string;
}

const NAV_ITEMS = [
  { id: "documents", label: "Docs", icon: FileText },
  { id: "search", label: "Search", icon: Search },
  { id: "segments", label: "Segments", icon: Puzzle },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
] as const;

export function FrontendMobileBottomNav({
  onOpenDocuments,
  onOpenSearch,
  onOpenSegments,
  onOpenAnalytics,
  activePanel,
}: FrontendMobileBottomNavProps) {
  const handleClick = useCallback((id: string) => {
    switch (id) {
      case "documents": onOpenDocuments(); break;
      case "search": onOpenSearch(); break;
      case "segments": onOpenSegments(); break;
      case "analytics": onOpenAnalytics?.(); break;
    }
  }, [onOpenDocuments, onOpenSearch, onOpenSegments, onOpenAnalytics]);

  return (
    <nav
      aria-label="Mobile workspace navigation"
      className="fixed bottom-0 left-0 right-0 z-[9998] flex items-stretch border-t border-border bg-card/95 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
        const isActive = activePanel === id;
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
