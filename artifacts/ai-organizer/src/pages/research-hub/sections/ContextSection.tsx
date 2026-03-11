/**
 * ContextSection - Document context + knowledge graph entry points
 */
import { Paperclip, Network } from "lucide-react";
import { SectionShell } from "../components/SectionShell";
import type { ResearchHubVM } from "../types";

interface Props {
  hub: ResearchHubVM;
}

export function ContextSection({ hub }: Props) {
  const { uploads, selectedDocumentId, setSelectedDocumentId, metrics, topLinked, nav } = hub;

  return (
    <div className="space-y-4">
      <SectionShell title="Document context" subtitle="Pick a document to power context-aware tools" icon={<Paperclip size={18} />}>
        <div className="grid gap-3">
          <select
            value={selectedDocumentId ?? ""}
            onChange={(e) => setSelectedDocumentId(e.target.value ? Number(e.target.value) : null)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="">Select a document…</option>
            {uploads.map((u) => (
              <option key={u.documentId} value={u.documentId}>{u.filename} (docId={u.documentId})</option>
            ))}
          </select>
          {metrics ? (
            <div className="text-sm text-muted-foreground">Segments: {metrics.totalSegments} • Links: {metrics.linkMetrics?.totalLinks ?? 0}</div>
          ) : (
            <div className="text-sm text-muted-foreground">No document selected.</div>
          )}
        </div>
      </SectionShell>

      <SectionShell title="Knowledge graph" subtitle="Explore linked concepts and open the graph view" icon={<Network size={18} />}>
        {topLinked.length ? (
          <div className="grid gap-2 text-sm text-muted-foreground">
            {topLinked.slice(0, 6).map((n: any) => (
              <div key={n.id}>{n.label} • links: {n.linkCount}</div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Select a document to view graph insights.</div>
        )}
        {selectedDocumentId ? (
          <div className="mt-3">
            <button type="button" onClick={() => nav(`/documents/${selectedDocumentId}/graph`)} className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">Open graph view</button>
          </div>
        ) : null}
      </SectionShell>
    </div>
  );
}
