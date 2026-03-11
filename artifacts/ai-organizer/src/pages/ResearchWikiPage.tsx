/**
 * ResearchWikiPage - Wiki/Documentation system for research projects
 */
import { ResearchWiki } from "../components/ResearchWiki";
import { PageShell } from "../components/layout/PageShell";
import { useMediaQuery } from "../hooks/useMediaQuery";

export default function ResearchWikiPage() {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <PageShell>
      <div className={`max-w-[1400px] mx-auto ${isMobile ? "px-3 py-3" : "px-6 py-6"}`} style={{ height: "calc(100vh - 48px)" }}>
        <ResearchWiki />
      </div>
    </PageShell>
  );
}
