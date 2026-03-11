// src/lib/export.ts
import type { UploadItemDTO } from './api';

export interface ExportOptions {
  format: 'json' | 'csv' | 'txt' | 'md' | 'pdf' | 'latex' | 'bibtex';
  template?: 'academic-paper' | 'report' | 'presentation' | 'none';
  includeMetadata?: boolean;
  includeSegments?: boolean;
  segmentMode?: 'all' | 'qa' | 'paragraphs';
  title?: string;
  author?: string;
  abstract?: string;
}

export interface DocumentExportData {
  document: UploadItemDTO;
  segments?: any[];
  metadata?: {
    exportDate: string;
    exportFormat: string;
    totalCount: number;
  };
}

export class DocumentExporter {
  static async exportDocument(
    doc: UploadItemDTO,
    segments: any[] = [],
    options: ExportOptions = { format: 'json' }
  ): Promise<void> {
    const exportData: DocumentExportData = {
      document: doc,
      segments: options.includeSegments ? segments : undefined,
      metadata: options.includeMetadata ? {
        exportDate: new Date().toISOString(),
        exportFormat: options.format,
        totalCount: segments.length
      } : undefined
    };

    let content: string;
    let filename: string;
    let mimeType: string;

    switch (options.format) {
      case 'json':
        content = JSON.stringify(exportData, null, 2);
        filename = `${this.sanitizeFileName(doc.filename)}.json`;
        mimeType = 'application/json';
        break;
      case 'csv':
        content = this.convertToCSV(exportData);
        filename = `${this.sanitizeFileName(doc.filename)}.csv`;
        mimeType = 'text/csv';
        break;
      case 'txt':
        content = this.convertToTXT(exportData);
        filename = `${this.sanitizeFileName(doc.filename)}.txt`;
        mimeType = 'text/plain';
        break;
      case 'md':
        content = this.convertToMarkdown(exportData, options);
        filename = `${this.sanitizeFileName(doc.filename)}.md`;
        mimeType = 'text/markdown';
        break;
      case 'pdf':
        throw new Error('PDF export must be handled via exportToPDF method');
      case 'latex':
        content = this.convertToLaTeX(exportData, options);
        filename = `${this.sanitizeFileName(doc.filename)}.tex`;
        mimeType = 'text/x-tex';
        break;
      case 'bibtex':
        content = this.convertToBibTeX(exportData, options);
        filename = `${this.sanitizeFileName(doc.filename)}.bib`;
        mimeType = 'text/x-bibtex';
        break;
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }

    this.downloadFile(content, filename, mimeType);
  }

  static async exportMultipleDocuments(
    documents: UploadItemDTO[],
    segmentsMap: Map<number, any[]>,
    options: ExportOptions = { format: 'json' }
  ): Promise<void> {
    const exportData = documents.map(doc => ({
      document: doc,
      segments: options.includeSegments
        ? (segmentsMap.get(doc.documentId) || []).filter(seg =>
            !options.segmentMode || options.segmentMode === 'all' || seg.mode === options.segmentMode
          )
        : undefined,
      metadata: options.includeMetadata ? {
        exportDate: new Date().toISOString(),
        exportFormat: options.format,
        totalCount: segmentsMap.get(doc.documentId)?.length || 0
      } : undefined
    }));

    let content: string;
    let filename: string;
    let mimeType: string;

    switch (options.format) {
      case 'json':
        content = JSON.stringify({ exportDate: new Date().toISOString(), totalDocuments: documents.length, documents: exportData }, null, 2);
        filename = `documents_export_${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
        break;
      case 'csv':
        content = this.convertMultipleToCSV(exportData);
        filename = `documents_export_${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
        break;
      case 'txt':
        content = this.convertMultipleToTXT(exportData);
        filename = `documents_export_${new Date().toISOString().split('T')[0]}.txt`;
        mimeType = 'text/plain';
        break;
      case 'md':
        content = this.convertMultipleToMarkdown(exportData);
        filename = `documents_export_${new Date().toISOString().split('T')[0]}.md`;
        mimeType = 'text/markdown';
        break;
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }

    this.downloadFile(content, filename, mimeType);
  }

  private static convertToCSV(data: DocumentExportData): string {
    if (!data.segments || data.segments.length === 0) return 'No segments to export';
    const headers = ['ID', 'Title', 'Content', 'Mode', 'Order Index', 'Created At'];
    const rows = data.segments.map(segment => [
      segment.id || '', `"${this.escapeCSVField(segment.title || '')}"`,
      `"${this.escapeCSVField(segment.content || '')}"`, segment.mode || '',
      segment.orderIndex || '', segment.createdAt || ''
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  private static convertMultipleToCSV(data: DocumentExportData[]): string {
    const headers = ['Document ID', 'Filename', 'Status', 'Size (bytes)', 'Upload ID', 'Segment Count'];
    const rows = data.map(item => [
      item.document.documentId || '', `"${this.escapeCSVField(item.document.filename || '')}"`,
      item.document.parseStatus || '', item.document.sizeBytes || '',
      item.document.uploadId || '', item.segments?.length || 0
    ]);
    return [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
  }

  private static convertMultipleToTXT(data: DocumentExportData[]): string {
    let content = `Batch Export - ${data.length} Document(s)\nExport Date: ${new Date().toISOString()}\n${'='.repeat(80)}\n\n`;
    data.forEach((item, index) => {
      content += `Document ${index + 1}: ${item.document.filename}\n${'-'.repeat(80)}\n`;
      content += `ID: ${item.document.documentId}\nStatus: ${item.document.parseStatus}\nSize: ${item.document.sizeBytes} bytes\nSegments: ${item.segments?.length || 0}\n`;
      if (item.segments?.length) {
        content += '\nSegments:\n';
        item.segments.forEach((segment: any, segIndex: number) => {
          content += `  ${segIndex + 1}. ${segment.title || 'Untitled'}\n     Mode: ${segment.mode}\n     Content: ${(segment.content || '').substring(0, 100)}${(segment.content || '').length > 100 ? '...' : ''}\n`;
        });
      }
      content += '\n' + '='.repeat(80) + '\n\n';
    });
    return content;
  }

  private static convertMultipleToMarkdown(data: DocumentExportData[]): string {
    let content = `# Batch Export - ${data.length} Document(s)\n\n**Export Date:** ${new Date().toISOString()}\n\n---\n\n`;
    data.forEach((item, index) => {
      content += `## Document ${index + 1}: ${item.document.filename}\n\n`;
      content += `- **ID:** ${item.document.documentId}\n- **Status:** ${item.document.parseStatus}\n- **Size:** ${item.document.sizeBytes} bytes\n- **Segments:** ${item.segments?.length || 0}\n\n`;
      if (item.segments?.length) {
        content += '### Segments\n\n';
        item.segments.forEach((segment: any, segIndex: number) => {
          content += `#### ${segIndex + 1}. ${segment.title || 'Untitled'}\n\n**Mode:** ${segment.mode}\n\n${segment.content || ''}\n\n---\n\n`;
        });
      }
    });
    return content;
  }

  private static convertToTXT(data: DocumentExportData): string {
    let content = `Document: ${data.document.filename}\nStatus: ${data.document.parseStatus}\nSize: ${data.document.sizeBytes} bytes\n\n`;
    if (data.segments?.length) {
      content += 'Segments:\n' + '='.repeat(50) + '\n\n';
      data.segments.forEach((segment, index) => {
        content += `${index + 1}. ${segment.title}\nMode: ${segment.mode}\nContent:\n${segment.content}\n${'-'.repeat(30)}\n\n`;
      });
    }
    return content;
  }

  private static convertToMarkdown(data: DocumentExportData, options: ExportOptions = {} as ExportOptions): string {
    let content = `# ${options.title || data.document.filename}\n\n`;
    if (options.author) content += `**Author:** ${options.author}\n\n`;
    if (options.abstract) content += `## Abstract\n\n${options.abstract}\n\n`;
    if (data.metadata) {
      content += '## Document Information\n\n';
      content += `- **Status:** ${data.document.parseStatus}\n- **Size:** ${data.document.sizeBytes} bytes\n- **Export Date:** ${data.metadata.exportDate}\n\n`;
    }
    if (data.segments?.length) {
      content += '## Segments\n\n';
      data.segments.forEach((segment, index) => {
        content += `### ${index + 1}. ${segment.title || 'Untitled'}\n\n**Mode:** ${segment.mode || 'N/A'}\n\n`;
        if (segment.segmentType && segment.segmentType !== 'untyped') content += `**Type:** ${segment.segmentType}\n\n`;
        if (segment.evidenceGrade) content += `**Evidence Grade:** ${segment.evidenceGrade}\n\n`;
        content += `${segment.content || ''}\n\n---\n\n`;
      });
    }
    return content;
  }

  private static convertToLaTeX(data: DocumentExportData, options: ExportOptions = {} as ExportOptions): string {
    let content = '\\documentclass[11pt,a4paper]{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage[T1]{fontenc}\n\\usepackage{geometry}\n\\usepackage{hyperref}\n\\geometry{margin=2.5cm}\n\n';
    content += '\\title{' + this.escapeLaTeX(options.title || data.document.filename) + '}\n';
    if (options.author) content += '\\author{' + this.escapeLaTeX(options.author) + '}\n';
    content += '\\date{\\today}\n\n\\begin{document}\n\n\\maketitle\n\n';
    if (options.abstract) content += '\\begin{abstract}\n' + this.escapeLaTeX(options.abstract) + '\n\\end{abstract}\n\n';
    if (data.segments?.length) {
      data.segments.forEach((segment, index) => {
        content += '\\section{' + this.escapeLaTeX(segment.title || `Segment ${index + 1}`) + '}\n\n';
        content += this.escapeLaTeX(segment.content || '') + '\n\n';
      });
    }
    content += '\\end{document}\n';
    return content;
  }

  private static convertToBibTeX(data: DocumentExportData, options: ExportOptions = {} as ExportOptions): string {
    const docKey = this.sanitizeFileName(data.document.filename).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    let content = `@article{${docKey},\n  title = {${this.escapeBibTeX(options.title || data.document.filename)}},\n`;
    if (options.author) content += `  author = {${this.escapeBibTeX(options.author)}},\n`;
    content += `  year = {${new Date().getFullYear()}},\n`;
    if (data.metadata) content += `  note = {Exported from Think!Hub on ${new Date(data.metadata.exportDate).toLocaleDateString()}},\n`;
    content += `  segments = {${data.segments?.length || 0}},\n}\n\n`;
    if (data.segments?.length && options.includeSegments) {
      data.segments.forEach((segment, index) => {
        content += `@misc{${docKey}_seg${index + 1},\n  title = {${this.escapeBibTeX(segment.title || `Segment ${index + 1}`)}},\n  note = {Segment from ${this.escapeBibTeX(data.document.filename)}},\n  mode = {${segment.mode || 'N/A'}},\n}\n\n`;
      });
    }
    return content;
  }

  private static escapeLaTeX(text: string): string {
    return text.replace(/\\/g, '\\textbackslash{}').replace(/{/g, '\\{').replace(/}/g, '\\}')
      .replace(/\$/g, '\\$').replace(/_/g, '\\_').replace(/\^/g, '\\textasciicircum{}')
      .replace(/%/g, '\\%').replace(/&/g, '\\&').replace(/#/g, '\\#');
  }

  private static escapeBibTeX(text: string): string {
    return text.replace(/"/g, '""').replace(/{/g, '\\{').replace(/}/g, '\\}');
  }

  private static escapeCSVField(field: string): string {
    return field.replace(/"/g, '""');
  }

  private static sanitizeFileName(filename: string): string {
    return filename.replace(/[^a-zA-Z0-9.-]/g, '_').replace(/_{2,}/g, '_').toLowerCase();
  }

  static async exportToPDF(
    doc: UploadItemDTO,
    segments: any[] = [],
    options: ExportOptions = { format: 'pdf' }
  ): Promise<void> {
    const htmlContent = this.generatePDFHTML(doc, segments, options);

    const iframe = globalThis.document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none';
    globalThis.document.body.appendChild(iframe);

    return new Promise((resolve, reject) => {
      iframe.onload = () => {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (!iframeDoc) throw new Error('Failed to access iframe document');
          iframeDoc.open();
          iframeDoc.write(htmlContent);
          iframeDoc.close();
          setTimeout(() => {
            iframe.contentWindow?.print();
            setTimeout(() => { globalThis.document.body.removeChild(iframe); resolve(); }, 1000);
          }, 500);
        } catch (error) {
          globalThis.document.body.removeChild(iframe);
          reject(error);
        }
      };
      iframe.src = 'about:blank';
    });
  }

  private static generatePDFHTML(doc: UploadItemDTO, segments: any[], options: ExportOptions): string {
    const title = options.title || doc.filename;
    let content = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${this.escapeHTML(title)}</title>
<style>@media print { @page { margin: 2.5cm; } body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; } h1 { font-size: 18pt; } h2 { font-size: 14pt; } h3 { font-size: 12pt; } p { text-align: justify; margin-bottom: 8pt; } .segment { margin-bottom: 16pt; page-break-inside: avoid; } }</style></head><body>
<h1>${this.escapeHTML(title)}</h1>`;
    if (options.author) content += `<p><strong>Author:</strong> ${this.escapeHTML(options.author)}</p>`;
    if (options.abstract) content += `<h2>Abstract</h2><p>${this.escapeHTML(options.abstract)}</p>`;
    if (options.includeSegments && segments?.length) {
      segments.forEach((segment, index) => {
        content += `<div class="segment"><h3>${index + 1}. ${this.escapeHTML(segment.title || 'Untitled')}</h3>`;
        content += `<p>${this.escapeHTML(segment.content || '')}</p></div>`;
      });
    }
    content += '</body></html>';
    return content;
  }

  private static escapeHTML(text: string): string {
    if (!text) return '';
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  private static downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = globalThis.document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    globalThis.document.body.appendChild(link);
    link.click();
    globalThis.document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const EXPORT_PRESETS = {
  FULL_DOCUMENT: { name: "Full Document", description: "Complete document with metadata and all segments in JSON format", format: 'json' as const, template: 'none' as const, includeMetadata: true, includeSegments: true },
  SEGMENTS_ONLY: { name: "Segments Only", description: "Only segments in CSV format", format: 'csv' as const, template: 'none' as const, includeMetadata: false, includeSegments: true },
  METADATA_ONLY: { name: "Metadata Only", description: "Document metadata in JSON format", format: 'json' as const, template: 'none' as const, includeMetadata: true, includeSegments: false },
  READABLE_FORMAT: { name: "Readable Format", description: "Human-readable Markdown format", format: 'md' as const, template: 'none' as const, includeMetadata: true, includeSegments: true },
  ACADEMIC_PAPER: { name: "Academic Paper", description: "Academic paper template", format: 'md' as const, template: 'academic-paper' as const, includeMetadata: true, includeSegments: true },
  REPORT: { name: "Report", description: "Professional report template", format: 'md' as const, template: 'report' as const, includeMetadata: true, includeSegments: true },
  PRESENTATION: { name: "Presentation", description: "Presentation template", format: 'md' as const, template: 'presentation' as const, includeMetadata: true, includeSegments: true },
} as const;
