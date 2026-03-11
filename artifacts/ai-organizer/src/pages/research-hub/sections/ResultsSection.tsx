/**
 * ResultsSection - Displays three result lists
 */
import { FileText, Brain, FlaskConical } from "lucide-react";
import { SectionShell } from "../components/SectionShell";
import type { ResearchHubVM } from "../types";

interface Props {
  hub: ResearchHubVM;
}

export function ResultsSection({ hub }: Props) {
  const {
    openalexDisplayResults, openalexVisibleCount, openalexLoadRef, openalexIsLoadingMore,
    semanticResults, semanticVisibleCount, semanticLoadRef, semanticIsLoadingMore,
    arxivResults, arxivVisibleCount, arxivLoadRef, arxivIsLoadingMore,
    renderList,
  } = hub;

  return (
    <div className="space-y-4" data-tour="research-results">
      <SectionShell title="OpenAlex Results" subtitle="High-coverage academic works" icon={<FileText size={18} />}>
        {openalexDisplayResults.length ? renderList(openalexDisplayResults, openalexVisibleCount, openalexLoadRef, openalexIsLoadingMore) : <div className="text-sm text-muted-foreground">No results yet.</div>}
      </SectionShell>

      <SectionShell title="Semantic Scholar Results" subtitle="AI-curated citations and authors" icon={<Brain size={18} />}>
        {semanticResults.length ? renderList(semanticResults, semanticVisibleCount, semanticLoadRef, semanticIsLoadingMore) : <div className="text-sm text-muted-foreground">No results yet.</div>}
      </SectionShell>

      <SectionShell title="arXiv Results" subtitle="Preprints for fast-moving fields" icon={<FlaskConical size={18} />}>
        {arxivResults.length ? renderList(arxivResults, arxivVisibleCount, arxivLoadRef, arxivIsLoadingMore) : <div className="text-sm text-muted-foreground">No results yet.</div>}
      </SectionShell>
    </div>
  );
}
