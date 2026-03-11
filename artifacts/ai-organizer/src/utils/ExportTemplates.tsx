/**
 * ExportTemplates - Customizable export formats for citations and references
 * Supports BibTeX, APA, MLA, Chicago, Harvard, and custom templates
 */

import React, { useState, useCallback, createContext, useContext } from "react";

// Citation styles
export type CitationStyle = "bibtex" | "apa" | "mla" | "chicago" | "harvard" | "ieee" | "vancouver" | "custom";

// Reference data structure
export interface ReferenceData {
  id: string;
  type: "article" | "book" | "chapter" | "conference" | "thesis" | "website" | "other";
  title: string;
  authors: Array<{ firstName: string; lastName: string }>;
  year?: number;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  url?: string;
  publisher?: string;
  edition?: string;
  editors?: Array<{ firstName: string; lastName: string }>;
  bookTitle?: string;
  conference?: string;
  institution?: string;
  accessDate?: string;
  abstract?: string;
}

// Export template
export interface ExportTemplate {
  id: string;
  name: string;
  style: CitationStyle;
  format: string;
  description?: string;
}

// Context type
interface ExportContextType {
  templates: ExportTemplate[];
  activeStyle: CitationStyle;
  setActiveStyle: (style: CitationStyle) => void;
  formatReference: (ref: ReferenceData, style?: CitationStyle) => string;
  formatReferences: (refs: ReferenceData[], style?: CitationStyle) => string;
  addTemplate: (template: Omit<ExportTemplate, "id">) => string;
  removeTemplate: (id: string) => void;
  exportToClipboard: (refs: ReferenceData[], style?: CitationStyle) => Promise<void>;
  exportToFile: (refs: ReferenceData[], filename: string, style?: CitationStyle) => void;
}

const ExportContext = createContext<ExportContextType | null>(null);

// Generate unique ID
const generateId = () => `tpl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Format author names based on style
const formatAuthors = (authors: ReferenceData["authors"], style: CitationStyle): string => {
  if (!authors || authors.length === 0) return "";

  switch (style) {
    case "bibtex":
      return authors.map((a) => `${a.lastName}, ${a.firstName}`).join(" and ");
    case "apa":
      if (authors.length === 1) {
        return `${authors[0].lastName}, ${authors[0].firstName[0]}.`;
      } else if (authors.length === 2) {
        return `${authors[0].lastName}, ${authors[0].firstName[0]}., & ${authors[1].lastName}, ${authors[1].firstName[0]}.`;
      } else if (authors.length <= 7) {
        const all = authors.map((a) => `${a.lastName}, ${a.firstName[0]}.`);
        const last = all.pop();
        return `${all.join(", ")}, & ${last}`;
      } else {
        const first6 = authors.slice(0, 6).map((a) => `${a.lastName}, ${a.firstName[0]}.`);
        return `${first6.join(", ")}, ... ${authors[authors.length - 1].lastName}, ${authors[authors.length - 1].firstName[0]}.`;
      }
    case "mla":
      if (authors.length === 1) {
        return `${authors[0].lastName}, ${authors[0].firstName}`;
      } else if (authors.length === 2) {
        return `${authors[0].lastName}, ${authors[0].firstName}, and ${authors[1].firstName} ${authors[1].lastName}`;
      } else {
        return `${authors[0].lastName}, ${authors[0].firstName}, et al.`;
      }
    case "chicago":
      if (authors.length === 1) {
        return `${authors[0].lastName}, ${authors[0].firstName}`;
      } else if (authors.length <= 3) {
        const formatted = authors.map((a, i) =>
          i === 0 ? `${a.lastName}, ${a.firstName}` : `${a.firstName} ${a.lastName}`
        );
        const last = formatted.pop();
        return `${formatted.join(", ")}, and ${last}`;
      } else {
        return `${authors[0].lastName}, ${authors[0].firstName}, et al.`;
      }
    case "harvard":
      if (authors.length === 1) {
        return `${authors[0].lastName}, ${authors[0].firstName[0]}.`;
      } else if (authors.length === 2) {
        return `${authors[0].lastName}, ${authors[0].firstName[0]}. and ${authors[1].lastName}, ${authors[1].firstName[0]}.`;
      } else {
        return `${authors[0].lastName}, ${authors[0].firstName[0]}. et al.`;
      }
    case "ieee":
    case "vancouver":
      return authors.map((a) => `${a.firstName[0]}. ${a.lastName}`).join(", ");
    default:
      return authors.map((a) => `${a.firstName} ${a.lastName}`).join(", ");
  }
};

// Format a single reference
const formatSingleReference = (ref: ReferenceData, style: CitationStyle): string => {
  const authors = formatAuthors(ref.authors, style);
  const year = ref.year || "n.d.";
  const title = ref.title || "Untitled";

  switch (style) {
    case "bibtex":
      const entryType = ref.type === "article" ? "article" : ref.type === "book" ? "book" : ref.type === "chapter" ? "incollection" : ref.type === "conference" ? "inproceedings" : ref.type === "thesis" ? "phdthesis" : "misc";
      const citeKey = `${ref.authors?.[0]?.lastName || "unknown"}${year}`.toLowerCase().replace(/\s/g, "");
      let bibtex = `@${entryType}{${citeKey},\n`;
      bibtex += `  author = {${authors}},\n`;
      bibtex += `  title = {${title}},\n`;
      bibtex += `  year = {${year}},\n`;
      if (ref.journal) bibtex += `  journal = {${ref.journal}},\n`;
      if (ref.volume) bibtex += `  volume = {${ref.volume}},\n`;
      if (ref.issue) bibtex += `  number = {${ref.issue}},\n`;
      if (ref.pages) bibtex += `  pages = {${ref.pages}},\n`;
      if (ref.doi) bibtex += `  doi = {${ref.doi}},\n`;
      if (ref.url) bibtex += `  url = {${ref.url}},\n`;
      if (ref.publisher) bibtex += `  publisher = {${ref.publisher}},\n`;
      bibtex += `}`;
      return bibtex;

    case "apa":
      let apa = `${authors} (${year}). ${title}.`;
      if (ref.journal) {
        apa += ` *${ref.journal}*`;
        if (ref.volume) apa += `, *${ref.volume}*`;
        if (ref.issue) apa += `(${ref.issue})`;
        if (ref.pages) apa += `, ${ref.pages}`;
        apa += ".";
      }
      if (ref.doi) apa += ` https://doi.org/${ref.doi}`;
      else if (ref.url) apa += ` ${ref.url}`;
      return apa;

    case "mla":
      let mla = `${authors}. "${title}."`;
      if (ref.journal) {
        mla += ` *${ref.journal}*`;
        if (ref.volume) mla += `, vol. ${ref.volume}`;
        if (ref.issue) mla += `, no. ${ref.issue}`;
        mla += `, ${year}`;
        if (ref.pages) mla += `, pp. ${ref.pages}`;
        mla += ".";
      } else if (ref.publisher) {
        mla += ` ${ref.publisher}, ${year}.`;
      }
      if (ref.doi) mla += ` doi:${ref.doi}.`;
      return mla;

    case "chicago":
      let chicago = `${authors}. "${title}."`;
      if (ref.journal) {
        chicago += ` *${ref.journal}*`;
        if (ref.volume) chicago += ` ${ref.volume}`;
        if (ref.issue) chicago += `, no. ${ref.issue}`;
        chicago += ` (${year})`;
        if (ref.pages) chicago += `: ${ref.pages}`;
        chicago += ".";
      } else if (ref.publisher) {
        chicago += ` ${ref.publisher}, ${year}.`;
      }
      if (ref.doi) chicago += ` https://doi.org/${ref.doi}.`;
      return chicago;

    case "harvard":
      let harvard = `${authors} (${year}) '${title}'`;
      if (ref.journal) {
        harvard += `, *${ref.journal}*`;
        if (ref.volume) harvard += `, ${ref.volume}`;
        if (ref.issue) harvard += `(${ref.issue})`;
        if (ref.pages) harvard += `, pp. ${ref.pages}`;
      } else if (ref.publisher) {
        harvard += `. ${ref.publisher}`;
      }
      harvard += ".";
      if (ref.doi) harvard += ` doi: ${ref.doi}.`;
      return harvard;

    case "ieee":
      let ieee = `${authors}, "${title},"`;
      if (ref.journal) {
        ieee += ` *${ref.journal}*`;
        if (ref.volume) ieee += `, vol. ${ref.volume}`;
        if (ref.issue) ieee += `, no. ${ref.issue}`;
        if (ref.pages) ieee += `, pp. ${ref.pages}`;
        ieee += `, ${year}`;
      } else if (ref.publisher) {
        ieee += ` ${ref.publisher}, ${year}`;
      }
      ieee += ".";
      return ieee;

    case "vancouver":
      let vancouver = `${authors}. ${title}.`;
      if (ref.journal) {
        vancouver += ` ${ref.journal}. ${year}`;
        if (ref.volume) vancouver += `;${ref.volume}`;
        if (ref.issue) vancouver += `(${ref.issue})`;
        if (ref.pages) vancouver += `:${ref.pages}`;
      }
      vancouver += ".";
      return vancouver;

    default:
      return `${authors}. (${year}). ${title}. ${ref.journal || ref.publisher || ""}`;
  }
};

// Provider props
interface ExportProviderProps {
  children: React.ReactNode;
}

export const ExportProvider: React.FC<ExportProviderProps> = ({ children }) => {
  const [activeStyle, setActiveStyle] = useState<CitationStyle>("apa");
  const [templates, setTemplates] = useState<ExportTemplate[]>([
    { id: "default-bibtex", name: "BibTeX", style: "bibtex", format: "bibtex", description: "LaTeX bibliography format" },
    { id: "default-apa", name: "APA 7th", style: "apa", format: "text", description: "American Psychological Association" },
    { id: "default-mla", name: "MLA 9th", style: "mla", format: "text", description: "Modern Language Association" },
    { id: "default-chicago", name: "Chicago", style: "chicago", format: "text", description: "Chicago Manual of Style" },
    { id: "default-harvard", name: "Harvard", style: "harvard", format: "text", description: "Harvard referencing style" },
    { id: "default-ieee", name: "IEEE", style: "ieee", format: "text", description: "Institute of Electrical and Electronics Engineers" },
    { id: "default-vancouver", name: "Vancouver", style: "vancouver", format: "text", description: "Vancouver/ICMJE style" },
  ]);

  const formatReference = useCallback(
    (ref: ReferenceData, style?: CitationStyle): string => {
      return formatSingleReference(ref, style || activeStyle);
    },
    [activeStyle]
  );

  const formatReferences = useCallback(
    (refs: ReferenceData[], style?: CitationStyle): string => {
      const currentStyle = style || activeStyle;
      const formatted = refs.map((ref) => formatSingleReference(ref, currentStyle));
      return currentStyle === "bibtex" ? formatted.join("\n\n") : formatted.join("\n\n");
    },
    [activeStyle]
  );

  const addTemplate = useCallback((template: Omit<ExportTemplate, "id">): string => {
    const id = generateId();
    setTemplates((prev) => [...prev, { ...template, id }]);
    return id;
  }, []);

  const removeTemplate = useCallback((id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const exportToClipboard = useCallback(
    async (refs: ReferenceData[], style?: CitationStyle): Promise<void> => {
      const formatted = formatReferences(refs, style);
      await navigator.clipboard.writeText(formatted);
    },
    [formatReferences]
  );

  const exportToFile = useCallback(
    (refs: ReferenceData[], filename: string, style?: CitationStyle): void => {
      const formatted = formatReferences(refs, style);
      const currentStyle = style || activeStyle;
      const extension = currentStyle === "bibtex" ? ".bib" : ".txt";
      const blob = new Blob([formatted], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    [formatReferences, activeStyle]
  );

  return (
    <ExportContext.Provider
      value={{
        templates,
        activeStyle,
        setActiveStyle,
        formatReference,
        formatReferences,
        addTemplate,
        removeTemplate,
        exportToClipboard,
        exportToFile,
      }}
    >
      {children}
    </ExportContext.Provider>
  );
};

// Hook to use export
export const useExport = () => {
  const context = useContext(ExportContext);
  if (!context) {
    throw new Error("useExport must be used within ExportProvider");
  }
  return context;
};

// Citation style selector component
interface StyleSelectorProps {
  value?: CitationStyle;
  onChange?: (style: CitationStyle) => void;
  compact?: boolean;
  style?: React.CSSProperties;
}

export const StyleSelector: React.FC<StyleSelectorProps> = ({
  value,
  onChange,
  compact = false,
  style,
}) => {
  const { activeStyle, setActiveStyle, templates } = useExport();
  const currentValue = value ?? activeStyle;

  const handleChange = (newStyle: CitationStyle) => {
    if (onChange) {
      onChange(newStyle);
    } else {
      setActiveStyle(newStyle);
    }
  };

  if (compact) {
    return (
      <select
        value={currentValue}
        onChange={(e) => handleChange(e.target.value as CitationStyle)}
        style={{
          padding: "6px 10px",
          background: "rgba(255, 255, 255, 0.06)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "6px",
          color: "#eaeaea",
          fontSize: "13px",
          cursor: "pointer",
          ...style,
        }}
      >
        {templates.map((t) => (
          <option key={t.id} value={t.style}>
            {t.name}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", ...style }}>
      {templates.map((t) => (
        <button
          key={t.id}
          onClick={() => handleChange(t.style)}
          title={t.description}
          style={{
            padding: "6px 12px",
            background: currentValue === t.style ? "rgba(99, 102, 241, 0.2)" : "rgba(255, 255, 255, 0.05)",
            border: currentValue === t.style ? "1px solid rgba(99, 102, 241, 0.4)" : "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "6px",
            color: currentValue === t.style ? "#a5b4fc" : "#a1a1aa",
            fontSize: "12px",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          {t.name}
        </button>
      ))}
    </div>
  );
};

// Export button component
interface ExportButtonProps {
  references: ReferenceData[];
  style?: CitationStyle;
  filename?: string;
  variant?: "icon" | "button" | "dropdown";
  buttonStyle?: React.CSSProperties;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  references,
  style,
  filename = "references",
  variant = "dropdown",
  buttonStyle,
}) => {
  const { activeStyle, exportToClipboard, exportToFile, templates } = useExport();
  const [showDropdown, setShowDropdown] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const currentStyle = style || activeStyle;

  const handleCopy = async (exportStyle?: CitationStyle) => {
    await exportToClipboard(references, exportStyle || currentStyle);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
    setShowDropdown(false);
  };

  const handleDownload = (exportStyle?: CitationStyle) => {
    exportToFile(references, filename, exportStyle || currentStyle);
    setShowDropdown(false);
  };

  if (variant === "icon") {
    return (
      <button
        onClick={() => handleCopy()}
        title={copyFeedback ? "Copied!" : `Copy as ${currentStyle.toUpperCase()}`}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "6px",
          color: copyFeedback ? "#22c55e" : "#71717a",
          fontSize: "16px",
          ...buttonStyle,
        }}
      >
        {copyFeedback ? "✓" : "📋"}
      </button>
    );
  }

  if (variant === "button") {
    return (
      <button
        onClick={() => handleCopy()}
        style={{
          padding: "8px 14px",
          background: "rgba(99, 102, 241, 0.15)",
          border: "1px solid rgba(99, 102, 241, 0.3)",
          borderRadius: "6px",
          color: "#a5b4fc",
          fontSize: "13px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          ...buttonStyle,
        }}
      >
        {copyFeedback ? "✓ Copied" : `📋 Copy ${currentStyle.toUpperCase()}`}
      </button>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          padding: "8px 14px",
          background: "rgba(99, 102, 241, 0.15)",
          border: "1px solid rgba(99, 102, 241, 0.3)",
          borderRadius: "6px",
          color: "#a5b4fc",
          fontSize: "13px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          ...buttonStyle,
        }}
      >
        📤 Export ({references.length})
        <span style={{ fontSize: "10px" }}>▼</span>
      </button>

      {showDropdown && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 99990 }}
            onClick={() => setShowDropdown(false)}
          />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              right: 0,
              background: "linear-gradient(135deg, #1e1e2e 0%, #181825 100%)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
              zIndex: 99991,
              minWidth: "200px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "8px 12px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                fontSize: "11px",
                color: "#71717a",
                fontWeight: 500,
              }}
            >
              COPY TO CLIPBOARD
            </div>
            {templates.map((t) => (
              <button
                key={`copy-${t.id}`}
                onClick={() => handleCopy(t.style)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "transparent",
                  border: "none",
                  color: "#eaeaea",
                  fontSize: "13px",
                  textAlign: "left",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>{t.name}</span>
                <span style={{ fontSize: "10px", color: "#71717a" }}>📋</span>
              </button>
            ))}
            <div
              style={{
                padding: "8px 12px",
                borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                fontSize: "11px",
                color: "#71717a",
                fontWeight: 500,
              }}
            >
              DOWNLOAD FILE
            </div>
            {templates.map((t) => (
              <button
                key={`download-${t.id}`}
                onClick={() => handleDownload(t.style)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "transparent",
                  border: "none",
                  color: "#eaeaea",
                  fontSize: "13px",
                  textAlign: "left",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>{t.name}</span>
                <span style={{ fontSize: "10px", color: "#71717a" }}>
                  {t.style === "bibtex" ? ".bib" : ".txt"}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// Reference preview component
interface ReferencePreviewProps {
  reference: ReferenceData;
  style?: CitationStyle;
  showAllStyles?: boolean;
}

export const ReferencePreview: React.FC<ReferencePreviewProps> = ({
  reference,
  style,
  showAllStyles = false,
}) => {
  const { activeStyle, formatReference, templates } = useExport();
  const currentStyle = style || activeStyle;

  if (showAllStyles) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {templates.map((t) => (
          <div key={t.id}>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "#71717a",
                marginBottom: "6px",
                textTransform: "uppercase",
              }}
            >
              {t.name}
            </div>
            <div
              style={{
                padding: "12px",
                background: "rgba(255, 255, 255, 0.03)",
                borderRadius: "6px",
                fontSize: "13px",
                color: "#d4d4d4",
                lineHeight: 1.5,
                fontFamily: t.style === "bibtex" ? "monospace" : "inherit",
                whiteSpace: t.style === "bibtex" ? "pre-wrap" : "normal",
              }}
            >
              {formatReference(reference, t.style)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "12px",
        background: "rgba(255, 255, 255, 0.03)",
        borderRadius: "6px",
        fontSize: "13px",
        color: "#d4d4d4",
        lineHeight: 1.5,
        fontFamily: currentStyle === "bibtex" ? "monospace" : "inherit",
        whiteSpace: currentStyle === "bibtex" ? "pre-wrap" : "normal",
      }}
    >
      {formatReference(reference, currentStyle)}
    </div>
  );
};

export default ExportProvider;
