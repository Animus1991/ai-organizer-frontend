/**
 * ResearchProjectsBoardPage - Kanban-style project board for research tasks
 */
import { ResearchProjectsBoard } from "../components/ResearchProjectsBoard";
import { PageShell } from "../components/layout/PageShell";
import { useMediaQuery } from "../hooks/useMediaQuery";

export default function ResearchProjectsBoardPage() {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <PageShell>
      <div className={`max-w-[1600px] mx-auto ${isMobile ? "px-3 py-3" : "px-6 py-6"}`} style={{ height: "calc(100vh - 48px)" }}>
        <ResearchProjectsBoard />
      </div>
    </PageShell>
  );
}
