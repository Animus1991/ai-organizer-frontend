import type { ResultItem } from "../research/types";
import type { useResearchHubState } from "../research/hooks/useResearchHubState";

// Helper type: the hook return type (avoids exporting a dedicated type from the hook file)
export type ResearchHubVM = ReturnType<typeof useResearchHubState> & {
  openalexResults: ResultItem[];
  semanticResults: ResultItem[];
  arxivResults: ResultItem[];
};
