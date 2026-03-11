/**
 * ResearchDiscussionsPage - Discussion forum for research collaboration
 */
import { ResearchDiscussions } from "../components/ResearchDiscussions";
import { PageShell } from "../components/layout/PageShell";
import { useMediaQuery } from "../hooks/useMediaQuery";

export default function ResearchDiscussionsPage() {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <PageShell>
      <div className={`max-w-[1400px] mx-auto ${isMobile ? "px-3 py-3" : "px-6 py-6"}`} style={{ height: "calc(100vh - 48px)" }}>
        <ResearchDiscussions />
      </div>
    </PageShell>
  );
}
