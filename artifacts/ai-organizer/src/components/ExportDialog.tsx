// src/components/ExportDialog.tsx
import { useState } from 'react';
import { DocumentExporter, ExportOptions, EXPORT_PRESETS } from '../lib/export';
import type { UploadItemDTO } from '../lib/api';
import { LoadingSpinner } from './ui/Spinner';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  document: UploadItemDTO | null;
  segments: any[];
}

export function ExportDialog({ isOpen, onClose, document, segments }: ExportDialogProps) {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'json',
    template: 'none',
    includeMetadata: true,
    includeSegments: true
  });
  const [isExporting, setIsExporting] = useState(false);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [abstract, setAbstract] = useState('');

  const handleExport = async () => {
    if (!document) return;

    setIsExporting(true);
    try {
      const options: ExportOptions = {
        ...exportOptions,
        title: title || undefined,
        author: author || undefined,
        abstract: abstract || undefined,
      };
      
      if (exportOptions.format === 'pdf') {
        // PDF export will be handled separately
        await DocumentExporter.exportToPDF(document, segments, options);
      } else {
        await DocumentExporter.exportDocument(document, segments, options);
      }
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      alert(`Export failed: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePresetClick = (preset: keyof typeof EXPORT_PRESETS) => {
    const presetData = EXPORT_PRESETS[preset];
    setExportOptions({
      format: presetData.format,
      template: presetData.template || 'none',
      includeMetadata: presetData.includeMetadata,
      includeSegments: presetData.includeSegments
    });
  };

  if (!isOpen || !document) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-surface border border-border rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Export Document</h2>
          <button
            onClick={onClose}
            className="text-secondary hover:text-primary"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* Document Info */}
          <div className="bg-surface-elevated p-3 rounded-lg">
            <h3 className="font-medium mb-2">{document.filename}</h3>
            <div className="text-sm text-secondary space-y-1">
              <div>Status: {document.parseStatus}</div>
              <div>Size: {(document.sizeBytes / 1024).toFixed(1)} KB</div>
              <div>Segments: {segments.length}</div>
            </div>
          </div>

          {/* Export Presets */}
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">Quick Presets</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handlePresetClick('FULL_DOCUMENT')}
                className="px-3 py-2 bg-surface-elevated border border-border rounded-lg hover:bg-surface text-sm transition-colors"
                style={{
                  borderColor: exportOptions.format === 'json' && exportOptions.includeMetadata && exportOptions.includeSegments && (!exportOptions.template || exportOptions.template === 'none') ? 'rgba(99, 102, 241, 0.5)' : undefined,
                }}
                title={EXPORT_PRESETS.FULL_DOCUMENT.description}
              >
                {EXPORT_PRESETS.FULL_DOCUMENT.name}
              </button>
              <button
                onClick={() => handlePresetClick('SEGMENTS_ONLY')}
                className="px-3 py-2 bg-surface-elevated border border-border rounded-lg hover:bg-surface text-sm transition-colors"
                style={{
                  borderColor: exportOptions.format === 'csv' && !exportOptions.includeMetadata && exportOptions.includeSegments ? 'rgba(99, 102, 241, 0.5)' : undefined,
                }}
                title={EXPORT_PRESETS.SEGMENTS_ONLY.description}
              >
                {EXPORT_PRESETS.SEGMENTS_ONLY.name}
              </button>
              <button
                onClick={() => handlePresetClick('METADATA_ONLY')}
                className="px-3 py-2 bg-surface-elevated border border-border rounded-lg hover:bg-surface text-sm transition-colors"
                style={{
                  borderColor: exportOptions.format === 'json' && exportOptions.includeMetadata && !exportOptions.includeSegments ? 'rgba(99, 102, 241, 0.5)' : undefined,
                }}
                title={EXPORT_PRESETS.METADATA_ONLY.description}
              >
                {EXPORT_PRESETS.METADATA_ONLY.name}
              </button>
              <button
                onClick={() => handlePresetClick('READABLE_FORMAT')}
                className="px-3 py-2 bg-surface-elevated border border-border rounded-lg hover:bg-surface text-sm transition-colors"
                style={{
                  borderColor: exportOptions.format === 'md' && exportOptions.includeMetadata && exportOptions.includeSegments && (!exportOptions.template || exportOptions.template === 'none') ? 'rgba(99, 102, 241, 0.5)' : undefined,
                }}
                title={EXPORT_PRESETS.READABLE_FORMAT.description}
              >
                {EXPORT_PRESETS.READABLE_FORMAT.name}
              </button>
              <button
                onClick={() => handlePresetClick('ACADEMIC_PAPER')}
                className="px-3 py-2 bg-surface-elevated border border-border rounded-lg hover:bg-surface text-sm transition-colors"
                style={{
                  borderColor: exportOptions.template === 'academic-paper' ? 'rgba(99, 102, 241, 0.5)' : undefined,
                }}
                title={EXPORT_PRESETS.ACADEMIC_PAPER.description}
              >
                {EXPORT_PRESETS.ACADEMIC_PAPER.name}
              </button>
              <button
                onClick={() => handlePresetClick('REPORT')}
                className="px-3 py-2 bg-surface-elevated border border-border rounded-lg hover:bg-surface text-sm transition-colors"
                style={{
                  borderColor: exportOptions.template === 'report' ? 'rgba(99, 102, 241, 0.5)' : undefined,
                }}
                title={EXPORT_PRESETS.REPORT.description}
              >
                {EXPORT_PRESETS.REPORT.name}
              </button>
              <button
                onClick={() => handlePresetClick('PRESENTATION')}
                className="px-3 py-2 bg-surface-elevated border border-border rounded-lg hover:bg-surface text-sm transition-colors"
                style={{
                  borderColor: exportOptions.template === 'presentation' ? 'rgba(99, 102, 241, 0.5)' : undefined,
                }}
                title={EXPORT_PRESETS.PRESENTATION.description}
              >
                {EXPORT_PRESETS.PRESENTATION.name}
              </button>
            </div>
          </div>

          {/* Export Options */}
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">Export Options</label>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-secondary mb-1">Format</label>
                <select
                  value={exportOptions.format}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    format: e.target.value as ExportOptions['format']
                  }))}
                  className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg"
                  title="Select export format"
                >
                  <option value="json" title="JSON format: Structured data with metadata, suitable for programmatic use">JSON</option>
                  <option value="csv" title="CSV format: Comma-separated values, suitable for spreadsheet applications">CSV</option>
                  <option value="txt" title="Plain Text format: Simple text file without formatting">Plain Text</option>
                  <option value="md" title="Markdown format: Formatted text with headings, lists, and styling">Markdown</option>
                  <option value="pdf" title="PDF format: Portable Document Format, suitable for sharing and printing">PDF</option>
                  <option value="latex" title="LaTeX format: Typesetting system, suitable for academic papers">LaTeX</option>
                  <option value="bibtex" title="BibTeX format: Bibliography format, suitable for citations">BibTeX</option>
                </select>
                <p className="text-xs text-secondary mt-1">
                  {exportOptions.format === 'json' && "JSON: Structured data format, best for programmatic access"}
                  {exportOptions.format === 'csv' && "CSV: Spreadsheet format, best for data analysis"}
                  {exportOptions.format === 'txt' && "Plain Text: Simple text format, best for basic text export"}
                  {exportOptions.format === 'md' && "Markdown: Formatted text with styling, best for documentation"}
                  {exportOptions.format === 'pdf' && "PDF: Portable Document Format, best for sharing and printing"}
                  {exportOptions.format === 'latex' && "LaTeX: Typesetting system, best for academic papers and publications"}
                  {exportOptions.format === 'bibtex' && "BibTeX: Bibliography format, best for citations and references"}
                </p>
              </div>

              {/* Template Selection (for formats that support templates) */}
              {(exportOptions.format === 'md' || exportOptions.format === 'latex') && (
                <div>
                  <label className="block text-sm text-secondary mb-1">Template</label>
                  <select
                    value={exportOptions.template || 'none'}
                    onChange={(e) => setExportOptions(prev => ({
                      ...prev,
                      template: e.target.value as ExportOptions['template']
                    }))}
                    className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg"
                  >
                    <option value="none">None (Default)</option>
                    <option value="academic-paper">Academic Paper</option>
                    <option value="report">Report</option>
                    <option value="presentation">Presentation</option>
                  </select>
                  <p className="text-xs text-secondary mt-1">
                    {exportOptions.template === 'academic-paper' && "Academic Paper: Structured format with abstract, sections, and references"}
                    {exportOptions.template === 'report' && "Report: Professional report format with table of contents"}
                    {exportOptions.template === 'presentation' && "Presentation: Slide-based format suitable for presentations"}
                    {(!exportOptions.template || exportOptions.template === 'none') && "No template: Standard format without special structure"}
                  </p>
                </div>
              )}

              {/* Title, Author, Abstract (for templates) */}
              {(exportOptions.template && exportOptions.template !== 'none') && (
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm text-secondary mb-1">Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={document.filename}
                      className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-secondary mb-1">Author</label>
                    <input
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="Author name"
                      className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg"
                    />
                  </div>
                  {(exportOptions.template === 'academic-paper' || exportOptions.template === 'report' || exportOptions.template === 'presentation') && (
                    <div>
                      <label className="block text-sm text-secondary mb-1">Abstract / Summary</label>
                      <textarea
                        value={abstract}
                        onChange={(e) => setAbstract(e.target.value)}
                        placeholder="Enter abstract or summary..."
                        rows={3}
                        className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg resize-none"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm" title="Include document metadata (filename, size, parse status, creation date)">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeMetadata}
                    onChange={(e) => setExportOptions(prev => ({
                      ...prev,
                      includeMetadata: e.target.checked
                    }))}
                  />
                  Include metadata
                </label>

                <label className="flex items-center gap-2 text-sm" title="Include segment content (titles, text, modes, etc.)">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeSegments}
                    onChange={(e) => setExportOptions(prev => ({
                      ...prev,
                      includeSegments: e.target.checked
                    }))}
                  />
                  Include segments
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-surface-elevated border border-border rounded-lg hover:bg-surface"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
            >
              {isExporting ? (
                <LoadingSpinner text="Exporting..." />
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
