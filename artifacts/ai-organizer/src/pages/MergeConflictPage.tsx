/**
 * MergeConflictPage - 3-way merge conflict resolution UI
 */
import { useNavigate } from "react-router-dom";
import { MergeConflictResolver, MergeConflict } from "../components/MergeConflictResolver";
import { PageShell } from "../components/layout/PageShell";
import { useMediaQuery } from "../hooks/useMediaQuery";

const SAMPLE_CONFLICT: MergeConflict = {
  id: 'conflict-demo-1',
  sourceBranch: 'feature/methodology-update',
  targetBranch: 'main',
  documentId: 'doc-1',
  documentTitle: 'Research Methodology Paper',
  createdAt: new Date().toISOString(),
  status: 'open',
  conflicts: [
    { id: 'section-1', field: 'Abstract', baseContent: 'This paper presents a novel approach to research methodology...', oursContent: 'This paper presents a comprehensive and novel approach to research methodology, incorporating modern techniques...', theirsContent: 'This paper presents an innovative approach to research methodology with emphasis on reproducibility...', resolution: 'pending' },
    { id: 'section-2', field: 'Introduction', baseContent: 'The field of research methodology has evolved significantly...', oursContent: 'The field of research methodology has evolved significantly over the past decade, driven by technological advances...', theirsContent: 'The field of research methodology has undergone rapid transformation, particularly in data analysis methods...', resolution: 'pending' },
  ],
};

export default function MergeConflictPage() {
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <PageShell>
      <div className={`max-w-[1600px] mx-auto ${isMobile ? "px-2 py-2" : "px-6 py-6"}`} style={{ height: "calc(100vh - 48px)" }}>
        <MergeConflictResolver
          conflict={SAMPLE_CONFLICT}
          onResolve={(resolved) => { console.log('Conflict resolved:', resolved); navigate('/'); }}
          onAbort={() => { console.log('Merge aborted'); navigate('/'); }}
          onClose={() => navigate("/")}
        />
      </div>
    </PageShell>
  );
}
