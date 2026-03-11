/**
 * SearchSection - Unified search + filters + OpenAlex exports
 */
import { Search } from "lucide-react";
import { SectionShell } from "../components/SectionShell";
import type { ResearchHubVM } from "../types";

interface Props {
  hub: ResearchHubVM;
}

export function SearchSection({ hub }: Props) {
  const {
    query, setQuery, runSearch, status,
    dedupeOpenalex, setDedupeOpenalex,
    openalexYearFrom, setOpenalexYearFrom,
    openalexYearTo, setOpenalexYearTo,
    openalexVenue, setOpenalexVenue,
    exportOpenAlexWorksCsv, openalexInsights,
  } = hub;

  return (
    <SectionShell
      title="Unified Search"
      subtitle="Search OpenAlex, Semantic Scholar, and arXiv and refine the query"
      icon={<Search size={18} />}
      data-tour="research-search"
      actions={
        <button
          type="button"
          onClick={runSearch}
          className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          disabled={!query.trim()}
        >
          Search
        </button>
      }
    >
      <div className="grid gap-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., retrieval augmented generation"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" checked={dedupeOpenalex} onChange={(e) => setDedupeOpenalex(e.target.checked)} />
          Deduplicate by DOI
        </label>

        {openalexInsights ? (
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border border-border bg-muted/30 px-2 py-1">{openalexInsights.count} results</span>
            <span className="rounded-full border border-border bg-muted/30 px-2 py-1">Years {openalexInsights.yearRange}</span>
            {openalexInsights.topVenue ? (
              <span className="rounded-full border border-border bg-muted/30 px-2 py-1">Top venue: {openalexInsights.topVenue}</span>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <input value={openalexYearFrom} onChange={(e) => setOpenalexYearFrom(e.target.value)} placeholder="Year from" className="w-28 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground" />
          <input value={openalexYearTo} onChange={(e) => setOpenalexYearTo(e.target.value)} placeholder="Year to" className="w-28 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground" />
          <input value={openalexVenue} onChange={(e) => setOpenalexVenue(e.target.value)} placeholder="Venue contains" className="flex-1 min-w-44 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground" />
          <button type="button" onClick={() => exportOpenAlexWorksCsv("full")} className="rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground hover:bg-accent">Export CSV</button>
          <button type="button" onClick={() => exportOpenAlexWorksCsv("doi-only")} className="rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground hover:bg-accent">Export DOI</button>
        </div>

        {status ? <div className="text-sm text-muted-foreground">{status}</div> : null}
      </div>
    </SectionShell>
  );
}
