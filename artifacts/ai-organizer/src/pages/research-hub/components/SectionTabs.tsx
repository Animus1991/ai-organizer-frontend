/**
 * SectionTabs - Navigation for Research Hub sections with lucide-react icons
 */
import { Search, Link, FileText, Plug, Brain } from "lucide-react";
import type { ReactNode } from "react";

export type ResearchSectionId = "search" | "doi" | "results" | "integrations" | "context";

const tabs: Array<{ id: ResearchSectionId; label: string; icon: ReactNode }> = [
  { id: "search", label: "Search", icon: <Search size={16} /> },
  { id: "doi", label: "DOI", icon: <Link size={16} /> },
  { id: "results", label: "Results", icon: <FileText size={16} /> },
  { id: "integrations", label: "Integrations", icon: <Plug size={16} /> },
  { id: "context", label: "Context", icon: <Brain size={16} /> },
];

interface Props {
  active: ResearchSectionId;
  onChange: (next: ResearchSectionId) => void;
}

export function SectionTabs({ active, onChange }: Props) {
  return (
    <nav className="flex flex-wrap items-center gap-2" aria-label="Research sections">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={
            "rounded-md border px-3 py-2 text-sm font-semibold transition-colors " +
            (active === t.id
              ? "border-primary/30 bg-primary/10 text-primary"
              : "border-border bg-card text-foreground hover:bg-accent")
          }
        >
          <span className="inline-flex items-center gap-2">
            {t.icon}
            <span>{t.label}</span>
          </span>
        </button>
      ))}
    </nav>
  );
}
