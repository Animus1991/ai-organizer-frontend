import React from "react";
import { ResearchCard } from "./ResearchCard";
import type { ResultItem } from "../types";

type DoiResolverCardProps = {
  doi: string;
  onDoiChange: (value: string) => void;
  onNormalize: () => void;
  onResolve: () => void;
  doiValidation: "empty" | "valid" | "invalid";
  crossrefResult: ResultItem | null;
  citationStyle: "APA" | "MLA" | "IEEE" | "Chicago" | "Harvard";
  onCitationStyleChange: (value: "APA" | "MLA" | "IEEE" | "Chicago" | "Harvard") => void;
  bibtexKeyFormat: "author-year-title" | "title-year" | "doi" | "template";
  onBibtexKeyFormatChange: (value: "author-year-title" | "title-year" | "doi" | "template") => void;
  bibtexKeyTemplate: string;
  onBibtexKeyTemplateChange: (value: string) => void;
  onCopyCitation: () => void;
  onExportBibTex: () => void;
  onCopyBibTexEntry: () => void;
  formatCitation: (style: "APA" | "MLA" | "IEEE" | "Chicago" | "Harvard") => string;
  buildBibTexKey: () => string;
  showBibTexPreview: boolean;
  onToggleBibTexPreview: () => void;
  buildBibTexEntry: () => string;
  containerRef?: React.Ref<HTMLDivElement>;
  containerStyle?: React.CSSProperties;
};

export function DoiResolverCard({
  doi,
  onDoiChange,
  onNormalize,
  onResolve,
  doiValidation,
  crossrefResult,
  citationStyle,
  onCitationStyleChange,
  bibtexKeyFormat,
  onBibtexKeyFormatChange,
  bibtexKeyTemplate,
  onBibtexKeyTemplateChange,
  onCopyCitation,
  onExportBibTex,
  onCopyBibTexEntry,
  formatCitation,
  buildBibTexKey,
  showBibTexPreview,
  onToggleBibTexPreview,
  buildBibTexEntry,
  containerRef,
  containerStyle,
}: DoiResolverCardProps) {
  return (
    <ResearchCard
      containerRef={containerRef}
      containerStyle={containerStyle}
      title="DOI Resolver (Crossref)"
      subtitle="Validate DOI and retrieve canonical metadata."
    >
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <input
          value={doi}
          onChange={(e) => onDoiChange(e.target.value)}
          placeholder="10.1145/xxxxxx"
          style={{
            flex: "1 1 220px",
            padding: "10px 12px",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(0,0,0,0.3)",
            color: "#eaeaea",
          }}
        />
        <button
          onClick={onNormalize}
          style={{
            padding: "10px 12px",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(255,255,255,0.06)",
            color: "#e5e7eb",
            cursor: "pointer",
            fontSize: "12px",
          }}
        >
          Normalize DOI
        </button>
        <button
          onClick={onResolve}
          style={{
            padding: "10px 14px",
            borderRadius: "8px",
            border: "1px solid rgba(20,184,166,0.4)",
            background: "rgba(20,184,166,0.15)",
            color: "#5eead4",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Resolve
        </button>
      </div>
      {doiValidation !== "empty" && (
        <div
          style={{
            marginTop: "6px",
            fontSize: "12px",
            color: doiValidation === "valid" ? "#6ee7b7" : "#fde68a",
          }}
        >
          {doiValidation === "valid" ? "Looks like a valid DOI format." : "This DOI format looks invalid."}
        </div>
      )}
      {crossrefResult && (
        <div style={{ marginTop: "10px", fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>
          <div style={{ fontWeight: 600 }}>{crossrefResult.title}</div>
          <div>
            {crossrefResult.publisher} • {crossrefResult.year} • {crossrefResult.doi}
          </div>
        </div>
      )}
      {crossrefResult && (
        <div style={{ marginTop: "10px", fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>
          <div style={{ fontWeight: 600, marginBottom: "6px" }}>Citation formats</div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "6px" }}>
            <select
              value={citationStyle}
              onChange={(e) => onCitationStyleChange(e.target.value as typeof citationStyle)}
              style={{
                padding: "6px 8px",
                borderRadius: "6px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(0,0,0,0.3)",
                color: "#eaeaea",
              }}
            >
              <option value="APA">APA</option>
              <option value="MLA">MLA</option>
              <option value="IEEE">IEEE</option>
              <option value="Chicago">Chicago</option>
              <option value="Harvard">Harvard</option>
            </select>
            <select
              value={bibtexKeyFormat}
              onChange={(e) => onBibtexKeyFormatChange(e.target.value as typeof bibtexKeyFormat)}
              style={{
                padding: "6px 8px",
                borderRadius: "6px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(0,0,0,0.3)",
                color: "#eaeaea",
              }}
            >
              <option value="author-year-title">BibTeX key: author‑year‑title</option>
              <option value="title-year">BibTeX key: title‑year</option>
              <option value="doi">BibTeX key: DOI</option>
              <option value="template">BibTeX key: custom template</option>
            </select>
            {bibtexKeyFormat === "template" && (
              <input
                value={bibtexKeyTemplate}
                onChange={(e) => onBibtexKeyTemplateChange(e.target.value)}
                placeholder="{author}{year}{shorttitle}"
                style={{
                  padding: "6px 8px",
                  borderRadius: "6px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(0,0,0,0.3)",
                  color: "#eaeaea",
                  minWidth: "220px",
                }}
              />
            )}
            <button
              onClick={onCopyCitation}
              style={{
                padding: "6px 10px",
                borderRadius: "6px",
                border: "1px solid rgba(20,184,166,0.4)",
                background: "rgba(20,184,166,0.15)",
                color: "#5eead4",
                cursor: "pointer",
              }}
            >
              Copy
            </button>
            <button
              onClick={onExportBibTex}
              style={{
                padding: "6px 10px",
                borderRadius: "6px",
                border: "1px solid rgba(16,185,129,0.4)",
                background: "rgba(16,185,129,0.15)",
                color: "#6ee7b7",
                cursor: "pointer",
              }}
            >
              Export .bib
            </button>
            <button
              onClick={onCopyBibTexEntry}
              style={{
                padding: "6px 10px",
                borderRadius: "6px",
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.06)",
                color: "#e5e7eb",
                cursor: "pointer",
              }}
            >
              Copy .bib
            </button>
          </div>
          <div>{citationStyle}: {formatCitation(citationStyle)}</div>
          <div style={{ marginTop: "4px", color: "rgba(255,255,255,0.6)", display: "flex", gap: "8px", alignItems: "center" }}>
            <span>
              Live key: <span style={{ color: "#5eead4" }}>{buildBibTexKey()}</span>
            </span>
            <button
              onClick={onToggleBibTexPreview}
              style={{
                padding: "4px 8px",
                borderRadius: "6px",
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.06)",
                color: "#e5e7eb",
                cursor: "pointer",
                fontSize: "11px",
              }}
            >
              {showBibTexPreview ? "Hide preview" : "Show preview"}
            </button>
            <button
              onClick={onCopyBibTexEntry}
              style={{
                padding: "4px 8px",
                borderRadius: "6px",
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.06)",
                color: "#e5e7eb",
                cursor: "pointer",
                fontSize: "11px",
              }}
            >
              Copy preview
            </button>
          </div>
          {showBibTexPreview && buildBibTexEntry() && (
            <pre
              style={{
                marginTop: "8px",
                padding: "8px",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(0,0,0,0.3)",
                color: "#eaeaea",
                fontSize: "11px",
                whiteSpace: "pre-wrap",
              }}
            >
              {buildBibTexEntry()}
            </pre>
          )}
          <div style={{ marginTop: "4px", color: "rgba(255,255,255,0.6)" }}>
            Quick preview uses the DOI metadata. Template supports {"{author}"}, {"{year}"}, {"{shorttitle}"},{" "}
            {"{doi}"}.
          </div>
        </div>
      )}
    </ResearchCard>
  );
}
