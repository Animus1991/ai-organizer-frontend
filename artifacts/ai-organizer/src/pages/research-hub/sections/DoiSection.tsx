/**
 * DoiSection - DOI resolver + citation utilities
 */
import { Link } from "lucide-react";
import { SectionShell } from "../components/SectionShell";
import type { ResearchHubVM } from "../types";

interface Props {
  hub: ResearchHubVM;
}

export function DoiSection({ hub }: Props) {
  const {
    doi, setDoi, doiValidation, runDoiLookup, crossrefResult,
    citationStyle, setCitationStyle,
    bibtexKeyFormat, setBibtexKeyFormat,
    bibtexKeyTemplate, setBibtexKeyTemplate,
    copyCitation, formatCitation, exportBibTex, copyBibTexEntry,
    buildBibTexKey, buildBibTexEntry,
    showBibTexPreview, setShowBibTexPreview,
  } = hub;

  return (
    <SectionShell
      title="DOI Resolver"
      subtitle="Resolve metadata and export citations"
      icon={<Link size={18} />}
      data-tour="research-doi"
      actions={
        <button
          type="button"
          onClick={runDoiLookup}
          className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          disabled={!doi.trim()}
        >
          Resolve
        </button>
      }
    >
      <div className="grid gap-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={doi}
            onChange={(e) => setDoi(e.target.value)}
            placeholder="10.1145/xxxxxx"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {doiValidation !== "empty" ? (
          <div className="text-sm text-muted-foreground">
            {doiValidation === "valid" ? "DOI looks valid" : "DOI looks invalid"}
          </div>
        ) : null}

        {crossrefResult ? (
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <div className="text-sm font-semibold text-foreground">{crossrefResult.title}</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {crossrefResult.publisher} • {crossrefResult.year} • {crossrefResult.doi}
            </div>
          </div>
        ) : null}

        {crossrefResult ? (
          <div className="grid gap-2">
            <div className="flex flex-wrap gap-2 items-center">
              <select value={citationStyle} onChange={(e) => setCitationStyle(e.target.value as typeof citationStyle)} className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground">
                <option value="APA">APA</option>
                <option value="MLA">MLA</option>
                <option value="IEEE">IEEE</option>
                <option value="Chicago">Chicago</option>
                <option value="Harvard">Harvard</option>
              </select>
              <select value={bibtexKeyFormat} onChange={(e) => setBibtexKeyFormat(e.target.value as typeof bibtexKeyFormat)} className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground">
                <option value="author-year-title">author-year-title</option>
                <option value="title-year">title-year</option>
                <option value="doi">doi</option>
                <option value="template">template</option>
              </select>
              {bibtexKeyFormat === "template" ? (
                <input value={bibtexKeyTemplate} onChange={(e) => setBibtexKeyTemplate(e.target.value)} placeholder="{author}{year}{shorttitle}" className="flex-1 min-w-52 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground" />
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={copyCitation} className="rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground hover:bg-accent">Copy citation</button>
              <button type="button" onClick={exportBibTex} className="rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground hover:bg-accent">Export BibTeX</button>
              <button type="button" onClick={copyBibTexEntry} className="rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground hover:bg-accent">Copy BibTeX</button>
              <button type="button" onClick={() => setShowBibTexPreview((p: boolean) => !p)} className="rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground hover:bg-accent">
                {showBibTexPreview ? "Hide preview" : "Show preview"}
              </button>
            </div>

            <div className="text-sm text-muted-foreground">{citationStyle}: {formatCitation(citationStyle)}</div>
            <div className="text-sm text-muted-foreground">Live key: <span className="font-mono text-foreground">{buildBibTexKey()}</span></div>

            {showBibTexPreview && buildBibTexEntry() ? (
              <pre className="whitespace-pre-wrap rounded-lg border border-border bg-muted/20 p-3 text-xs text-foreground">{buildBibTexEntry()}</pre>
            ) : null}
          </div>
        ) : null}
      </div>
    </SectionShell>
  );
}
