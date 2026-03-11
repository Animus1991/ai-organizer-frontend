/**
 * ResearchMilestonesPage — Milestone tracking for research projects.
 * Uses PageShell for consistent layout. All styling via Tailwind + design tokens.
 */
import { PageShell } from "../components/layout/PageShell";
import { ResearchMilestones } from "../components/ResearchMilestones";

export default function ResearchMilestonesPage() {
  return (
    <PageShell>
      <div className="max-w-[1400px] mx-auto px-6 py-6 h-[calc(100vh-48px)]">
        <ResearchMilestones />
      </div>
    </PageShell>
  );
}
