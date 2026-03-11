/**
 * LaTeX Export Service
 * 
 * Provides LaTeX export functionality for documents and segments.
 * Converts document content to LaTeX format with proper academic formatting.
 */

import { DocumentDTO, SegmentDTO } from '../api';

export interface LaTeXExportOptions {
  includeTitle: boolean;
  includeAuthor: boolean;
  includeDate: boolean;
  includeAbstract: boolean;
  documentClass: 'article' | 'report' | 'book';
  citationStyle: 'ieee' | 'apa' | 'mla';
  includeTableOfContents: boolean;
  includeFigures: boolean;
  includeTables: boolean;
}

const defaultOptions: LaTeXExportOptions = {
  includeTitle: true,
  includeAuthor: true,
  includeDate: true,
  includeAbstract: false,
  documentClass: 'article',
  citationStyle: 'ieee',
  includeTableOfContents: false,
  includeFigures: true,
  includeTables: true,
};

/**
 * Escape special LaTeX characters
 */
function escapeLatex(text: string): string {
  return text
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/{/g, '\\{')
    .replace(/}/g, '\\}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
}

/**
 * Convert markdown-style formatting to LaTeX
 */
function markdownToLatex(text: string): string {
  // Bold: **text** or __text__
  text = text.replace(/\*\*(.+?)\*\*/g, '\\textbf{$1}');
  text = text.replace(/__(.+?)__/g, '\\textbf{$1}');
  
  // Italic: *text* or _text_
  text = text.replace(/\*(.+?)\*/g, '\\textit{$1}');
  text = text.replace(/_(.+?)_/g, '\\textit{$1}');
  
  // Inline code: `code`
  text = text.replace(/`(.+?)`/g, '\\texttt{$1}');
  
  // Links: [text](url)
  text = text.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '\\href{$2}{$1}');
  
  return text;
}

/**
 * Generate LaTeX preamble
 */
function generatePreamble(options: LaTeXExportOptions): string {
  const packages = [
    '\\usepackage[utf8]{inputenc}',
    '\\usepackage[T1]{fontenc}',
    '\\usepackage{amsmath}',
    '\\usepackage{amssymb}',
    '\\usepackage{graphicx}',
    '\\usepackage{hyperref}',
    '\\usepackage{booktabs}',
    '\\usepackage{listings}',
    '\\usepackage{xcolor}',
    '\\usepackage{geometry}',
    '\\usepackage{fancyhdr}',
  ];

  if (options.citationStyle === 'ieee') {
    packages.push('\\usepackage[numbers]{natbib}');
  } else {
    packages.push('\\usepackage{natbib}');
  }

  const lines = [
    `\\documentclass[12pt,a4paper]{${options.documentClass}}`,
    ...packages,
    '',
    '\\geometry{margin=1in}',
    '\\pagestyle{fancy}',
    '\\fancyhf{}',
    '\\fancyhead[R]{\\thepage}',
    '',
    '\\lstset{',
    '  basicstyle=\\ttfamily\\small,',
    '  breaklines=true,',
    '  frame=single,',
    '  numbers=left,',
    '}',
    '',
  ];

  return lines.join('\n');
}

/**
 * Generate document header with title, author, date
 */
function generateHeader(
  document: DocumentDTO,
  options: LaTeXExportOptions
): string {
  const lines: string[] = [];

  if (options.includeTitle && document.title) {
    lines.push(`\\title{${escapeLatex(document.title)}}`);
  }

  if (options.includeAuthor) {
    lines.push('\\author{Research Document}');
  }

  if (options.includeDate) {
    lines.push(`\\date{${new Date().toLocaleDateString()}}`);
  }

  lines.push('');
  lines.push('\\begin{document}');
  lines.push('');

  if (options.includeTitle) {
    lines.push('\\maketitle');
    lines.push('');
  }

  if (options.includeTableOfContents) {
    lines.push('\\tableofcontents');
    lines.push('\\newpage');
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Generate LaTeX content from segments
 */
function generateSegmentsContent(
  segments: SegmentDTO[],
  options: LaTeXExportOptions
): string {
  const lines: string[] = [];

  // Group segments by type
  const claims = segments.filter(s => s.segmentType === 'claim');
  const evidence = segments.filter(s => s.segmentType === 'evidence');
  const predictions = segments.filter(s => s.segmentType === 'prediction');
  const definitions = segments.filter(s => s.segmentType === 'definition');
  const others = segments.filter(s => 
    !['claim', 'evidence', 'prediction', 'definition'].includes(s.segmentType || '')
  );

  // Add claims section
  if (claims.length > 0) {
    lines.push('\\section{Claims}');
    lines.push('');
    claims.forEach((segment, index) => {
      lines.push(`\\subsection{Claim ${index + 1}: ${escapeLatex(segment.title || 'Untitled')}}`);
      lines.push('');
      if (segment.content) {
        lines.push(markdownToLatex(escapeLatex(segment.content)));
        lines.push('');
      }
      if (segment.evidenceGrade) {
        lines.push(`\\textit{Evidence Grade: ${segment.evidenceGrade}}`);
        lines.push('');
      }
    });
  }

  // Add evidence section
  if (evidence.length > 0) {
    lines.push('\\section{Evidence}');
    lines.push('');
    evidence.forEach((segment, index) => {
      lines.push(`\\subsection{Evidence ${index + 1}: ${escapeLatex(segment.title || 'Untitled')}}`);
      lines.push('');
      if (segment.content) {
        lines.push(markdownToLatex(escapeLatex(segment.content)));
        lines.push('');
      }
    });
  }

  // Add predictions section
  if (predictions.length > 0) {
    lines.push('\\section{Predictions}');
    lines.push('');
    predictions.forEach((segment, index) => {
      lines.push(`\\subsection{Prediction ${index + 1}: ${escapeLatex(segment.title || 'Untitled')}}`);
      lines.push('');
      if (segment.content) {
        lines.push(markdownToLatex(escapeLatex(segment.content)));
        lines.push('');
      }
    });
  }

  // Add definitions section
  if (definitions.length > 0) {
    lines.push('\\section{Definitions}');
    lines.push('');
    definitions.forEach((segment) => {
      lines.push(`\\begin{definition}[${escapeLatex(segment.title || 'Untitled')}]`);
      lines.push(markdownToLatex(escapeLatex(segment.content || '')));
      lines.push('\\end{definition}');
      lines.push('');
    });
  }

  // Add other segments
  if (others.length > 0) {
    lines.push('\\section{Additional Content}');
    lines.push('');
    others.forEach((segment) => {
      lines.push(`\\subsection{${escapeLatex(segment.title || 'Untitled')}}`);
      lines.push('');
      if (segment.content) {
        lines.push(markdownToLatex(escapeLatex(segment.content)));
        lines.push('');
      }
    });
  }

  return lines.join('\n');
}

/**
 * Generate BibTeX entries from segments
 */
function generateBibTeX(segments: SegmentDTO[]): string {
  const citations = segments.filter(s => 
    s.segmentType === 'evidence' && s.content?.includes('@')
  );

  if (citations.length === 0) {
    return '';
  }

  const lines: string[] = ['', '\\newpage', '\\section{References}', ''];
  lines.push('\\begin{thebibliography}{99}');
  lines.push('');

  citations.forEach((segment, index) => {
    const key = `ref${index + 1}`;
    lines.push(`\\bibitem{${key}} ${escapeLatex(segment.title || 'Reference')}`);
    if (segment.content) {
      lines.push(markdownToLatex(escapeLatex(segment.content)));
    }
    lines.push('');
  });

  lines.push('\\end{thebibliography}');
  return lines.join('\n');
}

/**
 * Export document to LaTeX
 */
export function exportToLaTeX(
  document: DocumentDTO,
  segments: SegmentDTO[],
  options: Partial<LaTeXExportOptions> = {}
): string {
  const mergedOptions = { ...defaultOptions, ...options };

  const parts = [
    generatePreamble(mergedOptions),
    generateHeader(document, mergedOptions),
    generateSegmentsContent(segments, mergedOptions),
    generateBibTeX(segments),
    '',
    '\\end{document}',
  ];

  return parts.join('\n');
}

/**
 * Download LaTeX file
 */
export function downloadLaTeXFile(
  doc: DocumentDTO,
  segments: SegmentDTO[],
  opts: Partial<LaTeXExportOptions> = {}
): void {
  const content = exportToLaTeX(doc, segments, opts);
  const blob = new Blob([content], { type: 'text/x-tex' });
  const url = URL.createObjectURL(blob);
  
  const link = window.document.createElement('a');
  link.href = url;
  link.download = `${doc.title || 'document'}.tex`;
  window.document.body.appendChild(link);
  link.click();
  window.document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Generate LaTeX for a single segment
 */
export function exportSegmentToLaTeX(segment: SegmentDTO): string {
  const lines: string[] = [
    `\\subsection{${escapeLatex(segment.title || 'Untitled')}}`,
    '',
  ];

  if (segment.content) {
    lines.push(markdownToLatex(escapeLatex(segment.content)));
    lines.push('');
  }

  if (segment.segmentType) {
    lines.push(`\\textit{Type: ${segment.segmentType}}`);
    lines.push('');
  }

  if (segment.evidenceGrade) {
    lines.push(`\\textit{Evidence Grade: ${segment.evidenceGrade}}`);
    lines.push('');
  }

  return lines.join('\n');
}

export default {
  exportToLaTeX,
  downloadLaTeX: downloadLaTeXFile,
  exportSegmentToLaTeX,
};
