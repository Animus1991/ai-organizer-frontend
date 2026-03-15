/**
 * SectionTabs - Navigation for Research Hub sections with lucide-react icons
 * Mobile: horizontally scrollable chip bar with snap-to-active behavior.
 */
import { Search, Link, FileText, Plug, Brain } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

export type ResearchSectionId = "search" | "doi" | "results" | "integrations" | "context";

const tabs: Array<{ id: ResearchSectionId; label: string; icon: ReactNode }> = [
  { id: "search", label: "Search", icon: <Search size={15} /> },
  { id: "doi", label: "DOI", icon: <Link size={15} /> },
  { id: "results", label: "Results", icon: <FileText size={15} /> },
  { id: "integrations", label: "Integrations", icon: <Plug size={15} /> },
  { id: "context", label: "Context", icon: <Brain size={15} /> },
];

interface Props {
  active: ResearchSectionId;
  onChange: (next: ResearchSectionId) => void;
}

export function SectionTabs({ active, onChange }: Props) {
  const navRef = useRef<HTMLElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (activeRef.current && navRef.current) {
      activeRef.current.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [active]);

  return (
    <nav
      ref={navRef}
      aria-label="Research sections"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        overflowX: "auto",
        scrollbarWidth: "none",
        WebkitOverflowScrolling: "touch",
        scrollSnapType: "x mandatory",
        paddingBottom: "2px",
        flex: "1 1 auto",
        minWidth: 0,
      }}
    >
      <style>{`nav[aria-label="Research sections"]::-webkit-scrollbar { display: none; }`}</style>
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            ref={isActive ? activeRef : undefined}
            type="button"
            onClick={() => onChange(tab.id)}
            style={{
              flexShrink: 0,
              scrollSnapAlign: "start",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              borderRadius: "6px",
              border: isActive
                ? "1px solid hsl(var(--primary)/0.4)"
                : "1px solid hsl(var(--border))",
              background: isActive
                ? "hsl(var(--primary)/0.12)"
                : "hsl(var(--card))",
              color: isActive
                ? "hsl(var(--primary))"
                : "hsl(var(--foreground))",
              fontWeight: isActive ? 700 : 500,
              fontSize: "13px",
              padding: "7px 12px",
              minHeight: "36px",
              cursor: "pointer",
              transition: "all 0.15s ease",
              outline: "none",
              borderBottom: isActive
                ? "2px solid hsl(var(--primary))"
                : "2px solid transparent",
            }}
            onFocus={(e) => {
              (e.currentTarget as HTMLButtonElement).style.outline = "2px solid hsl(var(--primary))";
              (e.currentTarget as HTMLButtonElement).style.outlineOffset = "2px";
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLButtonElement).style.outline = "none";
            }}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
