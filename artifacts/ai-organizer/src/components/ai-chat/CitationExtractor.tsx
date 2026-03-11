/**
 * CitationExtractor - Extract and manage academic citations from AI responses
 * Detects DOIs, arXiv IDs, paper titles, and URLs; structures them into references
 */
import React, { useMemo, useState, useCallback } from 'react';
import { BookOpen, ExternalLink, Copy, CheckCircle, FileText, Link2, X } from 'lucide-react';

// Types
export interface Citation {
  id: string;
  type: 'doi' | 'arxiv' | 'url' | 'paper' | 'isbn';
  raw: string;       // Original matched text
  identifier: string; // Cleaned identifier
  title?: string;     // Extracted or resolved title
  authors?: string;
  year?: string;
  source?: string;    // Journal, conference, etc.
  url: string;        // Resolved URL
  messageId: string;  // Source message
  confidence: number; // 0-1 extraction confidence
}

// Extraction patterns
const DOI_PATTERN = /\b(10\.\d{4,}\/[^\s,;]+)/g;
const ARXIV_PATTERN = /\barxiv[:\s]*(\d{4}\.\d{4,5}(?:v\d+)?)/gi;
const ISBN_PATTERN = /\bISBN[:\s-]*(\d{1,5}[-\s]?\d{1,7}[-\s]?\d{1,7}[-\s]?\d{1,7}[-\s]?[\dXx])\b/gi;
const URL_PATTERN = /https?:\/\/(?:doi\.org|arxiv\.org|scholar\.google|pubmed\.ncbi|semanticscholar|dl\.acm|ieee|springer|nature|science)\S+/gi;
const PAPER_TITLE_PATTERN = /[""]([A-Z][^""]{15,120})[""]\s*(?:\((\d{4})\))?/g;
// Pattern for inline citations like (Author, 2023) or [Author et al., 2023]
const INLINE_CITE_PATTERN = /(?:\(|\[)([A-Z][a-z]+(?:\s+(?:et\s+al\.?|&|and)\s+[A-Z][a-z]+)?),?\s*(\d{4})(?:\)|\])/g;

/**
 * Extract citations from text content
 */
export function extractCitations(content: string, messageId: string): Citation[] {
  const citations: Citation[] = [];
  const seen = new Set<string>();

  // DOIs
  let match;
  while ((match = DOI_PATTERN.exec(content)) !== null) {
    const doi = match[1].replace(/[.,;)}\]]+$/, ''); // Clean trailing punctuation
    if (!seen.has(doi)) {
      seen.add(doi);
      citations.push({
        id: `cite-doi-${doi}`,
        type: 'doi',
        raw: match[0],
        identifier: doi,
        url: `https://doi.org/${doi}`,
        messageId,
        confidence: 0.95,
      });
    }
  }

  // arXiv IDs
  while ((match = ARXIV_PATTERN.exec(content)) !== null) {
    const arxivId = match[1];
    if (!seen.has(arxivId)) {
      seen.add(arxivId);
      citations.push({
        id: `cite-arxiv-${arxivId}`,
        type: 'arxiv',
        raw: match[0],
        identifier: arxivId,
        url: `https://arxiv.org/abs/${arxivId}`,
        messageId,
        confidence: 0.95,
      });
    }
  }

  // ISBNs
  while ((match = ISBN_PATTERN.exec(content)) !== null) {
    const isbn = match[1].replace(/[-\s]/g, '');
    if (!seen.has(isbn)) {
      seen.add(isbn);
      citations.push({
        id: `cite-isbn-${isbn}`,
        type: 'isbn',
        raw: match[0],
        identifier: isbn,
        url: `https://www.google.com/search?q=ISBN+${isbn}`,
        messageId,
        confidence: 0.9,
      });
    }
  }

  // Academic URLs
  while ((match = URL_PATTERN.exec(content)) !== null) {
    const url = match[0].replace(/[.,;)}\]]+$/, '');
    if (!seen.has(url)) {
      seen.add(url);
      let type: Citation['type'] = 'url';
      let identifier = url;
      if (url.includes('doi.org')) type = 'doi';
      else if (url.includes('arxiv.org')) type = 'arxiv';
      
      citations.push({
        id: `cite-url-${citations.length}`,
        type,
        raw: match[0],
        identifier,
        url,
        messageId,
        confidence: 0.8,
      });
    }
  }

  // Paper titles in quotes
  while ((match = PAPER_TITLE_PATTERN.exec(content)) !== null) {
    const title = match[1];
    const year = match[2];
    const key = title.toLowerCase().substring(0, 50);
    if (!seen.has(key)) {
      seen.add(key);
      citations.push({
        id: `cite-paper-${citations.length}`,
        type: 'paper',
        raw: match[0],
        identifier: title,
        title,
        year,
        url: `https://scholar.google.com/scholar?q="${encodeURIComponent(title)}"`,
        messageId,
        confidence: 0.7,
      });
    }
  }

  // Inline citations (Author, Year)
  while ((match = INLINE_CITE_PATTERN.exec(content)) !== null) {
    const authors = match[1];
    const year = match[2];
    const key = `${authors}-${year}`;
    if (!seen.has(key)) {
      seen.add(key);
      citations.push({
        id: `cite-inline-${citations.length}`,
        type: 'paper',
        raw: match[0],
        identifier: `${authors} (${year})`,
        authors,
        year,
        url: `https://scholar.google.com/scholar?q=${encodeURIComponent(authors)}+${year}`,
        messageId,
        confidence: 0.6,
      });
    }
  }

  return citations.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Extract all citations from multiple messages
 */
export function extractAllCitations(messages: Array<{ id: string; content: string }>): Citation[] {
  const allCitations: Citation[] = [];
  const seenIds = new Set<string>();

  messages.forEach(msg => {
    const citations = extractCitations(msg.content, msg.id);
    citations.forEach(c => {
      if (!seenIds.has(c.identifier)) {
        seenIds.add(c.identifier);
        allCitations.push(c);
      }
    });
  });

  return allCitations;
}

/**
 * Format citation as BibTeX
 */
export function citationToBibTeX(citation: Citation): string {
  const key = citation.identifier.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
  
  if (citation.type === 'doi') {
    return `@article{${key},\n  doi = {${citation.identifier}},\n  url = {${citation.url}},\n  ${citation.year ? `year = {${citation.year}},` : ''}\n  ${citation.title ? `title = {${citation.title}},` : ''}\n}`;
  }
  if (citation.type === 'arxiv') {
    return `@article{${key},\n  eprint = {${citation.identifier}},\n  archivePrefix = {arXiv},\n  url = {${citation.url}},\n  ${citation.title ? `title = {${citation.title}},` : ''}\n}`;
  }
  return `@misc{${key},\n  title = {${citation.title || citation.identifier}},\n  ${citation.authors ? `author = {${citation.authors}},` : ''}\n  ${citation.year ? `year = {${citation.year}},` : ''}\n  url = {${citation.url}},\n}`;
}

// UI Components

interface CitationsPanelProps {
  citations: Citation[];
  onClose: () => void;
}

export function CitationsPanel({ citations, onClose }: CitationsPanelProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = useCallback((citation: Citation) => {
    const bibtex = citationToBibTeX(citation);
    navigator.clipboard.writeText(bibtex);
    setCopiedId(citation.id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleCopyAll = useCallback(() => {
    const allBibtex = citations.map(c => citationToBibTeX(c)).join('\n\n');
    navigator.clipboard.writeText(allBibtex);
    setCopiedId('all');
    setTimeout(() => setCopiedId(null), 2000);
  }, [citations]);

  const typeIcons: Record<string, React.ReactNode> = {
    doi: <Link2 size={11} />,
    arxiv: <FileText size={11} />,
    url: <ExternalLink size={11} />,
    paper: <BookOpen size={11} />,
    isbn: <BookOpen size={11} />,
  };

  const typeColors: Record<string, string> = {
    doi: '262 83% 58%',
    arxiv: '0 84% 60%',
    url: '200 80% 50%',
    paper: '142 71% 45%',
    isbn: '38 92% 50%',
  };

  if (citations.length === 0) {
    return (
      <div style={{
        padding: '10px 12px',
        borderTop: '1px solid hsl(var(--border))',
        background: 'hsl(var(--muted) / 0.1)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}>
            📚 No citations detected
          </span>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'hsl(var(--muted-foreground))', padding: '2px',
          }}>
            <X size={12} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      borderTop: '1px solid hsl(var(--border))',
      background: 'hsl(var(--card))',
      maxHeight: '200px',
      overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{
        padding: '6px 12px',
        borderBottom: '1px solid hsl(var(--border) / 0.5)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        background: 'hsl(var(--card))',
      }}>
        <span style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(var(--foreground))' }}>
          📚 Citations ({citations.length})
        </span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={handleCopyAll} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'hsl(var(--primary))', fontSize: '10px', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '2px',
          }}>
            {copiedId === 'all' ? <CheckCircle size={10} /> : <Copy size={10} />}
            BibTeX All
          </button>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'hsl(var(--muted-foreground))', padding: '2px',
          }}>
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Citations list */}
      <div style={{ padding: '4px 8px' }}>
        {citations.map(citation => (
          <div key={citation.id} style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '6px',
            padding: '4px 6px',
            borderRadius: '4px',
            marginBottom: '2px',
          }}>
            <span style={{
              padding: '2px 4px',
              borderRadius: '3px',
              background: `hsl(${typeColors[citation.type]} / 0.12)`,
              color: `hsl(${typeColors[citation.type]})`,
              fontSize: '9px',
              fontWeight: 700,
              textTransform: 'uppercase',
              flexShrink: 0,
              marginTop: '1px',
            }}>
              {typeIcons[citation.type]} {citation.type}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '11px',
                color: 'hsl(var(--foreground))',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {citation.title || citation.identifier}
              </div>
              {citation.authors && (
                <div style={{ fontSize: '9px', color: 'hsl(var(--muted-foreground))' }}>
                  {citation.authors} {citation.year ? `(${citation.year})` : ''}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
              <button
                onClick={() => handleCopy(citation)}
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: copiedId === citation.id ? 'hsl(142 71% 45%)' : 'hsl(var(--muted-foreground))',
                  padding: '2px',
                }}
                title="Copy BibTeX"
              >
                {copiedId === citation.id ? <CheckCircle size={11} /> : <Copy size={11} />}
              </button>
              <a
                href={citation.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'hsl(var(--primary))', padding: '2px' }}
                title="Open"
              >
                <ExternalLink size={11} />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Inline citation badge (shown in messages)
 */
export function CitationBadge({ citation }: { citation: Citation }) {
  const color = {
    doi: '262 83% 58%',
    arxiv: '0 84% 60%',
    url: '200 80% 50%',
    paper: '142 71% 45%',
    isbn: '38 92% 50%',
  }[citation.type];

  return (
    <a
      href={citation.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '2px',
        padding: '1px 5px',
        borderRadius: '3px',
        background: `hsl(${color} / 0.1)`,
        color: `hsl(${color})`,
        fontSize: '10px',
        fontWeight: 600,
        textDecoration: 'none',
        verticalAlign: 'middle',
      }}
      title={citation.title || citation.identifier}
    >
      📎 {citation.type.toUpperCase()}
    </a>
  );
}
