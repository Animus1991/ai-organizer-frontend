/**
 * IntegrationsSection - Zotero + Mendeley
 */
import { BookOpen, Link } from "lucide-react";
import { SectionShell } from "../components/SectionShell";
import type { ResearchHubVM } from "../types";

interface Props {
  hub: ResearchHubVM;
}

export function IntegrationsSection({ hub }: Props) {
  const {
    nav, isAuthed, authLoading, canUseResearchTools,
    zoteroAuthEncrypted, zoteroAutoSyncEnabled,
    zoteroKey, setZoteroKey, zoteroLibraryType, setZoteroLibraryType,
    zoteroLibraryId, setZoteroLibraryId, loadZotero, runZoteroSync,
    canUseLibrary, mendeleyConnected, connectMendeley, loadMendeley,
  } = hub;

  return (
    <div className="space-y-4">
      <SectionShell title="Zotero" subtitle="Connect and sync your Zotero library" icon={<BookOpen size={18} />}>
        {!authLoading && !isAuthed ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Login required</span>
            <button type="button" onClick={() => nav("/login")} className="rounded-md border border-border bg-card px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-accent">Login</button>
          </div>
        ) : null}

        {isAuthed && !canUseResearchTools ? (
          <div className="text-sm text-muted-foreground">Your role does not allow Research Tools.</div>
        ) : null}

        <div className="mt-3 grid gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border border-border bg-muted/30 px-2 py-1">{zoteroAuthEncrypted ? "Credentials stored" : "Credentials not stored"}</span>
            {zoteroAutoSyncEnabled ? <span className="rounded-full border border-border bg-muted/30 px-2 py-1">Auto-sync</span> : null}
          </div>

          <input value={zoteroKey} onChange={(e) => setZoteroKey(e.target.value)} placeholder="Zotero API Key" disabled={!canUseResearchTools} className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground disabled:opacity-50" />

          <div className="flex flex-wrap gap-2">
            <select value={zoteroLibraryType} onChange={(e) => setZoteroLibraryType(e.target.value as "user" | "group")} disabled={!canUseResearchTools} className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground disabled:opacity-50">
              <option value="user">User</option>
              <option value="group">Group</option>
            </select>
            <input value={zoteroLibraryId} onChange={(e) => setZoteroLibraryId(e.target.value)} placeholder="Library ID" disabled={!canUseResearchTools} className="flex-1 min-w-40 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground disabled:opacity-50" />
            <button type="button" onClick={loadZotero} disabled={!canUseResearchTools} className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">Load</button>
            <button type="button" onClick={runZoteroSync} disabled={!canUseResearchTools} className="rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground hover:bg-accent disabled:opacity-50">Sync</button>
          </div>
        </div>
      </SectionShell>

      <SectionShell title="Mendeley" subtitle="OAuth connect + fetch your library" icon={<Link size={18} />}>
        {isAuthed && !canUseResearchTools ? (
          <div className="text-sm text-muted-foreground">Your role does not allow Research Tools.</div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={connectMendeley} disabled={!canUseResearchTools} className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">{mendeleyConnected ? "Reconnect" : "Connect"}</button>
          <button type="button" onClick={loadMendeley} disabled={!canUseResearchTools} className="rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground hover:bg-accent disabled:opacity-50">Fetch library</button>
          {canUseLibrary ? (
            <button type="button" onClick={() => nav("/library")} className="rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground hover:bg-accent">Open Library</button>
          ) : null}
        </div>
      </SectionShell>
    </div>
  );
}
