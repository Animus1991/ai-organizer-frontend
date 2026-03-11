/**
 * ResearchHubPage (v3)
 * Lucide icons, decomposed hooks, clean architecture.
 */
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FlaskConical, Target } from "lucide-react";
import { PageShell } from "../../components/layout/PageShell";
import { useLanguage } from "../../context/LanguageContext";
import { CompactExpandedToggle } from "../../components/ui/CompactExpandedToggle";
import { TourStep, useTour } from "../../components/UniversalTourGuide";
import { useResearchHubState } from "../research/hooks/useResearchHubState";

import { SectionTabs, type ResearchSectionId } from "./components/SectionTabs";
import { SearchSection } from "./sections/SearchSection";
import { DoiSection } from "./sections/DoiSection";
import { IntegrationsSection } from "./sections/IntegrationsSection";
import { ContextSection } from "./sections/ContextSection";
import { ResultsSection } from "./sections/ResultsSection";

const DEFAULT_SECTION: ResearchSectionId = "search";

export default function ResearchHubPage() {
  const { t } = useLanguage();
  const nav = useNavigate();
  const params = useParams<{ section?: string }>();
  const hub = useResearchHubState();

  const section = (params.section as ResearchSectionId | undefined) ?? DEFAULT_SECTION;

  const tourSteps: TourStep[] = useMemo(
    () => [
      { id: "research-welcome", title: t("tour.researchHub.welcome.title") || "Research Hub", content: t("tour.researchHub.welcome.content") || "Search, resolve DOIs, and sync your library.", position: "center", highlight: false },
      { id: "research-search", title: t("tour.researchHub.openalex.title") || "Unified search", content: t("tour.researchHub.openalex.content") || "Search across sources and refine with filters.", target: "[data-tour='research-search']", position: "bottom", highlight: true },
      { id: "research-doi", title: t("tour.researchHub.crossref.title") || "DOI resolver", content: t("tour.researchHub.crossref.content") || "Resolve DOI metadata and export citations.", target: "[data-tour='research-doi']", position: "bottom", highlight: true },
      { id: "research-results", title: t("tour.researchHub.semantic.title") || "Results", content: t("tour.researchHub.semantic.content") || "Review results and load more.", target: "[data-tour='research-results']", position: "top", highlight: true },
    ],
    [t]
  );

  const { startTour, TourComponent } = useTour(tourSteps, "researchHubTourSeen");

  return (
    <PageShell
      title={t("nav.research")}
      subtitle={t("researchHub.subtitle")}
      icon="🔬"
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => nav("/research-lab")}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground hover:bg-accent"
          >
            <FlaskConical size={16} />
            {t("nav.researchLab")}
          </button>
          <button
            type="button"
            onClick={startTour}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground hover:bg-accent"
          >
            <Target size={16} />
            {t("action.tour")}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <SectionTabs
            active={section}
            onChange={(next) => nav(next === DEFAULT_SECTION ? "/research" : `/research/${next}`)}
          />
          <CompactExpandedToggle
            mode={hub.denseMode ? "compact" : "expanded"}
            onModeChange={(mode) => hub.setDenseMode(mode === "compact")}
          />
        </div>

        {section === "search" && <SearchSection hub={hub} />}
        {section === "doi" && <DoiSection hub={hub} />}
        {section === "integrations" && <IntegrationsSection hub={hub} />}
        {section === "context" && <ContextSection hub={hub} />}
        {section === "results" && <ResultsSection hub={hub} />}

        <TourComponent />
      </div>
    </PageShell>
  );
}
